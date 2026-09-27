import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { AlertTriangle, ShoppingCart, DollarSign, Truck, Info, CheckCheck, X } from 'lucide-react';

export default function NotificationDropdown({ onClose }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4 text-coral-500" />;
      case 'new_order':
        return <ShoppingCart className="w-4 h-4 text-brand-600" />;
      case 'payment_pending':
      case 'payment_received':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'courier_update':
        return <Truck className="w-4 h-4 text-sky-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    if (notif.link) {
      onClose();
      navigate(notif.link);
    }
  };

  return (
    <div
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-surface-border py-2 z-50 animate-in fade-in slide-in-from-top-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-slate-50 custom-scroll">
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No notifications at the moment.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`flex items-start gap-3 p-4 cursor-pointer transition ${
                notif.is_read ? 'bg-white hover:bg-slate-50/80' : 'bg-brand-50/40 hover:bg-brand-50'
              }`}
            >
              <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100 shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className={`text-xs font-bold truncate ${notif.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                    {notif.title}
                  </p>
                  {!notif.is_read && (
                    <span className="w-2 h-2 rounded-full bg-coral-500 shrink-0"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  {notif.message}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2.5 bg-surface-canvas border-t border-slate-100 text-center">
        <span className="text-[11px] text-slate-400 font-medium">
          Click any notification to navigate directly to resolution
        </span>
      </div>
    </div>
  );
}

