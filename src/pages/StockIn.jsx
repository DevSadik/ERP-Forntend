import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Badge, DataTable, PageHeader, Pagination } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../utils/api';
import { formatBDT } from '../utils/currency';

// ─────────────────────────────────────────────────────────────────────────────
// CAMERA SCANNER
// ─────────────────────────────────────────────────────────────────────────────
function CameraScanner({ onDetected, onClose }) {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const lastScan    = useRef(0);
  const detectorRef = useRef(null);
  const [status, setStatus]       = useState('starting');
  const [lastCode, setLastCode]   = useState('');
  const [flash, setFlash]         = useState(false);
  const [manual, setManual]       = useState('');

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }, []);

  const startCamera = useCallback(async () => {
    setStatus('starting'); stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }

      if ('BarcodeDetector' in window) {
        if (!detectorRef.current)
          detectorRef.current = new window.BarcodeDetector({
            formats: ['ean_13','ean_8','code_128','code_39','qr_code','upc_a','upc_e','itf','data_matrix'],
          });
        setStatus('scanning');
        const scan = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) { rafRef.current = requestAnimationFrame(scan); return; }
          const now = Date.now();
          if (now - lastScan.current > 500) {
            lastScan.current = now;
            try {
              const codes = await detectorRef.current.detect(videoRef.current);
              if (codes.length > 0) {
                const code = codes[0].rawValue;
                setLastCode(code); setFlash(true); setTimeout(() => setFlash(false), 400);
                onDetected(code); return;
              }
            } catch { /* skip frame */ }
          }
          rafRef.current = requestAnimationFrame(scan);
        };
        rafRef.current = requestAnimationFrame(scan);
      } else { setStatus('manual'); }
    } catch { setStatus('error'); }
  }, [onDetected, stopCamera]);

  useEffect(() => { startCamera(); return stopCamera; }, [startCamera, stopCamera]);

  const submit = (code) => { if (code.trim()) { onDetected(code.trim()); setManual(''); } };

  return (
    <div className="space-y-3">
      {/* Camera viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />

        {status === 'scanning' && (
          <>
            <div className={`absolute inset-0 transition-all duration-100 ${flash ? 'bg-primary/25' : 'bg-transparent'}`} />
            {/* Corner guides */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-60 h-32">
                {[
                  ['top-0 left-0', 'border-t-[3px] border-l-[3px] rounded-tl-lg'],
                  ['top-0 right-0', 'border-t-[3px] border-r-[3px] rounded-tr-lg'],
                  ['bottom-0 left-0', 'border-b-[3px] border-l-[3px] rounded-bl-lg'],
                  ['bottom-0 right-0', 'border-b-[3px] border-r-[3px] rounded-br-lg'],
                ].map(([pos, cls], i) => (
                  <div key={i} className={`absolute w-7 h-7 border-primary ${cls} ${pos}`} />
                ))}
                <motion.div
                  className="absolute left-1 right-1 h-[2px] bg-primary"
                  style={{ boxShadow: '0 0 12px #45a634, 0 0 4px #45a634' }}
                  animate={{ top: ['8%', '92%', '8%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            </div>
            <div className="absolute bottom-3 inset-x-0 flex justify-center">
              <span className="bg-black/70 backdrop-blur text-white text-[11px] font-semibold px-4 py-1.5 rounded-full tracking-wide">
                বারকোড ফ্রেমের ভেতরে ধরুন
              </span>
            </div>
          </>
        )}

        {status === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white space-y-2">
              <span className="material-symbols-outlined !text-[52px] text-primary animate-pulse block">camera_alt</span>
              <p className="text-sm font-medium">ক্যামেরা চালু হচ্ছে…</p>
            </div>
          </div>
        )}

        {(status === 'error' || status === 'manual') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <div className="text-center text-white space-y-3">
              <span className="material-symbols-outlined !text-[44px] text-warning block">info</span>
              <p className="text-sm font-semibold">
                {status === 'error' ? 'ক্যামেরা অ্যাক্সেস পাওয়া যায়নি' : 'এই ব্রাউজারে স্বয়ংক্রিয় স্ক্যান নেই'}
              </p>
              <p className="text-xs text-white/70">নিচে ম্যানুয়ালি বারকোড লিখুন</p>
              {status === 'error' && (
                <button onClick={startCamera} className="mt-2 bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg">
                  আবার চেষ্টা করুন
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Last scan result */}
      <AnimatePresence>
        {lastCode && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-success/15 border border-success/30 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined !text-[18px] text-success">check_circle</span>
            <div>
              <p className="text-label-sm text-on-surface-var">স্ক্যান সফল</p>
              <p className="text-body-md font-bold text-success font-mono">{lastCode}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual entry */}
      <div className="flex gap-2">
        <input
          autoFocus
          value={manual}
          onChange={e => setManual(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit(manual)}
          placeholder="ম্যানুয়ালি বারকোড লিখুন… (Enter চাপুন)"
          className="flex-1 bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
        />
        <Button icon="search" onClick={() => submit(manual)}>খোঁজুন</Button>
      </div>
      <Button variant="secondary" className="w-full" onClick={onClose}>বন্ধ করুন</Button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD COMPONENT — clean, consistent input
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, required, hint, error, children, half, full, locked }) {
  return (
    <div className={full ? 'col-span-2' : half ? '' : ''}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-label-sm font-semibold text-on-surface-var uppercase tracking-wide">{label}</label>
        {required && <span className="text-error text-label-sm">*</span>}
        {locked && <span className="material-symbols-outlined !text-[12px] text-success">lock</span>}
        {hint && <span className="text-label-sm text-on-surface-var font-normal normal-case tracking-normal">({hint})</span>}
      </div>
      {children}
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-label-sm text-error mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined !text-[12px]">error</span>{error}
        </motion.p>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, readOnly, autoFocus, mono, taka, className, type = 'text', min, step, ...rest }) {
  return (
    <div className="relative">
      {taka && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var font-bold text-sm pointer-events-none">৳</span>}
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} readOnly={readOnly} autoFocus={autoFocus}
        min={min} step={step}
        className={[
          'w-full border rounded-xl px-4 py-3 text-body-md text-on-surface',
          'focus:outline-none focus:ring-2 transition-all',
          taka ? 'pl-7' : '',
          readOnly
            ? 'bg-success/5 border-success/30 text-success font-semibold cursor-default focus:ring-0'
            : 'bg-surface-high border-outline-var focus:border-primary focus:ring-primary/25',
          mono ? 'font-mono tracking-wide' : '',
          className,
        ].filter(Boolean).join(' ')}
        {...rest}
      />
    </div>
  );
}

function SelectInput({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange}
      className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all">
      {children}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STOCK-IN SMART FORM
// ─────────────────────────────────────────────────────────────────────────────
const BLANK = {
  // Auto-filled from barcode scan
  barcode: '', productId: '', productName: '', sku: '',
  unit: 'pcs', costPrice: '', salePrice: '', category: '', company: '', mrp: '',
  reorderLevel: '50', isNewProduct: false, source: '',
  // User fills
  quantity: '', supplier: '',
  expiryDate: '', purchaseDate: format(new Date(), 'yyyy-MM-dd'),
  notes: '', status: 'received',
};

function StockInForm({ onSave, onCancel, suppliers, loading, initialBarcode }) {
  const [form, setForm]         = useState({ ...BLANK, barcode: initialBarcode || '' });
  const [errors, setErrors]     = useState({});
  const [looking, setLooking]   = useState(false);
  const [found, setFound]       = useState(null); // null | 'local' | 'registry' | false
  const barcodeRef              = useRef(null);

  // Auto-lookup when initialBarcode provided
  useEffect(() => {
    if (initialBarcode) lookup(initialBarcode);
    else setTimeout(() => barcodeRef.current?.focus(), 100);
  }, [initialBarcode]); // eslint-disable-line

  // Auto-calc costTotal
  const costTotal = (parseFloat(form.costPrice) || 0) * (parseFloat(form.quantity) || 0);
  const profit    = (parseFloat(form.salePrice) || 0) - (parseFloat(form.costPrice) || 0);
  const margin    = form.salePrice && form.costPrice
    ? (((parseFloat(form.salePrice) - parseFloat(form.costPrice)) / parseFloat(form.salePrice)) * 100).toFixed(1)
    : null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const lookup = async (code) => {
    if (!code.trim()) return;
    setLooking(true); setFound(null);
    try {
      const { data } = await api.get(`/products/barcode/${encodeURIComponent(code.trim())}`);
      const p = data.data;
      const isCentral = p.source === 'central';
      setForm(f => ({
        ...f,
        barcode:     p.barcode || code,
        productId:   p._id || '',
        productName: p.name,
        sku:         p.sku || '',
        unit:        p.unit,
        company:     p.company || '',
        mrp:         String(p.mrp || p.salePrice || ''),
        // Option A: central never sends cost price — shop enters own.
        costPrice:   isCentral ? '' : String(p.costPrice ?? ''),
        // central: sale price defaults to MRP (locked). others: from product.
        salePrice:   isCentral ? String(p.mrp || '') : String(p.salePrice ?? ''),
        category:    p.category,
        reorderLevel: String(p.reorderLevel || 50),
        isNewProduct: false,
        source:       p.source || 'local',
      }));
      setFound(p.source === 'central' ? 'central' : p.source === 'registry' ? 'registry' : 'local');
      toast.success(`✅ পণ্য পাওয়া গেছে: ${p.name}`);
    } catch (err) {
      if (err.response?.status === 404) {
        setForm(f => ({ ...f, barcode: code, productId: '', productName: '', sku: '', isNewProduct: true, source: '' }));
        setFound(false);
        toast('📝 নতুন পণ্য — বিস্তারিত পূরণ করুন', { icon: '🆕' });
      } else {
        toast.error('লুকআপ ব্যর্থ। আবার চেষ্টা করুন।');
      }
    }
    setLooking(false);
  };

  const validate = () => {
    const e = {};
    if (!form.barcode.trim())                  e.barcode     = 'বারকোড প্রয়োজন';
    if (!form.productName.trim())              e.productName = 'পণ্যের নাম প্রয়োজন';
    if (!form.quantity || +form.quantity < 1)  e.quantity    = 'পরিমাণ কমপক্ষে ১';
    if (!form.supplier)                        e.supplier    = 'সরবরাহকারী প্রয়োজন';
    if (!form.costPrice || +form.costPrice < 0) e.costPrice  = 'ক্রয়মূল্য লিখুন';
    if (!form.salePrice || +form.salePrice < 0) e.salePrice  = 'বিক্রয়মূল্য লিখুন';
    if (form.isNewProduct && !form.category)   e.category    = 'ক্যাটাগরি প্রয়োজন';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) { toast.error('সব প্রয়োজনীয় তথ্য পূরণ করুন'); return; }
    onSave({ ...form, costTotal, quantity: +form.quantity, costPrice: +form.costPrice, salePrice: +form.salePrice, reorderLevel: +form.reorderLevel });
  };

  const sourceLabel = found === 'central'
    ? { text: 'কেন্দ্রীয় ডেটাবেজ থেকে পাওয়া গেছে — নিজের কেনা/বিক্রয় দাম দিন', color: 'text-primary', bg: 'bg-primary/10 border-primary/25' }
    : found === 'registry'
    ? { text: 'গ্লোবাল রেজিস্ট্রি থেকে পাওয়া গেছে', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/25' }
    : found === 'local'
    ? { text: 'আপনার ডেটাবেজ থেকে পাওয়া গেছে', color: 'text-success', bg: 'bg-success/10 border-success/25' }
    : null;

  return (
    <div className="space-y-5">

      {/* ── STEP 1: Barcode ─────────────────────────────────────── */}
      <div className="relative rounded-2xl border border-primary/20 bg-primary/5 p-5 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[11px] font-black">১</span>
          </div>
          <span className="text-label-md font-black text-primary uppercase tracking-widest">বারকোড স্ক্যান বা লিখুন</span>
        </div>
        <div className="flex gap-2">
          <input
            ref={barcodeRef}
            value={form.barcode}
            onChange={e => { set('barcode', e.target.value); setFound(null); }}
            onKeyDown={e => e.key === 'Enter' && form.barcode.trim() && lookup(form.barcode)}
            placeholder="বারকোড স্ক্যান করুন বা নম্বর লিখুন… (Enter)"
            className="flex-1 bg-surface border-2 border-primary/30 rounded-xl px-4 py-3 text-body-md font-mono text-primary tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-on-surface-var/50 text-lg"
          />
          <Button icon={looking ? undefined : 'search'} loading={looking} onClick={() => lookup(form.barcode)}>
            খোঁজুন
          </Button>
        </div>
        {errors.barcode && <p className="text-label-sm text-error mt-1.5 flex items-center gap-1"><span className="material-symbols-outlined !text-[12px]">error</span>{errors.barcode}</p>}

        {/* Result banner */}
        <AnimatePresence>
          {found !== null && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5 border ${found ? sourceLabel.bg : 'bg-warning/10 border-warning/25'}`}>
              <span className={`material-symbols-outlined !text-[18px] ${found ? sourceLabel.color : 'text-warning'}`}>
                {found ? 'check_circle' : 'new_label'}
              </span>
              <div>
                {found
                  ? <p className={`text-body-md font-bold ${sourceLabel.color}`}>{sourceLabel.text} — তথ্য স্বয়ংক্রিয় পূরণ হয়েছে ✓</p>
                  : <p className="text-body-md font-bold text-warning">নতুন পণ্য — নিচে বিস্তারিত লিখুন। ডেটাবেজে স্বয়ংক্রিয় তৈরি হবে।</p>
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── STEP 2: Product Details ──────────────────────────────── */}
      <div className="rounded-2xl border border-outline-var bg-surface-high/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-surface-highest flex items-center justify-center flex-shrink-0">
            <span className="text-on-surface-var text-[11px] font-black">২</span>
          </div>
          <span className="text-label-md font-black text-on-surface-var uppercase tracking-widest">পণ্যের তথ্য</span>
          {found && (
            <span className="chip chip-success ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />স্বয়ংক্রিয় পূরণ
            </span>
          )}
          {form.isNewProduct && (
            <span className="chip chip-warning ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />নতুন পণ্য
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Product name — full width */}
          <div className="col-span-2">
            <Field label="পণ্যের নাম" required error={errors.productName} locked={!!found}>
              <TextInput
                value={form.productName}
                onChange={e => set('productName', e.target.value)}
                placeholder="পণ্যের নাম লিখুন…"
                readOnly={!!found}
              />
            </Field>
          </div>

          {/* SKU */}
          <Field label="SKU" locked={!!found}>
            <TextInput value={form.sku} onChange={e => set('sku', e.target.value.toUpperCase())}
              placeholder="SKU-0001" readOnly={!!found} mono />
          </Field>

          {/* Unit */}
          <Field label="একক" locked={!!found}>
            {found ? (
              <TextInput value={form.unit} readOnly />
            ) : (
              <SelectInput value={form.unit} onChange={e => set('unit', e.target.value)}>
                {[['pcs','পিস'],['packs','প্যাক'],['boxes','বাক্স'],['bags','ব্যাগ'],['kg','কেজি'],['g','গ্রাম'],['litres','লিটার']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </SelectInput>
            )}
          </Field>

          {/* Company — from central */}
          {found === 'central' && form.company && (
            <Field label="কোম্পানি" locked>
              <TextInput value={form.company} readOnly />
            </Field>
          )}

          {/* MRP — editable, suggested from central but shopkeeper can change */}
          {found === 'central' && (
            <Field label="MRP (সর্বোচ্চ বিক্রয়মূল্য)" hint="কেন্দ্রীয় থেকে এসেছে — চাইলে পরিবর্তন করুন">
              <TextInput type="number" min="0" step="0.01" taka
                value={form.mrp} onChange={e => set('mrp', e.target.value)} placeholder="0.00" />
            </Field>
          )}

          {/* Cost price */}
          <Field label="ক্রয়মূল্য" required hint={found === 'central' ? 'আপনার নিজের কেনা দাম' : 'ইনপুট করুন বা আপডেট করুন'} error={errors.costPrice}>
            <TextInput type="number" min="0" step="0.01" taka
              value={form.costPrice} onChange={e => set('costPrice', e.target.value)}
              placeholder="0.00" />
          </Field>

          {/* Sale price — editable for everyone */}
          <Field label="বিক্রয়মূল্য" required hint="আপনার নিজের বিক্রয় দাম" error={errors.salePrice}>
            <TextInput type="number" min="0" step="0.01" taka
              value={form.salePrice} onChange={e => set('salePrice', e.target.value)}
              placeholder="0.00" />
          </Field>

          {/* New product extra fields */}
          {/* Category — always editable, shopkeeper can add their own */}
          <Field label="ক্যাটাগরি" required={form.isNewProduct} hint="নিজে লিখুন বা বাছাই করুন" error={errors.category}>
            <input list="stockin-category-list" value={form.category}
              onChange={e => set('category', e.target.value)}
              placeholder="যেমন: টফি, গামি, চকোলেট"
              className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all" />
            <datalist id="stockin-category-list">
              {['টফি','ললিপপ','চকোলেট','গামি','মার্শমেলো','সাওয়ার ক্যান্ডি','হার্ড ক্যান্ডি','বিস্কুট','কেক','চিপস','পানীয়','অন্যান্য'].map(c => <option key={c} value={c} />)}
            </datalist>
          </Field>

          {form.isNewProduct && (
            <Field label="রিঅর্ডার লেভেল" hint="এর নিচে গেলে সতর্কতা">
              <TextInput type="number" min="0" value={form.reorderLevel} onChange={e => set('reorderLevel', e.target.value)} />
            </Field>
          )}

          {/* Margin indicator */}
          {margin && (
            <div className="col-span-2">
              <div className="flex items-center gap-3 bg-success/8 border border-success/20 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined !text-[20px] text-success">trending_up</span>
                <div className="flex-1">
                  <p className="text-label-sm text-on-surface-var">মুনাফা মার্জিন</p>
                  <p className="text-body-md font-bold text-success">{margin}% — প্রতি পিসে {formatBDT(profit)} লাভ</p>
                </div>
                <div className="w-24 h-2 bg-surface-highest rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full transition-all" style={{ width: `${Math.min(100, parseFloat(margin))}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── STEP 3: Stock Details ────────────────────────────────── */}
      <div className="rounded-2xl border border-outline-var bg-surface-high/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-surface-highest flex items-center justify-center flex-shrink-0">
            <span className="text-on-surface-var text-[11px] font-black">৩</span>
          </div>
          <span className="text-label-md font-black text-on-surface-var uppercase tracking-widest">স্টক বিস্তারিত</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Quantity */}
          <Field label="পরিমাণ" required hint={form.unit} error={errors.quantity}>
            <TextInput type="number" min="1" value={form.quantity}
              onChange={e => set('quantity', e.target.value)} placeholder="যেমন: ৫০০" autoFocus={!!found} />
          </Field>

          {/* Supplier — combobox: pick from list OR type new name */}
          <Field label="সরবরাহকারী" required hint="তালিকা থেকে বাছুন বা নতুন নাম লিখুন" error={errors.supplier}>
            <input
              list="supplier-datalist"
              value={form.supplier}
              onChange={e => set('supplier', e.target.value)}
              placeholder="সরবরাহকারীর নাম লিখুন বা বাছাই করুন…"
              autoComplete="off"
              className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all"
            />
            <datalist id="supplier-datalist">
              {(suppliers || []).map(s => (
                <option key={s._id || s.name} value={s.name} />
              ))}
            </datalist>
          </Field>

          {/* Purchase date */}
          <Field label="ক্রয়ের তারিখ" hint="স্বয়ংক্রিয়">
            <TextInput type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
          </Field>

          {/* Expiry date */}
          <Field label="মেয়াদ উত্তীর্ণের তারিখ">
            <TextInput type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
          </Field>

          {/* Cost total — AUTO */}
          <Field label="মোট ক্রয় খরচ" hint="স্বয়ংক্রিয় হিসাব">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-success font-bold text-sm pointer-events-none">৳</span>
              <input
                readOnly
                value={costTotal > 0 ? costTotal.toFixed(2) : ''}
                placeholder="পরিমাণ ও ক্রয়মূল্য দিলে স্বয়ংক্রিয় হবে"
                className="w-full bg-success/5 border border-success/30 rounded-xl pl-7 pr-4 py-3 text-body-md font-bold text-success cursor-default focus:outline-none"
              />
            </div>
          </Field>

          {/* Status */}
          <Field label="অবস্থা">
            <SelectInput value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="received">গৃহীত</option>
              <option value="pending">অপেক্ষমাণ</option>
              <option value="cancelled">বাতিল</option>
            </SelectInput>
          </Field>

          {/* Notes */}
          <div className="col-span-2">
            <Field label="নোট">
              <TextInput value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="অতিরিক্ত মন্তব্য (ঐচ্ছিক)…" />
            </Field>
          </div>
        </div>
      </div>

      {/* ── Summary card ────────────────────────────────────────── */}
      <AnimatePresence>
        {form.productName && form.quantity && form.costPrice && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 to-transparent p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined !text-[18px] text-primary">receipt_long</span>
              <p className="text-label-md font-black text-primary uppercase tracking-wide">সারসংক্ষেপ</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'পণ্য',       value: form.productName, highlight: false },
                { label: 'পরিমাণ',    value: `${form.quantity} ${form.unit}`, highlight: false },
                { label: 'ক্রয়মূল্য', value: formatBDT(+form.costPrice), highlight: false },
                { label: 'মোট খরচ',  value: formatBDT(costTotal), highlight: true },
              ].map(s => (
                <div key={s.label} className="bg-surface rounded-xl p-3">
                  <p className="text-label-sm text-on-surface-var">{s.label}</p>
                  <p className={`text-body-md font-bold mt-0.5 truncate ${s.highlight ? 'text-primary' : 'text-on-surface'}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-1">
        <Button variant="secondary" className="flex-1" onClick={onCancel}>বাতিল</Button>
        <Button icon="save" loading={loading} className="flex-2" onClick={handleSave}
          style={{ flex: 2 }}>
          স্টক সংরক্ষণ করুন
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE COLUMNS
// ─────────────────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'batchNo',    label: 'ব্যাচ নং',    render: v => <span className="font-mono text-label-md text-primary">{v}</span> },
  { key: 'product',    label: 'পণ্য',          render: (_, r) => (
    <div>
      <p className="font-semibold text-on-surface">{r.product?.name || '—'}</p>
      <p className="font-mono text-label-sm text-on-surface-var">{r.product?.barcode || r.product?.sku}</p>
    </div>
  )},
  { key: 'quantity',   label: 'পরিমাণ',       render: (v, r) => <span className="font-semibold">{v} {r.product?.unit}</span> },
  { key: 'supplier',   label: 'সরবরাহকারী' },
  { key: 'costTotal',  label: 'মোট খরচ',     render: v => <span className="font-bold text-primary">{formatBDT(v)}</span> },
  { key: 'purchaseDate', label: 'ক্রয়ের তারিখ', render: (_, r) => <span className="text-on-surface-var text-label-sm">{r.createdAt ? format(new Date(r.createdAt), 'dd/MM/yyyy') : '—'}</span> },
  { key: 'expiryDate', label: 'মেয়াদ',        render: v => v ? <span className={`text-label-sm ${new Date(v) < new Date() ? 'text-error font-semibold' : 'text-on-surface-var'}`}>{format(new Date(v), 'dd/MM/yyyy')}</span> : <span className="text-on-surface-var">—</span> },
  { key: 'status',     label: 'অবস্থা',        render: v => (
    <Badge label={v === 'received' ? 'গৃহীত' : v === 'pending' ? 'অপেক্ষমাণ' : 'বাতিল'}
      variant={v === 'received' ? 'success' : v === 'pending' ? 'warning' : 'error'} dot />
  )},
  { key: 'receivedBy', label: 'গৃহীত',         render: (_, r) => <span className="text-on-surface-var text-label-sm">{r.receivedBy?.name || '—'}</span> },
];

const STATUS_TABS = [{ v: '', l: 'সব' }, { v: 'received', l: 'গৃহীত' }, { v: 'pending', l: 'অপেক্ষমাণ' }, { v: 'cancelled', l: 'বাতিল' }];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function StockIn() {
  const qc = useQueryClient();
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [scanMode, setScanMode]       = useState(null); // null | 'camera' | 'usb'
  const [scannedCode, setScannedCode] = useState('');

  const { data: suppliersData } = useQuery({ queryKey: ['suppliers'], queryFn: () => api.get('/suppliers').then(r => r.data.data) });
  const { data, isLoading } = useQuery({
    queryKey: ['stock-in', page, statusFilter],
    queryFn: () => api.get(`/stock-in?page=${page}&limit=15${statusFilter ? `&status=${statusFilter}` : ''}`).then(r => r.data),
    keepPreviousData: true,
  });

  const items = data?.data || [];
  const meta  = data?.meta || {};

  // USB keyboard wedge scanner (active when modal is closed)
  const bufferRef = useRef('');
  const timerRef  = useRef(null);
  useEffect(() => {
    if (modalOpen || scanMode) return;
    const handle = e => {
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 4) {
          const code = bufferRef.current.trim();
          bufferRef.current = '';
          setScannedCode(code);
          setModalOpen(true);
        }
        bufferRef.current = '';
      } else if (e.key.length === 1) {
        bufferRef.current += e.key;
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { bufferRef.current = ''; }, 80);
      }
    };
    window.addEventListener('keydown', handle);
    return () => { window.removeEventListener('keydown', handle); clearTimeout(timerRef.current); };
  }, [modalOpen, scanMode]);

  const mutation = useMutation({
    mutationFn: async (payload) => {
      // If we already have a product id from own DB, update its prices on restock
      if (payload.productId && payload.source === 'own') {
        try {
          await api.put(`/products/${payload.productId}`, {
            costPrice: payload.costPrice,
            salePrice: payload.salePrice,
          });
        } catch { /* non-fatal */ }
      }
      // Single call — backend auto-creates the product if productId is missing
      // (works for central, registry and brand-new products). Tenant-isolated.
      return api.post('/stock-in', {
        product:      payload.productId || undefined,
        productName:  payload.productName,
        barcode:      payload.barcode,
        company:      payload.company,
        mrp:          payload.mrp,
        sku:          payload.sku,
        category:     payload.category,
        unit:         payload.unit,
        costPrice:    payload.costPrice,
        salePrice:    payload.salePrice,
        reorderLevel: payload.reorderLevel,
        quantity:     payload.quantity,
        supplier:     payload.supplier,
        costTotal:    payload.costTotal,
        notes:        payload.notes,
        status:       payload.status,
      });
    },
    onSuccess: (_, payload) => {
      qc.invalidateQueries(['stock-in']);
      qc.invalidateQueries(['products-all']);
      qc.invalidateQueries(['products-pos']);
      qc.invalidateQueries(['dashboard-stats']);
      qc.invalidateQueries(['inventory']);
      toast.success(`✅ স্টক গ্রহণ সম্পন্ন! ${payload.productName} — ${payload.quantity} ${payload.unit}`);
      setModalOpen(false);
      setScannedCode('');
    },
    onError: e => toast.error(e.response?.data?.message || 'সংরক্ষণ ব্যর্থ হয়েছে।'),
  });

  const openCamera = () => { setScanMode('camera'); };
  const openNew    = () => { setScannedCode(''); setModalOpen(true); };

  const handleCameraScan = (code) => {
    setScanMode(null);
    setScannedCode(code);
    setModalOpen(true);
  };

  const filteredItems = items.filter(r =>
    !search ||
    r.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.batchNo?.toLowerCase().includes(search.toLowerCase()) ||
    r.product?.barcode?.includes(search)
  );

  return (
    <div className="space-y-stack-lg">
      <PageHeader
        title="স্টক-ইন"
        subtitle="বারকোড স্ক্যান করুন — পণ্যের সব তথ্য স্বয়ংক্রিয় পূরণ হবে।"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" icon="photo_camera" onClick={openCamera}>ক্যামেরা স্ক্যান</Button>
            <Button variant="secondary" icon="barcode_reader" onClick={() => setScanMode('usb')}>USB স্ক্যানার</Button>
            <Button icon="add" onClick={openNew}>ম্যানুয়াল এন্ট্রি</Button>
          </div>
        }
      />

      {/* USB active hint */}
      <AnimatePresence>
        {!modalOpen && !scanMode && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined !text-[18px] text-primary">barcode_reader</span>
            </div>
            <div className="flex-1">
              <p className="text-body-md text-on-surface font-semibold">USB বারকোড স্ক্যানার সক্রিয়</p>
              <p className="text-label-sm text-on-surface-var">যেকোনো সময় স্ক্যান করুন — স্বয়ংক্রিয়ভাবে ফর্ম খুলবে</p>
            </div>
            <Badge label="সক্রিয়" variant="success" dot />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'মোট ব্যাচ',   value: meta.total || 0,                                icon: 'inventory_2', color: 'text-primary' },
          { label: 'অপেক্ষমাণ',   value: items.filter(i => i.status === 'pending').length, icon: 'pending',     color: 'text-warning' },
          { label: 'আজ গৃহীত',   value: items.filter(i => i.status === 'received').length, icon: 'check_circle', color: 'text-success' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * .05 }}
            className="flex items-center gap-2 bg-surface border border-outline-var rounded-xl px-4 py-2">
            <span className={`material-symbols-outlined !text-[17px] ${s.color}`}>{s.icon}</span>
            <span className="text-body-md font-bold text-on-surface">{s.value}</span>
            <span className="text-label-sm text-on-surface-var">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-stack-md py-stack-sm border-b border-outline-var">
          <div className="relative flex-1 min-w-48">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var !text-[16px]">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ব্যাচ, পণ্য বা বারকোড…"
              className="w-full bg-surface-low border border-outline-var rounded-lg pl-8 pr-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary transition-all" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_TABS.map(s => (
              <button key={s.v} onClick={() => { setStatusFilter(s.v); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-label-md font-semibold transition-all ${statusFilter === s.v ? 'bg-primary text-white shadow-primary-glow' : 'bg-surface-high text-on-surface-var hover:text-on-surface'}`}>
                {s.l}
              </button>
            ))}
          </div>
        </div>
        <DataTable columns={COLUMNS} data={filteredItems} loading={isLoading} emptyMessage="কোনো ব্যাচ নেই। বারকোড স্ক্যান করে শুরু করুন।" />
        <div className="px-stack-md pb-stack-sm">
          <Pagination page={page} totalPages={meta.pages || 1} onChange={setPage} />
        </div>
      </Card>

      {/* Camera scanner modal */}
      <AnimatePresence>
        {scanMode === 'camera' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setScanMode(null)} />
            <motion.div
              initial={{ opacity: 0, scale: .95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: .95 }} transition={{ type: 'spring', bounce: .1, duration: .35 }}
              className="relative bg-surface border border-outline-var rounded-2xl shadow-modal w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-var">
                <h2 className="text-headline-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined !text-[20px] text-primary">photo_camera</span>
                  ক্যামেরা দিয়ে স্ক্যান করুন
                </h2>
                <button onClick={() => setScanMode(null)} className="p-1.5 rounded-lg hover:bg-surface-high text-on-surface-var transition-colors">
                  <span className="material-symbols-outlined !text-[20px]">close</span>
                </button>
              </div>
              <div className="p-5">
                <CameraScanner onDetected={handleCameraScan} onClose={() => setScanMode(null)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* USB hint modal */}
      <AnimatePresence>
        {scanMode === 'usb' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setScanMode(null)} />
            <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="relative bg-surface border border-outline-var rounded-2xl shadow-modal w-full max-w-sm p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined !text-[40px] text-primary">barcode_reader</span>
              </div>
              <p className="text-headline-sm font-bold text-on-surface mb-2">USB স্ক্যানার প্রস্তুত</p>
              <p className="text-body-md text-on-surface-var mb-4">এখন যেকোনো পণ্যের বারকোড স্ক্যান করুন। স্বয়ংক্রিয়ভাবে ফর্ম খুলবে।</p>
              <div className="flex justify-center gap-2 mb-6">
                {[0,1,2,3].map(i => (
                  <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-primary"
                    animate={{ opacity: [.3, 1, .3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * .2 }} />
                ))}
              </div>
              <Button variant="secondary" className="w-full" onClick={() => setScanMode(null)}>বন্ধ করুন</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Stock-In Form Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 overflow-y-auto">
            <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setModalOpen(false); setScannedCode(''); }} />
            <motion.div
              initial={{ opacity: 0, scale: .96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: .96 }} transition={{ type: 'spring', bounce: .1, duration: .4 }}
              className="relative bg-surface border border-outline-var rounded-2xl shadow-modal w-full max-w-2xl my-4">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-var">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined !text-[20px] text-primary">add_box</span>
                  </div>
                  <div>
                    <h2 className="text-headline-sm font-bold text-on-surface">স্টক-ইন এন্ট্রি</h2>
                    <p className="text-label-sm text-on-surface-var">মাল গ্রহণ করুন ও সংরক্ষণ করুন</p>
                  </div>
                </div>
                <button onClick={() => { setModalOpen(false); setScannedCode(''); }}
                  className="p-2 rounded-xl hover:bg-surface-high text-on-surface-var transition-colors">
                  <span className="material-symbols-outlined !text-[20px]">close</span>
                </button>
              </div>
              {/* Body */}
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                <StockInForm
                  key={scannedCode || 'manual'}
                  initialBarcode={scannedCode}
                  suppliers={suppliersData || []}
                  loading={mutation.isPending}
                  onSave={data => mutation.mutate(data)}
                  onCancel={() => { setModalOpen(false); setScannedCode(''); }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
