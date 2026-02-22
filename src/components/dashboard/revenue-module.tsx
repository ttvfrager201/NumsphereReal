"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    DollarSign,
    ExternalLink,
    Loader2,
    TrendingUp,
    ArrowUpRight,
    CreditCard,
    Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "../../../supabase/client";
import { toast } from "sonner";

interface RevenueModuleProps {
    totalRevenue: number;
}

interface StripeBalance {
    available: number;
    pending: number;
    currency: string;
}

interface StripeProfile {
    id: string;
    business_name: string;
    stripe_account_id: string;
    payments_enabled: boolean;
}

export function RevenueModule({ totalRevenue }: RevenueModuleProps) {
    const supabase = createClient();
    const [stripeProfiles, setStripeProfiles] = useState<StripeProfile[]>([]);
    const [balances, setBalances] = useState<Record<string, StripeBalance>>({});
    const [payoutLoading, setPayoutLoading] = useState<string | null>(null);
    const [loadingBalances, setLoadingBalances] = useState(true);

    useEffect(() => {
        const loadStripeData = async () => {
            try {
                const { data } = await supabase
                    .from("business_profiles")
                    .select("id, business_name, stripe_account_id, payments_enabled")
                    .not("stripe_account_id", "is", null);

                const profiles = data || [];
                setStripeProfiles(profiles);

                // Load balances for each profile
                const balanceMap: Record<string, StripeBalance> = {};
                for (const profile of profiles) {
                    if (profile.stripe_account_id) {
                        try {
                            const { data: balanceData, error } = await supabase.functions.invoke(
                                "supabase-functions-stripe-connect",
                                {
                                    body: {
                                        action: "get-balance",
                                        stripe_account_id: profile.stripe_account_id,
                                    },
                                }
                            );
                            if (!error && balanceData) {
                                balanceMap[profile.id] = balanceData;
                            }
                        } catch {
                            // Silent fail for balance load
                        }
                    }
                }
                setBalances(balanceMap);
            } catch {
                // Silent fail
            } finally {
                setLoadingBalances(false);
            }
        };
        loadStripeData();
    }, [supabase]);

    const handlePayout = async (profileId: string, stripeAccountId: string) => {
        setPayoutLoading(profileId);
        try {
            const { data, error } = await supabase.functions.invoke(
                "supabase-functions-stripe-connect",
                {
                    body: {
                        action: "create-login-link",
                        stripe_account_id: stripeAccountId,
                    },
                }
            );
            if (error || !data?.url) throw new Error("Failed to create payout link");
            window.open(data.url, "_blank");
        } catch {
            toast.error("Failed to open Stripe dashboard");
        } finally {
            setPayoutLoading(null);
        }
    };

    const totalAvailable = Object.values(balances).reduce(
        (sum, b) => sum + b.available,
        0
    );
    const totalPending = Object.values(balances).reduce(
        (sum, b) => sum + b.pending,
        0
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
        >
            {/* Revenue Header */}
            <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-gray-500 uppercase tracking-wider text-xs flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Total Revenue
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                        <ArrowUpRight className="w-3 h-3" />
                        Lifetime
                    </div>
                </div>
                <p className="text-4xl font-bold text-white tracking-tight">
                    ${totalRevenue.toFixed(2)}
                </p>
            </div>

            {/* Balance Breakdown */}
            {stripeProfiles.length > 0 && (
                <div className="px-6 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-white/5 bg-white/5 p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Wallet className="w-3 h-3 text-green-400" />
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                                    Available
                                </span>
                            </div>
                            {loadingBalances ? (
                                <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
                            ) : (
                                <p className="text-lg font-bold text-green-400 font-mono">
                                    ${totalAvailable.toFixed(2)}
                                </p>
                            )}
                        </div>
                        <div className="rounded-lg border border-white/5 bg-white/5 p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <CreditCard className="w-3 h-3 text-amber-400" />
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                                    Pending
                                </span>
                            </div>
                            {loadingBalances ? (
                                <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
                            ) : (
                                <p className="text-lg font-bold text-amber-400 font-mono">
                                    ${totalPending.toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Payout Buttons */}
            {stripeProfiles.length > 0 && (
                <div className="border-t border-white/5 px-6 py-4 space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                        Payout Dashboard
                    </p>
                    {stripeProfiles.map((sp) => (
                        <button
                            key={sp.id}
                            onClick={() => handlePayout(sp.id, sp.stripe_account_id)}
                            disabled={payoutLoading === sp.id}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left group disabled:opacity-50"
                        >
                            <div className="w-8 h-8 rounded-lg bg-[#635BFF]/20 flex items-center justify-center shrink-0">
                                {payoutLoading === sp.id ? (
                                    <Loader2 className="w-4 h-4 text-[#635BFF] animate-spin" />
                                ) : (
                                    <DollarSign className="w-4 h-4 text-[#635BFF]" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-sm text-white font-medium truncate block">
                                    {sp.business_name}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                    Open Stripe Dashboard for payouts
                                </span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors shrink-0" />
                        </button>
                    ))}
                </div>
            )}

            {stripeProfiles.length === 0 && (
                <div className="border-t border-white/5 px-6 py-4">
                    <p className="text-xs text-gray-500 text-center">
                        Connect Stripe in your booking links to accept payments
                    </p>
                </div>
            )}
        </motion.div>
    );
}
