import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// This function handles incoming calls to the Twilio number via TwiML
// Twilio calls this webhook when someone calls the provisioned number
// It returns TwiML to forward the call to the user's real number

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
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // Parse the form data from Twilio
        const formData = await req.formData();
        const callerNumber = formData.get("From") as string;
        const calledNumber = formData.get("To") as string;
        const callStatus = formData.get("CallStatus") as string;

        console.log("Incoming call:", { callerNumber, calledNumber, callStatus });

        if (!calledNumber) {
            return new Response(
                `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, this number is not configured. Goodbye.</Say>
</Response>`,
                {
                    headers: { ...corsHeaders, "Content-Type": "text/xml" },
                    status: 200,
                }
            );
        }

        // Normalize the called number to look up in our DB
        const normalizedCalledNumber = calledNumber.replace(/\s/g, "");

        // Find the user who owns this Twilio number
        const { data: config } = await supabase
            .from("call_forwarding_configs")
            .select("*")
            .eq("twilio_number", normalizedCalledNumber)
            .eq("is_active", true)
            .maybeSingle();

        if (!config) {
            return new Response(
                `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, this number is not configured. Goodbye.</Say>
</Response>`,
                {
                    headers: { ...corsHeaders, "Content-Type": "text/xml" },
                    status: 200,
                }
            );
        }

        // Log the missed call in our database
        if (callerNumber) {
            await supabase.from("missed_calls").insert({
                user_id: config.user_id,
                caller_name: null,
                phone_number: callerNumber,
                called_at: new Date().toISOString(),
                status: "new",
            });
        }

        // Return TwiML to forward the call
        const forwardTo = config.forward_to_number;

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial timeout="20" action="" method="POST">
    <Number>${forwardTo}</Number>
  </Dial>
</Response>`;

        return new Response(twiml, {
            headers: { ...corsHeaders, "Content-Type": "text/xml" },
            status: 200,
        });
    } catch (error) {
        console.error("twilio-call-webhook error:", error);
        return new Response(
            `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Sorry, an error occurred. Please try again later.</Say>
</Response>`,
            {
                headers: { ...corsHeaders, "Content-Type": "text/xml" },
                status: 200,
            }
        );
    }
});
