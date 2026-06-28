import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, Button, Badge, DataTable, PageHeader, Pagination, MetricCard } from '../components/ui';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { formatBDT } from '../utils/currency';
import toast from 'react-hot-toast';

const getStockStatus = (stock, reorder) => {
  if (stock === 0)              return { label: 'Out of Stock', variant: 'error' };
  if (stock < reorder)          return { label: 'Low Stock',    variant: 'warning' };
  if (stock < reorder * 1.5)    return { label: 'Moderate',     variant: 'secondary' };
  return                               { label: 'Healthy',      variant: 'success' };
};

export default function Inventory() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { const s = searchParams.get('search'); if (s) setSearch(s); }, [searchParams]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventory', page, category, search],
    queryFn: () => api.get(`/products?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}${category !== 'all' ? `&category=${encodeURIComponent(category)}` : ''}`).then(r => r.data),
    keepPreviousData: true,
  });

  const { data: categoriesData } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/products/categories').then(r => r.data.data) });

  const products = data?.data || [];
  const meta = data?.meta || {};
  const categories = ['all', ...(categoriesData || [])];

  const totalValue = products.reduce((s, p) => s + (p.currentStock * p.costPrice), 0);
  const lowStock   = products.filter(p => p.currentStock > 0 && p.currentStock < p.reorderLevel).length;
  const outStock   = products.filter(p => p.currentStock === 0).length;

  const chartData = products.slice(0, 10).map(p => ({ name: p.name.split(' ').slice(0, 2).join(' '), stock: p.currentStock, reorder: p.reorderLevel }));

  const exportCSV = async () => {
    setExporting(true);
    try {
      const { data: allData } = await api.get('/products?limit=1000');
      const rows = allData.data;
      const csv = ['SKU,Name,Category,Stock,Unit,Reorder Level,Cost Price,Sale Price,Stock Value,Status',
        ...rows.map(p => `${p.sku},"${p.name}",${p.category},${p.currentStock},${p.unit},${p.reorderLevel},${p.costPrice},${p.salePrice},${(p.currentStock*p.costPrice).toFixed(2)},${getStockStatus(p.currentStock,p.reorderLevel).label}`)
      ].join('\n');
      const a = document.createElement('a'); a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`; a.download = `inventory-${new Date().toISOString().slice(0,10)}.csv`; a.click();
      toast.success('CSV exported!');
    } catch { toast.error('Export failed.'); }
    setExporting(false);
  };

  const COLUMNS = [
    { key: 'sku',      label: 'SKU',       render: v => <span className="font-mono text-primary text-label-md">{v}</span> },
    { key: 'name',     label: 'Product' },
    { key: 'category', label: 'Category',  render: v => <Badge label={v} variant="secondary" /> },
    { key: 'currentStock', label: 'Stock', render: (v, r) => (
      <div>
        <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-on-surface">{v}</span><span className="text-on-surface-var text-label-sm">{r.unit}</span></div>
        <div className="w-24 h-1 bg-surface-highest rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${v < r.reorderLevel ? 'bg-warning' : 'bg-success'}`} style={{ width: `${Math.min(100, (v / (r.reorderLevel * 3)) * 100)}%` }} />
        </div>
      </div>
    )},
    { key: 'reorderLevel', label: 'Reorder', render: v => <span className="text-on-surface-var">{v}</span> },
    { key: 'costPrice',    label: 'Cost',    render: v => formatBDT(v) },
    { key: 'salePrice',    label: 'Sale',    render: v => <span className="text-primary font-semibold">{formatBDT(v)}</span> },
    { key: 'stockValue',   label: 'Value',   render: (_, r) => <span className="font-semibold">{formatBDT(r.currentStock * r.costPrice)}</span> },
    { key: '_id', label: 'Status', render: (_, r) => <Badge {...getStockStatus(r.currentStock, r.reorderLevel)} dot /> },
  ];

  return (
    <div className="space-y-stack-lg">
      <PageHeader title="ইনভেন্টরি রিপোর্ট" subtitle="সম্পূর্ণ স্টক স্তর, মূল্যায়ন এবং রিঅর্ডার বিশ্লেষণ।"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon="download" size="sm" loading={exporting} onClick={exportCSV}>Export CSV</Button>
            <Button icon="refresh" size="sm" onClick={() => refetch()}>Refresh</Button>
          </div>
        } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        <MetricCard icon="inventory_2"      label="মোট SKU"    value={meta.total || products.length} trend={0} />
        <MetricCard icon="account_balance"  label="স্টক মূল্য"   value={formatBDT(totalValue, 0)}  trend={3.2} />
        <MetricCard icon="warning"          label="কম স্টক"     value={`${lowStock} SKU`}             highlight={lowStock > 0} />
        <MetricCard icon="error"            label="স্টক নেই"  value={`${outStock} SKU`}             highlight={outStock > 0} />
      </div>

      {chartData.length > 0 && (
        <Card className="!p-0 overflow-hidden">
          <div className="px-stack-md py-stack-sm border-b border-outline-var">
            <h3 className="text-headline-sm font-semibold text-on-surface">Stock Level vs Reorder Point</h3>
          </div>
          <div className="p-stack-md h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={14} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f8f9ff', fontSize: 12 }} />
                <Bar dataKey="stock" name="Current Stock" radius={[3,3,0,0]}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.stock < d.reorder ? '#f59e0b' : '#10b981'} />)}
                </Bar>
                <Bar dataKey="reorder" name="Reorder Point" fill="#374151" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-stack-md py-stack-sm border-b border-outline-var">
          <div className="relative flex-1 min-w-48">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-var !text-[16px]">search</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="পণ্য বা SKU খুঁজুন…"
              className="w-full bg-surface-low border border-outline-var rounded-lg pl-8 pr-3 py-2 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => { setCategory(c); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-label-md capitalize transition-all ${category === c ? 'bg-primary text-white' : 'bg-surface-high text-on-surface-var hover:text-on-surface'}`}>{c}</button>
            ))}
          </div>
        </div>
        <DataTable columns={COLUMNS} data={products} loading={isLoading} emptyMessage="কোনো পণ্য পাওয়া যায়নি।" />
        <div className="px-stack-md pb-stack-sm"><Pagination page={page} totalPages={meta.pages || 1} onChange={setPage} /></div>
      </Card>
    </div>
  );
}
