import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { useShopAuth } from '../../context/ShopAuthContext';
import { useTheme } from '../../context/ThemeContext';
import shopApi from '../../utils/shopApi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

const BUSINESS_TYPES = [
  'Wholesale Shop', 'Super Shop', 'Confectionery Shop', 'Genarel Shop', 'Departmental Store', 'Others'
];

export default function ShopProfile() {
  const { shop, updateShop, logout } = useShopAuth();
  const { dark, toggle } = useTheme();
  const fileRef = useRef(null);

  const [tab, setTab] = useState('profile');
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);

  const [form, setForm] = useState({
    ownerName:    shop?.ownerName    || '',
    phone:        shop?.phone        || '',
    address:      shop?.address      || '',
    businessType: shop?.businessType || 'মিষ্টান্ন',
  });

  const [pw, setPw] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwErrors, setPwErrors] = useState({});
  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPwF = (k, v) => setPw(p => ({ ...p, [k]: v }));

  // Trial info
  const trialDaysLeft = shop?.trialEnds
    ? Math.max(0, Math.ceil((new Date(shop.trialEnds) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isTrialExpired = shop?.plan === 'trial' && trialDaysLeft <= 0;

  // Profile update
  const profileMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logoFile) fd.append('logo', logoFile);
      const res = await shopApi.put('/shop/me', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      updateShop(data.data);
      setLogoFile(null);
      setLogoPreview('');
      toast.success('✅ প্রোফাইল আপডেট হয়েছে!');
    },
    onError: e => toast.error(e.response?.data?.message || 'আপডেট ব্যর্থ।'),
  });

  // Password change
  const pwMutation = useMutation({
    mutationFn: () => shopApi.put('/shop/change-password', {
      currentPassword: pw.currentPassword,
      newPassword: pw.newPassword,
    }),
    onSuccess: () => {
      toast.success('✅ পাসওয়ার্ড পরিবর্তন হয়েছে!');
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({});
    },
    onError: e => toast.error(e.response?.data?.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ।'),
  });

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('ছবি ৫MB-এর বেশি হওয়া যাবে না।'); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const validatePw = () => {
    const e = {};
    if (!pw.currentPassword)             e.currentPassword  = 'বর্তমান পাসওয়ার্ড দিন';
    if (pw.newPassword.length < 6)       e.newPassword      = 'কমপক্ষে ৬ অক্ষর';
    if (pw.newPassword !== pw.confirmPassword) e.confirmPassword = 'পাসওয়ার্ড মিলছে না';
    setPwErrors(e);
    return Object.keys(e).length === 0;
  };

  const logoSrc = logoPreview || (shop?.logo ? `${API_BASE}/uploads/${shop.logo}` : '');

  return (
    <div className="space-y-stack-lg max-w-2xl">

      {/* ── Header card ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center gap-5">

        {/* Logo */}
        <div className="relative flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl border-2 border-primary/30 overflow-hidden bg-surface-high flex items-center justify-center">
            {logoSrc ? (
              <img src={logoSrc} alt="shop logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-black text-3xl">
                {shop?.name?.[0]?.toUpperCase() || 'S'}
              </span>
            )}
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-primary-glow hover:brightness-110 transition-all">
            <span className="material-symbols-outlined text-white !text-[14px]">photo_camera</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Shop name — READ ONLY, cannot be changed */}
          <h1 className="text-headline-md font-black text-on-surface truncate">{shop?.name}</h1>
          <p className="text-body-md text-on-surface-var mt-0.5">{shop?.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="chip chip-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              সক্রিয় দোকান
            </span>
            {shop?.plan === 'trial' && (
              <span className={`chip ${isTrialExpired ? 'chip-error' : 'chip-warning'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isTrialExpired ? 'bg-error' : 'bg-warning'}`} />
                {isTrialExpired ? 'ট্রায়াল শেষ' : `ট্রায়াল: আর ${trialDaysLeft} দিন`}
              </span>
            )}
            {shop?.plan === 'basic' && <span className="chip chip-success"><span className="w-1.5 h-1.5 rounded-full bg-success" />Basic Plan</span>}
            {shop?.plan === 'pro'   && <span className="chip chip-success"><span className="w-1.5 h-1.5 rounded-full bg-primary" />Pro Plan</span>}
          </div>
        </div>

        {/* Logout button */}
        <button onClick={logout}
          className="flex-shrink-0 flex items-center gap-1.5 text-label-md text-on-surface-var hover:text-error border border-outline-var hover:border-error rounded-xl px-3 py-2 transition-all">
          <span className="material-symbols-outlined !text-[18px]">logout</span>
          <span className="hidden sm:inline">লগআউট</span>
        </button>
      </motion.div>

      {/* ── Trial expired banner ── */}
      {isTrialExpired && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-error !text-[24px]">warning</span>
          <div className="flex-1">
            <p className="text-body-md font-bold text-error">ট্রায়াল মেয়াদ শেষ হয়েছে</p>
            <p className="text-label-sm text-on-surface-var">সাবস্ক্রিপশন কিনতে যোগাযোগ করুন:</p>
            <a href="tel:01844815121" className="text-label-sm font-bold text-error hover:underline inline-flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined !text-[14px]">call</span>
              01844815121
            </a>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-surface-high p-1 rounded-xl w-fit">
        {[
          { k: 'profile',  label: 'প্রোফাইল',    icon: 'person' },
          { k: 'security', label: 'পাসওয়ার্ড',   icon: 'lock' },
          { k: 'account',  label: 'অ্যাকাউন্ট',   icon: 'info' },
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-body-md transition-all ${tab === t.k ? 'bg-surface text-on-surface font-semibold shadow-card' : 'text-on-surface-var hover:text-on-surface'}`}>
            <span className="material-symbols-outlined !text-[16px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Profile tab ── */}
        {tab === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-surface border border-outline-var rounded-2xl p-6 space-y-5">

            <div>
              <h3 className="text-headline-sm font-bold text-on-surface mb-1">ব্যক্তিগত তথ্য</h3>
              <p className="text-label-sm text-on-surface-var">দোকানের নাম ও ইমেইল পরিবর্তন করা যাবে না।</p>
            </div>

            {/* Read-only fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">
                  দোকানের নাম
                  <span className="ml-2 normal-case tracking-normal font-normal text-on-surface-var/60">(পরিবর্তনযোগ্য নয়)</span>
                </label>
                <div className="flex items-center gap-2 bg-surface-highest border border-outline-var rounded-xl px-4 py-3 cursor-not-allowed opacity-70">
                  <span className="material-symbols-outlined !text-[16px] text-on-surface-var">store</span>
                  <span className="text-body-md text-on-surface">{shop?.name}</span>
                  <span className="material-symbols-outlined !text-[14px] text-on-surface-var ml-auto">lock</span>
                </div>
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">
                  ইমেইল
                  <span className="ml-2 normal-case tracking-normal font-normal text-on-surface-var/60">(পরিবর্তনযোগ্য নয়)</span>
                </label>
                <div className="flex items-center gap-2 bg-surface-highest border border-outline-var rounded-xl px-4 py-3 cursor-not-allowed opacity-70">
                  <span className="material-symbols-outlined !text-[16px] text-on-surface-var">email</span>
                  <span className="text-body-md text-on-surface truncate">{shop?.email}</span>
                  <span className="material-symbols-outlined !text-[14px] text-on-surface-var ml-auto">lock</span>
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">মালিকের নাম</label>
                <input value={form.ownerName} onChange={e => set('ownerName', e.target.value)}
                  placeholder="আপনার পূর্ণ নাম"
                  className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all" />
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">ফোন নম্বর</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">ঠিকানা</label>
                <input value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="ঢাকা, বাংলাদেশ"
                  className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-label-sm text-on-surface-var mb-2 font-semibold uppercase tracking-wide">ব্যবসার ধরন</label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => set('businessType', t)}
                      className={`px-3 py-1.5 rounded-xl text-label-md font-semibold transition-all ${form.businessType === t ? 'bg-primary text-white shadow-primary-glow' : 'bg-surface-high border border-outline-var text-on-surface-var hover:border-primary/40'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logo preview if changed */}
            {logoPreview && (
              <div className="flex items-center gap-3 bg-primary/8 border border-primary/20 rounded-xl px-4 py-3">
                <img src={logoPreview} alt="new logo" className="w-12 h-12 rounded-xl object-cover border border-primary/30" />
                <div className="flex-1">
                  <p className="text-body-md font-semibold text-on-surface">নতুন লোগো বেছে নেওয়া হয়েছে</p>
                  <p className="text-label-sm text-on-surface-var">Save করলে আপডেট হবে।</p>
                </div>
                <button onClick={() => { setLogoFile(null); setLogoPreview(''); }}
                  className="text-on-surface-var hover:text-error transition-colors">
                  <span className="material-symbols-outlined !text-[18px]">close</span>
                </button>
              </div>
            )}

            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}
              className="w-full bg-primary text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:brightness-110 shadow-primary-glow disabled:opacity-50 transition-all">
              {profileMutation.isPending
                ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>সংরক্ষণ হচ্ছে…</>
                : <><span className="material-symbols-outlined !text-[18px]">save</span>পরিবর্তন সংরক্ষণ করুন</>}
            </motion.button>
          </motion.div>
        )}

        {/* ── Security tab ── */}
        {tab === 'security' && (
          <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-surface border border-outline-var rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-headline-sm font-bold text-on-surface mb-1">পাসওয়ার্ড পরিবর্তন</h3>
              <p className="text-label-sm text-on-surface-var">নিরাপদ পাসওয়ার্ড ব্যবহার করুন।</p>
            </div>

            <div className="space-y-4 max-w-sm">
              {[
                { k: 'currentPassword', label: 'বর্তমান পাসওয়ার্ড' },
                { k: 'newPassword',     label: 'নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' },
                { k: 'confirmPassword', label: 'নতুন পাসওয়ার্ড নিশ্চিত করুন' },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold">{f.label}</label>
                  <input type="password" value={pw[f.k]} onChange={e => setPwF(f.k, e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-surface-high border rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all ${pwErrors[f.k] ? 'border-error' : 'border-outline-var'}`} />
                  {pwErrors[f.k] && <p className="text-label-sm text-error mt-1">{pwErrors[f.k]}</p>}
                </div>
              ))}

              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => { if (validatePw()) pwMutation.mutate(); }}
                disabled={pwMutation.isPending}
                className="w-full bg-primary text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:brightness-110 shadow-primary-glow disabled:opacity-50 transition-all">
                {pwMutation.isPending
                  ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>পরিবর্তন হচ্ছে…</>
                  : <><span className="material-symbols-outlined !text-[18px]">lock_reset</span>পাসওয়ার্ড পরিবর্তন করুন</>}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── Account info tab ── */}
        {tab === 'account' && (
          <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-surface border border-outline-var rounded-2xl p-6 space-y-4">
            <div>
              <h3 className="text-headline-sm font-bold text-on-surface mb-1">অ্যাকাউন্টের তথ্য</h3>
              <p className="text-label-sm text-on-surface-var">আপনার সাবস্ক্রিপশন ও অ্যাকাউন্টের বিবরণ।</p>
            </div>

            {[
              { label: 'দোকানের নাম',    value: shop?.name,        icon: 'store' },
              { label: 'ইমেইল',          value: shop?.email,       icon: 'email' },
              { label: 'মালিকের নাম',    value: shop?.ownerName,   icon: 'person' },
              { label: 'ফোন',            value: shop?.phone || '—', icon: 'phone' },
              { label: 'ব্যবসার ধরন',    value: shop?.businessType, icon: 'category' },
              { label: 'প্ল্যান',         value: shop?.plan === 'trial' ? 'ফ্রি ট্রায়াল' : shop?.plan === 'basic' ? 'Basic' : 'Pro', icon: 'workspace_premium' },
              { label: 'ট্রায়াল শেষ',    value: shop?.trialEnds ? format(new Date(shop.trialEnds), 'dd MMM yyyy') : '—', icon: 'event' },
              { label: 'রেজিস্ট্রেশন',   value: shop?.createdAt ? format(new Date(shop.createdAt), 'dd MMM yyyy') : '—', icon: 'calendar_today' },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-3 py-3 border-b border-outline-var last:border-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined !text-[16px] text-primary">{row.icon}</span>
                </div>
                <span className="text-body-md text-on-surface-var flex-1">{row.label}</span>
                <span className="text-body-md font-semibold text-on-surface">{row.value}</span>
              </div>
            ))}

            {/* Danger zone */}
            <div className="mt-4 pt-4 border-t border-outline-var">
              <p className="text-label-sm text-on-surface-var mb-3 font-semibold uppercase tracking-wide">অ্যাকাউন্ট</p>
              <button onClick={() => { if (window.confirm('লগআউট করবেন?')) logout(); }}
                className="flex items-center gap-2 text-error border border-error/30 rounded-xl px-4 py-2.5 hover:bg-error/10 transition-all text-body-md font-semibold">
                <span className="material-symbols-outlined !text-[18px]">logout</span>
                লগআউট করুন
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
