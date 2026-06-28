import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Badge, DataTable, Modal, PageHeader, Pagination } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../utils/api';
import { formatBDT } from '../utils/currency';

const CATEGORY_EMOJI = { Toffee: '🍬', Lollipops: '🍭', Chocolate: '🍫', Gummies: '🐻', Marshmallow: '☁️', 'Sour Candy': '🍋', 'Hard Candy': '🍡', default: '🍭' };

const HISTORY_COLS = [
  { key: 'orderId',     label: 'অর্ডার ID',  render: v => <span className="font-mono text-primary text-label-md">{v}</span> },
  { key: 'customer',    label: 'গ্রাহক' },
  { key: 'items',       label: 'আইটেম',      render: v => <span className="text-on-surface-var">{v?.length} টি</span> },
  { key: 'totalAmount', label: 'মোট',        render: v => <span className="font-semibold text-primary">{formatBDT(v)}</span> },
  { key: 'paymentType', label: 'পেমেন্ট',    render: v => <Badge label={v === 'cash' ? 'নগদ' : v === 'credit' ? 'বাকি' : 'ট্রান্সফার'} variant={v === 'cash' ? 'success' : v === 'credit' ? 'error' : 'secondary'} dot /> },
  { key: 'createdAt',   label: 'সময়',        render: v => <span className="text-on-surface-var">{v ? format(new Date(v), 'HH:mm') : '—'}</span> },
];

// ── Camera Barcode Scanner (shared component) ─────────────────────────────────
function CameraScanner({ onDetected, onClose }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const rafRef    = useRef(null);
  const lastScan  = useRef(0);
  const [status, setStatus]     = useState('starting');
  const [lastCode, setLastCode] = useState('');
  const [flash, setFlash]       = useState(false);
  const [manualCode, setManualCode] = useState('');

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  }, []);

  useEffect(() => {
    (async () => {
      setStatus('starting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
        });
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }

        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'],
          });
          setStatus('scanning');
          const scan = async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) { rafRef.current = requestAnimationFrame(scan); return; }
            const now = Date.now();
            if (now - lastScan.current > 600) {
              lastScan.current = now;
              try {
                const codes = await detector.detect(videoRef.current);
                if (codes.length > 0) {
                  const code = codes[0].rawValue;
                  setLastCode(code); setFlash(true); setTimeout(() => setFlash(false), 300);
                  onDetected(code); return;
                }
              } catch { /* ignore */ }
            }
            rafRef.current = requestAnimationFrame(scan);
          };
          rafRef.current = requestAnimationFrame(scan);
        } else {
          setStatus('manual');
        }
      } catch { setStatus('error'); }
    })();
    return stopCamera;
  }, [onDetected, stopCamera]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
        {status === 'scanning' && (
          <>
            <div className={`absolute inset-0 transition-all duration-150 ${flash ? 'bg-primary/30' : 'bg-transparent'}`} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-32">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                <motion.div className="absolute left-2 right-2 h-0.5 bg-primary shadow-[0_0_8px_#10b981]"
                  animate={{ top: ['10%', '90%', '10%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
              </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 text-center">
              <span className="bg-black/60 text-white text-label-sm px-3 py-1 rounded-full">বারকোড ফ্রেমের ভেতরে রাখুন</span>
            </div>
          </>
        )}
        {status === 'starting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center text-white"><span className="material-symbols-outlined !text-[48px] animate-pulse block mb-2">camera</span><p>ক্যামেরা চালু হচ্ছে…</p></div>
          </div>
        )}
        {(status === 'error' || status === 'manual') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <div className="text-center text-white">
              <span className="material-symbols-outlined !text-[40px] text-warning block mb-2">info</span>
              <p className="text-label-sm">{status === 'error' ? 'ক্যামেরা পাওয়া যায়নি।' : 'স্বয়ংক্রিয় স্ক্যান সাপোর্টেড নয়।'}</p>
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
        <input value={manualCode} onChange={e => setManualCode(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && manualCode.trim()) { onDetected(manualCode.trim()); setManualCode(''); } }}
          placeholder="ম্যানুয়ালি বারকোড লিখুন…"
          className="flex-1 bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
        <Button onClick={() => { if (manualCode.trim()) { onDetected(manualCode.trim()); setManualCode(''); } }}>খোঁজুন</Button>
      </div>
      <Button variant="secondary" className="w-full" onClick={onClose}>বন্ধ করুন</Button>
    </div>
  );
}

export default function StockOut() {
  const qc = useQueryClient();
  const [cart, setCart]               = useState([]);
  const [search, setSearch]           = useState('');
  const [customer, setCustomer]       = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [discount, setDiscount]       = useState('');
  const [notes, setNotes]             = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [scannerOpen, setScannerOpen] = useState(false);

  const { data: productsData, isLoading: prodLoading } = useQuery({ queryKey: ['products-pos'], queryFn: () => api.get('/products?limit=200').then(r => r.data.data), staleTime: 60000 });
  const { data: historyData,  isLoading: histLoading  } = useQuery({ queryKey: ['stock-out', historyPage], queryFn: () => api.get(`/stock-out?page=${historyPage}&limit=10`).then(r => r.data), refetchInterval: 30000 });

  const products = (productsData || []).filter(p => p.currentStock > 0);
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
  const orders   = historyData?.data || [];
  const meta     = historyData?.meta || {};

  const addToCart = product => {
    setCart(c => {
      const ex = c.find(i => i._id === product._id);
      if (ex) {
        if (ex.qty >= product.currentStock) { toast.error(`সর্বোচ্চ স্টক: ${product.currentStock} ${product.unit}`); return c; }
        return c.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...c, { ...product, qty: 1 }];
    });
  };

  const handleBarcodeDetected = code => {
    setScannerOpen(false);
    const prod = products.find(p => p.barcode === code || p.sku === code);
    if (prod) { addToCart(prod); toast.success(`কার্টে যোগ হয়েছে: ${prod.name}`); }
    else toast.error(`বারকোড "${code}" এর পণ্য নেই`);
  };

  const updateQty = (id, delta) => setCart(c => c.map(i => i._id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  const setQty    = (id, val)   => { const n = parseInt(val,10); if (isNaN(n)||n<=0) setCart(c=>c.filter(i=>i._id!==id)); else setCart(c=>c.map(i=>i._id===id?{...i,qty:n}:i)); };

  const subtotal    = cart.reduce((s, i) => s + i.salePrice * i.qty, 0);
  const discountAmt = Math.min(+discount || 0, subtotal);
  const total       = Math.max(0, subtotal - discountAmt);

  const mutation = useMutation({
    mutationFn: p => api.post('/stock-out', p),
    onSuccess: res => {
      qc.invalidateQueries(['stock-out']); qc.invalidateQueries(['products-pos']); qc.invalidateQueries(['products-all']); qc.invalidateQueries(['dashboard-stats']); qc.invalidateQueries(['inventory']);
      toast.success(`অর্ডার ${res.data.data.orderId} সম্পন্ন!`);
      setCart([]); setCustomer(''); setDiscount(''); setNotes('');
    },
    onError: e => toast.error(e.response?.data?.message || 'অর্ডার ব্যর্থ হয়েছে।'),
  });

  const handleProcess = () => {
    if (!cart.length) return toast.error('কার্ট খালি আছে');
    mutation.mutate({
      items: cart.map(i => ({ product: i._id, quantity: i.qty, salePrice: i.salePrice, subtotal: +(i.salePrice * i.qty).toFixed(2) })),
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
      <PageHeader title="স্টক-আউট / POS" subtitle="বিক্রয় প্রক্রিয়া করুন।"
        actions={
          <Button icon="qr_code_scanner" variant="secondary" onClick={() => setScannerOpen(true)}>বারকোড স্ক্যান</Button>
        } />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
        {/* Products grid */}
        <div className="xl:col-span-2 space-y-stack-md">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var !text-[18px]">search</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পণ্য বা SKU খুঁজুন…"
              className="w-full bg-surface border border-outline-var rounded-xl pl-10 pr-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
          </div>

          {prodLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Array(6).fill(0).map((_,i) => <div key={i} className="h-28 bg-surface border border-outline-var rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map((p, i) => {
                const inCart = cart.find(c => c._id === p._id);
                return (
                  <motion.button key={p._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => addToCart(p)}
                    className={`bg-surface border rounded-xl p-stack-md text-left transition-all ${inCart ? 'border-primary bg-primary/5 shadow-primary-glow' : 'border-outline-var hover:border-primary/40'}`}>
                    <div className="text-3xl mb-2">{CATEGORY_EMOJI[p.category] || CATEGORY_EMOJI.default}</div>
                    <p className="text-body-md font-semibold text-on-surface leading-tight">{p.name}</p>
                    <p className="text-label-sm text-on-surface-var mt-0.5">{p.sku}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-primary font-bold">{formatBDT(p.salePrice)}</span>
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

          <Card className="!p-0 overflow-hidden">
            <div className="px-stack-md py-stack-sm border-b border-outline-var flex items-center justify-between">
              <h3 className="text-headline-sm font-semibold text-on-surface">সাম্প্রতিক অর্ডার</h3>
              <span className="text-label-sm text-on-surface-var">প্রতি ৩০ সেকেন্ডে আপডেট</span>
            </div>
            <DataTable columns={HISTORY_COLS} data={orders} loading={histLoading} emptyMessage="এখনো কোনো অর্ডার নেই।" />
            <div className="px-stack-md pb-stack-sm"><Pagination page={historyPage} totalPages={meta.pages || 1} onChange={setHistoryPage} /></div>
          </Card>
        </div>

        {/* Cart */}
        <div className="space-y-stack-md">
          <Card>
            <h3 className="text-headline-sm font-semibold text-on-surface mb-stack-md">বর্তমান অর্ডার</h3>
            <input placeholder="গ্রাহকের নাম / Walk-in…" value={customer} onChange={e => setCustomer(e.target.value)}
              className="w-full bg-surface-high border border-outline-var rounded-lg px-stack-md py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 mb-stack-md" />

            <div className="min-h-[120px] space-y-2">
              <AnimatePresence>
                {cart.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-28 text-on-surface-var">
                    <span className="material-symbols-outlined !text-[36px] opacity-30 mb-1">shopping_cart</span>
                    <p className="text-label-sm">পণ্য ট্যাপ করুন বা স্ক্যান করুন</p>
                  </motion.div>
                ) : cart.map(item => (
                  <motion.div key={item._id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                    className="flex items-center gap-2 bg-surface-high rounded-lg px-3 py-2">
                    <span className="text-xl">{CATEGORY_EMOJI[item.category] || CATEGORY_EMOJI.default}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-md font-medium text-on-surface truncate">{item.name}</p>
                      <p className="text-label-sm text-on-surface-var">{formatBDT(item.salePrice)} / {item.unit}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item._id, -1)} className="w-6 h-6 rounded-full bg-surface-highest text-on-surface-var hover:bg-primary/20 hover:text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined !text-[14px]">remove</span>
                      </button>
                      <input type="number" min="1" value={item.qty} onChange={e => setQty(item._id, e.target.value)}
                        className="w-10 text-center text-body-md font-bold text-on-surface bg-transparent focus:outline-none" />
                      <button onClick={() => updateQty(item._id, 1)} className="w-6 h-6 rounded-full bg-surface-highest text-on-surface-var hover:bg-primary/20 hover:text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined !text-[14px]">add</span>
                      </button>
                    </div>
                    <span className="text-body-md font-semibold text-primary w-16 text-right">{formatBDT(item.salePrice * item.qty)}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Discount */}
            {cart.length > 0 && (
              <div className="mt-stack-md">
                <input type="number" min="0" step="0.01" placeholder="ছাড় (৳)" value={discount} onChange={e => setDiscount(e.target.value)}
                  className="w-full bg-surface-high border border-outline-var rounded-lg px-stack-md py-2 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
              </div>
            )}

            {/* Payment method */}
            <div className="mt-stack-md">
              <p className="text-label-sm text-on-surface-var mb-2">পেমেন্ট পদ্ধতি</p>
              <div className="flex gap-2">
                {[{ v: 'cash', l: 'নগদ' }, { v: 'credit', l: 'বাকি' }, { v: 'transfer', l: 'ট্রান্সফার' }].map(m => (
                  <button key={m.v} onClick={() => setPaymentType(m.v)}
                    className={`flex-1 py-2 rounded-lg text-label-md transition-all font-semibold ${paymentType === m.v ? 'bg-primary text-white' : 'bg-surface-high text-on-surface-var hover:bg-surface-highest'}`}>{m.l}</button>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="mt-stack-md border-t border-outline-var pt-stack-md space-y-1">
              <div className="flex justify-between text-body-md text-on-surface-var"><span>সাবটোটাল</span><span>{formatBDT(subtotal)}</span></div>
              {discountAmt > 0 && <div className="flex justify-between text-body-md text-success"><span>ছাড়</span><span>-{formatBDT(discountAmt)}</span></div>}
              <div className="flex justify-between text-headline-sm font-bold text-on-surface"><span>মোট</span><span className="text-primary">{formatBDT(total)}</span></div>
            </div>

            <Button className="w-full mt-stack-md" icon={mutation.isPending ? undefined : 'point_of_sale'} loading={mutation.isPending} onClick={handleProcess} disabled={!cart.length}>
              বিক্রয় সম্পন্ন করুন • {formatBDT(total)}
            </Button>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="w-full mt-2 text-label-sm text-on-surface-var hover:text-error transition-colors">কার্ট খালি করুন</button>
            )}
          </Card>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <AnimatePresence>
        {scannerOpen && (
          <Modal open title="বারকোড স্ক্যান করুন" onClose={() => setScannerOpen(false)} size="md">
            <CameraScanner onDetected={handleBarcodeDetected} onClose={() => setScannerOpen(false)} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
