'use client';

import React from 'react';
import { X, Shield, ArrowRight, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-3 pt-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center shadow-inner">
            <UserCheck className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            Ventra Giriş Portalı
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm">
            Çocuk profiline veya ebeveyn denetim paneline erişmek için bir seçenek seçin.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="space-y-3">
          <Link
            href="/kids"
            className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-blue-200/80 hover:border-blue-400 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏝️</span>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Ventra Kids Dünyası
                </div>
                <div className="text-xs text-slate-500">
                  Oyunlara ve öğrenme adasına katıl
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-600 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/progress"
            className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-600" />
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Ebeveyn & İlerleme Paneli
                </div>
                <div className="text-xs text-slate-500">
                  Gelişim raporu ve bulut senkronizasyonu
                </div>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Çocuklara özel korumalı ortam. Ebeveyn denetimli güvenli kullanım.
          </p>
        </div>
      </div>
    </div>
  );
}
