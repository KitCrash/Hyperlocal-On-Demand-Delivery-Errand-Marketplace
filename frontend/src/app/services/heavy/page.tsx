'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const VEHICLES = [
  { id: '2-Wheeler Cargo', capacity: 'Up to 25 kg', basePrice: 120 },
  { id: '3-Wheeler Auto', capacity: 'Up to 250 kg', basePrice: 280 },
  { id: 'Mini Pickup Truck', capacity: 'Up to 750 kg', basePrice: 550 },
];

export default function HeavyServicePage() {
  const router = useRouter();
  const { setServiceType, addItem, setErrandInstructions } = useCart();
  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0]);
  const [itemDescription, setItemDescription] = useState('');
  const [needHelper, setNeedHelper] = useState(false);

  const handleBook = () => {
    setServiceType('CUSTOM_ERRAND');
    addItem({
      name: `Heavy Cargo (${selectedVehicle.id})`,
      quantity: 1,
      unit: 'trip',
      inputMethod: 'MANUAL',
      estimatedPrice: selectedVehicle.basePrice + (needHelper ? 150 : 0),
      category: 'Hardware & Plumbing',
    });
    setErrandInstructions(
      `Vehicle: ${selectedVehicle.id} (${selectedVehicle.capacity}) | Loading Helper: ${
        needHelper ? 'Yes (+₹150)' : 'No'
      }${itemDescription ? ` | Items: ${itemDescription}` : ''}`
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
            <h1 className="text-base sm:text-lg font-black text-neutral-900">Big & Heavy Delivery</h1>
            <span className="text-[11px] text-neutral-500 font-medium block">
              Bulky hardware, pipes, appliances & cargo
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 space-y-3">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Select Vehicle Type
          </span>
          <div className="space-y-2.5">
            {VEHICLES.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v)}
                className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  selectedVehicle.id === v.id
                    ? 'border-brand-600 bg-brand-50 text-brand-900'
                    : 'border-[#E8E1D7] bg-[#FAF7F2] text-neutral-800'
                }`}
              >
                <div>
                  <p className="text-xs sm:text-sm font-black">{v.id}</p>
                  <p className="text-[11px] text-neutral-500">{v.capacity}</p>
                </div>
                <span className="text-xs sm:text-sm font-black">₹{v.basePrice}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 space-y-3">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Cargo Description
          </span>
          <textarea
            value={itemDescription}
            onChange={(e) => setItemDescription(e.target.value)}
            placeholder="Describe bulky items (e.g., 10ft PVC pipes, water tank, cement bags)..."
            rows={3}
            className="w-full p-3 rounded-xl border border-[#E8E1D7] bg-[#FAF7F2] text-xs text-neutral-900 focus:outline-none focus:border-brand-500"
          />
          <label className="flex items-center gap-2.5 text-xs font-semibold text-neutral-800 cursor-pointer">
            <input
              type="checkbox"
              checked={needHelper}
              onChange={(e) => setNeedHelper(e.target.checked)}
              className="rounded border-[#E8E1D7] text-brand-600 focus:ring-brand-500"
            />
            <span>Add Loading & Unloading Helper (+₹150)</span>
          </label>
        </section>

        <button
          onClick={handleBook}
          className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-black shadow-md transition-all"
        >
          Continue to Checkout
        </button>
      </main>
    </div>
  );
}
