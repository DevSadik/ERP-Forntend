import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useShopAuth } from '../../context/ShopAuthContext';
import api from '../../utils/api';

export default function TopBar({ dark, onThemeToggle, onMobileMenuOpen }) {
  const { user: adminUser } = useAuth();
  const { shop } = useShopAuth();
  const user = shop ? { name: shop.name, role: 'দোকান' } : adminUser;
  const navigate  = useNavigate();
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery]     = useState('');
  const notifRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, read: true })));
    } catch { /* ignore */ }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/inventory?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const typeIcon  = { warning: 'warning', success: 'check_circle', error: 'error', info: 'info' };
  const typeColor = { warning: 'text-warning', success: 'text-success', error: 'text-error', info: 'text-primary' };

  return (
    <header className="h-16 flex items-center justify-between px-container-padding bg-surface border-b border-outline-var z-30 sticky top-0 flex-shrink-0">

      <div className="flex items-center gap-stack-md flex-1 max-w-xl">
        {/* Mobile menu button */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-surface-high text-on-surface-var"
          onClick={onMobileMenuOpen}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Mobile logo — shown only on mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <img src="/logo.svg" alt="MiniBazar" className="w-8 h-8" />
          <span className="text-body-md font-black text-primary">MiniBazar ERP</span>
        </div>

        {/* Search bar — desktop */}
        <div className="relative w-full hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var !text-[18px]">search</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full bg-surface-low border border-outline-var rounded-full py-2 pl-10 pr-4 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
            placeholder="পণ্য খুঁজুন… (Enter)"
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-4">
        {/* Theme toggle */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={onThemeToggle}
          className="p-2 rounded-full text-on-surface-var hover:bg-surface-high transition-colors"
          title="থিম পরিবর্তন">
          <span className="material-symbols-outlined !text-[20px]">{dark ? 'light_mode' : 'dark_mode'}</span>
        </motion.button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => { setNotifOpen(o => !o); if (!notifOpen) fetchNotifications(); }}
            className="p-2 rounded-full text-on-surface-var hover:bg-surface-high transition-colors relative">
            <span className="material-symbols-outlined !text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-0 mt-2 w-80 bg-surface-high border border-outline-var rounded-xl shadow-modal overflow-hidden z-50"
              >
                <div className="px-stack-md py-stack-sm border-b border-outline-var flex items-center justify-between">
                  <span className="text-label-md font-semibold text-on-surface">
                    নোটিফিকেশন {unreadCount > 0 && <span className="text-primary">({unreadCount})</span>}
                  </span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-label-sm text-primary hover:underline">
                      সব পড়া হয়েছে
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-on-surface-var">
                      <span className="material-symbols-outlined !text-[32px] block mb-2 opacity-40">notifications_none</span>
                      <p className="text-label-sm">কোনো নোটিফিকেশন নেই</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n._id}
                        className={`px-stack-md py-stack-sm flex items-start gap-3 border-b border-outline-var/50 last:border-0 cursor-pointer ${n.read ? '' : 'bg-primary/5'}`}>
                        <span className={`material-symbols-outlined !text-[18px] mt-0.5 flex-shrink-0 ${typeColor[n.type] || 'text-primary'}`}>
                          {typeIcon[n.type] || 'info'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-md text-on-surface leading-snug">{n.message}</p>
                          <p className="text-label-sm text-on-surface-var mt-0.5">
                            {new Date(n.createdAt).toLocaleString('bn-BD')}
                          </p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-8 bg-outline-var mx-2 hidden sm:block" />

        {/* User info */}
        <div className="hidden sm:flex items-center gap-stack-sm cursor-pointer" onClick={() => navigate(shop ? '/profile' : '/settings')}>
          <div className="text-right hidden xl:block">
            <p className="text-label-md text-on-surface leading-none">{user?.name || 'Wahidsadik'}</p>
            <p className="text-label-sm text-on-surface-var capitalize">{user?.role || 'admin'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
            <span className="text-primary font-bold text-label-md">
              {user?.name?.[0]?.toUpperCase() || 'W'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
