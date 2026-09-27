const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../../config/db');
const { requireAdmin } = require('../../middleware/adminAuth');

// GET /api/admin/audit-logs - Immutable Audit Trail Browser
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const { action = 'all', search = '', limit = 100 } = req.query;

    let logs = [];

    if (isUsingFallback()) {
      logs = [...(memoryStore.admin_audit_logs || [])];
    } else {
      logs = await query('SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT ?', [parseInt(limit, 10) || 100]) || [];
    }

    if (action !== 'all') {
      logs = logs.filter(l => l.action?.toLowerCase() === action.toLowerCase());
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      logs = logs.filter(l =>
        l.admin_email?.toLowerCase().includes(q) ||
        l.target_name?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.ip_address?.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      total: logs.length,
      logs
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

