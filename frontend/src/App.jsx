import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// Public Pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import ServicesPage from './pages/public/ServicesPage';
import TestimonialsPage from './pages/public/TestimonialsPage';
import ContactPage from './pages/public/ContactPage';
// Merchant Private Layout & Pages
import PrivateLayout from './components/layout/PrivateLayout';
import DashboardPage from './pages/private/DashboardPage';
import ProductsPage from './pages/private/ProductsPage';
import InventoryPage from './pages/private/InventoryPage';
import StockHistoryPage from './pages/private/StockHistoryPage';
import OrdersPage from './pages/private/OrdersPage';
import PlaceOrderWizard from './pages/private/PlaceOrderWizard';
import CustomersPage from './pages/private/CustomersPage';
import RevenuePage from './pages/private/RevenuePage';
import CourierPage from './pages/private/CourierPage';
import ReportsPage from './pages/private/ReportsPage';
import AIInsightsPage from './pages/private/AIInsightsPage';
import SettingsPage from './pages/private/SettingsPage';
import ProfilePage from './pages/private/ProfilePage';

// Platform Admin Layout & Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMerchantsPage from './pages/admin/AdminMerchantsPage';
import AdminMerchantDetailPage from './pages/admin/AdminMerchantDetailPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminConfigPage from './pages/admin/AdminConfigPage';
import AdminHealthPage from './pages/admin/AdminHealthPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminAuthProvider>
          <NotificationProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Routes>
                {/* Public Storefront & Marketing Pages */}
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/testimonials" element={<TestimonialsPage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* Merchant Authentication Routes -> Seamlessly Redirects to Homepage Popup */}
                <Route path="/login" element={<Navigate to="/?auth=login" replace />} />
                <Route path="/signup" element={<Navigate to="/?auth=signup" replace />} />

                {/* Authenticated Merchant Dashboard Routes */}
                <Route element={<PrivateLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/stock-history" element={<StockHistoryPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/orders/new" element={<PlaceOrderWizard />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/revenue" element={<RevenuePage />} />
                  <Route path="/courier" element={<CourierPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/ai-insights" element={<AIInsightsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                </Route>

                {/* Isolated Platform Admin Authentication */}
                <Route path="/admin/login" element={<AdminLoginPage />} />

                {/* Platform Admin Console Suite */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboardPage />} />
                  <Route path="merchants" element={<AdminMerchantsPage />} />
                  <Route path="merchants/:id" element={<AdminMerchantDetailPage />} />
                  <Route path="orders" element={<AdminOrdersPage />} />
                  <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                  <Route path="config" element={<AdminConfigPage />} />
                  <Route path="health" element={<AdminHealthPage />} />
                  <Route path="users" element={<AdminUsersPage />} />
                </Route>

                {/* Global 404 Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
