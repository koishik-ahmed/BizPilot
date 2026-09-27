const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

function computeProductStatus(stock, threshold) {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= threshold) return 'Low Stock';
  return 'In Stock';
}

// GET /api/inventory
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search = '', category = '', status = '', lowStockOnly = 'false' } = req.query;

    if (isUsingFallback()) {
      let list = memoryStore.products.filter(p => p.user_id === userId);

      if (search) {
        const s = search.toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
      }
      if (category && category !== 'All') {
        list = list.filter(p => p.category === category);
      }
      if (status && status !== 'All') {
        list = list.filter(p => p.status === status);
      }
      if (lowStockOnly === 'true') {
        list = list.filter(p => p.stock <= p.low_stock_threshold);
      }

      return res.json({ success: true, count: list.length, inventory: list });
    }

    let sql = 'SELECT * FROM products WHERE user_id = ?';
    const params = [userId];

    if (search) {
      sql += ' AND (name LIKE ? OR sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (lowStockOnly === 'true') {
      sql += ' AND stock <= low_stock_threshold';
    }

    sql += ' ORDER BY stock ASC';

    const items = await query(sql, params);
    res.json({ success: true, count: items.length, inventory: items });
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory/restock
router.post('/restock', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity, note = 'Restock replenishment' } = req.body;

    const qty = parseInt(quantity);
    if (!product_id || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid product and positive restock quantity.' });
    }

    if (isUsingFallback()) {
      const prod = memoryStore.products.find(p => p.id === parseInt(product_id) && p.user_id === userId);
      if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });

      const prevStock = prod.stock;
      prod.stock += qty;
      prod.status = computeProductStatus(prod.stock, prod.low_stock_threshold);

      const log = {
        id: memoryStore.stock_history.length + 1,
        user_id: userId,
        product_id: prod.id,
        product_name: prod.name,
        movement_type: 'Restock',
        quantity_change: qty,
        previous_stock: prevStock,
        new_stock: prod.stock,
        reason: note || 'Supplier restock shipment',
        created_at: new Date().toISOString()
      };
      memoryStore.stock_history.unshift(log);

      return res.json({
        success: true,
        message: `Successfully restocked ${qty} units for ${prod.name}.`,
        product: prod,
        stockHistoryEntry: log
      });
    }

    const [prod] = await query('SELECT * FROM products WHERE id = ? AND user_id = ?', [product_id, userId]);
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });

    const prevStock = prod.stock;
    const newStock = prevStock + qty;
    const newStatus = computeProductStatus(newStock, prod.low_stock_threshold);

    await query('UPDATE products SET stock = ?, status = ? WHERE id = ?', [newStock, newStatus, product_id]);
    await query(`
      INSERT INTO stock_history (user_id, product_id, movement_type, quantity_change, previous_stock, new_stock, reason)
      VALUES (?, ?, 'Restock', ?, ?, ?, ?)
    `, [userId, product_id, qty, prevStock, newStock, note || 'Supplier restock shipment']);

    res.json({
      success: true,
      message: `Successfully restocked ${qty} units for ${prod.name}.`,
      newStock,
      status: newStatus
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory/adjust
router.post('/adjust', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { product_id, type = 'increase', amount, reason } = req.body;

    const amt = parseInt(amount);
    if (!product_id || isNaN(amt) || amt <= 0 || !reason) {
      return res.status(400).json({ success: false, message: 'Product, valid quantity, and adjustment reason are required.' });
    }

    if (isUsingFallback()) {
      const prod = memoryStore.products.find(p => p.id === parseInt(product_id) && p.user_id === userId);
      if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });

      const prevStock = prod.stock;
      const change = type === 'decrease' ? -amt : amt;
      const targetStock = prevStock + change;

      if (targetStock < 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot decrease stock below zero. Current stock is ${prevStock}.`
        });
      }

      prod.stock = targetStock;
      prod.status = computeProductStatus(prod.stock, prod.low_stock_threshold);

      const log = {
        id: memoryStore.stock_history.length + 1,
        user_id: userId,
        product_id: prod.id,
        product_name: prod.name,
        movement_type: 'Manual Adjustment',
        quantity_change: change,
        previous_stock: prevStock,
        new_stock: prod.stock,
        reason: `${reason} (${type})`,
        created_at: new Date().toISOString()
      };
      memoryStore.stock_history.unshift(log);

      return res.json({
        success: true,
        message: `Stock adjusted by ${change > 0 ? '+' : ''}${change} units.`,
        product: prod
      });
    }

    const [prod] = await query('SELECT * FROM products WHERE id = ? AND user_id = ?', [product_id, userId]);
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });

    const prevStock = prod.stock;
    const change = type === 'decrease' ? -amt : amt;
    const targetStock = prevStock + change;

    if (targetStock < 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot decrease stock below zero. Current stock is ${prevStock}.`
      });
    }

    const newStatus = computeProductStatus(targetStock, prod.low_stock_threshold);
    await query('UPDATE products SET stock = ?, status = ? WHERE id = ?', [targetStock, newStatus, product_id]);
    await query(`
      INSERT INTO stock_history (user_id, product_id, movement_type, quantity_change, previous_stock, new_stock, reason)
      VALUES (?, ?, 'Manual Adjustment', ?, ?, ?, ?)
    `, [userId, product_id, change, prevStock, targetStock, `${reason} (${type})`]);

    res.json({
      success: true,
      message: `Stock adjusted by ${change > 0 ? '+' : ''}${change} units.`,
      newStock: targetStock,
      status: newStatus
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

