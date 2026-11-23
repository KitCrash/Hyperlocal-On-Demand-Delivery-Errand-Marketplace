'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderItem } from '../types';
import { apiRequest } from '../lib/api';
import { getSocket } from '../lib/socket';
import {
  Bike,
  Store,
  MapPin,
  CheckCircle2,
  DollarSign,
  Camera,
  Upload,
  AlertTriangle,
  Clock,
  KeyRound,
  X,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface PartnerWorkflowModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onWorkflowComplete: () => void;
}

export const PartnerWorkflowModal: React.FC<PartnerWorkflowModalProps> = ({
  order,
  isOpen,
  onClose,
  onWorkflowComplete,
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(order);
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});
  const [priceChangeReason, setPriceChangeReason] = useState('');
  const [purchaseProofUrl, setPurchaseProofUrl] = useState(
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600'
  );
  const [purchaseProofNote, setPurchaseProofNote] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setCurrentOrder(order);
    if (order) {
      const initialPrices: Record<string, number> = {};
      order.items.forEach((item) => {
        initialPrices[item.id || item.name] = item.actualPrice || item.estimatedPrice || 0;
      });
      setItemPrices(initialPrices);
    }
  }, [order]);

  // Listen for socket events (like customer price approved)
  useEffect(() => {
    if (!order) return;
    const socket = getSocket();

    const handlePriceApproved = () => {
      refreshOrder();
    };

    socket.on('price_approved', handlePriceApproved);
    socket.on('price_rejected', handlePriceApproved);

    return () => {
      socket.off('price_approved', handlePriceApproved);
      socket.off('price_rejected', handlePriceApproved);
    };
  }, [order?.id]);

  const refreshOrder = async () => {
    if (!order) return;
    try {
      const data = await apiRequest<{ order: Order }>(`/orders/${order.id}`);
      setCurrentOrder(data.order);
      onWorkflowComplete();
    } catch (err) {}
  };

  if (!isOpen || !currentOrder) return null;

  // Step actions
  const handleStartShopping = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest(`/orders/${currentOrder.id}/start-shopping`, { method: 'PATCH' });
      await refreshOrder();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitMarketPrices = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const formattedPrices = currentOrder.items.map((item) => ({
        itemId: item.id,
        actualPrice: itemPrices[item.id || item.name] || item.estimatedPrice,
      }));

      await apiRequest(`/orders/${currentOrder.id}/update-prices`, {
        method: 'PATCH',
        body: JSON.stringify({
          itemPrices: formattedPrices,
          priceChangeReason,
          purchaseProofUrl,
          purchaseProofNote: purchaseProofNote || 'Vendor receipt attached',
        }),
      });

      await refreshOrder();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPurchased = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await apiRequest(`/orders/${currentOrder.id}/mark-purchased`, {
        method: 'PATCH',
        body: JSON.stringify({ purchaseProofUrl }),
      });
      await refreshOrder();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOutForDelivery = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest(`/orders/${currentOrder.id}/out-for-delivery`, { method: 'PATCH' });
      await refreshOrder();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!otpInput.trim()) {
      setErrorMessage('Please enter the 4-digit Delivery OTP provided by customer');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await apiRequest(`/orders/${currentOrder.id}/complete-delivery`, {
        method: 'PATCH',
        body: JSON.stringify({ deliveryOtp: otpInput.trim() }),
      });
      await refreshOrder();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedTotal = Object.values(itemPrices).reduce((a, b) => a + Number(b || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Bike className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">Delivery Partner Console</h3>
                <span className="bg-emerald-400 text-neutral-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Order #{currentOrder.orderNumber}
                </span>
              </div>
              <p className="text-xs text-white/90">
                Earnings: <strong className="text-white">₹{currentOrder.partnerEarnings}</strong> + Delivery Base
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Workflow Status Tracker */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-600">Current Phase:</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold uppercase text-[10px]">
              {currentOrder.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* PHASE 1: ACCEPTED -> START SHOPPING */}
          {currentOrder.status === 'ACCEPTED' && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Store className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-neutral-900">Arrived at Mandi or Store?</h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Pickup Location: <strong className="text-neutral-800">{currentOrder.pickupAddress}</strong>
                </p>
              </div>
              <button
                onClick={handleStartShopping}
                disabled={isSubmitting}
                className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                {isSubmitting ? 'Updating...' : 'I Have Arrived & Begun Shopping'}
              </button>
            </div>
          )}

          {/* PHASE 2: SHOPPING -> ENTER ACTUAL MANDI PRICES & UPLOAD BILL */}
          {currentOrder.status === 'SHOPPING' && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-snug">
                🌾 <strong>Dynamic Market Pricing Entry:</strong> Check actual prices with the stall vendor. Enter the actual price for each item. These will be sent to the customer for approval.
              </div>

              {/* Items Price Entry Table */}
              <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                <div className="bg-neutral-100 px-3 py-2 text-[11px] font-bold text-neutral-700 flex justify-between">
                  <span>Product & Quantity</span>
                  <span>Actual Market Price (₹)</span>
                </div>
                <div className="divide-y divide-neutral-100 p-2 space-y-2">
                  {currentOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-xs p-1"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-neutral-900 block truncate">{item.name}</span>
                        <span className="text-[11px] text-neutral-500">
                          Qty: {item.quantity} {item.unit} · (Est was ₹{item.estimatedPrice})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-500">₹</span>
                        <input
                          type="number"
                          value={itemPrices[item.id || item.name] || ''}
                          onChange={(e) =>
                            setItemPrices({
                              ...itemPrices,
                              [item.id || item.name]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-24 px-2 py-1.5 rounded-lg border border-neutral-300 font-bold text-xs focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-neutral-50 px-3 py-2 border-t border-neutral-200 flex justify-between text-xs font-extrabold text-neutral-900">
                  <span>Updated Product Total:</span>
                  <span className="text-emerald-700">₹{calculatedTotal}</span>
                </div>
              </div>

              {/* Reason for price change */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700 block">
                  Market Condition / Price Note (sent to Customer):
                </label>
                <input
                  type="text"
                  value={priceChangeReason}
                  onChange={(e) => setPriceChangeReason(e.target.value)}
                  placeholder="e.g. Fresh Nashik arrival rate changed / vendor rate sheet verified"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs"
                />
              </div>

              {/* Bill photo / proof */}
              <div className="p-3 rounded-2xl border border-neutral-200 bg-neutral-50 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    Upload Mandi Slip / Bill Photo
                  </span>
                  <span className="text-[10px] text-emerald-600">Sample Attached</span>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={purchaseProofUrl}
                    alt="Proof Preview"
                    className="w-16 h-16 rounded-xl object-cover border"
                  />
                  <div className="flex-1 text-[11px] text-neutral-500">
                    Proof photo ensures customer trust and protects against price disputes.
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmitMarketPrices}
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                <span>Submit Prices to Customer for Approval</span>
              </button>
            </div>
          )}

          {/* PHASE 3: PRICE APPROVAL PENDING */}
          {currentOrder.status === 'PRICE_APPROVAL_PENDING' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-neutral-900">
                Awaiting Customer Price Approval
              </h4>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Customer has been notified of the revised total (₹{currentOrder.actualProductTotal}). As soon as they tap "Approve", this screen will update automatically.
              </p>
              <button
                onClick={refreshOrder}
                className="py-2 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center gap-1.5 mx-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Check Status
              </button>
            </div>
          )}

          {/* PHASE 4: PRICE APPROVED -> MARK PURCHASED */}
          {currentOrder.status === 'PRICE_APPROVED' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-emerald-950">
                  Customer Approved Market Prices!
                </h4>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  You can now purchase the items at the vendor counter and pack the order.
                </p>
              </div>
              <button
                onClick={handleMarkPurchased}
                disabled={isSubmitting}
                className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md"
              >
                Items Purchased & Packed
              </button>
            </div>
          )}

          {/* PHASE 5: PURCHASED -> START DELIVERY NAVIGATION */}
          {currentOrder.status === 'PURCHASED' && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
                <Bike className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-neutral-900">Ready to Deliver</h4>
                <p className="text-xs text-neutral-500 mt-1">
                  Destination: <strong className="text-neutral-800">{currentOrder.deliveryAddress}</strong>
                </p>
              </div>
              <button
                onClick={handleOutForDelivery}
                disabled={isSubmitting}
                className="py-3 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md"
              >
                Start Out for Delivery
              </button>
            </div>
          )}

          {/* PHASE 6: OUT FOR DELIVERY -> COMPLETE WITH OTP */}
          {currentOrder.status === 'OUT_FOR_DELIVERY' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Delivery Destination
                </span>
                <p className="text-xs font-bold text-neutral-900">{currentOrder.deliveryAddress}</p>
                <p className="text-[11px] text-neutral-500">{currentOrder.deliveryNotes || 'Call customer on gate arrival'}</p>
              </div>

              {/* COD alert if applicable */}
              {currentOrder.paymentMethod === 'COD' && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                  <span className="font-bold">Cash to Collect (COD):</span>
                  <span className="text-base font-extrabold">₹{currentOrder.totalAmount}</span>
                </div>
              )}

              {/* OTP Input */}
              <div className="p-4 rounded-2xl bg-white border border-neutral-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-neutral-900">
                    Enter Customer 4-Digit Delivery OTP
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Ask customer for the OTP displayed on their live tracking screen
                  </p>
                </div>

                <input
                  type="text"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  placeholder="e.g. 4829"
                  className="w-36 mx-auto text-center tracking-widest text-xl font-black py-2 rounded-xl border-2 border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <button
                onClick={handleCompleteDelivery}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify OTP & Mark Order Delivered</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
