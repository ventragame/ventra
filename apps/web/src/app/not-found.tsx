import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDFEFF] text-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mb-4 shadow-sm border border-blue-100">
        🧭
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
        Sayfa Bulunamadı
      </h1>
      <p className="text-sm text-slate-600 max-w-sm mb-6">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all"
        >
          Ana Sayfaya Dön
        </Link>
        <Link
          href="/kids"
          className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold transition-all"
        >
          Ventra Kids Dünyası
        </Link>
      </div>
    </div>
  );
}

