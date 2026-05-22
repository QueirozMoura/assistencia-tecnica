import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className = '', variant = 'rectangular' }: SkeletonProps) {
  const base =
    'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]';

  const variantClass = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl',
  }[variant];

  return <div className={[base, variantClass, className].join(' ')} style={{ animationName: 'shimmer' }} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-card p-4 space-y-4">
      <Skeleton className="w-full h-52" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3" variant="text" />
        <Skeleton className="h-5 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/3" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
