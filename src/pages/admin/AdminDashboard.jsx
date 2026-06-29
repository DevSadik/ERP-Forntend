import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../../utils/api';

const fmt = n => '৳' + (parseFloat(n)||0).toLocaleString('en-BD', { minimumFractionDigits: 0 });

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: shopsData } = useQuery({
    queryKey: ['admin-shops'],
    queryFn: () => api.get('/admin/shops').then(r => r.data.data),
  });

  const { data: centralData } = useQuery({
    queryKey: ['central-products'],
    queryFn: () => api.get('/admin/central?limit=1').then(r => r.data.meta),
  });

  const shops = shopsData || [];
  const activeShops  = shops.filter(s => s.isActive).length;
  const trialShops   = shops.filter(s => s.plan === 'trial').length;
  const centralCount = centralData?.total || 0;

  const CARDS = [
    { icon:'storefront', label:'Total Shops',    value: shops.length,  color:'text-primary',  bg:'bg-primary/10',  to:'/admin/shops' },
    { icon:'check_circle', label:'Active Shops', value: activeShops,   color:'text-success',  bg:'bg-success/10',  to:'/admin/shops' },
    { icon:'hourglass_empty', label:'Trial Shops', value: trialShops,  color:'text-warning',  bg:'bg-warning/10',  to:'/admin/shops' },
    { icon:'inventory_2', label:'Central Products', value: centralCount, color:'text-blue-400', bg:'bg-blue-500/10', to:'/admin/central-products' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome */}
      <div>
        <h1 className="text-headline-lg font-black text-on-surface">
          Welcome, {user?.name} 👋
        </h1>
        <p className="text-body-md text-on-surface-var mt-1">
          Mini Manager ERP Admin Panel — manage products, shops and users.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((c, i) => (
          <motion.div key={c.label}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*.08 }}
            onClick={() => navigate(c.to)}
            className="bg-surface border border-outline-var rounded-2xl p-5 cursor-pointer hover:border-primary/40 hover:shadow-primary-glow transition-all">
            <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
              <span className={`material-symbols-outlined !text-[22px] ${c.color}`}
                style={{ fontVariationSettings:"'FILL' 1" }}>{c.icon}</span>
            </div>
            <p className="text-headline-md font-black text-on-surface">{c.value}</p>
            <p className="text-label-sm text-on-surface-var mt-0.5">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-headline-sm font-bold text-on-surface mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon:'edit_note',   label:'Add Products to Central DB', desc:'Scan barcode & add product info', to:'/admin/product-entry', color:'bg-primary' },
            { icon:'inventory_2', label:'View Central Products',       desc:'Browse & edit central DB',        to:'/admin/central-products', color:'bg-blue-600' },
            { icon:'person_add',  label:'Add Admin User',              desc:'Create manager or staff account', to:'/admin/register', color:'bg-purple-600' },
          ].map((a, i) => (
            <motion.button key={a.to}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2+i*.08 }}
              onClick={() => navigate(a.to)}
              className="flex items-start gap-4 bg-surface border border-outline-var rounded-2xl p-5 text-left hover:border-primary/40 transition-all group">
              <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center flex-shrink-0 group-hover:brightness-110 transition-all`}>
                <span className="material-symbols-outlined !text-[20px] text-white">{a.icon}</span>
              </div>
              <div>
                <p className="text-body-md font-bold text-on-surface">{a.label}</p>
                <p className="text-label-sm text-on-surface-var mt-0.5">{a.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent shops */}
      {shops.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-headline-sm font-bold text-on-surface">Recent Shops</h2>
            <button onClick={() => navigate('/admin/shops')}
              className="text-label-sm text-primary hover:underline">View all →</button>
          </div>
          <div className="bg-surface border border-outline-var rounded-2xl overflow-hidden">
            {shops.slice(0,5).map((s, i) => (
              <div key={s._id} className={`flex items-center gap-4 px-5 py-3.5 ${i < shops.slice(0,5).length-1 ? 'border-b border-outline-var' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-black text-label-md">{s.name?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-semibold text-on-surface truncate">{s.name}</p>
                  <p className="text-label-sm text-on-surface-var">{s.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-label-sm font-bold capitalize px-2 py-0.5 rounded-full ${s.plan === 'trial' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'}`}>
                    {s.plan}
                  </span>
                  <p className="text-label-sm text-on-surface-var mt-0.5">
                    {s.trialDaysLeft > 0 ? `${s.trialDaysLeft}d left` : 'expired'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
