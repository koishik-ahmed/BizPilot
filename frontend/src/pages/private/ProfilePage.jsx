import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  LogOut,
  Settings as SettingsIcon,
  Save,
  Loader2,
  Star,
  MessageSquare,
  Sparkles,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Camera,
  UploadCloud,
  UserCheck,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import ConfirmationModal from '../../components/common/ConfirmationModal';

export default function ProfilePage() {
  const { user, logout, authFetch } = useAuth();
  const { showToast, refreshNotifications } = useNotifications();
  const navigate = useNavigate();

  // Profile Information State
  const [name, setName] = useState(user?.name || '');
  const [businessName, setBusinessName] = useState(user?.business_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Testimonial State
  const [loadingTestimonial, setLoadingTestimonial] = useState(true);
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [authorRole, setAuthorRole] = useState('Store Owner');
  const [authorBusiness, setAuthorBusiness] = useState(user?.business_name || '');
  const [authorRating, setAuthorRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [authorMetric, setAuthorMetric] = useState('');
  const [authorQuote, setAuthorQuote] = useState('');
  const [hasExistingTestimonial, setHasExistingTestimonial] = useState(false);
  const [savingTestimonial, setSavingTestimonial] = useState(false);
  const [deletingTestimonial, setDeletingTestimonial] = useState(false);

  // Load existing user testimonial on mount
  useEffect(() => {
    let isMounted = true;
    const fetchMyTestimonial = async () => {
      try {
        const res = await authFetch('/api/testimonials/my');
        const data = await res.json();
        if (data.success && data.testimonial && isMounted) {
          const t = data.testimonial;
          setAuthorName(t.name || user?.name || '');
          setAuthorRole(t.role || 'Store Owner');
          setAuthorBusiness(t.business_name || user?.business_name || '');
          setAuthorRating(t.rating || 5);
          setAuthorMetric(t.metric || '');
          setAuthorQuote(t.quote || '');
          setHasExistingTestimonial(true);
        } else if (isMounted) {
          setAuthorName(user?.name || '');
          setAuthorBusiness(user?.business_name || '');
          setHasExistingTestimonial(false);
        }
      } catch (err) {
        console.error('Failed to load user testimonial:', err);
      } finally {
        if (isMounted) setLoadingTestimonial(false);
      }
    };

    fetchMyTestimonial();
    return () => { isMounted = false; };
  }, [user]);

  const handleConfirmLogout = () => {
    logout();
    setConfirmLogoutOpen(false);
    navigate('/');
  };

  // Upload & update avatar image
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, or WebP).', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image size should be less than 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      setAvatarUrl(base64Data);
      setUploadingAvatar(true);
      try {
        const res = await authFetch('/api/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ avatar_url: base64Data })
        });
        const data = await res.json();
        if (data.success) {
          if (user) user.avatar_url = base64Data;
          showToast('Profile image updated successfully!');
          refreshNotifications();
        } else {
          showToast(data.message || 'Failed to update image', 'error');
        }
      } catch (err) {
        showToast('Failed to save profile picture.', 'error');
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setAvatarUrl('');
    setUploadingAvatar(true);
    try {
      await authFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ avatar_url: '' })
      });
      if (user) user.avatar_url = '';
      showToast('Profile photo removed.');
      refreshNotifications();
    } catch (err) {
      showToast('Failed to remove photo.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Update Profile Details
  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, business_name: businessName, phone, avatar_url: avatarUrl })
      });
      const data = await res.json();
      if (data.success) {
        if (user) {
          user.name = name;
          user.business_name = businessName;
          user.phone = phone;
          user.avatar_url = avatarUrl;
        }
        showToast('Profile information successfully updated.');
        refreshNotifications();
      } else {
        showToast(data.message || 'Failed to update profile', 'error');
      }
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Submit / Update Testimonial
  const handleSaveTestimonial = async (e) => {
    e.preventDefault();
    if (!authorQuote.trim() || authorQuote.trim().length < 10) {
      showToast('Please write a testimonial quote of at least 10 characters.', 'error');
      return;
    }

    setSavingTestimonial(true);
    try {
      const res = await authFetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authorName.trim() || user?.name,
          role: authorRole.trim() || 'Store Owner',
          business_name: authorBusiness.trim() || user?.business_name,
          rating: authorRating,
          quote: authorQuote.trim(),
          metric: authorMetric.trim() || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setHasExistingTestimonial(true);
        showToast(data.message || 'Your testimonial is now live on our public showcase!', 'success');
        refreshNotifications();
      } else {
        showToast(data.message || 'Failed to save testimonial', 'error');
      }
    } catch (err) {
      showToast('Network error while saving testimonial', 'error');
    } finally {
      setSavingTestimonial(false);
    }
  };

  // Delete Testimonial
  const handleDeleteTestimonial = async () => {
    if (!window.confirm('Are you sure you want to remove your testimonial from the public showcase?')) {
      return;
    }

    setDeletingTestimonial(true);
    try {
      const res = await authFetch('/api/testimonials/my', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setHasExistingTestimonial(false);
        setAuthorQuote('');
        setAuthorMetric('');
        showToast('Your testimonial has been removed from the public page.');
      } else {
        showToast(data.message || 'Failed to delete testimonial', 'error');
      }
    } catch (err) {
      showToast('Failed to remove testimonial', 'error');
    } finally {
      setDeletingTestimonial(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 23.1 Profile Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar with Camera Icon Overlay & Photo Controls */}
            <div className="relative group shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || 'Merchant Avatar'}
                  className="w-24 h-24 rounded-3xl object-cover border-2 border-brand-500 shadow-xl shadow-brand-700/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-brand-700 text-white font-black text-3xl flex items-center justify-center shadow-xl shadow-brand-700/25">
                  {name ? name.charAt(0).toUpperCase() : 'M'}
                </div>
              )}

              {/* Camera upload badge icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-full bg-brand-700 hover:bg-brand-800 text-white border-2 border-white shadow-lg transition hover:scale-110 active:scale-95 cursor-pointer"
                title="Upload profile image"
              >
                {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
                  Primary Store Administrator
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{name || user?.name || 'Store Owner'}</h1>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold">{businessName || user?.business_name || 'Ryvix Commerce'}</p>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>

              {/* Change/Remove Photo Actions */}
              <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 font-semibold text-xs transition cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-brand-600" />
                  <span>{avatarUrl ? 'Change Photo' : 'Upload Image'}</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploadingAvatar}
                    className="text-xs text-rose-500 hover:text-rose-700 font-semibold cursor-pointer px-2 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => {
                document.getElementById('full-name-input')?.focus();
                document.getElementById('full-name-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-700/20 hover:bg-brand-800 transition cursor-pointer hover:scale-105 active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>Update Profile</span>
            </button>
            <Link
              to="/settings"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-canvas border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <SettingsIcon className="w-4 h-4 text-slate-500" />
              <span>Settings</span>
            </Link>
            <button
              type="button"
              onClick={() => setConfirmLogoutOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* 23.2 Administrator Details Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border">
          <form onSubmit={handleUpdateProfile} className="space-y-6 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Administrator Details</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Update your primary identity and communication contact points.</p>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-700/20 hover:bg-brand-800 transition cursor-pointer"
              >
                {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  id="full-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Store / Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 bg-slate-100 rounded-xl border border-slate-200 text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1700-000000"
                  className="w-full px-4 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 px-7 py-3 rounded-full bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md shadow-brand-700/25 disabled:opacity-50 transition cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                <span>Update Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* 23.3 Merchant Testimonial & Review Submission Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-card border border-surface-border space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-base text-slate-900">Your Merchant Review & Testimonial</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Share your experience with BizPilot. Your review will be dynamically showcased on our public website for prospective merchants to see!
              </p>
            </div>

            <div className="flex items-center gap-2">
              {hasExistingTestimonial ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Live on Public Website</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                  <span>Not Yet Submitted</span>
                </span>
              )}

              <Link
                to="/testimonials"
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline px-2 py-1"
                title="View public testimonials showcase"
              >
                <span>View Public Page</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {loadingTestimonial ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
              <span className="text-xs">Loading your testimonial profile...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveTestimonial} className="space-y-6 text-xs">
              {/* Interactive Star Rating */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-800 text-sm block">How would you rate BizPilot?</span>
                  <span className="text-[11px] text-slate-500">Click a star to choose your overall experience rating</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || authorRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setAuthorRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-slate-300 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            active
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 font-black text-sm text-slate-800">
                    {authorRating}.0 / 5.0
                  </span>
                </div>
              </div>

              {/* Author & Business Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Your Display Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    required
                    placeholder="e.g. Sofia Martinez"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Role / Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    required
                    placeholder="e.g. Founder, Store Owner, Operations Lead"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Store / Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={authorBusiness}
                    onChange={(e) => setAuthorBusiness(e.target.value)}
                    required
                    placeholder="e.g. Lumina Decor (Austin, TX)"
                    className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                  />
                </div>
              </div>

              {/* Optional Highlight Metric */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Key Result / Highlight Metric (Optional)
                </label>
                <input
                  type="text"
                  value={authorMetric}
                  onChange={(e) => setAuthorMetric(e.target.value)}
                  placeholder="e.g. 75% Faster Order Fulfillment, ৳4.5L Recovered, Zero Stockouts"
                  className="w-full px-3.5 py-2.5 bg-surface-canvas rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  A short badge highlighting the tangible metric or result you achieved with BizPilot.
                </span>
              </div>

              {/* Testimonial Quote */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Your Testimonial / Story <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {authorQuote.length} characters (min 10)
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={authorQuote}
                  onChange={(e) => setAuthorQuote(e.target.value)}
                  required
                  placeholder="Share how BizPilot helped streamline your orders, automated courier dispatches, or prevented stockouts. What would you tell other online business owners?"
                  className="w-full p-3.5 bg-surface-canvas rounded-2xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium text-slate-800 leading-relaxed resize-none"
                />
              </div>

              {/* Live Card Preview */}
              <div>
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-2">
                  Live Public Preview
                </span>
                <div className="p-6 rounded-3xl bg-surface-canvas border border-slate-200/80 max-w-lg shadow-sm">
                  <div className="flex items-center gap-1 text-amber-400 mb-2.5">
                    {[...Array(authorRating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic mb-4">
                    "{authorQuote || 'Your testimonial quote will appear here on the public page once submitted...'}"
                  </p>
                  <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-900">{authorName || 'Your Name'}</p>
                      <p className="text-[11px] text-slate-500">
                        {authorRole || 'Store Owner'}, {authorBusiness || 'Your Business'}
                      </p>
                    </div>
                    {authorMetric && (
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold">
                        {authorMetric}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {hasExistingTestimonial ? (
                  <button
                    type="button"
                    onClick={handleDeleteTestimonial}
                    disabled={deletingTestimonial || savingTestimonial}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition disabled:opacity-50"
                  >
                    {deletingTestimonial ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span>Remove Review</span>
                  </button>
                ) : <div />}

                <button
                  type="submit"
                  disabled={savingTestimonial || deletingTestimonial}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 disabled:opacity-50 transition"
                >
                  {savingTestimonial ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{hasExistingTestimonial ? 'Update Testimonial' : 'Publish Testimonial to Public Page'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmLogoutOpen}
        title="Sign Out Confirmation"
        message="Are you sure you want to sign out of your merchant account?"
        confirmText="Yes, Sign Out"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmLogout}
        onCancel={() => setConfirmLogoutOpen(false)}
      />
    </>
  );
}
