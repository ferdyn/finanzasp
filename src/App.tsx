import React, { useState, useEffect } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { TourProvider } from './context/TourContext';
import { LockScreen } from './components/LockScreen';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { BudgetsView } from './views/BudgetsView';
import { NetWorthView } from './views/NetWorthView';
import { GoalsView } from './views/GoalsView';
import { AnalyticsView } from './views/AnalyticsView';
import { AdvisorView } from './views/AdvisorView';
import { SettingsView } from './views/SettingsView';
import { ReportView } from './views/ReportView';
import { ManualView } from './views/ManualView';
import { AuditHistoryView } from './components/AuditHistoryView';
import { UserManagementModal } from './components/UserManagementModal';
import { InteractiveTour } from './components/InteractiveTour';
import { WelcomeGuideModal } from './components/WelcomeGuideModal';

import { TransactionModal } from './components/TransactionModal';
import { AccountModal } from './components/AccountModal';
import { BudgetModal } from './components/BudgetModal';
import { GoalModal } from './components/GoalModal';
import { CompoundInterestModal } from './components/CompoundInterestModal';
import { FraudAlertModal } from './components/FraudAlertModal';
import { KycVerificationModal } from './components/KycVerificationModal';
import { MfaChallengeModal } from './components/MfaChallengeModal';
import { SecurityPinModal } from './components/SecurityPinModal';
import { FraudAlertData, KycVerificationData } from './types/digitalCards';

import { Account, SavingsGoal, Transaction } from './types/finance';
import { EyeOff } from 'lucide-react';

function MainLayout() {
  const { transactions, privacyMode, togglePrivacyMode, currency } = useFinance();
  const { isLocked, hasPin } = useSecurity();
  const [activeTab, setActiveTab] = useState<string>('resumen');

  // Reseteo inmediato y seguro del scroll a la parte superior al cambiar de pestaña
  const handleTabChange = (newTab: string) => {
    if (newTab === activeTab) {
      // Si se pulsa la pestaña actualmente activa, scroll suave hacia arriba
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      if (document.documentElement) document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
      if (document.body) document.body.scrollTo({ top: 0, behavior: 'smooth' });
      const mainEl = document.getElementById('main-content');
      if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Cambio de pestaña: reseteo inmediato a la parte superior para no heredar scroll anterior
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const mainEl = document.getElementById('main-content');
      if (mainEl) mainEl.scrollTop = 0;
      setActiveTab(newTab);
    }
  };

  // Efecto reactivo: garantiza que cualquier cambio de pestaña restablezca el scroll en (0, 0)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    const mainEl = document.getElementById('main-content');
    if (mainEl) mainEl.scrollTop = 0;
  }, [activeTab]);

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [txInitialData, setTxInitialData] = useState<Partial<Transaction> | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetCatIdToEdit, setBudgetCatIdToEdit] = useState<string | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | null>(null);
  const [goalModalMode, setGoalModalMode] = useState<'create' | 'edit' | 'contribute'>('create');

  const [isCompoundModalOpen, setIsCompoundModalOpen] = useState(false);

  // Security and Compliance Modals
  const [isFraudModalOpen, setIsFraudModalOpen] = useState(false);
  const [fraudAlertData, setFraudAlertData] = useState<FraudAlertData | null>({
    id: 'fraud_sim_01',
    cardLastFour: '4242',
    cardBrand: 'visa',
    merchant: 'CryptoExchange Global Inc (London)',
    amount: 850.00,
    currency: 'EUR',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    location: 'Londres, Reino Unido (IP Anómala)',
    status: 'pending',
    riskReason: 'Transacción internacional inusual fuera del horario habitual y sin 3D Secure previo.',
  });

  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [mfaActionDetails, setMfaActionDetails] = useState<{ title: string; desc: string; callback: () => void }>({
    title: 'Operación Financiera Protegida',
    desc: 'Confirma la autenticación de dos factores (2FA / SCA) para continuar.',
    callback: () => {},
  });

  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
  const [pinPromptCallback, setPinPromptCallback] = useState<(() => void) | null>(null);

  // Handlers
  const handleOpenNewTransaction = () => {
    setTxToEdit(null);
    setTxInitialData(null);
    setIsTxModalOpen(true);
  };

  const handleOpenNewTransactionWithData = (data: Partial<Transaction>) => {
    setTxToEdit(null);
    setTxInitialData(data);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (tx) {
      setTxToEdit(tx);
      setIsTxModalOpen(true);
    }
  };

  const handleOpenAccountModal = (acc?: Account) => {
    setAccountToEdit(acc || null);
    setIsAccountModalOpen(true);
  };

  const handleOpenBudgetModal = (categoryId?: string) => {
    setBudgetCatIdToEdit(categoryId || null);
    setIsBudgetModalOpen(true);
  };

  const handleOpenGoalModal = (goal?: SavingsGoal, mode: 'create' | 'edit' | 'contribute' = 'create') => {
    setGoalToEdit(goal || null);
    setGoalModalMode(mode);
    setIsGoalModalOpen(true);
  };

  const handleTriggerFraudAlert = (data?: FraudAlertData) => {
    if (data) setFraudAlertData(data);
    setIsFraudModalOpen(true);
  };

  const handleTriggerMfaChallenge = (title: string, desc: string, callback: () => void) => {
    setMfaActionDetails({ title, desc, callback });
    setIsMfaModalOpen(true);
  };

  const handleOpenSecurityPinPrompt = (onSuccess: () => void) => {
    if (hasPin) {
      setPinPromptCallback(() => onSuccess);
      setIsPinPromptOpen(true);
    } else {
      // Si no hay PIN configurado, permitir directamente
      onSuccess();
    }
  };

  return (
    <TourProvider onNavigateTab={handleTabChange}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
        {/* Top Header */}
        <Header
          onOpenNewTransaction={handleOpenNewTransaction}
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onOpenKyc={() => setIsKycModalOpen(true)}
          onTriggerFraudAlert={() => handleTriggerFraudAlert()}
        />

        {/* Main Navigation (Tabs on desktop, bottom bar on mobile) */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onOpenNewTransaction={handleOpenNewTransaction}
        />

        {/* Main Content Area con padding adaptado a la barra inferior móvil y safe-area */}
        <main 
          id="main-content"
          role="main"
          className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-3.5 sm:pt-6 pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] lg:pb-12 focus:outline-none"
        >
          {activeTab === 'resumen' && (
            <DashboardView
              onOpenNewTransaction={handleOpenNewTransaction}
              onEditTransaction={handleEditTransaction}
              setActiveTab={handleTabChange}
            />
          )}

          {activeTab === 'movimientos' && (
            <TransactionsView
              onOpenNewTransaction={handleOpenNewTransaction}
              onEditTransaction={handleEditTransaction}
              onOpenNewTransactionWithData={handleOpenNewTransactionWithData}
            />
          )}

          {activeTab === 'presupuestos' && (
            <BudgetsView
              onOpenBudgetModal={handleOpenBudgetModal}
            />
          )}

          {activeTab === 'patrimonio' && (
            <NetWorthView
              onOpenAccountModal={handleOpenAccountModal}
              onOpenNewTransaction={handleOpenNewTransaction}
              onOpenCompoundSimulator={() => setIsCompoundModalOpen(true)}
              onOpenSecurityPinPrompt={handleOpenSecurityPinPrompt}
            />
          )}

          {activeTab === 'metas' && (
            <GoalsView
              onOpenGoalModal={handleOpenGoalModal}
            />
          )}

          {activeTab === 'analisis' && (
            <AnalyticsView />
          )}

          {activeTab === 'historial' && (
            <AuditHistoryView />
          )}

          {activeTab === 'asesor' && (
            <AdvisorView
              onOpenNewTransactionWithData={handleOpenNewTransactionWithData}
            />
          )}

          {activeTab === 'manual' && (
            <ManualView
              setActiveTab={handleTabChange}
              onOpenNewTransaction={handleOpenNewTransaction}
            />
          )}

          {activeTab === 'ajustes' && (
            <SettingsView
              onOpenCompoundSimulator={() => setIsCompoundModalOpen(true)}
              onOpenReports={() => handleTabChange('reportes')}
              onOpenManual={() => handleTabChange('manual')}
              onOpenKyc={() => setIsKycModalOpen(true)}
              onTriggerFraudAlert={() => handleTriggerFraudAlert()}
              onTriggerMfaChallenge={(title, desc, cb) => handleTriggerMfaChallenge(title, desc, cb)}
            />
          )}

          {activeTab === 'reportes' && (
            <ReportView
              onBack={() => handleTabChange('resumen')}
            />
          )}
        </main>

        {/* Modales */}
        <TransactionModal
          isOpen={isTxModalOpen}
          onClose={() => setIsTxModalOpen(false)}
          transactionToEdit={txToEdit}
          initialData={txInitialData}
        />

        <AccountModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
          accountToEdit={accountToEdit}
        />

        <BudgetModal
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          categoryIdToEdit={budgetCatIdToEdit}
        />

        <GoalModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          goalToEdit={goalToEdit}
          mode={goalModalMode}
        />

        <CompoundInterestModal
          isOpen={isCompoundModalOpen}
          onClose={() => setIsCompoundModalOpen(false)}
        />

        <UserManagementModal />

        {/* Modales de Seguridad, PSD2 / SCA y Compliance */}
        <FraudAlertModal
          isOpen={isFraudModalOpen}
          alert={fraudAlertData}
          onClose={() => setIsFraudModalOpen(false)}
          onApprove={(alertId) => {
            console.log('Transacción aprobada por el usuario:', alertId);
          }}
          onBlockCard={(alertId, lastFour) => {
            console.log('Tarjeta bloqueada por seguridad:', lastFour);
          }}
        />

        <KycVerificationModal
          isOpen={isKycModalOpen}
          onClose={() => setIsKycModalOpen(false)}
          onComplete={(kycData) => {
            try {
              localStorage.setItem('finantrack_kyc_completed', 'true');
            } catch {}
            setIsKycModalOpen(false);
          }}
        />

        <MfaChallengeModal
          isOpen={isMfaModalOpen}
          actionTitle={mfaActionDetails.title}
          actionDescription={mfaActionDetails.desc}
          onClose={() => setIsMfaModalOpen(false)}
          onSuccess={() => {
            mfaActionDetails.callback();
          }}
        />

        <SecurityPinModal
          isOpen={isPinPromptOpen}
          mode="unlock"
          onClose={() => {
            setIsPinPromptOpen(false);
            setPinPromptCallback(null);
          }}
          onSuccess={() => {
            setIsPinPromptOpen(false);
            if (pinPromptCallback) {
              pinPromptCallback();
              setPinPromptCallback(null);
            }
          }}
        />

        {/* Guía Interactiva y Bienvenida */}
        <InteractiveTour />
        <WelcomeGuideModal onOpenManual={() => handleTabChange('manual')} />

        {/* Indicador flotante y acceso rápido cuando el Modo Espía está activo */}
        {privacyMode && (
          <div className="fixed bottom-14 sm:bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              type="button"
              onClick={togglePrivacyMode}
              title="Modo Espía activo: Clic para mostrar cifras (Alt+P)"
              aria-label="Modo Espía activo. Clic para mostrar montos"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/95 dark:bg-slate-800/95 text-amber-400 text-xs font-bold border border-amber-500/50 shadow-2xl backdrop-blur-md hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all group"
            >
              <EyeOff className="w-3.5 h-3.5 stroke-[2.5] text-amber-400 animate-pulse" />
              <span className="text-white group-hover:text-amber-200">Modo Espía Activo</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono hidden sm:inline">Alt+P</span>
            </button>
          </div>
        )}

        {/* Pantalla de Bloqueo por PIN / Biometría */}
        <LockScreen />
      </div>
    </TourProvider>
  );
}

export default function App() {
  return (
    <UserProvider>
      <FinanceProvider>
        <SecurityProvider>
          <MainLayout />
        </SecurityProvider>
      </FinanceProvider>
    </UserProvider>
  );
}
