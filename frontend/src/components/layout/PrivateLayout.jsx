import React, { useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { AlertTriangle, LogOut } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';

export default function PrivateLayout() {
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-canvas flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading BizPilot workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/?auth=login" replace />;
  }

  const isImpersonating = Boolean(
    user?.impersonated_by || sessionStorage.getItem('bizpilot_impersonating')
  );

  const handleExitImpersonation = () => {
    sessionStorage.removeItem('bizpilot_impersonating');
    logout();
    navigate('/admin/merchants');
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col">
      {/* Impersonation Warning Banner */}
      {isImpersonating && (
        <div className="bg-amber-400 text-slate-950 font-medium px-4 py-2 flex items-center justify-between text-xs sm:text-sm shadow-md border-b border-amber-500 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-900 shrink-0" />
            <span>
              <strong>Platform Impersonation Mode:</strong> Currently viewing workspace as{' '}
              <span className="font-bold underline">{user.business_name || user.name}</span>. All changes reflect in the merchant database and are audited.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline text-xs font-medium text-amber-950">
              Session Admin: {user.admin_name || 'Staff'}
            </span>
            <button
              onClick={handleExitImpersonation}
              className="bg-slate-950 hover:bg-slate-900 text-amber-300 px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit to Admin
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        {/* Permanent sidebar on lg screens, drawer on mobile */}
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <Topbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full animate-page-in">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
