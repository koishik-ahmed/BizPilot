const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/stock-history
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id, movement_type, search } = req.query;

    if (isUsingFallback()) {
      let list = [...memoryStore.stock_history].filter(sh => sh.user_id === userId);

      if (product_id && product_id !== 'All') {
        list = list.filter(sh => sh.product_id === parseInt(product_id));
      }
      if (movement_type && movement_type !== 'All') {
        list = list.filter(sh => sh.movement_type === movement_type);
      }
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(sh => 
          (sh.product_name && sh.product_name.toLowerCase().includes(s)) ||
          (sh.reason && sh.reason.toLowerCase().includes(s))
        );
      }

      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return res.json({ success: true, count: list.length, history: list });
    }

    let sql = `
      SELECT sh.*, p.name as product_name, p.sku
      FROM stock_history sh
      LEFT JOIN products p ON sh.product_id = p.id
      WHERE sh.user_id = ?
    `;
    const params = [userId];

    if (product_id && product_id !== 'All') {
      sql += ' AND sh.product_id = ?';
      params.push(product_id);
    }
    if (movement_type && movement_type !== 'All') {
      sql += ' AND sh.movement_type = ?';
      params.push(movement_type);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR sh.reason LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY sh.created_at DESC';

    const history = await query(sql, params);
    res.json({ success: true, count: history.length, history });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

