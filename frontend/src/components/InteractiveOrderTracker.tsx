'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus } from '../types';
import { getSocket } from '../lib/socket';
import {
  Bike,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Navigation,
  ChevronRight,
  Package,
  Store,
  DollarSign,
  Star,
  ExternalLink,
} from 'lucide-react';
import { DynamicPriceModal } from './DynamicPriceModal';
import { apiRequest } from '../lib/api';

interface InteractiveOrderTrackerProps {
  orderId: string;
  onRefreshOrders?: () => void;
  onRateOrder?: (order: Order) => void;
}

export const InteractiveOrderTracker: React.FC<InteractiveOrderTrackerProps> = ({
  orderId,
  onRefreshOrders,
  onRateOrder,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [partnerPos, setPartnerPos] = useState<{ lat: number; lng: number }>({
    lat: 22.5760,
    lng: 88.3685,
  });
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      sender: 'Partner',
      senderName: 'Rahul Sharma',
      text: 'Hello! I am heading to the mandi stall right now.',
      time: 'Just now',
    },
  ]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Fetch order details
  const fetchOrder = async () => {
    try {
      const data = await apiRequest<{ order: Order }>(`/orders/${orderId}`);
      setOrder(data.order);
      if (data.order.partner?.currentLat && data.order.partner?.currentLng) {
        setPartnerPos({
          lat: data.order.partner.currentLat,
          lng: data.order.partner.currentLng,
        });
      }
    } catch (err) {
      console.error('Failed to fetch order', err);
    }
  };

  useEffect(() => {
    fetchOrder();

    const socket = getSocket();
    socket.emit('join_order', orderId);

    const handleStatusChanged = (data: any) => {
      fetchOrder();
      if (onRefreshOrders) onRefreshOrders();
    };

    const handlePriceRequired = () => {
      fetchOrder();
      setShowPriceModal(true);
    };

    const handleLocationUpdated = (loc: any) => {
      if (loc.lat && loc.lng) {
        setPartnerPos({ lat: loc.lat, lng: loc.lng });
      }
    };

    const handleReceiveChat = (msg: any) => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: msg.role === 'PARTNER' ? 'Partner' : 'Customer',
          senderName: msg.senderName,
          text: msg.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    };

    socket.on('order_status_changed', handleStatusChanged);
    socket.on('price_approval_required', handlePriceRequired);
    socket.on('price_approved', handleStatusChanged);
    socket.on('partner_location_updated', handleLocationUpdated);
    socket.on('receive_order_chat', handleReceiveChat);

    return () => {
      socket.off('order_status_changed', handleStatusChanged);
      socket.off('price_approval_required', handlePriceRequired);
      socket.off('price_approved', handleStatusChanged);
      socket.off('partner_location_updated', handleLocationUpdated);
      socket.off('receive_order_chat', handleReceiveChat);
      socket.emit('leave_order', orderId);
    };
  }, [orderId]);

  // Simulate rider live movement along route every 5 seconds if OUT_FOR_DELIVERY
  useEffect(() => {
    if (!order || order.status !== 'OUT_FOR_DELIVERY') return;

    const interval = setInterval(() => {
      setPartnerPos((prev) => {
        const destLat = order.deliveryLat || 22.5726;
        const destLng = order.deliveryLng || 88.3639;
        const step = 0.0003;
        const dLat = (destLat - prev.lat) * 0.15;
        const dLng = (destLng - prev.lng) * 0.15;
        return {
          lat: prev.lat + dLat,
          lng: prev.lng + dLng,
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [order?.status]);

  const handleSendChat = () => {
    if (!newChatMessage.trim() || !order) return;
    const socket = getSocket();
    socket.emit('send_order_chat', {
      orderId: order.id,
      senderId: order.customerId,
      senderName: order.customer?.name || 'Customer',
      text: newChatMessage.trim(),
      role: 'CUSTOMER',
    });
    setNewChatMessage('');
  };

  if (!order) {
    return (
      <div className="p-8 text-center text-xs text-neutral-500 bg-white rounded-3xl border border-neutral-200">
        Loading live tracking details...
      </div>
    );
  }

  const steps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: 'PENDING', label: 'Order Placed', desc: 'Matching nearby delivery partner' },
    { key: 'ACCEPTED', label: 'Partner Assigned', desc: 'Rider en route to store' },
    { key: 'SHOPPING', label: 'Shopping / Mandi', desc: 'Selecting fresh produce at stall' },
    { key: 'PRICE_APPROVAL_PENDING', label: 'Price Approval', desc: 'Confirm actual mandi rates' },
    { key: 'PURCHASED', label: 'Items Packed', desc: 'Billed and packed for delivery' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Rider is on the way to you' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Order completed safely' },
  ];

  const getStepIndex = (st: string) => {
    if (st === 'PRICE_APPROVED') return 4;
    const idx = steps.findIndex((s) => s.key === st);
    return idx >= 0 ? idx : 0;
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="space-y-4">
      {/* Dynamic Price Approval Alert Banner if pending */}
      {order.priceApprovalStatus === 'PENDING' && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-100 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold">Price Approval Needed from Mandi</h4>
              <p className="text-xs text-white/90">
                Partner entered actual market rates: ₹{order.actualProductTotal} (Estimated was ₹{order.estimatedProductTotal}).
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPriceModal(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-neutral-900 text-xs font-black hover:bg-neutral-100 shadow-sm transition-all"
          >
            Review & Approve Prices
          </button>
        </div>
      )}

      {/* Main Tracking Card & Interactive Map */}
      <div className="bg-white rounded-3xl border border-[#E8E1D7] overflow-hidden shadow-sm">
        {/* Map Header */}
        <div className="p-4 bg-[#FAF7F2] border-b border-[#E8E1D7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-extrabold text-neutral-900">
              Live Hyperlocal GPS Radar
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold text-neutral-600">
              Socket Realtime Stream
            </span>
          </div>
        </div>

        {/* Simulated High-Res Interactive Map View */}
        <div className="relative h-64 sm:h-72 bg-[#E5E3DF] overflow-hidden flex items-center justify-center">
          {/* Map Grid Pattern background */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(#9ca3af 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Simulated Street lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Street road */}
            <path
              d="M 40,240 Q 200,180 340,160 T 580,70"
              fill="none"
              stroke="#D4CECA"
              strokeWidth="24"
              strokeLinecap="round"
            />
            {/* Dashed center line */}
            <path
              d="M 40,240 Q 200,180 340,160 T 580,70"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3"
              strokeDasharray="8,8"
              strokeLinecap="round"
            />
            {/* Active delivery route polyline */}
            <path
              d="M 120,200 Q 220,160 360,140 T 520,80"
              fill="none"
              stroke="#d97b48"
              strokeWidth="5"
              strokeDasharray="6,6"
            />
          </svg>

          {/* Store / Pickup Marker */}
          <div
            className="absolute left-[18%] bottom-[22%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            title={order.pickupAddress}
          >
            <div className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-md mb-1 whitespace-nowrap">
              Mandi / Store
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
              <Store className="w-4 h-4" />
            </div>
          </div>

          {/* Delivery Destination Marker */}
          <div
            className="absolute right-[16%] top-[20%] translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            title={order.deliveryAddress}
          >
            <div className="px-2 py-0.5 rounded-full bg-neutral-900 text-white text-[9px] font-bold shadow-md mb-1 whitespace-nowrap">
              Your Home
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg border-2 border-white">
              <MapPin className="w-4 h-4" />
            </div>
          </div>

          {/* Delivery Partner Live Marker (moving / animated pulse) */}
          <div
            className="absolute left-[45%] top-[45%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20"
          >
            <div className="px-2.5 py-0.5 rounded-full bg-brand-600 text-white text-[9px] font-extrabold shadow-md mb-1 flex items-center gap-1">
              <span>{order.partner?.name?.split(' ')[0] || 'Rahul'}</span>
              <span className="text-[8px] bg-white/20 px-1 rounded">Rider</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-md border-2 border-white">
              <Bike className="w-5 h-5" />
            </div>
          </div>

          {/* Live ETA Card overlay */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-neutral-200 z-20 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-brand-600" />
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">
                Estimated Arrival
              </span>
              <span className="text-xs font-black text-neutral-900">
                {order.status === 'DELIVERED'
                  ? 'Delivered Successfully'
                  : order.status === 'OUT_FOR_DELIVERY'
                  ? '12 - 18 Mins'
                  : order.status === 'SHOPPING'
                  ? 'Shopping at Stall (~25 Mins)'
                  : 'Assigning / Pickup'}
              </span>
            </div>
          </div>

          {/* Delivery OTP overlay */}
          {order.deliveryOtp && order.status !== 'DELIVERED' && (
            <div className="absolute top-3 right-3 bg-neutral-900/90 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-neutral-700 z-20">
              <span className="text-[9px] text-neutral-400 block font-semibold uppercase tracking-wider">
                Delivery OTP
              </span>
              <span className="text-sm font-black tracking-widest text-brand-400">
                {order.deliveryOtp}
              </span>
            </div>
          )}
        </div>

        {/* Order Details & Partner Card */}
        <div className="p-4 sm:p-5 space-y-5">
          {/* Partner Info & Call/Chat */}
          {order.partner && (
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={order.partner.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=partner'}
                  alt="Partner"
                  className="w-12 h-12 rounded-2xl object-cover bg-white border border-neutral-200"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900">
                      {order.partner.name}
                    </h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                      {order.partner.rating || 4.9}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    {order.partner.vehicleType || 'Motorcycle'} · Verified Delivery Partner
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${order.partner.phone}`}
                  className="p-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors"
                  title="Call Partner"
                >
                  <Phone className="w-4 h-4 text-brand-600" />
                </a>

                <button
                  onClick={() => setShowChat(!showChat)}
                  className="p-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors flex items-center gap-1.5 text-xs font-bold"
                  title="Chat with Partner"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Chat Drawer */}
          {showChat && (
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D7] space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
                <span className="text-xs font-bold text-neutral-800">
                  Live Chat with Partner
                </span>
                <span className="text-[10px] text-neutral-400">Encrypted in-app</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.sender === 'Customer' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-1.5 rounded-2xl text-xs ${
                        msg.sender === 'Customer'
                          ? 'bg-brand-500 text-white rounded-br-none'
                          : 'bg-white text-neutral-800 border border-neutral-200 rounded-bl-none'
                      }`}
                    >
                      <p>{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-neutral-400 mt-0.5 px-1">{msg.time}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Type a message to rider..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  onClick={handleSendChat}
                  className="p-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Progression Timeline Steps */}
          <div>
            <h5 className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider mb-3">
              Order Workflow Status
            </h5>
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
              {steps.map((st, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={st.key} className="relative flex items-start gap-3">
                    <span
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-brand-500 border-white text-white ring-4 ring-brand-200'
                          : 'bg-white border-neutral-300 text-neutral-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                    </span>
                    <div>
                      <span
                        className={`text-xs font-bold block ${
                          isCurrent
                            ? 'text-brand-700'
                            : isCompleted
                            ? 'text-neutral-900'
                            : 'text-neutral-400'
                        }`}
                      >
                        {st.label}
                      </span>
                      <span className="text-[11px] text-neutral-500">{st.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rate Order Trigger if Delivered */}
          {order.status === 'DELIVERED' && onRateOrder && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
              <h5 className="text-xs font-bold text-amber-950">How was your delivery partner?</h5>
              <p className="text-[11px] text-amber-800">
                Your feedback ensures transparent service and rewards top partners.
              </p>
              <button
                onClick={() => onRateOrder(order)}
                className="py-2 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
              >
                Rate & Leave Review
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Price Approval Modal */}
      <DynamicPriceModal
        order={order}
        isOpen={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        onPriceActionComplete={() => {
          fetchOrder();
          if (onRefreshOrders) onRefreshOrders();
        }}
      />
    </div>
  );
};
