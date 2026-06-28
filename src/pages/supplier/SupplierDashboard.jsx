import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useBrandAuth } from '../../context/BrandAuthContext';
import brandApi from '../../utils/brandApi';
import { formatBDT } from '../../utils/currency';

export default function SupplierDashboard() {
  const { brand, logout } = useBrandAuth();
  const navigate = useNavigate();

  const { data: productsData } = useQuery({
    queryKey: ['brand-products-summary'],
    queryFn: () => brandApi.get('/brand/products?limit=100').then(r => r.data),
  });

  const products = productsData?.data || [];
  const totalProducts = productsData?.meta?.total || 0;
  const activeProducts  = products.filter(p => p.status === 'active').length;
  const pendingProducts = products.filter(p => p.status === 'pending').length;
  const rejectedProducts = products.filter(p => p.status === 'rejected').length;

  const stats = [
    { label: 'মোট পণ্য',       value: totalProducts,    icon: 'inventory_2',   color: 'text-primary',  bg: 'bg-primary/10' },
    { label: 'অনুমোদিত',       value: activeProducts,   icon: 'check_circle',  color: 'text-success',  bg: 'bg-success/10' },
    { label: 'অপেক্ষমাণ',      value: pendingProducts,  icon: 'pending',       color: 'text-warning',  bg: 'bg-warning/10' },
    { label: 'প্রত্যাখ্যাত',   value: rejectedProducts, icon: 'cancel',        color: 'text-error',    bg: 'bg-error/10'   },
  ];

  return (
    <div className="space-y-stack-lg">
      {/* Welcome banner */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-stack-md flex items-center gap-stack-md">
        {brand?.logo ? (
          <img src={`${process.env.REACT_APP_API_URL?.replace('/api/v1','')}/uploads/${brand.logo}`} alt="logo"
            className="w-16 h-16 rounded-xl object-cover border-2 border-primary/30" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary !text-[32px]">storefront</span>
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-headline-md font-bold text-on-surface">{brand?.companyName}</h2>
          <p className="text-body-md text-on-surface-var mt-0.5">{brand?.tradeCategory} • {brand?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="chip chip-success"><span className="w-1.5 h-1.5 rounded-full bg-success" />অনুমোদিত সাপ্লায়ার</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/supplier/products/new')}
            className="bg-primary text-white font-bold rounded-xl px-4 py-2.5 text-body-md flex items-center gap-2 shadow-primary-glow hover:brightness-110 transition-all">
            <span className="material-symbols-outlined !text-[18px]">add</span>
            <span className="hidden sm:inline">নতুন পণ্য যোগ করুন</span>
          </button>
          <button onClick={() => navigate('/supplier/profile')}
            className="bg-surface-high border border-outline-var text-on-surface rounded-xl px-3 py-2.5 flex items-center gap-1 hover:bg-surface-highest transition-all">
            <span className="material-symbols-outlined !text-[18px]">settings</span>
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*.07 }}
            className="bg-surface border border-outline-var rounded-xl p-stack-md hover:border-primary/30 transition-all">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <span className={`material-symbols-outlined !text-[20px] ${s.color}`}>{s.icon}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-label-sm text-on-surface-var mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent products */}
      <div className="bg-surface border border-outline-var rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-stack-md py-stack-sm border-b border-outline-var">
          <h3 className="text-headline-sm font-semibold text-on-surface">সাম্প্রতিক পণ্য</h3>
          <button onClick={() => navigate('/supplier/products')} className="text-label-md text-primary hover:underline flex items-center gap-1">
            সব দেখুন <span className="material-symbols-outlined !text-[14px]">arrow_forward</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-low">
                <th className="text-left px-4 py-3 text-label-sm text-on-surface-var uppercase tracking-wide">পণ্যের নাম</th>
                <th className="text-left px-4 py-3 text-label-sm text-on-surface-var uppercase tracking-wide">বারকোড</th>
                <th className="text-left px-4 py-3 text-label-sm text-on-surface-var uppercase tracking-wide">MRP</th>
                <th className="text-left px-4 py-3 text-label-sm text-on-surface-var uppercase tracking-wide">অবস্থা</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 8).map((p, i) => (
                <motion.tr key={p._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*.04 }}
                  className="border-t border-outline-var hover:bg-surface-high/50 cursor-pointer"
                  onClick={() => navigate(`/supplier/products/${p._id}/edit`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={`${process.env.REACT_APP_API_URL?.replace('/api/v1','')}/uploads/${p.images[0]}`}
                          className="w-9 h-9 rounded-lg object-cover border border-outline-var" alt={p.name} />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-surface-high border border-outline-var flex items-center justify-center">
                          <span className="material-symbols-outlined !text-[18px] text-on-surface-var">image</span>
                        </div>
                      )}
                      <div>
                        <p className="text-body-md font-semibold text-on-surface">{p.name}</p>
                        <p className="text-label-sm text-on-surface-var">{p.nameBn || p.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-label-md text-primary">{p.barcode}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{formatBDT(p.mrp)}</td>
                  <td className="px-4 py-3">
                    <span className={`chip ${p.status==='active'?'chip-success':p.status==='pending'?'chip-warning':'chip-error'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status==='active'?'bg-success':p.status==='pending'?'bg-warning':'bg-error'}`} />
                      {p.status==='active'?'অনুমোদিত':p.status==='pending'?'অপেক্ষমাণ':'প্রত্যাখ্যাত'}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-on-surface-var">
                  <span className="material-symbols-outlined !text-[48px] block mb-2 opacity-30">inventory_2</span>
                  এখনো কোনো পণ্য যোগ করা হয়নি।
                  <br />
                  <button onClick={() => navigate('/supplier/products/new')} className="text-primary font-semibold mt-2 hover:underline">প্রথম পণ্য যোগ করুন →</button>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
