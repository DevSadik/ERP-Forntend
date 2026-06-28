import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Badge, DataTable, PageHeader, Pagination, MetricCard } from '../components/ui';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../utils/api';
import { formatBDT } from '../utils/currency';

// ─── Delete ledger entry from backend ────────────────────────────────────────
// We add a delete endpoint call — backend soft-deletes and recalculates balance

// ─── Table columns ────────────────────────────────────────────────────────────
function buildColumns(onDelete) {
  return [
    {
      key: 'createdAt', label: 'তারিখ',
      render: v => <span className="text-on-surface-var text-label-sm">{v ? format(new Date(v), 'dd/MM/yyyy') : '—'}</span>
    },
    {
      key: 'customer', label: 'গ্রাহক',
      render: v => <span className="font-semibold text-on-surface">{v}</span>
    },
    {
      key: 'reference', label: 'রেফারেন্স',
      render: v => <span className="font-mono text-primary text-label-md">{v || '—'}</span>
    },
    {
      key: 'transactionType', label: 'ধরন',
      render: v => (
        <Badge
          label={v === 'credit' ? '💳 বাকি দেওয়া' : '💰 পেমেন্ট পাওয়া'}
          variant={v === 'credit' ? 'error' : 'success'}
          dot
        />
      )
    },
    {
      key: 'amount', label: 'পরিমাণ',
      render: (v, r) => (
        <span className={`font-bold ${r.transactionType === 'credit' ? 'text-error' : 'text-success'}`}>
          {r.transactionType === 'credit' ? '+' : '-'}{formatBDT(v)}
        </span>
      )
    },
    {
      key: 'balance', label: 'ব্যালেন্স',
      render: v => <span className="font-semibold text-on-surface">{formatBDT(v)}</span>
    },
    {
      key: 'notes', label: 'নোট',
      render: v => <span className="text-on-surface-var text-label-sm">{v || '—'}</span>
    },
    {
      key: '_id', label: '',
      render: (v, row) => (
        <button
          onClick={() => onDelete(row)}
          className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-var hover:text-error transition-colors"
          title="এন্ট্রি মুছুন"
        >
          <span className="material-symbols-outlined !text-[16px]">delete</span>
        </button>
      )
    },
  ];
}

// ─── Dropdown menu for new entry button ──────────────────────────────────────
function EntryDropdown({ onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button icon="add" onClick={() => setOpen(o => !o)}>
        নতুন এন্ট্রি
        <span className="material-symbols-outlined !text-[16px] ml-1">arrow_drop_down</span>
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-surface border border-outline-var rounded-xl shadow-modal z-50 overflow-hidden"
          >
            {/* Credit Given */}
            <button
              onClick={() => { onSelect('credit'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-error/8 transition-colors text-left border-b border-outline-var"
            >
              <div className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined !text-[18px] text-error">credit_card</span>
              </div>
              <div>
                <p className="text-body-md font-bold text-on-surface">বাকি দেওয়া</p>
                <p className="text-label-sm text-on-surface-var">Credit Given</p>
              </div>
            </button>
            {/* Payment Received */}
            <button
              onClick={() => { onSelect('debit'); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-success/8 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined !text-[18px] text-success">payments</span>
              </div>
              <div>
                <p className="text-body-md font-bold text-on-surface">পেমেন্ট পাওয়া</p>
                <p className="text-label-sm text-on-surface-var">Payment Received</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Credit Given Modal ───────────────────────────────────────────────────────
function CreditModal({ open, onClose, customers, loading, onSave }) {
  const [form, setForm] = useState({ customer: '', amount: '', reference: '', notes: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.customer.trim()) e.customer = 'গ্রাহকের নাম দিন';
    if (!form.amount || +form.amount <= 0) e.amount = 'পরিমাণ দিন';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, transactionType: 'credit', amount: +form.amount });
    setForm({ customer: '', amount: '', reference: '', notes: '' });
    setErrors({});
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative bg-surface border border-outline-var rounded-2xl shadow-modal w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-var bg-error/5">
          <div className="w-10 h-10 rounded-xl bg-error/15 flex items-center justify-center">
            <span className="material-symbols-outlined !text-[22px] text-error">credit_card</span>
          </div>
          <div className="flex-1">
            <h2 className="text-headline-sm font-bold text-on-surface">বাকি দেওয়া</h2>
            <p className="text-label-sm text-on-surface-var">Credit Given</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-high text-on-surface-var transition-colors">
            <span className="material-symbols-outlined !text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Customer */}
          <div>
            <label className="block text-label-sm font-semibold text-on-surface-var uppercase tracking-wide mb-1.5">
              গ্রাহকের নাম *
            </label>
            <input
              list="credit-customer-list"
              value={form.customer}
              onChange={e => setForm({ ...form, customer: e.target.value })}
              placeholder="গ্রাহকের নাম লিখুন বা বাছাই করুন…"
              className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-error focus:ring-2 focus:ring-error/20 transition-all"
            />
            <datalist id="credit-customer-list">
              {customers.map(c => <option key={c} value={c} />)}
            </datalist>
            {errors.customer && <p className="text-label-sm text-error mt-1">{errors.customer}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-label-sm font-semibold text-on-surface-var uppercase tracking-wide mb-1.5">
              বাকির পরিমাণ (৳) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var font-bold">৳</span>
              <input
                type="number" min="0.01" step="0.01"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="w-full bg-surface-high border border-outline-var rounded-xl pl-7 pr-4 py-3 text-body-md text-on-surface font-bold focus:outline-none focus:border-error focus:ring-2 focus:ring-error/20 transition-all"
              />
            </div>
            {errors.amount && <p className="text-label-sm text-error mt-1">{errors.amount}</p>}
          </div>

          {/* Reference */}
          <div>
            <label className="block text-label-sm font-semibold text-on-surface-var uppercase tracking-wide mb-1.5">
              রেফারেন্স
            </label>
            <input
              value={form.reference}
              onChange={e => setForm({ ...form, reference: e.target.value })}
              placeholder="যেমন: #SO-1042 বা INV-001"
              className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-error focus:ring-2 focus:ring-error/20 transition-all font-mono"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-label-sm font-semibold text-on-surface-var uppercase tracking-wide mb-1.5">
              নোট
            </label>
            <input
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="ঐচ্ছিক মন্তব্য…"
              className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-error focus:ring-2 focus:ring-error/20 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <Button variant="secondary" className="flex-1" onClick={onClose}>বাতিল</Button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={loading}
            className="flex-1 bg-error text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all">
            {loading
              ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>সংরক্ষণ…</>
              : <><span className="material-symbols-outlined !text-[18px]">credit_card</span>বাকি সংরক্ষণ করুন</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Payment Received Modal ───────────────────────────────────────────────────
function PaymentModal({ open, onClose, customers, allLedger, loading, onSave }) {
  const [form, setForm] = useState({ customer: '', amount: '', reference: '', notes: '' });
  const [errors, setErrors] = useState({});

  // Calculate customer's current outstanding balance
  const customerBalance = form.customer
    ? allLedger
        .filter(l => l.customer === form.customer)
        .reduce((s, l) => s + (l.transactionType === 'credit' ? l.amount : -l.amount), 0)
    : 0;

  const validate = () => {
    const e = {};
    if (!form.customer.trim()) e.customer = 'গ্রাহকের নাম দিন';
    if (!form.amount || +form.amount <= 0) e.amount = 'পরিমাণ দিন';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({ ...form, transactionType: 'debit', amount: +form.amount });
    setForm({ customer: '', amount: '', reference: '', notes: '' });
    setErrors({});
  };

  const handleFullPayment = () => {
    if (customerBalance > 0) setForm(f => ({ ...f, amount: customerBalance.toFixed(2) }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative bg-surface border border-outline-var rounded-2xl shadow-modal w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-outline-var bg-success/5">
          <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
            <span className="material-symbols-outlined !text-[22px] text-success">payments</span>
          </div>
          <div className="flex-1">
            <h2 className="text-headline-sm font-bold text-on-surface">পেমেন্ট পাওয়া</h2>
            <p className="text-label-sm text-on-surface-var">Payment Received</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-high text-on-surface-var transition-colors">
            <span className="material-symbols-outlined !text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Customer */}
          <div>
            <label className="block text-label-sm font-semibold text-on-surface-var uppercase tracking-wide mb-1.5">
              গ্রাহকের নাম *
            </label>
            <input
              list="payment-customer-list"
              value={form.customer}
              onChange={e => setForm({ ...form, customer: e.target.value })}
              placeholder="গ্রাহকের নাম লিখুন বা বাছাই করুন…"
              className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-success focus:ring-2 focus:ring-success/20 transition-all"
            />
            <datalist id="payment-customer-list">
              {customers.map(c => <option key={c} value={c} />)}
            </datalist>
            {errors.customer && <p className="text-label-sm text-error mt-1">{errors.customer}</p>}
          </div>

          {/* Outstanding balance indicator */}
          <AnimatePresence>
            {form.customer && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl px-4 py-3 flex items-center justify-between border ${customerBalance > 0 ? 'bg-error/8 border-error/20' : 'bg-success/8 border-success/20'}`}>
                <div>
                  <p className="text-label-sm text-on-surface-var">বর্তমান বকেয়া</p>
                  <p className={`text-headline-sm font-bold ${customerBalance > 0 ? 'text-error' : 'text-success'}`}>
                    {formatBDT(Math.abs(customerBalance))}
                    {customerBalance <= 0 && <span className="text-label-sm ml-2">✅ পরিশোধিত</span>}
                  </p>
                </div>
                {customerBalance > 0 && (
                  <button onClick={handleFullPayment}
                    className="bg-success/15 text-success font-bold text-label-sm px-3 py-1.5 rounded-lg hover:bg-success/25 transition-colors">
                    পুরো টাকা
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Amount */}
          <div>
            <label className="block text-label-sm font-semibold text-on-surface-var uppercase tracking-wide mb-1.5">
              পেমেন্টের পরিমাণ (৳) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var font-bold">৳</span>
              <input
                type="number" min="0.01" step="0.01"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="w-full bg-surface-high border border-outline-var rounded-xl pl-7 pr-4 py-3 text-body-md text-on-surface font-bold focus:outline-none focus:border-success focus:ring-2 focus:ring-success/20 transition-all"
              />
            </div>
            {errors.amount && <p className="text-label-sm text-error mt-1">{errors.amount}</p>}
          </div>

          {/* Reference */}
          <div>
            <label className="block text-label-sm font-semibold text-on-surface-var uppercase tracking-wide mb-1.5">
              রেফারেন্স
            </label>
            <input
              value={form.reference}
              onChange={e => setForm({ ...form, reference: e.target.value })}
              placeholder="যেমন: PMT-001 বা bKash-001"
              className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-success focus:ring-2 focus:ring-success/20 transition-all font-mono"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-label-sm font-semibold text-on-surface-var uppercase tracking-wide mb-1.5">
              নোট
            </label>
            <input
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="ঐচ্ছিক মন্তব্য…"
              className="w-full bg-surface-high border border-outline-var rounded-xl px-4 py-3 text-body-md text-on-surface focus:outline-none focus:border-success focus:ring-2 focus:ring-success/20 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6">
          <Button variant="secondary" className="flex-1" onClick={onClose}>বাতিল</Button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={loading}
            className="flex-1 bg-success text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all">
            {loading
              ? <><span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>সংরক্ষণ…</>
              : <><span className="material-symbols-outlined !text-[18px]">payments</span>পেমেন্ট সংরক্ষণ করুন</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ entry, onClose, onConfirm, loading }) {
  if (!entry) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="relative bg-surface border border-outline-var rounded-2xl shadow-modal w-full max-w-sm p-6 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined !text-[30px] text-error">delete</span>
        </div>
        <h3 className="text-headline-sm font-bold text-on-surface mb-2">এন্ট্রি মুছবেন?</h3>
        <div className="bg-surface-high rounded-xl p-3 mb-4 text-left space-y-1">
          <div className="flex justify-between">
            <span className="text-label-sm text-on-surface-var">গ্রাহক</span>
            <span className="text-label-sm font-semibold text-on-surface">{entry.customer}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-label-sm text-on-surface-var">পরিমাণ</span>
            <span className={`text-label-sm font-bold ${entry.transactionType === 'credit' ? 'text-error' : 'text-success'}`}>
              {formatBDT(entry.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-label-sm text-on-surface-var">ধরন</span>
            <span className="text-label-sm font-semibold text-on-surface">
              {entry.transactionType === 'credit' ? 'বাকি দেওয়া' : 'পেমেন্ট পাওয়া'}
            </span>
          </div>
        </div>
        <p className="text-label-sm text-on-surface-var mb-5">
          এই এন্ট্রি মুছলে ব্যালেন্স স্বয়ংক্রিয় আপডেট হবে।
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>বাতিল</Button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm} disabled={loading}
            className="flex-1 bg-error text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50">
            {loading
              ? <span className="material-symbols-outlined !text-[18px] animate-spin">progress_activity</span>
              : <><span className="material-symbols-outlined !text-[18px]">delete</span>মুছুন</>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CreditLedger() {
  const qc = useQueryClient();
  const [page, setPage]               = useState(1);
  const [typeFilter, setTypeFilter]   = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [modalType, setModalType]     = useState(null); // null | 'credit' | 'debit'
  const [deleteEntry, setDeleteEntry] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['ledger', page, typeFilter, customerFilter],
    queryFn: () => api.get(
      `/ledger?page=${page}&limit=15${typeFilter ? `&type=${typeFilter}` : ''}${customerFilter ? `&customer=${encodeURIComponent(customerFilter)}` : ''}`
    ).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: customersData } = useQuery({
    queryKey: ['ledger-customers'],
    queryFn: () => api.get('/ledger/customers').then(r => r.data.data),
  });

  const { data: allData } = useQuery({
    queryKey: ['ledger-all', customerFilter],
    queryFn: () => api.get(
      `/ledger?limit=1000${customerFilter ? `&customer=${encodeURIComponent(customerFilter)}` : ''}`
    ).then(r => r.data.data),
  });

  const items     = data?.data    || [];
  const meta      = data?.meta    || {};
  const customers = customersData || [];
  const all       = allData       || [];

  // Summary totals
  const totalCredit  = all.filter(l => l.transactionType === 'credit').reduce((s, l) => s + l.amount, 0);
  const totalPayment = all.filter(l => l.transactionType === 'debit' ).reduce((s, l) => s + l.amount, 0);
  const outstanding  = totalCredit - totalPayment;

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: payload => api.post('/ledger', payload),
    onSuccess: () => {
      qc.invalidateQueries(['ledger']);
      qc.invalidateQueries(['ledger-customers']);
      qc.invalidateQueries(['ledger-all']);
      toast.success(modalType === 'credit' ? '✅ বাকি সংরক্ষিত হয়েছে!' : '✅ পেমেন্ট সংরক্ষিত হয়েছে!');
      setModalType(null);
    },
    onError: e => toast.error(e.response?.data?.message || 'সংরক্ষণ ব্যর্থ।'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/ledger/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['ledger']);
      qc.invalidateQueries(['ledger-all']);
      qc.invalidateQueries(['ledger-customers']);
      toast.success('এন্ট্রি মুছে গেছে।');
      setDeleteEntry(null);
    },
    onError: e => toast.error(e.response?.data?.message || 'মুছতে ব্যর্থ।'),
  });

  const COLUMNS = buildColumns(row => setDeleteEntry(row));

  return (
    <div className="space-y-stack-lg">
      <PageHeader
        title="ক্রেডিট লেজার"
        subtitle="গ্রাহকদের বাকি ও পেমেন্ট ট্র্যাক করুন।"
        actions={<EntryDropdown onSelect={type => setModalType(type)} />}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
        <MetricCard icon="credit_card"            label="মোট বাকি দেওয়া"    value={formatBDT(totalCredit)}  />
        <MetricCard icon="payments"               label="মোট পেমেন্ট পাওয়া" value={formatBDT(totalPayment)} trend={8} />
        <MetricCard icon="account_balance_wallet" label="বকেয়া ব্যালেন্স"   value={formatBDT(outstanding)}  highlight={outstanding > 0} />
      </div>

      {/* Customer cards */}
      {customers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {customers.slice(0, 10).map((c, i) => {
            const bal = all
              .filter(l => l.customer === c)
              .reduce((s, l) => s + (l.transactionType === 'credit' ? l.amount : -l.amount), 0);
            return (
              <motion.div
                key={c}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setCustomerFilter(customerFilter === c ? '' : c)}
                className={`bg-surface border rounded-xl p-stack-md cursor-pointer transition-all hover:shadow-primary-glow ${customerFilter === c ? 'border-primary bg-primary/5' : 'border-outline-var hover:border-primary/40'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary !text-[16px]">store</span>
                  </div>
                  <Badge label={bal > 0 ? 'বকেয়া' : 'পরিশোধিত'} variant={bal > 0 ? 'error' : 'success'} dot />
                </div>
                <p className="text-label-md font-semibold text-on-surface truncate">{c}</p>
                <p className={`text-headline-sm font-bold mt-1 ${bal > 0 ? 'text-error' : 'text-success'}`}>
                  {formatBDT(Math.abs(bal))}
                </p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-stack-md py-stack-sm border-b border-outline-var">
          <span className="text-label-md font-semibold text-on-surface">
            {customerFilter || 'সকল গ্রাহক'}
          </span>
          <div className="flex gap-1 ml-auto">
            {[
              { value: '',       label: 'সব'          },
              { value: 'credit', label: '💳 বাকি'     },
              { value: 'debit',  label: '💰 পেমেন্ট'  },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => { setTypeFilter(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-label-md font-semibold transition-all ${typeFilter === f.value ? 'bg-primary text-white' : 'bg-surface-high text-on-surface-var hover:text-on-surface'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {customerFilter && (
            <button onClick={() => setCustomerFilter('')} className="text-label-sm text-primary hover:underline">
              ফিল্টার সরান
            </button>
          )}
        </div>
        <DataTable columns={COLUMNS} data={items} loading={isLoading} emptyMessage="কোনো এন্ট্রি পাওয়া যায়নি।" />
        <div className="px-stack-md pb-stack-sm">
          <Pagination page={page} totalPages={meta.pages || 1} onChange={setPage} />
        </div>
      </Card>

      {/* Credit Modal */}
      <AnimatePresence>
        {modalType === 'credit' && (
          <CreditModal
            open={true}
            onClose={() => setModalType(null)}
            customers={customers}
            loading={saveMutation.isPending}
            onSave={data => saveMutation.mutate(data)}
          />
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {modalType === 'debit' && (
          <PaymentModal
            open={true}
            onClose={() => setModalType(null)}
            customers={customers}
            allLedger={all}
            loading={saveMutation.isPending}
            onSave={data => saveMutation.mutate(data)}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteEntry && (
          <DeleteModal
            entry={deleteEntry}
            onClose={() => setDeleteEntry(null)}
            onConfirm={() => deleteMutation.mutate(deleteEntry._id)}
            loading={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
