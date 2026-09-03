import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useSecurity } from '../context/SecurityContext';
import { useUser } from '../context/UserContext';
import { useTour } from '../context/TourContext';
import { UserSwitcher } from './UserSwitcher';
import { formatMoney, formatMonthPeriod, formatMonthPeriodShort, getCurrentMonthPeriod } from '../utils/format';
import { getRecurringStatus, formatFrequency } from '../utils/recurring';
import { 
  ChevronLeft, ChevronRight, Plus, Sparkles, Wallet, Calendar, 
  Sun, Moon, Monitor, Zap, Lock, Bell, Check, Clock, X, AlertTriangle, CheckCircle2,
  Eye, EyeOff, Printer, SlidersHorizontal, Settings, Shield, History, Users, BookOpen, Compass
} from 'lucide-react';

interface HeaderProps {
  onOpenNewTransaction: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenKyc?: () => void;
  onTriggerFraudAlert?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onOpenNewTransaction, 
  activeTab, 
  setActiveTab,
  onOpenKyc,
  onTriggerFraudAlert,
}) => {
  const { 
    selectedPeriod, 
    setSelectedPeriod, 
    metrics, 
    currency, 
    theme, 
    effectiveTheme, 
    setTheme, 
    extremeSavingsMode,
    privacyMode,
    togglePrivacyMode,
    recurringBills,
    processRecurringBill,
    postponeRecurringBill,
    getCategoryById,
    getAccountById
  } = useFinance();
  const { isLockEnabled, lockApp } = useSecurity();
  const { setIsUserManagementOpen, hasPermission } = useUser();
  const { startTour } = useTour();

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Cerrar paneles al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    if (notifOpen || menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifOpen, menuOpen]);

  // Recordatorios calculados
  const activeReminders = recurringBills
    .filter(b => b.isActive)
    .map(b => ({
      bill: b,
      status: getRecurringStatus(b.nextDueDate, b.reminderDays || 7),
      category: getCategoryById(b.categoryId),
      account: getAccountById(b.accountId),
    }))
    .sort((a, b) => a.status.daysLeft - b.status.daysLeft);

  const urgentOrApproaching = activeReminders.filter(r => r.status.daysLeft <= 7);
  const overdueOrTodayCount = activeReminders.filter(r => r.status.isOverdue || r.status.isToday).length;
  const badgeCount = urgentOrApproaching.length;

  const handleQuickPay = (billId: string, billName: string) => {
    processRecurringBill(billId);
    setSuccessToast(`¡${billName} registrado con éxito!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleQuickPostpone = (billId: string, days = 3) => {
    postponeRecurringBill(billId, days);
    setSuccessToast(`Vencimiento pospuesto +${days} días`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-3">
          
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
              className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="hidden md:block">
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
                      className="ml-1 hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all animate-pulse"
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
          <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-0.5 sm:p-1 rounded-xl border border-slate-200/70 dark:border-slate-700 shadow-inner shrink-0 max-w-[170px] sm:max-w-none">
            <button
              onClick={handlePrevMonth}
              title="Mes anterior"
              aria-label="Ir al mes anterior"
              className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            
            <button
              onClick={handleCurrentMonth}
              aria-label={`Mes actual seleccionado: ${formatMonthPeriod(selectedPeriod)}. Toca para volver al mes en curso.`}
              className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 md:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs md:text-sm font-semibold rounded-lg transition-all active:scale-95 min-h-[26px] sm:min-h-[30px] md:min-h-[34px] shrink-0 whitespace-nowrap ${
                isCurrentMonth 
                  ? 'text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-700 shadow-sm' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="capitalize hidden sm:inline">{formatMonthPeriod(selectedPeriod)}</span>
              <span className="capitalize sm:hidden">{formatMonthPeriodShort(selectedPeriod)}</span>
            </button>

            <button
              onClick={handleNextMonth}
              title="Mes siguiente"
              aria-label="Ir al mes siguiente"
              className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-all shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Acciones y Herramientas */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Campana de Notificaciones de Vencimientos y Recordatorios */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                id="header-notifications-button"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setMenuOpen(false);
                }}
                title={badgeCount > 0 ? `${badgeCount} recordatorios de pago pendientes o próximos` : 'Recordatorios de pagos'}
                aria-label={`Notificaciones. ${badgeCount} recordatorios pendientes`}
                aria-expanded={notifOpen}
                aria-haspopup="dialog"
                className={`relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0 flex items-center justify-center rounded-xl border active:scale-95 transition-all ${
                  overdueOrTodayCount > 0
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-100 shadow-xs'
                    : badgeCount > 0
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-100 shadow-xs'
                    : notifOpen
                    ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                }`}
              >
                <Bell className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${overdueOrTodayCount > 0 ? 'animate-bounce' : ''}`} />
                {badgeCount > 0 && (
                  <span className={`absolute -top-1 -right-1 min-w-[16px] sm:min-w-[18px] h-4 sm:h-[18px] px-0.5 sm:px-1 rounded-full text-[9px] sm:text-[10px] font-black text-white flex items-center justify-center shadow-sm ${
                    overdueOrTodayCount > 0 ? 'bg-rose-600' : 'bg-amber-500'
                  }`}>
                    {badgeCount}
                  </span>
                )}
              </button>

              {/* Backdrop móvil para cerrar panel al tocar fuera */}
              {notifOpen && (
                <div 
                  className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-xs z-40 sm:hidden"
                  onClick={() => setNotifOpen(false)}
                />
              )}

              {/* Panel Desplegable de Notificaciones */}
              {notifOpen && (
                <div 
                  role="dialog"
                  aria-label="Panel de recordatorios de pago"
                  className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-md sm:max-w-none bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Recordatorios de Pagos
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {badgeCount} activo{badgeCount === 1 ? '' : 's'}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className="sm:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                        aria-label="Cerrar notificaciones"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Toast rápido dentro del popover */}
                  {successToast && (
                    <div className="mx-3 my-2 p-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                      <span>{successToast}</span>
                    </div>
                  )}

                  {/* Lista de recordatorios */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 px-2 py-1 scrollbar-thin">
                    {urgentOrApproaching.length === 0 ? (
                      <div className="py-8 text-center px-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">¡Al día con tus pagos!</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">No hay vencimientos pendientes para los próximos 7 días.</p>
                      </div>
                    ) : (
                      urgentOrApproaching.map(({ bill, status, category, account }) => (
                        <div key={bill.id} className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${status.dotColor}`} />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{bill.name}</p>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <span>{status.label}</span>
                                  <span>•</span>
                                  <span>{account?.name || 'Cuenta'}</span>
                                </div>
                              </div>
                            </div>
                            <span className={`text-xs font-black font-mono-num shrink-0 ${
                              bill.type === 'expense' ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {bill.type === 'expense' ? '-' : '+'}{formatMoney(bill.amount, currency)}
                            </span>
                          </div>

                          {/* Acciones rápidas */}
                          {hasPermission('canCreateTransactions') && (
                            <div className="flex items-center justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => handleQuickPostpone(bill.id, 3)}
                                className="px-2 py-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Clock className="w-3 h-3" />
                                <span>+3d</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickPay(bill.id, bill.name)}
                                className="px-2.5 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-xs flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                <span>{bill.type === 'expense' ? 'Pagar' : 'Cobrar'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pie del popup */}
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold px-3">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        setActiveTab('resumen');
                      }}
                      className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      Ver en Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        setActiveTab('ajustes');
                      }}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Ajustes & Recordatorios
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Menú Popover de Opciones Secundarias (Herramientas, Privacidad, Tema, Bloqueo y Accesos) */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                id="header-tools-menu-button"
                onClick={() => {
                  setMenuOpen(!menuOpen);
                  setNotifOpen(false);
                }}
                title={
                  privacyMode 
                    ? "Opciones y Herramientas (Modo Espía ACTIVO)"
                    : "Opciones rápidas y herramientas del sistema"
                }
                aria-label="Abrir menú de herramientas y opciones secundarias"
                aria-expanded={menuOpen}
                aria-haspopup="dialog"
                className={`relative w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0 flex items-center justify-center rounded-xl border active:scale-95 transition-all ${
                  menuOpen
                    ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-600 shadow-xs'
                    : privacyMode
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-100 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                
                {/* Indicador de privacidad activa o modo extremo */}
                {privacyMode && (
                  <span 
                    title="Modo Espía activo"
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 animate-pulse" 
                  />
                )}
              </button>

              {/* Backdrop móvil para cerrar menú al tocar fuera */}
              {menuOpen && (
                <div 
                  className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-xs z-40 sm:hidden"
                  onClick={() => setMenuOpen(false)}
                />
              )}

              {/* Popover de Herramientas Secundarias */}
              {menuOpen && (
                <div 
                  role="dialog"
                  id="header-tools-popover"
                  aria-label="Menú de herramientas secundarias"
                  className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-84 max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3"
                >
                  {/* Encabezado del Popover */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                          Opciones Rápidas
                        </h4>
                        <span className="text-[10px] text-slate-400 leading-none">Herramientas del sistema</span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      className="sm:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                      aria-label="Cerrar opciones"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 1. MODO ESPÍA / PRIVACIDAD */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        privacyMode 
                          ? 'bg-amber-500 text-white shadow-xs' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Modo Espía</span>
                          <span className="text-[9px] font-mono font-semibold px-1 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Alt+P</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          Oculta saldos en público
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      type="button"
                      id="popover-toggle-privacy"
                      onClick={togglePrivacyMode}
                      role="switch"
                      aria-checked={privacyMode}
                      title="Alternar Modo Espía (Alt+P)"
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                        privacyMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          privacyMode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* 2. BLOQUEO DE PANTALLA */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isLockEnabled
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}>
                        <Lock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          {isLockEnabled ? 'Bloquear Pantalla' : 'Bloqueo con PIN'}
                        </span>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          {isLockEnabled ? 'Requiere PIN para acceder' : 'Configura tu PIN de seguridad'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="popover-lock-button"
                      onClick={() => {
                        setMenuOpen(false);
                        if (isLockEnabled) {
                          lockApp();
                        } else {
                          setActiveTab('ajustes');
                        }
                      }}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all active:scale-95 shrink-0 ${
                        isLockEnabled
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {isLockEnabled ? 'Bloquear' : 'Configurar'}
                    </button>
                  </div>

                  {/* 3. SELECTOR DE APARIENCIA Y TEMA */}
                  <div className="space-y-1.5 pt-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                      Apariencia
                    </span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          theme === 'light'
                            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : ''}`} />
                        <span>Claro</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          theme === 'dark'
                            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-indigo-400' : ''}`} />
                        <span>Oscuro</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme('system')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          theme === 'system'
                            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Monitor className={`w-3.5 h-3.5 ${theme === 'system' ? 'text-emerald-500' : ''}`} />
                        <span>Auto</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. ACCESOS RÁPIDOS A VISTAS SECUNDARIAS */}
                  <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      id="popover-nav-manual"
                      onClick={() => {
                        setMenuOpen(false);
                        setActiveTab('manual');
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                        activeTab === 'manual'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Manual de Usuario & Roles</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Documentación completa y permisos</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    <button
                      type="button"
                      id="popover-start-tour"
                      onClick={() => {
                        setMenuOpen(false);
                        startTour(0);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                          <Compass className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Tour Interactivo Guiado</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Paso a paso de 10 minutos</p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>

                    {onOpenKyc && (
                      <button
                        type="button"
                        id="popover-nav-kyc"
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenKyc();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Shield className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Verificación de Identidad (KYC)</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Documentación y validación biométrica</p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    )}

                    {onTriggerFraudAlert && (
                      <button
                        type="button"
                        id="popover-nav-fraud"
                        onClick={() => {
                          setMenuOpen(false);
                          onTriggerFraudAlert();
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Simular Alerta de Fraude (PSD2)</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Prueba del sistema de seguridad</p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    )}

                    {hasPermission('canViewAuditLog') && (
                      <button
                        type="button"
                        id="popover-nav-history"
                        onClick={() => {
                          setMenuOpen(false);
                          setActiveTab('historial');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                          activeTab === 'historial'
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <History className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Historial & Auditoría</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Registro de eventos y trazabilidad</p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    )}

                    {(hasPermission('canManageUsers') || hasPermission('canEditRolePermissions')) && (
                      <button
                        type="button"
                        id="popover-nav-users"
                        onClick={() => {
                          setMenuOpen(false);
                          setIsUserManagementOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Usuarios & Roles (RBAC)</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Control de permisos y accesos</p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    )}

                    {hasPermission('canExportReports') && (
                      <button
                        type="button"
                        id="popover-nav-reports"
                        onClick={() => {
                          setMenuOpen(false);
                          setActiveTab('reportes');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                          activeTab === 'reportes'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Printer className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Reportes & Balances PDF</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Impresión y exportación de balances</p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    )}

                    {hasPermission('canUseAiAdvisor') && (
                      <button
                        type="button"
                        id="popover-nav-advisor"
                        onClick={() => {
                          setMenuOpen(false);
                          setActiveTab('asesor');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                          activeTab === 'asesor'
                            ? 'bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-200'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Asesor Financiero IA</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Diagnóstico y recomendaciones</p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </button>
                    )}
                  </div>

                  {/* 5. PIE DEL MENÚ: AJUSTES COMPLETOS */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      id="popover-nav-settings"
                      onClick={() => {
                        setMenuOpen(false);
                        setActiveTab('ajustes');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Configuración y Preferencias Generales</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón de Ayuda / Manual de Usuario directo */}
            <button
              type="button"
              id="header-manual-btn"
              onClick={() => setActiveTab('manual')}
              aria-label="Abrir Manual de Usuario y Guía Interactiva"
              title="Manual de Usuario & Guía Interactiva"
              className={`hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 shrink-0 items-center justify-center rounded-xl border active:scale-95 transition-all ${
                activeTab === 'manual'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
            </button>

            {/* Selector de Usuario Activo (Multiusuario) */}
            <UserSwitcher />

            {/* Asesor IA Botón (Visible en tablet y desktop para acceso directo) */}
            {hasPermission('canUseAiAdvisor') && (
              <button
                onClick={() => setActiveTab('asesor')}
                aria-label="Consultar Asesor Financiero con Inteligencia Artificial"
                className={`hidden md:flex h-8 sm:h-9 md:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-medium rounded-xl border transition-all active:scale-95 shrink-0 items-center justify-center gap-1.5 ${
                  activeTab === 'asesor'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                    : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 shrink-0" />
                <span>Asesor IA</span>
              </button>
            )}

            {/* Botón Nuevo Movimiento (Visible en desktop; en móvil está centrado en la barra inferior) */}
            {hasPermission('canCreateTransactions') && (
              <button
                onClick={onOpenNewTransaction}
                className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all hover:scale-[1.02] shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Nuevo</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
