import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { useSecurity } from '../context/SecurityContext';
import { formatMoney, formatMonthPeriod, getCurrentMonthPeriod } from '../utils/format';
import { ChevronLeft, ChevronRight, Plus, Sparkles, Wallet, Calendar, Sun, Moon, Monitor, Zap, Lock } from 'lucide-react';

interface HeaderProps {
  onOpenNewTransaction: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewTransaction, activeTab, setActiveTab }) => {
  const { selectedPeriod, setSelectedPeriod, metrics, currency, theme, effectiveTheme, setTheme, extremeSavingsMode } = useFinance();
  const { isLockEnabled, lockApp } = useSecurity();

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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo y Nombre */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div 
              role="button"
              tabIndex={0}
              aria-label="FinanTrack Pro, ir al panel de resumen"
              onClick={() => setActiveTab('resumen')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('resumen');
                }
              }}
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">FinanTrack</span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                    Pro
                  </span>
                  {extremeSavingsMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab('presupuestos');
                      }}
                      title="Modo de Ahorro Extremo activo. Clic para ver plan de recortes"
                      className="ml-1 hidden md:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all animate-pulse"
                    >
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <span>Ahorro Extremo</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">Control de Finanzas</p>
              </div>
            </div>
          </div>

          {/* Selector de Periodo / Mes */}
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-0.5 sm:p-1 rounded-xl border border-slate-200/70 dark:border-slate-700 shadow-inner shrink-0">
            <button
              onClick={handlePrevMonth}
              title="Mes anterior"
              aria-label="Ir al mes anterior"
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleCurrentMonth}
              aria-label={`Mes actual seleccionado: ${formatMonthPeriod(selectedPeriod)}. Toca para volver al mes en curso.`}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-lg transition-all active:scale-95 min-h-[32px] sm:min-h-[36px] shrink-0 whitespace-nowrap ${
                isCurrentMonth 
                  ? 'text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-700 shadow-sm' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="capitalize">{formatMonthPeriod(selectedPeriod)}</span>
            </button>

            <button
              onClick={handleNextMonth}
              title="Mes siguiente"
              aria-label="Ir al mes siguiente"
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Acciones y Resumen Rápido */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Quick theme toggle */}
            <button
              onClick={toggleTheme}
              title={`Tema actual: ${theme === 'system' ? `Sistema (${effectiveTheme})` : theme}. Clic para cambiar`}
              aria-label={`Cambiar apariencia. Modo actual: ${theme}`}
              className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 active:scale-95 transition-all"
            >
              {theme === 'system' ? (
                <Monitor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : effectiveTheme === 'dark' ? (
                <Moon className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
            </button>

            {/* Bloqueo de pantalla (Presente siempre por defecto con tamaño constante) */}
            <button
              type="button"
              onClick={() => {
                if (isLockEnabled) {
                  lockApp();
                } else {
                  setActiveTab('ajustes');
                }
              }}
              title={
                isLockEnabled
                  ? "Bloqueo activo: Clic para bloquear pantalla ahora"
                  : "Bloqueo desactivado: Clic para configurar PIN en Ajustes"
              }
              aria-label={
                isLockEnabled
                  ? "Bloquear pantalla inmediatamente"
                  : "Configurar bloqueo de pantalla con PIN en ajustes"
              }
              className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center rounded-xl border active:scale-95 transition-all ${
                isLockEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700'
              }`}
            >
              <Lock className={`w-4 h-4 ${isLockEnabled ? 'stroke-[2.2]' : 'opacity-70'}`} />
            </button>

            {/* Net Worth badge (visible en pantallas medianas y grandes) */}
            <div 
              role="button"
              tabIndex={0}
              aria-label={`Patrimonio neto total: ${formatMoney(metrics.totalNetWorth, currency)}. Toca para ver detalle`}
              onClick={() => setActiveTab('patrimonio')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('patrimonio');
                }
              }}
              className="hidden xl:flex flex-col items-end px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
            >
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">Patrimonio Neto</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono-num">
                {formatMoney(metrics.totalNetWorth, currency)}
              </span>
            </div>

            {/* Asesor IA Botón */}
            <button
              onClick={() => setActiveTab('asesor')}
              aria-label="Consultar Asesor Financiero con Inteligencia Artificial"
              className={`h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-medium rounded-xl border transition-all active:scale-95 shrink-0 flex items-center gap-1.5 ${
                activeTab === 'asesor'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0 group-hover:animate-spin" />
              <span className="hidden sm:inline">Asesor IA</span>
            </button>

            {/* Botón Nuevo Movimiento (Visible en pantallas grandes; en móvil está centrado en el menú inferior) */}
            <button
              onClick={onOpenNewTransaction}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all hover:scale-[1.02] shrink-0"
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
