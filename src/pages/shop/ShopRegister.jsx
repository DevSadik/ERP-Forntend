import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const BUSINESS_TYPES = [
  'মিষ্টান্ন','বিস্কুট ও কেক','চকোলেট','চিপস ও স্ন্যাকস',
  'মুদি দোকান','মিষ্টির দোকান','পাইকারি','অন্যান্য',
];

const BLANK = {
  shopName:'', ownerName:'', email:'', password:'', confirmPassword:'',
  phone:'', address:'', businessType:'মিষ্টান্ন',
};

export default function ShopRegister() {
  const navigate   = useNavigate();
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState(BLANK);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [registered, setRegistered] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    const e = {};
    if (!form.shopName.trim())     e.shopName        = 'দোকানের নাম দিন';
    if (!form.ownerName.trim())    e.ownerName       = 'মালিকের নাম দিন';
    if (!form.email.includes('@')) e.email           = 'সঠিক ইমেইল দিন';
    if (form.password.length < 6)  e.password        = 'কমপক্ষে ৬ অক্ষর';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'পাসওয়ার্ড মিলছে না';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!form.phone.trim()) { setErrors({ phone: 'ফোন নম্বর দিন' }); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/shop/register`, {
        shopName: form.shopName, ownerName: form.ownerName,
        email: form.email, password: form.password,
        phone: form.phone, address: form.address,
        businessType: form.businessType,
      });
      navigate('/shop/verify-otp', { state: { phone: form.phone } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'রেজিস্ট্রেশন ব্যর্থ।');
      setLoading(false);
    }
  };

  // ── Email Verification Waiting Screen ──────────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <motion.div initial={{ opacity:0, y:20, scale:.97 }} animate={{ opacity:1, y:0, scale:1 }}
          transition={{ duration:.5, ease:[.16,1,.3,1] }}
          className="w-full max-w-sm relative z-10">

          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <img src="/logo.svg" alt="MiniBazar" className="w-20 h-20 mb-3"
              style={{ filter:'drop-shadow(0 0 16px rgba(16,185,129,0.3))' }} />
            <h1 className="text-headline-md font-black text-primary">MiniBazar ERP</h1>
          </div>

          <div className="bg-surface border border-outline-var rounded-2xl p-8 shadow-modal text-center">
            {/* Animated email icon */}
            <motion.div
              initial={{ scale:0 }} animate={{ scale:1 }}
              transition={{ type:'spring', bounce:.5, delay:.2 }}
              className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined !text-[52px] text-primary"
                style={{ fontVariationSettings:"'FILL' 1" }}>
                mark_email_unread
              </span>
            </motion.div>

            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.3 }}>
              <h2 className="text-headline-md font-black text-on-surface mb-3">
                ইমেইল যাচাই করুন!
              </h2>

              <div className="bg-primary/8 border border-primary/15 rounded-xl px-4 py-3 mb-4">
                <p className="text-label-sm text-on-surface-var mb-1">যাচাই লিংক পাঠানো হয়েছে:</p>
                <p className="text-body-md font-bold text-primary">{regEmail}</p>
              </div>

              <div className="space-y-3 text-left mb-6">
                {[
                  { icon:'inbox', text:'আপনার Gmail খুলুন' },
                  { icon:'search', text:'"MiniBazar ERP" email খুঁজুন' },
                  { icon:'open_in_new', text:'"ইমেইল যাচাই করুন" বাটনে ক্লিক করুন' },
                  { icon:'dashboard', text:'ড্যাশবোর্ডে চলে যাবেন!' },
                ].map((s, i) => (
                  <motion.div key={i}
                    initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: .4 + i*.1 }}
                    className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined !text-[16px] text-primary">{s.icon}</span>
                    </div>
                    <p className="text-body-md text-on-surface">{s.text}</p>
                  </motion.div>
                ))}
              </div>

              {/* Spam notice */}
              <div className="bg-warning/8 border border-warning/20 rounded-xl px-4 py-3 mb-5">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined !text-[16px] text-warning mt-0.5 flex-shrink-0">info</span>
                  <p className="text-label-sm text-on-surface-var text-left">
                    Email না পেলে <span className="font-semibold text-on-surface">Spam / Junk</span> ফোল্ডার চেক করুন।
                  </p>
                </div>
              </div>

              {/* Open Gmail button */}
              <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer"
                className="w-full bg-primary text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 transition-all mb-3">
                <span className="material-symbols-outlined !text-[18px]">open_in_new</span>
                Gmail খুলুন
              </a>

              <Link to="/shop/login"
                className="w-full bg-surface-high border border-outline-var text-on-surface font-semibold rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-surface-highest transition-colors">
                <span className="material-symbols-outlined !text-[18px]">login</span>
                লগইন পেজে যান
              </Link>
            </motion.div>
          </div>

          <p className="text-center text-[11px] text-on-surface-var mt-4">
            © 2026 <span className="text-primary font-semibold">MiniBazar ERP</span> by Wahidsadik Aditto
          </p>
        </motion.div>
      </div>
    );
  }

  // ── Registration Form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:.4 }} className="w-full max-w-md relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.svg" alt="MiniBazar" className="w-20 h-20 mb-3"
            style={{ filter:'drop-shadow(0 0 16px rgba(16,185,129,0.3))' }} />
          <h1 className="text-headline-md font-black text-primary">MiniBazar ERP</h1>
          <p className="text-label-sm text-on-surface-var">নতুন দোকান রেজিস্ট্রেশন</p>
        </div>

        {/* Free trial banner */}
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-5">
          <span className="text-2xl flex-shrink-0">🎁</span>
          <div>
            <p className="text-body-md font-bold text-primary">১৫ দিন সম্পূর্ণ বিনামূল্যে!</p>
            <p className="text-label-sm text-on-surface-var">কোনো ক্রেডিট কার্ড লাগবে না।</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          {[1,2].map(s => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all ${step >= s ? 'bg-primary text-white shadow-primary-glow' : 'bg-surface-high text-on-surface-var border border-outline-var'}`}>
                {step > s ? <span className="material-symbols-outlined !text-[16px]">check</span> : s}
              </div>
              {s < 2 && <div className={`flex-1 h-1 rounded-full transition-all ${step > s ? 'bg-primary' : 'bg-outline-var'}`} />}
            </React.Fragment>
          ))}
          <span className="text-label-sm text-on-surface-var ml-2 font-semibold">
            {step === 1 ? 'অ্যাকাউন্ট তথ্য' : 'দোকানের তথ্য'}
          </span>
        </div>

        <div className="bg-surface border border-outline-var rounded-2xl p-7 shadow-modal">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="s1" initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:16 }} className="space-y-4">
                <h2 className="text-headline-sm font-bold text-on-surface mb-2">অ্যাকাউন্ট তথ্য</h2>
                {[
                  { k:'shopName',  label:'দোকানের নাম *',  ph:'রহিম মিষ্টান্ন ভান্ডার' },
                  { k:'ownerName', label:'মালিকের নাম *',  ph:'আপনার পূর্ণ নাম' },
                  { k:'email',     label:'ইমেইল *',        ph:'example@gmail.com', type:'email' },
                ].map(f => (
                  <div key={f.k}>
                    <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5">{f.label}</label>
                    <input type={f.type||'text'} value={form[f.k]} onChange={e => set(f.k, e.target.value)}
                      placeholder={f.ph}
                      className={`w-full bg-surface-high border rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${errors[f.k] ? 'border-error' : 'border-outline-var'}`} />
                    {errors[f.k] && <p className="text-label-sm text-error mt-1">{errors[f.k]}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5">পাসওয়ার্ড * (কমপক্ষে ৬ অক্ষর)</label>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••"
                    className={`w-full bg-surface-high border rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.password ? 'border-error' : 'border-outline-var'}`} />
                  {errors.password && <p className="text-label-sm text-error mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5">পাসওয়ার্ড নিশ্চিত করুন *</label>
                  <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="••••••••"
                    className={`w-full bg-surface-high border rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.confirmPassword ? 'border-error' : 'border-outline-var'}`} />
                  {errors.confirmPassword && <p className="text-label-sm text-error mt-1">{errors.confirmPassword}</p>}
                </div>
                <motion.button whileTap={{ scale:.97 }} onClick={() => { if (validateStep1()) setStep(2); }}
                  className="w-full bg-primary text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 transition-all">
                  পরবর্তী <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="s2" initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-16 }} className="space-y-4">
                <h2 className="text-headline-sm font-bold text-on-surface mb-2">দোকানের তথ্য</h2>
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5">ফোন নম্বর *</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="01XXXXXXXXX"
                    className={`w-full bg-surface-high border rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.phone ? 'border-error' : 'border-outline-var'}`} />
                  {errors.phone && <p className="text-label-sm text-error mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5">ঠিকানা</label>
                  <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="ঢাকা, বাংলাদেশ"
                    className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface-var mb-2">ব্যবসার ধরন</label>
                  <div className="flex flex-wrap gap-2">
                    {BUSINESS_TYPES.map(t => (
                      <button key={t} type="button" onClick={() => set('businessType', t)}
                        className={`px-3 py-1.5 rounded-xl text-label-md font-semibold transition-all ${form.businessType === t ? 'bg-primary text-white shadow-primary-glow' : 'bg-surface-high border border-outline-var text-on-surface-var hover:border-primary/40'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setStep(1)}
                    className="flex-1 bg-surface-high border border-outline-var text-on-surface rounded-xl py-3 font-semibold hover:bg-surface-highest transition-colors">
                    ← পিছনে
                  </button>
                  <motion.button whileTap={{ scale:.97 }} onClick={handleSubmit} disabled={loading}
                    className="flex-2 bg-primary text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 disabled:opacity-50 transition-all"
                    style={{ flex:2 }}>
                    {loading
                      ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>তৈরি হচ্ছে…</>
                      : <><span className="material-symbols-outlined !text-[18px]">store</span>অ্যাকাউন্ট তৈরি করুন</>}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-5 pt-4 border-t border-outline-var text-center">
            <p className="text-label-sm text-on-surface-var">
              আগেই অ্যাকাউন্ট আছে?{' '}
              <Link to="/shop/login" className="text-primary font-bold hover:underline">লগইন করুন</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-on-surface-var mt-4">
          © 2026 <span className="text-primary font-semibold">MiniBazar ERP</span> by Wahidsadik Aditto
        </p>
      </motion.div>
    </div>
  );
}
