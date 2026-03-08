import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ================================================================
// PROVISION TWILIO NUMBER
// ================================================================
// Buys a local Twilio phone number for the user and saves it
// to their call_forwarding_configs record.
//
// Flow:
//   1. User completes missed-call setup (forward number + SMS message)
//   2. Frontend calls this edge function
//   3. We search Twilio for an available local number (US by default)
//   4. Purchase the number
//   5. Configure the number's voice webhook → twilio-call-webhook
//   6. Save the number + SID to call_forwarding_configs
//   7. Return the purchased number to the frontend
// ================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_KEY")!,
    );

    // Parse request body
    const { user_id, area_code, country } = await req.json();

    if (!user_id) {
      throw new Error("user_id is required");
    }

    // Check if user already has a Twilio number
    const { data: existingConfig } = await supabase
      .from("call_forwarding_configs")
      .select("twilio_number, twilio_number_sid")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingConfig?.twilio_number) {
      // Already has a number — return it
      return new Response(
        JSON.stringify({
          success: true,
          twilio_number: existingConfig.twilio_number,
          twilio_number_sid: existingConfig.twilio_number_sid,
          already_provisioned: true,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        },
      );
    }

    // ── Search for available numbers ────────────────────────────
    const countryCode = country || "US";
    const twilioAuthHeader =
      "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    let searchUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/AvailablePhoneNumbers/${countryCode}/Local.json?SmsEnabled=true&VoiceEnabled=true&Limit=1`;

    if (area_code) {
      searchUrl += `&AreaCode=${area_code}`;
    }

    console.log("🔍 Searching for available numbers:", searchUrl);

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: twilioAuthHeader },
    });

    const searchResult = await searchRes.json();

    if (
      !searchRes.ok ||
      !searchResult.available_phone_numbers ||
      searchResult.available_phone_numbers.length === 0
    ) {
      console.error("No available numbers:", searchResult);
      throw new Error(
        "No phone numbers available in your area. Try a different area code.",
      );
    }

    const availableNumber =
      searchResult.available_phone_numbers[0].phone_number;
    console.log("📱 Found available number:", availableNumber);

    // ── Purchase the number ─────────────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const voiceWebhookUrl = `${supabaseUrl}/functions/v1/supabase-functions-twilio-call-webhook`;
    const statusCallbackUrl = `${supabaseUrl}/functions/v1/supabase-functions-twilio-call-status`;

    const purchaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json`;

    const purchaseBody = new URLSearchParams();
    purchaseBody.append("PhoneNumber", availableNumber);
    purchaseBody.append("VoiceUrl", voiceWebhookUrl);
    purchaseBody.append("VoiceMethod", "POST");
    purchaseBody.append("StatusCallback", statusCallbackUrl);
    purchaseBody.append("StatusCallbackMethod", "POST");
    purchaseBody.append("SmsUrl", ""); // We don't need inbound SMS handling
    purchaseBody.append("FriendlyName", `Numsphere - ${user_id.slice(0, 8)}`);

    console.log("💳 Purchasing number:", availableNumber);

    const purchaseRes = await fetch(purchaseUrl, {
      method: "POST",
      headers: {
        Authorization: twilioAuthHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: purchaseBody.toString(),
    });

    const purchaseResult = await purchaseRes.json();

    if (!purchaseRes.ok) {
      console.error("Purchase failed:", purchaseResult);
      throw new Error(
        purchaseResult.message || "Failed to purchase phone number from Twilio",
      );
    }

    const purchasedNumber = purchaseResult.phone_number;
    const purchasedSid = purchaseResult.sid;

    console.log("✅ Number purchased:", {
      number: purchasedNumber,
      sid: purchasedSid,
    });

    // ── Save to call_forwarding_configs ──────────────────────────
    const { error: updateError } = await supabase
      .from("call_forwarding_configs")
      .update({
        twilio_number: purchasedNumber,
        twilio_number_sid: purchasedSid,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Failed to save number to config:", updateError);
      // The number is purchased but we couldn't save it — still return it
    }

    return new Response(
      JSON.stringify({
        success: true,
        twilio_number: purchasedNumber,
        twilio_number_sid: purchasedSid,
        already_provisioned: false,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error("provision-twilio-number error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 400,
    });
  }
});
