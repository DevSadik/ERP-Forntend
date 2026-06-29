import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
const ROLES = ['admin', 'manager', 'staff'];

export default function AdminRegister() {
  const { token } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'manager' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())          e.name     = 'Name required';
    if (!form.email.includes('@'))  e.email    = 'Valid email required';
    if (form.password.length < 6)   e.password = 'Min 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await axios.post(`${API}/auth/register`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`✅ User "${form.name}" created as ${form.role}!`);
      navigate('/admin/users');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="w-full max-w-sm relative z-10">

        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="Mini Manager" className="w-16 h-16 mb-3"
            style={{ filter:'drop-shadow(0 0 12px rgba(16,185,129,0.3))' }} />
          <h1 className="text-headline-sm font-black text-primary">Mini Manager ERP</h1>
          <p className="text-label-sm text-on-surface-var">Create New Admin User</p>
        </div>

        <div className="bg-surface border border-outline-var rounded-2xl p-7 shadow-modal">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined !text-[22px] text-primary">person_add</span>
            <h2 className="text-headline-sm font-bold text-on-surface">New Admin User</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">Full Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} autoFocus
                placeholder="e.g. Karim Manager"
                className={`w-full bg-surface-high border rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${errors.name ? 'border-error' : 'border-outline-var'}`} />
              {errors.name && <p className="text-label-sm text-error mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="karim@minimanager.com"
                className={`w-full bg-surface-high border rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${errors.email ? 'border-error' : 'border-outline-var'}`} />
              {errors.email && <p className="text-label-sm text-error mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">Password * (min 6 chars)</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-surface-high border rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${errors.password ? 'border-error' : 'border-outline-var'}`} />
              {errors.password && <p className="text-label-sm text-error mt-1">{errors.password}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-var mb-2 uppercase tracking-wide">Role *</label>
              <div className="flex gap-2">
                {ROLES.map(r => (
                  <button key={r} type="button" onClick={() => set('role', r)}
                    className={`flex-1 py-2.5 rounded-xl text-label-md font-bold transition-all capitalize ${form.role === r ? 'bg-primary text-white shadow-primary-glow' : 'bg-surface-high border border-outline-var text-on-surface-var hover:border-primary/40'}`}>
                    {r}
                  </button>
                ))}
              </div>
              <div className="mt-2 bg-surface-high border border-outline-var rounded-xl p-3">
                <p className="text-label-sm text-on-surface-var">
                  {form.role === 'admin'   && '✅ Full access — can manage everything'}
                  {form.role === 'manager' && '📋 Can manage products and central DB'}
                  {form.role === 'staff'   && '👁 View only access'}
                </p>
              </div>
            </div>

            <motion.button type="submit" whileTap={{ scale:.97 }} disabled={loading}
              className="w-full bg-primary text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 disabled:opacity-50 transition-all mt-2">
              {loading
                ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>Creating…</>
                : <><span className="material-symbols-outlined !text-[18px]">person_add</span>Create User</>}
            </motion.button>
          </form>

          <div className="mt-4 pt-4 border-t border-outline-var text-center">
            <Link to="/admin" className="text-label-sm text-primary font-semibold hover:underline flex items-center justify-center gap-1">
              <span className="material-symbols-outlined !text-[14px]">arrow_back</span>
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
