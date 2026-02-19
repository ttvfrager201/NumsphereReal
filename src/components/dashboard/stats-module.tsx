"use client";

import { Card } from "@/components/ui/card";
import { PhoneMissed, CalendarCheck, DollarSign, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface StatsModuleProps {
  missedCallsToday: number;
  bookingsToday: number;
  revenueCaptured: number;
  conversionRate: number;
}

export function StatsModule({
  missedCallsToday,
  bookingsToday,
  revenueCaptured,
  conversionRate,
}: StatsModuleProps) {
  const stats = [
    {
      label: "Missed Calls Today",
      value: missedCallsToday,
      icon: PhoneMissed,
      color: "text-amber-500",
    },
    {
      label: "Bookings Today",
      value: bookingsToday,
      icon: CalendarCheck,
      color: "text-teal-600",
    },
    {
      label: "Revenue Captured",
      value: `$${revenueCaptured}`,
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: "text-blue-600",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 col-span-12 lg:col-span-8"
    >
      {stats.map((stat, index) => (
        <Card key={index} className="p-6 flex flex-col gap-2 hover:shadow-lg transition-shadow bg-white/5 border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider font-sans">
              {stat.label}
            </span>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <div className="text-3xl font-bold font-display tracking-tight text-white">
            {stat.value}
          </div>
        </Card>
      ))}
    </motion.div>
  );
}
