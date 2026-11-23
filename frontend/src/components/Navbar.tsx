'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  MapPin,
  Bell,
  ShoppingBag,
  User,
  ShieldCheck,
  Bike,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { getSocket } from '../lib/socket';

interface NavbarProps {
  onOpenCart?: () => void;
  onOpenAiAssistant?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCart }) => {
  const { user, switchRole, logout } = useAuth();
  const { items } = useCart();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
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

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#EBE4DC] px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand & Clean Location (No blinking dot) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-neutral-900 block leading-tight">
                Hyper<span className="text-brand-600">Local</span>
              </span>
              <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider block">
                Mandi & Errand Hub
              </span>
            </div>
          </div>

          {/* Clean Location Pill (Blinking dot removed) */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-[#E8E1D7] text-xs font-medium text-neutral-700 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="truncate max-w-[170px]">Action Area 1, New Town</span>
          </div>
        </div>

        {/* Right: Role Switcher & Notifications & Cart (No blinking dots, no blue dots) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher Pill - Clean, without blue dot */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E4DDD3] text-xs font-bold text-neutral-800 shadow-sm hover:bg-neutral-50 transition-colors"
            >
              {user?.role === 'CUSTOMER' && <User className="w-3.5 h-3.5 text-neutral-600" />}
              {user?.role === 'PARTNER' && <Bike className="w-3.5 h-3.5 text-neutral-600" />}
              {user?.role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-neutral-600" />}
              <span className="capitalize hidden sm:inline">
                {user?.role === 'CUSTOMER'
                  ? 'Customer'
                  : user?.role === 'PARTNER'
                  ? `Partner (${user.name.split(' ')[0]})`
                  : 'Admin'}
              </span>
              <span className="sm:hidden font-bold">
                {user?.role === 'CUSTOMER' ? 'User' : user?.role === 'PARTNER' ? 'Rider' : 'Admin'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {/* Role Switch Dropdown */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-neutral-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    One-Click Role Switcher
                  </p>
                  <p className="text-xs font-medium text-neutral-700">
                    Test live interactions across all 3 panels
                  </p>
                </div>

                <button
                  onClick={() => {
                    switchRole('CUSTOMER');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                    user?.role === 'CUSTOMER'
                      ? 'bg-amber-50 text-amber-900 font-semibold'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <User className="w-4 h-4 text-brand-600" />
                  <div className="flex-1">
                    <div>Customer (Ananya Roy)</div>
                    <div className="text-[10px] text-neutral-400">Place orders, approve prices</div>
                  </div>
                  {user?.role === 'CUSTOMER' && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                </button>

                <button
                  onClick={() => {
                    switchRole('PARTNER', 'partner1@hyperlocal.in');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                    user?.role === 'PARTNER' && user.email === 'partner1@hyperlocal.in'
                      ? 'bg-emerald-50 text-emerald-900 font-semibold'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <div className="flex-1">
                    <div>Delivery Partner (Rahul)</div>
                    <div className="text-[10px] text-neutral-400">Motorcycle, enter mandi prices</div>
                  </div>
                  {user?.role === 'PARTNER' && user.email === 'partner1@hyperlocal.in' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </button>

                <button
                  onClick={() => {
                    switchRole('PARTNER', 'partner2@hyperlocal.in');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                    user?.role === 'PARTNER' && user.email === 'partner2@hyperlocal.in'
                      ? 'bg-emerald-50 text-emerald-900 font-semibold'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <div className="flex-1">
                    <div>Delivery Partner (Bikram)</div>
                    <div className="text-[10px] text-neutral-400">Scooter, live GPS tracking</div>
                  </div>
                  {user?.role === 'PARTNER' && user.email === 'partner2@hyperlocal.in' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </button>

                <button
                  onClick={() => {
                    switchRole('ADMIN');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-medium transition-colors ${
                    user?.role === 'ADMIN'
                      ? 'bg-purple-50 text-purple-900 font-semibold'
                      : 'hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <div className="flex-1">
                    <div>Admin Operations</div>
                    <div className="text-[10px] text-neutral-400">Price audits, fraud watch, ledger</div>
                  </div>
                  {user?.role === 'ADMIN' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setUnreadCount(0);
              }}
              className="p-2 rounded-full bg-white border border-[#E4DDD3] text-neutral-700 hover:bg-neutral-50 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-xl border border-neutral-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 mb-2">
                  <span className="text-xs font-bold text-neutral-800">Live Alerts & Updates</span>
                  <span className="text-[10px] text-neutral-400">Socket.IO Connected</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-4 text-center">No new notifications</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-2 rounded-xl bg-neutral-50 border border-neutral-100 hover:bg-neutral-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          {n.type === 'PRICE_APPROVAL' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 text-white font-semibold text-xs shadow-sm hover:bg-neutral-800 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-brand-400" />
              <span className="hidden sm:inline">Cart</span>
              {totalCartCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
