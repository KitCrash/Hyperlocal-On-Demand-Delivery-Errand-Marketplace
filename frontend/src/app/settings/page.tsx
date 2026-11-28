'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

type ThemeOption = 'cream' | 'light' | 'dark';

const THEMES: { id: ThemeOption; label: string; desc: string }[] = [
  { id: 'cream', label: 'Warm Cream (Default)', desc: 'Soft warm cream background with terracotta accents' },
  { id: 'light', label: 'Crisp Light', desc: 'Clean pure white background with high contrast' },
  { id: 'dark', label: 'Dark Mode', desc: 'Low-glare dark surface for night viewing' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeOption>('cream');

  useEffect(() => {
    const saved = (localStorage.getItem('app-theme') as ThemeOption) || 'cream';
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  const handleSelectTheme = (nextTheme: ThemeOption) => {
    setTheme(nextTheme);
    localStorage.setItem('app-theme', nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-[#E8E1D7] px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-neutral-900">Settings</h1>
            <span className="text-[11px] text-neutral-500 font-medium block">
              Appearance & app preferences
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 space-y-3">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Color Theme
          </span>
          <div className="space-y-2.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTheme(t.id)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  theme === t.id
                    ? 'border-brand-600 bg-brand-50 text-brand-900'
                    : 'border-[#E8E1D7] bg-[#FAF7F2] text-neutral-800 hover:border-brand-500/40'
                }`}
              >
                <div>
                  <p className="text-xs sm:text-sm font-black">{t.label}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{t.desc}</p>
                </div>
                <span className="text-xs font-bold text-brand-600">
                  {theme === t.id ? 'Active' : 'Select'}
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
