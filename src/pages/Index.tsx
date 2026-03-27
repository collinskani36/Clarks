import React, { useState, useEffect, useCallback } from "react";
import BottomNav from "@/components/BottomNav";
import FeedPage from "@/components/FeedPage";
import CategoriesPage from "@/components/CategoriesPage";
import WishlistPage from "@/components/WishlistPage";
import NotificationsPage from "@/components/NotificationsPage";
import ProfilePage from "@/components/ProfilePage";
import { supabase } from "@/lib/supabase";

type Tab = "feed" | "categories" | "wishlist" | "notifications" | "profile";

// ─── localStorage keys ────────────────────────────────────────────────────────
const LS_WISHLIST = "sv_wishlist_ids";
const LS_LIKED = "sv_liked_ids";
const LS_POPUP_SHOWN = "sv_phone_popup_shown";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

// ─── Phone Popup ──────────────────────────────────────────────────────────────
interface PhonePopupProps {
  onSave: (phone: string) => Promise<void>;
  onSkip: () => void;
}

const PhonePopup: React.FC<PhonePopupProps> = ({ onSave, onSkip }) => {
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    const cleaned = phone.replace(/\s+/g, "").trim();
    if (!cleaned || cleaned.length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(cleaned);
      setSuccess(true);
      setTimeout(onSkip, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onSkip()}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border-t border-border p-6 pb-10 animate-slide-up"
        style={{ backgroundColor: "hsl(var(--surface-1))" }}
      >
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />

        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "hsl(var(--gradient-primary, var(--primary)))" }}
        >
          <span className="text-2xl">🔥</span>
        </div>

        <h2 className="font-display text-2xl text-gradient text-center tracking-wider mb-1">
          SAVE YOUR PICKS
        </h2>
        <p className="text-sm text-center text-foreground-muted mb-6">
          You've been busy! Add your number to sync your likes & wishlist across browsers and devices — no password needed.
        </p>

        {success ? (
          <div className="text-center py-4">
            <p className="text-lg font-bold text-primary">✓ Saved!</p>
            <p className="text-xs text-foreground-muted mt-1">Your picks are now synced.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-xl px-4 py-3 mb-3">
              <span className="text-foreground-muted text-sm">📱</span>
              <input
                type="tel"
                placeholder="+254 700 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-foreground-subtle"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-destructive mb-3 text-center">{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-primary-foreground bg-gradient-primary shadow-glow-sm active:scale-95 transition-all disabled:opacity-60 mb-3"
            >
              {saving ? "Saving..." : "Save My Picks"}
            </button>

            <button
              onClick={onSkip}
              className="w-full py-2 text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              Maybe later
            </button>

            <p className="text-[10px] text-foreground-subtle text-center mt-3">
              Your number is only used to restore your saved items. No spam, ever.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// ─── Index ────────────────────────────────────────────────────────────────────
const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(() => loadSet(LS_WISHLIST));
  const [likedIds, setLikedIds] = useState<Set<string>>(() => loadSet(LS_LIKED));
  const [notificationCount, setNotificationCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  // ── Back button interception ───────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "feed") {
      window.history.replaceState({ tab: "feed" }, "");
    } else {
      window.history.pushState({ tab: activeTab }, "");
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      if (activeTab !== "feed") {
        setActiveTab("feed");
        window.history.pushState({ tab: "feed" }, "");
      } else {
        window.history.back();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeTab]);

  // ── Persist wishlist ───────────────────────────────────────────────────────
  useEffect(() => {
    saveSet(LS_WISHLIST, wishlistIds);
    maybeShowPopup(wishlistIds, likedIds);
  }, [wishlistIds]);

  useEffect(() => {
    saveSet(LS_LIKED, likedIds);
    maybeShowPopup(wishlistIds, likedIds);
  }, [likedIds]);

  const maybeShowPopup = (wl: Set<string>, lk: Set<string>) => {
    const alreadyShown = localStorage.getItem(LS_POPUP_SHOWN) === "true";
    if (alreadyShown) return;
    if (wl.size >= 4 || lk.size >= 4) setShowPopup(true);
  };

  // ── Notification count ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("unread", true);
        if (!error && count !== null) setNotificationCount(count);
      } catch (err) {
        console.error("Error fetching notification count:", err);
      }
    };

    fetchNotificationCount();

    const subscription = supabase
      .channel("notifications-count-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        fetchNotificationCount();
      })
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, []);

  // ── Wishlist toggle ────────────────────────────────────────────────────────
  const handleWishlistToggle = useCallback((id: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Like handler ───────────────────────────────────────────────────────────
  const handleLike = useCallback(async (id: string) => {
    const isCurrentlyLiked = likedIds.has(id);

    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      const { data: current, error: fetchError } = await supabase
        .from("products")
        .select("likes")
        .eq("id", id)
        .single();

      if (fetchError || !current) return;

      const newLikes = Math.max(0, (current.likes ?? 0) + (isCurrentlyLiked ? -1 : 1));
      await supabase.from("products").update({ likes: newLikes }).eq("id", id);
    } catch (err) {
      console.error("Failed to update likes:", err);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyLiked) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  }, [likedIds]);

  // ── Popup handlers ─────────────────────────────────────────────────────────
  const handlePopupSave = async (phone: string) => {
    const { error } = await supabase
      .from("wishlists")
      .upsert(
        {
          phone_number: phone,
          wishlist_ids: Array.from(wishlistIds),
          liked_ids: Array.from(likedIds),
          wishlist_count: wishlistIds.size,
          liked_count: likedIds.size,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "phone_number" }
      );

    if (error) throw new Error(error.message);
  };

  const handlePopupSkip = () => {
    localStorage.setItem(LS_POPUP_SHOWN, "true");
    setShowPopup(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex justify-center items-stretch min-h-screen"
      style={{ backgroundColor: "hsl(220 18% 4%)" }}
    >
      <div
        className="relative w-full max-w-md flex flex-col overflow-hidden"
        style={{ height: "100dvh", backgroundColor: "hsl(var(--background))" }}
      >
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-hidden">
            {activeTab === "feed" && (
              <div className="h-full overflow-y-auto">
                <FeedPage
                  onLike={handleLike}
                  onWishlistToggle={handleWishlistToggle}
                  wishlistIds={wishlistIds}
                  likedIds={likedIds}
                />
              </div>
            )}
            {activeTab === "categories" && (
              <div className="h-full overflow-y-auto">
                <CategoriesPage
                  onWishlistToggle={handleWishlistToggle}
                  wishlistIds={wishlistIds}
                />
              </div>
            )}
            {activeTab === "wishlist" && (
              <div className="h-full overflow-y-auto">
                <WishlistPage
                  wishlistIds={wishlistIds}
                  onWishlistToggle={handleWishlistToggle}
                />
              </div>
            )}
            {activeTab === "notifications" && (
              <div className="h-full overflow-y-auto">
                <NotificationsPage />
              </div>
            )}
            {activeTab === "profile" && (
              <div className="h-full overflow-y-auto">
                <ProfilePage
                  onWishlistToggle={handleWishlistToggle}
                  wishlistIds={wishlistIds}
                />
              </div>
            )}
          </div>
        </main>

        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          wishlistCount={wishlistIds.size}
          notificationCount={notificationCount}
        />

        {showPopup && (
          <PhonePopup onSave={handlePopupSave} onSkip={handlePopupSkip} />
        )}
      </div>
    </div>
  );
};

export default Index;