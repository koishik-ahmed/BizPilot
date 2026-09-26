const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let pool = null;
let useFallback = false;

// Fallback in-memory store for zero-setup execution if MySQL credentials fail
const memoryStore = {
  users: [
    {
      id: 1,
      name: 'Copper Merchant',
      business_name: 'Ryvix Commerce',
      email: 'demo@bizpilot.com',
      password_hash: bcrypt.hashSync('password123', 10),
      phone: '+1 (555) 234-5678',
      currency: 'USD',
      timezone: 'America/New_York',
      status: 'active',
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      last_login_at: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
      id: 2,
      name: 'Tanvir Hossain',
      business_name: 'GadgetZone Express',
      email: 'tanvir@gadgetzone.bd',
      password_hash: bcrypt.hashSync('password123', 10),
      phone: '+880 1712-345678',
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
      status: 'active',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      last_login_at: new Date(Date.now() - 5 * 3600000).toISOString()
    },
    {
      id: 3,
      name: 'Anik Rahman',
      business_name: 'Star Fashion House',
      email: 'anik@starfashion.bd',
      password_hash: bcrypt.hashSync('password123', 10),
      phone: '+880 1819-234567',
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
      status: 'active',
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      last_login_at: new Date(Date.now() - 8 * 86400000).toISOString()
    },
    {
      id: 4,
      name: 'Sarah Jenkins',
      business_name: 'Bloom Apothecary',
      email: 'sarah@bloomcandle.com',
      password_hash: bcrypt.hashSync('password123', 10),
      phone: '+1 (555) 432-8765',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      status: 'active',
      created_at: new Date(Date.now() - 75 * 86400000).toISOString(),
      last_login_at: new Date(Date.now() - 38 * 86400000).toISOString()
    },
    {
      id: 5,
      name: 'Kabir Ahmed',
      business_name: 'Dhaka Electronics Hub',
      email: 'kabir@dhakaelec.bd',
      password_hash: bcrypt.hashSync('password123', 10),
      phone: '+880 1911-987654',
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
      status: 'suspended',
      suspended_at: new Date(Date.now() - 4 * 86400000).toISOString(),
      suspension_reason: 'High chargeback/dispute rate and repeated unfulfilled COD consignments',
      created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
      last_login_at: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 6,
      name: 'Marcus Brody',
      business_name: 'Brody Leather Works',
      email: 'marcus@brodyleather.com',
      password_hash: bcrypt.hashSync('password123', 10),
      phone: '+1 (555) 876-5432',
      currency: 'USD',
      timezone: 'America/Chicago',
      status: 'active',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      last_login_at: new Date(Date.now() - 1 * 86400000).toISOString()
    }
  ],
  settings: [
    {
      id: 1,
      user_id: 1,
      default_currency: 'USD',
      default_courier: 'Steadfast',
      email_notifications: true,
      sms_notifications: true,
      in_app_notifications: true
    }
  ],
  products: [
    {
      id: 1,
      user_id: 1,
      name: 'Wireless Noise-Canceling Headphones',
      sku: 'TECH-HDP-01',
      category: 'Electronics',
      description: 'Premium wireless headphones with 40-hour battery life and spatial audio.',
      cost_price: 45.00,
      selling_price: 99.00,
      stock: 28,
      low_stock_threshold: 10,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80',
      status: 'In Stock',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString()
    },
    {
      id: 2,
      user_id: 1,
      name: 'Artisan Ceramic Pots (Set of 3)',
      sku: 'HOME-POT-02',
      category: 'Home & Living',
      description: 'Handcrafted ceramic succulent pots with drainage holes and bamboo saucers.',
      cost_price: 18.00,
      selling_price: 50.00,
      stock: 14,
      low_stock_threshold: 8,
      image_url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300&q=80',
      status: 'In Stock',
      created_at: new Date(Date.now() - 14 * 86400000).toISOString()
    },
    {
      id: 3,
      user_id: 1,
      name: 'Vintage Hardcover History Journal',
      sku: 'BOOK-HST-03',
      category: 'Books & Stationery',
      description: 'Collector edition archival paper notebook with gold-embossed spine.',
      cost_price: 9.50,
      selling_price: 28.00,
      stock: 4,
      low_stock_threshold: 10,
      image_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&q=80',
      status: 'Low Stock',
      created_at: new Date(Date.now() - 12 * 86400000).toISOString()
    },
    {
      id: 4,
      user_id: 1,
      name: 'Minimalist LED Desk Lamp',
      sku: 'HOME-LMP-04',
      category: 'Home & Living',
      description: 'Touch-control adjustable color temperature dimmable task light.',
      cost_price: 22.00,
      selling_price: 65.00,
      stock: 19,
      low_stock_threshold: 5,
      image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&q=80',
      status: 'In Stock',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      id: 5,
      user_id: 1,
      name: 'Smart Fitness Tracker Band',
      sku: 'TECH-FIT-05',
      category: 'Electronics',
      description: 'Waterproof activity watch with heart rate and sleep analytics.',
      cost_price: 30.00,
      selling_price: 75.00,
      stock: 2,
      low_stock_threshold: 8,
      image_url: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=300&q=80',
      status: 'Low Stock',
      created_at: new Date(Date.now() - 8 * 86400000).toISOString()
    },
    {
      id: 6,
      user_id: 1,
      name: 'Full-Grain Leather Wallet',
      sku: 'FASH-WLT-06',
      category: 'Fashion & Accessories',
      description: 'Slim RFID-blocking bifold wallet crafted from vegetable-tanned leather.',
      cost_price: 15.00,
      selling_price: 42.00,
      stock: 0,
      low_stock_threshold: 5,
      image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&q=80',
      status: 'Out of Stock',
      created_at: new Date(Date.now() - 6 * 86400000).toISOString()
    },
    {
      id: 7,
      user_id: 1,
      name: 'Organic Cotton Crewneck Tee',
      sku: 'FASH-TEE-07',
      category: 'Fashion & Accessories',
      description: 'Pre-shrunk ultra-soft organic combed cotton everyday unisex t-shirt.',
      cost_price: 8.00,
      selling_price: 25.00,
      stock: 45,
      low_stock_threshold: 15,
      image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80',
      status: 'In Stock',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString()
    },
    {
      id: 8,
      user_id: 1,
      name: 'Stainless Steel Thermal Flask (750ml)',
      sku: 'HOME-FLK-08',
      category: 'Home & Living',
      description: 'Double-wall vacuum insulated water bottle keeping liquids cold for 24h.',
      cost_price: 11.00,
      selling_price: 32.00,
      stock: 22,
      low_stock_threshold: 6,
      image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=300&q=80',
      status: 'In Stock',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 9,
      user_id: 2,
      name: 'Smart 1080P Projector Mini',
      sku: 'GZ-PRJ-01',
      category: 'Electronics',
      description: 'Compact wireless home theater projector with built-in Android.',
      cost_price: 9500.00,
      selling_price: 16500.00,
      stock: 12,
      low_stock_threshold: 4,
      image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300&q=80',
      status: 'In Stock',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString()
    },
    {
      id: 10,
      user_id: 2,
      name: 'ANC Wireless Gaming Earbuds',
      sku: 'GZ-EAR-02',
      category: 'Electronics',
      description: 'Low-latency gaming mode with active noise cancellation.',
      cost_price: 1200.00,
      selling_price: 2600.00,
      stock: 35,
      low_stock_threshold: 10,
      image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80',
      status: 'In Stock',
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    },
    {
      id: 11,
      user_id: 4,
      name: 'Lavender Vanilla Soy Candle',
      sku: 'BLM-CND-01',
      category: 'Home & Living',
      description: 'Hand-poured 100% natural soy wax aromatherapy candle.',
      cost_price: 8.00,
      selling_price: 24.00,
      stock: 18,
      low_stock_threshold: 5,
      image_url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300&q=80',
      status: 'In Stock',
      created_at: new Date(Date.now() - 70 * 86400000).toISOString()
    },
    {
      id: 12,
      user_id: 6,
      name: 'Hand-Stitched Leather Belt',
      sku: 'BRD-BLT-01',
      category: 'Fashion & Accessories',
      description: 'Solid brass buckle with vegetable-tanned steer hide.',
      cost_price: 14.00,
      selling_price: 45.00,
      stock: 0,
      low_stock_threshold: 5,
      image_url: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=300&q=80',
      status: 'Out of Stock',
      created_at: new Date(Date.now() - 22 * 86400000).toISOString()
    },
    {
      id: 13,
      user_id: 6,
      name: 'Handcrafted Leather Cardholder',
      sku: 'BRD-CRD-02',
      category: 'Fashion & Accessories',
      description: 'Minimalist four-pocket card sleeve in cognac leather.',
      cost_price: 6.00,
      selling_price: 22.00,
      stock: 0,
      low_stock_threshold: 5,
      image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&q=80',
      status: 'Out of Stock',
      created_at: new Date(Date.now() - 22 * 86400000).toISOString()
    }
  ],
  customers: [
    {
      id: 1,
      user_id: 1,
      name: 'Scott Holland',
      phone: '+1 555-019-2834',
      email: 'scott.holland@example.com',
      address: '742 Evergreen Terrace, Springfield, OR',
      total_orders: 4,
      total_spent: 3325.00,
      last_order_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 2,
      user_id: 1,
      name: 'Karen Savage',
      phone: '+1 555-014-9921',
      email: 'karen.savage@example.com',
      address: '124 Conch Street, Bikini Bottom, FL',
      total_orders: 3,
      total_spent: 2548.00,
      last_order_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 3,
      user_id: 1,
      name: 'Michael Johnson',
      phone: '+1 555-017-8822',
      email: 'michael.j@example.com',
      address: '221B Baker Street, London, NW1',
      total_orders: 5,
      total_spent: 4100.00,
      last_order_at: new Date(Date.now() - 3 * 86400000).toISOString()
    },
    {
      id: 4,
      user_id: 1,
      name: 'Lisa Simpson',
      phone: '+1 555-018-7733',
      email: 'lisa.simpson@example.com',
      address: '432 Park Avenue, Apt 18B, New York, NY',
      total_orders: 4,
      total_spent: 2899.00,
      last_order_at: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 5,
      user_id: 1,
      name: 'Rakib Hasan',
      phone: '+880 1711-223344',
      email: 'rakib.hasan@example.com',
      address: 'House 42, Road 11, Banani, Dhaka',
      total_orders: 2,
      total_spent: 750.00,
      last_order_at: new Date(Date.now() - 5 * 86400000).toISOString()
    }
  ],
  orders: [
    {
      id: 1,
      user_id: 1,
      customer_id: 1,
      order_number: 'BP-1024',
      customer_name: 'Scott Holland',
      customer_phone: '+1 555-019-2834',
      customer_email: 'scott.holland@example.com',
      customer_address: '742 Evergreen Terrace, Springfield, OR',
      subtotal: 330.00,
      tax: 15.00,
      shipping: 10.00,
      total: 355.00,
      payment_status: 'Paid',
      order_status: 'Confirmed',
      notes: 'Customer requested gift packaging.',
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      items: [
        { id: 1, product_id: 1, product_name: 'Wireless Noise-Canceling Headphones', unit_price: 99.00, quantity: 2, line_total: 198.00 },
        { id: 2, product_id: 4, product_name: 'Minimalist LED Desk Lamp', unit_price: 65.00, quantity: 2, line_total: 130.00 }
      ]
    },
    {
      id: 2,
      user_id: 1,
      customer_id: 2,
      order_number: 'BP-1023',
      customer_name: 'Karen Savage',
      customer_phone: '+1 555-014-9921',
      customer_email: 'karen.savage@example.com',
      customer_address: '124 Conch Street, Bikini Bottom, FL',
      subtotal: 148.00,
      tax: 7.00,
      shipping: 5.00,
      total: 160.00,
      payment_status: 'Unpaid',
      order_status: 'Processing',
      notes: 'Call before delivery.',
      created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      items: [
        { id: 3, product_id: 2, product_name: 'Artisan Ceramic Pots (Set of 3)', unit_price: 50.00, quantity: 2, line_total: 100.00 },
        { id: 4, product_id: 7, product_name: 'Organic Cotton Crewneck Tee', unit_price: 25.00, quantity: 2, line_total: 50.00 }
      ]
    },
    {
      id: 3,
      user_id: 1,
      customer_id: 3,
      order_number: 'BP-1022',
      customer_name: 'Michael Johnson',
      customer_phone: '+1 555-017-8822',
      customer_email: 'michael.j@example.com',
      customer_address: '221B Baker Street, London, NW1',
      subtotal: 297.00,
      tax: 13.00,
      shipping: 10.00,
      total: 320.00,
      payment_status: 'Paid',
      order_status: 'Shipped',
      notes: 'Express courier requested.',
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      items: [
        { id: 5, product_id: 1, product_name: 'Wireless Noise-Canceling Headphones', unit_price: 99.00, quantity: 3, line_total: 297.00 }
      ]
    },
    {
      id: 4,
      user_id: 1,
      customer_id: 4,
      order_number: 'BP-1021',
      customer_name: 'Lisa Simpson',
      customer_phone: '+1 555-018-7733',
      customer_email: 'lisa.simpson@example.com',
      customer_address: '432 Park Avenue, Apt 18B, New York, NY',
      subtotal: 198.00,
      tax: 9.00,
      shipping: 5.00,
      total: 212.00,
      payment_status: 'Paid',
      order_status: 'Delivered',
      notes: 'Left at front desk.',
      created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
      items: [
        { id: 6, product_id: 1, product_name: 'Wireless Noise-Canceling Headphones', unit_price: 99.00, quantity: 2, line_total: 198.00 }
      ]
    },
    {
      id: 5,
      user_id: 1,
      customer_id: 5,
      order_number: 'BP-1020',
      customer_name: 'Rakib Hasan',
      customer_phone: '+880 1711-223344',
      customer_email: 'rakib.hasan@example.com',
      customer_address: 'House 42, Road 11, Banani, Dhaka',
      subtotal: 125.00,
      tax: 0.00,
      shipping: 5.00,
      total: 130.00,
      payment_status: 'Unpaid',
      order_status: 'Pending',
      notes: 'COD payment upon delivery.',
      created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
      items: [
        { id: 7, product_id: 7, product_name: 'Organic Cotton Crewneck Tee', unit_price: 25.00, quantity: 5, line_total: 125.00 }
      ]
    },
    {
      id: 6,
      user_id: 2,
      customer_id: 101,
      order_number: 'GZ-201',
      customer_name: 'Tanmoy Saha',
      customer_phone: '+880 1715-998877',
      customer_email: 'tanmoy.s@example.com',
      customer_address: 'House 14, Road 4, Dhanmondi, Dhaka',
      subtotal: 16500.00,
      tax: 0.00,
      shipping: 120.00,
      total: 16620.00,
      payment_status: 'Paid',
      order_status: 'Delivered',
      notes: 'Fragile electronics handling.',
      created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
      items: [
        { id: 8, product_id: 9, product_name: 'Smart 1080P Projector Mini', unit_price: 16500.00, quantity: 1, line_total: 16500.00 }
      ]
    },
    {
      id: 7,
      user_id: 2,
      customer_id: 102,
      order_number: 'GZ-202',
      customer_name: 'Mehedi Hassan',
      customer_phone: '+880 1822-334455',
      customer_email: 'mehedi.h@example.com',
      customer_address: 'GEC Circle, Chattogram',
      subtotal: 5200.00,
      tax: 0.00,
      shipping: 150.00,
      total: 5350.00,
      payment_status: 'Paid',
      order_status: 'In Transit',
      notes: 'Steadfast consignment booked.',
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      items: [
        { id: 9, product_id: 10, product_name: 'ANC Wireless Gaming Earbuds', unit_price: 2600.00, quantity: 2, line_total: 5200.00 }
      ]
    },
    {
      id: 8,
      user_id: 4,
      customer_id: 103,
      order_number: 'BLM-101',
      customer_name: 'Emma Watson',
      customer_phone: '+1 555-443-2211',
      customer_email: 'emma.w@example.com',
      customer_address: '500 Ocean Avenue, Santa Monica, CA',
      subtotal: 48.00,
      tax: 4.00,
      shipping: 6.00,
      total: 58.00,
      payment_status: 'Paid',
      order_status: 'Delivered',
      notes: 'Customer repeat buyer.',
      created_at: new Date(Date.now() - 42 * 86400000).toISOString(),
      items: [
        { id: 10, product_id: 11, product_name: 'Lavender Vanilla Soy Candle', unit_price: 24.00, quantity: 2, line_total: 48.00 }
      ]
    }
  ],
  stock_history: [
    {
      id: 1,
      user_id: 1,
      product_id: 1,
      product_name: 'Wireless Noise-Canceling Headphones',
      movement_type: 'Initial Stock',
      quantity_change: 50,
      previous_stock: 0,
      new_stock: 50,
      reason: 'Opening inventory batch',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString()
    },
    {
      id: 2,
      user_id: 1,
      product_id: 1,
      product_name: 'Wireless Noise-Canceling Headphones',
      movement_type: 'Order/Sale Deduction',
      quantity_change: -2,
      previous_stock: 50,
      new_stock: 48,
      reason: 'Order #BP-1015',
      created_at: new Date(Date.now() - 6 * 86400000).toISOString()
    },
    {
      id: 3,
      user_id: 1,
      product_id: 1,
      product_name: 'Wireless Noise-Canceling Headphones',
      movement_type: 'Order/Sale Deduction',
      quantity_change: -3,
      previous_stock: 48,
      new_stock: 45,
      reason: 'Order #BP-1022',
      created_at: new Date(Date.now() - 24 * 3600000).toISOString()
    },
    {
      id: 4,
      user_id: 1,
      product_id: 3,
      product_name: 'Vintage Hardcover History Journal',
      movement_type: 'Order/Sale Deduction',
      quantity_change: -4,
      previous_stock: 8,
      new_stock: 4,
      reason: 'Order #BP-1019',
      created_at: new Date(Date.now() - 48 * 3600000).toISOString()
    },
    {
      id: 5,
      user_id: 1,
      product_id: 6,
      product_name: 'Full-Grain Leather Wallet',
      movement_type: 'Order/Sale Deduction',
      quantity_change: -5,
      previous_stock: 5,
      new_stock: 0,
      reason: 'Order #BP-1017 (Sold Out)',
      created_at: new Date(Date.now() - 72 * 3600000).toISOString()
    },
    {
      id: 6,
      user_id: 1,
      product_id: 2,
      product_name: 'Artisan Ceramic Pots (Set of 3)',
      movement_type: 'Restock',
      quantity_change: 10,
      previous_stock: 4,
      new_stock: 14,
      reason: 'Supplier restocking shipment #SR-884',
      created_at: new Date(Date.now() - 24 * 3600000).toISOString()
    }
  ],
  courier_bookings: [
    {
      id: 1,
      user_id: 1,
      order_id: 3,
      order_number: 'BP-1022',
      provider: 'Steadfast',
      tracking_id: 'STDF-8491823',
      recipient_name: 'Michael Johnson',
      recipient_phone: '+1 555-017-8822',
      recipient_address: '221B Baker Street, London, NW1',
      weight: 1.5,
      collection_amount: 0.00,
      status: 'In Transit',
      booked_at: new Date(Date.now() - 24 * 3600000).toISOString()
    },
    {
      id: 2,
      user_id: 1,
      order_id: 4,
      order_number: 'BP-1021',
      provider: 'Pathao',
      tracking_id: 'PTHO-9912041',
      recipient_name: 'Lisa Simpson',
      recipient_phone: '+1 555-018-7733',
      recipient_address: '432 Park Avenue, Apt 18B, New York, NY',
      weight: 0.8,
      collection_amount: 0.00,
      status: 'Delivered',
      booked_at: new Date(Date.now() - 48 * 3600000).toISOString()
    }
  ],
  notifications: [
    {
      id: 1,
      user_id: 1,
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: 'Vintage Hardcover History Journal has only 4 units remaining (Threshold: 10).',
      link: '/inventory',
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 2,
      user_id: 1,
      type: 'low_stock',
      title: 'Stock Depletion Warning',
      message: 'Full-Grain Leather Wallet is now completely out of stock.',
      link: '/inventory',
      is_read: false,
      created_at: new Date(Date.now() - 3 * 3600000).toISOString()
    },
    {
      id: 3,
      user_id: 1,
      type: 'new_order',
      title: 'New Order Received',
      message: 'Order #BP-1024 from Scott Holland ($355.00) was placed.',
      link: '/orders',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString()
    },
    {
      id: 4,
      user_id: 1,
      type: 'payment_pending',
      title: 'Unpaid Order Reminder',
      message: 'Order #BP-1023 from Karen Savage ($160.00) is awaiting payment.',
      link: '/revenue',
      is_read: false,
      created_at: new Date(Date.now() - 5 * 3600000).toISOString()
    },
    {
      id: 5,
      user_id: 1,
      type: 'courier_update',
      title: 'Courier Parcel Dispatched',
      message: 'Consignment STDF-8491823 is now in transit with Steadfast Courier.',
      link: '/courier',
      is_read: true,
      created_at: new Date(Date.now() - 24 * 3600000).toISOString()
    }
  ],
  email_verifications: [],
  refunds: [],
  testimonials: [
    {
      id: 1,
      user_id: null,
      name: 'Sofia Martinez',
      role: 'Owner',
      business_name: 'Lumina Home Decor (Austin, TX)',
      rating: 5,
      quote: 'Before BizPilot, order fulfillment was a nightly nightmare. We were pasting customer phone numbers from WhatsApp into courier websites one by one. BizPilot cut our daily shipping time by 75%.',
      metric: '75% Faster Order Fulfillment',
      is_featured: true,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      user_id: null,
      name: 'Tanvir Hossain',
      role: 'Founder',
      business_name: 'GadgetZone Express (Dhaka)',
      rating: 5,
      quote: 'The integration with Steadfast and Pathao combined with the Unpaid/Paid order separation saved our business. We recovered over ৳4,50,000 in pending cash-on-delivery payments in the very first month.',
      metric: '৳4,50,000 Recovered Receivables',
      is_featured: true,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      user_id: null,
      name: 'Jessica Reynolds',
      role: 'Founder',
      business_name: 'Earth & Silk Apparel',
      rating: 5,
      quote: 'The stock threshold alerts saved us during our Black Friday surge. We knew exactly which tees were dropping below 10 units and ordered restocks before running out.',
      metric: 'Zero Stockouts',
      is_featured: false,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      user_id: null,
      name: 'David Zhao',
      role: 'Operations Director',
      business_name: 'Aura Lifestyle',
      rating: 5,
      quote: 'Clean, modern, and zero cognitive bloat. It has only the key KPIs we actually need every morning. Our entire operations team learned the interface in less than 20 minutes.',
      metric: '20 Min Onboarding',
      is_featured: false,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      user_id: null,
      name: 'Rachel Kim',
      role: 'E-commerce Specialist',
      business_name: 'Seoul Spark Skincare',
      rating: 5,
      quote: 'Being able to print clean invoices and send instant SMS confirmations to our customers with one click elevated our brand reputation significantly.',
      metric: 'Instant Invoices',
      is_featured: false,
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      user_id: null,
      name: 'Marcus Brody',
      role: 'Sole Proprietor',
      business_name: 'Brody Leather Works',
      rating: 5,
      quote: 'I used to dread accounting. BizPilot’s revenue tab makes it crystal clear what revenue is paid vs what is still pending with the courier riders.',
      metric: '100% Cash Visibility',
      is_featured: false,
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  admins: [
    {
      id: 1,
      name: 'Platform Super Admin',
      email: 'admin@bizpilot.io',
      password_hash: bcrypt.hashSync('Admin@123456', 10),
      role: 'super_admin',
      two_factor_secret: 'JBSWY3DPEHPK3PXP',
      two_factor_enabled: true,
      last_login_at: new Date(Date.now() - 30 * 60000).toISOString(),
      last_login_ip: '127.0.0.1',
      is_active: true,
      created_at: new Date(Date.now() - 90 * 86400000).toISOString()
    },
    {
      id: 2,
      name: 'Sarah Connor',
      email: 'support@bizpilot.io',
      password_hash: bcrypt.hashSync('Support@123456', 10),
      role: 'support',
      two_factor_secret: 'JBSWY3DPEHPK3PXP',
      two_factor_enabled: false,
      last_login_at: new Date(Date.now() - 2 * 3600000).toISOString(),
      last_login_ip: '192.168.1.15',
      is_active: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    },
    {
      id: 3,
      name: 'Finance Audit Lead',
      email: 'billing@bizpilot.io',
      password_hash: bcrypt.hashSync('Billing@123456', 10),
      role: 'billing',
      two_factor_secret: 'JBSWY3DPEHPK3PXP',
      two_factor_enabled: true,
      last_login_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      last_login_ip: '192.168.1.22',
      is_active: true,
      created_at: new Date(Date.now() - 20 * 86400000).toISOString()
    }
  ],
  admin_audit_logs: [
    {
      id: 1,
      admin_id: 1,
      admin_email: 'admin@bizpilot.io',
      action: 'SUSPEND_MERCHANT',
      target_type: 'merchant',
      target_id: '5',
      target_name: 'Dhaka Electronics Hub',
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      details: { reason: 'High chargeback/dispute rate and repeated unfulfilled COD consignments' },
      created_at: new Date(Date.now() - 4 * 86400000).toISOString()
    },
    {
      id: 2,
      admin_id: 1,
      admin_email: 'admin@bizpilot.io',
      action: 'UPDATE_CONFIG',
      target_type: 'system_config',
      target_id: 'announcement_banner',
      target_name: 'Announcement Banner',
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      details: { previous: '', updated: 'BizPilot Platform v2.4 Active' },
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    },
    {
      id: 3,
      admin_id: 2,
      admin_email: 'support@bizpilot.io',
      action: 'IMPERSONATE_MERCHANT',
      target_type: 'merchant',
      target_id: '1',
      target_name: 'Ryvix Commerce',
      ip_address: '192.168.1.15',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      details: { session_duration_minutes: 30, reason: 'Assisting merchant with shipping address formatting' },
      created_at: new Date(Date.now() - 6 * 3600000).toISOString()
    }
  ],
  platform_config: {
    allow_signups: 'true',
    email_service_enabled: 'true',
    sms_service_enabled: 'true',
    courier_service_enabled: 'true',
    maintenance_mode: 'false',
    announcement_banner: 'All platform systems, courier webhooks, and payment reconciliation are operational.'
  }
};

async function ensureAdminTables(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'support', 'billing', 'readonly') DEFAULT 'support',
        two_factor_secret VARCHAR(100) NULL,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        last_login_at TIMESTAMP NULL,
        last_login_ip VARCHAR(50) NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_admin_email (email)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NULL,
        admin_email VARCHAR(150) NOT NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50) NOT NULL,
        target_id VARCHAR(50) NULL,
        target_name VARCHAR(150) NULL,
        ip_address VARCHAR(50) NULL,
        user_agent VARCHAR(255) NULL,
        details JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_created (created_at DESC),
        INDEX idx_audit_action (action)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS platform_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(100) NOT NULL UNIQUE,
        config_value TEXT NOT NULL,
        updated_by_admin VARCHAR(150) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    const [adminRows] = await pool.query('SELECT id FROM admins LIMIT 1');
    if (!adminRows || adminRows.length === 0) {
      const defaultHash = await bcrypt.hash('Admin@123456', 10);
      await pool.query(
        'INSERT INTO admins (name, email, password_hash, role, two_factor_secret, two_factor_enabled) VALUES (?, ?, ?, ?, ?, ?)',
        ['Platform Super Admin', 'admin@bizpilot.io', defaultHash, 'super_admin', 'JBSWY3DPEHPK3PXP', true]
      );
      console.log('🛡️ Default platform super admin seeded into MySQL: admin@bizpilot.io');
    }
  } catch (err) {
    console.warn('⚠️ Note on checking admin tables in MySQL:', err.message);
  }
}

async function initDatabase() {
  try {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'bizpilot_db';

    console.log(`🔌 Connecting to MySQL (${host}:${port}, DB: ${database})...`);
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const [rows] = await pool.query('SELECT 1 as connected');
    if (rows && rows[0]?.connected === 1) {
      console.log('✅ MySQL Database Connection Established Successfully.');
      useFallback = false;
      await ensureAdminTables(pool);
    }
  } catch (err) {
    console.warn('⚠️ MySQL connection could not be established immediately:', err.message);
    console.log('⚡ Activating BizPilot High-Fidelity Data Engine (instant in-memory data store with live state persistence).');
    useFallback = true;
  }
}

// Helper query function supporting both MySQL pool and in-memory engine
async function query(sql, params = []) {
  if (!useFallback && pool) {
    try {
      const [results] = await pool.query(sql, params);
      return results;
    } catch (err) {
      console.error('MySQL Query Error:', err.message);
      throw err;
    }
  }
  return null;
}

module.exports = {
  initDatabase,
  query,
  getPool: () => pool,
  isUsingFallback: () => useFallback,
  memoryStore
};

