import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatMoney } from '../utils/format';
import { 
  Sparkles, Send, ShieldCheck, AlertTriangle, Lightbulb, 
  TrendingUp, PiggyBank, Target, ArrowRight, CheckCircle2, User, Bot 
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AdvisorView: React.FC = () => {
  const { metrics, currency, transactions, budgets, goals, accounts, selectedPeriod, categories } = useFinance();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: `¡Hola! Soy tu Asesor Financiero con IA. He analizado tus números para este mes:\n• **Ingresos**: ${formatMoney(metrics.currentMonthIncome, currency)}\n• **Gastos**: ${formatMoney(metrics.currentMonthExpense, currency)}\n• **Ahorro Neto**: ${formatMoney(metrics.currentMonthNet, currency)} (Tasa de ahorro: ${metrics.savingsRate}%)\n• **Patrimonio Neto**: ${formatMoney(metrics.totalNetWorth, currency)}\n\n¿En qué te gustaría profundizar hoy? Puedo ayudarte a optimizar tus gastos, calcular tu fondo de emergencia o darte un plan de inversión.`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  // Diagnóstico de Salud Financiera (Regla 50/30/20)
  const needsCategories = ['cat-vivienda', 'cat-servicios', 'cat-alimentacion', 'cat-salud', 'cat-transporte'];
  const wantsCategories = ['cat-ocio', 'cat-compras', 'cat-suscripciones', 'cat-viajes'];

  const currentTxs = transactions.filter(t => t.date.startsWith(selectedPeriod) && t.type === 'expense');
  const needsSpend = currentTxs.filter(t => needsCategories.includes(t.categoryId)).reduce((s, t) => s + t.amount, 0);
  const wantsSpend = currentTxs.filter(t => wantsCategories.includes(t.categoryId)).reduce((s, t) => s + t.amount, 0);
  
  const totalIncome = metrics.currentMonthIncome || 1;
  const needsPct = Math.round((needsSpend / totalIncome) * 100);
  const wantsPct = Math.round((wantsSpend / totalIncome) * 100);
  const savingsPct = metrics.savingsRate;

  // Consejos calculados en tiempo real
  const tips = [
    {
      title: 'Regla 50/30/20',
      status: needsPct <= 50 && wantsPct <= 30 && savingsPct >= 20 ? 'good' : 'warning',
      desc: `Gastas un ${needsPct}% en necesidades (meta 50%), ${wantsPct}% en ocio/deseos (meta 30%) y ahorras el ${savingsPct}% (meta 20%).`,
    },
    {
      title: 'Fondo de Emergencia',
      status: metrics.totalAssets >= metrics.currentMonthExpense * 3 ? 'good' : 'warning',
      desc: metrics.totalAssets >= metrics.currentMonthExpense * 6 
        ? '¡Excelente! Cuentas con más de 6 meses de gastos cubiertos en caso de imprevisto.' 
        : `Tienes ${Math.max(1, (metrics.totalAssets / (metrics.currentMonthExpense || 1))).toFixed(1)} meses de gastos cubiertos. Te sugerimos llegar a 3-6 meses.`,
    },
    {
      title: 'Control de Presupuesto',
      status: metrics.expenseDiffPercent > 10 ? 'warning' : 'good',
      desc: metrics.expenseDiffPercent > 10 
        ? `Tus gastos han aumentado un ${metrics.expenseDiffPercent}% respecto al mes pasado. Revisa compras y ocio.` 
        : 'Tus gastos se mantienen estables respecto al periodo anterior.',
    }
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || prompt;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setPrompt('');
    setLoading(true);

    try {
      // Llamada al endpoint backend con contexto financiero del usuario si existe servidor
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          financialContext: {
            income: metrics.currentMonthIncome,
            expense: metrics.currentMonthExpense,
            savingsRate: metrics.savingsRate,
            netWorth: metrics.totalNetWorth,
            needsPct,
            wantsPct,
            accountsCount: accounts.length,
            goalsCount: goals.length,
            currency,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.answer || 'He analizado tu consulta financiera con éxito.',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        // Respuesta heurística de respaldo
        generateHeuristicResponse(query);
      }
    } catch (err) {
      generateHeuristicResponse(query);
    } finally {
      setLoading(false);
    }
  };

  const generateHeuristicResponse = (query: string) => {
    const q = query.toLowerCase();
    let reply = '';

    if (q.includes('50/30/20') || q.includes('regla')) {
      reply = `La **regla 50/30/20** es el método de oro para presupuestos saludables:\n\n1. **50% Necesidades**: Alquiler, comida, luz, transporte básico. En tu caso estás en **${needsPct}%** (${formatMoney(needsSpend, currency)}).\n2. **30% Deseos / Ocio**: Salidas, compras, streaming. En tu caso estás en **${wantsPct}%** (${formatMoney(wantsSpend, currency)}).\n3. **20% Ahorro e Inversión**: Tu tasa actual es del **${savingsPct}%** (${formatMoney(metrics.currentMonthNet, currency)}).\n\n💡 *Consejo*: Si quieres mejorar, automatiza la transferencia de ahorro el mismo día que cobras la nómina.`;
    } else if (q.includes('emergencia') || q.includes('fondo')) {
      const targetMonths = 6;
      const targetFund = (metrics.currentMonthExpense || 1200) * targetMonths;
      reply = `Un **Fondo de Emergencia** sólido debe cubrir de 3 a 6 meses de tus gastos fijos.\n\n• Tus gastos mensuales rondan **${formatMoney(metrics.currentMonthExpense, currency)}**.\n• Tu objetivo de fondo sugerido es **${formatMoney(targetFund, currency)}**.\n• Mantenlo en una cuenta de ahorro remunerada con total liquidez e interés garantizado.`;
    } else if (q.includes('ahorrar') || q.includes('reducir') || q.includes('optimizar')) {
      reply = `Aquí tienes 3 palancas inmediatas para optimizar tus finanzas:\n\n1. **Revisa suscripciones y micropagos**: Elimina servicios que no hayas usado en los últimos 30 días.\n2. **Presupuesta por categoría**: Fija un límite estricto en "Ocio & Restaurantes" y "Compras".\n3. **Págate a ti mismo primero**: Transfiere un 15-20% de tu sueldo a una cuenta de ahorro antes de empezar a gastar.`;
    } else if (q.includes('invertir') || q.includes('inversion') || q.includes('interes')) {
      reply = `Para empezar a invertir con bajo coste y diversificación:\n\n• Primero asegúrate de tener tu fondo de emergencia de 3-6 meses.\n• Utiliza fondos indexados globales (como MSCI World o S&P 500) a través de brokers regulados.\n• El **interés compuesto** a largo plazo (7-8% histórico anual) multiplica tu dinero exponencialmente con aportaciones mensuales constantes.`;
    } else {
      reply = `Con base en tu perfil actual (tasa de ahorro del **${metrics.savingsRate}%** y patrimonio neto de **${formatMoney(metrics.totalNetWorth, currency)}**), tu salud financiera es **${metrics.financialHealthScore >= 75 ? 'muy sólida' : 'estable'}**.\n\nTe recomiendo mantener la constancia en tus metas de ahorro y revisar periódicamente los presupuestos de gasto discrecional.`;
    }

    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 400);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Asesor Financiero Inteligente
            </h1>
            <span className="px-2 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
              IA
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            Diagnóstico en tiempo real y recomendaciones personalizadas basadas en tus datos
          </p>
        </div>
      </div>

      {/* Tarjetas de Diagnóstico de Salud Financiera */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tips.map((tip, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-800">{tip.title}</span>
                {tip.status === 'good' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {tip.desc}
              </p>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
              <span className={tip.status === 'good' ? 'text-emerald-700' : 'text-amber-700'}>
                {tip.status === 'good' ? 'Buen indicador' : 'Oportunidad de mejora'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Preguntas Frecuentes Rápidas */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => handleSendMessage('¿Cómo voy con la regla 50/30/20 este mes?')}
          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 whitespace-nowrap transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Evaluar regla 50/30/20</span>
        </button>

        <button
          onClick={() => handleSendMessage('¿Cuánto debería tener en mi fondo de emergencia?')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl whitespace-nowrap transition-colors"
        >
          Calcular fondo de emergencia
        </button>

        <button
          onClick={() => handleSendMessage('¿Qué consejos me das para ahorrar más dinero este mes?')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl whitespace-nowrap transition-colors"
        >
          Consejos para reducir gastos
        </button>

        <button
          onClick={() => handleSendMessage('¿Cómo empezar a invertir de forma segura?')}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl whitespace-nowrap transition-colors"
        >
          Estrategia de inversión
        </button>
      </div>

      {/* Chat Interactivo con el Asesor IA */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[480px] overflow-hidden">
        
        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                  isAi ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-sm' : 'bg-slate-800'
                }`}>
                  {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div>
                  <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    isAi 
                      ? 'bg-slate-50 text-slate-800 border border-slate-200/80 shadow-sm' 
                      : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  }`}>
                    {msg.text}
                  </div>
                  <span className={`text-[10px] text-slate-400 mt-1 block px-1 ${
                    isAi ? 'text-left' : 'text-right'
                  }`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:0.4s]" />
                <span>Analizando tus finanzas...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50/80 border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Pregúntale a tu asesor financiero (ej. ¿En qué categoría gasto más?)..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white shadow-md shadow-purple-600/20 transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
