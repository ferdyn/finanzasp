import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney, formatDate } from '../utils/format';
import { DynamicIcon } from '../components/DynamicIcon';
import { SavingsGoal } from '../types/finance';
import { Target, Plus, PiggyBank, Calendar, CheckCircle2, Sparkles, Edit3, PlusCircle } from 'lucide-react';

interface GoalsViewProps {
  onOpenGoalModal: (goal?: SavingsGoal, mode?: 'create' | 'edit' | 'contribute') => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ onOpenGoalModal }) => {
  const { goals, currency } = useFinance();

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);
  const overallPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Metas y Objetivos de Ahorro
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Planifica y realiza seguimiento a tus sueños y fondos de seguridad
          </p>
        </div>

        <button
          onClick={() => onOpenGoalModal(undefined, 'create')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Meta</span>
        </button>
      </div>

      {/* Banner Resumen de Metas con degradado adaptativo */}
      <div id="goals-summary-card" className="bg-gradient-to-br from-white via-slate-50 to-slate-100/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-white p-6 sm:p-8 rounded-3xl shadow-md shadow-slate-200/50 dark:shadow-xl dark:shadow-slate-900/20 relative overflow-hidden border border-slate-200/80 dark:border-slate-800 space-y-5 transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Progreso Total de Metas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono-num tracking-tight">
                {formatMoney(totalSaved, currency)}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 font-mono-num">
                / {formatMoney(totalTarget, currency)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {goals.length} {goals.length === 1 ? 'meta de ahorro activa' : 'metas de ahorro activas'} en seguimiento
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 bg-slate-100/90 dark:bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                Acumulado
              </span>
              <span className="text-base sm:text-xl font-bold font-mono-num text-emerald-600 dark:text-emerald-300">
                {overallPercent}%
              </span>
            </div>
            <div className="w-px h-8 sm:h-10 bg-slate-200 dark:bg-white/20" />
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 dark:text-indigo-300 uppercase tracking-wider block">
                Restante
              </span>
              <span className="text-base sm:text-xl font-bold font-mono-num text-slate-900 dark:text-white">
                {formatMoney(totalRemaining, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de progreso general */}
        <div className="relative z-10 space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Completitud global de objetivos</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{overallPercent}%</span>
          </div>
          <div className="w-full bg-slate-200/90 dark:bg-slate-800/90 rounded-full h-3.5 overflow-hidden border border-slate-300/60 dark:border-slate-700/60 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, overallPercent)}%` }}
            />
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Lista de Metas */}
      {goals.length === 0 ? (
        <div className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">No tienes metas de ahorro activas</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">Crea una meta para vacaciones, fondo de emergencia, coche o estudios.</p>
          <button
            onClick={() => onOpenGoalModal(undefined, 'create')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-colors"
          >
            + Crear Mi Primera Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="bg-gradient-to-br from-white via-slate-50/60 to-slate-100/50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: goal.color }}
                      >
                        <DynamicIcon name={goal.icon} size={22} />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900 dark:text-white leading-snug">{goal.name}</h4>
                        {goal.category && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {goal.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenGoalModal(goal, 'edit')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Editar meta"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {goal.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 my-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      {goal.notes}
                    </p>
                  )}

                  {/* Números y progreso */}
                  <div className="space-y-2 mt-4">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-100 font-mono-num">
                        {formatMoney(goal.currentAmount, currency)}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 font-mono-num font-semibold">
                        Meta: {formatMoney(goal.targetAmount, currency)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                      <span>{percent}% completado</span>
                      {isCompleted ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ¡Completada!
                        </span>
                      ) : (
                        <span>Faltan <span className="font-mono-num font-semibold">{formatMoney(remaining, currency)}</span></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer con Deadline y Botón Aportar */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                    {goal.deadline ? (
                      <>
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(goal.deadline, 'medium')}</span>
                      </>
                    ) : (
                      <span>Sin fecha límite</span>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenGoalModal(goal, 'contribute')}
                    disabled={isCompleted}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 disabled:opacity-50 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Aportar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
