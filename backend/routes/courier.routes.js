const express = require('express');
const router = express.Router();
const { query, isUsingFallback, memoryStore } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const courierService = require('../services/courierService');
const pathaoService = require('../services/courier/pathao.service');

// GET /api/courier/pathao/test-auth - Test Pathao sandbox authentication
router.get('/pathao/test-auth', authenticateToken, async (req, res, next) => {
  try {
    const token = await pathaoService.getAccessToken();
    res.json({
      success: true,
      message: 'Pathao sandbox authentication successful',
      data: {
        tokenPreview: token.substring(0, 20) + '...',
        expiresAt: pathaoService.tokenExpiry ? new Date(pathaoService.tokenExpiry).toISOString() : null
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/courier/pathao/stores - Get Pathao merchant stores
router.get('/pathao/stores', authenticateToken, async (req, res, next) => {
  try {
    const stores = await pathaoService.getStores();
    res.json({
      success: true,
      message: 'Pathao stores retrieved successfully',
      data: { stores }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/courier/pathao/test-order - Create test Pathao order from existing BizPilot order
router.post('/pathao/test-order', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    const orderIdNum = parseInt(orderId);

    // Find the order
    let order = null;
    if (isUsingFallback()) {
      order = memoryStore.orders.find(o => o.id === orderIdNum && o.user_id === userId);
    } else {
      const [orders] = await query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderIdNum, userId]);
      order = orders;
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Check if order already has a courier booking (duplicate protection)
    let existingBooking = null;
    if (isUsingFallback()) {
      existingBooking = memoryStore.courier_bookings.find(b => b.order_id === orderIdNum && b.user_id === userId);
    } else {
      const [booking] = await query('SELECT * FROM courier_bookings WHERE order_id = ? AND user_id = ?', [orderIdNum, userId]);
      existingBooking = booking;
    }

    if (existingBooking) {
      return res.json({
        success: true,
        message: 'Order already has a courier booking. Returning existing booking.',
        data: {
          courier: existingBooking.provider,
          courierOrderId: existingBooking.tracking_id,
          trackingId: existingBooking.tracking_id,
          status: existingBooking.status,
          bookedAt: existingBooking.booked_at
        }
      });
    }

    // Validate required fields for courier
    if (!order.customer_name || !order.customer_phone || !order.customer_address) {
      return res.status(400).json({
        success: false,
        message: 'Order is missing required customer information (name, phone, or address).'
      });
    }

    // Map BizPilot order to Pathao format
    const pathaoOrder = pathaoService.mapOrderToPathao(order);

    // Create Pathao order
    const result = await pathaoService.createOrder(pathaoOrder);

    // Save courier booking to database
    if (isUsingFallback()) {
      const newBooking = {
        id: memoryStore.courier_bookings.length + 1,
        user_id: userId,
        order_id: orderIdNum,
        order_number: order.order_number,
        provider: 'Pathao',
        tracking_id: result.trackingId,
        recipient_name: order.customer_name,
        recipient_phone: order.customer_phone,
        recipient_address: order.customer_address,
        weight: 0.5,
        collection_amount: pathaoOrder.collectionAmount,
        status: result.status,
        booked_at: new Date().toISOString()
      };
      memoryStore.courier_bookings.unshift(newBooking);

      if (order) order.order_status = 'Shipped';

      memoryStore.notifications.unshift({
        id: memoryStore.notifications.length + 1,
        user_id: userId,
        type: 'courier_update',
        title: 'Pathao Test Order Created',
        message: `Test shipment for ${order.order_number} created via Pathao Sandbox. Tracking: ${result.trackingId}`,
        link: '/courier',
        is_read: false,
        created_at: new Date().toISOString()
      });
    } else {
      await query(`
        INSERT INTO courier_bookings (user_id, order_id, provider, tracking_id, recipient_name, recipient_phone, recipient_address, weight, collection_amount, status)
        VALUES (?, ?, 'Pathao', ?, ?, ?, ?, 0.5, ?, ?)
      `, [userId, orderIdNum, result.trackingId, order.customer_name, order.customer_phone, order.customer_address, pathaoOrder.collectionAmount, result.status]);

      await query("UPDATE orders SET order_status = 'Shipped' WHERE id = ? AND user_id = ?", [orderIdNum, userId]);

      await query(`
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (?, 'courier_update', 'Pathao Test Order Created', ?, '/courier')
      `, [userId, `Test shipment for ${order.order_number} created via Pathao Sandbox. Tracking: ${result.trackingId}`]);
    }

    res.status(201).json({
      success: true,
      message: 'Pathao sandbox test order created successfully',
      data: {
        courier: 'Pathao',
        courierOrderId: result.courierOrderId,
        trackingId: result.trackingId,
        status: result.status,
        storeId: result.storeId,
        rawResponse: result.rawResponse
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/courier/eligible
router.get('/eligible', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (isUsingFallback()) {
      // Find orders that don't have an active courier booking yet or are confirmed
      const bookedOrderIds = memoryStore.courier_bookings.filter(b => b.user_id === userId).map(b => b.order_id);
      const eligible = memoryStore.orders.filter(o => o.user_id === userId && !bookedOrderIds.includes(o.id));
      return res.json({ success: true, count: eligible.length, eligibleOrders: eligible });
    }

    const eligibleOrders = await query(`
      SELECT o.* 
      FROM orders o
      LEFT JOIN courier_bookings cb ON o.id = cb.order_id
      WHERE o.user_id = ? AND cb.id IS NULL AND o.order_status NOT IN ('Cancelled', 'Delivered')
      ORDER BY o.created_at DESC
    `, [userId]);

    res.json({ success: true, count: eligibleOrders.length, eligibleOrders });
  } catch (err) {
    next(err);
  }
});

// GET /api/courier/bookings
router.get('/bookings', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { provider = '', status = '', search = '' } = req.query;

    if (isUsingFallback()) {
      let list = memoryStore.courier_bookings.filter(b => b.user_id === userId);

      if (provider && provider !== 'All') {
        list = list.filter(b => b.provider.toLowerCase().includes(provider.toLowerCase()));
      }
      if (status && status !== 'All') {
        list = list.filter(b => b.status === status);
      }
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(b => 
          b.tracking_id.toLowerCase().includes(s) ||
          b.recipient_name.toLowerCase().includes(s) ||
          b.recipient_phone.toLowerCase().includes(s)
        );
      }

      list.sort((a, b) => new Date(b.booked_at) - new Date(a.booked_at));
      return res.json({ success: true, count: list.length, bookings: list });
    }

    let sql = 'SELECT * FROM courier_bookings WHERE user_id = ?';
    const params = [userId];

    if (provider && provider !== 'All') {
      sql += ' AND provider LIKE ?';
      params.push(`%${provider}%`);
    }
    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (tracking_id LIKE ? OR recipient_name LIKE ? OR recipient_phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY booked_at DESC';

    const bookings = await query(sql, params);
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
});

// POST /api/courier/book
router.post('/book', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      order_id,
      provider = 'Steadfast',
      recipient_name,
      recipient_phone,
      recipient_address,
      weight = 1.0,
      collection_amount = 0.0
    } = req.body;

    if (!order_id || !recipient_name || !recipient_phone || !recipient_address) {
      return res.status(400).json({ success: false, message: 'Order ID, recipient name, phone, and address are required.' });
    }

    const orderIdNum = parseInt(order_id);

    // Call Courier API service to generate consignment and tracking ID
    const bookingData = await courierService.bookShipment({
      provider,
      orderId: orderIdNum,
      recipientName: recipient_name,
      recipientPhone: recipient_phone,
      recipientAddress: recipient_address,
      weight,
      collectionAmount: collection_amount
    });

    if (isUsingFallback()) {
      const order = memoryStore.orders.find(o => o.id === orderIdNum && o.user_id === userId);
      const orderNumber = order ? order.order_number : `BP-${orderIdNum}`;

      const newBooking = {
        id: memoryStore.courier_bookings.length + 1,
        user_id: userId,
        order_id: orderIdNum,
        order_number: orderNumber,
        provider: bookingData.provider,
        tracking_id: bookingData.trackingId,
        recipient_name,
        recipient_phone,
        recipient_address,
        weight: bookingData.weight,
        collection_amount: bookingData.collectionAmount,
        status: 'Booked',
        booked_at: new Date().toISOString()
      };
      memoryStore.courier_bookings.unshift(newBooking);

      if (order) order.order_status = 'Shipped';

      // Push notification
      memoryStore.notifications.unshift({
        id: memoryStore.notifications.length + 1,
        user_id: userId,
        type: 'courier_update',
        title: 'Courier Consignment Created',
        message: `Shipment for ${orderNumber} booked with ${newBooking.provider}. Tracking ID: ${newBooking.tracking_id}`,
        link: '/courier',
        is_read: false,
        created_at: new Date().toISOString()
      });

      return res.status(201).json({
        success: true,
        message: `Courier booking successfully created via ${newBooking.provider}.`,
        booking: newBooking
      });
    }

    // MySQL Flow
    const result = await query(`
      INSERT INTO courier_bookings (user_id, order_id, provider, tracking_id, recipient_name, recipient_phone, recipient_address, weight, collection_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Booked')
    `, [userId, orderIdNum, provider, bookingData.trackingId, recipient_name, recipient_phone, recipient_address, weight, collection_amount]);

    await query("UPDATE orders SET order_status = 'Shipped' WHERE id = ? AND user_id = ?", [orderIdNum, userId]);

    await query(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'courier_update', 'Courier Consignment Created', ?, '/courier')
    `, [userId, `Shipment booked with ${provider}. Tracking: ${bookingData.trackingId}`]);

    res.status(201).json({
      success: true,
      message: `Courier booking successfully created via ${provider}.`,
      booking: {
        id: result.insertId,
        trackingId: bookingData.trackingId,
        provider,
        status: 'Booked'
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/courier/track/:trackingId
router.get('/track/:trackingId', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { trackingId } = req.params;

    let booking = null;

    if (isUsingFallback()) {
      booking = memoryStore.courier_bookings.find(b => b.tracking_id === trackingId && b.user_id === userId);
    } else {
      const [bk] = await query('SELECT * FROM courier_bookings WHERE tracking_id = ? AND user_id = ?', [trackingId, userId]);
      booking = bk;
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Shipment tracking ID not found.' });
    }

    const timeline = courierService.getSimulatedTimeline(booking.status, booking.booked_at);

    res.json({
      success: true,
      booking,
      timeline
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/courier/status/:id (Simulate status advancement)
router.patch('/status/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.params.id);
    const { status } = req.body;

    const validStatuses = ['Booked', 'Picked Up', 'In Transit', 'Delivered', 'Failed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid courier status provided.' });
    }

    if (isUsingFallback()) {
      const booking = memoryStore.courier_bookings.find(b => b.id === bookingId && b.user_id === userId);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

      booking.status = status;
      if (status === 'Delivered') {
        const order = memoryStore.orders.find(o => o.id === booking.order_id);
        if (order) order.order_status = 'Delivered';
      }

      return res.json({ success: true, message: `Courier shipment status updated to "${status}".`, booking });
    }

    await query('UPDATE courier_bookings SET status = ? WHERE id = ? AND user_id = ?', [status, bookingId, userId]);
    if (status === 'Delivered') {
      await query(`
        UPDATE orders o 
        JOIN courier_bookings cb ON o.id = cb.order_id 
        SET o.order_status = 'Delivered' 
        WHERE cb.id = ? AND o.user_id = ?
      `, [bookingId, userId]);
    }

    res.json({ success: true, message: `Courier shipment status updated to "${status}".` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

