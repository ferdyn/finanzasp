import React, { createContext, useContext, useState, useEffect } from 'react';
import { TOUR_STEPS } from '../data/manualData';

interface TourContextType {
  isTourOpen: boolean;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: typeof TOUR_STEPS[number];
  isWelcomeModalOpen: boolean;
  hasCompletedTour: boolean;
  startTour: (stepIndex?: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  closeTour: () => void;
  openWelcomeModal: () => void;
  closeWelcomeModal: () => void;
  completeTour: () => void;
  resetTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TOUR_COMPLETED: 'finantrack_tour_completed_v1',
  WELCOME_DISMISSED: 'finantrack_welcome_dismissed_v1',
};

export const TourProvider: React.FC<{ 
  children: React.ReactNode;
  onNavigateTab?: (tab: string) => void;
}> = ({ children, onNavigateTab }) => {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTourState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOUR_COMPLETED) === 'true';
    } catch {
      return false;
    }
  });

  // Mostrar modal de bienvenida en la primera visita
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEYS.WELCOME_DISMISSED);
      const completed = localStorage.getItem(STORAGE_KEYS.TOUR_COMPLETED);
      if (!dismissed && !completed) {
        // Retraso suave para que la interfaz cargue primero
        const timer = setTimeout(() => {
          setIsWelcomeModalOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn('Error checking initial tour state', e);
    }
  }, []);

  const totalSteps = TOUR_STEPS.length;
  const currentStep = TOUR_STEPS[currentStepIndex] || TOUR_STEPS[0];

  const startTour = (stepIndex = 0) => {
    setIsWelcomeModalOpen(false);
    const validIndex = Math.max(0, Math.min(stepIndex, totalSteps - 1));
    setCurrentStepIndex(validIndex);
    setIsTourOpen(true);

    const targetTab = TOUR_STEPS[validIndex]?.targetTab;
    if (targetTab && onNavigateTab) {
      onNavigateTab(targetTab);
    }
  };

  const nextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      const targetTab = TOUR_STEPS[nextIndex]?.targetTab;
      if (targetTab && onNavigateTab) {
        onNavigateTab(targetTab);
      }
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      const targetTab = TOUR_STEPS[prevIndex]?.targetTab;
      if (targetTab && onNavigateTab) {
        onNavigateTab(targetTab);
      }
    }
  };

  const goToStep = (index: number) => {
    const validIndex = Math.max(0, Math.min(index, totalSteps - 1));
    setCurrentStepIndex(validIndex);
    const targetTab = TOUR_STEPS[validIndex]?.targetTab;
    if (targetTab && onNavigateTab) {
      onNavigateTab(targetTab);
    }
  };

  const closeTour = () => {
    setIsTourOpen(false);
  };

  const completeTour = () => {
    setIsTourOpen(false);
    setHasCompletedTourState(true);
    try {
      localStorage.setItem(STORAGE_KEYS.TOUR_COMPLETED, 'true');
      localStorage.setItem(STORAGE_KEYS.WELCOME_DISMISSED, 'true');
    } catch (e) {
      console.warn('Error saving tour completion state', e);
    }
  };

  const openWelcomeModal = () => {
    setIsWelcomeModalOpen(true);
  };

  const closeWelcomeModal = () => {
    setIsWelcomeModalOpen(false);
    try {
      localStorage.setItem(STORAGE_KEYS.WELCOME_DISMISSED, 'true');
    } catch (e) {
      console.warn('Error saving welcome dismiss', e);
    }
  };

  const resetTour = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOUR_COMPLETED);
      localStorage.removeItem(STORAGE_KEYS.WELCOME_DISMISSED);
      setHasCompletedTourState(false);
    } catch (e) {
      console.warn('Error resetting tour state', e);
    }
    startTour(0);
  };

  return (
    <TourContext.Provider
      value={{
        isTourOpen,
        currentStepIndex,
        totalSteps,
        currentStep,
        isWelcomeModalOpen,
        hasCompletedTour,
        startTour,
        nextStep,
        prevStep,
        goToStep,
        closeTour,
        openWelcomeModal,
        closeWelcomeModal,
        completeTour,
        resetTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = (): TourContextType => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
