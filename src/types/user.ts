export type UserRole = 'admin' | 'manager' | 'member' | 'viewer' | 'dependent' | 'custom';

export interface UserPermissions {
  // Transacciones
  canCreateTransactions: boolean;
  canEditTransactions: boolean;
  canDeleteTransactions: boolean;

  // Cuentas y Balances
  canViewNetWorth: boolean;
  canManageAccounts: boolean;

  // Presupuestos y Metas
  canManageBudgets: boolean;
  canManageGoals: boolean;
  canContributeGoals: boolean;

  // Recurrentes y Categorías
  canManageRecurring: boolean;
  canManageCategories: boolean;

  // Análisis, Reportes e IA
  canViewAnalytics: boolean;
  canExportReports: boolean;
  canUseAiAdvisor: boolean;

  // Configuración y Usuarios
  canManageUsers: boolean;
  canEditRolePermissions: boolean;
  canExportImportData: boolean;
  canViewAuditLog: boolean;
  canClearAuditLog: boolean;
  canConfigureSecurity: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string; // Emoji o iniciales
  color: string;
  status: 'active' | 'inactive';
  customPermissions?: Partial<UserPermissions>;
  joinedDate: string;
  lastActive: string;
  phone?: string;
  department?: string; // e.g. "Familiar", "Finanzas", "Contabilidad"
}

export interface RoleDefinition {
  role: UserRole;
  name: string;
  shortDescription: string;
  fullDescription: string;
  badgeColor: string;
  badgeTextColor: string;
  icon: string;
  defaultPermissions: UserPermissions;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  admin: {
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: true,
    canViewNetWorth: true,
    canManageAccounts: true,
    canManageBudgets: true,
    canManageGoals: true,
    canContributeGoals: true,
    canManageRecurring: true,
    canManageCategories: true,
    canViewAnalytics: true,
    canExportReports: true,
    canUseAiAdvisor: true,
    canManageUsers: true,
    canEditRolePermissions: true,
    canExportImportData: true,
    canViewAuditLog: true,
    canClearAuditLog: true,
    canConfigureSecurity: true,
  },
  manager: {
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: true,
    canViewNetWorth: true,
    canManageAccounts: true,
    canManageBudgets: true,
    canManageGoals: true,
    canContributeGoals: true,
    canManageRecurring: true,
    canManageCategories: true,
    canViewAnalytics: true,
    canExportReports: true,
    canUseAiAdvisor: true,
    canManageUsers: false,
    canEditRolePermissions: false,
    canExportImportData: true,
    canViewAuditLog: true,
    canClearAuditLog: false,
    canConfigureSecurity: false,
  },
  member: {
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: false,
    canViewNetWorth: true,
    canManageAccounts: false,
    canManageBudgets: false,
    canManageGoals: false,
    canContributeGoals: true,
    canManageRecurring: false,
    canManageCategories: false,
    canViewAnalytics: true,
    canExportReports: true,
    canUseAiAdvisor: true,
    canManageUsers: false,
    canEditRolePermissions: false,
    canExportImportData: false,
    canViewAuditLog: true,
    canClearAuditLog: false,
    canConfigureSecurity: false,
  },
  viewer: {
    canCreateTransactions: false,
    canEditTransactions: false,
    canDeleteTransactions: false,
    canViewNetWorth: true,
    canManageAccounts: false,
    canManageBudgets: false,
    canManageGoals: false,
    canContributeGoals: false,
    canManageRecurring: false,
    canManageCategories: false,
    canViewAnalytics: true,
    canExportReports: true,
    canUseAiAdvisor: false,
    canManageUsers: false,
    canEditRolePermissions: false,
    canExportImportData: true,
    canViewAuditLog: true,
    canClearAuditLog: false,
    canConfigureSecurity: false,
  },
  dependent: {
    canCreateTransactions: true,
    canEditTransactions: false,
    canDeleteTransactions: false,
    canViewNetWorth: false, // Oculta patrimonio total por privacidad
    canManageAccounts: false,
    canManageBudgets: false,
    canManageGoals: false,
    canContributeGoals: true,
    canManageRecurring: false,
    canManageCategories: false,
    canViewAnalytics: false,
    canExportReports: false,
    canUseAiAdvisor: false,
    canManageUsers: false,
    canEditRolePermissions: false,
    canExportImportData: false,
    canViewAuditLog: false,
    canClearAuditLog: false,
    canConfigureSecurity: false,
  },
  custom: {
    canCreateTransactions: true,
    canEditTransactions: true,
    canDeleteTransactions: false,
    canViewNetWorth: true,
    canManageAccounts: false,
    canManageBudgets: true,
    canManageGoals: true,
    canContributeGoals: true,
    canManageRecurring: false,
    canManageCategories: false,
    canViewAnalytics: true,
    canExportReports: true,
    canUseAiAdvisor: true,
    canManageUsers: false,
    canEditRolePermissions: false,
    canExportImportData: false,
    canViewAuditLog: true,
    canClearAuditLog: false,
    canConfigureSecurity: false,
  },
};

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  admin: {
    role: 'admin',
    name: 'Propietario / Administrador',
    shortDescription: 'Acceso total y control de permisos',
    fullDescription: 'Control absoluto del espacio de trabajo. Puede gestionar usuarios, alterar roles, editar la matriz de permisos, realizar copias y ver todo el registro de auditoría.',
    badgeColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    badgeTextColor: 'text-indigo-600 dark:text-indigo-400',
    icon: 'Crown',
    defaultPermissions: DEFAULT_ROLE_PERMISSIONS.admin,
  },
  manager: {
    role: 'manager',
    name: 'Gestor Financiero',
    shortDescription: 'Gestión contable completa',
    fullDescription: 'Puede gestionar transacciones, cuentas, presupuestos, metas, pagos recurrentes y consultar informes e IA. No tiene permisos de administración de usuarios.',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    badgeTextColor: 'text-emerald-600 dark:text-emerald-400',
    icon: 'Briefcase',
    defaultPermissions: DEFAULT_ROLE_PERMISSIONS.manager,
  },
  member: {
    role: 'member',
    name: 'Colaborador / Miembro',
    shortDescription: 'Registra movimientos y aporta a metas',
    fullDescription: 'Ideal para miembros del equipo o de la familia. Puede registrar ingresos/gastos y aportar a metas de ahorro, pero no modifica cuentas ni presupuestos base.',
    badgeColor: 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    badgeTextColor: 'text-sky-600 dark:text-sky-400',
    icon: 'UserCheck',
    defaultPermissions: DEFAULT_ROLE_PERMISSIONS.member,
  },
  viewer: {
    role: 'viewer',
    name: 'Lector / Auditor',
    shortDescription: 'Solo consulta e informes',
    fullDescription: 'Acceso de solo lectura para auditores, contables externos o revisores. Puede ver balances, métricas, presupuestos y descargar informes sin poder modificar ningún dato.',
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    badgeTextColor: 'text-slate-600 dark:text-slate-400',
    icon: 'Eye',
    defaultPermissions: DEFAULT_ROLE_PERMISSIONS.viewer,
  },
  dependent: {
    role: 'dependent',
    name: 'Familiar / Dependiente',
    shortDescription: 'Vista simplificada de gastos propios',
    fullDescription: 'Permite registrar gastos cotidianos manteniendo oculto el patrimonio global y las cuentas bancarias para proteger la privacidad financiera general.',
    badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    badgeTextColor: 'text-amber-600 dark:text-amber-400',
    icon: 'GraduationCap',
    defaultPermissions: DEFAULT_ROLE_PERMISSIONS.dependent,
  },
  custom: {
    role: 'custom',
    name: 'Rol Personalizado',
    shortDescription: 'Permisos a medida',
    fullDescription: 'Configuración granular y específica de permisos ajustada manualmente por el administrador.',
    badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    badgeTextColor: 'text-purple-600 dark:text-purple-400',
    icon: 'SlidersHorizontal',
    defaultPermissions: DEFAULT_ROLE_PERMISSIONS.custom,
  },
};

export const PERMISSION_GROUPS = [
  {
    id: 'transactions',
    name: 'Transacciones y Movimientos',
    description: 'Permisos para registrar, editar y borrar ingresos, gastos y transferencias',
    permissions: [
      { key: 'canCreateTransactions' as keyof UserPermissions, label: 'Crear Transacciones', desc: 'Registrar nuevos ingresos, gastos o transferencias' },
      { key: 'canEditTransactions' as keyof UserPermissions, label: 'Editar Transacciones', desc: 'Modificar movimientos existentes de cualquier miembro' },
      { key: 'canDeleteTransactions' as keyof UserPermissions, label: 'Eliminar Transacciones', desc: 'Borrar registros del historial contable' },
    ],
  },
  {
    id: 'accounts',
    name: 'Cuentas y Patrimonio',
    description: 'Visualización y control de cuentas bancarias, tarjetas y balances totales',
    permissions: [
      { key: 'canViewNetWorth' as keyof UserPermissions, label: 'Ver Patrimonio Total', desc: 'Acceso a la vista y cifras globales de patrimonio neto' },
      { key: 'canManageAccounts' as keyof UserPermissions, label: 'Gestionar Cuentas', desc: 'Crear, editar o ajustar balances de cuentas bancarias y efectivo' },
    ],
  },
  {
    id: 'budgets_goals',
    name: 'Presupuestos y Metas de Ahorro',
    description: 'Control de límites de gasto mensual y objetivos financieros',
    permissions: [
      { key: 'canManageBudgets' as keyof UserPermissions, label: 'Gestionar Presupuestos', desc: 'Crear límites mensuales y configurar alertas' },
      { key: 'canManageGoals' as keyof UserPermissions, label: 'Crear y Editar Metas', desc: 'Crear nuevas metas de ahorro y modificar objetivos' },
      { key: 'canContributeGoals' as keyof UserPermissions, label: 'Aportar a Metas', desc: 'Realizar aportaciones económicas a metas existentes' },
    ],
  },
  {
    id: 'recurring_categories',
    name: 'Recurrentes y Categorías',
    description: 'Configuración de facturas periódicas y catálogo de categorías',
    permissions: [
      { key: 'canManageRecurring' as keyof UserPermissions, label: 'Gestionar Recurrentes', desc: 'Crear y posponer recibos o pagos periódicos' },
      { key: 'canManageCategories' as keyof UserPermissions, label: 'Gestionar Categorías', desc: 'Crear y personalizar categorías de ingresos/gastos' },
    ],
  },
  {
    id: 'analytics_ai',
    name: 'Análisis, Informes e Inteligencia Artificial',
    description: 'Herramientas de diagnóstico, reportes y Asesor IA',
    permissions: [
      { key: 'canViewAnalytics' as keyof UserPermissions, label: 'Ver Estadísticas y Gráficos', desc: 'Acceso a métricas de ahorro y comparativas' },
      { key: 'canExportReports' as keyof UserPermissions, label: 'Exportar Reportes PDF/CSV', desc: 'Generar reportes impresos y descargas de datos' },
      { key: 'canUseAiAdvisor' as keyof UserPermissions, label: 'Consultar Asesor IA', desc: 'Hacer preguntas y obtener diagnósticos con Gemini' },
    ],
  },
  {
    id: 'admin_security',
    name: 'Administración y Seguridad',
    description: 'Gestión de miembros, matriz de permisos y auditoría',
    permissions: [
      { key: 'canManageUsers' as keyof UserPermissions, label: 'Gestionar Miembros', desc: 'Invitar usuarios, cambiar roles y activar/desactivar' },
      { key: 'canEditRolePermissions' as keyof UserPermissions, label: 'Modificar Matriz de Permisos', desc: 'Editar las capacidades globales de cada rol' },
      { key: 'canExportImportData' as keyof UserPermissions, label: 'Copias de Seguridad (JSON)', desc: 'Exportar e importar toda la base de datos' },
      { key: 'canViewAuditLog' as keyof UserPermissions, label: 'Ver Historial de Auditoría', desc: 'Consultar el registro cronológico de todas las acciones' },
      { key: 'canClearAuditLog' as keyof UserPermissions, label: 'Vaciar Historial de Auditoría', desc: 'Eliminar registros de eventos del sistema' },
      { key: 'canConfigureSecurity' as keyof UserPermissions, label: 'Configurar Bloqueo y PIN', desc: 'Ajustar el PIN de seguridad y tiempo de bloqueo' },
    ],
  },
];

export const PERMISSION_DESCRIPTIONS: Record<keyof UserPermissions, { label: string; description: string }> = {
  canCreateTransactions: { label: 'Crear Transacciones', description: 'Registrar nuevos ingresos, gastos o transferencias' },
  canEditTransactions: { label: 'Editar Transacciones', description: 'Modificar transacciones existentes de cualquier miembro' },
  canDeleteTransactions: { label: 'Eliminar Transacciones', description: 'Borrar registros del historial contable' },
  canViewNetWorth: { label: 'Ver Patrimonio Total', description: 'Acceso a la vista y cifras globales de patrimonio neto' },
  canManageAccounts: { label: 'Gestionar Cuentas', description: 'Crear, editar o ajustar balances de cuentas bancarias y efectivo' },
  canManageBudgets: { label: 'Gestionar Presupuestos', description: 'Crear límites mensuales y configurar alertas' },
  canManageGoals: { label: 'Crear y Editar Metas', description: 'Crear nuevas metas de ahorro y modificar objetivos' },
  canContributeGoals: { label: 'Aportar a Metas', description: 'Realizar aportaciones económicas a metas existentes' },
  canManageRecurring: { label: 'Gestionar Recurrentes', description: 'Crear y posponer recibos o pagos periódicos' },
  canManageCategories: { label: 'Gestionar Categorías', description: 'Crear y personalizar categorías de ingresos/gastos' },
  canViewAnalytics: { label: 'Ver Estadísticas y Gráficos', description: 'Acceso a métricas de ahorro y comparativas' },
  canExportReports: { label: 'Exportar Reportes PDF/CSV', description: 'Generar reportes impresos y descargas de datos' },
  canUseAiAdvisor: { label: 'Consultar Asesor IA', description: 'Hacer preguntas y obtener diagnósticos con Gemini' },
  canManageUsers: { label: 'Gestionar Miembros', description: 'Invitar usuarios, cambiar roles y activar/desactivar' },
  canEditRolePermissions: { label: 'Modificar Matriz de Permisos', description: 'Editar las capacidades globales de cada rol' },
  canExportImportData: { label: 'Copias de Seguridad (JSON)', description: 'Exportar e importar toda la base de datos' },
  canViewAuditLog: { label: 'Ver Historial de Auditoría', description: 'Consultar el registro cronológico de todas las acciones' },
  canClearAuditLog: { label: 'Vaciar Historial de Auditoría', description: 'Eliminar registros de eventos del sistema' },
  canConfigureSecurity: { label: 'Configurar Bloqueo y PIN', description: 'Ajustar el PIN de seguridad y tiempo de bloqueo' },
};
