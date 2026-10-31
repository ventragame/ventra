'use client';

import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface LifeComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LifeComingSoonModal({ isOpen, onClose }: LifeComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-100 overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content */}
        <div className="text-center space-y-4 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 mx-auto flex items-center justify-center shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-block bg-purple-600 text-white text-xs font-black px-3 py-1 rounded-full mb-2">
              13+ Yaş — Hazırlık Aşamasında
            </span>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Ventra Life Çok Yakında!
            </h3>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">
            Gençler ve yetişkinler için tasarlanan gerçek yaşam İngilizcesi, mesleki senaryolar ve dinamik diyalog modülleri üzerinde ekibimiz titizlikle çalışıyor.
          </p>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 font-medium text-left space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <span>🚀</span>
              <span>Neler geliyor?</span>
            </div>
            <p className="text-purple-800">
              Gerçek yaşam diyalog simülasyonları, iş & seyahat İngilizcesi ve yapay zeka destekli konuşma pratiği.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/kids"
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>Ventra Kids'i Dene</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={onClose}
              className="py-3 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold transition-all cursor-pointer"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
