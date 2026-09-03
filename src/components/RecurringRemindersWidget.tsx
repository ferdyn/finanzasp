import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useUser } from '../context/UserContext';
import { formatMoney, formatDate } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';
import { 
  getRecurringStatus, 
  formatFrequency, 
  checkAccountBalanceSufficiency 
} from '../utils/recurring';
import { RecurringBill } from '../types/finance';
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight, 
  Plus, 
  Check, 
  RotateCw, 
  Sparkles,
  Wallet,
  MoreVertical,
  X,
  AlertCircle
} from 'lucide-react';

interface RecurringRemindersWidgetProps {
  onOpenNewRecurring?: () => void;
  onOpenSettings?: () => void;
  className?: string;
}

export const RecurringRemindersWidget: React.FC<RecurringRemindersWidgetProps> = ({
  onOpenNewRecurring,
  onOpenSettings,
  className = '',
}) => {
  const { 
    recurringBills, 
    accounts, 
    categories, 
    currency, 
    processRecurringBill, 
    postponeRecurringBill,
    getAccountById,
    getCategoryById 
  } = useFinance();
  const { hasPermission } = useUser();
  const canCreateTransactions = hasPermission('canCreateTransactions');
  const canManageRecurring = hasPermission('canManageRecurring');

  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'week' | 'month'>('all');
  const [successToast, setSuccessToast] = useState<{ id: string; message: string } | null>(null);
  const [postponeMenuOpenId, setPostponeMenuOpenId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Procesar estado de cada recurrente
  const enrichedBills = recurringBills
    .filter(b => b.isActive)
    .map(bill => {
      const statusInfo = getRecurringStatus(bill.nextDueDate, bill.reminderDays || 7);
      const category = getCategoryById(bill.categoryId);
      const account = getAccountById(bill.accountId);
      const sufficiency = checkAccountBalanceSufficiency(bill, account);
      
      return {
        ...bill,
        statusInfo,
        category,
        account,
        sufficiency,
      };
    })
    .sort((a, b) => {
      // Prioridad: 1. Vencidos, 2. Hoy, 3. Urgentes, 4. Próximos días
      return a.statusInfo.daysLeft - b.statusInfo.daysLeft;
    });

  // Estadísticas y contadores
  const overdueCount = enrichedBills.filter(b => b.statusInfo.isOverdue).length;
  const todayCount = enrichedBills.filter(b => b.statusInfo.isToday).length;
  const urgentCount = enrichedBills.filter(b => b.statusInfo.daysLeft >= 0 && b.statusInfo.daysLeft <= 3).length;
  const weekCount = enrichedBills.filter(b => b.statusInfo.daysLeft >= 0 && b.statusInfo.daysLeft <= 7).length;
  
  // Total a pagar en los próximos 7 días (gastos)
  const upcomingExpenses7Days = enrichedBills
    .filter(b => b.type === 'expense' && b.statusInfo.daysLeft <= 7)
    .reduce((sum, b) => sum + b.amount, 0);

  // Filtrado de la lista
  const filteredBills = enrichedBills.filter(bill => {
    if (activeFilter === 'urgent') {
      return bill.statusInfo.daysLeft <= 3; // Incluye vencidos, hoy y próximos 3 días
    }
    if (activeFilter === 'week') {
      return bill.statusInfo.daysLeft <= 7;
    }
    if (activeFilter === 'month') {
      return bill.statusInfo.daysLeft <= 30;
    }
    return true;
  });

  const handleProcessBill = (bill: RecurringBill) => {
    setProcessingId(bill.id);
    setTimeout(() => {
      processRecurringBill(bill.id);
      setProcessingId(null);
      setSuccessToast({
        id: bill.id,
        message: `¡${bill.name} registrado como movimiento y actualizado!`,
      });
      setTimeout(() => setSuccessToast(null), 4000);
    }, 200);
  };

  const handlePostpone = (billId: string, days: number) => {
    postponeRecurringBill(billId, days);
    setPostponeMenuOpenId(null);
    setSuccessToast({
      id: billId,
      message: `Fecha pospuesta +${days} días con éxito`,
    });
    setTimeout(() => setSuccessToast(null), 3000);
  };

  if (recurringBills.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Recordatorios de Pagos</h3>
          </div>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Configurar en Ajustes
            </button>
          )}
        </div>
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-70" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sin pagos recurrentes configurados</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 mb-3">
            Programa alquileres, servicios o suscripciones para recibir avisos antes de su vencimiento.
          </p>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              + Añadir Primer Recurrente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4 ${className}`}>
      
      {/* Toast de notificación rápida */}
      {successToast && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{successToast.message}</span>
          </div>
          <button 
            onClick={() => setSuccessToast(null)}
            className="p-1 hover:bg-emerald-700 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Encabezado del Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            overdueCount > 0 
              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20' 
              : todayCount > 0 
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20' 
              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
          }`}>
            <Bell className={`w-5 h-5 ${overdueCount > 0 || todayCount > 0 ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Recordatorios de Vencimiento
              </h3>
              {(overdueCount > 0 || todayCount > 0) && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                  {overdueCount > 0 ? `${overdueCount} VENCIDO${overdueCount > 1 ? 'S' : ''}` : `${todayCount} VENCE HOY`}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Próximos 7 días:{' '}
              <strong className="text-slate-800 dark:text-slate-200 font-mono-num">
                {formatMoney(upcomingExpenses7Days, currency)}
              </strong>{' '}
              en {weekCount} compromiso{weekCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Acciones del encabezado */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <span>Gestionar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Pestañas de Filtro Rápido */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeFilter === 'all'
              ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Todos ({enrichedBills.length})
        </button>

        <button
          onClick={() => setActiveFilter('urgent')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeFilter === 'urgent'
              ? 'bg-rose-600 text-white shadow-sm'
              : overdueCount + todayCount + urgentCount > 0
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400'
          }`}
        >
          <span>Urgentes / Vencidos</span>
          {(overdueCount + todayCount + urgentCount) > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeFilter === 'urgent' ? 'bg-white text-rose-600' : 'bg-rose-600 text-white'
            }`}>
              {overdueCount + todayCount + urgentCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveFilter('week')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeFilter === 'week'
              ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Esta semana ({weekCount})
        </button>

        <button
          onClick={() => setActiveFilter('month')}
          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
            activeFilter === 'month'
              ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Próximos 30 días
        </button>
      </div>

      {/* Lista interactiva de recordatorios */}
      {filteredBills.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            No hay recordatorios que coincidan con este filtro
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredBills.map((bill) => {
            const isProcessing = processingId === bill.id;
            const isMenuOpen = postponeMenuOpenId === bill.id;
            const isExpense = bill.type === 'expense';
            const { statusInfo, category, account, sufficiency } = bill;

            return (
              <div
                key={bill.id}
                className={`p-3.5 rounded-xl border transition-all relative ${
                  statusInfo.isOverdue
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs'
                    : statusInfo.isToday
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Info Principal */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5 sm:mt-0"
                      style={{ backgroundColor: category?.color || (isExpense ? '#ef4444' : '#10b981') }}
                    >
                      <DynamicIcon name={category?.icon || (isExpense ? 'CreditCard' : 'Wallet')} size={16} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {bill.name}
                        </span>

                        {/* Badge de vencimiento interactivo */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor} ${statusInfo.isOverdue || statusInfo.isToday ? 'animate-ping' : ''}`} />
                          <span>{statusInfo.label}</span>
                        </span>

                        {/* Frecuencia */}
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400">
                          {formatFrequency(bill.frequency)}
                        </span>
                      </div>

                      {/* Detalles de fecha y cuenta asociada */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Vence: {bill.nextDueDate}</span>
                        </span>

                        {account && (
                          <span className="flex items-center gap-1">
                            <Wallet className="w-3 h-3 text-slate-400" />
                            <span>{account.name}</span>
                            {isExpense && (
                              <span className={`ml-1 font-semibold ${
                                sufficiency.isSufficient 
                                  ? 'text-emerald-600 dark:text-emerald-400' 
                                  : 'text-rose-600 dark:text-rose-400 flex items-center gap-0.5'
                              }`}>
                                {sufficiency.isSufficient ? (
                                  '(Saldo OK)'
                                ) : (
                                  <>
                                    <AlertCircle className="w-2.5 h-2.5" />
                                    <span>(Faltan {formatMoney(Math.abs(sufficiency.difference), currency)})</span>
                                  </>
                                )}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Importe y Botones de Acción */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <span className={`block text-sm sm:text-base font-black font-mono-num ${
                        isExpense ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isExpense ? '-' : '+'}{formatMoney(bill.amount, currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Botón Pagar / Registrar Ahora */}
                      {canCreateTransactions && (
                        <button
                          type="button"
                          onClick={() => handleProcessBill(bill)}
                          disabled={isProcessing}
                          title={isExpense ? 'Registrar gasto y avanzar fecha al siguiente ciclo' : 'Registrar ingreso y avanzar fecha'}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                            statusInfo.isOverdue || statusInfo.isToday
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                              : 'bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {isProcessing ? (
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                          <span>{isExpense ? 'Registrar Pago' : 'Registrar Cobro'}</span>
                        </button>
                      )}

                      {/* Menú de Posponer */}
                      {canManageRecurring && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setPostponeMenuOpenId(isMenuOpen ? null : bill.id)}
                            title="Posponer vencimiento"
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs transition-colors border border-slate-200/80 dark:border-slate-700"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-20 animate-in fade-in zoom-in-95 duration-150">
                              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Posponer fecha
                              </div>
                              <button
                                type="button"
                                onClick={() => handlePostpone(bill.id, 3)}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                              >
                                <span>+3 días</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePostpone(bill.id, 7)}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                              >
                                <span>+1 semana</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePostpone(bill.id, 15)}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-between"
                              >
                                <span>+15 días</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pie interactivo del widget */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Al pulsar <strong>Registrar</strong> se crea el movimiento contable y avanza el ciclo.</span>
        </div>
        {onOpenSettings && canManageRecurring && (
          <button
            onClick={onOpenSettings}
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            + Añadir o editar recordatorios
          </button>
        )}
      </div>

    </div>
  );
};
