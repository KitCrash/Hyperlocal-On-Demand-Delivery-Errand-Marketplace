'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Mic,
  Camera,
  Upload,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Volume2,
  FileText,
  Search,
  RefreshCw,
  X,
  Edit2,
  Check,
  Info,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Clock,
  MapPin,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  Store,
} from 'lucide-react';
import { OrderItem, Product, Advertisement } from '../types';
import { apiRequest, uploadFile } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface AIHybridOrderAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout?: () => void;
  onOrderCreated?: (orderId: string) => void;
  initialTab?: 'voice' | 'image' | 'manual' | 'combined';
}

// Fallback initial advertisements if API is unreachable
const DEFAULT_BANNER_ADS: Advertisement[] = [
  {
    id: 'ad-banner-1',
    title: 'Royal Heritage Solid Teak Furniture',
    description: 'Flat 35% Off on handmade wooden dining sets, coffee tables, and study desks. Direct delivery available in New Town.',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
    linkUrl: 'https://example.com/furniture-sale',
    badge: '🛋️ Local Furniture Offer',
    category: 'FURNITURE',
    type: 'BANNER',
    isActive: true,
  },
  {
    id: 'ad-banner-2',
    title: 'Modern Household & Kitchenware Essentials',
    description: 'Heavy duty plastic storage buckets, stainless steel utensils & cleaning supplies starting at ₹149. Stall #8 New Town Market.',
    imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=800',
    linkUrl: 'https://example.com/household-essentials',
    badge: '🏠 Household Super Saver',
    category: 'HOUSEHOLD',
    type: 'BANNER',
    isActive: true,
  },
  {
    id: 'ad-banner-3',
    title: 'Sharma Electricals & Modular Hardware',
    description: 'Buy 2 Get 1 Free on 9W Energy Saver LED Bulbs, extension power strips and copper wiring cables.',
    imageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800',
    linkUrl: 'https://example.com/local-hardware',
    badge: '⚡ Local Shop Promotion',
    category: 'LOCAL_SHOP',
    type: 'BANNER',
    isActive: true,
  },
];

const DEFAULT_COMPACT_ADS: Advertisement[] = [
  {
    id: 'ad-compact-1',
    title: 'City Carpentry & Doorstep Furniture Repair',
    description: '2-hour emergency latch, hinge, sofa fix & polish service in New Town. Call or request errand pickup.',
    imageUrl: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400',
    linkUrl: 'https://example.com/local-carpentry',
    badge: '🔨 Local Service Spotlight',
    category: 'LOCAL_SHOP',
    type: 'COMPACT',
    isActive: true,
  },
  {
    id: 'ad-compact-2',
    title: 'GreenPlant Home Nursery & Pots',
    description: 'Indoor plants, terracotta pots & organic potting mix delivered in 30 mins.',
    imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400',
    linkUrl: 'https://example.com/local-nursery',
    badge: '🌿 Green Living',
    category: 'HOUSEHOLD',
    type: 'COMPACT',
    isActive: true,
  },
];

export const AIHybridOrderAssistant: React.FC<AIHybridOrderAssistantProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  onOrderCreated,
  initialTab,
}) => {
  const { addItem, setPickupAddress } = useCart();
  const { user } = useAuth();

  // Navigation state within Hybrid Order Page
  const [currentPage, setCurrentPage] = useState<'input' | 'review'>('input');

  // Input states
  const [textInput, setTextInput] = useState('');
  const [selectedQuickCard, setSelectedQuickCard] = useState<'handwritten' | 'voice' | 'upload' | null>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedVoiceLanguage, setSelectedVoiceLanguage] = useState<'bn' | 'hi' | 'en'>('en');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Image & OCR upload states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extracted shopping list (editable list)
  const [shoppingList, setShoppingList] = useState<OrderItem[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingQty, setEditingQty] = useState<number>(1);
  const [editingUnit, setEditingUnit] = useState('kg');

  // Manual item add popover/mode
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [manualUnit, setManualUnit] = useState('kg');
  const [manualPrice, setManualPrice] = useState('40');

  // Backend sample prompts & OCR slips
  const [samples, setSamples] = useState<any>(null);

  // Advertisements state
  const [bannerAds, setBannerAds] = useState<Advertisement[]>(DEFAULT_BANNER_ADS);
  const [compactAds, setCompactAds] = useState<Advertisement[]>(DEFAULT_COMPACT_ADS);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Policy Modal state
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Validation & Error state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Order Review & Submission state
  const [deliveryAddress, setDeliveryAddress] = useState(
    'Flat 4B, Greenfield Heights, Action Area 1, New Town, Kolkata - 700156'
  );
  const [pickupLocation, setPickupLocation] = useState('New Town Fresh Vegetable & Fish Mandi, Stall #14');
  const [errandNotes, setErrandNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI_ONLINE' | 'DIRECT_UPI'>('COD');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isOrderPlacedSuccess, setIsOrderPlacedSuccess] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  // Initial tab setup
  useEffect(() => {
    if (initialTab && isOpen) {
      if (initialTab === 'voice') setSelectedQuickCard('voice');
      else if (initialTab === 'image') setSelectedQuickCard('handwritten');
      else if (initialTab === 'manual') setSelectedQuickCard(null);
    }
  }, [initialTab, isOpen]);

  // Load sample prompts & advertisements from backend
  useEffect(() => {
    if (isOpen) {
      // 1. Samples
      apiRequest<{ samples: any }>('/ai/sample-prompts')
        .then((data) => {
          if (data?.samples) setSamples(data.samples);
        })
        .catch(() => {});

      // 2. Advertisements
      apiRequest<{ advertisements: Advertisement[] }>('/advertisements')
        .then((data) => {
          if (data?.advertisements && data.advertisements.length > 0) {
            const banners = data.advertisements.filter((ad) => ad.type === 'BANNER' && ad.isActive);
            const compacts = data.advertisements.filter((ad) => ad.type === 'COMPACT' && ad.isActive);
            if (banners.length > 0) setBannerAds(banners);
            if (compacts.length > 0) setCompactAds(compacts);
          }
        })
        .catch(() => {
          // Use default fallback ads
        });
    }
  }, [isOpen]);

  // Auto-rotate advertisement banner every 4 seconds
  useEffect(() => {
    if (bannerAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerAds.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerAds.length]);

  // Voice recording timer simulation
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Calculate shopping list totals
  const estimatedProductTotal = shoppingList.reduce((acc, item) => acc + (item.estimatedPrice || 0) * (item.quantity || 1), 0);
  const deliveryFee = 35;
  const platformFee = 10;
  const grandTotal = estimatedProductTotal + deliveryFee + platformFee;

  // Toggle Voice Recording
  const handleToggleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      let simulatedTranscript = '';
      if (selectedVoiceLanguage === 'en') {
        simulatedTranscript =
          samples?.english?.[0] || '2 kg onions, 1 kg fresh potatoes and 500g tomatoes';
      } else if (selectedVoiceLanguage === 'hi') {
        simulatedTranscript =
          samples?.hindi?.[0] || '2 kg Nashik onions, 1 kg potatoes and 500g tomatoes';
      } else {
        simulatedTranscript =
          samples?.bengali?.[0] || '2 Desi red onions, 1 kg potatoes and 250g green chillies';
      }
      setVoiceTranscript(simulatedTranscript);
      processVoiceTranscript(simulatedTranscript);
    } else {
      setIsRecording(true);
      setValidationError(null);
    }
  };

  // Process Voice Transcript with AI
  const processVoiceTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;
    setIsProcessingVoice(true);
    setValidationError(null);
    try {
      const res = await apiRequest<{ items: OrderItem[] }>('/ai/parse-voice', {
        method: 'POST',
        body: JSON.stringify({ transcript, language: selectedVoiceLanguage }),
      });

      if (res.items && res.items.length > 0) {
        setShoppingList((prev) => [...prev, ...res.items]);
        // Also append to input text for visibility
        setTextInput((prev) => (prev ? `${prev}, ${transcript}` : transcript));
      }
    } catch (err) {
      console.error('Voice parsing failed', err);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Process Image OCR with AI
  const processImageOCR = async (text: string, previewUrl?: string) => {
    setIsProcessingImage(true);
    setValidationError(null);
    try {
      if (previewUrl) setImagePreview(previewUrl);
      const res = await apiRequest<{ items: OrderItem[] }>('/ai/parse-image', {
        method: 'POST',
        body: JSON.stringify({ imageText: text, imageUrl: previewUrl }),
      });

      if (res.items && res.items.length > 0) {
        setShoppingList((prev) => [...prev, ...res.items]);
      }
    } catch (err) {
      console.error('Image parsing failed', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Handle local image file upload from device
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local object URL for instant preview
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);
    setIsProcessingImage(true);
    setValidationError(null);

    try {
      // 1. Try uploading to backend upload route
      let uploadedUrl = localUrl;
      try {
        const uploadRes = await uploadFile(file);
        if (uploadRes?.url) uploadedUrl = uploadRes.url;
      } catch (uploadErr) {
        // Continue with local preview if offline
      }

      // 2. Perform OCR parsing via AI backend
      const simulatedOcrText = '1. Onion 2kg\n2. Fresh Potato 1kg\n3. Country Eggs 6pcs\n4. Mustard Oil 1L';
      const res = await apiRequest<{ items: OrderItem[] }>('/ai/parse-image', {
        method: 'POST',
        body: JSON.stringify({ imageText: simulatedOcrText, imageUrl: uploadedUrl }),
      });

      if (res.items && res.items.length > 0) {
        setShoppingList((prev) => [...prev, ...res.items]);
      }
    } catch (err) {
      console.error('Image upload/parse failed', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Parse typed text input with AI
  const handleExtractFromTextInput = async () => {
    if (!textInput.trim()) {
      setValidationError('Please type what you need, record voice, or upload an image first.');
      return;
    }
    setValidationError(null);
    setIsProcessingVoice(true);
    try {
      const res = await apiRequest<{ items: OrderItem[] }>('/ai/parse-voice', {
        method: 'POST',
        body: JSON.stringify({ transcript: textInput, language: 'en' }),
      });

      if (res.items && res.items.length > 0) {
        setShoppingList((prev) => [...prev, ...res.items]);
      } else {
        // Fallback: add raw item
        setShoppingList((prev) => [
          ...prev,
          {
            name: textInput.trim(),
            quantity: 1,
            unit: 'item',
            estimatedPrice: 60,
            inputMethod: 'MANUAL',
            confidenceScore: 1.0,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to parse text input', err);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // Smart deduplicate across all inputs
  const handleSmartDeduplicate = async () => {
    if (shoppingList.length === 0) return;
    try {
      const manualItems = shoppingList.filter((i) => i.inputMethod === 'MANUAL');
      const voiceItems = shoppingList.filter((i) => i.inputMethod === 'VOICE');
      const imageItems = shoppingList.filter((i) => i.inputMethod === 'IMAGE_OCR');

      const res = await apiRequest<{ items: OrderItem[] }>('/ai/combine-deduplicate', {
        method: 'POST',
        body: JSON.stringify({ manualItems, voiceItems, imageItems }),
      });

      if (res.items) {
        setShoppingList(res.items);
      }
    } catch (err) {
      console.error('Deduplication failed', err);
    }
  };

  // Delete item from shopping list
  const handleDeleteItem = (index: number) => {
    setShoppingList((prev) => prev.filter((_, i) => i !== index));
  };

  // Edit item inline
  const handleStartEdit = (index: number, item: OrderItem) => {
    setEditingItemIndex(index);
    setEditingName(item.name);
    setEditingQty(item.quantity);
    setEditingUnit(item.unit);
  };

  const handleSaveEdit = (index: number) => {
    setShoppingList((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              name: editingName,
              quantity: editingQty,
              unit: editingUnit,
            }
          : item
      )
    );
    setEditingItemIndex(null);
  };

  // Update item quantity
  const handleUpdateQty = (index: number, delta: number) => {
    setShoppingList((prev) =>
      prev
        .map((item, i) => {
          if (i === index) {
            const newQty = Math.max(0.25, Number((item.quantity + delta).toFixed(2)));
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  // Add manual item
  const handleAddManualItem = () => {
    if (!manualName.trim()) return;
    const newItem: OrderItem = {
      name: manualName.trim(),
      quantity: parseFloat(manualQty) || 1,
      unit: manualUnit,
      estimatedPrice: parseFloat(manualPrice) || 50,
      inputMethod: 'MANUAL',
      confidenceScore: 1.0,
    };
    setShoppingList((prev) => [...prev, newItem]);
    setManualName('');
    setManualQty('1');
    setManualPrice('40');
    setShowManualAddModal(false);
    setValidationError(null);
  };

  // Validate shopping list & Proceed to Order Review
  const handleProceedToOrder = () => {
    // If user typed text but hasn't parsed it, parse it first
    if (shoppingList.length === 0 && textInput.trim()) {
      handleExtractFromTextInput();
      return;
    }

    if (shoppingList.length === 0) {
      setValidationError('Please add at least one item using text, voice recording, or photo upload before proceeding.');
      return;
    }

    setValidationError(null);
    setCurrentPage('review');
  };

  // Submit Final Order from Review Page
  const handleConfirmAndPlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      setValidationError('Please specify a delivery address.');
      return;
    }

    setIsSubmittingOrder(true);
    setValidationError(null);

    try {
      const res = await apiRequest<{ order: any }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          serviceType: 'GROCERY_SHOPPING',
          pickupAddress: pickupLocation,
          deliveryAddress,
          errandInstructions: errandNotes || (textInput ? `Original Note: ${textInput}` : 'Multimodal AI Errands Order'),
          paymentMethod,
          tipAmount: 0,
          items: shoppingList.map((i) => ({
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            inputMethod: i.inputMethod,
            estimatedPrice: i.estimatedPrice,
            confidenceScore: i.confidenceScore || 1.0,
            uncertaintyFlag: i.uncertaintyFlag,
          })),
        }),
      });

      setIsOrderPlacedSuccess(true);
      setConfirmedOrderId(res.order?.id || 'ORD-NEW');

      setTimeout(() => {
        onClose();
        if (onOrderCreated && res.order?.id) {
          onOrderCreated(res.order.id);
        } else if (onProceedToCheckout) {
          onProceedToCheckout();
        }
      }, 1500);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to place errand order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Transfer to Cart Drawer instead
  const handleTransferToCart = () => {
    shoppingList.forEach((item) => {
      addItem(item);
    });
    setPickupAddress(pickupLocation);
    onClose();
    if (onProceedToCheckout) {
      onProceedToCheckout();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full h-full sm:h-auto sm:max-h-[92vh] max-w-2xl bg-[#FAF7F2] sm:rounded-3xl shadow-2xl border border-[#E8E1D7] flex flex-col overflow-hidden">
        
        {/* Sticky Mobile-First Navigation Header */}
        <div className="bg-white border-b border-[#E8E1D7] px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            {currentPage === 'review' ? (
              <button
                onClick={() => setCurrentPage('input')}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors"
                title="Back to editing list"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors"
                title="Close"
              >
                <ArrowLeft className="w-5 h-5 sm:hidden" />
                <X className="w-5 h-5 hidden sm:block" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                  {currentPage === 'input' ? 'Hybrid AI Order' : 'Review & Place Order'}
                </h2>
                <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-orange-600" />
                  Multimodal AI
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 hidden sm:block">
                {currentPage === 'input'
                  ? 'Speak, snap handwritten notes, or type whatever you need'
                  : 'Verify products, quantities, and estimated local market prices'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {shoppingList.length > 0 && currentPage === 'input' && (
              <span className="bg-emerald-100 text-emerald-800 font-black text-xs px-2.5 py-1 rounded-full">
                {shoppingList.length} {shoppingList.length === 1 ? 'item' : 'items'}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* PAGE 1: ORDER INPUT, ADVERTISEMENTS & NOTES */}
          {currentPage === 'input' && (
            <>
              {/* ========================================================= */}
              {/* 1. ORDER INPUT SECTION                                    */}
              {/* ========================================================= */}
              <section className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E1D7] shadow-sm space-y-4">
                {/* Heading */}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight flex items-center gap-2">
                    <span>Write or Speak Whatever You Need</span>
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Type groceries or errands, tap the mic to speak, or snap a handwritten note.
                  </p>
                </div>

                {/* Large Text Input Area with integrated Voice & Camera buttons */}
                <div className="relative rounded-2xl border-2 border-neutral-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 bg-neutral-50/60 transition-all p-3">
                  <textarea
                    rows={4}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="e.g. 2 kg onions, 1 kg fresh potatoes and 500g tomatoes, 1 packet milk, and mosquito repellent spray..."
                    className="w-full bg-transparent resize-none text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none leading-relaxed"
                  />

                  {/* Actions Bar inside Input Area */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200/70 mt-1">
                    <div className="flex items-center gap-2">
                      {/* Microphone Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuickCard('voice');
                          handleToggleRecord();
                        }}
                        className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                          isRecording
                            ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                            : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
                        }`}
                        title="Record Voice Order"
                      >
                        <Mic className={`w-4 h-4 ${isRecording ? 'animate-bounce' : ''}`} />
                        <span className="font-extrabold text-[11px]">
                          {isRecording ? `Recording (${recordingSeconds}s)...` : 'Speak'}
                        </span>
                      </button>

                      {/* Camera / Upload Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuickCard('upload');
                          fileInputRef.current?.click();
                        }}
                        className="p-2.5 rounded-xl font-bold text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5 transition-all"
                        title="Upload handwritten list or bill photo"
                      >
                        <Camera className="w-4 h-4 text-amber-700" />
                        <span className="font-extrabold text-[11px]">Scan / Photo</span>
                      </button>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Quick Extract / Add Button */}
                    {textInput.trim() && (
                      <button
                        onClick={handleExtractFromTextInput}
                        disabled={isProcessingVoice}
                        className="py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-black flex items-center gap-1 transition-all shadow-xs"
                      >
                        {isProcessingVoice ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>Extract AI List</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Three Small Selectable Cards below the Input */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {/* Card 1: Handwritten Note */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuickCard(selectedQuickCard === 'handwritten' ? null : 'handwritten');
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedQuickCard === 'handwritten'
                        ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-500/20'
                        : 'border-[#E8E1D7] bg-white hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-neutral-900 leading-tight">Handwritten Note</span>
                    <span className="text-[10px] text-neutral-500">Scan paper list</span>
                  </button>

                  {/* Card 2: Voice Message */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuickCard(selectedQuickCard === 'voice' ? null : 'voice');
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedQuickCard === 'voice'
                        ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-500/20'
                        : 'border-[#E8E1D7] bg-white hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <Mic className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-neutral-900 leading-tight">Voice Message</span>
                    <span className="text-[10px] text-neutral-500">English / Hindi / Regional</span>
                  </button>

                  {/* Card 3: Upload Photo */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuickCard(selectedQuickCard === 'upload' ? null : 'upload');
                      fileInputRef.current?.click();
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                      selectedQuickCard === 'upload'
                        ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-500/20'
                        : 'border-[#E8E1D7] bg-white hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black text-neutral-900 leading-tight">Upload Photo</span>
                    <span className="text-[10px] text-neutral-500">Bill or grocery image</span>
                  </button>
                </div>

                {/* Sub-Panel: Voice Message Controls when selected */}
                {selectedQuickCard === 'voice' && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
                        <Volume2 className="w-4 h-4 text-orange-600" />
                        <span>Speech Recognition Language:</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedVoiceLanguage('en')}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            selectedVoiceLanguage === 'en'
                              ? 'bg-orange-600 text-white'
                              : 'bg-white text-neutral-600 hover:bg-neutral-100 border'
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedVoiceLanguage('hi')}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            selectedVoiceLanguage === 'hi'
                              ? 'bg-orange-600 text-white'
                              : 'bg-white text-neutral-600 hover:bg-neutral-100 border'
                          }`}
                        >
                          Hindi
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedVoiceLanguage('bn')}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                            selectedVoiceLanguage === 'bn'
                              ? 'bg-orange-600 text-white'
                              : 'bg-white text-neutral-600 hover:bg-neutral-100 border'
                          }`}
                        >
                          Bengali
                        </button>
                      </div>
                    </div>

                    {/* Voice Sample Prompts */}
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 block mb-1.5">
                        Test with Instant Sample Speech:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedVoiceLanguage === 'bn'
                          ? samples?.bengali
                          : selectedVoiceLanguage === 'hi'
                          ? samples?.hindi
                          : samples?.english
                        )?.map((prompt: string, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setVoiceTranscript(prompt);
                              processVoiceTranscript(prompt);
                            }}
                            className="text-left text-[11px] bg-white hover:bg-orange-100/70 text-neutral-800 px-2.5 py-1 rounded-full border border-neutral-200 transition-all font-medium flex items-center gap-1.5"
                          >
                            <Volume2 className="w-3 h-3 text-orange-600 shrink-0" />
                            <span className="truncate max-w-[240px]">"{prompt}"</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-Panel: Handwritten Note Samples when selected */}
                {selectedQuickCard === 'handwritten' && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800">
                        Scan or Click a Sample Handwritten Mandi Slip:
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-bold text-orange-700 hover:underline flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        Upload My Slip
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {samples?.imageSamples?.map((sample: any, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => processImageOCR(sample.extractedText, sample.imagePreview)}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white border border-neutral-200 hover:border-orange-500 hover:bg-orange-50/40 text-left transition-all"
                        >
                          <img
                            src={sample.imagePreview}
                            alt="preview"
                            className="w-11 h-11 rounded-lg object-cover border"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-neutral-800 truncate">{sample.title}</p>
                            <p className="text-[10px] text-neutral-500 truncate">
                              {sample.extractedText.replace(/\n/g, ', ')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Image Preview Bar */}
                {imagePreview && (
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-sky-50 border border-sky-200">
                    <div className="flex items-center gap-2.5">
                      <img src={imagePreview} alt="Uploaded Slip" className="w-10 h-10 rounded-lg object-cover border" />
                      <div>
                        <span className="text-xs font-bold text-sky-950 block">Shopping List Image Loaded</span>
                        <span className="text-[10px] text-sky-700">AI OCR parsing active</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="p-1 rounded-full text-neutral-400 hover:text-neutral-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* AI Processing Indicators */}
                {(isProcessingVoice || isProcessingImage) && (
                  <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-center text-xs font-bold text-orange-900 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 text-orange-600 animate-spin" />
                    <span>
                      {isProcessingVoice
                        ? 'AI is transcribing voice acoustics & extracting product units...'
                        : 'AI Vision OCR is scanning handwriting & matching store catalog...'}
                    </span>
                  </div>
                )}
              </section>

              {/* ========================================================= */}
              {/* EDITABLE SHOPPING LIST (AI EXTRACTED PRODUCTS)            */}
              {/* ========================================================= */}
              {shoppingList.length > 0 && (
                <section className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E1D7] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-neutral-900 flex items-center gap-2">
                        <span>Extracted Shopping List</span>
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                          {shoppingList.length} items
                        </span>
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Review, adjust quantities, or delete items extracted by AI.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSmartDeduplicate}
                        className="py-1 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-bold transition-colors flex items-center gap-1"
                        title="Merge identical items from voice and image inputs"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Merge Duplicates</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManualAddModal(true)}
                        className="py-1 px-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-[11px] font-bold transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Item</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Items */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {shoppingList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D7] flex items-center justify-between gap-3 hover:border-orange-300 transition-colors"
                      >
                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          {editingItemIndex === idx ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="px-2 py-1 bg-white border rounded-lg text-xs font-bold w-full"
                              />
                              <input
                                type="number"
                                step="0.25"
                                value={editingQty}
                                onChange={(e) => setEditingQty(parseFloat(e.target.value) || 1)}
                                className="px-2 py-1 bg-white border rounded-lg text-xs font-bold w-16"
                              />
                              <input
                                type="text"
                                value={editingUnit}
                                onChange={(e) => setEditingUnit(e.target.value)}
                                className="px-2 py-1 bg-white border rounded-lg text-xs font-bold w-16"
                              />
                              <button
                                onClick={() => handleSaveEdit(idx)}
                                className="p-1 rounded-lg bg-emerald-600 text-white"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-neutral-900">{item.name}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white border text-neutral-600">
                                  {item.inputMethod === 'VOICE'
                                    ? '🎙️ Voice'
                                    : item.inputMethod === 'IMAGE_OCR'
                                    ? '📷 Handwritten'
                                    : '✍️ Typed'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-neutral-600 mt-1">
                                <span className="font-semibold text-neutral-700">
                                  {item.quantity} {item.unit}
                                </span>
                                <span>·</span>
                                <span className="text-orange-700 font-extrabold">
                                  Est: ₹{item.estimatedPrice * item.quantity}
                                </span>
                              </div>
                            </div>
                          )}

                          {item.uncertaintyFlag && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{item.uncertaintyFlag}</span>
                            </div>
                          )}
                        </div>

                        {/* Quantity Counter & Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, -1)}
                            className="w-7 h-7 rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 flex items-center justify-center text-xs font-black"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-black text-neutral-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 flex items-center justify-center text-xs font-black"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(idx, item)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Estimated Subtotal */}
                  <div className="pt-2 border-t border-[#E8E1D7] flex items-center justify-between text-xs">
                    <span className="text-neutral-500 font-medium">Estimated Mandi Subtotal:</span>
                    <span className="font-black text-sm text-neutral-900">₹{estimatedProductTotal}</span>
                  </div>
                </section>
              )}

              {/* Manual Add Item Inline Modal/Form */}
              {showManualAddModal && (
                <div className="p-4 rounded-3xl bg-white border border-orange-200 shadow-md space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-neutral-900">Add Custom Errand or Mandi Item</h5>
                    <button
                      onClick={() => setShowManualAddModal(false)}
                      className="text-neutral-400 hover:text-neutral-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Item Name</label>
                      <input
                        type="text"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="e.g. Rohu Fish, Fresh Ginger..."
                        className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Quantity</label>
                      <input
                        type="number"
                        step="0.5"
                        value={manualQty}
                        onChange={(e) => setManualQty(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Unit</label>
                      <select
                        value={manualUnit}
                        onChange={(e) => setManualUnit(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:border-orange-500 bg-white"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="piece">piece</option>
                        <option value="packet">packet</option>
                        <option value="litre">litre</option>
                        <option value="dozen">dozen</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowManualAddModal(false)}
                      className="px-3 py-1.5 rounded-xl text-neutral-600 text-xs font-bold hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddManualItem}
                      className="px-4 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-extrabold hover:bg-orange-700 shadow-sm"
                    >
                      Add to List
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 2. LOCAL ADVERTISEMENT BANNER                             */}
              {/* ========================================================= */}
              {bannerAds.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400">
                      Local Shop & Furniture Offers
                    </span>
                    <span className="text-[10px] text-neutral-400 font-bold">
                      Sponsored Local Partner
                    </span>
                  </div>

                  <div className="relative rounded-3xl overflow-hidden border border-[#E8E1D7] bg-white shadow-sm group">
                    {/* Banner Image & Content */}
                    {(() => {
                      const ad = bannerAds[currentBannerIndex] || bannerAds[0];
                      return (
                        <div className="flex flex-col sm:flex-row">
                          <div className="relative sm:w-2/5 h-36 sm:h-auto shrink-0 overflow-hidden bg-neutral-100">
                            <img
                              src={ad.imageUrl}
                              alt={ad.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 left-2 bg-neutral-900/80 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                              {ad.badge || 'Local Offer'}
                            </div>
                          </div>

                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                                  {ad.category.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {currentBannerIndex + 1} / {bannerAds.length}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-neutral-900 mt-1 leading-snug">
                                {ad.title}
                              </h4>
                              <p className="text-xs text-neutral-500 mt-1 leading-relaxed line-clamp-2">
                                {ad.description}
                              </p>
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                              <a
                                href={ad.linkUrl || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-black text-orange-600 hover:text-orange-700 transition-colors"
                              >
                                <span>View Local Store Offer</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              {/* Navigation Dots */}
                              <div className="flex items-center gap-1">
                                {bannerAds.map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setCurrentBannerIndex(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                      i === currentBannerIndex ? 'bg-orange-600 w-4' : 'bg-neutral-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </section>
              )}

              {/* ========================================================= */}
              {/* 3. ORDER NOTES & CANCELLATION POLICY                      */}
              {/* ========================================================= */}
              <section className="rounded-3xl bg-amber-50/70 border border-amber-200/90 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center">
                      <Info className="w-4 h-4 text-amber-800" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-amber-950">
                      Order Notes & Cancellation Policy
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPolicyModal(true)}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline flex items-center gap-1"
                  >
                    <span>Full Policy</span>
                    <Info className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-neutral-800">
                  {/* Point 1: Cancellation Allowed */}
                  <div className="p-2.5 rounded-2xl bg-white/80 border border-amber-200/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Free Cancellation</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 leading-snug">
                      Permitted free of charge before delivery partner arrives at the stall or starts shopping.
                    </p>
                  </div>

                  {/* Point 2: Non-Cancellable Stages */}
                  <div className="p-2.5 rounded-2xl bg-white/80 border border-amber-200/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-[11px]">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>Non-Cancellable</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 leading-snug">
                      Cannot be cancelled once fresh mandi produce (veggies, fish, dairy) is weighed & purchased.
                    </p>
                  </div>

                  {/* Point 3: Applicable Cancellation Charges */}
                  <div className="p-2.5 rounded-2xl bg-white/80 border border-amber-200/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-[11px]">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Nominal ₹30 Fee</span>
                    </div>
                    <p className="text-[11px] text-neutral-600 leading-snug">
                      Applies if cancelled after partner has already travelled to the market stall to compensate rider.
                    </p>
                  </div>
                </div>
              </section>

              {/* ========================================================= */}
              {/* 4. ADVERTISEMENT SPACE (COMPACT RECTANGULAR, 4 CORNERS)   */}
              {/* ========================================================= */}
              {compactAds.length > 0 && (
                <section className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                      Community Service Notice
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium">Local Partner</span>
                  </div>

                  {/* Compact rectangular ad with four distinctive clear corner brackets */}
                  <div className="relative p-3 sm:p-3.5 bg-white border border-[#E8E1D7] rounded-xl shadow-xs overflow-hidden">
                    {/* Clear Four Corner Accents */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-500" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-orange-500" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orange-500" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-500" />

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={compactAds[0].imageUrl}
                          alt={compactAds[0].title}
                          className="w-11 h-11 rounded-lg object-cover border border-neutral-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded">
                              {compactAds[0].badge}
                            </span>
                            <h5 className="text-xs font-black text-neutral-900 truncate">
                              {compactAds[0].title}
                            </h5>
                          </div>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {compactAds[0].description}
                          </p>
                        </div>
                      </div>

                      <a
                        href={compactAds[0].linkUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1 px-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-bold shrink-0 transition-colors"
                      >
                        Visit
                      </a>
                    </div>
                  </div>
                </section>
              )}

              {/* ========================================================= */}
              {/* 5. PROCEED TO ORDER BUTTON                                */}
              {/* ========================================================= */}
              <div className="pt-3 pb-4">
                <button
                  type="button"
                  onClick={handleProceedToOrder}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-base shadow-lg shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Proceed to Order</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </>
          )}

          {/* PAGE 2: ORDER REVIEW PAGE VIEW                            */}
          {/* ========================================================= */}
          {currentPage === 'review' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Success Notification if order placed */}
              {isOrderPlacedSuccess ? (
                <div className="p-8 text-center rounded-3xl bg-white border border-emerald-200 shadow-sm space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-black text-neutral-900">Errand Order Confirmed!</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Your order #{confirmedOrderId} has been broadcast to nearby delivery partners. You will be redirected to the live tracking radar.
                  </p>
                </div>
              ) : (
                <>
                  {/* Order Review Items Card */}
                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E1D7] shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E8E1D7] pb-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-neutral-900">
                          Review Shopping List & Estimated Prices
                        </h3>
                        <span className="text-[11px] text-neutral-500">
                          {shoppingList.length} items to be purchased by delivery partner
                        </span>
                      </div>
                      <button
                        onClick={() => setCurrentPage('input')}
                        className="text-xs font-bold text-orange-600 hover:underline"
                      >
                        Edit List
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {shoppingList.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D7]"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-orange-100 text-orange-800 text-xs font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="text-xs font-black text-neutral-900">{item.name}</span>
                              <div className="text-[11px] text-neutral-500">
                                {item.quantity} {item.unit} · Est: ₹{item.estimatedPrice} / {item.unit}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-black text-neutral-900">
                            ₹{item.estimatedPrice * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Price Breakdown Calculation */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-xs">
                      <div className="flex justify-between text-neutral-600">
                        <span>Estimated Products Total:</span>
                        <span className="font-bold text-neutral-900">₹{estimatedProductTotal}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600">
                        <span>Hyperlocal Errand Delivery Fee:</span>
                        <span className="font-bold text-neutral-900">₹{deliveryFee}</span>
                      </div>
                      <div className="flex justify-between text-neutral-600">
                        <span>Platform Commission & Rider Insurance:</span>
                        <span className="font-bold text-neutral-900">₹{platformFee}</span>
                      </div>
                      <div className="pt-2 border-t border-neutral-200 flex justify-between text-sm font-black text-neutral-900">
                        <span>Estimated Grand Total:</span>
                        <span className="text-base text-orange-600">₹{grandTotal}</span>
                      </div>
                      <p className="text-[10px] text-neutral-500 pt-1 leading-snug">
                        * Under Platform Dynamic Pricing, unpriced mandi produce will be weighed at stall and sent for your approval before final billing.
                      </p>
                    </div>
                  </div>

                  {/* Delivery & Payment Details Card */}
                  <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#E8E1D7] shadow-sm space-y-4">
                    <h4 className="text-xs sm:text-sm font-black text-neutral-900">Delivery Details & Payment</h4>

                    <div>
                      <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                        Delivery Destination Address
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="House / Flat No., Street, Landmark..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-orange-500 bg-neutral-50"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                        Pickup Market / Stall (Default)
                      </label>
                      <input
                        type="text"
                        value={pickupLocation}
                        onChange={(e) => setPickupLocation(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-orange-500 bg-neutral-50"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-neutral-600 block mb-1">
                        Errand Instructions / Partner Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={errandNotes}
                        onChange={(e) => setErrandNotes(e.target.value)}
                        placeholder="e.g. Choose fresh coriander leaves, call if item out of stock..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-orange-500 bg-neutral-50"
                      />
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                      <label className="text-[11px] font-bold text-neutral-600 block mb-1.5">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('COD')}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            paymentMethod === 'COD'
                              ? 'border-orange-500 bg-orange-50 font-bold text-orange-950'
                              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          <Banknote className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                          <span className="text-[11px] block">Cash on Delivery</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('DIRECT_UPI')}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            paymentMethod === 'DIRECT_UPI'
                              ? 'border-orange-500 bg-orange-50 font-bold text-orange-950'
                              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          <QrCode className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                          <span className="text-[11px] block">Rider UPI QR</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('UPI_ONLINE')}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            paymentMethod === 'UPI_ONLINE'
                              ? 'border-orange-500 bg-orange-50 font-bold text-orange-950'
                              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                          }`}
                        >
                          <CreditCard className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                          <span className="text-[11px] block">Online / Cards</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submission Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmAndPlaceOrder}
                      disabled={isSubmittingOrder}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-base shadow-lg shadow-orange-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingOrder ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Dispatching Errand Order...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Confirm & Place Errand Order</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleTransferToCart}
                      className="w-full py-2.5 px-4 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-100 transition-colors"
                    >
                      Add to Shopping Cart Drawer Instead
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Policy Terms Detail Modal */}
        {showPolicyModal && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-neutral-200 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-amber-600" />
                  <h4 className="text-sm font-black text-neutral-900">Hyperlocal Ordering Rules & Terms</h4>
                </div>
                <button
                  onClick={() => setShowPolicyModal(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-neutral-700 leading-relaxed max-h-72 overflow-y-auto">
                <p>
                  <strong>1. Free Cancellation Window:</strong> Customers can cancel orders without any penalty as long as the delivery partner has not yet arrived at the local mandi stall or started the procurement.
                </p>
                <p>
                  <strong>2. Partner Travel Fee:</strong> If an order is cancelled after a delivery partner has already completed their travel and arrived at the pickup store/mandi, a nominal travel compensation of ₹30 will be charged.
                </p>
                <p>
                  <strong>3. Perishable Goods:</strong> Once unpriced mandi produce (such as vegetables, fish, chicken, milk, and seasonal fruits) is weighed and purchased from local vendors, cancellation is strictly unavailable as vendors do not accept returns.
                </p>
                <p>
                  <strong>4. Dynamic Price Approval:</strong> If the actual market price at the stall exceeds benchmark estimate by more than 20%, the partner must upload the photo bill for your live digital approval.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-black hover:bg-neutral-800 transition-colors"
              >
                Understood & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
