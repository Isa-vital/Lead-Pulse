import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, ShoppingCart, Target, Calendar, X } from 'lucide-react';
import { notificationApi } from '@/api/endpoints';
import { formatDistanceToNow } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch unread count on mount and every 30s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationApi.unreadCount();
        setUnreadCount(res.data.data.count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.list({ per_page: 10 });
      setNotifications(res.data.data);
    } catch {}
    setLoading(false);
  };

  const handleOpen = () => {
    if (!open) {
      fetchNotifications();
    }
    setOpen(!open);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch {}
  };

  const handleClick = (n: Notification) => {
    if (!n.read_at) handleMarkAsRead(n.id);

    const data = n.data as Record<string, unknown>;
    if (data.type === 'order_confirmation' && data.order_id) {
      navigate('/orders');
    } else if (data.type === 'lead_assigned' && data.lead_id) {
      navigate('/pipeline');
    } else if (data.type === 'task_reminder' && data.interaction_id) {
      navigate('/communications');
    }
    setOpen(false);
  };

  const getIcon = (n: Notification) => {
    const type = (n.data as Record<string, unknown>).type;
    switch (type) {
      case 'order_confirmation':
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'lead_assigned':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'task_reminder':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:bg-gray-800 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !n.read_at ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{getIcon(n)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read_at ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                      {(n.data as Record<string, unknown>).message as string}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDistanceToNow(n.created_at)}
                    </p>
                  </div>
                  {!n.read_at && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id);
                      }}
                      className="mt-1 flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
