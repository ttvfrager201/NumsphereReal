"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Link2,
  ArrowRight,
  Upload,
  Check,
  Loader2,
  Globe,
  Building2,
  MapPin,
  Phone,
  Mail,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  Copy,
} from "lucide-react";
import { saveBusinessProfile, checkSlugAvailability, getBusinessProfile } from "@/app/dashboard/actions";
import { toast } from "sonner";

type SetupStep = "ready" | "form";

interface BusinessFormData {
  business_name: string;
  address: string;
  phone_number: string;
  email: string;
  logo_url: string;
  booking_slug: string;
}

export function BookingLinkSetup() {
  const [step, setStep] = useState<SetupStep>("ready");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<BusinessFormData>({
    business_name: "",
    address: "",
    phone_number: "",
    email: "",
    logo_url: "",
    booking_slug: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getBusinessProfile();
        if (profile) {
          setExistingProfile(profile);
          setFormData({
            business_name: profile.business_name || "",
            address: profile.address || "",
            phone_number: profile.phone_number || "",
            email: profile.email || "",
            logo_url: profile.logo_url || "",
            booking_slug: profile.booking_slug || "",
          });
          setStep("form");
          setSlugAvailable(true);
        }
      } catch {
        // No profile yet, stay on "ready" step
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }, []);

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      business_name: value,
      booking_slug: prev.booking_slug === generateSlug(prev.business_name) || !prev.booking_slug
        ? generateSlug(value)
        : prev.booking_slug,
    }));
  };

  useEffect(() => {
    if (!formData.booking_slug || formData.booking_slug.length < 2) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const available = await checkSlugAvailability(formData.booking_slug);
        setSlugAvailable(available);
      } catch {
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.booking_slug]);

  const handleSave = async () => {
    if (!formData.business_name || !formData.booking_slug) {
      toast.error("Business name and booking slug are required");
      return;
    }
    if (slugAvailable === false) {
      toast.error("That booking slug is taken. Please choose another.");
      return;
    }

    setIsSaving(true);
    try {
      await saveBusinessProfile({
        business_name: formData.business_name,
        address: formData.address || undefined,
        phone_number: formData.phone_number || undefined,
        email: formData.email || undefined,
        logo_url: formData.logo_url || undefined,
        booking_slug: formData.booking_slug,
      });
      setExistingProfile(formData);
      toast.success("Booking page saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save booking page");
    } finally {
      setIsSaving(false);
    }
  };

  const bookingUrl = `numsphere.online/${formData.booking_slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${bookingUrl}`);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] rounded-xl border border-white/10 bg-white/5 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[400px]">
      <AnimatePresence mode="wait">
        {step === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-[400px] rounded-xl border border-white/10 bg-white/5 p-8 flex flex-col items-center justify-center text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
              className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-6"
            >
              <Link2 className="w-8 h-8 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-white tracking-tight mb-3"
            >
              Ready to make a booking link?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400 max-w-md mb-8 leading-relaxed"
            >
              Set up your personalized booking page so customers can book appointments
              directly — with optional Stripe Express payment.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={() => setStep("form")}
                className="h-12 px-8 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                Let&apos;s Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex items-center gap-6 text-xs text-gray-500"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Custom booking page
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Unique URL
              </span>
            </motion.div>
          </motion.div>
        )}

        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between"
            >
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Customize Your Booking Page
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Fill in your business details to create your personalized page.
                </p>
              </div>
              {existingProfile && (
                <Button
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="text-gray-400 hover:text-white hover:bg-white/5 gap-2"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copy Link
                </Button>
              )}
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Form Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5"
              >
                {/* Business Name */}
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-gray-500" />
                    Business Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    value={formData.business_name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Fresh Cuts Barbershop"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/20 focus:ring-white/10 h-11"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    Address
                  </Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="e.g. 123 Main St, Brooklyn, NY"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/20 focus:ring-white/10 h-11"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-500" />
                    Phone Number
                  </Label>
                  <Input
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone_number: e.target.value }))
                    }
                    placeholder="e.g. (555) 123-4567"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/20 focus:ring-white/10 h-11"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="e.g. hello@freshcuts.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/20 focus:ring-white/10 h-11"
                  />
                </div>

                {/* Logo URL */}
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                    Logo URL
                  </Label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, logo_url: e.target.value }))
                    }
                    placeholder="https://example.com/logo.png"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/20 focus:ring-white/10 h-11"
                  />
                </div>
              </motion.div>

              {/* Slug + Preview Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-6"
              >
                {/* Slug Picker */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
                  <div>
                    <Label className="text-gray-300 text-sm flex items-center gap-2 mb-2">
                      <Globe className="w-3.5 h-3.5 text-gray-500" />
                      Booking Slug <span className="text-red-400">*</span>
                    </Label>
                    <p className="text-xs text-gray-500 mb-3">
                      This is your unique booking URL that customers will visit.
                    </p>
                    <div className="flex items-center gap-0 rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                      <span className="px-3 py-2.5 text-sm text-gray-500 bg-white/5 border-r border-white/10 whitespace-nowrap font-mono text-xs">
                        numsphere.online/
                      </span>
                      <input
                        value={formData.booking_slug}
                        onChange={(e) => {
                          const slug = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "");
                          setFormData((prev) => ({ ...prev, booking_slug: slug }));
                        }}
                        placeholder="your-business"
                        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none font-mono"
                      />
                      <div className="px-3">
                        {slugChecking && (
                          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                        )}
                        {!slugChecking && slugAvailable === true && formData.booking_slug && (
                          <Check className="w-4 h-4 text-green-400" />
                        )}
                        {!slugChecking && slugAvailable === false && (
                          <span className="text-xs text-red-400 whitespace-nowrap">Taken</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {formData.booking_slug && slugAvailable && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="flex items-center gap-2 text-sm text-gray-400"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="font-mono text-xs">
                        https://{bookingUrl}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Live Preview */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Preview
                  </p>
                  <div className="rounded-lg border border-white/10 bg-black/50 p-6 min-h-[200px] flex flex-col items-center justify-center text-center">
                    {formData.logo_url ? (
                      <motion.div
                        key={formData.logo_url}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-14 h-14 rounded-xl overflow-hidden mb-4 border border-white/10"
                      >
                        <img
                          src={formData.logo_url}
                          alt="Logo"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </motion.div>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center mb-4">
                        <Building2 className="w-6 h-6 text-gray-500" />
                      </div>
                    )}

                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {formData.business_name || "Your Business Name"}
                    </h3>

                    {formData.address && (
                      <p className="text-xs text-gray-500 mt-1">{formData.address}</p>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                      {formData.phone_number && (
                        <span className="text-xs text-gray-500 font-mono">
                          {formData.phone_number}
                        </span>
                      )}
                      {formData.email && (
                        <span className="text-xs text-gray-500">{formData.email}</span>
                      )}
                    </div>

                    <div className="mt-5 w-full max-w-[200px]">
                      <div className="h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                        <span className="text-xs text-gray-400">Book Appointment</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between pt-2"
            >
              {!existingProfile && (
                <Button
                  variant="ghost"
                  onClick={() => setStep("ready")}
                  className="text-gray-400 hover:text-white hover:bg-white/5"
                >
                  Back
                </Button>
              )}
              <div className={!existingProfile ? "" : "ml-auto"}>
                <Button
                  onClick={handleSave}
                  disabled={
                    isSaving ||
                    !formData.business_name ||
                    !formData.booking_slug ||
                    slugAvailable === false
                  }
                  className="h-11 px-8 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : existingProfile ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Update Booking Page
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Booking Page
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
