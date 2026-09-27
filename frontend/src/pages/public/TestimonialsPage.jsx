import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, CheckCircle2, TrendingUp, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import PublicPageHero from '../../components/layout/PublicPageHero';

const fallbackFeatured = [
  {
    name: 'Sofia Martinez',
    role: 'Owner',
    business_name: 'Lumina Home Decor (Austin, TX)',
    rating: 5,
    quote: 'Before BizPilot, order fulfillment was a nightly nightmare. We were pasting customer phone numbers from WhatsApp into courier websites one by one. BizPilot cut our daily shipping time by 75%.',
    metric: '75% Faster Order Fulfillment'
  },
  {
    name: 'Tanvir Hossain',
    role: 'Founder',
    business_name: 'GadgetZone Express (Dhaka)',
    rating: 5,
    quote: 'The integration with Steadfast and Pathao combined with the Unpaid/Paid order separation saved our business. We recovered over ৳4,50,000 in pending cash-on-delivery payments in the very first month.',
    metric: '৳4,50,000 Recovered Receivables'
  }
];

const fallbackReviews = [
  {
    name: 'Jessica Reynolds',
    role: 'Founder',
    business_name: 'Earth & Silk Apparel',
    rating: 5,
    quote: 'The stock threshold alerts saved us during our Black Friday surge. We knew exactly which tees were dropping below 10 units and ordered restocks before running out.',
    metric: 'Zero Stockouts'
  },
  {
    name: 'David Zhao',
    role: 'Operations Director',
    business_name: 'Aura Lifestyle',
    rating: 5,
    quote: 'Clean, modern, and zero cognitive bloat. It has only the four KPIs we actually need every morning. Our team learned the interface in less than 20 minutes.',
    metric: '20 Min Onboarding'
  },
  {
    name: 'Rachel Kim',
    role: 'E-commerce Specialist',
    business_name: 'Seoul Spark Skincare',
    rating: 5,
    quote: 'Being able to print clean invoices and send instant SMS confirmations to our customers with one click elevated our brand reputation significantly.',
    metric: 'Instant Invoices'
  },
  {
    name: 'Marcus Brody',
    role: 'Sole Proprietor',
    business_name: 'Brody Leather Works',
    rating: 5,
    quote: 'I used to dread accounting. BizPilot’s revenue tab makes it crystal clear what revenue is paid vs what is still pending with the courier riders.',
    metric: '100% Cash Visibility'
  }
];

export default function TestimonialsPage() {
  const [featuredList, setFeaturedList] = useState(fallbackFeatured);
  const [reviewList, setReviewList] = useState(fallbackReviews);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/testimonials')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.testimonials) && data.testimonials.length > 0 && isMounted) {
          const all = data.testimonials;
          const feat = all.filter((t) => t.is_featured);
          const nonFeat = all.filter((t) => !t.is_featured);

          if (feat.length > 0) {
            setFeaturedList(feat);
            setReviewList(nonFeat.length > 0 ? nonFeat : all.slice(feat.length));
          } else {
            setFeaturedList(all.slice(0, 2));
            setReviewList(all.slice(2));
          }
        }
      })
      .catch((err) => {
        console.warn('Using default showcase reviews:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col">
      <PublicNavbar />

      {/* 7.1 Hero (Brand Green 3D Sphere Background with Numerical Metrics Card Set Inside) */}
      <PublicPageHero
        badge="Customer Stories & Reviews"
        title="Trusted by High-Velocity Online Merchants"
        breadcrumbCurrent="Testimonials"
        subtitle="See how real merchants use BizPilot to automate daily order processing, eradicate inventory mistakes, and master their financial cash flow."
      >
        {/* Numerical Results Card Set Directly Into Hero */}
        <div className="mt-8 sm:mt-10 max-w-5xl mx-auto">
          <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-black text-brand-600">75%</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Average Time Saved Daily</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-brand-600">99.8%</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Order Fulfillment Accuracy</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-brand-600">1,200+</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Active Store Owners</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-black text-brand-600">৳180M+</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Merchant Orders Processed</p>
            </div>
          </div>
          <p className="text-center text-[11px] text-brand-200/80 mt-3 italic">
            *Demonstrative case study data collected from BizPilot merchant cohorts.
          </p>
        </div>
      </PublicPageHero>

      {/* 7.2 Featured Testimonials */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-8">
          <span className="p-1 rounded-lg bg-amber-50 text-amber-600">
            <Sparkles className="w-4 h-4" />
          </span>
          <h2 className="text-2xl font-bold text-slate-900">Featured Merchant Spotlights</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuredList.map((f, idx) => (
            <div
              key={f.id || idx}
              className="p-8 rounded-3xl bg-brand-900 text-white shadow-xl flex flex-col justify-between hover:shadow-2xl transition"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-300 mb-4">
                  {[...Array(f.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-300" />
                  ))}
                </div>
                <p className="text-base sm:text-lg italic leading-relaxed text-brand-50 mb-6">
                  "{f.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-brand-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{f.name}</h4>
                  <p className="text-xs text-brand-300">
                    {f.role || 'Store Owner'}, {f.business_name || f.business}
                  </p>
                </div>
                {f.metric && (
                  <span className="px-3 py-1 rounded-full bg-brand-700 text-brand-200 text-xs font-bold shadow-sm">
                    {f.metric}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7.3 Testimonial Grid */}
      <section className="py-16 bg-white border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Verified Merchant Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviewList.map((t, idx) => (
              <div
                key={t.id || idx}
                className="p-6 rounded-3xl bg-surface-canvas border border-slate-200/70 flex flex-col justify-between hover:shadow-card hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-3">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic mb-4">"{t.quote}"</p>
                </div>
                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-slate-900">{t.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {t.role ? `${t.role}, ` : ''}{t.business_name || t.business}
                    </p>
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

          {/* 7.5 CTA */}
          <div className="mt-16 text-center">
            <Link
              to="/?auth=signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-brand-600 text-white font-bold text-sm shadow-xl hover:bg-brand-700 transition"
            >
              <span>Join These Successful Merchants</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
