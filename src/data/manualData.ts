import { ManualSection, ManualCategoryInfo, TourStep, GlossaryItem, FAQItem } from '../types/manual';

export const MANUAL_CATEGORIES: ManualCategoryInfo[] = [
  {
    id: 'getting_started',
    name: 'Primeros Pasos',
    description: 'Filosofía, configuración básica y conceptos esenciales para comenzar.',
    iconName: 'Compass',
  },
  {
    id: 'core_operations',
    name: 'Operaciones Diarias',
    description: 'Registro de movimientos, transferencias, suscripciones y plantillas rápidas.',
    iconName: 'ArrowLeftRight',
  },
  {
    id: 'planning',
    name: 'Planificación & Metas',
    description: 'Presupuestos mensuales, regla 50/30/20, metas de ahorro y simuladores.',
    iconName: 'PieChart',
  },
  {
    id: 'analytics',
    name: 'Analítica, Informes & IA',
    description: 'Estadísticas históricas, reportes imprimibles en PDF y Asesor IA con Gemini.',
    iconName: 'BarChart3',
  },
  {
    id: 'users_roles',
    name: 'Multiusuario & Roles (RBAC)',
    description: 'Gestión de miembros, matriz de permisos granulares y trazabilidad.',
    iconName: 'Users',
  },
  {
    id: 'security_system',
    name: 'Seguridad & Ajustes',
    description: 'Bloqueo por PIN, Modo Espía, copias de seguridad JSON y auditoría inmutable.',
    iconName: 'Shield',
  },
];

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a FinanTrack!',
    subtitle: 'Tu centro integral de finanzas personales y familiares',
    categoryBadge: 'Introducción',
    targetTab: 'resumen',
    targetSelector: '#dashboard-balance-banner',
    spotlightTitle: 'Balance Neto Mensual & Salud Financiera',
    iconName: 'Sparkles',
    description: 'FinanTrack es una plataforma diseñada para darte control total sobre tus ingresos, gastos, patrimonio neto y metas de ahorro, con privacidad local, soporte multiusuario y asesoramiento inteligente con IA.',
    highlights: [
      'Datos seguros en tu dispositivo y sin depender de servidores externos obligatorios.',
      'Gestión colaborativa con roles (Administrador, Gestor, Miembro, Auditor, Dependiente).',
      'Asesor financiero con IA de Gemini para detectar fugas y responder consultas contables.',
    ],
    roleTips: {
      admin: 'Como Administrador tienes control total sobre la configuración, miembros y permisos del sistema.',
      manager: 'Como Gestor Financiero puedes administrar cuentas, transacciones y presupuestos libremente.',
      member: 'Como Miembro puedes registrar tus ingresos y gastos diarios y aportar a tus metas.',
      viewer: 'Como Auditor tienes acceso de solo lectura a métricas, informes y balances.',
      dependent: 'Como Dependiente puedes registrar tus gastos personales sin ver el patrimonio familiar global.',
      custom: 'Tu usuario cuenta con permisos específicos asignados a medida.',
    },
    actionLabel: 'Comenzar Recorrido',
    visualPreviewType: 'welcome',
  },
  {
    id: 'navigation',
    title: 'Navegación & Estructura',
    subtitle: 'Cómo desplazarte por las diferentes áreas del sistema',
    categoryBadge: 'Interfaz',
    targetTab: 'resumen',
    targetSelector: '#desktop-main-nav, #mobile-bottom-navigation',
    spotlightTitle: 'Barra de Pestañas & Menú de Navegación',
    iconName: 'LayoutDashboard',
    description: 'La aplicación se divide en vistas especializadas accesibles desde la barra superior (en ordenador) o la barra inferior y menú "Más" (en móvil).',
    highlights: [
      'Resumen: Panel de control con métricas clave, balance mensual y estado de presupuestos.',
      'Movimientos: Registro detallado y filtros avanzados de transacciones.',
      'Presupuestos & Metas: Planificación de techos de gasto y huchas de ahorro.',
      'Patrimonio, Auditoría, Reportes PDF y Asesor IA disponibles en el menú extendido.',
    ],
    roleTips: {
      admin: 'Puedes acceder a todas las vistas sin restricción alguna.',
      manager: 'Acceso a todas las herramientas operativas y analíticas.',
      member: 'Vistas de movimientos, presupuestos, metas y análisis habilitadas.',
      viewer: 'Acceso a consultas de resumen, reportes e historial en modo lectura.',
      dependent: 'Vista simplificada centrada en registro de gastos y metas.',
      custom: 'Navegación adaptada a tus permisos activos.',
    },
    actionLabel: 'Ver Panel de Resumen',
    visualPreviewType: 'navigation',
  },
  {
    id: 'transactions',
    title: 'Registro de Movimientos',
    subtitle: 'Ingresos, gastos, transferencias y suscripciones recurrentes',
    categoryBadge: 'Operativa Diaria',
    targetTab: 'movimientos',
    targetSelector: '#btn-new-transaction, #mobile-nav-nuevo-centro',
    spotlightTitle: 'Botón "+ Nuevo Movimiento"',
    iconName: 'ArrowLeftRight',
    description: 'Registra cualquier transacción en segundos pulsando el botón verde "+ Nuevo" (o el botón central en móvil). Cada movimiento guarda fecha, categoría, cuenta bancaria, etiquetas y autor.',
    highlights: [
      'Transacciones Recurrentes: Configura nóminas, suscripciones (Netflix, Spotify) o alquileres automáticos.',
      'Plantillas Rápidas: Guarda combinaciones comunes para registrar gastos diarios con un solo toque.',
      'Transferencias entre Cuentas: Traspasa saldo entre efectivo y banco sin distorsionar ingresos o gastos.',
    ],
    roleTips: {
      admin: 'Puedes crear, editar y eliminar transacciones de cualquier usuario.',
      manager: 'Control total de creación, edición y eliminación de movimientos contables.',
      member: 'Puedes crear movimientos y consultar el historial de operaciones.',
      viewer: 'Solo consulta de transacciones (no puedes añadir ni modificar registros).',
      dependent: 'Puedes registrar tus propios gastos pero no transferir entre cuentas principales.',
      custom: 'Sujeto a los permisos "canCreateTransactions" y "canEditTransactions".',
    },
    actionLabel: 'Explorar Movimientos',
    visualPreviewType: 'transactions',
  },
  {
    id: 'budgets',
    title: 'Presupuestos & Regla 50/30/20',
    subtitle: 'Límites mensuales inteligentes y alertas visuales',
    categoryBadge: 'Control de Gasto',
    targetTab: 'presupuestos',
    targetSelector: '#budgets-summary-banner',
    spotlightTitle: 'Presupuesto Total y Regla 50/30/20',
    iconName: 'PieChart',
    description: 'Establece techos de gasto por categoría para evitar sorpresas a fin de mes. El sistema clasifica tus categorías según la regla 50/30/20 y te alerta cuando superas el 80% o el 100% de tu presupuesto.',
    highlights: [
      'Semáforo de Gasto: Verde (<80%), Ámbar (80-99%) y Rojo (Excedido).',
      'Regla 50/30/20: Distribuye automáticamente entre Necesidades (50%), Deseos (30%) y Ahorro (20%).',
      'Modo de Ahorro Extremo: Actívalo en Ajustes para recortar gastos no esenciales y acelerar tu ahorro.',
    ],
    roleTips: {
      admin: 'Puedes crear y ajustar presupuestos y porcentajes de advertencia.',
      manager: 'Puedes crear y modificar presupuestos mensuales para cualquier categoría.',
      member: 'Puedes ver el consumo de los presupuestos para controlar tus gastos.',
      viewer: 'Visualización de presupuestos y estado de cumplimiento.',
      dependent: 'Acceso a presupuestos de gastos asignados.',
      custom: 'Sujeto al permiso "canManageBudgets".',
    },
    actionLabel: 'Ver Presupuestos',
    visualPreviewType: 'budgets',
  },
  {
    id: 'networth',
    title: 'Patrimonio & Cuentas Bancarias',
    subtitle: 'Activos, pasivos y cálculo consolidado del patrimonio neto',
    categoryBadge: 'Patrimonio',
    targetTab: 'patrimonio',
    targetSelector: '#networth-hero-card',
    spotlightTitle: 'Total de Patrimonio Neto & Cuentas',
    iconName: 'Landmark',
    description: 'Controla todas tus cuentas en un solo lugar: cuentas corrientes, huchas de efectivo, fondos de inversión y tarjetas de crédito con saldo deudor.',
    highlights: [
      'Fórmula en Tiempo Real: Patrimonio Neto = Total Activos Líquidos - Total Pasivos/Deudas.',
      'Conciliación de Saldos: Ajusta saldos reales en cualquier momento para mantener la contabilidad exacta.',
      'Tipos de cuenta con iconos y colores distintivos para fácil identificación.',
    ],
    roleTips: {
      admin: 'Gestión completa de cuentas, balances y patrimonio neto.',
      manager: 'Creación, edición y conciliación de cuentas bancarias y de inversión.',
      member: 'Consulta del saldo de cuentas habilitadas para operar.',
      viewer: 'Solo consulta de saldos y gráficos de patrimonio.',
      dependent: 'Vista oculta por seguridad para proteger la privacidad financiera de la familia.',
      custom: 'Sujeto al permiso "canViewNetWorth" y "canManageAccounts".',
    },
    actionLabel: 'Ver Patrimonio & Cuentas',
    visualPreviewType: 'networth',
  },
  {
    id: 'goals',
    title: 'Metas de Ahorro & Simuladores',
    subtitle: 'Huchas de ahorro con objetivos y cálculo de interés compuesto',
    categoryBadge: 'Ahorro & Futuro',
    targetTab: 'metas',
    targetSelector: '#goals-summary-card',
    spotlightTitle: 'Progreso de Metas de Ahorro',
    iconName: 'Target',
    description: 'Crea objetivos con fecha límite (fondo de emergencia, vacaciones, entrada de vivienda) y realiza aportaciones directas para seguir el progreso.',
    highlights: [
      'Barras de progreso visuales con estimación de fecha de cumplimiento.',
      'Simulador de Interés Compuesto: Calcula el crecimiento exponencial de tus ahorros con aportaciones periódicas.',
      'Trazabilidad de aportaciones vinculada a la cuenta de origen.',
    ],
    roleTips: {
      admin: 'Creación, edición y aportación a cualquier meta de ahorro.',
      manager: 'Administración de metas y registro de aportaciones.',
      member: 'Aportación a metas de ahorro compartidas o personales.',
      viewer: 'Visualización del progreso de las metas.',
      dependent: 'Aportación a metas personales de ahorro.',
      custom: 'Sujeto a los permisos "canManageGoals" y "canContributeGoals".',
    },
    actionLabel: 'Ver Metas de Ahorro',
    visualPreviewType: 'goals',
  },
  {
    id: 'advisor',
    title: 'Asesor Financiero con IA (Gemini)',
    subtitle: 'Diagnósticos inteligentes y creación de transacciones en lenguaje natural',
    categoryBadge: 'Inteligencia Artificial',
    targetTab: 'asesor',
    targetSelector: '#advisor-chat-container',
    spotlightTitle: 'Chat del Asesor Inteligente con IA',
    iconName: 'Sparkles',
    description: 'Tu asistente financiero personal impulsado por Google Gemini analiza tus hábitos de gasto, detecta fugas de capital y te permite registrar movimientos escribiendo texto natural.',
    highlights: [
      'Diagnóstico Instantáneo: Evaluación de tu tasa de ahorro, gastos hormiga y estructura presupuestaria.',
      'Comandos de Lenguaje Natural: Escribe "Ayer cené con amigos por 35€ en efectivo" y se registrará automáticamente.',
      'Privacidad Garantizada: Los datos se procesan de forma segura sin almacenamiento de terceros.',
    ],
    roleTips: {
      admin: 'Consultas ilimitadas y análisis estratégicos avanzados.',
      manager: 'Acceso a diagnósticos completos y registro mediante IA.',
      member: 'Consultas de optimización y creación de movimientos.',
      viewer: 'Consultas informativas y diagnósticos de lectura.',
      dependent: 'Consultas básicas de educación financiera y consejos de ahorro.',
      custom: 'Sujeto al permiso "canUseAiAdvisor".',
    },
    actionLabel: 'Consultar Asesor IA',
    visualPreviewType: 'advisor',
  },
  {
    id: 'rbac',
    title: 'Multiusuario & Roles (RBAC)',
    subtitle: 'Colaboración familiar o de equipo con permisos granulares',
    categoryBadge: 'Control de Acceso',
    targetTab: 'ajustes',
    targetSelector: '#settings-user-roles-card',
    spotlightTitle: 'Gestión Multiusuario & Roles (RBAC)',
    iconName: 'Users',
    description: 'FinanTrack permite que múltiples personas utilicen la misma aplicación con perfiles y niveles de acceso diferenciados mediante el selector de usuario en la cabecera.',
    highlights: [
      'Selector Rápido: Cambia de usuario con un clic desde el avatar en la parte superior derecha.',
      '6 Roles Predefinidos: Administrador, Gestor, Miembro, Auditor, Dependiente y Personalizado.',
      '19 Permisos Granulares: Controla quién puede crear transacciones, ver patrimonio, borrar registros o exportar datos.',
    ],
    roleTips: {
      admin: 'Puedes invitar usuarios, cambiar roles y editar la matriz de permisos.',
      manager: 'Puedes visualizar a los miembros del equipo.',
      member: 'Puedes consultar tu perfil y permisos asignados.',
      viewer: 'Puedes ver tu rol asignado de lectura.',
      dependent: 'Tu perfil tiene acceso restringido adecuado a tu rol.',
      custom: 'Tus permisos han sido ajustados de forma personalizada.',
    },
    actionLabel: 'Ver Gestión de Usuarios',
    visualPreviewType: 'rbac',
  },
  {
    id: 'audit',
    title: 'Historial de Auditoría & Seguridad',
    subtitle: 'Trazabilidad total de cambios y protección por PIN / Modo Espía',
    categoryBadge: 'Seguridad & Auditoría',
    targetTab: 'historial',
    targetSelector: '#audit-history-header',
    spotlightTitle: 'Historial Inmutable de Auditoría',
    iconName: 'Shield',
    description: 'Cada acción en el sistema queda registrada en una bitácora inmutable que indica qué usuario realizó el cambio, cuándo y qué valores se modificaron. Además, puedes proteger la app con PIN de 4 dígitos.',
    highlights: [
      'Bitácora de Auditoría: Registro detallado de creaciones, ediciones, eliminaciones y transferencias.',
      'Modo Espía: Oculta los importes monetarios con desenfoque para usar la app en lugares públicos.',
      'Bloqueo con PIN: Protección por tiempo de inactividad para compartir dispositivos de forma segura.',
    ],
    roleTips: {
      admin: 'Acceso total a la auditoría, exportación y vaciado de registros.',
      manager: 'Consulta y filtrado de la bitácora de auditoría.',
      member: 'Consulta del historial de movimientos.',
      viewer: 'Lectura de auditoría para fines contables y de control.',
      dependent: 'Registro de tus acciones en la auditoría sin acceso a configuración de seguridad.',
      custom: 'Sujeto al permiso "canViewAuditLog".',
    },
    actionLabel: 'Ver Historial & Auditoría',
    visualPreviewType: 'audit',
  },
  {
    id: 'manual',
    title: 'Manual de Usuario & Centro de Ayuda',
    subtitle: 'Toda la documentación, glosario y guías a tu alcance',
    categoryBadge: 'Documentación',
    targetTab: 'manual',
    targetSelector: '#manual-hero-header',
    spotlightTitle: 'Documentación Completa & Glosario',
    iconName: 'BookOpen',
    description: 'En cualquier momento puedes consultar el manual completo con explicaciones detalladas de cada sección, matriz comparativa de roles, preguntas frecuentes y glosario contable.',
    highlights: [
      'Filtro interactivo para consultar el manual adaptado a tu rol actual.',
      'Buscador en tiempo real por palabras clave o conceptos financieros.',
      'Posibilidad de relanzar este tour interactivo cuando lo desees desde el menú superior.',
    ],
    roleTips: {
      admin: 'Guía completa con especificaciones técnicas y de administración.',
      manager: 'Guía operativa de gestión contable y presupuestaria.',
      member: 'Guía práctica para el día a día y ahorro.',
      viewer: 'Guía de interpretación de reportes y métricas.',
      dependent: 'Guía sencilla para registro de gastos y metas.',
      custom: 'Guía completa adaptada.',
    },
    actionLabel: 'Ir al Manual Completo',
    visualPreviewType: 'manual',
  },
];

export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'intro-primeros-pasos',
    title: '1. Introducción, Filosofía & Primeros Pasos',
    shortTitle: 'Primeros Pasos',
    category: 'getting_started',
    badge: 'Básico',
    summary: 'Aprende los conceptos fundamentales de FinanTrack, la privacidad local, configuración de divisa y primeros ajustes.',
    targetTab: 'resumen',
    iconName: 'Compass',
    targetRoles: 'all',
    keywords: ['inicio', 'primeros pasos', 'configuracion', 'divisa', 'privacidad', 'offline', 'bienvenida'],
    content: {
      overview: 'FinanTrack es un sistema de finanzas personales y familiares enfocado en la simplicidad, la privacidad y el rigor contable. No requiere vincular credenciales bancarias externas ni exponer contraseñas a servidores de terceros: todos los datos residen de forma segura en tu navegador con persistencia local y soporte de copias de seguridad en JSON.',
      keyFeatures: [
        {
          title: 'Arquitectura Privada y Offline-First',
          description: 'La aplicación funciona de forma autónoma sin enviar tus finanzas a bases de datos de terceros. Los cálculos, balances y proyecciones se efectúan en tu propio dispositivo.',
        },
        {
          title: 'Configuración Inicial Recomendada',
          description: 'Al iniciar, define tu divisa preferida (€, $, £, etc.) en Ajustes, crea tus cuentas bancarias principales y establece los presupuestos del mes en curso.',
        },
        {
          title: 'Soporte Multiusuario Inmediato',
          description: 'Puedes alternar entre usuarios desde el selector superior para asignar gastos familiares o de equipo con diferentes niveles de acceso.',
        },
      ],
      howToUse: [
        {
          step: 1,
          instruction: 'Ve a la sección "Patrimonio" y crea tus cuentas iniciales (por ejemplo, "Cuenta Corriente Banco", "Billetera Efectivo").',
          tip: 'Introduce el saldo real actual de cada cuenta para que los balances concuerden desde el primer día.',
        },
        {
          step: 2,
          instruction: 'Dirígete a "Presupuestos" y asigna un techo de gasto mensual a tus categorías principales (Comida, Vivienda, Transporte, etc.).',
          tip: 'Utiliza la referencia de la regla 50/30/20 mostrada en pantalla.',
        },
        {
          step: 3,
          instruction: 'Registra tus primeros movimientos pulsando el botón "+ Nuevo" o interactúa con el Asesor IA en lenguaje natural.',
        },
      ],
      rolePermissionsSummary: [
        {
          role: 'admin',
          roleName: 'Administrador',
          canDo: ['Configurar divisa global', 'Gestionar miembros y roles', 'Realizar copias de seguridad completas'],
          cannotDo: [],
        },
        {
          role: 'manager',
          roleName: 'Gestor Financiero',
          canDo: ['Configurar cuentas y saldos', 'Crear presupuestos y categorías'],
          cannotDo: ['Gestionar miembros ni alterar matriz de permisos'],
        },
        {
          role: 'member',
          roleName: 'Miembro',
          canDo: ['Registrar ingresos y gastos', 'Consultar balances y metas'],
          cannotDo: ['Modificar configuración del sistema ni PIN de bloqueo'],
        },
      ],
      bestPractices: [
        'Realiza una copia de seguridad JSON al menos una vez al mes desde la pestaña Ajustes.',
        'Activa el Bloqueo por PIN si compartes tu ordenador o tablet con otras personas.',
      ],
      faq: [
        {
          q: '¿Dónde se guardan mis transacciones y datos bancarios?',
          a: 'Todos los datos se almacenan localmente en el almacenamiento seguro de tu navegador (LocalStorage). Ningún dato bancario se envía a servidores externos.',
        },
      ],
    },
  },
  {
    id: 'panel-resumen-dashboard',
    title: '2. Panel de Resumen (Dashboard Principal)',
    shortTitle: 'Panel de Resumen',
    category: 'getting_started',
    badge: 'Vista Principal',
    summary: 'Conoce cómo interpretar el balance mensual, las tarjetas de métricas, el flujo de caja y la tasa de ahorro.',
    targetTab: 'resumen',
    iconName: 'LayoutDashboard',
    targetRoles: 'all',
    keywords: ['resumen', 'dashboard', 'balance', 'ingresos', 'gastos', 'tasa de ahorro', 'flujo de caja', 'metricas'],
    content: {
      overview: 'El Panel de Resumen es el corazón analítico del día a día. Te proporciona una fotografía instantánea del mes en curso: cuánto has ingresado, cuánto has gastado, cuál es tu balance neto y cuánto estás ahorrando en relación con tus ingresos.',
      keyFeatures: [
        {
          title: 'Tarjetas de Balance Mensual',
          description: 'Muestra Total Ingresos, Total Gastos y Balance Neto (Ingresos - Gastos). Los indicadores de color señalan si el mes actual es superavitario (verde) o deficitario (rojo).',
        },
        {
          title: 'Tasa de Ahorro en Tiempo Real',
          description: 'Calcula el porcentaje de tus ingresos que no ha sido consumido por los gastos: Tasa = ((Ingresos - Gastos) / Ingresos) × 100.',
        },
        {
          title: 'Distribución de Gastos por Categorías',
          description: 'Gráfico visual de donut y barras que clasifica tus gastos por volumen para que identifiques de inmediato dónde se va tu dinero.',
        },
        {
          title: 'Selector de Periodo',
          description: 'Te permite alternar entre el mes actual, meses anteriores o consultar históricos.',
        },
      ],
      howToUse: [
        {
          step: 1,
          instruction: 'Usa las flechas del selector de mes en la cabecera para comparar el rendimiento de meses anteriores.',
        },
        {
          step: 2,
          instruction: 'Haz clic en cualquier categoría del gráfico de distribución para filtrar las transacciones de esa categoría.',
        },
        {
          step: 3,
          instruction: 'Revisa las alertas de presupuesto activas en la tarjeta lateral para anticipar excesos de gasto.',
        },
      ],
      rolePermissionsSummary: [
        {
          role: 'admin',
          roleName: 'Administrador',
          canDo: ['Ver todas las métricas, tarjetas globales y desgloses'],
          cannotDo: [],
        },
        {
          role: 'dependent',
          roleName: 'Dependiente',
          canDo: ['Ver gastos propios y progreso de metas individuales'],
          cannotDo: ['Ver el patrimonio global ni las cuentas bancarias maestras'],
        },
      ],
      bestPractices: [
        'Apunta a una Tasa de Ahorro superior al 20% mensual para construir estabilidad financiera.',
        'Usa el Modo Espía (icono de ojo en cabecera) si necesitas revisar el dashboard en público.',
      ],
    },
  },
  {
    id: 'movimientos-transacciones',
    title: '3. Gestión de Movimientos & Transacciones',
    shortTitle: 'Movimientos',
    category: 'core_operations',
    badge: 'Operativa',
    summary: 'Registro, edición, filtrado, transacciones recurrentes, transferencias entre cuentas y plantillas rápidas.',
    targetTab: 'movimientos',
    iconName: 'ArrowLeftRight',
    targetRoles: 'all',
    keywords: ['transacciones', 'movimientos', 'gastos', 'ingresos', 'transferencias', 'recurrentes', 'plantillas', 'exportar csv'],
    content: {
      overview: 'El módulo de Movimientos recopila el libro diario de todas tus operaciones contables. Permite registrar gastos, ingresos y transferencias, categorizarlos con precisión y realizar búsquedas complejas.',
      keyFeatures: [
        {
          title: 'Tres Tipos de Movimientos',
          description: '1. Gasto (resta saldo a la cuenta y suma al presupuesto); 2. Ingreso (suma saldo a la cuenta y al balance mensual); 3. Transferencia (traspasa saldo entre dos cuentas sin afectar ingresos ni gastos netos).',
        },
        {
          title: 'Transacciones Recurrentes (Suscripciones & Recibos)',
          description: 'Automatiza pagos periódicos (mensual, quincenal, anual) con avisos de vencimiento próximo para nóminas, hipotecas, alquiler o suscripciones.',
        },
        {
          title: 'Plantillas Rápidas con 1 Toque',
          description: 'Crea plantillas para gastos repetitivos (por ejemplo, "Café Mañanero 1.80€", "Gasolina 50€") para registrar con un solo clic.',
        },
        {
          title: 'Filtros y Búsqueda Avanzada',
          description: 'Filtra por tipo, categoría, cuenta bancaria, fecha, importe o usuario autor.',
        },
      ],
      howToUse: [
        {
          step: 1,
          instruction: 'Pulsa el botón "+ Nuevo" en cualquier pantalla o la tecla de acceso rápido.',
        },
        {
          step: 2,
          instruction: 'Selecciona el tipo (Gasto, Ingreso o Transferencia), introduce el importe y selecciona la categoría.',
        },
        {
          step: 3,
          instruction: 'Opcionalmente añade una nota, beneficiario, etiquetas o marca como recurrente.',
        },
        {
          step: 4,
          instruction: 'Pulsa "Registrar" para guardar la transacción.',
        },
      ],
      rolePermissionsSummary: [
        {
          role: 'admin',
          roleName: 'Administrador',
          canDo: ['Crear, editar y eliminar cualquier transacción', 'Exportar a CSV/Excel'],
          cannotDo: [],
        },
        {
          role: 'member',
          roleName: 'Miembro',
          canDo: ['Registrar nuevos movimientos', 'Editar sus propios movimientos recientes'],
          cannotDo: ['Eliminar movimientos bloqueados por auditoría sin permiso'],
        },
        {
          role: 'viewer',
          roleName: 'Auditor / Lector',
          canDo: ['Consultar y filtrar todas las transacciones', 'Exportar reportes'],
          cannotDo: ['Crear, editar o eliminar ninguna transacción'],
        },
      ],
      bestPractices: [
        'Registra los gastos en el mismo instante en que se producen para evitar olvidos.',
        'Asigna siempre la cuenta correcta para que tus saldos coincidan con los de tu banco.',
      ],
    },
  },
  {
    id: 'presupuestos-regla-50-30-20',
    title: '4. Presupuestos Mensuales & Regla 50/30/20',
    shortTitle: 'Presupuestos',
    category: 'planning',
    badge: 'Estrategia',
    summary: 'Aprende a planificar techos de gasto, interpretar el semáforo de advertencias y utilizar la regla 50/30/20.',
    targetTab: 'presupuestos',
    iconName: 'PieChart',
    targetRoles: ['admin', 'manager', 'member', 'viewer'],
    keywords: ['presupuestos', '50 30 20', 'limite de gasto', 'alertas', 'ahorro extremo', 'necesidades', 'deseos'],
    content: {
      overview: 'Un presupuesto no es una restricción, sino una herramienta para dar a cada euro un propósito antes de que empiece el mes. FinanTrack te ayuda a distribuir tus ingresos de forma inteligente aplicando la conocida regla 50/30/20.',
      keyFeatures: [
        {
          title: 'Regla 50/30/20 Integrada',
          description: '50% para Necesidades (vivienda, comida, suministros, salud); 30% para Deseos (ocio, restaurantes, viajes, caprichos); 20% para Ahorro & Inversión (fondo de emergencia, amortizaciones, metas).',
        },
        {
          title: 'Semáforo de Advertencia Proactiva',
          description: 'Verde: Gasto inferior al 80% del presupuesto; Ámbar: Gasto entre el 80% y 99%; Rojo: Presupuesto excedido al 100%+ con cálculo de exceso monetario.',
        },
        {
          title: 'Modo de Ahorro Extremo',
          description: 'Función en Ajustes que reduce temporalmente los techos de categorías de ocio para afrontar imprevistos o acelerar metas de ahorro prioritarias.',
        },
      ],
      howToUse: [
        {
          step: 1,
          instruction: 'En la vista de Presupuestos, haz clic en "+ Crear Presupuesto" o en el lápiz de cualquier categoría.',
        },
        {
          step: 2,
          instruction: 'Introduce el límite mensual deseado en euros y clasifica si pertenece a Necesidades o Deseos.',
        },
        {
          step: 3,
          instruction: 'Revisa las barras de progreso a lo largo del mes para moderar tus gastos antes de alcanzar el límite.',
        },
      ],
      rolePermissionsSummary: [
        {
          role: 'admin',
          roleName: 'Administrador',
          canDo: ['Crear, editar y eliminar presupuestos de cualquier categoría'],
          cannotDo: [],
        },
        {
          role: 'manager',
          roleName: 'Gestor Financiero',
          canDo: ['Ajustar techos y límites presupuestarios'],
          cannotDo: [],
        },
        {
          role: 'member',
          roleName: 'Miembro',
          canDo: ['Ver el estado de los presupuestos y su consumo en tiempo real'],
          cannotDo: ['Modificar techos presupuestarios si no tiene permiso especial'],
        },
      ],
    },
  },
  {
    id: 'patrimonio-cuentas-bancarias',
    title: '5. Patrimonio Neto & Cuentas Bancarias',
    shortTitle: 'Patrimonio',
    category: 'planning',
    badge: 'Finanzas Globales',
    summary: 'Gestión de cuentas corrientes, efectivo, inversiones, pasivos/deudas y conciliación de saldos.',
    targetTab: 'patrimonio',
    iconName: 'Landmark',
    targetRoles: ['admin', 'manager', 'viewer'],
    keywords: ['patrimonio', 'patrimonio neto', 'cuentas', 'bancos', 'efectivo', 'inversiones', 'deudas', 'pasivos', 'conciliacion'],
    content: {
      overview: 'El Patrimonio Neto es el indicador más fiel de tu verdadera riqueza financiera. Representa el valor monetario resultante de sumar todo lo que posees (activos) y restar todo lo que debes (pasivos/deudas).',
      keyFeatures: [
        {
          title: 'Tipos de Cuentas Soportadas',
          description: 'Cuenta Bancaria Corriente, Hucha de Efectivo, Cuenta de Ahorro remunerada, Cartera de Inversión (fondos, acciones) y Tarjeta de Crédito / Préstamo (pasivo).',
        },
        {
          title: 'Cálculo Automatizado de Patrimonio Neto',
          description: 'Patrimonio Neto = (Bancos + Efectivo + Ahorros + Inversiones) - Deudas y Créditos.',
        },
        {
          title: 'Conciliación Rápida de Saldos',
          description: 'Ajusta el saldo real de una cuenta en cualquier momento con un clic en "Ajustar Saldo", registrando el ajuste en el historial de auditoría.',
        },
      ],
      howToUse: [
        {
          step: 1,
          instruction: 'Haz clic en "+ Nueva Cuenta" para añadir una entidad bancaria o fondo.',
        },
        {
          step: 2,
          instruction: 'Selecciona el tipo de cuenta, divisa, saldo inicial, color e icono representativo.',
        },
        {
          step: 3,
          instruction: 'Al registrar transacciones o transferencias, selecciona la cuenta para que el saldo se actualice en tiempo real.',
        },
      ],
      rolePermissionsSummary: [
        {
          role: 'admin',
          roleName: 'Administrador',
          canDo: ['Crear, editar, ocultar y eliminar cuentas bancarias', 'Ver patrimonio total'],
          cannotDo: [],
        },
        {
          role: 'dependent',
          roleName: 'Dependiente',
          canDo: [],
          cannotDo: ['Ver cuentas bancarias familiares ni consultar patrimonio total'],
        },
      ],
    },
  },
  {
    id: 'metas-interes-compuesto',
    title: '6. Metas de Ahorro & Simulador de Interés Compuesto',
    shortTitle: 'Metas de Ahorro',
    category: 'planning',
    badge: 'Ahorro',
    summary: 'Crea huchas para objetivos, realiza aportaciones directas y simula el crecimiento con interés compuesto.',
    targetTab: 'metas',
    iconName: 'Target',
    targetRoles: 'all',
    keywords: ['metas', 'ahorro', 'huchas', 'interes compuesto', 'simulador', 'objetivos', 'inversion'],
    content: {
      overview: 'Las metas de ahorro te permiten separar fondos para propósitos específicos (comprar un coche, fondo para emergencias de 6 meses, viajes, etc.) sin mezclarlos con el dinero del día a día.',
      keyFeatures: [
        {
          title: 'Huchas de Ahorro Visuales',
          description: 'Cada meta tiene importe objetivo, importe acumulado, porcentaje de cumplimiento y fecha estimada.',
        },
        {
          title: 'Aportaciones Directas',
          description: 'Aporta dinero a una meta desde cualquier cuenta bancaria pulsando el botón "+ Aportar".',
        },
        {
          title: 'Simulador de Interés Compuesto',
          description: 'Calculadora interactiva que modela el crecimiento de un capital inicial con aportaciones mensuales e interés anual a lo largo de 5, 10, 20 o 30 años.',
        },
      ],
      howToUse: [
        {
          step: 1,
          instruction: 'En la sección "Metas", haz clic en "+ Nueva Meta".',
        },
        {
          step: 2,
          instruction: 'Define el nombre del objetivo, la cantidad deseada y la fecha límite recomendada.',
        },
        {
          step: 3,
          instruction: 'Pulsa "+ Aportar" cada vez que transfieras fondos a la hucha para ver avanzar tu porcentaje.',
        },
      ],
      rolePermissionsSummary: [
        {
          role: 'admin',
          roleName: 'Administrador',
          canDo: ['Crear, editar y eliminar metas', 'Aportar y retirar fondos'],
          cannotDo: [],
        },
        {
          role: 'member',
          roleName: 'Miembro',
          canDo: ['Aportar a metas existentes', 'Crear metas personales'],
          cannotDo: [],
        },
      ],
    },
  },
  {
    id: 'analisis-estadisticas-graficos',
    title: '7. Análisis Estadístico & Métricas Avanzadas',
    shortTitle: 'Análisis',
    category: 'analytics',
    badge: 'Métricas',
    summary: 'Evolución histórica, gráficos de tendencia, comparativa intermensual y distribución de gastos.',
    targetTab: 'analisis',
    iconName: 'BarChart3',
    targetRoles: ['admin', 'manager', 'member', 'viewer'],
    keywords: ['analisis', 'estadisticas', 'graficos', 'historico', 'tendencias', 'comparativa', 'evolucion'],
    content: {
      overview: 'La sección de Análisis transforma tus números diarios en gráficos interactivos para entender tus patrones financieros a medio y largo plazo.',
      keyFeatures: [
        {
          title: 'Evolución de Ingresos vs Gastos',
          description: 'Gráfico de barras e histórico mensual que muestra si tu brecha de ahorro se está ampliando o reduciendo con el tiempo.',
        },
        {
          title: 'Análisis de Concentración de Gasto (Pareto)',
          description: 'Identifica qué 2 o 3 categorías concentran más del 70% de tus salidas de capital.',
        },
        {
          title: 'Historial de Tasa de Ahorro',
          description: 'Monitorea la consistencia de tu capacidad de ahorro a lo largo de los últimos 6 y 12 meses.',
        },
      ],
      howToUse: [
        {
          step: 1,
          instruction: 'Selecciona el rango de tiempo (Últimos 3 meses, 6 meses, Año actual, Histórico completo).',
        },
        {
          step: 2,
          instruction: 'Pasa el cursor sobre los gráficos para ver el detalle exacto de cada mes.',
        },
      ],
      rolePermissionsSummary: [
        {
          role: 'admin',
          roleName: 'Administrador',
          canDo: ['Acceso a todas las métricas y comparativas'],
          cannotDo: [],
        },
        {
          role: 'viewer',
          roleName: 'Auditor / Lector',
          canDo: ['Acceso completo a visualizaciones analíticas'],
          cannotDo: [],
        },
      ],
    },
  },
  {
    id: 'historial-auditoria-trazabilidad',
    title: '8. Historial de Auditoría & Trazabilidad (Audit Log)',
    shortTitle: 'Historial de Auditoría',
    category: 'users_roles',
    badge: 'Trazabilidad',
    summary: 'Registro cronológico inmutable de todas las acciones del sistema, filtros de severidad y exportación.',
    targetTab: 'historial',
    iconName: 'History',
    targetRoles: ['admin', 'manager', 'viewer'],
    keywords: ['historial', 'auditoria', 'audit log', 'trazabilidad', 'quien hizo que', 'seguridad', 'registro de cambios'],
    content: {
      overview: 'El módulo de Historial de Auditoría garantiza la transparencia y fiabilidad de las finanzas en entornos multiusuario. Cada creación, edición, eliminación de transacciones o cambio de ajustes queda registrado con fecha, hora, autor y detalle del cambio.',
      keyFeatures: [
        {
          title: 'Registro Inmutable de Eventos',
          description: 'Captura el ID del usuario, rol, acción efectuada, categoría contable y detalles antes/después.',
        },
        {
          title: 'Niveles de Severidad y Filtros',
          description: 'Clasificación por colores (Informativo, Éxito, Advertencia, Peligro) con búsqueda por texto libre y selector de usuario.',
        },
        {
          title: 'Exportación de Bitácora',
          description: 'Descarga el historial completo en formato CSV o JSON para auditorías contables formales.',
        },
      ],
      howToUse: [
        {
          step: 1,
          instruction: 'Accede a la pestaña "Historial" en el menú de navegación.',
        },
        {
          step: 2,
          instruction: 'Usa la barra de búsqueda y los filtros por usuario o severidad para localizar eventos específicos.',
        },
        {
          step: 3,
          instruction: 'Haz clic en cualquier evento para desplegar el desglose técnico de valores anteriores y nuevos.',
        },
      ],
      rolePermissionsSummary: [
        {
          role: 'admin',
          roleName: 'Administrador',
          canDo: ['Ver auditoría completa', 'Exportar bitácora en CSV/JSON', 'Vaciar historial de eventos'],
          cannotDo: [],
        },
        {
          role: 'manager',
          roleName: 'Gestor Financiero',
          canDo: ['Ver y filtrar eventos de auditoría'],
          cannotDo: ['Vaciar el historial de eventos'],
        },
        {
          role: 'viewer',
          roleName: 'Auditor / Lector',
          canDo: ['Consultar bitácora con fines de auditoría externa'],
          cannotDo: ['Modificar o vaciar registros'],
        },
      ],
    },
  },
  {
    id: 'reportes-impresion-pdf',
    title: '9. Reportes Financieros & Exportación PDF',
    shortTitle: 'Reportes PDF',
    category: 'analytics',
    badge: 'Informes',
    summary: 'Generación de informes formales limpios, optimizados para impresión A4 o guardado en formato PDF.',
    targetTab: 'reportes',
    iconName: 'Printer',
    targetRoles: ['admin', 'manager', 'viewer'],
    keywords: ['reportes', 'pdf', 'imprimir', 'informes', 'extracto', 'balance imprimible', 'documento'],
    content: {
      overview: 'La vista de Reportes genera un documento formal y elegante diseñado específicamente para su visualización limpia en papel o exportación a PDF mediante la función de impresión del navegador.',
      keyFeatures: [
        {
          title: 'Diseño Optimizado para Impresión A4',
          description: 'Elimina botones y elementos superfluos para generar un resumen ejecutivo legible y profesional.',
        },
        {
          title: 'Contenido del Informe Mensual',
          description: 'Balance consolidado, desglose de ingresos y gastos por categoría, estado de presupuestos, lista de transacciones del periodo y progreso de metas.',
        },
        {
          title: 'Botón Directo "Imprimir / Guardar como PDF"',
          description: 'Invoca el cuadro de diálogo de impresión con estilos CSS `@media print` preconfigurados.',
        },
      ],
      howToUse: [
        {
          step: 1,
          instruction: 'Accede a la pestaña "Reportes PDF" desde el menú Más.',
        },
        {
          step: 2,
          instruction: 'Selecciona el mes que deseas auditar o imprimir.',
        },
        {
          step: 3,
          instruction: 'Pulsa el botón "Imprimir Reporte" y selecciona "Guardar como PDF" en el destino de tu navegador.',
        },
      ],
      rolePermissionsSummary: [
        {
          role: 'admin',
          roleName: 'Administrador',
          canDo: ['Generar e imprimir reportes de cualquier periodo'],
          cannotDo: [],
        },
        {
          role: 'viewer',
          roleName: 'Auditor / Lector',
          canDo: ['Generar y descargar informes PDF'],
          cannotDo: [],
        },
      ],
    },
  },
  {
    id: 'asesor-inteligencia-artificial',
    title: '10. Asesor Financiero con Inteligencia Artificial (Gemini)',
    shortTitle: 'Asesor IA',
    category: 'analytics',
    badge: 'Gemini AI',
    summary: 'Diagnósticos inteligentes en tiempo real, detección de fugas y registro de transacciones en lenguaje natural.',
    targetTab: 'asesor',
    iconName: 'Sparkles',
    targetRoles: 'all',
    keywords: ['asesor', 'inteligencia artificial', 'ia', 'gemini', 'diagnostico', 'lenguaje natural', 'consejos', 'ahorro'],
    content: {
      overview: 'El Asesor Financiero IA utiliza la tecnología de Google Gemini para actuar como tu consultor contable de cabecera. Analiza tus datos numéricos y te proporciona explicaciones humanas, planes de ahorro y automatización de registros.',
      keyFeatures: [
        {
          title: 'Diagnóstico Financiero 360°',
          description: 'Evalúa tu tasa de ahorro, solvencia, cumplimiento presupuestario y riesgo de sobregasto.',
        },
        {
          title: 'Creación de Transacciones en Lenguaje Natural',
          description: 'Escribe cosas como "Ayer pagué 45€ en el supermercado Mercadona con tarjeta" y el Asesor preparará el formulario de movimiento con los campos ya completados.',
        },
        {
          title: 'Detección de Fugas & Gastos Hormiga',
          description: 'Identifica suscripciones infrautilizadas, excesos recurrentes en ocio o categorías con desviación anormal.',
        },
      ],
      howToUse: [
        {
          step: 1,
          instruction: 'Abre la pestaña "Asesor IA" en la barra de navegación.',
        },
        {
          step: 2,
          instruction: 'Pulsa uno de los prompts rápidos (ej. "¿Cómo puedo ahorrar 200€ más este mes?") o escribe tu propia duda en el chat.',
        },
        {
          step: 3,
          instruction: 'Para crear un movimiento por voz o texto, escribe el gasto y pulsa "Registrar Movimiento Sugerido".',
        },
      ],
      rolePermissionsSummary: [
        {
          role: 'admin',
          roleName: 'Administrador',
          canDo: ['Consultas estratégicas completas y diagnósticos integrales'],
          cannotDo: [],
        },
        {
          role: 'member',
          roleName: 'Miembro',
          canDo: ['Consultas de optimización y registro rápido con IA'],
          cannotDo: [],
        },
      ],
    },
  },
  {
    id: 'multiusuario-roles-rbac',
    title: '11. Sistema Multiusuario & Matriz de Roles (RBAC)',
    shortTitle: 'Multiusuario & Roles',
    category: 'users_roles',
    badge: 'RBAC',
    summary: 'Administración de miembros, selector rápido en cabecera, definición de los 6 roles y matriz de 19 permisos.',
    targetTab: 'ajustes',
    iconName: 'Users',
    targetRoles: 'all',
    keywords: ['multiusuario', 'roles', 'rbac', 'permisos', 'admin', 'gestor', 'miembro', 'auditor', 'dependiente', 'usuarios'],
    content: {
      overview: 'FinanTrack incorpora un sistema completo de Control de Acceso Basado en Roles (Role-Based Access Control). Permite que familias, parejas o equipos de trabajo compartan el gestor financiero delimitando con precisión qué puede ver y modificar cada miembro.',
      keyFeatures: [
        {
          title: 'Los 6 Roles del Sistema',
          description: '1. Administrador (propietario total); 2. Gestor Financiero (operaciones contables completas); 3. Miembro (registro diario y metas); 4. Auditor / Lector (solo lectura); 5. Familiar / Dependiente (registro restringido sin acceso a patrimonio); 6. Personalizado (ajustes a medida).',
        },
        {
          title: 'Matriz de 19 Permisos Granulares',
          description: 'Abarca creación/edición/borrado de transacciones, visualización de patrimonio, gestión de presupuestos, metas, recurrentes, asesor IA, auditoría y seguridad.',
        },
        {
          title: 'Selector Inmediato de Usuario',
          description: 'Cambia de usuario en 1 clic desde el componente UserSwitcher en la esquina superior derecha.',
        },
      ],
      howToUse: [
        {
          step: 1,
          instruction: 'Para cambiar de usuario activo, haz clic en tu avatar en la cabecera y selecciona otro perfil.',
        },
        {
          step: 2,
          instruction: 'Para gestionar miembros o permisos, ve a Ajustes > "Gestión Multiusuario & Control de Accesos" o pulsa "Gestionar Roles & Permisos".',
        },
        {
          step: 3,
          instruction: 'En la pestaña "Matriz de Permisos" puedes activar o desactivar capacidades para cada rol con guardado inmediato.',
        },
      ],
      rolePermissionsSummary: [
        {
          role: 'admin',
          roleName: 'Administrador',
          canDo: ['Crear y eliminar usuarios', 'Modificar roles', 'Alterar la matriz global de permisos'],
          cannotDo: [],
        },
        {
          role: 'manager',
          roleName: 'Gestor Financiero',
          canDo: ['Ver miembros del sistema'],
          cannotDo: ['Cambiar roles de otros usuarios ni editar la matriz de permisos'],
        },
      ],
    },
  },
  {
    id: 'seguridad-pin-modo-espia',
    title: '12. Seguridad, PIN de Bloqueo & Modo Espía',
    shortTitle: 'Seguridad & PIN',
    category: 'security_system',
    badge: 'Seguridad',
    summary: 'Protege tu información confidencial mediante PIN de 4 dígitos, bloqueo automático por inactividad y Modo Espía.',
    targetTab: 'ajustes',
    iconName: 'Shield',
    targetRoles: ['admin', 'manager'],
    keywords: ['seguridad', 'pin', 'bloqueo', 'modo espia', 'privacidad', 'inactividad', 'copias de seguridad'],
    content: {
      overview: 'La privacidad financiera es primordial. FinanTrack ofrece capas de protección física para cuando usas tu dispositivo en presencia de otras personas, en transporte público o en ordenadores compartidos.',
      keyFeatures: [
        {
          title: 'Bloqueo por PIN de 4 Dígitos',
          description: 'Establece un código numérico personal. Al activarse, la pantalla se bloquea inmediatamente exigiendo el PIN para continuar.',
        },
        {
          title: 'Temporizador de Bloqueo por Inactividad',
          description: 'Configura el bloqueo automático tras 1, 3, 5 o 10 minutos de inactividad sin pulsar ninguna tecla ni mover el ratón.',
        },
        {
          title: 'Modo Espía (Ocultamiento de Cifras)',
          description: 'Pulsa el icono de ojo en la cabecera o el atajo de teclado para desenfocar y ocultar todos los importes monetarios de la interfaz.',
        },
        {
          title: 'Copias de Seguridad en JSON',
          description: 'Exporta toda tu base de datos (usuarios, transacciones, cuentas, presupuestos, historial) en un archivo cifrable y restáuralo cuando quieras.',
        },
      ],
      howToUse: [
        {
          step: 1,
          instruction: 'Ve a Ajustes > "Seguridad & Bloqueo por PIN".',
        },
        {
          step: 2,
          instruction: 'Activa el interruptor "Bloqueo por PIN", introduce tu código de 4 dígitos y selecciona el tiempo de auto-bloqueo.',
        },
        {
          step: 3,
          instruction: 'Para probarlo, pulsa "Bloquear Ahora" o el icono de candado en la barra superior.',
        },
      ],
      rolePermissionsSummary: [
        {
          role: 'admin',
          roleName: 'Administrador',
          canDo: ['Configurar y cambiar el PIN de seguridad', 'Exportar e importar copias JSON completas'],
          cannotDo: [],
        },
        {
          role: 'member',
          roleName: 'Miembro',
          canDo: ['Desbloquear la app con el PIN conocido', 'Usar el Modo Espía'],
          cannotDo: ['Cambiar el PIN de seguridad del sistema'],
        },
      ],
    },
  },
];

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: 'Patrimonio Neto',
    definition: 'Valor monetario total que resulta de restar todas las deudas y obligaciones financieras (pasivos) del valor total de los bienes y cuentas bancarias (activos).',
    category: 'contabilidad',
    example: 'Si tienes 15.000€ en el banco y 5.000€ en inversiones, pero debes 4.000€ de tarjeta, tu patrimonio neto es 16.000€.',
  },
  {
    term: 'Tasa de Ahorro',
    definition: 'Porcentaje de los ingresos totales percibidos en un periodo que no se gasta y se destina a acumulación de capital, fondos de emergencia o inversiones.',
    category: 'ahorro',
    example: 'Si ingresas 2.000€ al mes y gastas 1.500€, tu ahorro es 500€ y tu Tasa de Ahorro es del 25%.',
  },
  {
    term: 'Regla 50/30/20',
    definition: 'Método presupuestario propuesto por Elizabeth Warren que sugiere destinar el 50% de los ingresos a Necesidades básicas, 30% a Deseos/Ocio y 20% a Ahorro/Deuda.',
    category: 'ahorro',
    example: 'Para 2.000€ de sueldo neto: 1.000€ en alquiler y comida, 600€ en ocio y 400€ en hucha de ahorro.',
  },
  {
    term: 'Interés Compuesto',
    definition: 'Mecanismo financiero por el cual los intereses generados por una inversión o depósito se suman al capital inicial para generar nuevos intereses en periodos futuros (crecimiento exponencial).',
    category: 'inversion',
    example: 'Invertir 100€/mes al 7% anual genera más de 120.000€ en 30 años gracias a la reinversión de intereses.',
  },
  {
    term: 'Flujo de Caja (Cash Flow)',
    definition: 'Diferencia neta entre las entradas de dinero (ingresos) y las salidas de dinero (gastos) que se producen en un periodo de tiempo determinado.',
    category: 'contabilidad',
    example: 'Un flujo de caja positivo indica que entra más dinero del que sale, permitiendo acumular liquidez.',
  },
  {
    term: 'Transacción Recurrente',
    definition: 'Movimiento de ingreso o gasto que se repite con una frecuencia periódica establecida (mensual, anual, semanal), como alquileres, nóminas o suscripciones a servicios.',
    category: 'contabilidad',
  },
  {
    term: 'Control de Acceso Basado en Roles (RBAC)',
    definition: 'Modelo de seguridad que restringe el acceso y las operaciones del sistema en función del rol asignado a cada usuario (Administrador, Gestor, Miembro, Auditor, Dependiente).',
    category: 'sistema',
  },
  {
    term: 'Modo Espía / Privacidad',
    definition: 'Modo de visualización que aplica un desenfoque visual a todas las cifras numéricas y saldos monetarios de la interfaz para evitar miradas indiscretas.',
    category: 'seguridad',
  },
  {
    term: 'Historial de Auditoría (Audit Log)',
    definition: 'Registro cronológico e inalterable que documenta todas las acciones, creaciones, modificaciones y eliminaciones efectuadas en el sistema por cada usuario.',
    category: 'sistema',
  },
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: '¿Mis datos bancarios y transacciones se envían a algún servidor externo?',
    answer: 'No. FinanTrack está diseñado bajo el principio de privacidad local (Local-First). Toda tu información contable se guarda exclusivamente en el almacenamiento interno de tu navegador (LocalStorage) y nunca se vende ni comparte con terceros.',
    category: 'Privacidad & Almacenamiento',
  },
  {
    question: '¿Qué ocurre si cambio de ordenador o borro los datos del navegador?',
    answer: 'Si borras el historial del navegador podrías perder tus datos locales. Por ello, te recomendamos exportar periódicamente una copia de seguridad JSON desde la sección Ajustes > Copias de Seguridad. Con ese archivo puedes restaurar todo tu estado en cualquier momento y en cualquier dispositivo.',
    category: 'Copias de Seguridad',
  },
  {
    question: '¿Cómo funciona el selector de usuarios y roles (RBAC)?',
    answer: 'En la esquina superior derecha de la cabecera encontrarás el avatar del usuario activo. Al hacer clic puedes cambiar al instante entre perfiles (ej. Administrador, Gestor, Miembro Familiar). Cada perfil tiene permisos específicos para crear, editar o solo consultar información.',
    category: 'Multiusuario & Roles',
  },
  {
    question: '¿Puedo cambiar o personalizar los permisos de un rol?',
    answer: 'Sí. Si eres Administrador, ve a Ajustes > "Gestión Multiusuario & Control de Accesos" y accede a la pestaña "Matriz de Permisos". Allí puedes activar o desactivar cualquiera de los 19 permisos disponibles para cada rol con efecto inmediato.',
    category: 'Multiusuario & Roles',
  },
  {
    question: '¿Cómo utilizo el Asesor IA para crear transacciones con lenguaje natural?',
    answer: 'Abre la pestaña "Asesor IA" y escribe tu movimiento tal como lo dirías a un amigo (ej. "Ayer gasté 42€ en gasolina con la tarjeta del banco"). El modelo Gemini extraerá el importe, la categoría y la fecha, y te presentará un botón para registrar el movimiento en un solo toque.',
    category: 'Inteligencia Artificial',
  },
  {
    question: '¿Qué hago si olvido mi PIN de 4 dígitos de bloqueo?',
    answer: 'Si tienes acceso a los datos de tu navegador, puedes restablecer las credenciales desde la consola o restaurar una copia de seguridad previa. Como medida de seguridad, el PIN solo se almacena en tu dispositivo.',
    category: 'Seguridad',
  },
  {
    question: '¿Cómo genero un informe formal para presentar o imprimir en PDF?',
    answer: 'Ve a la pestaña "Reportes PDF" desde el menú Más, selecciona el mes deseado y pulsa el botón "Imprimir Reporte". En la ventana emergente de impresión de tu navegador, selecciona "Guardar como PDF". El documento está optimizado para formato A4.',
    category: 'Reportes & Exportación',
  },
  {
    question: '¿Cómo puedo volver a ver el Tour Interactivo inicial?',
    answer: 'Puedes relanzar el tour interactivo guiado en cualquier momento pulsando el botón "Tour Interactivo" en la cabecera, desde la vista de Ajustes o desde el Manual de Usuario.',
    category: 'Guía & Ayuda',
  },
];
