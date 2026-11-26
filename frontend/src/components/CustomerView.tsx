'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  MapPin,
  Pencil,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';

interface CustomerViewProps {
  onOpenAiAssistant: (initialTab?: 'voice' | 'image' | 'manual' | 'combined') => void;
  onOpenCart: () => void;
  onSelectService: (service: ServiceType) => void;
  onNavigateTab: (tab: string) => void;
  onSelectOrderToTrack?: (orderId: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  onOpenAiAssistant,
  onOpenCart,
  onSelectService,
  onNavigateTab,
  onSelectOrderToTrack,
  searchQuery = '',
  onSearchChange,
}) => {
  const router = useRouter();
  const { addItem, setServiceType, setPickupAddress } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedProductHistory, setSelectedProductHistory] = useState<any | null>(null);
  const [selectedArea, setSelectedArea] = useState('New Market');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const SERVICE_AREAS = [
    { id: 'new-market', name: 'New Market', region: 'Kolkata Central', defaultPickup: 'New Market Mandi & SS Hogg Market, Kolkata' },
    { id: 'new-town', name: 'New Town', region: 'Action Area 1', defaultPickup: 'New Town Fresh Vegetable & Fish Mandi, Stall #14' },
    { id: 'gariahat', name: 'Gariahat', region: 'South Kolkata', defaultPickup: 'Gariahat Daily Vegetable & Fish Market' },
    { id: 'salt-lake', name: 'Salt Lake', region: 'BD Block Market', defaultPickup: 'Salt Lake BD Block Daily Market' },
    { id: 'shyambazar', name: 'Hatibagan', region: 'North Kolkata', defaultPickup: 'Hatibagan Municipal Market Stall' },
    { id: 'koley-market', name: 'Koley Market', region: 'Sealdah Wholesale Yard', defaultPickup: 'Koley Market Wholesale Vegetable Yard, Sealdah' },
  ];

  const handleSelectArea = (area: (typeof SERVICE_AREAS)[0]) => {
    setSelectedArea(area.name);
    setPickupAddress(area.defaultPickup);
    setShowAreaDropdown(false);
  };

  const handleOpenCart = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      router.push('/cart');
    } else {
      onOpenCart();
    }
  };

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


  // Helper for Order Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full">Pending</span>;
      case 'ACCEPTED':
      case 'PARTNER_ASSIGNED':
        return <span className="text-xs bg-sky-100 text-sky-800 font-bold px-2.5 py-1 rounded-full">Assigned</span>;
      case 'SHOPPING':
        return <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2.5 py-1 rounded-full">Shopping</span>;
      case 'PRICE_APPROVAL_PENDING':
        return <span className="text-xs bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full">Price Approval</span>;
      case 'PURCHASED':
        return <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-full">Purchased</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full">In Transit</span>;
      case 'DELIVERED':
        return <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">Delivered</span>;
      default:
        return <span className="text-xs bg-neutral-100 text-neutral-700 font-bold px-2.5 py-1 rounded-full">{status.replace(/_/g, ' ')}</span>;
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
            {p.category} · {p.unit}
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
      {/* =========================================================================
          TATKAL HEADER & QUICK OPTIONS
          ========================================================================= */}
      <section className="w-full rounded-3xl overflow-hidden shadow-sm border border-[#0088EA]/20 bg-white">
        {/* Top Header Bar: "Add Item" + Location "Your Area: New Market" */}
        <div className="bg-[#0088EA] px-4 sm:px-6 py-3.5 flex items-center justify-between text-white relative">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white select-none">
              Add Item
            </h1>
          </div>

          {/* Location Area Selector */}
          <div className="relative">
            <button
              onClick={() => setShowAreaDropdown(!showAreaDropdown)}
              className="flex items-center gap-2 text-right hover:opacity-90 active:scale-95 transition-all focus:outline-none"
              title="Change Delivery Area"
            >
              <MapPin className="w-5 h-5 text-white shrink-0" />
              <div className="text-left leading-tight">
                <span className="text-[10px] sm:text-[11px] text-sky-100 font-medium block">
                  Your Area:
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm font-bold text-white block">
                    {selectedArea}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-sky-200" />
                </div>
              </div>
            </button>

            {/* Dropdown for Service Areas */}
            {showAreaDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-neutral-100 p-2 z-50 text-neutral-800 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 border-b border-neutral-100 mb-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                  Nearby Delivery Hubs
                </div>
                <div className="space-y-1">
                  {SERVICE_AREAS.map((area) => (
                    <button
                      key={area.id}
                      onClick={() => handleSelectArea(area)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                        selectedArea === area.name
                          ? 'bg-sky-50 text-sky-900 font-bold'
                          : 'hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <div>
                        <span className="block font-bold">{area.name}</span>
                        <span className="text-[10px] text-neutral-400">{area.region}</span>
                      </div>
                      {selectedArea === area.name && (
                        <Check className="w-3.5 h-3.5 text-sky-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar + 3 Quick Action Options */}
        <div className="p-3.5 sm:p-5 bg-white space-y-3 sm:space-y-4">
          {/* Search Bar with Orange Mic & Blue Camera */}
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery || localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                onSearchChange?.(e.target.value);
              }}
              placeholder="What do you want delivered? Search items..."
              className="w-full pl-4 pr-24 py-3 rounded-2xl bg-white border border-neutral-200 text-xs sm:text-sm font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#0088EA]/20 focus:border-[#0088EA] transition-all shadow-xs"
            />
            {/* Right action icons */}
            <div className="absolute right-3 flex items-center gap-1.5">
              <button
                onClick={() => onOpenAiAssistant('voice')}
                className="p-1.5 rounded-full text-orange-500 hover:text-orange-600 hover:bg-orange-50 active:scale-95 transition-all"
                title="AI Voice Order"
                aria-label="Voice search"
              >
                <Mic className="w-5 h-5 text-[#f97316]" />
              </button>
              <button
                onClick={() => onOpenAiAssistant('image')}
                className="p-1.5 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:scale-95 transition-all"
                title="AI Image OCR"
                aria-label="Photo search"
              >
                <Camera className="w-5 h-5 text-[#2563eb]" />
              </button>
            </div>
          </div>

          {/* 3 Quick Action Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Card 1: Voice Note */}
            <button
              onClick={() => onOpenAiAssistant('voice')}
              className="p-2 sm:p-4 rounded-2xl bg-white border border-neutral-200 hover:border-blue-500 hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 text-blue-600 group-hover:scale-110 transition-transform bg-blue-50">
                <Pencil className="w-5 h-5 text-[#2563eb]" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-neutral-800 leading-tight">
                Voice Note
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-neutral-400 leading-tight">
                Record
              </span>
            </button>

            {/* Card 2: Write List */}
            <button
              onClick={() => onOpenAiAssistant('manual')}
              className="p-2 sm:p-4 rounded-2xl bg-white border border-neutral-200 hover:border-blue-500 hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 text-blue-600 group-hover:scale-110 transition-transform bg-blue-50">
                <MessageSquare className="w-5 h-5 text-[#2563eb]" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-neutral-800 leading-tight">
                Write List
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-neutral-400 leading-tight">
                Type
              </span>
            </button>

            {/* Card 3: Upload Photo */}
            <button
              onClick={() => onOpenAiAssistant('image')}
              className="p-2 sm:p-4 rounded-2xl bg-white border border-neutral-200 hover:border-blue-500 hover:shadow-md active:scale-95 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 text-blue-600 group-hover:scale-110 transition-transform bg-blue-50">
                <Camera className="w-5 h-5 text-[#2563eb]" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-neutral-800 leading-tight">
                Upload Photo
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-neutral-400 leading-tight">
                Scan Slip
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. MAIN SERVICE CATEGORIES:
             - Mobile: Compact Icon Bubbles (Zepto / Blinkit / Swiggy Style)
             - Desktop: Preserved 5-Card Layout
          ========================================================================= */}
      <section className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-extrabold text-neutral-900 uppercase tracking-wider">
            Main Service Categories
          </h2>
          <span className="text-[11px] sm:text-xs text-brand-600 font-bold">5 Hyperlocal Services</span>
        </div>

        {/* MOBILE VIEW: Compact Icon Bubbles */}
        <div className="sm:hidden bg-white p-2.5 rounded-2xl border border-[#E8E1D7] shadow-xs">
          <div className="grid grid-cols-5 gap-1">
            {/* Bubble 1: Grocery Order */}
            <button
              onClick={() => {
                setSelectedCategory('Vegetables & Mandi');
                setServiceType('GROCERY_SHOPPING');
                onSelectService('GROCERY_SHOPPING');
              }}
              className="flex flex-col items-center text-center group active:scale-90 transition-transform focus:outline-none"
            >
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-b from-emerald-50 to-emerald-100 border border-emerald-200/80 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                🥦
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[7px] font-black px-1 py-0.2 rounded-full uppercase tracking-tighter shadow-xs">
                  Fresh
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-neutral-900 mt-1 leading-tight truncate w-full">
                Grocery
              </span>
              <span className="text-[9px] font-semibold text-neutral-400 -mt-0.5">
                Mandi
              </span>
            </button>

            {/* Bubble 2: Health & Medicine */}
            <button
              onClick={() => {
                setSelectedCategory('Pharmacy');
                setServiceType('CUSTOM_ERRAND');
                onSelectService('CUSTOM_ERRAND');
              }}
              className="flex flex-col items-center text-center group active:scale-90 transition-transform focus:outline-none"
            >
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-b from-rose-50 to-rose-100 border border-rose-200/80 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                💊
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[7px] font-black px-1 py-0.2 rounded-full uppercase tracking-tighter shadow-xs">
                  MRP
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-neutral-900 mt-1 leading-tight truncate w-full">
                Medicine
              </span>
              <span className="text-[9px] font-semibold text-neutral-400 -mt-0.5">
                Chemist
              </span>
            </button>

            {/* Bubble 3: P2P Delivery */}
            <button
              onClick={() => {
                setServiceType('PARCEL_PICKUP_DROP');
                onSelectService('PARCEL_PICKUP_DROP');
                handleOpenCart();
              }}
              className="flex flex-col items-center text-center group active:scale-90 transition-transform focus:outline-none"
            >
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-b from-sky-50 to-sky-100 border border-sky-200/80 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                📦
                <span className="absolute -top-1 -right-1 bg-sky-600 text-white text-[7px] font-black px-1 py-0.2 rounded-full uppercase tracking-tighter shadow-xs">
                  P2P
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-neutral-900 mt-1 leading-tight truncate w-full">
                Parcel
              </span>
              <span className="text-[9px] font-semibold text-neutral-400 -mt-0.5">
                Courier
              </span>
            </button>

            {/* Bubble 4: Hybrid AI Order */}
            <button
              onClick={() => onOpenAiAssistant('voice')}
              className="flex flex-col items-center text-center group active:scale-90 transition-transform focus:outline-none"
            >
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-b from-amber-100 to-amber-200 border border-amber-300 ring-2 ring-amber-400/40 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                ✨
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[7px] font-black px-1 py-0.2 rounded-full uppercase tracking-tighter shadow-xs">
                  AI
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-neutral-900 mt-1 leading-tight truncate w-full">
                AI Order
              </span>
              <span className="text-[9px] font-semibold text-neutral-400 -mt-0.5">
                Voice/OCR
              </span>
            </button>

            {/* Bubble 5: Big & Heavy Delivery */}
            <button
              onClick={() => {
                setSelectedCategory('Hardware & Plumbing');
                setServiceType('CUSTOM_ERRAND');
                onSelectService('CUSTOM_ERRAND');
              }}
              className="flex flex-col items-center text-center group active:scale-90 transition-transform focus:outline-none"
            >
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-b from-purple-50 to-purple-100 border border-purple-200/80 flex items-center justify-center text-2xl shadow-xs group-hover:scale-105 transition-transform">
                🚚
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[7px] font-black px-1 py-0.2 rounded-full uppercase tracking-tighter shadow-xs">
                  Heavy
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-neutral-900 mt-1 leading-tight truncate w-full">
                Heavy
              </span>
              <span className="text-[9px] font-semibold text-neutral-400 -mt-0.5">
                Cargo
              </span>
            </button>
          </div>
        </div>

        {/* DESKTOP VIEW: 5 Expanded Cards */}
        <div className="hidden sm:block space-y-3">
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
                handleOpenCart();
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
                  Voice order in English/Hindi or upload shopping list photo
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
          4. QUICK ACTIONS SECTION: One small, clean "+ Add" button
          ========================================================================= */}
      <section className="flex items-center">
        <button
          onClick={handleOpenCart}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E1D7] hover:border-brand-500/50 hover:bg-neutral-50 shadow-xs text-xs font-bold text-neutral-800 transition-all active:scale-95 group"
          title="Add items or custom errand"
        >
          <Plus className="w-3.5 h-3.5 text-brand-600 group-hover:rotate-90 transition-transform" />
          <span>Add</span>
        </button>
      </section>

      {/* =========================================================================
          5. ORDER HISTORY SECTION: Matches "Browse Daily Mandi" list layout
          ========================================================================= */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#E8E1D7]">
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
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 group py-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {loadingOrders ? (
          <div className="space-y-2 py-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-11 rounded-xl bg-neutral-200/60 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-xs text-neutral-400 py-2 font-medium">No orders yet</p>
        ) : (
          <div>
            {orders.slice(0, 5).map((ord) => {
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
                  onClick={() => {
                    if (onSelectOrderToTrack) {
                      onSelectOrderToTrack(ord.id);
                    } else {
                      onNavigateTab('orders');
                    }
                  }}
                  className="flex items-center justify-between border-b border-[#E8E1D7] py-2.5 sm:py-3 cursor-pointer hover:bg-black/[0.015] -mx-1 px-1 rounded-lg transition-colors group"
                >
                  {/* Left: Small service icon + Order name & details */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span className="text-xl shrink-0">{getServiceIcon(ord.serviceType)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-extrabold text-neutral-900 group-hover:text-brand-600 transition-colors truncate">
                          {serviceLabel}
                        </h4>
                        <span className="text-[10px] text-neutral-400 font-mono font-medium shrink-0">
                          {ord.orderNumber}
                        </span>
                      </div>
                      {/* Date and amount below the order name */}
                      <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                        {formattedDate} · <span className="font-bold text-neutral-800">₹{ord.totalAmount || ord.actualProductTotal || ord.estimatedProductTotal || 0}</span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Order status badge */}
                  <div className="shrink-0 pl-2">
                    {getStatusBadge(ord.status)}
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
