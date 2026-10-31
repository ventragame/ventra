'use client';

import React, { useState } from 'react';
import {
  Home,
  Sparkles,
  LayoutGrid,
  HelpCircle,
  Globe,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { VentraLogo } from './VentraLogo';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenFaq: () => void;
}

export function Navbar({ onOpenAuth, onOpenFaq }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<'TR' | 'EN'>('TR');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const navItems = [
    { label: 'Ana Sayfa', href: '#top', icon: Home, active: true },
    { label: 'Neden Ventra?', href: '#neden-ventra', icon: Sparkles },
    { label: 'Özellikler', href: '#ozellikler', icon: LayoutGrid },
    { label: 'Sıkça Sorulanlar', onClick: onOpenFaq, icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-100/70 transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Ventra Brand Logo */}
        <div className="flex-shrink-0">
          <VentraLogo size="sm" />
        </div>

        {/* Center: Frosted Navigation Pill (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-md border border-slate-200/70 rounded-full shadow-sm shadow-slate-200/40">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            if (item.onClick) {
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500 stroke-[2.2]" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <a
                key={idx}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-colors ${
                  item.active
                    ? 'font-bold text-blue-600 bg-blue-50/70'
                    : 'font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.active ? 'text-blue-600 stroke-[2.4]' : 'text-slate-500 stroke-[2.2]'}`} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right: Language Pill & Login CTA */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/60 rounded-full text-xs font-bold text-slate-700 transition-colors cursor-pointer"
              title="Dil Seçimi"
            >
              <Globe className="w-3.5 h-3.5 text-slate-600" />
              <span>{currentLang}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-28 bg-white border border-slate-200 rounded-2xl shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => {
                    setCurrentLang('TR');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 font-medium hover:bg-slate-50 ${currentLang === 'TR' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
                >
                  🇹🇷 Türkçe (TR)
                </button>
                <button
                  onClick={() => {
                    setCurrentLang('EN');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 font-medium hover:bg-slate-50 ${currentLang === 'EN' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}
                >
                  🇬🇧 English (EN)
                </button>
              </div>
            )}
          </div>

          {/* Login Button */}
          <button
            onClick={onOpenAuth}
            className="bg-[#1E6BFF] hover:bg-blue-600 active:scale-95 text-white text-xs font-bold px-5 py-2 rounded-full shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
          >
            Giriş Yap
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onOpenAuth}
            className="bg-[#1E6BFF] hover:bg-blue-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm"
          >
            Giriş
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Menüyü aç"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/98 px-4 pt-3 pb-6 space-y-2 shadow-lg">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            if (item.onClick) {
              return (
                <button
                  key={idx}
                  onClick={() => {
                    item.onClick!();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 text-left"
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span>{item.label}</span>
                </button>
              );
            }
            return (
              <a
                key={idx}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Icon className="w-4 h-4 text-slate-500" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      )}
    </header>
  );
}
