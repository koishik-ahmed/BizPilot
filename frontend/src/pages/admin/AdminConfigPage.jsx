import React, { useState, useEffect } from 'react';
import { Sliders, Save, CheckCircle, AlertTriangle, Shield, Bell, Send, Check } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminConfigPage() {
  const { adminFetch, admin } = useAdminAuth();
  const [config, setConfig] = useState({
    allow_signups: 'true',
    email_service_enabled: 'true',
    sms_service_enabled: 'true',
    courier_service_enabled: 'true',
    maintenance_mode: 'false',
    announcement_banner: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await adminFetch('/api/admin/config');
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleToggle = (key) => {
    setConfig((prev) => ({
      ...prev,
      [key]: prev[key] === 'true' ? 'false' : 'true'
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await adminFetch('/api/admin/config', {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: 'Platform configuration updated and audited.' });
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to update configuration.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isSuperAdmin = admin?.role === 'super_admin';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Feature Flags & Platform Controls</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Real-time platform toggles, integration kill switches, and merchant broadcast announcements
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 shadow-xs ${
            feedback.type === 'success'
              ? 'bg-brand-50 border-brand-200 text-brand-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0 text-brand-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Gateways & Kill Switches */}
        <div className="bg-white border border-surface-border rounded-3xl p-6 shadow-card space-y-4">
          <h2 className="text-sm font-extrabold text-slate-900 border-b border-surface-border pb-3 uppercase tracking-wider text-[11px] text-slate-500">
            Core Service Kill Switches
          </h2>

          <div className="divide-y divide-surface-border">
            {/* Allow Signups */}
            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Merchant Registration Portal</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  When paused, public visitors cannot create new store accounts.
                </p>
              </div>
              <button
                type="button"
                disabled={!isSuperAdmin}
                onClick={() => handleToggle('allow_signups')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.allow_signups === 'true' ? 'bg-brand-600' : 'bg-slate-300'
                } ${!isSuperAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    config.allow_signups === 'true' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Email Service */}
            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Email Dispatcher (SMTP)</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Global switch for OTP verification emails and invoice dispatch.
                </p>
              </div>
              <button
                type="button"
                disabled={!isSuperAdmin}
                onClick={() => handleToggle('email_service_enabled')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.email_service_enabled === 'true' ? 'bg-brand-600' : 'bg-slate-300'
                } ${!isSuperAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    config.email_service_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* SMS Notifications */}
            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">SMS Gateway Integration</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enables or pauses outbound SMS order confirmation messages to end customers.
                </p>
              </div>
              <button
                type="button"
                disabled={!isSuperAdmin}
                onClick={() => handleToggle('sms_service_enabled')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.sms_service_enabled === 'true' ? 'bg-brand-600' : 'bg-slate-300'
                } ${!isSuperAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    config.sms_service_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Courier Booking API */}
            <div className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">Courier Gateway (Steadfast & Pathao)</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Global kill-switch for automated consignment creation.
                </p>
              </div>
              <button
                type="button"
                disabled={!isSuperAdmin}
                onClick={() => handleToggle('courier_service_enabled')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.courier_service_enabled === 'true' ? 'bg-brand-600' : 'bg-slate-300'
                } ${!isSuperAdmin ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    config.courier_service_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Platform Broadcast Announcement */}
        <div className="bg-white border border-surface-border rounded-3xl p-6 shadow-card space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <Bell className="w-4 h-4 text-brand-600" />
            <span>Platform Broadcast Banner</span>
          </div>
          <p className="text-xs text-slate-500">
            Display an alert or operational update across all merchant storefronts and dashboard headers.
          </p>

          <textarea
            rows="3"
            disabled={!isSuperAdmin}
            value={config.announcement_banner}
            onChange={(e) => setConfig({ ...config, announcement_banner: e.target.value })}
            placeholder="e.g. Scheduled database maintenance tonight between 2:00 AM and 2:30 AM UTC..."
            className="w-full bg-surface-canvas border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 disabled:opacity-50"
          />
        </div>

        {/* Save Bar */}
        {isSuperAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-brand-600/25"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Configuration Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
