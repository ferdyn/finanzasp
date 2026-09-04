import { UserRole } from './user';

export type AuditCategory = 
  | 'transacciones'
  | 'cuentas'
  | 'presupuestos'
  | 'metas'
  | 'recurrentes'
  | 'usuarios'
  | 'permisos'
  | 'sistema';

export type AuditSeverity = 'info' | 'success' | 'warning' | 'danger';

export type AuditActionType =
  // Transacciones
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_UPDATED'
  | 'TRANSACTION_DELETED'
  // Cuentas
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_UPDATED'
  | 'ACCOUNT_DELETED'
  | 'ACCOUNTS_RECONCILED'
  // Presupuestos
  | 'BUDGET_CREATED'
  | 'BUDGET_UPDATED'
  | 'BUDGET_DELETED'
  | 'BUDGET_AUTO_RENEW_TOGGLED'
  // Metas
  | 'GOAL_CREATED'
  | 'GOAL_UPDATED'
  | 'GOAL_DELETED'
  | 'GOAL_CONTRIBUTED'
  // Recurrentes
  | 'RECURRING_CREATED'
  | 'RECURRING_PROCESSED'
  | 'RECURRING_POSTPONED'
  | 'RECURRING_DELETED'
  // Categorías
  | 'CATEGORY_CREATED'
  | 'CATEGORY_UPDATED'
  | 'CATEGORY_DELETED'
  // Usuarios y Roles
  | 'USER_SWITCHED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'PERMISSIONS_UPDATED'
  // Sistema y Datos
  | 'EXTREME_SAVINGS_TOGGLED'
  | 'DATA_EXPORTED'
  | 'DATA_IMPORTED'
  | 'DATA_RESET'
  | 'AUDIT_LOG_CLEARED'
  | 'SECURITY_PIN_CHANGED'
  | 'AI_ADVISOR_CONSULTED';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar: string;
  action: AuditActionType;
  category: AuditCategory;
  title: string;
  description: string;
  severity: AuditSeverity;
  details?: {
    entityId?: string;
    entityName?: string;
    amount?: number;
    currency?: string;
    oldValue?: any;
    newValue?: any;
    ipOrDevice?: string;
    [key: string]: any;
  };
}
