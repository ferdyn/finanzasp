import React, { useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useUser } from '../context/UserContext';
import { useTour } from '../context/TourContext';
import { ROLE_DEFINITIONS } from '../types/user';
import { CURRENCIES, formatMoney } from '../utils/format';
import { CurrencyCode, RecurringBill, ThemeMode, RecurringFrequency } from '../types/finance';
import { getRecurringStatus, formatFrequency } from '../utils/recurring';
import { DynamicIcon } from '../components/DynamicIcon';
import { 
  Sliders, DollarSign, Download, Upload, RotateCcw, 
  Trash2, Plus, Calendar, CheckCircle2, Play, Pause, 
  Calculator, Shield, Tag, FileText, AlertTriangle,
  Sun, Moon, Monitor, Check, Palette, Zap, ShieldAlert,
  Scissors, ShieldCheck, TrendingDown, ArrowDownRight, Sparkles, RefreshCw,
  Lock, Fingerprint, KeyRound, Clock, Bell, X, Eye, EyeOff, Printer,
  Users, History, UserPlus, SlidersHorizontal, BookOpen, Compass
} from 'lucide-react';
import { useSecurity } from '../context/SecurityContext';
import { SecurityPinModal } from '../components/SecurityPinModal';

interface SettingsViewProps {
  onOpenCompoundSimulator: () => void;
  onOpenReports?: () => void;
  onOpenManual?: () => void;
  onOpenKyc?: () => void;
  onTriggerFraudAlert?: () => void;
  onTriggerMfaChallenge?: (title: string, desc: string, callback: () => void) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  onOpenCompoundSimulator, 
  onOpenReports, 
  onOpenManual,
  onOpenKyc,
  onTriggerFraudAlert,
  onTriggerMfaChallenge,
}) => {
  const { startTour, resetTour } = useTour();
  const { 
    currency, 
    setCurrency, 
    theme,
    effectiveTheme,
    setTheme,
    privacyMode,
    setPrivacyMode,
    togglePrivacyMode,
    extremeSavingsMode,
    setExtremeSavingsMode,
    toggleCategoryEssential,
    isCategoryEssential,
    extremeSavingsAnalysis,
    applyAllExtremeBudgetSuggestions,
    applyExtremeBudgetCutForCategory,
    restoreBudgetsBeforeExtremeSavings,
    categories, 
    addCategory, 
    deleteCategory, 
    recurringBills, 
    addRecurringBill,
    processRecurringBill, 
    postponeRecurringBill,
    updateRecurringBill, 
    deleteRecurringBill,
    resetToSeedData, 
    clearAllData, 
    exportDataJSON, 
    importDataJSON,
    exportTransactionsCSV,
    accounts,
    getCategoryById,
    getAccountById
  } = useFinance();

  const {
    users,
    currentUser,
    auditLogs,
    setIsUserManagementOpen,
    hasPermission,
  } = useUser();

  const canManageUsers = hasPermission('canManageUsers') || hasPermission('canEditRolePermissions');
  const canManageRecurring = hasPermission('canManageRecurring');
  const canManageCategories = hasPermission('canManageCategories');
  const canCreateTransactions = hasPermission('canCreateTransactions');
  const canExportReports = hasPermission('canExportReports');
  const canEditBudgets = hasPermission('canManageBudgets');
  const canResetData = hasPermission('canExportImportData');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');
  const [savingsActionStatus, setSavingsActionStatus] = useState<string>('');
  const [showCategoryClassifier, setShowCategoryClassifier] = useState<boolean>(false);

  // Seguridad y Bloqueo de Pantalla
  const {
    isLockEnabled,
    hasPin,
    isBiometricsAvailable,
    isBiometricsEnabled,
    autoLockTimeout,
    lockApp,
    enableBiometrics,
    disableBiometrics,
    setAutoLockTimeout,
  } = useSecurity();

  const [pinModalOpen, setPinModalOpen] = useState<boolean>(false);
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'change' | 'disable'>('setup');
  const [securityNotice, setSecurityNotice] = useState<string>('');

  const handleToggleBiometrics = async () => {
    if (isBiometricsEnabled) {
      disableBiometrics();
      setSecurityNotice('Desbloqueo biométrico desactivado.');
      setTimeout(() => setSecurityNotice(''), 3500);
    } else {
      setSecurityNotice('Solicitando autorización biométrica en tu dispositivo...');
      const res = await enableBiometrics();
      if (res.success) {
        setSecurityNotice('¡Sensor biométrico (WebAuthn) vinculado con éxito!');
      } else {
        setSecurityNotice(res.error || 'No se pudo vincular el sensor biométrico.');
      }
      setTimeout(() => setSecurityNotice(''), 4500);
    }
  };

  // Nueva categoría
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [showAddCategory, setShowAddCategory] = useState(false);

  // Nuevo recurrente
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillType, setNewBillType] = useState<'expense' | 'income'>('expense');
  const [newBillCatId, setNewBillCatId] = useState(categories[0]?.id || '');
  const [newBillAccId, setNewBillAccId] = useState(accounts[0]?.id || '');
  const [newBillFreq, setNewBillFreq] = useState<RecurringFrequency>('monthly');
  const [newBillDueDate, setNewBillDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newBillReminderDays, setNewBillReminderDays] = useState<number>(7);
  const [showAddRecurring, setShowAddRecurring] = useState(false);
  const [settingsPostponeId, setSettingsPostponeId] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDataJSON(content);
        if (ok) {
          setImportStatus('¡Datos importados con éxito!');
          setTimeout(() => setImportStatus(''), 3500);
        } else {
          setImportStatus('Error al leer el archivo JSON. Formato no válido.');
          setTimeout(() => setImportStatus(''), 3500);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
      icon: newCatIcon,
    });
    setNewCatName('');
    setShowAddCategory(false);
  };

  const handleAddRecurringSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newBillAmount.replace(',', '.'));
    if (!newBillName.trim() || isNaN(amt) || amt <= 0) return;

    addRecurringBill({
      name: newBillName.trim(),
      amount: amt,
      type: newBillType,
      categoryId: newBillCatId || categories[0]?.id || '',
      accountId: newBillAccId || accounts[0]?.id || '',
      frequency: newBillFreq,
      nextDueDate: newBillDueDate || new Date().toISOString().split('T')[0],
      reminderDays: newBillReminderDays || 7,
      isActive: true,
    });

    setNewBillName('');
    setNewBillAmount('');
    setNewBillDueDate(new Date().toISOString().split('T')[0]);
    setNewBillReminderDays(7);
    setShowAddRecurring(false);
  };

  const themeOptions: { id: ThemeMode; label: string; desc: string; icon: typeof Sun }[] = [
    {
      id: 'light',
      label: 'Claro',
      desc: 'Aspecto diurno brillante y limpio',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Oscuro',
      desc: 'Tonos oscuros relajantes para la vista',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'Sistema',
      desc: 'Sincroniza con el tema de tu dispositivo',
      icon: Monitor,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
          Ajustes y Configuración
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Personaliza tu apariencia, moneda, movimientos recurrentes, copias de seguridad y categorías
        </p>
      </div>

      {importStatus && (
        <div className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2 ${
          importStatus.includes('éxito') 
            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
        }`}>
          <CheckCircle2 className="w-5 h-5" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Grid de Secciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ========================================================================= */}
        {/* MULTIUSUARIO, ROLES (RBAC) & HISTORIAL DE AUDITORÍA                      */}
        {/* ========================================================================= */}
        <div id="settings-user-roles-card" className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                    Gestión Multiusuario & Control de Accesos (RBAC)
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                    {users.length} miembros registrados
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5 max-w-2xl">
                  Administra los roles del sistema (Administrador, Gestor, Miembro, Dependiente, Auditor), define permisos granulares por acción y consulta el registro de trazabilidad.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              {canManageUsers && (
                <button
                  type="button"
                  id="settings-open-user-management-btn"
                  onClick={() => setIsUserManagementOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Gestionar Roles & Permisos</span>
                </button>
              )}
            </div>
          </div>

          {/* Tarjetas de miembros activos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {users.map(u => {
              const rDef = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.member;
              const isMe = u.id === currentUser.id;

              return (
                <div
                  key={u.id}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${
                    isMe
                      ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-400/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-2xs"
                    style={{ backgroundColor: `${u.color}25` }}
                  >
                    {u.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {u.name}
                      </span>
                      {isMe && (
                        <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                          (Tú)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      {rDef.name} • {u.department || 'General'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Barra inferior de resumen del historial */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <History className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                <strong>{auditLogs.length} eventos</strong> registrados en la auditoría inmutable de actividades.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Rol actual: <strong>{ROLE_DEFINITIONS[currentUser.role]?.name}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MANUAL DE USUARIO & GUÍA INTERACTIVA (ONBOARDING)                        */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                    Manual de Usuario & Tour Interactivo
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                    Guía Paso a Paso
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5 max-w-2xl">
                  Accede a la documentación completa de todas las 12 áreas del sistema, consulta la matriz de permisos por roles, resuelve dudas en el glosario o reinicia el tour interactivo de bienvenida.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              {onOpenManual && (
                <button
                  type="button"
                  id="settings-open-manual-btn"
                  onClick={onOpenManual}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Ver Manual Completo</span>
                </button>
              )}
              <button
                type="button"
                id="settings-start-tour-btn"
                onClick={() => startTour(0)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Iniciar Tour Guiado</span>
              </button>
              <button
                type="button"
                id="settings-reset-tour-btn"
                onClick={resetTour}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
                title="Borra la marca de completado y reinicia el tour"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar Guía</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* ========================================================================= */}
        {/* MODO DE AHORRO EXTREMO                                                    */}
        {/* ========================================================================= */}
        <div className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 lg:col-span-2 ${
          extremeSavingsMode 
            ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border-amber-300 dark:border-amber-700/80 shadow-md ring-1 ring-amber-400/50 dark:ring-amber-500/30' 
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm'
        }`}>
          {/* Header de la sección */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform ${
                extremeSavingsMode 
                  ? 'bg-amber-500 text-white shadow-amber-500/30 scale-105' 
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
              }`}>
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                    Modo de Ahorro Extremo
                  </h3>
                  {extremeSavingsMode ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs animate-pulse">
                      <Zap className="w-3 h-3 fill-current" />
                      ACTIVO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5 max-w-2xl">
                  Protocolo de contingencia y austeridad: resalta visualmente solo los gastos esenciales y propone recortes presupuestarios inmediatos en partidas prescindibles.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {extremeSavingsMode ? 'Modo Activado' : 'Activar Modo'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={extremeSavingsMode}
                onClick={() => {
                  const nextState = !extremeSavingsMode;
                  setExtremeSavingsMode(nextState);
                  setSavingsActionStatus(
                    nextState 
                      ? '⚡ Modo de Ahorro Extremo activado. Se han recalculado sugerencias de recortes.' 
                      : 'Modo de Ahorro Extremo desactivado.'
                  );
                  setTimeout(() => setSavingsActionStatus(''), 4000);
                }}
                className={`relative inline-flex h-8 w-15 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
                  extremeSavingsMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span className="sr-only">Activar Modo de Ahorro Extremo</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    extremeSavingsMode ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Feedback de acción rápida */}
          {savingsActionStatus && (
            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{savingsActionStatus}</span>
            </div>
          )}

          {/* Contenido cuando está Activo */}
          {extremeSavingsMode ? (
            <div className="space-y-6 mt-6 pt-6 border-t border-amber-200/60 dark:border-amber-800/60">
              
              {/* Tarjetas KPI de Contingencia */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/70 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Gastos Esenciales
                    </span>
                    <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                      Protegidos
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono-num mt-1.5">
                    {formatMoney(extremeSavingsAnalysis.essentialSpent, currency)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Alimentación, vivienda, servicios, salud y transporte vital
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-amber-200 dark:border-amber-800/70 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Gastos Prescindibles
                    </span>
                    <span className="text-[10px] px-2 py-0.5 font-bold rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                      Recortables
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono-num mt-1.5">
                    {formatMoney(extremeSavingsAnalysis.nonEssentialSpent, currency)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Ocio, streaming, compras no vitales y caprichos este mes
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-4 rounded-xl shadow-md shadow-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4" />
                      Ahorro Mensual Potencial
                    </span>
                    <span className="text-[10px] px-2 py-0.5 font-black rounded-full bg-white/20 text-white">
                      Objetivo
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black font-mono-num mt-1.5">
                    +{formatMoney(extremeSavingsAnalysis.totalPotentialMonthlySavings, currency)}
                  </p>
                  <p className="text-[11px] text-amber-100 mt-0.5">
                    Colchón adicional al aplicar los recortes sugeridos
                  </p>
                </div>
              </div>

              {/* Sugerencias de Recortes Presupuestarios */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-amber-500" />
                      <span>Sugerencias Inteligentes de Recortes Presupuestarios</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Ajustes calculados para recortar entre un 50% y un 85% en categorías prescindibles:
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canEditBudgets && extremeSavingsAnalysis.hasBudgetBackup && (
                      <button
                        type="button"
                        onClick={() => {
                          restoreBudgetsBeforeExtremeSavings();
                          setSavingsActionStatus('Presupuestos anteriores restaurados con éxito.');
                          setTimeout(() => setSavingsActionStatus(''), 4000);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Restaurar Previos</span>
                      </button>
                    )}

                    {canEditBudgets && extremeSavingsAnalysis.suggestions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          applyAllExtremeBudgetSuggestions();
                          setSavingsActionStatus('⚡ Se han aplicado todos los límites de recorte recomendados a tus presupuestos.');
                          setTimeout(() => setSavingsActionStatus(''), 4000);
                        }}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/30 transition-all flex items-center gap-1.5 hover:scale-102"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Aplicar Todos los Recortes ({extremeSavingsAnalysis.suggestions.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {extremeSavingsAnalysis.suggestions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-500 dark:text-slate-400">
                    No se detectan gastos prescindibles activos en este periodo. ¡Excelente disciplina de ahorro!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {extremeSavingsAnalysis.suggestions.map((sugg) => {
                      const isAlreadyApplied = sugg.currentLimit > 0 && sugg.currentLimit <= sugg.suggestedLimit;

                      return (
                        <div
                          key={sugg.categoryId}
                          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                                style={{ backgroundColor: sugg.categoryColor }}
                              >
                                <DynamicIcon name={sugg.categoryIcon} size={18} />
                              </div>
                              <div>
                                <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                                  {sugg.categoryName}
                                </h5>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                    sugg.priority === 'urgent'
                                      ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                                      : sugg.priority === 'recommended'
                                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                  }`}>
                                    {sugg.priority === 'urgent' ? 'Urgente' : sugg.priority === 'recommended' ? 'Recomendado' : 'Opcional'}
                                  </span>
                                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                    -{sugg.cutPercent}% sugerido
                                  </span>
                                </div>
                              </div>
                            </div>

                            {canEditBudgets && (
                              <button
                                type="button"
                                onClick={() => {
                                  applyExtremeBudgetCutForCategory(sugg.categoryId, sugg.suggestedLimit);
                                  setSavingsActionStatus(`Límite de ${sugg.categoryName} ajustado a ${formatMoney(sugg.suggestedLimit, currency)}.`);
                                  setTimeout(() => setSavingsActionStatus(''), 3500);
                                }}
                                disabled={isAlreadyApplied}
                                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
                                  isAlreadyApplied
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 cursor-default'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs hover:scale-105'
                                }`}
                              >
                                {isAlreadyApplied ? (
                                  <>
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Aplicado</span>
                                  </>
                                ) : (
                                  <>
                                    <Scissors className="w-3 h-3" />
                                    <span>Recortar</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Comparativa de importes */}
                          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg text-xs flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">Límite actual</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300 font-mono-num">
                                {sugg.currentLimit > 0 ? formatMoney(sugg.currentLimit, currency) : `${formatMoney(sugg.currentSpent, currency)} (gasto)`}
                              </span>
                            </div>

                            <div className="text-slate-400 dark:text-slate-600 font-bold">➔</div>

                            <div>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-bold">Nuevo límite</span>
                              <span className="font-black text-amber-600 dark:text-amber-400 font-mono-num">
                                {formatMoney(sugg.suggestedLimit, currency)}/mes
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">Ahorro extra</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono-num">
                                +{formatMoney(sugg.cutAmount, currency)}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            💡 {sugg.reason}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Clasificador de Categorías: Esenciales vs Prescindibles */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Tag className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span>Clasificador de Partidas: Esencial vs Prescindible</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Toca cualquier categoría para cambiar su estatus según las prioridades de tu hogar:
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowCategoryClassifier(!showCategoryClassifier)}
                    className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline self-start sm:self-auto"
                  >
                    {showCategoryClassifier ? 'Ocultar listado' : `Ver todas las categorías (${categories.filter(c => c.type === 'expense').length})`}
                  </button>
                </div>

                {showCategoryClassifier && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {categories.filter(c => c.type === 'expense').map((cat) => {
                      const essential = isCategoryEssential(cat.id);

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            if (canManageCategories) {
                              toggleCategoryEssential(cat.id);
                            }
                          }}
                          disabled={!canManageCategories}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${
                            essential
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 hover:border-emerald-400'
                              : 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 hover:border-amber-400'
                          } ${!canManageCategories ? 'opacity-80 cursor-default' : ''}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 text-xs"
                              style={{ backgroundColor: cat.color }}
                            >
                              <DynamicIcon name={cat.icon} size={14} />
                            </div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {cat.name}
                            </span>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            essential 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-amber-500 text-white'
                          }`}>
                            {essential ? '🛡️ Esencial' : '⚠️ Prescindible'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>Al activarlo, se filtrarán o marcarán tus transacciones para proteger tus partidas vitales.</span>
              </div>
              <button
                type="button"
                onClick={() => setExtremeSavingsMode(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-600 font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors self-start sm:self-auto"
              >
                Activar ahora
              </button>
            </div>
          )}
        </div>

        {/* Selector de Tema (Claro / Oscuro / Sistema) */}
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Tema y Apariencia Visual</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                  Elige entre el tema claro u oscuro. La preferencia se guarda automáticamente en <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">localStorage</code>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-400 font-medium">Estado activo:</span>
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {effectiveTheme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'} {theme === 'system' && '(Auto)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-3 group ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-emerald-950/40 text-white border-slate-900 dark:border-emerald-500 shadow-md ring-2 ring-slate-900 dark:ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                      isSelected
                        ? opt.id === 'light'
                          ? 'bg-amber-500/20 text-amber-300'
                          : opt.id === 'dark'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                        : opt.id === 'light'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                        : opt.id === 'dark'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {opt.label}
                    </h4>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text-slate-300 dark:text-emerald-200/80' : 'text-slate-500 dark:text-slate-400'}`}>
                      {opt.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODO ESPÍA / PRIVACIDAD EN LUGARES PÚBLICOS                                */}
        {/* ========================================================================= */}
        <div className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 lg:col-span-2 ${
          privacyMode
            ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-900/20 border-amber-500/50 shadow-md text-white'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform ${
                privacyMode
                  ? 'bg-amber-500 text-white shadow-amber-500/30 ring-4 ring-amber-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {privacyMode ? <EyeOff className="w-6 h-6 stroke-[2.5]" /> : <Eye className="w-6 h-6" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`font-extrabold text-lg sm:text-xl tracking-tight ${privacyMode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    Modo Espía & Privacidad en Público
                  </h3>
                  {privacyMode ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-xs animate-pulse">
                      <EyeOff className="w-3 h-3" />
                      MODO ESPÍA ACTIVO (CIFRAS DIFUMINADAS)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      DESACTIVADO (CIFRAS VISIBLES)
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${privacyMode ? 'text-amber-100/80' : 'text-slate-500 dark:text-slate-400'}`}>
                  Difumina suavemente todas las cifras, saldos y gráficos con un efecto frosted glass profesional de alta seguridad para evitar miradas indiscretas en lugares públicos.
                </p>
              </div>
            </div>

            {/* Switch Principal de Modo Espía */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className={`text-xs font-bold ${privacyMode ? 'text-amber-400' : 'text-slate-500'}`}>
                {privacyMode ? 'Modo Espía Activado' : 'Activar Modo Espía'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={privacyMode}
                onClick={togglePrivacyMode}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                  privacyMode ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    privacyMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Atajos y detalles informativos */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              privacyMode 
                ? 'bg-slate-800/80 border-slate-700/80 text-slate-200' 
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold">Botón en la Cabecera</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Icono del ojo arriba a la derecha</div>
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              privacyMode 
                ? 'bg-slate-800/80 border-slate-700/80 text-slate-200' 
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <span className="text-xs font-black">⌨️</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold">Atajo de Teclado</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Presiona <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] font-bold">Alt + P</kbd>
                </div>
              </div>
            </div>

            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              privacyMode 
                ? 'bg-slate-800/80 border-slate-700/80 text-slate-200' 
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold">Efecto Peek (Mirada Rápida)</div>
                <div className="text-xs font-mono font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="font-mono-num font-bold cursor-pointer" title="Pasa el cursor por encima para ver el efecto Peek">
                    {formatMoney(1450.00, currency)}
                  </span>
                  <span className="text-[10px] font-normal text-slate-400 font-sans hidden sm:inline">(Pasa el cursor)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SEGURIDAD Y BLOQUEO DE PANTALLA (PIN Y WEBAUTHN / BIOMETRÍA)              */}
        {/* ========================================================================= */}
        <div className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 lg:col-span-2 ${
          isLockEnabled
            ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 border-emerald-500/40 shadow-md text-white'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm'
        }`}>
          {/* Header de la sección */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform ${
                isLockEnabled
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {isLockEnabled ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className={`font-extrabold text-lg sm:text-xl tracking-tight ${isLockEnabled ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    Seguridad y Bloqueo de Pantalla
                  </h3>
                  {isLockEnabled ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-white shadow-xs">
                      <Lock className="w-3 h-3" />
                      PROTEGIDO CON PIN {isBiometricsEnabled && '+ BIOMETRÍA'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      DESACTIVADO
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isLockEnabled ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  Protege la privacidad de tus saldos, transacciones y patrimonio ante miradas indiscretas requiriendo un PIN o autenticación biométrica (WebAuthn).
                </p>
              </div>
            </div>

            {/* Switch Principal */}
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className={`text-xs font-bold ${isLockEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isLockEnabled ? 'Bloqueo Activado' : 'Activar Bloqueo'}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isLockEnabled}
                onClick={() => {
                  if (isLockEnabled) {
                    setPinModalMode('disable');
                    setPinModalOpen(true);
                  } else {
                    setPinModalMode('setup');
                    setPinModalOpen(true);
                  }
                }}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  isLockEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isLockEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notificación temporal de seguridad */}
          {securityNotice && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{securityNotice}</span>
            </div>
          )}

          {/* Opciones Avanzadas cuando el bloqueo está activado */}
          {isLockEnabled ? (
            <div className="mt-5 pt-5 border-t border-slate-700/60 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Autenticación Biométrica (Web Authentication API) */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Fingerprint className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                          <span>Desbloqueo Biométrico (WebAuthn)</span>
                        </h4>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Touch ID, Face ID, huella digital o Windows Hello.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={isBiometricsEnabled}
                      onClick={handleToggleBiometrics}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        isBiometricsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isBiometricsEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400">
                      {isBiometricsAvailable
                        ? 'Hardware biométrico compatible detectado'
                        : 'Biometría disponible según permisos del navegador'}
                    </span>
                  </div>
                </div>

                {/* Gestión de PIN */}
                <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 flex flex-col justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white">Clave de Seguridad PIN</h4>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Almacenado de forma segura mediante hash criptográfico SHA-256 + sal.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPinModalMode('change');
                        setPinModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-colors flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Cambiar PIN</span>
                    </button>

                    <button
                      type="button"
                      onClick={lockApp}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bloquear Ahora</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Frecuencia de Auto-Bloqueo */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Frecuencia y Disparo del Bloqueo Automático</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Protección en segundo plano</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                  {([
                    { id: 'launch_only' as const, label: 'Al Iniciar', desc: 'Al abrir o recargar' },
                    { id: 'immediate' as const, label: 'Inmediato', desc: 'Al ocultar pestaña' },
                    { id: '1m' as const, label: '1 Minuto', desc: 'Tras inactividad' },
                    { id: '5m' as const, label: '5 Minutos', desc: 'Tras inactividad' },
                    { id: '15m' as const, label: '15 Minutos', desc: 'Tras inactividad' },
                  ] as const).map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAutoLockTimeout(option.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        autoLockTimeout === option.id
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                          : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-700/60'
                      }`}
                    >
                      <span className="block text-xs font-bold">{option.label}</span>
                      <span className={`block text-[10px] mt-0.5 ${autoLockTimeout === option.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {option.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>Configura un PIN de 4 a 6 dígitos numéricos para proteger tus saldos cada vez que abras FinanTrack.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPinModalMode('setup');
                  setPinModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors self-start sm:self-auto"
              >
                Configurar PIN
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* COMPLIANCE NORMATIVO, KYC & SEGURIDAD ESCALONADA (PSD2 / SCA)              */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">
                    Compliance, Verificación KYC & Anti-Fraude (PSD2)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    GDPR / PSD2
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Protocolos de autenticación reforzada de clientes (SCA), verificación de identidad de 5 pasos y detección de anomalías transaccionales.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              {onOpenKyc && (
                <button
                  type="button"
                  onClick={onOpenKyc}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verificación KYC (5 Pasos)</span>
                </button>
              )}

              {onTriggerFraudAlert && (
                <button
                  type="button"
                  onClick={onTriggerFraudAlert}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Probar Alerta de Fraude</span>
                </button>
              )}

              {onTriggerMfaChallenge && (
                <button
                  type="button"
                  onClick={() => onTriggerMfaChallenge('Autorización de Transferencia de Alto Valor', 'Por normativa europea PSD2, se requiere un código temporal OTP para autorizar transferencias superiores a 500€.', () => {
                    setSecurityNotice('¡Autenticación SCA completada con éxito!');
                    setTimeout(() => setSecurityNotice(''), 3500);
                  })}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Test Desafío SCA / 2FA</span>
                </button>
              )}
            </div>
          </div>

          {/* Tarjetas informativas de cumplimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Cifrado Local Criptográfico
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tus datos financieros y hashes de seguridad residen cifrados en tu dispositivo sin subirse a servidores externos no autorizados.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                Doble Factor & Biometría
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Soporte de autenticación de clientes con WebAuthn, Touch ID, Face ID o desafíos escalonados según el nivel de riesgo de la operación.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Congelación Instantánea
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bloqueo de tarjetas virtuales en 1 solo clic desde la sección de Patrimonio o directamente ante cualquier notificación anómala.
              </p>
            </div>
          </div>
        </div>

        {/* Moneda Principal */}
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Moneda y Divisa Principal</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Formato y símbolo utilizado en balances y reportes</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
              const item = CURRENCIES[code];
              const isSelected = currency === code;
              return (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600 shadow-sm ring-2 ring-slate-900 dark:ring-emerald-500 ring-offset-1 dark:ring-offset-slate-900'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="block text-base font-black">{item.symbol}</span>
                  <span className="block text-[11px] font-semibold mt-0.5">{code}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Simulador Financiero Rápido */}
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Simulador de Inversión</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Calcula el poder del interés compuesto a 5, 10, 20 o 30 años</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            Descubre cuánto capital acumularás aportando mes a mes con diferentes tasas de rentabilidad anual compuesta.
          </p>

          <button
            onClick={onOpenCompoundSimulator}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            <span>Abrir Simulador de Interés Compuesto</span>
          </button>
        </div>

        {/* Movimientos Fijos y Recurrentes */}
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Pagos y Cobros Recurrentes</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Automatiza o procesa rápidamente alquileres, nóminas y cuotas periódicas</p>
              </div>
            </div>

            {canManageRecurring && (
              <button
                onClick={() => setShowAddRecurring(!showAddRecurring)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddRecurring ? 'Cerrar' : 'Añadir Recurrente'}</span>
              </button>
            )}
          </div>

          {/* Formulario Añadir Recurrente */}
          {showAddRecurring && canManageRecurring && (
            <form onSubmit={handleAddRecurringSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Nuevo Movimiento Periódico</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={newBillName}
                    onChange={(e) => setNewBillName(e.target.value)}
                    placeholder="Ej. Alquiler, Gimnasio, Spotify..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Importe</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={newBillAmount}
                    onChange={(e) => setNewBillAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono-num text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Tipo</label>
                  <select
                    value={newBillType}
                    onChange={(e) => setNewBillType(e.target.value as 'expense' | 'income')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="expense">Gasto Recurrente</option>
                    <option value="income">Ingreso Recurrente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Frecuencia</label>
                  <select
                    value={newBillFreq}
                    onChange={(e) => setNewBillFreq(e.target.value as RecurringFrequency)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal (cada 2 semanas)</option>
                    <option value="monthly">Mensual</option>
                    <option value="bimonthly">Bimestral (cada 2 meses)</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="semiannual">Semestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Próximo Vencimiento</label>
                  <input
                    type="date"
                    value={newBillDueDate}
                    onChange={(e) => setNewBillDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Avisar con antelación</label>
                  <select
                    value={newBillReminderDays}
                    onChange={(e) => setNewBillReminderDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>1 día antes</option>
                    <option value={3}>3 días antes</option>
                    <option value={5}>5 días antes</option>
                    <option value={7}>7 días antes (Recomendado)</option>
                    <option value={10}>10 días antes</option>
                    <option value={15}>15 días antes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Categoría</label>
                  <select
                    value={newBillCatId}
                    onChange={(e) => setNewBillCatId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.filter(c => c.type === newBillType).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Cuenta asociada</label>
                  <select
                    value={newBillAccId}
                    onChange={(e) => setNewBillAccId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({formatMoney(a.balance, currency)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddRecurring(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                >
                  Guardar Periódico
                </button>
              </div>
            </form>
          )}

          {/* Lista de Recurrentes */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recurringBills.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No tienes pagos o cobros recurrentes registrados.
              </div>
            ) : (
              recurringBills.map((bill) => {
                const status = getRecurringStatus(bill.nextDueDate, bill.reminderDays || 7);
                const category = getCategoryById(bill.categoryId);
                const account = getAccountById(bill.accountId);
                const isExpense = bill.type === 'expense';
                const isMenuOpen = settingsPostponeId === bill.id;

                return (
                  <div key={bill.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: category?.color || (isExpense ? '#ef4444' : '#10b981') }}
                      >
                        <DynamicIcon name={category?.icon || (isExpense ? 'CreditCard' : 'Wallet')} size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">{bill.name}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${status.badgeBg} ${status.badgeText} ${status.badgeBorder}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                            <span>{status.label}</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">
                          {formatFrequency(bill.frequency)} • Próximo: {bill.nextDueDate} {account ? `• ${account.name}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5">
                      <span className={`text-sm font-black font-mono-num ${
                        isExpense ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isExpense ? '-' : '+'}{formatMoney(bill.amount, currency)}
                      </span>
                      
                      {/* Botón Pagar / Cobrar */}
                      {canCreateTransactions && (
                        <button
                          type="button"
                          onClick={() => processRecurringBill(bill.id)}
                          className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1"
                          title="Registrar ahora como movimiento y avanzar ciclo"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isExpense ? 'Pagar' : 'Cobrar'}</span>
                        </button>
                      )}

                      {/* Menú Posponer */}
                      {canManageRecurring && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setSettingsPostponeId(isMenuOpen ? null : bill.id)}
                            className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-xl transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                            title="Posponer fecha de vencimiento"
                          >
                            <Clock className="w-3 h-3" />
                            <span className="hidden sm:inline">Posponer</span>
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-20 animate-in fade-in zoom-in-95 duration-150">
                              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Posponer
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  postponeRecurringBill(bill.id, 3);
                                  setSettingsPostponeId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                +3 días
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  postponeRecurringBill(bill.id, 7);
                                  setSettingsPostponeId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                +1 semana (7d)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  postponeRecurringBill(bill.id, 15);
                                  setSettingsPostponeId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                              >
                                +15 días
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Eliminar */}
                      {canManageRecurring && (
                        <button
                          type="button"
                          onClick={() => deleteRecurringBill(bill.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Eliminar este recordatorio recurrente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Copias de Seguridad y Datos */}
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Copias de Seguridad y Exportación</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Descarga tus datos en formato JSON o CSV, o restaura un backup anterior</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {onOpenReports && (
              <button
                type="button"
                onClick={onOpenReports}
                className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl border border-emerald-300 dark:border-emerald-800 text-left transition-colors flex items-center gap-3 group"
              >
                <Printer className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-emerald-900 dark:text-emerald-200">Reporte e Impresión PDF</span>
                  <span className="block text-[10px] text-emerald-700 dark:text-emerald-400">Balance contable oficial optimizado para papel</span>
                </div>
              </button>
            )}

            {canExportReports && (
              <button
                onClick={exportDataJSON}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left transition-colors flex items-center gap-3 group"
              >
                <Download className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">Exportar Backup JSON</span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-400">Guarda todas las cuentas, metas y transacciones</span>
                </div>
              </button>
            )}

            {canExportReports && (
              <button
                onClick={exportTransactionsCSV}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left transition-colors flex items-center gap-3 group"
              >
                <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">Exportar CSV Excel</span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-400">Descarga hoja de cálculo con tus movimientos</span>
                </div>
              </button>
            )}

            {canResetData && (
              <label className="p-3.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left transition-colors flex items-center gap-3 group cursor-pointer">
                <Upload className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform" />
                <div>
                  <span className="block text-xs font-bold text-slate-900 dark:text-white">Importar Backup JSON</span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-400">Restaura un archivo previamente exportado</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Opciones de Peligro / Reset */}
          {canResetData && (
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => {
                  if (confirm('¿Restablecer datos a la muestra inicial de ejemplo?')) {
                    resetToSeedData();
                  }
                }}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Datos de Ejemplo</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('¿ATENCIÓN: Quieres borrar absolutamente todos tus datos registrados?')) {
                    clearAllData();
                  }
                }}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Borrar Todo el Contenido</span>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Modal de Configuración / Cambio de PIN */}
      <SecurityPinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        mode={pinModalMode}
        onSuccess={() => {
          setSecurityNotice(
            pinModalMode === 'setup'
              ? '¡PIN de seguridad configurado correctamente!'
              : pinModalMode === 'change'
              ? '¡PIN actualizado con éxito!'
              : 'Bloqueo de pantalla desactivado.'
          );
          setTimeout(() => setSecurityNotice(''), 4000);
        }}
      />

    </div>
  );
};
