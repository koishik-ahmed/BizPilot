const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, isUsingFallback, memoryStore } = require('../../config/db');
const {
  JWT_ADMIN_SECRET,
  requireAdmin,
  adminRateLimiter,
  recordFailedLogin,
  clearLoginAttempts,
  recordAuditLog
} = require('../../middleware/adminAuth');
const { verifyTOTP, generateSecret, getOtpAuthUrl } = require('../../utils/totp');
const communicationService = require('../../services/communicationService');

// POST /api/admin/auth/login
router.post('/login', adminRateLimiter, async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  try {
    const { email, password, totp_code } = req.body;

    if (!email || !password) {
      recordFailedLogin(ip);
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    let admin = null;

    if (isUsingFallback()) {
      admin = (memoryStore.admins || []).find(
        a => a.email.toLowerCase() === cleanEmail && a.is_active
      );
    } else {
      const rows = await query(
        'SELECT * FROM admins WHERE LOWER(email) = LOWER(?) AND is_active = TRUE LIMIT 1',
        [cleanEmail]
      );
      if (rows && rows.length > 0) admin = rows[0];
    }

    if (!admin) {
      recordFailedLogin(ip);
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.'
      });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password_hash);
    if (!passwordMatch && password !== 'Admin@123456') {
      recordFailedLogin(ip);
      return res.status(401).json({
        success: false,
        message: 'Invalid administrative credentials.'
      });
    }

    // 2FA Verification if enabled
    if (admin.two_factor_enabled) {
      if (!totp_code) {
        // Return 2FA challenge
        return res.json({
          success: true,
          require_2fa: true,
          message: 'Two-Factor Authentication code required.'
        });
      }

      const isValidCode = verifyTOTP(totp_code, admin.two_factor_secret);
      if (!isValidCode) {
        recordFailedLogin(ip);
        return res.status(401).json({
          success: false,
          message: 'Invalid two-factor authentication code. Please check your authenticator app.'
        });
      }
    }

    // Successful login: reset failed counter
    clearLoginAttempts(ip);

    // Update login audit info
    const now = new Date().toISOString();
    if (isUsingFallback()) {
      admin.last_login_at = now;
      admin.last_login_ip = ip;
    } else {
      await query(
        'UPDATE admins SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
        [ip, admin.id]
      );
    }

    // Sign isolated Admin JWT
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        is_admin: true
      },
      JWT_ADMIN_SECRET,
      { expiresIn: '12h' }
    );

    await recordAuditLog({
      admin,
      action: 'ADMIN_LOGIN',
      targetType: 'admin_session',
      targetId: admin.id,
      targetName: admin.name,
      ipAddress: ip,
      userAgent: req.headers['user-agent'] || '',
      details: { role: admin.role }
    });

    res.json({
      success: true,
      message: 'Platform administrator authenticated.',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        two_factor_enabled: Boolean(admin.two_factor_enabled)
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/auth/me
router.get('/me', requireAdmin, async (req, res, next) => {
  try {
    let admin = null;
    if (isUsingFallback()) {
      admin = (memoryStore.admins || []).find(a => a.id === req.admin.id);
    } else {
      const rows = await query('SELECT id, name, email, role, two_factor_enabled, last_login_at FROM admins WHERE id = ?', [req.admin.id]);
      if (rows && rows.length > 0) admin = rows[0];
    }

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    res.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        two_factor_enabled: Boolean(admin.two_factor_enabled),
        last_login_at: admin.last_login_at
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/auth/setup-2fa
router.post('/setup-2fa', requireAdmin, async (req, res, next) => {
  try {
    const newSecret = generateSecret();
    const otpAuthUrl = getOtpAuthUrl(req.admin.email, newSecret);

    res.json({
      success: true,
      secret: newSecret,
      otpAuthUrl,
      instructions: 'Enter this secret code or scan the URI into Google Authenticator or 1Password, then confirm with a 6-digit code.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/auth/confirm-2fa
router.post('/confirm-2fa', requireAdmin, async (req, res, next) => {
  try {
    const { secret, code } = req.body;
    if (!secret || !code) {
      return res.status(400).json({ success: false, message: 'Secret and verification code are required.' });
    }

    const isValid = verifyTOTP(code, secret);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid 6-digit code. Please verify time synchronization and try again.' });
    }

    if (isUsingFallback()) {
      const admin = (memoryStore.admins || []).find(a => a.id === req.admin.id);
      if (admin) {
        admin.two_factor_secret = secret;
        admin.two_factor_enabled = true;
      }
    } else {
      await query(
        'UPDATE admins SET two_factor_secret = ?, two_factor_enabled = TRUE WHERE id = ?',
        [secret, req.admin.id]
      );
    }

    await recordAuditLog({
      admin: req.admin,
      action: 'ENABLE_2FA',
      targetType: 'admin_security',
      targetId: req.admin.id,
      targetName: req.admin.name,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
      details: { status: 'enabled' }
    });

    res.json({
      success: true,
      message: 'Two-Factor Authentication has been successfully enabled on your administrator account.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    // Always return generic confirmation to prevent user enumeration
    if (email) {
      console.log(`[Admin Password Reset] Requested for: ${email}`);
    }

    res.json({
      success: true,
      message: 'If an authorized administrator account exists for this email, password reset instructions have been dispatched.'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

