// BizPilot Courier Service Abstraction
// Supports multiple providers: Steadfast (simulated), Pathao (real API), RedX, DHL Express

const pathaoService = require('./courier/pathao.service');

class CourierService {
  constructor() {
    this.providers = {
      Steadfast: { prefix: 'STDF', name: 'Steadfast Courier', baseRate: 60 },
      Pathao: { prefix: 'PTHO', name: 'Pathao Courier', baseRate: 70 },
      RedX: { prefix: 'REDX', name: 'RedX Delivery', baseRate: 65 },
      'DHL Express': { prefix: 'DHL', name: 'DHL Express Worldwide', baseRate: 150 }
    };
  }

  generateTrackingId(providerName) {
    const config = this.providers[providerName] || this.providers.Steadfast;
    const randomNum = Math.floor(1000000 + Math.random() * 9000000);
    return `${config.prefix}-${randomNum}`;
  }

  // Main entry point for booking a shipment
  async bookShipment(bookingData) {
    const { provider, orderId, orderNumber, ...rest } = bookingData;

    switch (provider) {
      case 'Pathao':
        return await this.bookPathaoOrder(bookingData);
      case 'Steadfast':
      case 'RedX':
      case 'DHL Express':
      default:
        return await this.bookSimulatedOrder(bookingData);
    }
  }

  // Book via Pathao real API
  async bookPathaoOrder({ orderId, orderNumber, recipientName, recipientPhone, recipientAddress, weight, collectionAmount }) {
    const mappedOrder = {
      orderId,
      merchantOrderId: orderNumber,
      recipientName,
      recipientPhone,
      recipientAddress,
      itemQuantity: 1,
      itemWeight: String(weight || 0.5),
      itemDescription: 'General merchandise',
      collectionAmount: parseFloat(collectionAmount) || 0,
      specialInstruction: ''
    };

    const result = await pathaoService.createOrder(mappedOrder);

    return {
      orderId,
      orderNumber,
      provider: 'Pathao Courier',
      providerKey: 'Pathao',
      trackingId: result.trackingId,
      courierOrderId: result.courierOrderId,
      recipientName,
      recipientPhone,
      recipientAddress,
      weight: parseFloat(weight) || 1.0,
      collectionAmount: parseFloat(collectionAmount) || 0.0,
      status: result.status || 'Booked',
      bookedAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 48 * 3600000).toISOString(),
      rawResponse: result.rawResponse,
      timeline: [
        {
          status: 'Booked',
          title: 'Shipment Consignment Created',
          description: `Consignment booked via Pathao Courier. Consignment ID: ${result.courierOrderId}`,
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  // Simulated booking for other providers (existing behavior)
  async bookSimulatedOrder({ provider, orderId, orderNumber, recipientName, recipientPhone, recipientAddress, weight, collectionAmount }) {
    const trackingId = this.generateTrackingId(provider);
    const selectedProvider = this.providers[provider] || this.providers.Steadfast;

    const bookingRecord = {
      orderId,
      orderNumber,
      provider: selectedProvider.name,
      providerKey: provider,
      trackingId,
      recipientName,
      recipientPhone,
      recipientAddress,
      weight: parseFloat(weight) || 1.0,
      collectionAmount: parseFloat(collectionAmount) || 0.0,
      status: 'Booked',
      bookedAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 48 * 3600000).toISOString(),
      timeline: [
        {
          status: 'Booked',
          title: 'Shipment Consignment Created',
          description: `Consignment booked via ${selectedProvider.name}. Ready for courier pickup.`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    return bookingRecord;
  }

  // Get tracking timeline (simulated for all providers for now)
  getSimulatedTimeline(status, bookedAt) {
    const baseTime = new Date(bookedAt || Date.now()).getTime();
    const timeline = [
      {
        status: 'Booked',
        title: 'Shipment Booked',
        description: 'Order details submitted to courier network.',
        timestamp: new Date(baseTime).toISOString(),
        completed: true
      },
      {
        status: 'Picked Up',
        title: 'Picked Up by Rider',
        description: 'Courier agent collected package from merchant warehouse.',
        timestamp: new Date(baseTime + 4 * 3600000).toISOString(),
        completed: ['Picked Up', 'In Transit', 'Delivered'].includes(status)
      },
      {
        status: 'In Transit',
        title: 'In Transit / Hub Sorting',
        description: 'Package routed through central logistics sorting hub.',
        timestamp: new Date(baseTime + 18 * 3600000).toISOString(),
        completed: ['In Transit', 'Delivered'].includes(status)
      },
      {
        status: 'Delivered',
        title: 'Delivered to Customer',
        description: 'Package handed over and signed by recipient.',
        timestamp: new Date(baseTime + 36 * 3600000).toISOString(),
        completed: status === 'Delivered'
      }
    ];

    return timeline;
  }

  // Get Pathao stores (for testing/configuration)
  async getPathaoStores() {
    return await pathaoService.getStores();
  }

  // Test Pathao authentication
  async testPathaoAuth() {
    return await pathaoService.getAccessToken();
  }
}

module.exports = new CourierService();