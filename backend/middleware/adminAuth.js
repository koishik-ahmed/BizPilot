const jwt = require('jsonwebtoken');
const { query, isUsingFallback, memoryStore } = require('../config/db');

const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET || 'bizpilot_admin_super_secret_isolated_key_2026';

// Memory store for admin login rate limiting: 5 attempts per 15 mins per IP
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function adminRateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    if (now - record.firstAttempt < RATE_LIMIT_WINDOW_MS) {
      if (record.count >= MAX_ATTEMPTS) {
        const remainingMinutes = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.firstAttempt)) / 60000);
        return res.status(429).json({
          success: false,
          message: `Too many failed login attempts. Account access locked for ${remainingMinutes} more minute(s).`
        });
      }
    } else {
      // Window expired, reset
      loginAttempts.set(ip, { count: 0, firstAttempt: now });
    }
  } else {
    loginAttempts.set(ip, { count: 0, firstAttempt: now });
  }

  next();
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  record.count += 1;
  loginAttempts.set(ip, record);
}

function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

// requireAdmin middleware - Validates isolated admin token and admin role
async function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Platform Admin access denied. No administrative token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_ADMIN_SECRET);

    if (!decoded.role || !['super_admin', 'support', 'billing', 'readonly'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Insufficient administrative privileges.'
      });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired administrator session. Please log in again.'
    });
  }
}

// Role restriction helper
function requireRole(roles = []) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Action requires one of the following roles: ${roles.join(', ')}.`
      });
    }

    next();
  };
}

// Audit logger helper
async function recordAuditLog({
  admin,
  action,
  targetType,
  targetId = null,
  targetName = null,
  ipAddress = '127.0.0.1',
  userAgent = '',
  details = {}
}) {
  const logEntry = {
    admin_id: admin?.id || null,
    admin_email: admin?.email || 'system@bizpilot.io',
    action,
    target_type: targetType,
    target_id: targetId ? String(targetId) : null,
    target_name: targetName ? String(targetName) : null,
    ip_address: ipAddress,
    user_agent: userAgent,
    details,
    created_at: new Date().toISOString()
  };

  try {
    if (isUsingFallback()) {
      if (!memoryStore.admin_audit_logs) memoryStore.admin_audit_logs = [];
      const newId = (memoryStore.admin_audit_logs.length || 0) + 1;
      memoryStore.admin_audit_logs.unshift({ id: newId, ...logEntry });
    } else {
      await query(
        `INSERT INTO admin_audit_logs (admin_id, admin_email, action, target_type, target_id, target_name, ip_address, user_agent, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logEntry.admin_id,
          logEntry.admin_email,
          logEntry.action,
          logEntry.target_type,
          logEntry.target_id,
          logEntry.target_name,
          logEntry.ip_address,
          logEntry.user_agent,
          JSON.stringify(logEntry.details)
        ]
      );
    }
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = {
  JWT_ADMIN_SECRET,
  requireAdmin,
  requireRole,
  adminRateLimiter,
  recordFailedLogin,
  clearLoginAttempts,
  recordAuditLog,
  getRateLimitStats: () => Array.from(loginAttempts.entries())
};

