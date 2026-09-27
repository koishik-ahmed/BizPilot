const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../../config/db');
const { requireAdmin, requireRole, recordAuditLog } = require('../../middleware/adminAuth');

// Default initial flags
const DEFAULT_CONFIG = {
  allow_signups: 'true',
  email_service_enabled: 'true',
  sms_service_enabled: 'true',
  courier_service_enabled: 'true',
  maintenance_mode: 'false',
  announcement_banner: 'All platform systems, courier webhooks, and payment reconciliation are operational.'
};

// GET /api/admin/config - Get current feature flags and system config
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    let config = { ...DEFAULT_CONFIG };

    if (isUsingFallback()) {
      config = { ...DEFAULT_CONFIG, ...(memoryStore.platform_config || {}) };
    } else {
      const rows = await query('SELECT config_key, config_value FROM platform_config') || [];
      rows.forEach(r => {
        config[r.config_key] = r.config_value;
      });
    }

    res.json({
      success: true,
      config
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/config - Update feature flags / announcement
router.put('/', requireAdmin, requireRole(['super_admin']), async (req, res, next) => {
  try {
    const newConfig = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    if (isUsingFallback()) {
      if (!memoryStore.platform_config) memoryStore.platform_config = { ...DEFAULT_CONFIG };
      Object.keys(newConfig).forEach(key => {
        memoryStore.platform_config[key] = String(newConfig[key]);
      });
    } else {
      for (const [key, value] of Object.entries(newConfig)) {
        await query(
          `INSERT INTO platform_config (config_key, config_value, updated_by_admin)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_by_admin = VALUES(updated_by_admin)`,
          [key, String(value), req.admin.email]
        );
      }
    }

    await recordAuditLog({
      admin: req.admin,
      action: 'UPDATE_PLATFORM_CONFIG',
      targetType: 'system_config',
      targetId: 'global',
      targetName: 'Platform Configuration & Feature Flags',
      ipAddress: ip,
      details: newConfig
    });

    res.json({
      success: true,
      message: 'Platform configuration updated successfully.',
      config: newConfig
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/config/public-announcement (Unauthenticated public endpoint)
router.get('/public-announcement', async (req, res, next) => {
  try {
    let announcement = '';
    let allowSignups = true;

    if (isUsingFallback()) {
      announcement = memoryStore.platform_config?.announcement_banner || '';
      allowSignups = memoryStore.platform_config?.allow_signups !== 'false';
    } else {
      const rows = await query('SELECT config_key, config_value FROM platform_config WHERE config_key IN ("announcement_banner", "allow_signups")') || [];
      rows.forEach(r => {
        if (r.config_key === 'announcement_banner') announcement = r.config_value;
        if (r.config_key === 'allow_signups') allowSignups = r.config_value !== 'false';
      });
    }

    res.json({
      success: true,
      announcement_banner: announcement,
      allow_signups: allowSignups
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

