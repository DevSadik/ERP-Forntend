import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
const ShopAuthContext = createContext(null);

export function ShopAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ss_shop_token'));
  const [shop,  setShop]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('ss_shop')); } catch { return null; }
  });

  const saveSession = useCallback((t, s) => {
    localStorage.setItem('ss_shop_token', t);
    localStorage.setItem('ss_shop', JSON.stringify(s));
    setToken(t);
    setShop(s);
  }, []);

  // Register — does NOT auto-login (email verification required)
  const register = useCallback(async (data) => {
    const res = await axios.post(BASE + '/shop/register', data);
    return res.data;
  }, []);

  // Login — saves token and shop on success
  const login = useCallback(async (phone, password) => {
    const res = await axios.post(BASE + '/shop/login', { phone, password });
    const { token: t, shop: s } = res.data.data || {};
    if (t && s) saveSession(t, s);
    return res.data;
  }, [saveSession]);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('ss_shop_token');
    localStorage.removeItem('ss_shop');
    setToken(null);
    setShop(null);
  }, []);

  // Update shop data (used after profile edit or email verify)
  const updateShop = useCallback((s) => {
    localStorage.setItem('ss_shop', JSON.stringify(s));
    setShop(s);
  }, []);

  // Used by VerifyEmail page — save token after verification
  const saveVerifiedSession = useCallback((t, s) => {
    saveSession(t, s);
  }, [saveSession]);

  const trialDaysLeft = shop?.trialEnds
    ? Math.max(0, Math.ceil((new Date(shop.trialEnds) - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const planDaysLeft = shop?.planExpires
    ? Math.max(0, Math.ceil((new Date(shop.planExpires) - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Expired when: on trial and trial ended, OR on paid plan and plan expired
  const isTrialExpired = !!(shop && (
    (shop.plan === 'trial' && trialDaysLeft <= 0) ||
    ((shop.plan === 'pro' || shop.plan === 'basic') && shop.planExpires && planDaysLeft <= 0)
  ));

  return (
    <ShopAuthContext.Provider value={{
      token, shop,
      login, register, logout,
      updateShop, saveVerifiedSession,
      trialDaysLeft, planDaysLeft, isTrialExpired,
    }}>
      {children}
    </ShopAuthContext.Provider>
  );
}

export const useShopAuth = () => useContext(ShopAuthContext);
