"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Database } from "@/types/supabase";

type Settings = Database["public"]["Tables"]["settings"]["Row"];

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings | null;
  onSave: (settings: Partial<Settings>) => Promise<void>;
}

export function SettingsDrawer({ open, onOpenChange, settings, onSave }: SettingsDrawerProps) {
  const [formData, setFormData] = useState<Partial<Settings>>({
    booking_link_template: "",
    review_automation_enabled: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        booking_link_template: settings.booking_link_template,
        review_automation_enabled: settings.review_automation_enabled,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(formData);
      toast.success("Settings saved successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md w-full border-l border-border/50 bg-background/95 backdrop-blur-xl">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-2xl font-bold">Settings</SheetTitle>
          <SheetDescription>
            Configure your automation preferences and integrations.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Booking Automation
            </h4>
            <div className="space-y-2">
              <Label htmlFor="message-template">Text-Back Message Template</Label>
              <Textarea
                id="message-template"
                placeholder="Hi! Sorry I missed your call..."
                className="min-h-[100px] font-mono text-sm resize-none"
                value={formData.booking_link_template || ""}
                onChange={(e) => setFormData({ ...formData, booking_link_template: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Use <code className="bg-muted px-1 rounded text-foreground">[LINK]</code> where you want the booking URL to appear.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Payments & Reviews
            </h4>
            
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
              <div className="space-y-0.5">
                <Label className="text-base">Stripe Express</Label>
                <p className="text-xs text-muted-foreground">Accept payments for bookings</p>
              </div>
              <Button variant="outline" size="sm" className="h-8">
                {settings?.stripe_connect_id ? "Connected" : "Connect"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
              <div className="space-y-0.5">
                <Label className="text-base">Review Automation</Label>
                <p className="text-xs text-muted-foreground">Request reviews after appointments</p>
              </div>
              <Switch
                checked={formData.review_automation_enabled || false}
                onCheckedChange={(checked) => setFormData({ ...formData, review_automation_enabled: checked })}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="mt-8">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
