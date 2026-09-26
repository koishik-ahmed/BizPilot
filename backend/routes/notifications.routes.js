const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (isUsingFallback()) {
      const list = memoryStore.notifications.filter(n => n.user_id === userId);
      const unreadCount = list.filter(n => !n.is_read).length;
      return res.json({ success: true, count: list.length, unreadCount, notifications: list });
    }

    const notifications = await query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [userId]);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notifId = parseInt(req.params.id);

    if (isUsingFallback()) {
      const notif = memoryStore.notifications.find(n => n.id === notifId && n.user_id === userId);
      if (notif) notif.is_read = true;
      return res.json({ success: true, message: 'Notification marked as read.' });
    }

    await query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [notifId, userId]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (isUsingFallback()) {
      memoryStore.notifications.filter(n => n.user_id === userId).forEach(n => { n.is_read = true; });
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }

    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

