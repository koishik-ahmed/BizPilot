// BizPilot Invoice Service

function generateInvoiceData(order, merchant) {
  const invoiceNumber = `INV-${order.order_number || order.id}`;
  const invoiceDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date().toLocaleDateString();

  return {
    invoiceNumber,
    orderId: order.id,
    orderNumber: order.order_number,
    date: invoiceDate,
    dueDate: invoiceDate,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    merchant: {
      businessName: merchant?.business_name || 'Ryvix Commerce',
      name: merchant?.name || 'Store Owner',
      email: merchant?.email || 'sales@bizpilot.com',
      phone: merchant?.phone || '+1 (555) 234-5678',
      currency: merchant?.currency || 'BDT'
    },
    customer: {
      name: order.customer_name,
      email: order.customer_email || 'N/A',
      phone: order.customer_phone,
      address: order.customer_address
    },
    items: order.items || [],
    subtotal: parseFloat(order.subtotal || 0).toFixed(2),
    tax: parseFloat(order.tax || 0).toFixed(2),
    shipping: parseFloat(order.shipping || 0).toFixed(2),
    total: parseFloat(order.total || 0).toFixed(2),
    notes: order.notes || 'Thank you for your business! Please retain this invoice for your records.'
  };
}

module.exports = {
  generateInvoiceData
};

