import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingUp,
  Package,
  Boxes,
  History,
  Users,
  BarChart3,
  Truck,
  Sparkles,
  Settings,
  LogOut,
  Layers,
  Sparkle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import ConfirmationModal from '../common/ConfirmationModal';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Orders', path: '/orders', icon: ShoppingCart },
    { label: 'Revenue', path: '/revenue', icon: TrendingUp },
    { label: 'Products & Inventory', path: '/products', icon: Boxes },
    { label: 'Stock History', path: '/stock-history', icon: History },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Courier', path: '/courier', icon: Truck },
    { label: 'AI Insights', path: '/ai-insights', icon: Sparkles },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleConfirmLogout = () => {
    logout();
    setConfirmLogoutOpen(false);
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path === '/products' && (location.pathname.startsWith('/products') || location.pathname.startsWith('/inventory'))) {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/dashboard';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 !m-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-surface-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center px-6 border-b border-surface-border gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">BizPilot</h2>
            <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider mt-0.5">
              {user?.business_name || 'Ryvix Commerce'}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5 custom-scroll">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-brand-700 text-white shadow-lg shadow-brand-700/25 scale-[1.01]'
                    : 'text-slate-600 hover:text-brand-900 hover:bg-brand-50/60 hover:translate-x-1'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.label === 'Orders' && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'
                  }`}>
                    New
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout Button */}
        <div className="p-4 border-t border-surface-border space-y-3">
          <div className="px-2 py-1">
            <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Merchant'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email || 'merchant@bizpilot.com'}</p>
          </div>

          <button
            onClick={() => setConfirmLogoutOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition border border-rose-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

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

