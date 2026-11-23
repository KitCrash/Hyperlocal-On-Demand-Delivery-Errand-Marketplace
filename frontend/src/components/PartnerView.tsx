'use client';

import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import {
  Bike,
  Power,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Star,
  Navigation,
  RefreshCw,
  Wallet,
  Receipt,
} from 'lucide-react';
import { PartnerWorkflowModal } from './PartnerWorkflowModal';

interface PartnerViewProps {
  onSelectOrderToTrack?: (orderId: string) => void;
}

export const PartnerView: React.FC<PartnerViewProps> = ({ onSelectOrderToTrack }) => {
  const { user, refreshUser } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(user?.isAvailable || false);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activePartnerOrders, setActivePartnerOrders] = useState<Order[]>([]);
  const [earningsStats, setEarningsStats] = useState<any>(null);
  const [selectedWorkflowOrder, setSelectedWorkflowOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPartnerData = async () => {
    try {
      const [availRes, myOrdersRes, earnRes] = await Promise.all([
        apiRequest<{ orders: Order[] }>('/partner/available-orders'),
        apiRequest<{ orders: Order[] }>('/orders'),
        apiRequest<{ stats: any; recentTransactions: any[] }>('/partner/earnings'),
      ]);

      setAvailableOrders(availRes.orders || []);
      // Filter out delivered or cancelled orders to get active ones
      const active = (myOrdersRes.orders || []).filter(
        (o) => o.partnerId === user?.id && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
      );
      setActivePartnerOrders(active);
      setEarningsStats(earnRes.stats || null);
    } catch (err) {
      console.error('Failed to load partner data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerData();

    const socket = getSocket();
    const handleNewOrder = () => {
      fetchPartnerData();
    };
    const handleOrderUpdate = () => {
      fetchPartnerData();
    };

    socket.on('new_order_available', handleNewOrder);
    socket.on('global_order_update', handleOrderUpdate);

    return () => {
      socket.off('new_order_available', handleNewOrder);
      socket.off('global_order_update', handleOrderUpdate);
    };
  }, [user]);

  const handleToggleOnline = async () => {
    try {
      const res = await apiRequest<{ isAvailable: boolean }>('/partner/toggle-availability', {
        method: 'PATCH',
      });
      setIsOnline(res.isAvailable);
      refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const res = await apiRequest<{ order: Order }>(`/orders/${orderId}/accept`, {
        method: 'PATCH',
      });
      setSelectedWorkflowOrder(res.order);
      fetchPartnerData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept order');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 md:pb-8">
      {/* Partner Header & Availability Switch */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src={user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=rider'}
            alt="Rider"
            className="w-14 h-14 rounded-2xl object-cover bg-neutral-100 border border-neutral-200"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-neutral-900">{user?.name}</h2>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                {user?.rating || 4.9} ({user?.totalRatings || 140}+ jobs)
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Vehicle: <strong className="text-neutral-800">{user?.vehicleType || 'Motorcycle'}</strong> · Verified Partner
            </p>
          </div>
        </div>

        {/* Online / Offline Toggle */}
        <div className="flex items-center gap-3 bg-[#FAF7F2] p-2 rounded-2xl border border-[#E8E1D7] w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2 px-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-neutral-300'
              }`}
            />
            <span className="text-xs font-bold text-neutral-800">
              {isOnline ? 'Online (Ready for Jobs)' : 'Offline (Resting)'}
            </span>
          </div>

          <button
            onClick={handleToggleOnline}
            className={`py-2 px-4 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
              isOnline
                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isOnline ? 'Go Offline' : 'Go Online'}</span>
          </button>
        </div>
      </div>

      {/* Rider Earnings & Financial Ledger Overview */}
      {earningsStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Today's Earnings
            </span>
            <span className="text-2xl font-black text-emerald-700 block mt-1">
              ₹{earningsStats.todayEarnings}
            </span>
            <span className="text-[10px] text-neutral-500">Excludes product costs</span>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Wallet Balance
            </span>
            <span className="text-2xl font-black text-neutral-900 block mt-1">
              ₹{earningsStats.walletBalance}
            </span>
            <span className="text-[10px] text-neutral-500">Available for payout</span>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              COD Cash in Hand
            </span>
            <span className="text-2xl font-black text-amber-700 block mt-1">
              ₹{earningsStats.codCashInHand}
            </span>
            <span className="text-[10px] text-neutral-500">To settle with platform</span>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Deliveries Completed
            </span>
            <span className="text-2xl font-black text-brand-700 block mt-1">
              {earningsStats.completedDeliveries} Trips
            </span>
            <span className="text-[10px] text-neutral-500">100% On-time guarantee</span>
          </div>
        </div>
      )}

      {/* ACTIVE ORDERS / CURRENT TRIPS */}
      {activePartnerOrders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider">
            Active Deliveries in Progress ({activePartnerOrders.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePartnerOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 rounded-3xl bg-white border-2 border-brand-500/40 shadow-md space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-900 text-xs font-extrabold uppercase tracking-wider">
                    {ord.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700">
                    Payout: ₹{ord.partnerEarnings}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-neutral-400 uppercase text-[10px] w-14 shrink-0">
                      Store:
                    </span>
                    <span className="text-neutral-800 font-semibold">{ord.pickupAddress}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-neutral-400 uppercase text-[10px] w-14 shrink-0">
                      Customer:
                    </span>
                    <span className="text-neutral-800 font-semibold">{ord.deliveryAddress}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-neutral-400 uppercase text-[10px] w-14 shrink-0">
                      Items:
                    </span>
                    <span className="text-neutral-800">{ord.items.length} items</span>
                  </div>
                </div>

                {/* Status Notice */}
                {ord.priceApprovalStatus === 'PENDING' && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Customer reviewing your updated mandi prices. Awaiting approval.</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedWorkflowOrder(ord)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Bike className="w-4 h-4" />
                    <span>Open Rider Console</span>
                  </button>

                  {onSelectOrderToTrack && (
                    <button
                      onClick={() => onSelectOrderToTrack(ord.id)}
                      className="px-3 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
                      title="View Map Tracking"
                    >
                      <Navigation className="w-4 h-4 text-brand-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AVAILABLE ORDERS RADAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider">
              Nearby Delivery Requests Radar
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <button
            onClick={fetchPartnerData}
            className="text-xs text-brand-600 font-bold flex items-center gap-1 hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Radar
          </button>
        </div>

        {!isOnline ? (
          <div className="p-8 rounded-3xl bg-neutral-100 border border-neutral-200 text-center space-y-2">
            <Power className="w-8 h-8 text-neutral-400 mx-auto" />
            <h4 className="text-sm font-bold text-neutral-700">You are currently Offline</h4>
            <p className="text-xs text-neutral-500">
              Toggle your availability switch to Online above to receive live broadcast order requests.
            </p>
          </div>
        ) : availableOrders.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-[#E8E1D7] text-center space-y-2">
            <Bike className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-sm font-bold text-neutral-800">Scanning for Nearby Tasks...</h4>
            <p className="text-xs text-neutral-500">
              New orders appear here automatically via Socket.IO.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 rounded-3xl bg-white border border-[#E8E1D7] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black text-[10px] uppercase tracking-wider">
                      {ord.serviceType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-black text-emerald-700">
                      Earn: ₹{ord.partnerEarnings}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900">
                    Order #{ord.orderNumber}
                  </h4>

                  <div className="space-y-1.5 text-xs text-neutral-600">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="truncate">Pickup: {ord.pickupAddress}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                      <span className="truncate">Deliver: {ord.deliveryAddress}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-neutral-50 text-[11px] text-neutral-500 flex justify-between">
                    <span>{ord.items.length} items</span>
                    <span>Est. Order: ₹{ord.totalAmount}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleAcceptOrder(ord.id)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Delivery (Earn ₹{ord.partnerEarnings})</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Partner Workflow Console Modal */}
      <PartnerWorkflowModal
        order={selectedWorkflowOrder}
        isOpen={!!selectedWorkflowOrder}
        onClose={() => setSelectedWorkflowOrder(null)}
        onWorkflowComplete={() => {
          fetchPartnerData();
        }}
      />
    </div>
  );
};
