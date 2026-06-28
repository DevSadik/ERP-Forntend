import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useShopAuth } from '../../context/ShopAuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import TopBar from './TopBar';

const getBottomNav = (lang) => [
  { to: '/',          icon: 'dashboard',  label: lang === 'en' ? 'Home'      : 'হোম'        },
  { to: '/stock-in',  icon: 'add_box',    label: lang === 'en' ? 'Stock In'  : 'স্টক-ইন'    },
  { to: '/sales',     icon: 'storefront', label: lang === 'en' ? 'Sales'     : 'বিক্রয়'     },
  { to: '/inventory', icon: 'analytics',  label: lang === 'en' ? 'Inventory' : 'ইনভেন্টরি'  },
  { to: '/products',  icon: 'category',   label: lang === 'en' ? 'Products'  : 'পণ্য'       },
  { to: '/customers',  icon: 'people',    label: lang === 'en' ? 'Customers' : 'গ্রাহক'     },
];

const NAV_LABELS = {
  en: {
    dashboard: 'Dashboard',
    stockIn:   'Stock In',
    sales:     'Sales',
    inventory: 'Inventory',
    products:  'Products',
    productEntry: 'Product Entry',
    centralProducts: 'Central Products',
    customers:    'Customers',
    profile: 'My Profile',
    settings: 'Settings',
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    stockIn:   'স্টক-ইন',
    sales:     'বিক্রয়',
    inventory: 'ইনভেন্টরি',
    products:  'পণ্য',
    productEntry: 'পণ্য এন্ট্রি',
    centralProducts: 'কেন্দ্রীয় পণ্য',
    customers:    'গ্রাহক',
    profile: 'আমার প্রোফাইল',
    settings: 'সেটিংস',
  },
};

const getSidebarNav = (lang) => [
  { to: '/',               icon: 'dashboard',              label: NAV_LABELS[lang]?.dashboard        },
  { to: '/stock-in',       icon: 'add_box',                label: NAV_LABELS[lang]?.stockIn          },
  { to: '/sales',          icon: 'storefront',             label: NAV_LABELS[lang]?.sales            },
  { to: '/inventory',      icon: 'analytics',              label: NAV_LABELS[lang]?.inventory        },
  { to: '/products',       icon: 'category',               label: NAV_LABELS[lang]?.products         },
  { to: '/customers',      icon: 'people',                 label: NAV_LABELS[lang]?.customers        },
  { to: '/profile',        icon: 'manage_accounts',        label: NAV_LABELS[lang]?.profile,         shopOnly: true  },
];

export default function AppLayout() {
  const { user: adminUser, logout: adminLogout } = useAuth();
  const { shop, logout: shopLogout } = useShopAuth();
  const { dark, toggle } = useTheme();
  const { lang } = useLanguage();

  // Unified identity: shop owner OR admin
  const isShop = !!shop;
  const user = isShop
    ? { name: shop.name, role: 'shop', ownerName: shop.ownerName }
    : adminUser;
  const logout = () => { if (isShop) { shopLogout(); window.location.href = '/shop/login'; } else { adminLogout(); } };
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-background text-on-surface overflow-hidden">

      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="fixed top-0 left-0 h-screen z-50 bg-surface border-r border-outline-var hidden lg:flex flex-col"
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo */}
        <div className="flex items-center gap-stack-md px-stack-md py-stack-lg border-b border-outline-var min-h-[64px]">
          <div className="flex-shrink-0">
            <img src="/logo.svg" alt="MiniBazar ERP"
              className={`transition-all duration-300 ${collapsed ? 'w-9 h-9' : 'w-11 h-11'}`}
              style={{ filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.35))' }} />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-headline-sm font-black text-primary leading-none tracking-tight">MiniBazar ERP</h1>
              <p className="text-label-sm text-on-surface-var">মিষ্টান্ন ম্যানেজমেন্ট</p>
            </motion.div>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            className="ml-auto flex items-center justify-center w-7 h-7 rounded-lg hover:bg-surface-high text-on-surface-var">
            <span className="material-symbols-outlined !text-[16px]">{collapsed ? 'chevron_right' : 'chevron_left'}</span>
          </button>
        </div>

        {/* CTA */}
        <div className={`px-stack-md pt-stack-md ${collapsed ? 'px-2' : ''}`}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/stock-in')}
            className={`w-full flex items-center justify-center gap-2 bg-primary text-white font-bold rounded-xl py-stack-sm shadow-primary-glow hover:brightness-110 transition-all ${collapsed ? 'px-2' : 'px-stack-md'}`}>
            <span className="material-symbols-outlined !text-[18px]">add</span>
            {!collapsed && <span className="text-body-md">নতুন এন্ট্রি</span>}
          </motion.button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-stack-md py-stack-md space-y-1 overflow-y-auto">
          {getSidebarNav(lang).filter(item => (!item.adminOnly || user?.role === 'admin') && (!item.shopOnly || isShop)).map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `nav-item group relative ${isActive ? 'nav-active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div layoutId="sidebar-active-bg"
                      className="absolute inset-0 bg-primary-container rounded-xl -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
                  )}
                  <span className="material-symbols-outlined !text-[20px] flex-shrink-0"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                  {!collapsed && <span>{label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2 py-1 bg-surface-highest text-on-surface text-label-md rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-modal">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="border-t border-outline-var px-stack-md py-stack-md space-y-1">
          <NavLink to="/settings"
            className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}>
            <span className="material-symbols-outlined !text-[20px]">settings</span>
            {!collapsed && <span>সেটিংস</span>}
          </NavLink>
          <div className={`flex items-center gap-stack-sm pt-stack-sm ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-label-md font-bold uppercase">{user?.name?.[0] || 'W'}</span>
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-label-md text-on-surface truncate">{user?.name || 'Wahidsadik Aditto'}</p>
                  <p className="text-label-sm text-on-surface-var capitalize">{user?.role || 'admin'}</p>
                </div>
                <button onClick={logout} className="p-1 text-on-surface-var hover:text-error transition-colors rounded">
                  <span className="material-symbols-outlined !text-[18px]">logout</span>
                </button>
              </>
            )}
          </div>

          {/* Copyright */}
          {!collapsed && (
            <div className="pt-stack-sm border-t border-outline-var mt-2">
              <p className="text-[10px] text-on-surface-var text-center leading-relaxed">
                © 2026 <span className="text-primary font-semibold">MiniBazar ERP</span><br/>
                Developed by <span className="font-semibold">Wahidsadik Aditto</span><br/>
                All rights reserved.
              </p>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 lg:ml-[280px]">
        <TopBar dark={dark} onThemeToggle={toggle} onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-container-padding pb-24 lg:pb-6">
          <ExpiryBanner />
          <motion.div key={window.location.pathname}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}>
            <Outlet />
          </motion.div>
        </main>

        {/* Copyright footer — desktop */}
        <div className="hidden lg:block border-t border-outline-var bg-surface px-6 py-2">
          <p className="text-[11px] text-on-surface-var text-center">
            © 2026 <span className="text-primary font-semibold">MiniBazar ERP</span> — Developed by <span className="font-semibold text-on-surface">Wahidsadik Aditto</span> — All rights reserved.
          </p>
        </div>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-outline-var flex items-stretch"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          {getBottomNav(lang).map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className="flex-1">
              {({ isActive }) => (
                <div className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-all ${isActive ? 'text-primary' : 'text-on-surface-var'}`}>
                  <span className="material-symbols-outlined !text-[22px]"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                  <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-primary' : 'text-on-surface-var'}`}>{label}</span>
                  {isActive && <motion.div layoutId="bottom-nav-dot" className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
                </div>
              )}
            </NavLink>
          ))}
          <MoreMenu logout={logout} navigate={navigate} user={user} isShop={isShop} lang={lang} />
        </nav>
      </div>
    </div>
  );
}

function MoreMenu({ logout, navigate, user, isShop, lang }) {
  const [open, setOpen] = useState(false);
  const items = [

    ...(isShop ? [{ label: lang === 'en' ? 'My Profile' : 'আমার প্রোফাইল', icon: 'manage_accounts', to: '/profile' }] : []),
    { label: lang === 'en' ? 'Settings' : 'সেটিংস', icon: 'settings', to: '/settings' },
  ];
  return (
    <>
      <button className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-on-surface-var"
        onClick={() => setOpen(true)}>
        <span className="material-symbols-outlined !text-[22px]">more_horiz</span>
        <span className="text-[10px] font-semibold leading-none">আরো</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)} />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl border-t border-outline-var p-stack-md"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0.1, duration: 0.35 }}>
              <div className="w-10 h-1 bg-outline-var rounded-full mx-auto mb-stack-md" />
              <div className="flex items-center gap-3 mb-stack-md pb-stack-md border-b border-outline-var">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold">{user?.name?.[0] || 'W'}</span>
                </div>
                <div>
                  <p className="text-body-md font-semibold text-on-surface">{user?.name || 'Wahidsadik Aditto'}</p>
                  <p className="text-label-sm text-on-surface-var capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="space-y-1">
                {items.map(item => (
                  <button key={item.to} onClick={() => { navigate(item.to); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-stack-md py-stack-sm rounded-xl hover:bg-surface-high transition-colors text-on-surface">
                    <span className="material-symbols-outlined !text-[20px] text-primary">{item.icon}</span>
                    <span className="text-body-md font-medium">{item.label}</span>
                    <span className="material-symbols-outlined !text-[16px] text-on-surface-var ml-auto">chevron_right</span>
                  </button>
                ))}
                <button onClick={() => { logout(); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-stack-md py-stack-sm rounded-xl hover:bg-error/10 transition-colors text-error mt-2">
                  <span className="material-symbols-outlined !text-[20px]">logout</span>
                  <span className="text-body-md font-medium">লগআউট</span>
                </button>
              </div>
              {/* Copyright in mobile menu */}
              <div className="mt-4 pt-3 border-t border-outline-var text-center">
                <p className="text-[10px] text-on-surface-var">
                  © 2026 <span className="text-primary font-semibold">MiniBazar ERP</span> by <span className="font-semibold">Wahidsadik Aditto</span>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Trial / Plan expiry banner ────────────────────────────────────────────────
function ExpiryBanner() {
  const { shop, trialDaysLeft, planDaysLeft, isTrialExpired } = useShopAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  if (!shop) return null;

  // Expired — red blocking banner
  if (isTrialExpired) {
    return (
      <div className="bg-error/10 border border-error/30 rounded-2xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <span className="material-symbols-outlined !text-[28px] text-error flex-shrink-0">lock</span>
        <div className="flex-1">
          <p className="text-body-md font-bold text-on-surface">
            {lang === 'en' ? 'Your plan has expired' : 'আপনার প্ল্যানের মেয়াদ শেষ হয়েছে'}
          </p>
          <p className="text-label-sm text-on-surface-var">
            {lang === 'en'
              ? 'Please renew to Pro to continue using all features. Contact us to upgrade.'
              : 'সব সুবিধা চালু রাখতে Pro-তে renew করুন। আপগ্রেড করতে যোগাযোগ করুন।'}
          </p>
        </div>
        <button onClick={() => navigate('/profile')}
          className="bg-error text-white font-bold rounded-xl px-4 py-2 text-label-md hover:brightness-110 transition-all whitespace-nowrap">
          {lang === 'en' ? 'Renew Now' : 'এখন renew করুন'}
        </button>
      </div>
    );
  }

  // Trial ending soon (3 days or less) — warning banner
  if (shop.plan === 'trial' && trialDaysLeft > 0 && trialDaysLeft <= 3) {
    return (
      <div className="bg-warning/10 border border-warning/30 rounded-2xl p-3.5 mb-5 flex items-center gap-3">
        <span className="material-symbols-outlined !text-[22px] text-warning flex-shrink-0">schedule</span>
        <p className="text-body-md text-on-surface flex-1">
          {lang === 'en'
            ? `Trial ends in ${trialDaysLeft} day${trialDaysLeft>1?'s':''}. Upgrade to Pro to keep access.`
            : `ট্রায়াল আর ${trialDaysLeft} দিন বাকি। চালু রাখতে Pro-তে আপগ্রেড করুন।`}
        </p>
      </div>
    );
  }

  // Paid plan ending soon
  if ((shop.plan === 'pro' || shop.plan === 'basic') && shop.planExpires && planDaysLeft > 0 && planDaysLeft <= 5) {
    return (
      <div className="bg-warning/10 border border-warning/30 rounded-2xl p-3.5 mb-5 flex items-center gap-3">
        <span className="material-symbols-outlined !text-[22px] text-warning flex-shrink-0">schedule</span>
        <p className="text-body-md text-on-surface flex-1">
          {lang === 'en'
            ? `Your ${shop.plan} plan ends in ${planDaysLeft} day${planDaysLeft>1?'s':''}. Renew soon.`
            : `আপনার ${shop.plan} প্ল্যান আর ${planDaysLeft} দিন বাকি। শীঘ্রই renew করুন।`}
        </p>
      </div>
    );
  }

  return null;
}
