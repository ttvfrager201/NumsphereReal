"use client";

import { Card } from "@/components/ui/card";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CalendarCheck, User, Clock, CheckCircle2 } from "lucide-react";
import type { Database } from "@/types/supabase";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];

interface BookingCalendarProps {
  bookings: Booking[];
}

export function BookingCalendar({ bookings }: BookingCalendarProps) {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  return (
    <Card className="col-span-12 lg:col-span-5 h-[600px] flex flex-col bg-card/50 border-border/50 backdrop-blur-sm">
      <div className="p-6 border-b border-border/50">
        <h3 className="font-display font-bold text-xl text-foreground">Booking Calendar</h3>
        <p className="text-sm text-muted-foreground mt-1 font-sans">
          Upcoming confirmed appointments
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-2">
          {weekDays.map((day) => {
            const dayBookings = bookings.filter((booking) => 
              isSameDay(new Date(booking.appointment_time), day)
            );

            return (
              <div key={day.toISOString()} className="mb-4">
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 px-3 border-b border-border/50 font-display font-medium text-sm text-muted-foreground mb-2 flex justify-between items-center">
                  <span>{format(day, "EEEE, MMMM d")}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {dayBookings.length}
                  </span>
                </div>
                
                <div className="space-y-2 pl-2">
                  {dayBookings.length === 0 ? (
                    <div className="text-sm text-muted-foreground/50 italic px-4 py-2">
                      No bookings
                    </div>
                  ) : (
                    dayBookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card border border-border/50 rounded-lg p-3 hover:border-primary/50 transition-colors group relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-teal-600/50 group-hover:bg-teal-600 transition-colors" />
                        <div className="flex justify-between items-start pl-3">
                          <div>
                            <div className="font-medium text-foreground flex items-center gap-2">
                              <User className="w-3 h-3 text-muted-foreground" />
                              {booking.customer_name}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {format(new Date(booking.appointment_time), "h:mm a")}
                              <span className="text-xs text-muted-foreground/50 mx-1">•</span>
                              <span className="font-mono text-xs">{booking.service_type}</span>
                            </div>
                          </div>
                          {booking.payment_status === 'paid' && (
                            <div className="bg-green-100 text-green-700 p-1 rounded-full" title="Paid">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
