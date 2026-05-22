import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
}

export function StarRating({ rating, max = 5, size = 14, showValue = false, reviewCount }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const halfFilled = !filled && i < rating;
        return (
          <Star
            key={i}
            size={size}
            className={filled || halfFilled ? 'star-filled' : 'star-empty'}
            style={{
              fill: filled ? '#f59e0b' : halfFilled ? 'url(#half)' : '#d1d5db',
              color: filled || halfFilled ? '#f59e0b' : '#d1d5db',
            }}
          />
        );
      })}
      {showValue && (
        <span className="text-sm font-semibold text-gray-700 ml-1">{rating.toFixed(1)}</span>
      )}
      {reviewCount !== undefined && (
        <span className="text-xs text-gray-500">({reviewCount})</span>
      )}
    </div>
  );
}
