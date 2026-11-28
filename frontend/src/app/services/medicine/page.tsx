'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { apiRequest } from '@/lib/api';
import { Product } from '@/types';

export default function MedicineServicePage() {
  const router = useRouter();
  const { addItem, setServiceType, setErrandInstructions, items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pharmacyName, setPharmacyName] = useState('');
  const [prescriptionNote, setPrescriptionNote] = useState('');
  const [urgency, setUrgency] = useState<'STANDARD' | 'URGENT'>('STANDARD');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ products: Product[] }>('/products')
      .then((res) => {
        const list = (res.products || []).filter((p) =>
          /pharm|med|health/i.test(p.category || '')
        );
        setProducts(list);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const getPrice = (p: any) => Number(p.basePrice ?? p.price ?? 0);

  const filteredProducts = products
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-asc') return getPrice(a) - getPrice(b);
      if (sortBy === 'price-desc') return getPrice(b) - getPrice(a);
      return 0;
    });

  const handleAdd = (product: Product) => {
    setServiceType('CUSTOM_ERRAND');
    addItem({
      productId: product.id,
      name: product.name,
      quantity: 1,
      unit: product.unit || 'unit',
      inputMethod: 'MANUAL',
      estimatedPrice: getPrice(product),
      category: product.category,
    });
    if (prescriptionNote.trim() || pharmacyName.trim()) {
      setErrandInstructions(
        `${pharmacyName.trim() ? `[Pharmacy: ${pharmacyName.trim()}] ` : ''}[${urgency}] ${prescriptionNote.trim()}`
      );
    }
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      <header className="sticky top-0 z-30 bg-white border-b border-[#E8E1D7] px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-neutral-900">Health & Medicine</h1>
              <span className="text-[11px] text-neutral-500 font-medium block">
                Chemist MRP billing & prescription pickup
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push('/cart')}
            className="px-3.5 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors"
          >
            Cart ({items.length})
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">
        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 space-y-3">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Chemist & Delivery Priority
          </span>
          <input
            type="text"
            value={pharmacyName}
            onChange={(e) => setPharmacyName(e.target.value)}
            placeholder="Preferred chemist or pharmacy name (optional)"
            className="w-full p-3 rounded-xl border border-[#E8E1D7] bg-[#FAF7F2] text-xs font-semibold text-neutral-900 focus:outline-none focus:border-brand-500"
          />
          <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
            {(['STANDARD', 'URGENT'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setUrgency(level)}
                className={`p-3 rounded-xl border transition-all ${
                  urgency === level
                    ? 'border-brand-600 bg-brand-50 text-brand-900'
                    : 'border-[#E8E1D7] bg-white text-neutral-700'
                }`}
              >
                {level === 'STANDARD' ? 'Standard (30-45 mins)' : 'Urgent (15-20 mins)'}
              </button>
            ))}
          </div>
          <textarea
            value={prescriptionNote}
            onChange={(e) => setPrescriptionNote(e.target.value)}
            placeholder="Enter medicine names, dosage, or prescription instructions..."
            rows={3}
            className="w-full p-3 rounded-xl border border-[#E8E1D7] bg-[#FAF7F2] text-xs text-neutral-900 focus:outline-none focus:border-brand-500"
          />
        </section>

        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Available Pharmacy Items ({filteredProducts.length})
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicines..."
                className="px-3 py-1.5 rounded-xl border border-[#E8E1D7] bg-[#FAF7F2] text-xs text-neutral-900 focus:outline-none focus:border-brand-500"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-[#E8E1D7] bg-[#FAF7F2] text-xs font-semibold text-neutral-900 focus:outline-none"
              >
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-neutral-500">Loading pharmacy items...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-xs text-neutral-500">No pharmacy products listed right now.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProducts.map((product: any) => (
                <div
                  key={product.id}
                  className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D7] flex items-center gap-3"
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#E8E1D7]"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate">{product.name}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      MRP ₹{getPrice(product)} ({product.unit})
                    </p>
                  </div>
                  <button
                    onClick={() => handleAdd(product)}
                    className="shrink-0 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    {addedId === product.id ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{addedId === product.id ? 'Added' : 'Add'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
