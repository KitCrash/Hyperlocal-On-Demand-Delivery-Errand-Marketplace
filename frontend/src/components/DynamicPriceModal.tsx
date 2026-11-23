'use client';

import React, { useState } from 'react';
import { Order, OrderItem } from '../types';
import { apiRequest } from '../lib/api';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Receipt,
  Eye,
  ShieldAlert,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface DynamicPriceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPriceActionComplete: () => void;
}

export const DynamicPriceModal: React.FC<DynamicPriceModalProps> = ({
  order,
  isOpen,
  onClose,
  onPriceActionComplete,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [viewBillProof, setViewBillProof] = useState(false);

  if (!isOpen || !order) return null;

  const estimatedTotal = order.estimatedProductTotal;
  const actualTotal = order.actualProductTotal;
  const priceDifference = actualTotal - estimatedTotal;
  const percentageChange = estimatedTotal > 0 ? (priceDifference / estimatedTotal) * 100 : 0;
  const isSpike = Math.abs(percentageChange) > 20 || order.priceAlertFlag;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest(`/orders/${order.id}/price-approval`, {
        method: 'PATCH',
        body: JSON.stringify({ approved: true }),
      });
      onPriceActionComplete();
      onClose();
    } catch (err) {
      console.error('Failed to approve price', err);
      alert('Failed to approve price. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please specify a reason for declining the price update');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiRequest(`/orders/${order.id}/price-approval`, {
        method: 'PATCH',
        body: JSON.stringify({ approved: false, rejectionReason }),
      });
      onPriceActionComplete();
      onClose();
    } catch (err) {
      console.error('Failed to reject price', err);
      alert('Failed to reject price. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Alert Banner */}
        <div
          className={`p-4 sm:p-5 text-white ${
            isSpike
              ? 'bg-gradient-to-r from-amber-600 to-rose-600'
              : 'bg-gradient-to-r from-brand-600 to-amber-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              {isSpike ? (
                <ShieldAlert className="w-6 h-6 text-amber-200 animate-pulse" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-200" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  Dynamic Price Approval Required
                </h3>
                {isSpike && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Price Alert (+{Math.round(percentageChange)}%)
                  </span>
                )}
              </div>
              <p className="text-xs text-white/90">
                Order #{order.orderNumber} · Partner is currently at the market stall
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Estimated Price
              </span>
              <span className="text-xl font-extrabold text-neutral-800 block mt-1">
                ₹{estimatedTotal}
              </span>
              <span className="text-[10px] text-neutral-500">Benchmark mandi rate</span>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                priceDifference > 0
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Actual Shop Price
                </span>
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    priceDifference > 0
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-emerald-200 text-emerald-900'
                  }`}
                >
                  {priceDifference > 0 ? `+₹${priceDifference}` : `-₹${Math.abs(priceDifference)}`}
                </span>
              </div>
              <span className="text-xl font-extrabold text-neutral-900 block mt-1">
                ₹{actualTotal}
              </span>
              <span className="text-[10px] text-neutral-500">Verified by Partner at counter</span>
            </div>
          </div>

          {/* Partner explanation note */}
          {order.priceChangeReason && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900">
              <strong className="block font-bold mb-0.5">Partner Note from Mandi:</strong>
              "{order.priceChangeReason}"
            </div>
          )}

          {/* Itemized Comparison Table */}
          <div className="border border-neutral-200 rounded-2xl overflow-hidden">
            <div className="bg-neutral-100 px-3 py-2 text-[11px] font-bold text-neutral-700 flex justify-between">
              <span>Item & Quantity</span>
              <div className="flex gap-6">
                <span>Estimated</span>
                <span>Actual</span>
              </div>
            </div>
            <div className="divide-y divide-neutral-100">
              {order.items.map((item, idx) => {
                const est = item.estimatedPrice || 0;
                const act = item.actualPrice || est;
                const diff = act - est;
                return (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-neutral-900 block">{item.name}</span>
                      <span className="text-[11px] text-neutral-500">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <span className="text-neutral-500">₹{est}</span>
                      <div>
                        <span className="font-extrabold text-neutral-900">₹{act}</span>
                        {diff !== 0 && (
                          <span
                            className={`block text-[10px] font-bold ${
                              diff > 0 ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            {diff > 0 ? `+₹${diff}` : `-₹${Math.abs(diff)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Purchase Evidence / Bill Photo */}
          {order.purchaseProofUrl && (
            <div className="border border-neutral-200 rounded-2xl p-3 bg-neutral-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                  <Receipt className="w-4 h-4 text-brand-600" />
                  <span>Purchase Evidence (Mandi Bill / Slip)</span>
                </div>
                <button
                  onClick={() => setViewBillProof(!viewBillProof)}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {viewBillProof ? 'Hide Proof' : 'View Proof Photo'}
                </button>
              </div>

              {viewBillProof && (
                <div className="mt-2 rounded-xl overflow-hidden border border-neutral-200 bg-white">
                  <img
                    src={order.purchaseProofUrl}
                    alt="Purchase Proof"
                    className="w-full max-h-56 object-cover"
                  />
                  {order.purchaseProofNote && (
                    <p className="text-[11px] text-neutral-600 p-2 border-t">
                      Note: {order.purchaseProofNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Policy Reminder */}
          <div className="text-[11px] text-neutral-500 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 leading-snug">
            🛡️ <strong>Platform Fair Price Guarantee:</strong> Delivery partners never earn from item markup. Partner earnings come solely from delivery fees and incentives. You can decline if the price exceeds your budget.
          </div>

          {/* Rejection input when toggled */}
          {showRejectForm && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 animate-in fade-in">
              <label className="text-xs font-bold text-rose-900 block">
                Reason for Declining Revised Prices:
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Price too high compared to local rate / Cancel these items..."
                className="w-full p-2.5 rounded-xl bg-white border border-rose-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between gap-3">
          {!showRejectForm ? (
            <>
              <button
                onClick={() => setShowRejectForm(true)}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-100 transition-colors"
              >
                Decline Prices
              </button>

              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve ₹{actualTotal} & Authorize Purchase</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowRejectForm(false)}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex-1 py-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Decline & Notify Partner</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
