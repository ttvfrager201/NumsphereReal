import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingEmailRequest {
  booking_id: string;
  type: "confirmation" | "reschedule" | "owner_notification";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const SITE_URL =
      Deno.env.get("NEXT_PUBLIC_SITE_URL") ||
      "https://8635323e-47c7-41fe-b02a-927e6f46c4fc.canvases.tempo.build";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_KEY")!,
    );

    const { booking_id, type } = (await req.json()) as BookingEmailRequest;

    // Fetch the booking with business profile
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*, business_profiles(*)")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    const profile = booking.business_profiles;
    const appointmentDate = new Date(booking.appointment_time);
    const formattedDate = appointmentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = appointmentDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const rescheduleUrl = `${SITE_URL}/reschedule/${booking.reschedule_token}`;

    const emails: Array<{ to: string; subject: string; html: string }> = [];

    if (type === "confirmation" || type === "reschedule") {
      // Email to customer
      if (booking.customer_email) {
        const subjectLine =
          type === "confirmation"
            ? `Booking Confirmed — ${profile?.business_name || "Your Appointment"}`
            : `Booking Rescheduled — ${profile?.business_name || "Your Appointment"}`;

        emails.push({
          to: booking.customer_email,
          subject: subjectLine,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #111111; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); padding: 40px 32px; text-align: center;">
      ${profile?.logo_url ? `<img src="${profile.logo_url}" alt="${profile.business_name}" style="width: 56px; height: 56px; border-radius: 12px; margin-bottom: 20px; object-fit: cover;" />` : ""}
      <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 4px 0; letter-spacing: -0.5px;">
        ${type === "confirmation" ? "Booking Confirmed ✓" : "Booking Rescheduled ✓"}
      </h1>
      <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0 0 28px 0;">
        ${profile?.business_name || "Your appointment is set"}
      </p>
      
      <div style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left;">
        <div style="margin-bottom: 12px;">
          <p style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Date</p>
          <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0;">${formattedDate}</p>
        </div>
        <div style="margin-bottom: 12px;">
          <p style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Time</p>
          <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0;">${formattedTime}</p>
        </div>
        <div>
          <p style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Service</p>
          <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0;">${booking.service_type}</p>
        </div>
      </div>

      ${profile?.address ? `<p style="color: rgba(255,255,255,0.4); font-size: 13px; margin: 0 0 24px 0;">📍 ${profile.address}</p>` : ""}

      <a href="${rescheduleUrl}" style="display: inline-block; background-color: rgba(255,255,255,0.1); color: #ffffff; padding: 12px 28px; border-radius: 100px; text-decoration: none; font-size: 14px; font-weight: 500; border: 1px solid rgba(255,255,255,0.15);">
        Need to reschedule?
      </a>
    </div>
    <p style="color: rgba(255,255,255,0.25); font-size: 11px; text-align: center; margin-top: 20px;">
      Powered by NumSphere
    </p>
  </div>
</body>
</html>
          `,
        });
      }
    }

    if (
      type === "confirmation" ||
      type === "owner_notification" ||
      type === "reschedule"
    ) {
      // Email to business owner
      if (profile?.email) {
        const ownerSubject =
          type === "reschedule"
            ? `Booking Rescheduled — ${booking.customer_name}`
            : `New Booking — ${booking.customer_name}`;

        emails.push({
          to: profile.email,
          subject: ownerSubject,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #111111; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); padding: 40px 32px;">
      <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 4px 0; letter-spacing: -0.5px;">
        ${type === "reschedule" ? "📅 Booking Rescheduled" : "🎉 New Booking!"}
      </h1>
      <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0 0 28px 0;">
        ${booking.customer_name} ${type === "reschedule" ? "has rescheduled their" : "just booked an"} appointment
      </p>
      
      <div style="background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; text-align: left;">
        <div style="margin-bottom: 12px;">
          <p style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Customer</p>
          <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0;">${booking.customer_name}</p>
        </div>
        ${
          booking.customer_phone
            ? `
        <div style="margin-bottom: 12px;">
          <p style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Phone</p>
          <p style="color: #ffffff; font-size: 14px; font-family: monospace; margin: 0;">${booking.customer_phone}</p>
        </div>`
            : ""
        }
        ${
          booking.customer_email
            ? `
        <div style="margin-bottom: 12px;">
          <p style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Email</p>
          <p style="color: #ffffff; font-size: 14px; margin: 0;">${booking.customer_email}</p>
        </div>`
            : ""
        }
        <div style="margin-bottom: 12px;">
          <p style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Date & Time</p>
          <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0;">${formattedDate} at ${formattedTime}</p>
        </div>
        <div>
          <p style="color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Service</p>
          <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0;">${booking.service_type}</p>
        </div>
      </div>
    </div>
    <p style="color: rgba(255,255,255,0.25); font-size: 11px; text-align: center; margin-top: 20px;">
      Powered by NumSphere
    </p>
  </div>
</body>
</html>
          `,
        });
      }
    }

    // Send all emails via Resend
    const results = [];
    for (const email of emails) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "NumSphere <hello@numsphere.online>",
          to: email.to,
          subject: email.subject,
          html: email.html,
        }),
      });

      const result = await res.json();
      results.push({
        to: email.to,
        status: res.ok ? "sent" : "failed",
        result,
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
