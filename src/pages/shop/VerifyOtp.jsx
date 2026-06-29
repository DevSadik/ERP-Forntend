import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useShopAuth } from '../../context/ShopAuthContext';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export default function VerifyOtp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { saveVerifiedSession } = useShopAuth();
  const { lang } = useLanguage();

  // phone passed via navigation state, or from query
  const phone = location.state?.phone || new URLSearchParams(location.search).get('phone') || '';

  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const inputs = useRef([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    inputs.current[0]?.focus();
    toast(lang === 'en'
      ? 'OTP sent! Also check your phone\u2019s Spam / Blocked folder.'
      : 'OTP পাঠানো হয়েছে! ফোনের Spam / Blocked ফোল্ডারও দেখুন।',
      { icon: '📩', duration: 6000 });
  }, []);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return toast.error('৬ সংখ্যার OTP দিন।');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/shop/verify-otp`, { phone, otp: code });
      if (data.data?.token && data.data?.shop) {
        saveVerifiedSession(data.data.token, data.data.shop);
      }
      toast.success('মোবাইল যাচাই সফল!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP যাচাই ব্যর্থ।');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await axios.post(`${API}/shop/resend-otp`, { phone });
      toast.success(lang === 'en'
        ? 'OTP sent. Also check Spam / Blocked messages.'
        : 'OTP পাঠানো হয়েছে। Spam / Blocked মেসেজও দেখুন।', { duration: 5000 });
      setSeconds(60);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'পাঠানো ব্যর্থ।');
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="w-full max-w-sm relative z-10">

        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Mini Manager" className="w-20 h-20 mb-3"
            style={{ filter:'drop-shadow(0 0 16px rgba(16,185,129,0.3))' }} />
          <h1 className="text-headline-md font-black text-primary">Mini Manager ERP</h1>
        </div>

        <div className="bg-surface border border-outline-var rounded-2xl p-8 shadow-modal">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined !text-[32px] text-primary">sms</span>
            </div>
            <h2 className="text-headline-sm font-bold text-on-surface mb-1">OTP যাচাই করুন</h2>
            <p className="text-body-md text-on-surface-var">
              <span className="font-semibold text-primary">{phone || 'আপনার মোবাইলে'}</span> নম্বরে
              পাঠানো ৬ সংখ্যার কোড দিন।
            </p>
          </div>

          {/* OTP inputs */}
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input key={i} ref={el => inputs.current[i] = el}
                type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-2xl font-black bg-surface-high border border-outline-var rounded-xl text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all" />
            ))}
          </div>

          <motion.button whileTap={{ scale:.97 }} onClick={handleVerify} disabled={loading}
            className="w-full bg-primary text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 disabled:opacity-50 transition-all">
            {loading
              ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>যাচাই হচ্ছে…</>
              : <><span className="material-symbols-outlined !text-[18px]">check_circle</span>যাচাই করুন</>}
          </motion.button>

          {/* Resend */}
          <div className="mt-5 text-center">
            {seconds > 0 ? (
              <p className="text-label-sm text-on-surface-var">
                আবার পাঠাতে <span className="font-bold text-primary">{seconds}s</span> অপেক্ষা করুন
              </p>
            ) : (
              <button onClick={handleResend} disabled={resending}
                className="text-label-md text-primary font-semibold hover:underline disabled:opacity-50">
                {resending ? 'পাঠানো হচ্ছে…' : 'নতুন OTP পাঠান'}
              </button>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-outline-var text-center">
            <Link to="/shop/login" className="text-label-sm text-on-surface-var hover:text-primary flex items-center justify-center gap-1">
              <span className="material-symbols-outlined !text-[14px]">arrow_back</span>
              লগইনে ফিরে যান
            </Link>
          </div>
        </div>

        <p className="text-center text-[11px] text-on-surface-var mt-4">
          © 2026 <span className="text-primary font-semibold">Mini Manager ERP</span> by Wahidsadik Aditto
        </p>
      </motion.div>
    </div>
  );
}
