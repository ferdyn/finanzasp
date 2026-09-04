import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useUser } from '../context/UserContext';
import { 
  formatMoney, 
  formatDate, 
  formatMonthPeriod, 
  getCurrentMonthPeriod 
} from '../utils/format';
import { 
  Printer, 
  FileText, 
  Download, 
  Calendar, 
  CheckSquare, 
  Square, 
  SlidersHorizontal, 
  ArrowLeft, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Target, 
  Landmark, 
  FileSpreadsheet,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Info,
  LayoutList,
  Table as TableIcon,
  Copy,
  Trash2,
  ExternalLink,
  X,
  FolderOpen,
  Share2
} from 'lucide-react';
import { Transaction } from '../types/finance';
import { generateSecureRandomNumber } from '../utils/security';

interface SavedReportItem {
  id: string;
  title: string;
  periodLabel: string;
  savedAt: string;
  netWorth: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  reportNotes?: string;
  htmlContent: string;
}

interface ReportViewProps {
  onBack?: () => void;
}

type PeriodFilter = 'current' | 'previous' | 'last3months' | 'year' | 'all';

export const ReportView: React.FC<ReportViewProps> = ({ onBack }) => {
  const { 
    transactions = [], 
    accounts = [], 
    categories = [], 
    budgets = [], 
    goals: savingsGoals = [], 
    metrics, 
    currency, 
    selectedPeriod,
    extremeSavingsMode,
    getCategoryById,
    getAccountById
  } = useFinance();
  const { hasPermission } = useUser();
  const canExportReports = hasPermission('canExportReports');

  // Opciones de configuración de reporte
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('current');
  const [txLimit, setTxLimit] = useState<number>(50); // 10, 25, 50, 100, 9999 (todas)
  const [reportNotes, setReportNotes] = useState<string>('');
  const [highContrastPrint, setHighContrastPrint] = useState<boolean>(true);
  const [maskSensitiveData, setMaskSensitiveData] = useState<boolean>(false);
  const [mobileTableViewMode, setMobileTableViewMode] = useState<'cards' | 'table'>('cards');

  // Secciones a incluir en el informe
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeAccounts, setIncludeAccounts] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeBudgets, setIncludeBudgets] = useState(true);
  const [includeGoals, setIncludeGoals] = useState(true);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeTxNotes, setIncludeTxNotes] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);

  // Determinar rango y etiqueta del periodo
  const periodInfo = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    
    // Mes anterior
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    switch (periodFilter) {
      case 'current':
        return {
          label: formatMonthPeriod(selectedPeriod || `${currentYear}-${currentMonth}`),
          code: selectedPeriod || `${currentYear}-${currentMonth}`,
          matches: (dateStr: string) => dateStr.startsWith(selectedPeriod || `${currentYear}-${currentMonth}`)
        };
      case 'previous':
        return {
          label: formatMonthPeriod(prevPeriod),
          code: prevPeriod,
          matches: (dateStr: string) => dateStr.startsWith(prevPeriod)
        };
      case 'last3months': {
        const d3 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        const startPeriodStr = `${d3.getFullYear()}-${String(d3.getMonth() + 1).padStart(2, '0')}`;
        return {
          label: `Últimos 3 Meses (${formatMonthPeriod(startPeriodStr)} - ${formatMonthPeriod(`${currentYear}-${currentMonth}`)})`,
          code: `L3M-${currentYear}`,
          matches: (dateStr: string) => {
            const txDate = new Date(dateStr);
            return txDate >= d3 && txDate <= now;
          }
        };
      }
      case 'year':
        return {
          label: `Año Contable Completo ${currentYear}`,
          code: `AÑO-${currentYear}`,
          matches: (dateStr: string) => dateStr.startsWith(`${currentYear}-`)
        };
      case 'all':
      default:
        return {
          label: 'Historial Completo Registrado',
          code: 'HISTORIAL-TOTAL',
          matches: () => true
        };
    }
  }, [periodFilter, selectedPeriod]);

  // Filtrar transacciones del periodo
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => periodInfo.matches(tx.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, periodInfo]);

  // Métricas calculadas para el periodo seleccionado
  const periodMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    let essentialExpense = 0;
    let nonEssentialExpense = 0;

    filteredTransactions.forEach(tx => {
      if (tx.type === 'income') {
        income += tx.amount;
      } else if (tx.type === 'expense') {
        expense += tx.amount;
        const cat = getCategoryById(tx.categoryId);
        if (cat?.isEssential !== false) {
          essentialExpense += tx.amount;
        } else {
          nonEssentialExpense += tx.amount;
        }
      }
    });

    const net = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0;
    const count = filteredTransactions.length;

    // Calcular días en el periodo para promedio diario
    let daysCount = 30;
    if (periodFilter === 'current' || periodFilter === 'previous') {
      daysCount = 30;
    } else if (periodFilter === 'last3months') {
      daysCount = 90;
    } else if (periodFilter === 'year') {
      daysCount = 365;
    }

    const avgDailyExpense = daysCount > 0 ? (expense / daysCount) : 0;

    return {
      income,
      expense,
      essentialExpense,
      nonEssentialExpense,
      net,
      savingsRate,
      count,
      avgDailyExpense
    };
  }, [filteredTransactions, getCategoryById, periodFilter]);

  // Desglose de gastos por categoría en el periodo
  const categoryBreakdown = useMemo(() => {
    const catMap: Record<string, { categoryId: string; total: number; count: number }> = {};

    filteredTransactions.forEach(tx => {
      if (tx.type === 'expense') {
        if (!catMap[tx.categoryId]) {
          catMap[tx.categoryId] = { categoryId: tx.categoryId, total: 0, count: 0 };
        }
        catMap[tx.categoryId].total += tx.amount;
        catMap[tx.categoryId].count += 1;
      }
    });

    return Object.values(catMap)
      .map(item => {
        const cat = getCategoryById(item.categoryId);
        const percentage = periodMetrics.expense > 0 
          ? Math.round((item.total / periodMetrics.expense) * 100) 
          : 0;
        return {
          id: item.categoryId,
          name: cat?.name || 'Otras',
          color: cat?.color || '#64748b',
          isEssential: cat?.isEssential !== false,
          total: item.total,
          count: item.count,
          percentage
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, periodMetrics.expense, getCategoryById]);

  // Estado de Presupuestos
  const budgetStatusList = useMemo(() => {
    return budgets.map(b => {
      const cat = getCategoryById(b.categoryId);
      const spent = filteredTransactions
        .filter(t => t.type === 'expense' && t.categoryId === b.categoryId)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const remaining = b.monthlyLimit - spent;
      const pct = b.monthlyLimit > 0 ? Math.min(Math.round((spent / b.monthlyLimit) * 100), 999) : 0;
      const isExceeded = spent > b.monthlyLimit;
      const isWarning = !isExceeded && pct >= 80;

      return {
        id: b.id,
        categoryName: cat?.name || 'Categoría',
        limit: b.monthlyLimit,
        spent,
        remaining,
        pct,
        isExceeded,
        isWarning
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [budgets, filteredTransactions, getCategoryById]);

  // Activos y Pasivos
  const accountsData = useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;

    const list = accounts.map(acc => {
      const isLiability = acc.type === 'credit' || acc.balance < 0;
      if (isLiability) {
        totalLiabilities += Math.abs(acc.balance);
      } else {
        totalAssets += acc.balance;
      }
      return {
        ...acc,
        isLiability
      };
    });

    return {
      list,
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities
    };
  }, [accounts]);

  // Fecha y hora del reporte actual
  const now = new Date();
  const formattedReportDate = now.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  const formattedReportTime = now.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const reportId = `REP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${generateSecureRandomNumber(1000, 9999)}`;

  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);

  // Historial de Informes Guardados en almacenamiento local
  const [savedReports, setSavedReports] = useState<SavedReportItem[]>(() => {
    try {
      const stored = localStorage.getItem('finantrack_saved_reports');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [isSavedReportsModalOpen, setIsSavedReportsModalOpen] = useState<boolean>(false);
  const [isSaveSuccessModalOpen, setIsSaveSuccessModalOpen] = useState<boolean>(false);
  const [currentSavedReport, setCurrentSavedReport] = useState<SavedReportItem | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setDownloadSuccessToast(msg);
    setTimeout(() => setDownloadSuccessToast(null), 4000);
  };

  const showCopiedToast = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 3000);
  };

  // Generar HTML Standalone autónomo con estilos embebidos
  const generateStandaloneHTML = () => {
    const reportElement = document.getElementById('printable-report');
    if (!reportElement) return '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FinanTrack Pro - Informe ${periodInfo.label}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px 16px; }
    .report-wrap { max-width: 960px; margin: 0 auto; background: #ffffff; padding: 36px 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #cbd5e1; }
    .no-print-toolbar { max-width: 960px; margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #0f172a; padding: 14px 20px; border-radius: 12px; color: #ffffff; }
    .btn-print { background: #10b981; color: #ffffff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
    .btn-print:hover { background: #059669; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; font-size: 11px; }
    th, td { border: 1px solid #cbd5e1; padding: 7px 9px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; color: #1e293b; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .card { padding: 14px; border: 1px solid #cbd5e1; border-radius: 10px; background: #f8fafc; }
    .card-title { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
    .card-value { font-size: 18px; font-weight: 800; font-family: monospace; margin-top: 4px; color: #0f172a; }
    @media print {
      body { background: #ffffff !important; padding: 0 !important; color: #000000 !important; }
      .no-print-toolbar { display: none !important; }
      .report-wrap { border: none !important; box-shadow: none !important; padding: 0 !important; max-width: 100% !important; border-radius: 0 !important; }
      @page { margin: 12mm 15mm; size: A4 portrait; }
    }
  </style>
</head>
<body>
  <div class="no-print-toolbar">
    <div style="font-size: 13px; font-weight: 600;">📄 Informe Oficial de FinanTrack Pro (${periodInfo.label})</div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir o Guardar como PDF</button>
  </div>
  <div class="report-wrap">
    ${reportElement.innerHTML}
  </div>
</body>
</html>`;
  };

  // Función para Guardar en el Historial y Descargar
  const handleSaveReport = () => {
    const htmlContent = generateStandaloneHTML();

    // 1. Guardar snapshot en localStorage permanente
    const newReportItem: SavedReportItem = {
      id: reportId,
      title: `Informe Contable ${periodInfo.label}`,
      periodLabel: periodInfo.label,
      savedAt: new Date().toISOString(),
      netWorth: accountsData.netWorth,
      totalIncome: periodMetrics.income,
      totalExpense: periodMetrics.expense,
      balance: periodMetrics.net,
      savingsRate: periodMetrics.savingsRate,
      reportNotes: reportNotes || undefined,
      htmlContent,
    };

    const updatedList = [newReportItem, ...savedReports.filter(r => r.id !== reportId)].slice(0, 30);
    setSavedReports(updatedList);
    try {
      localStorage.setItem('finantrack_saved_reports', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
    }

    setCurrentSavedReport(newReportItem);
    setIsSaveSuccessModalOpen(true);

    // 2. Intentar la descarga del archivo standalone
    try {
      if (htmlContent) {
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FinanTrack_Reporte_${periodInfo.code}_${now.toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.warn('Descarga por elemento anchor bloqueada en el entorno sandbox:', e);
    }

    showToast('✅ ¡Informe guardado en el historial de la app y archivo generado!');
  };

  // Función para Imprimir con instrucción asistida
  const handlePrint = () => {
    showToast('🖨️ Abriendo diálogo de impresión. Elige "Guardar como PDF" en destino para archivo digital.');
    setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.warn('Impresión nativa bloqueada:', e);
        handleSaveReport();
      }
    }, 200);
  };

  // Función dedicada para Generar Informe Financiero en PDF Estructurado (aprovechando reglas @media print de src/index.css)
  const handleGenerateStructuredPDF = () => {
    showToast('📑 Generando informe financiero estructurado en PDF. En la ventana de impresión, selecciona "Guardar como PDF".');
    setTimeout(() => {
      try {
        window.print();
      } catch (e) {
        console.warn('Impresión/PDF bloqueada por entorno:', e);
        handleSaveReport();
      }
    }, 250);
  };

  // Copiar resumen de texto al portapapeles
  const handleCopyTextSummary = () => {
    const summary = `📄 REPORTE FINANCIERO - FINANTRACK PRO
Periodo: ${periodInfo.label} (${formattedReportDate})
-----------------------------------------
• Patrimonio Neto: ${formatMoney(accountsData.netWorth, currency)}
• Ingresos: +${formatMoney(periodMetrics.income, currency)}
• Gastos: -${formatMoney(periodMetrics.expense, currency)}
• Balance / Flujo: ${periodMetrics.net >= 0 ? '+' : ''}${formatMoney(periodMetrics.net, currency)}
• Tasa de Ahorro: ${periodMetrics.savingsRate}%
• Operaciones: ${periodMetrics.count} movimientos
${reportNotes ? `\nNota: ${reportNotes}` : ''}
-----------------------------------------
Generado con FinanTrack Pro`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary)
        .then(() => showCopiedToast('¡Resumen copiado al portapapeles!'))
        .catch(() => showCopiedToast('No se pudo copiar automáticamente.'));
    }
  };

  // Copiar HTML completo al portapapeles
  const handleCopyHTML = (html?: string) => {
    const content = html || generateStandaloneHTML();
    if (!content) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content)
        .then(() => showCopiedToast('¡Código HTML completo copiado al portapapeles!'))
        .catch(() => showCopiedToast('No se pudo copiar automáticamente.'));
    }
  };

  // Eliminar un informe guardado
  const handleDeleteSavedReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    try {
      localStorage.setItem('finantrack_saved_reports', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    showToast('Informe eliminado del historial.');
  };

  // Función para Descargar CSV de transacciones
  const handleDownloadCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Categoría', 'Cuenta', 'Monto', 'Moneda', 'Nota'];
    const rows = filteredTransactions.slice(0, txLimit).map(tx => {
      const cat = getCategoryById(tx.categoryId);
      const acc = getAccountById(tx.accountId);
      return [
        tx.date,
        tx.type === 'income' ? 'Ingreso' : tx.type === 'expense' ? 'Gasto' : 'Transferencia',
        `"${(cat?.name || 'Otro').replace(/"/g, '""')}"`,
        `"${(acc?.name || 'Cuenta').replace(/"/g, '""')}"`,
        tx.amount,
        currency,
        `"${(tx.note || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinanTrack_Movimientos_${periodInfo.code}_${now.toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('¡Archivo CSV exportado con éxito!');
  };

  // Helper de formateo monetario con opción de ocultamiento si se solicita expresamente
  const formatReportMoney = (amount: number) => {
    if (maskSensitiveData) {
      return '•••••• ' + currency;
    }
    return formatMoney(amount, currency);
  };

  return (
    <div className="space-y-6 pb-12 w-full overflow-hidden">
      {/* Toast de confirmación de descarga */}
      {downloadSuccessToast && (
        <div className="fixed top-20 right-4 z-50 p-3.5 bg-slate-900 text-white dark:bg-emerald-600 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white shrink-0" />
          <span>{downloadSuccessToast}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BARRA DE CONFIGURACIÓN Y ACCIONES (SOLO PANTALLA - OCULTO AL IMPRIMIR)    */}
      {/* ========================================================================= */}
      <div className="no-print bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Volver"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
              <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                Reportes & Balances Oficiales
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate sm:whitespace-normal">
                Diseño optimizado para papel, balances oficiales, exportación a PDF y archivo contable.
              </p>
            </div>
          </div>

          {/* Botones de Acción Primaria (Generar PDF Estructurado, Imprimir, Guardar Documento, Informes Guardados, Exportar CSV) */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Botón Principal Requerido: Generar Informe Financiero en PDF Estructurado */}
            <button
              type="button"
              onClick={handleGenerateStructuredPDF}
              id="btn-generate-structured-pdf"
              title="Generar informe financiero en PDF estructurado según normativas contables y reglas de impresión"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              <span>Generar Informe en PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              id="btn-print-report"
              title="Abrir cuadro de diálogo de impresión directa del navegador"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 stroke-[2]" />
              <span>Imprimir</span>
            </button>

            {canExportReports && (
              <button
                type="button"
                onClick={handleSaveReport}
                id="btn-save-report"
                title="Guardar informe en el historial y generar archivo de descarga"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Guardar Informe</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSavedReportsModalOpen(true)}
              id="btn-saved-reports-history"
              title="Consultar informes guardados anteriormente"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
            >
              <FolderOpen className="w-4 h-4 text-amber-500" />
              <span>Guardados</span>
              {savedReports.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-extrabold text-slate-800 dark:text-slate-200">
                  {savedReports.length}
                </span>
              )}
            </button>

            {canExportReports && (
              <button
                type="button"
                onClick={handleDownloadCSV}
                id="btn-export-csv"
                title="Exportar listado de transacciones en formato CSV para Excel"
                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Controles de Configuración del Reporte */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Selector de Periodo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              Periodo Contable
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="current">Mes Actual ({formatMonthPeriod(selectedPeriod || getCurrentMonthPeriod())})</option>
              <option value="previous">Mes Anterior</option>
              <option value="last3months">Últimos 3 Meses</option>
              <option value="year">Año Completo ({now.getFullYear()})</option>
              <option value="all">Todo el Historial</option>
            </select>
          </div>

          {/* Límite de Transacciones */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
              Límite de Transacciones
            </label>
            <select
              value={txLimit}
              onChange={(e) => setTxLimit(Number(e.target.value))}
              disabled={!includeTransactions}
              className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-50"
            >
              <option value={10}>Últimas 10 operaciones</option>
              <option value={25}>Últimas 25 operaciones</option>
              <option value={50}>Últimas 50 operaciones</option>
              <option value={100}>Últimas 100 operaciones</option>
              <option value={9999}>Todas las operaciones ({filteredTransactions.length})</option>
            </select>
          </div>

          {/* Opciones de Seguridad y Papel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-purple-500" />
              Formato de Impresión
            </label>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={highContrastPrint}
                  onChange={(e) => setHighContrastPrint(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Estilo Ahorro de Tinta / Alto Contraste</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maskSensitiveData}
                  onChange={(e) => setMaskSensitiveData(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500 w-3.5 h-3.5"
                />
                <span className="flex items-center gap-1">
                  {maskSensitiveData ? <EyeOff className="w-3 h-3 text-amber-500" /> : <Eye className="w-3 h-3 text-slate-400" />}
                  Ocultar cifras (Confidencial)
                </span>
              </label>
            </div>
          </div>

          {/* Notas personalizadas */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              Nota u Observación en Cabecera
            </label>
            <input
              type="text"
              placeholder="Ej: Balance para declaración IRPF o revisión mensual..."
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Selector de Secciones a Incluir (Filtro Modular) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Módulos y Secciones del Documento:
          </span>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[
              { label: 'Resumen y KPIs', state: includeSummary, set: setIncludeSummary },
              { label: 'Cuentas y Activos', state: includeAccounts, set: setIncludeAccounts },
              { label: 'Gastos por Categoría', state: includeCategories, set: setIncludeCategories },
              { label: 'Presupuestos', state: includeBudgets, set: setIncludeBudgets },
              { label: 'Metas de Ahorro', state: includeGoals, set: setIncludeGoals },
              { label: 'Listado de Movimientos', state: includeTransactions, set: setIncludeTransactions },
              { label: 'Notas de Movimientos', state: includeTxNotes, set: setIncludeTxNotes, disabled: !includeTransactions },
              { label: 'Cuadro de Firmas', state: includeSignatures, set: setIncludeSignatures }
            ].map((sec, idx) => (
              <button
                key={idx}
                type="button"
                disabled={sec.disabled}
                onClick={() => sec.set(!sec.state)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  sec.disabled 
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                    : sec.state
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {sec.state ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400 dark:text-white" /> : <Square className="w-3.5 h-3.5" />}
                <span>{sec.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selector adaptativo de visualización en pantallas móviles (Tarjetas Compactas vs Tabla Clásica) */}
      <div className="no-print sm:hidden flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            {mobileTableViewMode === 'cards' ? <LayoutList className="w-4 h-4" /> : <TableIcon className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">
              {mobileTableViewMode === 'cards' ? 'Modo Tarjetas Compactas' : 'Modo Tabla Desplazable'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
              {mobileTableViewMode === 'cards' ? 'Ajustado 100% a la pantalla móvil' : 'Desplazamiento horizontal habilitado'}
            </span>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 ml-2">
          <button
            type="button"
            onClick={() => setMobileTableViewMode('cards')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              mobileTableViewMode === 'cards'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Formato de tarjetas compactas sin descuadrar la pantalla"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Tarjetas</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTableViewMode('table')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              mobileTableViewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Formato de tabla con desplazamiento horizontal"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Tabla</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DOCUMENTO IMPRIMIBLE / VISTA DE PAPEL (PRINT CANVAS)                       */}
      {/* ========================================================================= */}
      <div 
        id="printable-report"
        className={`print-document bg-white text-slate-900 p-4 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-md w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 font-sans ${
          highContrastPrint ? 'print-high-contrast' : ''
        }`}
      >
        {/* 1. ENCABEZADO FORMAL Y MEMBRETE DEL DOCUMENTO */}
        <div className="pb-5 sm:pb-6 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-lg shrink-0">
                F
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900">
                  FinanTrack Pro
                </h1>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Informe Financiero Oficial & Balance Contable
                </p>
              </div>
            </div>
            {reportNotes && (
              <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 max-w-md">
                <span className="font-bold text-slate-900">Observación: </span>
                {reportNotes}
              </div>
            )}
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600 space-y-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono text-[10px] font-bold text-slate-800">
              REF: {reportId}
            </div>
            <div><strong className="text-slate-900">Periodo:</strong> {periodInfo.label}</div>
            <div><strong className="text-slate-900">Emisión:</strong> {formattedReportDate} ({formattedReportTime})</div>
            <div><strong className="text-slate-900">Moneda:</strong> {currency}</div>
            <div className="text-[10px] text-slate-400 font-medium">Documento Confidencial de Control Personal</div>
          </div>
        </div>

        {/* 2. RESUMEN EJECUTIVO Y KPIS */}
        {includeSummary && (
          <section className="report-section space-y-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300 flex items-center justify-between">
              <span>1. Resumen Ejecutivo & Indicadores Clave</span>
              <span className="text-[10px] text-slate-500 font-normal lowercase">{periodInfo.label}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Patrimonio Neto */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/70">
                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Patrimonio Neto</div>
                <div className="text-base sm:text-lg font-black font-mono text-slate-900 mt-0.5">
                  {formatReportMoney(accountsData.netWorth)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Activos - Pasivos Totales</div>
              </div>

              {/* Ingresos Totales */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-emerald-50/40">
                <div className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">Ingresos del Periodo</div>
                <div className="text-base sm:text-lg font-black font-mono text-emerald-800 mt-0.5">
                  +{formatReportMoney(periodMetrics.income)}
                </div>
                <div className="text-[10px] text-emerald-700 mt-1">{filteredTransactions.filter(t => t.type === 'income').length} depósitos</div>
              </div>

              {/* Gastos Totales */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-rose-50/40">
                <div className="text-[10px] font-bold uppercase text-rose-800 tracking-wider">Gastos del Periodo</div>
                <div className="text-base sm:text-lg font-black font-mono text-rose-800 mt-0.5">
                  -{formatReportMoney(periodMetrics.expense)}
                </div>
                <div className="text-[10px] text-rose-700 mt-1">
                  Esenciales: {formatReportMoney(periodMetrics.essentialExpense)}
                </div>
              </div>

              {/* Balance Neto / Ahorro */}
              <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50/70">
                <div className="text-[10px] font-bold uppercase text-slate-700 tracking-wider">Ahorro Neto (Flujo)</div>
                <div className={`text-base sm:text-lg font-black font-mono mt-0.5 ${periodMetrics.net >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {periodMetrics.net >= 0 ? '+' : ''}{formatReportMoney(periodMetrics.net)}
                </div>
                <div className="text-[10px] font-bold text-slate-700 mt-1">
                  Tasa de Ahorro: {periodMetrics.savingsRate}%
                </div>
              </div>
            </div>

            {/* Fila secundaria de detalles */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs flex flex-wrap items-center justify-between gap-2.5 text-slate-700">
              <div>
                <strong>Total Operaciones:</strong> {periodMetrics.count} movimientos
              </div>
              <div>
                <strong>Gasto Promedio Diario:</strong> {formatReportMoney(periodMetrics.avgDailyExpense)}/día
              </div>
              <div>
                <strong>Gastos Prescindibles:</strong> {formatReportMoney(periodMetrics.nonEssentialExpense)} (
                {periodMetrics.expense > 0 ? Math.round((periodMetrics.nonEssentialExpense / periodMetrics.expense) * 100) : 0}%)
              </div>
              <div>
                <strong>Estado Financiero:</strong>{' '}
                <span className={`font-bold ${periodMetrics.net >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {periodMetrics.net >= 0 ? 'Superávit' : 'Déficit'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 3. ESTADO DE CUENTAS Y POSICIÓN PATRIMONIAL */}
        {includeAccounts && (
          <section className="report-section space-y-2.5">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300 flex items-center justify-between">
              <span>2. Posición Patrimonial & Estado de Cuentas</span>
              <span className="text-xs font-mono font-bold text-slate-800">
                Neto: {formatReportMoney(accountsData.netWorth)}
              </span>
            </h2>

            {/* VISTA MÓVIL: Tarjetas compactas sin desbordes ni descuadres */}
            <div className={`${mobileTableViewMode === 'cards' ? 'block sm:hidden' : 'hidden'} print:hidden space-y-2.5`}>
              {accountsData.list.map((acc) => {
                const typeLabel = {
                  checking: 'Cuenta Corriente',
                  savings: 'Cuenta Ahorro',
                  cash: 'Efectivo',
                  credit: 'Tarjeta de Crédito / Pasivo',
                  investment: 'Inversión'
                }[acc.type] || 'Cuenta';

                const baseTotal = acc.isLiability ? accountsData.totalLiabilities : accountsData.totalAssets;
                const sharePct = baseTotal > 0 ? Math.round((Math.abs(acc.balance) / baseTotal) * 100) : 0;

                return (
                  <div key={acc.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 leading-snug truncate">{acc.name}</h4>
                        <span className="text-[10px] text-slate-500">{typeLabel}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-mono font-black ${
                          acc.isLiability ? 'text-rose-800' : 'text-slate-900'
                        }`}>
                          {acc.isLiability ? '-' : ''}{formatReportMoney(Math.abs(acc.balance))}
                        </span>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {sharePct}% {acc.isLiability ? 'del pasivo' : 'del activo'}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${acc.isLiability ? 'bg-rose-500' : 'bg-emerald-600'}`} 
                        style={{ width: `${Math.min(sharePct, 100)}%` }} 
                      />
                    </div>
                  </div>
                );
              })}

              <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Activos Totales:</span>
                  <span className="font-mono font-bold text-emerald-800">+{formatReportMoney(accountsData.totalAssets)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Pasivos Totales:</span>
                  <span className="font-mono font-bold text-rose-800">-{formatReportMoney(accountsData.totalLiabilities)}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-300 flex justify-between font-bold text-slate-900">
                  <span>Patrimonio Neto:</span>
                  <span className="font-mono font-black text-sm">{formatReportMoney(accountsData.netWorth)}</span>
                </div>
              </div>
            </div>

            {/* VISTA TABLA: Responsive con progressive disclosure y formato print oficial */}
            <div className={`${mobileTableViewMode === 'cards' ? 'hidden sm:block' : 'block'} print:block w-full max-w-full overflow-x-auto rounded-xl border border-slate-300 bg-white`}>
              <table className="w-full min-w-[500px] sm:min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">Entidad / Cuenta</th>
                    <th className="p-2 border-r border-slate-300">Tipo de Cuenta</th>
                    <th className="p-2 border-r border-slate-300 text-right">Saldo Actual</th>
                    <th className="p-2 text-right hidden md:table-cell print:table-cell">% Distribución</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsData.list.map((acc, index) => {
                    const typeLabel = {
                      checking: 'Cuenta Corriente',
                      savings: 'Cuenta Ahorro',
                      cash: 'Efectivo',
                      credit: 'Tarjeta de Crédito / Pasivo',
                      investment: 'Inversión'
                    }[acc.type] || 'Cuenta';

                    const baseTotal = acc.isLiability ? accountsData.totalLiabilities : accountsData.totalAssets;
                    const sharePct = baseTotal > 0 ? Math.round((Math.abs(acc.balance) / baseTotal) * 100) : 0;

                    return (
                      <tr key={acc.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="p-2 border-r border-b border-slate-300 font-bold text-slate-900">
                          {acc.name}
                        </td>
                        <td className="p-2 border-r border-b border-slate-300 text-slate-600">
                          {typeLabel}
                        </td>
                        <td className={`p-2 border-r border-b border-slate-300 text-right font-mono font-bold ${
                          acc.isLiability ? 'text-rose-800' : 'text-slate-900'
                        }`}>
                          {acc.isLiability ? '-' : ''}{formatReportMoney(Math.abs(acc.balance))}
                        </td>
                        <td className="p-2 border-b border-slate-300 text-right font-mono text-slate-600 hidden md:table-cell print:table-cell">
                          {sharePct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                    <td colSpan={2} className="p-2 border-r border-slate-300">
                      Activos ({formatReportMoney(accountsData.totalAssets)}) — Pasivos ({formatReportMoney(accountsData.totalLiabilities)})
                    </td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono text-slate-900 font-black">
                      {formatReportMoney(accountsData.netWorth)}
                    </td>
                    <td className="p-2 text-right font-mono text-[10px] text-slate-600 hidden md:table-cell print:table-cell">
                      100% Neto
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* 4. DESGLOSE DE GASTOS POR CATEGORÍA */}
        {includeCategories && (
          <section className="report-section space-y-2.5">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300 flex items-center justify-between">
              <span>3. Desglose de Gastos por Categoría</span>
              <span className="text-xs font-mono font-bold text-rose-800">
                Total Gastado: {formatReportMoney(periodMetrics.expense)}
              </span>
            </h2>

            {categoryBreakdown.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                No hay registros de gasto en el periodo seleccionado.
              </div>
            ) : (
              <>
                {/* VISTA MÓVIL: Tarjetas compactas adaptativas */}
                <div className={`${mobileTableViewMode === 'cards' ? 'block sm:hidden' : 'hidden'} print:hidden space-y-2.5`}>
                  {categoryBreakdown.map((cat) => (
                    <div key={cat.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 leading-snug truncate">{cat.name}</h4>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold mt-0.5 ${
                            cat.isEssential ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-900'
                          }`}>
                            {cat.isEssential ? 'Esencial' : 'Prescindible'}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-black text-slate-900 block">
                            {formatReportMoney(cat.total)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {cat.percentage}% del total • {cat.count} op.
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso de proporción */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-700" 
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* VISTA TABLA: Responsive con progressive disclosure y formato print */}
                <div className={`${mobileTableViewMode === 'cards' ? 'hidden sm:block' : 'block'} print:block w-full max-w-full overflow-x-auto rounded-xl border border-slate-300 bg-white`}>
                  <table className="w-full min-w-[500px] sm:min-w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                        <th className="p-2 border-r border-slate-300">Categoría</th>
                        <th className="p-2 border-r border-slate-300 hidden md:table-cell print:table-cell">Nivel de Necesidad</th>
                        <th className="p-2 border-r border-slate-300 text-center hidden sm:table-cell print:table-cell">N° Op.</th>
                        <th className="p-2 border-r border-slate-300 text-right">Total Gastado</th>
                        <th className="p-2 border-r border-slate-300 text-right">% Gasto Total</th>
                        <th className="p-2 text-left w-24 hidden lg:table-cell print:table-cell">Proporción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryBreakdown.map((cat, index) => (
                        <tr key={cat.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                          <td className="p-2 border-r border-b border-slate-300 font-bold text-slate-900">
                            {cat.name}
                          </td>
                          <td className="p-2 border-r border-b border-slate-300 text-slate-700 hidden md:table-cell print:table-cell">
                            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              cat.isEssential ? 'bg-slate-200 text-slate-800' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {cat.isEssential ? 'Esencial' : 'Prescindible'}
                            </span>
                          </td>
                          <td className="p-2 border-r border-b border-slate-300 text-center font-mono text-slate-600 hidden sm:table-cell print:table-cell">
                            {cat.count}
                          </td>
                          <td className="p-2 border-r border-b border-slate-300 text-right font-mono font-bold text-slate-900">
                            {formatReportMoney(cat.total)}
                          </td>
                          <td className="p-2 border-r border-b border-slate-300 text-right font-mono text-slate-700 font-bold">
                            {cat.percentage}%
                          </td>
                          <td className="p-2 border-b border-slate-300 hidden lg:table-cell print:table-cell">
                            <div className="w-full bg-slate-200 h-2.5 rounded-sm overflow-hidden border border-slate-300">
                              <div 
                                className="h-full bg-slate-700" 
                                style={{ width: `${Math.min(cat.percentage, 100)}%` }} 
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {/* 5. ESTADO DE PRESUPUESTOS */}
        {includeBudgets && budgetStatusList.length > 0 && (
          <section className="report-section space-y-2.5">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300 flex items-center justify-between">
              <span>4. Control & Cumplimiento de Presupuestos</span>
              <span className="text-xs text-slate-600 font-medium">Límites mensuales asignados</span>
            </h2>

            {/* VISTA MÓVIL: Tarjetas compactas adaptativas */}
            <div className={`${mobileTableViewMode === 'cards' ? 'block sm:hidden' : 'hidden'} print:hidden space-y-2.5`}>
              {budgetStatusList.map((b) => (
                <div key={b.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 leading-snug truncate">{b.categoryName}</h4>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5 ${
                        b.isExceeded 
                          ? 'bg-rose-100 text-rose-900 border border-rose-300' 
                          : b.isWarning 
                          ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {b.isExceeded ? 'EXCEDIDO' : b.isWarning ? 'ALERTA' : 'EN REGLA'} ({b.pct}%)
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-slate-900">
                        {formatReportMoney(b.spent)} <span className="text-[10px] font-normal text-slate-500">/ {formatReportMoney(b.limit)}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold block ${
                        b.isExceeded ? 'text-rose-700' : 'text-emerald-700'
                      }`}>
                        {b.isExceeded ? 'Exceso: -' : 'Disponible: +'}{formatReportMoney(Math.abs(b.remaining))}
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso de uso del presupuesto */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${b.isExceeded ? 'bg-rose-600' : b.isWarning ? 'bg-amber-500' : 'bg-emerald-600'}`} 
                      style={{ width: `${Math.min(b.pct, 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* VISTA TABLA: Responsive con progressive disclosure y formato print */}
            <div className={`${mobileTableViewMode === 'cards' ? 'hidden sm:block' : 'block'} print:block w-full max-w-full overflow-x-auto rounded-xl border border-slate-300 bg-white`}>
              <table className="w-full min-w-[500px] sm:min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">Categoría</th>
                    <th className="p-2 border-r border-slate-300 text-right">Límite</th>
                    <th className="p-2 border-r border-slate-300 text-right">Gastado</th>
                    <th className="p-2 border-r border-slate-300 text-right hidden md:table-cell print:table-cell">Disponible</th>
                    <th className="p-2 border-r border-slate-300 text-right">% Uso</th>
                    <th className="p-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetStatusList.map((b, index) => (
                    <tr key={b.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-2 border-r border-b border-slate-300 font-bold text-slate-900">
                        {b.categoryName}
                      </td>
                      <td className="p-2 border-r border-b border-slate-300 text-right font-mono text-slate-700">
                        {formatReportMoney(b.limit)}
                      </td>
                      <td className="p-2 border-r border-b border-slate-300 text-right font-mono font-bold text-slate-900">
                        {formatReportMoney(b.spent)}
                      </td>
                      <td className={`p-2 border-r border-b border-slate-300 text-right font-mono font-bold hidden md:table-cell print:table-cell ${
                        b.isExceeded ? 'text-rose-800' : 'text-emerald-800'
                      }`}>
                        {b.isExceeded ? '-' : ''}{formatReportMoney(Math.abs(b.remaining))}
                      </td>
                      <td className="p-2 border-r border-b border-slate-300 text-right font-mono font-bold text-slate-800">
                        {b.pct}%
                      </td>
                      <td className="p-2 border-b border-slate-300 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.isExceeded 
                            ? 'bg-rose-100 text-rose-900 border border-rose-300' 
                            : b.isWarning 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {b.isExceeded ? 'EXCEDIDO' : b.isWarning ? 'ALERTA' : 'EN REGLA'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 6. METAS DE AHORRO */}
        {includeGoals && savingsGoals.length > 0 && (
          <section className="report-section space-y-2.5">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300 flex items-center justify-between">
              <span>5. Estado de Metas y Fondos de Ahorro</span>
              <span className="text-xs text-slate-600 font-medium">{savingsGoals.length} metas activas</span>
            </h2>

            {/* VISTA MÓVIL: Tarjetas compactas adaptativas */}
            <div className={`${mobileTableViewMode === 'cards' ? 'block sm:hidden' : 'hidden'} print:hidden space-y-2.5`}>
              {savingsGoals.map((g) => {
                const pct = g.targetAmount > 0 ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100) : 0;
                const remaining = Math.max(0, g.targetAmount - g.currentAmount);

                return (
                  <div key={g.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 leading-snug truncate">{g.name}</h4>
                        <span className="text-[10px] text-slate-500">
                          {g.targetDate ? `Límite: ${formatDate(g.targetDate)}` : 'Sin fecha límite'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-black text-emerald-800 block">
                          {formatReportMoney(g.currentAmount)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Meta: {formatReportMoney(g.targetAmount)} ({pct}%)
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso de la meta */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600" 
                        style={{ width: `${Math.min(pct, 100)}%` }} 
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                      <span>{pct >= 100 ? '¡Meta alcanzada!' : `Falta: ${formatReportMoney(remaining)}`}</span>
                      <span>{pct}% cumplido</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VISTA TABLA: Responsive con progressive disclosure y formato print */}
            <div className={`${mobileTableViewMode === 'cards' ? 'hidden sm:block' : 'block'} print:block w-full max-w-full overflow-x-auto rounded-xl border border-slate-300 bg-white`}>
              <table className="w-full min-w-[500px] sm:min-w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">Meta / Objetivo</th>
                    <th className="p-2 border-r border-slate-300 text-right">Objetivo Total</th>
                    <th className="p-2 border-r border-slate-300 text-right">Ahorrado</th>
                    <th className="p-2 border-r border-slate-300 text-right">% Alcanzado</th>
                    <th className="p-2 border-r border-slate-300 text-right hidden md:table-cell print:table-cell">Faltante</th>
                    <th className="p-2 text-center hidden sm:table-cell print:table-cell">Límite</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsGoals.map((g, index) => {
                    const pct = g.targetAmount > 0 ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100) : 0;
                    const remaining = Math.max(0, g.targetAmount - g.currentAmount);

                    return (
                      <tr key={g.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="p-2 border-r border-b border-slate-300 font-bold text-slate-900">
                          {g.name}
                        </td>
                        <td className="p-2 border-r border-b border-slate-300 text-right font-mono text-slate-700">
                          {formatReportMoney(g.targetAmount)}
                        </td>
                        <td className="p-2 border-r border-b border-slate-300 text-right font-mono font-bold text-emerald-800">
                          {formatReportMoney(g.currentAmount)}
                        </td>
                        <td className="p-2 border-r border-b border-slate-300 text-right font-mono font-bold text-slate-900">
                          {pct}%
                        </td>
                        <td className="p-2 border-r border-b border-slate-300 text-right font-mono text-slate-600 hidden md:table-cell print:table-cell">
                          {formatReportMoney(remaining)}
                        </td>
                        <td className="p-2 border-b border-slate-300 text-center font-mono text-slate-600 hidden sm:table-cell print:table-cell">
                          {g.targetDate ? formatDate(g.targetDate) : 'Sin fecha'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 7. LIBRO DIARIO / LISTADO DETALLADO DE TRANSACCIONES */}
        {includeTransactions && (
          <section className="report-section space-y-2.5">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-300 flex items-center justify-between">
              <span>6. Registro Detallado de Movimientos (Libro Diario)</span>
              <span className="text-xs text-slate-500 font-normal">
                Mostrando {Math.min(filteredTransactions.length, txLimit)} de {filteredTransactions.length}
              </span>
            </h2>

            {filteredTransactions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                No hay movimientos registrados para este periodo contable.
              </div>
            ) : (
              <>
                {/* VISTA MÓVIL: Tarjetas compactas adaptativas */}
                <div className={`${mobileTableViewMode === 'cards' ? 'block sm:hidden' : 'hidden'} print:hidden space-y-2`}>
                  {filteredTransactions.slice(0, txLimit).map((tx) => {
                    const cat = getCategoryById(tx.categoryId);
                    const acc = getAccountById(tx.accountId);
                    const isIncome = tx.type === 'income';
                    const isExpense = tx.type === 'expense';

                    return (
                      <div key={tx.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 leading-snug truncate">
                              {cat?.name || 'Movimiento'}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span>{formatDate(tx.date)}</span>
                              <span>•</span>
                              <span className="truncate">{acc?.name || 'Cuenta'}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs font-mono font-black ${
                              isIncome ? 'text-emerald-800' : 'text-slate-900'
                            }`}>
                              {isIncome ? '+' : isExpense ? '-' : ''}{formatReportMoney(tx.amount)}
                            </span>
                            <div className="mt-0.5">
                              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                isIncome 
                                  ? 'bg-emerald-100 text-emerald-900' 
                                  : isExpense 
                                  ? 'bg-slate-200 text-slate-800' 
                                  : 'bg-blue-100 text-blue-900'
                              }`}>
                                {isIncome ? 'Ingreso' : isExpense ? 'Gasto' : 'Transf.'}
                              </span>
                            </div>
                          </div>
                        </div>
                        {includeTxNotes && tx.note && (
                          <div className="text-[10px] text-slate-500 italic bg-white/80 p-1.5 rounded border border-slate-200/60 mt-1">
                            {tx.note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* VISTA TABLA: Responsive con progressive disclosure y formato print */}
                <div className={`${mobileTableViewMode === 'cards' ? 'hidden sm:block' : 'block'} print:block w-full max-w-full overflow-x-auto rounded-xl border border-slate-300 bg-white`}>
                  <table className="w-full min-w-[500px] sm:min-w-full text-[11px] text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                        <th className="p-2 border-r border-slate-300 w-24">Fecha</th>
                        <th className="p-2 border-r border-slate-300">Concepto / Categoría</th>
                        <th className="p-2 border-r border-slate-300 hidden sm:table-cell print:table-cell">Cuenta</th>
                        <th className="p-2 border-r border-slate-300 text-center w-20 hidden md:table-cell print:table-cell">Tipo</th>
                        <th className="p-2 text-right w-28">Monto ({currency})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.slice(0, txLimit).map((tx, index) => {
                        const cat = getCategoryById(tx.categoryId);
                        const acc = getAccountById(tx.accountId);
                        const isIncome = tx.type === 'income';
                        const isExpense = tx.type === 'expense';

                        return (
                          <tr key={tx.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="p-2 border-r border-b border-slate-300 font-mono text-slate-600 whitespace-nowrap">
                              {formatDate(tx.date)}
                            </td>
                            <td className="p-2 border-r border-b border-slate-300 text-slate-900">
                              <div className="font-bold">{cat?.name || 'Movimiento'}</div>
                              {includeTxNotes && tx.note && (
                                <div className="text-[10px] text-slate-500 italic mt-0.5">{tx.note}</div>
                              )}
                            </td>
                            <td className="p-2 border-r border-b border-slate-300 text-slate-700 hidden sm:table-cell print:table-cell">
                              {acc?.name || 'Cuenta'}
                            </td>
                            <td className="p-2 border-r border-b border-slate-300 text-center hidden md:table-cell print:table-cell">
                              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                isIncome 
                                  ? 'bg-emerald-100 text-emerald-900' 
                                  : isExpense 
                                  ? 'bg-slate-200 text-slate-800' 
                                  : 'bg-blue-100 text-blue-900'
                              }`}>
                                {isIncome ? 'Ingreso' : isExpense ? 'Gasto' : 'Transf.'}
                              </span>
                            </td>
                            <td className={`p-2 border-b border-slate-300 text-right font-mono font-bold whitespace-nowrap ${
                              isIncome ? 'text-emerald-800' : 'text-slate-900'
                            }`}>
                              {isIncome ? '+' : isExpense ? '-' : ''}{formatReportMoney(tx.amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {/* 8. CERTIFICACIÓN CONTABLE Y CUADRO DE FIRMAS */}
        {includeSignatures && (
          <section className="report-section pt-6 border-t-2 border-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Notas y Declaraciones Adicionales
              </div>
              <div className="h-20 border border-dashed border-slate-300 rounded-lg p-2.5 text-[11px] text-slate-500 italic">
                Espacio reservado para anotaciones manuales, revisiones contables o justificaciones de desviaciones presupuestarias...
              </div>
            </div>

            <div className="space-y-3 flex flex-col justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Conformidad & Aprobación
              </div>
              <div className="pt-8 border-b border-slate-900 text-center text-xs text-slate-700">
                Firma del Titular / Administrador Financiero
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Fecha: ____ / ____ / ________</span>
                <span>Lugar: ____________________</span>
              </div>
            </div>
          </section>
        )}

        {/* 9. PIE DE PÁGINA DEL DOCUMENTO */}
        <div className="pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
          <div>
            FinanTrack Pro © {now.getFullYear()} • Documento emitido con propósitos de control financiero personal.
          </div>
          <div className="font-mono">
            {periodInfo.code} • Página 1 de 1
          </div>
        </div>
      </div>

      {/* Toast de copia al portapapeles */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-4 z-50 p-3 bg-slate-900 text-white rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIRMACIÓN Y OPCIONES DE EXPORTACIÓN DEL INFORME GUARDADO       */}
      {/* ========================================================================= */}
      {isSaveSuccessModalOpen && currentSavedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    ¡Informe Guardado con Éxito!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Archivado en el historial local de FinanTrack Pro ({currentSavedReport.periodLabel})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveSuccessModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen del informe guardado */}
            <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Patrimonio Neto</span>
                <span className="font-mono font-black text-slate-900 dark:text-white">
                  {formatMoney(currentSavedReport.netWorth, currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance del Periodo</span>
                <span className={`font-mono font-black ${currentSavedReport.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {currentSavedReport.balance >= 0 ? '+' : ''}{formatMoney(currentSavedReport.balance, currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Ingresos</span>
                <span className="font-mono font-bold text-emerald-600">
                  +{formatMoney(currentSavedReport.totalIncome, currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Gastos</span>
                <span className="font-mono font-bold text-rose-600">
                  -{formatMoney(currentSavedReport.totalExpense, currency)}
                </span>
              </div>
            </div>

            {/* Acciones directas para guardar en todos los formatos */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Opciones de Descarga y Exportación
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([currentSavedReport.htmlContent], { type: 'text/html;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `FinanTrack_${currentSavedReport.periodLabel.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.html`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast('Descarga iniciada.');
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo .html</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyHTML(currentSavedReport.htmlContent)}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-bold transition-all"
                >
                  <Copy className="w-4 h-4 text-emerald-600" />
                  <span>Copiar Código HTML</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyTextSummary}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-bold transition-all"
                >
                  <Share2 className="w-4 h-4 text-blue-500" />
                  <span>Copiar Resumen Texto</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSaveSuccessModalOpen(false);
                  setIsSavedReportsModalOpen(true);
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Ver historial completo ({savedReports.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSaveSuccessModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: HISTORIAL DE INFORMES GUARDADOS                                    */}
      {/* ========================================================================= */}
      {isSavedReportsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Historial de Informes Guardados
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {savedReports.length} {savedReports.length === 1 ? 'balance archivado' : 'balances archivados'} en tu almacenamiento local
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSavedReportsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Listado de informes */}
            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {savedReports.length === 0 ? (
                <div className="p-8 text-center space-y-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No tienes informes guardados todavía
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Pulsa el botón <strong className="text-slate-900 dark:text-white">Guardar Informe</strong> en la barra superior para archivar este balance y poder consultarlo o descargarlo en cualquier momento.
                  </p>
                </div>
              ) : (
                savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{report.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {new Date(report.savedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </h4>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                          <span>Patrimonio: <strong className="text-slate-800 dark:text-slate-200">{formatMoney(report.netWorth, currency)}</strong></span>
                          <span>Flujo: <strong className={report.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {report.balance >= 0 ? '+' : ''}{formatMoney(report.balance, currency)}
                          </strong></span>
                          <span>Tasa Ahorro: <strong>{report.savingsRate}%</strong></span>
                        </div>
                      </div>

                      {/* Botones de acción del informe */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([report.htmlContent], { type: 'text/html;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `FinanTrack_${report.periodLabel.replace(/\s+/g, '_')}_${report.savedAt.split('T')[0]}.html`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            showToast('Descarga iniciada.');
                          }}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Descargar archivo HTML"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px]">Descargar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyHTML(report.htmlContent)}
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Copiar código HTML"
                        >
                          <Copy className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline text-[11px]">Copiar</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteSavedReport(report.id, e)}
                          className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 hover:text-rose-700 transition-colors"
                          title="Eliminar este informe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsSavedReportsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-colors"
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
