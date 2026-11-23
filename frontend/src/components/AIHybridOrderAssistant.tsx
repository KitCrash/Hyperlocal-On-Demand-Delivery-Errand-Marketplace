'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Mic,
  Camera,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
  Volume2,
  FileText,
  Search,
  RefreshCw,
  X,
  Edit2,
  Check,
} from 'lucide-react';
import { OrderItem, Product } from '../types';
import { apiRequest } from '../lib/api';
import { useCart } from '../context/CartContext';

interface AIHybridOrderAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout?: () => void;
  initialTab?: 'voice' | 'image' | 'manual' | 'combined';
}

export const AIHybridOrderAssistant: React.FC<AIHybridOrderAssistantProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  initialTab,
}) => {
  const { addItem, items: cartItems, setPickupAddress } = useCart();

  const [activeSubTab, setActiveSubTab] = useState<'voice' | 'image' | 'manual' | 'combined'>('voice');

  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Input states
  const [manualQuery, setManualQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [manualItems, setManualItems] = useState<OrderItem[]>([]);

  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [selectedVoiceLanguage, setSelectedVoiceLanguage] = useState<'bn' | 'hi' | 'en'>('bn');
  const [voiceExtractedItems, setVoiceExtractedItems] = useState<OrderItem[]>([]);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Image states
  const [imageText, setImageText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageExtractedItems, setImageExtractedItems] = useState<OrderItem[]>([]);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Combined and deduplicated list
  const [combinedList, setCombinedList] = useState<OrderItem[]>([]);
  const [isCombining, setIsCombining] = useState(false);
  const [mergedCount, setMergedCount] = useState(0);
  const [uncertainCount, setUncertainCount] = useState(0);
  const [isConfirmedByCustomer, setIsConfirmedByCustomer] = useState(false);

  // Sample prompts from backend
  const [samples, setSamples] = useState<any>(null);

  // Load sample prompts
  useEffect(() => {
    if (isOpen) {
      apiRequest<{ samples: any }>('/ai/sample-prompts')
        .then((data) => setSamples(data.samples))
        .catch(() => {});
    }
  }, [isOpen]);

  // Search products for manual tab
  useEffect(() => {
    if (!manualQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      apiRequest<{ products: Product[] }>(`/products?search=${encodeURIComponent(manualQuery)}`)
        .then((data) => setSearchResults(data.products || []))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [manualQuery]);

  // Voice recording simulation timer
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

  // Handle voice recording start/stop
  const handleToggleRecord = () => {
    if (isRecording) {
      // Stop recording and process
      setIsRecording(false);
      let simulatedTranscript = '';
      if (selectedVoiceLanguage === 'bn') {
        simulatedTranscript = samples?.bengali?.[0] || 'দুটো দেশি লাল পিয়াঁজ এক কেজি আলু আর ২৫০ গ্রাম কাঁচা লঙ্কা';
      } else if (selectedVoiceLanguage === 'hi') {
        simulatedTranscript = samples?.hindi?.[0] || 'दो किलो नासिक प्याज, एक किलो आलू और आधा किलो टमाटर';
      } else {
        simulatedTranscript = samples?.english?.[0] || '2 kg onions, 1 kg fresh potatoes and 500g tomatoes';
      }
      setVoiceTranscript(simulatedTranscript);
      processVoiceTranscript(simulatedTranscript);
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  const processVoiceTranscript = async (transcript: string) => {
    if (!transcript) return;
    setIsProcessingVoice(true);
    try {
      const res = await apiRequest<{ items: OrderItem[] }>('/ai/parse-voice', {
        method: 'POST',
        body: JSON.stringify({ transcript, language: selectedVoiceLanguage }),
      });
      setVoiceExtractedItems(res.items || []);
    } catch (err) {
      console.error('Voice parsing failed', err);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const processImageOCR = async (text: string, previewUrl?: string) => {
    setIsProcessingImage(true);
    try {
      if (previewUrl) setImagePreview(previewUrl);
      const res = await apiRequest<{ items: OrderItem[] }>('/ai/parse-image', {
        method: 'POST',
        body: JSON.stringify({ imageText: text, imageUrl: previewUrl }),
      });
      setImageExtractedItems(res.items || []);
    } catch (err) {
      console.error('Image parsing failed', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Combine and deduplicate across all three input sources
  const handleCombineAll = async () => {
    setIsCombining(true);
    try {
      const res = await apiRequest<{
        items: OrderItem[];
        mergedDuplicatesCount: number;
        uncertainItemsCount: number;
      }>('/ai/combine-deduplicate', {
        method: 'POST',
        body: JSON.stringify({
          manualItems,
          voiceItems: voiceExtractedItems,
          imageItems: imageExtractedItems,
        }),
      });

      setCombinedList(res.items);
      setMergedCount(res.mergedDuplicatesCount);
      setUncertainCount(res.uncertainItemsCount);
      setActiveSubTab('combined');
    } catch (err) {
      console.error('Combine failed', err);
    } finally {
      setIsCombining(false);
    }
  };

  // Transfer confirmed list to Cart
  const handleTransferToCart = () => {
    combinedList.forEach((item) => {
      addItem(item);
    });
    setPickupAddress('New Town Fresh Vegetable & Fish Mandi, Stall #14');
    onClose();
    if (onProceedToCheckout) {
      onProceedToCheckout();
    }
  };

  if (!isOpen) return null;

  const totalRecognizedCount = manualItems.length + voiceExtractedItems.length + imageExtractedItems.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#E8E1D7] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 via-amber-600 to-amber-500 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-200 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight">AI Hybrid Order Assistant</h3>
                <span className="bg-amber-400 text-neutral-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Triple-Engine
                </span>
              </div>
              <p className="text-xs text-white/90">
                Voice (Bengali/Hindi/English) + Image OCR + Catalog search with smart deduplication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Triple-Engine Switcher Tabs */}
        <div className="flex border-b border-[#E8E1D7] bg-white px-3 sm:px-6 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('voice')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeSubTab === 'voice'
                ? 'border-brand-600 text-brand-600 bg-brand-50/50 rounded-t-xl'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Voice Ordering</span>
            {voiceExtractedItems.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] flex items-center justify-center font-bold">
                {voiceExtractedItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('image')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeSubTab === 'image'
                ? 'border-brand-600 text-brand-600 bg-brand-50/50 rounded-t-xl'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Image / OCR List</span>
            {imageExtractedItems.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] flex items-center justify-center font-bold">
                {imageExtractedItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('manual')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activeSubTab === 'manual'
                ? 'border-brand-600 text-brand-600 bg-brand-50/50 rounded-t-xl'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Manual Add</span>
            {manualItems.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] flex items-center justify-center font-bold">
                {manualItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (combinedList.length === 0 && totalRecognizedCount > 0) {
                handleCombineAll();
              } else {
                setActiveSubTab('combined');
              }
            }}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ml-auto ${
              activeSubTab === 'combined'
                ? 'border-brand-600 text-brand-600 bg-brand-50/50 rounded-t-xl'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Combined & Review</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
              {combinedList.length > 0 ? combinedList.length : totalRecognizedCount}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: VOICE ORDERING */}
          {activeSubTab === 'voice' && (
            <div className="space-y-4">
              {/* Language Selector */}
              <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-[#E8E1D7]">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-brand-600" />
                  <span className="text-xs font-bold text-neutral-700">Spoken Language:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedVoiceLanguage('bn')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      selectedVoiceLanguage === 'bn'
                        ? 'bg-brand-600 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    বাংলা (Bengali)
                  </button>
                  <button
                    onClick={() => setSelectedVoiceLanguage('hi')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      selectedVoiceLanguage === 'hi'
                        ? 'bg-brand-600 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    हिन्दी (Hindi)
                  </button>
                  <button
                    onClick={() => setSelectedVoiceLanguage('en')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      selectedVoiceLanguage === 'en'
                        ? 'bg-brand-600 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Record Mic Area */}
              <div className="p-6 rounded-3xl bg-white border border-[#E8E1D7] flex flex-col items-center justify-center text-center space-y-3">
                <button
                  onClick={handleToggleRecord}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40 scale-105'
                      : 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                  }`}
                >
                  <Mic className={`w-8 h-8 ${isRecording ? 'animate-bounce' : ''}`} />
                </button>

                <div>
                  <h4 className="text-sm font-extrabold text-neutral-900">
                    {isRecording ? `Recording... (${recordingSeconds}s) - Tap to Stop & Parse` : 'Tap to Record Voice Order'}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                    {selectedVoiceLanguage === 'bn' && 'উদাহরণ: "দুটো দেশি লাল পিয়াঁজ, এক কেজি আলু আর ২৫০ গ্রাম কাঁচা লঙ্কা"'}
                    {selectedVoiceLanguage === 'hi' && 'उदाहरण: "दो किलो नासिक प्याज, एक किलो आलू और आधा किलो टमाटर"'}
                    {selectedVoiceLanguage === 'en' && 'Example: "2 kg onions, 1 kg fresh potatoes and 500g tomatoes"'}
                  </p>
                </div>

                {/* Instant Realistic Sample Prompts */}
                <div className="pt-2 w-full">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                    Or Click a Sample Voice Recording to Test AI:
                  </span>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(selectedVoiceLanguage === 'bn'
                      ? samples?.bengali
                      : selectedVoiceLanguage === 'hi'
                      ? samples?.hindi
                      : samples?.english
                    )?.map((prompt: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setVoiceTranscript(prompt);
                          processVoiceTranscript(prompt);
                        }}
                        className="text-left text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-full border border-amber-200 transition-all font-medium flex items-center gap-1.5"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate max-w-[280px]">"{prompt}"</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extracted Voice Items List */}
              {isProcessingVoice ? (
                <div className="p-6 text-center text-xs text-neutral-500 bg-white rounded-2xl border border-neutral-100">
                  <RefreshCw className="w-5 h-5 text-brand-500 animate-spin mx-auto mb-2" />
                  AI is analyzing speech acoustics & extracting quantities...
                </div>
              ) : voiceExtractedItems.length > 0 ? (
                <div className="p-4 rounded-2xl bg-white border border-[#E8E1D7] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      Recognized Voice Items ({voiceExtractedItems.length})
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Confidence Avg: 94%
                    </span>
                  </div>

                  <div className="space-y-2">
                    {voiceExtractedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-neutral-900">{item.name}</span>
                            <div className="text-[11px] text-neutral-500">
                              Qty: <span className="font-semibold">{item.quantity} {item.unit}</span> · Est: ₹{item.estimatedPrice}
                            </div>
                            {item.uncertaintyFlag && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{item.uncertaintyFlag}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setVoiceExtractedItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-neutral-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: IMAGE OCR ORDERING */}
          {activeSubTab === 'image' && (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-white border border-[#E8E1D7] flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-neutral-900">Upload Shopping List Photo</h4>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                    AI OCR detects handwritten paper slips, vendor bills, and printed grocery lists.
                  </p>
                </div>

                {/* Sample One-Click Mandi Slips */}
                <div className="pt-2 w-full">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                    Click a Sample Slip to Test Vision OCR:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {samples?.imageSamples?.map((sample: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => processImageOCR(sample.extractedText, sample.imagePreview)}
                        className="flex items-center gap-2 p-2 rounded-xl border border-neutral-200 hover:border-brand-500 hover:bg-brand-50/50 text-left transition-all"
                      >
                        <img
                          src={sample.imagePreview}
                          alt="preview"
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-800 truncate">{sample.title}</p>
                          <p className="text-[10px] text-neutral-500 truncate">{sample.extractedText.replace(/\n/g, ', ')}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Extracted Image Items */}
              {isProcessingImage ? (
                <div className="p-6 text-center text-xs text-neutral-500 bg-white rounded-2xl border border-neutral-100">
                  <RefreshCw className="w-5 h-5 text-brand-500 animate-spin mx-auto mb-2" />
                  Running OCR & matching products against catalog...
                </div>
              ) : imageExtractedItems.length > 0 ? (
                <div className="p-4 rounded-2xl bg-white border border-[#E8E1D7] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">
                      OCR Extracted Items ({imageExtractedItems.length})
                    </span>
                    <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
                      Vision Scanned
                    </span>
                  </div>

                  <div className="space-y-2">
                    {imageExtractedItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-neutral-900">{item.name}</span>
                            <div className="text-[11px] text-neutral-500">
                              Qty: <span className="font-semibold">{item.quantity} {item.unit}</span> · Est: ₹{item.estimatedPrice}
                            </div>
                            {item.uncertaintyFlag && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium mt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{item.uncertaintyFlag}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setImageExtractedItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-neutral-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: MANUAL INPUT */}
          {activeSubTab === 'manual' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#E8E1D7] space-y-3">
                <span className="text-xs font-bold text-neutral-800">Search Mandi Catalog or Add Custom Errand</span>
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder="Search potato, onion, eggs, milk, biryani..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
                    {searchResults.map((prod) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={prod.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                            alt={prod.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                          <div>
                            <span className="text-xs font-bold text-neutral-900 block">{prod.name}</span>
                            <span className="text-[10px] text-neutral-500">
                              ₹{prod.estimatedPrice} / {prod.unit} · {prod.nameBengali || prod.nameHindi}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setManualItems((prev) => [
                              ...prev,
                              {
                                productId: prod.id,
                                name: prod.name,
                                quantity: 1,
                                unit: prod.unit,
                                estimatedPrice: prod.estimatedPrice,
                                inputMethod: 'MANUAL',
                                confidenceScore: 1.0,
                              },
                            ]);
                            setManualQuery('');
                            setSearchResults([]);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white text-[11px] font-bold hover:bg-neutral-800 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual Items Added */}
              {manualItems.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border border-[#E8E1D7] space-y-3">
                  <span className="text-xs font-bold text-neutral-800">
                    Manually Selected Items ({manualItems.length})
                  </span>
                  <div className="space-y-2">
                    {manualItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/60"
                      >
                        <div>
                          <span className="text-xs font-bold text-neutral-900">{item.name}</span>
                          <div className="text-[11px] text-neutral-500">
                            Qty: <span className="font-semibold">{item.quantity} {item.unit}</span> · Est: ₹{item.estimatedPrice}
                          </div>
                        </div>

                        <button
                          onClick={() => setManualItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-neutral-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMBINED, DEDUPLICATED & CUSTOMER REVIEW */}
          {activeSubTab === 'combined' && (
            <div className="space-y-4">
              {/* Summary Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-950">AI Multimodal Fusion Complete</h4>
                      <p className="text-[11px] text-emerald-700">
                        Merged across Manual, Voice, and Image inputs with deduplication.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCombineAll}
                    disabled={isCombining}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCombining ? 'animate-spin' : ''}`} />
                    Re-Sync
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-3 pt-2 border-t border-emerald-200/60 text-[11px]">
                  <span className="font-semibold text-emerald-900">
                    Total Items: {combinedList.length}
                  </span>
                  {mergedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                      {mergedCount} Duplicates Merged
                    </span>
                  )}
                  {uncertainCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {uncertainCount} Needs Confirmation
                    </span>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {combinedList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white border border-[#E8E1D7] flex items-center justify-between gap-3 hover:border-brand-300 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900">{item.name}</span>
                        {item.isDuplicateMerged && (
                          <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                            Merged ({item.mergedFrom?.join('+')})
                          </span>
                        )}
                        <span className="bg-neutral-100 text-neutral-600 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                          {item.inputMethod}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-neutral-600 mt-1">
                        <span>
                          Qty: <strong className="text-neutral-900">{item.quantity} {item.unit}</strong>
                        </span>
                        <span>
                          Est: <strong className="text-brand-700">₹{item.estimatedPrice}</strong>
                        </span>
                      </div>

                      {item.uncertaintyFlag && (
                        <div className="mt-1.5 p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{item.uncertaintyFlag}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setCombinedList((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-neutral-400 hover:text-rose-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Mandatory Customer Confirmation Checkbox */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfirmedByCustomer}
                    onChange={(e) => setIsConfirmedByCustomer(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-brand-600 focus:ring-brand-500 border-neutral-300"
                  />
                  <div className="text-xs text-neutral-800">
                    <span className="font-bold">I confirm the above items, quantities and estimated prices</span>
                    <p className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                      As per Platform Dynamic Market Pricing, unpriced mandi produce will be verified by the delivery partner at the stall and sent for your final approval before purchase.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#E8E1D7] bg-white flex items-center justify-between gap-3">
          {activeSubTab !== 'combined' ? (
            <button
              onClick={handleCombineAll}
              disabled={totalRecognizedCount === 0}
              className="w-full py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Combine All Inputs ({totalRecognizedCount} Items) & Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <div className="text-xs">
                <span className="text-neutral-500 block">Est. Product Total</span>
                <span className="text-base font-extrabold text-neutral-900">
                  ₹{combinedList.reduce((s, i) => s + (i.estimatedPrice || 0), 0)}
                </span>
              </div>

              <button
                onClick={handleTransferToCart}
                disabled={!isConfirmedByCustomer || combinedList.length === 0}
                className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Add to Order</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
