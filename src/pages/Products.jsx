import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Badge, DataTable, Modal, InputField, SelectField, PageHeader, Pagination } from '../components/ui';
import toast from 'react-hot-toast';
import api from '../utils/api';

const UNIT_OPTIONS = [{ value: 'pcs', label: 'Pieces' }, { value: 'packs', label: 'Packs' }, { value: 'boxes', label: 'Boxes' }, { value: 'bags', label: 'Bags' }, { value: 'kg', label: 'Kg' }, { value: 'g', label: 'Grams' }, { value: 'litres', label: 'Litres' }];

const BLANK = { sku: '', name: '', category: '', unit: 'pcs', costPrice: '', salePrice: '', reorderLevel: '50', currentStock: '0', barcode: '', description: '' };

export default function Products() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});

  const { data, isLoading } = useQuery({ queryKey: ['products', page, search, category], queryFn: () => api.get(`/products?page=${page}&limit=15${search ? `&search=${encodeURIComponent(search)}` : ''}${category !== 'all' ? `&category=${encodeURIComponent(category)}` : ''}`).then(r => r.data), keepPreviousData: true });
  const { data: catsData } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/products/categories').then(r => r.data.data) });

  const products = data?.data || [];
  const meta = data?.meta || {};
  const categories = ['all', ...(catsData || [])];

  const saveMutation = useMutation({
    mutationFn: (payload) => editing ? api.put(`/products/${editing._id}`, payload) : api.post('/products', payload),
    onSuccess: () => { qc.invalidateQueries(['products']); qc.invalidateQueries(['categories']); toast.success(editing ? 'Product updated!' : 'Product created!'); closeModal(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save product.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => { qc.invalidateQueries(['products']); toast.success('Product deactivated.'); setDeleteId(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete.'),
  });

  const openEdit = (p) => { setEditing(p); setForm({ sku: p.sku, name: p.name, category: p.category, unit: p.unit, costPrice: p.costPrice, salePrice: p.salePrice, reorderLevel: p.reorderLevel, currentStock: p.currentStock, barcode: p.barcode || '', description: p.description || '' }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(BLANK); setErrors({}); };

  const validate = () => {
    const e = {};
    if (!form.sku)       e.sku      = 'SKU is required';
    if (!form.name)      e.name     = 'Name is required';
    if (!form.category)  e.category = 'Category is required';
    if (!form.costPrice || +form.costPrice < 0) e.costPrice = 'Cost price required';
    if (!form.salePrice || +form.salePrice < 0) e.salePrice = 'Sale price required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    saveMutation.mutate({ ...form, costPrice: +form.costPrice, salePrice: +form.salePrice, reorderLevel: +form.reorderLevel, currentStock: editing ? undefined : +form.currentStock });
  };

  const COLUMNS = [
    { key: 'sku',      label: 'SKU',      render: v => <span className="font-mono text-primary text-label-md">{v}</span> },
    { key: 'name',     label: 'Product',  render: (v, r) => <div><p className="font-medium text-on-surface">{v}</p>{r.barcode && <p className="text-label-sm text-on-surface-var font-mono">{r.barcode}</p>}</div> },
    { key: 'category', label: 'Category', render: v => <Badge label={v} variant="secondary" /> },
    { key: 'currentStock', label: 'Stock', render: (v, r) => <span className={v < r.reorderLevel ? 'text-warning font-bold' : 'text-on-surface font-semibold'}>{v} {r.unit}</span> },
    { key: 'costPrice', label: 'Cost',    render: v => `$${v?.toFixed(2)}` },
    { key: 'salePrice', label: 'Price',   render: v => <span className="text-primary font-semibold">${v?.toFixed(2)}</span> },
    { key: '_id', label: '', width: 80, render: (_, row) => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-primary/10 text-on-surface-var hover:text-primary transition-colors"><span className="material-symbols-outlined !text-[16px]">edit</span></button>
        <button onClick={() => setDeleteId(row._id)} className="p-1.5 rounded-lg hover:bg-error/10 text-on-surface-var hover:text-error transition-colors"><span className="material-symbols-outlined !text-[16px]">delete</span></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-stack-lg">
      <PageHeader title="Products" subtitle="Manage your product catalogue."
        actions={<Button icon="add" onClick={() => { closeModal(); setModalOpen(true); }}>Add Product</Button>} />

      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-stack-md py-stack-sm border-b border-outline-var">
          <div className="relative flex-1 min-w-48">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var !text-[16px]">search</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search name, SKU or barcode…"
              className="w-full bg-surface-low border border-outline-var rounded-lg pl-8 pr-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-label-md capitalize transition-all ${category === c ? 'bg-primary text-white' : 'bg-surface-high text-on-surface-var hover:text-on-surface'}`}>{c}</button>
            ))}
          </div>
        </div>
        <DataTable columns={COLUMNS} data={products} loading={isLoading} emptyMessage="No products found." />
        <div className="px-stack-md pb-stack-sm"><Pagination page={page} totalPages={meta.pages || 1} onChange={setPage} /></div>
      </Card>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
              <InputField label="SKU *" placeholder="e.g. SKU-0001" value={form.sku} onChange={e => setForm({...form, sku: e.target.value.toUpperCase()})} error={errors.sku} disabled={!!editing} />
              <InputField label="Product Name *" placeholder="e.g. Red Chew Toffee" value={form.name} onChange={e => setForm({...form, name: e.target.value})} error={errors.name} />
              <InputField label="Category *" placeholder="e.g. Toffee" value={form.category} onChange={e => setForm({...form, category: e.target.value})} error={errors.category} />
              <SelectField label="Unit" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} options={UNIT_OPTIONS} />
              <InputField label="Cost Price ($) *" type="number" min="0" step="0.01" value={form.costPrice} onChange={e => setForm({...form, costPrice: e.target.value})} error={errors.costPrice} />
              <InputField label="Sale Price ($) *" type="number" min="0" step="0.01" value={form.salePrice} onChange={e => setForm({...form, salePrice: e.target.value})} error={errors.salePrice} />
              <InputField label="Reorder Level" type="number" min="0" value={form.reorderLevel} onChange={e => setForm({...form, reorderLevel: e.target.value})} />
              {!editing && <InputField label="Opening Stock" type="number" min="0" value={form.currentStock} onChange={e => setForm({...form, currentStock: e.target.value})} />}
              <InputField label="Barcode" placeholder="e.g. 8901030849695" value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} />
              <div className="sm:col-span-2">
                <InputField label="Description" placeholder="Optional description…" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-stack-lg border-t border-outline-var pt-stack-md">
              <Button variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button icon="save" loading={saveMutation.isPending} onClick={handleSave}>{editing ? 'Update' : 'Create'} Product</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId && (
          <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Deactivate Product" size="sm">
            <p className="text-body-md text-on-surface-var mb-stack-lg">This product will be hidden from all views. Stock data is preserved.</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteId)}>Deactivate</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
