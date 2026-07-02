import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [phone, setPhone]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false); // double-submit guard

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitted || loading) return; // Android double-tap guard
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 11) return toast.error('সঠিক মোবাইল নম্বর দিন।');
    setLoading(true);
    setSubmitted(true);
    try {
      await axios.post(`${API}/shop/forgot-password`, { phone: clean });
      toast.success('আপনার মোবাইলে OTP পাঠানো হয়েছে।');
      // Use URL query param (works on Android/Capacitor, unlike location.state)
      navigate(`/shop/reset-password?phone=${encodeURIComponent(clean)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP পাঠানো ব্যর্থ।');
      setLoading(false);
      setSubmitted(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="w-full max-w-sm relative z-10">

        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Mini Manager" className="w-20 h-20 mb-3"
            style={{ filter:'drop-shadow(0 0 16px rgba(69,166,52,0.3))' }} />
          <h1 className="text-headline-md font-black text-primary">Mini Manager ERP</h1>
        </div>

        <div className="bg-surface border border-outline-var rounded-2xl p-8 shadow-modal">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined !text-[32px] text-warning">lock_reset</span>
            </div>
            <h2 className="text-headline-sm font-bold text-on-surface mb-1">পাসওয়ার্ড ভুলে গেছেন?</h2>
            <p className="text-body-md text-on-surface-var">
              আপনার মোবাইল নম্বর দিন। OTP পাঠানো হবে।
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">মোবাইল নম্বর</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} required autoFocus
                placeholder="01XXXXXXXXX" inputMode="numeric"
                className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all" />
            </div>
            <motion.button type="submit" whileTap={{ scale:.97 }} disabled={loading || submitted}
              className="w-full bg-primary text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 disabled:opacity-50 transition-all">
              {loading
                ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>পাঠানো হচ্ছে…</>
                : <><span className="material-symbols-outlined !text-[18px]">sms</span>OTP পাঠান</>}
            </motion.button>
          </form>

          <div className="mt-5 pt-4 border-t border-outline-var text-center">
            <Link to="/shop/login" className="text-label-sm text-primary font-semibold hover:underline flex items-center justify-center gap-1">
              <span className="material-symbols-outlined !text-[14px]">arrow_back</span>
              লগইনে ফিরে যান
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-on-surface-var mt-4">
          © 2026 <span className="text-primary font-semibold">Mini Manager ERP</span> by Wahidsadik Aditto
        </p>
      </motion.div>
    </div>
  );
}
