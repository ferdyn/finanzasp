import React, { useState, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CURRENCIES, formatMoney } from '../utils/format';
import { CurrencyCode, RecurringBill, ThemeMode } from '../types/finance';
import { DynamicIcon } from '../components/DynamicIcon';
import { 
  Sliders, DollarSign, Download, Upload, RotateCcw, 
  Trash2, Plus, Calendar, CheckCircle2, Play, Pause, 
  Calculator, Shield, Tag, FileText, AlertTriangle,
  Sun, Moon, Monitor, Check, Palette
} from 'lucide-react';

interface SettingsViewProps {
  onOpenCompoundSimulator: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenCompoundSimulator }) => {
  const { 
    currency, 
    setCurrency, 
    theme,
    effectiveTheme,
    setTheme,
    categories, 
    addCategory, 
    deleteCategory, 
    recurringBills, 
    processRecurringBill, 
    updateRecurringBill, 
    deleteRecurringBill,
    resetToSeedData, 
    clearAllData, 
    exportDataJSON, 
    importDataJSON,
    exportTransactionsCSV,
    accounts
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');

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
  const [newBillFreq, setNewBillFreq] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [showAddRecurring, setShowAddRecurring] = useState(false);

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

    useFinance().addRecurringBill({
      name: newBillName.trim(),
      amount: amt,
      type: newBillType,
      categoryId: newBillCatId || categories[0].id,
      accountId: newBillAccId || accounts[0].id,
      frequency: newBillFreq,
      nextDueDate: new Date().toISOString().split('T')[0],
      isActive: true,
    });

    setNewBillName('');
    setNewBillAmount('');
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Ajustes y Configuración
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
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
        
        {/* Selector de Tema (Claro / Oscuro / Sistema) */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
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

        {/* Moneda Principal */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
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
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
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
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
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

            <button
              onClick={() => setShowAddRecurring(!showAddRecurring)}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddRecurring ? 'Cerrar' : 'Añadir Recurrente'}</span>
            </button>
          </div>

          {/* Formulario Añadir Recurrente */}
          {showAddRecurring && (
            <form onSubmit={handleAddRecurringSubmit} className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Nuevo Movimiento Periódico</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newBillName}
                  onChange={(e) => setNewBillName(e.target.value)}
                  placeholder="Nombre (ej. Seguro coche, Gimnasio)..."
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  placeholder="Importe (ej. 45.00)"
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono-num text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <select
                  value={newBillType}
                  onChange={(e) => setNewBillType(e.target.value as any)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="expense">Gasto Recurrente</option>
                  <option value="income">Ingreso Recurrente</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRecurring(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 dark:hover:bg-emerald-700 shadow"
                >
                  Guardar Periódico
                </button>
              </div>
            </form>
          )}

          {/* Lista de Recurrentes */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recurringBills.map((bill) => (
              <div key={bill.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${
                    bill.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}>
                    {bill.type === 'income' ? '+' : '-'}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">{bill.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 capitalize">
                      {bill.frequency === 'monthly' ? 'Mensual' : bill.frequency === 'weekly' ? 'Semanal' : 'Anual'} • Próximo: {bill.nextDueDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold font-mono-num text-slate-900 dark:text-white">
                    {formatMoney(bill.amount, currency)}
                  </span>
                  
                  <button
                    onClick={() => processRecurringBill(bill.id)}
                    className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1"
                    title="Registrar ahora como movimiento"
                  >
                    <Play className="w-3 h-3" />
                    <span className="hidden sm:inline">Pagar / Cobrar</span>
                  </button>

                  <button
                    onClick={() => deleteRecurringBill(bill.id)}
                    className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Copias de Seguridad y Datos */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Copias de Seguridad y Exportación</h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Descarga tus datos en formato JSON o CSV, o restaura un backup anterior</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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
          </div>

          {/* Opciones de Peligro / Reset */}
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
        </div>

      </div>

    </div>
  );
};
