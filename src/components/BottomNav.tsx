import React from "react";
import { Home, Grid2X2, Heart, Bell, User } from "lucide-react";

type Tab = "feed" | "categories" | "wishlist" | "notifications" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  wishlistCount: number;
  notificationCount: number;
}

const navItems = [
  { id: "feed" as Tab, icon: Home, label: "Home" },
  { id: "categories" as Tab, icon: Grid2X2, label: "Explore" },
  { id: "wishlist" as Tab, icon: Heart, label: "Saved" },
  { id: "notifications" as Tab, icon: Bell, label: "Alerts" },
  { id: "profile" as Tab, icon: User, label: "Shop" },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, wishlistCount, notificationCount }) => {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 glass-dark border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          const badge =
            id === "wishlist" && wishlistCount > 0
              ? wishlistCount
              : id === "notifications" && notificationCount > 0
              ? notificationCount
              : null;

          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{
                color: isActive ? "hsl(var(--primary))" : "hsl(var(--foreground-subtle))",
              }}
            >
              <div
                className={`relative transition-transform duration-200 ${isActive ? "scale-110" : "scale-100"}`}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  fill={isActive && id === "wishlist" ? "hsl(var(--primary))" : "none"}
                />
                {badge !== null && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center leading-none">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-all duration-200 ${isActive ? "opacity-100" : "opacity-50"}`}>
                {label}
              </span>
              {isActive && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
