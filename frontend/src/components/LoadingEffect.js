import React from 'react';

// Shimmer Effect สำหรับ Loading
const ShimmerEffect = ({ width = "w-full", height = "h-4", className = "" }) => {
  return (
    <div className={`${width} ${height} bg-gray-200 rounded-md animate-pulse relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
    </div>
  );
};

// Card Skeleton สำหรับ Loading Cards
const CardSkeleton = ({ rows = 3 }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-3 animate-pulse">
      <ShimmerEffect width="w-3/4" height="h-6" />
      {Array.from({ length: rows }).map((_, i) => (
        <ShimmerEffect key={i} width="w-full" height="h-4" />
      ))}
      <div className="flex space-x-2 pt-2">
        <ShimmerEffect width="w-16" height="h-8" />
        <ShimmerEffect width="w-20" height="h-8" />
      </div>
    </div>
  );
};

// Table Row Skeleton สำหรับ Loading Tables
const TableRowSkeleton = ({ columns = 4 }) => {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <ShimmerEffect width="w-full" height="h-4" />
        </td>
      ))}
    </tr>
  );
};

// Form Field Skeleton สำหรับ Loading Forms
const FormSkeleton = ({ fields = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <ShimmerEffect width="w-24" height="h-4" />
          <ShimmerEffect width="w-full" height="h-10" />
        </div>
      ))}
      <div className="pt-4">
        <ShimmerEffect width="w-32" height="h-10" />
      </div>
    </div>
  );
};

// Loading Spinner
const LoadingSpinner = ({ size = "medium", color = "blue" }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12"
  };

  const colorClasses = {
    blue: "border-blue-600",
    green: "border-green-600",
    red: "border-red-600",
    gray: "border-gray-600"
  };

  return (
    <div className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full animate-spin`} />
  );
};

// Loading Overlay สำหรับครอบทั้งหน้า
const LoadingOverlay = ({ message = "กำลังโหลด...", isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center space-y-4">
        <LoadingSpinner size="large" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Button Loading State
const LoadingButton = ({ 
  children, 
  loading = false, 
  disabled = false, 
  className = "btn-primary",
  ...props 
}) => {
  return (
    <button 
      disabled={loading || disabled}
      className={`${className} ${loading ? 'opacity-70 cursor-not-allowed' : ''} flex items-center justify-center space-x-2`}
      {...props}
    >
      {loading && <LoadingSpinner size="small" color="gray" />}
      <span>{loading ? 'กำลังโหลด...' : children}</span>
    </button>
  );
};

// Page Loading สำหรับ Initial Page Load
const PageLoading = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar Skeleton */}
      <div className="bg-white shadow-lg p-4">
        <div className="container mx-auto flex justify-between items-center">
          <ShimmerEffect width="w-32" height="h-8" />
          <div className="flex space-x-4">
            <ShimmerEffect width="w-16" height="h-8" />
            <ShimmerEffect width="w-16" height="h-8" />
            <ShimmerEffect width="w-20" height="h-8" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} rows={3} />
          ))}
        </div>
      </div>
    </div>
  );
};

// No default export - use named exports only
export {
  ShimmerEffect,
  CardSkeleton,
  TableRowSkeleton,
  FormSkeleton,
  LoadingSpinner,
  LoadingOverlay,
  LoadingButton,
  PageLoading
};

// Custom CSS สำหรับ shimmer animation
const shimmerCSS = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-shimmer {
    animation: shimmer 1.5s infinite;
  }
`;

// เพิ่ม CSS ใน head ถ้ายังไม่มี
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = shimmerCSS;
  document.head.appendChild(styleElement);
}
