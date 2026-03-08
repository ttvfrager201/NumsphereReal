import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL =
  Deno.env.get("NEXT_PUBLIC_SITE_URL") ||
  "https://8635323e-47c7-41fe-b02a-927e6f46c4fc.canvases.tempo.build";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error("Twilio credentials not configured in Supabase secrets");
    }

    // Get auth user from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_KEY")!,
    );

    // Parse request body
    const { missed_call_id, user_id } = await req.json();

    if (!missed_call_id || !user_id) {
      throw new Error("missed_call_id and user_id are required");
    }

    // Fetch missed call record
    const { data: missedCall, error: callError } = await supabase
      .from("missed_calls")
      .select("*")
      .eq("id", missed_call_id)
      .eq("user_id", user_id)
      .single();

    if (callError || !missedCall) {
      throw new Error("Missed call not found");
    }

    // Fetch user's call forwarding config
    const { data: config, error: configError } = await supabase
      .from("call_forwarding_configs")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (configError || !config) {
      throw new Error(
        "No call forwarding configuration found. Please set up your configuration first.",
      );
    }

    if (!config.twilio_number) {
      throw new Error(
        "No Twilio number configured. Please complete your call forwarding setup.",
      );
    }

    // Build the SMS message
    let messageBody =
      config.sms_message_template ||
      "Hey! Sorry I missed your call. Here's my booking link: [LINK]";

    if (config.booking_slug) {
      const bookingUrl = `${SITE_URL}/book/${config.booking_slug}`;
      messageBody = messageBody.replace(/\[LINK\]/g, bookingUrl);
      // Also allow [slug] token
      messageBody = messageBody.replace(/\[slug\]/g, config.booking_slug);
    } else {
      // Remove any [LINK] tokens if no booking slug
      messageBody = messageBody.replace(/\[LINK\]/g, "").trim();
      messageBody = messageBody.replace(/\[slug\]/g, "").trim();
    }

    // Clean up phone number for Twilio (ensure E.164 format)
    let toNumber = missedCall.phone_number
      .replace(/\s/g, "")
      .replace(/[()]/g, "")
      .replace(/-/g, "");
    if (!toNumber.startsWith("+")) {
      toNumber = "+1" + toNumber.replace(/\D/g, "");
    }

    const fromNumber = config.twilio_number;

    // Send SMS via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append("From", fromNumber);
    formData.append("To", toNumber);
    formData.append("Body", messageBody);

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error("Twilio error:", twilioResult);
      throw new Error(twilioResult.message || "Failed to send SMS via Twilio");
    }

    // Update the missed call status to 'texted'
    await supabase
      .from("missed_calls")
      .update({
        status: "texted",
        sms_sent_at: new Date().toISOString(),
        auto_texted: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", missed_call_id);

    return new Response(
      JSON.stringify({
        success: true,
        sid: twilioResult.sid,
        to: toNumber,
        message: messageBody,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("send-missed-call-sms error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
