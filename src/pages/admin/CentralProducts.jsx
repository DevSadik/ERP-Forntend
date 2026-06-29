import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Badge, PageHeader, Pagination } from '../../components/ui';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatBDT } from '../../utils/currency';

const UNITS = [['pcs','পিস'],['packs','প্যাক'],['boxes','বাক্স'],['bags','ব্যাগ'],['kg','কেজি'],['g','গ্রাম'],['litres','লিটার']];
const BLANK = { name:'', company:'', category:'', barcode:'', unit:'pcs', mrp:'' };

// ── Camera Barcode Scanner ────────────────────────────────────────────────────
function CameraScanner({ onDetected, onClose }) {
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
                  setFlash(true);
                  setTimeout(() => setFlash(false), 400);
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
      } catch { setStatus('error'); }
    })();
    return stopCamera;
  }, [onDetected, stopCamera]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/3' }}>
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />
        {status === 'scanning' && (
          <>
            <div className={`absolute inset-0 transition-all duration-100 ${flash ? 'bg-primary/25' : 'bg-transparent'}`} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-28">
                {[['top-0 left-0','border-t-[3px] border-l-[3px] rounded-tl-lg'],
                  ['top-0 right-0','border-t-[3px] border-r-[3px] rounded-tr-lg'],
                  ['bottom-0 left-0','border-b-[3px] border-l-[3px] rounded-bl-lg'],
                  ['bottom-0 right-0','border-b-[3px] border-r-[3px] rounded-br-lg'],
                ].map(([pos, cls], i) => (
                  <div key={i} className={`absolute w-7 h-7 border-primary ${cls} ${pos}`} />
                ))}
                <motion.div className="absolute left-1 right-1 h-[2px] bg-primary"
                  style={{ boxShadow: '0 0 10px #45a634' }}
                  animate={{ top: ['8%','92%','8%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
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
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm">ক্যামেরা চালু হচ্ছে…</p>
            </div>
          </div>
        )}
        {(status === 'error' || status === 'manual') && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <div className="text-center text-white space-y-2">
              <p className="text-sm font-semibold">
                {status === 'error' ? 'ক্যামেরা পাওয়া যায়নি' : 'স্বয়ংক্রিয় স্ক্যান সাপোর্টেড নয়'}
              </p>
              <p className="text-xs text-white/70">নিচে ম্যানুয়ালি লিখুন</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input autoFocus value={manual} onChange={e => setManual(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && manual.trim()) { onDetected(manual.trim()); setManual(''); }}}
          placeholder="বারকোড নম্বর লিখুন… (Enter)"
          className="flex-1 bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md font-mono text-on-surface focus:outline-none focus:border-primary transition-all" />
        <Button onClick={() => { if (manual.trim()) { onDetected(manual.trim()); setManual(''); }}}>OK</Button>
      </div>
      <Button variant="secondary" className="w-full" onClick={onClose}>বন্ধ করুন</Button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CentralProducts() {
  const qc = useQueryClient();
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(false);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState(BLANK);
  const [errors, setErrors]   = useState({});
  const [scannerOpen, setScannerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['central-products', page, search],
    queryFn: () => api.get(`/admin/central?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}`).then(r => r.data),
    keepPreviousData: true,
  });

  const items = data?.data || [];
  const meta  = data?.meta || {};

  // Categories & companies from the database (for auto-suggest)
  const { data: metaData } = useQuery({
    queryKey: ['central-meta'],
    queryFn: () => api.get('/admin/central-meta').then(r => r.data.data),
  });
  const dbCategories = metaData?.categories || [];
  const dbCompanies  = metaData?.companies  || [];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'নাম দিন';
    if (!form.barcode.trim()) e.barcode = 'বারকোড দিন';
    if (!form.mrp || +form.mrp <= 0) e.mrp = 'MRP দিন';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: payload => editId
      ? api.put(`/admin/central/${editId}`, payload)
      : api.post('/admin/central', payload),
    onSuccess: () => {
      qc.invalidateQueries(['central-products']);
      qc.invalidateQueries(['central-meta']);
      toast.success(editId ? 'আপডেট হয়েছে!' : 'কেন্দ্রীয় পণ্য যোগ হয়েছে!');
      closeModal();
    },
    onError: e => toast.error(e.response?.data?.message || 'ব্যর্থ।'),
  });

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/admin/central/${id}`),
    onSuccess: () => { qc.invalidateQueries(['central-products']); toast.success('মুছে গেছে।'); },
  });

  const openNew  = () => { setForm(BLANK); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = p  => {
    setForm({ name: p.name, company: p.company||'', category: p.category, barcode: p.barcode, unit: p.unit, mrp: String(p.mrp||p.salePrice||'') });
    setEditId(p._id); setErrors({}); setModal(true);
  };
  const closeModal = () => { setModal(false); setForm(BLANK); setEditId(null); setScannerOpen(false); };
  const handleSave = () => { if (!validate()) return; saveMutation.mutate({ ...form, mrp: +form.mrp }); };

  // Camera scan OR manual barcode: look up in central catalog and auto-fill.
  const handleScan = async (code) => {
    setScannerOpen(false);
    const bc = String(code).trim();
    set('barcode', bc);
    if (!bc) return;

    try {
      const res = await api.get(`/admin/central/barcode/${encodeURIComponent(bc)}`);
      const p = res.data?.data;
      if (p) {
        // Already exists → fill all fields and switch to edit mode
        setForm({
          name:     p.name || '',
          company:  p.company || '',
          category: p.category || '',
          barcode:  p.barcode || bc,
          unit:     p.unit || 'pcs',
          mrp:      String(p.mrp || ''),
        });
        setEditId(p._id);
        toast(`📋 "${p.name}" — এই পণ্য আগে থেকেই আছে`, { icon: '✅', duration: 5000 });
      } else {
        toast(`🆕 নতুন বারকোড — এই পণ্য আগে নেই`, { duration: 4000 });
      }
    } catch (err) {
      toast.error('বারকোড যাচাই ব্যর্থ।');
    }
  };

  return (
    <div className="space-y-stack-lg">
      <PageHeader
        title="কেন্দ্রীয় পণ্য ডেটাবেজ"
        subtitle="দোকানদাররা বারকোড স্ক্যান করলে এখান থেকে নাম, কোম্পানি, ক্যাটাগরি ও MRP পাবে।"
        actions={<Button icon="add" onClick={openNew}>নতুন পণ্য যোগ করুন</Button>}
      />

      <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3">
        <span className="material-symbols-outlined text-primary !text-[22px]">info</span>
        <p className="text-body-md text-on-surface-var flex-1">
          বারকোড ক্যামেরা দিয়ে স্ক্যান করে পণ্য যোগ করুন — নাম, কোম্পানি, ক্যাটাগরি, MRP দিন।
        </p>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center gap-3 px-stack-md py-stack-sm border-b border-outline-var">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var !text-[16px]">search</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="নাম, কোম্পানি, বারকোড…"
              className="w-full bg-surface-low border border-outline-var rounded-lg pl-8 pr-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary" />
          </div>
          <span className="text-label-md text-on-surface-var ml-auto">{meta.total || 0} টি পণ্য</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-on-surface-var">লোড হচ্ছে…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-on-surface-var">
            <span className="material-symbols-outlined !text-[56px] block mb-3 opacity-30">inventory_2</span>
            <p className="text-body-lg font-semibold text-on-surface mb-1">কোনো কেন্দ্রীয় পণ্য নেই</p>
            <p className="text-body-md mb-4">ক্যামেরা দিয়ে বারকোড স্ক্যান করে শুরু করুন।</p>
            <Button icon="add" onClick={openNew}>পণ্য যোগ করুন</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-low border-b border-outline-var">
                  {['পণ্যের নাম','কোম্পানি','ক্যাটাগরি','বারকোড','একক','MRP',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-label-sm text-on-surface-var uppercase tracking-wide font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <motion.tr key={p._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i*.02 }}
                    className="border-b border-outline-var hover:bg-primary/5">
                    <td className="px-4 py-3 font-semibold text-on-surface">{p.name}</td>
                    <td className="px-4 py-3 text-on-surface-var">{p.company || '—'}</td>
                    <td className="px-4 py-3"><Badge label={p.category || '—'} variant="secondary" /></td>
                    <td className="px-4 py-3 font-mono text-label-md text-primary">{p.barcode}</td>
                    <td className="px-4 py-3 text-on-surface-var">{p.unit}</td>
                    <td className="px-4 py-3 font-bold text-primary">{formatBDT(p.mrp || p.salePrice)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-primary/10 text-on-surface-var hover:text-primary transition-colors">
                          <span className="material-symbols-outlined !text-[16px]">edit</span>
                        </button>
                        <button onClick={() => { if (window.confirm('মুছবেন?')) deleteMutation.mutate(p._id); }}
                          className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-var hover:text-error transition-colors">
                          <span className="material-symbols-outlined !text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-stack-md pb-stack-sm">
          <Pagination page={page} totalPages={meta.pages || 1} onChange={setPage} />
        </div>
      </Card>

      {/* ── Add/Edit Modal ── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={closeModal} />
            <motion.div initial={{ opacity:0, scale:.96, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.96 }}
              className="relative bg-surface border border-outline-var rounded-2xl shadow-modal w-full max-w-md overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-var">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined !text-[20px] text-primary">inventory_2</span>
                  </div>
                  <h2 className="text-headline-sm font-bold text-on-surface">
                    {editId ? 'পণ্য সম্পাদনা' : 'নতুন কেন্দ্রীয় পণ্য'}
                  </h2>
                </div>
                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-surface-high text-on-surface-var">
                  <span className="material-symbols-outlined !text-[20px]">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>

                {/* Camera scanner (inline when open) */}
                <AnimatePresence>
                  {scannerOpen && (
                    <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                      exit={{ opacity:0, height:0 }} className="overflow-hidden">
                      <div className="bg-surface-high border border-outline-var rounded-xl p-4 mb-2">
                        <p className="text-label-md font-bold text-primary mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined !text-[18px]">photo_camera</span>
                          ক্যামেরা দিয়ে বারকোড স্ক্যান করুন
                        </p>
                        <CameraScanner onDetected={handleScan} onClose={() => setScannerOpen(false)} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Barcode field with camera button */}
                <div>
                  <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">
                    বারকোড *
                  </label>
                  <div className="flex gap-2">
                    <input value={form.barcode} onChange={e => set('barcode', e.target.value)}
                      onBlur={e => { if (!editId) { const v = e.target.value.trim(); if (v) handleScan(v); } }}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = e.target.value.trim(); if (v && !editId) handleScan(v); } }}
                      placeholder="স্ক্যান করুন বা লিখুন…"
                      disabled={!!editId}
                      className={`flex-1 bg-surface-high border rounded-xl px-4 py-3 text-body-md font-mono text-primary tracking-widest focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-on-surface-var/50 ${editId ? 'opacity-60 cursor-not-allowed' : ''} ${errors.barcode ? 'border-error' : 'border-outline-var'}`} />
                    {!editId && (
                      <motion.button whileTap={{ scale:.95 }}
                        onClick={() => setScannerOpen(s => !s)}
                        className={`px-4 rounded-xl border font-semibold text-body-md flex items-center gap-2 transition-all ${scannerOpen ? 'bg-primary text-white border-primary shadow-primary-glow' : 'bg-surface-high border-outline-var text-on-surface-var hover:border-primary hover:text-primary'}`}>
                        <span className="material-symbols-outlined !text-[20px]">
                          {scannerOpen ? 'close' : 'photo_camera'}
                        </span>
                        <span className="hidden sm:inline">{scannerOpen ? 'বন্ধ' : 'স্ক্যান'}</span>
                      </motion.button>
                    )}
                  </div>
                  {errors.barcode && <p className="text-label-sm text-error mt-1">{errors.barcode}</p>}
                  {editId && <p className="text-label-sm text-on-surface-var mt-1">বারকোড সম্পাদনা করা যাবে না।</p>}
                </div>

                {/* Product name */}
                <div>
                  <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">পণ্যের নাম *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="যেমন: রেড চিউ টফি"
                    className={`w-full bg-surface-high border rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${errors.name ? 'border-error' : 'border-outline-var'}`} />
                  {errors.name && <p className="text-label-sm text-error mt-1">{errors.name}</p>}
                </div>

                {/* Company */}
                <div>
                  <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">কোম্পানি</label>
                  <input list="central-company-list" value={form.company} onChange={e => set('company', e.target.value)} placeholder="যেমন: প্রাণ আরএফএল"
                    className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  <datalist id="central-company-list">
                    {dbCompanies.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">ক্যাটাগরি</label>
                  <input list="central-category-list" value={form.category} onChange={e => set('category', e.target.value)}
                    placeholder="যেমন: টফি, গামি, চকোলেট"
                    className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  <datalist id="central-category-list">
                    {dbCategories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                {/* Unit + MRP */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">একক</label>
                    <select value={form.unit} onChange={e => set('unit', e.target.value)}
                      className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-primary">
                      {UNITS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-label-sm text-on-surface-var mb-1.5 font-semibold uppercase tracking-wide">MRP (৳) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var font-bold">৳</span>
                      <input type="number" min="0" step="0.01" value={form.mrp} onChange={e => set('mrp', e.target.value)} placeholder="0.00"
                        className={`w-full bg-surface-high border rounded-xl pl-7 pr-3 py-3 text-body-md text-on-surface font-bold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${errors.mrp ? 'border-error' : 'border-outline-var'}`} />
                    </div>
                    {errors.mrp && <p className="text-label-sm text-error mt-1">{errors.mrp}</p>}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 px-6 py-4 border-t border-outline-var">
                <Button variant="secondary" className="flex-1" onClick={closeModal}>বাতিল</Button>
                <Button icon="save" loading={saveMutation.isPending} className="flex-1" onClick={handleSave}>
                  {editId ? 'আপডেট করুন' : 'যোগ করুন'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
