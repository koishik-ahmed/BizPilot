import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Navigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Sliders,
  FileText,
  Activity,
  ShieldCheck,
  Search,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Layers,
  ArrowRight,
  ShieldAlert,
  Bell
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLayout() {
  const { admin, loading, logout, adminFetch } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ merchants: [], orders: [], customers: [] });
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Execute global search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults({ merchants: [], orders: [], customers: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await adminFetch(`/api/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-canvas flex items-center justify-center text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading BizPilot Admin Console...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Merchants', path: '/admin/merchants', icon: Users },
    { name: 'Platform Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Feature Flags & Config', path: '/admin/config', icon: Sliders },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
    { name: 'System Health', path: '/admin/health', icon: Activity },
    ...(admin.role === 'super_admin' ? [{ name: 'Admin Team', path: '/admin/users', icon: ShieldCheck }] : [])
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-surface-canvas text-slate-900 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation matching Merchant Sidebar Exactly */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-surface-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header with Exact Official Merchant Logo */}
        <div className="h-20 flex items-center px-6 border-b border-surface-border justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">BizPilot</h2>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200">
                Platform Admin
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-5 px-4 space-y-1.5 overflow-y-auto custom-scroll">
          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Platform Management
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Actions & User Profile */}
        <div className="p-4 border-t border-surface-border space-y-3">
          {/* Quick link to merchant store in separate tab */}
          <a
            href="/?auth=login"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-brand-800 bg-brand-50 hover:bg-brand-100/80 border border-brand-200/80 transition shadow-sm"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-brand-600" />
              <span>Merchant Portal</span>
            </span>
            <span className="text-[10px] bg-white px-1.5 py-0.5 rounded font-mono text-brand-700 shadow-xs border border-brand-200">
              tab ↗
            </span>
          </a>

          {/* Admin User Card */}
          <div className="bg-surface-canvas rounded-2xl p-3 flex items-center justify-between border border-slate-200/70">
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 truncate">{admin.name}</p>
              </div>
              <p className="text-[11px] text-slate-500 truncate">{admin.email}</p>
              <span className="inline-block mt-1 text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-brand-100 text-brand-800 border border-brand-200">
                {admin.role?.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out of Platform Admin"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition shadow-xs"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Topbar matching Merchant Topbar Style */}
        <header className="sticky top-0 z-30 h-20 bg-white/90 backdrop-blur-md border-b border-surface-border px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Global Search Trigger Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full max-w-md flex items-center justify-between px-4 py-2.5 bg-surface-canvas rounded-full border border-slate-200/80 text-slate-400 hover:border-brand-500 hover:text-slate-600 transition text-sm group text-left shadow-inner"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition shrink-0" />
                <span className="text-xs sm:text-sm truncate">Search merchants, orders, customers...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-white rounded border border-slate-200 text-slate-500 shadow-sm shrink-0">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Live health status pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline">Systems</span> Operational
            </div>

            <div className="text-right hidden md:block pl-2 border-l border-slate-200">
              <p className="text-xs font-bold text-slate-800">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-[11px] text-slate-500">Platform Admin</p>
            </div>
          </div>
        </header>

        {/* Content Body with surface-canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-16 px-4">
          <div className="bg-white border border-surface-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            {/* Search Input */}
            <div className="p-4 border-b border-surface-border flex items-center gap-3 bg-surface-canvas/50">
              <Search className="w-5 h-5 text-brand-600 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Type to search merchants, orders (#BP-1024), or customer names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Container */}
            <div className="overflow-y-auto p-4 space-y-4">
              {searching ? (
                <div className="text-center py-6 text-xs text-slate-500">Searching platform records...</div>
              ) : searchQuery.length < 2 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Search across all registered merchants, global orders, and customer profiles.
                </div>
              ) : (
                <>
                  {/* Merchants Results */}
                  {searchResults.merchants.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase text-brand-700 mb-2 px-1">
                        Merchants ({searchResults.merchants.length})
                      </p>
                      <div className="space-y-1">
                        {searchResults.merchants.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              navigate(m.link);
                              setSearchOpen(false);
                            }}
                            className="w-full text-left p-3 rounded-2xl bg-surface-canvas hover:bg-brand-50/80 hover:border-brand-200 border border-slate-200/60 transition flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{m.title}</p>
                              <p className="text-[11px] text-slate-500">{m.subtitle}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Orders Results */}
                  {searchResults.orders.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase text-amber-700 mb-2 px-1">
                        Orders ({searchResults.orders.length})
                      </p>
                      <div className="space-y-1">
                        {searchResults.orders.map((o) => (
                          <button
                            key={o.id}
                            onClick={() => {
                              navigate(o.link);
                              setSearchOpen(false);
                            }}
                            className="w-full text-left p-3 rounded-2xl bg-surface-canvas hover:bg-amber-50/80 hover:border-amber-200 border border-slate-200/60 transition flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{o.title}</p>
                              <p className="text-[11px] text-slate-500">{o.subtitle}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customers Results */}
                  {searchResults.customers.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold uppercase text-emerald-700 mb-2 px-1">
                        Customers ({searchResults.customers.length})
                      </p>
                      <div className="space-y-1">
                        {searchResults.customers.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              navigate(c.link);
                              setSearchOpen(false);
                            }}
                            className="w-full text-left p-3 rounded-2xl bg-surface-canvas hover:bg-emerald-50/80 hover:border-emerald-200 border border-slate-200/60 transition flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900">{c.title}</p>
                              <p className="text-[11px] text-slate-500">{c.subtitle}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.merchants.length === 0 &&
                    searchResults.orders.length === 0 &&
                    searchResults.customers.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-500">
                        No matches found for "{searchQuery}".
                      </div>
                    )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-surface-canvas border-t border-surface-border text-[11px] text-slate-500 flex justify-between font-medium">
              <span>Press ESC to close</span>
              <span>Platform Global Index</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
