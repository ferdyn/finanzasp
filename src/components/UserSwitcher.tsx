import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { ROLE_DEFINITIONS } from '../types/user';
import { Users, ChevronDown, Check, Shield, UserPlus, Settings, Sparkles } from 'lucide-react';

export const UserSwitcher: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUserId,
    setIsUserManagementOpen,
    getEffectivePermissions,
    hasPermission,
  } = useUser();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleInfo = ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS.member;
  const permissions = getEffectivePermissions(currentUser);
  const activePermissionsCount = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón trigger del selector */}
      <button
        id="user-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 h-8 sm:h-9 md:h-10 px-1.5 sm:px-2.5 md:px-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 active:scale-95 transition-all duration-200 group text-left shrink-0"
        title={`Usuario actual: ${currentUser.name} (${roleInfo.name}). Clic para cambiar.`}
        aria-label={`Cambiar usuario. Actual: ${currentUser.name}`}
      >
        <div className="relative shrink-0">
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-sm sm:text-base font-medium shadow-xs ring-1 ring-white dark:ring-slate-900"
            style={{ backgroundColor: `${currentUser.color}20`, color: currentUser.color }}
          >
            {currentUser.avatar}
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900"
            style={{ backgroundColor: currentUser.status === 'active' ? '#10b981' : '#94a3b8' }}
          />
        </div>

        <div className="hidden sm:flex flex-col min-w-0">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight truncate max-w-[100px] md:max-w-[130px]">
            {currentUser.name}
          </span>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight truncate">
            {roleInfo.name}
          </span>
        </div>

        <ChevronDown
          size={14}
          className={`text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Backdrop móvil para cerrar al pulsar fuera */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-xs z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menú desplegable */}
      {isOpen && (
        <div
          id="user-switcher-menu"
          className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Cabecera del usuario actual */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">
                Sesión Activa
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${currentUser.color}15`,
                  borderColor: `${currentUser.color}40`,
                  color: currentUser.color,
                }}
              >
                {roleInfo.name}
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-xs"
                style={{ backgroundColor: `${currentUser.color}25` }}
              >
                {currentUser.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {currentUser.name}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Shield size={12} className="text-indigo-500" />
                <span>{activePermissionsCount} permisos activos</span>
              </span>
              <span>{currentUser.department || 'General'}</span>
            </div>
          </div>

          {/* Lista de usuarios para cambio rápido */}
          <div className="p-2 max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
            <div className="px-2 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Cambiar de Usuario (Simulación Multiusuario)
            </div>
            {users.map(u => {
              const uRole = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.member;
              const isSelected = u.id === currentUser.id;

              return (
                <button
                  key={u.id}
                  id={`switch-user-${u.id}`}
                  onClick={() => {
                    setCurrentUserId(u.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: `${u.color}20` }}
                  >
                    {u.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate">{u.name}</span>
                      {isSelected && (
                        <Check size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <span>{uRole.name}</span>
                      <span>•</span>
                      <span>{u.email.split('@')[0]}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Acciones de administración */}
          {(hasPermission('canManageUsers') || hasPermission('canEditRolePermissions')) && (
            <div className="p-2 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
              <button
                id="open-user-roles-manager-btn"
                onClick={() => {
                  setIsOpen(false);
                  setIsUserManagementOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition-all"
              >
                <Users size={14} />
                <span>Gestionar Usuarios & Permisos</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
