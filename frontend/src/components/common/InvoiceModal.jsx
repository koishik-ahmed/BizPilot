import React, { useState, useEffect } from 'react';
import { X, Printer, Mail, MessageSquare, Check, Loader2, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency } from '../../utils/currency';

export default function InvoiceModal({ orderId, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const { authFetch } = useAuth();
  const { showToast } = useNotifications();

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await authFetch(`/api/orders/${orderId}/invoice`);
        const data = await res.json();
        if (data.success) {
          setInvoice(data.invoice);
        }
      } catch (err) {
        console.error('Failed to load invoice:', err);
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchInvoice();
  }, [orderId, authFetch]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!invoice?.customer?.email) {
      showToast('No customer email on file for this order.', 'error');
      return;
    }
    setSendingEmail(true);
    try {
      const res = await authFetch(`/api/orders/${orderId}/invoice/email`, {
        method: 'POST',
        body: JSON.stringify({
          email: invoice.customer.email,
          orderNumber: invoice.orderNumber,
          customerName: invoice.customer.name,
          total: invoice.total,
          items: invoice.items,
          subtotal: invoice.subtotal,
          discount: invoice.discount,
          shipping: invoice.shipping,
          tax: invoice.tax
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmailSent(true);
        showToast(`Invoice email delivered to ${invoice.customer.email}`);
      }
    } catch (err) {
      showToast('Failed to send email invoice', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendSms = async () => {
    if (!invoice?.customer?.phone) {
      showToast('No customer phone number available.', 'error');
      return;
    }
    setSendingSms(true);
    try {
      const res = await authFetch(`/api/orders/${orderId}/invoice/sms`, {
        method: 'POST',
        body: JSON.stringify({
          phone: invoice.customer.phone,
          orderNumber: invoice.orderNumber,
          total: invoice.total
        })
      });
      const data = await res.json();
      if (data.success) {
        setSmsSent(true);
        showToast(`Invoice SMS dispatched to ${invoice.customer.phone}`);
      }
    } catch (err) {
      showToast('Failed to dispatch SMS', 'error');
    } finally {
      setSendingSms(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Generating Official Invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 !m-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-surface-border max-w-2xl w-full overflow-hidden my-8 flex flex-col">
        {/* Actions Bar */}
        <div className="bg-surface-canvas px-6 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <FileText className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-sm">Invoice {invoice.invoiceNumber}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || emailSent}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                emailSent
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {sendingEmail ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : emailSent ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Mail className="w-3.5 h-3.5 text-brand-600" />
              )}
              <span>{emailSent ? 'Email Sent' : 'Send Email'}</span>
            </button>
            <button
              onClick={handleSendSms}
              disabled={sendingSms || smsSent}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                smsSent
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
              }`}
            >
              {sendingSms ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : smsSent ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
              )}
              <span>{smsSent ? 'SMS Sent' : 'Send SMS'}</span>
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-6">
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-slate-900">BizPilot</span>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mt-0.5">
                {invoice.merchant.businessName}
              </p>
              <p className="text-xs text-slate-400 mt-1">{invoice.merchant.phone} • {invoice.merchant.email}</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-slate-900 tracking-tight">{invoice.invoiceNumber}</span>
              <p className="text-xs text-slate-500 mt-1">Date: {invoice.date}</p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  invoice.paymentStatus === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {invoice.paymentStatus}
              </span>
            </div>
          </div>

          {/* Billed To */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-surface-canvas p-4 rounded-2xl">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Billed To</p>
              <p className="font-bold text-slate-800 text-sm">{invoice.customer.name}</p>
              <p className="text-slate-600 mt-0.5">{invoice.customer.phone}</p>
              <p className="text-slate-600">{invoice.customer.email}</p>
            </div>
            <div className="bg-surface-canvas p-4 rounded-2xl">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Shipping Destination</p>
              <p className="text-slate-700 leading-relaxed">{invoice.customer.address}</p>
              <p className="text-[11px] text-brand-700 font-semibold mt-1">Order Status: {invoice.orderStatus}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-canvas text-slate-500 font-bold border-b border-slate-200/80 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Item Description</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.product_name}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-3 text-center text-slate-700 font-bold">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-4 py-3 text-center text-slate-400">Custom Merchandise Order</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-between items-start pt-2">
            <div className="max-w-xs text-xs text-slate-400">
              <p className="font-bold text-slate-600 mb-1">Notes</p>
              <p>{invoice.notes || 'Thank you for your business!'}</p>
            </div>
            <div className="w-52 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {parseFloat(invoice.discount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Delivery / Shipping</span>
                <span className="font-semibold text-slate-800">{parseFloat(invoice.shipping || 0) > 0 ? formatCurrency(invoice.shipping) : 'Free'}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                <span>Total Due</span>
                <span className="text-brand-600 font-black">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

