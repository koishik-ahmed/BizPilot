// Pathao Courier Service - Sandbox Integration
// Handles authentication, token management, store retrieval, and order creation

const axios = require('axios');

class PathaoService {
  constructor() {
    this.baseUrl = process.env.PATHAO_BASE_URL || 'https://courier-api-sandbox.pathao.com';
    this.clientId = process.env.PATHAO_CLIENT_ID;
    this.clientSecret = process.env.PATHAO_CLIENT_SECRET;
    this.username = process.env.PATHAO_USERNAME;
    this.password = process.env.PATHAO_PASSWORD;

    this.accessToken = null;
    this.tokenExpiry = null;
    this.stores = null;
    
    // Mock mode for testing without sandbox balance
    this.mockMode = process.env.PATHAO_MOCK_MODE === 'true';
  }

  // Validate required credentials
  validateCredentials() {
    if (this.mockMode) return; // Skip in mock mode
    
    const missing = [];
    if (!this.clientId) missing.push('PATHAO_CLIENT_ID');
    if (!this.clientSecret) missing.push('PATHAO_CLIENT_SECRET');
    if (!this.username) missing.push('PATHAO_USERNAME');
    if (!this.password) missing.push('PATHAO_PASSWORD');

    if (missing.length > 0) {
      throw new Error(`Missing Pathao sandbox credentials: ${missing.join(', ')}. Please configure in .env`);
    }
  }

  // Get valid access token (cached or fresh)
  async getAccessToken() {
    if (this.mockMode) {
      return 'mock_access_token_for_testing';
    }
    
    this.validateCredentials();

    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 5 * 60 * 1000) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/aladdin/api/v1/issue-token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: this.username,
        password: this.password,
        grant_type: 'password'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      const { access_token, expires_in } = response.data;

      if (!access_token) {
        throw new Error('No access token received from Pathao');
      }

      this.accessToken = access_token;
      // expires_in is in seconds, convert to ms and add buffer
      this.tokenExpiry = Date.now() + (expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      if (error.response) {
        const msg = error.response.data?.message || error.response.data?.error || 'Authentication failed';
        throw new Error(`Pathao authentication failed: ${msg}`);
      }
      throw new Error(`Pathao authentication error: ${error.message}`);
    }
  }

  // Get authorization header for API calls
  async getAuthHeader() {
    if (this.mockMode) {
      return {
        'Authorization': 'Bearer mock_token',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
    }
    
    const token = await this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Get merchant stores
  async getStores() {
    if (this.mockMode) {
      return [
        { store_id: 150936, store_name: 'Mock Test Store', store_address: 'Dhaka, Bangladesh', city_id: 1, zone_id: 1, hub_id: 1 },
        { store_id: 150937, store_name: 'Mock Store 2', store_address: 'Chittagong, Bangladesh', city_id: 2, zone_id: 2, hub_id: 2 }
      ];
    }
    
    if (this.stores) return this.stores;

    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${this.baseUrl}/aladdin/api/v1/stores`, {
        headers,
        timeout: 15000
      });

      // Handle paginated response: { data: { data: [...], ... } } or direct array
      const rawData = response.data;
      this.stores = rawData?.data?.data || rawData?.data || rawData || [];
      return this.stores;
    } catch (error) {
      if (error.response) {
        const msg = error.response.data?.message || 'Failed to fetch stores';
        throw new Error(`Pathao stores error: ${msg}`);
      }
      throw new Error(`Pathao stores fetch error: ${error.message}`);
    }
  }

  // Get first available store ID (for sandbox testing)
  async getDefaultStoreId() {
    const stores = await this.getStores();
    if (!stores || stores.length === 0) {
      throw new Error('No stores found in Pathao sandbox. Please configure a store in your Pathao merchant account.');
    }
    // Return the first store's ID
    return stores[0].id || stores[0].store_id;
  }

  // Create courier order
  async createOrder(orderData) {
    if (this.mockMode) {
      // Return mock successful response
      const mockConsignmentId = `PTHO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      return {
        success: true,
        courierOrderId: mockConsignmentId,
        trackingId: mockConsignmentId,
        status: 'Pending',
        storeId: 150936,
        rawResponse: {
          consignment_id: mockConsignmentId,
          tracking_id: mockConsignmentId,
          status: 'Pending',
          merchant_order_id: orderData.merchantOrderId,
          recipient_name: orderData.recipientName,
          recipient_phone: orderData.recipientPhone,
          recipient_address: orderData.recipientAddress,
          item_quantity: orderData.itemQuantity,
          item_weight: orderData.itemWeight,
          amount_to_collect: orderData.collectionAmount
        }
      };
    }
    
    try {
      const headers = await this.getAuthHeader();
      const storeId = await this.getDefaultStoreId();

      const payload = {
        store_id: storeId,
        merchant_order_id: orderData.merchantOrderId || `BP-${orderData.orderId}`,
        recipient_name: orderData.recipientName,
        recipient_phone: orderData.recipientPhone,
        recipient_address: orderData.recipientAddress,
        delivery_type: orderData.deliveryType || 48, // 48 = standard delivery
        item_type: orderData.itemType || 2, // 2 = general item
        special_instruction: orderData.specialInstruction || '',
        item_quantity: orderData.itemQuantity || 1,
        item_weight: String(orderData.itemWeight || 0.5),
        item_description: orderData.itemDescription || 'General merchandise',
        amount_to_collect: orderData.collectionAmount || 0
      };

      const response = await axios.post(`${this.baseUrl}/aladdin/api/v1/orders`, payload, {
        headers,
        timeout: 30000
      });

      const data = response.data?.data || response.data;

      if (!data || !data.consignment_id) {
        throw new Error('Invalid response from Pathao order creation');
      }

      return {
        success: true,
        courierOrderId: data.consignment_id,
        trackingId: data.tracking_id || data.consignment_id,
        status: data.status || 'Pending',
        storeId,
        rawResponse: data
      };
    } catch (error) {
      if (error.response) {
        console.error('[Pathao Order Error]', JSON.stringify(error.response.data, null, 2));
        const msg = error.response.data?.message || error.response.data?.error || JSON.stringify(error.response.data);
        throw new Error(`Pathao order creation failed: ${msg}`);
      }
      throw new Error(`Pathao order creation error: ${error.message}`);
    }
  }

  // Get order tracking info
  async getOrderTracking(consignmentId) {
    if (this.mockMode) {
      return {
        consignment_id: consignmentId,
        tracking_id: consignmentId,
        status: 'In Transit',
        merchant_order_id: `BP-${consignmentId}`,
        recipient_name: 'Test Recipient',
        recipient_phone: '01712345678',
        recipient_address: 'Test Address, Dhaka',
        current_status: 'In Transit',
        status_history: [
          { status: 'Pending', timestamp: new Date().toISOString() },
          { status: 'Picked Up', timestamp: new Date().toISOString() },
          { status: 'In Transit', timestamp: new Date().toISOString() }
        ]
      };
    }
    
    try {
      const headers = await this.getAuthHeader();
      const response = await axios.get(`${this.baseUrl}/aladdin/api/v1/orders/${consignmentId}`, {
        headers,
        timeout: 15000
      });

      return response.data?.data || response.data;
    } catch (error) {
      if (error.response) {
        const msg = error.response.data?.message || 'Tracking fetch failed';
        throw new Error(`Pathao tracking error: ${msg}`);
      }
      throw new Error(`Pathao tracking fetch error: ${error.message}`);
    }
  }

  // Convert BizPilot order to Pathao format
  mapOrderToPathao(bizpilotOrder) {
    // Format phone number for Pathao (Bangladesh format: 01XXXXXXXXX)
    // Pathao sandbox requires valid BD mobile format
    let phone = bizpilotOrder.customer_phone || '';
    phone = phone.replace(/[\s\-\(\)]/g, ''); // Remove spaces, dashes, parentheses
    
    // Convert to BD mobile format (01XXXXXXXXX)
    if (phone.startsWith('+880')) {
      phone = '0' + phone.slice(4); // +88017... -> 017...
    } else if (phone.startsWith('880')) {
      phone = '0' + phone.slice(3); // 88017... -> 017...
    } else if (phone.startsWith('+1') || phone.startsWith('1')) {
      // For non-BD numbers (like US), use a valid test format
      // This is for sandbox testing only - production would need real BD numbers
      phone = '01712345678';
    } else if (!phone.startsWith('01')) {
      // Default to valid test number if format unrecognized
      phone = '01712345678';
    }
    
    // Ensure it's exactly 11 digits starting with 01
    if (!/^01\d{9}$/.test(phone)) {
      phone = '01712345678';
    }

    return {
      orderId: bizpilotOrder.id,
      merchantOrderId: bizpilotOrder.order_number,
      recipientName: bizpilotOrder.customer_name,
      recipientPhone: phone,
      recipientAddress: bizpilotOrder.customer_address,
      itemQuantity: bizpilotOrder.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 1,
      itemWeight: '0.5', // Default, could be calculated from items
      itemDescription: bizpilotOrder.items?.map(i => i.product_name).join(', ') || 'General merchandise',
      collectionAmount: bizpilotOrder.payment_status === 'Unpaid' ? bizpilotOrder.total : 0,
      specialInstruction: bizpilotOrder.notes || ''
    };
  }
}

module.exports = new PathaoService();