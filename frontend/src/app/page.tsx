'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { CustomerView } from '../components/CustomerView';
import { PartnerView } from '../components/PartnerView';
import { AdminView } from '../components/AdminView';
import { AIHybridOrderAssistant } from '../components/AIHybridOrderAssistant';
import { CartDrawer } from '../components/CartDrawer';
import { InteractiveOrderTracker } from '../components/InteractiveOrderTracker';
import { PaymentModal } from '../components/PaymentModal';
import { ReviewModal } from '../components/ReviewModal';
import { Order, ServiceType } from '../types';
import { apiRequest } from '../lib/api';
import {
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Compass,
  Bike,
  ShieldCheck,
  CreditCard,
  Star,
} from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiAssistantMode, setAiAssistantMode] = useState<'voice' | 'image' | 'manual' | 'combined'>('voice');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [rateOrder, setRateOrder] = useState<Order | null>(null);
  const [allUserOrders, setAllUserOrders] = useState<Order[]>([]);

  // Automatically adjust default tab when role changes
  useEffect(() => {
    if (!user) return;
    if (user.role === 'PARTNER') {
      setActiveTab('partner');
    } else if (user.role === 'ADMIN') {
      setActiveTab('admin');
    } else {
      setActiveTab('home');
    }
    fetchUserOrders();
  }, [user?.role, user?.id]);

  const fetchUserOrders = async () => {
    try {
      const data = await apiRequest<{ orders: Order[] }>('/orders');
      setAllUserOrders(data.orders || []);
      // If there's an active order and none selected yet, select it for tracking view
      if (!selectedTrackingOrderId && data.orders?.length > 0) {
        setSelectedTrackingOrderId(data.orders[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-3xl bg-brand-500 text-white flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-brand-500/30">
            <Bike className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-neutral-900">Loading Hyperlocal Marketplace...</h3>
          <p className="text-xs text-neutral-500">Connecting to Mandi & Errand Network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      {/* Top Navigation */}
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAiAssistant={() => {
          setAiAssistantMode('voice');
          setIsAiAssistantOpen(true);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'orders') fetchUserOrders();
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => setSearchQuery(q)}
      />

      <div className="flex flex-1">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === 'orders') fetchUserOrders();
          }}
          onOpenAiAssistant={() => {
            setAiAssistantMode('voice');
            setIsAiAssistantOpen(true);
          }}
          onOpenCart={() => setIsCartOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* TAB 1: CUSTOMER VIEW */}
          {activeTab === 'home' && (
            <CustomerView
              onOpenAiAssistant={(mode = 'voice') => {
                setAiAssistantMode(mode);
                setIsAiAssistantOpen(true);
              }}
              onOpenCart={() => setIsCartOpen(true)}
              onSelectService={() => setIsCartOpen(true)}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
                if (tab === 'orders') fetchUserOrders();
              }}
              onSelectOrderToTrack={(ordId) => {
                setSelectedTrackingOrderId(ordId);
                setActiveTab('orders');
              }}
              searchQuery={searchQuery}
            />
          )}

          {/* TAB 2: PARTNER VIEW */}
          {activeTab === 'partner' && (
            <PartnerView
              onSelectOrderToTrack={(ordId) => {
                setSelectedTrackingOrderId(ordId);
                setActiveTab('orders');
              }}
            />
          )}

          {/* TAB 3: ADMIN VIEW */}
          {activeTab === 'admin' && <AdminView />}

          {/* TAB 4: ORDERS & REALTIME LIVE TRACKING */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">
                    Live Tracking & Order History
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Realtime delivery status, partner route radar, and dynamic price approvals
                  </p>
                </div>
                <button
                  onClick={fetchUserOrders}
                  className="py-2 px-3.5 rounded-xl bg-white border border-[#E8E1D7] text-xs font-bold text-neutral-700 hover:bg-neutral-50 flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {/* Order selector bar if multiple orders exist */}
              {allUserOrders.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {allUserOrders.map((ord) => {
                    const isSelected = selectedTrackingOrderId === ord.id;
                    return (
                      <button
                        key={ord.id}
                        onClick={() => setSelectedTrackingOrderId(ord.id)}
                        className={`p-3 rounded-2xl border text-left shrink-0 min-w-[200px] transition-all ${
                          isSelected
                            ? 'border-brand-600 bg-white shadow-md ring-2 ring-brand-500/20'
                            : 'border-[#E8E1D7] bg-white/70 hover:bg-white text-neutral-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-neutral-900">{ord.orderNumber}</span>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-50 text-brand-700">
                            {ord.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 block truncate">
                          {ord.serviceType.replace(/_/g, ' ')} · ₹{ord.totalAmount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Interactive Live Tracker */}
              {selectedTrackingOrderId ? (
                <InteractiveOrderTracker
                  orderId={selectedTrackingOrderId}
                  onRefreshOrders={fetchUserOrders}
                  onRateOrder={(ord) => setRateOrder(ord)}
                />
              ) : (
                <div className="p-12 text-center text-xs text-neutral-500 bg-white rounded-3xl border border-neutral-200">
                  <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  No orders placed yet. Choose items from the Mandi or use the AI Assistant to place your first errand order!
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROFILE VIEW */}
          {activeTab === 'profile' && user && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="p-6 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm text-center space-y-3">
                <img
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=profile'}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-brand-500 p-0.5"
                />
                <div>
                  <h3 className="text-lg font-black text-neutral-900">{user.name}</h3>
                  <p className="text-xs text-neutral-500">{user.email} · {user.phone}</p>
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-800 text-xs font-bold uppercase tracking-wider">
                  Role: {user.role}
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-[#E8E1D7] space-y-3">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Platform Credentials & Wallet
                </h4>
                <div className="flex justify-between text-xs py-1 border-b">
                  <span className="text-neutral-500">Wallet Balance</span>
                  <span className="font-extrabold text-neutral-900">₹{user.walletBalance || 0}</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b">
                  <span className="text-neutral-500">KYC Status</span>
                  <span className="font-bold text-emerald-600">✓ Verified</span>
                </div>
                <div className="flex justify-between text-xs py-1">
                  <span className="text-neutral-500">Service Location</span>
                  <span className="font-medium text-neutral-700">Action Area 1, New Town, Kolkata</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Bottom Navigation on Mobile */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'orders') fetchUserOrders();
        }}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Modals & Drawers */}
      <AIHybridOrderAssistant
        isOpen={isAiAssistantOpen}
        initialTab={aiAssistantMode}
        onClose={() => setIsAiAssistantOpen(false)}
        onProceedToCheckout={() => setIsCartOpen(true)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenAiAssistant={() => {
          setIsCartOpen(false);
          setIsAiAssistantOpen(true);
        }}
        onOrderCreated={(orderId) => {
          setSelectedTrackingOrderId(orderId);
          setActiveTab('orders');
          fetchUserOrders();
        }}
      />

      <PaymentModal
        order={paymentOrder}
        isOpen={!!paymentOrder}
        onClose={() => setPaymentOrder(null)}
        onPaymentSuccess={() => fetchUserOrders()}
      />

      <ReviewModal
        order={rateOrder}
        isOpen={!!rateOrder}
        onClose={() => setRateOrder(null)}
        onReviewSubmitted={() => fetchUserOrders()}
      />
    </div>
  );
}
