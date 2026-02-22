"use client";

import { useState } from "react";
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
} from "lucide-react";

interface BookingProfile {
  id: string;
  business_name: string;
  address?: string;
  phone_number?: string;
  email?: string;
  logo_url?: string;
  booking_slug: string;
  theme_color?: string;
  accent_color?: string;
  dark_mode?: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
];

export function BookingPageClient({ profile }: { profile: BookingProfile }) {
  const [step, setStep] = useState<"select" | "confirm" | "done">("select");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
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

  const handleConfirm = () => {
    setStep("done");
  };

  const monthYear = weekDates[0].toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

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
                  const isSelected = selectedDate && isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, today);

                  return (
                    <button
                      key={i}
                      disabled={isPast}
                      onClick={() => setSelectedDate(date)}
                      className="flex flex-col items-center rounded-xl py-2 transition-all"
                      style={{
                        backgroundColor: isSelected
                          ? accent
                          : "transparent",
                        opacity: isPast ? 0.3 : 1,
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
              {selectedDate && (
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
                            backgroundColor: isSelected
                              ? `${accent}20`
                              : "transparent",
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
              <p className="text-xs mb-5" style={{ color: textMuted }}>
                {selectedDate?.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at {selectedTime}
              </p>

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
                      // @ts-ignore
                      "--tw-ring-color": `${accent}40`,
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
                className="w-full h-12 rounded-full font-medium text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  backgroundColor: accent,
                  color: isDark ? bg : "#ffffff",
                }}
              >
                Confirm Booking
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
              <p className="text-sm mb-4" style={{ color: textSecondary }}>
                {selectedDate?.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at {selectedTime}
              </p>
              <p className="text-xs" style={{ color: textMuted }}>
                A confirmation will be sent to you shortly.
              </p>
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
