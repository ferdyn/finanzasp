import { User } from '../types/user';
import { AuditLogEntry } from '../types/audit';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    name: 'Carlos Méndez',
    email: 'carlos.mendez@empresa.com',
    role: 'admin',
    avatar: '👑',
    color: '#6366f1', // Indigo
    status: 'active',
    joinedDate: '2026-01-01T08:00:00.000Z',
    lastActive: '2026-09-03T10:30:00.000Z',
    phone: '+34 612 345 678',
    department: 'Dirección & Finanzas',
  },
  {
    id: 'user-manager',
    name: 'Laura Gómez',
    email: 'laura.gomez@empresa.com',
    role: 'manager',
    avatar: '💼',
    color: '#10b981', // Emerald
    status: 'active',
    joinedDate: '2026-01-15T09:30:00.000Z',
    lastActive: '2026-09-03T09:45:00.000Z',
    phone: '+34 623 456 789',
    department: 'Contabilidad y Control',
  },
  {
    id: 'user-member',
    name: 'Mateo Méndez',
    email: 'mateo.mendez@empresa.com',
    role: 'member',
    avatar: '👤',
    color: '#0284c7', // Sky
    status: 'active',
    joinedDate: '2026-02-01T11:00:00.000Z',
    lastActive: '2026-09-02T18:20:00.000Z',
    phone: '+34 634 567 890',
    department: 'Operaciones',
  },
  {
    id: 'user-dependent',
    name: 'Sofía Méndez',
    email: 'sofia.mendez@familia.com',
    role: 'dependent',
    avatar: '🎓',
    color: '#f59e0b', // Amber
    status: 'active',
    joinedDate: '2026-02-15T16:00:00.000Z',
    lastActive: '2026-09-01T14:10:00.000Z',
    phone: '+34 645 678 901',
    department: 'Familia',
  },
  {
    id: 'user-viewer',
    name: 'Roberto Asesor',
    email: 'roberto.auditor@consultora.es',
    role: 'viewer',
    avatar: '📊',
    color: '#64748b', // Slate
    status: 'active',
    joinedDate: '2026-03-01T10:00:00.000Z',
    lastActive: '2026-08-30T11:05:00.000Z',
    phone: '+34 656 789 012',
    department: 'Auditoría Externa',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // Hace 15 min
    userId: 'user-admin',
    userName: 'Carlos Méndez',
    userRole: 'admin',
    userAvatar: '👑',
    action: 'TRANSACTION_CREATED',
    category: 'transacciones',
    title: 'Nuevo Gasto Registrado',
    description: 'Registró un gasto de 45,50 € en Alimentación & Supermercado desde Cuenta Nómina BBVA.',
    severity: 'info',
    details: {
      amount: 45.5,
      currency: 'EUR',
      category: 'Alimentación & Supermercado',
      account: 'Cuenta Nómina BBVA',
    },
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(), // Hace ~1.5 horas
    userId: 'user-manager',
    userName: 'Laura Gómez',
    userRole: 'manager',
    userAvatar: '💼',
    action: 'BUDGET_UPDATED',
    category: 'presupuestos',
    title: 'Límite Presupuestario Ajustado',
    description: 'Aumentó el presupuesto mensual de "Ocio y Entretenimiento" de 200,00 € a 250,00 €.',
    severity: 'warning',
    details: {
      category: 'Ocio y Entretenimiento',
      oldValue: 200,
      newValue: 250,
      period: '2026-09',
    },
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // Hace 4 horas
    userId: 'user-member',
    userName: 'Mateo Méndez',
    userRole: 'member',
    userAvatar: '👤',
    action: 'GOAL_CONTRIBUTED',
    category: 'metas',
    title: 'Aportación a Meta de Ahorro',
    description: 'Aportó 150,00 € a la meta "Viaje a Japón en Primavera".',
    severity: 'success',
    details: {
      goalName: 'Viaje a Japón en Primavera',
      amount: 150,
      currency: 'EUR',
    },
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // Ayer
    userId: 'user-admin',
    userName: 'Carlos Méndez',
    userRole: 'admin',
    userAvatar: '👑',
    action: 'PERMISSIONS_UPDATED',
    category: 'permisos',
    title: 'Matriz de Permisos Modificada',
    description: 'Habilitó el permiso "Consultar Asesor IA" para el rol Colaborador / Miembro.',
    severity: 'warning',
    details: {
      roleModified: 'member',
      permissionKey: 'canUseAiAdvisor',
      newValue: true,
    },
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), // Hace ~1 día
    userId: 'user-manager',
    userName: 'Laura Gómez',
    userRole: 'manager',
    userAvatar: '💼',
    action: 'RECURRING_PROCESSED',
    category: 'recurrentes',
    title: 'Pago Recurrente Procesado',
    description: 'Confirmó el pago automático del recibo "Suscripción Fibra Óptica & Móvil" por 49,90 €.',
    severity: 'info',
    details: {
      billName: 'Suscripción Fibra Óptica & Móvil',
      amount: 49.9,
    },
  },
  {
    id: 'log-6',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // Hace 2 días
    userId: 'user-admin',
    userName: 'Carlos Méndez',
    userRole: 'admin',
    userAvatar: '👑',
    action: 'USER_CREATED',
    category: 'usuarios',
    title: 'Nuevo Miembro Añadido',
    description: 'Invitó al usuario Roberto Asesor con rol de Lector / Auditor.',
    severity: 'success',
    details: {
      invitedUser: 'Roberto Asesor',
      role: 'viewer',
      email: 'roberto.auditor@consultora.es',
    },
  },
  {
    id: 'log-7',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // Hace 3 días
    userId: 'user-dependent',
    userName: 'Sofía Méndez',
    userRole: 'dependent',
    userAvatar: '🎓',
    action: 'TRANSACTION_CREATED',
    category: 'transacciones',
    title: 'Gasto de Transporte Registrado',
    description: 'Registró un gasto de 12,80 € en Transporte Público desde Efectivo en Billetera.',
    severity: 'info',
    details: {
      amount: 12.8,
      category: 'Transporte & Movilidad',
    },
  },
];
