import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_KEY") ?? ""
    );

    const { action, ...params } = await req.json();

    // Action: create-connect-account
    if (action === "create-connect-account") {
      const { business_profile_id, user_id, return_url } = params;

      // Check the current profile
      const { data: profile } = await supabaseClient
        .from("business_profiles")
        .select("stripe_account_id, business_name, email")
        .eq("id", business_profile_id)
        .single();

      let accountId = profile?.stripe_account_id;

      if (!accountId) {
        // Create a new Stripe Express account
        const account = await stripe.accounts.create({
          type: "express",
          country: "US",
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_profile: {
            name: profile?.business_name || undefined,
          },
          metadata: {
            business_profile_id,
            user_id,
          },
        });

        accountId = account.id;
      }

      // Save the Stripe account ID to THIS profile
      await supabaseClient
        .from("business_profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", business_profile_id);

      // Create an account link for onboarding (or re-onboarding)
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${return_url}?stripe_refresh=true`,
        return_url: `${return_url}?stripe_success=true&profile_id=${business_profile_id}`,
        type: "account_onboarding",
      });

      return new Response(
        JSON.stringify({ url: accountLink.url, account_id: accountId }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Action: create-payment-intent (for Payment Elements)
    if (action === "create-payment-intent") {
      const {
        business_profile_id,
        service_name,
        price_cents,
        customer_email,
        booking_id,
      } = params;

      // Get the business profile's Stripe account
      const { data: profile } = await supabaseClient
        .from("business_profiles")
        .select("stripe_account_id, business_name")
        .eq("id", business_profile_id)
        .single();

      if (!profile?.stripe_account_id) {
        return new Response(
          JSON.stringify({ error: "Stripe not connected for this business" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      const applicationFee = Math.round(price_cents * 0.05);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: price_cents,
        currency: "usd",
        description: `Booking: ${service_name} at ${profile.business_name}`,
        receipt_email: customer_email || undefined,
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: profile.stripe_account_id,
        },
        metadata: {
          booking_id,
          business_profile_id,
        },
      });

      // Update booking with payment intent ID
      if (booking_id) {
        await supabaseClient
          .from("bookings")
          .update({
            stripe_payment_intent_id: paymentIntent.id,
            payment_status: "pending",
          })
          .eq("id", booking_id);
      }

      return new Response(
        JSON.stringify({
          client_secret: paymentIntent.client_secret,
          id: paymentIntent.id
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Action: create-checkout-session (Legacy/Fallback)
    if (action === "create-checkout-session") {
      const {
        business_profile_id,
        service_name,
        price_cents,
        customer_name,
        customer_email,
        booking_id,
        success_url,
        cancel_url,
      } = params;

      // Get the business profile's Stripe account
      const { data: profile } = await supabaseClient
        .from("business_profiles")
        .select("stripe_account_id, business_name")
        .eq("id", business_profile_id)
        .single();

      if (!profile?.stripe_account_id) {
        return new Response(
          JSON.stringify({ error: "Stripe not connected for this business" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }

      // Calculate application fee (5%)
      const applicationFee = Math.round(price_cents * 0.05);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: service_name,
                description: `Booking at ${profile.business_name}`,
              },
              unit_amount: price_cents,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFee,
          transfer_data: {
            destination: profile.stripe_account_id,
          },
          metadata: {
            booking_id,
            business_profile_id,
          },
        },
        customer_email: customer_email || undefined,
        success_url: success_url,
        cancel_url: cancel_url,
        metadata: {
          booking_id,
          business_profile_id,
        },
      });

      // Store the checkout session ID on the booking
      if (booking_id) {
        await supabaseClient
          .from("bookings")
          .update({
            stripe_checkout_session_id: session.id,
            payment_status: "pending",
          })
          .eq("id", booking_id);
      }

      return new Response(
        JSON.stringify({ url: session.url, session_id: session.id }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Action: verify-payment (check if a checkout session was paid)
    if (action === "verify-payment") {
      const { session_id } = params;

      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (session.payment_status === "paid") {
        // Update the booking
        const bookingId = session.metadata?.booking_id;
        if (bookingId) {
          await supabaseClient
            .from("bookings")
            .update({
              payment_status: "paid",
              stripe_payment_intent_id: session.payment_intent as string,
              payment_amount: (session.amount_total || 0) / 100,
            })
            .eq("id", bookingId);
        }
      }

      return new Response(
        JSON.stringify({
          payment_status: session.payment_status,
          booking_id: session.metadata?.booking_id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Action: create-login-link (Stripe Express dashboard for payouts)
    if (action === "create-login-link") {
      const { stripe_account_id } = params;

      const loginLink = await stripe.accounts.createLoginLink(
        stripe_account_id
      );

      return new Response(
        JSON.stringify({ url: loginLink.url }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Action: get-balance (get the connected account balance)
    if (action === "get-balance") {
      const { stripe_account_id } = params;

      const balance = await stripe.balance.retrieve({
        stripeAccount: stripe_account_id,
      });

      const available = balance.available.reduce(
        (sum, b) => sum + b.amount,
        0
      );
      const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0);

      return new Response(
        JSON.stringify({
          available: available / 100,
          pending: pending / 100,
          currency: balance.available[0]?.currency || "usd",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  } catch (error) {
    console.error("Stripe connect error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
