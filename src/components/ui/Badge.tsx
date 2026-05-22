import React from 'react';

type BadgeColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'gray' | 'orange';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: 'sm' | 'md';
  className?: string;
}

const colorMap: Record<BadgeColor, string> = {
  red: 'bg-red-500 text-white',
  blue: 'bg-blue-600 text-white',
  green: 'bg-emerald-500 text-white',
  yellow: 'bg-yellow-400 text-yellow-900',
  purple: 'bg-purple-600 text-white',
  gray: 'bg-gray-200 text-gray-700',
  orange: 'bg-orange-500 text-white',
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, color = 'blue', size = 'md', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center font-bold rounded-full',
        colorMap[color],
        sizeMap[size],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
