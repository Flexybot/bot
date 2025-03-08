"use client";

import { ThemeProvider } from 'next-themes';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import PricingSection from '@/components/landing/PricingSection';

export default function LandingPage() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <FeaturesSection />
          <PricingSection />
        </main>
      </div>
    </ThemeProvider>
  );
}