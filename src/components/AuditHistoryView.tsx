import React, { useState, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { AuditCategory, AuditSeverity, AuditActionType, AuditLogEntry } from '../types/audit';
import { ROLE_DEFINITIONS } from '../types/user';
import {
  History,
  Search,
  Filter,
  Download,
  Trash2,
  Calendar,
  User as UserIcon,
  Shield,
  Activity,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileCode,
  Tag,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AuditHistoryView: React.FC = () => {
  const {
    auditLogs,
    users,
    currentUser,
    clearAuditLogs,
    exportAuditLogsCSV,
    exportAuditLogsJSON,
    hasPermission,
    setIsUserManagementOpen,
  } = useUser();

  // Estados de filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  const canExport = hasPermission('canExportReports');
  const canClear = hasPermission('canClearAuditLog');

  // Toggle expansión de detalles
  const toggleExpand = (id: string) => {
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtrado reactivo de logs
  const filteredLogs = useMemo(() => {
    const now = new Date();

    return auditLogs.filter(log => {
      // 1. Búsqueda por texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = log.title.toLowerCase().includes(query);
        const matchDesc = log.description.toLowerCase().includes(query);
        const matchUser = log.userName.toLowerCase().includes(query);
        const matchAction = log.action.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchUser && !matchAction) return false;
      }

      // 2. Filtro de Categoría
      if (selectedCategory !== 'all' && log.category !== selectedCategory) {
        return false;
      }

      // 3. Filtro de Severidad
      if (selectedSeverity !== 'all' && log.severity !== selectedSeverity) {
        return false;
      }

      // 4. Filtro de Usuario
      if (selectedUserId !== 'all' && log.userId !== selectedUserId) {
        return false;
      }

      // 5. Filtro de Rango de Fecha
      if (dateRange !== 'all') {
        const logDate = new Date(log.timestamp);
        const diffMs = now.getTime() - logDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (dateRange === 'today') {
          const isToday =
            logDate.getDate() === now.getDate() &&
            logDate.getMonth() === now.getMonth() &&
            logDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateRange === '7days' && diffDays > 7) {
          return false;
        } else if (dateRange === '30days' && diffDays > 30) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, searchTerm, selectedCategory, selectedSeverity, selectedUserId, dateRange]);

  // Métricas rápidas
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const todayCount = auditLogs.filter(l => {
      const d = new Date(l.timestamp);
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;

    // Contar por usuario
    const userCounts: Record<string, number> = {};
    auditLogs.forEach(l => {
      userCounts[l.userName] = (userCounts[l.userName] || 0) + 1;
    });
    let topUser = '-';
    let topUserCount = 0;
    Object.entries(userCounts).forEach(([u, count]) => {
      if (count > topUserCount) {
        topUserCount = count;
        topUser = u;
      }
    });

    const warnings = auditLogs.filter(l => l.severity === 'warning' || l.severity === 'danger').length;

    return { total, todayCount, topUser, warnings };
  }, [auditLogs]);

  // Agrupar logs filtrados por fecha
  const groupedLogs = useMemo<Record<string, AuditLogEntry[]>>(() => {
    const groups: Record<string, AuditLogEntry[]> = {};
    const todayStr = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    filteredLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const fullDateStr = logDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      
      let label = fullDateStr;
      if (fullDateStr === todayStr) label = 'Hoy';
      else if (fullDateStr === yesterdayStr) label = 'Ayer';

      if (!groups[label]) groups[label] = [];
      groups[label].push(log);
    });

    return groups;
  }, [filteredLogs]);

  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 size={11} /> Éxito
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            <AlertTriangle size={11} /> Advertencia
          </span>
        );
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
            <AlertOctagon size={11} /> Crítico
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Info size={11} /> Info
          </span>
        );
    }
  };

  const getCategoryColor = (category: AuditCategory) => {
    switch (category) {
      case 'transacciones':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'presupuestos':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      case 'metas':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'cuentas':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800';
      case 'usuarios':
      case 'permisos':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800';
      case 'recurrentes':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800';
    }
  };

  return (
    <div id="audit-history-view" className="space-y-6 pb-12">
      {/* Cabecera Principal */}
      <div id="audit-history-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <History size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Historial de Auditoría & Trazabilidad
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Registro inmutable de todas las acciones, modificaciones financieras y eventos de seguridad
              </p>
            </div>
          </div>
        </div>

        {/* Acciones de exportación y gestión */}
        <div className="flex flex-wrap items-center gap-2">
          {canExport && (
            <>
              <button
                id="export-audit-csv-btn"
                onClick={exportAuditLogsCSV}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
                title="Descargar registro en formato CSV"
              >
                <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Exportar CSV</span>
              </button>

              <button
                id="export-audit-json-btn"
                onClick={exportAuditLogsJSON}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
                title="Descargar registro en formato JSON"
              >
                <FileCode size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>JSON</span>
              </button>
            </>
          )}

          <button
            id="manage-roles-from-audit-btn"
            onClick={() => setIsUserManagementOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Shield size={14} />
            <span>Usuarios & Permisos</span>
          </button>

          {canClear && auditLogs.length > 0 && (
            <button
              id="clear-audit-logs-btn"
              onClick={() => {
                if (confirm('¿Estás seguro de que deseas vaciar el historial de auditoría? Esta acción quedará registrada.')) {
                  clearAuditLogs();
                }
              }}
              className="p-2 rounded-xl text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Vaciar historial de auditoría"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Resumen / Métricas de Auditoría */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-2">
            <span className="text-xs font-medium">Total de Eventos</span>
            <Activity size={16} className="text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
          <span className="text-[11px] text-slate-600 dark:text-slate-300">Registros almacenados</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-2">
            <span className="text-xs font-medium">Actividad de Hoy</span>
            <Clock size={16} className="text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.todayCount}</p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Acciones en las últimas 24h</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-2">
            <span className="text-xs font-medium">Usuario Más Activo</span>
            <UserIcon size={16} className="text-sky-600" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{stats.topUser}</p>
          <span className="text-[11px] text-slate-600 dark:text-slate-300">Mayor volumen de operaciones</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 mb-2">
            <span className="text-xs font-medium">Alertas / Cambios Críticos</span>
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stats.warnings}</p>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Modificaciones de control</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Búsqueda */}
          <div className="md:col-span-5 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input
              id="audit-search-input"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario, acción, detalle o título..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-600 hover:text-slate-800"
              >
                ×
              </button>
            )}
          </div>

          {/* Categoría */}
          <div className="md:col-span-2">
            <select
              id="audit-filter-category"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas las Categorías</option>
              <option value="transacciones">Transacciones</option>
              <option value="presupuestos">Presupuestos</option>
              <option value="metas">Metas de Ahorro</option>
              <option value="cuentas">Cuentas Financieras</option>
              <option value="recurrentes">Pagos Recurrentes</option>
              <option value="usuarios">Usuarios</option>
              <option value="permisos">Permisos & Roles</option>
              <option value="sistema">Sistema & Copias</option>
            </select>
          </div>

          {/* Severidad */}
          <div className="md:col-span-2">
            <select
              id="audit-filter-severity"
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Cualquier Severidad</option>
              <option value="info">Info</option>
              <option value="success">Éxito</option>
              <option value="warning">Advertencia</option>
              <option value="danger">Crítico</option>
            </select>
          </div>

          {/* Usuario */}
          <div className="md:col-span-3">
            <select
              id="audit-filter-user"
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los Miembros</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({ROLE_DEFINITIONS[u.role]?.name || u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtros rápidos de rango temporal */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Calendar size={13} className="text-indigo-500" />
            <span>Rango:</span>
            {(['all', 'today', '7days', '30days'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  dateRange === range
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {range === 'all'
                  ? 'Todo el Historial'
                  : range === 'today'
                  ? 'Hoy'
                  : range === '7days'
                  ? 'Últimos 7 días'
                  : 'Últimos 30 días'}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            Mostrando {filteredLogs.length} de {auditLogs.length} eventos
          </span>
        </div>
      </div>

      {/* Línea de Tiempo de Auditoría */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
            <Search size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No se encontraron eventos coincidentes
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
            Intenta cambiar los términos de búsqueda o restablecer los filtros de categoría y fecha.
          </p>
          {(searchTerm || selectedCategory !== 'all' || selectedSeverity !== 'all' || selectedUserId !== 'all' || dateRange !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedSeverity('all');
                setSelectedUserId('all');
                setDateRange('all');
              }}
              className="text-xs font-semibold text-indigo-600 hover:underline pt-2"
            >
              Restablecer todos los filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedLogs) as [string, AuditLogEntry[]][]).map(([groupDate, logsInGroup]) => (
            <div key={groupDate} className="space-y-3">
              {/* Encabezado del Grupo de Fecha */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                  {groupDate}
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                <span className="text-[11px] text-slate-600 dark:text-slate-300">
                  {logsInGroup.length} {logsInGroup.length === 1 ? 'evento' : 'eventos'}
                </span>
              </div>

              {/* Lista de Eventos en este Día */}
              <div className="space-y-2.5">
                {logsInGroup.map(log => {
                  const isExpanded = expandedLogIds.has(log.id);
                  const logTime = new Date(log.timestamp).toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const roleDef = ROLE_DEFINITIONS[log.userRole] || ROLE_DEFINITIONS.member;

                  return (
                    <div
                      key={log.id}
                      id={`audit-log-${log.id}`}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Usuario y Rol */}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-base shadow-xs shrink-0">
                            {log.userAvatar || '👤'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {log.userName}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {roleDef.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                              {logTime}
                            </span>
                          </div>
                        </div>

                        {/* Badges de Categoría y Severidad */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span
                            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border capitalize ${getCategoryColor(
                              log.category
                            )}`}
                          >
                            {log.category}
                          </span>
                          {getSeverityBadge(log.severity)}
                        </div>
                      </div>

                      {/* Título y Descripción del Evento */}
                      <div className="pl-1 sm:pl-11">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {log.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                          {log.description}
                        </p>
                      </div>

                      {/* Detalles técnicos / Payload expandible */}
                      {log.details && (
                        <div className="pl-1 sm:pl-11 pt-1">
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp size={12} /> Ocultar detalles técnicos
                              </>
                            ) : (
                              <>
                                <ChevronDown size={12} /> Ver desglose de datos
                              </>
                            )}
                          </button>

                          {isExpanded && (
                            <pre className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-800 animate-in fade-in">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
