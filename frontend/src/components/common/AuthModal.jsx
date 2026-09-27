import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  X,
  Layers,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Mail,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [signupStep, setSignupStep] = useState('form'); // 'form' | 'verify' | 'success'
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const { login, sendVerificationCode, verifyAndSignup, resendVerificationCode } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  // Handle resend cooldown countdown
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const prevOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setMode(initialMode);
      setSignupStep('form');
      setError('');
      setAgreeTerms(false);
      setShowTermsModal(false);
      setShowSuccessModal(false);
    }
    prevOpenRef.current = isOpen;

    if (isOpen) {
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, initialMode, onClose]);

  if (!isOpen) return null;

  const handleFillDemo = () => {
    setEmail('demo@bizpilot.com');
    setPassword('password123');
    setError('');
  };


  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      showToast('Welcome back to BizPilot!');
      onClose();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !businessName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms and Conditions to proceed.');
      return;
    }

    setLoading(true);
    try {
      await sendVerificationCode({
        name: name.trim(),
        business_name: businessName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password
      });
      showToast(`Verification code sent to ${email}!`);
      setSignupStep('verify');
      setOtpCode('');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpCode.trim() || otpCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyAndSignup({ email: email.trim(), otp_code: otpCode.trim() });
      showToast('Account verified and store created! Welcome to BizPilot.');
      setSignupStep('success');
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError('');
    try {
      await resendVerificationCode(email.trim());
      showToast('A new 6-digit code has been dispatched.');
      setResendCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setResendLoading(false);
    }
  };

  if (showSuccessModal || signupStep === 'success') {
    return (
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 selection:bg-brand-500 selection:text-white">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center relative animate-in zoom-in-95 duration-200">
          {/* Top Close icon */}
          <button
            type="button"
            onClick={() => {
              setShowSuccessModal(false);
              onClose();
            }}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Success Badge Icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 text-emerald-600 flex items-center justify-center mb-3.5 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-700 text-[11px] font-bold tracking-wide uppercase mb-2">
            Verification Successful
          </span>

          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            Store Created Successfully!
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed max-w-sm">
            Welcome to <span className="font-bold text-slate-800">BizPilot</span>! Your merchant account and store <span className="font-bold text-brand-700">{businessName || 'Your Store'}</span> have been verified and activated.
          </p>

          {/* Details Box */}
          <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 my-5 text-left text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400">Business</span>
              <span className="font-bold text-slate-800">{businessName || 'Merchant Store'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400">Owner</span>
              <span className="font-bold text-slate-800">{name || 'Merchant'}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400">Email</span>
              <span className="font-medium text-slate-800">{email}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400">Status</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Verified &amp; Active
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                onClose();
                navigate('/dashboard');
              }}
              className="w-full py-3.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-black text-sm shadow-lg shadow-brand-700/30 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSuccessModal(false);
                onClose();
                navigate('/');
              }}
              className="w-full py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-500" />
              <span>Go to Home</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto selection:bg-brand-500 selection:text-white">
      {/* Modal Split Card Container */}
      <div className="bg-white rounded-[2rem] shadow-2xl border border-surface-border max-w-[916px] w-full overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px] max-h-[92vh] my-auto relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 md:bg-white/10 md:hover:bg-white/20 md:text-white text-slate-600 flex items-center justify-center transition shadow-xs"
          title="Close dialog (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Form Area (approx 58%) */}
        <div className="md:col-span-7 p-6 sm:p-8 lg:p-9 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Heading: Only 'Create Your Store' on left side with proper gap */}
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {mode === 'login' ? 'Welcome Back' : 'Create Your Store'}
              </h2>
              {mode === 'login' && (
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Enter your credentials to access your merchant command center.
                </p>
              )}
            </div>

            {/* Quick Demo Testing Auto-fill Pill (Login Mode) */}
            {mode === 'login' && (
              <div className="mb-5 p-3.5 bg-brand-50/70 border border-brand-200/60 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-brand-900">Need instant testing?</p>
                  <p className="text-[10px] text-brand-700">demo@bizpilot.com / password123</p>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="px-3.5 py-1.5 rounded-xl bg-brand-700 text-white text-[11px] font-bold hover:bg-brand-800 transition shadow-sm cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-semibold animate-in fade-in">
                {error}
              </div>
            )}

            {/* Mode 1: LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Address <span className="text-coral-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@business.com"
                    className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium text-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Password <span className="text-coral-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium text-slate-800 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600"
                    />
                    <span className="text-xs">Remember me</span>
                  </label>
                </div>

                {/* Log In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 rounded-full bg-brand-700 hover:bg-brand-800 text-white font-black text-sm shadow-lg shadow-brand-700/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Log In</span>}
                </button>

                {/* Need an account? Sign up - Below button and centered */}
                <div className="text-center pt-2">
                  <span className="text-slate-500 text-xs">
                    Need an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setError('');
                      }}
                      className="text-brand-600 font-bold hover:underline"
                    >
                      Sign up
                    </button>
                  </span>
                </div>

                {/* Bottom Social Login (Google, Apple, Facebook logos only) */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full"></div>
                  <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider absolute">
                    or login with
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 pt-0.5 pb-1">
                  <a
                    href="https://accounts.google.com/signin"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Log in with Google"
                    className="w-11 h-11 rounded-2xl bg-surface-canvas hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition shadow-2xs hover:border-slate-300 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <svg className="w-5 h-5 pointer-events-none" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </a>

                  <a
                    href="https://appleid.apple.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Log in with Apple"
                    className="w-11 h-11 rounded-2xl bg-surface-canvas hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition shadow-2xs hover:border-slate-300 hover:scale-105 active:scale-95 text-slate-900 cursor-pointer"
                  >
                    <svg className="w-5 h-5 fill-current pointer-events-none" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.76 1.04-1.81.93-2.87-1 .04-2.17.67-2.78 1.42-.55.64-1.03 1.71-.9 2.73 1.11.08 2.14-.56 2.75-1.28z" />
                    </svg>
                  </a>

                  <a
                    href="https://www.facebook.com/login.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Log in with Facebook"
                    className="w-11 h-11 rounded-2xl bg-surface-canvas hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition shadow-2xs hover:border-slate-300 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <svg className="w-5 h-5 fill-[#1877F2] pointer-events-none" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                </div>
              </form>
            )}

            {/* Mode 2: SIGNUP FORM */}
            {mode === 'signup' && signupStep === 'form' && (
              <form onSubmit={handleInitiateSignup} className="space-y-3.5 text-xs">
                {/* Business Name and Owner Name (2 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Business Name <span className="text-coral-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Acme Fashion"
                      className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium text-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Owner Name <span className="text-coral-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rachel Green"
                      className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium text-slate-800 text-sm"
                    />
                  </div>
                </div>

                {/* Email Address (Separate row) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Email Address <span className="text-coral-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@business.com"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium text-slate-800 text-sm"
                  />
                </div>

                {/* Phone Number (Separate row) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 1700 000000"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium text-slate-800 text-sm"
                  />
                </div>

                {/* Password and Confirm Password (Side by Side) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Password <span className="text-coral-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="min 6 characters"
                        className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium text-slate-800 text-sm pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Confirm Password <span className="text-coral-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="re-enter password"
                        className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium text-slate-800 text-sm pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions Agreement Checkbox */}
                <div className="pt-1 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    required
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (error && error.includes('Terms and Conditions')) {
                        setError('');
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer accent-brand-600 shrink-0"
                  />
                  <label htmlFor="agreeTerms" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowTermsModal(true);
                      }}
                      className="text-brand-600 font-bold hover:underline"
                    >
                      Terms and Conditions
                    </button>
                  </label>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 rounded-full bg-brand-700 hover:bg-brand-800 text-white font-black text-sm shadow-lg shadow-brand-700/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Account</span>}
                </button>

                {/* Already have an account? Log in - Below button and centered */}
                <div className="text-center pt-2">
                  <span className="text-slate-500 text-xs">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError('');
                      }}
                      className="text-brand-600 font-bold hover:underline"
                    >
                      Log in
                    </button>
                  </span>
                </div>

                {/* Bottom Social Registration Logos Only (Google, Apple, Facebook) */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full"></div>
                  <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider absolute">
                    or register with
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 pt-0.5 pb-1">
                  <a
                    href="https://accounts.google.com/signin"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Sign up with Google"
                    className="w-11 h-11 rounded-2xl bg-surface-canvas hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition shadow-2xs hover:border-slate-300 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <svg className="w-5 h-5 pointer-events-none" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </a>

                  <a
                    href="https://appleid.apple.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Sign up with Apple"
                    className="w-11 h-11 rounded-2xl bg-surface-canvas hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition shadow-2xs hover:border-slate-300 hover:scale-105 active:scale-95 text-slate-900 cursor-pointer"
                  >
                    <svg className="w-5 h-5 fill-current pointer-events-none" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.76 1.04-1.81.93-2.87-1 .04-2.17.67-2.78 1.42-.55.64-1.03 1.71-.9 2.73 1.11.08 2.14-.56 2.75-1.28z" />
                    </svg>
                  </a>

                  <a
                    href="https://www.facebook.com/login.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Sign up with Facebook"
                    className="w-11 h-11 rounded-2xl bg-surface-canvas hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition shadow-2xs hover:border-slate-300 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <svg className="w-5 h-5 fill-[#1877F2] pointer-events-none" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                </div>
              </form>
            )}

            {/* Mode 2 Step 2: OTP VERIFICATION */}
            {mode === 'signup' && signupStep === 'verify' && (
              <form onSubmit={handleVerifySignup} className="space-y-4 text-xs">
                <div className="p-4 bg-brand-50/80 border border-brand-200/80 rounded-2xl flex items-start gap-3">
                  <Mail className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-brand-900 text-sm">Verify Your Email</p>
                    <p className="text-xs text-brand-700 mt-0.5">
                      We've dispatched a 6-digit confirmation code to{' '}
                      <span className="font-mono font-bold">{email}</span>.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-surface-canvas rounded-xl border border-slate-200 text-center text-2xl font-mono tracking-widest font-black text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setSignupStep('form')}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to form</span>
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || resendLoading}
                    onClick={handleResendCode}
                    className="text-brand-600 hover:text-brand-700 font-bold disabled:text-slate-400 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                    </span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full mt-2 py-3.5 rounded-full bg-brand-700 hover:bg-brand-800 text-white font-black text-sm shadow-lg shadow-brand-700/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verify & Launch Store</span>}
                </button>
              </form>
            )}

            {/* Mode 2 Step 3: SUCCESS CONFIRMATION IN-MODAL */}
            {mode === 'signup' && signupStep === 'success' && (
              <div className="py-6 flex flex-col items-center text-center space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-700 text-[11px] font-bold tracking-wide uppercase">
                    Verification Complete
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                    Store Created Successfully!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Your merchant account and store <span className="font-bold text-brand-700">{businessName || 'Your Store'}</span> have been verified and activated.
                  </p>
                </div>

                <div className="w-full bg-surface-canvas border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Business</span>
                    <span className="font-bold text-slate-800">{businessName || 'Merchant Store'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Email</span>
                    <span className="font-medium text-slate-800">{email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Verified &amp; Active
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/dashboard');
                    }}
                    className="w-full py-3.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-black text-sm shadow-lg shadow-brand-700/30 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/');
                    }}
                    className="w-full py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Home className="w-4 h-4 text-slate-500" />
                    <span>Go to Home</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Left Side Footer */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <span>Encrypted Session • Multi-tenant</span>
          </div>
        </div>

        {/* Right Side: Deep Emerald Branded Banner (Matching user reference image exactly) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-[#061e18] via-[#0c352a] to-[#082921] text-white p-8 sm:p-10 flex-col justify-between relative overflow-hidden select-none">
          <div className="relative z-10">
            {/* Top Squircle Logo with Brand Name */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm">
                <Layers className="w-5 h-5 text-brand-200" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">BizPilot</span>
            </div>

            <h3 className="text-3xl font-black tracking-tight leading-snug">
              {mode === 'login' ? 'WELCOME!' : 'START TODAY!'}
            </h3>
            <p className="text-sm text-brand-100/80 mt-2 leading-relaxed">
              Enter your details and start your journey with modern automated business operations.
            </p>
          </div>

          {/* Floating Metric Testimonial Card */}
          <div className="relative z-10 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/20 space-y-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full Stack Operational Suite</span>
            </div>
            <p className="text-xs text-white leading-relaxed font-normal">
              "BizPilot gives us full inventory visibility, automated invoices, and 1-click courier bookings."
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-brand-200 font-semibold">
              <span>Copper Merchant</span>
              <span className="text-emerald-300">Verified Seller</span>
            </div>
          </div>

          {/* Subtle Ambient Decorative Glows */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

      </div>

      {/* Terms and Conditions Popup Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <span>Terms &amp; Conditions</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 text-xs text-slate-600 space-y-3.5 overflow-y-auto leading-relaxed pr-1">
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">1. Acceptance of Terms</h4>
                <p>
                  By creating an account and registering for BizPilot, you agree to comply with and be bound by these Terms and Conditions and applicable service guidelines.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">2. Merchant Account &amp; Store Governance</h4>
                <p>
                  You are responsible for safeguarding your account login credentials. All store activities, products listed, and orders managed under your credentials remain your sole responsibility.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">3. Orders, Inventory &amp; Logistics</h4>
                <p>
                  Merchants are responsible for accurate stock numbers, prices, and prompt dispatch. Third-party courier deliveries and shipping times remain subject to partner logistics terms.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">4. Privacy &amp; Data Protection</h4>
                <p>
                  BizPilot employs secure multi-tenant architecture to safeguard your business and customer records. Your data will never be sold to unauthorized third parties.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setAgreeTerms(true);
                  if (error && error.includes('Terms and Conditions')) {
                    setError('');
                  }
                  setShowTermsModal(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-700 hover:bg-brand-800 rounded-xl transition shadow-xs"
              >
                Agree &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
