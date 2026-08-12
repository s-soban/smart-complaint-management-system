import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, CheckCheck, X, AlertTriangle, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

interface NotificationModalProps {
  onClose: () => void;
  onSelectComplaint?: (id: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ onClose, onSelectComplaint }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-end p-4 md:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] mt-12 transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Notifications Feed</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px]">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">
              No notifications yet.
            </div>
          ) : (
            notifications.map(n => {
              const isUnread = n.is_read === 0;

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    if (isUnread) markAsRead(n.id);
                    if (n.link && onSelectComplaint) {
                      const match = n.link.match(/CMP-\d{4}-\d+/);
                      if (match) onSelectComplaint(match[0]);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                    isUnread
                      ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 font-medium'
                      : 'bg-white dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-snug">{n.message}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
