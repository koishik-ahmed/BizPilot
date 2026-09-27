import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  Truck,
  Building,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  Wallet,
  Receipt,
  MapPin,
  Volume2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function SettingsPage() {
  const { authFetch } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState('business');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    name: '',
    business_name: '',
    phone: '',
    default_currency: 'BDT',
    default_courier: 'Steadfast',
    store_tagline: 'Authentic Retail & Express Delivery',
    warehouse_address: 'House 42, Road 11, Banani, Dhaka-1213, Bangladesh',
    shipping_inside_dhaka: 60,
    shipping_outside_dhaka: 120,
    tax_rate: 0,
    auto_invoice_pdf: true,
    invoice_footer_note: 'Thank you for shopping with us! Please inspect your package upon receipt.',
    cod_auto_confirm: true,
    bkash_number: '01711000000',
    nagad_number: '01811000000',
    sound_alerts: true,
    low_stock_default: 5,
    email_notifications: true,
    sms_notifications: true,
    in_app_notifications: true,
    current_password: '',
    new_password: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await authFetch('/api/settings');
        const data = await res.json();
        if (data.success) {
          const s = data.settings || {};
          setSettings(prev => ({
            ...prev,
            name: data.user?.name || '',
            business_name: data.user?.business_name || '',
            phone: data.user?.phone || '',
            default_currency: s.default_currency || data.user?.currency || 'BDT',
            default_courier: s.default_courier || 'Steadfast',
            store_tagline: s.store_tagline || 'Authentic Retail & Express Delivery',
            warehouse_address: s.warehouse_address || 'House 42, Road 11, Banani, Dhaka-1213, Bangladesh',
            shipping_inside_dhaka: s.shipping_inside_dhaka !== undefined ? s.shipping_inside_dhaka : 60,
            shipping_outside_dhaka: s.shipping_outside_dhaka !== undefined ? s.shipping_outside_dhaka : 120,
            tax_rate: s.tax_rate !== undefined ? s.tax_rate : 0,
            auto_invoice_pdf: s.auto_invoice_pdf !== false,
            invoice_footer_note: s.invoice_footer_note || 'Thank you for shopping with us! Please inspect your package upon receipt.',
            cod_auto_confirm: s.cod_auto_confirm !== false,
            bkash_number: s.bkash_number || '01711000000',
            nagad_number: s.nagad_number || '01811000000',
            sound_alerts: s.sound_alerts !== false,
            low_stock_default: s.low_stock_default || 5,
            email_notifications: s.email_notifications !== false,
            sms_notifications: s.sms_notifications !== false,
            in_app_notifications: s.in_app_notifications !== false
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update settings.');
      }
      showToast('Settings saved successfully!');
      setSettings(prev => ({ ...prev, current_password: '', new_password: '' }));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'business', label: 'Store & Invoicing', icon: Building },
    { id: 'courier', label: 'Courier & Shipping', icon: Truck },
    { id: 'payments', label: 'MFS & Payments', icon: Wallet },
    { id: 'notifications', label: 'Alerts & Channels', icon: Bell },
    { id: 'security', label: 'Password & Security', icon: Lock }
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-3xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 h-64 bg-slate-200 rounded-3xl"></div>
          <div className="md:col-span-8 h-96 bg-slate-200 rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Store & System Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tailor your business operations: customize delivery charges, bKash/Nagad accounts, courier automations, and invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Bangladeshi Merchant Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Tabs */}
        <div className="md:col-span-4 space-y-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl text-xs font-bold transition text-left cursor-pointer ${
                  active
                    ? 'bg-brand-700 text-white shadow-md shadow-brand-700/20'
                    : 'bg-white text-slate-600 border border-surface-border hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Quick Help Card */}
          <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200/60 space-y-2 mt-4">
            <p className="text-xs font-bold text-brand-900">Need Custom Courier Keys?</p>
            <p className="text-[11px] text-brand-700 leading-relaxed">
              BizPilot has built-in API connectivity with Steadfast, Pathao, and RedX. Set default rates to calculate shipping during order creation.
            </p>
          </div>
        </div>

        {/* Tab Form Content */}
        <div className="md:col-span-8 bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border">
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            
            {/* Tab 1: Store & Invoicing Settings */}
            {activeTab === 'business' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">Store Profile & Invoicing Defaults</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Primary merchant identity printed on official invoices and customer receipts.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Registered Business Name</label>
                    <input
                      type="text"
                      required
                      value={settings.business_name}
                      onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Store Slogan / Tagline</label>
                    <input
                      type="text"
                      value={settings.store_tagline}
                      onChange={(e) => setSettings({ ...settings, store_tagline: e.target.value })}
                      placeholder="e.g. Authentic Retail & Express Delivery"
                      className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Default Currency Unit</label>
                    <select
                      value={settings.default_currency}
                      onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
                      className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold text-slate-800"
                    >
                      <option value="BDT">BDT (৳) Bangladeshi Taka</option>
                      <option value="USD">USD ($) United States Dollar</option>
                      <option value="EUR">EUR (€) Euro</option>
                      <option value="GBP">GBP (£) British Pound</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Official Support Phone</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      placeholder="e.g. 01700000000"
                      className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Warehouse / Pickup Address</label>
                  <input
                    type="text"
                    value={settings.warehouse_address}
                    onChange={(e) => setSettings({ ...settings, warehouse_address: e.target.value })}
                    placeholder="Physical dispatch hub for courier pickup"
                    className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Footer &amp; Return Terms</label>
                  <textarea
                    rows={2}
                    value={settings.invoice_footer_note}
                    onChange={(e) => setSettings({ ...settings, invoice_footer_note: e.target.value })}
                    placeholder="Printed at the bottom of customer order receipts"
                    className="w-full px-4 py-2 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tax / VAT Rate (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={settings.tax_rate}
                      onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Courier & Shipping Settings */}
            {activeTab === 'courier' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">Courier Logistics &amp; Shipping Rates</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Automate delivery fees applied during manual order entry and storefront checkout.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Courier Partner</label>
                  <select
                    value={settings.default_courier}
                    onChange={(e) => setSettings({ ...settings, default_courier: e.target.value })}
                    className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold text-slate-800"
                  >
                    <option value="Steadfast">Steadfast Courier (Fastest in BD - Recommended)</option>
                    <option value="Pathao">Pathao Courier</option>
                    <option value="RedX">RedX Logistics</option>
                    <option value="Paperfly">Paperfly</option>
                    <option value="DHL Express">DHL Express Worldwide</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Inside Dhaka Shipping (৳)</label>
                    <input
                      type="number"
                      min={0}
                      value={settings.shipping_inside_dhaka}
                      onChange={(e) => setSettings({ ...settings, shipping_inside_dhaka: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Outside Dhaka Shipping (৳)</label>
                    <input
                      type="number"
                      min={0}
                      value={settings.shipping_outside_dhaka}
                      onChange={(e) => setSettings({ ...settings, shipping_outside_dhaka: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between p-3.5 bg-surface-canvas rounded-2xl border border-slate-200/80 cursor-pointer">
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Auto-Generate PDF Invoice on Order Placement</p>
                    <p className="text-[11px] text-slate-400">Instantly generate printable tax invoice when confirming a new customer order</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.auto_invoice_pdf}
                    onChange={(e) => setSettings({ ...settings, auto_invoice_pdf: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded cursor-pointer accent-brand-600"
                  />
                </label>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl space-y-2">
                  <p className="font-bold text-emerald-900 text-xs">Courier API Gateway Status</p>
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Steadfast API Webhook: Active &amp; Ready for Automated Booking</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pathao Merchant Gateway: Operational (Multi-hub enabled)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: MFS & Payments Settings */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">Mobile Financial Services &amp; Payments</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Configure payment collection channels for Bangladeshi customers.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">bKash Merchant / Personal No.</label>
                    <input
                      type="text"
                      value={settings.bkash_number}
                      onChange={(e) => setSettings({ ...settings, bkash_number: e.target.value })}
                      placeholder="017XXXXXXXX"
                      className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nagad Wallet / Personal No.</label>
                    <input
                      type="text"
                      value={settings.nagad_number}
                      onChange={(e) => setSettings({ ...settings, nagad_number: e.target.value })}
                      placeholder="018XXXXXXXX"
                      className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between p-3.5 bg-surface-canvas rounded-2xl border border-slate-200/80 cursor-pointer">
                  <div>
                    <p className="font-bold text-slate-800 text-xs">Auto-Confirm Cash on Delivery (COD) Orders</p>
                    <p className="text-[11px] text-slate-400">Instantly register COD orders as confirmed without requiring upfront manual call</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.cod_auto_confirm}
                    onChange={(e) => setSettings({ ...settings, cod_auto_confirm: e.target.checked })}
                    className="w-4 h-4 text-brand-600 rounded cursor-pointer accent-brand-600"
                  />
                </label>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                  <p className="font-bold text-slate-700">Supported Customer Payment Methods</p>
                  <p className="text-slate-500 text-[11px]">
                    Cash on Delivery (COD) • bKash • Nagad • Rocket • Upay • Bank Transfer • Visa / Mastercard
                  </p>
                </div>
              </div>
            )}

            {/* Tab 4: Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">Notification Alerts &amp; Channels</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Control communications sent to both customers and internal team members.</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3.5 bg-surface-canvas rounded-2xl border border-slate-200/80 cursor-pointer">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Email Invoices &amp; Dispatch Receipts</p>
                      <p className="text-[11px] text-slate-400">Send automatic tax invoices and order receipts to customer email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.email_notifications}
                      onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                      className="w-4 h-4 text-brand-600 rounded cursor-pointer accent-brand-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-surface-canvas rounded-2xl border border-slate-200/80 cursor-pointer">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">SMS Delivery Gateway (sms.net.bd / Alpha Net)</p>
                      <p className="text-[11px] text-slate-400">Dispatch instant SMS tracking links and order confirmations to BD mobile numbers</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.sms_notifications}
                      onChange={(e) => setSettings({ ...settings, sms_notifications: e.target.checked })}
                      className="w-4 h-4 text-brand-600 rounded cursor-pointer accent-brand-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-surface-canvas rounded-2xl border border-slate-200/80 cursor-pointer">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">In-App Low Stock Warning Badges</p>
                      <p className="text-[11px] text-slate-400">Trigger topbar alert badge when product inventory drops below threshold</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.in_app_notifications}
                      onChange={(e) => setSettings({ ...settings, in_app_notifications: e.target.checked })}
                      className="w-4 h-4 text-brand-600 rounded cursor-pointer accent-brand-600"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-surface-canvas rounded-2xl border border-slate-200/80 cursor-pointer">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">New Order Chime &amp; Sound Alerts</p>
                      <p className="text-[11px] text-slate-400">Play an audible chime when new customer orders are placed</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.sound_alerts}
                      onChange={(e) => setSettings({ ...settings, sound_alerts: e.target.checked })}
                      className="w-4 h-4 text-brand-600 rounded cursor-pointer accent-brand-600"
                    />
                  </label>

                  <div className="pt-2">
                    <label className="block font-bold text-slate-700 mb-1">Default Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={settings.low_stock_default}
                      onChange={(e) => setSettings({ ...settings, low_stock_default: parseInt(e.target.value) || 5 })}
                      className="w-48 px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-sm text-slate-900">Password &amp; Credentials</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Ensure your administrator account is safeguarded with strong credentials.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={settings.current_password}
                    onChange={(e) => setSettings({ ...settings, current_password: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={settings.new_password}
                    onChange={(e) => setSettings({ ...settings, new_password: e.target.value })}
                    placeholder="Enter new password (min. 6 chars)"
                    className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="p-4 bg-surface-canvas rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-brand-700 font-bold text-xs">
                    <Shield className="w-4 h-4 text-brand-600" />
                    <span>Two-Factor Authentication &amp; Multi-Tenant Protection</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    All session tokens are signed with cryptographic HMAC-SHA256. Database tenants are isolated per merchant ID.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-7 py-3 rounded-full bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md shadow-brand-700/25 disabled:opacity-50 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save All Settings</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
