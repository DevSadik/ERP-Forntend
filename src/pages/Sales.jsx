import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Badge, DataTable, Modal, PageHeader, Pagination } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../utils/api';
import { formatBDT } from '../utils/currency';

const CATEGORY_EMOJI = { টফি:'🍬', ললিপপ:'🍭', চকোলেট:'🍫', গামি:'🐻', মার্শমেলো:'☁️', 'সাওয়ার ক্যান্ডি':'🍋', 'হার্ড ক্যান্ডি':'🍡', Toffee:'🍬', Lollipops:'🍭', Chocolate:'🍫', Gummies:'🐻', Marshmallow:'☁️', 'Sour Candy':'🍋', 'Hard Candy':'🍡', default:'🍭' };

const SALES_COLS = [
  { key: 'orderId',     label: 'বিক্রয় ID',  render: v => <span className="font-mono text-primary text-label-md">{v}</span> },
  { key: 'customer',    label: 'গ্রাহক',      render: v => <span className="font-semibold">{v||'Walk-in'}</span> },
  { key: 'items',       label: 'আইটেম',       render: v => <span className="text-on-surface-var">{v?.length} টি</span> },
  { key: 'totalAmount', label: 'মোট',         render: v => <span className="font-bold text-primary">{formatBDT(v)}</span> },
  { key: 'discount',    label: 'ছাড়',         render: v => v > 0 ? <span className="text-success">-{formatBDT(v)}</span> : <span className="text-on-surface-var">—</span> },
  { key: 'paymentType', label: 'পেমেন্ট',     render: v => <Badge label={v==='cash'?'নগদ':v==='credit'?'বাকি':'ট্রান্সফার'} variant={v==='cash'?'success':v==='credit'?'error':'secondary'} dot /> },
  { key: 'paymentStatus', label: 'অবস্থা',    render: v => <Badge label={v==='paid'?'পরিশোধিত':'বকেয়া'} variant={v==='paid'?'success':'warning'} dot /> },
  { key: 'createdAt',   label: 'সময়',         render: v => <span className="text-on-surface-var">{v ? format(new Date(v),'dd/MM HH:mm') : '—'}</span> },
];

// ─── Camera Scanner ───────────────────────────────────────────────────────────
function CameraScanner({ onDetected, onClose }) {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const lastScan    = useRef(0);
  const detectorRef = useRef(null);
  const [status, setStatus]         = useState('starting');
  const [lastCode, setLastCode]     = useState('');
  const [flash, setFlash]           = useState(false);
  const [manualCode, setManualCode] = useState('');
  const inputRef = useRef(null);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }, []);

  const startCamera = useCallback(async () => {
    setStatus('starting'); stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:{ ideal:'environment' }, width:{ideal:1280} } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      if ('BarcodeDetector' in window) {
        if (!detectorRef.current) detectorRef.current = new window.BarcodeDetector({ formats:['ean_13','ean_8','code_128','code_39','qr_code','upc_a','upc_e'] });
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
            } catch { /* skip */ }
          }
          rafRef.current = requestAnimationFrame(scan);
        };
        rafRef.current = requestAnimationFrame(scan);
      } else { setStatus('manual'); }
    } catch { setStatus('error'); }
  }, [onDetected, stopCamera]);

  useEffect(() => { startCamera(); return stopCamera; }, [startCamera, stopCamera]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
        {status === 'scanning' && (
          <>
            <div className={`absolute inset-0 transition-all duration-150 ${flash ? 'bg-primary/30' : 'bg-transparent'}`} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-36">
                {[['top-0 left-0','border-t-4 border-l-4 rounded-tl-lg'],['top-0 right-0','border-t-4 border-r-4 rounded-tr-lg'],['bottom-0 left-0','border-b-4 border-l-4 rounded-bl-lg'],['bottom-0 right-0','border-b-4 border-r-4 rounded-br-lg']].map(([pos,cls],i) => (
                  <div key={i} className={`absolute w-8 h-8 border-primary ${cls} ${pos}`} />
                ))}
                <motion.div className="absolute left-2 right-2 h-0.5 bg-primary shadow-[0_0_10px_#45a634]"
                  animate={{ top:['8%','92%','8%'] }} transition={{ duration:2, repeat:Infinity, ease:'linear' }} />
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="bg-black/60 text-white text-label-sm px-3 py-1 rounded-full">পণ্যের বারকোড ফ্রেমে রাখুন</span>
            </div>
          </>
        )}
        {status === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white"><span className="material-symbols-outlined !text-[48px] animate-pulse block mb-2">camera</span><p>ক্যামেরা চালু হচ্ছে…</p></div>
          </div>
        )}
        {(status === 'error' || status === 'manual') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <div className="text-center text-white">
              <span className="material-symbols-outlined !text-[44px] text-warning block mb-2">info</span>
              <p className="text-label-sm">{status==='error'?'ক্যামেরা পাওয়া যায়নি।':'এই ব্রাউজারে স্বয়ংক্রিয় স্ক্যান নেই।'}</p>
              <p className="text-label-sm mt-1">নিচে ম্যানুয়ালি লিখুন।</p>
            </div>
          </div>
        )}
      </div>
      {lastCode && (
        <div className="flex items-center gap-2 bg-success/15 border border-success/30 rounded-lg px-3 py-2">
          <span className="material-symbols-outlined !text-[18px] text-success">check_circle</span>
          <span className="text-body-md text-success font-semibold">স্ক্যান: {lastCode}</span>
        </div>
      )}
      <div className="flex gap-2">
        <input ref={inputRef} autoFocus value={manualCode} onChange={e => setManualCode(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter' && manualCode.trim()) { onDetected(manualCode.trim()); setManualCode(''); } }}
          placeholder="ম্যানুয়ালি বারকোড লিখুন… (Enter)"
          className="flex-1 bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
        <Button onClick={() => { if (manualCode.trim()) { onDetected(manualCode.trim()); setManualCode(''); } }}>খোঁজুন</Button>
      </div>
      <Button variant="secondary" className="w-full" onClick={onClose}>বন্ধ করুন</Button>
    </div>
  );
}

// ─── Main Sales Page ──────────────────────────────────────────────────────────
export default function Sales() {
  const qc = useQueryClient();
  const [cart, setCart]               = useState([]);
  const [search, setSearch]           = useState('');
  const [customer, setCustomer]       = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [discount, setDiscount]       = useState('');
  const [notes, setNotes]             = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [receiptOrder, setReceiptOrder] = useState(null);

  const { data: productsData, isLoading: prodLoading } = useQuery({ queryKey:['products-pos'], queryFn:() => api.get('/products?limit=200').then(r => r.data.data), staleTime:60000 });
  const { data: historyData,  isLoading: histLoading  } = useQuery({ queryKey:['stock-out', historyPage], queryFn:() => api.get(`/stock-out?page=${historyPage}&limit=10`).then(r => r.data), refetchInterval:30000 });
  const { data: customersData } = useQuery({ queryKey:['ledger-customers'], queryFn:() => api.get('/ledger/customers').then(r => r.data.data) });

  const products = (productsData||[]).filter(p => p.currentStock > 0);
  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search));
  const orders   = historyData?.data || [];
  const meta     = historyData?.meta || {};
  const customers = customersData || [];

  // USB barcode scanner — adds product directly to cart
  const bufferRef = useRef('');
  const timerRef  = useRef(null);
  useEffect(() => {
    if (scannerOpen) return;
    const handle = e => {
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 4) {
          handleBarcodeDetected(bufferRef.current.trim());
        }
        bufferRef.current = '';
      } else if (e.key.length === 1 && !['input','textarea','select'].includes(document.activeElement?.tagName?.toLowerCase())) {
        bufferRef.current += e.key;
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { bufferRef.current = ''; }, 80);
      }
    };
    window.addEventListener('keydown', handle);
    return () => { window.removeEventListener('keydown', handle); clearTimeout(timerRef.current); };
  }, [scannerOpen, products]);

  const handleBarcodeDetected = useCallback((code) => {
    setScannerOpen(false);
    const prod = products.find(p => p.barcode === code || p.sku === code || p.sku === code.toUpperCase());
    if (!prod) {
      toast.error(`বারকোড "${code}" এর পণ্য স্টকে নেই`);
      return;
    }
    addToCart(prod);
    toast.success(`🛒 কার্টে যোগ: ${prod.name}`);
  }, [products]);

  const addToCart = useCallback((product) => {
    setCart(c => {
      const ex = c.find(i => i._id === product._id);
      if (ex) {
        if (ex.qty >= product.currentStock) { toast.error(`সর্বোচ্চ স্টক: ${product.currentStock} ${product.unit}`); return c; }
        return c.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...c, { ...product, qty: 1, customPrice: product.salePrice }];
    });
  }, []);

  const updateQty    = (id, delta) => setCart(c => c.map(i => i._id===id ? { ...i, qty: Math.max(0, i.qty+delta) } : i).filter(i => i.qty > 0));
  const setQty       = (id, val)   => { const n=parseInt(val,10); if(isNaN(n)||n<=0) setCart(c=>c.filter(i=>i._id!==id)); else setCart(c=>c.map(i=>i._id===id?{...i,qty:n}:i)); };
  const setItemPrice = (id, val)   => setCart(c => c.map(i => i._id===id ? { ...i, customPrice: parseFloat(val)||i.salePrice } : i));
  const removeItem   = (id)        => setCart(c => c.filter(i => i._id !== id));

  const subtotal    = cart.reduce((s, i) => s + (i.customPrice||i.salePrice) * i.qty, 0);
  const discountAmt = Math.min(parseFloat(discount)||0, subtotal);
  const total       = Math.max(0, subtotal - discountAmt);
  const profit      = cart.reduce((s, i) => s + ((i.customPrice||i.salePrice) - i.costPrice) * i.qty, 0) - discountAmt;

  const mutation = useMutation({
    mutationFn: p => api.post('/stock-out', p),
    onSuccess: res => {
      qc.invalidateQueries(['stock-out']); qc.invalidateQueries(['products-pos']); qc.invalidateQueries(['products-all']); qc.invalidateQueries(['dashboard-stats']); qc.invalidateQueries(['inventory']); qc.invalidateQueries(['ledger']); qc.invalidateQueries(['ledger-customers']);
      setReceiptOrder({ ...res.data.data, cartSnapshot: cart, customer: customer||'Walk-in', paymentType, total, discount: discountAmt, profit });
      setCart([]); setCustomer(''); setDiscount(''); setNotes('');
    },
    onError: e => toast.error(e.response?.data?.message || 'বিক্রয় ব্যর্থ হয়েছে।'),
  });

  const handleProcess = () => {
    if (!cart.length) return toast.error('কার্ট খালি আছে');
    mutation.mutate({
      items: cart.map(i => ({ product: i._id, quantity: i.qty, salePrice: i.customPrice||i.salePrice, subtotal: +((i.customPrice||i.salePrice) * i.qty).toFixed(2) })),
      customer: customer || 'Walk-in',
      paymentType,
      paymentStatus: paymentType === 'credit' ? 'pending' : 'paid',
      totalAmount: total,
      discount: discountAmt,
      notes,
    });
  };

  return (
    <div className="space-y-stack-lg">
      <PageHeader title="বিক্রয় (Sales)" subtitle="বারকোড স্ক্যান করুন বা পণ্য ট্যাপ করে বিক্রয় করুন।"
        actions={
          <Button icon="qr_code_scanner" onClick={() => setScannerOpen(true)} className="glow-anim">স্ক্যান করে বিক্রয়</Button>
        } />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">

        {/* ── Left: Product Browser ── */}
        <div className="xl:col-span-2 space-y-stack-md">

          {/* USB scanner active hint */}
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-stack-md py-2.5">
            <span className="material-symbols-outlined text-primary !text-[20px]">barcode_reader</span>
            <p className="text-label-md text-on-surface-var flex-1">USB স্ক্যানার সক্রিয় — পণ্য স্ক্যান করলে সরাসরি কার্টে যোগ হবে</p>
            <Badge label="সক্রিয়" variant="success" dot />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var !text-[18px]">search</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="পণ্যের নাম, SKU বা বারকোড…"
                className="w-full bg-surface border border-outline-var rounded-xl pl-10 pr-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
            </div>
          </div>

          {prodLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Array(6).fill(0).map((_,i) => <div key={i} className="h-28 bg-surface border border-outline-var rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map((p, i) => {
                const inCart = cart.find(c => c._id === p._id);
                return (
                  <motion.button key={p._id} initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i*.03 }}
                    whileHover={{ scale:1.02 }} whileTap={{ scale:.97 }} onClick={() => addToCart(p)}
                    className={`bg-surface border rounded-xl p-stack-md text-left transition-all ${inCart ? 'border-primary bg-primary/5 shadow-primary-glow' : 'border-outline-var hover:border-primary/40'}`}>
                    <div className="text-3xl mb-2">{CATEGORY_EMOJI[p.category] || CATEGORY_EMOJI.default}</div>
                    <p className="text-body-md font-semibold text-on-surface leading-tight">{p.name}</p>
                    <p className="text-label-sm text-on-surface-var mt-0.5 font-mono">{p.sku}</p>
                    {p.barcode && <p className="text-label-sm text-on-surface-var font-mono">{p.barcode}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-bold text-body-lg">{formatBDT(p.salePrice)}</span>
                      <span className={`text-label-sm ${p.currentStock < p.reorderLevel ? 'text-warning' : 'text-on-surface-var'}`}>{p.currentStock} {p.unit}</span>
                    </div>
                    {inCart && <div className="mt-1 text-label-sm text-primary font-semibold">কার্টে: {inCart.qty}</div>}
                  </motion.button>
                );
              })}
              {filtered.length === 0 && !prodLoading && (
                <div className="col-span-3 py-12 text-center text-on-surface-var">
                  <span className="material-symbols-outlined !text-[40px] block mb-2 opacity-40">inventory</span>
                  <p className="text-body-md">কোনো পণ্য পাওয়া যায়নি</p>
                </div>
              )}
            </div>
          )}

          {/* Sales History */}
          <Card className="!p-0 overflow-hidden">
            <div className="px-stack-md py-stack-sm border-b border-outline-var flex items-center justify-between">
              <h3 className="text-headline-sm font-semibold text-on-surface">বিক্রয় ইতিহাস</h3>
              <span className="text-label-sm text-on-surface-var">প্রতি ৩০ সেকেন্ডে আপডেট</span>
            </div>
            <DataTable columns={SALES_COLS} data={orders} loading={histLoading} emptyMessage="এখনো কোনো বিক্রয় নেই।" />
            <div className="px-stack-md pb-stack-sm"><Pagination page={historyPage} totalPages={meta.pages||1} onChange={setHistoryPage} /></div>
          </Card>
        </div>

        {/* ── Right: Cart & Order ── */}
        <div className="space-y-stack-md">
          <Card>
            <h3 className="text-headline-sm font-semibold text-on-surface mb-stack-md">বর্তমান বিক্রয়</h3>

            {/* Customer */}
            <div className="mb-stack-md">
              <label className="text-label-sm text-on-surface-var block mb-1">গ্রাহকের নাম</label>
              <input list="customer-list" value={customer} onChange={e => setCustomer(e.target.value)}
                placeholder="গ্রাহক / Walk-in…"
                className="w-full bg-surface-high border border-outline-var rounded-lg px-stack-md py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
              <datalist id="customer-list">{customers.map(c => <option key={c} value={c} />)}</datalist>
            </div>

            {/* Cart Items */}
            <div className="min-h-[120px] space-y-2">
              <AnimatePresence>
                {cart.length === 0 ? (
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className="flex flex-col items-center justify-center h-28 text-on-surface-var border-2 border-dashed border-outline-var rounded-xl">
                    <span className="material-symbols-outlined !text-[36px] opacity-30 mb-1">shopping_cart</span>
                    <p className="text-label-sm">পণ্য ট্যাপ করুন বা বারকোড স্ক্যান করুন</p>
                  </motion.div>
                ) : cart.map(item => (
                  <motion.div key={item._id} initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-16 }}
                    className="bg-surface-high rounded-xl p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xl flex-shrink-0 mt-0.5">{CATEGORY_EMOJI[item.category]||CATEGORY_EMOJI.default}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-md font-semibold text-on-surface truncate">{item.name}</p>
                        <p className="text-label-sm text-on-surface-var font-mono">{item.sku}</p>
                      </div>
                      <button onClick={() => removeItem(item._id)} className="p-1 text-on-surface-var hover:text-error transition-colors">
                        <span className="material-symbols-outlined !text-[16px]">close</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Qty controls */}
                      <button onClick={() => updateQty(item._id,-1)} className="w-7 h-7 rounded-full bg-surface-highest text-on-surface-var hover:bg-primary/20 hover:text-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined !text-[14px]">remove</span>
                      </button>
                      <input type="number" min="1" value={item.qty} onChange={e => setQty(item._id, e.target.value)}
                        className="w-10 text-center text-body-md font-bold text-on-surface bg-transparent focus:outline-none flex-shrink-0" />
                      <button onClick={() => updateQty(item._id,1)} className="w-7 h-7 rounded-full bg-surface-highest text-on-surface-var hover:bg-primary/20 hover:text-primary flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined !text-[14px]">add</span>
                      </button>
                      {/* Custom price */}
                      <div className="flex-1 relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-var text-label-sm font-bold">৳</span>
                        <input type="number" min="0" step="0.01" value={item.customPrice||item.salePrice}
                          onChange={e => setItemPrice(item._id, e.target.value)}
                          className="w-full bg-surface border border-outline-var rounded-lg pl-5 pr-2 py-1.5 text-label-md text-on-surface focus:outline-none focus:border-primary text-right" />
                      </div>
                      <span className="text-body-md font-bold text-primary w-16 text-right flex-shrink-0">{formatBDT((item.customPrice||item.salePrice) * item.qty)}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Discount */}
            {cart.length > 0 && (
              <div className="mt-stack-md">
                <label className="text-label-sm text-on-surface-var block mb-1">ছাড় (৳)</label>
                <input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-surface-high border border-outline-var rounded-lg px-stack-md py-2 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
              </div>
            )}

            {/* Payment method */}
            <div className="mt-stack-md">
              <p className="text-label-sm text-on-surface-var mb-2">পেমেন্ট পদ্ধতি</p>
              <div className="grid grid-cols-3 gap-2">
                {[{ v:'cash',l:'নগদ',icon:'payments' },{ v:'credit',l:'বাকি',icon:'credit_card' },{ v:'transfer',l:'ট্রান্সফার',icon:'account_balance' }].map(m => (
                  <button key={m.v} onClick={() => setPaymentType(m.v)}
                    className={`py-2.5 rounded-xl text-label-md transition-all flex flex-col items-center gap-1 font-semibold border ${paymentType===m.v ? 'bg-primary text-white border-primary shadow-primary-glow' : 'bg-surface-high text-on-surface-var border-outline-var hover:border-primary/40'}`}>
                    <span className="material-symbols-outlined !text-[18px]">{m.icon}</span>{m.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-stack-md">
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="বিক্রয়ের নোট (ঐচ্ছিক)…"
                className="w-full bg-surface-high border border-outline-var rounded-lg px-stack-md py-2 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
            </div>

            {/* Totals */}
            <div className="mt-stack-md border-t border-outline-var pt-stack-md space-y-1.5">
              <div className="flex justify-between text-body-md text-on-surface-var"><span>সাবটোটাল</span><span>{formatBDT(subtotal)}</span></div>
              {discountAmt > 0 && <div className="flex justify-between text-body-md text-success"><span>ছাড়</span><span>-{formatBDT(discountAmt)}</span></div>}
              <div className="flex justify-between text-headline-sm font-bold text-on-surface border-t border-outline-var pt-1.5 mt-1.5"><span>মোট</span><span className="text-primary">{formatBDT(total)}</span></div>
              {cart.length > 0 && <div className="flex justify-between text-label-md text-on-surface-var"><span>আনুমানিক মুনাফা</span><span className={profit >= 0 ? 'text-success' : 'text-error'}>{formatBDT(profit)}</span></div>}
            </div>

            <motion.button whileTap={{ scale:.97 }}
              className="w-full mt-stack-md bg-primary text-white font-bold rounded-xl py-4 text-body-lg flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 disabled:opacity-50 transition-all"
              disabled={!cart.length || mutation.isPending} onClick={handleProcess}>
              {mutation.isPending
                ? <><span className="material-symbols-outlined !text-[20px] animate-spin">progress_activity</span>প্রক্রিয়া হচ্ছে…</>
                : <><span className="material-symbols-outlined !text-[20px]">point_of_sale</span>বিক্রয় সম্পন্ন করুন • {formatBDT(total)}</>}
            </motion.button>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="w-full mt-2 text-label-sm text-on-surface-var hover:text-error transition-colors py-1">কার্ট খালি করুন</button>
            )}
          </Card>
        </div>
      </div>

      {/* Camera Scanner Modal */}
      <AnimatePresence>
        {scannerOpen && (
          <Modal open title="বারকোড স্ক্যান — বিক্রয়" onClose={() => setScannerOpen(false)} size="md">
            <CameraScanner onDetected={handleBarcodeDetected} onClose={() => setScannerOpen(false)} />
          </Modal>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {receiptOrder && (
          <Modal open title="বিক্রয় সম্পন্ন ✅" onClose={() => setReceiptOrder(null)} size="md">
            <div className="space-y-stack-md">
              <div className="bg-success/10 border border-success/30 rounded-xl p-stack-md text-center">
                <span className="material-symbols-outlined !text-[48px] text-success block mb-2">check_circle</span>
                <p className="text-headline-sm font-bold text-on-surface">{receiptOrder.orderId}</p>
                <p className="text-body-md text-on-surface-var mt-1">{receiptOrder.customer} • {receiptOrder.paymentType === 'cash' ? 'নগদ' : receiptOrder.paymentType === 'credit' ? 'বাকি' : 'ট্রান্সফার'}</p>
              </div>
              <div className="space-y-2">
                {(receiptOrder.cartSnapshot||[]).map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-outline-var last:border-0">
                    <div><p className="text-body-md font-medium text-on-surface">{item.name}</p><p className="text-label-sm text-on-surface-var">{item.qty} × {formatBDT(item.customPrice||item.salePrice)}</p></div>
                    <span className="font-bold text-primary">{formatBDT((item.customPrice||item.salePrice)*item.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="bg-surface-high rounded-xl p-stack-md space-y-1">
                {receiptOrder.discount > 0 && <div className="flex justify-between text-body-md text-success"><span>ছাড়</span><span>-{formatBDT(receiptOrder.discount)}</span></div>}
                <div className="flex justify-between text-headline-sm font-bold"><span>মোট</span><span className="text-primary">{formatBDT(receiptOrder.total)}</span></div>
                <div className="flex justify-between text-label-md text-on-surface-var"><span>মুনাফা</span><span className={receiptOrder.profit>=0?'text-success':'text-error'}>{formatBDT(receiptOrder.profit)}</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" icon="print" onClick={() => window.print()}>প্রিন্ট রসিদ</Button>
                <Button className="flex-1" onClick={() => setReceiptOrder(null)}>নতুন বিক্রয়</Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
