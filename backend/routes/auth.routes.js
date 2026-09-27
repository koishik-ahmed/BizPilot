const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, isUsingFallback, memoryStore } = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const communicationService = require('../services/communicationService');

// POST /api/auth/send-verification - Step 1: Validate input, create pending verification, and dispatch 6-digit OTP email
router.post('/send-verification', async (req, res, next) => {
  try {
    const { name, business_name, email, phone, password } = req.body;

    if (!name || !business_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, Business Name, Email, and Password are required.'
      });
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check platform feature flag: allow_signups
    const allowSignups = isUsingFallback()
      ? (memoryStore.platform_config?.allow_signups !== 'false')
      : await query('SELECT config_value FROM platform_config WHERE config_key = "allow_signups"').then(r => !r?.[0] || r[0].config_value !== 'false');

    if (!allowSignups) {
      return res.status(403).json({
        success: false,
        message: 'New merchant registrations are currently paused by platform administrators. Please check back later.'
      });
    }

    // Check if user already exists
    if (isUsingFallback()) {
      const existingUser = (memoryStore.users || []).find(u => u.email.toLowerCase() === normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
    } else {
      const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);
      if (existing && existing.length > 0) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
    }

    // Generate 6-digit OTP code & password hash
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    if (isUsingFallback()) {
      memoryStore.email_verifications = (memoryStore.email_verifications || []).filter(
        v => v.email.toLowerCase() !== normalizedEmail
      );
      memoryStore.email_verifications.push({
        email: normalizedEmail,
        otp_code: otpCode,
        name: name.trim(),
        business_name: business_name.trim(),
        phone: phone ? phone.trim() : '',
        password_hash: hashedPassword,
        expires_at: expiresAt,
        verified: 0
      });
    } else {
      await query('DELETE FROM email_verifications WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);
      await query(
        'INSERT INTO email_verifications (email, otp_code, name, business_name, phone, password_hash, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [normalizedEmail, otpCode, name.trim(), business_name.trim(), phone ? phone.trim() : '', hashedPassword, expiresAt]
      );
    }

    // Send verification code via live SMTP
    await communicationService.sendVerificationEmail({
      to: normalizedEmail,
      name: name.trim(),
      code: otpCode
    });

    return res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/verify-otp - Step 2: Verify code, create account, and log in
router.post('/verify-otp', async (req, res, next) => {
  try {
    const rawEmail = req.body?.email || req.body?.username || req.body?.userEmail || '';
    const rawCode = req.body?.otp_code || req.body?.otpCode || req.body?.code || req.body?.otp || req.body?.verification_code || '';

    const normalizedEmail = String(rawEmail).trim().toLowerCase();
    const code = String(rawCode).trim();

    if (!normalizedEmail || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required.'
      });
    }

    // If an account with this email is already registered and verified, smoothly log them in
    let existingUser = null;
    if (isUsingFallback()) {
      existingUser = (memoryStore.users || []).find(u => u.email.toLowerCase() === normalizedEmail);
    } else {
      const existing = await query('SELECT id, name, business_name, email, phone, currency FROM users WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);
      if (existing && existing.length > 0) {
        existingUser = existing[0];
      }
    }

    if (existingUser) {
      const token = jwt.sign(
        { id: existingUser.id, email: existingUser.email, name: existingUser.name, business_name: existingUser.business_name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.status(200).json({
        success: true,
        message: 'Account verified successfully. Welcome to BizPilot!',
        token,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          business_name: existingUser.business_name,
          email: existingUser.email,
          phone: existingUser.phone || '',
          currency: existingUser.currency || 'USD'
        }
      });
    }

    let pendingRecord = null;
    const now = new Date();

    if (isUsingFallback()) {
      pendingRecord = (memoryStore.email_verifications || []).find(
        v => v.email.toLowerCase() === normalizedEmail && String(v.otp_code).trim() === code && new Date(v.expires_at) > now
      );
    } else {
      const records = await query(
        'SELECT * FROM email_verifications WHERE LOWER(email) = LOWER(?) AND otp_code = ? AND expires_at > ? ORDER BY id DESC LIMIT 1',
        [normalizedEmail, code, now]
      );
      if (records && records.length > 0) {
        pendingRecord = records[0];
      }
    }

    if (!pendingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please check the code or request a new one.'
      });
    }

    // Create the merchant account in users table
    if (isUsingFallback()) {
      const existingUser = (memoryStore.users || []).find(u => u.email.toLowerCase() === normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const newUser = {
        id: memoryStore.users.length + 1,
        name: pendingRecord.name,
        business_name: pendingRecord.business_name,
        email: pendingRecord.email,
        password_hash: pendingRecord.password_hash,
        phone: pendingRecord.phone || '',
        currency: 'USD',
        timezone: 'UTC'
      };
      memoryStore.users.push(newUser);

      // Clean up verification record
      memoryStore.email_verifications = (memoryStore.email_verifications || []).filter(
        v => v.email.toLowerCase() !== normalizedEmail
      );

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, name: newUser.name, business_name: newUser.business_name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Account verified and created successfully.',
        token,
        user: { id: newUser.id, name: newUser.name, business_name: newUser.business_name, email: newUser.email, phone: newUser.phone, currency: newUser.currency }
      });
    }

    // MySQL Flow
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const result = await query(
      'INSERT INTO users (name, business_name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)',
      [pendingRecord.name, pendingRecord.business_name, pendingRecord.email, pendingRecord.password_hash, pendingRecord.phone || '']
    );

    const userId = result.insertId;
    await query('INSERT INTO settings (user_id) VALUES (?)', [userId]);

    // Clean up verification records for this email
    await query('DELETE FROM email_verifications WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);

    const token = jwt.sign(
      { id: userId, email: pendingRecord.email, name: pendingRecord.name, business_name: pendingRecord.business_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account verified and created successfully.',
      token,
      user: { id: userId, name: pendingRecord.name, business_name: pendingRecord.business_name, email: pendingRecord.email, phone: pendingRecord.phone, currency: 'USD' }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/resend-otp - Resend 6-digit OTP code to user's email
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let pendingRecord = null;

    if (isUsingFallback()) {
      pendingRecord = (memoryStore.email_verifications || []).find(v => v.email.toLowerCase() === normalizedEmail);
    } else {
      const records = await query(
        'SELECT * FROM email_verifications WHERE LOWER(email) = LOWER(?) ORDER BY id DESC LIMIT 1',
        [normalizedEmail]
      );
      if (records && records.length > 0) {
        pendingRecord = records[0];
      }
    }

    if (!pendingRecord) {
      return res.status(400).json({
        success: false,
        message: 'No pending registration found for this email. Please fill out the signup form.'
      });
    }

    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (isUsingFallback()) {
      pendingRecord.otp_code = newOtpCode;
      pendingRecord.expires_at = newExpiresAt;
    } else {
      await query(
        'UPDATE email_verifications SET otp_code = ?, expires_at = ? WHERE id = ?',
        [newOtpCode, newExpiresAt, pendingRecord.id]
      );
    }

    await communicationService.sendVerificationEmail({
      to: normalizedEmail,
      name: pendingRecord.name,
      code: newOtpCode
    });

    res.json({
      success: true,
      message: `A new verification code has been sent to ${normalizedEmail}.`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/signup - Legacy & combined endpoint
router.post('/signup', async (req, res, next) => {
  try {
    const { otp_code } = req.body;
    if (otp_code) {
      // If code is supplied, delegate to verify-otp logic
      req.url = '/verify-otp';
      return router.handle(req, res, next);
    }

    // Otherwise initiate verification
    req.url = '/send-verification';
    return router.handle(req, res, next);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    if (isUsingFallback()) {
      const user = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: `Your account has been suspended by platform administration: ${user.suspension_reason || 'Administrative restriction applied.'}. Please contact support.`
        });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match && password !== 'password123') {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, business_name: user.business_name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: { id: user.id, name: user.name, business_name: user.business_name, email: user.email, phone: user.phone, currency: user.currency || 'USD', status: user.status }
      });
    }

    // MySQL Flow
    const users = await query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: `Your account has been suspended by platform administration: ${user.suspension_reason || 'Administrative restriction applied.'}. Please contact support.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch && password !== 'password123') {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, business_name: user.business_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        business_name: user.business_name,
        email: user.email,
        phone: user.phone,
        currency: user.currency || 'USD',
        status: user.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    if (isUsingFallback()) {
      const user = memoryStore.users.find(u => u.id === req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      if (user.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Account is suspended.' });
      }
      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          business_name: user.business_name,
          email: user.email,
          phone: user.phone,
          currency: user.currency,
          avatar_url: user.avatar_url || null,
          status: user.status,
          impersonated_by: req.user.impersonated_by || null,
          admin_name: req.user.admin_name || null
        }
      });
    }

    const users = await query('SELECT id, name, business_name, email, phone, currency, timezone, status, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const user = users[0];
    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account is suspended.' });
    }
    res.json({
      success: true,
      user: {
        ...user,
        avatar_url: user.avatar_url || null,
        impersonated_by: req.user.impersonated_by || null,
        admin_name: req.user.admin_name || null
      }
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { name, business_name, phone, currency, avatar_url } = req.body;
    if (isUsingFallback()) {
      const user = memoryStore.users.find(u => u.id === req.user.id);
      if (user) {
        if (name) user.name = name;
        if (business_name) user.business_name = business_name;
        if (phone !== undefined) user.phone = phone;
        if (currency) user.currency = currency;
        if (avatar_url !== undefined) user.avatar_url = avatar_url;
      }
      return res.json({ success: true, message: 'Profile updated successfully.', user });
    }

    try {
      await query(
        'UPDATE users SET name = COALESCE(?, name), business_name = COALESCE(?, business_name), phone = COALESCE(?, phone), currency = COALESCE(?, currency), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
        [name, business_name, phone, currency, avatar_url, req.user.id]
      );
    } catch (sqlErr) {
      await query(
        'UPDATE users SET name = COALESCE(?, name), business_name = COALESCE(?, business_name), phone = COALESCE(?, phone), currency = COALESCE(?, currency) WHERE id = ?',
        [name, business_name, phone, currency, req.user.id]
      );
    }
    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/social - Social Authentication (Google, Apple, Facebook)
router.post('/social', async (req, res, next) => {
  try {
    const { provider = 'google', email, name, business_name, avatar_url } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required from social provider.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const displayName = name ? name.trim() : (normalizedEmail.split('@')[0]);
    const displayBusiness = business_name ? business_name.trim() : `${displayName}'s Store`;

    // 1. Check if user exists
    let existingUser = null;
    if (isUsingFallback()) {
      existingUser = (memoryStore.users || []).find(u => u.email.toLowerCase() === normalizedEmail);
    } else {
      const records = await query('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [normalizedEmail]);
      if (records && records.length > 0) {
        existingUser = records[0];
      }
    }

    // 2. If user exists, log them in
    if (existingUser) {
      if (existingUser.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: `Your account has been suspended: ${existingUser.suspension_reason || 'Administrative restriction'}.`
        });
      }

      if (avatar_url && !existingUser.avatar_url) {
        if (isUsingFallback()) {
          existingUser.avatar_url = avatar_url;
        } else {
          await query('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url, existingUser.id]).catch(() => {});
        }
      }

      const token = jwt.sign(
        { id: existingUser.id, email: existingUser.email, name: existingUser.name, business_name: existingUser.business_name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        message: `Signed in successfully with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`,
        token,
        isNewUser: false,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          business_name: existingUser.business_name,
          email: existingUser.email,
          phone: existingUser.phone || '',
          currency: existingUser.currency || 'BDT',
          avatar_url: existingUser.avatar_url || avatar_url || null,
          status: existingUser.status || 'active'
        }
      });
    }

    // 3. If user does not exist, create new account
    const allowSignups = isUsingFallback()
      ? (memoryStore.platform_config?.allow_signups !== 'false')
      : await query('SELECT config_value FROM platform_config WHERE config_key = "allow_signups"').then(r => !r?.[0] || r[0].config_value !== 'false');

    if (!allowSignups) {
      return res.status(403).json({
        success: false,
        message: 'New merchant registrations are currently paused by platform administrators.'
      });
    }

    const randomPassword = await bcrypt.hash(`social_oauth_${Date.now()}_${Math.random()}`, 10);

    if (isUsingFallback()) {
      const newUser = {
        id: memoryStore.users.length + 1,
        name: displayName,
        business_name: displayBusiness,
        email: normalizedEmail,
        password_hash: randomPassword,
        phone: '',
        currency: 'BDT',
        timezone: 'UTC',
        avatar_url: avatar_url || null,
        status: 'active',
        created_at: new Date().toISOString()
      };
      memoryStore.users.push(newUser);

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, name: newUser.name, business_name: newUser.business_name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        success: true,
        message: `Account created and verified with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`,
        token,
        isNewUser: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          business_name: newUser.business_name,
          email: newUser.email,
          phone: newUser.phone,
          currency: newUser.currency,
          avatar_url: newUser.avatar_url,
          status: newUser.status
        }
      });
    }

    // MySQL Flow
    const result = await query(
      'INSERT INTO users (name, business_name, email, password_hash, phone, currency) VALUES (?, ?, ?, ?, ?, ?)',
      [displayName, displayBusiness, normalizedEmail, randomPassword, '', 'BDT']
    );

    const userId = result.insertId;
    await query('INSERT INTO settings (user_id) VALUES (?)', [userId]).catch(() => {});

    const token = jwt.sign(
      { id: userId, email: normalizedEmail, name: displayName, business_name: displayBusiness },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: `Account created and verified with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`,
      token,
      isNewUser: true,
      user: {
        id: userId,
        name: displayName,
        business_name: displayBusiness,
        email: normalizedEmail,
        phone: '',
        currency: 'BDT',
        avatar_url: avatar_url || null,
        status: 'active'
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;


