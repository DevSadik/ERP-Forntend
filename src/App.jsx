import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Contexts
import { AuthProvider, useAuth }           from './context/AuthContext';
import { ThemeProvider }                   from './context/ThemeContext';
import { LanguageProvider }                from './context/LanguageContext';
import { BrandAuthProvider, useBrandAuth } from './context/BrandAuthContext';
import { ShopAuthProvider, useShopAuth }   from './context/ShopAuthContext';

// ── Admin Panel ───────────────────────────────────────────────────────────────
import AdminLayout       from './components/layout/AdminLayout';
import AdminLogin        from './pages/admin/AdminLogin';
import AdminRegister     from './pages/admin/AdminRegister';
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminUsers        from './pages/admin/AdminUsers';
import AdminShops        from './pages/admin/AdminShops';
import CentralProducts   from './pages/admin/CentralProducts';
import PendingProducts   from './pages/admin/PendingProducts';
import ProductEntry      from './pages/ProductEntry';
import Settings          from './pages/Settings';

// ── Shop App ──────────────────────────────────────────────────────────────────
import AppLayout      from './components/layout/AppLayout';
import LandingPage    from './pages/LandingPage';
import Dashboard      from './pages/Dashboard';
import StockIn        from './pages/StockIn';
import Sales          from './pages/Sales';
import Inventory      from './pages/Inventory';
import Products       from './pages/Products';
import CustomerList   from './pages/customers/CustomerList';
import CustomerDetail from './pages/customers/CustomerDetail';
import PublicLedger   from './pages/customers/PublicLedger';

// ── Shop Auth ─────────────────────────────────────────────────────────────────
import ShopLogin      from './pages/shop/ShopLogin';
import ShopRegister   from './pages/shop/ShopRegister';
import ShopProfile    from './pages/shop/ShopProfile';
import ForgotPassword from './pages/shop/ForgotPassword';
import ResetPassword  from './pages/shop/ResetPassword';
import VerifyOtp      from './pages/shop/VerifyOtp';

// ── Supplier Portal ───────────────────────────────────────────────────────────
import SupplierLayout      from './pages/supplier/SupplierLayout';
import SupplierLogin       from './pages/supplier/SupplierLogin';
import SupplierRegister    from './pages/supplier/SupplierRegister';
import SupplierDashboard   from './pages/supplier/SupplierDashboard';
import SupplierProducts    from './pages/supplier/SupplierProducts';
import SupplierProductForm from './pages/supplier/SupplierProductForm';
import SupplierProfile     from './pages/supplier/SupplierProfile';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false } },
});

// ── Route Guards ──────────────────────────────────────────────────────────────
function AdminRoute({ children }) {
  const { token, user } = useAuth();
  if (!token || !user) return <Navigate to="/admin/login" replace />;
  if (!['admin','manager','staff'].includes(user?.role))
    return <Navigate to="/admin/login" replace />;
  return children;
}

// Root ("/") needs to behave differently for logged-out visitors vs logged-in
// shop users — WITHOUT changing any existing nav links or routes:
//  • Logged out + exactly "/"      → public LandingPage (real content for SEO/Google)
//  • Logged out + any other path   → redirect to /shop/login (same as before)
//  • Logged in                     → AppLayout + Dashboard etc. (unchanged)
function RootGate() {
  const { token: shopToken } = useShopAuth();
  const location = useLocation();
  if (!shopToken) {
    // Web browser visiting exactly "/" → show Landing Page (SEO)
    // Android app or any other path → go to login
    const isAndroid = window.Capacitor !== undefined;
    if (!isAndroid && location.pathname === '/') return <LandingPage />;
    return <Navigate to="/shop/login" replace />;
  }
  return <AppLayout />;
}

function SupplierPrivateRoute({ children }) {
  const { token } = useBrandAuth();
  return token ? children : <Navigate to="/supplier/login" replace />;
}

async function initCapacitor() {
  try { const { StatusBar, Style } = await import('@capacitor/status-bar'); await StatusBar.setStyle({ style: Style.Dark }); await StatusBar.setBackgroundColor({ color: '#111827' }); } catch {}
  try { const { SplashScreen } = await import('@capacitor/splash-screen'); await SplashScreen.hide({ fadeOutDuration: 300 }); } catch {}
  try { const { App: CapApp } = await import('@capacitor/app'); CapApp.addListener('backButton', ({ canGoBack }) => { if (!canGoBack) CapApp.exitApp(); else window.history.back(); }); } catch {}
}

export default function App() {
  useEffect(() => { initCapacitor(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <ShopAuthProvider>
            <BrandAuthProvider>
              <AuthProvider>
                <BrowserRouter>
                  <Toaster position="top-center" toastOptions={{
                    style: { background:'rgb(var(--c-surface-high))', color:'rgb(var(--c-on-surface))', border:'1px solid rgb(var(--c-outline-var))', fontSize:'14px' },
                    success: { iconTheme: { primary:'#45a634', secondary:'#fff' } },
                    error:   { iconTheme: { primary:'#ef4444', secondary:'#fff' } },
                    duration: 3500,
                  }} />
                  <Routes>

                    {/* ══════════════════════════════════
                        ADMIN PANEL — /admin/*
                        ══════════════════════════════════ */}
                    <Route path="/admin/login"    element={<AdminLogin />} />
                    <Route path="/admin/register" element={<AdminRoute><AdminRegister /></AdminRoute>} />

                    <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                      <Route index                      element={<AdminDashboard />} />
                      <Route path="central-products"    element={<CentralProducts />} />
                      <Route path="pending"             element={<PendingProducts />} />
                      <Route path="product-entry"       element={<ProductEntry />} />
                      <Route path="shops"               element={<AdminShops />} />
                      <Route path="users"               element={<AdminUsers />} />
                      <Route path="settings"            element={<Settings />} />
                    </Route>

                    {/* ══════════════════════════════════
                        SHOP APP — / (shop owners)
                        ══════════════════════════════════ */}
                    <Route path="/shop/login"              element={<ShopLogin />} />
                    <Route path="/shop/register"           element={<ShopRegister />} />
                    <Route path="/shop/forgot-password"    element={<ForgotPassword />} />
                    <Route path="/shop/reset-password"     element={<ResetPassword />} />
                    <Route path="/shop/verify-otp"         element={<VerifyOtp />} />
                    <Route path="/ledger/public/:token"    element={<PublicLedger />} />

                    <Route path="/" element={<RootGate />}>
                      <Route index                element={<Dashboard />} />
                      <Route path="stock-in"      element={<StockIn />} />
                      <Route path="sales"         element={<Sales />} />
                      <Route path="stock-out"     element={<Navigate to="/sales" replace />} />
                      <Route path="inventory"     element={<Inventory />} />
                      <Route path="products"      element={<Products />} />
                      <Route path="settings"      element={<Settings />} />
                      <Route path="profile"       element={<ShopProfile />} />
                      <Route path="customers"     element={<CustomerList />} />
                      <Route path="customers/:id" element={<CustomerDetail />} />
                    </Route>

                    {/* ══════════════════════════════════
                        SUPPLIER PORTAL — /supplier/*
                        ══════════════════════════════════ */}
                    <Route path="/supplier/login"    element={<SupplierLogin />} />
                    <Route path="/supplier/register" element={<SupplierRegister />} />
                    <Route path="/supplier" element={<SupplierPrivateRoute><SupplierLayout /></SupplierPrivateRoute>}>
                      <Route index                    element={<Navigate to="/supplier/dashboard" replace />} />
                      <Route path="dashboard"         element={<SupplierDashboard />} />
                      <Route path="products"          element={<SupplierProducts />} />
                      <Route path="products/new"      element={<SupplierProductForm />} />
                      <Route path="products/:id/edit" element={<SupplierProductForm />} />
                      <Route path="profile"           element={<SupplierProfile />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/shop/login" replace />} />

                  </Routes>
                </BrowserRouter>
              </AuthProvider>
            </BrandAuthProvider>
          </ShopAuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
