import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Target,
  Eye,
  ShieldCheck,
  Heart,
  Zap,
  Award,
  Users,
  CheckCircle2,
  Linkedin,
  Mail,
  Github,
  Sparkles,
  Layers,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import PublicPageHero from '../../components/layout/PublicPageHero';
import rakibulPhoto from '../../assets/rakibul.jpg';
import koishikPhoto from '../../assets/koishik.jpg';
import kothaPhoto from '../../assets/kotha.jpg';
import hridiPhoto from '../../assets/hridi.jpg';

export default function AboutPage() {
  const values = [
    {
      title: 'Simplicity',
      icon: Zap,
      desc: 'Cut through cognitive overload. Deliver exactly the data needed to make decisions in minimum clicks.'
    },
    {
      title: 'Reliability',
      icon: ShieldCheck,
      desc: 'Zero phantom orders, zero untracked inventory slips, and rock-solid multi-tenant isolation.'
    },
    {
      title: 'Transparency',
      icon: Eye,
      desc: 'Transparent revenue numbers separated clearly into paid earnings versus pending receivables.'
    },
    {
      title: 'Efficiency',
      icon: Target,
      desc: 'Connected workflows where order submission automatically triggers stock logs and courier readiness.'
    },
    {
      title: 'User-First Design',
      icon: Heart,
      desc: 'Designed to help online store owners complete tasks, not just to show decorative graphs.'
    },
  ];

  const team = [
    {
      name: 'Rakibul Islam',
      role: 'Project Lead & UI/UX Designer',
      bio: 'Directs product strategy, system architecture, and crafts high-utility, intuitive merchant interfaces.',
      image: rakibulPhoto,
      social: { linkedin: '#', github: '#', email: 'rakibul@bizpilot.io' }
    },
    {
      name: 'Koishik',
      role: 'Frontend + Backend',
      bio: 'Specializes in high-throughput inventory synchronization, courier APIs, and database fault tolerance.',
      image: koishikPhoto,
      social: { linkedin: '#', github: '#', email: 'koishik@bizpilot.io' }
    },
    {
      name: 'Maliha',
      role: 'QA & Backend',
      bio: 'Engineers responsive, accessible web components and frictionless multi-step order flow wizards.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
      social: { linkedin: '#', github: '#', email: 'maliha@bizpilot.io' }
    },
    {
      name: 'Kotha',
      role: 'Database',
      bio: 'Ensures database reliability, schema integrity, indexing performance, and data operations.',
      image: kothaPhoto,
      social: { linkedin: '#', github: '#', email: 'kotha@bizpilot.io' }
    },
    {
      name: 'Hridi',
      role: 'Documentation & Merchant Success',
      bio: 'Oversees technical documentation, merchant onboarding, active support channels, and product guides.',
      image: hridiPhoto,
      social: { linkedin: '#', github: '#', email: 'hridi@bizpilot.io' }
    }
  ];

  const problems = [
    { title: 'Order Management', desc: 'Centralize fragmented customer messages into a structured 3-step queue.' },
    { title: 'Inventory Depletion', desc: 'Real-time stock controls and proactive alerts before stockouts occur.' },
    { title: 'Customer Duplication', desc: 'Remember recurring customers automatically with lifetime order histories.' },
    { title: 'Pending Payment Risk', desc: 'Track cash-on-delivery payments from courier handover to bank settlement.' },
    { title: 'Revenue Discrepancies', desc: 'Automate net margin, delivery deductions, and actual earned profits.' },
    { title: 'Fragmented Courier APIs', desc: 'Dispatch to Steadfast, Pathao, and RedX from a single click.' },
    { title: 'Lack of Audit Trail', desc: 'Tamper-evident logs of every single unit added, sold, or adjusted.' },
    { title: 'Decision Blindness', desc: 'Actionable 4-KPI summaries and AI forecasts instead of confusing data.' },
  ];

  return (
    <div className="min-h-screen bg-surface-canvas flex flex-col selection:bg-brand-500 selection:text-white">
      <PublicNavbar />

      {/* 1. Hero Section (Brand Green Gradient with 3D Luminous Spheres & Breadcrumbs) */}
      <PublicPageHero
        badge="About BizPilot"
        title="Empowering Online Merchants with Absolute Operational Clarity"
        breadcrumbCurrent="About Us"
        subtitle="BizPilot was founded on a simple truth: online sellers spend too much time navigating disjointed tools instead of serving customers and growing revenue."
      />

      {/* 2. Our Mission & Vision (2 Staggered Overlapping Images + Dot Matrix Shape + Mission/Vision Cards) */}
      <section className="py-20 bg-white border-b border-surface-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: 2 Staggered Images + Dot Matrix Accent (Exact Reference Orientation) */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-start">
              <div className="relative w-full max-w-[390px] sm:max-w-[430px]">
                
                {/* Soft Mint Glow behind images */}
                <div className="absolute top-1/4 left-6 w-52 h-52 bg-brand-100/50 rounded-full blur-2xl -z-10 pointer-events-none" />

                {/* Image 1 (Top-Left): Tall Portrait / Vertical (Collaborative Team in Modern Office) */}
                <div className="relative z-10 w-[64%] rounded-2xl overflow-hidden shadow-xl border border-slate-100 aspect-[3/4] bg-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&auto=format&fit=crop&q=80"
                    alt="BizPilot team collaborating on product innovations"
                    className="w-full h-full object-cover object-top select-none"
                    loading="lazy"
                  />
                </div>

                {/* Image 2 (Bottom-Right): Square (Focused Professional at Laptop) */}
                <div className="relative z-20 w-[72%] ml-auto -mt-24 sm:-mt-28 rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-[1/1] bg-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80"
                    alt="E-commerce store owner managing inventory with BizPilot"
                    className="w-full h-full object-cover object-top select-none"
                    loading="lazy"
                  />
                </div>

                {/* Decorative Dot Matrix Grid Shape (Bottom-Left, directly under Image 1 & left of Image 2) */}
                <div 
                  className="absolute bottom-2 left-2 z-0 grid grid-cols-5 gap-2.5 w-24 h-24 pointer-events-none opacity-40"
                  aria-hidden="true"
                >
                  {[...Array(35)].map((_, idx) => (
                    <span key={idx} className="w-1.5 h-1.5 rounded-full bg-brand-500 block" />
                  ))}
                </div>

              </div>
            </div>

            {/* Right Column: Mission & Vision Content */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-7">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-3.5 py-1.5 rounded-full inline-block mb-3">
                  Our Mission
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                  Innovation Increases Productivity for Online Sellers
                </h2>
                <p className="mt-3.5 text-sm sm:text-base text-slate-600 leading-relaxed">
                  We believe independent merchants should have access to the same lightning-fast operational capabilities that multi-million dollar corporations rely on, packaged in an intuitive design that requires zero IT training.
                </p>
              </div>

              {/* Mission Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-surface-canvas border border-slate-200/70 flex items-start gap-4 hover:border-brand-300 transition-all shadow-sm group">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-200/60 group-hover:scale-105 transition-transform">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">Our Mission</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    To eliminate operational friction for online businesses by unifying products, stock history, 3-step order processing, courier integrations, and transparent revenue intelligence into one harmonious interface.
                  </p>
                </div>
              </div>

              {/* Vision Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-surface-canvas border border-slate-200/70 flex items-start gap-4 hover:border-emerald-300 transition-all shadow-sm group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200/60 group-hover:scale-105 transition-transform">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 mb-1">Our Vision</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    To be the trusted nervous system of 100,000+ independent online merchants worldwide, using intelligent data modeling and predictive insights to help them thrive against giant retail conglomerates.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Core Values (Pillars Row) */}
      <section className="py-20 bg-surface-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Guiding Principles
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Our Core Values
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              The foundational design decisions and operational standards that shape every line of code we write.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-3xl bg-white shadow-card border border-surface-border text-center hover:border-brand-400 hover:shadow-card-hover transition-all duration-300 group flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mb-2">{v.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Our Story (Middle Feature Banner in Rich Brand Green) */}
      <section className="py-16 bg-white border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-br from-[#061e18] via-[#0c352a] to-[#114436] text-white p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl">
            
            {/* Ambient Background Circles */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
              
              {/* Story Narrative */}
              <div className="lg:col-span-7 space-y-5">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-400/25 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>The Origin of BizPilot</span>
                </span>
                
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                  Built From Real Merchant Pain & Sleepless Nights
                </h2>

                <div className="space-y-4 text-sm sm:text-base text-brand-100/90 leading-relaxed">
                  <p>
                    In 2024, our founding team ran an online direct-to-consumer store. Like thousands of merchants, we relied on separate tools for our product catalog, inventory spreadsheets, WhatsApp customer messaging, and courier websites.
                  </p>
                  <p>
                    The breaking point came when 18 orders were oversold during a holiday rush because inventory wasn't synced with our order book. We spent three sleepless nights apologizing to customers and refunding payments.
                  </p>
                  <p>
                    We realized the market was full of bloated ERP tools built for Fortune 500 corporations, or toy spreadsheets that broke when order volume doubled. We set out to build BizPilot: a lightning-fast Commerce OS tailored specifically for agile online business owners.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-4">
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-500 hover:bg-brand-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-500/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Explore Our Services</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Story Visual Badge Deck */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    <span>The Connected Commerce Loop</span>
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">1. Rapid 3-Step Order Creation</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">Done</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">2. Automatic Stock History Audit</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">Logged</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">3. One-Click Courier Booking</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-400/20 text-brand-300 font-bold">Automated</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">4. Confirmed Revenue Settlement</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">Reconciled</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-brand-200/80 pt-1 italic text-center">
                    Zero manual copy-pasting between spreadsheets ever again.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 5. Team Section ("Meet Our Experienced Team Members" - 5 Members with Hover Overlay) */}
      <section className="py-20 bg-surface-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Our Team
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Meet Our Experienced Team Members
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              The engineers, designers, and e-commerce strategists building the future of online merchant operations.
            </p>
          </div>

          {/* 5 Team Member Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {team.map((member, idx) => (
              <div
                key={idx}
                className="relative rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 group aspect-[3/4] bg-slate-200 border border-slate-200/80"
              >
                {/* Member Portrait Image */}
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 select-none"
                  loading="lazy"
                />

                {/* Subtle base name bar visible before hover */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent text-white group-hover:opacity-0 transition-opacity duration-200">
                  <h3 className="font-bold text-sm tracking-tight text-white">{member.name}</h3>
                  <p className="text-[11px] text-brand-300 font-medium truncate">{member.role}</p>
                </div>

                {/* Full Interactive Hover Overlay with Member Info */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#061e18]/95 via-[#0c352a]/85 to-transparent p-5 flex flex-col justify-end text-white opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 backdrop-blur-[2px]">
                  <h3 className="font-bold text-base text-white leading-tight">{member.name}</h3>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5 mb-2 block">
                    {member.role}
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed mb-4 line-clamp-4">
                    {member.bio}
                  </p>

                  {/* Social / Contact Icons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                    <a
                      href={member.social.linkedin}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-brand-500 transition-colors flex items-center justify-center text-white"
                      title="LinkedIn"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={member.social.github}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-brand-500 transition-colors flex items-center justify-center text-white"
                      title="GitHub"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Github className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`mailto:${member.social.email}`}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-brand-500 transition-colors flex items-center justify-center text-white"
                      title="Email"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. The Problems We Solve (Grid of 8 Merchant Solutions) */}
      <section className="py-20 bg-white border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3.5 py-1.5 rounded-full inline-block mb-3">
              Friction Eradicated
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              The Problems We Solve
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              BizPilot directly replaces manual errors, guesswork, and fragmented browser tabs with verified automation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {problems.map((prob, i) => (
              <div
                key={i}
                className="p-5 rounded-3xl bg-surface-canvas border border-slate-200/70 hover:border-brand-400 hover:shadow-card transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 mb-1.5">{prob.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{prob.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Call to Action */}
      <section className="py-16 bg-surface-canvas border-t border-surface-border text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Ready to Run Your Online Store with Absolute Clarity?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Join growing merchants who save hours every week, eliminate stock overselling, and regain control over their revenue.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              to="/?auth=signup"
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-xl shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-sm shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>Contact Our Team</span>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
