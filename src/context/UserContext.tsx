import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, UserRole, UserPermissions, DEFAULT_ROLE_PERMISSIONS, ROLE_DEFINITIONS } from '../types/user';
import { AuditLogEntry, AuditCategory, AuditSeverity, AuditActionType } from '../types/audit';
import { INITIAL_USERS, INITIAL_AUDIT_LOGS } from '../data/seedUsers';

interface UserContextType {
  users: User[];
  currentUser: User;
  setCurrentUserId: (id: string) => void;
  addUser: (userData: Omit<User, 'id' | 'joinedDate' | 'lastActive'>) => User;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  toggleUserStatus: (id: string) => void;

  // Permisos
  rolePermissions: Record<UserRole, UserPermissions>;
  updateRolePermissions: (role: UserRole, permissions: Partial<UserPermissions>) => void;
  updateUserCustomPermissions: (userId: string, permissions: Partial<UserPermissions>) => void;
  resetRolePermissions: (role?: UserRole) => void;
  hasPermission: (permission: keyof UserPermissions, user?: User) => boolean;
  getEffectivePermissions: (user?: User) => UserPermissions;

  // Historial de Auditoría
  auditLogs: AuditLogEntry[];
  logAction: (entry: {
    action: AuditActionType;
    category: AuditCategory;
    title: string;
    description: string;
    severity?: AuditSeverity;
    details?: Record<string, any>;
    customUser?: User;
  }) => void;
  clearAuditLogs: () => void;
  exportAuditLogsCSV: () => void;
  exportAuditLogsJSON: () => void;

  // UI helpers
  isUserSwitcherOpen: boolean;
  setIsUserSwitcherOpen: (open: boolean) => void;
  isUserManagementOpen: boolean;
  setIsUserManagementOpen: (open: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'finantrack_users_v2',
  CURRENT_USER_ID: 'finantrack_current_user_id_v2',
  ROLE_PERMISSIONS: 'finantrack_role_permissions_v2',
  AUDIT_LOGS: 'finantrack_audit_logs_v2',
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Usuarios
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading users from localStorage:', e);
    }
    return INITIAL_USERS;
  });

  // 2. ID del Usuario Activo
  const [currentUserId, setCurrentUserIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (saved) return saved;
    } catch (e) {
      console.error('Error loading current user ID from localStorage:', e);
    }
    return 'user-admin';
  });

  // 3. Matriz de Permisos por Rol
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, UserPermissions>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_ROLE_PERMISSIONS,
          ...parsed,
        };
      }
    } catch (e) {
      console.error('Error loading role permissions from localStorage:', e);
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  // 4. Historial de Auditoría
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading audit logs from localStorage:', e);
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Modales de navegación rápida
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users to localStorage:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    } catch (e) {
      console.error('Error saving current user ID to localStorage:', e);
    }
  }, [currentUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(rolePermissions));
    } catch (e) {
      console.error('Error saving role permissions to localStorage:', e);
    }
  }, [rolePermissions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    } catch (e) {
      console.error('Error saving audit logs to localStorage:', e);
    }
  }, [auditLogs]);

  // Usuario actual
  const currentUser = useMemo(() => {
    const found = users.find(u => u.id === currentUserId);
    return found || users[0] || INITIAL_USERS[0];
  }, [users, currentUserId]);

  // Calcular permisos efectivos de un usuario (Rol base + Sobrescrituras personalizadas)
  const getEffectivePermissions = (user?: User): UserPermissions => {
    const targetUser = user || currentUser;
    const basePermissions = rolePermissions[targetUser.role] || DEFAULT_ROLE_PERMISSIONS[targetUser.role] || DEFAULT_ROLE_PERMISSIONS.member;
    if (targetUser.customPermissions && Object.keys(targetUser.customPermissions).length > 0) {
      return {
        ...basePermissions,
        ...targetUser.customPermissions,
      };
    }
    return basePermissions;
  };

  // Comprobar si el usuario tiene un permiso específico
  const hasPermission = (permission: keyof UserPermissions, user?: User): boolean => {
    const targetUser = user || currentUser;
    // Si el usuario está inactivo, no tiene permisos
    if (targetUser.status === 'inactive') return false;
    const permissions = getEffectivePermissions(targetUser);
    return !!permissions[permission];
  };

  // Registrar una acción en el Historial de Auditoría
  const logAction = (entry: {
    action: AuditActionType;
    category: AuditCategory;
    title: string;
    description: string;
    severity?: AuditSeverity;
    details?: Record<string, any>;
    customUser?: User;
  }) => {
    const actor = entry.customUser || currentUser;
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      userAvatar: actor.avatar,
      action: entry.action,
      category: entry.category,
      title: entry.title,
      description: entry.description,
      severity: entry.severity || 'info',
      details: entry.details,
    };

    setAuditLogs(prev => [newEntry, ...prev.slice(0, 499)]); // Mantener hasta 500 registros recientes
  };

  // Cambiar de usuario activo
  const setCurrentUserId = (id: string) => {
    const target = users.find(u => u.id === id);
    if (target) {
      setCurrentUserIdState(id);
      // Actualizar timestamp de última actividad
      setUsers(prev => prev.map(u => u.id === id ? { ...u, lastActive: new Date().toISOString() } : u));
      
      logAction({
        action: 'USER_SWITCHED',
        category: 'usuarios',
        title: 'Cambio de Sesión de Usuario',
        description: `Se cambió la sesión activa a ${target.name} (${ROLE_DEFINITIONS[target.role]?.name || target.role}).`,
        severity: 'info',
        customUser: target,
      });
    }
  };

  // Añadir nuevo usuario
  const addUser = (userData: Omit<User, 'id' | 'joinedDate' | 'lastActive'>): User => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      joinedDate: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    setUsers(prev => [...prev, newUser]);

    logAction({
      action: 'USER_CREATED',
      category: 'usuarios',
      title: 'Nuevo Miembro Creado',
      description: `Se creó al usuario "${newUser.name}" con rol "${ROLE_DEFINITIONS[newUser.role]?.name}".`,
      severity: 'success',
      details: {
        userId: newUser.id,
        userName: newUser.name,
        role: newUser.role,
        email: newUser.email,
      },
    });

    return newUser;
  };

  // Actualizar usuario
  const updateUser = (id: string, updates: Partial<User>) => {
    const existing = users.find(u => u.id === id);
    if (!existing) return;

    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));

    const roleChanged = updates.role && updates.role !== existing.role;
    logAction({
      action: roleChanged ? 'USER_ROLE_CHANGED' : 'USER_UPDATED',
      category: 'usuarios',
      title: roleChanged ? 'Rol de Usuario Modificado' : 'Usuario Actualizado',
      description: roleChanged
        ? `Se modificó el rol de "${existing.name}" de ${ROLE_DEFINITIONS[existing.role]?.name} a ${ROLE_DEFINITIONS[updates.role!]?.name}.`
        : `Se actualizaron los datos de perfil de "${existing.name}".`,
      severity: roleChanged ? 'warning' : 'info',
      details: {
        userId: id,
        userName: existing.name,
        changes: updates,
      },
    });
  };

  // Eliminar usuario
  const deleteUser = (id: string) => {
    if (id === 'user-admin' || users.length <= 1) {
      alert('No puedes eliminar el usuario administrador principal o el único usuario del sistema.');
      return;
    }
    const target = users.find(u => u.id === id);
    if (!target) return;

    setUsers(prev => prev.filter(u => u.id !== id));

    // Si el usuario eliminado era el activo, cambiar al primer usuario disponible
    if (currentUserId === id) {
      const fallback = users.find(u => u.id !== id) || INITIAL_USERS[0];
      setCurrentUserIdState(fallback.id);
    }

    logAction({
      action: 'USER_DELETED',
      category: 'usuarios',
      title: 'Miembro Eliminado',
      description: `Se eliminó al usuario "${target.name}" (${ROLE_DEFINITIONS[target.role]?.name}) del sistema.`,
      severity: 'danger',
      details: {
        userId: id,
        userName: target.name,
        role: target.role,
      },
    });
  };

  // Activar / Desactivar usuario
  const toggleUserStatus = (id: string) => {
    if (id === 'user-admin') {
      alert('No se puede desactivar la cuenta del Administrador Principal.');
      return;
    }
    const target = users.find(u => u.id === id);
    if (!target) return;

    const newStatus = target.status === 'active' ? 'inactive' : 'active';
    updateUser(id, { status: newStatus });
  };

  // Actualizar permisos globales de un rol
  const updateRolePermissions = (role: UserRole, permissions: Partial<UserPermissions>) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        ...permissions,
      },
    }));

    logAction({
      action: 'PERMISSIONS_UPDATED',
      category: 'permisos',
      title: 'Permisos de Rol Actualizados',
      description: `Se actualizaron las capacidades y permisos asignados al rol "${ROLE_DEFINITIONS[role]?.name}".`,
      severity: 'warning',
      details: {
        role,
        modifiedPermissions: permissions,
      },
    });
  };

  // Actualizar permisos personalizados de un usuario
  const updateUserCustomPermissions = (userId: string, permissions: Partial<UserPermissions>) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const updatedCustom = {
      ...(target.customPermissions || {}),
      ...permissions,
    };

    updateUser(userId, { customPermissions: updatedCustom });
  };

  // Restaurar permisos por defecto
  const resetRolePermissions = (role?: UserRole) => {
    if (role) {
      setRolePermissions(prev => ({
        ...prev,
        [role]: DEFAULT_ROLE_PERMISSIONS[role],
      }));
    } else {
      setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    }

    logAction({
      action: 'PERMISSIONS_UPDATED',
      category: 'permisos',
      title: 'Permisos Restaurados a Valores por Defecto',
      description: role 
        ? `Se restablecieron los permisos estándar del rol "${ROLE_DEFINITIONS[role]?.name}".`
        : 'Se restableció la matriz completa de permisos a sus configuraciones recomendadas.',
      severity: 'warning',
    });
  };

  // Vaciar historial de auditoría
  const clearAuditLogs = () => {
    if (!hasPermission('canClearAuditLog')) {
      alert('No tienes permisos suficientes para vaciar el registro de auditoría.');
      return;
    }
    setAuditLogs([]);
    logAction({
      action: 'AUDIT_LOG_CLEARED',
      category: 'sistema',
      title: 'Registro de Auditoría Vaciado',
      description: `${currentUser.name} vació el historial cronológico de auditoría.`,
      severity: 'danger',
    });
  };

  // Exportar logs a CSV
  const exportAuditLogsCSV = () => {
    if (auditLogs.length === 0) {
      alert('No hay registros de auditoría para exportar.');
      return;
    }

    const headers = ['Fecha/Hora', 'Usuario', 'Rol', 'Categoría', 'Acción', 'Título', 'Descripción', 'Severidad'];
    const rows = auditLogs.map(log => [
      `"${new Date(log.timestamp).toLocaleString('es-ES')}"`,
      `"${log.userName.replace(/"/g, '""')}"`,
      `"${log.userRole}"`,
      `"${log.category}"`,
      `"${log.action}"`,
      `"${log.title.replace(/"/g, '""')}"`,
      `"${log.description.replace(/"/g, '""')}"`,
      `"${log.severity}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinanTrack_Auditoria_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAction({
      action: 'DATA_EXPORTED',
      category: 'sistema',
      title: 'Auditoría Exportada a CSV',
      description: `Se exportaron ${auditLogs.length} registros del historial de auditoría a archivo CSV.`,
      severity: 'info',
    });
  };

  // Exportar logs a JSON
  const exportAuditLogsJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `FinanTrack_Auditoria_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        setCurrentUserId,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        rolePermissions,
        updateRolePermissions,
        updateUserCustomPermissions,
        resetRolePermissions,
        hasPermission,
        getEffectivePermissions,
        auditLogs,
        logAction,
        clearAuditLogs,
        exportAuditLogsCSV,
        exportAuditLogsJSON,
        isUserSwitcherOpen,
        setIsUserSwitcherOpen,
        isUserManagementOpen,
        setIsUserManagementOpen,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
