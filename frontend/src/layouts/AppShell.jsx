import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, BarChart3, Plus, Package, Warehouse,
  History, Users, Settings, LogOut, Bell, Search, UserCircle, X,
} from "lucide-react";
import Logo from "../components/Logo";
import api from "../services/api";

const nav = [
  ["Dashboard", "/dashboard", LayoutDashboard],
  ["Orders", "/app/orders", ShoppingCart],
  ["Revenue", "/app/revenue", BarChart3],
  ["Place Order", "/app/place-order", Plus],
  ["Products", "/app/products", Package],
  ["Inventory", "/app/inventory", Warehouse],
  ["Stock History", "/app/stock-history", History],
  ["Customers", "/app/customers", Users],
  ["Settings", "/app/settings", Settings],
];

export default function AppShell() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("bizpilot_user") || "null");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get("/inventory/low-stock").catch(() => ({ data: [] })),
      api.get("/orders/pending").catch(() => ({ data: { data: [] } })),
    ]).then(([stockResponse, ordersResponse]) => {
      if (!mounted) return;
      const lowStock = Array.isArray(stockResponse.data) ? stockResponse.data : [];
      const pending = Array.isArray(ordersResponse.data)
        ? ordersResponse.data
        : ordersResponse.data?.data || [];
      setNotifications([
        ...lowStock.slice(0, 5).map((item) => ({
          id: `stock-${item.id}`,
          type: "warning",
          title: "Low stock",
          text: `${item.name} has ${item.stock_quantity} left.`,
          link: "/app/inventory",
        })),
        ...pending.slice(0, 5).map((order) => ({
          id: `order-${order.id}`,
          type: "info",
          title: "Payment pending",
          text: `Order #${order.id} is awaiting payment.`,
          link: "/app/orders",
        })),
      ]);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const closeMenus = (event) => {
      if (!notificationRef.current?.contains(event.target)) setNotificationsOpen(false);
      if (!profileRef.current?.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", closeMenus);
    return () => document.removeEventListener("mousedown", closeMenus);
  }, []);

  const logout = () => {
    localStorage.removeItem("bizpilot_token");
    localStorage.removeItem("bizpilot_user");
    navigate("/login");
  };

  const openNotification = (link) => {
    setNotificationsOpen(false);
    navigate(link);
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Logo />
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="app-nav">
          {nav.map(([label, path, Icon]) => (
            <NavLink key={path} to={path} className={({ isActive }) => isActive ? "active" : ""}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><b>Need help?</b><span>We're here to help.</span></div>
          <div className="profile-mini">
            <div className="avatar">{(user?.name || "U").slice(0, 2).toUpperCase()}</div>
            <div><b>{user?.name || "Business Owner"}</b><span>{user?.email || "Owner"}</span></div>
            <button onClick={logout} title="Log out"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>
      <main className="app-main">
        <header className="app-topbar">
          <div className="top-search"><Search size={17} /><input placeholder="Search your business..." /></div>
          <div className="header-action" ref={notificationRef}>
            <button className="icon-btn" onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileOpen(false); }} aria-label="Open notifications" aria-expanded={notificationsOpen}>
              <Bell size={19} />{notifications.length > 0 && <i />}
            </button>
            {notificationsOpen && (
              <div className="floating-panel notification-panel">
                <div className="floating-panel-head"><div><b>Notifications</b><span>{notifications.length ? `${notifications.length} need your attention` : "You're all caught up"}</span></div><button onClick={() => setNotificationsOpen(false)} aria-label="Close notifications"><X size={16} /></button></div>
                {notifications.length ? notifications.map((item) => (
                  <button className="notification-item" key={item.id} onClick={() => openNotification(item.link)}>
                    <span className={`notification-dot ${item.type}`} /><span><b>{item.title}</b><small>{item.text}</small></span>
                  </button>
                )) : <div className="floating-empty">No new notifications.</div>}
              </div>
            )}
          </div>
          <div className="header-action" ref={profileRef}>
            <button className="top-avatar profile-trigger" onClick={() => { setProfileOpen(!profileOpen); setNotificationsOpen(false); }} aria-label="Open profile menu" aria-expanded={profileOpen}>
              {(user?.name || "U").slice(0, 2).toUpperCase()}
            </button>
            {profileOpen && (
              <div className="floating-panel profile-panel">
                <div className="profile-panel-user"><div className="profile-large-avatar">{(user?.name || "U").slice(0, 2).toUpperCase()}</div><div><b>{user?.name || "Business Owner"}</b><span>{user?.email || "Owner"}</span></div></div>
                <button className="profile-menu-item" onClick={() => { setProfileOpen(false); navigate("/app/settings"); }}><UserCircle size={16} /> Account settings</button>
                <button className="profile-menu-item logout-item" onClick={logout}><LogOut size={16} /> Log out</button>
              </div>
            )}
          </div>
        </header>
        <div className="app-content"><Outlet /></div>
      </main>
    </div>
  );
}
