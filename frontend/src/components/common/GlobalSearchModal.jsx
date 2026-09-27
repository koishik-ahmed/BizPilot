import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Package, ShoppingCart, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function GlobalSearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], orders: [], customers: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ products: [], orders: [], customers: [] });
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await authFetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.results);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, authFetch]);

  const handleNavigate = (link) => {
    onClose();
    navigate(link);
  };

  const hasResults =
    results.products.length > 0 || results.orders.length > 0 || results.customers.length > 0;

  return (
    <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-surface-border overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-100 flex items-center px-6 py-4">
          <Search className="w-5 h-5 text-brand-600 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products, order numbers, customers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin mr-2 shrink-0" />
          ) : query ? (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-100 rounded-lg mr-2">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          ) : null}
          <button
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scroll">
          {!query && (
            <div className="py-12 text-center text-slate-400 text-sm">
              <p>Type to instantly search across all your catalog, sales, and customers.</p>
              <div className="flex justify-center gap-4 mt-4 text-xs text-slate-500">
                <span className="px-3 py-1 bg-surface-canvas rounded-full">e.g. Headphones</span>
                <span className="px-3 py-1 bg-surface-canvas rounded-full">e.g. BP-1024</span>
                <span className="px-3 py-1 bg-surface-canvas rounded-full">e.g. Scott</span>
              </div>
            </div>
          )}

          {query && !loading && !hasResults && (
            <div className="py-12 text-center text-slate-500 text-sm">
              No matching records found for <span className="font-semibold text-slate-800">"{query}"</span>.
            </div>
          )}

          {/* Products Group */}
          {results.products.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                <Package className="w-3.5 h-3.5 text-brand-600" />
                <span>Products</span>
              </div>
              <div className="space-y-1">
                {results.products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleNavigate(p.link)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-brand-50 transition text-left group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.subtitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orders Group */}
          {results.orders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                <ShoppingCart className="w-3.5 h-3.5 text-brand-600" />
                <span>Orders</span>
              </div>
              <div className="space-y-1">
                {results.orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => handleNavigate(o.link)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-brand-50 transition text-left group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700">{o.title}</p>
                      <p className="text-xs text-slate-500">{o.subtitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customers Group */}
          {results.customers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                <User className="w-3.5 h-3.5 text-brand-600" />
                <span>Customers</span>
              </div>
              <div className="space-y-1">
                {results.customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleNavigate(c.link)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-brand-50 transition text-left group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700">{c.title}</p>
                      <p className="text-xs text-slate-500">{c.subtitle}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-surface-canvas border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Search query navigates directly to corresponding details</span>
          <span>BizPilot Instant Search</span>
        </div>
      </div>
    </div>
  );
}

