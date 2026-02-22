"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  DollarSign,
  Clock,
  Loader2,
  Scissors,
  CreditCard,
  ExternalLink,
  Zap,
  CalendarDays,
} from "lucide-react";
import {
  getServicesForProfile,
  saveService,
  deleteService,
  updateBusinessProfileStripe,
  updateAvailableHours,
} from "@/app/dashboard/actions";
import { toast } from "sonner";
import { createClient } from "../../../supabase/client";

interface ServiceItem {
  id?: string;
  business_profile_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_paid: boolean;
  is_active: boolean;
}

interface ServiceManagerProps {
  businessProfileId: string;
  stripeAccountId?: string | null;
  paymentsEnabled?: boolean;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DEFAULT_HOURS: Record<string, { enabled: boolean; start: string; end: string }> = {
  monday: { enabled: true, start: "09:00", end: "17:00" },
  tuesday: { enabled: true, start: "09:00", end: "17:00" },
  wednesday: { enabled: true, start: "09:00", end: "17:00" },
  thursday: { enabled: true, start: "09:00", end: "17:00" },
  friday: { enabled: true, start: "09:00", end: "17:00" },
  saturday: { enabled: false, start: "09:00", end: "17:00" },
  sunday: { enabled: false, start: "09:00", end: "17:00" },
};

export function ServiceManager({
  businessProfileId,
  stripeAccountId,
  paymentsEnabled,
}: ServiceManagerProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<{
    charges_enabled: boolean;
    payouts_enabled: boolean;
    is_enabled: boolean;
  } | null>(null);
  const supabase = createClient();

  // Availability state
  const [availableHours, setAvailableHours] = useState<Record<string, { enabled: boolean; start: string; end: string }>>(DEFAULT_HOURS);
  const [slotDuration, setSlotDuration] = useState(30);
  const [savingHours, setSavingHours] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);

  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://8635323e-47c7-41fe-b02a-927e6f46c4fc.canvases.tempo.build";

  useEffect(() => {
    loadServices();
    loadAvailability();
    if (stripeAccountId) {
      checkStripeStatus();
    }
  }, [businessProfileId, stripeAccountId]);

  const loadServices = async () => {
    try {
      const data = await getServicesForProfile(businessProfileId);
      setServices(data);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    try {
      const { data } = await supabase
        .from("business_profiles")
        .select("available_hours, slot_duration")
        .eq("id", businessProfileId)
        .single();
      if (data) {
        if (data.available_hours) setAvailableHours(data.available_hours);
        if (data.slot_duration) setSlotDuration(data.slot_duration);
      }
    } catch {
      // Use defaults
    }
  };

  const checkStripeStatus = async () => {
    if (!stripeAccountId) return;
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-stripe-connect",
        {
          body: { action: "check-account-status", stripe_account_id: stripeAccountId },
        }
      );
      if (!error && data) {
        setStripeStatus(data);
        if (data.is_enabled && !paymentsEnabled) {
          await updateBusinessProfileStripe(businessProfileId, stripeAccountId, true);
        }
      }
    } catch {
      console.error("Failed to check Stripe status");
    }
  };

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-stripe-connect",
        {
          body: {
            action: "create-connect-account",
            business_profile_id: businessProfileId,
            user_id: user.id,
            return_url: `${SITE_URL}/dashboard`,
          },
        }
      );

      if (error || !data?.url) throw new Error("Failed to create Stripe account");

      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message || "Failed to connect Stripe");
    } finally {
      setConnectingStripe(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    if (!stripeAccountId) return;
    try {
      const { data, error } = await supabase.functions.invoke(
        "supabase-functions-stripe-connect",
        {
          body: { action: "create-login-link", stripe_account_id: stripeAccountId },
        }
      );
      if (error || !data?.url) throw new Error("Failed");
      window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to open Stripe dashboard");
    }
  };

  const handleSaveService = async (service: ServiceItem) => {
    setSaving(true);
    try {
      await saveService({
        id: service.id,
        business_profile_id: businessProfileId,
        name: service.name,
        description: service.description,
        duration_minutes: service.duration_minutes,
        price: service.price,
        is_paid: service.is_paid,
        is_active: service.is_active,
      });
      toast.success(service.id ? "Service updated" : "Service created");
      setEditingService(null);
      setIsAdding(false);
      await loadServices();
    } catch (error: any) {
      toast.error(error.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    setDeletingId(id);
    try {
      await deleteService(id);
      toast.success("Service deleted");
      await loadServices();
    } catch {
      toast.error("Failed to delete service");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveAvailability = async () => {
    setSavingHours(true);
    try {
      await updateAvailableHours(businessProfileId, availableHours, slotDuration);
      toast.success("Availability updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save availability");
    } finally {
      setSavingHours(false);
    }
  };

  const toggleDay = (dayKey: string) => {
    setAvailableHours((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], enabled: !prev[dayKey].enabled },
    }));
  };

  const updateDayTime = (dayKey: string, field: "start" | "end", value: string) => {
    setAvailableHours((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }));
  };

  const newService: ServiceItem = {
    business_profile_id: businessProfileId,
    name: "",
    description: "",
    duration_minutes: 30,
    price: 0,
    is_paid: false,
    is_active: true,
  };

  const isStripeConnected = stripeAccountId && stripeStatus?.is_enabled;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stripe Connect Section */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-white">Payment Setup</h3>
          </div>
          {isStripeConnected && (
            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">
              Connected
            </span>
          )}
        </div>

        {!stripeAccountId ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              Connect Stripe Express to accept payments through your booking page. Customers will pay when they book.
            </p>
            <Button
              onClick={handleConnectStripe}
              disabled={connectingStripe}
              className="w-full h-10 rounded-lg bg-[#635BFF] hover:bg-[#5349E0] text-white text-sm font-medium"
            >
              {connectingStripe ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Connect with Stripe
            </Button>
          </div>
        ) : !stripeStatus?.is_enabled ? (
          <div className="space-y-3">
            <p className="text-xs text-amber-400">
              Stripe account created but onboarding is incomplete. Please finish setup to accept payments.
            </p>
            <Button
              onClick={handleConnectStripe}
              disabled={connectingStripe}
              className="w-full h-10 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium"
            >
              {connectingStripe ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              Complete Stripe Setup
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-green-400">
              Stripe is connected and ready to accept payments.
            </p>
            <Button
              variant="ghost"
              onClick={handleOpenStripeDashboard}
              className="text-gray-400 hover:text-white hover:bg-white/5 gap-2 text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Stripe Dashboard
            </Button>
          </div>
        )}
      </div>

      {/* Availability Schedule */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <button
          onClick={() => setShowAvailability(!showAvailability)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-white">Available Hours</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
              {slotDuration} min slots
            </span>
            <motion.div
              animate={{ rotate: showAvailability ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showAvailability ? '' : 'rotate-45'}`} />
            </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {showAvailability && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3">
                {/* Slot Duration */}
                <div className="flex items-center gap-3 mb-4">
                  <Label className="text-gray-400 text-xs whitespace-nowrap">Slot Duration</Label>
                  <div className="flex items-center gap-1.5">
                    {[15, 30, 45, 60, 90].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setSlotDuration(mins)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${slotDuration === mins
                            ? "bg-white text-black"
                            : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                          }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Days */}
                <div className="space-y-2">
                  {DAY_KEYS.map((dayKey, i) => {
                    const dayHours = availableHours[dayKey] || DEFAULT_HOURS[dayKey];
                    return (
                      <div
                        key={dayKey}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${dayHours.enabled
                            ? "border-white/10 bg-white/5"
                            : "border-white/5 bg-transparent opacity-50"
                          }`}
                      >
                        {/* Toggle */}
                        <button
                          onClick={() => toggleDay(dayKey)}
                          className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${dayHours.enabled ? "bg-white/20" : "bg-white/10"
                            }`}
                        >
                          <motion.div
                            animate={{ x: dayHours.enabled ? 18 : 2 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className={`absolute top-1 w-4 h-4 rounded-full shadow-md ${dayHours.enabled ? "bg-white" : "bg-gray-500"
                              }`}
                          />
                        </button>

                        {/* Day Name */}
                        <span className="text-sm text-white font-medium w-24 shrink-0">
                          {DAY_NAMES[i]}
                        </span>

                        {/* Time Inputs */}
                        {dayHours.enabled && (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="time"
                              value={dayHours.start}
                              onChange={(e) => updateDayTime(dayKey, "start", e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 w-[110px]"
                            />
                            <span className="text-gray-500 text-xs">to</span>
                            <input
                              type="time"
                              value={dayHours.end}
                              onChange={(e) => updateDayTime(dayKey, "end", e.target.value)}
                              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/20 w-[110px]"
                            />
                          </div>
                        )}
                        {!dayHours.enabled && (
                          <span className="text-xs text-gray-600 italic">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveAvailability}
                  disabled={savingHours}
                  className="w-full h-9 rounded-lg bg-white text-black text-xs font-medium hover:bg-gray-200 disabled:opacity-50 mt-2"
                >
                  {savingHours ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Save Availability
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Services Section */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-white">Services</h3>
            <span className="text-[10px] bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
              {services.length}
            </span>
          </div>
          <Button
            variant="ghost"
            onClick={() => { setIsAdding(true); setEditingService(newService); }}
            className="text-gray-400 hover:text-white hover:bg-white/5 gap-1.5 text-xs h-8"
          >
            <Plus className="w-3.5 h-3.5" /> Add Service
          </Button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Define services your customers can choose from when booking.{" "}
          {!isStripeConnected && "Connect Stripe above to enable paid services."}
        </p>

        {/* Service Edit Form */}
        <AnimatePresence>
          {editingService && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-gray-400 text-xs mb-1">Service Name</Label>
                    <Input
                      value={editingService.name}
                      onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                      placeholder="e.g. Haircut, Beard Trim"
                      className="bg-white/5 border-white/10 text-white text-sm h-9"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-400 text-xs mb-1">Description (optional)</Label>
                    <Input
                      value={editingService.description}
                      onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                      placeholder="Brief description"
                      className="bg-white/5 border-white/10 text-white text-sm h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400 text-xs mb-1">Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={editingService.duration_minutes}
                      onChange={(e) => setEditingService({ ...editingService, duration_minutes: parseInt(e.target.value) || 30 })}
                      className="bg-white/5 border-white/10 text-white text-sm h-9"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-400 text-xs mb-1">
                      Price ($) {!isStripeConnected && <span className="text-gray-600">— Connect Stripe first</span>}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingService.price}
                      onChange={(e) => setEditingService({
                        ...editingService,
                        price: parseFloat(e.target.value) || 0,
                        is_paid: parseFloat(e.target.value) > 0,
                      })}
                      disabled={!isStripeConnected}
                      className="bg-white/5 border-white/10 text-white text-sm h-9 disabled:opacity-40"
                    />
                  </div>
                </div>

                {/* Payment toggle for Stripe connected */}
                {isStripeConnected && (
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                    <button
                      onClick={() => setEditingService({
                        ...editingService,
                        is_paid: !editingService.is_paid,
                        price: !editingService.is_paid ? (editingService.price || 0) : 0,
                      })}
                      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${editingService.is_paid ? "bg-green-500/30" : "bg-white/10"
                        }`}
                    >
                      <motion.div
                        animate={{ x: editingService.is_paid ? 18 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={`absolute top-1 w-4 h-4 rounded-full shadow-md ${editingService.is_paid ? "bg-green-400" : "bg-gray-500"
                          }`}
                      />
                    </button>
                    <div>
                      <span className="text-xs text-white font-medium">
                        {editingService.is_paid ? "Paid Service" : "Free Service"}
                      </span>
                      <span className="text-[10px] text-gray-500 block">
                        {editingService.is_paid
                          ? "Customers pay when they book"
                          : "No payment required to book"}
                      </span>
                    </div>
                  </div>
                )}

                {editingService.price > 0 && editingService.is_paid && isStripeConnected && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <DollarSign className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-green-400">
                      Customers will pay ${editingService.price.toFixed(2)} when booking this service
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    onClick={() => handleSaveService(editingService)}
                    disabled={saving || !editingService.name}
                    className="h-8 px-4 rounded-lg bg-white text-black text-xs font-medium hover:bg-gray-200 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                    {editingService.id ? "Update" : "Add Service"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setEditingService(null); setIsAdding(false); }}
                    className="h-8 text-gray-400 hover:text-white hover:bg-white/5 text-xs"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Services List */}
        <div className="space-y-2">
          {services.length === 0 && !isAdding && (
            <div className="text-center py-6">
              <Scissors className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-xs text-gray-500">No services yet. Add your first service above.</p>
            </div>
          )}

          {services.map((service) => (
            <motion.div
              key={service.id}
              layout
              className="flex items-center gap-3 p-3 rounded-lg border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all group"
            >
              <div className={`w-1 h-10 rounded-full shrink-0 ${service.is_paid && Number(service.price) > 0 ? 'bg-green-500/50' : 'bg-teal-500/50'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium truncate">{service.name}</span>
                  {service.is_paid && Number(service.price) > 0 ? (
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/30 flex items-center gap-0.5">
                      <DollarSign className="w-2.5 h-2.5" />
                      {Number(service.price).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded-full">
                      Free
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {service.duration_minutes} min
                  </span>
                  {service.description && (
                    <span className="text-xs text-gray-600 truncate">{service.description}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingService({ ...service, business_profile_id: businessProfileId })}
                  className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => service.id && handleDeleteService(service.id)}
                  disabled={deletingId === service.id}
                  className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  {deletingId === service.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
