import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MetricCard, Card, Badge, Button, PageHeader } from '../components/ui';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import api from '../utils/api';
import { formatBDT, formatBDTCompact } from '../utils/currency';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-highest border border-outline-var rounded-lg px-3 py-2 shadow-modal">
      <p className="text-on-surface-var text-label-sm mb-1">{label}</p>
      <p className="text-primary font-bold">{formatBDT(payload[0].value)}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: statsData } = useQuery({ queryKey: ['dashboard-stats'], queryFn: () => api.get('/dashboard/stats').then(r => r.data.data), refetchInterval: 30000 });
  const { data: salesData  } = useQuery({ queryKey: ['weekly-sales'],   queryFn: () => api.get('/dashboard/weekly-sales').then(r => r.data.data), refetchInterval: 60000 });

  const stats    = statsData || {};
  const chartData = (salesData || []).map(d => ({ time: d._id?.slice(5), sales: d.total }));

  return (
    <div className="space-y-stack-lg">
      <PageHeader
        title="ড্যাশবোর্ড"
        subtitle={`Mini Manager ERP পরিচালনার সারসংক্ষেপ — ${format(new Date(), 'dd MMM yyyy')}`}
        actions={<Button icon="add" size="sm" onClick={() => navigate('/stock-in')}>নতুন এন্ট্রি</Button>}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-gutter">
        {[
          { icon: 'payments',        label: 'আজকের বিক্রয়',    value: formatBDTCompact(stats.todaySales || 0),          trend: 12 },
          { icon: 'receipt_long',    label: 'আজকের অর্ডার',    value: `${stats.todayOrderCount || 0} টি`,               trend: 0  },
          { icon: 'warning',         label: 'কম স্টক',         value: `${(stats.lowStockCount||0)+(stats.outOfStockCount||0)} SKU`, highlight: (stats.lowStockCount||0) > 0 },
          { icon: 'account_balance', label: 'মোট মজুদ মূল্য',  value: formatBDTCompact(stats.totalValuation || 0),      trend: 2.1 },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <MetricCard {...m} />
          </motion.div>
        ))}
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="flex items-center justify-between px-stack-md py-stack-md border-b border-outline-var">
            <h3 className="text-headline-sm font-semibold text-on-surface">গত ৭ দিনের বিক্রয়</h3>
          </div>
          <div className="p-stack-md h-56">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-on-surface-var">
                <div className="text-center">
                  <span className="material-symbols-outlined !text-[48px] opacity-30 block mb-2">bar_chart</span>
                  <p className="text-body-md">এখনো কোনো বিক্রয় নেই</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `৳${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <div className="space-y-gutter">
          <motion.div whileHover={{ scale: 1.01 }} onClick={() => navigate('/stock-out')}
            className="rounded-xl p-stack-md bg-gradient-to-br from-primary to-[#065f46] relative overflow-hidden cursor-pointer">
            <div className="absolute right-3 top-3 opacity-20">
              <span className="material-symbols-outlined" style={{ fontSize: 64 }}>point_of_sale</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center mb-stack-sm">
              <span className="material-symbols-outlined text-white !text-[22px]">qr_code_scanner</span>
            </div>
            <h4 className="text-headline-sm font-bold text-white">বিক্রয় করুন</h4>
            <p className="text-body-md text-white/80 mt-1">POS খুলুন এবং অর্ডার প্রক্রিয়া করুন।</p>
            <div className="mt-stack-md flex items-center gap-1 text-white font-semibold text-body-md">
              Stock-Out যান <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
            </div>
          </motion.div>

          <motion.div whileHover={{ scale: 1.01 }} onClick={() => navigate('/stock-in')} className="metric-card cursor-pointer">
            <div className="flex items-start gap-stack-sm">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary !text-[22px]">inbox</span>
              </div>
              <div>
                <h4 className="text-headline-sm font-semibold text-on-surface">মাল গ্রহণ</h4>
                <p className="text-body-md text-on-surface-var mt-1">নতুন মালামাল স্টকে যোগ করুন।</p>
              </div>
            </div>
            <div className="mt-stack-sm flex items-center gap-1 text-primary font-semibold text-body-md">
              Stock-In যান <span className="material-symbols-outlined !text-[18px]">add_circle</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Recent Orders */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between px-stack-md py-stack-sm border-b border-outline-var">
          <h3 className="text-headline-sm font-semibold text-on-surface">সাম্প্রতিক অর্ডার</h3>
          <button onClick={() => navigate('/stock-out')} className="text-label-md text-primary hover:underline flex items-center gap-1">
            সব দেখুন <span className="material-symbols-outlined !text-[14px]">arrow_forward</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr><th>অর্ডার ID</th><th>গ্রাহক</th><th>আইটেম</th><th>মোট</th><th>পেমেন্ট</th><th>সময়</th></tr>
            </thead>
            <tbody>
              {(stats.recentOrders || []).length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-on-surface-var">
                  <span className="material-symbols-outlined !text-[36px] block mb-2 opacity-40">receipt_long</span>
                  এখনো কোনো অর্ডার নেই
                </td></tr>
              ) : (
                (stats.recentOrders || []).map((order, i) => (
                  <motion.tr key={order._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td className="font-mono text-label-md text-primary">{order.orderId}</td>
                    <td>{order.customer}</td>
                    <td className="text-on-surface-var">{order.items?.length} টি</td>
                    <td className="font-semibold text-primary">{formatBDT(order.totalAmount)}</td>
                    <td><Badge label={order.paymentType === 'cash' ? 'নগদ' : order.paymentType === 'credit' ? 'বাকি' : 'ট্রান্সফার'} variant={order.paymentType === 'cash' ? 'success' : 'secondary'} dot /></td>
                    <td className="text-on-surface-var">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
