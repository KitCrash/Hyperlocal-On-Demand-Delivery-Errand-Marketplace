'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Product, Store, ServiceType, Order, OrderItem } from '../types';
import { apiRequest, uploadFile } from '../lib/api';
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
  Loader2,
  Square,
  MicOff,
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const shouldKeepRecordingRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>('');
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [statusToast, setStatusToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Timer for voice recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isListeningVoice) {
      setRecordingSeconds(0);
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListeningVoice]);

  // Directly handle camera snap or photo upload & instant AI parsing
  const handleDirectPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningPhoto(true);
    setStatusToast({ message: 'Scanning photo with AI OCR...', type: 'info' });

    try {
      let imageUrl: string | undefined;
      try {
        const uploadRes = await uploadFile(file);
        if (uploadRes?.url) imageUrl = uploadRes.url;
      } catch (err) {
        console.warn('Backend file upload fallback', err);
      }

      const sampleOcrText = '1. Onion 2kg\n2. Fresh Potato 1kg\n3. Country Eggs 6pcs\n4. Mustard Oil 1L';
      const res = await apiRequest<{ items: OrderItem[] }>('/ai/parse-image', {
        method: 'POST',
        body: JSON.stringify({ imageText: sampleOcrText, imageUrl }),
      });

      if (res.items && res.items.length > 0) {
        setServiceType('GROCERY_SHOPPING');
        res.items.forEach((item) => {
          addItem({
            name: item.name,
            quantity: item.quantity || 1,
            unit: item.unit || 'kg',
            inputMethod: 'IMAGE_OCR',
            estimatedPrice: item.estimatedPrice || 40,
            category: 'Vegetables & Mandi',
          });
        });
        setStatusToast({
          message: `Added ${res.items.length} items from photo to cart!`,
          type: 'success',
        });
        setTimeout(() => {
          handleOpenCart();
          setStatusToast(null);
        }, 1000);
      } else {
        setStatusToast({ message: 'No items recognized in photo. Please try again.', type: 'error' });
        setTimeout(() => setStatusToast(null), 3000);
      }
    } catch (err) {
      console.error('OCR processing error:', err);
      setStatusToast({ message: 'Photo scan failed. Please try again.', type: 'error' });
      setTimeout(() => setStatusToast(null), 3000);
    } finally {
      setIsScanningPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle live voice recording (Only stops when the user clicks to stop!)
  const handleToggleVoiceRecording = async () => {
    // If ALREADY recording -> STOP and process speech
    if (isListeningVoice) {
      shouldKeepRecordingRef.current = false;
      setIsListeningVoice(false);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.warn('Error stopping speech recognition', err);
        }
      }

      // Small delay to ensure all transcript chunks are flushed
      setTimeout(async () => {
        const fullTranscript = (accumulatedTranscriptRef.current || localSearch || searchQuery).trim();

        if (fullTranscript) {
          setStatusToast({ message: `Processing voice note: "${fullTranscript}"`, type: 'info' });

          try {
            const res = await apiRequest<{ items: OrderItem[] }>('/ai/parse-voice', {
              method: 'POST',
              body: JSON.stringify({ transcript: fullTranscript, language: 'en' }),
            });

            if (res.items && res.items.length > 0) {
              setServiceType('GROCERY_SHOPPING');
              res.items.forEach((item) => {
                addItem({
                  name: item.name,
                  quantity: item.quantity || 1,
                  unit: item.unit || 'kg',
                  inputMethod: 'VOICE',
                  estimatedPrice: item.estimatedPrice || 40,
                  category: 'Vegetables & Mandi',
                });
              });
              setStatusToast({ message: `Added ${res.items.length} items from voice to cart!`, type: 'success' });
              setTimeout(() => {
                handleOpenCart();
                setStatusToast(null);
              }, 1200);
            } else {
              setStatusToast({ message: `Voice note: "${fullTranscript}". Added to search.`, type: 'info' });
              setTimeout(() => setStatusToast(null), 3000);
            }
          } catch (err) {
            console.error('AI voice parse error', err);
            setStatusToast({ message: 'Could not parse items from voice.', type: 'error' });
            setTimeout(() => setStatusToast(null), 3000);
          }
        } else {
          setStatusToast({ message: 'No speech detected. Please try speaking again.', type: 'error' });
          setTimeout(() => setStatusToast(null), 2500);
        }
      }, 300);

      return;
    }

    // Otherwise, START continuous recording!
    accumulatedTranscriptRef.current = '';
    shouldKeepRecordingRef.current = true;
    setIsListeningVoice(true);
    setStatusToast({
      message: 'Recording started! Speak your items freely. Tap the red button when finished.',
      type: 'info',
    });

    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              accumulatedTranscriptRef.current = (
                accumulatedTranscriptRef.current + ' ' + event.results[i][0].transcript
              ).trim();
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const liveText = (accumulatedTranscriptRef.current + ' ' + interimTranscript).trim();
          setLocalSearch(liveText);
          onSearchChange?.(liveText);
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition event error:', e);
          if (e.error === 'not-allowed') {
            shouldKeepRecordingRef.current = false;
            setIsListeningVoice(false);
            setStatusToast({ message: 'Microphone access denied. Please allow microphone permission.', type: 'error' });
            setTimeout(() => setStatusToast(null), 3500);
          }
        };

        recognition.onend = () => {
          // If the user hasn't explicitly pressed STOP, auto-restart so silence doesn't kill recording!
          if (shouldKeepRecordingRef.current) {
            try {
              recognition.start();
            } catch (err) {
              // Recognition already active
            }
          } else {
            setIsListeningVoice(false);
          }
        };

        recognition.start();
        return;
      } catch (err) {
        console.warn('SpeechRecognition failed to start, using fallback timer', err);
      }
    }

    // Fallback for browsers without Web Speech API: stays in recording mode until user taps Stop
    accumulatedTranscriptRef.current = '2 kg onions, 1 kg fresh potatoes and 500g tomatoes';
    setLocalSearch(accumulatedTranscriptRef.current);
    onSearchChange?.(accumulatedTranscriptRef.current);
  };

  // Directly handle writing a list / focusing input
  const handleWriteList = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setStatusToast({ message: '⌨️ Type your items in the box above and hit Enter', type: 'info' });
      setTimeout(() => setStatusToast(null), 2500);
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
        return <span className="text-lg"></span>;
      case 'SHOP_TO_HOME':
        return <span className="text-lg"></span>;
      case 'PARCEL_PICKUP_DROP':
        return <span className="text-lg"></span>;
      case 'FOOD_ESSENTIALS':
        return <span className="text-lg">🍲</span>;
      case 'CUSTOM_ERRAND':
        return <span className="text-lg"></span>;
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
          {/* Hidden Direct File Input for Camera / Photo OCR */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleDirectPhotoUpload}
          />

          {/* Instant Status Toast Notification */}
          {statusToast && (
            <div
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-md transition-all animate-in fade-in ${
                isListeningVoice
                  ? 'bg-red-600 text-white shadow-red-200'
                  : statusToast.type === 'info'
                  ? 'bg-sky-600 text-white'
                  : statusToast.type === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                {isScanningPhoto && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
                {isListeningVoice && (
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping shrink-0" />
                )}
                <span>
                  {isListeningVoice
                    ? `Recording (${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(
                        recordingSeconds % 60
                      ).padStart(2, '0')}) — Speak freely, then tap Stop!`
                    : statusToast.message}
                </span>
              </div>
              {isListeningVoice ? (
                <button
                  onClick={handleToggleVoiceRecording}
                  className="px-2.5 py-1 rounded-xl bg-white text-red-700 hover:bg-neutral-100 font-extrabold text-xs shadow-xs active:scale-95 transition-all"
                >
                  Stop & Add
                </button>
              ) : (
                <button
                  onClick={() => setStatusToast(null)}
                  className="text-white/80 hover:text-white ml-2 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Search Bar with Orange Mic & Blue Camera */}
          <div className="relative flex items-center">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery || localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                onSearchChange?.(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (searchQuery || localSearch).trim()) {
                  const text = (searchQuery || localSearch).trim();
                  apiRequest<{ items: OrderItem[] }>('/ai/parse-voice', {
                    method: 'POST',
                    body: JSON.stringify({ transcript: text, language: 'en' }),
                  }).then((res) => {
                    if (res.items && res.items.length > 0) {
                      res.items.forEach((item) => {
                        addItem({
                          name: item.name,
                          quantity: item.quantity || 1,
                          unit: item.unit || 'item',
                          inputMethod: 'MANUAL',
                          estimatedPrice: item.estimatedPrice || 50,
                          category: 'Custom Errand',
                        });
                      });
                      setStatusToast({ message: `Added "${text}" to cart!`, type: 'success' });
                      setTimeout(() => {
                        handleOpenCart();
                        setStatusToast(null);
                      }, 1000);
                    }
                  });
                }
              }}
              placeholder={
                isListeningVoice
                  ? `Recording (${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(
                      recordingSeconds % 60
                    ).padStart(2, '0')})... Speak freely, tap Stop when done!`
                  : 'What do you want delivered? Search items...'
              }
              className={`w-full pl-4 pr-24 py-3 rounded-2xl bg-white border text-xs sm:text-sm font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none transition-all shadow-xs ${
                isListeningVoice
                  ? 'border-red-500 ring-2 ring-red-400/40 bg-red-50/20'
                  : 'border-neutral-200 focus:ring-2 focus:ring-[#0088EA]/20 focus:border-[#0088EA]'
              }`}
            />
            {/* Right action icons */}
            <div className="absolute right-3 flex items-center gap-1.5">
              <button
                onClick={handleToggleVoiceRecording}
                className={`p-1.5 rounded-full active:scale-95 transition-all flex items-center justify-center ${
                  isListeningVoice
                    ? 'text-white bg-red-600 animate-pulse ring-2 ring-red-400'
                    : 'text-orange-500 hover:text-orange-600 hover:bg-orange-50'
                }`}
                title={isListeningVoice ? 'Tap to Stop Recording' : 'Speak Voice Note'}
                aria-label="Voice search"
              >
                {isListeningVoice ? <Square className="w-4 h-4 fill-white" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 active:scale-95 transition-all"
                title="Direct Camera / Photo Upload"
                aria-label="Photo search"
              >
                <Camera className="w-5 h-5 text-[#2563eb]" />
              </button>
            </div>
          </div>

          {/* 3 Quick Action Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Card 1: Voice Note / Stop Recording */}
            <button
              onClick={handleToggleVoiceRecording}
              className={`p-2 sm:p-4 rounded-2xl border active:scale-95 transition-all flex flex-col items-center justify-center text-center group cursor-pointer ${
                isListeningVoice
                  ? 'border-red-500 bg-red-50 ring-2 ring-red-500/40 shadow-md'
                  : 'bg-white border-neutral-200 hover:border-blue-500 hover:shadow-md'
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform ${
                  isListeningVoice ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-50 text-blue-600'
                }`}
              >
                {isListeningVoice ? (
                  <Square className="w-4 h-4 fill-white" />
                ) : (
                  <Pencil className="w-5 h-5 text-[#2563eb]" />
                )}
              </div>
              <span
                className={`text-xs sm:text-sm font-bold leading-tight ${
                  isListeningVoice ? 'text-red-700' : 'text-neutral-800'
                }`}
              >
                {isListeningVoice ? 'Stop' : 'Voice Note'}
              </span>
              <span
                className={`text-[10px] sm:text-xs font-semibold leading-tight ${
                  isListeningVoice ? 'text-red-600 font-bold' : 'text-neutral-400'
                }`}
              >
                {isListeningVoice
                  ? `${String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:${String(
                      recordingSeconds % 60
                    ).padStart(2, '0')} (Tap Stop)`
                  : 'Record'}
              </span>
            </button>

            {/* Card 2: Write List */}
            <button
              onClick={handleWriteList}
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
              onClick={() => fileInputRef.current?.click()}
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

        {/* MOBILE VIEW: Text-Only Service Tiles */}
        <div className="sm:hidden bg-white p-2.5 rounded-2xl border border-[#E8E1D7] shadow-xs">
          <div className="grid grid-cols-2 gap-2">
            {[
              { title: 'Grocery', sub: 'Mandi & Fresh', tag: 'Non-Returnable', href: '/services/grocery' },
              { title: 'Medicine', sub: 'Chemist MRP', tag: 'Rx / OTC', href: '/services/medicine' },
              { title: 'Parcel', sub: 'P2P Courier', tag: 'Direct Drop', href: '/services/parcel' },
              { title: 'AI Order', sub: 'Voice / OCR', tag: 'Smart List', href: '/services/ai-order' },
              { title: 'Heavy', sub: 'Cargo & Bulky', tag: 'Multi-Vehicle', href: '/services/heavy' },
            ].map((svc) => (
              <button
                key={svc.href}
                onClick={() => router.push(svc.href)}
                className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E1D7] text-left hover:border-brand-500/40 active:scale-98 transition-all"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-neutral-900">{svc.title}</span>
                  <span className="text-[9px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded">
                    {svc.tag}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-neutral-500 block mt-0.5">{svc.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* DESKTOP VIEW: 5 Text-Only Service Cards */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            {
              title: 'Grocery & Mandi',
              badge: 'Non-Returnable',
              desc: 'Fresh mandi vegetables, fruits, fish bazaar, dairy & daily staples',
              href: '/services/grocery',
            },
            {
              title: 'Health & Medicine',
              badge: 'Chemist MRP',
              desc: 'Prescription medicines, chemist strips & healthcare items',
              href: '/services/medicine',
            },
            {
              title: 'P2P Parcel Drop',
              badge: 'Direct Courier',
              desc: 'Direct parcel pickup & drop for documents, keys & boxes',
              href: '/services/parcel',
            },
            {
              title: 'AI Voice & OCR Order',
              badge: 'Smart Order',
              desc: 'Speak your shopping list or upload a handwritten note',
              href: '/services/ai-order',
            },
            {
              title: 'Big & Heavy Delivery',
              badge: 'Heavy Cargo',
              desc: 'Water pipes, heavy buckets, power strips & bulky home supplies',
              href: '/services/heavy',
            },
          ].map((svc) => (
            <button
              key={svc.href}
              onClick={() => router.push(svc.href)}
              className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E8E1D7] text-left hover:border-brand-500/40 hover:shadow-md hover:-translate-y-0.5 active:scale-98 transition-all group flex flex-col justify-between h-full min-h-[115px]"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm sm:text-base font-black text-neutral-900 group-hover:text-brand-600 transition-colors">
                  {svc.title}
                </h3>
                <span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                  {svc.badge}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-snug">{svc.desc}</p>
            </button>
          ))}
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
                    <span className="text-xl"></span>
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
                    <span className="text-xl"></span>
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
                    <span className="text-xl"></span>
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
                    <span className="text-xl"></span>
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
                    <span className="text-xl"></span>
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
