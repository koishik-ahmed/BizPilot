import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Mail, Phone, MapPin, ShieldCheck, Heart } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-gradient-to-b from-[#061e18] via-[#051a15] to-[#03120e] text-emerald-100/80 border-t border-[#0d382c]/70 relative overflow-hidden">
      {/* Subtle Ambient Decorative Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-brand-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1 & 2: Brand Story */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
                <Layers className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight text-white">BizPilot</span>
            </div>
            <p className="text-emerald-100/70 text-sm leading-relaxed max-w-sm">
              Smart business management system built for modern online business owners. Centralize products, inventory, orders, customers, payments, revenue, and automated courier tracking.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-tenant Isolation • Encrypted Sessions • 99.9% Uptime</span>
            </div>
          </div>

          {/* Col 3: Navigation */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-emerald-300 transition">Home</Link></li>
              <li><Link to="/about" className="hover:text-emerald-300 transition">About Us</Link></li>
              <li><Link to="/services" className="hover:text-emerald-300 transition">Services & Features</Link></li>
              <li><Link to="/testimonials" className="hover:text-emerald-300 transition">Testimonials</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-300 transition">Contact Us</Link></li>
            </ul>
          </div>

          {/* Col 4: Account */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Account</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/?auth=login" className="hover:text-emerald-300 transition">Merchant Login</Link></li>
              <li><Link to="/?auth=signup" className="hover:text-emerald-300 transition">Create Account</Link></li>
              <li><Link to="/dashboard" className="hover:text-emerald-300 transition">Live Dashboard</Link></li>
              <li><Link to="/orders" className="hover:text-emerald-300 transition">Order Management</Link></li>
              <li><Link to="/courier" className="hover:text-emerald-300 transition">Courier Gateway</Link></li>
            </ul>
          </div>

          {/* Col 5: Contact & Help */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>support@bizpilot.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+880 1700-000000</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Banani Commerce Tower, Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#0d382c]/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-emerald-200/50">
          <p>© {new Date().getFullYear()} BizPilot Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-emerald-300 cursor-pointer transition">Privacy Policy</span>
            <span className="hover:text-emerald-300 cursor-pointer transition">Terms &amp; Conditions</span>
            <span className="hover:text-emerald-300 cursor-pointer transition">Security Overview</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

