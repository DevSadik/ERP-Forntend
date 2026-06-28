import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import brandApi from '../../utils/brandApi';
import toast from 'react-hot-toast';

const CATEGORIES = ['মিষ্টান্ন ও ক্যান্ডি', 'বিস্কুট ও কেক', 'চকোলেট', 'চিপস ও স্ন্যাকস', 'পানীয়', 'ডেইরি পণ্য', 'নুডলস ও পাস্তা', 'মসলা ও সস', 'তেল ও ঘি', 'অন্যান্য খাদ্যপণ্য'];

export default function SupplierRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [form, setForm] = useState({
    companyName: '', email: '', password: '', confirmPassword: '',
    phone: '', address: '', tradeCategory: '', description: '', website: '',
  });
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.companyName.trim())    e.companyName = 'কোম্পানির নাম দিন';
    if (!form.email.includes('@'))   e.email = 'সঠিক ইমেইল দিন';
    if (form.password.length < 6)   e.password = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'পাসওয়ার্ড মিলছে না';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.phone)          e.phone = 'ফোন নম্বর দিন';
    if (!form.tradeCategory)  e.tradeCategory = 'ক্যাটাগরি বাছাই করুন';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (k !== 'confirmPassword') fd.append(k, v); });
      if (logo) fd.append('logo', logo);
      await brandApi.post('/brand/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('রেজিস্ট্রেশন সফল! অ্যাডমিন অনুমোদনের পর লগইন করতে পারবেন।');
      navigate('/supplier/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'রেজিস্ট্রেশন ব্যর্থ।');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-[#065f46] flex items-center justify-center shadow-primary-glow">
            <span className="material-symbols-outlined text-white !text-[22px]">storefront</span>
          </div>
          <div>
            <h1 className="text-headline-sm font-bold text-primary leading-none">MiniBazar ERP</h1>
            <p className="text-label-sm text-on-surface-var">Supplier Portal</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1,2].map(s => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-label-md font-bold transition-all ${step >= s ? 'bg-primary text-white' : 'bg-surface-high text-on-surface-var'}`}>{s}</div>
              {s < 2 && <div className={`flex-1 h-0.5 transition-all ${step > s ? 'bg-primary' : 'bg-outline-var'}`} />}
            </React.Fragment>
          ))}
          <span className="text-label-sm text-on-surface-var ml-2">{step === 1 ? 'অ্যাকাউন্ট তথ্য' : 'কোম্পানি বিস্তারিত'}</span>
        </div>

        <div className="bg-surface border border-outline-var rounded-2xl p-8 shadow-modal">
          {step === 1 ? (
            <div className="space-y-4">
              <h2 className="text-headline-sm font-bold text-on-surface mb-4">কোম্পানি রেজিস্ট্রেশন</h2>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">কোম্পানির নাম *</label>
                <input value={form.companyName} onChange={e => set('companyName', e.target.value)}
                  placeholder="যেমন: প্রাণ আরএফএল গ্রুপ"
                  className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
                {errors.companyName && <p className="text-label-sm text-error mt-1">{errors.companyName}</p>}
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">ইমেইল *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="info@company.com"
                  className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
                {errors.email && <p className="text-label-sm text-error mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">পাসওয়ার্ড * (কমপক্ষে ৬ অক্ষর)</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
                {errors.password && <p className="text-label-sm text-error mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">পাসওয়ার্ড নিশ্চিত করুন *</label>
                <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
                {errors.confirmPassword && <p className="text-label-sm text-error mt-1">{errors.confirmPassword}</p>}
              </div>
              <motion.button whileTap={{ scale:.98 }} onClick={() => { if (validateStep1()) setStep(2); }}
                className="w-full bg-primary text-white font-bold rounded-lg py-3 flex items-center justify-center gap-2 hover:brightness-110 shadow-primary-glow mt-2">
                পরবর্তী ধাপ <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-headline-sm font-bold text-on-surface mb-4">কোম্পানির বিস্তারিত</h2>

              {/* Logo upload */}
              <div>
                <label className="block text-label-sm text-on-surface-var mb-2">কোম্পানির লোগো</label>
                <div className="flex items-center gap-3">
                  {logoPreview ? (
                    <img src={logoPreview} alt="logo" className="w-16 h-16 rounded-xl object-cover border border-outline-var" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-surface-high border border-outline-var flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-var !text-[28px]">image</span>
                    </div>
                  )}
                  <label className="cursor-pointer bg-surface-high border border-outline-var rounded-lg px-4 py-2 text-label-md text-on-surface hover:bg-surface-highest transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined !text-[16px]">upload</span>
                    লোগো আপলোড করুন
                    <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">ফোন নম্বর *</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
                {errors.phone && <p className="text-label-sm text-error mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">ব্যবসার ধরন / ক্যাটাগরি *</label>
                <select value={form.tradeCategory} onChange={e => set('tradeCategory', e.target.value)}
                  className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary">
                  <option value="">বাছাই করুন…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.tradeCategory && <p className="text-label-sm text-error mt-1">{errors.tradeCategory}</p>}
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">ঠিকানা</label>
                <input value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="ঢাকা, বাংলাদেশ"
                  className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">ওয়েবসাইট (ঐচ্ছিক)</label>
                <input value={form.website} onChange={e => set('website', e.target.value)}
                  placeholder="https://www.company.com"
                  className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
              </div>
              <div>
                <label className="block text-label-sm text-on-surface-var mb-1">কোম্পানির পরিচয় (ঐচ্ছিক)</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                  placeholder="আপনার কোম্পানি সম্পর্কে সংক্ষিপ্ত বিবরণ…"
                  className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 bg-surface-high border border-outline-var text-on-surface rounded-lg py-3 font-semibold text-body-md hover:bg-surface-highest transition-colors">
                  পিছনে যান
                </button>
                <motion.button whileTap={{ scale:.98 }} onClick={handleSubmit} disabled={loading}
                  className="flex-1 bg-primary text-white font-bold rounded-lg py-3 text-body-md flex items-center justify-center gap-2 hover:brightness-110 shadow-primary-glow disabled:opacity-50">
                  {loading ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>জমা হচ্ছে…</> : <><span className="material-symbols-outlined !text-[18px]">how_to_reg</span>রেজিস্ট্রেশন করুন</>}
                </motion.button>
              </div>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-label-sm text-on-surface-var">আগেই রেজিস্ট্রেশন আছে? <Link to="/supplier/login" className="text-primary font-semibold hover:underline">লগইন করুন</Link></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
