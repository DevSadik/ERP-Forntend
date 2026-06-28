import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBrandAuth } from '../../context/BrandAuthContext';
import brandApi from '../../utils/brandApi';
import toast from 'react-hot-toast';

export default function SupplierProfile() {
  const { brand, updateBrand } = useBrandAuth();
  const qc = useQueryClient();
  const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/v1','') || 'http://localhost:5000';

  const [form, setForm] = useState({
    companyName: brand?.companyName || '',
    phone:       brand?.phone       || '',
    address:     brand?.address     || '',
    website:     brand?.website     || '',
    description: brand?.description || '',
    tradeCategory: brand?.tradeCategory || '',
  });
  const [logo, setLogo]       = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogo = e => {
    const file = e.target.files[0];
    if (!file) return;
    setLogo(file); setLogoPreview(URL.createObjectURL(file));
  };

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (logo) fd.append('logo', logo);
      return brandApi.put('/brand/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: res => {
      updateBrand(res.data.data);
      toast.success('প্রোফাইল আপডেট হয়েছে!');
    },
    onError: e => toast.error(e.response?.data?.message || 'আপডেট ব্যর্থ।'),
  });

  return (
    <div className="space-y-stack-lg max-w-xl">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">কোম্পানি প্রোফাইল</h1>
        <p className="text-body-md text-on-surface-var mt-1">আপনার কোম্পানির তথ্য আপডেট করুন।</p>
      </div>

      <div className="bg-surface border border-outline-var rounded-xl p-stack-md space-y-stack-md">
        {/* Logo */}
        <div className="flex items-center gap-4">
          {logoPreview || brand?.logo ? (
            <img src={logoPreview || `${API_BASE}/uploads/${brand.logo}`}
              className="w-20 h-20 rounded-xl object-cover border-2 border-primary/30" alt="logo" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
              <span className="text-primary font-bold text-2xl">{brand?.companyName?.[0]}</span>
            </div>
          )}
          <label className="cursor-pointer bg-surface-high border border-outline-var rounded-xl px-4 py-2.5 text-body-md font-semibold hover:bg-surface-highest transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px]">upload</span>লোগো পরিবর্তন করুন
            <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
          </label>
        </div>

        <div>
          <label className="block text-label-sm text-on-surface-var mb-1">কোম্পানির নাম</label>
          <input value={form.companyName} onChange={e => set('companyName', e.target.value)}
            className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-label-sm text-on-surface-var mb-1">ফোন</label>
          <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="01XXXXXXXXX"
            className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-label-sm text-on-surface-var mb-1">ঠিকানা</label>
          <input value={form.address} onChange={e => set('address', e.target.value)}
            className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-label-sm text-on-surface-var mb-1">ওয়েবসাইট</label>
          <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://www.company.com"
            className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="block text-label-sm text-on-surface-var mb-1">কোম্পানির পরিচয়</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary resize-none" />
        </div>
        <motion.button whileTap={{ scale:.97 }} onClick={() => mutation.mutate()} disabled={mutation.isPending}
          className="w-full bg-primary text-white font-bold rounded-xl py-3 text-body-md flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 disabled:opacity-50 transition-all">
          {mutation.isPending ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>সংরক্ষণ হচ্ছে…</> : <><span className="material-symbols-outlined !text-[18px]">save</span>পরিবর্তন সংরক্ষণ করুন</>}
        </motion.button>
      </div>

      {/* Account info */}
      <div className="bg-surface-high/50 border border-outline-var rounded-xl p-stack-md space-y-2">
        <h3 className="text-label-md font-bold text-on-surface-var uppercase tracking-wide mb-3">অ্যাকাউন্টের তথ্য</h3>
        {[['ইমেইল', brand?.email], ['অবস্থা', brand?.status === 'approved' ? '✅ অনুমোদিত' : brand?.status], ['মোট পণ্য', brand?.totalProducts || 0]].map(([l,v]) => (
          <div key={l} className="flex items-center justify-between py-2 border-b border-outline-var last:border-0">
            <span className="text-body-md text-on-surface-var">{l}</span>
            <span className="text-body-md font-semibold text-on-surface">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
