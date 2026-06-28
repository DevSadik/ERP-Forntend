import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useShopAuth } from '../../context/ShopAuthContext';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export default function VerifyEmail() {
  const [params]               = useSearchParams();
  const navigate               = useNavigate();
  const { saveVerifiedSession } = useShopAuth();
  const token                  = params.get('token');
  const [status, setStatus]    = useState('verifying');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending]     = useState(false);
  const [resendDone, setResendDone]   = useState(false);

  const verifyRef = React.useRef(false);

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    // Guard against double-call (React StrictMode runs effects twice in dev)
    if (verifyRef.current) return;
    verifyRef.current = true;

    (async () => {
      try {
        const { data } = await axios.get(API + '/shop/verify-email/' + token);
        if (data.data?.token && data.data?.shop) {
          saveVerifiedSession(data.data.token, data.data.shop);
        }
        setStatus('success');
        setTimeout(() => navigate('/'), 3000);
      } catch {
        setStatus('error');
      }
    })();
  }, [token, saveVerifiedSession, navigate]);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    try {
      await axios.post(API + '/shop/resend-verification', { email: resendEmail });
      setResendDone(true);
    } catch {
      setResendDone(false);
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity:0, scale:.96 }} animate={{ opacity:1, scale:1 }}
        className="w-full max-w-sm relative z-10">

        <div className="flex flex-col items-center mb-8">
          <img src="/logo.svg" alt="MiniBazar" className="w-20 h-20 mb-3"
            style={{ filter:'drop-shadow(0 0 16px rgba(16,185,129,0.3))' }} />
          <h1 className="text-headline-md font-black text-primary">MiniBazar ERP</h1>
        </div>

        <div className="bg-surface border border-outline-var rounded-2xl p-8 shadow-modal text-center">
          <AnimatePresence mode="wait">

            {/* Verifying */}
            {status === 'verifying' && (
              <motion.div key="v" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <h2 className="text-headline-sm font-bold text-on-surface mb-2">যাচাই হচ্ছে…</h2>
                <p className="text-body-md text-on-surface-var">কিছুক্ষণ অপেক্ষা করুন।</p>
              </motion.div>
            )}

            {/* Success */}
            {status === 'success' && (
              <motion.div key="s"
                initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0 }}>
                <motion.div
                  initial={{ scale:0 }} animate={{ scale:1 }}
                  transition={{ type:'spring', bounce:.5, delay:.1 }}
                  className="w-20 h-20 rounded-full bg-success/15 border-2 border-success/30 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined !text-[40px] text-success"
                    style={{ fontVariationSettings:"'FILL' 1" }}>verified</span>
                </motion.div>
                <h2 className="text-headline-md font-black text-on-surface mb-2">যাচাই সফল! ✅</h2>
                <p className="text-body-md text-on-surface-var mb-4">
                  আপনার অ্যাকাউন্ট সক্রিয় হয়েছে।
                </p>
                <div className="bg-primary/8 border border-primary/15 rounded-xl px-4 py-3 mb-4">
                  <p className="text-body-md text-primary font-semibold">Dashboard-এ যাচ্ছি…</p>
                  <div className="w-full bg-primary/20 rounded-full h-1.5 mt-2 overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full"
                      initial={{ width:'0%' }} animate={{ width:'100%' }}
                      transition={{ duration:3, ease:'linear' }} />
                  </div>
                </div>
                <button onClick={() => navigate('/')}
                  className="w-full bg-primary text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 transition-all">
                  <span className="material-symbols-outlined !text-[18px]">dashboard</span>
                  এখনই যান
                </button>
              </motion.div>
            )}

            {/* Error */}
            {status === 'error' && (
              <motion.div key="e" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <div className="w-16 h-16 rounded-full bg-error/15 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined !text-[32px] text-error">error</span>
                </div>
                <h2 className="text-headline-sm font-bold text-on-surface mb-2">যাচাই ব্যর্থ</h2>
                <p className="text-body-md text-on-surface-var mb-4">
                  লিংক মেয়াদ শেষ বা অবৈধ।
                </p>

                {!resendDone ? (
                  <div className="bg-surface-high border border-outline-var rounded-xl p-4 text-left mb-4">
                    <p className="text-label-sm font-semibold text-on-surface mb-2">নতুন লিংক পান:</p>
                    <input value={resendEmail} onChange={e => setResendEmail(e.target.value)}
                      type="email" placeholder="আপনার ইমেইল"
                      className="w-full bg-surface border border-outline-var rounded-xl px-3 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary transition-all mb-2" />
                    <button onClick={handleResend} disabled={resending || !resendEmail}
                      className="w-full bg-primary text-white font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 disabled:opacity-50 transition-all">
                      {resending
                        ? <><span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span>পাঠানো হচ্ছে…</>
                        : <><span className="material-symbols-outlined !text-[16px]">send</span>নতুন লিংক পাঠান</>}
                    </button>
                  </div>
                ) : (
                  <div className="bg-success/10 border border-success/20 rounded-xl p-4 mb-4">
                    <p className="text-body-md text-success font-semibold">
                      ✅ নতুন লিংক পাঠানো হয়েছে! Gmail চেক করুন।
                    </p>
                  </div>
                )}

                <Link to="/shop/login"
                  className="text-label-sm text-primary font-semibold hover:underline flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined !text-[14px]">arrow_back</span>
                  লগইনে যান
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-[11px] text-on-surface-var mt-4">
          © 2026 <span className="text-primary font-semibold">MiniBazar ERP</span> by Wahidsadik Aditto
        </p>
      </motion.div>
    </div>
  );
}
