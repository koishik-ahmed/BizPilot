const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/testimonials (Public - Dynamic fetch for website visitors)
router.get('/', async (req, res, next) => {
  try {
    if (isUsingFallback()) {
      const active = (memoryStore.testimonials || []).filter(t => t.is_active);
      const sorted = [...active].sort((a, b) => {
        if (b.is_featured && !a.is_featured) return 1;
        if (!b.is_featured && a.is_featured) return -1;
        return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at);
      });
      return res.json({ success: true, count: sorted.length, testimonials: sorted });
    }

    const rows = await query(`
      SELECT 
        id, 
        user_id, 
        name, 
        role, 
        business_name, 
        rating, 
        quote, 
        metric, 
        avatar_url, 
        is_featured, 
        created_at, 
        updated_at
      FROM testimonials
      WHERE is_active = 1
      ORDER BY is_featured DESC, updated_at DESC
    `);

    res.json({ success: true, count: rows.length, testimonials: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/testimonials/my (Authenticated - Get logged in merchant's review)
router.get('/my', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (isUsingFallback()) {
      const item = (memoryStore.testimonials || []).find(t => t.user_id === userId);
      return res.json({ success: true, testimonial: item || null });
    }

    const [row] = await query('SELECT * FROM testimonials WHERE user_id = ?', [userId]);
    res.json({ success: true, testimonial: row || null });
  } catch (err) {
    next(err);
  }
});

// POST /api/testimonials (Authenticated - Submit or update merchant review)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, role, business_name, rating, quote, metric } = req.body;

    if (!quote || quote.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Testimonial quote must be at least 10 characters long.'
      });
    }

    const cleanRating = Math.min(5, Math.max(1, parseInt(rating) || 5));
    const cleanName = (name || '').trim() || req.user.name || 'Merchant';
    const cleanRole = (role || '').trim() || 'Store Owner';
    const cleanBusiness = (business_name || '').trim() || req.user.business_name || 'Commerce Store';
    const cleanMetric = (metric || '').trim() || null;
    const cleanQuote = quote.trim();

    if (isUsingFallback()) {
      let item = (memoryStore.testimonials || []).find(t => t.user_id === userId);
      if (item) {
        item.name = cleanName;
        item.role = cleanRole;
        item.business_name = cleanBusiness;
        item.rating = cleanRating;
        item.quote = cleanQuote;
        item.metric = cleanMetric;
        item.is_active = true;
        item.updated_at = new Date().toISOString();
      } else {
        item = {
          id: (memoryStore.testimonials?.length || 0) + 1,
          user_id: userId,
          name: cleanName,
          role: cleanRole,
          business_name: cleanBusiness,
          rating: cleanRating,
          quote: cleanQuote,
          metric: cleanMetric,
          avatar_url: null,
          is_featured: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        memoryStore.testimonials = memoryStore.testimonials || [];
        memoryStore.testimonials.unshift(item);
      }

      memoryStore.notifications.unshift({
        id: memoryStore.notifications.length + 1,
        user_id: userId,
        type: 'system',
        title: 'Testimonial Published',
        message: 'Your merchant review is now live on the public BizPilot showcase.',
        link: '/testimonials',
        is_read: false,
        created_at: new Date().toISOString()
      });

      return res.json({
        success: true,
        message: 'Your testimonial was published successfully! It is now live on the public showcase.',
        testimonial: item
      });
    }

    // Real MySQL Upsert
    await query(`
      INSERT INTO testimonials (user_id, name, role, business_name, rating, quote, metric, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        role = VALUES(role),
        business_name = VALUES(business_name),
        rating = VALUES(rating),
        quote = VALUES(quote),
        metric = VALUES(metric),
        is_active = 1,
        updated_at = NOW()
    `, [userId, cleanName, cleanRole, cleanBusiness, cleanRating, cleanQuote, cleanMetric]);

    const [saved] = await query('SELECT * FROM testimonials WHERE user_id = ?', [userId]);

    await query(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'system', 'Testimonial Published', 'Your merchant review is now live on the public BizPilot showcase.', '/testimonials')
    `, [userId]);

    res.json({
      success: true,
      message: 'Your testimonial was published successfully! It is now live on the public showcase.',
      testimonial: saved
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/testimonials/my (Authenticated - Remove merchant review)
router.delete('/my', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (isUsingFallback()) {
      const idx = (memoryStore.testimonials || []).findIndex(t => t.user_id === userId);
      if (idx !== -1) {
        memoryStore.testimonials.splice(idx, 1);
      }
      return res.json({ success: true, message: 'Testimonial removed from public showcase.' });
    }

    await query('DELETE FROM testimonials WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'Testimonial removed from public showcase.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

