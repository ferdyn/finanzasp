import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { User, UserRole, UserPermissions, ROLE_DEFINITIONS, PERMISSION_DESCRIPTIONS } from '../types/user';
import {
  Users,
  Shield,
  UserPlus,
  X,
  Check,
  RotateCcw,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Key,
  Info,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
} from 'lucide-react';

const AVATAR_OPTIONS = ['👑', '💼', '👤', '🎓', '📊', '🚀', '🧑‍💻', '👩‍💼', '👨‍🎨', '💎', '🌟', '🛡️'];
const COLOR_OPTIONS = ['#6366f1', '#10b981', '#0284c7', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b'];

export const UserManagementModal: React.FC = () => {
  const {
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
    isUserManagementOpen,
    setIsUserManagementOpen,
  } = useUser();

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'overrides'>('users');
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<UserRole>('member');
  const [selectedUserForOverride, setSelectedUserForOverride] = useState<string>(users[1]?.id || users[0]?.id);

  // Estado del formulario de creación / edición de usuario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('member');
  const [formAvatar, setFormAvatar] = useState('👤');
  const [formColor, setFormColor] = useState('#6366f1');
  const [formDepartment, setFormDepartment] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isUserManagementOpen) return null;

  const canManageUsers = hasPermission('canManageUsers');
  const canEditRoles = hasPermission('canEditRolePermissions');

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormRole('member');
    setFormAvatar('👤');
    setFormColor('#0284c7');
    setFormDepartment('Operaciones');
    setFormPhone('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormAvatar(user.avatar);
    setFormColor(user.color);
    setFormDepartment(user.department || '');
    setFormPhone(user.phone || '');
    setIsFormOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      alert('Por favor complete el nombre y correo electrónico.');
      return;
    }

    if (editingUserId) {
      updateUser(editingUserId, {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        avatar: formAvatar,
        color: formColor,
        department: formDepartment.trim() || undefined,
        phone: formPhone.trim() || undefined,
      });
      setSuccessMessage(`Usuario "${formName}" actualizado correctamente.`);
    } else {
      addUser({
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        avatar: formAvatar,
        color: formColor,
        status: 'active',
        department: formDepartment.trim() || undefined,
        phone: formPhone.trim() || undefined,
      });
      setSuccessMessage(`Nuevo usuario "${formName}" creado y habilitado.`);
    }

    setIsFormOpen(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleTogglePermission = (role: UserRole, permissionKey: keyof UserPermissions) => {
    if (!canEditRoles) {
      alert('No tienes permisos suficientes para modificar la matriz de roles.');
      return;
    }
    const currentVal = rolePermissions[role]?.[permissionKey] ?? false;
    updateRolePermissions(role, { [permissionKey]: !currentVal });
  };

  const handleToggleUserOverride = (userId: string, permissionKey: keyof UserPermissions) => {
    if (!canEditRoles) {
      alert('No tienes permisos suficientes para modificar permisos personalizados.');
      return;
    }
    const target = users.find(u => u.id === userId);
    if (!target) return;

    const baseVal = rolePermissions[target.role]?.[permissionKey] ?? false;
    const currentCustomVal = target.customPermissions?.[permissionKey];
    const effectiveVal = currentCustomVal !== undefined ? currentCustomVal : baseVal;

    updateUserCustomPermissions(userId, { [permissionKey]: !effectiveVal });
  };

  const targetOverrideUser = users.find(u => u.id === selectedUserForOverride) || users[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="user-management-modal"
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden"
      >
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Gestión de Usuarios & Control de Accesos (RBAC)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Administra los miembros de la organización, sus roles y la matriz granular de permisos
              </p>
            </div>
          </div>
          <button
            id="close-user-management-modal-btn"
            onClick={() => setIsUserManagementOpen(false)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Notificación de éxito */}
        {successMessage && (
          <div className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6">
          <button
            id="tab-users-list"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users size={15} />
            <span>Miembros & Cuentas ({users.length})</span>
          </button>

          <button
            id="tab-roles-matrix"
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'roles'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Shield size={15} />
            <span>Matriz de Permisos por Rol</span>
          </button>

          <button
            id="tab-user-overrides"
            onClick={() => setActiveTab('overrides')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'overrides'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders size={15} />
            <span>Permisos por Usuario</span>
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: LISTA DE USUARIOS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Usuarios Registrados en FinanTrack
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Puedes cambiar de usuario en cualquier momento para simular diferentes roles.
                  </p>
                </div>
                {canManageUsers && (
                  <button
                    id="add-new-user-btn"
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all w-fit"
                  >
                    <UserPlus size={15} />
                    <span>Nuevo Miembro</span>
                  </button>
                )}
              </div>

              {/* Formulario modal / colapsable para añadir o editar */}
              {isFormOpen && (
                <form
                  onSubmit={handleSaveUser}
                  className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-4 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                      {editingUserId ? 'Editar Miembro' : 'Crear Nuevo Usuario'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="p-1 rounded-lg text-slate-600 hover:text-slate-700 dark:text-slate-300"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nombre Completo
                      </label>
                      <input
                        id="user-form-name"
                        type="text"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="Ej. Sofía Martínez"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        id="user-form-email"
                        type="email"
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Rol en el Sistema
                      </label>
                      <select
                        id="user-form-role"
                        value={formRole}
                        onChange={e => setFormRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      >
                        {Object.entries(ROLE_DEFINITIONS).map(([key, def]) => (
                          <option key={key} value={key}>
                            {def.name} - {def.shortDescription}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Departamento / Área
                      </label>
                      <input
                        id="user-form-dept"
                        type="text"
                        value={formDepartment}
                        onChange={e => setFormDepartment(e.target.value)}
                        placeholder="Ej. Operaciones, Familia, Finanzas"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Selector de Avatar e Icono */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Icono / Avatar
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {AVATAR_OPTIONS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setFormAvatar(emoji)}
                            className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${
                              formAvatar === emoji
                                ? 'bg-indigo-600 text-white scale-110 shadow-xs ring-2 ring-indigo-300'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Color Distintivo
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_OPTIONS.map(hex => (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => setFormColor(hex)}
                            className={`w-7 h-7 rounded-full transition-all flex items-center justify-center ${
                              formColor === hex ? 'scale-110 ring-2 ring-offset-2 ring-indigo-500' : 'opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: hex }}
                          >
                            {formColor === hex && <Check size={12} className="text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-indigo-200/60 dark:border-indigo-900/40">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                    <button
                      id="save-user-submit-btn"
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                    >
                      {editingUserId ? 'Guardar Cambios' : 'Registrar Miembro'}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Tarjetas de Usuario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {users.map(u => {
                  const roleDef = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.member;
                  const isCurrent = u.id === currentUser.id;

                  return (
                    <div
                      key={u.id}
                      id={`user-card-${u.id}`}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-indigo-500/80 bg-indigo-50/30 dark:bg-indigo-950/20 ring-1 ring-indigo-500/40'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-xs"
                            style={{ backgroundColor: `${u.color}25` }}
                          >
                            {u.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {u.name}
                              </h4>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-600 text-white rounded-md uppercase">
                                  Tú
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300">{u.email}</p>
                          </div>
                        </div>

                        <span
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-full border shrink-0"
                          style={{
                            backgroundColor: `${u.color}15`,
                            borderColor: `${u.color}40`,
                            color: u.color,
                          }}
                        >
                          {roleDef.name}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                        <span>{u.department || 'Sin área'}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              u.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{u.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                        </div>
                      </div>

                      {/* Botones de acción del usuario */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          id={`switch-to-user-btn-${u.id}`}
                          onClick={() => setCurrentUserId(u.id)}
                          disabled={isCurrent}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                            isCurrent
                              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 cursor-default'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {isCurrent ? '✓ Sesión Actual' : 'Usar esta Cuenta'}
                        </button>

                        <div className="flex items-center gap-1">
                          {canManageUsers && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(u)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Editar usuario"
                              >
                                <Edit2 size={13} />
                              </button>
                              {u.id !== 'user-admin' && (
                                <button
                                  onClick={() => toggleUserStatus(u.id)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title={u.status === 'active' ? 'Desactivar cuenta' : 'Activar cuenta'}
                                >
                                  {u.status === 'active' ? <UserCheck size={13} /> : <UserX size={13} />}
                                </button>
                              )}
                              {u.id !== 'user-admin' && (
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Eliminar al usuario ${u.name}?`)) {
                                      deleteUser(u.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Eliminar usuario"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MATRIZ DE PERMISOS POR ROL */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Configuración de Roles & Permisos
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Define qué acciones puede realizar cada nivel en el sistema. Los cambios aplican de inmediato.
                  </p>
                </div>
                {canEditRoles && (
                  <button
                    onClick={() => {
                      if (confirm('¿Restablecer todos los roles a sus permisos por defecto?')) {
                        resetRolePermissions();
                        setSuccessMessage('Matriz de roles restablecida a valores recomendados.');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-colors w-fit"
                  >
                    <RotateCcw size={13} />
                    <span>Restablecer Valores por Defecto</span>
                  </button>
                )}
              </div>

              {/* Selector de Rol a Inspeccionar / Editar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(Object.keys(ROLE_DEFINITIONS) as UserRole[]).map(r => {
                  const def = ROLE_DEFINITIONS[r];
                  const isSelected = selectedRoleForMatrix === r;

                  return (
                    <button
                      key={r}
                      id={`select-matrix-role-${r}`}
                      onClick={() => setSelectedRoleForMatrix(r)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{def.name}</span>
                        {isSelected && <Check size={14} className="text-indigo-600 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-2">
                        {def.shortDescription}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Matriz interactiva de permisos del rol seleccionado */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Permisos para {ROLE_DEFINITIONS[selectedRoleForMatrix]?.name}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300">
                    {Object.values(rolePermissions[selectedRoleForMatrix] || {}).filter(Boolean).length} permisos concedidos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(Object.keys(PERMISSION_DESCRIPTIONS) as (keyof UserPermissions)[]).map(permKey => {
                    const desc = PERMISSION_DESCRIPTIONS[permKey];
                    const isGranted = !!rolePermissions[selectedRoleForMatrix]?.[permKey];
                    const isAdminRole = selectedRoleForMatrix === 'admin';

                    return (
                      <div
                        key={permKey}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          isGranted
                            ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-900/50'
                            : 'bg-slate-100/50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/60 opacity-75'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                            {desc.label}
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 block">
                            {desc.description}
                          </span>
                        </div>

                        <button
                          id={`toggle-perm-${selectedRoleForMatrix}-${permKey}`}
                          type="button"
                          disabled={!canEditRoles || (isAdminRole && permKey === 'canManageUsers')}
                          onClick={() => handleTogglePermission(selectedRoleForMatrix, permKey)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            isGranted ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                          } ${(!canEditRoles || (isAdminRole && permKey === 'canManageUsers')) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              isGranted ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SOBRESCRITURA DE PERMISOS POR USUARIO */}
          {activeTab === 'overrides' && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Permisos Específicos por Miembro
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Concede o restringe permisos a un usuario en específico sin alterar el rol base global.
                </p>
              </div>

              {/* Selector de Usuario */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Selecciona el miembro a personalizar:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {users.map(u => {
                    const isSelected = u.id === selectedUserForOverride;
                    return (
                      <button
                        key={u.id}
                        id={`select-user-override-${u.id}`}
                        onClick={() => setSelectedUserForOverride(u.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                          style={{ backgroundColor: `${u.color}20` }}
                        >
                          {u.avatar}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block truncate text-slate-900 dark:text-slate-100">
                            {u.name}
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 block">
                            {ROLE_DEFINITIONS[u.role]?.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Matriz de Sobrescritura */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Permisos efectivos para {targetOverrideUser.name}
                  </span>
                  {targetOverrideUser.customPermissions && Object.keys(targetOverrideUser.customPermissions).length > 0 && (
                    <button
                      onClick={() => {
                        updateUser(targetOverrideUser.id, { customPermissions: {} });
                        setSuccessMessage('Sobrescrituras eliminadas. El usuario usa los permisos de su rol base.');
                      }}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Limpiar sobrescrituras
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {(Object.keys(PERMISSION_DESCRIPTIONS) as (keyof UserPermissions)[]).map(permKey => {
                    const desc = PERMISSION_DESCRIPTIONS[permKey];
                    const baseRoleVal = rolePermissions[targetOverrideUser.role]?.[permKey] ?? false;
                    const customVal = targetOverrideUser.customPermissions?.[permKey];
                    const isOverridden = customVal !== undefined;
                    const effectiveVal = isOverridden ? customVal : baseRoleVal;

                    return (
                      <div
                        key={permKey}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                          isOverridden
                            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              {desc.label}
                            </span>
                            {isOverridden && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-sm">
                                Personalizado
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-600 dark:text-slate-300">
                            Base rol: {baseRoleVal ? 'Permitido' : 'Restringido'}
                          </span>
                        </div>

                        <button
                          id={`toggle-user-override-${targetOverrideUser.id}-${permKey}`}
                          type="button"
                          disabled={!canEditRoles}
                          onClick={() => handleToggleUserOverride(targetOverrideUser.id, permKey)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            effectiveVal ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              effectiveVal ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <Info size={14} className="text-indigo-500 shrink-0" />
            <span>Los permisos activos se evalúan en tiempo real en cada acción y vista.</span>
          </div>
          <button
            onClick={() => setIsUserManagementOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
