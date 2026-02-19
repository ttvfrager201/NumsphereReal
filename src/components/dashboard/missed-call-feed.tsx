"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Clock, MessageSquare, Check, X, CalendarCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type MissedCall = Database["public"]["Tables"]["missed_calls"]["Row"];

interface MissedCallFeedProps {
  calls: MissedCall[];
  onSendLink: (id: string) => Promise<void>;
  onMarkHandled: (id: string) => Promise<void>;
}

export function MissedCallFeed({ calls, onSendLink, onMarkHandled }: MissedCallFeedProps) {
  const [sendingId, setSendingId] = useState<string | null>(null);

  const handleSendLink = async (id: string) => {
    setSendingId(id);
    await onSendLink(id);
    setSendingId(null);
  };

  return (
    <Card className="col-span-12 lg:col-span-7 h-[600px] flex flex-col bg-white/5 border-white/10 backdrop-blur-sm">
      <div className="p-6 border-b border-white/10">
        <h3 className="font-display font-bold text-xl text-white">Missed Call Feed</h3>
        <p className="text-sm text-gray-400 mt-1 font-sans">
          Recent missed calls and their status
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence initial={false}>
          {calls.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Phone className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No missed calls yet</p>
            </div>
          ) : (
            calls.map((call) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
                className={cn(
                  "group relative bg-white/5 p-5 rounded-lg border border-white/10 transition-all hover:shadow-lg hover:-translate-y-[2px] hover:bg-white/10",
                  call.status === "new" && "border-l-4 border-l-amber-500",
                  call.status === "texted" && "border-l-4 border-l-teal-500",
                  call.status === "booked" && "border-l-4 border-l-green-500",
                  call.status === "handled" && "border-l-4 border-l-gray-500 opacity-75"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-lg text-white">
                      {call.caller_name || "Unknown Caller"}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-gray-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {call.phone_number}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(call.called_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {call.status === "new" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-4 font-medium hover:bg-white/10 border-white/20 text-white"
                          onClick={() => onMarkHandled(call.id)}
                        >
                          Mark Handled
                        </Button>
                        <Button
                          size="sm"
                          className={cn(
                            "h-9 px-4 font-medium bg-white text-black hover:bg-gray-200 transition-all duration-300",
                            sendingId === call.id && "w-12 px-0 bg-green-500 hover:bg-green-600 text-white"
                          )}
                          onClick={() => handleSendLink(call.id)}
                          disabled={!!sendingId}
                        >
                          {sendingId === call.id ? (
                            <Check className="w-4 h-4 animate-bounce" />
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Send Link
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    
                    {call.status === "texted" && (
                      <span className="text-xs font-medium px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full flex items-center gap-1 border border-teal-500/30">
                        <Check className="w-3 h-3" /> Link Sent
                      </span>
                    )}
                    
                    {call.status === "booked" && (
                      <span className="text-xs font-medium px-3 py-1 bg-green-500/20 text-green-400 rounded-full flex items-center gap-1 border border-green-500/30">
                        <CalendarCheck className="w-3 h-3" /> Booked
                      </span>
                    )}

                    {call.status === "handled" && (
                      <span className="text-xs font-medium px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full border border-gray-500/30">
                        Handled
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
