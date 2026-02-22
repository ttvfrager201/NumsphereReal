"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Loader2,
  AlertCircle,
  DollarSign,
  CreditCard,
  Scissors,
  Store,
} from "lucide-react";
import { createClient } from "../../../../supabase/client";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/utils/stripe-client";

interface BookingProfile {
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
  stripe_account_id?: string;
  payments_enabled?: boolean;
  available_hours?: any;
  slot_duration?: number;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_paid: boolean;
  is_active: boolean;
  payment_mode?: "online" | "in_store" | "free";
}

interface BookedSlot {
  appointment_time: string;
  service_type: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const DEFAULT_HOURS: Record<string, { enabled: boolean; start: string; end: string }> = {
  monday: { enabled: true, start: "09:00", end: "17:00" },
  tuesday: { enabled: true, start: "09:00", end: "17:00" },
  wednesday: { enabled: true, start: "09:00", end: "17:00" },
  thursday: { enabled: true, start: "09:00", end: "17:00" },
  friday: { enabled: true, start: "09:00", end: "17:00" },
  saturday: { enabled: false, start: "09:00", end: "17:00" },
  sunday: { enabled: false, start: "09:00", end: "17:00" },
};

function generateTimeSlots(startTime: string, endTime: string, durationMinutes: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    slots.push(`${displayH}:${m.toString().padStart(2, "0")} ${period}`);
    currentMinutes += durationMinutes;
  }
  return slots;
}

function parseTimeToDate(timeStr: string, date: Date): Date {
  const [time, period] = timeStr.split(" ");
  const [hoursStr, minutesStr] = time.split(":");
  let hours = parseInt(hoursStr);
  const minutes = parseInt(minutesStr);
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://8635323e-47c7-41fe-b02a-927e6f46c4fc.canvases.tempo.build";

export function BookingPageClient({ profile }: { profile: BookingProfile }) {
  const [step, setStep] = useState<"service" | "select" | "confirm" | "submitting" | "payment" | "done" | "error">("service");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingServices, setLoadingServices] = useState(true);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const supabase = createClient();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const bg = profile.theme_color || "#000000";
  const accent = profile.accent_color || "#ffffff";
  const isDark = profile.dark_mode ?? true;

  const textPrimary = isDark ? "#ffffff" : "#0a0a0a";
  const textSecondary = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)";
  const textMuted = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const cardBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const inputBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";

  const availableHours = profile.available_hours || DEFAULT_HOURS;
  const slotDuration = profile.slot_duration || 30;

  // Load services for this business
  useEffect(() => {
    const loadServices = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("business_profile_id", profile.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!error && data && data.length > 0) {
        setServices(data);
        setStep("service");
      } else {
        setServices([]);
        setStep("select");
      }
      setLoadingServices(false);
    };
    loadServices();
  }, [profile.id]);

  // Load booked slots when date changes
  useEffect(() => {
    const loadBookedSlots = async () => {
      if (!selectedDate) return;

      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from("bookings")
        .select("appointment_time, service_type")
        .eq("business_profile_id", profile.id)
        .gte("appointment_time", startOfDay.toISOString())
        .lte("appointment_time", endOfDay.toISOString())
        .neq("status", "cancelled");

      setBookedSlots(data || []);
    };
    loadBookedSlots();
  }, [selectedDate, profile.id]);

  const getTimeSlotsForDate = (date: Date): string[] => {
    const dayKey = DAY_KEYS[date.getDay()];
    const dayHours = availableHours[dayKey];
    if (!dayHours || !dayHours.enabled) return [];
    const duration = selectedService?.duration_minutes || slotDuration;
    return generateTimeSlots(dayHours.start, dayHours.end, duration);
  };

  const isSlotBooked = (timeStr: string, date: Date): boolean => {
    const slotTime = parseTimeToDate(timeStr, date);
    const duration = selectedService?.duration_minutes || slotDuration;
    const slotEnd = new Date(slotTime.getTime() + duration * 60000);

    return bookedSlots.some((booked) => {
      const bookedTime = new Date(booked.appointment_time);
      const bookedEnd = new Date(bookedTime.getTime() + duration * 60000);
      return slotTime < bookedEnd && slotEnd > bookedTime;
    });
  };

  const isSlotPast = (timeStr: string, date: Date): boolean => {
    const slotTime = parseTimeToDate(timeStr, date);
    return slotTime < new Date();
  };

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

  const isDayAvailable = (date: Date): boolean => {
    const dayKey = DAY_KEYS[date.getDay()];
    const dayHours = availableHours[dayKey];
    return dayHours?.enabled ?? false;
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !name || !phone) return;
    setStep("submitting");
    setErrorMessage("");

    try {
      const appointmentTime = parseTimeToDate(selectedTime, selectedDate);

      // Determine if online payment is required
      const isOnlinePaid = selectedService?.is_paid &&
        selectedService?.payment_mode === "online" &&
        profile.payments_enabled &&
        profile.stripe_account_id;

      const isInStorePaid = selectedService?.is_paid &&
        selectedService?.payment_mode === "in_store";

      const paymentAmount = selectedService?.price || 0;

      const { data: booking, error: insertError } = await supabase
        .from("bookings")
        .insert({
          user_id: profile.user_id,
          customer_name: name,
          customer_email: customerEmail || null,
          customer_phone: phone,
          service_type: selectedService?.name || "Appointment",
          appointment_time: appointmentTime.toISOString(),
          status: "confirmed",
          payment_status: isOnlinePaid ? "pending" : (isInStorePaid ? "pay_in_store" : "not_required"),
          payment_amount: (isOnlinePaid || isInStorePaid) ? paymentAmount : 0,
          business_profile_id: profile.id,
          service_id: selectedService?.id || null,
        })
        .select()
        .single();

      if (insertError) throw new Error(insertError.message);
      setCurrentBookingId(booking.id);

      // If online paid service, create Stripe Payment Intent
      if (isOnlinePaid && paymentAmount > 0) {
        const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
          "supabase-functions-stripe-connect",
          {
            body: {
              action: "create-payment-intent",
              business_profile_id: profile.id,
              service_name: selectedService?.name || "Appointment",
              price_cents: Math.round(paymentAmount * 100),
              customer_email: customerEmail || undefined,
              booking_id: booking.id,
            },
          }
        );

        if (paymentError || !paymentData?.client_secret) {
          throw new Error("Failed to create payment intent");
        }

        setPaymentClientSecret(paymentData.client_secret);
        setStep("payment");
        return;
      }

      // Send confirmation emails
      try {
        await supabase.functions.invoke("supabase-functions-send-booking-email", {
          body: { booking_id: booking.id, type: "confirmation" },
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }

      setStep("done");
    } catch (error: any) {
      console.error("Booking failed:", error);
      setErrorMessage(error.message || "Something went wrong. Please try again.");
      setStep("error");
    }
  };

  // Handle payment success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentSuccess = params.get("payment_success");
    const bookingId = params.get("booking_id");
    const sessionId = params.get("session_id");
    const paymentIntent = params.get("payment_intent");

    if ((paymentSuccess === "true" || paymentIntent) && bookingId) {
      setStep("submitting");
      const verifyPayment = async () => {
        try {
          if (sessionId) {
            await supabase.functions.invoke("supabase-functions-stripe-connect", {
              body: { action: "verify-payment", session_id: sessionId },
            });
          } else if (paymentIntent) {
            // Update the booking status directly if we have a successful PI
            await supabase
              .from("bookings")
              .update({ payment_status: "paid" })
              .eq("id", bookingId);
          }
          setStep("done");
          window.history.replaceState({}, "", `/book/${profile.booking_slug}`);
        } catch {
          setStep("done");
        }
      };
      verifyPayment();
    }

    const paymentCancelled = params.get("payment_cancelled");
    if (paymentCancelled === "true" && bookingId) {
      const cancelBooking = async () => {
        await supabase
          .from("bookings")
          .update({ status: "cancelled", payment_status: "not_required" })
          .eq("id", bookingId);
        setErrorMessage("Payment was cancelled. Please try again.");
        setStep("error");
        window.history.replaceState({}, "", `/book/${profile.booking_slug}`);
      };
      cancelBooking();
    }
  }, []);

  const monthYear = weekDates[0].toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (loadingServices) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent }} />
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
          {profile.logo_url ? (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-2xl"
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
              className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center border"
              style={{
                borderColor: `${accent}30`,
                backgroundColor: `${accent}10`,
              }}
            >
              <Building2 className="w-8 h-8" style={{ color: accent }} />
            </div>
          )}

          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: textPrimary }}
          >
            {profile.business_name}
          </h1>

          {profile.address && (
            <p className="text-sm mt-1 flex items-center justify-center gap-1" style={{ color: textMuted }}>
              <MapPin className="w-3.5 h-3.5" />
              {profile.address}
            </p>
          )}

          <div className="flex items-center justify-center gap-4 mt-2">
            {profile.phone_number && (
              <span className="text-xs font-mono flex items-center gap-1" style={{ color: textMuted }}>
                <Phone className="w-3 h-3" />
                {profile.phone_number}
              </span>
            )}
            {profile.email && (
              <span className="text-xs flex items-center gap-1" style={{ color: textMuted }}>
                <Mail className="w-3 h-3" />
                {profile.email}
              </span>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Service Selection */}
          {step === "service" && services.length > 0 && (
            <motion.div
              key="service"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-6 border"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: textPrimary }}>
                <Scissors className="w-4 h-4 inline mr-1.5" style={{ color: textSecondary }} />
                Select a Service
              </p>
              <p className="text-xs mb-4" style={{ color: textMuted }}>
                Choose the service you&apos;d like to book
              </p>

              <div className="space-y-2">
                {services.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className="w-full rounded-xl p-4 text-left border transition-all"
                      style={{
                        backgroundColor: isSelected ? `${accent}15` : "transparent",
                        borderColor: isSelected ? `${accent}40` : cardBorder,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: textPrimary }}>
                            {service.name}
                          </p>
                          {service.description && (
                            <p className="text-xs mt-0.5" style={{ color: textMuted }}>
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs flex items-center gap-1" style={{ color: textSecondary }}>
                              <Clock className="w-3 h-3" />
                              {service.duration_minutes} min
                            </span>
                            {service.is_paid && service.price > 0 ? (
                              <span className="text-xs flex items-center gap-1 font-medium" style={{ color: accent }}>
                                <DollarSign className="w-3 h-3" />
                                ${Number(service.price).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: textMuted }}>
                                Free
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: accent }}
                          >
                            <Check className="w-3.5 h-3.5" style={{ color: isDark ? bg : "#ffffff" }} />
                          </motion.div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedService && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setStep("select")}
                  className="w-full h-12 rounded-full mt-5 font-medium text-sm transition-transform active:scale-[0.98]"
                  style={{
                    backgroundColor: accent,
                    color: isDark ? bg : "#ffffff",
                  }}
                >
                  Continue
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Step 1: Date/Time Selection */}
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
              {services.length > 0 && (
                <button
                  onClick={() => { setStep("service"); setSelectedDate(null); setSelectedTime(null); }}
                  className="flex items-center gap-1 text-xs mb-4"
                  style={{ color: textMuted }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Change service
                </button>
              )}

              {selectedService && (
                <div
                  className="rounded-lg p-3 border mb-4"
                  style={{ backgroundColor: `${accent}08`, borderColor: `${accent}20` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: textPrimary }}>
                      {selectedService.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: textSecondary }}>
                        {selectedService.duration_minutes} min
                      </span>
                      {selectedService.is_paid && selectedService.price > 0 && (
                        <span
                          className="text-xs font-mono px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${accent}20`, color: accent }}
                        >
                          ${Number(selectedService.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium" style={{ color: textPrimary }}>
                  <Calendar className="w-4 h-4 inline mr-1.5" style={{ color: textSecondary }} />
                  {monthYear}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={goPrevWeek}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: textSecondary }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goNextWeek}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: textSecondary }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Picker */}
              <div className="grid grid-cols-7 gap-1.5 mb-5">
                {weekDates.map((date, i) => {
                  const isPast = date < today;
                  const isAvailable = isDayAvailable(date);
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, today);
                  const isDisabled = isPast || !isAvailable;

                  return (
                    <button
                      key={i}
                      disabled={isDisabled}
                      onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                      className="flex flex-col items-center rounded-xl py-2 transition-all"
                      style={{
                        backgroundColor: isSelected ? accent : "transparent",
                        opacity: isDisabled ? 0.25 : 1,
                      }}
                    >
                      <span
                        className="text-[10px] uppercase mb-0.5"
                        style={{
                          color: isSelected
                            ? isDark ? bg : "#ffffff"
                            : textMuted,
                        }}
                      >
                        {DAYS[date.getDay()]}
                      </span>
                      <span
                        className="text-sm font-bold"
                        style={{
                          color: isSelected
                            ? isDark ? bg : "#ffffff"
                            : textPrimary,
                        }}
                      >
                        {date.getDate()}
                      </span>
                      {isToday && !isSelected && (
                        <div
                          className="w-1 h-1 rounded-full mt-0.5"
                          style={{ backgroundColor: accent }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Time Slots */}
              {selectedDate && (() => {
                const timeSlots = getTimeSlotsForDate(selectedDate);
                const availableSlots = timeSlots.filter(
                  (t) => !isSlotBooked(t, selectedDate) && !isSlotPast(t, selectedDate)
                );

                if (timeSlots.length === 0) {
                  return (
                    <div className="text-center py-4">
                      <p className="text-xs" style={{ color: textMuted }}>
                        No available hours on this day
                      </p>
                    </div>
                  );
                }

                return (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-xs mb-3 flex items-center gap-1" style={{ color: textMuted }}>
                      <Clock className="w-3.5 h-3.5" />
                      Available times for{" "}
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      <span className="ml-auto text-[10px]" style={{ color: textMuted }}>
                        {availableSlots.length} of {timeSlots.length} open
                      </span>
                    </p>
                    <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto pr-1">
                      {timeSlots.map((time) => {
                        const isBooked = isSlotBooked(time, selectedDate);
                        const isPastSlot = isSlotPast(time, selectedDate);
                        const isUnavailable = isBooked || isPastSlot;
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            disabled={isUnavailable}
                            onClick={() => setSelectedTime(time)}
                            className="rounded-lg py-2 text-xs font-medium border transition-all relative"
                            style={{
                              backgroundColor: isSelected
                                ? `${accent}20`
                                : "transparent",
                              borderColor: isSelected ? `${accent}40` : cardBorder,
                              color: isUnavailable
                                ? textMuted
                                : isSelected
                                  ? accent
                                  : textSecondary,
                              opacity: isUnavailable ? 0.35 : 1,
                              textDecoration: isBooked ? "line-through" : "none",
                            }}
                          >
                            {time}
                            {isBooked && (
                              <span className="block text-[8px] mt-0.5" style={{ color: textMuted }}>
                                Booked
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })()}

              {selectedDate && selectedTime && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setStep("confirm")}
                  className="w-full h-12 rounded-full mt-5 font-medium text-sm transition-transform active:scale-[0.98]"
                  style={{
                    backgroundColor: accent,
                    color: isDark ? bg : "#ffffff",
                  }}
                >
                  Continue
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Step 2: Customer Details */}
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-6 border"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <button
                onClick={() => setStep("select")}
                className="flex items-center gap-1 text-xs mb-4"
                style={{ color: textMuted }}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>

              <p className="text-sm font-medium mb-1" style={{ color: textPrimary }}>
                Confirm Your Booking
              </p>
              <p className="text-xs mb-2" style={{ color: textMuted }}>
                {selectedDate?.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at {selectedTime}
              </p>

              {/* Service summary with price */}
              {selectedService && (
                <div
                  className="rounded-lg p-3 border mb-4"
                  style={{ backgroundColor: `${accent}08`, borderColor: `${accent}20` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium" style={{ color: textPrimary }}>
                        {selectedService.name}
                      </span>
                      <span className="text-xs block" style={{ color: textMuted }}>
                        {selectedService.duration_minutes} min
                      </span>
                    </div>
                    {selectedService.is_paid && selectedService.price > 0 ? (
                      <div className="text-right">
                        <span className="text-lg font-bold" style={{ color: accent }}>
                          ${Number(selectedService.price).toFixed(2)}
                        </span>
                        <span className="text-[10px] block flex items-center gap-1 justify-end" style={{ color: textMuted }}>
                          <CreditCard className="w-3 h-3" /> Payment required
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium" style={{ color: textSecondary }}>
                        Free
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: textSecondary }}>
                    <User className="w-3 h-3 inline mr-1" /> Your Name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: inputBg,
                      borderColor: cardBorder,
                      color: textPrimary,
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: textSecondary }}>
                    <Phone className="w-3 h-3 inline mr-1" /> Phone
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
                    style={{
                      backgroundColor: inputBg,
                      borderColor: cardBorder,
                      color: textPrimary,
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: textSecondary }}>
                    <Mail className="w-3 h-3 inline mr-1" /> Email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full rounded-lg px-3 py-2.5 text-sm border outline-none"
                    style={{
                      backgroundColor: inputBg,
                      borderColor: cardBorder,
                      color: textPrimary,
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={!name || !phone}
                className="w-full h-12 rounded-full font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: accent,
                  color: isDark ? bg : "#ffffff",
                }}
              >
                {selectedService?.is_paid && selectedService.price > 0 ? (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Book & Pay ${Number(selectedService.price).toFixed(2)}
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </button>
            </motion.div>
          )}

          {/* Step: Submitting */}
          {step === "submitting" && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl p-8 border text-center"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" style={{ color: accent }} />
              <p className="text-sm font-medium" style={{ color: textPrimary }}>
                Processing your booking...
              </p>
              <p className="text-xs mt-1" style={{ color: textMuted }}>
                This will just take a moment
              </p>
            </motion.div>
          )}

          {/* Step: Payment */}
          {step === "payment" && paymentClientSecret && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl p-6 border"
              style={{ backgroundColor: cardBg, borderColor: cardBorder }}
            >
              <h2 className="text-xl font-bold mb-1" style={{ color: textPrimary }}>
                Complete Payment
              </h2>
              <p className="text-sm mb-6" style={{ color: textSecondary }}>
                Secure checkout for {selectedService?.name}
              </p>

              <Elements
                stripe={getStripe()}
                options={{
                  clientSecret: paymentClientSecret,
                  appearance: {
                    theme: isDark ? 'night' : 'stripe',
                    variables: {
                      colorPrimary: accent,
                    }
                  }
                }}
              >
                <PaymentIntentForm
                  clientSecret={paymentClientSecret}
                  accent={accent}
                  bg={bg}
                  isDark={isDark}
                  textPrimary={textPrimary}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                  onCancel={() => setStep("confirm")}
                  onSuccess={async () => {
                    setStep("submitting");
                    // Send confirmation email
                    if (currentBookingId) {
                      // Update payment status to paid
                      await supabase
                        .from("bookings")
                        .update({ payment_status: "paid" })
                        .eq("id", currentBookingId);

                      try {
                        await supabase.functions.invoke("supabase-functions-send-booking-email", {
                          body: { booking_id: currentBookingId, type: "confirmation" },
                        });
                      } catch (e) { console.error(e); }
                    }
                    setStep("done");
                  }}
                />
              </Elements>
            </motion.div>
          )}

          {/* Step: Error */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
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
                onClick={() => setStep(services.length > 0 ? "service" : "select")}
                className="h-10 px-6 rounded-full text-sm font-medium transition-all active:scale-[0.98]"
                style={{
                  backgroundColor: accent,
                  color: isDark ? bg : "#ffffff",
                }}
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* Step 3: Done */}
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
                You&apos;re Booked!
              </h2>
              <p className="text-sm mb-2" style={{ color: textSecondary }}>
                {selectedDate?.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at {selectedTime}
              </p>
              {selectedService?.payment_mode === "in_store" ? (
                <p className="text-xs mb-4" style={{ color: textMuted }}>
                  You will pay ${Number(selectedService.price).toFixed(2)} at the store.
                </p>
              ) : customerEmail ? (
                <p className="text-xs mb-4" style={{ color: textMuted }}>
                  A confirmation email has been sent to {customerEmail}
                </p>
              ) : (
                <p className="text-xs mb-4" style={{ color: textMuted }}>
                  Your appointment has been confirmed.
                </p>
              )}

              <div
                className="rounded-xl p-4 border mt-4 text-left"
                style={{ backgroundColor: `${accent}08`, borderColor: `${accent}20` }}
              >
                <div className="space-y-2">
                  {selectedService && (
                    <div className="flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5" style={{ color: textMuted }} />
                      <span className="text-sm" style={{ color: textPrimary }}>{selectedService.name}</span>
                      {selectedService.is_paid && selectedService.price > 0 && (
                        <span className={`text-xs ml-auto font-mono px-2 py-0.5 rounded-full ${selectedService.payment_mode === 'in_store' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                          {selectedService.payment_mode === 'in_store' ? 'Pay In Store' : 'Paid'} ${Number(selectedService.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" style={{ color: textMuted }} />
                    <span className="text-sm" style={{ color: textPrimary }}>{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" style={{ color: textMuted }} />
                    <span className="text-sm font-mono" style={{ color: textPrimary }}>{phone}</span>
                  </div>
                  {customerEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" style={{ color: textMuted }} />
                      <span className="text-sm" style={{ color: textPrimary }}>{customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>
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

function PaymentIntentForm({
  clientSecret,
  onSuccess,
  onCancel,
  accent,
  bg,
  isDark,
  textPrimary,
  cardBg,
  cardBorder
}: {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  accent: string;
  bg: string;
  isDark: boolean;
  textPrimary: string;
  cardBg: string;
  cardBorder: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "An unexpected error occurred.");
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{
        layout: 'accordion',
      }} />
      {errorMessage && (
        <div className="text-red-400 text-xs mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errorMessage}
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 rounded-full text-sm font-medium border"
          style={{ borderColor: cardBorder, color: textPrimary, backgroundColor: bg }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 h-11 rounded-full text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: accent, color: isDark ? bg : "#ffffff" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay Now"}
        </button>
      </div>
    </form>
  );
}
