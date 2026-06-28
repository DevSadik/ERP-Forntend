import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { format } from 'date-fns';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const fmt = n => '৳' + (parseFloat(n) || 0).toLocaleString('en-BD', { minimumFractionDigits: 0 });

// ── Camera Scanner ────────────────────────────────────────────────────────────
function CameraScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const lastScan = useRef(0);
  const [status, setStatus] = useState('starting');
  const [manual, setManual] = useState('');

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        if ('BarcodeDetector' in window) {
          if (!detectorRef.current) detectorRef.current = new window.BarcodeDetector({ formats: ['ean_13','ean_8','code_128','code_39','qr_code','upc_a'] });
          setStatus('scanning');
          const scan = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) { rafRef.current = requestAnimationFrame(scan); return; }
            if (Date.now() - lastScan.current > 500) {
              lastScan.current = Date.now();
              try { const codes = await detectorRef.current.detect(videoRef.current); if (codes.length > 0) { onDetected(codes[0].rawValue); return; } } catch {}
            }
            rafRef.current = requestAnimationFrame(scan);
          };
          rafRef.current = requestAnimationFrame(scan);
        } else setStatus('manual');
      } catch { setStatus('error'); }
    })();
    return stopCamera;
  }, [onDetected, stopCamera]);

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
        {status === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-48 h-24">
              {[['top-0 left-0','border-t-[3px] border-l-[3px] rounded-tl-lg'],['top-0 right-0','border-t-[3px] border-r-[3px] rounded-tr-lg'],['bottom-0 left-0','border-b-[3px] border-l-[3px] rounded-bl-lg'],['bottom-0 right-0','border-b-[3px] border-r-[3px] rounded-br-lg']].map(([pos,cls],i) => <div key={i} className={`absolute w-6 h-6 border-primary ${cls} ${pos}`} />)}
              <motion.div className="absolute left-1 right-1 h-[2px] bg-primary" style={{ boxShadow:'0 0 8px #10b981' }} animate={{ top:['8%','92%','8%'] }} transition={{ duration:2, repeat:Infinity, ease:'linear' }} />
            </div>
          </div>
        )}
        {status === 'starting' && <div className="absolute inset-0 flex items-center justify-center bg-black/70"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}
        {(status === 'error' || status === 'manual') && <div className="absolute inset-0 flex items-center justify-center bg-black/80"><p className="text-white text-sm">ম্যানুয়ালি লিখুন</p></div>}
      </div>
      <div className="flex gap-2">
        <input autoFocus value={manual} onChange={e => setManual(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && manual.trim()) { onDetected(manual.trim()); setManual(''); }}}
          placeholder="বারকোড লিখুন… (Enter)"
          className="flex-1 bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md font-mono text-on-surface focus:outline-none focus:border-primary transition-all" />
        <button onClick={() => { if (manual.trim()) { onDetected(manual.trim()); setManual(''); }}} className="bg-primary text-white font-bold px-4 rounded-xl">OK</button>
      </div>
      <button onClick={onClose} className="w-full bg-surface-high border border-outline-var text-on-surface font-semibold rounded-xl py-2.5 text-sm hover:bg-surface-highest transition-colors">বন্ধ</button>
    </div>
  );
}

// ── Entry Form ────────────────────────────────────────────────────────────────
const ENTRY_BLANK = { type: 'sale', barcode: '', productName: '', quantity: '1', unitPrice: '', totalAmount: '', paidAmount: '', notes: '', entryDate: format(new Date(), 'yyyy-MM-dd') };

function EntryModal({ customerId, onClose, lang }) {
  const qc = useQueryClient();
  const L = lang === 'en';
  const [form, setForm]       = useState(ENTRY_BLANK);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [errors, setErrors]   = useState({});
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-calc total
  const qty   = parseFloat(form.quantity)  || 0;
  const price = parseFloat(form.unitPrice) || 0;
  useEffect(() => { if (qty > 0 && price > 0) set('totalAmount', String((qty * price).toFixed(2))); }, [form.quantity, form.unitPrice]);

  const due = Math.max(0, (parseFloat(form.totalAmount) || 0) - (parseFloat(form.paidAmount) || 0));

  const handleScan = async (code) => {
    setScannerOpen(false);
    set('barcode', code);
    try {
      const { data } = await api.get(`/products/barcode/${encodeURIComponent(code)}`);
      const p = data.data;
      set('productName', p.name);
      set('unitPrice', String(p.salePrice || ''));
      toast.success(`${p.name}`);
    } catch { toast('পণ্য পাওয়া যায়নি — নাম লিখুন', { icon: '📝' }); }
  };

  const mutation = useMutation({
    mutationFn: d => api.post(`/customers/${customerId}/ledger`, d),
    onSuccess: () => {
      qc.invalidateQueries(['customer-ledger', customerId]);
      qc.invalidateQueries(['customers']);
      toast.success(L ? 'Entry saved!' : 'এন্ট্রি সংরক্ষিত!');
      onClose();
    },
    onError: e => toast.error(e.response?.data?.message || 'ব্যর্থ।'),
  });

  const validate = () => {
    const e = {};
    if (!form.totalAmount || +form.totalAmount <= 0) e.totalAmount = L ? 'Enter amount' : 'পরিমাণ দিন';
    if (form.type === 'sale' && !form.productName.trim()) e.productName = L ? 'Enter product name' : 'পণ্যের নাম দিন';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const TYPE_OPTS = [
    { v: 'sale',    l: L ? 'Sale (Credit)' : 'বিক্রি (বাকি)',    color: 'text-error'   },
    { v: 'payment', l: L ? 'Payment In'    : 'পেমেন্ট পাওয়া',   color: 'text-success' },
    { v: 'return',  l: L ? 'Return'        : 'ফেরত',             color: 'text-warning' },
  ];

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div className="flex gap-1 bg-surface-high p-1 rounded-xl">
        {TYPE_OPTS.map(t => (
          <button key={t.v} onClick={() => set('type', t.v)}
            className={`flex-1 py-2 rounded-lg text-label-md font-bold transition-all ${form.type === t.v ? `bg-surface ${t.color} shadow-card` : 'text-on-surface-var hover:text-on-surface'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Product (only for sale/return) */}
      {form.type !== 'payment' && (
        <>
          {scannerOpen && (
            <div className="bg-surface-high border border-outline-var rounded-xl p-3">
              <CameraScanner onDetected={handleScan} onClose={() => setScannerOpen(false)} />
            </div>
          )}
          <div>
            <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">{L ? 'Product' : 'পণ্য'}</label>
            <div className="flex gap-2">
              <input value={form.productName} onChange={e => set('productName', e.target.value)}
                placeholder={L ? 'Product name…' : 'পণ্যের নাম…'}
                className={`flex-1 bg-surface-high border rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${errors.productName ? 'border-error' : 'border-outline-var'}`} />
              <button onClick={() => setScannerOpen(s => !s)}
                className={`px-3 rounded-xl border font-semibold transition-all ${scannerOpen ? 'bg-primary text-white border-primary' : 'bg-surface-high border-outline-var text-on-surface-var hover:border-primary hover:text-primary'}`}>
                <span className="material-symbols-outlined !text-[20px]">qr_code_scanner</span>
              </button>
            </div>
            {errors.productName && <p className="text-label-sm text-error mt-1">{errors.productName}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">{L ? 'Qty' : 'পরিমাণ'}</label>
              <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)}
                className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
            </div>
            <div>
              <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">{L ? 'Unit Price ৳' : 'একক দাম ৳'}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var font-bold">৳</span>
                <input type="number" min="0" value={form.unitPrice} onChange={e => set('unitPrice', e.target.value)}
                  placeholder="0"
                  className="w-full bg-surface-high border border-outline-var rounded-xl pl-7 pr-3 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Total amount */}
      <div>
        <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">
          {form.type === 'payment' ? (L ? 'Payment Amount ৳ *' : 'পেমেন্টের পরিমাণ ৳ *') : (L ? 'Total Amount ৳ *' : 'মোট টাকা ৳ *')}
          {form.type === 'sale' && qty > 0 && price > 0 && <span className="ml-1 text-success normal-case font-normal tracking-normal">(স্বয়ংক্রিয়)</span>}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var font-bold">৳</span>
          <input type="number" min="0" value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)}
            placeholder="0"
            className={`w-full bg-surface-high border rounded-xl pl-7 pr-3 py-3 text-body-md text-on-surface font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${errors.totalAmount ? 'border-error' : 'border-outline-var'}`} />
        </div>
        {errors.totalAmount && <p className="text-label-sm text-error mt-1">{errors.totalAmount}</p>}
      </div>

      {/* Paid amount (for sale — partial payment) */}
      {form.type === 'sale' && (
        <div>
          <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">
            {L ? 'Paid Now ৳' : 'এখন কত দিল ৳'} <span className="normal-case font-normal tracking-normal text-on-surface-var/60">({L ? 'optional' : 'ঐচ্ছিক'})</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var font-bold">৳</span>
            <input type="number" min="0" value={form.paidAmount} onChange={e => set('paidAmount', e.target.value)}
              placeholder="0"
              className="w-full bg-surface-high border border-outline-var rounded-xl pl-7 pr-3 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          {/* Due preview */}
          {form.totalAmount && (
            <div className="flex items-center justify-between mt-2 bg-error/8 border border-error/15 rounded-xl px-3 py-2">
              <span className="text-label-sm text-on-surface-var">{L ? 'Remaining Due' : 'বাকি থাকবে'}</span>
              <span className="text-body-md font-black text-error">{fmt(due)}</span>
            </div>
          )}
        </div>
      )}

      {/* Date */}
      <div>
        <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">{L ? 'Date' : 'তারিখ'} <span className="normal-case font-normal tracking-normal text-success/70">(স্বয়ংক্রিয়)</span></label>
        <input type="date" value={form.entryDate} onChange={e => set('entryDate', e.target.value)}
          className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-label-sm font-semibold text-on-surface-var mb-1.5 uppercase tracking-wide">{L ? 'Notes' : 'নোট'}</label>
        <input value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder={L ? 'Optional note…' : 'ঐচ্ছিক মন্তব্য…'}
          className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 bg-surface-high border border-outline-var text-on-surface font-semibold rounded-xl py-3 hover:bg-surface-highest transition-colors">
          {L ? 'Cancel' : 'বাতিল'}
        </button>
        <motion.button whileTap={{ scale: .97 }}
          onClick={() => { if (validate()) mutation.mutate(form); }}
          disabled={mutation.isPending}
          className="flex-2 bg-primary text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 disabled:opacity-50 transition-all"
          style={{ flex: 2 }}>
          {mutation.isPending
            ? <><span className="material-symbols-outlined !text-[16px] animate-spin">progress_activity</span>{L ? 'Saving…' : 'সংরক্ষণ…'}</>
            : <><span className="material-symbols-outlined !text-[16px]">save</span>{L ? 'Save Entry' : 'এন্ট্রি সংরক্ষণ করুন'}</>}
        </motion.button>
      </div>
    </div>
  );
}

// ── Main Detail Page ──────────────────────────────────────────────────────────
export default function CustomerDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const qc         = useQueryClient();
  const { lang }   = useLanguage();
  const L = lang === 'en';
  const [entryModal, setEntryModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/v1','') || 'http://localhost:5000';

  const { data, isLoading } = useQuery({
    queryKey: ['customer-ledger', id, typeFilter],
    queryFn: () => api.get(`/customers/${id}/ledger?limit=100`).then(r => r.data.data),
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: entryId => api.delete(`/customers/${id}/ledger/${entryId}`),
    onSuccess: () => { qc.invalidateQueries(['customer-ledger', id]); qc.invalidateQueries(['customers']); toast.success(L ? 'Deleted.' : 'মুছে গেছে।'); },
  });

  if (isLoading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return null;

  const { customer, entries, summary } = data;
  const balance = customer.currentBalance || 0;
  const publicLink = `${window.location.origin}/ledger/public/${customer.publicToken}`;

  const filtered = typeFilter ? entries.filter(e => e.type === typeFilter) : entries;

  const TYPE_ICON  = { sale: 'receipt_long', payment: 'payments', return: 'keyboard_return', opening: 'account_balance' };
  const TYPE_COLOR = { sale: 'text-error', payment: 'text-success', return: 'text-warning', opening: 'text-primary' };
  const TYPE_LABEL = {
    sale:    L ? 'Sale'    : 'বিক্রি',
    payment: L ? 'Payment' : 'পেমেন্ট',
    return:  L ? 'Return'  : 'ফেরত',
    opening: L ? 'Opening' : 'আগের বাকি',
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Back */}
      <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-on-surface-var hover:text-primary transition-colors">
        <span className="material-symbols-outlined !text-[20px]">arrow_back</span>
        <span className="text-body-md font-medium">{L ? 'All Customers' : 'সব গ্রাহক'}</span>
      </button>

      {/* Customer header card */}
      <div className="bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 ${balance > 0 ? 'bg-error/20 text-error' : 'bg-success/20 text-success'}`}>
            {customer.name.slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-headline-md font-black text-on-surface">{customer.name}</h1>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-1 text-body-md text-on-surface-var mt-0.5 hover:text-primary transition-colors">
                <span className="material-symbols-outlined !text-[16px]">call</span>{customer.phone}
              </a>
            )}
            {/* Public link */}
            <button onClick={() => { navigator.clipboard.writeText(publicLink); toast.success(L ? 'Link copied!' : 'লিংক কপি হয়েছে!'); }}
              className="flex items-center gap-1 text-label-sm text-primary hover:underline mt-1.5">
              <span className="material-symbols-outlined !text-[14px]">link</span>
              {L ? 'Copy customer link' : 'গ্রাহকের লিংক কপি করুন'}
            </button>
          </div>
          {/* Balance */}
          <div className="text-right flex-shrink-0">
            <p className="text-label-sm text-on-surface-var">{L ? 'Balance' : 'ব্যালেন্স'}</p>
            <p className={`text-headline-md font-black ${balance > 0 ? 'text-error' : balance < 0 ? 'text-success' : 'text-on-surface-var'}`}>
              {fmt(Math.abs(balance))}
            </p>
            <p className="text-label-sm text-on-surface-var">
              {balance > 0 ? (L ? 'Due' : 'পাওনা') : balance < 0 ? (L ? 'Advance' : 'অগ্রিম') : (L ? 'Clear' : 'নিষ্পত্তি')}
            </p>
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex gap-3 mt-4 flex-wrap">
          {[
            { label: L ? 'Total Sale'    : 'মোট বিক্রি',    value: summary.totalSale,    color: 'text-error'   },
            { label: L ? 'Total Payment' : 'মোট পেমেন্ট',   value: summary.totalPayment, color: 'text-success' },
            { label: L ? 'Total Return'  : 'মোট ফেরত',      value: summary.totalReturn,  color: 'text-warning' },
          ].map(s => (
            <div key={s.label} className="flex-1 min-w-24 bg-surface/70 rounded-xl px-3 py-2 text-center">
              <p className="text-label-sm text-on-surface-var">{s.label}</p>
              <p className={`text-body-md font-bold ${s.color}`}>{fmt(s.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <motion.button whileTap={{ scale: .97 }} onClick={() => setEntryModal(true)}
          className="flex-1 bg-primary text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 transition-all">
          <span className="material-symbols-outlined !text-[18px]">add</span>
          {L ? 'New Entry' : 'নতুন এন্ট্রি'}
        </motion.button>
        <button onClick={() => { navigator.clipboard.writeText(publicLink); toast.success(L ? 'Link copied!' : 'লিংক কপি!'); }}
          className="bg-surface-high border border-outline-var text-on-surface font-semibold rounded-xl px-4 flex items-center gap-2 hover:border-primary hover:text-primary transition-all">
          <span className="material-symbols-outlined !text-[18px]">share</span>
          {L ? 'Share' : 'শেয়ার'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-surface-high p-1 rounded-xl w-fit">
        {[
          { v: '',        l: L ? 'All'     : 'সব'         },
          { v: 'sale',    l: L ? 'Sales'   : 'বিক্রি'     },
          { v: 'payment', l: L ? 'Payment' : 'পেমেন্ট'    },
          { v: 'return',  l: L ? 'Return'  : 'ফেরত'       },
        ].map(t => (
          <button key={t.v} onClick={() => setTypeFilter(t.v)}
            className={`px-3 py-1.5 rounded-lg text-label-md font-semibold transition-all ${typeFilter === t.v ? 'bg-surface text-on-surface shadow-card' : 'text-on-surface-var hover:text-on-surface'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Ledger entries */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center bg-surface border border-outline-var rounded-2xl">
          <span className="material-symbols-outlined !text-[48px] text-on-surface-var opacity-30 block mb-3">receipt_long</span>
          <p className="text-body-md text-on-surface-var">{L ? 'No entries yet' : 'কোনো এন্ট্রি নেই'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e, i) => (
            <motion.div key={e._id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.03 }}
              className="bg-surface border border-outline-var rounded-2xl px-4 py-3.5 flex items-start gap-3">
              {/* Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${e.type === 'sale' ? 'bg-error/10' : e.type === 'payment' ? 'bg-success/10' : 'bg-warning/10'}`}>
                <span className={`material-symbols-outlined !text-[18px] ${TYPE_COLOR[e.type]}`}>{TYPE_ICON[e.type]}</span>
              </div>
              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-label-sm font-bold ${TYPE_COLOR[e.type]}`}>{TYPE_LABEL[e.type]}</span>
                  <span className="text-label-sm text-on-surface-var">
                    {format(new Date(e.entryDate), 'dd/MM/yyyy')}
                  </span>
                </div>
                {e.productName && <p className="text-body-md font-semibold text-on-surface mt-0.5 truncate">{e.productName}{e.quantity > 1 ? ` × ${e.quantity}` : ''}</p>}
                {e.notes && <p className="text-label-sm text-on-surface-var mt-0.5">{e.notes}</p>}
                {e.type === 'sale' && e.paidAmount > 0 && (
                  <p className="text-label-sm text-success mt-0.5">{L ? 'Paid' : 'দিয়েছে'}: {fmt(e.paidAmount)}</p>
                )}
              </div>
              {/* Amount + balance */}
              <div className="text-right flex-shrink-0">
                <p className={`text-body-md font-black ${TYPE_COLOR[e.type]}`}>
                  {e.type === 'sale' ? '+' : '-'}{fmt(e.type === 'sale' ? e.dueAmount : e.totalAmount)}
                </p>
                <p className="text-label-sm text-on-surface-var">{L ? 'Bal' : 'ব্যাল'}: {fmt(e.balance)}</p>
              </div>
              {/* Delete */}
              <button onClick={() => { if (window.confirm(L ? 'Delete?' : 'মুছবেন?')) deleteMutation.mutate(e._id); }}
                className="p-1 rounded-lg hover:bg-error/10 text-on-surface-var hover:text-error transition-colors flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined !text-[16px]">delete</span>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Entry Modal */}
      <AnimatePresence>
        {entryModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setEntryModal(false)} />
            <motion.div initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:40 }}
              transition={{ type:'spring', bounce:.1, duration:.4 }}
              className="relative bg-surface border border-outline-var rounded-2xl shadow-modal w-full max-w-md overflow-hidden">
              <div className="w-10 h-1 bg-outline-var rounded-full mx-auto mt-3 sm:hidden" />
              <div className="flex items-center justify-between px-5 py-4 border-b border-outline-var">
                <h2 className="text-headline-sm font-bold text-on-surface">{L ? 'New Entry' : 'নতুন এন্ট্রি'} — {customer.name}</h2>
                <button onClick={() => setEntryModal(false)} className="p-2 rounded-xl hover:bg-surface-high text-on-surface-var">
                  <span className="material-symbols-outlined !text-[20px]">close</span>
                </button>
              </div>
              <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                <EntryModal customerId={id} onClose={() => setEntryModal(false)} lang={lang} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
