import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Landmark, 
  Target, 
  BarChart3, 
  Sliders, 
  Sparkles, 
  Plus, 
  X, 
  ChevronRight 
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenNewTransaction 
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const navItems = [
    { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'presupuestos', label: 'Presupuestos', icon: PieChart },
    { id: 'patrimonio', label: 'Patrimonio', icon: Landmark },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'analisis', label: 'Análisis', icon: BarChart3 },
    { id: 'asesor', label: 'Asesor IA', icon: Sparkles, badge: 'IA' },
    { id: 'ajustes', label: 'Ajustes', icon: Sliders },
  ];

  const secondaryItems = [
    { id: 'patrimonio', label: 'Patrimonio y Cuentas', desc: 'Gestiona cuentas bancarias, efectivo y activos', icon: Landmark },
    { id: 'metas', label: 'Metas de Ahorro', desc: 'Sigue tus objetivos financieros y aportaciones', icon: Target },
    { id: 'analisis', label: 'Análisis y Estadísticas', desc: 'Métricas detalladas y comparativas temporales', icon: BarChart3 },
    { id: 'asesor', label: 'Asesor IA', desc: 'Diagnóstico y consejos inteligentes', icon: Sparkles, badge: 'IA' },
    { id: 'ajustes', label: 'Ajustes', desc: 'Tema (claro/oscuro), divisa y copias de seguridad', icon: Sliders },
  ];

  const isMoreActive = ['patrimonio', 'metas', 'analisis', 'asesor', 'ajustes'].includes(activeTab);

  return (
    <>
      {/* Desktop Navigation Tabs */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-2 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded ${
                      isActive 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Sheet: Menú Más Secciones */}
      {showMoreMenu && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 pb-8 shadow-2xl max-h-[80vh] overflow-y-auto space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del menú Más */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Más Opciones</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opciones del menú Más */}
            <div className="space-y-1.5 pt-1">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left border transition-all ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isActive ? 'text-emerald-900 dark:text-emerald-200' : 'text-slate-900 dark:text-white'}`}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-400 line-clamp-1">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar con botón Nuevo en el Centro */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-lg shadow-slate-900/10 safe-area-bottom transition-colors duration-200">
        <div className="grid grid-cols-5 items-end">
          
          {/* 1. Resumen */}
          <button
            id="mobile-nav-resumen"
            type="button"
            onClick={() => {
              setActiveTab('resumen');
              setShowMoreMenu(false);
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'resumen' 
                ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'resumen' ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Resumen</span>
          </button>

          {/* 2. Movimientos */}
          <button
            id="mobile-nav-movimientos"
            type="button"
            onClick={() => {
              setActiveTab('movimientos');
              setShowMoreMenu(false);
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'movimientos' 
                ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'movimientos' ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Movimientos</span>
          </button>

          {/* 3. BOTÓN NUEVO (CENTRADO, DESTACADO Y ELEVADO) */}
          <div className="flex flex-col items-center justify-center pb-0.5">
            <button
              id="mobile-nav-nuevo-centro"
              type="button"
              onClick={() => {
                setShowMoreMenu(false);
                onOpenNewTransaction();
              }}
              title="Añadir nuevo movimiento"
              aria-label="Añadir nuevo movimiento"
              className="relative -top-4 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-600/35 ring-4 ring-white dark:ring-slate-900 transition-all duration-150 group"
            >
              <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
            </button>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 -mt-3 tracking-tight">
              Nuevo
            </span>
          </div>

          {/* 4. Presupuestos */}
          <button
            id="mobile-nav-presupuestos"
            type="button"
            onClick={() => {
              setActiveTab('presupuestos');
              setShowMoreMenu(false);
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              activeTab === 'presupuestos' 
                ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === 'presupuestos' ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
              <PieChart className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Presupuestos</span>
          </button>

          {/* 5. Menú Más (Patrimonio, Metas, Análisis, Asesor IA, Ajustes) */}
          <button
            id="mobile-nav-mas"
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              isMoreActive || showMoreMenu
                ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${isMoreActive || showMoreMenu ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
              <Sliders className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">
              {isMoreActive ? 'Más •' : 'Más'}
            </span>
          </button>

        </div>
      </div>
    </>
  );
};
