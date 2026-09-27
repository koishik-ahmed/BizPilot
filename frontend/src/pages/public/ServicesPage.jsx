import React from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  TrendingUp,
  BarChart3,
  Truck,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import PublicPageHero from '../../components/layout/PublicPageHero';

export default function ServicesPage() {
  const services = [
    {
      id: 'dashboard',
      icon: Layers,
      title: 'Dashboard & Analytics',
      path: '/dashboard',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      imageAlt: 'Real-time sales dashboard & telemetry',
      badge: 'Live Telemetry Deck',
      problem: 'Information overload and scattered tabs make getting a quick status check frustrating.',
      solution: 'A focused, distraction-free command deck featuring exactly four core KPIs, real-time sales trends, and 4 quick actions.',
      functions: ['Today sales & orders count', 'Active product tally & low-stock counter', 'Sales trends (7d/30d/3m)', 'Direct 1-click order initiation'],
      benefit: 'Instantly know how your business is performing every morning in under 10 seconds.'
    },
    {
      id: 'products',
      icon: Package,
      title: 'Product Management',
      path: '/products',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
      imageAlt: 'E-commerce product catalog & SKU management',
      badge: 'Catalog & Margin Control',
      problem: 'Disorganized SKUs, unclear profit margins, and accidental out-of-stock orders.',
      solution: 'Centralized catalog management with cost vs selling price margins, custom low-stock thresholds, and instant status calculation.',
      functions: ['SKU & category classification', 'Automated In Stock / Low Stock / Out of Stock flags', 'Profit margin calculation', 'Full stock audit trail connection'],
      benefit: 'Maintain accurate product margins and never be caught off guard by depleted inventory.'
    },
    {
      id: 'inventory',
      icon: Boxes,
      title: 'Inventory & Stock History',
      path: '/inventory',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      imageAlt: 'Warehouse inventory and stock tracking',
      badge: 'Warehouse & Audit Trail',
      problem: 'Disappearing stock, undocumented supplier shipments, and unexplained inventory discrepancies.',
      solution: 'Dual inventory modules: live stock controls paired with a tamper-evident audit trail capturing every addition, sale deduction, and restock.',
      functions: ['One-click restock with supplier notes', 'Controlled stock adjustments with negative prevention', 'Full movement audit log (Date, Product, Change, Reason)', 'Low stock filter switch'],
      benefit: 'Complete transparency over every unit that enters or leaves your warehouse.'
    },
    {
      id: 'orders',
      icon: ShoppingCart,
      title: 'Order Management & 3-Step Flow',
      path: '/orders',
      image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800&auto=format&fit=crop&q=80',
      imageAlt: 'Customer order placement & checkout wizard',
      badge: '3-Step Order Wizard',
      problem: 'High order volume causes typing fatigue, wrong shipping addresses, and stock overselling.',
      solution: 'A guided 3-step wizard with autocomplete customer lookups, live stock verification, invoice generation, and courier linkage.',
      functions: ['Step 1: Customer lookup or new auto-save', 'Step 2: Catalog picker with real-time stock limits', 'Step 3: Review, Paid/Unpaid selection, total calculation', 'Instant printable PDF invoice + Email/SMS sending'],
      benefit: 'Create error-free orders in 30 seconds with automatic customer retention and stock deduction.'
    },
    {
      id: 'customers',
      icon: Users,
      title: 'Customer Intelligence',
      path: '/customers',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=80',
      imageAlt: 'Customer relationship management and intelligence',
      badge: 'CRM & Cohort Tracking',
      problem: 'Entering the same customer data repeatedly without knowing their lifetime purchase value.',
      solution: 'Zero-effort customer management: customers are created automatically when orders are placed and enriched over time.',
      functions: ['Automatic customer profile creation', 'Lifetime spend and order frequency tracking', 'Search by name, phone, or email', 'One-click repeat order launch'],
      benefit: 'Reward loyal repeat buyers and eliminate repetitive manual data entry.'
    },
    {
      id: 'revenue',
      icon: TrendingUp,
      title: 'Revenue & Cash Flow',
      path: '/revenue',
      image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=80',
      imageAlt: 'Financial analytics, cash flow, and profit tracking',
      badge: 'Receivables & Profit Ledger',
      problem: 'Mixing up pending cash-on-delivery payments with actual realized bank revenue.',
      solution: 'Strict financial segregation between confirmed paid orders and pending receivables, with a 1-click "Mark as Paid" action.',
      functions: ['Paid revenue vs pending receivables KPI', 'Category sales contribution charts', 'Payment status donut breakdown', 'One-click payment status update that syncs to DB and charts'],
      benefit: 'Know your exact realized bank balance and effortlessly follow up on outstanding invoices.'
    },
    {
      id: 'courier',
      icon: Truck,
      title: 'Courier Integration Gateway',
      path: '/courier',
      image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=800&auto=format&fit=crop&q=80',
      imageAlt: 'Courier parcel booking and consignment dispatch',
      badge: 'Steadfast & Pathao Dispatch',
      problem: 'Logging into multiple courier web portals, manually copy-pasting customer details, and lost parcels.',
      solution: 'Direct API integration supporting Steadfast, Pathao, RedX, and DHL with auto-populated parcel bookings and live tracking.',
      functions: ['Automatic queue of confirmed orders ready to ship', 'Instant consignment & tracking ID generation', 'Interactive shipment milestone tracking (Booked to Delivered)', 'Cash on delivery collection syncing'],
      benefit: 'Dispatch 50 parcels in the time it used to take to book 5, with automated status updates.'
    },
    {
      id: 'reports',
      icon: BarChart3,
      title: 'Business Reports & Export',
      path: '/reports',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      imageAlt: 'Business performance reports and CSV export',
      badge: 'Data Export & Audit Reports',
      problem: 'Lack of aggregated business performance metrics and time-consuming manual tax reporting.',
      solution: 'Six specialized report views covering sales, products, inventory valuation, customer cohorts, payments, and courier success.',
      functions: ['Sales volume & AOV reports', 'Top and low-performing product analysis', 'Inventory stock valuation', 'One-click CSV data export for external accounting'],
      benefit: 'Gain deep business clarity and make data-driven decisions that increase profit margins.'
    },
    {
      id: 'ai',
      icon: Sparkles,
      title: 'AI Business Decision Insights',
      path: '/ai-insights',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      imageAlt: 'AI predictive business decision insights',
      badge: 'Predictive Intelligence',
      problem: 'Vague predictions and generic marketing text that provide no tangible business action.',
      solution: 'Ground-truth predictive models calculating stock run-out risks and revenue growth trajectories with transparent confidence labels.',
      functions: ['Revenue next-period forecasts with growth rate', 'Stock depletion countdowns before exhaustion', 'Product bundle suggestions based on actual cart overlap', 'Direct deep links to resolve recommendations'],
      benefit: 'Proactively restock before running out of top sellers and capitalize on customer buying trends.'
    }
  ];

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col">
      <PublicNavbar />

      {/* 6.1 Hero (Brand Green 3D Sphere Background) */}
      <PublicPageHero
        badge="Core Services & Capabilities"
        title="Everything You Need to Manage Your Online Business"
        breadcrumbCurrent="Services"
        subtitle="From first product upload to final doorstep delivery and revenue reconciliation, BizPilot provides nine interconnected operational services."
      />

      {/* 6.2 Service Cards Quick Grid */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="p-6 rounded-3xl bg-white shadow-card border border-surface-border hover:border-brand-500 hover:shadow-card-hover transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{s.solution}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-700">
                  <span>View Full Specification</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* 6.3 Detailed Service Breakdown */}
      <section className="py-20 bg-white border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-slate-900">Detailed Service Specifications</h2>
            <p className="mt-2 text-slate-600 text-sm">
              Each module is built around solving a core operational bottleneck faced by growing merchants.
            </p>
          </div>

          {services.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                id={s.id}
                className="p-8 rounded-3xl bg-surface-canvas border border-slate-200/80 space-y-6 scroll-mt-24"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl text-slate-900">{s.title}</h3>
                      <span className="text-xs text-brand-600 font-semibold uppercase tracking-wider">Module 0{idx + 1}</span>
                    </div>
                  </div>

                  <Link
                    to={s.path}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-sm transition"
                  >
                    <span>Get Experienced</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Related Module Visual */}
                  <div className="lg:col-span-4 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-100 relative group min-h-[220px] max-h-[280px] lg:max-h-none flex">
                    <img
                      src={s.image}
                      alt={s.imageAlt || s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent flex items-end p-4">
                      <span className="text-[11px] font-bold text-white bg-brand-600/90 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm border border-white/20">
                        {s.badge}
                      </span>
                    </div>
                  </div>

                  {/* Problem, Solution, Functions & Benefit */}
                  <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs sm:text-sm">
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                        <p className="font-bold text-rose-800 uppercase tracking-wider text-[10px] mb-1">The Problem</p>
                        <p className="text-rose-900/80 leading-relaxed">{s.problem}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100">
                        <p className="font-bold text-brand-800 uppercase tracking-wider text-[10px] mb-1">The BizPilot Solution</p>
                        <p className="text-brand-900/80 leading-relaxed">{s.solution}</p>
                      </div>
                    </div>

                    <div className="space-y-4 flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Main Functions</p>
                        <ul className="space-y-2 text-slate-600">
                          {s.functions.map((fn, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                              <span>{fn}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 mt-auto">
                        <span className="font-bold text-slate-800">Merchant Benefit: </span>
                        <span className="text-slate-600">{s.benefit}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6.4 Connected Workflow Flowchart */}
      <section className="py-20 bg-surface-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4">The Connected Workflow Engine</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto mb-12">
            Every step inside BizPilot connects seamlessly into the next:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              'Product Creation',
              'Place Order (3-Step)',
              'Payment Selection',
              'Inventory Auto-Deduct',
              'Revenue Realization',
              'Courier API Dispatch',
              'Financial Reports',
              'AI Insights'
            ].map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm font-bold text-xs text-slate-800">
                  {step}
                </div>
                {idx < 7 && <span className="text-brand-600 font-black">→</span>}
              </React.Fragment>
            ))}
          </div>

          {/* 6.5 CTA */}
          <div className="mt-16">
            <Link
              to="/?auth=signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-brand-600 text-white font-extrabold text-sm shadow-xl hover:bg-brand-700 hover:scale-105 transition-all"
            >
              <span>Start Managing Your Business</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

