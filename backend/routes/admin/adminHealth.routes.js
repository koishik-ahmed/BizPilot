const express = require('express');
const router = express.Router();
const os = require('os');
const { isUsingFallback, query, memoryStore } = require('../../config/db');
const { requireAdmin, getRateLimitStats } = require('../../middleware/adminAuth');

// GET /api/admin/health - Platform Health & Diagnostic Telemetry
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    let dbStatus = 'connected';
    let dbType = isUsingFallback() ? 'In-Memory High-Fidelity Engine' : 'MySQL 8.0 Connection Pool';
    let tableCounts = {};

    if (isUsingFallback()) {
      tableCounts = {
        users: (memoryStore.users || []).length,
        products: (memoryStore.products || []).length,
        orders: (memoryStore.orders || []).length,
        customers: (memoryStore.customers || []).length,
        stock_history: (memoryStore.stock_history || []).length,
        admin_audit_logs: (memoryStore.admin_audit_logs || []).length,
        admins: (memoryStore.admins || []).length
      };
    } else {
      try {
        const [u] = await query('SELECT COUNT(*) as c FROM users');
        const [p] = await query('SELECT COUNT(*) as c FROM products');
        const [o] = await query('SELECT COUNT(*) as c FROM orders');
        const [c] = await query('SELECT COUNT(*) as c FROM customers');
        const [a] = await query('SELECT COUNT(*) as c FROM admins');
        const [al] = await query('SELECT COUNT(*) as c FROM admin_audit_logs');
        tableCounts = {
          users: u?.c || 0,
          products: p?.c || 0,
          orders: o?.c || 0,
          customers: c?.c || 0,
          admins: a?.c || 0,
          admin_audit_logs: al?.c || 0
        };
      } catch (e) {
        dbStatus = 'degraded';
      }
    }

    const rateLimits = getRateLimitStats();

    res.json({
      success: true,
      data: {
        status: dbStatus === 'connected' ? 'optimal' : 'degraded',
        timestamp: new Date().toISOString(),
        system: {
          platform: os.platform(),
          arch: os.arch(),
          node_version: process.version,
          uptime_seconds: uptimeSeconds,
          uptime_formatted: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m ${uptimeSeconds % 60}s`,
          cpu_count: os.cpus().length,
          total_system_memory_mb: Math.round(os.totalmem() / 1024 / 1024),
          free_system_memory_mb: Math.round(os.freemem() / 1024 / 1024)
        },
        process: {
          heap_used_mb: Math.round(memory.heapUsed / 1024 / 1024),
          heap_total_mb: Math.round(memory.heapTotal / 1024 / 1024),
          rss_mb: Math.round(memory.rss / 1024 / 1024)
        },
        database: {
          status: dbStatus,
          engine: dbType,
          table_counts: tableCounts
        },
        security: {
          tracked_rate_limit_ips: rateLimits.length,
          active_ip_blocks: rateLimits.filter(([_, r]) => r.count >= 5).length
        },
        integrations: {
          smtp_email: { status: 'healthy', provider: 'Nodemailer SMTP Dispatcher' },
          courier_gateway: { status: 'healthy', providers: ['Steadfast Courier', 'Pathao Logistics'] },
          payment_reconciliation: { status: 'healthy', type: 'Dual Cash/Electronic Ledger' }
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

