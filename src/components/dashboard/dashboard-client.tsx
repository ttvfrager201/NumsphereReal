"use client";

import { StatsModule } from "./stats-module";
import { MissedCallFeed } from "./missed-call-feed";
import { BookingCalendar } from "./booking-calendar";
import { SettingsDrawer } from "./settings-drawer";
import { QuickActions } from "./quick-actions";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Phone } from "lucide-react";
import { markCallHandled, sendBookingLink, updateSettings, createMockCall } from "@/app/dashboard/actions";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { createClient } from "../../../supabase/client";
import { useRouter } from "next/navigation";

interface DashboardClientProps {
  missedCalls: any[];
  bookings: any[];
  settings: any;
  stats: {
    missedCallsToday: number;
    bookingsToday: number;
    revenueCaptured: number;
    conversionRate: number;
  };
}

export function DashboardClient({ missedCalls, bookings, settings, stats }: DashboardClientProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // ... existing useEffect logic ...
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'missed_calls'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.message("New Missed Call", {
              description: "A new missed call has been recorded.",
            });
          }
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const handleCreateMockCall = async () => {
    try {
      await createMockCall();
      toast.success("Simulated new missed call");
    } catch (error) {
      toast.error("Failed to create call");
    }
  };

  const handleSendLink = async (id: string) => {
    try {
      await sendBookingLink(id);
      toast.success("Booking link sent!");
    } catch (error) {
      toast.error("Failed to send link");
    }
  };

  const handleMarkHandled = async (id: string) => {
    try {
      await markCallHandled(id);
      toast.success("Call marked as handled");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleSaveSettings = async (newSettings: any) => {
    try {
      await updateSettings(newSettings);
      toast.success("Settings saved");
      setIsSettingsOpen(false);
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 md:p-8 font-sans text-[#1F2937]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold text-[#0A0A0A]">Numsphere</h1>
            <p className="text-muted-foreground mt-1 font-sans">Missed Call Recovery Dashboard</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(true)}
              className="gap-2 font-medium"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button 
              className="gap-2 bg-teal-700 hover:bg-teal-800 text-white"
              onClick={handleCreateMockCall}
            >
              <Plus className="w-4 h-4" />
              Simulate Call
            </Button>
          </div>
        </header>

        {/* Top Grid: Stats + Quick Actions */}
        <div className="grid grid-cols-12 gap-8">
          <StatsModule {...stats} />
          <QuickActions />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-8">
          <MissedCallFeed
            calls={missedCalls}
            onSendLink={handleSendLink}
            onMarkHandled={handleMarkHandled}
          />
          <BookingCalendar bookings={bookings} />
        </div>

        {/* Settings Drawer */}
        <SettingsDrawer
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          settings={settings}
          onSave={handleSaveSettings}
        />
      </div>
    </div>
  );
}
