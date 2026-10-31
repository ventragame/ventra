'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/homepage/Navbar';
import { HeroSection } from '../components/homepage/HeroSection';
import { ExperienceCards } from '../components/homepage/ExperienceCards';
import { FeaturesStrip } from '../components/homepage/FeaturesStrip';
import { WhyVentraSection } from '../components/homepage/WhyVentraSection';
import { TrustStatsSection } from '../components/homepage/TrustStatsSection';
import { Footer } from '../components/homepage/Footer';
import { LifeComingSoonModal } from '../components/homepage/LifeComingSoonModal';
import { AuthModal } from '../components/homepage/AuthModal';
import { FaqModal } from '../components/homepage/FaqModal';

export default function VentraHomePage() {
  const [isLifeModalOpen, setIsLifeModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('modal') === 'life') setIsLifeModalOpen(true);
      if (params.get('modal') === 'auth') setIsAuthModalOpen(true);
      if (params.get('modal') === 'faq') setIsFaqModalOpen(true);
    }
  }, []);

  return (
    <div
      className="min-h-screen text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden"
      style={{
        background: `
          radial-gradient(1100px 550px at 12% 8%, rgba(219, 234, 254, 0.7) 0%, rgba(219, 234, 254, 0.15) 50%, transparent 75%),
          radial-gradient(1100px 550px at 88% 8%, rgba(243, 232, 255, 0.65) 0%, rgba(243, 232, 255, 0.15) 50%, transparent 75%),
          radial-gradient(1200px 600px at 50% 36%, rgba(224, 242, 254, 0.4) 0%, transparent 80%),
          linear-gradient(180deg, #F9FBFE 0%, #EDF4FB 26%, #F5F8FC 65%, #FFFFFF 100%)
        `
      }}
    >
      {/* 1. Header / Navigation */}
      <Navbar
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenFaq={() => setIsFaqModalOpen(true)}
      />

      {/* 2. Main Page Content */}
      <main className="flex-1 flex flex-col">
        {/* A. Hero Section */}
        <HeroSection />

        {/* B. Experience Cards (Kids vs Life) */}
        <ExperienceCards
          onOpenLifeModal={() => setIsLifeModalOpen(true)}
        />

        {/* C. Features Strip */}
        <FeaturesStrip />

        {/* D. Neden Ventra? Section */}
        <WhyVentraSection
          onLearnMore={() => {
            const el = document.getElementById('ozellikler');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* E. Verified Pedagogical Trust & Product Strengths */}
        <TrustStatsSection />
      </main>

      {/* 3. Footer */}
      <Footer
        onOpenFaq={() => setIsFaqModalOpen(true)}
        onOpenLifeModal={() => setIsLifeModalOpen(true)}
      />

      {/* 4. Interactive Modals */}
      <LifeComingSoonModal
        isOpen={isLifeModalOpen}
        onClose={() => setIsLifeModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <FaqModal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
      />
    </div>
  );
}
