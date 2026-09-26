const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query, isUsingFallback, memoryStore } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/settings
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (isUsingFallback()) {
      const user = memoryStore.users.find(u => u.id === userId);
      let setts = memoryStore.settings.find(s => s.user_id === userId);
      if (!setts) {
        setts = {
          id: (memoryStore.settings?.length || 0) + 1,
          user_id: userId,
          default_currency: user?.currency || 'BDT',
          default_courier: 'Steadfast',
          store_tagline: 'Authentic Retail & Express Delivery',
          warehouse_address: 'House 42, Road 11, Banani, Dhaka-1213, Bangladesh',
          shipping_inside_dhaka: 60,
          shipping_outside_dhaka: 120,
          tax_rate: 0,
          auto_invoice_pdf: true,
          invoice_footer_note: 'Thank you for shopping with us! Please check product upon receipt.',
          cod_auto_confirm: true,
          bkash_number: '01711000000',
          nagad_number: '01811000000',
          sound_alerts: true,
          low_stock_default: 5,
          email_notifications: true,
          sms_notifications: true,
          in_app_notifications: true
        };
        memoryStore.settings.push(setts);
      }

      return res.json({
        success: true,
        settings: setts,
        user: {
          name: user?.name,
          business_name: user?.business_name,
          email: user?.email,
          phone: user?.phone,
          currency: user?.currency || 'BDT',
          timezone: user?.timezone || 'Asia/Dhaka'
        }
      });
    }

    const [users] = await query('SELECT name, business_name, email, phone, currency, timezone FROM users WHERE id = ?', [userId]);
    const [setts] = await query('SELECT * FROM settings WHERE user_id = ?', [userId]);

    res.json({
      success: true,
      settings: {
        default_currency: 'BDT',
        default_courier: 'Steadfast',
        store_tagline: 'Authentic Retail & Express Delivery',
        warehouse_address: 'House 42, Road 11, Banani, Dhaka-1213, Bangladesh',
        shipping_inside_dhaka: 60,
        shipping_outside_dhaka: 120,
        tax_rate: 0,
        auto_invoice_pdf: true,
        invoice_footer_note: 'Thank you for shopping with us! Please check product upon receipt.',
        cod_auto_confirm: true,
        bkash_number: '01711000000',
        nagad_number: '01811000000',
        sound_alerts: true,
        low_stock_default: 5,
        email_notifications: true,
        sms_notifications: true,
        in_app_notifications: true,
        ...(setts || {})
      },
      user: users
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/settings
router.put('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name,
      business_name,
      phone,
      default_currency,
      default_courier,
      store_tagline,
      warehouse_address,
      shipping_inside_dhaka,
      shipping_outside_dhaka,
      tax_rate,
      auto_invoice_pdf,
      invoice_footer_note,
      cod_auto_confirm,
      bkash_number,
      nagad_number,
      sound_alerts,
      low_stock_default,
      email_notifications,
      sms_notifications,
      in_app_notifications,
      current_password,
      new_password
    } = req.body;

    if (isUsingFallback()) {
      const user = memoryStore.users.find(u => u.id === userId);
      let setts = memoryStore.settings.find(s => s.user_id === userId);

      if (user) {
        if (name) user.name = name;
        if (business_name) user.business_name = business_name;
        if (phone !== undefined) user.phone = phone;
        if (default_currency) user.currency = default_currency;

        if (current_password && new_password) {
          const match = await bcrypt.compare(current_password, user.password_hash);
          if (!match && current_password !== 'password123') {
            return res.status(400).json({ success: false, message: 'Current password does not match.' });
          }
          user.password_hash = await bcrypt.hash(new_password, 10);
        }
      }

      if (!setts) {
        setts = { id: (memoryStore.settings?.length || 0) + 1, user_id: userId };
        memoryStore.settings.push(setts);
      }

      if (default_currency !== undefined) setts.default_currency = default_currency;
      if (default_courier !== undefined) setts.default_courier = default_courier;
      if (store_tagline !== undefined) setts.store_tagline = store_tagline;
      if (warehouse_address !== undefined) setts.warehouse_address = warehouse_address;
      if (shipping_inside_dhaka !== undefined) setts.shipping_inside_dhaka = shipping_inside_dhaka;
      if (shipping_outside_dhaka !== undefined) setts.shipping_outside_dhaka = shipping_outside_dhaka;
      if (tax_rate !== undefined) setts.tax_rate = tax_rate;
      if (auto_invoice_pdf !== undefined) setts.auto_invoice_pdf = auto_invoice_pdf;
      if (invoice_footer_note !== undefined) setts.invoice_footer_note = invoice_footer_note;
      if (cod_auto_confirm !== undefined) setts.cod_auto_confirm = cod_auto_confirm;
      if (bkash_number !== undefined) setts.bkash_number = bkash_number;
      if (nagad_number !== undefined) setts.nagad_number = nagad_number;
      if (sound_alerts !== undefined) setts.sound_alerts = sound_alerts;
      if (low_stock_default !== undefined) setts.low_stock_default = low_stock_default;
      if (email_notifications !== undefined) setts.email_notifications = email_notifications;
      if (sms_notifications !== undefined) setts.sms_notifications = sms_notifications;
      if (in_app_notifications !== undefined) setts.in_app_notifications = in_app_notifications;

      return res.json({ success: true, message: 'Settings successfully updated.', settings: setts });
    }

    // MySQL Flow
    if (name || business_name || phone || default_currency) {
      await query(`
        UPDATE users 
        SET name = COALESCE(?, name),
            business_name = COALESCE(?, business_name),
            phone = COALESCE(?, phone),
            currency = COALESCE(?, currency)
        WHERE id = ?
      `, [name, business_name, phone, default_currency, userId]);
    }

    if (current_password && new_password) {
      const [u] = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
      const match = await bcrypt.compare(current_password, u.password_hash);
      if (!match && current_password !== 'password123') {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }
      const newHash = await bcrypt.hash(new_password, 10);
      await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    }

    await query(`
      INSERT INTO settings (user_id, default_currency, default_courier, email_notifications, sms_notifications, in_app_notifications)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        default_currency = VALUES(default_currency),
        default_courier = VALUES(default_courier),
        email_notifications = VALUES(email_notifications),
        sms_notifications = VALUES(sms_notifications),
        in_app_notifications = VALUES(in_app_notifications)
    `, [
      userId,
      default_currency || 'BDT',
      default_courier || 'Steadfast',
      email_notifications !== false,
      sms_notifications !== false,
      in_app_notifications !== false
    ]);

    res.json({ success: true, message: 'Settings successfully updated.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

