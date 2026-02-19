"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, CheckSquare } from "lucide-react";
import { motion } from "framer-motion";

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="col-span-12 lg:col-span-4"
    >
      <Card className="h-full p-6 flex flex-col justify-between bg-white/5 border-white/10 backdrop-blur-sm">
        <div>
          <h3 className="font-display font-bold text-xl mb-2 text-white">Quick Actions</h3>
          <p className="text-gray-400 text-sm font-sans">
            Common tasks for managing your missed calls.
          </p>
        </div>

        <div className="space-y-3 mt-4">
          <Button 
            className="w-full justify-start gap-3 bg-white text-black hover:bg-gray-200 font-medium h-12"
          >
            <MessageSquarePlus className="w-5 h-5" />
            Send Manual Link
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 border-white/20 hover:bg-white/10 text-white hover:text-white h-12 bg-transparent"
          >
            <CheckSquare className="w-5 h-5" />
            Mark All Handled
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
