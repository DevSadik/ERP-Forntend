import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useShopAuth } from '../../context/ShopAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

export default function ShopLogin() {
  const { login }   = useShopAuth();
  const { lang }    = useLanguage();
  const navigate    = useNavigate();
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 11) return toast.error(lang === 'en' ? 'Enter a valid phone number.' : 'সঠিক মোবাইল নম্বর দিন।');
    if (!password) return toast.error(lang === 'en' ? 'Enter your password.' : 'পাসওয়ার্ড দিন।');

    setLoading(true);
    try {
      await login(cleanPhone, password);
      navigate('/');
    } catch (err) {
      const serverMsg = err.response?.data?.message || '';
      // Phone not verified → go to OTP page
      try {
        const parsed = JSON.parse(serverMsg);
        if (parsed.code === 'PHONE_NOT_VERIFIED') {
          navigate('/shop/verify-otp', { state: { phone: parsed.phone } });
          return;
        }
      } catch { /* not JSON, normal error */ }
      toast.error(serverMsg || (lang === 'en' ? 'Login failed.' : 'লগইন ব্যর্থ।'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="w-full max-w-sm relative z-10">

        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Mini Manager" className="w-20 h-20 mb-3"
            style={{ filter:'drop-shadow(0 0 16px rgba(16,185,129,0.3))' }} />
          <h1 className="text-headline-md font-black text-primary">Mini Manager ERP</h1>
          <p className="text-body-md text-on-surface-var mt-1">
            {lang === 'en' ? 'Sign in to your shop' : 'আপনার দোকানে লগইন করুন'}
          </p>
        </div>

        <div className="bg-surface border border-outline-var rounded-2xl p-8 shadow-modal">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone */}
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">
                {lang === 'en' ? 'Phone Number' : 'মোবাইল নম্বর'}
              </label>
              <input type="tel" inputMode="numeric" value={phone}
                onChange={e => setPhone(e.target.value)} required autoFocus
                placeholder="01XXXXXXXXX"
                className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">
                {lang === 'en' ? 'Password' : 'পাসওয়ার্ড'}
              </label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 pr-11 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-var hover:text-on-surface">
                  <span className="material-symbols-outlined !text-[20px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/shop/forgot-password" className="text-label-sm text-primary font-semibold hover:underline">
                {lang === 'en' ? 'Forgot password?' : 'পাসওয়ার্ড ভুলে গেছেন?'}
              </Link>
            </div>

            <motion.button type="submit" whileTap={{ scale:.97 }} disabled={loading}
              className="w-full bg-primary text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 disabled:opacity-50 transition-all">
              {loading
                ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>{lang === 'en' ? 'Signing in…' : 'লগইন হচ্ছে…'}</>
                : <><span className="material-symbols-outlined !text-[18px]">login</span>{lang === 'en' ? 'Sign In' : 'লগইন'}</>}
            </motion.button>
          </form>

          <div className="mt-5 pt-4 border-t border-outline-var text-center">
            <p className="text-label-sm text-on-surface-var">
              {lang === 'en' ? "Don't have an account? " : 'অ্যাকাউন্ট নেই? '}
              <Link to="/shop/register" className="text-primary font-semibold hover:underline">
                {lang === 'en' ? 'Register' : 'রেজিস্টার করুন'}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-on-surface-var mt-4">
          © 2026 <span className="text-primary font-semibold">Mini Manager ERP</span> by Wahidsadik Aditto
        </p>
      </motion.div>
    </div>
  );
}
