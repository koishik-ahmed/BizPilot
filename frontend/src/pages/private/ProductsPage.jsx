import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Package,
  Boxes,
  Plus,
  Search,
  RotateCcw,
  Sliders,
  History,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  X,
  Loader2,
  Upload,
  Clock,
  DollarSign,
  Minus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currency';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('filter') === 'low');

  // Modals & Drawers
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);
  const [viewDetailsData, setViewDetailsData] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Restock Modal
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedRestockProduct, setSelectedRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState('20');
  const [restockNote, setRestockNote] = useState('');
  const [restocking, setRestocking] = useState(false);

  // Adjust Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedAdjustProduct, setSelectedAdjustProduct] = useState(null);
  const [adjustType, setAdjustType] = useState('increase'); // 'increase' | 'decrease'
  const [adjustAmount, setAdjustAmount] = useState('5');
  const [adjustReason, setAdjustReason] = useState('Warehouse recount / reconciliation');
  const [adjusting, setAdjusting] = useState(false);

  // Product Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    description: '',
    cost_price: '',
    selling_price: '',
    stock: '',
    low_stock_threshold: '10',
    image_url: ''
  });

  const categories = ['All', 'Electronics', 'Home & Living', 'Books & Stationery', 'Fashion & Accessories'];
  const statuses = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];

  // Fetch catalog & inventory data
  const fetchProducts = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (category !== 'All') query.append('category', category);
      if (statusFilter !== 'All') query.append('status', statusFilter);
      if (lowStockOnly) query.append('lowStockOnly', 'true');

      const res = await authFetch(`/api/products?${query.toString()}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category, statusFilter, lowStockOnly]);

  // Check URL params
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setEditProduct(null);
      resetForm();
      setAddModalOpen(true);
    }
    const viewId = searchParams.get('view');
    if (viewId) {
      handleOpenView(viewId);
    }
    if (searchParams.get('filter') === 'low') {
      setLowStockOnly(true);
    }
    const restockId = searchParams.get('restock');
    if (restockId && products.length > 0) {
      const target = products.find(p => String(p.id) === String(restockId));
      if (target) openRestock(target);
    }
  }, [searchParams, products.length]);

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: 'Electronics',
      description: '',
      cost_price: '',
      selling_price: '',
      stock: '',
      low_stock_threshold: '10',
      image_url: ''
    });
  };

  const handleOpenView = async (id) => {
    try {
      const res = await authFetch(`/api/products/${id}`);
      const data = await res.json();
      if (data.success) {
        setViewProduct(data.product);
        setViewDetailsData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add / Edit Product Submit
  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
      const method = editProduct ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Operation failed');
      }

      showToast(data.message || 'Product saved successfully!');
      refreshNotifications();
      setAddModalOpen(false);
      setEditProduct(null);
      resetForm();
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Product
  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await authFetch(`/api/products/${deleteConfirmId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Product removed successfully.');
        setDeleteConfirmId(null);
        fetchProducts();
      }
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  const startEdit = (p) => {
    setEditProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      description: p.description || '',
      cost_price: p.cost_price,
      selling_price: p.selling_price,
      stock: p.stock,
      low_stock_threshold: p.low_stock_threshold,
      image_url: p.image_url || ''
    });
    setAddModalOpen(true);
  };

  // Restock Submit
  const handleRestock = async (e) => {
    e.preventDefault();
    if (!selectedRestockProduct) return;

    setRestocking(true);
    try {
      const res = await authFetch('/api/inventory/restock', {
        method: 'POST',
        body: JSON.stringify({
          product_id: selectedRestockProduct.id,
          quantity: parseInt(restockQty),
          note: restockNote || 'Supplier restock batch'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Restock failed');
      }

      showToast(data.message);
      refreshNotifications();
      setRestockModalOpen(false);
      setSelectedRestockProduct(null);
      setRestockNote('');
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRestocking(false);
    }
  };

  // Stock Adjust Submit
  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!selectedAdjustProduct) return;

    setAdjusting(true);
    try {
      const res = await authFetch('/api/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          product_id: selectedAdjustProduct.id,
          type: adjustType,
          amount: parseInt(adjustAmount),
          reason: adjustReason
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Stock adjustment failed');
      }

      showToast(data.message);
      refreshNotifications();
      setAdjustModalOpen(false);
      setSelectedAdjustProduct(null);
      fetchProducts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAdjusting(false);
    }
  };

  const openRestock = (item) => {
    setSelectedRestockProduct(item);
    setRestockQty('20');
    setRestockNote(`Supplier restock batch for ${item.name}`);
    setRestockModalOpen(true);
  };

  const openAdjust = (item) => {
    setSelectedAdjustProduct(item);
    setAdjustType('increase');
    setAdjustAmount('5');
    setAdjustReason('Physical inventory recount');
    setAdjustModalOpen(true);
  };

  // Summary Metrics calculations
  const totalProductsCount = products.length;
  const inStockCount = products.filter(p => p.stock > p.low_stock_threshold).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.low_stock_threshold).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;
  const totalValuation = products.reduce((acc, p) => acc + (parseFloat(p.selling_price || 0) * (p.stock || 0)), 0);

  return (
    <>
      <div className="space-y-6">
        {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Boxes className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Products & Inventory</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Unified merchant catalog, live inventory balances, pricing margins, restock batches, and stock adjustments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/stock-history"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-surface-canvas border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Audit History</span>
          </Link>

          {products.length > 0 && (
            <button
              onClick={() => openRestock(products[0])}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-surface-canvas border border-slate-200 text-xs font-bold text-brand-700 hover:bg-brand-50 transition shadow-sm"
            >
              <RotateCcw className="w-4 h-4 text-brand-600" />
              <span>Restock Batch</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditProduct(null);
              resetForm();
              setAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 min-w-[160px] rounded-full bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-md shadow-brand-600/20 transition hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-card border border-surface-border">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Products</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{totalProductsCount}</span>
            <span className="p-2.5 rounded-2xl bg-slate-100 text-slate-600">
              <Package className="w-5 h-5" />
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Active catalog items</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-card border border-surface-border">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">In Stock</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{inStockCount}</span>
            <span className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Healthy inventory</span>
        </div>

        <button
          onClick={() => {
            setLowStockOnly(!lowStockOnly);
            setStatusFilter('All');
          }}
          className={`p-4 sm:p-5 rounded-3xl shadow-card border text-left transition ${
            lowStockOnly
              ? 'bg-coral-500 text-white border-coral-600 ring-2 ring-coral-400'
              : 'bg-white border-surface-border hover:border-coral-300'
          }`}
        >
          <p className={`text-[11px] font-bold uppercase tracking-wider ${lowStockOnly ? 'text-white/80' : 'text-coral-600'}`}>
            Low Stock Alerts
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-2xl sm:text-3xl font-black ${lowStockOnly ? 'text-white' : 'text-coral-600'}`}>{lowStockCount}</span>
            <span className={`p-2.5 rounded-2xl ${lowStockOnly ? 'bg-white/20 text-white' : 'bg-coral-50 text-coral-600'}`}>
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <span className={`text-[11px] font-medium ${lowStockOnly ? 'text-white/90' : 'text-coral-600'}`}>
            {lowStockOnly ? 'Active Filter • Click to clear' : 'Click to filter low stock'}
          </span>
        </button>

        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-card border border-surface-border">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Out of Stock</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{outOfStockCount}</span>
            <span className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
              <XCircle className="w-5 h-5" />
            </span>
          </div>
          <span className="text-[11px] text-rose-500 font-medium">Needs immediate replenishment</span>
        </div>
      </div>

      {/* 3. Search & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-card border border-surface-border flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-canvas rounded-full border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-[11px] text-slate-400">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-surface-canvas border border-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-[11px] text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                if (e.target.value !== 'All') setLowStockOnly(false);
              }}
              className="bg-surface-canvas border border-slate-200 text-xs font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-500"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle Filter */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-coral-600 bg-coral-50 px-3.5 py-1.5 rounded-full border border-coral-200/60 hover:bg-coral-100/50 transition">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded border-coral-300 text-coral-500 focus:ring-coral-400"
            />
            <span>Low Stock Only</span>
          </label>

          {(search || category !== 'All' || statusFilter !== 'All' || lowStockOnly) && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('All');
                setStatusFilter('All');
                setLowStockOnly(false);
              }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Unified Data Table */}
      <div className="bg-white rounded-3xl shadow-card border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-canvas text-slate-400 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Product Info</th>
                <th className="px-4 py-4">SKU</th>
                <th className="px-4 py-4 text-right">Cost Price</th>
                <th className="px-4 py-4 text-right">Selling Price</th>
                <th className="px-4 py-4 text-center">Current Stock</th>
                <th className="px-4 py-4 text-center">Status</th>
                <th className="px-4 py-4">Last Updated</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
                    <span>Loading products & inventory...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-16 text-center">
                    <Boxes className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <h3 className="font-bold text-slate-800 text-sm">No Products or Inventory Found</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      No items match your active filters or search terms.
                    </p>
                    <button
                      onClick={() => {
                        setEditProduct(null);
                        resetForm();
                        setAddModalOpen(true);
                      }}
                      className="mt-4 px-5 py-2 rounded-full bg-brand-600 text-white font-bold text-xs shadow-sm hover:bg-brand-700"
                    >
                      Add New Product
                    </button>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isOut = p.stock <= 0;
                  const isLow = p.stock <= p.low_stock_threshold && !isOut;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      {/* Product Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-4 h-4 text-slate-400" />
                              <span className="text-[7px] font-bold text-slate-400 mt-0.5">No Image</span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                                {p.category}
                              </span>
                              {p.description && (
                                <p className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">{p.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                          {p.sku}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="px-4 py-4 text-right text-slate-500 font-medium">
                        {formatCurrency(p.cost_price)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-4 text-right font-bold text-slate-900">
                        {formatCurrency(p.selling_price)}
                      </td>

                      {/* Current Stock */}
                      <td className="px-4 py-4 text-center">
                        <span className={`text-base font-black ${
                          isOut ? 'text-rose-600' : isLow ? 'text-coral-500' : 'text-slate-900'
                        }`}>
                          {p.stock}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 text-center">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3" />
                            <span>Out of Stock</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-coral-100 text-coral-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>In Stock</span>
                          </span>
                        )}
                      </td>

                      {/* Last Updated */}
                      <td className="px-4 py-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {p.updated_at
                          ? new Date(p.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                          : p.created_at
                          ? new Date(p.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Recent'}
                      </td>

                      {/* Unified Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Restock */}
                          <button
                            onClick={() => openRestock(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-50 text-brand-700 font-bold hover:bg-brand-100 transition text-[11px]"
                            title="Restock units"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restock</span>
                          </button>

                          {/* Quick Adjust */}
                          <button
                            onClick={() => openAdjust(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-canvas border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition text-[11px]"
                            title="Adjust quantity"
                          >
                            <Sliders className="w-3.5 h-3.5 text-slate-500" />
                            <span>Adjust</span>
                          </button>

                          {/* View Specs */}
                          <button
                            onClick={() => handleOpenView(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
                            title="View full specification"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Catalog Details */}
                          <button
                            onClick={() => startEdit(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
                            title="Edit product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteConfirmId(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* 5. Add / Edit Product Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-surface-border max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900">
                {editProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Wireless Noise-Canceling Headphones"
                  className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="TECH-HDP-01"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold text-slate-800"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Home & Living">Home & Living</option>
                    <option value="Books & Stationery">Books & Stationery</option>
                    <option value="Fashion & Accessories">Fashion & Accessories</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short marketing and specification description..."
                  className="w-full px-3.5 py-2 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cost Price ({CURRENCY_SYMBOL})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="45.00"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price ({CURRENCY_SYMBOL}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    placeholder="99.00"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editProduct ? 'Current Stock' : 'Initial Stock Quantity'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!!editProduct}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="25"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-bold disabled:opacity-60"
                  />
                  {editProduct && <p className="text-[10px] text-slate-400 mt-1">Use Restock / Adjust buttons to modify stock.</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                    placeholder="10"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Triggers alert when stock hits or falls below this.</p>
                </div>
              </div>

              {/* Product Image */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">
                  Product Image <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <div className="flex items-center gap-3 p-3 bg-surface-canvas rounded-2xl border border-slate-200/80">
                  {formData.image_url ? (
                    <div className="relative shrink-0">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                        className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 shadow transition"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <Package className="w-5 h-5 text-slate-400" />
                      <span className="text-[8px] font-bold text-slate-400 mt-0.5">No Image</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer shadow-sm transition">
                      <Upload className="w-3.5 h-3.5 text-brand-600" />
                      <span>Choose Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormData({ ...formData, image_url: reader.result });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <input
                      type="url"
                      value={formData.image_url?.startsWith('data:') ? '' : formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="Or paste image URL (optional)"
                      className="w-full px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>Date added and inventory audit log are recorded automatically.</span>
              </div>

              <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-600/20 disabled:opacity-50 transition"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Restock Batch Modal */}
      {restockModalOpen && selectedRestockProduct && (
        <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-surface-border max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-base text-slate-900">Restock Product</h3>
              </div>
              <button onClick={() => setRestockModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestock} className="space-y-4 text-xs">
              <div className="p-3 bg-surface-canvas rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-900 text-sm">{selectedRestockProduct.name}</p>
                <p className="text-slate-500 mt-0.5">
                  SKU: {selectedRestockProduct.sku} • Current Stock: <strong>{selectedRestockProduct.stock}</strong> units
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Restock Quantity to Add *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-black text-slate-900 text-base"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  New stock balance will become: <strong>{selectedRestockProduct.stock + (parseInt(restockQty) || 0)}</strong> units
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Supplier Note / Reference</label>
                <input
                  type="text"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder="e.g. Shipment batch #SR-902 received"
                  className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restocking}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-600/20 disabled:opacity-50 transition"
                >
                  {restocking && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Confirm Restock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Stock Adjustment Modal */}
      {adjustModalOpen && selectedAdjustProduct && (
        <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-surface-border max-w-md w-full p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-600" />
                <h3 className="font-bold text-base text-slate-900">Adjust Stock Quantity</h3>
              </div>
              <button onClick={() => setAdjustModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjust} className="space-y-4 text-xs">
              <div className="p-3 bg-surface-canvas rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-900 text-sm">{selectedAdjustProduct.name}</p>
                <p className="text-slate-500 mt-0.5">
                  SKU: {selectedAdjustProduct.sku} • Current Stock: <strong>{selectedAdjustProduct.stock}</strong> units
                </p>
              </div>

              {/* Increase / Decrease Toggle */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Adjustment Direction</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustType('increase')}
                    className={`py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition border ${
                      adjustType === 'increase'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-surface-canvas text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Increase (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('decrease')}
                    className={`py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition border ${
                      adjustType === 'decrease'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-surface-canvas text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    <span>Decrease (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-black text-slate-900 text-base"
                />
                {adjustType === 'decrease' && selectedAdjustProduct.stock - (parseInt(adjustAmount) || 0) < 0 && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1">
                    ⚠️ Error: Cannot decrease below 0. Maximum reduction is {selectedAdjustProduct.stock}.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Audit Log *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Damaged during packing, recount adjustment..."
                  className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting || (adjustType === 'decrease' && selectedAdjustProduct.stock - (parseInt(adjustAmount) || 0) < 0)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-600/20 disabled:opacity-50 transition"
                >
                  {adjusting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Product Details Specification Drawer */}
      {viewProduct && (
        <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="bg-white w-full max-w-lg h-full p-6 sm:p-8 space-y-6 overflow-y-auto custom-scroll shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-brand-700">
                  <Package className="w-5 h-5" />
                  <h3 className="font-bold text-base">Product Specification</h3>
                </div>
                <button onClick={() => setViewProduct(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-4 items-start">
                {viewProduct.image_url ? (
                  <img
                    src={viewProduct.image_url}
                    alt={viewProduct.name}
                    className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                    <Package className="w-8 h-8 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 mt-1">No Image</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full uppercase">
                    {viewProduct.category}
                  </span>
                  <h4 className="font-extrabold text-base text-slate-900 mt-1">{viewProduct.name}</h4>
                  <p className="text-xs text-slate-400 font-semibold">SKU: {viewProduct.sku}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Date Added: <span className="text-slate-600 font-semibold">{viewProduct.created_at ? new Date(viewProduct.created_at).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : 'Automatic'}</span>
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-surface-canvas rounded-2xl border border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Current Stock</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{viewProduct.stock} units</p>
                </div>
                <div className="p-3 bg-surface-canvas rounded-2xl border border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Alert Threshold</p>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{viewProduct.low_stock_threshold} units</p>
                </div>
                <div className="p-3 bg-surface-canvas rounded-2xl border border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Cost vs Selling</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    {formatCurrency(viewProduct.cost_price)} / {formatCurrency(viewProduct.selling_price)}
                  </p>
                </div>
                <div className="p-3 bg-surface-canvas rounded-2xl border border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-[10px]">Revenue Contribution</p>
                  <p className="text-base font-black text-brand-600 mt-0.5">
                    {formatCurrency(viewDetailsData?.stats?.revenueContribution || 0)}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs">
                <p className="font-bold text-slate-700 mb-1">Description</p>
                <p className="text-slate-500 leading-relaxed bg-surface-canvas p-3 rounded-xl">
                  {viewProduct.description || 'No detailed description set for this item.'}
                </p>
              </div>

              {/* Audit Trail Link */}
              <div className="p-4 bg-brand-50/70 border border-brand-100 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-brand-900">Stock Audit Trail</p>
                  <p className="text-[11px] text-brand-700">View complete movement logs & history</p>
                </div>
                <button
                  onClick={() => {
                    setViewProduct(null);
                    navigate(`/stock-history?product_id=${viewProduct.id}`);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-sm"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View Logs</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setViewProduct(null)}
              className="w-full py-3 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* 9. Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteConfirmId}
        title="Delete Product"
        message="Are you sure you want to delete this product? All catalog associations and historical stock references will be permanently removed."
        confirmText="Yes, Delete Product"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </>
  );
}
