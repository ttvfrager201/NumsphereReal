"use client";

import { SettingsDrawer } from "./settings-drawer";
import { BookingLinkSetup } from "./booking-link-setup";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Settings,
  MessageSquare,
  Link2,
  LayoutDashboard,
  LogOut,
  Home,
  PanelLeftClose,
  PanelLeft,
  UserCircle,
} from "lucide-react";
import { updateSettings } from "@/app/dashboard/actions";
import { signOutAction } from "@/app/actions";
import { toast } from "sonner";
import { createClient } from "../../../supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

type NavItem = "home" | "missed-calls" | "booking-link" | "dashboard";

const NAV_ITEMS: { id: NavItem; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "missed-calls", label: "Missed Call Text-Back", icon: MessageSquare },
  { id: "booking-link", label: "Booking Link (Stripe Express)", icon: Link2 },
  { id: "dashboard", label: "Basic Dashboard", icon: LayoutDashboard },
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
        () => router.refresh(),
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
                <div className="min-h-[180px] rounded-xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between">
                  <p className="text-gray-500 uppercase tracking-wider text-xs">
                    Revenue Captured
                  </p>
                  <p className="text-3xl font-bold text-white">
                    ${stats.revenueCaptured}
                  </p>
                </div>
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
                      onClick={() => setActiveNav("dashboard")}
                      className="block w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      Basic Dashboard
                    </button>
                  </div>
                </div>
                <div className="min-h-[200px] rounded-xl border border-white/10 bg-white/5 p-6 flex items-center justify-center">
                  <p className="text-gray-500 uppercase tracking-wider text-sm">
                    Empty
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

          {activeNav === "dashboard" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Basic Dashboard
              </h1>
              <p className="text-gray-400">Calls + appointments overview.</p>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="min-h-[300px] rounded-xl border border-white/10 bg-white/5 p-8 flex items-center justify-center">
                  <p className="text-gray-500 uppercase tracking-wider text-sm">
                    Calls
                  </p>
                </div>
                <div className="min-h-[300px] rounded-xl border border-white/10 bg-white/5 p-8 flex items-center justify-center">
                  <p className="text-gray-500 uppercase tracking-wider text-sm">
                    Appointments
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
