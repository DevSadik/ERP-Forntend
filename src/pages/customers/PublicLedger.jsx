import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
const fmt = n => '৳' + (parseFloat(n)||0).toLocaleString('en-BD', { minimumFractionDigits: 0 });

export default function PublicLedger() {
  const { token } = useParams();
  const [lang, setLang] = useState('bn');
  const L = lang === 'en';

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-ledger', token],
    queryFn: () => axios.get(`${API}/customers/public/${token}`).then(r => r.data.data),
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#0b121e] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#0b121e] flex items-center justify-center p-4">
      <div className="text-center text-white">
        <p className="text-2xl mb-2">😕</p>
        <p className="text-lg font-bold">অ্যাকাউন্ট পাওয়া যায়নি</p>
        <p className="text-sm text-gray-400 mt-1">Link সঠিক কিনা চেক করুন।</p>
      </div>
    </div>
  );

  const { customer, entries } = data;
  const balance = customer.currentBalance || 0;

  const TYPE_COLOR = { sale:'text-red-400', payment:'text-emerald-400', return:'text-yellow-400', opening:'text-blue-400' };
  const TYPE_LABEL = {
    sale:    L ? 'Sale'    : 'বিক্রি',
    payment: L ? 'Payment' : 'পেমেন্ট',
    return:  L ? 'Return'  : 'ফেরত',
    opening: L ? 'Opening' : 'আগের বাকি',
  };

  return (
    <div className="min-h-screen bg-[#0b121e] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 px-4 py-5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-emerald-200">Mini Manager ERP</p>
            <h1 className="text-xl font-black mt-0.5">{customer.name}</h1>
            {customer.phone && <p className="text-sm text-emerald-200 mt-0.5">{customer.phone}</p>}
          </div>
          {/* Language toggle */}
          <div className="flex bg-emerald-900/50 rounded-xl p-1 gap-1">
            <button onClick={() => setLang('en')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${lang==='en' ? 'bg-white text-emerald-800' : 'text-emerald-200'}`}>EN</button>
            <button onClick={() => setLang('bn')} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${lang==='bn' ? 'bg-white text-emerald-800' : 'text-emerald-200'}`}>বাং</button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        {/* Balance card */}
        <div className={`rounded-2xl p-5 text-center ${balance > 0 ? 'bg-red-900/30 border border-red-800/50' : balance < 0 ? 'bg-emerald-900/30 border border-emerald-800/50' : 'bg-gray-800 border border-gray-700'}`}>
          <p className="text-sm text-gray-400 mb-1">{L ? 'Current Balance' : 'বর্তমান ব্যালেন্স'}</p>
          <p className={`text-4xl font-black ${balance > 0 ? 'text-red-400' : balance < 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
            {fmt(Math.abs(balance))}
          </p>
          <p className={`text-sm mt-1 font-semibold ${balance > 0 ? 'text-red-400' : balance < 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
            {balance > 0 ? (L ? '⚠ Due/Payable' : '⚠ পাওনা বাকি') : balance < 0 ? (L ? '✅ Advance Paid' : '✅ অগ্রিম দেওয়া') : (L ? '✅ All Clear' : '✅ সব নিষ্পত্তি')}
          </p>
        </div>

        {/* Entries */}
        <div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
            {L ? 'Transaction History' : 'লেনদেনের ইতিহাস'}
          </p>
          <div className="space-y-2">
            {entries.map(e => (
              <div key={e._id} className="bg-[#111e2e] border border-[#1e3045] rounded-xl px-4 py-3 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${e.type === 'sale' ? 'bg-red-400' : e.type === 'payment' ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${TYPE_COLOR[e.type]}`}>{TYPE_LABEL[e.type]}</span>
                    <span className="text-xs text-gray-500">{format(new Date(e.entryDate), 'dd/MM/yyyy')}</span>
                  </div>
                  {e.productName && <p className="text-sm font-semibold text-white mt-0.5 truncate">{e.productName}{e.quantity > 1 ? ` × ${e.quantity}` : ''}</p>}
                  {e.notes && <p className="text-xs text-gray-500 mt-0.5">{e.notes}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-black ${TYPE_COLOR[e.type]}`}>
                    {e.type === 'sale' ? '+' : '-'}{fmt(e.type === 'sale' ? e.dueAmount : e.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500">{fmt(e.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 py-4">
          © 2026 Mini Manager ERP by Wahidsadik Aditto
        </p>
      </div>
    </div>
  );
}
