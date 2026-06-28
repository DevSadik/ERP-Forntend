import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PLAN_COLOR = {
  trial: 'bg-warning/15 text-warning border border-warning/20',
  basic: 'bg-success/15 text-success border border-success/20',
  pro:   'bg-primary/15 text-primary border border-primary/20',
};

export default function AdminShops() {
  const [search, setSearch] = useState('');
  const [manageShop, setManageShop] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-shops'],
    queryFn: () => api.get('/admin/shops').then(r => r.data.data),
  });

  const shops = (data || []).filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-headline-md font-black text-on-surface">All Shops</h1>
        <p className="text-body-md text-on-surface-var mt-0.5">
          {shops.length} registered shop{shops.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var !text-[18px]">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="w-full bg-surface border border-outline-var rounded-xl pl-9 pr-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary transition-all" />
      </div>

      <div className="bg-surface border border-outline-var rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-outline-var bg-surface-low text-label-sm text-on-surface-var font-semibold uppercase tracking-wide">
          <div className="col-span-3">Shop</div>
          <div className="col-span-3">Owner</div>
          <div className="col-span-2">Plan</div>
          <div className="col-span-2">Expiry</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-on-surface-var">Loading…</div>
        ) : shops.length === 0 ? (
          <div className="p-12 text-center text-on-surface-var">
            <span className="material-symbols-outlined !text-[48px] opacity-30 block mb-3">storefront</span>
            <p>No shops found.</p>
          </div>
        ) : (
          shops.map((s, i) => (
            <motion.div key={s._id}
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*.03 }}
              className={`flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 items-center ${i < shops.length-1 ? 'border-b border-outline-var' : ''} hover:bg-primary/3 transition-colors`}>
              <div className="sm:col-span-3 flex items-center gap-3 w-full">
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-black text-label-md">{s.name?.[0]}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-body-md font-bold text-on-surface truncate">{s.name}</p>
                  <p className="text-label-sm text-on-surface-var truncate">{s.email}</p>
                </div>
              </div>
              <div className="sm:col-span-3">
                <p className="text-body-md text-on-surface">{s.ownerName}</p>
                <p className="text-label-sm text-on-surface-var">{s.phone || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <span className={`text-label-sm font-bold px-2 py-1 rounded-full capitalize ${PLAN_COLOR[s.plan] || PLAN_COLOR.trial}`}>
                  {s.plan}
                </span>
                {!s.isActive && <span className="ml-1 text-label-sm text-error">●</span>}
              </div>
              <div className="sm:col-span-2">
                {s.plan === 'trial' ? (
                  <p className="text-label-sm text-on-surface-var">
                    {s.trialDaysLeft > 0 ? `${s.trialDaysLeft}d trial left` : '⚠ Trial expired'}
                  </p>
                ) : s.planExpires ? (
                  <p className="text-label-sm text-on-surface-var">
                    till {format(new Date(s.planExpires), 'dd MMM yyyy')}
                  </p>
                ) : <p className="text-label-sm text-on-surface-var">—</p>}
              </div>
              <div className="sm:col-span-2 sm:text-right w-full">
                <button onClick={() => setManageShop(s)}
                  className="bg-primary text-white text-label-md font-bold px-3 py-1.5 rounded-lg hover:brightness-110 transition-all">
                  Manage Plan
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Manage Plan Modal */}
      <AnimatePresence>
        {manageShop && (
          <ManagePlanModal shop={manageShop} onClose={() => setManageShop(null)}
            onSaved={() => { qc.invalidateQueries(['admin-shops']); setManageShop(null); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Manage Plan Modal ─────────────────────────────────────────────────────────
function ManagePlanModal({ shop, onClose, onSaved }) {
  const [plan, setPlan]     = useState(shop.plan === 'trial' ? 'pro' : shop.plan);
  const [months, setMonths] = useState(1);

  const mutation = useMutation({
    mutationFn: (body) => api.put(`/admin/shops/${shop._id}/plan`, body),
    onSuccess: () => { toast.success(`${shop.name} → ${plan} plan activated!`); onSaved(); },
    onError: e => toast.error(e.response?.data?.message || 'Failed.'),
  });

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div initial={{ scale:.95, y:10 }} animate={{ scale:1, y:0 }} exit={{ scale:.95, opacity:0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-surface border border-outline-var rounded-2xl shadow-modal p-6">

        <div className="flex items-center justify-between mb-1">
          <h2 className="text-headline-sm font-bold text-on-surface">Manage Plan</h2>
          <button onClick={onClose} className="text-on-surface-var hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <p className="text-body-md text-on-surface-var mb-5">{shop.name} — {shop.phone}</p>

        {/* Current status */}
        <div className="bg-surface-high rounded-xl p-3 mb-5">
          <p className="text-label-sm text-on-surface-var">Current plan</p>
          <p className="text-body-md font-bold text-on-surface capitalize">
            {shop.plan}
            {shop.plan === 'trial' && ` (${shop.trialDaysLeft > 0 ? shop.trialDaysLeft + 'd left' : 'expired'})`}
          </p>
        </div>

        {/* Plan select */}
        <label className="block text-label-sm font-semibold text-on-surface-var mb-2 uppercase tracking-wide">Select Plan</label>
        <div className="flex gap-2 mb-4">
          {['basic','pro'].map(p => (
            <button key={p} onClick={() => setPlan(p)}
              className={`flex-1 py-2.5 rounded-xl text-label-md font-bold capitalize transition-all ${plan === p ? 'bg-primary text-white shadow-primary-glow' : 'bg-surface-high border border-outline-var text-on-surface-var'}`}>
              {p}
            </button>
          ))}
        </div>

        {/* Duration */}
        <label className="block text-label-sm font-semibold text-on-surface-var mb-2 uppercase tracking-wide">Duration (months)</label>
        <div className="flex gap-2 mb-6">
          {[1,3,6,12].map(m => (
            <button key={m} onClick={() => setMonths(m)}
              className={`flex-1 py-2.5 rounded-xl text-label-md font-bold transition-all ${months === m ? 'bg-primary text-white shadow-primary-glow' : 'bg-surface-high border border-outline-var text-on-surface-var'}`}>
              {m}
            </button>
          ))}
        </div>

        <button onClick={() => mutation.mutate({ plan, months })} disabled={mutation.isPending}
          className="w-full bg-primary text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 disabled:opacity-50 transition-all">
          {mutation.isPending
            ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>Saving…</>
            : <><span className="material-symbols-outlined !text-[18px]">check_circle</span>Activate {plan} for {months} month{months>1?'s':''}</>}
        </button>

        {/* Deactivate / Reactivate */}
        <button
          onClick={() => mutation.mutate({ isActive: !shop.isActive })}
          className={`w-full mt-2 font-semibold rounded-xl py-2.5 transition-all ${shop.isActive ? 'text-error hover:bg-error/10' : 'text-success hover:bg-success/10'}`}>
          {shop.isActive ? 'Deactivate Account' : 'Reactivate Account'}
        </button>
      </motion.div>
    </motion.div>
  );
}
