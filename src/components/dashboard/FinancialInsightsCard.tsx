import React from 'react';
import { FinancialInsight } from '../../utils/dashboardHelpers';
import { 
  Sparkles, AlertTriangle, AlertCircle, TrendingDown, 
  TrendingUp, CheckCircle2, PiggyBank, Clock, Zap, ChevronRight 
} from 'lucide-react';

interface FinancialInsightsCardProps {
  insights: FinancialInsight[];
  onNavigateTab: (tab: string) => void;
}

export const FinancialInsightsCard: React.FC<FinancialInsightsCardProps> = ({
  insights,
  onNavigateTab,
}) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  const getIcon = (iconName: string, type: FinancialInsight['type']) => {
    switch (iconName) {
      case 'AlertTriangle':
        return <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'AlertCircle':
        return <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'TrendingDown':
        return <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'TrendingUp':
        return <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'PiggyBank':
        return <PiggyBank className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      case 'Clock':
        return <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-amber-500 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />;
    }
  };

  const getCardStyle = (type: FinancialInsight['type']) => {
    switch (type) {
      case 'alert':
        return 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60';
      case 'warning':
        return 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/60';
      case 'positive':
        return 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/60';
      case 'info':
      default:
        return 'bg-slate-50 dark:bg-slate-850 border-slate-200/80 dark:border-slate-800';
    }
  };

  return (
    <div id="dashboard-insights" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            A tener en cuenta
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${getCardStyle(
              insight.type
            )}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getIcon(insight.iconName, insight.type)}</div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {insight.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>

            {insight.actionLabel && insight.actionTab && (
              <button
                type="button"
                onClick={() => onNavigateTab(insight.actionTab!)}
                className="self-end text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 hover:underline pt-1"
              >
                <span>{insight.actionLabel}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
