'use client';

import React, { useState } from 'react';
import { Order, PaymentMethod } from '../types';
import { apiRequest } from '../lib/api';
import {
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  X,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('UPI_ONLINE');
  const [utrNumber, setUtrNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedUpiId, setCopiedUpiId] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !order) return null;

  const upiId = 'hyperlocal.mandi@icici';
  const upiQrPayload = `upi://pay?pa=${upiId}&pn=HyperlocalDelivery&am=${order.totalAmount}&cu=INR&tn=Order_${order.orderNumber}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpiId(true);
    setTimeout(() => setCopiedUpiId(false), 2000);
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setErrorMessage('');
    try {
      if (method === 'UPI_ONLINE' || method === 'CARD' || method === 'NET_BANKING') {
        // Razorpay Online simulation
        const rzpOrder = await apiRequest('/payments/create-razorpay-order', {
          method: 'POST',
          body: JSON.stringify({ orderId: order.id }),
        });

        // Simulate instant successful checkout verification
        await apiRequest('/payments/verify-razorpay', {
          method: 'POST',
          body: JSON.stringify({
            orderId: order.id,
            razorpayPaymentId: `pay_${Date.now()}`,
            razorpayOrderId: rzpOrder.razorpayOrderId,
          }),
        });
      } else if (method === 'DIRECT_UPI') {
        if (!utrNumber || utrNumber.length < 8) {
          setErrorMessage('Please enter a valid 12-digit UPI UTR / Reference number');
          setIsProcessing(false);
          return;
        }

        await apiRequest('/payments/submit-direct-upi', {
          method: 'POST',
          body: JSON.stringify({
            orderId: order.id,
            utrNumber,
          }),
        });
      }

      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">Complete Secure Payment</h3>
              <p className="text-xs text-neutral-400">Order #{order.orderNumber} · Amount: ₹{order.totalAmount}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMethod('UPI_ONLINE')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                method === 'UPI_ONLINE'
                  ? 'border-brand-600 bg-brand-50/60 text-brand-700 shadow-sm'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Razorpay / Cards</span>
            </button>

            <button
              onClick={() => setMethod('DIRECT_UPI')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                method === 'DIRECT_UPI'
                  ? 'border-brand-600 bg-brand-50/60 text-brand-700 shadow-sm'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>Direct UPI QR</span>
            </button>

            <button
              onClick={() => setMethod('COD')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                method === 'COD'
                  ? 'border-brand-600 bg-brand-50/60 text-brand-700 shadow-sm'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>Cash on Delivery</span>
            </button>
          </div>

          {/* DIRECT UPI QR DETAILS */}
          {method === 'DIRECT_UPI' && (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center space-y-3">
              <span className="text-xs font-bold text-neutral-800 block">
                Scan UPI QR Code with GPay / PhonePe / Paytm
              </span>

              {/* Generated QR Code preview box */}
              <div className="w-40 h-40 mx-auto bg-white p-2 rounded-2xl border border-neutral-300 shadow-inner flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    upiQrPayload
                  )}`}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-neutral-600">
                <span>UPI ID: <strong className="text-neutral-900">{upiId}</strong></span>
                <button
                  onClick={handleCopyUpi}
                  className="p-1 rounded text-brand-600 hover:text-brand-700"
                  title="Copy UPI ID"
                >
                  {copiedUpiId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="pt-2 text-left">
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Enter 12-Digit UPI Reference / UTR Number:
                </label>
                <input
                  type="text"
                  maxLength={12}
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. 412891002345"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-xs focus:ring-1 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* RAZORPAY DETAILS */}
          {method === 'UPI_ONLINE' && (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs text-neutral-600">
              <div className="flex items-center gap-2 text-neutral-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Instant 256-Bit SSL Encrypted Gateway</span>
              </div>
              <p>Supports Google Pay, PhonePe, Paytm, RuPay/Visa/MasterCard, and Net Banking.</p>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-semibold">
                Test Mode: Instant verification enabled for testing
              </div>
            </div>
          )}

          {/* COD DETAILS */}
          {method === 'COD' && (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1 text-xs text-neutral-600">
              <span className="font-bold text-neutral-900 block">Pay Cash to Delivery Partner</span>
              <p>Please keep ₹{order.totalAmount} ready in exact cash on arrival.</p>
            </div>
          )}

          {/* Total Breakdown */}
          <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D7] flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-600">Total Payable Amount:</span>
            <span className="text-base font-extrabold text-neutral-900">₹{order.totalAmount}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={handleProcessPayment}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isProcessing
                ? 'Processing...'
                : method === 'COD'
                ? 'Confirm Cash on Delivery'
                : `Pay ₹${order.totalAmount}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
