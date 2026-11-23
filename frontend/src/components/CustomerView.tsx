'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product, Store, ServiceType } from '../types';
import { apiRequest } from '../lib/api';
import { useCart } from '../context/CartContext';
import {
  Sparkles,
  Search,
  Plus,
  TrendingUp,
  Clock,
  ShieldCheck,
  Bike,
  Package,
  Store as StoreIcon,
  ShoppingBag,
  Info,
  Check,
  Mic,
  Camera,
  Layers,
  Wrench,
  Zap,
  Shirt,
  Wheat,
  Pill,
  UtensilsCrossed,
  ArrowRight,
} from 'lucide-react';

interface CustomerViewProps {
  onOpenAiAssistant: () => void;
  onOpenCart: () => void;
  onSelectService: (service: ServiceType) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  onOpenAiAssistant,
  onOpenCart,
  onSelectService,
}) => {
  const { addItem, setServiceType } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProductHistory, setSelectedProductHistory] = useState<any | null>(null);

  useEffect(() => {
    Promise.all([
      apiRequest<{ products: Product[] }>('/products'),
      apiRequest<{ stores: Store[] }>('/stores'),
    ])
      .then(([prodData, storeData]) => {
        setProducts(prodData.products || []);
        setStores(storeData.stores || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    'All',
    'Vegetables & Mandi',
    'Hardware & Plumbing',
    'Electrical & Lighting',
    'Clothing & Apparel',
    'Grocery & Staples',
    'Pharmacy',
    'Food',
  ];

  // Helper to filter products by category group
  const getProductsForCategory = (catName: string) => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameBengali?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameHindi?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (catName === 'Vegetables & Mandi') {
        return p.category === 'Vegetables' || p.category === 'Fish & Meat' || p.category === 'Dairy & Eggs';
      }
      if (catName === 'Hardware & Plumbing') {
        return p.category === 'Hardware & Plumbing';
      }
      if (catName === 'Electrical & Lighting') {
        return p.category === 'Electrical & Lighting';
      }
      if (catName === 'Clothing & Apparel') {
        return p.category === 'Clothing & Apparel';
      }
      if (catName === 'Grocery & Staples') {
        return p.category === 'Grocery & Staples';
      }
      if (catName === 'Pharmacy') {
        return p.category === 'Pharmacy';
      }
      if (catName === 'Food') {
        return p.category === 'Food';
      }
      return true;
    });
  };

  const handleQuickAdd = (p: Product) => {
    addItem({
      productId: p.id,
      name: p.name,
      quantity: 1,
      unit: p.unit,
      inputMethod: 'MANUAL',
      estimatedPrice: p.estimatedPrice,
      confidenceScore: 1.0,
      imageUrl: p.imageUrl,
    });
  };

  const handleOpenHistory = async (prodId: string) => {
    try {
      const data = await apiRequest(`/products/${prodId}/price-history`);
      setSelectedProductHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  const renderProductCard = (p: Product) => (
    <div
      key={p.id}
      className="bg-white rounded-3xl border border-[#E8E1D7] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
    >
      {/* Image & Badges */}
      <div className="relative h-36 sm:h-40 overflow-hidden bg-neutral-100">
        <img
          src={p.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
          alt={p.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {!p.isFixedPrice && (
          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
            Mandi Fluctuating
          </span>
        )}
        {p.store?.isLocalMarket && (
          <button
            onClick={() => handleOpenHistory(p.id)}
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md text-neutral-700 flex items-center justify-center hover:bg-white shadow-sm"
            title="View 7-day price volatility history"
          >
            <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 line-clamp-1">
            {p.name}
          </h4>
          <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
            {p.nameBengali || p.nameHindi || p.category}
          </p>
        </div>

        {/* Pricing row */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[10px] text-neutral-400 block font-semibold">
              {p.unit}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-black text-neutral-900">
                ₹{p.estimatedPrice}
              </span>
              {!p.isFixedPrice && (
                <span className="text-[10px] font-semibold text-neutral-400">
                  (Est)
                </span>
              )}
            </div>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={() => handleQuickAdd(p)}
            className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all shadow-sm"
            title="Add to order"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-20 md:pb-8">
      {/* 1. Large, Full-Width Prominent Search Bar (100% width, no side button) */}
      <div className="w-full">
        <div className="relative w-full">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 sm:left-5 top-3.5 sm:top-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search water pipes, mugs, buckets, LED bulbs, wires, clothes, onions, potatoes, medicines..."
            className="w-full pl-12 sm:pl-14 pr-5 py-3.5 sm:py-4 rounded-2xl sm:rounded-full bg-white border border-[#E8E1D7] text-sm sm:text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-neutral-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 sm:top-4 text-xs font-bold text-neutral-400 hover:text-neutral-700 bg-neutral-100 px-2 py-1 rounded-full"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Hero Banner Inspired by Reference Design (No blinking dots) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#F4DAC4] via-[#EBBDA0] to-[#E3A378] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-[#E5C7B0]">
        <div className="space-y-3 max-w-md z-10 text-center md:text-left">
          <span className="inline-block px-3 py-1 rounded-full bg-white/70 backdrop-blur-md text-[11px] font-extrabold text-brand-900 uppercase tracking-wider shadow-sm">
            🌾 Rural & Hyperlocal Daily Mandi
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-tight">
            Fresh Produce & Daily Errands Delivered in 30 Mins
          </h2>
          <p className="text-xs sm:text-sm text-neutral-800/80 leading-relaxed">
            Unpriced vegetable mandi produce verified at the counter by nearby riders with 100% price approval guarantee.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
            <button
              onClick={() => {
                setServiceType('GROCERY_SHOPPING');
                onOpenCart();
              }}
              className="py-2.5 px-6 rounded-full bg-neutral-900 text-white text-xs sm:text-sm font-extrabold hover:bg-neutral-800 shadow-md active:scale-95 transition-transform"
            >
              Order Now
            </button>
            <button
              onClick={onOpenAiAssistant}
              className="py-2.5 px-5 rounded-full bg-white/90 text-brand-900 text-xs sm:text-sm font-extrabold hover:bg-white shadow-sm transition-all"
            >
              Try Voice Assistant 🎙️
            </button>
          </div>
        </div>

        <div className="relative w-48 sm:w-64 h-48 sm:h-56 shrink-0 flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"
            alt="Fresh Mandi"
            className="w-full h-full object-cover rounded-3xl shadow-xl border-4 border-white/60"
          />
          {/* Calm, solid badge without blinking dot */}
          <div className="absolute -bottom-3 -left-3 bg-white px-3 py-1.5 rounded-2xl shadow-lg border border-neutral-100 flex items-center gap-1.5 text-xs font-bold text-neutral-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Mandi Live Rates</span>
          </div>
        </div>
      </div>

      {/* 2. POPULAR HYPERLOCAL SERVICES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider">
            Popular Hyperlocal Services
          </h3>
          <span className="text-xs text-brand-600 font-bold">5 Services Available</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              id: 'GROCERY_SHOPPING',
              title: 'Fresh Mandi & Veggies',
              desc: 'Vegetable & fish bazaar with dynamic price approval',
              icon: '🥦',
              bg: 'bg-emerald-50 text-emerald-950 border-emerald-200',
              categoryTarget: 'Vegetables & Mandi',
            },
            {
              id: 'SHOP_TO_HOME',
              title: 'Shop-to-Home',
              desc: 'Kirana essentials, dairy, hardware & staples',
              icon: '🏪',
              bg: 'bg-amber-50 text-amber-950 border-amber-200',
              categoryTarget: 'Grocery & Staples',
            },
            {
              id: 'PARCEL_PICKUP_DROP',
              title: 'Parcel Pickup & Drop',
              desc: 'Papers, documents, keys & forgotten items',
              icon: '📦',
              bg: 'bg-sky-50 text-sky-950 border-sky-200',
              categoryTarget: null,
            },
            {
              id: 'FOOD_ESSENTIALS',
              title: 'Food & Essentials',
              desc: 'Local food stall, sweets, bakery & snacks',
              icon: '🍲',
              bg: 'bg-rose-50 text-rose-950 border-rose-200',
              categoryTarget: 'Food',
            },
            {
              id: 'CUSTOM_ERRAND',
              title: 'Custom Errands',
              desc: 'Chemist, hardware, clothes, bill pay & errands',
              icon: '⚡',
              bg: 'bg-purple-50 text-purple-950 border-purple-200',
              categoryTarget: null,
            },
          ].map((srv) => (
            <button
              key={srv.id}
              onClick={() => {
                if (srv.categoryTarget) {
                  setSelectedCategory(srv.categoryTarget);
                } else {
                  setServiceType(srv.id as ServiceType);
                  onSelectService(srv.id as ServiceType);
                  onOpenCart();
                }
              }}
              className={`p-4 rounded-3xl border text-left transition-all hover:scale-[1.02] active:scale-95 shadow-sm ${srv.bg}`}
            >
              <div className="text-2xl mb-2">{srv.icon}</div>
              <h4 className="text-xs sm:text-sm font-extrabold leading-tight mb-1">{srv.title}</h4>
              <p className="text-[10px] opacity-80 leading-snug">{srv.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 3. AI HYBRID ORDER ASSISTANT - MOVED DIRECTLY UNDER POPULAR HYPERLOCAL SERVICES */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-brand-600 via-amber-600 to-amber-500 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center md:text-left">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <h4 className="text-base sm:text-lg font-extrabold tracking-tight">
                AI Hybrid Order Assistant
              </h4>
              <span className="bg-amber-400 text-neutral-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Voice & OCR
              </span>
            </div>
            <p className="text-xs text-white/90 mt-0.5 max-w-xl">
              Don't want to type? Speak in <strong>Bengali (বাংলা)</strong>, <strong>Hindi (हिन्दी)</strong>, or <strong>English</strong>, or upload a photo of your handwritten paper list. Our AI automatically extracts products and merges duplicates!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center">
          <button
            onClick={onOpenAiAssistant}
            className="py-2.5 px-4 rounded-full bg-white text-neutral-900 font-extrabold text-xs sm:text-sm hover:bg-neutral-100 shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Mic className="w-4 h-4 text-brand-600" />
            <span>Voice Order</span>
          </button>
          <button
            onClick={onOpenAiAssistant}
            className="py-2.5 px-4 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-900 font-extrabold text-xs sm:text-sm shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Camera className="w-4 h-4 text-neutral-900" />
            <span>Photo / OCR List</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-white border border-[#E8E1D7] text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. DIFFERENT DEDICATED SECTIONS FOR POPULAR PRODUCT CATEGORIES */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-64 rounded-3xl bg-neutral-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-9">
          {/* SECTION A: FRESH FARM MANDI & PRODUCE (Vegetables, Fish, Meat, Eggs) */}
          {(selectedCategory === 'All' || selectedCategory === 'Vegetables & Mandi') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E1D7] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🥦</span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
                      Fresh Farm Mandi & Produce
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Unpriced morning vegetables, fish & desi eggs with Dynamic Counter Price Approval
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                  Mandi Fresh
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {getProductsForCategory('Vegetables & Mandi').map((p) => renderProductCard(p))}
              </div>
            </div>
          )}

          {/* SECTION B: HARDWARE, PLUMBING & WATER UTILITIES (Water pipes, mugs, buckets, taps) */}
          {(selectedCategory === 'All' || selectedCategory === 'Hardware & Plumbing') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E1D7] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔧</span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
                      Hardware, Plumbing & Water Utilities
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Water pipes, heavy duty buckets, plastic water bath mugs, chrome faucets & taps
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2.5 py-1 rounded-full">
                  Hardware Hub
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {getProductsForCategory('Hardware & Plumbing').map((p) => renderProductCard(p))}
              </div>
            </div>
          )}

          {/* SECTION C: ELECTRICAL SUPPLIES & LIGHTING (LED Bulbs, Extension Boards, Sockets, Tapes, Tester) */}
          {(selectedCategory === 'All' || selectedCategory === 'Electrical & Lighting') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E1D7] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
                      Electrical Supplies & Daily Home Electronics
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      9W LED bulbs, 4-way extension power strips, 16A switches, insulation tapes, line testers
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full">
                  Electricals
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {getProductsForCategory('Electrical & Lighting').map((p) => renderProductCard(p))}
              </div>
            </div>
          )}

          {/* SECTION D: CLOTHING, TOWELS & DAILY WEAR (Cotton T-shirts, Towels/Gamcha, Shorts, Raincoats) */}
          {(selectedCategory === 'All' || selectedCategory === 'Clothing & Apparel') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E1D7] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👕</span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
                      Clothing, Towels & Daily Wear
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      100% pure cotton round neck T-shirts, bath towels, cotton lounge shorts, hooded raincoats
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full">
                  Daily Wear
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {getProductsForCategory('Clothing & Apparel').map((p) => renderProductCard(p))}
              </div>
            </div>
          )}

          {/* SECTION E: KIRANA GROCERY & DAILY STAPLES */}
          {(selectedCategory === 'All' || selectedCategory === 'Grocery & Staples') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E1D7] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏪</span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
                      Kirana Grocery & Daily Staples
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Mustard oil, wheat atta, fresh toned milk, rice & pulses
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full">
                  Kirana
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {getProductsForCategory('Grocery & Staples').map((p) => renderProductCard(p))}
              </div>
            </div>
          )}

          {/* SECTION F: PHARMACY & HEALTHCARE */}
          {(selectedCategory === 'All' || selectedCategory === 'Pharmacy') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E1D7] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💊</span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
                      Pharmacy & Health Essentials
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Paracetamol, pain relief, health & daily medicines
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-full">
                  Pharmacy
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {getProductsForCategory('Pharmacy').map((p) => renderProductCard(p))}
              </div>
            </div>
          )}

          {/* SECTION G: LOCAL FOOD & HOT EATERIES */}
          {(selectedCategory === 'All' || selectedCategory === 'Food') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E8E1D7] pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍲</span>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight">
                      Local Food Corner & Snacks
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Special Kolkata Biryani, fresh snacks & local eatery pickup
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-full">
                  Hot Food
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {getProductsForCategory('Food').map((p) => renderProductCard(p))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historical Price Trend Modal */}
      {selectedProductHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="text-sm font-bold text-neutral-900">
                  {selectedProductHistory.product.name}
                </h4>
                <span className="text-xs text-neutral-500">
                  7-Day Mandi Price Fluctuation
                </span>
              </div>
              <button
                onClick={() => setSelectedProductHistory(null)}
                className="text-xs text-neutral-400 hover:text-neutral-800 font-bold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-neutral-50">
                <span className="text-[10px] text-neutral-400 block font-bold">Lowest</span>
                <span className="text-sm font-black text-emerald-600">
                  ₹{selectedProductHistory.stats.minPrice}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-50">
                <span className="text-[10px] text-neutral-400 block font-bold">Average</span>
                <span className="text-sm font-black text-neutral-800">
                  ₹{selectedProductHistory.stats.avgPrice}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-50">
                <span className="text-[10px] text-neutral-400 block font-bold">Highest</span>
                <span className="text-sm font-black text-rose-600">
                  ₹{selectedProductHistory.stats.maxPrice}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {selectedProductHistory.history.map((h: any, i: number) => (
                <div
                  key={i}
                  className="p-2 rounded-xl bg-neutral-50 flex items-center justify-between text-xs"
                >
                  <span className="text-neutral-500">
                    {new Date(h.recordedAt).toLocaleDateString()}
                  </span>
                  <span className="font-extrabold text-neutral-900">₹{h.recordedPrice}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
