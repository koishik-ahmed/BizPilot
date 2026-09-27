import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  TrendingUp,
  Truck,
  BarChart3,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  Star,
  Layers,
  ChevronRight
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import heroPersonImg from '../../assets/hero-person.png';
import heroDashVolume from '../../assets/hero-dashboard-volume.svg';
import heroDashSales from '../../assets/hero-dashboard-sales.svg';

export default function HomePage() {
  const [, setSearchParams] = useSearchParams();

  const openAuth = (mode) => {
    setSearchParams({ auth: mode });
  };

  const [homeTestimonials, setHomeTestimonials] = useState([
    {
      name: 'Sofia Martinez',
      biz: 'Owner, Lumina Home Decor',
      quote: 'The 3-step order flow alone saves our packing crew 2 hours each afternoon. Search customer, pick items, done!',
      rating: 5,
      metric: '75% Faster Order Fulfillment'
    },
    {
      name: 'Tanvir Hossain',
      biz: 'Founder, GadgetZone Express',
      quote: 'Courier integration with Steadfast and Pathao combined with unpaid tracking saved us over ৳4,50,000 in pending payments.',
      rating: 5,
      metric: '৳4,50,000 Recovered'
    },
    {
      name: 'Jessica Reynolds',
      biz: 'Founder, Earth & Silk Apparel',
      quote: 'The stock threshold alerts saved us during our surge. We knew exactly which tees were dropping below 10 units.',
      rating: 5,
      metric: 'Zero Stockouts'
    }
  ]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/testimonials')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.testimonials) && data.testimonials.length > 0 && isMounted) {
          const mapped = data.testimonials.slice(0, 3).map((t) => ({
            id: t.id,
            name: t.name,
            biz: t.role ? `${t.role}, ${t.business_name}` : t.business_name,
            quote: t.quote,
            rating: t.rating || 5,
            metric: t.metric
          }));
          setHomeTestimonials(mapped);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);
  const problems = [
    { title: 'Manual Order Chaos', desc: 'Copy-pasting customer addresses into spreadsheets leads to forgotten orders and lost details.' },
    { title: 'Inventory Blindspots', desc: 'Overselling items you do not have in stock results in cancellations and disappointed buyers.' },
    { title: 'Uncollected Revenue', desc: 'Unpaid cash-on-delivery orders sit forgotten without proper payment status tracking.' },
    { title: 'Complex Revenue Math', desc: 'Hours spent every week calculating net profit, delivery deductions, and actual bank settlements.' },
    { title: 'Repeated Customer Entry', desc: 'Typing customer phone numbers again and again with zero customer profile memory.' },
    { title: 'Fragmented Courier Sites', desc: 'Switching between 4 different courier portals to book parcels and generate tracking links.' },
  ];

  const features = [
    { icon: Layers, title: 'Smart Dashboard', desc: 'Glanceable 4-KPI overview, sales velocity charts, and instant order creation shortcuts.' },
    { icon: Package, title: 'Product Catalog', desc: 'Real-time stock controls, low-stock threshold triggers, and SKU margin analysis.' },
    { icon: Boxes, title: 'Inventory Management', desc: 'Restock workflows, controlled adjustments, and an unalterable stock history audit log.' },
    { icon: ShoppingCart, title: '3-Step Place Order', desc: 'Search repeat customers, live check product stock, and issue instant email/SMS invoices.' },
    { icon: Users, title: 'Customer Directory', desc: 'Auto-populated profiles, lifetime spending totals, and one-click repeat ordering.' },
    { icon: TrendingUp, title: 'Revenue & Cash Flow', desc: 'Confirmed paid revenue tracking, unpaid balances, and one-click "Mark as Paid" action.' },
    { icon: Truck, title: 'Courier Gateway', desc: 'Book with Steadfast, Pathao, RedX, and DHL directly from your order queue with live tracking.' },
    { icon: BarChart3, title: 'Modular Reports', desc: 'Deep-dive business analytics for sales, inventory, customer cohorts, and CSV export.' },
    { icon: Sparkles, title: 'AI Business Insights', desc: 'Predictive revenue forecasts and runout warnings with confidence metrics.' },
  ];

  const workflowSteps = [
    { step: '01', title: 'Create Merchant Account', desc: 'Sign up in 30 seconds with zero credit card required.' },
    { step: '02', title: 'Add Product Inventory', desc: 'Set cost, price, available quantity, and low-stock threshold.' },
    { step: '03', title: 'Place Customer Orders', desc: 'Use the rapid 3-step wizard with auto-customer remembering.' },
    { step: '04', title: 'Auto Deduct Stock & Audit', desc: 'System automatically logs stock movement and verifies inventory.' },
    { step: '05', title: 'Book Courier in 1 Click', desc: 'Hand over to Steadfast, Pathao, or RedX with tracking IDs.' },
    { step: '06', title: 'Track Revenue & AI Advice', desc: 'Receive real-time profit analytics and proactive inventory alerts.' },
  ];

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col selection:bg-brand-500 selection:text-white">
      <PublicNavbar />

      {/* 4.1 Hero Section */}
      <section className="relative bg-white pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 overflow-hidden">
        {/* Soft Ambient Mint Glow on the left */}
        <div className="absolute -left-28 top-1/3 -translate-y-1/2 w-[480px] h-[480px] bg-emerald-100/50 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6 sm:space-y-7 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>The All-in-One Operating System for Online Sellers</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-slate-900 tracking-tight leading-[1.12]">
                Scale Your Online Business <br />
                <span className="relative inline-block mt-1 text-brand-600 bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                  With Clarity & Precision
                  {/* Playful dual curved underline in brand green */}
                  <svg
                    className="absolute -bottom-2.5 left-0 w-full h-3.5 overflow-visible"
                    viewBox="0 0 240 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 6.5C65 2 175 1.5 237 7.5"
                      stroke="#1b6b55"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M20 10.5C80 6 185 5.5 230 11"
                      stroke="#22c55e"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                  </svg>
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg">
                BizPilot eliminates spreadsheets and fragmented tools. Manage your products, stock audit trails, 3-step orders, automated invoices, courier dispatch, and revenue from one unified command center.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm sm:text-base shadow-xl shadow-brand-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="px-8 py-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm sm:text-base shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Merchant Login</span>
                </button>
              </div>
            </div>

            {/* Right Visual Column (3 Separate Images: Person + 2 Dashboards in Present Arrangement) */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[460px] sm:max-w-[480px] flex items-center justify-center py-6 px-4">
                {/* 1. Brand Green Quarter-Circle Accent (Top-Right behind person) */}
                <div
                  className="absolute top-1 right-6 sm:top-0 sm:right-8 w-24 h-24 sm:w-28 sm:h-28 rounded-tr-full bg-brand-500 -z-0 pointer-events-none"
                  aria-hidden="true"
                />

                {/* Subtle soft ambient glow behind visual */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-brand-100/40 via-emerald-100/30 to-transparent rounded-3xl blur-2xl -z-10" />

                {/* 2. Image 1: Main Person Photo (Center) */}
                <div className="relative z-10 w-full max-w-[310px] sm:max-w-[340px] rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-100/80">
                  <img
                    src={heroPersonImg}
                    alt="Online business merchant managing operations"
                    className="w-full h-auto object-cover select-none block"
                    loading="eager"
                  />
                </div>

                {/* 3. Image 2: Dashboard 1 - Volume vs Service Level (Floating Top-Left) */}
                <div className="absolute top-1 -left-2 sm:-top-2 sm:-left-6 z-20 w-40 sm:w-48 drop-shadow-xl hover:scale-105 transition-transform duration-300">
                  <img
                    src={heroDashVolume}
                    alt="Volume vs Service Level Dashboard"
                    className="w-full h-auto select-none block"
                    loading="eager"
                  />
                </div>

                {/* 4. Image 3: Dashboard 2 - Sales Reports (Floating Bottom-Right) */}
                <div className="absolute -bottom-4 -right-2 sm:-bottom-6 sm:-right-6 z-20 w-56 sm:w-72 drop-shadow-xl hover:scale-105 transition-transform duration-300">
                  <img
                    src={heroDashSales}
                    alt="Sales Reports Dashboard"
                    className="w-full h-auto select-none block"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.2 Problem Section */}
      <section className="py-20 bg-white border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
              The Reality of Online Selling
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
              Running an online store without BizPilot is exhausting
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Merchants waste over 15 hours every week fixing manual errors, juggling customer chats, and tracking shipments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((prob, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-surface-canvas border border-slate-200/70 hover:border-slate-300 transition group"
              >
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">{prob.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{prob.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.3 Solution Section (Connected Workflow) */}
      <section className="py-20 bg-surface-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-3 py-1 rounded-full">
              The BizPilot Connected Solution
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
              One unbroken flow from product to payout
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Every action automatically cascades into the next logical step. No redundant clicks, no forgotten numbers.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-card border border-surface-border">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3 text-center">
              {[
                { step: 'Products', desc: 'Central Catalog' },
                { step: 'Orders', desc: '3-Step Wizard' },
                { step: 'Customers', desc: 'Auto Remembered' },
                { step: 'Inventory', desc: 'Auto Deduction' },
                { step: 'Payment', desc: 'Paid or COD' },
                { step: 'Revenue', desc: 'Live Analytics' },
                { step: 'Courier', desc: 'Integrated API' },
                { step: 'Reports', desc: 'CSV & Audit' },
                { step: 'AI Insights', desc: 'Smart Forecast' }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center p-3 rounded-2xl bg-surface-canvas border border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-black flex items-center justify-center mb-2">
                    {idx + 1}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900">{item.step}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4.4 Core Features Section */}
      <section className="py-20 bg-white border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-3 py-1 rounded-full">
              Full Feature Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
              Everything you need to govern your empire
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-surface-canvas border border-slate-200/70 hover:shadow-card-hover hover:border-brand-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mb-2">{feat.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center text-xs font-bold text-brand-700">
                    <Link to="/services" className="flex items-center gap-1 hover:text-brand-900 transition">
                      <span>Explore Service Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4.5 How It Works Section */}
      <section className="py-20 bg-surface-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Get running in 6 effortless steps
            </h2>
            <p className="mt-3 text-slate-600 text-sm">
              Designed from the ground up for simplicity, speed, and minimum clicks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflowSteps.map((step, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-white shadow-card border border-surface-border">
                <span className="text-2xl font-black text-brand-600">{step.step}</span>
                <h3 className="font-bold text-base text-slate-900 mt-2 mb-1">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.6 Why BizPilot & 4.7 Dashboard Preview */}
      <section className="py-20 bg-brand-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-300 bg-brand-800/80 px-3 py-1 rounded-full">
                Why Merchants Choose BizPilot
              </span>
              <h2 className="text-3xl sm:text-4xl font-black mt-4 leading-tight">
                Designed not just to look pretty, but to actually run your daily operations.
              </h2>
              <div className="space-y-4 mt-8">
                {[
                  'User Data Isolation: Your sales, inventory, and customers are 100% private to your account.',
                  'Stock Depletion Defense: Automatically alerts you when inventory hits your custom threshold.',
                  'One-Click Courier Handover: Eliminates manual data copying into courier portals.',
                  'Decision Support Insights: Real predictions on when items will sell out, not generic AI fluff.'
                ].map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-brand-100/90 leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-brand-500 hover:bg-brand-400 text-white font-bold text-sm shadow-lg transition"
                >
                  <span>Experience BizPilot Today</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Ryvix-inspired Preview Card */}
            <div className="bg-white text-slate-800 p-6 rounded-3xl shadow-2xl border border-brand-800">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Financial Health</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Live Data</span>
              </div>
              <p className="text-2xl font-black text-slate-900">৳83,450.00</p>
              <p className="text-xs text-slate-500 mb-4">Confirmed Paid Revenue across 147 orders</p>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-surface-canvas rounded-xl flex justify-between">
                  <span className="font-semibold text-slate-700">Average Order Value (AOV)</span>
                  <span className="font-bold text-slate-900">৳725.00</span>
                </div>
                <div className="p-3 bg-surface-canvas rounded-xl flex justify-between">
                  <span className="font-semibold text-slate-700">Pending COD Collection</span>
                  <span className="font-bold text-amber-600">৳2,900.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4.8 Testimonials Preview */}
      <section className="py-20 bg-surface-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-3 py-1 rounded-full">
                Testimonials
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-2">Loved by 1,200+ online sellers</h2>
            </div>
            <Link
              to="/testimonials"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-900 transition"
            >
              <span>View All Testimonials</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homeTestimonials.map((t, idx) => (
              <div key={t.id || idx} className="p-6 rounded-3xl bg-white shadow-card border border-surface-border flex flex-col justify-between hover:shadow-lg transition">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed mb-4">"{t.quote}"</p>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-900">{t.name}</p>
                    <p className="text-[11px] text-slate-500">{t.biz}</p>
                  </div>
                  {t.metric && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold">
                      {t.metric}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4.9 Final CTA Section */}
      <section className="py-20 bg-brand-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Ready to simplify your business management?
          </h2>
          <p className="text-base sm:text-lg text-brand-100 max-w-xl mx-auto">
            Join modern merchants who spend less time on administration and more time growing their business.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-brand-700 font-extrabold text-base shadow-2xl hover:bg-brand-50 hover:scale-105 transition-all"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

