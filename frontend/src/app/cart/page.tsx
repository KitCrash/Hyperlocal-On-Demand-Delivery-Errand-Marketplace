'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { ServiceType, PaymentMethod } from '../../types';
import { AIHybridOrderAssistant } from '../../components/AIHybridOrderAssistant';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  QrCode,
  Banknote,
  Bike,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Store,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
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
    combineAndDeduplicate,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [tipAmount, setTipAmount] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiAssistantMode, setAiAssistantMode] = useState<'voice' | 'image' | 'manual' | 'combined'>('voice');
  const [isCombining, setIsCombining] = useState(false);
  const [combineFeedback, setCombineFeedback] = useState<string | null>(null);

  const deliveryFee =
    serviceType === 'PARCEL_PICKUP_DROP' ? 50 : serviceType === 'CUSTOM_ERRAND' ? 60 : 35;
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
      // Navigate to homepage with tracking view active
      router.push(`/?tab=orders&orderId=${res.order.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCombineDuplicates = async () => {
    try {
      setIsCombining(true);
      const res = await combineAndDeduplicate();
      setCombineFeedback(
        `Merged ${res.mergedCount} duplicate item(s) across Voice, OCR, and Manual lists.`
      );
      setTimeout(() => setCombineFeedback(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to deduplicate items');
    } finally {
      setIsCombining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between pb-28">
      {/* 1. App Bar Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E8E1D7] px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors focus:outline-none"
              aria-label="Go Back"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                  Your Errand & Cart
                </h1>
                <span className="text-[11px] text-neutral-500 font-medium block">
                  {items.length} {items.length === 1 ? 'item' : 'items'} selected
                </span>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-xs font-bold flex items-center gap-1"
              title="Clear all items"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Scrollable Content */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-4 space-y-4">
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {combineFeedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{combineFeedback}</span>
          </div>
        )}

        {/* =========================================================================
            SECTION 1: SHOPPING ITEMS
            ========================================================================= */}
        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Shopping Items
            </span>
          </div>

          {items.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D7] text-center space-y-3">
              <p className="text-xs text-neutral-500">Your shopping list is empty.</p>
              <button
                onClick={() => router.push('/')}
                className="py-2.5 px-5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/20 active:scale-95 transition-all"
              >
                Browse Services
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, idx) => {
                const isPerishable =
                  serviceType === 'GROCERY_SHOPPING' ||
                  /veg|fruit|onion|tomato|potato|mango|apple|banana|mandi|fresh|greens|spinach|coriander/i.test(
                    `${item.name} ${item.category || ''}`
                  );
                return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-neutral-50 border border-[#E8E1D7] flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                        {item.name}
                      </span>
                      <span className="text-[9px] bg-white border border-neutral-200 text-neutral-600 font-semibold px-1.5 py-0.5 rounded">
                        {item.inputMethod}
                      </span>
                      {item.uncertaintyFlag && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                          Verify
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      Est: ₹{item.estimatedPrice} ({item.unit})
                    </span>
                    {isPerishable && (
                      <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 font-semibold px-1.5 py-0.5 rounded inline-block mt-1">
                        Non-refundable & Non-returnable (Local Market)
                      </span>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      <button
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateItem(idx, {
                              ...item,
                              quantity: item.quantity - 1,
                              estimatedPrice:
                                Math.round(
                                  ((item.estimatedPrice / item.quantity) * (item.quantity - 1)) * 10
                                ) / 10,
                            });
                          } else {
                            removeItem(idx);
                          }
                        }}
                        className="p-1.5 hover:bg-neutral-100 text-neutral-600 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-black text-neutral-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          updateItem(idx, {
                            ...item,
                            quantity: item.quantity + 1,
                            estimatedPrice:
                              Math.round(
                                ((item.estimatedPrice / item.quantity) * (item.quantity + 1)) * 10
                              ) / 10,
                          });
                        }}
                        className="p-1.5 hover:bg-neutral-100 text-neutral-600 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(idx)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                );
              })}

              {/* Multimodal deduplication action if multiple items exist */}
              {items.length > 1 && (
                <button
                  onClick={handleCombineDuplicates}
                  disabled={isCombining}
                  className="w-full py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold hover:bg-amber-100 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>{isCombining ? 'Analyzing Duplicates...' : 'Auto-Merge Voice & Image Duplicates'}</span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* =========================================================================
            SECTION 3: ERRAND & SPECIAL INSTRUCTIONS
            ========================================================================= */}
        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Custom Errand Details & Instructions
          </span>
          <textarea
            value={errandInstructions}
            onChange={(e) => setErrandInstructions(e.target.value)}
            placeholder="Type any custom errands, medicine brands, specific vendor stalls, or parcel contents here..."
            rows={2}
            className="w-full p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D7] text-xs font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
          />
        </section>

        {/* =========================================================================
            SECTION 4: PICKUP & DROP ROUTE (AS IN SCREENSHOT)
            ========================================================================= */}
        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 shadow-xs space-y-3">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Pickup & Drop Route
          </span>

          <div className="space-y-3">
            {/* Pickup Location */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-[#E8E1D7] space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Pickup Store / Mandi
                  </span>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Enter Mandi or Store location..."
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-neutral-800 focus:outline-none"
                  />
                </div>
              </div>
              <input
                type="text"
                value={pickupNotes}
                onChange={(e) => setPickupNotes(e.target.value)}
                placeholder="Pickup notes (e.g. Stall #14, buy morning lot)"
                className="w-full text-[11px] text-neutral-500 bg-white/70 px-2 py-1 rounded-lg border border-neutral-200 focus:outline-none"
              />
            </div>

            {/* Drop / Delivery Address */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-[#E8E1D7] space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Delivery Address
                  </span>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your flat/home address..."
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-neutral-800 focus:outline-none"
                  />
                </div>
              </div>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Delivery instructions (e.g. Call on arrival, leave with security)"
                className="w-full text-[11px] text-neutral-500 bg-white/70 px-2 py-1 rounded-lg border border-neutral-200 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 5: RIDER TIP (100% TO DELIVERY PARTNER) (AS IN SCREENSHOT)
            ========================================================================= */}
        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Rider Tip (100% to Delivery Partner)
            </span>
            <span className="text-xs font-bold text-emerald-600">₹{tipAmount}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[0, 10, 20, 30].map((amount) => (
              <button
                key={amount}
                onClick={() => setTipAmount(amount)}
                className={`py-2 px-3 rounded-2xl border text-xs font-bold transition-all ${
                  tipAmount === amount
                    ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm ring-1 ring-brand-500/20'
                    : 'border-[#E8E1D7] bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {amount === 0 ? 'None' : `+₹${amount}`}
              </button>
            ))}
          </div>
        </section>

        {/* =========================================================================
            SECTION 6: PAYMENT OPTION
            ========================================================================= */}
        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 shadow-xs space-y-3">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Payment Option
          </span>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'COD', label: 'Cash on Delivery', icon: Banknote },
              { id: 'UPI_QR', label: 'Direct UPI QR', icon: QrCode },
              { id: 'RAZORPAY', label: 'Card / Netbanking', icon: CreditCard },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setPaymentMethod(p.id as PaymentMethod)}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                    paymentMethod === p.id
                      ? 'border-brand-600 bg-brand-50 text-brand-900 shadow-sm font-bold ring-1 ring-brand-500/20'
                      : 'border-[#E8E1D7] bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-brand-600" />
                  <span className="text-[10px] leading-tight font-bold">{p.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            SECTION 7: BILL DETAILS & TRANSPARENCY NOTICE
            ========================================================================= */}
        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 shadow-xs space-y-2.5 text-xs">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
            Bill Details
          </span>

          <div className="flex justify-between text-neutral-600">
            <span>Items Subtotal (Estimated)</span>
            <span className="font-bold text-neutral-900">₹{totalEstimatedCost}</span>
          </div>

          <div className="flex justify-between text-neutral-600">
            <span>Delivery Partner Charge</span>
            <span className="font-bold text-neutral-900">₹{deliveryFee}</span>
          </div>

          {tipAmount > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>Rider Tip</span>
              <span className="font-bold text-neutral-900">₹{tipAmount}</span>
            </div>
          )}

          <div className="pt-2 border-t border-neutral-100 flex justify-between text-sm font-black text-neutral-900">
            <span>To Pay (Estimated)</span>
            <span className="text-brand-600 text-base">₹{finalTotal}</span>
          </div>

          <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[10px] text-amber-900 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Mandi Price Guarantee:</strong> Daily vegetable mandi prices fluctuate. Your rider will verify actual mandi rates at the stall and request your in-app approval before buying.
            </span>
          </div>
        </section>
      </main>

      {/* =========================================================================
          3. STICKY BOTTOM CHECKOUT BUTTON (MATCHING SCREENSHOT)
          ========================================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8E1D7] p-3 sm:p-4 shadow-lg">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#cb6239] hover:bg-[#b5532d] active:scale-98 text-white font-extrabold text-sm sm:text-base flex items-center justify-between shadow-lg shadow-[#cb6239]/25 transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <Bike className="w-5 h-5" />
              <span>{isSubmitting ? 'Placing Order...' : `Hire Rider & Place Order (₹${finalTotal})`}</span>
            </div>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </footer>

      {/* AI Assistant Modal for Voice/OCR on this page */}
      <AIHybridOrderAssistant
        isOpen={isAiAssistantOpen}
        initialTab={aiAssistantMode}
        onClose={() => setIsAiAssistantOpen(false)}
        onProceedToCheckout={() => setIsAiAssistantOpen(false)}
      />
    </div>
  );
}
