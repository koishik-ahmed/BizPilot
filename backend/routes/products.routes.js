const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

function computeProductStatus(stock, threshold) {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= threshold) return 'Low Stock';
  return 'In Stock';
}

// GET /api/products
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search = '', category = '', status = '' } = req.query;

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

      return res.json({ success: true, count: list.length, products: list });
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

    sql += ' ORDER BY id DESC';

    const products = await query(sql, params);
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.id);

    if (isUsingFallback()) {
      const product = memoryStore.products.find(p => p.id === productId && p.user_id === userId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

      const stockHistory = memoryStore.stock_history.filter(sh => sh.product_id === productId && sh.user_id === userId);
      const unitsSold = 18;
      const revenueContribution = unitsSold * product.selling_price;

      return res.json({
        success: true,
        product,
        stats: { unitsSold, revenueContribution },
        stockHistory
      });
    }

    const [prods] = await query('SELECT * FROM products WHERE id = ? AND user_id = ?', [productId, userId]);
    if (!prods) return res.status(404).json({ success: false, message: 'Product not found.' });

    const stockHistory = await query('SELECT * FROM stock_history WHERE product_id = ? AND user_id = ? ORDER BY created_at DESC', [productId, userId]);
    const [salesData] = await query(`
      SELECT COALESCE(SUM(quantity), 0) as unitsSold, COALESCE(SUM(line_total), 0) as revenueContribution
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id = ? AND o.user_id = ? AND o.payment_status = 'Paid'
    `, [productId, userId]);

    res.json({
      success: true,
      product: prods,
      stats: {
        unitsSold: parseInt(salesData?.unitsSold || 0),
        revenueContribution: parseFloat(salesData?.revenueContribution || 0)
      },
      stockHistory: stockHistory || []
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/products
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name,
      sku,
      category,
      description = '',
      cost_price = 0,
      selling_price = 0,
      stock = 0,
      low_stock_threshold = 10,
      image_url = ''
    } = req.body;

    if (!name || !sku || !category) {
      return res.status(400).json({ success: false, message: 'Product Name, SKU, and Category are required.' });
    }

    const initialStock = parseInt(stock) || 0;
    const threshold = parseInt(low_stock_threshold) || 10;
    const status = computeProductStatus(initialStock, threshold);

    if (isUsingFallback()) {
      const existingSku = memoryStore.products.find(p => p.user_id === userId && p.sku.toLowerCase() === sku.toLowerCase());
      if (existingSku) {
        return res.status(400).json({ success: false, message: 'A product with this SKU already exists.' });
      }

      const newProd = {
        id: memoryStore.products.length + 1,
        user_id: userId,
        name,
        sku,
        category,
        description,
        cost_price: parseFloat(cost_price) || 0,
        selling_price: parseFloat(selling_price) || 0,
        stock: initialStock,
        low_stock_threshold: threshold,
        image_url: image_url || null,
        status,
        created_at: new Date().toISOString()
      };
      memoryStore.products.unshift(newProd);

      // Log initial stock movement
      if (initialStock > 0) {
        memoryStore.stock_history.unshift({
          id: memoryStore.stock_history.length + 1,
          user_id: userId,
          product_id: newProd.id,
          product_name: newProd.name,
          movement_type: 'Initial Stock',
          quantity_change: initialStock,
          previous_stock: 0,
          new_stock: initialStock,
          reason: 'Initial stock on product creation',
          created_at: new Date().toISOString()
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Product added successfully.',
        product: newProd
      });
    }

    // Check SKU duplicate
    const [existing] = await query('SELECT id FROM products WHERE user_id = ? AND sku = ?', [userId, sku]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'A product with this SKU already exists.' });
    }

    const result = await query(`
      INSERT INTO products (user_id, name, sku, category, description, cost_price, selling_price, stock, low_stock_threshold, image_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      name,
      sku,
      category,
      description,
      cost_price,
      selling_price,
      initialStock,
      threshold,
      image_url || null,
      status
    ]);

    const newId = result.insertId;

    if (initialStock > 0) {
      await query(`
        INSERT INTO stock_history (user_id, product_id, movement_type, quantity_change, previous_stock, new_stock, reason)
        VALUES (?, ?, 'Initial Stock', ?, 0, ?, 'Initial stock creation')
      `, [userId, newId, initialStock, initialStock]);
    }

    res.status(201).json({
      success: true,
      message: 'Product added successfully.',
      productId: newId
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/products/:id
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.id);
    const { name, sku, category, description, cost_price, selling_price, low_stock_threshold, image_url } = req.body;

    if (isUsingFallback()) {
      const prod = memoryStore.products.find(p => p.id === productId && p.user_id === userId);
      if (!prod) return res.status(404).json({ success: false, message: 'Product not found.' });

      if (name) prod.name = name;
      if (sku) prod.sku = sku;
      if (category) prod.category = category;
      if (description !== undefined) prod.description = description;
      if (cost_price !== undefined) prod.cost_price = parseFloat(cost_price);
      if (selling_price !== undefined) prod.selling_price = parseFloat(selling_price);
      if (low_stock_threshold !== undefined) {
        prod.low_stock_threshold = parseInt(low_stock_threshold);
        prod.status = computeProductStatus(prod.stock, prod.low_stock_threshold);
      }
      if (image_url) prod.image_url = image_url;

      return res.json({ success: true, message: 'Product updated successfully.', product: prod });
    }

    await query(`
      UPDATE products 
      SET name = COALESCE(?, name),
          sku = COALESCE(?, sku),
          category = COALESCE(?, category),
          description = COALESCE(?, description),
          cost_price = COALESCE(?, cost_price),
          selling_price = COALESCE(?, selling_price),
          low_stock_threshold = COALESCE(?, low_stock_threshold),
          image_url = COALESCE(?, image_url)
      WHERE id = ? AND user_id = ?
    `, [name, sku, category, description, cost_price, selling_price, low_stock_threshold, image_url, productId, userId]);

    res.json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.id);

    if (isUsingFallback()) {
      const idx = memoryStore.products.findIndex(p => p.id === productId && p.user_id === userId);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found.' });

      memoryStore.products.splice(idx, 1);
      return res.json({ success: true, message: 'Product deleted successfully.' });
    }

    await query('DELETE FROM products WHERE id = ? AND user_id = ?', [productId, userId]);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

