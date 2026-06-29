import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Clear any existing shop session to avoid token conflict
    localStorage.removeItem('ss_shop_token');
    localStorage.removeItem('ss_shop');
    try {
      const user = await login(email, password);
      if (!['admin','manager','staff'].includes(user.role)) {
        toast.error('Admin access only.');
        setLoading(false);
        return;
      }
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:.4 }} className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Mini Manager" className="w-20 h-20 mb-3"
            style={{ filter:'drop-shadow(0 0 16px rgba(16,185,129,0.3))' }} />
          <h1 className="text-headline-md font-black text-primary">Mini Manager ERP</h1>
          <p className="text-label-sm text-on-surface-var mt-1">Admin Panel</p>
        </div>

        <div className="bg-surface border border-outline-var rounded-2xl p-8 shadow-modal">
          {/* Admin badge */}
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-3 py-2 mb-5">
            <span className="material-symbols-outlined !text-[18px] text-primary">admin_panel_settings</span>
            <span className="text-label-sm font-bold text-primary">Admin Access Only</span>
          </div>

          <h2 className="text-headline-sm font-bold text-on-surface mb-1">Admin Login</h2>
          <p className="text-body-md text-on-surface-var mb-5">Sign in to manage Mini Manager ERP.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                autoFocus placeholder="admin@minimanager.com"
                className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all" />
            </div>
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">Password</label>
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
            <motion.button type="submit" whileTap={{ scale:.97 }} disabled={loading}
              className="w-full bg-primary text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 hover:brightness-110 shadow-primary-glow disabled:opacity-50 transition-all mt-2">
              {loading
                ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>Signing in…</>
                : <><span className="material-symbols-outlined !text-[18px]">login</span>Sign In</>}
            </motion.button>
          </form>

          <div className="mt-5 pt-4 border-t border-outline-var text-center space-y-2">
            <Link to="/shop/login" className="text-label-sm text-on-surface-var hover:text-primary transition-colors flex items-center justify-center gap-1">
              <span className="material-symbols-outlined !text-[14px]">store</span>
              Shop Owner Login →
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
