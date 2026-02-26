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
  Store,
} from "lucide-react";
import { createClient } from "../../../supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RevenueModuleProps {
  totalRevenue: number;
  compact?: boolean;
  onNavigateToRevenue?: () => void;
}

interface StripeProfile {
  id: string;
  business_name: string;
  stripe_account_id: string;
  payments_enabled: boolean;
}

export function RevenueModule({
  totalRevenue,
  compact = false,
  onNavigateToRevenue,
}: RevenueModuleProps) {
  const supabase = createClient();
  const [stripeProfiles, setStripeProfiles] = useState<StripeProfile[]>([]);
  const [payoutLoading, setPayoutLoading] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("business_profiles")
          .select("id, business_name, stripe_account_id, payments_enabled")
          .not("stripe_account_id", "is", null);
        setStripeProfiles(data || []);
      } catch {
        // Silent
      }
    };
    load();
  }, [supabase]);

  const handlePayout = async (stripeAccountId: string) => {
    setPayoutLoading(stripeAccountId);
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
      if (error || !data?.url) throw new Error("Failed");
      window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to open Stripe dashboard");
    } finally {
      setPayoutLoading(null);
    }
  };

  const firstStripeAccount = stripeProfiles[0]?.stripe_account_id;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="min-h-[180px] rounded-xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between"
      >
        <p className="text-gray-500 uppercase tracking-wider text-xs">
          Revenue Today
        </p>
        <p className="text-3xl font-bold text-white">
          ${totalRevenue.toFixed(2)}
        </p>
        {onNavigateToRevenue && (
          <button
            onClick={onNavigateToRevenue}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors group"
          >
            Go to revenue dashboard
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
    >
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

      {firstStripeAccount && (
        <div className="border-t border-white/5 px-6 py-4">
          <button
            onClick={() => handlePayout(firstStripeAccount)}
            disabled={!!payoutLoading}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left group disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-[#635BFF]/20 flex items-center justify-center shrink-0">
              {payoutLoading ? (
                <Loader2 className="w-4 h-4 text-[#635BFF] animate-spin" />
              ) : (
                <DollarSign className="w-4 h-4 text-[#635BFF]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm text-white font-medium block">
                Payout Dashboard
              </span>
              <span className="text-[10px] text-gray-500">
                Open Stripe for payouts
              </span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors shrink-0" />
          </button>
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

interface PaymentDetailDialogProps {
  booking: {
    id: string;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    service_type: string;
    appointment_time: string;
    payment_status: string | null;
    payment_amount: number | null;
    created_at: string;
    status: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDetailDialog({
  booking,
  open,
  onOpenChange,
}: PaymentDetailDialogProps) {
  const apptTime = new Date(booking.appointment_time);
  const createdTime = new Date(booking.created_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Payment Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              Customer
            </p>
            <p className="font-medium">{booking.customer_name}</p>
            {booking.customer_email && (
              <p className="text-gray-400 text-xs">{booking.customer_email}</p>
            )}
            {booking.customer_phone && (
              <p className="text-gray-400 text-xs font-mono">
                {booking.customer_phone}
              </p>
            )}
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              Service
            </p>
            <p className="font-medium">{booking.service_type}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              Appointment
            </p>
            <p>
              {apptTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              Amount
            </p>
            <p className="font-mono text-lg text-green-400">
              ${(booking.payment_amount || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              Status
            </p>
            <span
              className={`inline-flex text-xs px-2 py-0.5 rounded-full ${
                booking.payment_status === "paid"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : booking.payment_status === "pay_in_store"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
              }`}
            >
              {booking.payment_status === "paid"
                ? "Paid (Online)"
                : booking.payment_status === "pay_in_store"
                  ? "Pay In Store"
                  : "—"}
            </span>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
              Booked on
            </p>
            <p className="text-gray-400 text-xs">
              {createdTime.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
