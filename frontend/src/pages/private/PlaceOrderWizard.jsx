import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Package,
  CheckCircle2,
  Search,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Truck,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
  Percent,
  Mail,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

export default function PlaceOrderWizard() {
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();

  // Wizard Step: 1 | 2 | 3
  const [currentStep, setCurrentStep] = useState(1);

  // STEP 1 - Customer Data
  const [isExistingCustomer, setIsExistingCustomer] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customersList, setCustomersList] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState({
    id: null,
    name: '',
    phone: '',
    email: '',
    address: '',
    saveCustomer: true
  });

  // STEP 2 - Product Selection
  const [catalog, setCatalog] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // [ { product, quantity } ]

  // STEP 3 - Payment & Review & Custom Charges
  const [deliveryCharge, setDeliveryCharge] = useState(''); // Not automatic, optional
  const [discountPercent, setDiscountPercent] = useState(''); // Discount in %
  const [paymentStatus, setPaymentStatus] = useState('Paid'); // 'Paid' | 'Unpaid'
  const [orderNotes, setOrderNotes] = useState('');
  const [sendInvoiceEmail, setSendInvoiceEmail] = useState(true); // Toggle: auto-email invoice on confirmation
  const [submitting, setSubmitting] = useState(false);

  // Confirmation state
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Load existing customers & product catalog
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          authFetch('/api/customers'),
          authFetch('/api/products')
        ]);
        const cData = await cRes.json();
        const pData = await pRes.json();

        if (cData.success) setCustomersList(cData.customers || []);
        if (pData.success) setCatalog(pData.products || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // Filtered customers for Step 1
  const filteredCustomers = customersList.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch) ||
    (c.email && c.email.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  // Filtered products for Step 2
  const filteredCatalog = catalog.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Customer selection handler
  const handleSelectCustomer = (c) => {
    setSelectedCustomer({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      address: c.address || '',
      saveCustomer: true
    });
    setCustomerSearch(`${c.name} (${c.phone})`);
  };

  // Product selection handlers
  const handleAddItem = (product) => {
    if (product.stock <= 0) {
      showToast(`"${product.name}" is out of stock!`, 'error');
      return;
    }

    setSelectedItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Cannot add more than available stock (${product.stock}).`, 'error');
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId, delta) => {
    setSelectedItems(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            showToast(`Max available stock is ${item.product.stock}`, 'error');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const handleRemoveItem = (productId) => {
    setSelectedItems(prev => prev.filter(item => item.product.id !== productId));
  };

  // Pricing calculations (Optional Delivery Charge & Discount %)
  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.product.selling_price * item.quantity,
    0
  );
  const numericDeliveryCharge = parseFloat(deliveryCharge) || 0;
  const numericDiscountPercent = Math.min(100, Math.max(0, parseFloat(discountPercent) || 0));
  const discountAmount = (subtotal * numericDiscountPercent) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount + numericDeliveryCharge);

  // Navigation validations
  const canProceedToStep2 =
    selectedCustomer.name.trim() &&
    selectedCustomer.phone.trim() &&
    selectedCustomer.address.trim();

  const canProceedToStep3 = selectedItems.length > 0;

  // Submit Order
  const handleSubmitOrder = async () => {
    setSubmitting(true);
    try {
      const payload = {
        customer: selectedCustomer,
        items: selectedItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        })),
        payment_status: paymentStatus,
        shipping: numericDeliveryCharge,
        discount: discountAmount,
        notes: orderNotes,
        send_invoice_email: sendInvoiceEmail && Boolean(selectedCustomer.email && selectedCustomer.email.trim())
      };

      const res = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit order');
      }

      setConfirmedOrder(data.order);
      if (data.order?.invoice_email_sent) {
        showToast(`Order confirmed & invoice delivered to ${selectedCustomer.email}!`);
      } else {
        showToast('Order successfully confirmed and stock deducted!');
      }
      refreshNotifications();

      // Trigger celebratory confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Step Stepper Header */}
      <div className="bg-white p-6 rounded-3xl shadow-card border border-surface-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">3-Step Place Order Flow</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {currentStep === 1 && 'Step 1: Customer Information'}
              {currentStep === 2 && 'Step 2: Product Selection & Stock Check'}
              {currentStep === 3 && 'Step 3: Review & Final Submission'}
            </h1>
          </div>
          <Link
            to="/orders"
            className="text-xs font-bold text-slate-400 hover:text-slate-600"
          >
            Cancel & Exit
          </Link>
        </div>

        {/* 3 Step Pill Indicators */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { step: 1, title: 'Customer Info' },
            { step: 2, title: 'Product Selection' },
            { step: 3, title: 'Review & Payment' }
          ].map((s) => (
            <div
              key={s.step}
              className={`p-3 rounded-2xl border transition-all flex items-center gap-2.5 ${
                currentStep === s.step
                  ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/20'
                  : currentStep > s.step
                  ? 'bg-brand-50 text-brand-800 border-brand-200'
                  : 'bg-surface-canvas text-slate-400 border-slate-200'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                currentStep === s.step ? 'bg-white text-brand-700' : 'bg-slate-200 text-slate-700'
              }`}>
                {currentStep > s.step ? '✓' : s.step}
              </span>
              <span className="text-xs font-bold truncate">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: CUSTOMER INFORMATION */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900">Select or Enter Customer</h2>
              <p className="text-xs text-slate-500">Search existing customer for autofill, or enter a new customer.</p>
            </div>

            {/* Toggle Existing vs New */}
            <div className="flex items-center gap-1 bg-surface-canvas p-1 rounded-full border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setIsExistingCustomer(true)}
                className={`px-4 py-1.5 rounded-full transition ${
                  isExistingCustomer ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Existing Customer
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExistingCustomer(false);
                  setSelectedCustomer({ id: null, name: '', phone: '', email: '', address: '', saveCustomer: true });
                }}
                className={`px-4 py-1.5 rounded-full transition ${
                  !isExistingCustomer ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                New Customer
              </button>
            </div>
          </div>

          {/* Existing Customer Search Auto-fill (Sec 17.3 Step 1) */}
          {isExistingCustomer ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search existing customer by name, phone (+1...), or email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-canvas rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
                />
              </div>

              {customerSearch && filteredCustomers.length > 0 && (
                <div className="bg-surface-canvas rounded-2xl border border-slate-200 p-2 max-h-48 overflow-y-auto space-y-1">
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full p-2.5 rounded-xl hover:bg-white text-left transition flex justify-between items-center group"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-900 group-hover:text-brand-700">{c.name}</p>
                        <p className="text-[11px] text-slate-500">{c.phone} • {c.email || 'No email'}</p>
                      </div>
                      <span className="text-[11px] font-bold text-brand-600 opacity-0 group-hover:opacity-100 transition">
                        Select & Autofill →
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Form autofilled preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={selectedCustomer.name}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                    placeholder="e.g. Scott Holland"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={selectedCustomer.phone}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, phone: e.target.value })}
                    placeholder="+1 555-019-2834"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={selectedCustomer.email}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })}
                    placeholder="scott@example.com"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Address *</label>
                  <input
                    type="text"
                    required
                    value={selectedCustomer.address}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, address: e.target.value })}
                    placeholder="742 Evergreen Terrace, Springfield, OR"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* New Customer Flow */
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={selectedCustomer.name}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                    placeholder="e.g. Rachel Jenkins"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={selectedCustomer.phone}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, phone: e.target.value })}
                    placeholder="+1 (555) 892-1244"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={selectedCustomer.email}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })}
                    placeholder="rachel@store.com"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Delivery Address *</label>
                  <input
                    type="text"
                    required
                    value={selectedCustomer.address}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, address: e.target.value })}
                    placeholder="Suite 500, High Street, New York, NY"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Option: Save Customer automatically (Sec 17.3 Step 1) */}
              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCustomer.saveCustomer}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, saveCustomer: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="font-semibold text-slate-700">
                  Save customer automatically to Customers Directory for future repeat orders
                </span>
              </label>
            </div>
          )}

          {/* Step 1 Footer Action */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={!canProceedToStep2}
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 disabled:opacity-40 transition"
            >
              <span>Proceed to Step 2: Product Selection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: PRODUCT SELECTION & STOCK CHECK */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Catalog Picker (lg:col-span-7) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-bold text-base text-slate-900">Select Products from Catalog</h2>
              <p className="text-xs text-slate-500">Live stock verification active. Out-of-stock items cannot be added.</p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search catalog by name, SKU, or category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-canvas rounded-full border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2.5 custom-scroll pr-1">
              {filteredCatalog.map(product => {
                const isOut = product.stock <= 0;
                const existingInCart = selectedItems.find(i => i.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      isOut
                        ? 'bg-slate-50/70 border-slate-200/50 opacity-60'
                        : 'bg-white hover:border-brand-300 border-slate-200/80 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="text-[7px] font-bold mt-0.5">No Image</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{product.name}</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">SKU: {product.sku}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-black text-xs text-brand-700">{formatCurrency(product.selling_price)}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            isOut ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isOut ? '0 in stock' : `${product.stock} available`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isOut || (existingInCart && existingInCart.quantity >= product.stock)}
                      onClick={() => handleAddItem(product)}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-30 disabled:hover:bg-brand-600 shrink-0"
                    >
                      {existingInCart ? `Added (${existingInCart.quantity})` : '+ Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Order Items Summary (lg:col-span-5) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border flex flex-col justify-between space-y-4">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-base text-slate-900">Selected Items ({selectedItems.length})</h3>
                <p className="text-xs text-slate-500">Review quantities and subtotal</p>
              </div>

              {selectedItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-300" />
                  <p>No products added yet. Click "+ Add" on any item from the catalog.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto custom-scroll pr-1">
                  {selectedItems.map(item => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-surface-canvas rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {formatCurrency(item.product.selling_price)} × {item.quantity} ={' '}
                          <strong className="text-slate-800">{formatCurrency(item.product.selling_price * item.quantity)}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center border border-slate-200 rounded-xl bg-white">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.product.id, -1)}
                            className="p-1 hover:bg-slate-100 rounded-l-xl text-slate-600"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-bold text-slate-800 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.product.id, 1)}
                            className="p-1 hover:bg-slate-100 rounded-r-xl text-slate-600"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations & Stepper Actions */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>

                {/* Delivery Charge Input (Optional) */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-medium">Delivery Charge (Optional):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={deliveryCharge}
                      onChange={(e) => setDeliveryCharge(e.target.value)}
                      className="w-24 px-2 py-1 bg-surface-canvas rounded-lg border border-slate-200 text-right text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-500"
                    />
                    <span className="text-slate-400 font-bold">{CURRENCY_SYMBOL}</span>
                  </div>
                </div>

                {/* Discount % Input (Optional) */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600 font-medium">Discount (Optional):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="0"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-24 px-2 py-1 bg-surface-canvas rounded-lg border border-slate-200 text-right text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-500"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>

                {numericDiscountPercent > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount ({numericDiscountPercent}%):</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-100 pt-2">
                  <span>Total Due</span>
                  <span className="text-brand-600">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={!canProceedToStep3}
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 disabled:opacity-40 transition flex items-center justify-center gap-1.5"
                >
                  <span>Proceed to Step 3: Review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: REVIEW & SUBMIT */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-bold text-base text-slate-900">Review & Submit Order</h2>
            <p className="text-xs text-slate-500">Verify all information before final stock deduction and confirmation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Customer Summary Box */}
            <div className="p-4 rounded-2xl bg-surface-canvas border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Customer Information</p>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-brand-600 font-bold hover:underline"
                >
                  Edit
                </button>
              </div>
              <p className="font-bold text-slate-900 text-sm">{selectedCustomer.name}</p>
              <p className="text-slate-600">Phone: <strong>{selectedCustomer.phone}</strong></p>
              <p className="text-slate-600">Email: {selectedCustomer.email || 'N/A'}</p>
              <p className="text-slate-600">Address: {selectedCustomer.address}</p>
            </div>

            {/* Payment Selection Box (Sec 17.3 Step 3: Paid vs Unpaid) */}
            <div className="p-4 rounded-2xl bg-surface-canvas border border-slate-200/80 space-y-3">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Payment Status</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('Paid')}
                  className={`py-3 rounded-xl font-bold transition border flex flex-col items-center ${
                    paymentStatus === 'Paid'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>Paid Order</span>
                  <span className="text-[10px] font-normal opacity-90">Immediate revenue</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStatus('Unpaid')}
                  className={`py-3 rounded-xl font-bold transition border flex flex-col items-center ${
                    paymentStatus === 'Unpaid'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>Unpaid (COD)</span>
                  <span className="text-[10px] font-normal opacity-90">Collect upon courier</span>
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Order Notes (Optional)</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Call before delivery, fragile packaging..."
                  className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Selected Products Table */}
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas text-slate-400 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Product Description</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedItems.map(item => (
                  <tr key={item.product.id}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.product.name}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.product.selling_price)}</td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.product.selling_price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Adjustments: Optional Delivery Charge & Discount (%) */}
          <div className="p-4 rounded-2xl bg-surface-canvas border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span className="font-semibold">Items Subtotal:</span>
              <span className="font-bold text-slate-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-semibold">Delivery Charge (Optional):</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  className="w-28 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-right text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-500"
                />
                <span className="text-slate-400 font-bold">{CURRENCY_SYMBOL}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-semibold">Apply Discount (Optional):</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="0"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-28 px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-right text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-500"
                />
                <span className="text-slate-400 font-bold">%</span>
              </div>
            </div>
            {numericDiscountPercent > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold pt-1 border-t border-slate-200/60">
                <span>Discount Deduction ({numericDiscountPercent}%):</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
          </div>

          {/* Email Invoice Option Toggle (Step 3) */}
          <div className={`p-5 rounded-3xl border transition-all ${
            sendInvoiceEmail
              ? 'bg-brand-50/60 border-brand-200 shadow-sm'
              : 'bg-surface-canvas border-slate-200/80'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition ${
                  sendInvoiceEmail
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">Email Invoice to Customer</h4>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      sendInvoiceEmail ? 'bg-brand-100 text-brand-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {sendInvoiceEmail ? 'Auto-Send: YES' : 'No'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedCustomer.email ? (
                      <>
                        Immediately dispatch official invoice with line items to <strong className="text-slate-800">{selectedCustomer.email}</strong> upon order confirmation.
                      </>
                    ) : (
                      <span className="text-amber-600 font-semibold">
                        No customer email on file. Enter an email below to enable automatic invoice dispatch.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Toggle Switch (Yes / No) */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setSendInvoiceEmail(true)}
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs transition ${
                      sendInvoiceEmail
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendInvoiceEmail(false)}
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs transition ${
                      !sendInvoiceEmail
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Email Input if customer email wasn't provided in Step 1 */}
            {sendInvoiceEmail && !selectedCustomer.email && (
              <div className="mt-3 pt-3 border-t border-brand-200/60 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                <label className="font-bold text-slate-700 shrink-0">Customer Email:</label>
                <input
                  type="email"
                  placeholder="e.g. customer@example.com"
                  value={selectedCustomer.email}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })}
                  className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-brand-300 focus:outline-none focus:border-brand-600 font-semibold text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Final Total Display (Sec 17.3 Step 3: Clearly display Total Price) */}
          <div className="p-6 bg-brand-50/70 border border-brand-100 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-brand-800 uppercase tracking-wider">Final Order Grand Total</p>
              <p className="text-3xl font-black text-brand-700 mt-0.5">{formatCurrency(grandTotal)}</p>
              <span className="text-[11px] text-brand-600 font-semibold">
                Status: {paymentStatus} • {selectedItems.length} items • Delivery: {numericDeliveryCharge > 0 ? formatCurrency(numericDeliveryCharge) : 'Free / Not Charged'}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-3 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs"
              >
                ← Edit Products
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitOrder}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-xl shadow-brand-600/30 disabled:opacity-50 transition"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Confirm & Submit Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* ========================================================================= */}
      {/* 17.4 ORDER CONFIRMATION POPUP */}
      {/* ========================================================================= */}
      {confirmedOrder && (
        <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-surface-border max-w-lg w-full p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Order Successfully Placed</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">Order #{confirmedOrder.order_number}</h3>
              <p className="text-xs text-slate-500 mt-1">Customer: {confirmedOrder.customer_name}</p>
            </div>

            <div className="p-4 bg-surface-canvas rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400 font-bold">Total Amount</p>
                <p className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(confirmedOrder.total)}</p>
              </div>
              <div>
                <p className="text-slate-400 font-bold">Payment Status</p>
                <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  confirmedOrder.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {confirmedOrder.payment_status}
                </span>
              </div>
            </div>

            {/* Invoice Delivery Status Badge */}
            {confirmedOrder.invoice_email_sent ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center gap-2 text-xs text-emerald-800 font-bold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Invoice automatically emailed to {confirmedOrder.customer_email || selectedCustomer.email}</span>
              </div>
            ) : (
              <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs text-slate-600 px-4">
                <span>Invoice auto-email: <strong className="text-slate-700">Not Sent</strong></span>
                <span className="text-[11px] text-slate-400">Click &quot;View Invoice&quot; to send manually</span>
              </div>
            )}

            {/* Next Steps Shortcuts (Sec 17.4 & 17.7) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => navigate(`/orders?view=${confirmedOrder.id}&invoice=true`)}
                className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-surface-canvas border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
              >
                <FileText className="w-4 h-4 text-brand-600" />
                <span>View Invoice</span>
              </button>

              <button
                onClick={() => navigate(`/courier?order_id=${confirmedOrder.id}`)}
                className="flex items-center justify-center gap-1.5 p-3 rounded-2xl bg-surface-canvas border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
              >
                <Truck className="w-4 h-4 text-brand-600" />
                <span>Book Courier</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setConfirmedOrder(null);
                  setCurrentStep(1);
                  setSelectedItems([]);
                }}
                className="text-brand-700 font-bold hover:underline"
              >
                + Place Another Order
              </button>
              <button
                onClick={() => navigate('/orders')}
                className="px-5 py-2 rounded-full bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-sm"
              >
                Go to Orders List
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

