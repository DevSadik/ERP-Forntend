import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import usePageTitle from '../hooks/usePageTitle';

// ── Bilingual content (English + Bangla) ──────────────────────────────────────
const T = {
  en: {
    nav_login: 'Login', nav_register: 'Register',
    hero_title_1: "Bangladesh's Largest Product Database",
    hero_title_2: 'now in your shop',
    hero_sub: 'Thousands of grocery, confectionery & everyday products in one database. Scan barcodes with your phone camera — no separate scanner or barcode purchase needed. Stock, sales, dues & accounts all in one app.',
    cta_trial: 'Start 30-Day Free Trial', cta_download: 'Download Android App', cta_login: 'Login',
    no_card: 'No credit card needed • Start in 5 minutes',
    features_title: 'What you get', features_sub: 'Everything you need to run your shop, in one place',
    f1_t: "Bangladesh's Biggest Product Database", f1_d: 'Thousands of known products already added. When one shopkeeper adds a new product, everyone gets it — a crowd-built database, the largest of its kind in the country.',
    f2_t: 'Scan Barcodes with Phone Camera', f2_d: 'No need to buy a separate barcode scanner. Your phone camera is enough. Scan the barcode on a product and its name, company and price fill in automatically.',
    f3_t: 'No Need to Print Your Own Barcodes', f3_d: "Use the barcode already printed on the product. No printing or buying new barcodes — saving both cost and hassle.",
    f4_t: 'Stock Management', f4_d: 'See what you have and what is running low at a glance. Track stock-in and stock-out easily.',
    f5_t: 'Sales & Accounts', f5_d: 'Daily sales, profit-loss and reports in one place. Who owes how much — the due ledger is digital too.',
    f6_t: 'Fully in Bangla, on Mobile', f6_d: 'Simple Bangla interface. No computer needed — run your whole shop from your phone. Works even on slow internet.',
    why_title: 'Why Mini Manager', why_body: 'Before, you needed expensive POS machines, barcode scanners, barcode printing and training. Now, just a phone. That is all.',
    who_title: 'Who is it for', who_body: 'Grocery stores • Confectioneries • Sweet shops • Pharmacies • Any retail shop',
    download_title: 'Download the Android App', download_sub: 'Install the app directly on your phone — barcode scanning, sales and stock management now in your hands.',
    download_btn: 'Download APK', download_note: 'To install: enable "Unknown sources" in your phone Settings',
    cta2_title: 'Start today', cta2_sub: '30 days completely free — no credit card needed.', cta2_btn: 'Register Free',
    footer_dev: 'Developed by',
  },
  bn: {
    nav_login: 'লগইন', nav_register: 'রেজিস্টার',
    hero_title_1: 'বাংলাদেশের সবচেয়ে বড় পণ্য ডেটাবেজ',
    hero_title_2: 'এখন আপনার দোকানে',
    hero_sub: 'মুদি, কনফেকশনারি ও নিত্যপ্রয়োজনীয় হাজারো পণ্য এক ডেটাবেজে। ফোনের ক্যামেরা দিয়ে বারকোড স্ক্যান করুন — আলাদা কোনো যন্ত্র বা বারকোড কিনতে হবে না। স্টক, বিক্রি, বাকি ও হিসাব সব এক অ্যাপে।',
    cta_trial: '৩০ দিন ফ্রি ট্রায়াল শুরু করুন', cta_download: 'Android অ্যাপ ডাউনলোড', cta_login: 'লগইন',
    no_card: 'কোনো ক্রেডিট কার্ড লাগবে না • ৫ মিনিটে শুরু করুন',
    features_title: 'যা যা পাচ্ছেন', features_sub: 'দোকান চালানোর জন্য প্রয়োজনীয় সব ফিচার এক জায়গায়',
    f1_t: 'বাংলাদেশের সবচেয়ে বড় পণ্য ডেটাবেজ', f1_d: 'হাজারো পরিচিত পণ্য আগে থেকেই যোগ করা। একজন দোকানদার নতুন পণ্য যোগ করলে সবাই সেটা পায় — সম্মিলিতভাবে গড়ে ওঠা দেশের বৃহত্তম দোকান-ডেটাবেজ।',
    f2_t: 'ফোনের ক্যামেরায় বারকোড স্ক্যান', f2_d: 'আলাদা বারকোড স্ক্যানার যন্ত্র কিনতে হবে না। ফোনের ক্যামেরাই যথেষ্ট। পণ্যের বারকোড স্ক্যান করলেই নাম, কোম্পানি, দাম — সব automatic চলে আসে।',
    f3_t: 'নিজে বারকোড বানাতে হবে না', f3_d: 'পণ্যের গায়ে যে বারকোড আছে সেটাই ব্যবহার করুন। নতুন করে বারকোড ছাপাতে বা কিনতে হবে না — খরচ ও ঝামেলা দুটোই বাঁচল।',
    f4_t: 'স্টক ম্যানেজমেন্ট', f4_d: 'কোন পণ্য কত আছে, কোনটা শেষ হয়ে আসছে — এক নজরে দেখুন। স্টক-ইন, স্টক-আউট সব ট্র্যাক করুন।',
    f5_t: 'বিক্রি ও হিসাব', f5_d: 'দৈনিক বিক্রি, লাভ-ক্ষতি, রিপোর্ট — সব এক জায়গায়। কে কত বাকি রাখল, সেই খাতাও ডিজিটাল।',
    f6_t: 'সম্পূর্ণ বাংলায়, মোবাইলে', f6_d: 'সহজ বাংলা ইন্টারফেস। কম্পিউটার লাগবে না — ফোনেই পুরো দোকান সামলান। ইন্টারনেট কম থাকলেও কাজ করে।',
    why_title: 'কেন Mini Manager', why_body: 'আগে যেখানে দরকার হতো দামি POS যন্ত্র, বারকোড স্ক্যানার, বারকোড ছাপানো, প্রশিক্ষণ — এখন শুধু একটা ফোন। ব্যাস।',
    who_title: 'কাদের জন্য', who_body: 'মুদি দোকান • কনফেকশনারি • মিষ্টির দোকান • ফার্মেসি • যেকোনো খুচরা দোকান',
    download_title: 'Android অ্যাপ ডাউনলোড করুন', download_sub: 'ফোনে সরাসরি অ্যাপ ইনস্টল করুন — বারকোড স্ক্যান, বিক্রি ও স্টক ম্যানেজমেন্ট এখন হাতের মুঠোয়।',
    download_btn: 'APK ডাউনলোড করুন', download_note: 'ইনস্টল করতে: ফোনের Settings → "Unknown sources" চালু করুন',
    cta2_title: 'আজই শুরু করুন', cta2_sub: '৩০ দিন সম্পূর্ণ ফ্রি — কোনো ক্রেডিট কার্ড লাগবে না।', cta2_btn: 'ফ্রি রেজিস্টার করুন',
    footer_dev: 'ডেভেলপ করেছেন',
  },
};

export default function LandingPage() {
  const [lang, setLang] = useState('bn');
  const t = T[lang];

  usePageTitle(
    lang === 'bn' ? 'দোকান ম্যানেজমেন্ট ও ইনভেন্টরি সফটওয়্যার' : 'Shop Management & Inventory Software',
    lang === 'bn'
      ? 'বাংলাদেশের সবচেয়ে বড় পণ্য ডেটাবেজ। ফোনের ক্যামেরায় বারকোড স্ক্যান করুন। স্টক, বিক্রি, বাকি ও হিসাব এক অ্যাপে। ৩০ দিন ফ্রি।'
      : "Bangladesh's largest product database. Scan barcodes with your phone camera. Stock, sales & accounts in one app. 30 days free."
  );

  const features = [
    { icon: 'database',        t: t.f1_t, d: t.f1_d },
    { icon: 'qr_code_scanner', t: t.f2_t, d: t.f2_d },
    { icon: 'sell',            t: t.f3_t, d: t.f3_d },
    { icon: 'inventory_2',     t: t.f4_t, d: t.f4_d },
    { icon: 'payments',        t: t.f5_t, d: t.f5_d },
    { icon: 'smartphone',      t: t.f6_t, d: t.f6_d },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-outline-var">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Mini Manager ERP" className="w-9 h-9" width="36" height="36" />
            <span className="font-black text-primary text-lg">Mini Manager ERP</span>
          </div>
          <nav className="flex items-center gap-2">
            {/* Language toggle */}
            <button onClick={() => setLang(l => l === 'bn' ? 'en' : 'bn')}
              className="text-label-sm font-bold border border-outline-var px-2.5 py-1.5 rounded-lg hover:bg-surface-high transition-all">
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
            <Link to="/shop/login"
              className="text-label-md font-semibold text-on-surface border border-outline-var px-3 py-2 rounded-xl hover:bg-surface-high hover:text-primary transition-all">
              {t.nav_login}
            </Link>
            <Link to="/shop/register"
              className="bg-primary text-white font-bold text-label-md px-4 py-2 rounded-xl hover:brightness-110 transition-all">
              {t.nav_register}
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pt-14 pb-16 text-center">
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-black text-on-surface leading-tight max-w-3xl mx-auto">
          <span className="text-primary">{t.hero_title_1}</span><br/>{t.hero_title_2}
        </motion.h1>
        <p className="text-body-lg text-on-surface-var mt-5 max-w-2xl mx-auto">{t.hero_sub}</p>
        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <Link to="/shop/register"
            className="bg-primary text-white font-bold px-6 py-3.5 rounded-xl hover:brightness-110 transition-all shadow-primary-glow inline-flex items-center gap-2">
            <span className="material-symbols-outlined !text-[20px]">rocket_launch</span>
            {t.cta_trial}
          </Link>
          <a href="/app/mini-manager-erp.apk" download
            className="bg-[#011d46] text-white font-bold px-6 py-3.5 rounded-xl hover:brightness-125 transition-all inline-flex items-center gap-2">
            <span className="material-symbols-outlined !text-[20px]">android</span>
            {t.cta_download}
          </a>
          <Link to="/shop/login"
            className="border border-outline-var text-on-surface font-bold px-6 py-3.5 rounded-xl hover:bg-surface-high transition-all">
            {t.cta_login}
          </Link>
        </div>
        <p className="text-label-sm text-on-surface-var mt-4">{t.no_card}</p>
      </section>

      {/* ── Logo banner ─────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pb-10">
        <img src="/logo-banner.png" alt="Mini Manager ERP" className="w-full rounded-2xl border border-outline-var" loading="lazy" />
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-2">{t.features_title}</h2>
        <p className="text-body-md text-on-surface-var text-center mb-10">{t.features_sub}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="bg-surface border border-outline-var rounded-2xl p-5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-primary !text-[24px]">{f.icon}</span>
              </div>
              <h3 className="font-bold text-on-surface mb-1">{f.t}</h3>
              <p className="text-body-sm text-on-surface-var">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Why ──────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-14 text-center">
        <h2 className="text-2xl md:text-3xl font-black mb-4">{t.why_title}</h2>
        <p className="text-body-lg text-on-surface-var">{t.why_body}</p>
      </section>

      {/* ── Who ──────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-black mb-3">{t.who_title}</h2>
        <p className="text-body-md text-on-surface-var">{t.who_body}</p>
      </section>

      {/* ── Android download ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-14">
        <div className="bg-[#011d46] rounded-3xl p-8 md:p-10 text-center text-white">
          <span className="material-symbols-outlined !text-[48px] text-primary-dim mb-3">android</span>
          <h2 className="text-2xl md:text-3xl font-black mb-3">{t.download_title}</h2>
          <p className="text-white/70 mb-6 max-w-lg mx-auto">{t.download_sub}</p>
          <a href="/app/mini-manager-erp.apk" download
            className="bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:brightness-110 transition-all inline-flex items-center gap-2">
            <span className="material-symbols-outlined !text-[22px]">download</span>
            {t.download_btn}
          </a>
          <p className="text-label-sm text-white/50 mt-4">{t.download_note}</p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 py-14 text-center">
        <div className="bg-primary/10 border border-primary/30 rounded-3xl p-10">
          <h2 className="text-2xl md:text-3xl font-black mb-3">{t.cta2_title}</h2>
          <p className="text-body-md text-on-surface-var mb-6">{t.cta2_sub}</p>
          <Link to="/shop/register"
            className="bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:brightness-110 transition-all inline-flex items-center gap-2">
            <span className="material-symbols-outlined !text-[20px]">rocket_launch</span>
            {t.cta2_btn}
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
            © 2026 Mini Manager ERP — {t.footer_dev} Wahidsadik Aditto
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
