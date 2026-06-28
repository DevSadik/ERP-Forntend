import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const NAV = [
  { to: '/admin',                  icon: 'dashboard',    label: 'Dashboard',        end: true },
  { to: '/admin/central-products', icon: 'inventory_2',  label: 'Central Products'  },
  { to: '/admin/product-entry',    icon: 'edit_note',    label: 'Product Entry'     },
  { to: '/admin/shops',            icon: 'storefront',   label: 'All Shops'         },
  { to: '/admin/users',            icon: 'group',        label: 'Admin Users'       },
  { to: '/admin/settings',         icon: 'settings',     label: 'Settings'          },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  // Protect: only admin/manager/staff can access
  if (!user) return <Navigate to="/admin/login" replace />;

  return (
    <div className="flex h-screen bg-background text-on-surface overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration:.25, ease:[.4,0,.2,1] }}
        className="flex-shrink-0 bg-surface border-r border-outline-var flex flex-col">

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-outline-var min-h-[64px]">
          <img src="/logo.svg" alt="MiniBazar" className="w-9 h-9 flex-shrink-0"
            style={{ filter:'drop-shadow(0 0 6px rgba(16,185,129,0.3))' }} />
          {!collapsed && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}>
              <p className="text-body-md font-black text-primary leading-none">MiniBazar ERP</p>
              <p className="text-label-sm text-on-surface-var">Admin Panel</p>
            </motion.div>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            className="ml-auto p-1.5 rounded-lg hover:bg-surface-high text-on-surface-var flex-shrink-0">
            <span className="material-symbols-outlined !text-[16px]">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-body-md transition-all group relative ${
                  isActive
                    ? 'bg-primary/15 text-primary'
                    : 'text-on-surface-var hover:bg-surface-high hover:text-on-surface'
                }`
              }>
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined !text-[20px] flex-shrink-0"
                    style={isActive ? { fontVariationSettings:"'FILL' 1" } : {}}>
                    {icon}
                  </span>
                  {!collapsed && <span>{label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-surface-highest text-on-surface text-label-md rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-modal transition-opacity">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-outline-var space-y-1">
          {/* Add user shortcut */}
          {!collapsed && (
            <button onClick={() => navigate('/admin/register')}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-body-md font-semibold text-on-surface-var hover:bg-surface-high hover:text-primary transition-all">
              <span className="material-symbols-outlined !text-[20px]">person_add</span>
              Add Admin User
            </button>
          )}

          {/* Theme toggle */}
          <button onClick={toggle}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-body-md font-semibold text-on-surface-var hover:bg-surface-high transition-all">
            <span className="material-symbols-outlined !text-[20px]">{dark ? 'light_mode' : 'dark_mode'}</span>
            {!collapsed && (dark ? 'Light Mode' : 'Dark Mode')}
          </button>

          {/* User info + logout */}
          <div className={`flex items-center gap-3 px-3 py-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-black text-label-md">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-label-md font-semibold text-on-surface truncate">{user?.name}</p>
                  <p className="text-label-sm text-on-surface-var capitalize">{user?.role}</p>
                </div>
                <button onClick={() => { logout(); navigate('/admin/login'); }}
                  className="p-1.5 text-on-surface-var hover:text-error transition-colors rounded-lg hover:bg-error/10"
                  title="Logout">
                  <span className="material-symbols-outlined !text-[18px]">logout</span>
                </button>
              </>
            )}
          </div>

          {!collapsed && (
            <p className="text-[10px] text-on-surface-var/50 text-center px-3 pt-1">
              © 2026 MiniBazar ERP by Wahidsadik Aditto
            </p>
          )}
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-6 bg-surface border-b border-outline-var flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined !text-[20px] text-on-surface-var">admin_panel_settings</span>
            <h2 className="text-body-md font-bold text-on-surface">Admin Panel</h2>
            {/* Breadcrumb indicator */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg px-2 py-0.5">
              <span className="text-label-sm text-primary font-semibold capitalize">{user?.role}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick add user button */}
            <button onClick={() => navigate('/admin/register')}
              className="flex items-center gap-1.5 bg-primary text-white text-label-md font-bold px-3 py-2 rounded-xl shadow-primary-glow hover:brightness-110 transition-all">
              <span className="material-symbols-outlined !text-[16px]">person_add</span>
              <span className="hidden sm:inline">New User</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:.2 }}>
            <Outlet />
          </motion.div>
        </main>

        {/* Footer */}
        <div className="border-t border-outline-var bg-surface px-6 py-2">
          <p className="text-[11px] text-on-surface-var text-center">
            © 2026 <span className="text-primary font-semibold">MiniBazar ERP</span> — Admin Panel — by Wahidsadik Aditto
          </p>
        </div>
      </div>
    </div>
  );
}
