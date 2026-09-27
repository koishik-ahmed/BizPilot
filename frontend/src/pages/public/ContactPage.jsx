import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, ChevronDown, HelpCircle, Loader2 } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import PublicPageHero from '../../components/layout/PublicPageHero';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    reason: 'General Inquiry',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [faqOpen, setFaqOpen] = useState(null);

  const faqs = [
    {
      q: 'How does BizPilot connect to courier services like Steadfast or Pathao?',
      a: 'BizPilot connects directly via official merchant API endpoints. When you confirm an order, its delivery details are sent with one click, returning an official tracking ID and shipping label.'
    },
    {
      q: 'Can multiple staff members use BizPilot simultaneously?',
      a: 'Yes! BizPilot supports concurrent operations. Inventory balances and order statuses update instantly so your packing crew and accounting team stay perfectly aligned.'
    },
    {
      q: 'What happens when a customer places another order in the future?',
      a: 'BizPilot automatically stores customer profiles through the Place Order flow. Simply search their phone number or name, and their address and contact details auto-populate instantly.'
    },
    {
      q: 'Can I export my sales and inventory reports for tax and bookkeeping?',
      a: 'Yes. All six business reports in BizPilot include instant CSV export suitable for Excel, Google Sheets, or import into QuickBooks and Xero.'
    }
  ];

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Please enter your name.';
    if (!formData.email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!formData.subject.trim()) errs.subject = 'Subject is required.';
    if (!formData.message.trim()) {
      errs.message = 'Please type a message.';
    } else if (formData.message.trim().length < 10) {
      errs.message = 'Message must be at least 10 characters long.';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      setSubmitting(true);
      setTimeout(() => {
        setSubmitting(false);
        setSubmitted(true);
      }, 700);
    }
  };

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col">
      <PublicNavbar />

      {/* 8.1 Hero Section (Brand Green 3D Sphere Background) */}
      <PublicPageHero
        badge="Get in Touch"
        title="We’re Here to Support Your Business"
        breadcrumbCurrent="Contact Us"
        subtitle="Have questions about courier setup, API connections, or team onboarding? Our dedicated support team responds within 2 business hours."
      />

      {/* 8.2 Contact Info & 8.3 Contact Form */}
      <section className="py-16 sm:py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-brand-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
              <h3 className="text-2xl font-bold">Contact Information</h3>
              <p className="text-sm text-brand-200 leading-relaxed">
                Connect with our merchant concierge team for immediate technical and billing assistance.
              </p>

              <div className="space-y-4 pt-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-brand-300 font-semibold uppercase">Email Support</p>
                    <p className="font-bold">support@bizpilot.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-brand-300 font-semibold uppercase">Toll-Free Phone</p>
                    <p className="font-bold">+1 (800) 592-7456</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-brand-300 font-semibold uppercase">Global Headquarters</p>
                    <p className="font-bold">Commerce Plaza, Suite 400, Silicon Corridor</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hours card */}
            <div className="bg-white p-6 rounded-3xl shadow-card border border-surface-border">
              <h4 className="font-bold text-sm text-slate-800 mb-2">Merchant Concierge Hours</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Monday to Saturday: 8:00 AM – 10:00 PM (EST)<br />
                Sunday: Emergency On-Call Logistics Monitoring
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-card border border-surface-border">
              {submitted ? (
                /* 8.5 Success State */
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900">Your message has been submitted successfully!</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    A BizPilot Merchant Support specialist has been notified. A confirmation has been logged, and we will follow up at <span className="font-semibold text-slate-800">{formData.email}</span> within 2 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', subject: '', reason: 'General Inquiry', message: '' });
                    }}
                    className="mt-4 px-6 py-2.5 rounded-full bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">Send Us a Direct Message</h3>
                    <p className="text-slate-500 text-xs">Fill out the details below and we’ll get right back to you.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Copper Merchant"
                        className={`w-full px-4 py-3 bg-surface-canvas rounded-xl border ${
                          errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                        } focus:outline-none focus:border-brand-500`}
                      />
                      {errors.name && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Work Email Address *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@store.com"
                        className={`w-full px-4 py-3 bg-surface-canvas rounded-xl border ${
                          errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                        } focus:outline-none focus:border-brand-500`}
                      />
                      {errors.email && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Contact Reason</label>
                      <select
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full px-4 py-3 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 text-slate-800 font-semibold"
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Technical Support">Technical Support</option>
                        <option value="Courier API Setup">Courier API Setup</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Feedback">Product Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Subject *</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="e.g. Courier gateway webhook configuration"
                        className={`w-full px-4 py-3 bg-surface-canvas rounded-xl border ${
                          errors.subject ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                        } focus:outline-none focus:border-brand-500`}
                      />
                      {errors.subject && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.subject}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Message *</label>
                    <textarea
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please share specific details so we can assist you rapidly..."
                      className={`w-full px-4 py-3 bg-surface-canvas rounded-xl border ${
                        errors.message ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                      } focus:outline-none focus:border-brand-500 leading-relaxed`}
                    />
                    {errors.message && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-md shadow-brand-600/20 flex items-center justify-center gap-2 transition"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8.6 FAQ Preview Section */}
      <section className="py-20 bg-white border-t border-surface-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-3 py-1 rounded-full">
              Quick Answers
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-3">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-surface-canvas border border-slate-200/70 transition"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${faqOpen === idx ? 'rotate-180' : ''}`}
                  />
                </button>
                {faqOpen === idx && (
                  <p className="text-xs text-slate-600 leading-relaxed mt-3 pt-3 border-t border-slate-200/60 animate-in fade-in">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

