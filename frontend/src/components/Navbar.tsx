'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  Menu,
  X,
  Search,
  MapPin,
  Bell,
  ShoppingBag,
  User,
  ShieldCheck,
  Bike,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Home,
  Compass,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getSocket } from '../lib/socket';

interface NavbarProps {
  onOpenCart?: () => void;
  onOpenAiAssistant?: () => void;
  onNavigateTab?: (tab: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCart,
  onOpenAiAssistant,
  onNavigateTab,
  searchQuery = '',
  onSearchChange,
}) => {
  const { user, switchRole } = useAuth();
  const { items } = useCart();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications & listen for real-time alerts
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const data = await apiRequest<{ orders: any[] }>('/orders');
        const orders = data.orders || [];
        const notices = [];

        for (const ord of orders.slice(0, 5)) {
          if (ord.priceApprovalStatus === 'PENDING' && user.role === 'CUSTOMER') {
            notices.push({
              id: `price_${ord.id}`,
              title: `Price Approval Needed: ${ord.orderNumber}`,
              message: `Actual mandi price is ₹${ord.actualProductTotal}. Review and approve.`,
              time: 'Action required',
              type: 'PRICE_APPROVAL',
              orderId: ord.id,
            });
          } else if (ord.status === 'OUT_FOR_DELIVERY') {
            notices.push({
              id: `out_${ord.id}`,
              title: `Out for Delivery: ${ord.orderNumber}`,
              message: `Partner is heading to your location. OTP: ${ord.deliveryOtp}`,
              time: 'In transit',
              type: 'ORDER_UPDATE',
              orderId: ord.id,
            });
          }
        }
        setNotifications(notices);
        setUnreadCount(notices.length);
      } catch (err) {
        // silent
      }
    };

    fetchNotifications();

    const socket = getSocket();
    const handleGlobalUpdate = (data: any) => {
      if (data.event === 'price_approval_required' && user.role === 'CUSTOMER') {
        setNotifications((prev) => [
          {
            id: `price_${Date.now()}`,
            title: 'Price Approval Required!',
            message: `Partner entered actual market price: ₹${data.data?.actualProductTotal}`,
            time: 'Just now',
            type: 'PRICE_APPROVAL',
            orderId: data.orderId,
          },
          ...prev,
        ]);
        setUnreadCount((c) => c + 1);
      } else if (data.event === 'order_status_changed') {
        setNotifications((prev) => [
          {
            id: `status_${Date.now()}`,
            title: `Order Status: ${data.data?.status}`,
            message: data.data?.message || 'Order progress updated',
            time: 'Just now',
            type: 'ORDER_UPDATE',
            orderId: data.orderId,
          },
          ...prev,
        ]);
        setUnreadCount((c) => c + 1);
      }
    };

    socket.on('global_order_update', handleGlobalUpdate);
    return () => {
      socket.off('global_order_update', handleGlobalUpdate);
    };
  }, [user]);

  const totalCartCount = items.length;

  const handleNavClick = (tab: string) => {
    setIsMenuOpen(false);
    onNavigateTab?.(tab);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EBE4DC] px-3 sm:px-6 py-2.5 sm:py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* 1. Left: Hamburger menu icon */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 sm:p-2.5 rounded-2xl bg-white border border-[#E4DDD3] text-neutral-800 hover:bg-neutral-100 shadow-sm active:scale-95 transition-all focus:outline-none"
              aria-label="Open Navigation Menu"
              title="Open Menu"
            >
              <Menu className="w-5 h-5 text-neutral-800" />
            </button>

            {/* Brand Title (visible on desktop or tablet) */}
            <button
              onClick={() => handleNavClick('home')}
              className="hidden sm:flex items-center gap-2 text-left focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Bike className="w-4 h-4" />
              </div>
              <div className="hidden lg:block leading-tight">
                <span className="font-black text-base tracking-tight text-neutral-900 block">
                  Hyper<span className="text-brand-600">Local</span>
                </span>
                <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Errand Marketplace
                </span>
              </div>
            </button>
          </div>

          {/* 2. Center: Wide Search Bar */}
          <div className="flex-1 max-w-2xl mx-1 sm:mx-3">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search groceries, medicines, mandi, parcels, hardware..."
                className="w-full pl-9 sm:pl-10 pr-8 py-2 sm:py-2.5 rounded-full bg-white border border-[#E4DDD3] text-xs sm:text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-neutral-400 text-neutral-800"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-600 text-[10px] font-bold flex items-center justify-center transition-colors"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 3. Right: User Profile / Avatar & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                  setUnreadCount(0);
                }}
                className="p-2 sm:p-2.5 rounded-full bg-white border border-[#E4DDD3] text-neutral-700 hover:bg-neutral-50 shadow-sm relative transition-all"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white shadow-2xl border border-neutral-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100 mb-2">
                    <span className="text-xs font-bold text-neutral-800">Live Alerts & Updates</span>
                    <span className="text-[10px] text-neutral-400 font-medium">Socket.IO Connected</span>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-4 text-center">No new notifications</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setShowNotifications(false);
                            handleNavClick('orders');
                          }}
                          className="p-2 rounded-xl bg-neutral-50 border border-neutral-100 hover:bg-neutral-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            {n.type === 'PRICE_APPROVAL' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                            )}
                            <span className="text-xs font-semibold text-neutral-800 truncate">{n.title}</span>
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[9px] text-neutral-400 mt-1 block">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Button */}
            {onOpenCart && (
              <button
                onClick={onOpenCart}
                className="p-2 sm:p-2.5 rounded-full bg-white border border-[#E4DDD3] text-neutral-800 hover:bg-neutral-50 shadow-sm relative transition-all"
                title="View Cart / Checkout"
                aria-label="Cart"
              >
                <ShoppingBag className="w-4 h-4 text-brand-600" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {totalCartCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile Avatar Icon */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-full bg-white border border-[#E4DDD3] hover:border-brand-500/50 shadow-sm transition-all focus:outline-none"
                aria-label="User Profile"
                title="User Profile & Quick Role"
              >
                <img
                  src={user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=profile'}
                  alt={user?.name || 'User'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover bg-neutral-100 border border-neutral-200"
                />
                <span className="hidden md:inline text-xs font-bold text-neutral-800 pr-1 truncate max-w-[100px]">
                  {user?.name?.split(' ')[0] || 'Profile'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline" />
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-neutral-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-neutral-100 mb-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <img
                        src={user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=profile'}
                        alt={user?.name || 'User'}
                        className="w-9 h-9 rounded-full object-cover border border-[#E4DDD3]"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-neutral-900 truncate">{user?.name || 'Guest User'}</h4>
                        <p className="text-[10px] text-neutral-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 text-[10px] font-extrabold uppercase tracking-wider">
                      Role: {user?.role}
                    </div>
                  </div>

                  <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Switch Quick Role
                  </div>

                  <button
                    onClick={() => {
                      switchRole('CUSTOMER');
                      setShowProfileMenu(false);
                      onNavigateTab?.('home');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                      user?.role === 'CUSTOMER'
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-brand-600" />
                      <span>Customer (Ananya Roy)</span>
                    </div>
                    {user?.role === 'CUSTOMER' && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                  </button>

                  <button
                    onClick={() => {
                      switchRole('PARTNER', 'partner1@hyperlocal.in');
                      setShowProfileMenu(false);
                      onNavigateTab?.('partner');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                      user?.role === 'PARTNER' && user.email === 'partner1@hyperlocal.in'
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bike className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Rider (Rahul)</span>
                    </div>
                    {user?.role === 'PARTNER' && user.email === 'partner1@hyperlocal.in' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      switchRole('ADMIN');
                      setShowProfileMenu(false);
                      onNavigateTab?.('admin');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                      user?.role === 'ADMIN'
                        ? 'bg-purple-50 text-purple-900 font-bold'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Admin Hub</span>
                    </div>
                    {user?.role === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                  </button>

                  <div className="pt-2 mt-1 border-t border-neutral-100">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleNavClick('profile');
                      }}
                      className="w-full text-center py-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      View Account Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hamburger Slide Drawer / Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMenuOpen(false)}
            className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer content */}
          <div className="relative w-80 max-w-[85vw] bg-[#FAF7F2] h-full shadow-2xl border-r border-[#E8E1D7] z-50 p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D7]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-sm">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-base tracking-tight text-neutral-900 block leading-tight">
                      Hyper<span className="text-brand-600">Local</span>
                    </span>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Mandi & Errand Hub
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-xl bg-white border border-[#E8E1D7] text-neutral-600 hover:bg-neutral-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Profile Card */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D7] shadow-sm flex items-center gap-3">
                <img
                  src={user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                  alt="Avatar"
                  className="w-11 h-11 rounded-xl bg-neutral-100 p-0.5 object-cover border border-[#E4DDD3]"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-black text-neutral-900 truncate">{user?.name || 'Guest User'}</h4>
                  <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">
                    {user?.role}
                  </span>
                  <span className="text-[10px] text-neutral-400 block truncate">
                    Wallet: ₹{user?.walletBalance || 0}
                  </span>
                </div>
              </div>

              {/* Primary Navigation Links */}
              <nav className="space-y-1.5">
                <div className="px-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Navigation
                </div>

                <button
                  onClick={() => handleNavClick('home')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-neutral-800 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E8E1D7] transition-all"
                >
                  <Home className="w-4 h-4 text-brand-600" />
                  <span>Explore & Mandi Home</span>
                </button>

                <button
                  onClick={() => handleNavClick('orders')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-neutral-800 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E8E1D7] transition-all"
                >
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>My Orders & Live Tracking</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenAiAssistant?.();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-neutral-800 bg-amber-50/80 border border-amber-200 hover:bg-amber-100/70 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>AI Hybrid Order Assistant</span>
                </button>

                {onOpenCart && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenCart();
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-neutral-800 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E8E1D7] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-4 h-4 text-brand-600" />
                      <span>Cart / Checkout</span>
                    </div>
                    {totalCartCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                        {totalCartCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => handleNavClick('partner')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-neutral-800 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E8E1D7] transition-all"
                >
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <span>Delivery Partner Console</span>
                </button>

                <button
                  onClick={() => handleNavClick('admin')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-neutral-800 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E8E1D7] transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Admin Operations Hub</span>
                </button>
              </nav>

              {/* Role Switcher */}
              <div className="space-y-2 pt-2 border-t border-[#E8E1D7]">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2">
                  One-Tap Role Switcher
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => {
                      switchRole('CUSTOMER');
                      setIsMenuOpen(false);
                      onNavigateTab?.('home');
                    }}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all ${
                      user?.role === 'CUSTOMER'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-white text-neutral-600 border border-[#E8E1D7] hover:bg-neutral-50'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    onClick={() => {
                      switchRole('PARTNER', 'partner1@hyperlocal.in');
                      setIsMenuOpen(false);
                      onNavigateTab?.('partner');
                    }}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all ${
                      user?.role === 'PARTNER'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-white text-neutral-600 border border-[#E8E1D7] hover:bg-neutral-50'
                    }`}
                  >
                    Rider
                  </button>
                  <button
                    onClick={() => {
                      switchRole('ADMIN');
                      setIsMenuOpen(false);
                      onNavigateTab?.('admin');
                    }}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl transition-all ${
                      user?.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800 border border-purple-300'
                        : 'bg-white text-neutral-600 border border-[#E8E1D7] hover:bg-neutral-50'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom info */}
            <div className="pt-4 border-t border-[#E8E1D7] space-y-2">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/70 border border-[#E8E1D7] text-xs font-medium text-neutral-700">
                <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span className="truncate">Action Area 1, New Town, Kolkata</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
