"use client";

import { SettingsDrawer } from "./settings-drawer";
import { BookingLinkSetup } from "./booking-link-setup";
import { RevenueModule } from "./revenue-module";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Settings,
  MessageSquare,
  Link2,
  LogOut,
  Home,
  PanelLeftClose,
  PanelLeft,
  UserCircle,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  DollarSign,
} from "lucide-react";
import { updateSettings } from "@/app/dashboard/actions";
import { signOutAction } from "@/app/actions";
import { toast } from "sonner";
import { createClient } from "../../../supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { format, isToday } from "date-fns";

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

interface BookingItem {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service_type: string;
  appointment_time: string;
  status: string;
  payment_status: string | null;
  created_at: string;
}

type NavItem = "home" | "missed-calls" | "booking-link" | "revenue";

const NAV_ITEMS: { id: NavItem; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "missed-calls", label: "Missed Call Text-Back", icon: MessageSquare },
  { id: "booking-link", label: "Booking Link", icon: Link2 },
  { id: "revenue", label: "Total Revenue", icon: DollarSign },
];

export function DashboardClient({
  missedCalls,
  bookings,
  settings,
  stats,
}: DashboardClientProps) {
  const [activeNav, setActiveNav] = useState<NavItem>("home");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [liveBookings, setLiveBookings] = useState<BookingItem[]>(bookings);
  const [userData, setUserData] = useState<{
    email: string;
    name: string;
    avatarUrl: string | null;
  } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserData({
          email: user.email || "",
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "",
          avatarUrl:
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null,
        });
      }
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserData({
          email: session.user.email || "",
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "",
          avatarUrl:
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            null,
        });
      } else setUserData(null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Handle Stripe success redirect — auto-navigate to booking-link tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("stripe_success") === "true") {
        setActiveNav("booking-link");
        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete("stripe_success");
        url.searchParams.delete("profile_id");
        window.history.replaceState({}, "", url.toString());
        toast.success("Stripe connected successfully!");
      }
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "missed_calls" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            toast.message("New Missed Call", {
              description: "A new missed call has been recorded.",
            });
          }
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newBooking = payload.new as BookingItem;
            setLiveBookings((prev) => [newBooking, ...prev]);
            toast.message("New Booking!", {
              description: `${newBooking.customer_name} just booked an appointment.`,
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as BookingItem;
            setLiveBookings((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b))
            );
          }
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const handleNavClick = (id: NavItem) => {
    setActiveNav(id);
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

  const handleSignOut = async () => {
    try {
      await signOutAction();
      router.push("/sign-in");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 flex">
      {/* Logo in top left corner */}
      <Link
        href="/"
        className="fixed top-0 left-0 z-50 p-4 flex items-center gap-2"
      >
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <span className="text-black font-bold text-lg">N</span>
        </div>
        <span className="text-xl font-bold text-white tracking-tighter">
          NumSphere
        </span>
      </Link>

      {/* Side Navbar - retractable */}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 border-r border-white/10 bg-black/50 z-40 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-56",
        )}
      >
        <nav className="flex flex-col gap-1 p-4 pt-8 h-full">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                  sidebarCollapsed
                    ? "justify-center px-3 py-3"
                    : "px-4 py-3 text-left",
                  activeNav === item.id
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
          <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-2">
            {/* Profile picture + Settings + Sign Out */}
            <div
              className={cn(
                "flex items-center gap-3",
                sidebarCollapsed ? "justify-center" : "px-2 pb-2",
              )}
            >
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-white/10 flex items-center justify-center border border-white/10">
                {userData?.avatarUrl ? (
                  <Image
                    src={userData.avatarUrl}
                    alt={userData.name || "User"}
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <UserCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              {!sidebarCollapsed && userData && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userData.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userData.email}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                onClick={() => setIsSettingsOpen(true)}
                title="Settings"
                className={cn(
                  "text-gray-400 hover:bg-white/5 hover:text-white",
                  sidebarCollapsed
                    ? "justify-center px-3"
                    : "justify-start gap-3",
                )}
              >
                <Settings className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span>Settings</span>}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                className={cn(
                  "text-gray-400 hover:bg-white/5 hover:text-white",
                  sidebarCollapsed
                    ? "justify-center px-3"
                    : "justify-start gap-3",
                )}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="w-5 h-5" />
                ) : (
                  <>
                    <PanelLeftClose className="w-5 h-5" />
                    Collapse
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className={cn(
                  "text-gray-400 hover:bg-white/5 hover:text-white",
                  sidebarCollapsed
                    ? "justify-center px-3"
                    : "justify-start gap-3",
                )}
              >
                <LogOut className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span>Sign Out</span>}
              </Button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 pt-16 pb-8 px-8 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "ml-16" : "ml-56",
        )}
      >
        <div className="max-w-5xl mx-auto">
          {activeNav === "home" && (
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                  Welcome back
                </h1>
                <p className="text-gray-400">
                  Here&apos;s an overview of your dashboard.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="min-h-[180px] rounded-xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between">
                  <p className="text-gray-500 uppercase tracking-wider text-xs">
                    Missed Calls Today
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.missedCallsToday}
                  </p>
                </div>
                <div className="min-h-[180px] rounded-xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between">
                  <p className="text-gray-500 uppercase tracking-wider text-xs">
                    Bookings Today
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.bookingsToday}
                  </p>
                </div>
                <RevenueModule totalRevenue={stats.revenueCaptured} />
              </div>

              {/* Today's Bookings Section */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      Today&apos;s Bookings
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {format(new Date(), "EEEE, MMMM d")}
                    </p>
                  </div>
                  <span className="text-xs bg-white/10 text-white px-3 py-1 rounded-full font-mono">
                    {liveBookings.filter((b) => isToday(new Date(b.appointment_time)) && b.status !== "cancelled").length} appointments
                  </span>
                </div>

                {(() => {
                  const todayBookings = liveBookings
                    .filter(
                      (b) =>
                        isToday(new Date(b.appointment_time)) &&
                        b.status !== "cancelled"
                    )
                    .sort(
                      (a, b) =>
                        new Date(a.appointment_time).getTime() -
                        new Date(b.appointment_time).getTime()
                    );

                  if (todayBookings.length === 0) {
                    return (
                      <div className="text-center py-10">
                        <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                        <p className="text-gray-500 text-sm">
                          No bookings scheduled for today
                        </p>
                        <p className="text-gray-600 text-xs mt-1">
                          Share your booking link to start getting appointments
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {todayBookings.map((booking) => {
                        const apptTime = new Date(booking.appointment_time);
                        const isPast = apptTime < new Date();
                        return (
                          <div
                            key={booking.id}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-xl border transition-colors hover:bg-white/5",
                              isPast
                                ? "border-white/5 opacity-60"
                                : "border-white/10"
                            )}
                          >
                            <div
                              className={cn(
                                "w-1 h-12 rounded-full shrink-0",
                                booking.status === "completed"
                                  ? "bg-green-500"
                                  : booking.status === "confirmed"
                                    ? "bg-teal-500"
                                    : "bg-gray-500"
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-white font-medium text-sm truncate">
                                  {booking.customer_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(apptTime, "h:mm a")}
                                </span>
                                {booking.customer_phone && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Phone className="w-3 h-3" />
                                    {booking.customer_phone}
                                  </span>
                                )}
                                {booking.customer_email && (
                                  <span className="flex items-center gap-1 truncate">
                                    <Mail className="w-3 h-3" />
                                    {booking.customer_email}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {booking.payment_status === "paid" && (
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 flex items-center gap-1">
                                  <DollarSign className="w-2.5 h-2.5" />
                                  Paid
                                </span>
                              )}
                              {booking.payment_status === "pending" && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                                  Pending
                                </span>
                              )}
                              {booking.payment_status === "pay_in_store" && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
                                  Pay In Store
                                </span>
                              )}
                              <span
                                className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full border",
                                  booking.status === "confirmed"
                                    ? "bg-teal-500/20 text-teal-400 border-teal-500/30"
                                    : booking.status === "completed"
                                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                                      : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                                )}
                              >
                                {booking.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Upcoming Bookings Section */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  Upcoming Bookings
                </h2>
                {(() => {
                  const upcoming = liveBookings
                    .filter(
                      (b) =>
                        !isToday(new Date(b.appointment_time)) &&
                        new Date(b.appointment_time) > new Date() &&
                        b.status !== "cancelled"
                    )
                    .sort(
                      (a, b) =>
                        new Date(a.appointment_time).getTime() -
                        new Date(b.appointment_time).getTime()
                    )
                    .slice(0, 10);

                  if (upcoming.length === 0) {
                    return (
                      <p className="text-gray-500 text-sm text-center py-6">
                        No upcoming bookings
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {upcoming.map((booking) => {
                        const apptTime = new Date(booking.appointment_time);
                        return (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-8 rounded-full bg-teal-500/50 shrink-0" />
                              <div>
                                <span className="text-sm text-white font-medium">
                                  {booking.customer_name}
                                </span>
                                <p className="text-xs text-gray-500 font-mono">
                                  {format(apptTime, "EEE, MMM d")} at{" "}
                                  {format(apptTime, "h:mm a")}
                                </p>
                              </div>
                            </div>
                            {booking.customer_phone && (
                              <span className="text-xs text-gray-500 font-mono">
                                {booking.customer_phone}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="min-h-[200px] rounded-xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Quick Links
                  </h2>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveNav("missed-calls")}
                      className="block w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      Missed Call Text-Back
                    </button>
                    <button
                      onClick={() => setActiveNav("booking-link")}
                      className="block w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      Booking Link
                    </button>
                    <button
                      onClick={() => setActiveNav("revenue")}
                      className="block w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      Total Revenue
                    </button>
                  </div>
                </div>
                <div className="min-h-[200px] rounded-xl border border-white/10 bg-white/5 p-6">
                  <h2 className="text-lg font-semibold text-white mb-2">
                    Conversion Rate
                  </h2>
                  <p className="text-5xl font-bold text-white mt-4">
                    {stats.conversionRate}%
                  </p>
                  <p className="text-gray-500 text-xs mt-2 uppercase tracking-wider">
                    Calls → Bookings
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeNav === "missed-calls" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Missed Call Text-Back
              </h1>
              <p className="text-gray-400">
                Automatically text back when you miss a call.
              </p>
              <div className="min-h-[400px] rounded-xl border border-white/10 bg-white/5 p-8 flex items-center justify-center">
                <p className="text-gray-500 uppercase tracking-wider text-sm">
                  Empty
                </p>
              </div>
            </div>
          )}

          {activeNav === "booking-link" && (
            <div className="space-y-6">
              <BookingLinkSetup />
            </div>
          )}

          {activeNav === "revenue" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Total Revenue
                </h1>
                <p className="text-gray-400">
                  Track your earnings, payouts, and payment history.
                </p>
              </div>

              {/* Revenue Module - Full Width */}
              <RevenueModule totalRevenue={stats.revenueCaptured} />

              {/* Paid Bookings */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  Payment History
                </h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {(() => {
                    const paidBookings = liveBookings
                      .filter(
                        (b) =>
                          b.payment_status === "paid" ||
                          b.payment_status === "pending"
                      )
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      );

                    if (paidBookings.length === 0) {
                      return (
                        <div className="text-center py-10">
                          <DollarSign className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                          <p className="text-gray-500 text-sm">
                            No paid bookings yet
                          </p>
                          <p className="text-gray-600 text-xs mt-1">
                            Enable payments on your booking links to start
                            earning
                          </p>
                        </div>
                      );
                    }

                    return paidBookings.map((booking) => {
                      const apptTime = new Date(booking.appointment_time);
                      return (
                        <div
                          key={booking.id}
                          className="flex items-center gap-3 p-4 rounded-lg border border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <div
                            className={cn(
                              "w-1 h-12 rounded-full shrink-0",
                              booking.payment_status === "paid"
                                ? "bg-green-500"
                                : "bg-amber-500"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                              {booking.customer_name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 font-mono">
                                {format(apptTime, "MMM d, h:mm a")}
                              </span>
                              <span className="text-xs text-gray-600">
                                {booking.service_type}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full border",
                                booking.payment_status === "paid"
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              )}
                            >
                              {booking.payment_status === "paid"
                                ? "Paid"
                                : "Pending"}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* All Bookings Revenue Summary */}
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <p className="text-gray-500 uppercase tracking-wider text-xs mb-2">
                    Total Paid Bookings
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {
                      liveBookings.filter((b) => b.payment_status === "paid")
                        .length
                    }
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <p className="text-gray-500 uppercase tracking-wider text-xs mb-2">
                    Pending Payments
                  </p>
                  <p className="text-3xl font-bold text-amber-400">
                    {
                      liveBookings.filter(
                        (b) => b.payment_status === "pending"
                      ).length
                    }
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                  <p className="text-gray-500 uppercase tracking-wider text-xs mb-2">
                    Free Bookings
                  </p>
                  <p className="text-3xl font-bold text-gray-400">
                    {
                      liveBookings.filter(
                        (b) =>
                          !b.payment_status ||
                          b.payment_status === "not_required"
                      ).length
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Settings Drawer */}
      <SettingsDrawer
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
