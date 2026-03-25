import React, { useState, useEffect } from "react";
import { Bell, Package, RefreshCw, Zap, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Notification {
  id: string;
  type: "new-drop" | "restock" | "price-drop" | "sold";
  title: string;
  body: string;
  time: string;
  unread: boolean;
  icon: React.ReactNode;
  iconBg: string;
}

interface DbNotification {
  id: string;
  type: "new-drop" | "restock" | "price-drop" | "sold";
  title: string;
  body: string;
  unread: boolean;
  created_at: string;
}

const getIconAndColor = (type: Notification["type"], unread: boolean) => {
  const isUnread = unread;
  
  switch (type) {
    case "new-drop":
      return {
        icon: <Zap size={16} fill={isUnread ? "hsl(var(--primary))" : "hsl(var(--foreground-muted))"} color={isUnread ? "hsl(var(--primary))" : "hsl(var(--foreground-muted))"} />,
        iconBg: isUnread ? "hsl(var(--primary-dim))" : "hsl(var(--surface-3))"
      };
    case "restock":
      return {
        icon: <RefreshCw size={16} color={isUnread ? "hsl(var(--success))" : "hsl(var(--foreground-muted))"} />,
        iconBg: isUnread ? "hsl(142 72% 15%)" : "hsl(var(--surface-3))"
      };
    case "price-drop":
      return {
        icon: <Tag size={16} color={isUnread ? "hsl(var(--primary))" : "hsl(var(--foreground-muted))"} />,
        iconBg: isUnread ? "hsl(var(--primary-dim))" : "hsl(var(--surface-3))"
      };
    case "sold":
      return {
        icon: <Bell size={16} color={isUnread ? "hsl(var(--foreground-muted))" : "hsl(var(--foreground-muted))"} />,
        iconBg: "hsl(var(--surface-3))"
      };
    default:
      return {
        icon: <Bell size={16} color="hsl(var(--foreground-muted))" />,
        iconBg: "hsl(var(--surface-3))"
      };
  }
};

const formatTime = (timestamp: string): string => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch notifications from Supabase
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedNotifications: Notification[] = (data || []).map((notif: DbNotification) => {
          const { icon, iconBg } = getIconAndColor(notif.type, notif.unread);
          return {
            id: notif.id,
            type: notif.type,
            title: notif.title,
            body: notif.body,
            time: formatTime(notif.created_at),
            unread: notif.unread,
            icon,
            iconBg,
          };
        });

        setNotifications(formattedNotifications);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to real-time notifications
    const subscription = supabase
      .channel("notifications-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          fetchNotifications(); // Refresh when changes occur
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Mark notification as read when viewed
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ unread: false })
        .eq("id", id);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, unread: false } : notif
        )
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-30 glass-dark border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-gradient tracking-wider">ALERTS</h1>
            <p className="text-xs text-foreground-muted">Stay on top of drops & restocks</p>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-30 glass-dark border-b border-border px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-gradient tracking-wider">ALERTS</h1>
            <p className="text-xs text-foreground-muted">Stay on top of drops & restocks</p>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-foreground-muted text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="sticky top-0 z-30 glass-dark border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-gradient tracking-wider">ALERTS</h1>
          <p className="text-xs text-foreground-muted">Stay on top of drops & restocks</p>
        </div>
        {unreadCount > 0 && (
          <div className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30">
            <span className="text-xs font-bold text-primary">
              {unreadCount} new
            </span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-foreground-subtle">
            <Bell size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm">No notifications yet</p>
            <p className="text-xs mt-2">We'll notify you when new drops land 🔔</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif, i) => (
              <div
                key={notif.id}
                onClick={() => notif.unread && markAsRead(notif.id)}
                className={`px-4 py-4 flex gap-3 transition-colors animate-fade-up cursor-pointer ${
                  notif.unread ? "bg-surface-1" : "bg-background"
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Icon */}
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: notif.iconBg }}
                >
                  {notif.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-semibold ${
                        notif.unread ? "text-foreground" : "text-foreground-muted"
                      }`}
                    >
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-foreground-subtle flex-shrink-0 mt-0.5">{notif.time}</span>
                  </div>
                  <p className={`text-xs leading-relaxed mt-0.5 ${notif.unread ? "text-foreground-muted" : "text-foreground-subtle"}`}>
                    {notif.body}
                  </p>
                </div>

                {/* Unread dot */}
                {notif.unread && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5 shadow-glow-sm" />
                )}
              </div>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="text-center py-8 text-foreground-subtle text-xs px-4">
            <p>You've seen all your notifications</p>
            <p className="mt-1">We'll ping you when new drops land 🔔</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;