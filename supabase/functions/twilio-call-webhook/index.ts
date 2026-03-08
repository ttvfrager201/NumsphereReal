import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ================================================================
// TWILIO INCOMING CALL WEBHOOK - HANGUP & SMS
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_KEY")!,
    );

    // Twilio POSTs x-www-form-urlencoded
    const formData = await req.formData();
    const callerNumber = formData.get("From") as string;
    const calledNumber = formData.get("To") as string;
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;

    console.log("📞 Incoming call:", {
      callSid,
      from: callerNumber,
      to: calledNumber,
    });

    if (!calledNumber) {
      return twimlResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Number not configured. Goodbye.</Say><Hangup/></Response>`,
      );
    }

    // Look up business config by Twilio number
    const normalizedCalledNumber = calledNumber.replace(/\s/g, "");

    const { data: config } = await supabase
      .from("call_forwarding_configs")
      .select("*")
      .eq("twilio_number", normalizedCalledNumber)
      .eq("is_active", true)
      .maybeSingle();

    if (!config) {
      return twimlResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Number not configured. Goodbye.</Say><Hangup/></Response>`,
      );
    }

    // Log the call
    const { error: logError } = await supabase.from("call_logs").insert({
      user_id: config.user_id,
      twilio_call_sid: callSid,
      caller_number: callerNumber,
      called_number: calledNumber,
      call_status: callStatus || "ringing",
      raw_payload: Object.fromEntries(formData.entries()),
    });

    if (logError) console.error("Failed to log call:", logError);

    // Trigger missed-call SMS
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SERVICE_KEY = Deno.env.get("SERVICE_KEY")!;

      await fetch(`${SUPABASE_URL}/functions/v1/send-missed-call-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({
          missed_call_id: callSid, // use callSid to track
          user_id: config.user_id,
          caller_number: callerNumber,
        }),
      });
    } catch (smsError) {
      console.error("Failed to send SMS:", smsError);
    }

    // End call immediately
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;

    return twimlResponse(twiml);
  } catch (error) {
    console.error("twilio-call-webhook error:", error);
    return twimlResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, an error occurred. Goodbye.</Say><Hangup/></Response>`,
    );
  }
});
