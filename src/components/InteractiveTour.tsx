import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTour } from '../context/TourContext';
import { useUser } from '../context/UserContext';
import { ROLE_DEFINITIONS } from '../types/user';
import { 
  Sparkles, 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Landmark, 
  Target, 
  BarChart3, 
  Users, 
  Shield, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Check, 
  CheckCircle2, 
  Compass, 
  Minimize2, 
  Maximize2,
  LocateFixed,
  Eye
} from 'lucide-react';

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export const InteractiveTour: React.FC = () => {
  const { 
    isTourOpen, 
    currentStepIndex, 
    totalSteps, 
    currentStep, 
    nextStep, 
    prevStep, 
    goToStep, 
    closeTour, 
    completeTour 
  } = useTour();

  const { currentUser } = useUser();
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [viewportWidth, setViewportWidth] = useState<number>(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [viewportHeight, setViewportHeight] = useState<number>(() => typeof window !== 'undefined' ? window.innerHeight : 768);
  const cardRef = useRef<HTMLDivElement>(null);

  // Escuchar dimensiones de pantalla
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para localizar el elemento DOM objetivo
  const locateTargetElement = useCallback((): HTMLElement | null => {
    if (!currentStep?.targetSelector) return null;

    const selectors = currentStep.targetSelector.split(',').map(s => s.trim());
    for (const sel of selectors) {
      const elements = document.querySelectorAll(sel);
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;
        const rect = el.getBoundingClientRect();
        // Verificar visibilidad real del elemento en el DOM
        if (
          rect.width > 0 && 
          rect.height > 0 && 
          window.getComputedStyle(el).display !== 'none' && 
          window.getComputedStyle(el).visibility !== 'hidden'
        ) {
          return el;
        }
      }
    }
    return null;
  }, [currentStep]);

  // Medir y ajustar posición del elemento objetivo
  const updateTargetRect = useCallback(() => {
    if (!isTourOpen || !currentStep) {
      setTargetRect(null);
      return;
    }

    const el = locateTargetElement();
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right
      });

      // Hacer scroll suave hacia el elemento si está fuera del viewport
      const isInViewport = 
        rect.top >= 60 && 
        rect.left >= 0 && 
        rect.bottom <= (window.innerHeight - 70) && 
        rect.right <= window.innerWidth;

      if (!isInViewport) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    } else {
      setTargetRect(null);
    }
  }, [isTourOpen, currentStep, locateTargetElement]);

  // Actualizar posición en cambio de paso, scroll o mutación DOM
  useEffect(() => {
    if (!isTourOpen) return;

    // Medición inmediata
    updateTargetRect();

    // Re-medición tras micro-animaciones o montado de vista
    const timer1 = setTimeout(updateTargetRect, 80);
    const timer2 = setTimeout(updateTargetRect, 220);
    const timer3 = setTimeout(updateTargetRect, 450);

    const handleScroll = () => {
      const el = locateTargetElement();
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isTourOpen, currentStepIndex, updateTargetRect, locateTargetElement]);

  // Atajos de teclado para navegación del tour
  useEffect(() => {
    if (!isTourOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'BUTTON')) {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeTour();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourOpen, nextStep, prevStep, closeTour]);

  if (!isTourOpen || !currentStep) return null;

  const isMobile = viewportWidth < 768;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isFirstStep = currentStepIndex === 0;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  // Selector dinámico del icono
  const getStepIcon = (name: string) => {
    switch (name) {
      case 'Sparkles': return Sparkles;
      case 'LayoutDashboard': return LayoutDashboard;
      case 'ArrowLeftRight': return ArrowLeftRight;
      case 'PieChart': return PieChart;
      case 'Landmark': return Landmark;
      case 'Target': return Target;
      case 'BarChart3': return BarChart3;
      case 'Users': return Users;
      case 'Shield': return Shield;
      case 'BookOpen': return BookOpen;
      default: return Compass;
    }
  };

  const StepIcon = getStepIcon(currentStep.iconName);
  const currentRoleDef = ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS.member;
  const currentRoleTip = currentStep.roleTips[currentUser.role] || currentStep.roleTips.member;

  // Parámetros de padding del foco (spotlight)
  const spotlightPadding = isMobile ? 6 : 10;
  const spotlightBox = targetRect ? {
    x: Math.max(2, targetRect.left - spotlightPadding),
    y: Math.max(2, targetRect.top - spotlightPadding),
    width: Math.min(viewportWidth - 4, targetRect.width + spotlightPadding * 2),
    height: targetRect.height + spotlightPadding * 2,
    rx: 16
  } : null;

  // Cálculo de posicionamiento adaptativo de la tarjeta
  const getCardPlacement = () => {
    if (isMobile) {
      // En móvil: si el elemento objetivo está en la mitad inferior de la pantalla,
      // situamos la tarjeta arriba para que no lo tape. De lo contrario, abajo sobre la barra de navegación.
      if (targetRect && targetRect.top > viewportHeight / 2) {
        return 'top-4 left-3 right-3 max-w-sm mx-auto';
      }
      return 'bottom-16 left-3 right-3 max-w-sm mx-auto safe-area-bottom';
    }

    // En Desktop / Tablet:
    if (targetRect) {
      const cardWidth = 440;
      const cardEstimatedHeight = 400;

      // Evaluar si cabe debajo del elemento
      const fitsBelow = targetRect.bottom + cardEstimatedHeight + 20 <= viewportHeight;
      // Evaluar si cabe arriba del elemento
      const fitsAbove = targetRect.top - cardEstimatedHeight - 20 >= 70;

      let top = 0;
      let left = Math.max(24, Math.min(viewportWidth - cardWidth - 24, targetRect.left));

      if (fitsBelow) {
        top = targetRect.bottom + 16;
      } else if (fitsAbove) {
        top = targetRect.top - cardEstimatedHeight - 16;
      } else {
        // Si no cabe verticalmente al lado, anclar a la esquina inferior derecha
        return 'bottom-6 right-6 w-[430px]';
      }

      return {
        position: 'fixed' as const,
        top: `${top}px`,
        left: `${left}px`,
        width: `${cardWidth}px`,
        maxWidth: 'calc(100vw - 48px)',
      };
    }

    // Si no hay elemento en foco, centrado flotante en desktop
    return 'bottom-8 right-8 w-[430px]';
  };

  const cardPlacement = getCardPlacement();
  const cardStyle = typeof cardPlacement === 'object' ? cardPlacement : undefined;
  const cardClass = typeof cardPlacement === 'string' ? cardPlacement : '';

  const handleScrollToElement = () => {
    const el = locateTargetElement();
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      updateTargetRect();
    }
  };

  return (
    <>
      {/* 1. MÁSCARA SVG DE FOCO (Permite ver toda la app y destaca con recorte nítido el elemento) */}
      <svg 
        className="fixed inset-0 w-full h-full pointer-events-none z-40 transition-all duration-300"
        aria-hidden="true"
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* Fondo completo visible */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Recorte transparente alrededor del elemento enfocado */}
            {spotlightBox && (
              <rect
                x={spotlightBox.x}
                y={spotlightBox.y}
                width={spotlightBox.width}
                height={spotlightBox.height}
                rx={spotlightBox.rx}
                ry={spotlightBox.rx}
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Capa oscurecida traslúcida que permite ver la app pero enfoca la atención */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.45)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* 2. ANILLO PULSANTE DECORATIVO ALREDEDOR DEL ELEMENTO ENFOCADO */}
      {spotlightBox && (
        <div 
          style={{
            position: 'fixed',
            left: `${spotlightBox.x}px`,
            top: `${spotlightBox.y}px`,
            width: `${spotlightBox.width}px`,
            height: `${spotlightBox.height}px`,
            borderRadius: `${spotlightBox.rx}px`,
          }}
          className="pointer-events-none z-40 ring-4 ring-emerald-500/90 ring-offset-2 ring-offset-transparent tour-spotlight-ring transition-all duration-300"
        >
          {/* Etiqueta flotante señalizadora */}
          <div className="absolute -top-7 left-1 sm:left-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-bounce">
            <Sparkles className="w-3 h-3 text-emerald-200" />
            <span>{currentStep.spotlightTitle || currentStep.title}</span>
          </div>
        </div>
      )}

      {/* 3. MODO MINIMIZADO (Píldora compacta para explorar libremente la app sin estorbos) */}
      {isMinimized ? (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2 bg-slate-900/95 dark:bg-slate-800/95 text-white p-2 sm:px-4 sm:py-2.5 rounded-full shadow-2xl border border-emerald-500/50 backdrop-blur-md">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {currentStepIndex + 1}/{totalSteps}
            </div>
            <div className="max-w-[180px] sm:max-w-[240px] truncate text-xs font-semibold">
              {currentStep.title}
            </div>
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-emerald-300 hover:text-white transition-colors"
              title="Expandir información de la guía"
              aria-label="Expandir guía"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={closeTour}
              className="p-1.5 rounded-full bg-white/10 hover:bg-rose-500/80 text-slate-300 hover:text-white transition-colors"
              title="Salir del tour"
              aria-label="Cerrar tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* 4. TARJETA FLOTANTE INTERACTIVA DEL PASO (Diseño limpio, cuadrado en mobile y adaptable) */
        <div
          ref={cardRef}
          style={cardStyle}
          className={`fixed z-50 ${cardClass} transition-all duration-300 animate-in fade-in zoom-in-95`}
          role="dialog"
          aria-modal="false"
          aria-label={`Guía interactiva: ${currentStep.title}`}
        >
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] sm:max-h-[85vh] transition-all">
            
            {/* Barra de Progreso Superior */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Cabecera de la Tarjeta */}
            <div className="p-3.5 sm:p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                  <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {currentStep.categoryBadge}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold">
                      {currentStepIndex + 1} de {totalSteps}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                    {currentStep.title}
                  </h3>
                </div>
              </div>

              {/* Botones de acción de la tarjeta */}
              <div className="flex items-center gap-1 shrink-0">
                {targetRect && (
                  <button
                    type="button"
                    onClick={handleScrollToElement}
                    title="Enfocar elemento en la página"
                    aria-label="Enfocar elemento"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <LocateFixed className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  title="Minimizar para ver pantalla completa"
                  aria-label="Minimizar tarjeta"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  id="tour-close-btn"
                  onClick={closeTour}
                  aria-label="Cerrar tour guiado"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contenido scrolleable de la tarjeta */}
            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 text-slate-700 dark:text-slate-300 text-xs">
              {/* Subtítulo y Descripción */}
              <div className="space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-snug">
                  {currentStep.subtitle}
                </p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] sm:text-xs">
                  {currentStep.description}
                </p>
              </div>

              {/* Puntos destacados */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Aspectos Clave</span>
                </p>
                <ul className="space-y-1">
                  {currentStep.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Consejo adaptativo para el rol activo */}
              <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex items-start gap-2">
                <div 
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 shadow-2xs mt-0.5"
                  style={{ backgroundColor: `${currentUser.color}30` }}
                >
                  {currentUser.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-200 block">
                    Con tu rol ({currentRoleDef.name}):
                  </span>
                  <p className="text-[11px] text-indigo-800 dark:text-indigo-300 font-medium leading-tight mt-0.5">
                    {currentRoleTip}
                  </p>
                </div>
              </div>
            </div>

            {/* Pie de navegación de la tarjeta */}
            <div className="p-3 sm:p-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2">
              
              {/* Puntos de navegación clicables */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {Array.from({ length: totalSteps }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToStep(idx)}
                    title={`Paso ${idx + 1}: ${idx === currentStepIndex ? 'Actual' : 'Ir'}`}
                    aria-label={`Ir al paso ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentStepIndex
                        ? 'w-5 bg-emerald-600 dark:bg-emerald-500'
                        : idx < currentStepIndex
                        ? 'w-1.5 bg-emerald-300 dark:bg-emerald-800 hover:bg-emerald-400'
                        : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              {/* Botones Anterior y Siguiente */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  id="tour-prev-btn"
                  onClick={prevStep}
                  disabled={isFirstStep}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none transition-colors flex items-center gap-0.5 min-h-[36px]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Anterior</span>
                </button>

                {isLastStep ? (
                  <button
                    type="button"
                    id="tour-finish-btn"
                    onClick={completeTour}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1 min-h-[36px]"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>¡Entendido!</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    id="tour-next-btn"
                    onClick={nextStep}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1 min-h-[36px]"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

