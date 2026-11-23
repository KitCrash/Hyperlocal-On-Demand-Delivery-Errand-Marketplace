'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { OrderItem, ServiceType } from '../types';
import { apiRequest } from '../lib/api';

interface CartContextType {
  items: OrderItem[];
  serviceType: ServiceType;
  setServiceType: (type: ServiceType) => void;
  pickupAddress: string;
  setPickupAddress: (addr: string) => void;
  pickupNotes: string;
  setPickupNotes: (notes: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (addr: string) => void;
  deliveryNotes: string;
  setDeliveryNotes: (notes: string) => void;
  errandInstructions: string;
  setErrandInstructions: (instructions: string) => void;
  addItem: (item: OrderItem) => void;
  updateItem: (index: number, item: OrderItem) => void;
  removeItem: (index: number) => void;
  clearCart: () => void;
  combineAndDeduplicate: () => Promise<{ mergedCount: number; uncertainCount: number }>;
  totalEstimatedCost: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [serviceType, setServiceType] = useState<ServiceType>('GROCERY_SHOPPING');
  const [pickupAddress, setPickupAddress] = useState('New Town Fresh Vegetable & Fish Mandi, Stall #14');
  const [pickupNotes, setPickupNotes] = useState('Buy fresh morning lot only');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 4B, Sunrise Towers, Action Area 1');
  const [deliveryNotes, setDeliveryNotes] = useState('Call on arrival, leave with security if unavailable');
  const [errandInstructions, setErrandInstructions] = useState('');

  const addItem = (newItem: OrderItem) => {
    setItems((prev) => {
      // Check if product already in list from manual
      const existingIdx = prev.findIndex(
        (i) => (newItem.productId && i.productId === newItem.productId) || (i.name.toLowerCase() === newItem.name.toLowerCase() && i.inputMethod === newItem.inputMethod)
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        const exist = updated[existingIdx];
        const newQty = exist.quantity + (newItem.quantity || 1);
        updated[existingIdx] = {
          ...exist,
          quantity: newQty,
          estimatedPrice: Math.round(((exist.estimatedPrice / exist.quantity) * newQty) * 100) / 100,
        };
        return updated;
      }
      return [...prev, newItem];
    });
  };

  const updateItem = (index: number, updatedItem: OrderItem) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = updatedItem;
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setItems([]);
  };

  // Combine and deduplicate across manual, voice, and image inputs using AI
  const combineAndDeduplicate = async () => {
    const manualItems = items.filter((i) => i.inputMethod === 'MANUAL');
    const voiceItems = items.filter((i) => i.inputMethod === 'VOICE');
    const imageItems = items.filter((i) => i.inputMethod === 'IMAGE_OCR');

    const result = await apiRequest<{
      items: OrderItem[];
      mergedDuplicatesCount: number;
      uncertainItemsCount: number;
    }>('/ai/combine-deduplicate', {
      method: 'POST',
      body: JSON.stringify({ manualItems, voiceItems, imageItems }),
    });

    setItems(result.items);
    return {
      mergedCount: result.mergedDuplicatesCount,
      uncertainCount: result.uncertainItemsCount,
    };
  };

  const totalEstimatedCost = items.reduce(
    (sum, item) => sum + (item.estimatedPrice || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        serviceType,
        setServiceType,
        pickupAddress,
        setPickupAddress,
        pickupNotes,
        setPickupNotes,
        deliveryAddress,
        setDeliveryAddress,
        deliveryNotes,
        setDeliveryNotes,
        errandInstructions,
        setErrandInstructions,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        combineAndDeduplicate,
        totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
