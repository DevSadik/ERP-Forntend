import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBrandAuth } from '../../context/BrandAuthContext';
import { useTheme } from '../../context/ThemeContext';

const NAV = [
  { to: '/supplier/dashboard', icon: 'dashboard',   label: 'ড্যাশবোর্ড'   },
  { to: '/supplier/products',  icon: 'inventory_2', label: 'পণ্য তালিকা'  },
  { to: '/supplier/profile',   icon: 'business',    label: 'কোম্পানি প্রোফাইল' },
];

export default function SupplierLayout() {
  const { brand, logout } = useBrandAuth();
  const { dark, toggle }  = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/v1','') || 'http://localhost:5000';

  return (
    <div className="flex h-screen bg-background text-on-surface overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen z-50 w-72 bg-surface border-r border-outline-var flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-outline-var">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#065f46] flex items-center justify-center shadow-primary-glow flex-shrink-0">
            <span className="material-symbols-outlined text-white !text-[20px]">storefront</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-label-md font-bold text-primary leading-none truncate">{brand?.companyName}</p>
            <p className="text-label-sm text-on-surface-var mt-0.5">Supplier Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-body-md transition-all ${isActive ? 'bg-primary-container text-primary font-semibold' : 'text-on-surface-var hover:bg-surface-high hover:text-on-surface'}`}>
              <span className="material-symbols-outlined !text-[20px]">{icon}</span>{label}
            </NavLink>
          ))}
        </nav>

        {/* Add product CTA */}
        <div className="px-4 py-3 border-t border-outline-var">
          <button onClick={() => { navigate('/supplier/products/new'); setMobileOpen(false); }}
            className="w-full bg-primary text-white font-bold rounded-xl py-3 text-body-md flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 transition-all">
            <span className="material-symbols-outlined !text-[18px]">add</span>নতুন পণ্য যোগ করুন
          </button>
        </div>

        {/* Brand info & logout */}
        <div className="px-4 py-3 border-t border-outline-var flex items-center gap-3">
          {brand?.logo ? (
            <img src={`${API_BASE}/uploads/${brand.logo}`} className="w-9 h-9 rounded-full object-cover border border-outline-var flex-shrink-0" alt="logo" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-label-md">{brand?.companyName?.[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-label-md font-semibold text-on-surface truncate">{brand?.companyName}</p>
            <p className="text-label-sm text-on-surface-var">সাপ্লায়ার</p>
          </div>
          <button onClick={logout} className="p-1.5 text-on-surface-var hover:text-error transition-colors rounded-lg" title="লগআউট">
            <span className="material-symbols-outlined !text-[18px]">logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 lg:ml-72">
        <header className="h-14 flex items-center justify-between px-4 bg-surface border-b border-outline-var flex-shrink-0">
          <button className="lg:hidden p-2 rounded-lg hover:bg-surface-high text-on-surface-var" onClick={() => setMobileOpen(true)}>
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={toggle} className="p-2 rounded-full text-on-surface-var hover:bg-surface-high transition-colors">
              <span className="material-symbols-outlined !text-[20px]">{dark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-label-sm">{brand?.companyName?.[0]}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
