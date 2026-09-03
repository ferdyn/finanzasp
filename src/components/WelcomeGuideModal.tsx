import React, { useState } from 'react';
import { useTour } from '../context/TourContext';
import { useUser } from '../context/UserContext';
import { ROLE_DEFINITIONS } from '../types/user';
import { 
  Sparkles, 
  Compass, 
  BookOpen, 
  ArrowRight, 
  X, 
  ShieldCheck, 
  PieChart, 
  Users, 
  Lock,
  CheckCircle2
} from 'lucide-react';

interface WelcomeGuideModalProps {
  onOpenManual?: () => void;
}

export const WelcomeGuideModal: React.FC<WelcomeGuideModalProps> = ({ onOpenManual }) => {
  const { 
    isWelcomeModalOpen, 
    closeWelcomeModal, 
    startTour 
  } = useTour();

  const { currentUser } = useUser();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isWelcomeModalOpen) return null;

  const handleStartTour = () => {
    startTour(0);
  };

  const handleOpenManual = () => {
    closeWelcomeModal();
    if (onOpenManual) {
      onOpenManual();
    }
  };

  const handleDismiss = () => {
    closeWelcomeModal();
  };

  const roleDef = ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS.member;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenido a FinanTrack"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl max-w-xl w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[90vh] overflow-hidden flex flex-col my-auto transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera visual con degradado elegante (shrink-0) */}
        <div className="shrink-0 relative p-4 sm:p-6 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white overflow-hidden">
          {/* Formas decorativas abstractas de fondo */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute bottom-0 right-16 w-32 h-32 rounded-full bg-emerald-400/10 blur-lg pointer-events-none" />

          <button
            type="button"
            id="welcome-modal-close"
            onClick={handleDismiss}
            aria-label="Cerrar bienvenida"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-white/15 backdrop-blur-sm border border-white/20 text-emerald-100">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-300" />
              <span>Bienvenido a FinanTrack</span>
            </span>
          </div>

          <h2 className="text-base sm:text-2xl font-black tracking-tight leading-snug pr-8">
            Toma el control absoluto de tus finanzas personales y familiares
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 sm:mt-2 font-medium leading-relaxed">
            Plataforma integral con presupuestos 50/30/20, cálculo de patrimonio neto, control multiusuario (RBAC) y asesor inteligente con IA.
          </p>
        </div>

        {/* Cuerpo informativo scrolleable con overscroll-contain */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-3 sm:space-y-4">
          {/* Perfil activo actual */}
          <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm shadow-2xs shrink-0"
                style={{ backgroundColor: `${currentUser.color}25` }}
              >
                {currentUser.avatar}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">
                  {currentUser.name}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Rol activo: <strong>{roleDef.name}</strong>
                </p>
              </div>
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60 shrink-0 max-w-[140px] sm:max-w-none truncate text-right">
              {roleDef.shortDescription}
            </span>
          </div>

          {/* Tres pilares rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <PieChart className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Presupuestos 50/30/20</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Controla gastos con semáforos inteligentes.</p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Multiusuario & RBAC</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">6 roles y 19 permisos granulares.</p>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Asesor IA Gemini</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Diagnósticos y registros automáticos.</p>
            </div>
          </div>
        </div>

        {/* Acciones principales (shrink-0) */}
        <div className="shrink-0 p-3 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            id="welcome-open-manual-btn"
            onClick={handleOpenManual}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 min-h-[42px]"
          >
            <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Consultar Manual</span>
          </button>

          <button
            type="button"
            id="welcome-start-tour-btn"
            onClick={handleStartTour}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span>Iniciar Tour Interactivo (10 pasos)</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
