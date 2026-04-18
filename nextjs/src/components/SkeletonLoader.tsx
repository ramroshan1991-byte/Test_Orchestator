'use client';

import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
  height?: string;
  width?: string;
  circle?: boolean;
  className?: string;
}

export function SkeletonLoader({
  count = 1,
  height = 'h-4',
  width = 'w-full',
  circle = false,
  className = '',
}: SkeletonLoaderProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${height} ${width} bg-slate-700 ${
            circle ? 'rounded-full' : 'rounded'
          } skeleton`}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-4">
      <SkeletonLoader height="h-6" width="w-3/4" />
      <SkeletonLoader count={3} height="h-3" width="w-full" />
      <SkeletonLoader height="h-10" width="w-1/3" />
    </div>
  );
}

export function TestCaseCardSkeleton() {
  return (
    <div className="card p-6 space-y-4">
      <div className="space-y-2">
        <SkeletonLoader height="h-5" width="w-2/3" />
        <SkeletonLoader height="h-3" width="w-full" />
      </div>
      <div className="space-y-2">
        <SkeletonLoader height="h-3" width="w-full" />
        <SkeletonLoader height="h-3" width="w-5/6" />
      </div>
      <div className="flex gap-2">
        <SkeletonLoader height="h-6" width="w-24" circle={false} />
        <SkeletonLoader height="h-6" width="w-32" circle={false} />
      </div>
    </div>
  );
}
