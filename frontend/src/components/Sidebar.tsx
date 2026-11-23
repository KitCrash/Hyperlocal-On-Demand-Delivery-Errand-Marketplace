'use client';

import React from 'react';
import {
  Home,
  Compass,
  Bike,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAiAssistant: () => void;
  onOpenCart: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCart,
}) => {
  const { user, switchRole } = useAuth();
  const { items } = useCart();

  const customerNav = [
    { id: 'home', label: 'Explore & Mandi', icon: Home },
    { id: 'orders', label: 'My Orders & Live Map', icon: Compass },
  ];

  const partnerNav = [
    { id: 'partner', label: 'Rider Radar & Jobs', icon: Bike },
    { id: 'orders', label: 'Active Deliveries', icon: Compass },
  ];

  const adminNav = [
    { id: 'admin', label: 'Platform Overview', icon: ShieldCheck },
    { id: 'orders', label: 'All Orders Stream', icon: Compass },
  ];

  const currentNav =
    user?.role === 'PARTNER' ? partnerNav : user?.role === 'ADMIN' ? adminNav : customerNav;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white/70 backdrop-blur-md border-r border-[#EBE4DC] p-4 shrink-0 h-[calc(100vh-65px)] sticky top-[65px] justify-between">
      <div className="space-y-6">
        {/* User Card Pill - Clean, without blue/colored dot */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#FAF7F2] to-amber-50/40 border border-[#EBE4DC] flex items-center gap-3">
          <img
            src={user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
            alt="Avatar"
            className="w-10 h-10 rounded-xl bg-white p-0.5 object-cover border border-[#E4DDD3]"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-neutral-900 truncate">{user?.name || 'Guest User'}</h4>
            <div className="mt-0.5">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            {user?.role === 'CUSTOMER' ? 'Customer Panel' : user?.role === 'PARTNER' ? 'Delivery Partner' : 'Admin Hub'}
          </div>
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
                    : 'text-neutral-700 hover:bg-neutral-100/70 hover:text-neutral-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {user?.role === 'CUSTOMER' && (
            <button
              onClick={onOpenCart}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-100/70 hover:text-neutral-900 transition-all"
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 text-neutral-500" />
                <span>Cart / Checkout</span>
              </div>
              {items.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                  {items.length}
                </span>
              )}
            </button>
          )}
        </nav>
      </div>

      {/* Footer Switcher */}
      <div className="pt-4 border-t border-[#EBE4DC] space-y-2">
        <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
          Switch Quick Role
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => switchRole('CUSTOMER')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              user?.role === 'CUSTOMER'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Customer
          </button>
          <button
            onClick={() => switchRole('PARTNER', 'partner1@hyperlocal.in')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              user?.role === 'PARTNER'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Rider
          </button>
          <button
            onClick={() => switchRole('ADMIN')}
            className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
              user?.role === 'ADMIN'
                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Admin
          </button>
        </div>
      </div>
    </aside>
  );
};
