"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Link2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Check,
  Loader2,
  Globe,
  Building2,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  ExternalLink,
  Copy,
  Palette,
  Sun,
  Moon,
  Camera,
  X,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import {
  saveBusinessProfile,
  checkSlugAvailability,
  getAllBusinessProfiles,
  uploadBusinessLogo,
  deleteBusinessProfileById,
} from "@/app/dashboard/actions";
import { toast } from "sonner";
import { BookingLinksList } from "./booking-links-list";

type SetupStep = "list" | "ready" | "photo" | "details" | "theme" | "preview";

const STEPS: SetupStep[] = [
  "list",
  "ready",
  "photo",
  "details",
  "theme",
  "preview",
];

interface BusinessFormData {
  id?: string;
  business_name: string;
  address: string;
  phone_number: string;
  email: string;
  logo_url: string;
  booking_slug: string;
  theme_color: string;
  accent_color: string;
  dark_mode: boolean;
}

const THEME_PRESETS = [
  { name: "Midnight", bg: "#000000", accent: "#ffffff", dark: true },
  { name: "Snow", bg: "#ffffff", accent: "#000000", dark: false },
  { name: "Ocean", bg: "#0c1222", accent: "#3b82f6", dark: true },
  { name: "Forest", bg: "#0a1a0f", accent: "#22c55e", dark: true },
  { name: "Sunset", bg: "#1a0a0a", accent: "#f97316", dark: true },
  { name: "Lavender", bg: "#f5f0ff", accent: "#8b5cf6", dark: false },
  { name: "Rose", bg: "#1a0a10", accent: "#f43f5e", dark: true },
  { name: "Gold", bg: "#0f0d08", accent: "#eab308", dark: true },
];

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://8635323e-47c7-41fe-b02a-927e6f46c4fc.canvases.tempo.build";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
  }),
};

export function BookingLinkSetup() {
  const [step, setStep] = useState<SetupStep>("list");
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<BusinessFormData>({
    business_name: "",
    address: "",
    phone_number: "",
    email: "",
    logo_url: "",
    booking_slug: "",
    theme_color: "#000000",
    accent_color: "#ffffff",
    dark_mode: true,
  });

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const profiles = await getAllBusinessProfiles();
        if (profiles && profiles.length > 0) {
          setStep("list");
        } else {
          setStep("ready");
        }
      } catch {
        setStep("ready");
      } finally {
        setIsLoading(false);
      }
    };
    loadProfiles();
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
      booking_slug:
        prev.booking_slug === generateSlug(prev.business_name) ||
        !prev.booking_slug
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

  const goToStep = (nextStep: SetupStep) => {
    const currentIndex = STEPS.indexOf(step);
    const nextIndex = STEPS.indexOf(nextStep);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setStep(nextStep);
  };

  const handleEditProfile = (profile: any) => {
    setExistingProfile(profile);
    setFormData({
      id: profile.id,
      business_name: profile.business_name || "",
      address: profile.address || "",
      phone_number: profile.phone_number || "",
      email: profile.email || "",
      logo_url: profile.logo_url || "",
      booking_slug: profile.booking_slug || "",
      theme_color: profile.theme_color || "#000000",
      accent_color: profile.accent_color || "#ffffff",
      dark_mode: profile.dark_mode ?? true,
    });
    if (profile.logo_url) setPreviewImage(profile.logo_url);
    setSlugAvailable(true);
    goToStep("photo");
  };

  const handleCreateNew = () => {
    setExistingProfile(null);
    setFormData({
      business_name: "",
      address: "",
      phone_number: "",
      email: "",
      logo_url: "",
      booking_slug: "",
      theme_color: "#000000",
      accent_color: "#ffffff",
      dark_mode: true,
    });
    setPreviewImage(null);
    setSlugAvailable(null);
    goToStep("ready");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setPreviewImage(localUrl);

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const publicUrl = await uploadBusinessLogo(fd);
      setFormData((prev) => ({ ...prev, logo_url: publicUrl }));
      setPreviewImage(publicUrl);
      toast.success("Photo uploaded!");
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
      setPreviewImage(formData.logo_url || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewImage(null);
    setFormData((prev) => ({ ...prev, logo_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
        id: formData.id,
        business_name: formData.business_name,
        address: formData.address || undefined,
        phone_number: formData.phone_number || undefined,
        email: formData.email || undefined,
        logo_url: formData.logo_url || undefined,
        booking_slug: formData.booking_slug,
        theme_color: formData.theme_color,
        accent_color: formData.accent_color,
        dark_mode: formData.dark_mode,
      });
      toast.success(
        formData.id
          ? "Booking page updated successfully!"
          : "Booking page created successfully!",
      );
      goToStep("list");
    } catch (error: any) {
      toast.error(error.message || "Failed to save booking page");
    } finally {
      setIsSaving(false);
    }
  };

  const bookingUrl = `${SITE_URL}/book/${formData.booking_slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    setDirection(-1);
    setStep("photo");
  };

  const handleBackToList = () => {
    goToStep("list");
  };

  const stepIndex = STEPS.indexOf(step);
  const totalFormSteps = STEPS.length - 1;
  const currentFormStep = stepIndex;

  if (isLoading) {
    return (
      <div className="min-h-[500px] rounded-xl border border-white/10 bg-white/5 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[500px]">
      {/* Progress Bar */}
      {step !== "ready" && step !== "list" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {["Photo", "Details", "Theme", "Preview"].map((label, idx) => {
                const isActive = currentFormStep >= idx + 2;
                const isCurrent = currentFormStep === idx + 2;
                return (
                  <button
                    key={label}
                    onClick={() => goToStep(STEPS[idx + 2])}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isCurrent
                        ? "bg-white text-black"
                        : isActive
                          ? "bg-white/20 text-white"
                          : "bg-white/5 text-gray-500"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? "bg-black text-white"
                          : isActive
                            ? "bg-white/20 text-white"
                            : "bg-white/10 text-gray-500"
                      }`}
                    >
                      {isActive && currentFormStep > idx + 2 ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        idx + 1
                      )}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              animate={{
                width: `${(currentFormStep / totalFormSteps) * 100}%`,
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        {/* STEP 0: List View */}
        {step === "list" && (
          <motion.div
            key="list"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <BookingLinksList
              onEdit={handleEditProfile}
              onCreateNew={handleCreateNew}
            />
          </motion.div>
        )}
        {/* STEP 1: Ready */}
        {step === "ready" && (
          <motion.div
            key="ready"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-[500px] rounded-xl border border-white/10 bg-white/5 p-8 flex flex-col items-center justify-center text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.1,
                type: "spring",
                stiffness: 200,
                damping: 20,
              }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-6"
            >
              <Link2 className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-white tracking-tight mb-3"
            >
              Create Your Booking Page
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-400 max-w-md mb-8 leading-relaxed"
            >
              Set up a personalized booking page with your brand, colors, and
              style. Customers can book appointments directly from a link you
              share.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            >
              {existingProfile && (
                <Button
                  variant="ghost"
                  onClick={handleBackToList}
                  className="text-gray-400 hover:text-white hover:bg-white/5 gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to List
                </Button>
              )}
              <Button
                onClick={() => goToStep("photo")}
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
                <Camera className="w-3.5 h-3.5" /> Upload your logo
              </span>
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" /> Customize theme
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Unique URL
              </span>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 2: Photo Upload */}
        {step === "photo" && (
          <motion.div
            key="photo"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl border border-white/10 bg-white/5 p-8"
          >
            <div className="max-w-lg mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                  Upload Your Store Photo
                </h2>
                <p className="text-gray-400 text-sm mb-8">
                  Add your logo or a photo of your store. This will be displayed
                  on your booking page.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative mx-auto w-48 h-48 mb-8"
              >
                {previewImage ? (
                  <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white/20 group">
                    <img
                      src={previewImage}
                      alt="Store photo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <Camera className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={handleRemovePhoto}
                        className="p-2 rounded-full bg-white/20 hover:bg-red-500/50 transition-colors"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 transition-colors flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
                      <Upload className="w-7 h-7 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                      Click to upload
                    </span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-gray-500 mb-8"
              >
                JPG, PNG, GIF, or WebP — Max 5MB
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center justify-center gap-3"
              >
                <Button
                  variant="ghost"
                  onClick={() => goToStep(existingProfile ? "list" : "ready")}
                  className="text-gray-400 hover:text-white hover:bg-white/5 gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button
                  onClick={() => goToStep("details")}
                  className="h-11 px-8 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-all active:scale-[0.98]"
                >
                  {previewImage ? "Next" : "Skip for now"}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Business Details */}
        {step === "details" && (
          <motion.div
            key="details"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl border border-white/10 bg-white/5 p-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                Business Details
              </h2>
              <p className="text-gray-400 text-sm">
                Tell your customers about your business.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid gap-5 sm:grid-cols-2 mb-6"
            >
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

              <div className="space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                  Address
                </Label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="e.g. 123 Main St, Brooklyn, NY"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/20 focus:ring-white/10 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  Phone Number
                </Label>
                <Input
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone_number: e.target.value,
                    }))
                  }
                  placeholder="e.g. (555) 123-4567"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/20 focus:ring-white/10 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-500" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="e.g. hello@freshcuts.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/20 focus:ring-white/10 h-11"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <Label className="text-gray-300 text-sm flex items-center gap-2 mb-2">
                <Globe className="w-3.5 h-3.5 text-gray-500" />
                Booking URL <span className="text-red-400">*</span>
              </Label>
              <div className="flex items-center gap-0 rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                <span className="px-3 py-2.5 text-sm text-gray-500 bg-white/5 border-r border-white/10 whitespace-nowrap font-mono text-xs">
                  .../book/
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
                  {!slugChecking &&
                    slugAvailable === true &&
                    formData.booking_slug && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  {!slugChecking && slugAvailable === false && (
                    <span className="text-xs text-red-400 whitespace-nowrap">
                      Taken
                    </span>
                  )}
                </div>
              </div>
              {formData.booking_slug && slugAvailable && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-2 text-xs text-gray-500 mt-2 font-mono"
                >
                  <ExternalLink className="w-3 h-3" />
                  {bookingUrl}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between"
            >
              <Button
                variant="ghost"
                onClick={() => goToStep("photo")}
                className="text-gray-400 hover:text-white hover:bg-white/5 gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={() => goToStep("theme")}
                disabled={!formData.business_name || !formData.booking_slug}
                className="h-11 px-8 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Next: Customize Theme
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 4: Theme Customization */}
        {step === "theme" && (
          <motion.div
            key="theme"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-xl border border-white/10 bg-white/5 p-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-bold text-white tracking-tight mb-2">
                Customize Your Theme
              </h2>
              <p className="text-gray-400 text-sm">
                Choose a color scheme that matches your brand.
              </p>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <p className="text-sm text-gray-400 mb-3 font-medium">
                    Presets
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {THEME_PRESETS.map((preset) => {
                      const isSelected =
                        formData.theme_color === preset.bg &&
                        formData.accent_color === preset.accent;
                      return (
                        <button
                          key={preset.name}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              theme_color: preset.bg,
                              accent_color: preset.accent,
                              dark_mode: preset.dark,
                            }))
                          }
                          className={`relative rounded-xl p-3 border transition-all text-center ${
                            isSelected
                              ? "border-white/40 bg-white/10 ring-1 ring-white/20"
                              : "border-white/10 bg-white/5 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5 mb-1.5">
                            <div
                              className="w-5 h-5 rounded-full border border-white/20"
                              style={{ backgroundColor: preset.bg }}
                            />
                            <div
                              className="w-5 h-5 rounded-full border border-white/20"
                              style={{ backgroundColor: preset.accent }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {preset.name}
                          </span>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-black" />
                            </motion.div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-gray-400 font-medium">
                    Custom Colors
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">
                        Background
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.theme_color}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              theme_color: e.target.value,
                            }))
                          }
                          className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                        />
                        <Input
                          value={formData.theme_color}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              theme_color: e.target.value,
                            }))
                          }
                          className="bg-white/5 border-white/10 text-white font-mono text-xs h-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-400 text-xs">Accent</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.accent_color}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              accent_color: e.target.value,
                            }))
                          }
                          className="w-10 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer"
                        />
                        <Input
                          value={formData.accent_color}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              accent_color: e.target.value,
                            }))
                          }
                          className="bg-white/5 border-white/10 text-white font-mono text-xs h-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3">
                    {formData.dark_mode ? (
                      <Moon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Sun className="w-5 h-5 text-yellow-400" />
                    )}
                    <div>
                      <p className="text-sm text-white font-medium">
                        {formData.dark_mode ? "Dark Mode" : "Light Mode"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Toggle page appearance
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        dark_mode: !prev.dark_mode,
                      }))
                    }
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      formData.dark_mode ? "bg-white/20" : "bg-white/40"
                    }`}
                  >
                    <motion.div
                      animate={{ x: formData.dark_mode ? 22 : 2 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
                    />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
                  Preview
                </p>
                <div
                  className="rounded-xl border border-white/10 overflow-hidden transition-colors duration-300"
                  style={{ backgroundColor: formData.theme_color }}
                >
                  <div className="p-6 min-h-[320px] flex flex-col items-center justify-center text-center">
                    {previewImage ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden mb-4 border border-white/10 shadow-lg">
                        <img
                          src={previewImage}
                          alt="Logo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 border"
                        style={{
                          borderColor: `${formData.accent_color}30`,
                          backgroundColor: `${formData.accent_color}15`,
                        }}
                      >
                        <Building2
                          className="w-7 h-7"
                          style={{ color: formData.accent_color }}
                        />
                      </div>
                    )}

                    <h3
                      className="text-xl font-bold tracking-tight"
                      style={{
                        color: formData.dark_mode ? "#ffffff" : "#000000",
                      }}
                    >
                      {formData.business_name || "Your Business"}
                    </h3>

                    {formData.address && (
                      <p
                        className="text-xs mt-1"
                        style={{
                          color: formData.dark_mode
                            ? "rgba(255,255,255,0.5)"
                            : "rgba(0,0,0,0.5)",
                        }}
                      >
                        {formData.address}
                      </p>
                    )}

                    <div className="mt-6 w-full max-w-[220px]">
                      <div
                        className="h-11 rounded-full flex items-center justify-center font-medium text-sm transition-colors duration-300"
                        style={{
                          backgroundColor: formData.accent_color,
                          color: formData.dark_mode
                            ? formData.theme_color
                            : "#ffffff",
                        }}
                      >
                        Book Appointment
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      {formData.phone_number && (
                        <span
                          className="text-xs font-mono"
                          style={{
                            color: formData.dark_mode
                              ? "rgba(255,255,255,0.4)"
                              : "rgba(0,0,0,0.4)",
                          }}
                        >
                          {formData.phone_number}
                        </span>
                      )}
                      {formData.email && (
                        <span
                          className="text-xs"
                          style={{
                            color: formData.dark_mode
                              ? "rgba(255,255,255,0.4)"
                              : "rgba(0,0,0,0.4)",
                          }}
                        >
                          {formData.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between mt-6"
            >
              <Button
                variant="ghost"
                onClick={() => goToStep("details")}
                className="text-gray-400 hover:text-white hover:bg-white/5 gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={() => goToStep("preview")}
                className="h-11 px-8 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                Next: Preview & Publish
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 5: Full Preview & Publish */}
        {step === "preview" && (
          <motion.div
            key="preview"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-between"
            >
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight mb-1">
                  Your Booking Page
                </h2>
                <p className="text-gray-400 text-sm">
                  Here&apos;s how it will look. Save to publish!
                </p>
              </div>
              <div className="flex items-center gap-2">
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
                {existingProfile && formData.booking_slug && (
                  <a
                    href={`/book/${formData.booking_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-white/5 gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Page
                    </Button>
                  </a>
                )}
              </div>
            </motion.div>

            {/* Full page preview in a browser frame */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-white/10 overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white/10 rounded-md px-3 py-1.5 text-xs text-gray-400 font-mono truncate">
                    {bookingUrl}
                  </div>
                </div>
              </div>

              <div
                className="transition-colors duration-500"
                style={{ backgroundColor: formData.theme_color }}
              >
                <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                  {previewImage ? (
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="w-24 h-24 rounded-2xl overflow-hidden mb-6 shadow-2xl"
                      style={{
                        boxShadow: `0 20px 60px ${formData.accent_color}20`,
                      }}
                    >
                      <img
                        src={previewImage}
                        alt="Business"
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ) : (
                    <div
                      className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 border"
                      style={{
                        borderColor: `${formData.accent_color}30`,
                        backgroundColor: `${formData.accent_color}10`,
                      }}
                    >
                      <Building2
                        className="w-10 h-10"
                        style={{ color: formData.accent_color }}
                      />
                    </div>
                  )}

                  <h1
                    className="text-3xl font-bold tracking-tight mb-2"
                    style={{
                      color: formData.dark_mode ? "#ffffff" : "#0a0a0a",
                    }}
                  >
                    {formData.business_name || "Your Business Name"}
                  </h1>

                  {formData.address && (
                    <p
                      className="text-sm mb-4"
                      style={{
                        color: formData.dark_mode
                          ? "rgba(255,255,255,0.5)"
                          : "rgba(0,0,0,0.5)",
                      }}
                    >
                      <MapPin
                        className="w-3.5 h-3.5 inline mr-1"
                        style={{
                          color: formData.dark_mode
                            ? "rgba(255,255,255,0.3)"
                            : "rgba(0,0,0,0.3)",
                        }}
                      />
                      {formData.address}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mb-8">
                    {formData.phone_number && (
                      <span
                        className="text-sm font-mono flex items-center gap-1"
                        style={{
                          color: formData.dark_mode
                            ? "rgba(255,255,255,0.4)"
                            : "rgba(0,0,0,0.4)",
                        }}
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {formData.phone_number}
                      </span>
                    )}
                    {formData.email && (
                      <span
                        className="text-sm flex items-center gap-1"
                        style={{
                          color: formData.dark_mode
                            ? "rgba(255,255,255,0.4)"
                            : "rgba(0,0,0,0.4)",
                        }}
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {formData.email}
                      </span>
                    )}
                  </div>

                  <div
                    className="w-full max-w-sm rounded-2xl p-6 border"
                    style={{
                      backgroundColor: formData.dark_mode
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.03)",
                      borderColor: formData.dark_mode
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(0,0,0,0.1)",
                    }}
                  >
                    <p
                      className="text-sm font-medium mb-4"
                      style={{
                        color: formData.dark_mode
                          ? "rgba(255,255,255,0.8)"
                          : "rgba(0,0,0,0.8)",
                      }}
                    >
                      Book an Appointment
                    </p>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {["Mon", "Tue", "Wed"].map((day, i) => (
                        <div
                          key={day}
                          className="rounded-lg py-2 text-center text-xs font-medium border transition-colors"
                          style={{
                            backgroundColor:
                              i === 1
                                ? formData.accent_color
                                : formData.dark_mode
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(0,0,0,0.05)",
                            borderColor:
                              i === 1
                                ? formData.accent_color
                                : formData.dark_mode
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(0,0,0,0.1)",
                            color:
                              i === 1
                                ? formData.dark_mode
                                  ? formData.theme_color
                                  : "#ffffff"
                                : formData.dark_mode
                                  ? "rgba(255,255,255,0.6)"
                                  : "rgba(0,0,0,0.6)",
                          }}
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {["10:00 AM", "11:30 AM", "2:00 PM", "3:30 PM"].map(
                        (time, i) => (
                          <div
                            key={time}
                            className="rounded-lg py-1.5 text-center text-xs border"
                            style={{
                              backgroundColor:
                                i === 2
                                  ? `${formData.accent_color}20`
                                  : formData.dark_mode
                                    ? "rgba(255,255,255,0.03)"
                                    : "rgba(0,0,0,0.02)",
                              borderColor:
                                i === 2
                                  ? `${formData.accent_color}40`
                                  : formData.dark_mode
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(0,0,0,0.08)",
                              color: formData.dark_mode
                                ? "rgba(255,255,255,0.6)"
                                : "rgba(0,0,0,0.6)",
                            }}
                          >
                            {time}
                          </div>
                        ),
                      )}
                    </div>

                    <div
                      className="h-11 rounded-full flex items-center justify-center font-medium text-sm"
                      style={{
                        backgroundColor: formData.accent_color,
                        color: formData.dark_mode
                          ? formData.theme_color
                          : "#ffffff",
                      }}
                    >
                      Confirm Booking
                    </div>
                  </div>

                  <p
                    className="text-xs mt-6"
                    style={{
                      color: formData.dark_mode
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(0,0,0,0.2)",
                    }}
                  >
                    Powered by NumSphere
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between"
            >
              <Button
                variant="ghost"
                onClick={() => goToStep("theme")}
                className="text-gray-400 hover:text-white hover:bg-white/5 gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  isSaving ||
                  !formData.business_name ||
                  !formData.booking_slug ||
                  slugAvailable === false
                }
                className="h-12 px-10 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : existingProfile ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Update & Publish
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Publish Booking Page
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
