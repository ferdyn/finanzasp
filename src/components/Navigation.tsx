import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useUser } from '../context/UserContext';
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
  ChevronRight,
  Printer,
  History,
  BookOpen 
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction: () => void;
}

// Vibración háptica segura para pantallas táctiles y dispositivos móviles
const triggerHaptic = (duration = 10) => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignorado si la API no está habilitada por el navegador
    }
  }
};

export const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenNewTransaction 
}) => {
  const { hasPermission } = useUser();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [rippleTab, setRippleTab] = useState<string | null>(null);

  const canCreate = hasPermission('canCreateTransactions');

  const isNavAllowed = (id: string): boolean => {
    switch (id) {
      case 'resumen': return true;
      case 'movimientos': return true;
      case 'presupuestos': return true;
      case 'patrimonio': return hasPermission('canViewNetWorth');
      case 'metas': return true;
      case 'analisis': return hasPermission('canViewAnalytics');
      case 'historial': return hasPermission('canViewAuditLog');
      case 'reportes': return hasPermission('canExportReports');
      case 'asesor': return hasPermission('canUseAiAdvisor');
      case 'manual': return true;
      case 'ajustes': return true;
      default: return true;
    }
  };

  const triggerVisualRipple = (tabId: string) => {
    setRippleTab(tabId);
    setTimeout(() => {
      setRippleTab((prev) => (prev === tabId ? null : prev));
    }, 350);
  };

  const handleTabClick = (tabId: string) => {
    triggerHaptic(10);
    triggerVisualRipple(tabId);
    setActiveTab(tabId);
    setShowMoreMenu(false);
  };

  const handleNewTransactionClick = () => {
    triggerHaptic(16);
    triggerVisualRipple('nuevo');
    setShowMoreMenu(false);
    onOpenNewTransaction();
  };

  const handleMoreToggle = () => {
    triggerHaptic(10);
    triggerVisualRipple('mas');
    setShowMoreMenu(!showMoreMenu);
  };

  const allNavItems = [
    { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
    { id: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
    { id: 'presupuestos', label: 'Presupuestos', icon: PieChart },
    { id: 'patrimonio', label: 'Patrimonio', icon: Landmark },
    { id: 'metas', label: 'Metas', icon: Target },
    { id: 'analisis', label: 'Análisis', icon: BarChart3 },
    { id: 'historial', label: 'Historial', icon: History },
    { id: 'reportes', label: 'Reportes PDF', icon: Printer },
    { id: 'asesor', label: 'Asesor IA', icon: Sparkles, badge: 'IA' },
    { id: 'manual', label: 'Manual & Guía', icon: BookOpen },
    { id: 'ajustes', label: 'Ajustes', icon: Sliders },
  ];

  const allSecondaryItems = [
    { id: 'manual', label: 'Manual de Usuario & Guía', desc: 'Guía interactiva, documentación por secciones y roles', icon: BookOpen },
    { id: 'historial', label: 'Historial & Auditoría', desc: 'Registro de cambios y trazabilidad por usuario', icon: History },
    { id: 'patrimonio', label: 'Patrimonio y Cuentas', desc: 'Gestiona cuentas bancarias, efectivo y activos', icon: Landmark },
    { id: 'metas', label: 'Metas de Ahorro', desc: 'Sigue tus objetivos financieros y aportaciones', icon: Target },
    { id: 'analisis', label: 'Análisis y Estadísticas', desc: 'Métricas detalladas y comparativas temporales', icon: BarChart3 },
    { id: 'reportes', label: 'Reportes e Impresión PDF', desc: 'Vista simplificada y balances optimizados para papel', icon: Printer },
    { id: 'asesor', label: 'Asesor IA', desc: 'Diagnóstico y consejos inteligentes', icon: Sparkles, badge: 'IA' },
    { id: 'ajustes', label: 'Ajustes', desc: 'Tema (claro/oscuro), divisa y copias de seguridad', icon: Sliders },
  ];

  const navItems = allNavItems.filter(item => isNavAllowed(item.id));
  const secondaryItems = allSecondaryItems.filter(item => isNavAllowed(item.id));

  // Determine which items appear on mobile bottom navigation
  // Default preferred bottom items
  const preferredBottomIds = ['resumen', 'movimientos', 'presupuestos', 'patrimonio', 'metas'];
  const allowedPreferred = preferredBottomIds.filter(id => isNavAllowed(id));

  // When canCreate is true: left items (up to 2), center "+", right items (1), and "Más"
  // When canCreate is false: up to 4 items and "Más"
  const leftBottomIds = canCreate ? allowedPreferred.slice(0, 2) : allowedPreferred.slice(0, 2);
  const rightBottomIds = canCreate ? allowedPreferred.slice(2, 3) : allowedPreferred.slice(2, 4);

  const isMoreActive = secondaryItems.some(item => item.id === activeTab && !allowedPreferred.slice(0, canCreate ? 3 : 4).includes(activeTab));

  return (
    <>
      {/* Desktop Navigation Tabs */}
      <div id="desktop-main-nav" className="hidden lg:block bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav role="tablist" aria-label="Navegación principal" className="flex space-x-1 py-2 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="main-content"
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  onClick={() => {
                    triggerHaptic(8);
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all min-h-[40px] touch-manipulation select-none ${
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
                </motion.button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Sheet: Menú Más Secciones */}
      {showMoreMenu && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="Más secciones de la aplicación"
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setShowMoreMenu(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] shadow-2xl max-h-[85vh] overflow-y-auto space-y-3 scroll-touch"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Indicador táctil móvil */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2" aria-hidden="true" />

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
                aria-label="Cerrar menú de opciones"
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opciones del menú Más */}
            <div role="menu" className="space-y-1.5 pt-1">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    role="menuitem"
                    aria-label={`${item.label}: ${item.desc}`}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    onClick={() => {
                      triggerHaptic(10);
                      setActiveTab(item.id);
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left border transition-all min-h-[52px] touch-manipulation select-none ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
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
                    <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar con botón Nuevo en el Centro condicional */}
      <nav 
        id="mobile-bottom-navigation"
        role="tablist"
        aria-label="Navegación inferior móvil"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 sm:px-2 pt-0.5 pb-[max(0.15rem,env(safe-area-inset-bottom,0px))] sm:pt-1 sm:pb-[max(0.45rem,env(safe-area-inset-bottom,0px))] shadow-lg shadow-slate-900/10 transition-colors duration-200"
      >
        <div 
          className="max-w-md mx-auto grid items-end gap-0.5 sm:gap-1"
          style={{ 
            gridTemplateColumns: `repeat(${
              (canCreate ? leftBottomIds.length + 1 + rightBottomIds.length : (leftBottomIds.length + rightBottomIds.length)) + 1
            }, minmax(0, 1fr))` 
          }}
        >
          {/* Pestañas izquierdas */}
          {leftBottomIds.map((id) => {
            const item = allNavItems.find(n => n.id === id) || { label: id, icon: LayoutDashboard };
            const Icon = item.icon;
            const isActive = activeTab === id;
            return (
              <motion.button
                key={id}
                id={`mobile-nav-${id}`}
                role="tab"
                aria-selected={isActive}
                aria-label={`Ir a ${item.label}`}
                type="button"
                whileTap={{ scale: 0.88, y: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={() => handleTabClick(id)}
                className={`flex flex-col items-center justify-center min-h-[38px] sm:min-h-[46px] py-0.5 sm:py-1 px-0.5 rounded-lg sm:rounded-xl transition-colors duration-150 touch-manipulation select-none relative ${
                  isActive 
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  {rippleTab === id && (
                    <span 
                      className="absolute -inset-1.5 rounded-full bg-emerald-500/25 dark:bg-emerald-400/30 animate-ping pointer-events-none"
                      aria-hidden="true" 
                    />
                  )}
                  <div className={`p-0.5 sm:p-1 rounded-md sm:rounded-lg transition-colors ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
                    <motion.div
                      animate={{ scale: isActive ? [1, 1.15, 1] : 1 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    </motion.div>
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] tracking-tight mt-0 sm:mt-0.5 leading-none font-medium truncate max-w-full">{item.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5" aria-hidden="true" />
                )}
              </motion.button>
            );
          })}

          {/* BOTÓN NUEVO (SOLO SI TIENE PERMISO DE CREAR TRANSACCIONES) */}
          {canCreate && (
            <div className="flex flex-col items-center justify-center pb-0">
              <motion.button
                id="mobile-nav-nuevo-centro"
                type="button"
                whileTap={{ scale: 0.84, rotate: 45 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                onClick={handleNewTransactionClick}
                title="Añadir nuevo movimiento"
                aria-label="Añadir nuevo movimiento"
                className="relative -top-2.5 sm:-top-3.5 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center shadow-md sm:shadow-lg shadow-emerald-600/35 ring-2 sm:ring-4 ring-white dark:ring-slate-900 transition-colors duration-150 group min-w-[38px] min-h-[38px] sm:min-w-[44px] sm:min-h-[44px] touch-manipulation select-none"
              >
                {rippleTab === 'nuevo' && (
                  <span 
                    className="absolute -inset-2 rounded-full border-2 border-emerald-400 dark:border-emerald-300 animate-ping opacity-80 pointer-events-none"
                    aria-hidden="true" 
                  />
                )}
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
              </motion.button>
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 -mt-1.5 sm:-mt-2.5 tracking-tight leading-none select-none">
                Nuevo
              </span>
            </div>
          )}

          {/* Pestañas derechas */}
          {rightBottomIds.map((id) => {
            const item = allNavItems.find(n => n.id === id) || { label: id, icon: LayoutDashboard };
            const Icon = item.icon;
            const isActive = activeTab === id;
            return (
              <motion.button
                key={id}
                id={`mobile-nav-${id}`}
                role="tab"
                aria-selected={isActive}
                aria-label={`Ir a ${item.label}`}
                type="button"
                whileTap={{ scale: 0.88, y: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={() => handleTabClick(id)}
                className={`flex flex-col items-center justify-center min-h-[38px] sm:min-h-[46px] py-0.5 sm:py-1 px-0.5 rounded-lg sm:rounded-xl transition-colors duration-150 touch-manipulation select-none relative ${
                  isActive 
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  {rippleTab === id && (
                    <span 
                      className="absolute -inset-1.5 rounded-full bg-emerald-500/25 dark:bg-emerald-400/30 animate-ping pointer-events-none"
                      aria-hidden="true" 
                    />
                  )}
                  <div className={`p-0.5 sm:p-1 rounded-md sm:rounded-lg transition-colors ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
                    <motion.div
                      animate={{ scale: isActive ? [1, 1.15, 1] : 1 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    </motion.div>
                  </div>
                </div>
                <span className="text-[9px] sm:text-[10px] tracking-tight mt-0 sm:mt-0.5 leading-none font-medium truncate max-w-full">{item.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5" aria-hidden="true" />
                )}
              </motion.button>
            );
          })}

          {/* Menú Más */}
          <motion.button
            id="mobile-nav-mas"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={showMoreMenu}
            aria-label="Abrir más secciones de la aplicación"
            whileTap={{ scale: 0.88, y: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            onClick={handleMoreToggle}
            className={`flex flex-col items-center justify-center min-h-[38px] sm:min-h-[46px] py-0.5 sm:py-1 px-0.5 rounded-lg sm:rounded-xl transition-colors duration-150 touch-manipulation select-none relative ${
              isMoreActive || showMoreMenu
                ? 'text-emerald-600 dark:text-emerald-400 font-bold' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              {/* Feedback visual estilo onda/ripple al pulsar */}
              {rippleTab === 'mas' && (
                <span 
                  className="absolute -inset-1.5 rounded-full bg-emerald-500/25 dark:bg-emerald-400/30 animate-ping pointer-events-none"
                  aria-hidden="true" 
                />
              )}
              <div className={`p-0.5 sm:p-1 rounded-md sm:rounded-lg transition-colors ${isMoreActive || showMoreMenu ? 'bg-emerald-50 dark:bg-emerald-950/60' : ''}`}>
                <motion.div
                  animate={{ scale: (isMoreActive || showMoreMenu) ? [1, 1.15, 1] : 1 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <Sliders className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                </motion.div>
              </div>
            </div>
            <span className="text-[9px] sm:text-[10px] tracking-tight mt-0 sm:mt-0.5 leading-none font-medium truncate max-w-full">
              {isMoreActive ? 'Más •' : 'Más'}
            </span>
            {(isMoreActive || showMoreMenu) && (
              <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5" aria-hidden="true" />
            )}
          </motion.button>

        </div>
      </nav>
    </>
  );
};
