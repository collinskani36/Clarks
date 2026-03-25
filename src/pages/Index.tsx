import React, { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import FeedPage from "@/components/FeedPage";
import CategoriesPage from "@/components/CategoriesPage";
import WishlistPage from "@/components/WishlistPage";
import NotificationsPage from "@/components/NotificationsPage";
import ProfilePage from "@/components/ProfilePage";
import { supabase } from "@/lib/supabase";

type Tab = "feed" | "categories" | "wishlist" | "notifications" | "profile";

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch real notification count from Supabase
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const { count, error } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("unread", true);

        if (!error && count !== null) {
          setNotificationCount(count);
        }
      } catch (err) {
        console.error("Error fetching notification count:", err);
      }
    };

    fetchNotificationCount();

    // Subscribe to real-time changes in notifications
    const subscription = supabase
      .channel("notifications-count-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          // Refetch count when any notification changes
          fetchNotificationCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleWishlistToggle = (id: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLike = (id: string) => {
    // Could also add to wishlist on like
  };

  return (
    <div
      className="flex justify-center items-stretch min-h-screen"
      style={{ backgroundColor: "hsl(220 18% 4%)" }}
    >
      {/* Phone frame */}
      <div
        className="relative w-full max-w-md flex flex-col overflow-hidden"
        style={{
          height: "100dvh",
          backgroundColor: "hsl(var(--background))",
        }}
      >
        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-hidden">
            {activeTab === "feed" && (
              <div className="h-full overflow-y-auto">
                <FeedPage
                  onLike={handleLike}
                  onWishlistToggle={handleWishlistToggle}
                  wishlistIds={wishlistIds}
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

        {/* Bottom navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          wishlistCount={wishlistIds.size}
          notificationCount={notificationCount}
        />
      </div>
    </div>
  );
};

export default Index;