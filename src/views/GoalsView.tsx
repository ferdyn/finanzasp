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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Metas y Objetivos de Ahorro
          </h1>
          <p className="text-sm text-slate-500 font-medium">
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

      {/* Banner Resumen de Metas */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Progreso Total de Metas</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono-num">
                {formatMoney(totalSaved, currency)}
              </span>
              <span className="text-sm font-bold text-slate-400 font-mono-num">
                / {formatMoney(totalTarget, currency)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Acumulado: {overallPercent}%</span>
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-800 px-3 py-1.5 rounded-xl border border-indigo-200">
              <PiggyBank className="w-4 h-4 text-indigo-600" />
              <span>Faltan: {formatMoney(totalRemaining, currency)}</span>
            </div>
          </div>
        </div>

        {/* Barra de progreso general */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, overallPercent)}%` }}
          />
        </div>
      </div>

      {/* Lista de Metas */}
      {goals.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No tienes metas de ahorro activas</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">Crea una meta para vacaciones, fondo de emergencia, coche o estudios.</p>
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
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
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
                        <h4 className="font-bold text-base text-slate-900 leading-snug">{goal.name}</h4>
                        {goal.category && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {goal.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenGoalModal(goal, 'edit')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Editar meta"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {goal.notes && (
                    <p className="text-xs text-slate-500 line-clamp-2 my-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {goal.notes}
                    </p>
                  )}

                  {/* Números y progreso */}
                  <div className="space-y-2 mt-4">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold text-slate-800 font-mono-num">
                        {formatMoney(goal.currentAmount, currency)}
                      </span>
                      <span className="text-slate-400 font-mono-num font-semibold">
                        Meta: {formatMoney(goal.targetAmount, currency)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{percent}% completado</span>
                      {isCompleted ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ¡Completada!
                        </span>
                      ) : (
                        <span>Faltan {formatMoney(remaining, currency)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer con Deadline y Botón Aportar */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
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
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
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
