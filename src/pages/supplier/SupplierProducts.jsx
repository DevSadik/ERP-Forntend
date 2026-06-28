import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import brandApi from '../../utils/brandApi';
import { formatBDT } from '../../utils/currency';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { v: '', l: 'সব' },
  { v: 'active',   l: 'অনুমোদিত' },
  { v: 'pending',  l: 'অপেক্ষমাণ' },
  { v: 'rejected', l: 'প্রত্যাখ্যাত' },
];

export default function SupplierProducts() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['brand-products', page, statusFilter, search],
    queryFn: () => brandApi.get(`/brand/products?page=${page}&limit=15${statusFilter?`&status=${statusFilter}`:''}${search?`&search=${encodeURIComponent(search)}`:''}`)
      .then(r => r.data),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: id => brandApi.delete(`/brand/products/${id}`),
    onSuccess: () => { qc.invalidateQueries(['brand-products']); toast.success('পণ্য নিষ্ক্রিয় হয়েছে।'); setDeleteId(null); },
    onError: e => toast.error(e.response?.data?.message || 'ব্যর্থ।'),
  });

  const products = data?.data || [];
  const meta     = data?.meta || {};
  const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/v1','') || 'http://localhost:5000';

  return (
    <div className="space-y-stack-lg">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">পণ্য তালিকা</h1>
          <p className="text-body-md text-on-surface-var mt-1">আপনার সব পণ্য পরিচালনা করুন।</p>
        </div>
        <button onClick={() => navigate('/supplier/products/new')}
          className="bg-primary text-white font-bold rounded-xl px-5 py-2.5 text-body-md flex items-center gap-2 shadow-primary-glow hover:brightness-110 transition-all">
          <span className="material-symbols-outlined !text-[18px]">add</span>নতুন পণ্য যোগ করুন
        </button>
      </div>

      <div className="bg-surface border border-outline-var rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-stack-md py-stack-sm border-b border-outline-var">
          <div className="relative flex-1 min-w-48">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var !text-[16px]">search</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="পণ্য বা বারকোড খুঁজুন…"
              className="w-full bg-surface-low border border-outline-var rounded-lg pl-8 pr-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(s => (
              <button key={s.v} onClick={() => { setStatusFilter(s.v); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-label-md transition-all ${statusFilter===s.v?'bg-primary text-white':'bg-surface-high text-on-surface-var hover:text-on-surface'}`}>{s.l}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-on-surface-var">
            <span className="material-symbols-outlined !text-[48px] animate-spin block mb-2">progress_activity</span>লোড হচ্ছে…
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-on-surface-var">
            <span className="material-symbols-outlined !text-[64px] block mb-3 opacity-30">inventory_2</span>
            <p className="text-body-lg font-semibold text-on-surface mb-2">কোনো পণ্য নেই</p>
            <p className="text-body-md mb-4">এখনো কোনো পণ্য যোগ করা হয়নি।</p>
            <button onClick={() => navigate('/supplier/products/new')}
              className="bg-primary text-white font-bold rounded-xl px-6 py-3 flex items-center gap-2 mx-auto shadow-primary-glow hover:brightness-110">
              <span className="material-symbols-outlined !text-[18px]">add</span>প্রথম পণ্য যোগ করুন
            </button>
          </div>
        ) : (
          <div className="divide-y divide-outline-var">
            {products.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*.04 }}
                className="flex items-center gap-3 px-stack-md py-3 hover:bg-surface-high/50 transition-colors">
                {p.images?.[0] ? (
                  <img src={`${API_BASE}/uploads/${p.images[0]}`} className="w-14 h-14 rounded-xl object-cover border border-outline-var flex-shrink-0" alt={p.name} />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-surface-high border border-outline-var flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined !text-[24px] text-on-surface-var">image_not_supported</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-semibold text-on-surface">{p.name}</p>
                  {p.nameBn && <p className="text-label-sm text-on-surface-var">{p.nameBn}</p>}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-label-sm text-primary bg-primary/10 px-2 py-0.5 rounded">{p.barcode}</span>
                    <span className="text-label-sm text-on-surface-var">{p.category}</span>
                    <span className="text-label-sm text-on-surface-var">এক কার্টনে: {p.pcsPerCarton} {p.unit}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-body-md font-bold text-primary">{formatBDT(p.mrp)}</p>
                  <p className="text-label-sm text-on-surface-var">ট্রেড: {formatBDT(p.tradePrice)}</p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`chip ${p.status==='active'?'chip-success':p.status==='pending'?'chip-warning':'chip-error'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${p.status==='active'?'bg-success':p.status==='pending'?'bg-warning':'bg-error'}`} />
                    {p.status==='active'?'অনুমোদিত':p.status==='pending'?'অপেক্ষমাণ':'প্রত্যাখ্যাত'}
                  </span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => navigate(`/supplier/products/${p._id}/edit`)}
                    className="p-2 rounded-lg hover:bg-primary/10 text-on-surface-var hover:text-primary transition-colors">
                    <span className="material-symbols-outlined !text-[18px]">edit</span>
                  </button>
                  <button onClick={() => setDeleteId(p._id)}
                    className="p-2 rounded-lg hover:bg-error/10 text-on-surface-var hover:text-error transition-colors">
                    <span className="material-symbols-outlined !text-[18px]">delete</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {meta.pages > 1 && (
          <div className="flex items-center justify-center gap-2 px-stack-md py-stack-sm border-t border-outline-var">
            <button disabled={page === 1} onClick={() => setPage(p => p-1)}
              className="p-2 rounded-lg disabled:opacity-30 hover:bg-surface-high text-on-surface-var transition-colors">
              <span className="material-symbols-outlined !text-[18px]">chevron_left</span>
            </button>
            <span className="text-label-md text-on-surface-var">{page} / {meta.pages}</span>
            <button disabled={page >= meta.pages} onClick={() => setPage(p => p+1)}
              className="p-2 rounded-lg disabled:opacity-30 hover:bg-surface-high text-on-surface-var transition-colors">
              <span className="material-symbols-outlined !text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
              className="bg-surface border border-outline-var rounded-2xl p-8 max-w-sm w-full shadow-modal">
              <span className="material-symbols-outlined !text-[48px] text-error block mb-3">delete</span>
              <h3 className="text-headline-sm font-bold text-on-surface mb-2">পণ্য নিষ্ক্রিয় করবেন?</h3>
              <p className="text-body-md text-on-surface-var mb-6">পণ্যটি লুকানো হবে। ডেটা মুছবে না।</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteId(null)} className="flex-1 bg-surface-high border border-outline-var text-on-surface rounded-xl py-3 font-semibold">বাতিল</button>
                <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}
                  className="flex-1 bg-error text-white rounded-xl py-3 font-bold hover:brightness-110 disabled:opacity-50">
                  {deleteMutation.isPending ? 'মুছছে…' : 'নিষ্ক্রিয় করুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
