'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function ParcelServicePage() {
  const router = useRouter();
  const {
    setServiceType,
    pickupAddress,
    setPickupAddress,
    deliveryAddress,
    setDeliveryAddress,
    setErrandInstructions,
    addItem,
  } = useCart();

  const [packageType, setPackageType] = useState('Documents / Keys');
  const [weightTier, setWeightTier] = useState('Up to 2 kg');
  const [fragile, setFragile] = useState(false);
  const [notes, setNotes] = useState('');

  const handleContinueToCart = () => {
    setServiceType('PARCEL_PICKUP_DROP');
    addItem({
      name: `P2P Parcel: ${packageType} (${weightTier})`,
      quantity: 1,
      unit: 'package',
      inputMethod: 'MANUAL',
      estimatedPrice: weightTier === 'Up to 2 kg' ? 60 : weightTier === '2 - 5 kg' ? 95 : 140,
      category: 'Parcel',
    });
    setErrandInstructions(
      `Parcel Type: ${packageType} | Weight: ${weightTier} | Fragile: ${fragile ? 'Yes' : 'No'}${
        notes ? ` | Notes: ${notes}` : ''
      }`
    );
    router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-[#E8E1D7] px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-black text-neutral-900">P2P Parcel & Courier</h1>
            <span className="text-[11px] text-neutral-500 font-medium block">
              Direct point-to-point pickup & drop
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 space-y-3">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Pickup & Drop Addresses
          </span>
          <input
            type="text"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            placeholder="Pickup address"
            className="w-full p-3 rounded-xl border border-[#E8E1D7] bg-[#FAF7F2] text-xs font-semibold text-neutral-900 focus:outline-none focus:border-brand-500"
          />
          <input
            type="text"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Drop address"
            className="w-full p-3 rounded-xl border border-[#E8E1D7] bg-[#FAF7F2] text-xs font-semibold text-neutral-900 focus:outline-none focus:border-brand-500"
          />
        </section>

        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 space-y-3">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Package Details
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            {['Documents / Keys', 'Lunchbox / Tiffin', 'Electronics', 'Clothing / Box'].map((t) => (
              <button
                key={t}
                onClick={() => setPackageType(t)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  packageType === t
                    ? 'border-brand-600 bg-brand-50 text-brand-900'
                    : 'border-[#E8E1D7] bg-white text-neutral-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-bold pt-1">
            {['Up to 2 kg', '2 - 5 kg', '5 - 10 kg'].map((w) => (
              <button
                key={w}
                onClick={() => setWeightTier(w)}
                className={`p-2.5 rounded-xl border transition-all ${
                  weightTier === w
                    ? 'border-brand-600 bg-brand-50 text-brand-900'
                    : 'border-[#E8E1D7] bg-white text-neutral-700'
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2.5 pt-1 text-xs font-semibold text-neutral-800 cursor-pointer">
            <input
              type="checkbox"
              checked={fragile}
              onChange={(e) => setFragile(e.target.checked)}
              className="rounded border-[#E8E1D7] text-brand-600 focus:ring-brand-500"
            />
            <span>Mark as Fragile (Handle with extra care)</span>
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Recipient name, phone, or gate instructions..."
            rows={2}
            className="w-full p-3 rounded-xl border border-[#E8E1D7] bg-[#FAF7F2] text-xs text-neutral-900 focus:outline-none focus:border-brand-500"
          />
        </section>

        <button
          onClick={handleContinueToCart}
          className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-black shadow-md transition-all"
        >
          Continue to Checkout
        </button>
      </main>
    </div>
  );
}
