import React from 'react';
import Link from 'next/link';
import { VentraLogo } from './VentraLogo';

interface FooterProps {
  onOpenFaq: () => void;
  onOpenLifeModal: () => void;
}

export function Footer({ onOpenFaq, onOpenLifeModal }: FooterProps) {
  return (
    <footer className="w-full bg-slate-50 border-t border-slate-200/80 pt-12 pb-10 text-slate-600">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-200">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <VentraLogo size="md" />
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
              Ventra, her yaş grubuna özel pedagojik yaklaşımlarla İngilizceyi eğlenceli, etkili ve gerçek hayata uygun şekilde keşfetmenizi sağlar.
            </p>
          </div>

          {/* Navigation Links Column */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Deneyimler
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/kids" className="hover:text-blue-600 transition-colors">
                  Ventra Kids (7–12 Yaş)
                </Link>
              </li>
              <li>
                <button
                  onClick={onOpenLifeModal}
                  className="hover:text-purple-600 transition-colors text-left cursor-pointer"
                >
                  Ventra Life (13+ Yaş — Yakında)
                </button>
              </li>
              <li>
                <a href="#neden-ventra" className="hover:text-blue-600 transition-colors">
                  Neden Ventra?
                </a>
              </li>
            </ul>
          </div>

          {/* Features & Help Column */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Destek & Güvenlik
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <a href="#ozellikler" className="hover:text-blue-600 transition-colors">
                  Platform Özellikleri
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenFaq}
                  className="hover:text-blue-600 transition-colors text-left cursor-pointer"
                >
                  Sıkça Sorulan Sorular
                </button>
              </li>
              <li>
                <span className="text-slate-400">
                  Çocuk Dostu Dijital Deneyim (Ebeveyn Denetimli)
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Ventra Learning Inc. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-6">
            <span>Gizlilik Politikası</span>
            <span>Kullanım Koşulları</span>
            <span>Çerez Ayarları</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

