import React from 'react';
import { UserRole } from './user';

export interface ManualSection {
  id: string;
  title: string;
  shortTitle: string;
  category: ManualCategory;
  badge?: string;
  summary: string;
  targetTab?: string;
  iconName: string;
  targetRoles: UserRole[] | 'all';
  keywords: string[];
  content: {
    overview: string;
    keyFeatures: {
      title: string;
      description: string;
      roleNote?: string;
    }[];
    howToUse: {
      step: number;
      instruction: string;
      tip?: string;
    }[];
    rolePermissionsSummary: {
      role: UserRole;
      roleName: string;
      canDo: string[];
      cannotDo: string[];
    }[];
    bestPractices?: string[];
    faq?: {
      q: string;
      a: string;
    }[];
  };
}

export type ManualCategory = 
  | 'getting_started'
  | 'core_operations'
  | 'planning'
  | 'analytics'
  | 'users_roles'
  | 'security_system';

export interface ManualCategoryInfo {
  id: ManualCategory;
  name: string;
  description: string;
  iconName: string;
}

export interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  categoryBadge: string;
  targetTab?: string;
  targetSelector?: string;
  spotlightTitle?: string;
  iconName: string;
  description: string;
  highlights: string[];
  roleTips: Record<UserRole, string>;
  actionLabel?: string;
  visualPreviewType: 
    | 'welcome'
    | 'navigation'
    | 'transactions'
    | 'budgets'
    | 'networth'
    | 'goals'
    | 'advisor'
    | 'rbac'
    | 'audit'
    | 'manual';
}

export interface GlossaryItem {
  term: string;
  definition: string;
  category: 'contabilidad' | 'ahorro' | 'inversion' | 'seguridad' | 'sistema';
  example?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
  relevantRoles?: UserRole[];
}
