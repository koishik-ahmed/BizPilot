const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const communicationService = require('../services/communicationService');
const { generateInvoiceData } = require('../services/invoiceService');

function computeProductStatus(stock, threshold) {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= threshold) return 'Low Stock';
  return 'In Stock';
}

async function buildAndSendInvoiceEmail({ order, merchant, targetEmail, customItems }) {
  const email = targetEmail || order.customer_email || order.customer?.email;
  if (!email || email === 'N/A' || !email.includes('@')) return null;

  const invoice = generateInvoiceData(order, merchant);
  const items = customItems || invoice.items || [];
  const currencySymbol = merchant?.currency === 'USD' ? '$' : (merchant?.currency === 'EUR' ? '€' : (merchant?.currency === 'GBP' ? '£' : '৳'));

  const itemsHtml = (items || [])
    .map(item => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 12px; font-weight: 600; color:#111827;">${item.product_name || item.name || 'Item'}</td>
        <td style="padding: 10px 12px; text-align: center; color:#374151;">${item.quantity}</td>
        <td style="padding: 10px 12px; text-align: right; color:#374151;">${currencySymbol}${Number(item.unit_price || 0).toFixed(2)}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 600; color:#111827;">${currencySymbol}${Number(item.line_total || (item.quantity * item.unit_price) || 0).toFixed(2)}</td>
      </tr>
    `).join('');

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937;">
      <div style="border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #047857; font-size: 24px; font-weight: 800;">${merchant?.business_name || 'BizPilot Commerce'}</h2>
        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">Official Tax Invoice & Order Receipt</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #1f2937;">
        Hello <strong>${invoice.customer.name || 'Valued Customer'}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #374151;">
        Thank you for your order! Your official invoice <strong>#${invoice.invoiceNumber}</strong> for Order <strong>#${invoice.orderNumber}</strong> has been generated.
      </p>

      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; color: #4b5563;">
          <div>
            <strong>Invoice Date:</strong> ${invoice.date}<br/>
            <strong>Payment Status:</strong> <span style="font-weight: 700; color: ${invoice.paymentStatus === 'Paid' ? '#059669' : '#d97706'}">${invoice.paymentStatus}</span>
          </div>
          <div style="text-align: right;">
            <strong>Billed To:</strong> ${invoice.customer.name}<br/>
            ${invoice.customer.phone ? `<strong>Phone:</strong> ${invoice.customer.phone}<br/>` : ''}
            ${invoice.customer.address ? `<strong>Address:</strong> ${invoice.customer.address}` : ''}
          </div>
        </div>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px 10px; text-align: left; font-size: 11px; color: #6b7280; text-transform: uppercase;">Item</th>
              <th style="padding: 8px 10px; text-align: center; font-size: 11px; color: #6b7280; text-transform: uppercase;">Qty</th>
              <th style="padding: 8px 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Unit Price</th>
              <th style="padding: 8px 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || '<tr><td colspan="4" style="padding: 10px; color:#9ca3af; text-align:center;">No line items listed.</td></tr>'}
          </tbody>
        </table>

        <div style="margin-top: 16px; text-align: right; font-size: 13px; color: #374151;">
          <div>Subtotal: <strong>${currencySymbol}${Number(invoice.subtotal).toFixed(2)}</strong></div>
          ${Number(order.discount || 0) > 0 ? `<div style="color:#059669;">Discount: <strong>-${currencySymbol}${Number(order.discount).toFixed(2)}</strong></div>` : ''}
          ${Number(order.shipping || 0) > 0 ? `<div>Shipping: <strong>+${currencySymbol}${Number(order.shipping).toFixed(2)}</strong></div>` : ''}
          ${Number(order.tax || 0) > 0 ? `<div>Tax: <strong>+${currencySymbol}${Number(order.tax).toFixed(2)}</strong></div>` : ''}
          <div style="border-top: 2px solid #111827; margin-top: 8px; padding-top: 8px; font-size: 17px; font-weight: 800; color: #111827;">
            Total Due: <strong style="color: #047857;">${currencySymbol}${Number(invoice.total).toFixed(2)}</strong>
          </div>
        </div>
      </div>

      ${invoice.notes ? `
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 12px; color: #166534;">
          <strong>Merchant Notes:</strong> ${invoice.notes}
        </div>
      ` : ''}

      <p style="font-size: 13px; color: #6b7280; line-height: 1.6; margin-top: 24px;">
        If you have questions about this invoice, please contact <strong>${merchant?.business_name || 'BizPilot'}</strong> at <a href="mailto:${merchant?.email || 'support@bizpilot.com'}" style="color: #047857;">${merchant?.email || 'support@bizpilot.com'}</a>.
      </p>
    </div>
  `;

  return communicationService.sendEmail({
    to: email,
    subject: `Invoice for Order #${invoice.orderNumber} - ${merchant?.business_name || 'BizPilot'}`,
    htmlContent,
    text: `Invoice for Order #${invoice.orderNumber} - ${merchant?.business_name || 'BizPilot'}\n\nHello ${invoice.customer.name || 'Valued Customer'},\n\nThank you for your order! Your official invoice #${invoice.invoiceNumber} for Order #${invoice.orderNumber} totaling ${currencySymbol}${Number(invoice.total).toFixed(2)} has been generated.\n\nSubtotal: ${currencySymbol}${Number(invoice.subtotal).toFixed(2)}\nTotal: ${currencySymbol}${Number(invoice.total).toFixed(2)}\n\nThank you for your business!`
  });
}

// GET /api/orders
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search = '', order_status = '', payment_status = '' } = req.query;

    if (isUsingFallback()) {
      let list = memoryStore.orders.filter(o => o.user_id === userId);

      if (search) {
        const s = search.toLowerCase();
        list = list.filter(o => 
          o.order_number.toLowerCase().includes(s) ||
          o.customer_name.toLowerCase().includes(s) ||
          o.customer_phone.toLowerCase().includes(s)
        );
      }
      if (order_status && order_status !== 'All') {
        list = list.filter(o => o.order_status === order_status);
      }
      if (payment_status && payment_status !== 'All') {
        list = list.filter(o => o.payment_status === payment_status);
      }

      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return res.json({ success: true, count: list.length, orders: list });
    }

    let sql = 'SELECT * FROM orders WHERE user_id = ?';
    const params = [userId];

    if (search) {
      sql += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (order_status && order_status !== 'All') {
      sql += ' AND order_status = ?';
      params.push(order_status);
    }
    if (payment_status && payment_status !== 'All') {
      sql += ' AND payment_status = ?';
      params.push(payment_status);
    }

    sql += ' ORDER BY created_at DESC';

    const orders = await query(sql, params);
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);

    if (isUsingFallback()) {
      const order = memoryStore.orders.find(o => o.id === orderId && o.user_id === userId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

      const booking = memoryStore.courier_bookings.find(b => b.order_id === orderId && b.user_id === userId);
      const refund = (memoryStore.refunds || []).find(r => r.order_id === orderId && r.user_id === userId);
      return res.json({ success: true, order, courierBooking: booking || null, refundDetails: refund || null });
    }

    const [orders] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
    if (!orders) return res.status(404).json({ success: false, message: 'Order not found.' });

    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    const [courier] = await query('SELECT * FROM courier_bookings WHERE order_id = ? AND user_id = ?', [orderId, userId]);
    const [refund] = await query('SELECT * FROM refunds WHERE order_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1', [orderId, userId]);

    orders.items = items || [];
    res.json({ success: true, order: orders, courierBooking: courier || null, refundDetails: refund || null });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders (Three-step Place Order execution)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      customer, // { id (optional), name, phone, email, address, saveCustomer }
      items,    // [ { productId, quantity } ]
      payment_status = 'Unpaid',
      shipping = 0,
      discount = 0,
      notes = '',
      send_invoice_email = false
    } = req.body;

    const deliveryCharge = Math.max(0, parseFloat(shipping) || 0);
    const discountVal = Math.max(0, parseFloat(discount) || 0);

    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return res.status(400).json({ success: false, message: 'Customer name, phone, and delivery address are required.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one product.' });
    }

    if (isUsingFallback()) {
      // 1. Stock Validation Check
      const resolvedItems = [];
      let subtotal = 0;

      for (const item of items) {
        const prod = memoryStore.products.find(p => p.id === parseInt(item.productId) && p.user_id === userId);
        if (!prod) {
          return res.status(400).json({ success: false, message: `Product ID ${item.productId} not found.` });
        }
        const qty = parseInt(item.quantity);
        if (qty <= 0) {
          return res.status(400).json({ success: false, message: `Invalid quantity for ${prod.name}.` });
        }
        if (prod.stock < qty) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${qty}.`
          });
        }

        const lineTotal = prod.selling_price * qty;
        subtotal += lineTotal;
        resolvedItems.push({
          product_id: prod.id,
          product_name: prod.name,
          unit_price: prod.selling_price,
          quantity: qty,
          line_total: lineTotal,
          productRef: prod
        });
      }

      // 2. Customer Handling (Auto-create or update per Section 18)
      let customerRecord = memoryStore.customers.find(
        c => c.user_id === userId && (c.phone === customer.phone || (customer.email && c.email === customer.email))
      );

      const orderTotal = Math.max(0, subtotal - discountVal + deliveryCharge);

      if (!customerRecord) {
        customerRecord = {
          id: memoryStore.customers.length + 1,
          user_id: userId,
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          address: customer.address,
          total_orders: 1,
          total_spent: payment_status === 'Paid' ? orderTotal : 0,
          last_order_at: new Date().toISOString()
        };
        memoryStore.customers.unshift(customerRecord);
      } else {
        customerRecord.total_orders += 1;
        if (payment_status === 'Paid') customerRecord.total_spent += orderTotal;
        customerRecord.last_order_at = new Date().toISOString();
        if (customer.address) customerRecord.address = customer.address;
      }

      // 3. Deduct stock & create audit log
      const orderNumber = `BP-${1025 + memoryStore.orders.length}`;
      for (const item of resolvedItems) {
        const prev = item.productRef.stock;
        item.productRef.stock -= item.quantity;
        item.productRef.status = computeProductStatus(item.productRef.stock, item.productRef.low_stock_threshold);

        memoryStore.stock_history.unshift({
          id: memoryStore.stock_history.length + 1,
          user_id: userId,
          product_id: item.product_id,
          product_name: item.product_name,
          movement_type: 'Order/Sale Deduction',
          quantity_change: -item.quantity,
          previous_stock: prev,
          new_stock: item.productRef.stock,
          reason: `Order #${orderNumber}`,
          created_at: new Date().toISOString()
        });

        // Trigger low-stock notification if reached
        if (item.productRef.stock <= item.productRef.low_stock_threshold) {
          memoryStore.notifications.unshift({
            id: memoryStore.notifications.length + 1,
            user_id: userId,
            type: 'low_stock',
            title: 'Low Stock Alert',
            message: `${item.product_name} is now at ${item.productRef.stock} units.`,
            link: '/inventory',
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      }

      // 4. Create Order
      const newOrder = {
        id: memoryStore.orders.length + 1,
        user_id: userId,
        customer_id: customerRecord.id,
        order_number: orderNumber,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email || '',
        customer_address: customer.address,
        subtotal,
        tax: 0,
        shipping: deliveryCharge,
        discount: discountVal,
        total: orderTotal,
        payment_status: payment_status === 'Paid' ? 'Paid' : 'Unpaid',
        order_status: 'Confirmed',
        notes: notes || '',
        created_at: new Date().toISOString(),
        items: resolvedItems.map(ri => ({
          product_id: ri.product_id,
          product_name: ri.product_name,
          unit_price: ri.unit_price,
          quantity: ri.quantity,
          line_total: ri.line_total
        }))
      };
      memoryStore.orders.unshift(newOrder);

      // 5. Trigger Notifications
      memoryStore.notifications.unshift({
        id: memoryStore.notifications.length + 1,
        user_id: userId,
        type: 'new_order',
        title: 'New Order Placed',
        message: `Order #${newOrder.order_number} received from ${newOrder.customer_name} (৳${newOrder.total.toFixed(2)}).`,
        link: '/orders',
        is_read: false,
        created_at: new Date().toISOString()
      });

      // 6. Invoice Email Notification based on merchant toggle
      let invoiceEmailSent = false;
      if (Boolean(send_invoice_email) && newOrder.customer_email) {
        const merchant = memoryStore.users.find(u => u.id === userId);
        try {
          await buildAndSendInvoiceEmail({
            order: newOrder,
            merchant,
            targetEmail: newOrder.customer_email
          });
          invoiceEmailSent = true;
        } catch (mailErr) {
          console.error('[ORDER EMAIL ERROR]', mailErr.message);
        }
      }

      newOrder.invoice_email_sent = invoiceEmailSent;

      communicationService.sendSMS({
        phone: newOrder.customer_phone,
        text: `BizPilot: Order #${newOrder.order_number} of ৳${newOrder.total.toFixed(2)} confirmed. We will notify you when it ships!`
      });

      return res.status(201).json({
        success: true,
        message: invoiceEmailSent
          ? `Order created successfully and invoice sent to ${newOrder.customer_email}.`
          : 'Order created successfully.',
        order: newOrder
      });
    }

    // MySQL Flow
    let subtotal = 0;
    const resolvedItems = [];

    // Verify stock
    for (const item of items) {
      const [prods] = await query('SELECT * FROM products WHERE id = ? AND user_id = ?', [item.productId, userId]);
      if (!prods) {
        return res.status(400).json({ success: false, message: `Product ID ${item.productId} not found.` });
      }
      const qty = parseInt(item.quantity);
      if (prods.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${prods.name}". Available: ${prods.stock}, Requested: ${qty}.`
        });
      }
      const lineTotal = prods.selling_price * qty;
      subtotal += lineTotal;
      resolvedItems.push({
        product_id: prods.id,
        product_name: prods.name,
        unit_price: prods.selling_price,
        quantity: qty,
        line_total: lineTotal,
        currentStock: prods.stock,
        threshold: prods.low_stock_threshold
      });
    }

    const orderTotal = Math.max(0, subtotal - discountVal + deliveryCharge);

    // Auto Customer check
    let customerId = null;
    const [existingCustomer] = await query('SELECT id FROM customers WHERE user_id = ? AND phone = ?', [userId, customer.phone]);
    if (existingCustomer) {
      customerId = existingCustomer.id;
      await query(`
        UPDATE customers 
        SET total_orders = total_orders + 1,
            total_spent = total_spent + ?,
            last_order_at = NOW(),
            address = ?
        WHERE id = ?
      `, [payment_status === 'Paid' ? orderTotal : 0, customer.address, customerId]);
    } else {
      const custResult = await query(`
        INSERT INTO customers (user_id, name, phone, email, address, total_orders, total_spent, last_order_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, NOW())
      `, [userId, customer.name, customer.phone, customer.email || '', customer.address, payment_status === 'Paid' ? orderTotal : 0]);
      customerId = custResult.insertId;
    }

    const orderNumber = `BP-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderResult = await query(`
      INSERT INTO orders (user_id, customer_id, order_number, customer_name, customer_phone, customer_email, customer_address, subtotal, shipping, discount, total, payment_status, order_status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)
    `, [userId, customerId, orderNumber, customer.name, customer.phone, customer.email || '', customer.address, subtotal, deliveryCharge, discountVal, orderTotal, payment_status, notes]);

    const orderId = orderResult.insertId;

    // Deduct stock and save order items
    for (const item of resolvedItems) {
      await query(`
        INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.product_name, item.unit_price, item.quantity, item.line_total]);

      const newStock = item.currentStock - item.quantity;
      const newStatus = computeProductStatus(newStock, item.threshold);
      await query('UPDATE products SET stock = ?, status = ? WHERE id = ?', [newStock, newStatus, item.product_id]);

      await query(`
        INSERT INTO stock_history (user_id, product_id, movement_type, quantity_change, previous_stock, new_stock, reason)
        VALUES (?, ?, 'Order/Sale Deduction', ?, ?, ?, ?)
      `, [userId, item.product_id, -item.quantity, item.currentStock, newStock, `Order #${orderNumber}`]);
    }

    // Insert Notification
    await query(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'new_order', 'New Order Placed', ?, '/orders')
    `, [userId, `Order #${orderNumber} received from ${customer.name} (৳${orderTotal.toFixed(2)}).`]);

    let invoiceEmailSent = false;
    if (Boolean(send_invoice_email) && customer.email) {
      try {
        const [merchant] = await query('SELECT * FROM users WHERE id = ?', [userId]);
        const orderForInvoice = {
          id: orderId,
          order_number: orderNumber,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          customer_address: customer.address,
          subtotal,
          shipping: deliveryCharge,
          discount: discountVal,
          tax: 0,
          total: orderTotal,
          payment_status: payment_status === 'Paid' ? 'Paid' : 'Unpaid',
          order_status: 'Confirmed',
          notes: notes || '',
          created_at: new Date().toISOString(),
          items: resolvedItems
        };
        await buildAndSendInvoiceEmail({
          order: orderForInvoice,
          merchant,
          targetEmail: customer.email
        });
        invoiceEmailSent = true;
      } catch (mailErr) {
        console.error('[ORDER EMAIL ERROR]', mailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: invoiceEmailSent
        ? `Order created successfully and invoice sent to ${customer.email}.`
        : 'Order created successfully.',
      order: {
        id: orderId,
        order_number: orderNumber,
        customer_name: customer.name,
        customer_email: customer.email,
        total: orderTotal,
        payment_status,
        invoice_email_sent: invoiceEmailSent
      }
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/:id/mark-paid
router.patch('/:id/mark-paid', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);

    if (isUsingFallback()) {
      const order = memoryStore.orders.find(o => o.id === orderId && o.user_id === userId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

      order.payment_status = 'Paid';

      // Update customer total spent
      const customer = memoryStore.customers.find(c => c.id === order.customer_id);
      if (customer) {
        customer.total_spent += order.total;
      }

      // Add Notification
      memoryStore.notifications.unshift({
        id: memoryStore.notifications.length + 1,
        user_id: userId,
        type: 'payment_received',
        title: 'Payment Confirmed',
        message: `Payment of $${order.total.toFixed(2)} for Order #${order.order_number} marked as Paid.`,
        link: '/revenue',
        is_read: false,
        created_at: new Date().toISOString()
      });

      return res.json({
        success: true,
        message: `Order #${order.order_number} payment marked as Paid. Revenue updated.`,
        order
      });
    }

    const [order] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    await query("UPDATE orders SET payment_status = 'Paid' WHERE id = ? AND user_id = ?", [orderId, userId]);
    if (order.customer_id) {
      await query('UPDATE customers SET total_spent = total_spent + ? WHERE id = ?', [order.total, order.customer_id]);
    }

    await query(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'payment_received', 'Payment Confirmed', ?, '/revenue')
    `, [userId, `Payment of $${parseFloat(order.total).toFixed(2)} for Order #${order.order_number} marked as Paid.`]);

    res.json({
      success: true,
      message: `Order #${order.order_number} payment marked as Paid. Revenue updated.`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);
    const { reason = 'Merchant Cancelled', notes = '', send_email = true } = req.body;

    if (isUsingFallback()) {
      const order = memoryStore.orders.find(o => o.id === orderId && o.user_id === userId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
      if (order.order_status === 'Cancelled') {
        return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
      }

      const merchant = memoryStore.users.find(u => u.id === userId);
      const isPaid = order.payment_status === 'Paid';

      // 1. Replenish inventory
      const items = order.items || [];
      for (const item of items) {
        const prod = memoryStore.products.find(p => p.id === item.product_id && p.user_id === userId);
        if (prod) {
          const prev = prod.stock;
          prod.stock += item.quantity;
          prod.status = computeProductStatus(prod.stock, prod.low_stock_threshold);
          memoryStore.stock_history.unshift({
            id: memoryStore.stock_history.length + 1,
            user_id: userId,
            product_id: prod.id,
            movement_type: 'Return/Correction',
            quantity_change: item.quantity,
            previous_stock: prev,
            new_stock: prod.stock,
            reason: `Order #${order.order_number} Cancelled${isPaid ? ' (Refund Pending)' : ''}`,
            created_at: new Date().toISOString()
          });
        }
      }

      order.cancellation_reason = reason;
      order.cancelled_at = new Date().toISOString();
      order.order_status = 'Cancelled';

      if (isPaid) {
        // Paid Order -> Cancelled -> Refund Pending
        order.payment_status = 'Refund Pending';
        order.refund_status = 'Refund Pending';
        order.refund_amount = order.total;

        const refundRecord = {
          id: (memoryStore.refunds?.length || 0) + 1,
          user_id: userId,
          order_id: orderId,
          amount: order.total,
          status: 'Refund Pending',
          reason,
          notes: notes || '',
          method: null,
          transaction_id: null,
          processed_at: null,
          created_at: new Date().toISOString()
        };
        memoryStore.refunds = memoryStore.refunds || [];
        memoryStore.refunds.unshift(refundRecord);

        memoryStore.notifications.unshift({
          id: memoryStore.notifications.length + 1,
          user_id: userId,
          type: 'system',
          title: 'Order Cancelled - Refund Pending',
          message: `Paid Order #${order.order_number} cancelled. Refund of $${parseFloat(order.total).toFixed(2)} is pending.`,
          link: `/orders?view=${orderId}`,
          is_read: false,
          created_at: new Date().toISOString()
        });

        return res.json({
          success: true,
          message: `Paid Order #${order.order_number} has been cancelled. Inventory restored and refund is now Pending.`,
          order,
          refundDetails: refundRecord
        });
      } else {
        // Unpaid Order -> Cancelled -> Email
        memoryStore.notifications.unshift({
          id: memoryStore.notifications.length + 1,
          user_id: userId,
          type: 'system',
          title: 'Order Cancelled',
          message: `Unpaid Order #${order.order_number} cancelled. Items restored to inventory.`,
          link: `/orders?view=${orderId}`,
          is_read: false,
          created_at: new Date().toISOString()
        });

        if (send_email && order.customer_email) {
          try {
            await communicationService.sendCancellationEmail({
              order,
              merchant,
              reason,
              notes
            });
          } catch (e) {
            console.error('[CANCELLATION EMAIL ERROR]', e.message);
          }
        }

        return res.json({
          success: true,
          message: `Unpaid Order #${order.order_number} has been cancelled. Stock replenished and cancellation email sent.`,
          order
        });
      }
    }

    // Real MySQL Database execution
    const [order] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.order_status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
    }

    const [merchant] = await query('SELECT * FROM users WHERE id = ?', [userId]);
    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    order.items = items || [];

    const isPaid = order.payment_status === 'Paid';

    // 1. Replenish inventory items
    for (const item of (items || [])) {
      if (item.product_id) {
        const [prod] = await query('SELECT * FROM products WHERE id = ? AND user_id = ?', [item.product_id, userId]);
        if (prod) {
          const newStock = prod.stock + item.quantity;
          const newStatus = computeProductStatus(newStock, prod.low_stock_threshold);
          await query('UPDATE products SET stock = ?, status = ? WHERE id = ? AND user_id = ?', [newStock, newStatus, prod.id, userId]);
          await query(`
            INSERT INTO stock_history (user_id, product_id, movement_type, quantity_change, previous_stock, new_stock, reason)
            VALUES (?, ?, 'Return/Correction', ?, ?, ?, ?)
          `, [userId, prod.id, item.quantity, prod.stock, newStock, `Order #${order.order_number} Cancelled${isPaid ? ' (Refund Pending)' : ''}`]);
        }
      }
    }

    if (isPaid) {
      // Branch B: Paid Order -> Cancelled -> Refund Pending
      await query(`
        UPDATE orders 
        SET order_status = 'Cancelled',
            payment_status = 'Refund Pending',
            refund_status = 'Refund Pending',
            refund_amount = total,
            cancellation_reason = ?,
            cancelled_at = NOW()
        WHERE id = ? AND user_id = ?
      `, [reason, orderId, userId]);

      const refundResult = await query(`
        INSERT INTO refunds (user_id, order_id, amount, status, reason, notes)
        VALUES (?, ?, ?, 'Refund Pending', ?, ?)
      `, [userId, orderId, order.total, reason, notes]);

      await query(`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (?, 'system', 'Order Cancelled - Refund Pending', ?, ?)
      `, [userId, `Paid Order #${order.order_number} cancelled. Refund of $${parseFloat(order.total).toFixed(2)} is pending.`, `/orders?view=${orderId}`]);

      const [updatedOrder] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
      updatedOrder.items = items;

      return res.json({
        success: true,
        message: `Paid Order #${order.order_number} has been cancelled. Inventory restored and refund is now Pending.`,
        order: updatedOrder,
        refundDetails: {
          id: refundResult?.insertId,
          order_id: orderId,
          amount: order.total,
          status: 'Refund Pending',
          reason
        }
      });
    } else {
      // Branch A: Unpaid Order -> Cancelled -> Cancellation Email
      await query(`
        UPDATE orders 
        SET order_status = 'Cancelled',
            cancellation_reason = ?,
            cancelled_at = NOW()
        WHERE id = ? AND user_id = ?
      `, [reason, orderId, userId]);

      await query(`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (?, 'system', 'Order Cancelled', ?, ?)
      `, [userId, `Unpaid Order #${order.order_number} cancelled. Items restored to inventory.`, `/orders?view=${orderId}`]);

      if (send_email && order.customer_email) {
        try {
          await communicationService.sendCancellationEmail({
            order,
            merchant,
            reason,
            notes
          });
        } catch (e) {
          console.error('[CANCELLATION EMAIL ERROR]', e.message);
        }
      }

      const [updatedOrder] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
      updatedOrder.items = items;

      return res.json({
        success: true,
        message: `Unpaid Order #${order.order_number} has been cancelled. Stock replenished and cancellation email sent.`,
        order: updatedOrder
      });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/refund/processing
router.post('/:id/refund/processing', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);
    const { notes = '' } = req.body;

    if (isUsingFallback()) {
      const order = memoryStore.orders.find(o => o.id === orderId && o.user_id === userId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

      order.refund_status = 'Refund Processing';
      order.payment_status = 'Refund Processing';
      if (notes) order.refund_notes = notes;

      const refund = (memoryStore.refunds || []).find(r => r.order_id === orderId && r.user_id === userId);
      if (refund) {
        refund.status = 'Refund Processing';
        if (notes) refund.notes = notes;
      }

      memoryStore.notifications.unshift({
        id: memoryStore.notifications.length + 1,
        user_id: userId,
        type: 'system',
        title: 'Refund Status: Processing',
        message: `Refund for Order #${order.order_number} is now in processing.`,
        link: `/orders?view=${orderId}`,
        is_read: false,
        created_at: new Date().toISOString()
      });

      return res.json({
        success: true,
        message: `Refund status for Order #${order.order_number} marked as Processing.`,
        order
      });
    }

    const [order] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    await query(`
      UPDATE orders 
      SET refund_status = 'Refund Processing',
          payment_status = 'Refund Processing',
          refund_notes = COALESCE(?, refund_notes)
      WHERE id = ? AND user_id = ?
    `, [notes || null, orderId, userId]);

    await query(`
      UPDATE refunds 
      SET status = 'Refund Processing',
          notes = COALESCE(?, notes)
      WHERE order_id = ? AND user_id = ?
    `, [notes || null, orderId, userId]);

    await query(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'system', 'Refund Status: Processing', ?, ?)
    `, [userId, `Refund for Order #${order.order_number} is now in processing.`, `/orders?view=${orderId}`]);

    const [updatedOrder] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
    res.json({
      success: true,
      message: `Refund status for Order #${order.order_number} marked as Processing.`,
      order: updatedOrder
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/refund/complete
router.post('/:id/refund/complete', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);
    const {
      refund_amount,
      refund_method = 'Original Payment Method',
      transaction_id = '',
      notes = '',
      send_email = true
    } = req.body;

    if (isUsingFallback()) {
      const order = memoryStore.orders.find(o => o.id === orderId && o.user_id === userId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

      const finalAmount = Math.max(0, parseFloat(refund_amount) || parseFloat(order.total) || 0);

      order.refund_status = 'Refunded';
      order.payment_status = 'Refunded';
      order.refund_amount = finalAmount;
      order.refund_method = refund_method;
      order.refund_transaction_id = transaction_id;
      order.refund_notes = notes;
      order.refunded_at = new Date().toISOString();

      // Deduct customer total_spent
      const customer = memoryStore.customers.find(c => c.id === order.customer_id);
      if (customer) {
        customer.total_spent = Math.max(0, customer.total_spent - finalAmount);
      }

      // Update refund record
      let refund = (memoryStore.refunds || []).find(r => r.order_id === orderId && r.user_id === userId);
      if (refund) {
        refund.status = 'Refunded';
        refund.amount = finalAmount;
        refund.method = refund_method;
        refund.transaction_id = transaction_id;
        refund.notes = notes;
        refund.processed_at = new Date().toISOString();
      } else {
        refund = {
          id: (memoryStore.refunds?.length || 0) + 1,
          user_id: userId,
          order_id: orderId,
          amount: finalAmount,
          status: 'Refunded',
          method: refund_method,
          transaction_id,
          notes,
          processed_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        memoryStore.refunds = memoryStore.refunds || [];
        memoryStore.refunds.unshift(refund);
      }

      memoryStore.notifications.unshift({
        id: memoryStore.notifications.length + 1,
        user_id: userId,
        type: 'system',
        title: 'Refund Completed',
        message: `Refund of ৳${finalAmount.toFixed(2)} completed for Order #${order.order_number}. Revenue adjusted.`,
        link: `/orders?view=${orderId}`,
        is_read: false,
        created_at: new Date().toISOString()
      });

      if (send_email && order.customer_email) {
        const merchant = memoryStore.users.find(u => u.id === userId);
        try {
          await communicationService.sendRefundEmail({
            order,
            refund,
            merchant
          });
        } catch (e) {
          console.error('[REFUND EMAIL ERROR]', e.message);
        }
      }

      return res.json({
        success: true,
        message: `Refund of $${finalAmount.toFixed(2)} completed for Order #${order.order_number}. Customer total spent and revenues adjusted.`,
        order,
        refundDetails: refund
      });
    }

    // Real MySQL execution
    const [order] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const items = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    order.items = items || [];

    const finalAmount = Math.max(0, parseFloat(refund_amount) || parseFloat(order.total) || 0);

    // 1. Update order
    await query(`
      UPDATE orders 
      SET refund_status = 'Refunded',
          payment_status = 'Refunded',
          refund_amount = ?,
          refund_method = ?,
          refund_transaction_id = ?,
          refund_notes = ?,
          refunded_at = NOW()
      WHERE id = ? AND user_id = ?
    `, [finalAmount, refund_method, transaction_id, notes, orderId, userId]);

    // 2. Update/Insert refunds record
    const [existingRefund] = await query('SELECT id FROM refunds WHERE order_id = ? AND user_id = ?', [orderId, userId]);
    if (existingRefund) {
      await query(`
        UPDATE refunds 
        SET status = 'Refunded',
            amount = ?,
            method = ?,
            transaction_id = ?,
            notes = ?,
            processed_at = NOW()
        WHERE id = ?
      `, [finalAmount, refund_method, transaction_id, notes, existingRefund.id]);
    } else {
      await query(`
        INSERT INTO refunds (user_id, order_id, amount, status, method, transaction_id, reason, notes, processed_at)
        VALUES (?, ?, ?, 'Refunded', ?, ?, ?, ?, NOW())
      `, [userId, orderId, finalAmount, refund_method, transaction_id, order.cancellation_reason || 'Merchant Refund', notes]);
    }

    // 3. Customer total spent deduction
    if (order.customer_id) {
      await query(`
        UPDATE customers 
        SET total_spent = GREATEST(0, total_spent - ?)
        WHERE id = ?
      `, [finalAmount, order.customer_id]);
    }

    // 4. In-app notification
    await query(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'system', 'Refund Completed', ?, ?)
    `, [userId, `Refund of ৳${finalAmount.toFixed(2)} completed for Order #${order.order_number}. Revenue and reports adjusted.`, `/orders?view=${orderId}`]);

    // 5. Send Refund Receipt Email
    if (send_email && order.customer_email) {
      const [merchant] = await query('SELECT * FROM users WHERE id = ?', [userId]);
      try {
        await communicationService.sendRefundEmail({
          order,
          refund: {
            amount: finalAmount,
            method: refund_method,
            transaction_id,
            notes
          },
          merchant
        });
      } catch (e) {
        console.error('[REFUND EMAIL ERROR]', e.message);
      }
    }

    const [updatedOrder] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
    updatedOrder.items = items;

    res.json({
      success: true,
      message: `Refund of ৳${finalAmount.toFixed(2)} completed for Order #${order.order_number}. Revenue, reports, and customer spent updated.`,
      order: updatedOrder,
      refundDetails: {
        amount: finalAmount,
        status: 'Refunded',
        method: refund_method,
        transaction_id
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id/invoice
router.get('/:id/invoice', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);

    let order = null;
    let merchant = null;

    if (isUsingFallback()) {
      order = memoryStore.orders.find(o => o.id === orderId && o.user_id === userId);
      merchant = memoryStore.users.find(u => u.id === userId);
    } else {
      const [ord] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
      if (ord) {
        const items = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
        ord.items = items;
        order = ord;
      }
      const [user] = await query('SELECT * FROM users WHERE id = ?', [userId]);
      merchant = user;
    }

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const invoice = generateInvoiceData(order, merchant);
    res.json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/invoice/email
router.post('/:id/invoice/email', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orderId = parseInt(req.params.id);
    const { email, orderNumber, customerName, total, items, subtotal, tax, shipping, discount } = req.body;

    let order = null;
    let merchant = null;

    if (isUsingFallback()) {
      order = memoryStore.orders.find(o => o.id === orderId && o.user_id === userId);
      merchant = memoryStore.users.find(u => u.id === userId);
    } else {
      const [ord] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
      if (ord) {
        const dbItems = await query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
        ord.items = dbItems;
        order = ord;
      }
      const [user] = await query('SELECT * FROM users WHERE id = ?', [userId]);
      merchant = user;
    }

    const targetEmail = email || order?.customer_email;
    if (!targetEmail) {
      return res.status(400).json({ success: false, message: 'No recipient email specified.' });
    }

    const fallbackOrder = order || {
      id: orderId,
      order_number: orderNumber,
      customer_name: customerName,
      customer_email: targetEmail,
      total,
      subtotal: subtotal || total,
      tax: tax || 0,
      shipping: shipping || 0,
      discount: discount || 0,
      items: items || []
    };

    const result = await buildAndSendInvoiceEmail({
      order: fallbackOrder,
      merchant,
      targetEmail,
      customItems: items || fallbackOrder.items
    });

    res.json({ success: true, message: `Invoice sent via email to ${targetEmail}`, result });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/invoice/sms
router.post('/:id/invoice/sms', authenticateToken, async (req, res, next) => {
  try {
    const { phone, orderNumber, total } = req.body;
    const result = await communicationService.sendSMS({
      phone,
      text: `BizPilot: Your invoice for Order #${orderNumber} totaling ৳${total} has been generated. Thank you!`
    });
    res.json({ success: true, message: `Invoice SMS sent to ${phone}`, result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

