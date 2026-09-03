import React, { useState, useMemo } from 'react';
import { useTour } from '../context/TourContext';
import { useUser } from '../context/UserContext';
import { UserRole, ROLE_DEFINITIONS, UserPermissions } from '../types/user';
import { 
  MANUAL_SECTIONS, 
  MANUAL_CATEGORIES, 
  GLOSSARY_ITEMS, 
  FAQ_ITEMS 
} from '../data/manualData';
import { ManualSection, ManualCategory } from '../types/manual';
import { 
  BookOpen, 
  Search, 
  Compass, 
  Printer, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  X, 
  ExternalLink, 
  Lightbulb, 
  HelpCircle, 
  Key, 
  Layers, 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Landmark, 
  Target, 
  BarChart3, 
  History, 
  Users, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Maximize2,
  Minimize2,
  FileText,
  Filter
} from 'lucide-react';

interface ManualViewProps {
  setActiveTab: (tab: string) => void;
  onOpenNewTransaction?: () => void;
}

export const ManualView: React.FC<ManualViewProps> = ({ 
  setActiveTab, 
  onOpenNewTransaction 
}) => {
  const { startTour } = useTour();
  const { currentUser, rolePermissions } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ManualCategory | 'all'>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'all'>('all');
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(new Set(['intro-primeros-pasos', 'panel-resumen-dashboard']));
  const [activeTabSubView, setActiveTabSubView] = useState<'manual' | 'roles_matrix' | 'glossary' | 'faq' | 'shortcuts'>('manual');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState<string>('all');
  const [glossaryFilter, setGlossaryFilter] = useState<string>('');

  // Icon selector helper
  const getSectionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Compass': return Compass;
      case 'LayoutDashboard': return LayoutDashboard;
      case 'ArrowLeftRight': return ArrowLeftRight;
      case 'PieChart': return PieChart;
      case 'Landmark': return Landmark;
      case 'Target': return Target;
      case 'BarChart3': return BarChart3;
      case 'History': return History;
      case 'Printer': return Printer;
      case 'Sparkles': return Sparkles;
      case 'Users': return Users;
      case 'Shield': return Shield;
      default: return BookOpen;
    }
  };

  // Toggle expansión de sección
  const toggleSection = (id: string) => {
    setExpandedSectionIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSectionIds(new Set(MANUAL_SECTIONS.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedSectionIds(new Set());
  };

  // Filtrado de secciones del manual
  const filteredSections = useMemo(() => {
    return MANUAL_SECTIONS.filter(section => {
      // 1. Filtro por categoría
      if (selectedCategory !== 'all' && section.category !== selectedCategory) {
        return false;
      }

      // 2. Filtro por rol
      if (selectedRoleFilter !== 'all') {
        if (section.targetRoles !== 'all' && !section.targetRoles.includes(selectedRoleFilter)) {
          return false;
        }
      }

      // 3. Filtro por búsqueda de texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = section.title.toLowerCase().includes(q);
        const matchesSummary = section.summary.toLowerCase().includes(q);
        const matchesKeywords = section.keywords.some(k => k.toLowerCase().includes(q));
        const matchesOverview = section.content.overview.toLowerCase().includes(q);
        const matchesFeatures = section.content.keyFeatures.some(f => 
          f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
        );

        if (!matchesTitle && !matchesSummary && !matchesKeywords && !matchesOverview && !matchesFeatures) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCategory, selectedRoleFilter, searchQuery]);

  // Lista de categorías de FAQ
  const faqCategories = useMemo(() => {
    const cats = Array.from(new Set(FAQ_ITEMS.map(f => f.category)));
    return ['all', ...cats];
  }, []);

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter(item => {
      if (faqCategoryFilter !== 'all' && item.category !== faqCategoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q);
      }
      return true;
    });
  }, [faqCategoryFilter, searchQuery]);

  // Glosario filtrado
  const filteredGlossary = useMemo(() => {
    return GLOSSARY_ITEMS.filter(item => {
      if (glossaryFilter.trim() || searchQuery.trim()) {
        const q = (glossaryFilter || searchQuery).toLowerCase().trim();
        return (
          item.term.toLowerCase().includes(q) ||
          item.definition.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.example && item.example.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [glossaryFilter, searchQuery]);

  // Imprimir manual
  const handlePrint = () => {
    expandAll();
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const currentRoleDef = ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS.member;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      
      {/* 1. HERO & CABECERA DEL MANUAL */}
      <div id="manual-hero-header" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden">
        {/* Adorno de fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Documentación & Centro de Ayuda</span>
              </span>
              <span className="text-xs text-slate-400 font-semibold hidden sm:inline-block">
                • Versión 2.0 con RBAC
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Manual de Usuario & Guía Integral
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Consulta el funcionamiento detallado de cada sección, los permisos de cada rol (RBAC), preguntas frecuentes, atajos de teclado y el glosario financiero.
            </p>
          </div>

          {/* Botones de acción rápida: Tour Guiado e Impresión */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              id="manual-launch-tour-btn"
              onClick={() => startTour(0)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 min-h-[42px]"
            >
              <Compass className="w-4 h-4" />
              <span>Lanzar Tour Interactivo</span>
            </button>

            <button
              type="button"
              id="manual-print-btn"
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 min-h-[42px]"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Banner de Rol Activo del Usuario */}
        <div className="mt-5 p-3 sm:p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 shadow-2xs"
              style={{ backgroundColor: `${currentUser.color}30` }}
            >
              {currentUser.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentUser.name}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200">
                  Rol: {currentRoleDef.name}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 truncate">
                {currentRoleDef.shortDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Filtrar manual por rol:
            </span>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value as UserRole | 'all')}
              className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los roles</option>
              {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => (
                <option key={key} value={key}>
                  {def.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. SUB-PESTAÑAS DEL MANUAL (MANUAL, MATRIZ ROLES, GLOSARIO, FAQ, ATAJOS) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-2xl overflow-x-auto no-scrollbar border border-slate-200 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => setActiveTabSubView('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[38px] ${
            activeTabSubView === 'manual'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-500" />
          <span>Capítulos del Manual ({MANUAL_SECTIONS.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSubView('roles_matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[38px] ${
            activeTabSubView === 'roles_matrix'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-500" />
          <span>Matriz de Roles & Permisos (RBAC)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSubView('faq')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[38px] ${
            activeTabSubView === 'faq'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>Preguntas Frecuentes (FAQ)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSubView('glossary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[38px] ${
            activeTabSubView === 'glossary'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 text-sky-500" />
          <span>Glosario Financiero</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTabSubView('shortcuts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 min-h-[38px] ${
            activeTabSubView === 'shortcuts'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Key className="w-4 h-4 text-purple-500" />
          <span>Atajos de Teclado</span>
        </button>
      </div>

      {/* 3. VISTA: CAPÍTULOS DEL MANUAL */}
      {activeTabSubView === 'manual' && (
        <div className="space-y-5">
          {/* Barra de Búsqueda y Filtros de Categoría */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {/* Buscador */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por palabra clave, sección o concepto (ej. 50/30/20, transferencias, PIN, roles)..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Controles de expansión masiva */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Expandir todo</span>
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Colapsar todo</span>
              </button>
            </div>
          </div>

          {/* Pastillas de Categoría */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Todas las Secciones ({MANUAL_SECTIONS.length})
            </button>

            {MANUAL_CATEGORIES.map(cat => {
              const count = MANUAL_SECTIONS.filter(s => s.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Listado de Capítulos y Acordeones */}
          {filteredSections.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                No se encontraron secciones
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No hay resultados para los filtros seleccionados o el término "{searchQuery}". Prueba a limpiar la búsqueda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedRoleFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-bold"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSections.map(section => {
                const isExpanded = expandedSectionIds.has(section.id);
                const Icon = getSectionIcon(section.iconName);

                return (
                  <div
                    key={section.id}
                    id={`section-${section.id}`}
                    className={`bg-white dark:bg-slate-900 border rounded-3xl transition-all overflow-hidden ${
                      isExpanded
                        ? 'border-slate-300 dark:border-slate-700 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Encabezado del Acordeón */}
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="w-full p-4 sm:p-5 text-left flex items-start sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          isExpanded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {section.badge || 'Sección'}
                            </span>
                            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                              {section.title}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {section.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 ${
                          isExpanded ? 'rotate-90 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </button>

                    {/* Contenido Expandido del Capítulo */}
                    {isExpanded && (
                      <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                        
                        {/* 1. Descripción General */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 leading-relaxed text-slate-700 dark:text-slate-300">
                          <p>{section.content.overview}</p>
                        </div>

                        {/* 2. Funcionalidades Clave */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-500" />
                            <span>Funcionalidades Principales</span>
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {section.content.keyFeatures.map((feat, idx) => (
                              <div key={idx} className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
                                <p className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>{feat.title}</span>
                                </p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                  {feat.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3. Guía Paso a Paso */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500" />
                            <span>Cómo Usarlo Paso a Paso</span>
                          </h4>
                          <div className="space-y-2">
                            {section.content.howToUse.map((step) => (
                              <div key={step.step} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                                <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                  {step.step}
                                </span>
                                <div className="space-y-1 min-w-0">
                                  <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                                    {step.instruction}
                                  </p>
                                  {step.tip && (
                                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                      💡 Consejo: {step.tip}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 4. Permisos según el Rol (RBAC) */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-500" />
                            <span>Permisos y Capacidades por Rol</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {section.content.rolePermissionsSummary.map((roleSumm) => {
                              const isCurrent = currentUser.role === roleSumm.role;
                              return (
                                <div 
                                  key={roleSumm.role}
                                  className={`p-3 rounded-2xl border transition-all ${
                                    isCurrent
                                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700'
                                      : 'bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100 dark:border-slate-700/60">
                                    <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                                      <span>{roleSumm.roleName}</span>
                                      {isCurrent && (
                                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                                          Tu Rol
                                        </span>
                                      )}
                                    </span>
                                  </div>

                                  <div className="pt-2 space-y-1 text-[11px]">
                                    {roleSumm.canDo.map((item, i) => (
                                      <p key={i} className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                        <Check className="w-3 h-3 shrink-0 stroke-[2.5]" />
                                        <span>{item}</span>
                                      </p>
                                    ))}
                                    {roleSumm.cannotDo.map((item, i) => (
                                      <p key={i} className="text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <X className="w-3 h-3 shrink-0 text-rose-500" />
                                        <span>{item}</span>
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Botón de acción: Ir a la sección en la app */}
                        {section.targetTab && (
                          <div className="pt-2 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveTab(section.targetTab!)}
                              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                            >
                              <span>Ir a {section.shortTitle}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. VISTA: MATRIZ DE ROLES & PERMISOS (RBAC) */}
      {activeTabSubView === 'roles_matrix' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <span>Matriz Comparativa de Roles & 19 Permisos Granulares</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Esta tabla resume las facultades predeterminadas de cada uno de los 6 roles. Los administradores pueden ajustar cualquiera de estos permisos en tiempo real desde <strong>Ajustes &gt; Gestión Multiusuario</strong>.
            </p>

            {/* Tabla de Matriz */}
            <div className="overflow-x-auto pt-3">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-3 font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                      Permiso / Capacidad
                    </th>
                    {Object.entries(ROLE_DEFINITIONS).map(([roleKey, def]) => {
                      const isCurrent = currentUser.role === roleKey;
                      return (
                        <th 
                          key={roleKey} 
                          className={`py-3 px-2.5 font-bold text-center ${
                            isCurrent ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 rounded-t-xl' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          <p>{def.name}</p>
                          {isCurrent && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                              Activo
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {[
                    { key: 'canCreateTransactions', label: 'Crear Transacciones' },
                    { key: 'canEditTransactions', label: 'Editar Transacciones' },
                    { key: 'canDeleteTransactions', label: 'Eliminar Transacciones' },
                    { key: 'canViewNetWorth', label: 'Ver Patrimonio Total' },
                    { key: 'canManageAccounts', label: 'Gestionar Cuentas' },
                    { key: 'canManageBudgets', label: 'Gestionar Presupuestos' },
                    { key: 'canManageGoals', label: 'Crear / Editar Metas' },
                    { key: 'canContributeGoals', label: 'Aportar a Metas' },
                    { key: 'canManageRecurring', label: 'Gestionar Recurrentes' },
                    { key: 'canManageCategories', label: 'Gestionar Categorías' },
                    { key: 'canViewAnalytics', label: 'Ver Estadísticas' },
                    { key: 'canExportReports', label: 'Exportar Reportes PDF' },
                    { key: 'canUseAiAdvisor', label: 'Consultar Asesor IA' },
                    { key: 'canManageUsers', label: 'Gestionar Miembros' },
                    { key: 'canEditRolePermissions', label: 'Editar Matriz de Roles' },
                    { key: 'canExportImportData', label: 'Copias de Seguridad' },
                    { key: 'canViewAuditLog', label: 'Ver Historial Auditoría' },
                    { key: 'canClearAuditLog', label: 'Vaciar Auditoría' },
                    { key: 'canConfigureSecurity', label: 'Configurar Bloqueo PIN' },
                  ].map((perm) => (
                    <tr key={perm.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {perm.label}
                      </td>
                      {Object.keys(ROLE_DEFINITIONS).map((roleKey) => {
                        const hasPerm = (rolePermissions[roleKey as UserRole] as any)?.[perm.key];
                        const isCurrent = currentUser.role === roleKey;
                        return (
                          <td 
                            key={roleKey} 
                            className={`py-2.5 px-2.5 text-center ${
                              isCurrent ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-bold' : ''
                            }`}
                          >
                            {hasPerm ? (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto stroke-[2.5]" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. VISTA: PREGUNTAS FRECUENTES (FAQ) */}
      {activeTabSubView === 'faq' && (
        <div className="space-y-4">
          {/* Filtros de Categoría FAQ */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {faqCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setFaqCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  faqCategoryFilter === cat
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat === 'all' ? 'Todas las Categorías' : cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                    {faq.category}
                  </span>
                </div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{faq.question}</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. VISTA: GLOSARIO FINANCIERO */}
      {activeTabSubView === 'glossary' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={glossaryFilter}
                onChange={(e) => setGlossaryFilter(e.target.value)}
                placeholder="Filtrar términos financieros (ej. Patrimonio Neto, Tasa de Ahorro, Interés Compuesto)..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((item, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {item.term}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.definition}
                  </p>
                </div>

                {item.example && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                    <strong className="text-slate-700 dark:text-slate-300">Ejemplo práctico:</strong> {item.example}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. VISTA: ATAJOS DE TECLADO & PRODUCTIVIDAD */}
      {activeTabSubView === 'shortcuts' && (
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-500" />
              <span>Atajos de Teclado & Trucos de Productividad</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acelera tu flujo de trabajo diario con estas combinaciones rápidas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { keys: ['Ctrl / ⌘', 'K'], label: 'Búsqueda Global / Comandos', desc: 'Abre el buscador rápido' },
              { keys: ['N'], label: 'Nuevo Movimiento', desc: 'Abre el formulario de transacción' },
              { keys: ['Esc'], label: 'Cerrar Modales / Popups', desc: 'Cierra cualquier ventana activa' },
              { keys: ['←', '→'], label: 'Navegar en el Tour', desc: 'Avanza o retrocede en la guía interactiva' },
              { keys: ['Alt', 'E'], label: 'Modo Espía / Privacidad', desc: 'Oculta o desenfoca cifras monetarias' },
              { keys: ['Alt', 'L'], label: 'Bloquear con PIN', desc: 'Bloquea la sesión inmediatamente' },
            ].map((shortcut, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {shortcut.label}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {shortcut.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {shortcut.keys.map((k, j) => (
                    <kbd 
                      key={j}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold shadow-2xs"
                    >
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
