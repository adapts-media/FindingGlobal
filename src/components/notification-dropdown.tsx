import { useState, useEffect, useCallback, memo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { 
  Bell, 
  Calendar, 
  UserPlus, 
  Building2, 
  MessageSquare, 
  Info 
} from "lucide-react";
import { notificationApi, ApiNotification } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

// Simple relative time helper
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// Helper to get group category (Today, Yesterday, Earlier)
const getGroup = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (compareDate.getTime() === today.getTime()) {
    return "Today";
  } else if (compareDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else {
    return "Earlier";
  }
};

// Helpers for notification icon styling
function getNotificationConfig(type: string, title?: string) {
  const t = (type || "").toLowerCase();
  const titleText = (title || "").toLowerCase();

  if (titleText.includes("project match") || t === "project_match") {
    return {
      icon: Building2,
      color: "text-indigo-600 bg-indigo-50",
      label: "Match",
    };
  }

  if (titleText.includes("lead received") || t === "new_lead") {
    return {
      icon: UserPlus,
      color: "text-amber-600 bg-amber-50",
      label: "New Lead",
    };
  }

  if (titleText.includes("meeting") || t === "meeting_request" || t === "meeting_booked") {
    return {
      icon: Calendar,
      color: "text-emerald-600 bg-emerald-50",
      label: "Meeting",
    };
  }

  if (titleText.includes("message") || t === "message") {
    return {
      icon: MessageSquare,
      color: "text-blue-600 bg-blue-50",
      label: "Message",
    };
  }

  return {
    icon: Info,
    color: "text-neutral-600 bg-neutral-50",
    label: "Info",
  };
}

export const NotificationDropdown = memo(function NotificationDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const [notifications, setNotifications] = useState<ApiNotification[]>(() => {
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem("fm_notifications");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }
    return [];
  });

  const [unreadCount, setUnreadCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const cached = window.localStorage.getItem("fm_unread_count");
      if (cached) {
        const val = parseInt(cached, 10);
        return isNaN(val) ? 0 : val;
      }
    }
    return 0;
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationApi.list();
      setNotifications(res.notifications);
      const count = res.notifications.filter(n => !n.read).length;
      setUnreadCount(count);
      
      if (typeof window !== "undefined") {
        window.localStorage.setItem("fm_notifications", JSON.stringify(res.notifications));
        window.localStorage.setItem("fm_unread_count", String(count));
      }
    } catch (err) {
      console.error("[NotificationDropdown] Failed to fetch notifications:", err);
    }
  }, [user]);

  // Poll for notifications
  useEffect(() => {
    if (!user) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("fm_notifications");
        window.localStorage.removeItem("fm_unread_count");
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchNotifications();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await notificationApi.readAll();
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      setUnreadCount(0);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("fm_notifications", JSON.stringify(updated));
        window.localStorage.setItem("fm_unread_count", "0");
      }
    } catch (err) {
      console.error("[NotificationDropdown] Failed to mark all as read:", err);
    }
  };

  // Mark as read & navigate immediately
  const handleNotificationClick = async (notif: ApiNotification) => {
    if (!notif.read) {
      try {
        await notificationApi.read(notif._id, true);
        const updated = notifications.map(n => (n._id === notif._id ? { ...n, read: true } : n));
        const count = Math.max(0, unreadCount - 1);
        setNotifications(updated);
        setUnreadCount(count);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("fm_notifications", JSON.stringify(updated));
          window.localStorage.setItem("fm_unread_count", String(count));
        }
      } catch (err) {
        console.error("[NotificationDropdown] Failed to mark notification as read:", err);
      }
    }

    let targetLink = notif.link;
    if (notif.message && notif.message.includes("direct contact request")) {
      targetLink = "/agency-inbox";
    }
    if (targetLink) {
      navigate({ to: targetLink as any });
    }
  };

  if (!user) return null;

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    return true;
  });

  // Group notifications
  const groupedNotifications = filteredNotifications.reduce((acc, notif) => {
    const group = getGroup(notif.createdAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(notif);
    return acc;
  }, {} as Record<"Today" | "Yesterday" | "Earlier", ApiNotification[]>);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="relative flex size-9 items-center justify-center rounded-full border border-border bg-card text-steel-dark hover:border-obsidian hover:text-obsidian active:scale-95 transition-all focus:outline-none cursor-pointer"
          >
            <Bell className={cn("size-4 transition-transform", unreadCount > 0 && "animate-wiggle")} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-[430px] p-0 shadow-xl border border-neutral-100 bg-white rounded-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 slide-in-from-top-2"
          align="end"
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between bg-white">
            <DropdownMenuLabel className="p-0 text-base font-semibold text-neutral-900">
              Notifications
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 px-2.5 py-1.5 rounded-md transition-all duration-200 cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="border-b border-neutral-100" />

          {/* Tabs */}
          <div className="flex gap-2 px-4 py-3 bg-white">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                filter === "all"
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
              )}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                filter === "unread"
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
              )}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* List Area */}
          <div className="max-h-[360px] overflow-y-auto px-2 pb-3 space-y-1 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="size-6 text-neutral-400 mb-2.5" />
                <p className="text-sm font-medium text-neutral-900">You're all caught up</p>
                <p className="text-xs text-neutral-400 mt-1">No new notifications</p>
              </div>
            ) : (
              (["Today", "Yesterday", "Earlier"] as const).map(group => {
                const groupItems = groupedNotifications[group] || [];
                if (groupItems.length === 0) return null;

                return (
                  <div key={group} className="space-y-1.5">
                    <div className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase px-3 pt-3 pb-1 select-none">
                      {group}
                    </div>
                    {groupItems.map(notif => {
                      const config = getNotificationConfig(notif.type, notif.title);
                      const IconComponent = config.icon;

                      return (
                        <div
                          key={notif._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleNotificationClick(notif);
                          }}
                          className="flex gap-3.5 p-4 rounded-xl bg-white border border-transparent hover:border-neutral-200 hover:bg-neutral-50/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative group"
                        >
                          {/* Circular icon container */}
                          <div className={cn("h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105", config.color)}>
                            <IconComponent className="size-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-medium text-sm text-neutral-900 truncate">
                                  {notif.title}
                                </span>
                                {!notif.read && (
                                  <span className="size-1.5 rounded-full bg-blue-600 shrink-0" />
                                )}
                              </div>
                              <span className="text-xs text-neutral-400 font-normal shrink-0">
                                {formatTimeAgo(notif.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="bg-white">
            <Link
              to={user.role === "agency" ? "/agency-dashboard" : "/dashboard"}
              className="text-xs text-neutral-500 hover:text-neutral-950 font-medium py-3.5 transition-colors block text-center border-t border-neutral-100 hover:bg-neutral-50/50"
            >
              View all notifications →
            </Link>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
});
