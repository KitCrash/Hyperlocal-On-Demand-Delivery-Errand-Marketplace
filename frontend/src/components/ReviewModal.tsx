'use client';

import React, { useState } from 'react';
import { Order } from '../types';
import { apiRequest } from '../lib/api';
import { Star, X, CheckCircle2 } from 'lucide-react';

interface ReviewModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  order,
  isOpen,
  onClose,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Punctual delivery', 'Fresh produce']);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const availableTags = [
    'Punctual delivery',
    'Fresh produce',
    'Careful handling',
    'Polite rider',
    'Fair market rates',
    'Clear communication',
  ];

  const toggleTag = (t: string) => {
    if (selectedTags.includes(t)) {
      setSelectedTags(selectedTags.filter((x) => x !== t));
    } else {
      setSelectedTags([...selectedTags, t]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiRequest(`/orders/${order.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          rating,
          comment,
          tags: selectedTags,
        }),
      });
      onReviewSubmitted();
      onClose();
    } catch (err) {
      console.error('Failed to submit review', err);
      alert('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 to-brand-500 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold">Rate Your Delivery Experience</h3>
            <p className="text-xs text-white/90">
              Partner: {order.partner?.name || 'Rahul Sharma'} · Order #{order.orderNumber}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Star selector */}
          <div className="flex justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-neutral-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="text-center text-xs font-bold text-neutral-600">
            {rating === 5 && '🌟 Outstanding Service!'}
            {rating === 4 && '👍 Great Delivery'}
            {rating === 3 && '😐 Average Experience'}
            {rating === 2 && '👎 Needs Improvement'}
            {rating === 1 && '⚠️ Poor Service'}
          </div>

          {/* Quick tags */}
          <div>
            <span className="text-xs font-bold text-neutral-700 block mb-2">What went well?</span>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((t) => {
                const isSelected = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-bold text-neutral-700 block mb-1">
              Add a note for your rider:
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Arrived on time, handled vegetables with care..."
              className="w-full p-3 rounded-xl border border-neutral-200 text-xs focus:ring-1 focus:ring-brand-500 focus:outline-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};
