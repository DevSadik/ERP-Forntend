import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePageTitle from '../hooks/usePageTitle';

const FEATURES = [
  { icon: 'inventory_2',  title: 'স্টক ম্যানেজমেন্ট',     desc: 'বারকোড স্ক্যান করে স্টক-ইন, স্টক-আউট ও রিয়েল-টাইম ইনভেন্টরি ট্র্যাক করুন।' },
  { icon: 'point_of_sale', title: 'বিক্রয় ও POS',          desc: 'দ্রুত বিক্রয় এন্ট্রি, ইনভয়েস ও দৈনিক বিক্রির রিপোর্ট এক জায়গায়।' },
  { icon: 'currency_exchange', title: 'বাকি ও হিসাব',      desc: 'গ্রাহকের বাকির খাতা ডিজিটালি রাখুন — কে কত বাকি, সব পরিষ্কার।' },
  { icon: 'qr_code_scanner', title: 'বারকোড স্ক্যানার',     desc: 'ফোনের ক্যামেরা দিয়েই বারকোড স্ক্যান করে পণ্য যোগ করুন, কোনো হার্ডওয়্যার লাগবে না।' },
  { icon: 'group',         title: 'মাল্টি-ইউজার',          desc: 'একাধিক স্টাফ আলাদা অ্যাকাউন্ট দিয়ে একসাথে কাজ করতে পারবে।' },
  { icon: 'bar_chart',     title: 'রিপোর্ট ও অ্যানালিটিক্স', desc: 'সাপ্তাহিক বিক্রি, লাভ-ক্ষতি ও স্টক রিপোর্ট গ্রাফে দেখুন।' },
];

const STEPS = [
  { n: '১', title: 'রেজিস্টার করুন',  desc: 'ফোন নম্বর দিয়ে ৩০ সেকেন্ডে অ্যাকাউন্ট খুলুন — কোনো ক্রেডিট কার্ড লাগবে না।' },
  { n: '২', title: 'পণ্য যোগ করুন',   desc: 'বারকোড স্ক্যান করুন বা হাতে লিখে আপনার দোকানের পণ্য তালিকা তৈরি করুন।' },
  { n: '৩', title: 'বিক্রি শুরু করুন', desc: 'প্রতিদিনের বিক্রি, স্টক ও হিসাব এক অ্যাপ থেকেই সামলান।' },
];

export default function LandingPage() {
  usePageTitle(
    'দোকান ম্যানেজমেন্ট ও ইনভেন্টরি সফটওয়্যার',
    'মুদি, কনফেকশনারি ও খুচরা দোকানের জন্য সহজ ইনভেন্টরি সফটওয়্যার। স্টক, বিক্রি, বাকি ও হিসাব এক অ্যাপে। ৩০ দিন ফ্রি ট্রায়াল।'
  );

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-var">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Mini Manager ERP লোগো" className="w-9 h-9" width="36" height="36" />
            <span className="font-black text-primary text-lg">Mini Manager ERP</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/shop/login" className="text-label-md font-semibold text-on-surface-var hover:text-primary transition-colors hidden sm:inline">
              লগইন
            </Link>
            <Link to="/shop/register"
              className="bg-primary text-white font-bold text-label-md px-4 py-2 rounded-xl hover:brightness-110 transition-all">
              ফ্রি শুরু করুন
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-14 pb-16 text-center">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-black text-on-surface leading-tight max-w-3xl mx-auto">
          আপনার দোকানের <span className="text-primary">স্টক, বিক্রি ও হিসাব</span><br/>
          এখন এক অ্যাপে
        </motion.h1>
        <p className="text-body-lg text-on-surface-var mt-5 max-w-xl mx-auto">
          মুদি, কনফেকশনারি ও খুচরা দোকানের জন্য বানানো সহজ ইনভেন্টরি ম্যানেজমেন্ট সফটওয়্যার।
          বারকোড স্ক্যান করুন, বিক্রি ট্র্যাক করুন, বাকির হিসাব রাখুন — সব বাংলায়, সব মোবাইলে।
        </p>
        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <Link to="/shop/register"
            className="bg-primary text-white font-bold px-6 py-3.5 rounded-xl hover:brightness-110 transition-all shadow-primary-glow inline-flex items-center gap-2">
            <span className="material-symbols-outlined !text-[20px]">rocket_launch</span>
            ৩০ দিন ফ্রি ট্রায়াল শুরু করুন
          </Link>
          <a href="/app/mini-manager-erp.apk" download
            className="bg-[#011d46] text-white font-bold px-6 py-3.5 rounded-xl hover:brightness-125 transition-all inline-flex items-center gap-2">
            <span className="material-symbols-outlined !text-[20px]">android</span>
            Android অ্যাপ ডাউনলোড
          </a>
          <Link to="/shop/login"
            className="border border-outline-var text-on-surface font-bold px-6 py-3.5 rounded-xl hover:bg-surface-high transition-all">
            লগইন করুন
          </Link>
        </div>
        <p className="text-label-sm text-on-surface-var mt-4">কোনো ক্রেডিট কার্ড লাগবে না • ৫ মিনিটে শুরু করুন</p>
      </section>

      {/* ── Logo banner image ───────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pb-10">
        <img src="/logo-banner.png" alt="Mini Manager ERP — আপনার দোকান আপনার নিয়ন্ত্রণে"
          className="w-full rounded-2xl border border-outline-var" loading="lazy" />
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-2">যা যা পাচ্ছেন</h2>
        <p className="text-body-md text-on-surface-var text-center mb-10">দোকান চালানোর জন্য প্রয়োজনীয় সব ফিচার এক জায়গায়</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-surface border border-outline-var rounded-2xl p-5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-primary !text-[24px]">{f.icon}</span>
              </div>
              <h3 className="font-bold text-on-surface mb-1">{f.title}</h3>
              <p className="text-body-sm text-on-surface-var">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-10">যেভাবে শুরু করবেন</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map(s => (
            <div key={s.n} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white font-black text-xl flex items-center justify-center mx-auto mb-3">
                {s.n}
              </div>
              <h3 className="font-bold text-on-surface mb-1">{s.title}</h3>
              <p className="text-body-sm text-on-surface-var">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-14 text-center">
        <h2 className="text-2xl md:text-3xl font-black mb-4">কাদের জন্য</h2>
        <p className="text-body-md text-on-surface-var max-w-2xl mx-auto">
          মুদি দোকান, কনফেকশনারি, মিষ্টির দোকান, ফার্মেসি ও যেকোনো খুচরা ব্যবসার জন্য Mini Manager ERP
          সহজ এবং সাশ্রয়ী। বাংলাদেশের ছোট ও মাঝারি দোকানদারদের জন্য বিশেষভাবে তৈরি, ইন্টারনেট কম থাকলেও কাজ করে।
        </p>
      </section>

      {/* ── Android app download ─────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <div className="bg-[#011d46] rounded-3xl p-8 md:p-10 text-center text-white">
          <span className="material-symbols-outlined !text-[48px] text-primary-dim mb-3">android</span>
          <h2 className="text-2xl md:text-3xl font-black mb-3">Android অ্যাপ ডাউনলোড করুন</h2>
          <p className="text-white/70 mb-6 max-w-lg mx-auto">
            ফোনে সরাসরি অ্যাপ ইনস্টল করুন — বারকোড স্ক্যান, বিক্রি ও স্টক ম্যানেজমেন্ট এখন হাতের মুঠোয়।
          </p>
          <a href="/app/mini-manager-erp.apk" download
            className="bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:brightness-110 transition-all inline-flex items-center gap-2">
            <span className="material-symbols-outlined !text-[22px]">download</span>
            APK ডাউনলোড করুন
          </a>
          <p className="text-label-sm text-white/50 mt-4">
            ইনস্টল করতে: ফোনের Settings → "Unknown sources" চালু করুন
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-14 text-center">
        <div className="bg-primary/10 border border-primary/30 rounded-3xl p-10">
          <h2 className="text-2xl md:text-3xl font-black mb-3">আজই শুরু করুন</h2>
          <p className="text-body-md text-on-surface-var mb-6">৩০ দিন সম্পূর্ণ ফ্রি — কোনো ক্রেডিট কার্ড লাগবে না।</p>
          <Link to="/shop/register"
            className="bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:brightness-110 transition-all inline-flex items-center gap-2">
            <span className="material-symbols-outlined !text-[20px]">rocket_launch</span>
            ফ্রি রেজিস্টার করুন
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-outline-var py-8 mt-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Mini Manager ERP" className="w-7 h-7" width="28" height="28" />
            <span className="font-bold text-on-surface">Mini Manager ERP</span>
          </div>
          <p className="text-label-sm text-on-surface-var text-center">
            © 2026 Mini Manager ERP — Developed by Wahidsadik Aditto
          </p>
          <a href="tel:01844815121" className="text-label-sm font-bold text-primary inline-flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined !text-[16px]">call</span>
            01844815121
          </a>
        </div>
      </footer>
    </div>
  );
}
