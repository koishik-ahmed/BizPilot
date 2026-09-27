import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { Layers, Lock, Mail, KeyRound, AlertCircle, ArrowRight, HelpCircle, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLoginPage() {
  const { admin, login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && admin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password, require2FA ? totpCode : null);
      if (res.require_2fa) {
        setRequire2FA(true);
        setLoading(false);
        return;
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid administrative credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    try {
      await fetch('/api/admin/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      setForgotSent(true);
    } catch (err) {
      setForgotSent(true);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-[#061e18] via-[#0c352a] to-[#114436] flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* 3D Luminous Spheres & Background Lighting Effects matching About Us Hero */}
      {/* Radial soft center lighting */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_35%,rgba(34,130,103,0.38),transparent_70%)] pointer-events-none"
        aria-hidden="true"
      />

      {/* Sphere 1: Large Left Shaded Orb with 3D Inner Highlight & Floating Animation */}
      <div
        className="absolute -left-10 sm:-left-16 top-1/4 w-36 h-36 sm:w-52 sm:h-52 rounded-full bg-gradient-to-br from-brand-400/40 via-brand-600/30 to-brand-950/80 shadow-[inset_-8px_-8px_20px_rgba(4,20,16,0.85),inset_8px_8px_22px_rgba(255,255,255,0.24)] backdrop-blur-[1px] pointer-events-none opacity-85 animate-bubble-1"
        aria-hidden="true"
      />

      {/* Sphere 2: Small Top-Left Particle with Float Animation */}
      <div
        className="absolute left-[16%] sm:left-[20%] top-10 sm:top-14 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-brand-300/40 via-brand-500/25 to-brand-900/40 shadow-[inset_3px_3px_10px_rgba(255,255,255,0.3),inset_-4px_-4px_10px_rgba(4,20,16,0.65)] pointer-events-none opacity-75 animate-bubble-2"
        aria-hidden="true"
      />

      {/* Sphere 3: Bottom-Left Floating Orb */}
      <div
        className="absolute left-6 sm:left-14 bottom-12 sm:bottom-20 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-brand-400/30 via-brand-600/25 to-brand-950/80 shadow-[inset_-6px_-6px_16px_rgba(4,20,16,0.8),inset_6px_6px_16px_rgba(255,255,255,0.18)] pointer-events-none opacity-80 animate-bubble-3"
        aria-hidden="true"
      />

      {/* Sphere 4: Accent Floating Sphere (Right Side) */}
      <div
        className="absolute right-[10%] sm:right-[16%] bottom-14 sm:bottom-24 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-brand-300/40 via-brand-500/30 to-brand-900/60 shadow-[inset_-4px_-4px_12px_rgba(4,20,16,0.7),inset_5px_5px_12px_rgba(255,255,255,0.26)] pointer-events-none opacity-80 animate-bubble-1"
        aria-hidden="true"
      />

      {/* Sphere 5: Tiny Glistening Emerald Bead with Pulse Animation */}
      <div
        className="absolute right-8 sm:right-24 top-1/3 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#4ee2b2] shadow-[0_0_16px_rgba(78,226,178,0.85)] pointer-events-none animate-glow-pulse"
        aria-hidden="true"
      />

      {/* Sphere 6: Large Right Ambient Glow Orb */}
      <div
        className="absolute -right-16 top-10 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tl from-brand-500/25 via-emerald-400/15 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Main Content Area: Expanded Width for High Visual Balance */}
      <div className="w-full max-w-[490px] relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-3 group">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-900/50 border border-brand-400/30 group-hover:scale-105 transition">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl sm:text-3xl tracking-tight text-white">BizPilot</span>
          </Link>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-500/20 text-brand-200 border border-brand-400/30 backdrop-blur-sm shadow-sm">
              Platform Admin Console
            </span>
          </div>
          <p className="text-xs sm:text-sm text-brand-100/80 mt-2 max-w-sm mx-auto">
            Restricted access for authorized platform operators & support staff
          </p>
        </div>

        {/* Login Card: Crisp Pure White */}
        <div className="bg-white border border-surface-border rounded-3xl shadow-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!require2FA ? (
              <>
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@bizpilot.io"
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotModalOpen(true);
                        setForgotEmail(email);
                        setForgotSent(false);
                      }}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 transition"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Authenticate Button: Increased Width & Prominence */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-8 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-sm font-extrabold transition flex items-center justify-center gap-2.5 shadow-lg shadow-brand-600/30 tracking-wide hover:shadow-brand-600/40 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Authenticate to Console</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Step 2: Mandatory 2FA TOTP Code Screen */
              <div className="space-y-4">
                <div className="p-3.5 bg-brand-50 border border-brand-200 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-brand-900">
                    <p className="font-bold">Two-Factor Authentication Required</p>
                    <p className="text-[11px] text-brand-700 mt-0.5">Enter the 6-digit code from Google Authenticator.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                    Authenticator 6-Digit Code
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition"
                  />
                  <p className="text-[11px] text-slate-500 mt-2 text-center">
                    Development/Demo Master Code: <span className="font-mono text-brand-700 font-bold bg-brand-50 px-2 py-0.5 rounded border border-brand-200">123456</span>
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRequire2FA(false);
                      setTotpCode('');
                    }}
                    className="w-1/3 py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || totpCode.length < 6}
                    className="w-2/3 py-3 px-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-brand-600/25"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      'Verify & Enter'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-[11px] text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
              <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
              <span>Default Administrator Credentials</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mt-2">
              <div>
                <span className="text-slate-400">Email:</span>{' '}
                <span className="font-mono font-medium text-slate-800">admin@bizpilot.io</span>
              </div>
              <div>
                <span className="text-slate-400">Password:</span>{' '}
                <span className="font-mono font-medium text-slate-800">Admin@123456</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">2FA Code:</span>{' '}
                <span className="font-mono text-brand-700 font-bold">123456</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-brand-200/70 mt-6 tracking-wide">
          Rate-limited strictly (5 attempts / 15m) • All actions logged to platform audit trail.
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-surface-border rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Administrative Password Recovery</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter your pre-approved administrator email address to receive password reset instructions.
            </p>

            {forgotSent ? (
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 text-brand-800 text-xs">
                <p className="font-bold mb-1">Request Processed</p>
                <p className="text-[11px] text-brand-700">
                  If an authorized administrator account exists for this address, password reset instructions have been dispatched.
                </p>
                <button
                  onClick={() => setForgotModalOpen(false)}
                  className="mt-4 w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Pre-Approved Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@bizpilot.io"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Send Instructions
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
