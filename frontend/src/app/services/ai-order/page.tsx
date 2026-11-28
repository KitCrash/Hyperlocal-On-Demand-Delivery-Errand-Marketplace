'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { apiRequest } from '@/lib/api';
import { OrderItem } from '@/types';

export default function AIOrderServicePage() {
  const router = useRouter();
  const { addItem, setServiceType, items } = useCart();
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParseText = async () => {
    if (!textInput.trim()) return;
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await apiRequest<{ items: OrderItem[] }>('/ai/parse-voice', {
        method: 'POST',
        body: JSON.stringify({ transcript: textInput.trim(), language: 'en' }),
      });
      if (res.items && res.items.length > 0) {
        setServiceType('GROCERY_SHOPPING');
        res.items.forEach((item) => {
          addItem({
            name: item.name,
            quantity: item.quantity || 1,
            unit: item.unit || 'unit',
            inputMethod: 'VOICE',
            estimatedPrice: item.estimatedPrice || 40,
          });
        });
        setStatusMessage(`Added ${res.items.length} item(s) to your cart.`);
        setTextInput('');
      } else {
        setStatusMessage('No items detected. Try listing items separated by commas.');
      }
    } catch {
      setStatusMessage('Failed to parse order text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setStatusMessage('Scanning handwritten list...');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await apiRequest<{ items: OrderItem[] }>('/ai/parse-ocr', {
        method: 'POST',
        body: formData,
      });
      if (res.items && res.items.length > 0) {
        setServiceType('GROCERY_SHOPPING');
        res.items.forEach((item) => {
          addItem({
            name: item.name,
            quantity: item.quantity || 1,
            unit: item.unit || 'unit',
            inputMethod: 'OCR',
            estimatedPrice: item.estimatedPrice || 40,
          });
        });
        setStatusMessage(`Scanned and added ${res.items.length} item(s) to your cart.`);
      } else {
        setStatusMessage('Could not extract items from the image.');
      }
    } catch {
      setStatusMessage('Photo scan failed. Please try again.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
              <h1 className="text-base sm:text-lg font-black text-neutral-900">AI Voice & OCR Order</h1>
              <span className="text-[11px] text-neutral-500 font-medium block">
                Convert spoken lists or handwritten notes into cart items
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
        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E1D7] text-xs font-semibold text-neutral-800">
            {statusMessage}
          </div>
        )}

        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 space-y-3">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Type or Dictate Your List
          </span>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Example: 2 kg onions, 1 kg tomatoes, 1 pack paracetamol, 2L milk..."
            rows={4}
            className="w-full p-3 rounded-xl border border-[#E8E1D7] bg-[#FAF7F2] text-xs text-neutral-900 focus:outline-none focus:border-brand-500"
          />
          <button
            onClick={handleParseText}
            disabled={isProcessing || !textInput.trim()}
            className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-black transition-all"
          >
            {isProcessing ? 'Processing...' : 'Extract Items to Cart'}
          </button>
        </section>

        <section className="bg-white rounded-3xl border border-[#E8E1D7] p-4 sm:p-5 space-y-3">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
            Upload Handwritten List (OCR)
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="w-full py-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D7] hover:border-brand-500 text-neutral-900 text-xs font-bold transition-all"
          >
            Choose Photo of Handwritten Note
          </button>
        </section>
      </main>
    </div>
  );
}
