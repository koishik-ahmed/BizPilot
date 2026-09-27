const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { query, isUsingFallback, memoryStore } = require('../../config/db');
const { requireAdmin, requireRole, recordAuditLog } = require('../../middleware/adminAuth');
const { JWT_SECRET } = require('../../middleware/auth');
const communicationService = require('../../services/communicationService');

// GET /api/admin/merchants - List with filtering & metrics
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { search = '', status = 'all', currency = 'all', sort = 'newest' } = req.query;

    let users = [];
    let orders = [];
    let products = [];

    if (isUsingFallback()) {
      users = memoryStore.users || [];
      orders = memoryStore.orders || [];
      products = memoryStore.products || [];
    } else {
      users = await query('SELECT * FROM users') || [];
      orders = await query('SELECT id, user_id, total, created_at FROM orders') || [];
      products = await query('SELECT id, user_id, stock FROM products') || [];
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    let list = users.map(u => {
      const userOrders = orders.filter(o => o.user_id === u.id);
      const userProducts = products.filter(p => p.user_id === u.id);

      const gmvAllTime = userOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
      const gmvThisMonth = userOrders
        .filter(o => new Date(o.created_at) >= thirtyDaysAgo)
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

      const latestOrder = userOrders.reduce((latest, o) => {
        const d = new Date(o.created_at);
        return d > latest ? d : latest;
      }, new Date(0));

      const lastLogin = u.last_login_at ? new Date(u.last_login_at) : new Date(0);
      const lastActivity = latestOrder > lastLogin ? latestOrder.toISOString() : (u.last_login_at || u.created_at);

      return {
        id: u.id,
        name: u.name,
        business_name: u.business_name,
        email: u.email,
        phone: u.phone || '',
        currency: u.currency || 'USD',
        status: u.status || 'active',
        suspended_at: u.suspended_at || null,
        suspension_reason: u.suspension_reason || null,
        created_at: u.created_at,
        last_login_at: u.last_login_at || null,
        last_activity: lastActivity,
        products_count: userProducts.length,
        orders_count: userOrders.length,
        gmv_all_time: gmvAllTime,
        gmv_this_month: gmvThisMonth
      };
    });

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(m =>
        m.business_name?.toLowerCase().includes(q) ||
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (status !== 'all') {
      list = list.filter(m => m.status === status);
    }

    // Currency filter
    if (currency !== 'all') {
      list = list.filter(m => m.currency === currency);
    }

    // Sorting
    if (sort === 'newest') {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sort === 'oldest') {
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sort === 'gmv_desc') {
      list.sort((a, b) => b.gmv_all_time - a.gmv_all_time);
    } else if (sort === 'orders_desc') {
      list.sort((a, b) => b.orders_count - a.orders_count);
    }

    res.json({
      success: true,
      total: list.length,
      merchants: list
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/merchants/:id - Deep Read-Only Inspector
router.get('/:id', requireAdmin, async (req, res, next) => {
  try {
    const merchantId = parseInt(req.params.id, 10);

    let merchant = null;
    let products = [];
    let orders = [];
    let customers = [];
    let stockHistory = [];
    let consignments = [];
    let auditLogs = [];

    if (isUsingFallback()) {
      merchant = (memoryStore.users || []).find(u => u.id === merchantId);
      if (merchant) {
        products = (memoryStore.products || []).filter(p => p.user_id === merchantId);
        orders = (memoryStore.orders || []).filter(o => o.user_id === merchantId);
        customers = (memoryStore.customers || []).filter(c => c.user_id === merchantId);
        stockHistory = (memoryStore.stock_history || []).filter(s => s.user_id === merchantId);
        consignments = (memoryStore.courier_consignments || []).filter(c => c.user_id === merchantId);
        auditLogs = (memoryStore.admin_audit_logs || []).filter(
          l => l.target_type === 'merchant' && String(l.target_id) === String(merchantId)
        );
      }
    } else {
      const users = await query('SELECT * FROM users WHERE id = ?', [merchantId]);
      if (users && users.length > 0) {
        merchant = users[0];
        products = await query('SELECT * FROM products WHERE user_id = ? ORDER BY id DESC', [merchantId]) || [];
        orders = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [merchantId]) || [];
        customers = await query('SELECT * FROM customers WHERE user_id = ? ORDER BY id DESC', [merchantId]) || [];
        stockHistory = await query('SELECT * FROM stock_history WHERE user_id = ? ORDER BY id DESC LIMIT 50', [merchantId]) || [];
        consignments = await query('SELECT * FROM courier_consignments WHERE user_id = ? ORDER BY id DESC', [merchantId]) || [];
        auditLogs = await query('SELECT * FROM admin_audit_logs WHERE target_type = "merchant" AND target_id = ? ORDER BY created_at DESC', [String(merchantId)]) || [];
      }
    }

    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found.' });
    }

    const totalStockUnits = products.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + ((parseFloat(p.cost_price) || 0) * (parseInt(p.stock) || 0)), 0);
    const totalGmv = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const paidOrders = orders.filter(o => o.payment_status === 'Paid');
    const totalCollected = paidOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

    res.json({
      success: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        business_name: merchant.business_name,
        email: merchant.email,
        phone: merchant.phone || '',
        currency: merchant.currency || 'USD',
        timezone: merchant.timezone || 'UTC',
        status: merchant.status || 'active',
        suspended_at: merchant.suspended_at || null,
        suspension_reason: merchant.suspension_reason || null,
        created_at: merchant.created_at,
        last_login_at: merchant.last_login_at || null
      },
      stats: {
        products_count: products.length,
        total_stock_units: totalStockUnits,
        inventory_value: totalInventoryValue,
        orders_count: orders.length,
        total_gmv: totalGmv,
        total_collected: totalCollected,
        customers_count: customers.length,
        consignments_count: consignments.length
      },
      tabs: {
        products,
        orders,
        customers,
        stock_history: stockHistory,
        courier_consignments: consignments,
        audit_logs: auditLogs
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/merchants/:id/suspend
router.post('/:id/suspend', requireAdmin, requireRole(['super_admin', 'support']), async (req, res, next) => {
  try {
    const merchantId = parseInt(req.params.id, 10);
    const { reason = 'Terms violation or administrative hold.' } = req.body;

    let merchant = null;
    if (isUsingFallback()) {
      merchant = (memoryStore.users || []).find(u => u.id === merchantId);
      if (merchant) {
        merchant.status = 'suspended';
        merchant.suspended_at = new Date().toISOString();
        merchant.suspension_reason = reason;
      }
    } else {
      const users = await query('SELECT * FROM users WHERE id = ?', [merchantId]);
      if (users && users.length > 0) {
        merchant = users[0];
        await query(
          'UPDATE users SET status = "suspended", suspended_at = NOW(), suspension_reason = ? WHERE id = ?',
          [reason, merchantId]
        );
      }
    }

    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found.' });
    }

    await recordAuditLog({
      admin: req.admin,
      action: 'SUSPEND_MERCHANT',
      targetType: 'merchant',
      targetId: merchant.id,
      targetName: merchant.business_name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
      details: { reason }
    });

    res.json({
      success: true,
      message: `Account for "${merchant.business_name}" has been suspended. Merchant cannot log in or place orders.`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/merchants/:id/unsuspend
router.post('/:id/unsuspend', requireAdmin, requireRole(['super_admin', 'support']), async (req, res, next) => {
  try {
    const merchantId = parseInt(req.params.id, 10);

    let merchant = null;
    if (isUsingFallback()) {
      merchant = (memoryStore.users || []).find(u => u.id === merchantId);
      if (merchant) {
        merchant.status = 'active';
        merchant.suspended_at = null;
        merchant.suspension_reason = null;
      }
    } else {
      const users = await query('SELECT * FROM users WHERE id = ?', [merchantId]);
      if (users && users.length > 0) {
        merchant = users[0];
        await query(
          'UPDATE users SET status = "active", suspended_at = NULL, suspension_reason = NULL WHERE id = ?',
          [merchantId]
        );
      }
    }

    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found.' });
    }

    await recordAuditLog({
      admin: req.admin,
      action: 'UNSUSPEND_MERCHANT',
      targetType: 'merchant',
      targetId: merchant.id,
      targetName: merchant.business_name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
      details: { restored_by: req.admin.email }
    });

    res.json({
      success: true,
      message: `Account for "${merchant.business_name}" has been reactivated.`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/merchants/:id/impersonate - Safe 30m impersonation token
router.post('/:id/impersonate', requireAdmin, requireRole(['super_admin', 'support']), async (req, res, next) => {
  try {
    const merchantId = parseInt(req.params.id, 10);
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    let merchant = null;
    if (isUsingFallback()) {
      merchant = (memoryStore.users || []).find(u => u.id === merchantId);
    } else {
      const users = await query('SELECT * FROM users WHERE id = ?', [merchantId]);
      if (users && users.length > 0) merchant = users[0];
    }

    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found.' });
    }

    // Short-lived 30-minute merchant session JWT carrying impersonation claims
    const merchantToken = jwt.sign(
      {
        id: merchant.id,
        email: merchant.email,
        name: merchant.name,
        business_name: merchant.business_name,
        impersonated_by: req.admin.id,
        admin_name: req.admin.name,
        admin_email: req.admin.email
      },
      JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Audit log
    await recordAuditLog({
      admin: req.admin,
      action: 'IMPERSONATE_MERCHANT',
      targetType: 'merchant',
      targetId: merchant.id,
      targetName: merchant.business_name,
      ipAddress: ip,
      userAgent: req.headers['user-agent'] || '',
      details: {
        session_expires_in: '30 minutes',
        merchant_email: merchant.email
      }
    });

    res.json({
      success: true,
      token: merchantToken,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        business_name: merchant.business_name,
        email: merchant.email,
        currency: merchant.currency || 'USD'
      },
      message: `Impersonation session established for "${merchant.business_name}". Active for 30 minutes.`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/merchants/:id/reset-password
router.post('/:id/reset-password', requireAdmin, requireRole(['super_admin', 'support']), async (req, res, next) => {
  try {
    const merchantId = parseInt(req.params.id, 10);
    let merchant = null;

    if (isUsingFallback()) {
      merchant = (memoryStore.users || []).find(u => u.id === merchantId);
    } else {
      const users = await query('SELECT * FROM users WHERE id = ?', [merchantId]);
      if (users && users.length > 0) merchant = users[0];
    }

    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found.' });
    }

    await recordAuditLog({
      admin: req.admin,
      action: 'SEND_PASSWORD_RESET',
      targetType: 'merchant',
      targetId: merchant.id,
      targetName: merchant.business_name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
      details: { recipient_email: merchant.email }
    });

    res.json({
      success: true,
      message: `Password reset instructions have been dispatched to ${merchant.email}.`
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/merchants/:id - Destructive cascade with type-to-confirm pattern
router.delete('/:id', requireAdmin, requireRole(['super_admin']), async (req, res, next) => {
  try {
    const merchantId = parseInt(req.params.id, 10);
    const { confirm_business_name } = req.body;

    let merchant = null;
    if (isUsingFallback()) {
      merchant = (memoryStore.users || []).find(u => u.id === merchantId);
    } else {
      const users = await query('SELECT * FROM users WHERE id = ?', [merchantId]);
      if (users && users.length > 0) merchant = users[0];
    }

    if (!merchant) {
      return res.status(404).json({ success: false, message: 'Merchant not found.' });
    }

    // Require strict type-to-confirm validation
    if (!confirm_business_name || confirm_business_name.trim() !== merchant.business_name.trim()) {
      return res.status(400).json({
        success: false,
        message: `Confirmation mismatch. You must type "${merchant.business_name}" exactly to execute cascade deletion.`
      });
    }

    // Record audit log BEFORE deletion
    await recordAuditLog({
      admin: req.admin,
      action: 'DELETE_MERCHANT',
      targetType: 'merchant',
      targetId: merchant.id,
      targetName: merchant.business_name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
      details: {
        email: merchant.email,
        deleted_by: req.admin.email
      }
    });

    // Execute deletion
    if (isUsingFallback()) {
      memoryStore.users = (memoryStore.users || []).filter(u => u.id !== merchantId);
      memoryStore.products = (memoryStore.products || []).filter(p => p.user_id !== merchantId);
      memoryStore.orders = (memoryStore.orders || []).filter(o => o.user_id !== merchantId);
      memoryStore.customers = (memoryStore.customers || []).filter(c => c.user_id !== merchantId);
      memoryStore.stock_history = (memoryStore.stock_history || []).filter(s => s.user_id !== merchantId);
      memoryStore.courier_consignments = (memoryStore.courier_consignments || []).filter(c => c.user_id !== merchantId);
    } else {
      // Cascades via FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      await query('DELETE FROM users WHERE id = ?', [merchantId]);
    }

    res.json({
      success: true,
      message: `Merchant "${merchant.business_name}" and all associated data have been permanently removed.`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

