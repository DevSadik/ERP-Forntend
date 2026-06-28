import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Shop-scoped paths get /shop prefix when shop is logged in (tenant-isolated)
const SHOP_PREFIXED = [
  '/products', '/stock-in', '/stock-out', '/sales',
  '/ledger', '/dashboard', '/inventory', '/suppliers', '/notifications',
];

// Paths that ALWAYS use the admin/user token (never shop token)
const ADMIN_PATHS = ['/auth', '/admin'];

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const shopToken  = localStorage.getItem('ss_shop_token');
  const adminToken = localStorage.getItem('ss_token');
  const url        = config.url || '';

  // 1. Admin/auth routes → ALWAYS use admin token, never shop prefix
  const isAdminPath = ADMIN_PATHS.some(p => url.startsWith(p));
  if (isAdminPath) {
    if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
    return config;
  }

  // 2. Shop is logged in → use shop token + auto-prefix shop-scoped paths
  if (shopToken) {
    config.headers.Authorization = `Bearer ${shopToken}`;

    if (!url.startsWith('/shop') && !url.startsWith('/customers')) {
      const match = SHOP_PREFIXED.find(p =>
        url === p || url.startsWith(p + '/') || url.startsWith(p + '?')
      );
      if (match) config.url = '/shop' + url;
    }
    if (config.url === '/shop/stock-out') config.url = '/shop/sales';
    return config;
  }

  // 3. Fallback → admin token if present
  if (adminToken) config.headers.Authorization = `Bearer ${adminToken}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const cfg = err.config || {};
    const status = err.response?.status;

    // ── Auto-retry on overload / network errors ───────────────────────────────
    // 429 (too many requests), 502/503/504 (server overloaded/restarting),
    // or no response (network blip). Retry up to 3 times with growing delay.
    const isRetryable =
      !err.response ||                       // network error / timeout
      [429, 502, 503, 504].includes(status); // server overloaded

    if (isRetryable && cfg && !cfg._noRetry) {
      cfg._retryCount = (cfg._retryCount || 0) + 1;
      if (cfg._retryCount <= 3) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, cfg._retryCount - 1);
        await new Promise(r => setTimeout(r, delay));
        return api(cfg);
      }
    }

    // ── Session expiry handling ───────────────────────────────────────────────
    // Only log out on a GENUINE 401 from the server (token invalid/expired).
    // Network errors, offline, or server-asleep do NOT have err.response,
    // so they will never trigger logout — the session is preserved.
    if (status === 401 && err.response) {
      const url = cfg.url || '';
      const isAdminPath = ADMIN_PATHS.some(p => url.startsWith(p));

      if (isAdminPath) {
        localStorage.removeItem('ss_token');
        localStorage.removeItem('ss_user');
        if (!window.location.pathname.startsWith('/admin/login'))
          window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('ss_shop_token');
        localStorage.removeItem('ss_shop');
        if (!window.location.pathname.startsWith('/shop/login'))
          window.location.href = '/shop/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
