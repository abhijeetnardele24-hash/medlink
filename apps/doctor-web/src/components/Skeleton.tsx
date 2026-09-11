import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 p-4 w-full">
      {/* 4 Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 h-32">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="w-20 h-6 rounded-full" />
            </div>
            <Skeleton className="w-16 h-8 mb-2" />
            <Skeleton className="w-24 h-4" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Skeleton */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 h-[500px]">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="w-40 h-6" />
            <Skeleton className="w-24 h-4" />
          </div>
          <div className="space-y-6 ml-4 border-l-2 border-gray-100 pl-8 relative">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 h-24 w-full relative">
                 <div className="absolute -left-[43px] top-4 w-4 h-4 rounded-full bg-gray-200 border-2 border-white" />
                 <Skeleton className="w-1/3 h-6 mb-3" />
                 <Skeleton className="w-1/2 h-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Requests Skeleton */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="w-32 h-6" />
            <Skeleton className="w-8 h-6 rounded-md" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 h-28">
                <div className="flex justify-between mb-2">
                  <Skeleton className="w-24 h-5" />
                  <Skeleton className="w-12 h-4" />
                </div>
                <Skeleton className="w-full h-4 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="flex-1 h-8 rounded-lg" />
                  <Skeleton className="flex-1 h-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
