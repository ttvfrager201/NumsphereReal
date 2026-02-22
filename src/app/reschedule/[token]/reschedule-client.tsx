"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { createClient } from "../../../../supabase/client";

interface RescheduleBooking {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service_type: string;
  appointment_time: string;
  status: string;
  reschedule_token: string | null;
  business_profiles: {
    id: string;
    user_id: string | null;
    business_name: string;
    address?: string;
    phone_number?: string;
    email?: string;
    logo_url?: string;
    booking_slug: string;
    theme_color?: string;
    accent_color?: string;
    dark_mode?: boolean;
  } | null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM",
];

export function RescheduleClient({
  booking,
  token,
}: {
  booking: RescheduleBooking;
  token: string;
}) {
  const profile = booking.business_profiles;
  const [step, setStep] = useState<"info" | "select" | "submitting" | "done" | "error">("info");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const supabase = createClient();

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const bg = profile?.theme_color || "#000000";
  const accent = profile?.accent_color || "#ffffff";
  const isDark = profile?.dark_mode ?? true;

  const textPrimary = isDark ? "#ffffff" : "#0a0a0a";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
  const textMuted = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  const getWeekDates = () => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const goNextWeek = () => {
    const next = new Date(currentWeekStart);
    next.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(next);
  };

  const goPrevWeek = () => {
    const prev = new Date(currentWeekStart);
    prev.setDate(currentWeekStart.getDate() - 7);
    if (prev >= today || prev.getTime() + 7 * 86400000 > today.getTime()) {
      setCurrentWeekStart(prev);
    }
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const parseTime = (timeStr: string, date: Date): Date => {
    const [time, period] = timeStr.split(" ");
    const [hoursStr, minutesStr] = time.split(":");
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  };

  const currentApptDate = new Date(booking.appointment_time);
  const formattedCurrentDate = currentApptDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const formattedCurrentTime = currentApptDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;
    setStep("submitting");
    setErrorMessage("");

    try {
      const newTime = parseTime(selectedTime, selectedDate);

      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          appointment_time: newTime.toISOString(),
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("reschedule_token", token);

      if (updateError) throw new Error(updateError.message);

      // Send reschedule emails
      try {
        await supabase.functions.invoke("supabase-functions-send-booking-email", {
          body: { booking_id: booking.id, type: "reschedule" },
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }

      setStep("done");
    } catch (error: any) {
      console.error("Reschedule failed:", error);
      setErrorMessage(error.message || "Something went wrong.");
      setStep("error");
    }
  };

  const monthYear = weekDates[0].toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (booking.status === "cancelled") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: bg }}
      >
        <div className="w-full max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: textMuted }} />
          <h1 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>
            Booking Cancelled
          </h1>
          <p className="text-sm" style={{ color: textMuted }}>
            This booking has been cancelled and cannot be rescheduled.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-500"
      style={{ backgroundColor: bg }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          {profile?.logo_url ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 shadow-2xl"
              style={{ boxShadow: `0 20px 60px ${accent}15` }}
            >
              <img
                src={profile.logo_url}
                alt={profile.business_name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ) : (
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center border"
              style={{ borderColor: `${accent}30`, backgroundColor: `${accent}10` }}
            >
              <Building2 className="w-6 h-6" style={{ color: accent }} />
            </div>
          )}

          <h1 className="text-xl font-bold tracking-tight" style={{ color: textPrimary }}>
            Reschedule Appointment
          </h1>
          <p className="text-sm mt-1" style={{ color: textMuted }}>
            {profile?.business_name}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step: Current booking info */}
          {step === "info" && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-6 border"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <p className="text-xs uppercase tracking-wide mb-4" style={{ color: textMuted }}>
                Current Appointment
              </p>

              <div
                className="rounded-xl p-4 border mb-6"
                style={{ backgroundColor: `${accent}08`, borderColor: `${accent}20` }}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" style={{ color: textMuted }} />
                    <span className="text-sm font-medium" style={{ color: textPrimary }}>
                      {formattedCurrentDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" style={{ color: textMuted }} />
                    <span className="text-sm font-medium" style={{ color: textPrimary }}>
                      {formattedCurrentTime}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep("select")}
                className="w-full h-12 rounded-full font-medium text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                style={{
                  backgroundColor: accent,
                  color: isDark ? bg : "#ffffff",
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Choose New Date & Time
              </button>
            </motion.div>
          )}

          {/* Step: Select new date/time */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-6 border"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <button
                onClick={() => setStep("info")}
                className="flex items-center gap-1 text-xs mb-4"
                style={{ color: textMuted }}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium" style={{ color: textPrimary }}>
                  <Calendar className="w-4 h-4 inline mr-1.5" style={{ color: textSecondary }} />
                  {monthYear}
                </p>
                <div className="flex gap-1">
                  <button onClick={goPrevWeek} className="p-1.5 rounded-lg" style={{ color: textSecondary }}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={goNextWeek} className="p-1.5 rounded-lg" style={{ color: textSecondary }}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5 mb-5">
                {weekDates.map((date, i) => {
                  const isPast = date < today;
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, today);
                  return (
                    <button
                      key={i}
                      disabled={isPast}
                      onClick={() => setSelectedDate(date)}
                      className="flex flex-col items-center rounded-xl py-2 transition-all"
                      style={{
                        backgroundColor: isSelected ? accent : "transparent",
                        opacity: isPast ? 0.3 : 1,
                      }}
                    >
                      <span
                        className="text-[10px] uppercase mb-0.5"
                        style={{ color: isSelected ? (isDark ? bg : "#ffffff") : textMuted }}
                      >
                        {DAYS[date.getDay()]}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: isSelected ? (isDark ? bg : "#ffffff") : textPrimary }}
                      >
                        {date.getDate()}
                      </span>
                      {isToday && !isSelected && (
                        <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: accent }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-xs mb-3 flex items-center gap-1" style={{ color: textMuted }}>
                    <Clock className="w-3.5 h-3.5" />
                    Available times
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
                    {TIME_SLOTS.map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className="rounded-lg py-2 text-xs font-medium border transition-all"
                          style={{
                            backgroundColor: isSelected ? `${accent}20` : "transparent",
                            borderColor: isSelected ? `${accent}40` : cardBorder,
                            color: isSelected ? accent : textSecondary,
                          }}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {selectedDate && selectedTime && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleReschedule}
                  className="w-full h-12 rounded-full mt-5 font-medium text-sm transition-transform active:scale-[0.98]"
                  style={{
                    backgroundColor: accent,
                    color: isDark ? bg : "#ffffff",
                  }}
                >
                  Confirm Reschedule
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Submitting */}
          {step === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-8 border text-center"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" style={{ color: accent }} />
              <p className="text-sm font-medium" style={{ color: textPrimary }}>
                Rescheduling your appointment...
              </p>
            </motion.div>
          )}

          {/* Error */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-8 border text-center"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: "rgba(239,68,68,0.2)" }}
              >
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold mb-1" style={{ color: textPrimary }}>
                Something went wrong
              </h2>
              <p className="text-sm mb-4" style={{ color: textSecondary }}>
                {errorMessage}
              </p>
              <button
                onClick={() => setStep("select")}
                className="h-10 px-6 rounded-full text-sm font-medium"
                style={{ backgroundColor: accent, color: isDark ? bg : "#ffffff" }}
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* Done */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-8 border text-center"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: `${accent}20` }}
              >
                <Check className="w-8 h-8" style={{ color: accent }} />
              </motion.div>

              <h2 className="text-xl font-bold mb-1" style={{ color: textPrimary }}>
                Rescheduled!
              </h2>
              <p className="text-sm mb-2" style={{ color: textSecondary }}>
                {selectedDate?.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at {selectedTime}
              </p>
              {booking.customer_email && (
                <p className="text-xs" style={{ color: textMuted }}>
                  A confirmation email has been sent to {booking.customer_email}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center mt-6 text-[10px]" style={{ color: textMuted }}>
          Powered by NumSphere
        </p>
      </motion.div>
    </div>
  );
}
