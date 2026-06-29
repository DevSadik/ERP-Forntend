import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function PendingProducts() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pending-products'],
    queryFn: () => api.get('/admin/pending').then(r => r.data.data),
  });
  const items = data || [];

  const approve = useMutation({
    mutationFn: id => api.put(`/admin/pending/${id}/approve`),
    onSuccess: () => {
      qc.invalidateQueries(['pending-products']);
      qc.invalidateQueries(['central-products']);
      qc.invalidateQueries(['central-meta']);
      toast.success('✅ অনুমোদিত — কেন্দ্রীয় ক্যাটালগে যোগ হয়েছে');
    },
    onError: e => toast.error(e.response?.data?.message || 'ব্যর্থ।'),
  });

  const reject = useMutation({
    mutationFn: id => api.put(`/admin/pending/${id}/reject`),
    onSuccess: () => {
      qc.invalidateQueries(['pending-products']);
      toast('বাতিল করা হয়েছে', { icon: '🚫' });
    },
    onError: e => toast.error(e.response?.data?.message || 'ব্যর্থ।'),
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-headline-md font-black text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">pending_actions</span>
          পেন্ডিং রিভিউ
        </h1>
        <p className="text-body-md text-on-surface-var mt-1">
          দোকানদারদের যোগ করা নতুন বারকোড পণ্য। অনুমোদন করলে সব দোকান এটি ব্যবহার করতে পারবে।
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-on-surface-var">লোড হচ্ছে…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined !text-[56px] text-on-surface-var/40">inbox</span>
          <p className="text-body-lg text-on-surface-var mt-3">কোনো পেন্ডিং পণ্য নেই</p>
          <p className="text-body-sm text-on-surface-var/70 mt-1">নতুন বারকোড পণ্য যোগ হলে এখানে দেখা যাবে।</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(p => (
            <motion.div key={p._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-outline-var rounded-2xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-title-md font-bold text-on-surface truncate">{p.name}</h3>
                  <span className="text-label-sm font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.barcode}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-body-sm text-on-surface-var flex-wrap">
                  {p.company &&  <span>🏢 {p.company}</span>}
                  {p.category && <span>📂 {p.category}</span>}
                  <span>📏 {p.unit}</span>
                  {p.mrp > 0 && <span className="font-semibold text-on-surface">৳{p.mrp}</span>}
                </div>
                {p.shopName && (
                  <p className="text-label-sm text-on-surface-var/70 mt-1">যোগ করেছে: {p.shopName}</p>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => reject.mutate(p._id)} disabled={reject.isLoading}
                  className="px-4 py-2.5 rounded-xl bg-error/10 border border-error/30 text-error font-bold text-sm hover:bg-error/20 disabled:opacity-50 transition-all flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-[18px]">close</span>
                  বাতিল
                </button>
                <button onClick={() => approve.mutate(p._id)} disabled={approve.isLoading}
                  className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5">
                  <span className="material-symbols-outlined !text-[18px]">check</span>
                  অনুমোদন
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
