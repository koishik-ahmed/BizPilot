const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/search?q=query
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { q = '' } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({ success: true, results: { products: [], orders: [], customers: [] } });
    }

    const term = q.trim().toLowerCase();

    if (isUsingFallback()) {
      const matchedProducts = memoryStore.products
        .filter(p => p.user_id === userId && (p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)))
        .slice(0, 5)
        .map(p => ({ id: p.id, title: p.name, subtitle: `SKU: ${p.sku} | $${p.selling_price}`, type: 'Product', link: `/products?view=${p.id}` }));

      const matchedOrders = memoryStore.orders
        .filter(o => o.user_id === userId && (o.order_number.toLowerCase().includes(term) || o.customer_name.toLowerCase().includes(term)))
        .slice(0, 5)
        .map(o => ({ id: o.id, title: `Order #${o.order_number}`, subtitle: `${o.customer_name} • $${o.total.toFixed(2)} (${o.payment_status})`, type: 'Order', link: `/orders?view=${o.id}` }));

      const matchedCustomers = memoryStore.customers
        .filter(c => c.user_id === userId && (c.name.toLowerCase().includes(term) || c.phone.includes(term) || (c.email && c.email.toLowerCase().includes(term))))
        .slice(0, 5)
        .map(c => ({ id: c.id, title: c.name, subtitle: `${c.phone} • ${c.total_orders} orders ($${c.total_spent.toFixed(2)})`, type: 'Customer', link: `/customers?profile=${c.id}` }));

      return res.json({
        success: true,
        results: {
          products: matchedProducts,
          orders: matchedOrders,
          customers: matchedCustomers
        }
      });
    }

    // MySQL Flow
    const products = await query(`
      SELECT id, name as title, CONCAT('SKU: ', sku, ' | ৳', selling_price) as subtitle, 'Product' as type, CONCAT('/products?view=', id) as link
      FROM products 
      WHERE user_id = ? AND (name LIKE ? OR sku LIKE ?)
      LIMIT 5
    `, [userId, `%${term}%`, `%${term}%`]);

    const orders = await query(`
      SELECT id, CONCAT('Order #', order_number) as title, CONCAT(customer_name, ' • ৳', total, ' (', payment_status, ')') as subtitle, 'Order' as type, CONCAT('/orders?view=', id) as link
      FROM orders 
      WHERE user_id = ? AND (order_number LIKE ? OR customer_name LIKE ?)
      LIMIT 5
    `, [userId, `%${term}%`, `%${term}%`]);

    const customers = await query(`
      SELECT id, name as title, CONCAT(phone, ' • ', total_orders, ' orders (৳', total_spent, ')') as subtitle, 'Customer' as type, CONCAT('/customers?profile=', id) as link
      FROM customers 
      WHERE user_id = ? AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)
      LIMIT 5
    `, [userId, `%${term}%`, `%${term}%`, `%${term}%`]);

    res.json({
      success: true,
      results: {
        products: products || [],
        orders: orders || [],
        customers: customers || []
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

