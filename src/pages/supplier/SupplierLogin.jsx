import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useBrandAuth } from '../../context/BrandAuthContext';
import toast from 'react-hot-toast';

export default function SupplierLogin() {
  const { login } = useBrandAuth();
  const navigate  = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await login(email, password);
      navigate('/supplier/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'লগইন ব্যর্থ।');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:.5 }} className="w-full max-w-sm relative z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[#065f46] flex items-center justify-center shadow-primary-glow">
            <span className="material-symbols-outlined text-white !text-[28px]">storefront</span>
          </div>
          <div>
            <h1 className="text-headline-md font-bold text-primary leading-none">MiniBazar ERP</h1>
            <p className="text-label-sm text-on-surface-var">Supplier Portal</p>
          </div>
        </div>
        <div className="bg-surface border border-outline-var rounded-2xl p-8 shadow-modal">
          <h2 className="text-headline-sm font-bold text-on-surface mb-1">সাপ্লায়ার লগইন</h2>
          <p className="text-body-md text-on-surface-var mb-6">আপনার কোম্পানির অ্যাকাউন্টে প্রবেশ করুন।</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-sm text-on-surface-var mb-1">ইমেইল</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                placeholder="company@example.com" />
            </div>
            <div>
              <label className="block text-label-sm text-on-surface-var mb-1">পাসওয়ার্ড</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 pr-10 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-var">
                  <span className="material-symbols-outlined !text-[18px]">{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>
            <motion.button type="submit" whileTap={{ scale:.98 }} disabled={loading}
              className="w-full bg-primary text-white font-bold rounded-lg py-3 text-body-md flex items-center justify-center gap-2 hover:brightness-110 shadow-primary-glow transition-all disabled:opacity-50 mt-2">
              {loading ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>লগইন হচ্ছে…</> : <><span className="material-symbols-outlined !text-[18px]">login</span>লগইন করুন</>}
            </motion.button>
          </form>
          <div className="mt-6 pt-4 border-t border-outline-var text-center">
            <p className="text-label-sm text-on-surface-var">নতুন কোম্পানি? <Link to="/supplier/register" className="text-primary font-semibold hover:underline">রেজিস্ট্রেশন করুন</Link></p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-label-sm text-on-surface-var hover:text-primary transition-colors">← দোকান লগইনে ফিরে যান</Link>
        </div>
      </motion.div>
    </div>
  );
}
