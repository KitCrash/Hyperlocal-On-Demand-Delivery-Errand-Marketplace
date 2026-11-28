'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Check } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { apiRequest } from '@/lib/api';
import { Product } from '@/types';

export default function GroceryServicePage() {
  const router = useRouter();
  const { addItem, setServiceType, setPickupAddress, items } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStall, setSelectedStall] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ products: Product[] }>('/products')
      .then((res) => {
        const list = (res.products || []).filter((p) =>
          /veg|fruit|mandi|grocery|staple/i.test(p.category || '')
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
    setServiceType('GROCERY_SHOPPING');
    if (selectedStall.trim()) {
      setPickupAddress(selectedStall.trim());
    }
    addItem({
      productId: product.id,
      name: product.name,
      quantity: 1,
      unit: product.unit || 'unit',
      inputMethod: 'MANUAL',
      estimatedPrice: getPrice(product),
      category: product.category,
    });
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
              <h1 className="text-base sm:text-lg font-black text-neutral-900">Grocery & Local Mandi</h1>
              <span className="text-[11px] text-neutral-500 font-medium block">
                Fresh vegetables, fruits & daily staples
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
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
          <p className="font-extrabold uppercase tracking-wider text-[11px]">Local Market Policy</p>
          <p className="font-medium">
            Vegetables, fruits, and perishable items sourced from local mandi stalls are{' '}
            <span className="font-bold underline">Non-refundable & Non-returnable</span> once purchased.
          </p>
        </div>

        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 space-y-2.5">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Preferred Mandi / Market Stall (Optional)
          </span>
          <input
            type="text"
            value={selectedStall}
            onChange={(e) => setSelectedStall(e.target.value)}
            placeholder="Enter local market or stall name"
            className="w-full p-3 rounded-xl border border-[#E8E1D7] bg-[#FAF7F2] text-xs font-semibold text-neutral-900 focus:outline-none focus:border-brand-500"
          />
        </section>

        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Available Products ({filteredProducts.length})
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items..."
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
            <p className="text-xs text-neutral-500">Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-xs text-neutral-500">No grocery or mandi products found.</p>
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
                      ₹{getPrice(product)} / {product.unit}
                    </p>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded inline-block mt-1">
                      Non-refundable & Non-returnable
                    </span>
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
