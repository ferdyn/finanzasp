import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
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

import { TransactionModal } from './components/TransactionModal';
import { AccountModal } from './components/AccountModal';
import { BudgetModal } from './components/BudgetModal';
import { GoalModal } from './components/GoalModal';
import { CompoundInterestModal } from './components/CompoundInterestModal';

import { Account, SavingsGoal, Transaction } from './types/finance';

function MainLayout() {
  const { transactions } = useFinance();
  const { isLocked } = useSecurity();
  const [activeTab, setActiveTab] = useState<string>('resumen');

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Top Header */}
      <Header
        onOpenNewTransaction={handleOpenNewTransaction}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Navigation (Tabs on desktop, bottom bar on mobile) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTransaction={handleOpenNewTransaction}
      />

      {/* Main Content Area con padding adaptado a la barra inferior móvil y safe-area */}
      <main 
        id="main-content"
        role="main"
        className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-12 focus:outline-none"
      >
        {activeTab === 'resumen' && (
          <DashboardView
            onOpenNewTransaction={handleOpenNewTransaction}
            onEditTransaction={handleEditTransaction}
            setActiveTab={setActiveTab}
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

        {activeTab === 'asesor' && (
          <AdvisorView
            onOpenNewTransactionWithData={handleOpenNewTransactionWithData}
          />
        )}

        {activeTab === 'ajustes' && (
          <SettingsView
            onOpenCompoundSimulator={() => setIsCompoundModalOpen(true)}
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

      {/* Pantalla de Bloqueo por PIN / Biometría */}
      <LockScreen />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <SecurityProvider>
        <MainLayout />
      </SecurityProvider>
    </FinanceProvider>
  );
}
