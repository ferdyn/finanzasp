import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney, formatMonthPeriod, getCurrentMonthPeriod } from '../utils/format';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Wallet, Calendar, Sun, Moon, Monitor } from 'lucide-react';

interface HeaderProps {
  onOpenNewTransaction: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewTransaction, activeTab, setActiveTab }) => {
  const { selectedPeriod, setSelectedPeriod, metrics, currency, theme, effectiveTheme, setTheme } = useFinance();

  const handlePrevMonth = () => {
    const [year, month] = selectedPeriod.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const newPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedPeriod(newPeriod);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedPeriod.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const newPeriod = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedPeriod(newPeriod);
  };

  const handleCurrentMonth = () => {
    setSelectedPeriod(getCurrentMonthPeriod());
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const isCurrentMonth = selectedPeriod === getCurrentMonthPeriod();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo y Nombre */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('resumen')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">FinanTrack</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                    Pro
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Control de Finanzas Personales</p>
              </div>
            </div>
          </div>

          {/* Selector de Periodo / Mes */}
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700 shadow-inner">
            <button
              onClick={handlePrevMonth}
              title="Mes anterior"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleCurrentMonth}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                isCurrentMonth 
                  ? 'text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-700 shadow-sm' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{formatMonthPeriod(selectedPeriod)}</span>
            </button>

            <button
              onClick={handleNextMonth}
              title="Mes siguiente"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Acciones y Resumen Rápido */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick theme toggle */}
            <button
              onClick={toggleTheme}
              title={`Tema actual: ${theme === 'system' ? `Sistema (${effectiveTheme})` : theme}. Clic para cambiar`}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-colors"
            >
              {theme === 'system' ? (
                <Monitor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : effectiveTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {/* Net Worth badge */}
            <div 
              onClick={() => setActiveTab('patrimonio')}
              className="hidden md:flex flex-col items-end px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">Patrimonio Neto</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono-num">
                {formatMoney(metrics.totalNetWorth, currency)}
              </span>
            </div>

            {/* Asesor IA Botón */}
            <button
              onClick={() => setActiveTab('asesor')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-xl border transition-all ${
                activeTab === 'asesor'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-500 group-hover:animate-spin" />
              <span className="hidden sm:inline">Asesor IA</span>
            </button>

            {/* Botón Nuevo Movimiento (Visible en pantallas grandes; en móvil está centrado en el menú inferior) */}
            <button
              onClick={onOpenNewTransaction}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
