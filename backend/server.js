const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const productsRoutes = require('./routes/products.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const stockHistoryRoutes = require('./routes/stockHistory.routes');
const ordersRoutes = require('./routes/orders.routes');
const customersRoutes = require('./routes/customers.routes');
const revenueRoutes = require('./routes/revenue.routes');
const courierRoutes = require('./routes/courier.routes');
const reportsRoutes = require('./routes/reports.routes');
const aiRoutes = require('./routes/ai.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const settingsRoutes = require('./routes/settings.routes');
const searchRoutes = require('./routes/search.routes');
const testimonialsRoutes = require('./routes/testimonials.routes');

// Platform Admin Route Imports
const adminAuthRoutes = require('./routes/admin/adminAuth.routes');
const adminDashboardRoutes = require('./routes/admin/adminDashboard.routes');
const adminMerchantsRoutes = require('./routes/admin/adminMerchants.routes');
const adminOrdersRoutes = require('./routes/admin/adminOrders.routes');
const adminAuditRoutes = require('./routes/admin/adminAudit.routes');
const adminConfigRoutes = require('./routes/admin/adminConfig.routes');
const adminHealthRoutes = require('./routes/admin/adminHealth.routes');
const adminUsersRoutes = require('./routes/admin/adminUsers.routes');
const adminSearchRoutes = require('./routes/admin/adminSearch.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'BizPilot Business Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/stock-history', stockHistoryRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/courier', courierRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/testimonials', testimonialsRoutes);

// Platform Admin Routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/merchants', adminMerchantsRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);
app.use('/api/admin/audit-logs', adminAuditRoutes);
app.use('/api/admin/config', adminConfigRoutes);
app.use('/api/admin/health', adminHealthRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/search', adminSearchRoutes);

// Global Error Handler
app.use(errorHandler);

// Initialize DB & Start Server
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 BizPilot Backend Server is listening on port ${PORT}`);
    console.log(`🌐 Base API URL: http://localhost:${PORT}/api`);
    console.log(`✨ Status check: http://localhost:${PORT}/api/health`);
    console.log(`======================================================\n`);
  });
}

startServer();

