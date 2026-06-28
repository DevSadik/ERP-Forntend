import React, { createContext, useContext, useState, useCallback } from 'react';
import brandApi from '../utils/brandApi';

const BrandAuthContext = createContext(null);

export function BrandAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ss_brand_token'));
  const [brand, setBrand]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('ss_brand')); } catch { return null; }
  });

  const login = useCallback(async (email, password) => {
    const { data } = await brandApi.post('/brand/login', { email, password });
    localStorage.setItem('ss_brand_token', data.data.token);
    localStorage.setItem('ss_brand', JSON.stringify(data.data.brand));
    setToken(data.data.token);
    setBrand(data.data.brand);
    return data.data.brand;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ss_brand_token');
    localStorage.removeItem('ss_brand');
    setToken(null); setBrand(null);
  }, []);

  const updateBrand = useCallback((b) => {
    localStorage.setItem('ss_brand', JSON.stringify(b));
    setBrand(b);
  }, []);

  return (
    <BrandAuthContext.Provider value={{ token, brand, login, logout, updateBrand }}>
      {children}
    </BrandAuthContext.Provider>
  );
}

export const useBrandAuth = () => useContext(BrandAuthContext);
