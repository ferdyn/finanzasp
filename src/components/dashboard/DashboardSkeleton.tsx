import React from 'react';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Cargando resumen financiero" role="status">
      
      {/* Hero skeleton */}
      <div className="rounded-3xl bg-slate-200 dark:bg-slate-800/60 h-40 p-6 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-3.5 w-28 bg-slate-300 dark:bg-slate-700 rounded-md" />
          <div className="h-8 w-48 bg-slate-300 dark:bg-slate-700 rounded-md" />
        </div>
        <div className="h-4 w-64 bg-slate-300 dark:bg-slate-700 rounded-md" />
      </div>

      {/* Period summary cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800/60 p-4 space-y-3">
            <div className="h-3 w-16 bg-slate-300 dark:bg-slate-700 rounded-md" />
            <div className="h-6 w-24 bg-slate-300 dark:bg-slate-700 rounded-md" />
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-slate-200 dark:bg-slate-800/60" />
        ))}
      </div>

      {/* 2 column grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
        <div className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800/60" />
      </div>

      <span className="sr-only">Cargando datos del panel financiero...</span>
    </div>
  );
};
