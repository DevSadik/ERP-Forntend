import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import brandApi from '../../utils/brandApi';
import { formatBDT } from '../../utils/currency';
import toast from 'react-hot-toast';

const UNITS = [['pcs','পিস'],['packs','প্যাক'],['boxes','বাক্স'],['bags','ব্যাগ'],['kg','কেজি'],['g','গ্রাম'],['litres','লিটার']];

const BLANK = { barcode:'', name:'', nameBn:'', category:'', unit:'pcs', mrp:'', tradePrice:'', pcsPerCarton:'1', weight:'', description:'' };

export default function SupplierProductForm() {
  const { id } = useParams();
  const isEdit  = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm]       = useState(BLANK);
  const [errors, setErrors]   = useState({});
  const [images, setImages]   = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const API_BASE = process.env.REACT_APP_API_URL?.replace('/api/v1','') || 'http://localhost:5000';

  const { data: existingData } = useQuery({
    queryKey: ['brand-product', id],
    queryFn: () => brandApi.get(`/brand/products?limit=1`).then(r => {
      return brandApi.get('/brand/products').then(all => ({ data: all.data.data?.find(p => p._id === id) }));
    }),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingData?.data) {
      const p = existingData.data;
      setForm({ barcode: p.barcode, name: p.name, nameBn: p.nameBn||'', category: p.category, unit: p.unit, mrp: p.mrp, tradePrice: p.tradePrice, pcsPerCarton: p.pcsPerCarton, weight: p.weight||'', description: p.description||'' });
      setExistingImages(p.images || []);
    }
  }, [existingData]);

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.barcode.trim())   e.barcode    = 'বারকোড প্রয়োজন';
    if (!form.name.trim())      e.name       = 'পণ্যের নাম প্রয়োজন';
    if (!form.category.trim())  e.category   = 'ক্যাটাগরি প্রয়োজন';
    if (!form.mrp || +form.mrp <= 0) e.mrp  = 'MRP দিন';
    if (!form.tradePrice || +form.tradePrice <= 0) e.tradePrice = 'ট্রেড প্রাইস দিন';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const fd = new FormData();
      Object.entries(payload).forEach(([k,v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      return isEdit ? brandApi.put(`/brand/products/${id}`, fd, cfg) : brandApi.post('/brand/products', fd, cfg);
    },
    onSuccess: () => {
      qc.invalidateQueries(['brand-products']);
      qc.invalidateQueries(['brand-products-summary']);
      toast.success(isEdit ? 'পণ্য আপডেট হয়েছে! পুনরায় অনুমোদনের অপেক্ষায়।' : 'পণ্য জমা হয়েছে! অ্যাডমিন অনুমোদনের পর সক্রিয় হবে।');
      navigate('/supplier/products');
    },
    onError: e => toast.error(e.response?.data?.message || 'ব্যর্থ হয়েছে।'),
  });

  const handleSave = () => {
    if (!validate()) return;
    mutation.mutate({ ...form, mrp: +form.mrp, tradePrice: +form.tradePrice, pcsPerCarton: +(form.pcsPerCarton||1) });
  };

  const margin = form.mrp && form.tradePrice ? (((+form.mrp - +form.tradePrice) / +form.mrp) * 100).toFixed(1) : null;

  return (
    <div className="space-y-stack-lg max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/supplier/products')}
          className="p-2 rounded-lg hover:bg-surface-high text-on-surface-var transition-colors">
          <span className="material-symbols-outlined !text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">{isEdit ? 'পণ্য সম্পাদনা' : 'নতুন পণ্য যোগ করুন'}</h1>
          <p className="text-body-md text-on-surface-var">সব তথ্য সঠিকভাবে পূরণ করুন।</p>
        </div>
      </div>

      {/* Approval notice */}
      <div className="flex items-start gap-3 bg-warning/10 border border-warning/30 rounded-xl p-stack-md">
        <span className="material-symbols-outlined text-warning !text-[20px] mt-0.5">info</span>
        <p className="text-body-md text-on-surface-var">পণ্য জমা দেওয়ার পর অ্যাডমিন পর্যালোচনা করবেন। অনুমোদন পেলে সিস্টেমে দেখা যাবে।</p>
      </div>

      {/* Section 1: Barcode & Basic */}
      <div className="bg-surface border border-outline-var rounded-xl p-stack-md space-y-stack-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary !text-[20px]">qr_code</span>
          <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wide">বারকোড ও নাম</h3>
        </div>
        <div>
          <label className="block text-label-sm text-on-surface-var mb-1">বারকোড নম্বর * <span className="text-on-surface-var font-normal">(EAN-13 বা যেকোনো বারকোড)</span></label>
          <input value={form.barcode} onChange={e => set('barcode', e.target.value)} disabled={isEdit}
            placeholder="8901030849695"
            className={`w-full border rounded-lg px-4 py-2.5 text-body-md font-mono text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 ${isEdit ? 'bg-surface-highest border-outline-var cursor-not-allowed opacity-60' : 'bg-surface-high border-outline-var'}`} />
          {errors.barcode && <p className="text-label-sm text-error mt-1">{errors.barcode}</p>}
          {isEdit && <p className="text-label-sm text-on-surface-var mt-1">বারকোড সম্পাদনা করা যাবে না।</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
          <div>
            <label className="block text-label-sm text-on-surface-var mb-1">পণ্যের নাম (ইংরেজি) *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Red Chew Toffee"
              className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
            {errors.name && <p className="text-label-sm text-error mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-var mb-1">পণ্যের নাম (বাংলা)</label>
            <input value={form.nameBn} onChange={e => set('nameBn', e.target.value)} placeholder="রেড চিউ টফি"
              className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-var mb-1">ক্যাটাগরি *</label>
            <input value={form.category} onChange={e => set('category', e.target.value)} placeholder="যেমন: টফি, গামি, চকোলেট"
              className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
            {errors.category && <p className="text-label-sm text-error mt-1">{errors.category}</p>}
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-var mb-1">একক (Unit)</label>
            <select value={form.unit} onChange={e => set('unit', e.target.value)}
              className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary">
              {UNITS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Price */}
      <div className="bg-surface border border-outline-var rounded-xl p-stack-md space-y-stack-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary !text-[20px]">payments</span>
          <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wide">মূল্য</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
          <div>
            <label className="block text-label-sm text-on-surface-var mb-1">MRP (সর্বোচ্চ বিক্রয় মূল্য) * <span className="text-primary">৳</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var font-bold">৳</span>
              <input type="number" min="0" step="0.01" value={form.mrp} onChange={e => set('mrp', e.target.value)} placeholder="0.00"
                className="w-full bg-surface-high border border-outline-var rounded-lg pl-7 pr-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
            </div>
            {errors.mrp && <p className="text-label-sm text-error mt-1">{errors.mrp}</p>}
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-var mb-1">ট্রেড প্রাইস (দোকানদারের ক্রয়মূল্য) * <span className="text-primary">৳</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var font-bold">৳</span>
              <input type="number" min="0" step="0.01" value={form.tradePrice} onChange={e => set('tradePrice', e.target.value)} placeholder="0.00"
                className="w-full bg-surface-high border border-outline-var rounded-lg pl-7 pr-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
            </div>
            {errors.tradePrice && <p className="text-label-sm text-error mt-1">{errors.tradePrice}</p>}
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-var mb-1">এক কার্টনে পিস সংখ্যা</label>
            <input type="number" min="1" value={form.pcsPerCarton} onChange={e => set('pcsPerCarton', e.target.value)} placeholder="24"
              className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-label-sm text-on-surface-var mb-1">ওজন / পরিমাণ</label>
            <input value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="যেমন: 200g, 500ml"
              className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
          </div>
        </div>
        {/* Margin calculator */}
        {margin && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="bg-success/10 border border-success/20 rounded-xl p-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-success !text-[20px]">trending_up</span>
            <div>
              <p className="text-label-sm text-on-surface-var">দোকানদারের লাভ মার্জিন</p>
              <p className="text-body-md font-bold text-success">{margin}% ({formatBDT(+form.mrp - +form.tradePrice)} / পিস)</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Section 3: Images */}
      <div className="bg-surface border border-outline-var rounded-xl p-stack-md space-y-stack-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-primary !text-[20px]">photo_library</span>
          <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wide">পণ্যের ছবি (সর্বোচ্চ ৫টি)</h3>
        </div>
        {/* Existing images */}
        {existingImages.length > 0 && (
          <div>
            <p className="text-label-sm text-on-surface-var mb-2">বর্তমান ছবি:</p>
            <div className="flex gap-2 flex-wrap">
              {existingImages.map((img, i) => (
                <img key={i} src={`${API_BASE}/uploads/${img}`} className="w-20 h-20 rounded-xl object-cover border border-outline-var" alt={`product ${i}`} />
              ))}
            </div>
          </div>
        )}
        <label className="cursor-pointer border-2 border-dashed border-outline-var rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all block">
          <span className="material-symbols-outlined text-on-surface-var !text-[40px]">cloud_upload</span>
          <p className="text-body-md font-semibold text-on-surface">ছবি আপলোড করুন</p>
          <p className="text-label-sm text-on-surface-var">JPG, PNG, WEBP • সর্বোচ্চ ৫MB প্রতিটি</p>
          <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
        </label>
        {previews.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {previews.map((src, i) => (
              <div key={i} className="relative">
                <img src={src} className="w-20 h-20 rounded-xl object-cover border-2 border-primary" alt={`preview ${i}`} />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined !text-[12px] text-white">check</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Description */}
      <div className="bg-surface border border-outline-var rounded-xl p-stack-md">
        <div className="flex items-center gap-2 mb-stack-md">
          <span className="material-symbols-outlined text-primary !text-[20px]">description</span>
          <h3 className="text-label-md font-bold text-on-surface uppercase tracking-wide">পণ্যের বিবরণ (ঐচ্ছিক)</h3>
        </div>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
          placeholder="পণ্যের বিস্তারিত বিবরণ, উপাদান, ব্যবহারের নির্দেশনা ইত্যাদি…"
          className="w-full bg-surface-high border border-outline-var rounded-lg px-4 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 resize-none" />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => navigate('/supplier/products')}
          className="flex-1 bg-surface-high border border-outline-var text-on-surface rounded-xl py-3 font-semibold text-body-md hover:bg-surface-highest transition-colors">
          বাতিল
        </button>
        <motion.button whileTap={{ scale:.97 }} onClick={handleSave} disabled={mutation.isPending}
          className="flex-1 bg-primary text-white font-bold rounded-xl py-3 text-body-md flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 disabled:opacity-50 transition-all">
          {mutation.isPending
            ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>সংরক্ষণ হচ্ছে…</>
            : <><span className="material-symbols-outlined !text-[18px]">save</span>{isEdit ? 'আপডেট করুন' : 'পণ্য জমা দিন'}</>}
        </motion.button>
      </div>
    </div>
  );
}
