import React from 'react';

export function SkeletonLoader({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg p-6 animate-pulse"
        >
          <div className="flex items-start gap-4">
            {/* Checkbox skeleton */}
            <div className="w-4 h-4 bg-slate-700 rounded mt-1 flex-shrink-0" />
            
            <div className="flex-1 min-w-0 space-y-3">
              {/* ID and badges skeleton */}
              <div className="flex items-center gap-3">
                <div className="h-4 w-20 bg-slate-700 rounded" />
                <div className="h-4 w-16 bg-slate-700 rounded" />
                <div className="h-4 w-12 bg-slate-700 rounded" />
              </div>
              
              {/* Title skeleton */}
              <div className="h-5 w-3/4 bg-slate-700 rounded" />
              
              {/* Description skeleton */}
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-700 rounded" />
                <div className="h-3 w-5/6 bg-slate-700 rounded" />
              </div>
              
              {/* Footer info skeleton */}
              <div className="flex gap-4 pt-2">
                <div className="h-3 w-24 bg-slate-700 rounded" />
                <div className="h-3 w-28 bg-slate-700 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeletonLoader({ rows = 5 }) {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700/50 border-b border-slate-600">
            <tr>
              <th className="px-6 py-4 text-left">
                <div className="h-4 w-8 bg-slate-700 rounded animate-pulse" />
              </th>
              <th className="px-6 py-4 text-left">
                <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
              </th>
              <th className="px-6 py-4 text-left">
                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
              </th>
              <th className="px-6 py-4 text-left">
                <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
              </th>
              <th className="px-6 py-4 text-left">
                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
              </th>
              <th className="px-6 py-4 text-left">
                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
              </th>
              <th className="px-6 py-4 text-right">
                <div className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-600">
            {Array.from({ length: rows }).map((_, idx) => (
              <tr key={idx} className="bg-slate-900/20">
                {Array.from({ length: 7 }).map((_, colIdx) => (
                  <td key={colIdx} className="px-6 py-4">
                    <div className="h-4 bg-slate-700 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
