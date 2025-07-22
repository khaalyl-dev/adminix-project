import { useEffect, useState, useRef } from "react";
import { Bell, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useWorkspaceId from "@/hooks/use-workspace-id";
import axios from "axios";

interface Notification {
  _id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  userId: {
    _id: string;
    name: string;
    profilePicture: string | null;
  };
}

const NotificationPanel = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const workspaceId = useWorkspaceId();
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => !n.read).length : 0;

  // Fetch notifications
  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    axios
      .get(`/api/workspace/${workspaceId}/notifications`)
      .then((res) => {
        setNotifications(res.data.notifications);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  // Real-time update: listen for new notifications
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setNotifications((prev) => [e.detail, ...prev]);
    };
    window.addEventListener("new-notification", handler as EventListener);
    return () => window.removeEventListener("new-notification", handler as EventListener);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Mark all as read (persistent)
  const markAllAsRead = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      await axios.patch(`/api/workspace/${workspaceId}/notifications/mark-all-read`);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        className="relative p-2 rounded-full hover:bg-gray-100"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white shadow-lg rounded-lg z-50 border">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="font-semibold text-lg">Notifications</span>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : !Array.isArray(notifications) || notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map((n) => {
                // Compose a professional message
                let actionMessage = n.message;
                if (n.userId?.name) {
                  // If the message already contains the username, don't duplicate
                  if (!n.message.toLowerCase().includes(n.userId.name.toLowerCase())) {
                    actionMessage = `${n.message} by ${n.userId.name}`;
                  }
                }
                return (
                  <div
                    key={n._id}
                    className={`flex flex-col gap-1 px-4 py-3 bg-white hover:bg-gray-50 ${!n.read ? "" : "opacity-70"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${!n.read ? "bg-purple-600" : "bg-gray-300"}`}></span>
                      {/* User profile picture */}
                      {n.userId?.profilePicture ? (
                        <img
                          src={n.userId.profilePicture}
                          alt={n.userId.name}
                          className="w-7 h-7 rounded-full object-cover border"
                        />
                      ) : (
                        <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 border">
                          {n.userId?.name?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                      <div className="flex flex-col ml-1">
                        <span className="font-semibold text-sm text-gray-800">{n.userId?.name || 'Unknown'}</span>
                        <span className="text-xs text-gray-400">{n.type.charAt(0).toUpperCase() + n.type.slice(1)}</span>
                      </div>
                      <span className="ml-auto text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', hour12: true, month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-sm mt-1 text-gray-700">
                      {actionMessage}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t">
            <div className="flex-1 flex justify-end">
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-md shadow-sm hover:bg-purple-100 transition-colors border border-purple-100"
                onClick={markAllAsRead}
                disabled={loading || notifications.every(n => n.read)}
                title="Mark all notifications as read"
              >
                <CheckCircle className="w-4 h-4" />
                Mark all as read
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel; 