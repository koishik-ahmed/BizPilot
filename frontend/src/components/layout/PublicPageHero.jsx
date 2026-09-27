import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function PublicPageHero({
  badge,
  title,
  subtitle,
  breadcrumbCurrent,
  containerMaxWidth = 'max-w-5xl',
  children
}) {
  return (
    <section className="relative bg-gradient-to-b from-[#061e18] via-[#0c352a] to-[#114436] text-white pt-16 pb-20 sm:pt-20 sm:pb-28 overflow-hidden select-none">
      {/* 3D Luminous Spheres & Background Lighting Effects */}
      {/* Radial soft center lighting */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_25%,rgba(34,130,103,0.38),transparent_70%)] pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Sphere 1: Medium Left Orb with 3D Inner Highlight */}
      <div
        className="absolute -left-6 top-1/4 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-brand-400/40 via-brand-600/30 to-brand-900/60 shadow-[inset_-6px_-6px_14px_rgba(6,30,24,0.7),inset_6px_6px_16px_rgba(255,255,255,0.22)] backdrop-blur-[1px] pointer-events-none -z-0 opacity-80"
        aria-hidden="true"
      />

      {/* Sphere 2: Small Top-Left Particle */}
      <div
        className="absolute left-1/4 top-10 w-12 h-12 rounded-full bg-gradient-to-br from-brand-300/35 via-brand-500/25 to-transparent shadow-[inset_2px_2px_8px_rgba(255,255,255,0.25)] blur-[0.5px] pointer-events-none -z-0 opacity-70"
        aria-hidden="true"
      />

      {/* Sphere 3: Large Right Ambient Glow Orb */}
      <div
        className="absolute -right-12 top-12 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tl from-brand-500/30 via-emerald-400/20 to-transparent blur-2xl pointer-events-none -z-0"
        aria-hidden="true"
      />

      {/* Sphere 4: Small Accent Sphere (Right side) */}
      <div
        className="absolute right-1/4 bottom-12 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-brand-300/40 via-brand-500/30 to-brand-800/60 shadow-[inset_-3px_-3px_8px_rgba(6,30,24,0.6),inset_4px_4px_10px_rgba(255,255,255,0.25)] pointer-events-none -z-0 opacity-75"
        aria-hidden="true"
      />

      {/* Sphere 5: Tiny Glistening Bead */}
      <div
        className="absolute right-16 top-1/3 w-5 h-5 rounded-full bg-emerald-300/50 shadow-[0_0_12px_rgba(52,211,153,0.6)] blur-[0.3px] pointer-events-none -z-0"
        aria-hidden="true"
      />

      {/* Main Content */}
      <div className={`relative z-10 ${containerMaxWidth} mx-auto px-4 sm:px-6 text-center`}>
        {/* Optional Badge */}
        {badge && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-400/25 text-xs font-bold uppercase tracking-wider mb-5 backdrop-blur-sm shadow-sm">
            <span>{badge}</span>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.15] text-white">
          {title}
        </h1>

        {/* Breadcrumb Navigation */}
        {breadcrumbCurrent && (
          <nav className="mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold tracking-wide text-brand-300/90" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-brand-400/70" />
            <span className="text-white font-bold">{breadcrumbCurrent}</span>
          </nav>
        )}

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-5 text-sm sm:text-base lg:text-lg text-brand-100/90 max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Extra slot for custom actions or stats */}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

