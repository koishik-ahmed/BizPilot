import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, Menu, LogOut, Settings as SettingsIcon, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from '../common/NotificationDropdown';
import GlobalSearchModal from '../common/GlobalSearchModal';
import ConfirmationModal from '../common/ConfirmationModal';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const notifRef = React.useRef(null);
  const profileRef = React.useRef(null);

  // Close notification or profile popup when clicking anywhere outside on the page
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    if (notifOpen || profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [notifOpen, profileOpen]);

  const handleConfirmLogout = () => {
    logout();
    setConfirmLogoutOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-20 bg-white/90 backdrop-blur-md border-b border-surface-border px-4 sm:px-8 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Search button */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Input trigger with prominent Search Icon */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="w-full max-w-md flex items-center justify-between px-3.5 py-2 bg-surface-canvas rounded-full border border-slate-200/90 hover:border-brand-500 hover:bg-white text-slate-400 hover:text-slate-600 transition shadow-2xs text-sm group text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition shadow-2xs">
                <Search className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs sm:text-sm text-slate-500 font-medium">Search products, orders, customers...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-white rounded-md border border-slate-200 text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Notification bell & Profile menu */}
        <div className="flex items-center gap-3">
          {/* Notification Button */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                if (profileOpen) setProfileOpen(false);
              }}
              className="relative p-2.5 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-coral-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <NotificationDropdown onClose={() => setNotifOpen(false)} />
            )}
          </div>

          {/* User Profile Pill */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                if (notifOpen) setNotifOpen(false);
              }}
              className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full bg-surface-canvas hover:bg-slate-100 border border-slate-200/70 transition group cursor-pointer"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover shadow-sm border border-brand-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'C'}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.name || 'Copper Merchant'}
                </span>
                <span className="text-[10px] text-brand-600 font-semibold">
                  {user?.business_name || 'Ryvix Commerce'}
                </span>
              </div>
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-surface-border py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setProfileOpen(false)}
              >
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-400" />
                    <span>Settings & Security</span>
                  </Link>
                  <Link
                    to="/"
                    target="_blank"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    <span>View Public Store</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setConfirmLogoutOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {searchModalOpen && (
        <GlobalSearchModal onClose={() => setSearchModalOpen(false)} />
      )}

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmLogoutOpen}
        title="Sign Out Confirmation"
        message="Are you sure you want to sign out of your merchant command center?"
        confirmText="Yes, Sign Out"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmLogout}
        onCancel={() => setConfirmLogoutOpen(false)}
      />
    </>
  );
}

