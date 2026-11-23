'use client';

import React, { useState, useEffect } from 'react';
import { Product, Store, ServiceType, Order } from '../types';
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
  RotateCcw,
  Compass,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Truck,
  HeartPulse,
  ShoppingBasket,
  Zap,
} from 'lucide-react';

interface CustomerViewProps {
  onOpenAiAssistant: (initialTab?: 'voice' | 'image' | 'manual' | 'combined') => void;
  onOpenCart: () => void;
  onSelectService: (service: ServiceType) => void;
  onNavigateTab: (tab: string) => void;
  onSelectOrderToTrack?: (orderId: string) => void;
  searchQuery?: string;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  onOpenAiAssistant,
  onOpenCart,
  onSelectService,
  onNavigateTab,
  onSelectOrderToTrack,
  searchQuery = '',
}) => {
  const { addItem, setServiceType } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedProductHistory, setSelectedProductHistory] = useState<any | null>(null);
  const [reorderSuccessNotice, setReorderSuccessNotice] = useState<string | null>(null);

  // Rotating Hero Banner State (Changes every 1 second)
  const promoSlides = [
    {
      id: 1,
      badge: '🌾 Rural & Hyperlocal Daily Mandi',
      title: 'Fresh Produce & Daily Mandi in 30 Mins',
      desc: 'Unpriced vegetable mandi produce verified at the counter by nearby riders with 100% price approval guarantee.',
      cta: 'Order Mandi Fresh',
      service: 'GROCERY_SHOPPING' as ServiceType,
      category: 'Vegetables & Mandi',
      tag: 'Verified Mandi Rates',
      icon: '🥦',
    },
    {
      id: 2,
      badge: '🎙️ Multilingual AI Assistant',
      title: 'Speak Bengali, Hindi or English – AI Orders Instantly',
      desc: 'Smart voice recognition & handwritten OCR automatically extract items and merge duplicates into an editable list.',
      cta: 'Try Voice Assistant',
      service: 'GROCERY_SHOPPING' as ServiceType,
      category: 'All',
      tag: 'Voice & OCR Powered',
      icon: '✨',
    },
    {
      id: 3,
      badge: '📦 Peer-to-Peer Express Delivery',
      title: 'P2P Parcel Pickup & Drop Across Town',
      desc: 'Send documents, keys, forgotten lunchboxes, or packages with dedicated nearby riders and live GPS radar.',
      cta: 'Book Parcel Drop',
      service: 'PARCEL_PICKUP_DROP' as ServiceType,
      category: 'All',
      tag: 'Pickup in 10 Mins',
      icon: '📦',
    },
    {
      id: 4,
      badge: '💊 Transparent Pharmacy Errand',
      title: 'Health Essentials & Prescription Chemist Supplies',
      desc: 'Emergency medicines, pain relief strips, and surgical supplies fetched from licensed neighborhood chemists at MRP.',
      cta: 'Order Medicines',
      service: 'CUSTOM_ERRAND' as ServiceType,
      category: 'Pharmacy',
      tag: '100% Genuine MRP',
      icon: '💊',
    },
    {
      id: 5,
      badge: '🚚 Big & Bulky Logistics',
      title: 'Big & Heavy Utility, Hardware & Appliance Delivery',
      desc: 'Water pipes, buckets, extension boards, and bulky hardware items delivered right to your door with care.',
      cta: 'Heavy Errand Delivery',
      service: 'CUSTOM_ERRAND' as ServiceType,
      category: 'Hardware & Plumbing',
      tag: 'Heavy Errand Friendly',
      icon: '🔧',
    },
  ];

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideFade, setSlideFade] = useState(false);

  // Automatically rotate promotional message every 1 second (1000ms) with smooth transitions
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideFade(true);
      setTimeout(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % promoSlides.length);
        setSlideFade(false);
      }, 150);
    }, 1000);

    return () => clearInterval(timer);
  }, [promoSlides.length]);

  // Load products, stores, and recent real orders
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

    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await apiRequest<{ orders: Order[] }>('/orders');
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

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

  // Helper to filter products
  const getProductsForCategory = (catName: string) => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameBengali?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameHindi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

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

  // Quick Action 1: Re-Order Last / Popular Items
  const handleQuickReorder = () => {
    const popularStaples = products.slice(0, 3);
    if (popularStaples.length > 0) {
      popularStaples.forEach((p) => {
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
      });
      setReorderSuccessNotice('Added 3 everyday mandi items to your cart!');
      setTimeout(() => setReorderSuccessNotice(null), 3000);
      onOpenCart();
    }
  };

  const activeSlide = promoSlides[currentSlideIndex];

  // Helper for Order Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">Pending Rider</span>;
      case 'ACCEPTED':
      case 'PARTNER_ASSIGNED':
        return <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-bold">Partner Assigned</span>;
      case 'SHOPPING':
        return <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200 text-[10px] font-bold">Shopping in Mandi</span>;
      case 'PRICE_APPROVAL_PENDING':
        return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 text-[10px] font-bold">Price Approval</span>;
      case 'PURCHASED':
        return <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">Purchased</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">Out for Delivery</span>;
      case 'DELIVERED':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">Delivered</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 text-[10px] font-bold">{status.replace(/_/g, ' ')}</span>;
    }
  };

  // Helper for Service Category Icon
  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'GROCERY_SHOPPING':
        return <span className="text-lg">🥦</span>;
      case 'SHOP_TO_HOME':
        return <span className="text-lg">🏪</span>;
      case 'PARCEL_PICKUP_DROP':
        return <span className="text-lg">📦</span>;
      case 'FOOD_ESSENTIALS':
        return <span className="text-lg">🍲</span>;
      case 'CUSTOM_ERRAND':
        return <span className="text-lg">⚡</span>;
      default:
        return <Package className="w-4 h-4 text-brand-600" />;
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
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md text-neutral-700 flex items-center justify-center hover:bg-white shadow-sm transition-colors"
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
    <div className="space-y-6 sm:space-y-7 max-w-7xl mx-auto pb-20 md:pb-8">
      {/* Toast / Notification when reorder is triggered */}
      {reorderSuccessNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{reorderSuccessNotice}</span>
          </div>
          <button onClick={() => setReorderSuccessNotice(null)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          2. HERO BANNER: Full-width, rotating text every 1s with smooth transitions
          ========================================================================= */}
      <section className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-r from-[#F4DAC4] via-[#EBBDA0] to-[#E3A378] p-6 sm:p-8 shadow-sm border border-[#E5C7B0] transition-all">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left Text Content (Smoothly fades and slides every 1 second) */}
          <div className={`space-y-3 max-w-xl text-center md:text-left transition-all duration-200 ${
            slideFade ? 'opacity-40 translate-y-1' : 'opacity-100 translate-y-0'
          }`}>
            <span className="inline-block px-3 py-1 rounded-full bg-white/80 backdrop-blur-md text-[11px] font-extrabold text-brand-900 uppercase tracking-wider shadow-sm">
              {activeSlide.badge}
            </span>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-neutral-900 tracking-tight leading-tight">
              {activeSlide.title}
            </h1>

            <p className="text-xs sm:text-sm text-neutral-800/85 leading-relaxed font-medium">
              {activeSlide.desc}
            </p>

            <div className="pt-2 flex flex-wrap gap-2.5 justify-center md:justify-start">
              <button
                onClick={() => {
                  if (activeSlide.id === 2) {
                    onOpenAiAssistant('voice');
                  } else {
                    setServiceType(activeSlide.service);
                    if (activeSlide.category !== 'All') {
                      setSelectedCategory(activeSlide.category);
                    }
                    onOpenCart();
                  }
                }}
                className="py-2.5 px-6 rounded-full bg-neutral-900 text-white text-xs sm:text-sm font-extrabold hover:bg-neutral-800 shadow-md active:scale-95 transition-transform"
              >
                {activeSlide.cta}
              </button>

              <button
                onClick={() => onOpenAiAssistant('voice')}
                className="py-2.5 px-5 rounded-full bg-white/90 text-brand-900 text-xs sm:text-sm font-extrabold hover:bg-white shadow-sm transition-all flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5 text-brand-600" />
                <span>Voice Order</span>
              </button>
            </div>
          </div>

          {/* Right Visual Image & Live Rates Tag */}
          <div className="relative w-44 sm:w-60 h-44 sm:h-52 shrink-0 flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=500"
              alt="Hyperlocal Errands"
              className="w-full h-full object-cover rounded-3xl shadow-xl border-4 border-white/70"
            />
            {/* Live rates badge - Clean, solid, no blinking dots */}
            <div className="absolute -bottom-2 -left-2 bg-white px-3 py-1.5 rounded-2xl shadow-lg border border-neutral-100 flex items-center gap-1.5 text-xs font-bold text-neutral-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{activeSlide.tag}</span>
            </div>
          </div>
        </div>

        {/* 1-Second Slide Indicator Dots */}
        <div className="mt-5 flex items-center justify-center gap-1.5">
          {promoSlides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlideIndex === idx
                  ? 'w-6 bg-neutral-900'
                  : 'w-2 bg-neutral-800/30 hover:bg-neutral-800/50'
              }`}
              title={`Slide ${idx + 1}`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* =========================================================================
          3. MAIN SERVICE CATEGORIES: 5 Cards (Row 1: 3 cards, Row 2: 2 cards centered)
          ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider">
            Main Service Categories
          </h2>
          <span className="text-xs text-brand-600 font-bold">5 Hyperlocal Services</span>
        </div>

        <div className="space-y-3">
          {/* Row 1: 3 cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Card 1: Grocery Order */}
            <button
              onClick={() => {
                setSelectedCategory('Vegetables & Mandi');
                setServiceType('GROCERY_SHOPPING');
                onSelectService('GROCERY_SHOPPING');
              }}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E8E1D7] text-left hover:border-brand-500/40 hover:shadow-md hover:-translate-y-0.5 active:scale-98 transition-all group flex flex-col justify-between h-full min-h-[125px]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                  🥦
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Mandi Fresh
                </span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-neutral-900 group-hover:text-brand-600 transition-colors">
                  Grocery Order
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                  Fresh mandi vegetables, fish bazaar, dairy & daily staples
                </p>
              </div>
            </button>

            {/* Card 2: Health & Medicine */}
            <button
              onClick={() => {
                setSelectedCategory('Pharmacy');
                setServiceType('CUSTOM_ERRAND');
                onSelectService('CUSTOM_ERRAND');
              }}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E8E1D7] text-left hover:border-brand-500/40 hover:shadow-md hover:-translate-y-0.5 active:scale-98 transition-all group flex flex-col justify-between h-full min-h-[125px]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                  💊
                </div>
                <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full">
                  Chemist MRP
                </span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-neutral-900 group-hover:text-brand-600 transition-colors">
                  Health & Medicine
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                  Prescription medicines, chemist strips & healthcare items
                </p>
              </div>
            </button>

            {/* Card 3: P2P Delivery */}
            <button
              onClick={() => {
                setServiceType('PARCEL_PICKUP_DROP');
                onSelectService('PARCEL_PICKUP_DROP');
                onOpenCart();
              }}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E8E1D7] text-left hover:border-brand-500/40 hover:shadow-md hover:-translate-y-0.5 active:scale-98 transition-all group flex flex-col justify-between h-full min-h-[125px]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                  📦
                </div>
                <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full">
                  Person to Person
                </span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-neutral-900 group-hover:text-brand-600 transition-colors">
                  P2P Delivery
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                  Direct parcel pickup & drop for documents, keys & boxes
                </p>
              </div>
            </button>
          </div>

          {/* Row 2: 2 cards centered */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            {/* Card 4: Hybrid AI Order */}
            <button
              onClick={() => onOpenAiAssistant('voice')}
              className="w-full sm:w-[calc(33.333%-0.75rem)] p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-left hover:border-brand-500/50 hover:shadow-md hover:-translate-y-0.5 active:scale-98 transition-all group flex flex-col justify-between min-h-[125px]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-neutral-950 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                  ✨
                </div>
                <span className="text-[10px] font-black text-amber-950 bg-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Voice / OCR
                </span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-neutral-900 group-hover:text-brand-600 transition-colors">
                  Hybrid AI Order
                </h3>
                <p className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                  Speak in Bengali/Hindi or upload handwritten photo list
                </p>
              </div>
            </button>

            {/* Card 5: Big & Heavy Delivery */}
            <button
              onClick={() => {
                setSelectedCategory('Hardware & Plumbing');
                setServiceType('CUSTOM_ERRAND');
                onSelectService('CUSTOM_ERRAND');
              }}
              className="w-full sm:w-[calc(33.333%-0.75rem)] p-4 sm:p-5 rounded-3xl bg-white border border-[#E8E1D7] text-left hover:border-brand-500/40 hover:shadow-md hover:-translate-y-0.5 active:scale-98 transition-all group flex flex-col justify-between min-h-[125px]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                  🚚
                </div>
                <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full">
                  Heavy Cargo
                </span>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-neutral-900 group-hover:text-brand-600 transition-colors">
                  Big & Heavy Delivery
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                  Water pipes, heavy buckets, power strips & home supplies
                </p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. QUICK ACTIONS SECTION: 3 compact horizontal action buttons
          ========================================================================= */}
      <section className="space-y-2">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Quick Action 1: Re-Order Last Items */}
          <button
            onClick={handleQuickReorder}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-2xl bg-white border border-[#E8E1D7] hover:border-brand-500/40 hover:bg-neutral-50 shadow-sm active:scale-95 transition-all text-neutral-800"
            title="Quick Re-Order Everyday Essentials"
          >
            <RotateCcw className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="text-[11px] sm:text-xs font-black truncate">Quick Re-Order</span>
          </button>

          {/* Quick Action 2: Live Tracking Radar */}
          <button
            onClick={() => onNavigateTab('orders')}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-2xl bg-white border border-[#E8E1D7] hover:border-brand-500/40 hover:bg-neutral-50 shadow-sm active:scale-95 transition-all text-neutral-800"
            title="Track Active Delivery Orders"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-[11px] sm:text-xs font-black truncate">Live Tracking</span>
          </button>

          {/* Quick Action 3: Upload Prescription / Bill */}
          <button
            onClick={() => onOpenAiAssistant('image')}
            className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-2xl bg-white border border-[#E8E1D7] hover:border-brand-500/40 hover:bg-neutral-50 shadow-sm active:scale-95 transition-all text-neutral-800"
            title="Scan Prescription or Handwritten Shopping List"
          >
            <Camera className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="text-[11px] sm:text-xs font-black truncate">Upload Rx / Bill</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          5. ORDER HISTORY SECTION: Vertically stacked rows of real orders
          ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
              Order History
            </h2>
            <p className="text-[11px] text-neutral-500">
              Recent orders with live status, dynamic amounts & details
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1 group py-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {loadingOrders ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-neutral-200 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white border border-[#E8E1D7] text-center space-y-2 shadow-xs">
            <Package className="w-8 h-8 text-neutral-300 mx-auto" />
            <h4 className="text-xs font-bold text-neutral-700">No Orders Placed Yet</h4>
            <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
              Select any of the 5 service categories above or tap Voice Order to experience our hyperlocal errand service!
            </p>
            <button
              onClick={() => {
                setSelectedCategory('Vegetables & Mandi');
                setServiceType('GROCERY_SHOPPING');
              }}
              className="mt-2 py-1.5 px-4 rounded-full bg-neutral-900 text-white text-[11px] font-bold hover:bg-neutral-800 transition-colors"
            >
              Start First Order
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.slice(0, 4).map((ord) => {
              const formattedDate = new Date(ord.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const serviceLabel =
                ord.serviceType === 'GROCERY_SHOPPING'
                  ? 'Grocery Order'
                  : ord.serviceType === 'SHOP_TO_HOME'
                  ? 'Shop-to-Home Delivery'
                  : ord.serviceType === 'PARCEL_PICKUP_DROP'
                  ? 'P2P Parcel Delivery'
                  : ord.serviceType === 'FOOD_ESSENTIALS'
                  ? 'Food & Local Eatery'
                  : 'Hyperlocal Errand';

              return (
                <div
                  key={ord.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E8E1D7] shadow-xs hover:shadow-sm hover:border-brand-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  {/* Left: Icon + Service Name + Date */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center shrink-0 border border-neutral-200">
                      {getServiceIcon(ord.serviceType)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 truncate">
                          {serviceLabel}
                        </h4>
                        <span className="text-[10px] text-neutral-400 font-mono font-bold">
                          {ord.orderNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {formattedDate}
                      </p>
                    </div>
                  </div>

                  {/* Right: Status badge + Total Amount + View Details Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                    <div className="text-left sm:text-right">
                      <div className="text-xs sm:text-sm font-black text-neutral-900">
                        ₹{ord.totalAmount || ord.actualProductTotal || ord.estimatedProductTotal || 0}
                      </div>
                      <div className="mt-0.5">{getStatusBadge(ord.status)}</div>
                    </div>

                    <button
                      onClick={() => {
                        if (onSelectOrderToTrack) {
                          onSelectOrderToTrack(ord.id);
                        } else {
                          onNavigateTab('orders');
                        }
                      }}
                      className="py-1.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-800 text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-xs"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =========================================================================
          PRODUCT CATALOGUE & PRESERVED CATEGORY SECTIONS
          ========================================================================= */}
      <section className="space-y-5 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
            Browse Daily Mandi & Local Stores
          </h2>
          {searchQuery && (
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
              Matching: "{searchQuery}"
            </span>
          )}
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

        {/* Product Cards Grid by Category */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-neutral-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* SECTION A: FRESH FARM MANDI & PRODUCE */}
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

            {/* SECTION B: HARDWARE, PLUMBING & WATER UTILITIES */}
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

            {/* SECTION C: ELECTRICAL SUPPLIES & LIGHTING */}
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

            {/* SECTION D: CLOTHING, TOWELS & DAILY WEAR */}
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
      </section>

      {/* Historical Price Trend Modal */}
      {selectedProductHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
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
