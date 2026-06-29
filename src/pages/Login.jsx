import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [email, setEmail]       = useState('admin@minimanager.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'ইমেইল বা পাসওয়ার্ড ভুল।');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-4"
          >
            <img
              src="/logo.png"
              alt="Mini Manager ERP"
              className="w-28 h-28 drop-shadow-lg"
              style={{ filter: 'drop-shadow(0 0 20px rgba(16,185,129,0.3))' }}
            />
          </motion.div>
          <h1 className="text-headline-lg font-black text-primary leading-none tracking-tight">
            Mini Manager ERP
          </h1>
          <p className="text-label-sm text-on-surface-var mt-1">
            ইনভেন্টরি
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-outline-var rounded-2xl p-8 shadow-modal">
          <h2 className="text-headline-sm font-bold text-on-surface mb-1">স্বাগতম</h2>
          <p className="text-body-md text-on-surface-var mb-6">আপনার অ্যাকাউন্টে লগইন করুন।</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">ইমেইল</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)} required
                className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all"
                placeholder="admin@minimanager.com"
              />
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 pr-11 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-var hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined !text-[20px]">
                    {showPass ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <motion.button
              type="submit" whileTap={{ scale: 0.98 }} disabled={loading}
              className="w-full bg-primary text-white font-bold rounded-xl py-3.5 text-body-md flex items-center justify-center gap-2 hover:brightness-110 shadow-primary-glow transition-all disabled:opacity-50 mt-2"
            >
              {loading
                ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>লগইন হচ্ছে…</>
                : <><span className="material-symbols-outlined !text-[18px]">login</span>লগইন করুন</>
              }
            </motion.button>
          </form>

          <div className="mt-6 pt-4 border-t border-outline-var space-y-3">
            <p className="text-label-sm text-on-surface-var text-center">
              Demo: <span className="text-primary font-semibold">admin@minimanager.com</span> / password123
            </p>
            <div className="text-center">
              <Link to="/shop/login"
                className="text-label-sm text-on-surface-var hover:text-primary transition-colors flex items-center justify-center gap-1">
                <span className="material-symbols-outlined !text-[14px]">store</span>
                দোকানদার লগইন →
              </Link>
              <Link to="/supplier/login"
                className="text-label-sm text-on-surface-var hover:text-primary transition-colors flex items-center justify-center gap-1 mt-1">
                <span className="material-symbols-outlined !text-[14px]">storefront</span>
                সাপ্লায়ার পোর্টাল লগইন →
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright footer */}
        <div className="mt-6 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <img src="/logo.png" alt="logo" className="w-5 h-5 opacity-60" />
            <span className="text-label-sm text-primary font-semibold">Mini Manager ERP</span>
          </div>
          <p className="text-[11px] text-on-surface-var">
            Developed by <span className="font-semibold text-on-surface">Wahidsadik Aditto</span>
          </p>
          <p className="text-[10px] text-on-surface-var opacity-60">
            © 2026 All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
