import React from 'react';

interface LoadingFallbackProps {
  title?: string;
  subtitle?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({ 
  title = 'Cargando contenido...', 
  subtitle = 'Preparando la vista' 
}) => {
  return (
    <div className="w-full py-12 px-4 flex flex-col items-center justify-center space-y-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="w-full max-w-4xl flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-72 bg-slate-100 dark:bg-slate-850 rounded-lg" />
        </div>
        <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl hidden sm:block" />
      </div>

      {/* Grid Content Skeleton */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="h-32 bg-slate-200/70 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3">
          <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded" />
          <div className="h-8 w-36 bg-slate-300 dark:bg-slate-700 rounded-lg" />
        </div>
        <div className="h-32 bg-slate-200/70 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3">
          <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded" />
          <div className="h-8 w-36 bg-slate-300 dark:bg-slate-700 rounded-lg" />
        </div>
        <div className="h-32 bg-slate-200/70 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3">
          <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded" />
          <div className="h-8 w-36 bg-slate-300 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>

      {/* Big Body Skeleton */}
      <div className="w-full max-w-4xl h-64 bg-slate-100 dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-center items-center text-center space-y-2">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-2" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
};
