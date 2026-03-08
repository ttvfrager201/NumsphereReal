import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ================================================================
// TWILIO CALL STATUS CALLBACK
// ================================================================
// This is called by Twilio AFTER the <Dial> in twilio-call-webhook
// completes — i.e., after the forwarded call ends or times out.
//
// Flow:
//   1. Twilio POSTs the dial outcome (completed, no-answer, busy, failed, canceled)
//   2. If the call was missed (no-answer, busy, failed):
//      a. Insert a missed_call record
//      b. If auto_text_enabled → automatically send the booking link SMS
//      c. Return TwiML with a voicemail-like message
//   3. If the call was answered (completed):
//      a. Update call_logs with duration
//      b. Return empty TwiML (call is done)
// ================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function twimlResponse(xml: string): Response {
  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "text/xml" },
    status: 200,
  });
}

const SITE_URL =
  Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://numsphere.online";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_KEY")!,
    );

    // Twilio sends form-encoded data
    const formData = await req.formData();
    const entries = Object.fromEntries(formData.entries());

    // Extract key fields
    const callSid = (formData.get("CallSid") as string) || "";
    const dialCallStatus =
      (formData.get("DialCallStatus") as string) ||
      (formData.get("CallStatus") as string) ||
      "";
    const callerNumber =
      (formData.get("From") as string) ||
      (formData.get("Caller") as string) ||
      "";
    const calledNumber =
      (formData.get("To") as string) ||
      (formData.get("Called") as string) ||
      "";
    const dialCallDuration = parseInt(
      (formData.get("DialCallDuration") as string) || "0",
      10,
    );

    console.log("📊 Call status callback:", {
      callSid,
      dialCallStatus,
      from: callerNumber,
      to: calledNumber,
      duration: dialCallDuration,
    });

    // ── Look up the business by Twilio number ──────────────────
    const normalizedCalledNumber = calledNumber.replace(/\s/g, "");

    const { data: config } = await supabase
      .from("call_forwarding_configs")
      .select("*")
      .eq("twilio_number", normalizedCalledNumber)
      .eq("is_active", true)
      .maybeSingle();

    if (!config) {
      console.warn("No config found for:", normalizedCalledNumber);
      return twimlResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      );
    }

    // ── Update call_logs with final status ─────────────────────
    if (callSid) {
      await supabase
        .from("call_logs")
        .update({
          call_status: dialCallStatus,
          call_duration: dialCallDuration,
          raw_payload: entries,
          updated_at: new Date().toISOString(),
        })
        .eq("twilio_call_sid", callSid)
        .eq("user_id", config.user_id);
    }

    // ── Determine if the call was missed ───────────────────────
    const missedStatuses = ["no-answer", "busy", "failed", "canceled"];
    const isMissed = missedStatuses.includes(dialCallStatus.toLowerCase());

    if (isMissed && callerNumber) {
      console.log(
        "🚫 Call missed! Status:",
        dialCallStatus,
        "From:",
        callerNumber,
      );

      // Check for duplicate (same caller in last 2 minutes)
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: existingCall } = await supabase
        .from("missed_calls")
        .select("id")
        .eq("user_id", config.user_id)
        .eq("phone_number", callerNumber)
        .gte("called_at", twoMinAgo)
        .maybeSingle();

      let missedCallId: string;

      if (existingCall) {
        // Already logged (unlikely with proper flow, but safe)
        missedCallId = existingCall.id;
        console.log("Duplicate call detected, using existing:", missedCallId);
      } else {
        // Insert the missed call record
        const { data: newMissedCall, error: insertError } = await supabase
          .from("missed_calls")
          .insert({
            user_id: config.user_id,
            caller_name: null,
            phone_number: callerNumber,
            called_at: new Date().toISOString(),
            status: "new",
            twilio_call_sid: callSid,
            call_direction: "inbound",
            auto_texted: false,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("Failed to insert missed call:", insertError);
          return twimlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry we missed your call. We'll text you a booking link shortly.</Say>
</Response>`);
        }

        missedCallId = newMissedCall.id;
        console.log("✅ Missed call logged:", missedCallId);
      }

      // ── Auto text-back if enabled ──────────────────────────
      if (config.auto_text_enabled) {
        console.log("📱 Auto text-back enabled, sending SMS...");

        try {
          await sendAutoTextBack(supabase, config, callerNumber, missedCallId);
          console.log("✅ Auto text-back SMS sent successfully");
        } catch (smsError) {
          console.error("❌ Auto text-back failed:", smsError);
          // Don't fail the webhook — the call card still shows in dashboard
        }
      } else {
        console.log(
          "ℹ️ Auto text-back disabled, call card will appear in dashboard for manual action",
        );
      }

      // ── Return TwiML for the caller ────────────────────────
      return twimlResponse(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, no one is available to take your call right now. We'll send you a text with a booking link so you can schedule an appointment at your convenience. Goodbye!</Say>
</Response>`);
    }

    // ── Call was answered — no action needed ───────────────────
    if (dialCallStatus.toLowerCase() === "completed") {
      console.log(
        "✅ Call was answered, duration:",
        dialCallDuration,
        "seconds",
      );
    }

    return twimlResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    );
  } catch (error) {
    console.error("twilio-call-status error:", error);
    return twimlResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    );
  }
});

// ================================================================
// AUTO TEXT-BACK — sends SMS via Twilio REST API
// ================================================================
async function sendAutoTextBack(
  supabase: any,
  config: any,
  callerNumber: string,
  missedCallId: string,
) {
  const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
  const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured in Supabase secrets");
  }

  if (!config.twilio_number) {
    throw new Error("No Twilio number configured for this business");
  }

  // ── Build the SMS message body ─────────────────────────────
  let messageBody =
    config.sms_message_template ||
    "Hey! Sorry I missed your call. Here's my booking link: [LINK]";

  if (config.booking_slug) {
    const bookingUrl = `${SITE_URL}/book/${config.booking_slug}`;
    messageBody = messageBody.replace(/\[LINK\]/g, bookingUrl);
    messageBody = messageBody.replace(/\[slug\]/g, config.booking_slug);
  } else {
    // Remove link tokens if no booking slug is configured
    messageBody = messageBody.replace(/\[LINK\]/g, "").trim();
    messageBody = messageBody.replace(/\[slug\]/g, "").trim();
  }

  // ── Normalize phone number to E.164 ────────────────────────
  let toNumber = callerNumber
    .replace(/\s/g, "")
    .replace(/[()]/g, "")
    .replace(/-/g, "");
  if (!toNumber.startsWith("+")) {
    toNumber = "+1" + toNumber.replace(/\D/g, "");
  }

  const fromNumber = config.twilio_number;

  // ── Send via Twilio REST API ───────────────────────────────
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const body = new URLSearchParams();
  body.append("From", fromNumber);
  body.append("To", toNumber);
  body.append("Body", messageBody);

  const twilioRes = await fetch(twilioUrl, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const twilioResult = await twilioRes.json();

  if (!twilioRes.ok) {
    console.error("Twilio SMS error:", twilioResult);
    throw new Error(twilioResult.message || "Failed to send SMS via Twilio");
  }

  console.log("SMS sent:", { sid: twilioResult.sid, to: toNumber });

  // ── Update missed call status to 'texted' ──────────────────
  await supabase
    .from("missed_calls")
    .update({
      status: "texted",
      auto_texted: true,
      sms_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", missedCallId);

  return twilioResult;
}
