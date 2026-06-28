import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const fmt = n => '৳' + (parseFloat(n) || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 });

const BLANK = { name: '', phone: '', address: '', previousBalance: '', notes: '' };

export default function CustomerList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { lang } = useLanguage();
  const L = lang === 'en';

  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(BLANK);
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get(`/customers?search=${encodeURIComponent(search)}&limit=100`).then(r => r.data),
  });

  const customers = data?.data || [];
  const totalDue  = customers.reduce((s, c) => s + (c.currentBalance > 0 ? c.currentBalance : 0), 0);

  const createMutation = useMutation({
    mutationFn: d => api.post('/customers', d),
    onSuccess: () => {
      qc.invalidateQueries(['customers']);
      toast.success(L ? 'Customer added!' : 'গ্রাহক যোগ হয়েছে!');
      setModal(false); setForm(BLANK); setErrors({});
    },
    onError: e => toast.error(e.response?.data?.message || (L ? 'Failed.' : 'ব্যর্থ।')),
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = L ? 'Name required' : 'নাম দিন';
    setErrors(e); return Object.keys(e).length === 0;
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-black text-on-surface">{L ? 'Customers' : 'গ্রাহক'}</h1>
          <p className="text-body-md text-on-surface-var mt-0.5">
            {L ? 'Manage customer balances' : 'গ্রাহকদের হিসাব পরিচালনা'}
          </p>
        </div>
        <motion.button whileTap={{ scale: .97 }} onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-primary text-white font-bold rounded-xl px-5 py-3 shadow-primary-glow hover:brightness-110 transition-all">
          <span className="material-symbols-outlined !text-[18px]">person_add</span>
          {L ? 'New Customer' : 'নতুন গ্রাহক'}
        </motion.button>
      </div>

      {/* Total due banner */}
      {totalDue > 0 && (
        <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error !text-[20px]">account_balance_wallet</span>
            <span className="text-body-md text-on-surface font-semibold">{L ? 'Total Outstanding' : 'মোট বাকি'}</span>
          </div>
          <span className="text-headline-sm font-black text-error">{fmt(totalDue)}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var !text-[18px]">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={L ? 'Search by name or phone…' : 'নাম বা ফোন দিয়ে খুঁজুন…'}
          className="w-full bg-surface border border-outline-var rounded-xl pl-9 pr-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
      </div>

      {/* Customer list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-surface border border-outline-var rounded-2xl animate-pulse" />)}
        </div>
      ) : customers.length === 0 ? (
        <div className="py-16 text-center bg-surface border border-outline-var rounded-2xl">
          <span className="material-symbols-outlined !text-[56px] text-on-surface-var opacity-30 block mb-3">people</span>
          <p className="text-body-lg font-semibold text-on-surface mb-1">{L ? 'No customers yet' : 'কোনো গ্রাহক নেই'}</p>
          <p className="text-body-md text-on-surface-var mb-4">{L ? 'Add your first customer' : 'প্রথম গ্রাহক যোগ করুন'}</p>
          <button onClick={() => setModal(true)}
            className="bg-primary text-white font-bold rounded-xl px-6 py-3 shadow-primary-glow hover:brightness-110 transition-all inline-flex items-center gap-2">
            <span className="material-symbols-outlined !text-[18px]">person_add</span>
            {L ? 'Add Customer' : 'গ্রাহক যোগ করুন'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((c, i) => {
            const bal = c.currentBalance || 0;
            const initials = c.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
            return (
              <motion.div key={c._id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }}
                onClick={() => navigate(`/customers/${c._id}`)}
                className="flex items-center gap-3 bg-surface border border-outline-var rounded-2xl px-4 py-3.5 cursor-pointer hover:border-primary/40 hover:bg-primary/3 transition-all active:scale-[.99]">
                {/* Avatar */}
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${bal > 0 ? 'bg-error/15 text-error' : 'bg-success/15 text-success'}`}>
                  {initials}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-bold text-on-surface truncate">{c.name}</p>
                  {c.phone && <p className="text-label-sm text-on-surface-var">{c.phone}</p>}
                </div>
                {/* Balance */}
                <div className="text-right flex-shrink-0">
                  {bal > 0 ? (
                    <>
                      <p className="text-body-md font-black text-error">{fmt(bal)}</p>
                      <p className="text-label-sm text-error/70">{L ? 'Due' : 'পাওনা'}</p>
                    </>
                  ) : bal < 0 ? (
                    <>
                      <p className="text-body-md font-black text-success">{fmt(Math.abs(bal))}</p>
                      <p className="text-label-sm text-success/70">{L ? 'Advance' : 'অগ্রিম'}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-body-md font-bold text-on-surface-var">৳০</p>
                      <p className="text-label-sm text-success">{L ? 'Clear' : 'নিষ্পত্তি'}</p>
                    </>
                  )}
                </div>
                <span className="material-symbols-outlined !text-[18px] text-on-surface-var flex-shrink-0">chevron_right</span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Customer Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setModal(false); setForm(BLANK); setErrors({}); }} />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }} transition={{ type: 'spring', bounce: .1, duration: .4 }}
              className="relative bg-surface border border-outline-var rounded-2xl shadow-modal w-full max-w-md overflow-hidden">
              {/* Handle */}
              <div className="w-10 h-1 bg-outline-var rounded-full mx-auto mt-3 sm:hidden" />
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-var">
                <h2 className="text-headline-sm font-bold text-on-surface">
                  {L ? 'New Customer' : 'নতুন গ্রাহক'}
                </h2>
                <button onClick={() => { setModal(false); setForm(BLANK); setErrors({}); }}
                  className="p-2 rounded-xl hover:bg-surface-high text-on-surface-var transition-colors">
                  <span className="material-symbols-outlined !text-[20px]">close</span>
                </button>
              </div>
              {/* Form */}
              <div className="p-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">
                    {L ? 'Customer Name *' : 'গ্রাহকের নাম *'}
                  </label>
                  <input autoFocus value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder={L ? 'Full name' : 'পূর্ণ নাম'}
                    className={`w-full bg-surface-high border rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${errors.name ? 'border-error' : 'border-outline-var'}`} />
                  {errors.name && <p className="text-label-sm text-error mt-1">{errors.name}</p>}
                </div>
                {/* Phone */}
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">
                    {L ? 'Phone Number' : 'ফোন নম্বর'}
                  </label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
                {/* Previous balance */}
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">
                    {L ? 'Previous Balance (৳)' : 'আগের বাকি (৳)'}
                    <span className="ml-1 normal-case tracking-normal font-normal text-on-surface-var/60">
                      ({L ? 'optional' : 'ঐচ্ছিক'})
                    </span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var font-bold">৳</span>
                    <input type="number" min="0" step="0.01" value={form.previousBalance}
                      onChange={e => set('previousBalance', e.target.value)}
                      placeholder="0"
                      className="w-full bg-surface-high border border-outline-var rounded-xl pl-7 pr-4 py-3 text-body-md text-on-surface font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  </div>
                </div>
                {/* Notes */}
                <div>
                  <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">
                    {L ? 'Notes' : 'নোট'}
                  </label>
                  <input value={form.notes} onChange={e => set('notes', e.target.value)}
                    placeholder={L ? 'Optional note…' : 'ঐচ্ছিক মন্তব্য…'}
                    className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
              </div>
              {/* Footer */}
              <div className="flex gap-2 px-5 pb-5">
                <button onClick={() => { setModal(false); setForm(BLANK); setErrors({}); }}
                  className="flex-1 bg-surface-high border border-outline-var text-on-surface font-semibold rounded-xl py-3 hover:bg-surface-highest transition-colors">
                  {L ? 'Cancel' : 'বাতিল'}
                </button>
                <motion.button whileTap={{ scale: .97 }}
                  onClick={() => { if (validate()) createMutation.mutate(form); }}
                  disabled={createMutation.isPending}
                  className="flex-1 bg-primary text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 disabled:opacity-50 transition-all">
                  {createMutation.isPending
                    ? <><span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span>{L ? 'Saving…' : 'সংরক্ষণ…'}</>
                    : <><span className="material-symbols-outlined !text-[16px]">person_add</span>{L ? 'Add Customer' : 'যোগ করুন'}</>}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
