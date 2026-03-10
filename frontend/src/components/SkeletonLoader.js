// Skeleton Loaders for slow connection optimization
import { motion } from 'framer-motion';

// Post Skeleton
export const PostSkeleton = () => (
  <div className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse">
    {/* Header */}
    <div className="flex items-center gap-3 p-4">
      <div className="w-11 h-11 rounded-xl bg-gray-200"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
    {/* Media */}
    <div className="aspect-square bg-gray-200"></div>
    {/* Actions */}
    <div className="p-4">
      <div className="flex gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
        <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
        <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
);

// Story Skeleton
export const StorySkeleton = () => (
  <div className="flex-shrink-0 flex flex-col items-center gap-2 animate-pulse">
    <div className="w-[72px] h-[72px] rounded-2xl bg-gray-200"></div>
    <div className="h-3 bg-gray-200 rounded w-12"></div>
  </div>
);

// Feed Loading Component with multiple skeletons
export const FeedSkeleton = ({ count = 3 }) => (
  <div className="space-y-6">
    {Array.from({ length: count }).map((_, i) => (
      <PostSkeleton key={i} />
    ))}
  </div>
);

// Stories Row Skeleton
export const StoriesRowSkeleton = () => (
  <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <StorySkeleton key={i} />
    ))}
  </div>
);

// Profile Skeleton
export const ProfileSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-32 bg-gray-200 rounded-t-3xl"></div>
    <div className="p-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gray-200 -mt-12"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-full mt-4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
);

// Product Card Skeleton
export const ProductSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow animate-pulse">
    <div className="aspect-square bg-gray-200"></div>
    <div className="p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-5 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

// Chat Message Skeleton
export const MessageSkeleton = ({ isOwn = false }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-pulse`}>
    <div className={`max-w-[70%] ${isOwn ? 'bg-blue-100' : 'bg-gray-200'} rounded-2xl p-4`}>
      <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-20"></div>
    </div>
  </div>
);

// Notification Skeleton
export const NotificationSkeleton = () => (
  <div className="flex items-center gap-3 p-4 animate-pulse">
    <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
    <div className="flex-1">
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  </div>
);

// Generic Grid Skeleton
export const GridSkeleton = ({ count = 6, columns = 3 }) => (
  <div className={`grid grid-cols-${columns} gap-1`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="aspect-square bg-gray-200 animate-pulse"></div>
    ))}
  </div>
);

// Shimmer effect component
export const Shimmer = ({ className = '' }) => (
  <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      animate={{ x: ['-100%', '100%'] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
    />
  </div>
);
