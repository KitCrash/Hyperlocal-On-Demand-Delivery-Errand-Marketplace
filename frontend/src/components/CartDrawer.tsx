'use client';

import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { ServiceType, PaymentMethod } from '../types';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Clock,
  ShieldCheck,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Bike,
  Sparkles,
  ArrowRight,
  Package,
  Store,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (orderId: string) => void;
  onOpenAiAssistant: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  onOpenAiAssistant,
}) => {
  const { user } = useAuth();
  const {
    items,
    updateItem,
    removeItem,
    clearCart,
    serviceType,
    setServiceType,
    pickupAddress,
    setPickupAddress,
    pickupNotes,
    setPickupNotes,
    deliveryAddress,
    setDeliveryAddress,
    deliveryNotes,
    setDeliveryNotes,
    errandInstructions,
    setErrandInstructions,
    totalEstimatedCost,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [tipAmount, setTipAmount] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const deliveryFee = serviceType === 'PARCEL_PICKUP_DROP' ? 50 : serviceType === 'CUSTOM_ERRAND' ? 60 : 35;
  const finalTotal = totalEstimatedCost + deliveryFee + tipAmount;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      setErrorMessage('Please enter a delivery address');
      return;
    }
    if (items.length === 0 && !errandInstructions.trim()) {
      setErrorMessage('Please add at least one item or describe your errand request');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await apiRequest<{ order: any }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          serviceType,
          pickupAddress: pickupAddress || 'Local Market Mandi Stall',
          pickupNotes,
          deliveryAddress,
          deliveryNotes,
          errandInstructions,
          paymentMethod,
          tipAmount,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            inputMethod: i.inputMethod,
            estimatedPrice: i.estimatedPrice,
            confidenceScore: i.confidenceScore || 1.0,
            uncertaintyFlag: i.uncertaintyFlag,
          })),
        }),
      });

      clearCart();
      onClose();
      onOrderCreated(res.order.id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] shadow-2xl border-l border-[#EBE4DC] flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-white border-b border-[#E8E1D7] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-neutral-900">
                  Your Errand & Cart
                </h3>
                <span className="text-[11px] text-neutral-500">
                  {items.length} items selected
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {errorMessage}
              </div>
            )}

            {/* Service Type Switcher */}
            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                Service Category
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                {[
                  { id: 'GROCERY_SHOPPING', label: '🥦 Mandi / Grocery' },
                  { id: 'SHOP_TO_HOME', label: '🏪 Shop-to-Home' },
                  { id: 'PARCEL_PICKUP_DROP', label: '📦 Parcel Drop' },
                  { id: 'CUSTOM_ERRAND', label: '⚡ Custom Errand' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setServiceType(s.id as ServiceType)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      serviceType === s.id
                        ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm font-bold'
                        : 'border-[#E8E1D7] bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Items List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  Shopping Items
                </span>
                <button
                  onClick={onOpenAiAssistant}
                  className="text-xs text-brand-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Add via Voice / OCR
                </button>
              </div>

              {items.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white border border-[#E8E1D7] text-center space-y-2">
                  <p className="text-xs text-neutral-500">Your shopping list is empty.</p>
                  <button
                    onClick={onOpenAiAssistant}
                    className="py-2 px-4 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-sm"
                  >
                    Use AI Voice / OCR Assistant
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-white border border-[#E8E1D7] flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-neutral-900 truncate">
                            {item.name}
                          </span>
                          <span className="text-[9px] bg-neutral-100 text-neutral-600 font-semibold px-1.5 py-0.5 rounded">
                            {item.inputMethod}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 block mt-0.5">
                          Est: ₹{item.estimatedPrice} ({item.unit})
                        </span>
                      </div>

                      {/* Quantity selector */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-neutral-200 rounded-lg overflow-hidden bg-neutral-50">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                updateItem(idx, {
                                  ...item,
                                  quantity: item.quantity - 1,
                                  estimatedPrice: Math.round(
                                    ((item.estimatedPrice / item.quantity) * (item.quantity - 1)) * 10
                                  ) / 10,
                                });
                              } else {
                                removeItem(idx);
                              }
                            }}
                            className="p-1 hover:bg-neutral-200 text-neutral-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-neutral-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              updateItem(idx, {
                                ...item,
                                quantity: item.quantity + 1,
                                estimatedPrice: Math.round(
                                  ((item.estimatedPrice / item.quantity) * (item.quantity + 1)) * 10
                                ) / 10,
                              });
                            }}
                            className="p-1 hover:bg-neutral-200 text-neutral-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(idx)}
                          className="p-1 text-neutral-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Errand Details */}
            {(serviceType === 'CUSTOM_ERRAND' || serviceType === 'PARCEL_PICKUP_DROP') && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Specific Instructions / Parcel Details:
                </label>
                <textarea
                  value={errandInstructions}
                  onChange={(e) => setErrandInstructions(e.target.value)}
                  placeholder="e.g. Collect package from Gate 2, fragile medicine strip, pay electricity counter..."
                  className="w-full p-2.5 rounded-xl bg-white border border-[#E8E1D7] text-xs focus:ring-1 focus:ring-brand-500"
                  rows={2}
                />
              </div>
            )}

            {/* Address Details */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Pickup & Drop Route
              </span>

              <div className="p-3 rounded-2xl bg-white border border-[#E8E1D7] space-y-2">
                <div className="flex items-start gap-2 text-xs">
                  <Store className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-neutral-400 block uppercase">
                      Pickup Store / Mandi
                    </label>
                    <input
                      type="text"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className="w-full font-semibold text-neutral-800 bg-transparent border-b border-neutral-200 py-0.5 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs pt-1">
                  <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-neutral-400 block uppercase">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full font-semibold text-neutral-800 bg-transparent border-b border-neutral-200 py-0.5 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rider Tip */}
            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Rider Tip (100% to Delivery Partner)
              </span>
              <div className="flex gap-2">
                {[0, 10, 20, 30].map((tip) => (
                  <button
                    key={tip}
                    onClick={() => setTipAmount(tip)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      tipAmount === tip
                        ? 'border-brand-600 bg-brand-50 text-brand-900'
                        : 'border-[#E8E1D7] bg-white text-neutral-600'
                    }`}
                  >
                    {tip === 0 ? 'None' : `+₹${tip}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                Payment Option
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                <button
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                    paymentMethod === 'COD'
                      ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold'
                      : 'border-neutral-200 bg-white text-neutral-600'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cash</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('UPI_ONLINE')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                    paymentMethod === 'UPI_ONLINE'
                      ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold'
                      : 'border-neutral-200 bg-white text-neutral-600'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cards/UPI</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('DIRECT_UPI')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                    paymentMethod === 'DIRECT_UPI'
                      ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold'
                      : 'border-neutral-200 bg-white text-neutral-600'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>UPI QR</span>
                </button>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D7] space-y-1.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Estimated Products:</span>
                <span>₹{totalEstimatedCost}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Delivery Charge:</span>
                <span>₹{deliveryFee}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between text-neutral-600">
                  <span>Rider Tip:</span>
                  <span>₹{tipAmount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-neutral-100 flex justify-between font-extrabold text-sm text-neutral-900">
                <span>To Pay (Estimated):</span>
                <span className="text-brand-700">₹{finalTotal}</span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                * Dynamic pricing: If mandi produce price changes, partner will request your approval before purchasing.
              </p>
            </div>
          </div>

          {/* Place Order CTA */}
          <div className="p-4 sm:p-5 border-t border-[#E8E1D7] bg-white">
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Bike className="w-4 h-4" />
              <span>{isSubmitting ? 'Dispatching...' : `Hire Rider & Place Order (₹${finalTotal})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
