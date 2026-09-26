const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query, isUsingFallback, memoryStore } = require('../../config/db');
const { requireAdmin, requireRole, recordAuditLog } = require('../../middleware/adminAuth');
const { generateSecret } = require('../../utils/totp');

// GET /api/admin/users - List administrators
router.get('/', requireAdmin, requireRole(['super_admin']), async (req, res, next) => {
  try {
    let admins = [];

    if (isUsingFallback()) {
      admins = (memoryStore.admins || []).map(a => ({
        id: a.id,
        name: a.name,
        email: a.email,
        role: a.role,
        two_factor_enabled: Boolean(a.two_factor_enabled),
        is_active: Boolean(a.is_active),
        last_login_at: a.last_login_at,
        created_at: a.created_at
      }));
    } else {
      admins = await query(
        'SELECT id, name, email, role, two_factor_enabled, is_active, last_login_at, created_at FROM admins ORDER BY id ASC'
      ) || [];
    }

    res.json({
      success: true,
      admins
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users - Invite/Create administrator (super_admin only)
router.post('/', requireAdmin, requireRole(['super_admin']), async (req, res, next) => {
  try {
    const { name, email, role = 'support', initial_password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const tempPassword = initial_password || crypto.randomBytes(6).toString('hex') + '!Aa1';
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const totpSecret = generateSecret();

    if (isUsingFallback()) {
      const existing = (memoryStore.admins || []).find(a => a.email.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(400).json({ success: false, message: 'An administrator with this email already exists.' });
      }

      const newId = (memoryStore.admins?.length || 0) + 1;
      const newAdmin = {
        id: newId,
        name: name.trim(),
        email: cleanEmail,
        password_hash: passwordHash,
        role,
        two_factor_secret: totpSecret,
        two_factor_enabled: false,
        is_active: true,
        created_at: new Date().toISOString()
      };
      memoryStore.admins.push(newAdmin);
    } else {
      const existing = await query('SELECT id FROM admins WHERE LOWER(email) = LOWER(?)', [cleanEmail]);
      if (existing && existing.length > 0) {
        return res.status(400).json({ success: false, message: 'An administrator with this email already exists.' });
      }

      await query(
        'INSERT INTO admins (name, email, password_hash, role, two_factor_secret, two_factor_enabled) VALUES (?, ?, ?, ?, ?, FALSE)',
        [name.trim(), cleanEmail, passwordHash, role, totpSecret]
      );
    }

    await recordAuditLog({
      admin: req.admin,
      action: 'CREATE_ADMIN_ACCOUNT',
      targetType: 'admin_account',
      targetName: cleanEmail,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
      details: { role, initial_password_provided: Boolean(initial_password) }
    });

    res.status(201).json({
      success: true,
      message: `Admin account for ${cleanEmail} created successfully.`,
      temporary_password: tempPassword
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/users/:id - Revoke admin access
router.delete('/:id', requireAdmin, requireRole(['super_admin']), async (req, res, next) => {
  try {
    const adminId = parseInt(req.params.id, 10);

    if (adminId === req.admin.id) {
      return res.status(400).json({ success: false, message: 'You cannot revoke your own administrator credentials.' });
    }

    let targetAdmin = null;

    if (isUsingFallback()) {
      targetAdmin = (memoryStore.admins || []).find(a => a.id === adminId);
      if (targetAdmin) {
        memoryStore.admins = memoryStore.admins.filter(a => a.id !== adminId);
      }
    } else {
      const rows = await query('SELECT * FROM admins WHERE id = ?', [adminId]);
      if (rows && rows.length > 0) {
        targetAdmin = rows[0];
        await query('DELETE FROM admins WHERE id = ?', [adminId]);
      }
    }

    if (!targetAdmin) {
      return res.status(404).json({ success: false, message: 'Administrator account not found.' });
    }

    await recordAuditLog({
      admin: req.admin,
      action: 'REVOKE_ADMIN_ACCESS',
      targetType: 'admin_account',
      targetId: adminId,
      targetName: targetAdmin.email,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'
    });

    res.json({
      success: true,
      message: `Administrator access for ${targetAdmin.email} has been immediately revoked.`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

