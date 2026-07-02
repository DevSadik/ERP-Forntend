import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

// Translation dictionary
const STRINGS = {
  bn: {
    dashboard: 'ড্যাশবোর্ড', stockIn: 'স্টক-ইন', sales: 'বিক্রয়',
    inventory: 'ইনভেন্টরি', products: 'পণ্য', productEntry: 'পণ্য এন্ট্রি',
    creditLedger: 'ক্রেডিট লেজার', settings: 'সেটিংস', logout: 'Logout',
    newEntry: 'নতুন এন্ট্রি', search: 'খুঁজুন', save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল', delete: 'মুছুন', edit: 'সম্পাদনা', add: 'যোগ করুন',
    todaySales: 'আজকের বিক্রয়', todayOrders: 'আজকের অর্ডার',
    lowStock: 'কম স্টক', inventoryValue: 'মজুদ মূল্য',
    language: 'ভাষা', languageDesc: 'অ্যাপের ভাষা নির্বাচন করুন',
    darkMode: 'ডার্ক মোড', darkModeDesc: 'সম্পূর্ণ অ্যাপে ডার্ক থিম',
    welcome: 'স্বাগতম', login: 'লগইন করুন', email: 'ইমেইল', password: 'পাসওয়ার্ড',
    quantity: 'পরিমাণ', supplier: 'সরবরাহকারী', costPrice: 'ক্রয়মূল্য',
    salePrice: 'বিক্রয়মূল্য', mrp: 'MRP', company: 'কোম্পানি', category: 'ক্যাটাগরি',
    barcode: 'বারকোড', productName: 'পণ্যের নাম', total: 'মোট',
  },
  en: {
    dashboard: 'Dashboard', stockIn: 'Stock In', sales: 'Sales',
    inventory: 'Inventory', products: 'Products', productEntry: 'Product Entry',
    creditLedger: 'Credit Ledger', settings: 'Settings', logout: 'Logout',
    newEntry: 'New Entry', search: 'Search', save: 'Save',
    cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add',
    todaySales: "Today's Sales", todayOrders: "Today's Orders",
    lowStock: 'Low Stock', inventoryValue: 'Inventory Value',
    language: 'Language', languageDesc: 'Choose app language',
    darkMode: 'Dark Mode', darkModeDesc: 'Dark theme across the app',
    welcome: 'Welcome', login: 'Login', email: 'Email', password: 'Password',
    quantity: 'Quantity', supplier: 'Supplier', costPrice: 'Cost Price',
    salePrice: 'Sale Price', mrp: 'MRP', company: 'Company', category: 'Category',
    barcode: 'Barcode', productName: 'Product Name', total: 'Total',
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('mb_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('mb_lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const switchLang = useCallback((code) => {
    if (code === 'bn' || code === 'en') setLang(code);
  }, []);

  const t = useCallback((key) => STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
