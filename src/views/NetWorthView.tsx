import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useUser } from '../context/UserContext';
import { formatMoney } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';
import { Account, AccountType, CurrencyCode } from '../types/finance';
import { isLiabilityAccount, calculateNetWorthByCurrency } from '../utils/financialCalculations';
import { DigitalCardsSection } from '../components/DigitalCardsSection';
import { 
  Landmark, Plus, TrendingUp, ShieldAlert, ArrowUpRight, 
  CreditCard, PiggyBank, Banknote, Coins, Calculator, 
  Edit3, ArrowRightLeft, PieChart as PieIcon, Layers,
  FileCheck, CheckCircle2, AlertTriangle, RotateCcw, X
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface NetWorthViewProps {
  onOpenAccountModal: (account?: Account) => void;
  onOpenNewTransaction: () => void;
  onOpenCompoundSimulator: () => void;
  onOpenSecurityPinPrompt?: (onSuccess: () => void) => void;
}

export const NetWorthView: React.FC<NetWorthViewProps> = ({
  onOpenAccountModal,
  onOpenNewTransaction,
  onOpenCompoundSimulator,
  onOpenSecurityPinPrompt,
}) => {
  const { accounts, metrics, currency, auditLedger, reconcileAccountsWithLedger } = useFinance();
  const { hasPermission } = useUser();
  const canEditAccounts = hasPermission('canManageAccounts');

  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<ReturnType<typeof auditLedger> | null>(null);
  const [reconcileSuccessMsg, setReconcileSuccessMsg] = useState<string>('');

  const handleRunAudit = () => {
    const report = auditLedger();
    setAuditReport(report);
    setShowAuditModal(true);
    setReconcileSuccessMsg('');
  };

  const handleReconcile = () => {
    const res = reconcileAccountsWithLedger();
    setReconcileSuccessMsg(`Se han recalculado y conciliado ${res.reconciledCount} cuentas correctamente.`);
    setAuditReport(auditLedger());
  };

  const liabilityAccounts = accounts.filter(a => isLiabilityAccount(a));
  const assetAccounts = accounts.filter(a => !isLiabilityAccount(a));
  const netWorthByCur = calculateNetWorthByCurrency(accounts);
  const currencyKeys = Object.keys(netWorthByCur);
  const hasMultipleCurrencies = currencyKeys.length > 1;

  // Distribución por tipo de cuenta
  const typeLabels: Record<AccountType, string> = {
    checking: 'Cuentas Corrientes / Nómina',
    savings: 'Cuentas de Ahorro',
    investment: 'Inversiones & Fondos',
    credit: 'Tarjetas de Crédito',
    cash: 'Efectivo',
    crypto: 'Criptomonedas',
    debt: 'Deudas / Préstamos',
  };

  // Datos para desglose por clases de activos
  const assetClasses = [
    {
      name: 'Ahorros & Depósitos',
      value: accounts.filter(a => a.type === 'savings' && !isLiabilityAccount(a)).reduce((sum, a) => sum + Math.max(0, a.balance), 0),
      color: '#10B981',
    },
    {
      name: 'Inversiones & Fondos',
      value: accounts.filter(a => a.type === 'investment' && !isLiabilityAccount(a)).reduce((sum, a) => sum + Math.max(0, a.balance), 0),
      color: '#6366F1',
    },
    {
      name: 'Cuentas Corrientes',
      value: accounts.filter(a => a.type === 'checking' && !isLiabilityAccount(a)).reduce((sum, a) => sum + Math.max(0, a.balance), 0),
      color: '#3B82F6',
    },
    {
      name: 'Efectivo & Otros',
      value: accounts.filter(a => (a.type === 'cash' || a.type === 'crypto') && !isLiabilityAccount(a)).reduce((sum, a) => sum + Math.max(0, a.balance), 0),
      color: '#F59E0B',
    },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Patrimonio y Cuentas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Balance general de activos, ahorros, inversiones y pasivos
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRunAudit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            title="Verificar consistencia matemática entre saldos y libro mayor"
          >
            <FileCheck className="w-4 h-4 text-emerald-500" />
            <span>Auditar Libro Mayor</span>
          </button>

          <button
            onClick={onOpenCompoundSimulator}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Simulador de Interés</span>
          </button>

          {canEditAccounts && (
            <button
              onClick={() => onOpenAccountModal()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Cuenta</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner Principal de Patrimonio Neto con degradado adaptativo */}
      <div id="networth-hero-card" className="bg-gradient-to-br from-white via-slate-50 to-slate-100/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-white p-6 sm:p-8 rounded-3xl shadow-md shadow-slate-200/50 dark:shadow-xl dark:shadow-slate-900/20 relative overflow-hidden border border-slate-200/80 dark:border-slate-800 transition-colors">
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Patrimonio Neto Total
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono-num tracking-tight mt-1 text-slate-900 dark:text-white">
              {formatMoney(metrics.totalNetWorth, currency)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Suma de activos financieros menos deudas y saldos en tarjeta
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 bg-slate-100/90 dark:bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-white/10">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Total Activos
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono-num text-emerald-600 dark:text-emerald-300">
                +{formatMoney(metrics.totalAssets, currency)}
              </span>
            </div>

            <div className="w-px h-10 bg-slate-200 dark:bg-white/20" />

            <div>
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider block">
                Total Pasivos / Deudas
              </span>
              <span className="text-lg sm:text-xl font-bold font-mono-num text-rose-600 dark:text-rose-300">
                -{formatMoney(metrics.totalLiabilities, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Desglose por Divisa Real cuando existen cuentas multimoneda */}
      {hasMultipleCurrencies && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Desglose Patrimonial por Divisa
            </span>
            <span className="text-[11px] text-slate-400">
              Cálculo sin distorsión de tipos de cambio • Consolidación estimada en {currency}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currencyKeys.map(c => {
              const curData = netWorthByCur[c];
              return (
                <div key={c} className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200">{c}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{curData.accountCount} {curData.accountCount === 1 ? 'cuenta' : 'cuentas'}</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-white font-mono-num">
                    {formatMoney(curData.totalNetWorth, c as CurrencyCode)}
                  </div>
                  <div className="text-[11px] flex justify-between mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono-num font-medium">+{formatMoney(curData.totalAssets, c as CurrencyCode)}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-mono-num font-medium">-{formatMoney(curData.totalLiabilities, c as CurrencyCode)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sección de Gestión de Tarjetas Digitales con Acciones Rápidas (Página 6 Directrices UX) */}
      <DigitalCardsSection
        currency={currency}
        canManageCards={canEditAccounts}
        onOpenSecurityPinPrompt={onOpenSecurityPinPrompt}
      />

      {/* Resumen de Reparto por Clases de Activos */}
      {assetClasses.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Distribución por Clases de Activos (Asset Allocation)</span>
            </h3>
            <span className="text-xs text-slate-500 font-semibold font-mono-num">
              {formatMoney(metrics.totalAssets, currency)} total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetClasses}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {assetClasses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatMoney(val, currency), 'Total']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assetClasses.map((item) => {
                const percent = Math.round((item.value / metrics.totalAssets) * 100);
                return (
                  <div 
                    key={item.name}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{item.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono-num">{percent}% del total</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono-num">
                      {formatMoney(item.value, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Listado de Cuentas: Activos y Pasivos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Activos (Cuentas con saldo positivo) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Activos ({assetAccounts.length})</span>
            </h3>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono-num">
              {formatMoney(metrics.totalAssets, currency)}
            </span>
          </div>

          <div className="space-y-3">
            {assetAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: acc.color }}
                  >
                    <DynamicIcon name={acc.icon} size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{acc.name}</h4>
                      {acc.institution && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-1.5 py-0.2 rounded border border-slate-200/60 dark:border-slate-700">
                          {acc.institution}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 capitalize">{typeLabels[acc.type] || acc.type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-slate-900 dark:text-white font-mono-num">
                    {formatMoney(acc.balance, (acc.currency as CurrencyCode) || currency)}
                  </span>
                  {canEditAccounts && (
                    <button
                      onClick={() => onOpenAccountModal(acc)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                      title="Editar cuenta"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pasivos y Tarjetas de Crédito */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>Pasivos y Tarjetas ({liabilityAccounts.length})</span>
            </h3>
            <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono-num">
              -{formatMoney(metrics.totalLiabilities, currency)}
            </span>
          </div>

          <div className="space-y-3">
            {liabilityAccounts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No tienes deudas registradas ni saldos pendientes</p>
              </div>
            ) : (
              liabilityAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: acc.color }}
                    >
                      <DynamicIcon name={acc.icon} size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{acc.name}</h4>
                        {acc.institution && (
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-1.5 py-0.2 rounded border border-slate-200/60 dark:border-slate-700">
                            {acc.institution}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        {acc.creditLimit ? `Límite: ${formatMoney(acc.creditLimit, (acc.currency as CurrencyCode) || currency)}` : typeLabels[acc.type]}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-red-600 dark:text-red-400 font-mono-num">
                      -{formatMoney(Math.abs(acc.balance), (acc.currency as CurrencyCode) || currency)}
                    </span>
                    {canEditAccounts && (
                      <button
                        onClick={() => onOpenAccountModal(acc)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors opacity-80 group-hover:opacity-100"
                        title="Editar cuenta"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal de Auditoría y Conciliación del Libro Mayor */}
      {showAuditModal && auditReport && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  auditReport.isHealthy
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {auditReport.isHealthy ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Auditoría del Libro Mayor
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verificación matemática de saldos contra transacciones
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reconcileSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {reconcileSuccessMsg}
              </div>
            )}

            {auditReport.isHealthy ? (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  Libro Mayor 100% Consistente
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Todos los saldos de tus cuentas coinciden exactamente con la suma aritmética del saldo inicial más cada ingreso, gasto y transferencia registrada. Cero discrepancias detectadas.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Descuadres detectados:</span> Se encontraron diferencias en {auditReport.discrepancies.length} cuenta(s) respecto al histórico de transacciones.
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {auditReport.discrepancies.map(d => (
                    <div
                      key={d.accountId}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {d.accountName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Saldo actual: <span className="font-mono">{formatMoney(d.currentBalance, currency)}</span> · Libro mayor: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{formatMoney(d.ledgerBalance, currency)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-rose-500">
                          {d.discrepancy > 0 ? `+${formatMoney(d.discrepancy, currency)}` : formatMoney(d.discrepancy, currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {canEditAccounts && (
                  <button
                    type="button"
                    onClick={handleReconcile}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Conciliar Cuentas con Libro Mayor</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

