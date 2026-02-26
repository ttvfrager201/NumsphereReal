"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Phone,
    MessageSquare,
    ArrowRight,
    ArrowLeft,
    Check,
    Copy,
    Loader2,
    Zap,
    PhoneCall,
    CheckCircle2,
    Sparkles,
    PhoneForwarded,
    Hash,
    Signal,
    Edit3,
    Info,
    Link2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "../../../supabase/client";
import { cn } from "@/lib/utils";

const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://numsphere.app";

interface CallForwardingConfig {
    id?: string;
    user_id?: string;
    twilio_number?: string | null;
    twilio_number_sid?: string | null;
    forward_to_number?: string | null;
    sms_message_template?: string | null;
    booking_slug?: string | null;
    is_active?: boolean;
}

type Step = "start" | "forward_number" | "sms_message" | "complete";

const STEPS: Step[] = ["start", "forward_number", "sms_message", "complete"];

export function MissedCallSetup() {
    const [step, setStep] = useState<Step>("start");
    const [config, setConfig] = useState<CallForwardingConfig>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // Form fields
    const [forwardNumber, setForwardNumber] = useState("");
    const [smsMessage, setSmsMessage] = useState(
        "Hey! Sorry I missed your call. Here's my booking link so you can grab a time that works: [LINK]"
    );
    const [bookingSlug, setBookingSlug] = useState("");
    const [twilioNumber, setTwilioNumber] = useState("");

    const supabase = createClient();

    useEffect(() => {
        loadConfig();
    }, []);

    async function loadConfig() {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            const { data: existingConfig } = await supabase
                .from("call_forwarding_configs")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (existingConfig) {
                setConfig(existingConfig);
                setForwardNumber(existingConfig.forward_to_number || "");
                setSmsMessage(
                    existingConfig.sms_message_template ||
                    "Hey! Sorry I missed your call. Here's my booking link so you can grab a time that works: [LINK]"
                );
                setBookingSlug(existingConfig.booking_slug || "");
                setTwilioNumber(existingConfig.twilio_number || "");
                if (existingConfig.twilio_number) {
                    setStep("complete");
                } else if (existingConfig.forward_to_number) {
                    setStep("sms_message");
                } else {
                    setStep("start");
                }
            }
        } catch (err) {
            console.error("Failed to load config", err);
        } finally {
            setLoading(false);
        }
    }

    async function saveConfig(updates: Partial<CallForwardingConfig>) {
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const merged = { ...config, ...updates, user_id: user.id };

        const { data, error } = await supabase
            .from("call_forwarding_configs")
            .upsert(
                {
                    user_id: user.id,
                    forward_to_number: merged.forward_to_number ?? forwardNumber,
                    sms_message_template: merged.sms_message_template ?? smsMessage,
                    booking_slug: merged.booking_slug ?? bookingSlug ?? null,
                    twilio_number: merged.twilio_number ?? null,
                    twilio_number_sid: merged.twilio_number_sid ?? null,
                    is_active: true,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id" }
            )
            .select()
            .single();

        if (error) throw new Error(error.message);
        if (data) setConfig(data);
        return data;
    }

    const handleNext = async () => {
        setSaving(true);
        try {
            if (step === "start") {
                setStep("forward_number");
            } else if (step === "forward_number") {
                if (!forwardNumber.trim()) {
                    toast.error("Please enter a phone number to forward calls to");
                    return;
                }
                await saveConfig({ forward_to_number: forwardNumber });
                setStep("sms_message");
            } else if (step === "sms_message") {
                await saveConfig({
                    sms_message_template: smsMessage,
                    booking_slug: bookingSlug || null,
                });
                setStep("complete");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        const idx = STEPS.indexOf(step);
        if (idx > 0) setStep(STEPS[idx - 1]);
    };

    const handleSaveTwilio = async () => {
        if (!twilioNumber.trim()) {
            toast.error("Please enter your Twilio number");
            return;
        }
        setSaving(true);
        try {
            await saveConfig({ twilio_number: twilioNumber });
            toast.success("Twilio number saved!");
        } catch (err: any) {
            toast.error(err.message || "Failed to save Twilio number");
        } finally {
            setSaving(false);
        }
    };

    const handleReconfigure = () => {
        setStep("start");
        setConfig({});
        setForwardNumber("");
        setSmsMessage(
            "Hey! Sorry I missed your call. Here's my booking link so you can grab a time that works: [LINK]"
        );
        setBookingSlug("");
        setTwilioNumber("");
    };

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(null), 2000);
    };

    // Build SMS preview replacing [LINK] with actual URL or slug
    const smsPreview = (() => {
        let preview = smsMessage;
        const slug = bookingSlug || config.booking_slug;
        if (slug) {
            const url = `${SITE_URL}/book/${slug}`;
            preview = preview.replace(/\[LINK\]/g, url);
            preview = preview.replace(/\[slug\]/g, slug);
        } else {
            preview = preview.replace(/\[LINK\]/g, "[your-booking-link]");
            preview = preview.replace(/\[slug\]/g, "[your-slug]");
        }
        return preview;
    })();

    const activeTwilio = config.twilio_number || twilioNumber;
    const forwardCode = activeTwilio
        ? `*72${activeTwilio.replace(/\D/g, "")}`
        : "*72[twilio-number]";

    // Step index for progress bar (forward_number=0, sms_message=1, complete=2)
    const progressSteps = ["forward_number", "sms_message", "complete"] as const;
    const currentProgressIdx = progressSteps.indexOf(step as any);

    if (loading) {
        return (
            <div className="min-h-[480px] rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">

            {/* ── Progress bar (hidden on start) ─────────────────────── */}
            {step !== "start" && (
                <div className="px-8 pt-8 pb-0">
                    <div className="flex items-center gap-3 mb-8">
                        {[
                            { key: "forward_number", label: "Forward Number" },
                            { key: "sms_message", label: "SMS Message" },
                            { key: "complete", label: "Your Number" },
                        ].map(({ key, label }, idx) => {
                            const isDone = currentProgressIdx > idx;
                            const isCurrent = currentProgressIdx === idx;
                            return (
                                <div key={key} className="flex items-center gap-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn(
                                                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300",
                                                isDone
                                                    ? "bg-green-500 text-white"
                                                    : isCurrent
                                                        ? "bg-white text-black"
                                                        : "bg-white/10 text-gray-500"
                                            )}
                                        >
                                            {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                                        </div>
                                        <span
                                            className={cn(
                                                "text-xs font-medium hidden sm:block",
                                                isCurrent ? "text-white" : isDone ? "text-green-400" : "text-gray-600"
                                            )}
                                        >
                                            {label}
                                        </span>
                                    </div>
                                    {idx < 2 && (
                                        <div
                                            className={cn(
                                                "h-px flex-1 transition-all duration-500 ml-2",
                                                isDone ? "bg-green-500/50" : "bg-white/10"
                                            )}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Step Content ────────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="p-8"
                >

                    {/* ─── START ─────────────────────────────────────── */}
                    {step === "start" && (
                        <div className="flex flex-col items-center text-center max-w-xl mx-auto py-10">
                            {/* Icon */}
                            <div className="relative mb-8">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 flex items-center justify-center">
                                    <PhoneCall className="w-10 h-10 text-amber-400" />
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                                    <MessageSquare className="w-3 h-3 text-white" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                                Missed Call Text-Back
                            </h2>
                            <p className="text-gray-400 leading-relaxed mb-10 max-w-md">
                                Never lose a customer from a missed call again. Set up automatic SMS
                                replies that include your booking link — turning missed calls into
                                confirmed appointments.
                            </p>

                            {/* How it works */}
                            <div className="w-full grid grid-cols-3 gap-4 mb-10">
                                {[
                                    {
                                        icon: PhoneForwarded,
                                        color: "text-amber-400",
                                        bg: "bg-amber-500/10 border-amber-500/20",
                                        title: "Forward Calls",
                                        desc: "Your Twilio number rings your real phone",
                                    },
                                    {
                                        icon: MessageSquare,
                                        color: "text-teal-400",
                                        bg: "bg-teal-500/10 border-teal-500/20",
                                        title: "Auto Text-Back",
                                        desc: "Miss it? Customer gets your booking link instantly",
                                    },
                                    {
                                        icon: CheckCircle2,
                                        color: "text-green-400",
                                        bg: "bg-green-500/10 border-green-500/20",
                                        title: "Get Booked",
                                        desc: "They book directly from the SMS — no call needed",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.title}
                                        className={cn("rounded-xl border bg-white/5 p-4 text-left", item.bg)}
                                    >
                                        <div className="w-9 h-9 rounded-lg bg-black/20 flex items-center justify-center mb-3">
                                            <item.icon className={cn("w-4 h-4", item.color)} />
                                        </div>
                                        <p className="text-white text-sm font-semibold mb-1">{item.title}</p>
                                        <p className="text-gray-500 text-[11px] leading-relaxed">{item.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <Button
                                onClick={handleNext}
                                className="h-13 px-10 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-all active:scale-[0.98] gap-2.5 text-sm shadow-lg shadow-white/10"
                            >
                                <Sparkles className="w-4 h-4" />
                                Get Started
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* ─── STEP 1: Forward Number ────────────────────── */}
                    {step === "forward_number" && (
                        <div className="max-w-md mx-auto">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                    <Phone className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">
                                        Where should calls ring?
                                    </h2>
                                    <p className="text-sm text-gray-400">
                                        Enter the number that customers will be forwarded to
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                                        Your Phone Number
                                    </label>
                                    <Input
                                        type="tel"
                                        placeholder="+1 (555) 123-4567"
                                        value={forwardNumber}
                                        onChange={(e) => setForwardNumber(e.target.value)}
                                        className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/30 focus:ring-0 rounded-xl font-mono text-base"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        This is your actual business or mobile number — customers' calls will be forwarded here.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
                                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-300/80 leading-relaxed">
                                        You'll get a Twilio number in the final step. Share that number with customers —
                                        it forwards to this number and auto-texts anyone you miss.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-8">
                                <Button
                                    onClick={handleBack}
                                    variant="ghost"
                                    className="text-gray-400 hover:text-white gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={saving || !forwardNumber.trim()}
                                    className="h-11 px-7 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-all active:scale-[0.98] gap-2 disabled:opacity-40"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Next
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 2: SMS Message ───────────────────────── */}
                    {step === "sms_message" && (
                        <div className="max-w-lg mx-auto">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-5 h-5 text-teal-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">
                                        What should the text say?
                                    </h2>
                                    <p className="text-sm text-gray-400">
                                        Customize the SMS sent to missed callers
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Message textarea */}
                                <div>
                                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                                        Message
                                    </label>
                                    <Textarea
                                        placeholder="Hey! Sorry I missed your call..."
                                        value={smsMessage}
                                        onChange={(e) => setSmsMessage(e.target.value)}
                                        rows={4}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/30 focus:ring-0 rounded-xl resize-none text-sm leading-relaxed"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        Use{" "}
                                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">
                                            [LINK]
                                        </code>{" "}
                                        to insert your full booking URL.
                                    </p>
                                </div>

                                {/* Booking Slug */}
                                <div>
                                    <label className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                        <Link2 className="w-3.5 h-3.5 text-gray-400" />
                                        Booking Link Slug{" "}
                                        <span className="text-gray-500 font-normal text-xs">(optional)</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-gray-500 font-mono text-sm flex items-center shrink-0">
                                            /book/
                                        </div>
                                        <Input
                                            placeholder="your-booking-slug"
                                            value={bookingSlug}
                                            onChange={(e) =>
                                                setBookingSlug(
                                                    e.target.value.toLowerCase().replace(/\s+/g, "-")
                                                )
                                            }
                                            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/30 focus:ring-0 rounded-xl font-mono"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        This is the slug from your booking link page — the{" "}
                                        <code className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono">
                                            [LINK]
                                        </code>{" "}
                                        token will become the full URL.
                                    </p>
                                </div>

                                {/* SMS Preview */}
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-3">
                                        Preview
                                    </p>
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 shrink-0 flex items-center justify-center">
                                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        </div>
                                        <div className="bg-[#1c1c1e] border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 max-w-xs">
                                            <p className="text-white text-sm leading-relaxed break-words">
                                                {smsPreview}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-8">
                                <Button
                                    onClick={handleBack}
                                    variant="ghost"
                                    className="text-gray-400 hover:text-white gap-2"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNext}
                                    disabled={saving || !smsMessage.trim()}
                                    className="h-11 px-7 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-all active:scale-[0.98] gap-2 disabled:opacity-40"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            Finish Setup
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 3: Complete ──────────────────────────── */}
                    {step === "complete" && (
                        <div className="max-w-lg mx-auto">
                            {/* Success header */}
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">
                                    Setup Complete!
                                </h2>
                                <p className="text-gray-400 text-sm">
                                    Enter your Twilio number below and activate call forwarding.
                                </p>
                            </div>

                            {/* Config summary */}
                            <div className="space-y-2 mb-6">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                                                Forwarding to
                                            </p>
                                            <p className="text-white font-mono text-sm">
                                                {config.forward_to_number || forwardNumber || "—"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStep("forward_number")}
                                        className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                                                SMS Message
                                            </p>
                                            <p className="text-white text-sm truncate max-w-sm">
                                                {config.sms_message_template || smsMessage}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStep("sms_message")}
                                        className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 ml-3 shrink-0"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Twilio Number Box */}
                            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/8 via-orange-500/5 to-transparent p-6 mb-5">
                                <div className="flex items-center gap-2 mb-5">
                                    <Signal className="w-4 h-4 text-amber-400" />
                                    <p className="text-amber-300 text-sm font-semibold uppercase tracking-wider">
                                        Your Twilio Number
                                    </p>
                                </div>

                                {config.twilio_number ? (
                                    /* — already saved — */
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="flex-1 h-14 bg-black/40 rounded-xl border border-amber-500/20 flex items-center px-4">
                                            <span className="text-white font-mono text-xl font-bold tracking-wider">
                                                {config.twilio_number}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={() => copyToClipboard(config.twilio_number!, "twilio")}
                                            variant="ghost"
                                            className="h-14 px-4 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/5"
                                        >
                                            {copied === "twilio" ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    /* — not yet saved — */
                                    <div className="mb-5">
                                        <p className="text-amber-300/70 text-xs mb-3 leading-relaxed">
                                            Paste your Twilio number here. Get one from{" "}
                                            <a
                                                href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-amber-300 underline underline-offset-2"
                                            >
                                                twilio.com/console
                                            </a>
                                            .
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="tel"
                                                placeholder="+1 (555) 000-0001"
                                                value={twilioNumber}
                                                onChange={(e) => setTwilioNumber(e.target.value)}
                                                className="h-12 bg-black/40 border-amber-500/20 text-white placeholder:text-gray-600 focus:border-amber-500/40 focus:ring-0 rounded-xl font-mono flex-1"
                                            />
                                            <Button
                                                onClick={handleSaveTwilio}
                                                disabled={saving || !twilioNumber.trim()}
                                                className="h-12 px-5 rounded-xl bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-all shrink-0 disabled:opacity-50"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Activation instructions */}
                                <div className="border-t border-amber-500/15 pt-5">
                                    <p className="text-amber-300/80 text-xs font-semibold uppercase tracking-wider mb-4">
                                        Activate Call Forwarding
                                    </p>
                                    <div className="space-y-3">
                                        {[
                                            {
                                                n: "1",
                                                text: "Open your phone's dialer app",
                                                code: null,
                                            },
                                            {
                                                n: "2",
                                                text: "Dial this forwarding code and press Call:",
                                                code: forwardCode,
                                                codeKey: "code",
                                            },
                                            {
                                                n: "3",
                                                text: "Wait for a confirmation tone — done!",
                                                code: null,
                                            },
                                            {
                                                n: "4",
                                                text: "Give your Twilio number to customers. Any call you miss will automatically text them your booking link.",
                                                code: null,
                                            },
                                        ].map((item) => (
                                            <div key={item.n} className="flex gap-3">
                                                <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold text-amber-300 shrink-0 mt-0.5">
                                                    {item.n}
                                                </span>
                                                <div className="flex-1">
                                                    <span className="text-gray-300 text-sm">{item.text}</span>
                                                    {item.code && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <code className="bg-black/50 border border-amber-500/30 text-amber-300 font-mono text-lg font-bold px-4 py-2 rounded-xl">
                                                                {item.code}
                                                            </code>
                                                            <button
                                                                onClick={() => copyToClipboard(item.code!, item.codeKey!)}
                                                                className="p-1.5 rounded-lg text-gray-500 hover:text-amber-300 hover:bg-amber-500/10 transition-all"
                                                            >
                                                                {copied === item.codeKey ? (
                                                                    <Check className="w-3.5 h-3.5 text-green-400" />
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* How SMS works */}
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="flex items-start gap-3">
                                    <Zap className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-white mb-1">
                                            How the text-back works
                                        </p>
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            When a call gets missed, it appears in your{" "}
                                            <span className="text-white font-medium">Call Feed</span>.
                                            Click{" "}
                                            <span className="text-white font-medium">"Send Link"</span>{" "}
                                            to instantly text them your booking page — or enable auto-send so it happens automatically.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-5">
                                <Button
                                    onClick={handleReconfigure}
                                    variant="ghost"
                                    className="text-gray-500 hover:text-gray-300 text-xs gap-1"
                                >
                                    <Edit3 className="w-3 h-3" />
                                    Reconfigure
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
