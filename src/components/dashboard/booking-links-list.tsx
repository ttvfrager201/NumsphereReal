"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Check,
  Loader2,
  Globe,
  Building2,
} from "lucide-react";
import {
  getAllBusinessProfiles,
  deleteBusinessProfileById,
} from "@/app/dashboard/actions";
import { toast } from "sonner";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://8635323e-47c7-41fe-b02a-927e6f46c4fc.canvases.tempo.build";

interface BookingLink {
  id: string;
  business_name: string;
  logo_url: string | null;
  booking_slug: string;
  theme_color: string;
  accent_color: string;
  created_at: string;
}

interface BookingLinksListProps {
  onEdit: (profile: BookingLink) => void;
  onCreateNew: () => void;
}

export function BookingLinksList({
  onEdit,
  onCreateNew,
}: BookingLinksListProps) {
  const [profiles, setProfiles] = useState<BookingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      const data = await getAllBusinessProfiles();
      setProfiles(data);
    } catch (error: any) {
      toast.error("Failed to load booking links");
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = (slug: string, id: string) => {
    const url = `${SITE_URL}/book/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? This cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteBusinessProfileById(id);
      toast.success("Booking link deleted");
      await loadProfiles();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete booking link");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Your Booking Links
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Manage your booking pages and share links with customers
          </p>
        </div>
        <Button
          onClick={onCreateNew}
          className="h-11 px-6 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-all active:scale-[0.98] gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New
        </Button>
      </div>

      {/* Empty State */}
      {profiles.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-[400px] rounded-xl border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center p-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">
            No booking links yet
          </h4>
          <p className="text-sm text-gray-400 mb-6 max-w-md">
            Create your first booking page to start accepting appointments from
            customers
          </p>
          <Button
            onClick={onCreateNew}
            className="h-11 px-6 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-all active:scale-[0.98] gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Link
          </Button>
        </motion.div>
      )}

      {/* Links Grid */}
      {profiles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {profiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-white/20 transition-all"
              >
                {/* Preview Header with Logo/Image */}
                <div
                  className="h-32 relative overflow-hidden"
                  style={{
                    backgroundColor: profile.theme_color || "#000000",
                  }}
                >
                  {profile.logo_url ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      <img
                        src={profile.logo_url}
                        alt={profile.business_name}
                        className="w-20 h-20 rounded-xl object-cover shadow-lg"
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center border"
                        style={{
                          borderColor: `${profile.accent_color || "#ffffff"}30`,
                          backgroundColor: `${profile.accent_color || "#ffffff"}15`,
                        }}
                      >
                        <Building2
                          className="w-8 h-8"
                          style={{ color: profile.accent_color || "#ffffff" }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-4">
                  <h4 className="text-base font-semibold text-white mb-1 truncate">
                    {profile.business_name}
                  </h4>
                  <p className="text-xs text-gray-400 font-mono truncate mb-4">
                    /book/{profile.booking_slug}
                  </p>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => onEdit(profile)}
                      variant="outline"
                      className="h-9 rounded-lg bg-white text-black hover:bg-black/10 transition-colors duration-200 text-xs gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      onClick={() =>
                        handleCopy(profile.booking_slug, profile.id)
                      }
                      variant="outline"
                      className="h-9 rounded-lg bg-white text-black hover:bg-black/10 transition-colors duration-200 text-xs gap-1.5"
                    >
                      {copiedId === profile.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <a
                      href={`/book/${profile.booking_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button
                        variant="ghost"
                        className="w-full h-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-xs gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open
                      </Button>
                    </a>
                    <Button
                      onClick={() =>
                        handleDelete(profile.id, profile.business_name)
                      }
                      disabled={deletingId === profile.id}
                      variant="ghost"
                      className="h-9 px-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {deletingId === profile.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
