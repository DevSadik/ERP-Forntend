import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { formatBDT } from '../utils/currency';

// ─────────────────────────────────────────────────────────────────────────────
// CAMERA BARCODE SCANNER
// ─────────────────────────────────────────────────────────────────────────────
function BarcodeCamera({ onDetected, onClose }) {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const lastScan    = useRef(0);
  const detectorRef = useRef(null);
  const [status, setStatus] = useState('starting');
  const [flash,  setFlash]  = useState(false);
  const [manual, setManual] = useState('');

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      setStatus('starting');
      stopCamera();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if ('BarcodeDetector' in window) {
          if (!detectorRef.current)
            detectorRef.current = new window.BarcodeDetector({
              formats: ['ean_13','ean_8','code_128','code_39','qr_code','upc_a','upc_e'],
            });
          setStatus('scanning');
          const scan = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) {
              rafRef.current = requestAnimationFrame(scan); return;
            }
            const now = Date.now();
            if (now - lastScan.current > 500) {
              lastScan.current = now;
              try {
                const codes = await detectorRef.current.detect(videoRef.current);
                if (codes.length > 0) {
                  setFlash(true); setTimeout(() => setFlash(false), 400);
                  onDetected(codes[0].rawValue);
                  return;
                }
              } catch { /* skip */ }
            }
            rafRef.current = requestAnimationFrame(scan);
          };
          rafRef.current = requestAnimationFrame(scan);
        } else {
          setStatus('manual');
        }
      } catch {
        setStatus('error');
      }
    })();
    return stopCamera;
  }, [onDetected, stopCamera]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />

        {status === 'scanning' && (
          <>
            <div className={`absolute inset-0 transition-all duration-100 ${flash ? 'bg-green-400/30' : 'bg-transparent'}`} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-28">
                {[['top-0 left-0','border-t-[3px] border-l-[3px] rounded-tl-lg'],
                  ['top-0 right-0','border-t-[3px] border-r-[3px] rounded-tr-lg'],
                  ['bottom-0 left-0','border-b-[3px] border-l-[3px] rounded-bl-lg'],
                  ['bottom-0 right-0','border-b-[3px] border-r-[3px] rounded-br-lg']
                ].map(([pos,cls],i) => (
                  <div key={i} className={`absolute w-7 h-7 border-emerald-400 ${cls} ${pos}`} />
                ))}
                <motion.div
                  className="absolute left-1 right-1 h-[2px] bg-emerald-400"
                  style={{ boxShadow: '0 0 10px #34d399' }}
                  animate={{ top: ['8%','92%','8%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            </div>
            <div className="absolute bottom-2 inset-x-0 text-center">
              <span className="bg-black/70 text-white text-xs font-medium px-3 py-1 rounded-full">
                বারকোড ফ্রেমে ধরুন
              </span>
            </div>
          </>
        )}

        {status === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white space-y-2">
              <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm">ক্যামেরা চালু হচ্ছে…</p>
            </div>
          </div>
        )}

        {(status === 'error' || status === 'manual') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <div className="text-center text-white space-y-2">
              <span className="text-3xl block">⚠️</span>
              <p className="text-sm font-semibold">
                {status === 'error' ? 'ক্যামেরা পাওয়া যায়নি' : 'স্বয়ংক্রিয় স্ক্যান সাপোর্টেড নয়'}
              </p>
              <p className="text-xs text-white/70">নিচে ম্যানুয়ালি লিখুন</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          autoFocus
          value={manual}
          onChange={e => setManual(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && manual.trim()) { onDetected(manual.trim()); setManual(''); } }}
          placeholder="বারকোড নম্বর লিখুন… (Enter)"
          className="flex-1 bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-base font-mono focus:outline-none focus:border-emerald-400"
        />
        <button onClick={() => { if (manual.trim()) { onDetected(manual.trim()); setManual(''); } }}
          className="bg-emerald-500 text-white font-bold px-4 rounded-xl">
          OK
        </button>
      </div>
      <button onClick={onClose}
        className="w-full bg-gray-700 text-white font-semibold py-3 rounded-xl text-sm">
        বাতিল
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BLANK FORM STATE
// ─────────────────────────────────────────────────────────────────────────────
const BLANK = {
  name:         '',
  company:      '',
  barcode:      '',
  category:     '',
  unit:         'pcs',
  mrp:          '',
  description:  '',
};

const UNITS = [
  { v: 'pcs',    l: 'পিস (pcs)'     },
  { v: 'packs',  l: 'প্যাক (packs)'  },
  { v: 'boxes',  l: 'বাক্স (boxes)'  },
  { v: 'bags',   l: 'ব্যাগ (bags)'   },
  { v: 'kg',     l: 'কেজি (kg)'      },
  { v: 'g',      l: 'গ্রাম (g)'       },
  { v: 'litres', l: 'লিটার (litres)' },
];

const CATEGORIES = [
  'টফি','ললিপপ','চকোলেট','গামি','মার্শমেলো',
  'সাওয়ার ক্যান্ডি','হার্ড ক্যান্ডি','বিস্কুট','কেক',
  'চিপস','পানীয়','ডেইরি','নুডলস','মসলা','তেল','অন্যান্য',
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ProductEntry() {
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm]           = useState(BLANK);
  const [errors, setErrors]       = useState({});
  const [scannerOpen, setScannerOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);  // auto duplicate-check on scan/type
  const [savedProducts, setSavedProducts] = useState([]);
  const [showList, setShowList]   = useState(false);
  const nameRef = useRef(null);

  // Fetch recently added products
  const { data: recentData } = useQuery({
    queryKey: ['central-products'],
    queryFn: () => api.get('/admin/central?limit=20').then(r => r.data.data),
    refetchInterval: 10000,
  });

  const recentProducts = recentData || [];

  // Fetch existing categories + companies for suggestions
  const { data: metaData } = useQuery({
    queryKey: ['central-meta'],
    queryFn: () => api.get('/admin/central-meta').then(r => r.data.data),
  });
  const savedCategories = metaData?.categories || [];
  const savedCompanies  = metaData?.companies  || [];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name     = 'পণ্যের নাম দিন';
    if (!form.category)     e.category = 'ক্যাটাগরি বাছাই করুন';
    if (!form.mrp)          e.mrp      = 'MRP দিন';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: payload => api.post('/admin/central', payload),
    onSuccess: (res) => {
      qc.invalidateQueries(['central-products']);
      qc.invalidateQueries(['central-meta']);
      qc.invalidateQueries(['product-entry-recent']);
      const saved = res.data.data;
      setSavedProducts(prev => [saved, ...prev]);
      toast.success(`✅ "${saved.name}" সংরক্ষিত হয়েছে!`);
      // Reset form but keep category for quick multi-entry
      setForm(f => ({ ...BLANK, category: f.category, unit: f.unit }));
      setErrors({});
      setTimeout(() => nameRef.current?.focus(), 100);
    },
    onError: e => {
      // Duplicate barcode (409) — fill the form with the existing product
      // so the user can see what already exists.
      if (e.response?.status === 409 && e.response?.data?.data) {
        const p = e.response.data.data;
        setForm(f => ({
          ...f,
          barcode:     p.barcode || f.barcode,
          name:        p.name || '',
          company:     p.company || '',
          category:    p.category || '',
          unit:        p.unit || 'pcs',
          mrp:         String(p.mrp ?? ''),
          description: p.description || '',
        }));
        toast(`⚠️ "${p.name}" — এই বারকোড আগে থেকেই আছে`, { icon: '📋', duration: 5000 });
        return;
      }
      toast.error(e.response?.data?.message || 'সংরক্ষণ ব্যর্থ।');
    },
  });

  const handleSave = () => {
    if (!validate()) return;
    mutation.mutate({
      name:         form.name.trim(),
      barcode:      form.barcode.trim() || undefined,
      company:      form.company?.trim() || undefined,
      category:     form.category,
      unit:         form.unit,
      mrp:          +form.mrp || 0,
      description:  form.description?.trim() || undefined,
    });
  };

  const handleBarcode = async (code) => {
    setScannerOpen(false);
    const bc = code.trim();
    set('barcode', bc);
    setChecking(true);

    // Look up this barcode in the central database.
    // Try the exact endpoint first, then fall back to search — so it works
    // no matter how the data was saved.
    let p = null;
    try {
      const r1 = await api.get(`/admin/central/barcode/${encodeURIComponent(bc)}`);
      p = r1.data?.data || null;
    } catch (_) { /* try fallback below */ }

    if (!p) {
      try {
        const r2 = await api.get(`/admin/central?search=${encodeURIComponent(bc)}&limit=50`);
        const list = r2.data?.data || [];
        // exact barcode match within results
        p = list.find(x => String(x.barcode || '').trim() === bc) || null;
      } catch (_) { /* still nothing */ }
    }

    setChecking(false);

    if (!p) {
      toast(`✅ নতুন বারকোড — এই পণ্য আগে নেই, যোগ করতে পারেন`, { icon: '🆕', duration: 4000 });
      return;
    }

    // Found — fill the form with the saved product info
    setForm(f => ({
      ...f,
      barcode:     bc,
      name:        p.name || '',
      company:     p.company || '',
      category:    p.category || '',
      unit:        p.unit || 'pcs',
      mrp:         String(p.mrp ?? ''),
      description: p.description || '',
    }));
    toast(`📋 "${p.name}" — এই পণ্য আগে থেকেই আছে, তথ্য পূরণ হলো`, { icon: '✅', duration: 5000 });
  };

  const totalSaved = savedProducts.length;

  return (
    <div className="min-h-screen bg-[#0b121e]">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[#0d1525] border-b border-[#1e3045]">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div className="text-center">
            <h1 className="text-[15px] font-black text-white">পণ্য ডেটাবেজ এন্ট্রি</h1>
            <p className="text-[11px] text-gray-400">Product Database Entry</p>
          </div>
          <button onClick={() => setShowList(s => !s)}
            className="relative p-2 -mr-2 text-emerald-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            {totalSaved > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full text-[9px] font-black text-white flex items-center justify-center">
                {totalSaved}
              </span>
            )}
          </button>
        </div>

        {/* Progress counter */}
        {totalSaved > 0 && (
          <div className="px-4 pb-2.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#1e3045] rounded-full overflow-hidden">
              <motion.div className="h-full bg-emerald-500 rounded-full"
                initial={{ width: 0 }} animate={{ width: `${Math.min(100, totalSaved * 5)}%` }} />
            </div>
            <span className="text-[11px] text-emerald-400 font-bold flex-shrink-0">{totalSaved} টি যোগ হয়েছে</span>
          </div>
        )}
      </div>

      {/* ── Saved list drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {showList && (
          <>
            <motion.div className="fixed inset-0 bg-black/60 z-30"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowList(false)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-[#0d1525] border-l border-[#1e3045] z-40 flex flex-col">
              <div className="flex items-center justify-between px-4 py-4 border-b border-[#1e3045]">
                <div>
                  <h2 className="text-base font-black text-white">যোগ করা পণ্য</h2>
                  <p className="text-xs text-gray-400">{recentProducts.length} টি পণ্য আছে ডেটাবেজে</p>
                </div>
                <button onClick={() => setShowList(false)} className="p-1.5 text-gray-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {recentProducts.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-sm">এখনো কোনো পণ্য নেই</p>
                  </div>
                ) : (
                  recentProducts.map((p, i) => (
                    <motion.div key={p._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .03 }}
                      className="flex items-center gap-3 px-4 py-3 border-b border-[#1e3045]">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-400 text-xs font-black">{p.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {p.barcode && <span className="text-[10px] text-gray-400 font-mono">{p.barcode}</span>}
                          <span className="text-[10px] text-gray-500">{p.category}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-emerald-400">{formatBDT(p.mrp)}</p>
                        <p className="text-[10px] text-gray-500">{p.company || p.unit}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Form ───────────────────────────────────────────── */}
      <div className="px-4 py-5 space-y-4 pb-32">

        {/* Scan barcode button — prominent */}
        <button onClick={() => setScannerOpen(true)}
          className="w-full flex items-center justify-center gap-3 bg-emerald-500/10 border-2 border-emerald-500/30 border-dashed rounded-2xl py-4 text-emerald-400 font-bold text-base active:bg-emerald-500/20 transition-all">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="14"/>
            <line x1="17" y1="14" x2="21" y2="14"/><line x1="14" y1="17" x2="14" y2="21"/>
            <line x1="17" y1="17" x2="21" y2="17"/><line x1="17" y1="21" x2="21" y2="21"/>
          </svg>
          ক্যামেরা দিয়ে বারকোড স্ক্যান করুন
        </button>

        {/* Barcode (manual) */}
        <div>
          <label className="flex items-center justify-between text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            <span>বারকোড নম্বর <span className="text-gray-500 font-normal normal-case tracking-normal">(ঐচ্ছিক)</span></span>
            <button type="button" onClick={() => setAutoCheck(v => !v)}
              className={`flex items-center gap-1.5 normal-case tracking-normal font-bold px-2.5 py-1 rounded-full text-[11px] transition-all ${autoCheck ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-gray-700/30 text-gray-500 border border-gray-600/30'}`}>
              <span className={`w-2 h-2 rounded-full ${autoCheck ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              অটো-চেক {autoCheck ? 'চালু' : 'বন্ধ'}
            </button>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input value={form.barcode} onChange={e => set('barcode', e.target.value)}
                onBlur={e => { const v = e.target.value.trim(); if (v && autoCheck) handleBarcode(v); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v && autoCheck) handleBarcode(v); } }}
                placeholder="স্ক্যান করুন বা লিখুন…"
                className="w-full bg-[#111e2e] border border-[#1e3045] rounded-2xl px-4 py-4 text-base font-mono text-emerald-400 tracking-widest focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:font-sans placeholder:tracking-normal placeholder:text-gray-600 transition-all"
              />
              {form.barcode && (
                <button onClick={() => set('barcode', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
            <button type="button"
              onClick={() => { const v = form.barcode.trim(); if (v) handleBarcode(v); }}
              disabled={!form.barcode.trim() || checking}
              className="px-5 py-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-sm whitespace-nowrap hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
              {checking
                ? <><span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span>দেখছি…</>
                : <><span className="material-symbols-outlined !text-[16px]">search</span>চেক করুন</>}
            </button>
          </div>
        </div>

        {/* Product name */}
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            পণ্যের নাম <span className="text-red-400">*</span>
          </label>
          <input ref={nameRef} value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="যেমন: রেড চিউ টফি"
            className={`w-full bg-[#111e2e] border rounded-2xl px-4 py-4 text-base text-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-600 ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#1e3045] focus:border-emerald-500 focus:ring-emerald-500/20'}`}
          />
          {errors.name && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">⚠ {errors.name}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            ক্যাটাগরি <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => set('category', c)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${form.category === c ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-[#111e2e] border border-[#1e3045] text-gray-400'}`}>
                {c}
              </button>
            ))}
          </div>
          {/* Custom category — with saved suggestions */}
          <input value={CATEGORIES.includes(form.category) ? '' : form.category}
            onChange={e => set('category', e.target.value)}
            placeholder="অথবা এখানে লিখুন…"
            list="saved-categories"
            className="mt-2 w-full bg-[#111e2e] border border-[#1e3045] rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-gray-600"
          />
          <datalist id="saved-categories">
            {savedCategories.map(c => <option key={c} value={c} />)}
          </datalist>
          {errors.category && <p className="text-xs text-red-400 mt-1.5">⚠ {errors.category}</p>}
        </div>

        {/* Unit */}
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">একক</label>
          <div className="flex flex-wrap gap-2">
            {UNITS.map(u => (
              <button key={u.v} onClick={() => set('unit', u.v)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${form.unit === u.v ? 'bg-emerald-500 text-white' : 'bg-[#111e2e] border border-[#1e3045] text-gray-400'}`}>
                {u.l}
              </button>
            ))}
          </div>
        </div>

        {/* Company + MRP */}
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            কোম্পানি
          </label>
          <input
            value={form.company || ''} onChange={e => set('company', e.target.value)}
            placeholder="যেমন: প্রাণ আরএফএল, আকিজ ফুড"
            list="saved-companies"
            className="w-full bg-[#111e2e] border border-[#1e3045] rounded-2xl px-4 py-4 text-base text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-gray-600"
          />
          <datalist id="saved-companies">
            {savedCompanies.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            MRP (সর্বোচ্চ বিক্রয়মূল্য) <span className="text-emerald-400">৳</span> <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">৳</span>
            <input type="number" inputMode="decimal" min="0" step="0.01"
              value={form.mrp} onChange={e => set('mrp', e.target.value)}
              placeholder="0.00"
              className={`w-full bg-[#111e2e] border rounded-2xl pl-7 pr-3 py-4 text-base text-white font-bold focus:outline-none focus:ring-2 transition-all placeholder:text-gray-600 placeholder:font-normal ${errors.mrp ? 'border-red-500 focus:ring-red-500/20' : 'border-[#1e3045] focus:border-emerald-500 focus:ring-emerald-500/20'}`}
            />
          </div>
          {errors.mrp && <p className="text-[10px] text-red-400 mt-1">⚠ {errors.mrp}</p>}
        </div>

        {/* Description — optional */}
        <div>
          <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
            বিবরণ <span className="text-gray-500 font-normal normal-case tracking-normal">(ঐচ্ছিক)</span>
          </label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            rows={3} placeholder="পণ্য সম্পর্কে অতিরিক্ত তথ্য…"
            className="w-full bg-[#111e2e] border border-[#1e3045] rounded-2xl px-4 py-3 text-base text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none placeholder:text-gray-600"
          />
        </div>

        {/* Summary preview */}
        <AnimatePresence>
          {form.name && form.mrp && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-4">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>📋</span> সারসংক্ষেপ
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: 'পণ্য',      v: form.name,                       col: '2' },
                  { l: 'কোম্পানি',  v: form.company || '—' },
                  { l: 'ক্যাটাগরি', v: form.category || '—' },
                  { l: 'MRP',       v: formatBDT(+form.mrp),            hi: true },
                  { l: 'একক',       v: form.unit },
                ].map(s => (
                  <div key={s.l} className={`bg-[#0d1525] rounded-xl p-3 ${s.col === '2' ? 'col-span-2' : ''}`}>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{s.l}</p>
                    <p className={`text-sm font-bold mt-0.5 truncate ${s.hi ? 'text-emerald-400' : 'text-white'}`}>{s.v}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Fixed bottom save button ────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#0b121e] via-[#0b121e]/95 to-transparent">
        <div className="flex gap-3">
          <button onClick={() => { setForm(BLANK); setErrors({}); }}
            className="bg-[#111e2e] border border-[#1e3045] text-gray-400 font-bold py-4 px-5 rounded-2xl text-sm active:bg-[#1e3045] transition-all">
            মুছুন
          </button>
          <motion.button
            whileTap={{ scale: .97 }}
            onClick={handleSave}
            disabled={mutation.isPending}
            className="flex-1 bg-emerald-500 text-white font-black py-4 rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:bg-emerald-600"
            style={{ boxShadow: '0 4px 20px rgba(16,185,129,.35)' }}>
            {mutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                সংরক্ষণ হচ্ছে…
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                সংরক্ষণ করুন ও পরবর্তী পণ্য
              </>
            )}
          </motion.button>
        </div>

        {/* Total count */}
        {totalSaved > 0 && (
          <p className="text-center text-[11px] text-gray-500 mt-2">
            এই সেশনে <span className="text-emerald-400 font-bold">{totalSaved} টি</span> পণ্য যোগ হয়েছে
          </p>
        )}
      </div>

      {/* ── Camera modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {scannerOpen && (
          <>
            <motion.div className="fixed inset-0 bg-black/80 z-50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setScannerOpen(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 z-50 bg-[#0d1525] border-t border-[#1e3045] rounded-t-3xl p-5">
              <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
              <h3 className="text-base font-black text-white mb-4 text-center">বারকোড স্ক্যান</h3>
              <BarcodeCamera onDetected={handleBarcode} onClose={() => setScannerOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
