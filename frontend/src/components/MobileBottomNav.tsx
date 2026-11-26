'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, Sparkles, ShoppingBag, Bike, ShieldCheck, User, Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAiAssistant: () => void;
  onOpenCart: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiAssistant,
  onOpenCart,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { items } = useCart();

  return (
    <div className="md:hidden fixed bottom-3 left-4 right-4 z-40">
      <div className="bg-white/95 backdrop-blur-lg border border-[#EBE4DC] rounded-full shadow-2xl px-4 py-2 flex items-center justify-around">
        {/* Home */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${
            activeTab === 'home' ? 'text-brand-600 bg-brand-50' : 'text-neutral-500 hover:text-neutral-800'
          }`}
          title="Home"
        >
          <Home className="w-5 h-5" />
          <span className="text-[9px] font-semibold mt-0.5">Explore</span>
        </button>

        {/* Orders / Tracking */}
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${
            activeTab === 'orders' ? 'text-brand-600 bg-brand-50' : 'text-neutral-500 hover:text-neutral-800'
          }`}
          title="Orders"
        >
          <Compass className="w-5 h-5" />
          <span className="text-[9px] font-semibold mt-0.5">Tracking</span>
        </button>

        {/* Center: SPECIAL AI HYBRID ORDER ASSISTANT */}
        <button
          onClick={onOpenAiAssistant}
          className="relative -top-4 w-12 h-12 rounded-full bg-gradient-to-tr from-brand-500 via-amber-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 active:scale-95 transition-transform"
          title="AI Hybrid Order"
        >
          <Sparkles className="w-6 h-6" />
          <span className="absolute -bottom-4 text-[9px] font-bold text-brand-700 whitespace-nowrap">
            AI Order
          </span>
        </button>

        {/* Role-Specific Action (Partner Dashboard or Admin or Cart) */}
        {user?.role === 'PARTNER' ? (
          <button
            onClick={() => setActiveTab('partner')}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${
              activeTab === 'partner' ? 'text-emerald-600 bg-emerald-50' : 'text-neutral-500 hover:text-neutral-800'
            }`}
            title="Partner Panel"
          >
            <Bike className="w-5 h-5" />
            <span className="text-[9px] font-semibold mt-0.5">Rider</span>
          </button>
        ) : user?.role === 'ADMIN' ? (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${
              activeTab === 'admin' ? 'text-purple-600 bg-purple-50' : 'text-neutral-500 hover:text-neutral-800'
            }`}
            title="Admin Panel"
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[9px] font-semibold mt-0.5">Admin</span>
          </button>
        ) : (
          <button
            onClick={() => router.push('/cart')}
            className="flex flex-col items-center justify-center p-2 rounded-full text-neutral-500 hover:text-neutral-800 relative"
            title="Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                {items.length}
              </span>
            )}
            <span className="text-[9px] font-semibold mt-0.5">Cart</span>
          </button>
        )}

        {/* Profile / Switcher */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center p-2 rounded-full transition-all ${
            activeTab === 'profile' ? 'text-brand-600 bg-brand-50' : 'text-neutral-500 hover:text-neutral-800'
          }`}
          title="Profile"
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-semibold mt-0.5">Profile</span>
        </button>
      </div>
    </div>
  );
};
