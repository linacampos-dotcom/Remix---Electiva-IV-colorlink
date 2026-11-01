/**
 * CORPORATE SERVICE - COLORLINK PINTUCO
 * Motor de datos y lógica empresarial para el Portal de Funcionarios
 * Áreas, Funcionarios, RBAC, Tareas, Muro Social, Inventario, SAC y Auditoría.
 */

import { INVENTARIO_CATALOGO_COMPLETO } from '../data/initialCatalogInventory';

export interface AreaCorporativa {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  liderNombre: string;
  liderCargo: string;
  liderEmail: string;
  activa: boolean;
  modulosHabilitados: string[];
  colorBadge: string;
  empleadosCount: number;
  kpis: { label: string; valor: string; meta: string; tendencia: string }[];
}

export type RolId = 
  | 'superadmin'
  | 'admin_intranet'
  | 'director_gerente'
  | 'jefe_area'
  | 'funcionario'
  | 'logistica_inventarios'
  | 'agente_sac'
  | 'comunicaciones_rrhh';

export interface PermisosRol {
  canManageUsers: boolean;
  canManageAreas: boolean;
  canManageAllTasks: boolean;
  canApproveTasks: boolean;
  canPostOfficialNews: boolean;
  canManageInventory: boolean;
  canManageProducts: boolean;
  canAnswerCustomerTickets: boolean;
  canViewAuditLog: boolean;
  canExportReports: boolean;
  canManageSettings: boolean;
}

export interface RolCorporativo {
  id: RolId;
  nombre: string;
  descripcion: string;
  nivel: number; // 1 = SuperAdmin, 8 = Funcionario
  permisos: PermisosRol;
}

export interface Funcionario {
  id: string;
  avatar: string;
  nombre: string;
  email: string;
  cargo: string;
  areaId: string;
  areaNombre: string;
  rolId: RolId;
  rolNombre: string;
  jefeInmediatoId?: string;
  jefeInmediatoNombre?: string;
  fechaIngreso: string;
  estado: 'Activo' | 'Suspendido' | 'Inactivo';
  ultimoAcceso: string;
  telefono: string;
  tareasAsignadasCount: number;
}

export interface Subtarea {
  id: string;
  texto: string;
  completada: boolean;
}

export interface EvidenciaAdjunta {
  id: string;
  nombre: string;
  tamano: string;
  fecha: string;
  url?: string;
}

export interface ComentarioTarea {
  id: string;
  autorNombre: string;
  autorAvatar: string;
  fecha: string;
  texto: string;
}

export interface TareaLaboral {
  id: string;
  titulo: string;
  descripcion: string;
  areaId: string;
  areaNombre: string;
  creadorNombre: string;
  creadorEmail: string;
  responsableId: string;
  responsableNombre: string;
  responsableEmail: string;
  responsableAvatar: string;
  colaboradores: string[];
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  estado: 'Pendiente' | 'En progreso' | 'Bloqueada' | 'En revisión' | 'Completada' | 'Cancelada';
  fechaCreacion: string;
  fechaInicio?: string;
  fechaLimite: string;
  fechaFinalizacion?: string;
  progresoPct: number;
  motivoBloqueo?: string;
  subtareas: Subtarea[];
  evidencias: EvidenciaAdjunta[];
  comentarios: ComentarioTarea[];
  historial: { id: string; fecha: string; usuario: string; accion: string }[];
  requiereAprobacion: boolean;
  aprobadaPor?: string;
  fechaAprobacion?: string;
  observacionesAprobacion?: string;
}

export interface PublicacionComunidad {
  id: string;
  tipo: 'noticia' | 'comunicado' | 'reconocimiento' | 'logro' | 'seguridad' | 'bienestar' | 'capacitacion';
  titulo: string;
  contenido: string;
  autorNombre: string;
  autorCargo: string;
  autorAvatar: string;
  autorArea: string;
  fecha: string;
  fijado: boolean;
  etiquetas: string[];
  imagenUrl?: string;
  meGusta: number;
  usuariosMeGusta: string[];
  comentarios: { id: string; autorNombre: string; autorAvatar: string; fecha: string; texto: string }[];
  reconocimiento?: {
    destacadoNombre: string;
    destacadoCargo: string;
    destacadoAvatar: string;
    periodo: string;
    motivo: string;
    categoria: 'Empleado del Mes' | 'Equipo Destacado' | 'Innovación' | 'Servicio al Cliente' | 'Calidad y Seguridad';
  };
}

export interface MensajeTicket {
  id: string;
  remitenteTipo: 'cliente' | 'agente' | 'sistema';
  remitenteNombre: string;
  remitenteAvatar?: string;
  texto: string;
  fecha: string;
  esNotaInterna?: boolean;
}

export interface TicketSAC {
  id: string;
  radicado: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  canal: 'Chat Web Público' | 'Formulario PQR' | 'Cotizador Inteligente' | 'WhatsApp Corporativo' | 'Línea 01 8000';
  asunto: string;
  mensaje: string;
  fechaCreacion: string;
  fechaUltimaActividad: string;
  estado: 'Nuevo' | 'En proceso' | 'Pendiente cliente' | 'Resuelto' | 'Cerrado';
  prioridad: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  categoria: 'Asesoría Técnica Pinturas' | 'Cotización B2B / Obra' | 'Certificación NTC 1335' | 'Seguimiento Despacho' | 'Garantía / Reclamación' | 'Información General';
  agenteAsignadoId?: string;
  agenteAsignadoNombre?: string;
  slaHorasLimite: number;
  slaVencido: boolean;
  motivoResolucion?: string;
  mensajes: MensajeTicket[];
}

export interface MovimientoInventario {
  id: string;
  fecha: string;
  tipo: 'Entrada' | 'Salida' | 'Salida por Venta / Despacho' | 'Ajuste Inventario' | 'Traslado Bodega';
  cantidadGalones: number;
  cantidadUnidades?: number;
  motivo: string;
  usuarioNombre: string;
  stockPosterior: number;
  sede?: string;
  sedeId?: string;
  sedeNombre?: string;
  sku?: string;
  varianteNombre?: string;
  numeroOrden?: string;
  numeroFactura?: string;
  lote?: string;
  loteFabricacion?: string;
  clienteNombre?: string;
  detalle?: string;
}

export interface SedeCEDI {
  id: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  badgeColor: string;
  esPrincipal?: boolean;
}

export const SEDES_CEDI_CONFIG: SedeCEDI[] = [
  { id: 'bogota', nombre: 'Bogotá - CEDI Principal', ciudad: 'Bogotá D.C.', direccion: 'Zona Industrial Montevideo, Calle 19 # 68-45', badgeColor: 'bg-blue-100 text-blue-900 border-blue-200', esPrincipal: true },
  { id: 'rionegro', nombre: 'CEDI Rionegro - Planta Principal', ciudad: 'Rionegro / Antioquia', direccion: 'Autopista Medellín - Bogotá Km 34', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200', esPrincipal: true },
  { id: 'medellin', nombre: 'Medellín - CEDI Regional', ciudad: 'Medellín', direccion: 'Carrera 52 # 14-80, Guayabal', badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-200' },
  { id: 'cali', nombre: 'Cali - CEDI Occidente', ciudad: 'Cali', direccion: 'Calle 10 # 32-15, Acopi Yumbo', badgeColor: 'bg-amber-100 text-amber-900 border-amber-200' },
  { id: 'barranquilla', nombre: 'Barranquilla - CEDI Caribe', ciudad: 'Barranquilla', direccion: 'Vía 40 # 73-120, Zona Portuaria', badgeColor: 'bg-orange-100 text-orange-900 border-orange-200' },
  { id: 'bucaramanga', nombre: 'Bucaramanga - CEDI Santander', ciudad: 'Bucaramanga', direccion: 'Parque Industrial Bucaramanga Km 4', badgeColor: 'bg-purple-100 text-purple-900 border-purple-200' },
];

export interface ItemOrdenCompra {
  id: string;
  sku: string;
  productoNombre: string;
  color?: string;
  colorHex?: string;
  presentacion: string;
  cantidadEsperada: number;
  cantidadRecibida?: number;
  loteFabricacion?: string;
  precioUnitarioEstimado?: number;
}

export interface OrdenCompraCorp {
  id: string;
  numeroOC: string;
  numeroFacturaProveedor: string;
  proveedor: string;
  fechaEmision: string;
  fechaEstimadaLlegada: string;
  fechaEnvio?: string;
  fechaRecepcion?: string;
  sedeDestinoId: string;
  sedeDestinoNombre: string;
  estado: 'Pendiente Recibo' | 'Recibido Conforme' | 'Recibido Parcial' | 'Cancelada';
  items: ItemOrdenCompra[];
  totalEstimadoCOP: number;
  totalUnidades?: number;
  compradorResponsable: string;
  recibidoPor?: string;
  recibidoPorDocumento?: string;
  recibidoPorCargo?: string;
  fechaHoraRecepcion?: string;
  actaConsecutivo?: string;
  loteGeneral?: string;
  observaciones?: string;
}

export interface ItemTrasladoInterSede {
  id: string;
  sku: string;
  productoNombre: string;
  color?: string;
  colorHex?: string;
  presentacion: string;
  cantidadEnviada: number;
  cantidadRecibida?: number;
  loteFabricacion?: string;
}

export interface TrasladoInterSede {
  id: string;
  numeroRemision: string; // Ej: REM-TR-2026-0041
  sedeOrigenId: string;
  sedeOrigenNombre: string;
  sedeDestinoId: string;
  sedeDestinoNombre: string;
  fechaDespacho: string;
  fechaEstimadaLlegada: string;
  fechaRecepcion?: string;
  estado: 'En Tránsito' | 'Recibido Conforme' | 'Recibido Parcial' | 'Cancelado';
  transportadora?: string;
  numeroGuia?: string;
  despachadoPor: string;
  recibidoPor?: string;
  loteGeneral?: string;
  observaciones?: string;
  items: ItemTrasladoInterSede[];
  totalUnidades: number;
}

export interface ItemInventarioCorp {
  id: string;
  sku: string;
  nombre: string;
  marca: 'Pintuco' | 'Color In';
  categoria: string;
  // Campos de Matriz por Color y Tamaño/Presentación
  productoBaseId?: string;
  productoBaseNombre?: string;
  color?: string;
  colorHex?: string;
  presentacion?: 'Cuñete (5 Gal)' | 'Galón' | 'Cuarto (1/4 Gal)' | 'Unidad' | string;
  medida?: string;
  stockGalones: number;
  stockCunetes: number;
  stockUnidades?: number;
  stockPorSede?: Record<string, number>;
  stockMinimoGalones: number;
  stockMinimoUnidades?: number;
  ubicacionBodega: string;
  costoUnitarioGL: number;
  precioVentaGL: number;
  activo: boolean;
  movimientos: MovimientoInventario[];
}

export interface RegistroAuditoria {
  id: string;
  fecha: string;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioRol: string;
  modulo: 'Usuarios' | 'Áreas' | 'Tareas' | 'Comunidad' | 'Inventario' | 'SAC' | 'Seguridad';
  accion: string;
  detalle: string;
}

export interface NotificacionCorp {
  id: string;
  destinatarioEmail: string;
  tipo: 'tarea' | 'aprobacion' | 'comunicado' | 'sac' | 'inventario' | 'sistema';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  linkModulo: string;
  linkId?: string;
}

// -------------------------------------------------------------
// CATÁLOGO INICIAL DE LAS 13 ÁREAS ORGANIZACIONALES
// -------------------------------------------------------------
export const AREAS_INICIALES: AreaCorporativa[] = [
  {
    id: 'area-1',
    codigo: 'DIR',
    nombre: 'Dirección General y Gerencia',
    descripcion: 'Toma de decisiones estratégicas, comités de dirección, gobernanza y lineamientos de expansión corporativa.',
    liderNombre: 'Dra. Valentina Restrepo',
    liderCargo: 'Directora General de Operaciones',
    liderEmail: 'valentina.restrepo@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'areas', 'usuarios', 'tareas', 'noticias', 'pedidos', 'auditoria'],
    colorBadge: 'bg-blue-900 text-white',
    empleadosCount: 6,
    kpis: [
      { label: 'Cumplimiento Presupuesto', valor: '98.4%', meta: '95%', tendencia: '+3.4%' },
      { label: 'EBITDA Operativo', valor: '24.2%', meta: '22%', tendencia: '+2.2%' },
    ],
  },
  {
    id: 'area-2',
    codigo: 'COM',
    nombre: 'Comercial y Ventas',
    descripcion: 'Gestión de proyectos B2B con constructoras, licitaciones de obra civil y metas de venta nacional.',
    liderNombre: 'Diana Marcela Salazar',
    liderCargo: 'Directora Comercial B2B',
    liderEmail: 'diana.salazar@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'tareas', 'pedidos', 'noticias'],
    colorBadge: 'bg-cyan-800 text-cyan-100',
    empleadosCount: 24,
    kpis: [
      { label: 'Volumen Facturado Mes', valor: '$520M COP', meta: '$480M', tendencia: '+8.3%' },
      { label: 'Cotizaciones Convertidas', valor: '68%', meta: '60%', tendencia: '+8.0%' },
    ],
  },
  {
    id: 'area-3',
    codigo: 'SAC',
    nombre: 'Atención al Cliente y Posventa',
    descripcion: 'Resolución de consultas técnicas, seguimiento a PQRS, acompañamiento a clientes y chat web en vivo.',
    liderNombre: 'Camila Andrea Gómez',
    liderCargo: 'Líder de Experiencia del Cliente',
    liderEmail: 'camila.gomez@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'sac', 'tareas', 'noticias'],
    colorBadge: 'bg-emerald-800 text-emerald-100',
    empleadosCount: 14,
    kpis: [
      { label: 'SLA Primer Contacto', valor: '18 min', meta: '< 30 min', tendencia: '-12 min' },
      { label: 'Satisfacción CSAT / NPS', valor: '94.6%', meta: '90%', tendencia: '+4.6%' },
    ],
  },
  {
    id: 'area-4',
    codigo: 'MKT',
    nombre: 'Marketing y Comunicaciones',
    descripcion: 'Posicionamiento de marca, lanzamientos de color, campañas de fidelización y publicaciones del muro.',
    liderNombre: 'Mateo Holguín Castro',
    liderCargo: 'Director de Marca & Comunicaciones',
    liderEmail: 'mateo.holguin@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'noticias', 'tareas'],
    colorBadge: 'bg-amber-800 text-amber-100',
    empleadosCount: 10,
    kpis: [
      { label: 'Alcance Comunicados', valor: '92%', meta: '85%', tendencia: '+7.0%' },
      { label: 'Engagement Comunidad', valor: '78%', meta: '70%', tendencia: '+8.0%' },
    ],
  },
  {
    id: 'area-5',
    codigo: 'LOG',
    nombre: 'Logística y Despachos',
    descripcion: 'Coordinación de flotas, generación de guías terrestres, entregas a obras y despacho a 32 departamentos.',
    liderNombre: 'Álvaro Patiño Morales',
    liderCargo: 'Jefe Nacional de Transporte y Envíos',
    liderEmail: 'alvaro.patino@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'pedidos', 'inventario', 'tareas', 'noticias'],
    colorBadge: 'bg-indigo-800 text-indigo-100',
    empleadosCount: 38,
    kpis: [
      { label: 'Entregas a Tiempo (OTIF)', valor: '96.2%', meta: '95%', tendencia: '+1.2%' },
      { label: 'Costo Flete por Galón', valor: '$1,850', meta: '$2,100', tendencia: '-11.9%' },
    ],
  },
  {
    id: 'area-6',
    codigo: 'BOD',
    nombre: 'Bodega e Inventarios',
    descripcion: 'Control de existencias de galones y cuñetes, rotación FIFO, mermas cero y alistamiento físico.',
    liderNombre: 'Ing. Carlos E. Montoya',
    liderCargo: 'Superintendente de Bodegas y CEDI',
    liderEmail: 'carlos.montoya@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'inventario', 'pedidos', 'tareas'],
    colorBadge: 'bg-slate-800 text-slate-100',
    empleadosCount: 42,
    kpis: [
      { label: 'Exactitud de Registro (IRA)', valor: '99.1%', meta: '98%', tendencia: '+1.1%' },
      { label: 'Tiempo Promedio de Alistamiento', valor: '35 min', meta: '45 min', tendencia: '-10 min' },
    ],
  },
  {
    id: 'area-7',
    codigo: 'CMP',
    nombre: 'Compras y Abastecimiento',
    descripcion: 'Adquisición de materias primas químicas (resinas, dióxido de titanio, pigmentos) y empaques plásticos.',
    liderNombre: 'Beatriz Eugenia Henao',
    liderCargo: 'Coordinadora de Abastecimiento Químico',
    liderEmail: 'beatriz.henao@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'inventario', 'tareas', 'noticias'],
    colorBadge: 'bg-teal-800 text-teal-100',
    empleadosCount: 8,
    kpis: [
      { label: 'Ahorro Negociaciones', valor: '6.4%', meta: '5%', tendencia: '+1.4%' },
      { label: 'Cumplimiento Lead Time', valor: '94%', meta: '90%', tendencia: '+4.0%' },
    ],
  },
  {
    id: 'area-8',
    codigo: 'FIN',
    nombre: 'Finanzas, Contabilidad y Facturación',
    descripcion: 'Facturación electrónica DIAN con código CUFE, cobro de cartera, garantías de pago y conciliación bancaria.',
    liderNombre: 'Dr. Fernando Quintero',
    liderCargo: 'Director Financiero & Tesorería',
    liderEmail: 'fernando.quintero@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'pedidos', 'tareas', 'auditoria'],
    colorBadge: 'bg-emerald-900 text-emerald-100',
    empleadosCount: 12,
    kpis: [
      { label: 'Días de Cartera (DSO)', valor: '38 días', meta: '< 45 días', tendencia: '-7 días' },
      { label: 'Conciliación DIAN', valor: '100%', meta: '100%', tendencia: '0%' },
    ],
  },
  {
    id: 'area-9',
    codigo: 'RRHH',
    nombre: 'Recursos Humanos y Bienestar',
    descripcion: 'Desarrollo del talento, clima laboral, capacitaciones, reconocimientos de empleados y nómina.',
    liderNombre: 'Dra. Sandra Mora Viana',
    liderCargo: 'Gerente de Gestión Humana',
    liderEmail: 'sandra.mora@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'usuarios', 'noticias', 'tareas'],
    colorBadge: 'bg-pink-900 text-pink-100',
    empleadosCount: 9,
    kpis: [
      { label: 'Clima Laboral GPTW', valor: '91.4%', meta: '88%', tendencia: '+3.4%' },
      { label: 'Cobertura Capacitación', valor: '96%', meta: '90%', tendencia: '+6.0%' },
    ],
  },
  {
    id: 'area-10',
    codigo: 'TI',
    nombre: 'Tecnología y Sistemas',
    descripcion: 'Arquitectura de software ColorLink, base de datos Supabase, seguridad RBAC, APIs e infraestructura cloud.',
    liderNombre: 'Ing. David Alejandro Ruiz',
    liderCargo: 'Arquitecto de Soluciones & TI',
    liderEmail: 'david.ruiz@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'usuarios', 'areas', 'tareas', 'noticias', 'pedidos', 'inventario', 'sac', 'auditoria'],
    colorBadge: 'bg-violet-900 text-violet-100',
    empleadosCount: 7,
    kpis: [
      { label: 'Disponibilidad Sistema (SLA)', valor: '99.95%', meta: '99.9%', tendencia: '+0.05%' },
      { label: 'Tiempo de Respuesta API', valor: '140 ms', meta: '< 200 ms', tendencia: '-60 ms' },
    ],
  },
  {
    id: 'area-11',
    codigo: 'PRD',
    nombre: 'Producción y Operaciones',
    descripcion: 'Manufactura de pinturas base agua y solvente, reactores de dispersión, envasado y rotulado.',
    liderNombre: 'Ing. Germán Arango Gil',
    liderCargo: 'Jefe de Planta Rionegro',
    liderEmail: 'german.arango@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'inventario', 'tareas', 'noticias'],
    colorBadge: 'bg-orange-900 text-orange-100',
    empleadosCount: 85,
    kpis: [
      { label: 'OEE Eficiencia General', valor: '88.5%', meta: '85%', tendencia: '+3.5%' },
      { label: 'Merma en Envasado', valor: '0.42%', meta: '< 0.8%', tendencia: '-0.38%' },
    ],
  },
  {
    id: 'area-12',
    codigo: 'CAL',
    nombre: 'Calidad, Seguridad y Salud en el Trabajo',
    descripcion: 'Ensayos de laboratorio bajo norma ICONTEC NTC 1335, lavabilidad Gardner, adherencia y prevención de riesgos SST.',
    liderNombre: 'Ing. Javier Restrepo Ángel',
    liderCargo: 'Director de Calidad & Laboratorios',
    liderEmail: 'javier.restrepo@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'tareas', 'inventario', 'noticias'],
    colorBadge: 'bg-teal-900 text-teal-100',
    empleadosCount: 16,
    kpis: [
      { label: 'Días Libres de Accidentes', valor: '418 días', meta: '> 365', tendencia: '+53 días' },
      { label: 'Lotes Certificados NTC 1335', valor: '100%', meta: '100%', tendencia: '0%' },
    ],
  },
  {
    id: 'area-13',
    codigo: 'IDI',
    nombre: 'Investigación, Desarrollo e Innovación',
    descripcion: 'Formulación de pinturas ecológicas con cero VOC, tecnología antibacterial de iones de plata y recubrimientos nanotecnológicos.',
    liderNombre: 'Dra. Claudia Marcela Vélez',
    liderCargo: 'Líder Científica de I+D',
    liderEmail: 'claudia.velez@pintuco.com',
    activa: true,
    modulosHabilitados: ['dashboard', 'tareas', 'noticias'],
    colorBadge: 'bg-indigo-900 text-indigo-100',
    empleadosCount: 11,
    kpis: [
      { label: 'Nuevas Fórmulas Certificadas', valor: '8 fórmulas', meta: '6 fórmulas', tendencia: '+2' },
      { label: 'Reducción Emisiones VOC', valor: '-22%', meta: '-15%', tendencia: '-7%' },
    ],
  },
];

// -------------------------------------------------------------
// CATÁLOGO DE ROLES CORPORATIVOS (RBAC)
// -------------------------------------------------------------
export const ROLES_CORPORATIVOS: RolCorporativo[] = [
  {
    id: 'superadmin',
    nombre: 'Superadministrador',
    descripcion: 'Acceso total sin restricciones a configuración global, usuarios, áreas, auditoría y módulos.',
    nivel: 1,
    permisos: {
      canManageUsers: true,
      canManageAreas: true,
      canManageAllTasks: true,
      canApproveTasks: true,
      canPostOfficialNews: true,
      canManageInventory: true,
      canManageProducts: true,
      canAnswerCustomerTickets: true,
      canViewAuditLog: true,
      canExportReports: true,
      canManageSettings: true,
    },
  },
  {
    id: 'admin_intranet',
    nombre: 'Administrador de la Intranet',
    descripcion: 'Gestión integral de funcionarios, publicaciones, áreas, asignación de tareas y configuraciones operativas.',
    nivel: 2,
    permisos: {
      canManageUsers: true,
      canManageAreas: true,
      canManageAllTasks: true,
      canApproveTasks: true,
      canPostOfficialNews: true,
      canManageInventory: true,
      canManageProducts: true,
      canAnswerCustomerTickets: true,
      canViewAuditLog: true,
      canExportReports: true,
      canManageSettings: false,
    },
  },
  {
    id: 'director_gerente',
    nombre: 'Director o Gerente',
    descripcion: 'Consulta de indicadores estratégicos de todas las áreas, aprobación de tareas de alto nivel y reportes.',
    nivel: 3,
    permisos: {
      canManageUsers: false,
      canManageAreas: false,
      canManageAllTasks: true,
      canApproveTasks: true,
      canPostOfficialNews: true,
      canManageInventory: false,
      canManageProducts: false,
      canAnswerCustomerTickets: false,
      canViewAuditLog: true,
      canExportReports: true,
      canManageSettings: false,
    },
  },
  {
    id: 'jefe_area',
    nombre: 'Jefe de Área',
    descripcion: 'Administra tareas y equipo de su área, realiza asignaciones, evalúa avances y aprueba evidencias.',
    nivel: 4,
    permisos: {
      canManageUsers: false,
      canManageAreas: false,
      canManageAllTasks: false,
      canApproveTasks: true,
      canPostOfficialNews: false,
      canManageInventory: false,
      canManageProducts: false,
      canAnswerCustomerTickets: false,
      canViewAuditLog: false,
      canExportReports: true,
      canManageSettings: false,
    },
  },
  {
    id: 'funcionario',
    nombre: 'Funcionario General',
    descripcion: 'Acceso a panel personal, tareas asignadas, calendario, comunicados y módulos de su cargo.',
    nivel: 8,
    permisos: {
      canManageUsers: false,
      canManageAreas: false,
      canManageAllTasks: false,
      canApproveTasks: false,
      canPostOfficialNews: false,
      canManageInventory: false,
      canManageProducts: false,
      canAnswerCustomerTickets: false,
      canViewAuditLog: false,
      canExportReports: false,
      canManageSettings: false,
    },
  },
  {
    id: 'logistica_inventarios',
    nombre: 'Personal de Logística e Inventarios',
    descripcion: 'Gestión operativa de productos, stock, entradas/salidas, pedidos y despachos a nivel nacional.',
    nivel: 6,
    permisos: {
      canManageUsers: false,
      canManageAreas: false,
      canManageAllTasks: false,
      canApproveTasks: false,
      canPostOfficialNews: false,
      canManageInventory: true,
      canManageProducts: true,
      canAnswerCustomerTickets: false,
      canViewAuditLog: false,
      canExportReports: true,
      canManageSettings: false,
    },
  },
  {
    id: 'agente_sac',
    nombre: 'Agente de Atención al Cliente (SAC)',
    descripcion: 'Atención directa de mensajes entrantes desde la web pública, respuesta en tiempo real y cierre de PQRS.',
    nivel: 7,
    permisos: {
      canManageUsers: false,
      canManageAreas: false,
      canManageAllTasks: false,
      canApproveTasks: false,
      canPostOfficialNews: false,
      canManageInventory: false,
      canManageProducts: false,
      canAnswerCustomerTickets: true,
      canViewAuditLog: false,
      canExportReports: true,
      canManageSettings: false,
    },
  },
  {
    id: 'comunicaciones_rrhh',
    nombre: 'Comunicaciones y Recursos Humanos',
    descripcion: 'Gestión del muro corporativo, publicación de noticias oficiales, reconocimientos y campañas internas.',
    nivel: 5,
    permisos: {
      canManageUsers: true,
      canManageAreas: false,
      canManageAllTasks: false,
      canApproveTasks: false,
      canPostOfficialNews: true,
      canManageInventory: false,
      canManageProducts: false,
      canAnswerCustomerTickets: false,
      canViewAuditLog: false,
      canExportReports: true,
      canManageSettings: false,
    },
  },
];

// -------------------------------------------------------------
// FUNCIONARIOS INICIALES
// -------------------------------------------------------------
export const FUNCIONARIOS_INICIALES: Funcionario[] = [
  {
    id: 'func-1',
    avatar: 'VR',
    nombre: 'Dra. Valentina Restrepo',
    email: 'valentina.restrepo@pintuco.com',
    cargo: 'Directora General de Operaciones',
    areaId: 'area-1',
    areaNombre: 'Dirección General y Gerencia',
    rolId: 'superadmin',
    rolNombre: 'Superadministrador',
    fechaIngreso: '15 Ene 2021',
    estado: 'Activo',
    ultimoAcceso: 'Hace 5 minutos',
    telefono: '+57 310 400 1234',
    tareasAsignadasCount: 3,
  },
  {
    id: 'func-2',
    avatar: 'DS',
    nombre: 'Diana Marcela Salazar',
    email: 'diana.salazar@pintuco.com',
    cargo: 'Directora Comercial B2B',
    areaId: 'area-2',
    areaNombre: 'Comercial y Ventas',
    rolId: 'director_gerente',
    rolNombre: 'Director o Gerente',
    jefeInmediatoId: 'func-1',
    jefeInmediatoNombre: 'Dra. Valentina Restrepo',
    fechaIngreso: '10 Feb 2022',
    estado: 'Activo',
    ultimoAcceso: 'Hace 20 minutos',
    telefono: '+57 311 555 8920',
    tareasAsignadasCount: 5,
  },
  {
    id: 'func-3',
    avatar: 'AP',
    nombre: 'Álvaro Patiño Morales',
    email: 'alvaro.patino@pintuco.com',
    cargo: 'Jefe Nacional de Transporte y Envíos',
    areaId: 'area-5',
    areaNombre: 'Logística y Despachos',
    rolId: 'jefe_area',
    rolNombre: 'Jefe de Área',
    jefeInmediatoId: 'func-1',
    jefeInmediatoNombre: 'Dra. Valentina Restrepo',
    fechaIngreso: '01 Mar 2022',
    estado: 'Activo',
    ultimoAcceso: 'Hace 1 hora',
    telefono: '+57 314 777 4411',
    tareasAsignadasCount: 6,
  },
  {
    id: 'func-4',
    avatar: 'CM',
    nombre: 'Ing. Carlos E. Montoya',
    email: 'carlos.montoya@pintuco.com',
    cargo: 'Superintendente de Bodegas y CEDI',
    areaId: 'area-6',
    areaNombre: 'Bodega e Inventarios',
    rolId: 'logistica_inventarios',
    rolNombre: 'Personal de Logística e Inventarios',
    jefeInmediatoId: 'func-3',
    jefeInmediatoNombre: 'Álvaro Patiño Morales',
    fechaIngreso: '15 Ago 2022',
    estado: 'Activo',
    ultimoAcceso: 'Hace 30 minutos',
    telefono: '+57 320 888 1234',
    tareasAsignadasCount: 4,
  },
  {
    id: 'func-5',
    avatar: 'CG',
    nombre: 'Camila Andrea Gómez',
    email: 'camila.gomez@pintuco.com',
    cargo: 'Líder de Experiencia del Cliente',
    areaId: 'area-3',
    areaNombre: 'Atención al Cliente y Posventa',
    rolId: 'jefe_area',
    rolNombre: 'Jefe de Área',
    jefeInmediatoId: 'func-1',
    jefeInmediatoNombre: 'Dra. Valentina Restrepo',
    fechaIngreso: '01 Jul 2023',
    estado: 'Activo',
    ultimoAcceso: 'Hace 10 minutos',
    telefono: '+57 301 999 5566',
    tareasAsignadasCount: 7,
  },
  {
    id: 'func-6',
    avatar: 'JR',
    nombre: 'Ing. Javier Restrepo Ángel',
    email: 'javier.restrepo@pintuco.com',
    cargo: 'Director de Calidad & Laboratorios',
    areaId: 'area-12',
    areaNombre: 'Calidad, Seguridad y Salud en el Trabajo',
    rolId: 'jefe_area',
    rolNombre: 'Jefe de Área',
    jefeInmediatoId: 'func-1',
    jefeInmediatoNombre: 'Dra. Valentina Restrepo',
    fechaIngreso: '15 Ene 2020',
    estado: 'Activo',
    ultimoAcceso: 'Hace 2 horas',
    telefono: '+57 312 345 6789',
    tareasAsignadasCount: 3,
  },
  {
    id: 'func-7',
    avatar: 'SM',
    nombre: 'Dra. Sandra Mora Viana',
    email: 'sandra.mora@pintuco.com',
    cargo: 'Gerente de Gestión Humana',
    areaId: 'area-9',
    areaNombre: 'Recursos Humanos y Bienestar',
    rolId: 'comunicaciones_rrhh',
    rolNombre: 'Comunicaciones y Recursos Humanos',
    jefeInmediatoId: 'func-1',
    jefeInmediatoNombre: 'Dra. Valentina Restrepo',
    fechaIngreso: '01 Nov 2021',
    estado: 'Activo',
    ultimoAcceso: 'Hace 4 horas',
    telefono: '+57 316 234 5678',
    tareasAsignadasCount: 2,
  },
  {
    id: 'func-8',
    avatar: 'MH',
    nombre: 'Mateo Holguín Castro',
    email: 'mateo.holguin@pintuco.com',
    cargo: 'Director de Marca & Comunicaciones',
    areaId: 'area-4',
    areaNombre: 'Marketing y Comunicaciones',
    rolId: 'comunicaciones_rrhh',
    rolNombre: 'Comunicaciones y Recursos Humanos',
    jefeInmediatoId: 'func-1',
    jefeInmediatoNombre: 'Dra. Valentina Restrepo',
    fechaIngreso: '20 Abr 2022',
    estado: 'Activo',
    ultimoAcceso: 'Hace 3 horas',
    telefono: '+57 318 456 7890',
    tareasAsignadasCount: 4,
  },
  {
    id: 'func-9',
    avatar: 'DR',
    nombre: 'Ing. David Alejandro Ruiz',
    email: 'david.ruiz@pintuco.com',
    cargo: 'Arquitecto de Soluciones & TI',
    areaId: 'area-10',
    areaNombre: 'Tecnología y Sistemas',
    rolId: 'admin_intranet',
    rolNombre: 'Administrador de la Intranet',
    jefeInmediatoId: 'func-1',
    jefeInmediatoNombre: 'Dra. Valentina Restrepo',
    fechaIngreso: '12 Ene 2023',
    estado: 'Activo',
    ultimoAcceso: 'Hace 15 minutos',
    telefono: '+57 300 112 2334',
    tareasAsignadasCount: 5,
  },
  {
    id: 'func-10',
    avatar: 'LP',
    nombre: 'Laura Patricia Vélez',
    email: 'laura.velez@pintuco.com',
    cargo: 'Agente Especialista SAC & Soporte Web',
    areaId: 'area-3',
    areaNombre: 'Atención al Cliente y Posventa',
    rolId: 'agente_sac',
    rolNombre: 'Agente de Atención al Cliente (SAC)',
    jefeInmediatoId: 'func-5',
    jefeInmediatoNombre: 'Camila Andrea Gómez',
    fechaIngreso: '01 Feb 2024',
    estado: 'Activo',
    ultimoAcceso: 'Hace 8 minutos',
    telefono: '+57 319 765 4321',
    tareasAsignadasCount: 8,
  },
];

// -------------------------------------------------------------
// TAREAS INICIALES POR ÁREA Y FLUJO DE TRABAJO
// -------------------------------------------------------------
export const TAREAS_INICIALES: TareaLaboral[] = [
  {
    id: 'task-101',
    titulo: 'Auditoría Recertificación ICONTEC NTC 1335 en Planta Rionegro',
    descripcion: 'Verificación de ensayos de laboratorio de lavabilidad Gardner (>1,200 ciclos) y adherencia por tracción en sustratos de revoque para pinturas tipo 1.',
    areaId: 'area-12',
    areaNombre: 'Calidad, Seguridad y Salud en el Trabajo',
    creadorNombre: 'Dra. Valentina Restrepo',
    creadorEmail: 'valentina.restrepo@pintuco.com',
    responsableId: 'func-6',
    responsableNombre: 'Ing. Javier Restrepo Ángel',
    responsableEmail: 'javier.restrepo@pintuco.com',
    responsableAvatar: 'JR',
    colaboradores: ['Ing. Carlos E. Montoya', 'Ing. Germán Arango Gil'],
    prioridad: 'Alta',
    estado: 'En progreso',
    fechaCreacion: '2026-09-15',
    fechaInicio: '2026-09-18',
    fechaLimite: '2026-10-18',
    progresoPct: 65,
    subtareas: [
      { id: 'sub-1', texto: 'Aislamiento de muestras de lotes Viniltex y Koraza', completada: true },
      { id: 'sub-2', texto: 'Ensayo de lavabilidad Gardner con abrasivo normalizado', completada: true },
      { id: 'sub-3', texto: 'Revisión documental de hojas de seguridad MSDS', completada: false },
      { id: 'sub-4', texto: 'Emisión de informe final a ICONTEC', completada: false },
    ],
    evidencias: [
      { id: 'evi-1', nombre: 'Certificado_Previo_NTC1335_2025.pdf', tamano: '2.4 MB', fecha: '2026-09-20' },
    ],
    comentarios: [
      {
        id: 'com-1',
        autorNombre: 'Ing. Javier Restrepo',
        autorAvatar: 'JR',
        fecha: '2026-09-22 10:30',
        texto: 'Se completaron 1,450 ciclos de lavabilidad sin desprendimiento de película en Viniltex Avanzado. Supera ampliamente el estándar.',
      },
    ],
    historial: [
      { id: 'h-1', fecha: '2026-09-15', usuario: 'Valentina Restrepo', accion: 'Tarea creada y asignada a Ing. Javier Restrepo' },
      { id: 'h-2', fecha: '2026-09-18', usuario: 'Javier Restrepo', accion: 'Estado cambiado a En progreso' },
    ],
    requiereAprobacion: true,
  },
  {
    id: 'task-102',
    titulo: 'Despacho y Plan de Rutas Macroproyecto Torres de San Telmo',
    descripcion: 'Coordinación y alistamiento de 45 cuñetes de Koraza 5 Blanco Hueso con sellador acrílico antialcalino y flete programado con camión NHR.',
    areaId: 'area-5',
    areaNombre: 'Logística y Despachos',
    creadorNombre: 'Diana Marcela Salazar',
    creadorEmail: 'diana.salazar@pintuco.com',
    responsableId: 'func-3',
    responsableNombre: 'Álvaro Patiño Morales',
    responsableEmail: 'alvaro.patino@pintuco.com',
    responsableAvatar: 'AP',
    colaboradores: ['Ing. Carlos E. Montoya'],
    prioridad: 'Urgente',
    estado: 'En revisión',
    fechaCreacion: '2026-09-20',
    fechaInicio: '2026-09-21',
    fechaLimite: '2026-10-15',
    progresoPct: 90,
    subtareas: [
      { id: 'sub-21', texto: 'Verificación de stock disponible en CEDI Rionegro', completada: true },
      { id: 'sub-22', texto: 'Generación de guía de despacho terrestre', completada: true },
      { id: 'sub-23', texto: 'Inspección de estibado y amarre en vehículo NHR', completada: true },
      { id: 'sub-24', texto: 'Aprobación de salida de báscula por Gerencia Logística', completada: false },
    ],
    evidencias: [
      { id: 'evi-2', nombre: 'Guia_Transporte_SanTelmo_DESP401.pdf', tamano: '840 KB', fecha: '2026-09-24' },
    ],
    comentarios: [
      {
        id: 'com-2',
        autorNombre: 'Álvaro Patiño',
        autorAvatar: 'AP',
        fecha: '2026-09-24 14:15',
        texto: 'Guía radicada. El camión está listo en plataforma de carga para inspección y firma de salida.',
      },
    ],
    historial: [
      { id: 'h-21', fecha: '2026-09-20', usuario: 'Diana Salazar', accion: 'Tarea creada' },
      { id: 'h-22', fecha: '2026-09-24', usuario: 'Álvaro Patiño', accion: 'Enviada a aprobación' },
    ],
    requiereAprobacion: true,
  },
  {
    id: 'task-103',
    titulo: 'Cierre de Propuesta Económica B2B Constructora Amarilo',
    descripcion: 'Radicación de pliegos y cotización corporativa para 18,500 m2 con descuento por volumen del 12% y garantía de estabilidad de 10 años.',
    areaId: 'area-2',
    areaNombre: 'Comercial y Ventas',
    creadorNombre: 'Dra. Valentina Restrepo',
    creadorEmail: 'valentina.restrepo@pintuco.com',
    responsableId: 'func-2',
    responsableNombre: 'Diana Marcela Salazar',
    responsableEmail: 'diana.salazar@pintuco.com',
    responsableAvatar: 'DS',
    colaboradores: [],
    prioridad: 'Alta',
    estado: 'En progreso',
    fechaCreacion: '2026-09-18',
    fechaInicio: '2026-09-19',
    fechaLimite: '2026-10-20',
    progresoPct: 75,
    subtareas: [
      { id: 'sub-31', texto: 'Cálculo de rendimiento en simulador ColorLink', completada: true },
      { id: 'sub-32', texto: 'Aprobación de cupo de crédito con Tesorería', completada: true },
      { id: 'sub-33', texto: 'Envío de carpeta técnica y certificados NTC', completada: true },
      { id: 'sub-34', texto: 'Firma de orden de compra B2B', completada: false },
    ],
    evidencias: [],
    comentarios: [],
    historial: [
      { id: 'h-31', fecha: '2026-09-18', usuario: 'Valentina Restrepo', accion: 'Asignada a Diana Salazar' },
    ],
    requiereAprobacion: false,
  },
  {
    id: 'task-104',
    titulo: 'Capacitación SST: Protocolo de Manejo Seguro de Solventes',
    descripcion: 'Jornada de entrenamiento obligatorio para operarios de planta y bodegueros en manipulación de esmaltes alquídicos y thinner.',
    areaId: 'area-9',
    areaNombre: 'Recursos Humanos y Bienestar',
    creadorNombre: 'Dra. Sandra Mora Viana',
    creadorEmail: 'sandra.mora@pintuco.com',
    responsableId: 'func-7',
    responsableNombre: 'Dra. Sandra Mora Viana',
    responsableEmail: 'sandra.mora@pintuco.com',
    responsableAvatar: 'SM',
    colaboradores: ['Ing. Javier Restrepo'],
    prioridad: 'Media',
    estado: 'Pendiente',
    fechaCreacion: '2026-09-22',
    fechaLimite: '2026-10-25',
    progresoPct: 20,
    subtareas: [
      { id: 'sub-41', texto: 'Diseño de cartillas de seguridad de bolsillo', completada: true },
      { id: 'sub-42', texto: 'Convocatoria a 60 colaboradores por turnos', completada: false },
      { id: 'sub-43', texto: 'Evaluación de conocimientos y entrega de certificados', completada: false },
    ],
    evidencias: [],
    comentarios: [],
    historial: [
      { id: 'h-41', fecha: '2026-09-22', usuario: 'Sandra Mora', accion: 'Tarea creada' },
    ],
    requiereAprobacion: false,
  },
  {
    id: 'task-105',
    titulo: 'Optimización de Fórmulas Nanotecnológicas Cero VOC',
    descripcion: 'Ensayos de laboratorio de resina biobasada para la nueva línea hospitalaria antibacterial con iones de plata.',
    areaId: 'area-13',
    areaNombre: 'Investigación, Desarrollo e Innovación',
    creadorNombre: 'Dra. Valentina Restrepo',
    creadorEmail: 'valentina.restrepo@pintuco.com',
    responsableId: 'func-1',
    responsableNombre: 'Dra. Valentina Restrepo',
    responsableEmail: 'valentina.restrepo@pintuco.com',
    responsableAvatar: 'VR',
    colaboradores: ['Dra. Claudia Marcela Vélez'],
    prioridad: 'Media',
    estado: 'Completada',
    fechaCreacion: '2026-08-10',
    fechaInicio: '2026-08-15',
    fechaLimite: '2026-09-30',
    fechaFinalizacion: '2026-09-28',
    progresoPct: 100,
    subtareas: [
      { id: 'sub-51', texto: 'Prueba de inhibición bacteriana JIS Z 2801 (>99.9%)', completada: true },
      { id: 'sub-52', texto: 'Estabilidad de viscosidad a 40°C por 30 días', completada: true },
      { id: 'sub-53', texto: 'Aprobación de patente de formulación', completada: true },
    ],
    evidencias: [
      { id: 'evi-51', nombre: 'Reporte_Microbiologia_BioPintuco.pdf', tamano: '3.1 MB', fecha: '2026-09-28' },
    ],
    comentarios: [
      {
        id: 'com-51',
        autorNombre: 'Dra. Valentina Restrepo',
        autorAvatar: 'VR',
        fecha: '2026-09-28 17:00',
        texto: 'La formulación superó con éxito las pruebas microbiológicas en cepas de S. aureus y E. coli.',
      },
    ],
    historial: [
      { id: 'h-51', fecha: '2026-08-10', usuario: 'Valentina Restrepo', accion: 'Tarea creada' },
      { id: 'h-52', fecha: '2026-09-28', usuario: 'Valentina Restrepo', accion: 'Marcada como Completada' },
    ],
    requiereAprobacion: false,
  },
  {
    id: 'task-106',
    titulo: 'Mantenimiento Preventivo de Máquinas Dosificadoras Tintométricas',
    descripcion: 'Calibración de inyectores de colorantes NCS y RAL en tiendas Pintumarket autorizadas de Bogotá y Medellín.',
    areaId: 'area-11',
    areaNombre: 'Producción y Operaciones',
    creadorNombre: 'Ing. Carlos E. Montoya',
    creadorEmail: 'carlos.montoya@pintuco.com',
    responsableId: 'func-4',
    responsableNombre: 'Ing. Carlos E. Montoya',
    responsableEmail: 'carlos.montoya@pintuco.com',
    responsableAvatar: 'CM',
    colaboradores: [],
    prioridad: 'Media',
    estado: 'Bloqueada',
    motivoBloqueo: 'Pendiente llegada de repuestos de válvulas solenoides desde proveedor importador.',
    fechaCreacion: '2026-09-12',
    fechaLimite: '2026-10-10',
    progresoPct: 40,
    subtareas: [
      { id: 'sub-61', texto: 'Inspección de bombas de émbolo', completada: true },
      { id: 'sub-62', texto: 'Reemplazo de válvulas solenoides 24V', completada: false },
      { id: 'sub-63', texto: 'Calibración colorimétrica con espectrofotómetro', completada: false },
    ],
    evidencias: [],
    comentarios: [
      {
        id: 'com-61',
        autorNombre: 'Carlos Montoya',
        autorAvatar: 'CM',
        fecha: '2026-09-25 09:10',
        texto: 'Se marcó como bloqueada temporalmente a la espera de entrega de repuestos por parte de Compras.',
      },
    ],
    historial: [
      { id: 'h-61', fecha: '2026-09-12', usuario: 'Carlos Montoya', accion: 'Tarea creada' },
      { id: 'h-62', fecha: '2026-09-25', usuario: 'Carlos Montoya', accion: 'Estado cambiado a Bloqueada' },
    ],
    requiereAprobacion: false,
  },
];

// -------------------------------------------------------------
// PUBLICACIONES DEL MURO CORPORATIVO ("COMUNIDAD COLORLINK")
// -------------------------------------------------------------
export const PUBLICACIONES_INICIALES: PublicacionComunidad[] = [
  {
    id: 'post-1',
    tipo: 'comunicado',
    titulo: '¡Felicitaciones al Equipo de Laboratorios por la Renovación NTC 1335!',
    contenido: 'Nos complace anunciar a toda la organización que la auditoría de seguimiento realizada por ICONTEC concluyó con 100% de conformidad técnica para nuestros productos Viniltex Avanzado y Koraza 5 Fachadas. Este logro reafirma nuestro compromiso histórico con la máxima calidad y durabilidad en la construcción colombiana.',
    autorNombre: 'Dra. Valentina Restrepo',
    autorCargo: 'Directora General de Operaciones',
    autorAvatar: 'VR',
    autorArea: 'Dirección General y Gerencia',
    fecha: 'Hoy, 09:15 AM',
    fijado: true,
    etiquetas: ['Calidad', 'NTC1335', 'ICONTEC', 'OrgulloPintuco'],
    meGusta: 38,
    usuariosMeGusta: ['diana.salazar@pintuco.com', 'alvaro.patino@pintuco.com'],
    comentarios: [
      {
        id: 'c-1',
        autorNombre: 'Ing. Javier Restrepo',
        autorAvatar: 'JR',
        fecha: 'Hoy, 09:40 AM',
        texto: 'Un reconocimiento especial a todos los químicos y analistas de laboratorio que realizaron más de 450 ensayos en los últimos tres meses.',
      },
      {
        id: 'c-2',
        autorNombre: 'Diana Salazar',
        autorAvatar: 'DS',
        fecha: 'Hoy, 10:12 AM',
        texto: '¡Gran noticia para el equipo comercial! Las constructoras siempre valoran este respaldo normativo oficial.',
      },
    ],
  },
  {
    id: 'post-2',
    tipo: 'reconocimiento',
    titulo: 'Reconocimiento Especial: Empleado Destacado del Mes de Septiembre',
    contenido: 'Felicitamos calurosamente a Álvaro Patiño Morales, Jefe Nacional de Despachos, por lograr un récord operativo de 96.2% de cumplimiento OTIF (On-Time In-Full) en despachos a 32 departamentos sin ninguna novedad de merma.',
    autorNombre: 'Dra. Sandra Mora Viana',
    autorCargo: 'Gerente de Gestión Humana',
    autorAvatar: 'SM',
    autorArea: 'Recursos Humanos y Bienestar',
    fecha: 'Ayer, 03:30 PM',
    fijado: false,
    etiquetas: ['Reconocimiento', 'EmpleadoDelMes', 'LogísticaExcepcional'],
    meGusta: 52,
    usuariosMeGusta: ['valentina.restrepo@pintuco.com', 'carlos.montoya@pintuco.com'],
    reconocimiento: {
      destacadoNombre: 'Álvaro Patiño Morales',
      destacadoCargo: 'Jefe Nacional de Transporte y Envíos',
      destacadoAvatar: 'AP',
      periodo: 'Septiembre 2026',
      motivo: 'Liderazgo operativo en despacho de más de 12,000 cuñetes con 96.2% de puntualidad en entregas a pie de obra.',
      categoria: 'Empleado del Mes',
    },
    comentarios: [
      {
        id: 'c-3',
        autorNombre: 'Álvaro Patiño',
        autorAvatar: 'AP',
        fecha: 'Ayer, 04:05 PM',
        texto: '¡Muchísimas gracias! Este es un mérito de todo el equipo de conductores y auxiliares de bodega que dan el 100% cada jornada.',
      },
    ],
  },
  {
    id: 'post-3',
    tipo: 'noticia',
    titulo: 'Nuevo récord en la plataforma ColorLink B2B: Más de $500M cotizados en línea',
    contenido: 'El módulo inteligente de cálculo volumétrico y cotización en tiempo real alcanzó un nuevo hito comercial esta semana, agilizando los tiempos de cierre de presupuestos de 48 horas a tan solo 5 minutos para proyectos institucionales.',
    autorNombre: 'Mateo Holguín Castro',
    autorCargo: 'Director de Marca & Comunicaciones',
    autorAvatar: 'MH',
    autorArea: 'Marketing y Comunicaciones',
    fecha: '24 Sep 2026',
    fijado: false,
    etiquetas: ['Innovación', 'Tecnología', 'ColorLink', 'VentasB2B'],
    meGusta: 29,
    usuariosMeGusta: [],
    comentarios: [],
  },
];

// -------------------------------------------------------------
// BANDEJA INICIAL DE ATENCIÓN AL CLIENTE (SAC)
// CONECTADA CON LA WEB PÚBLICA
// -------------------------------------------------------------
export const TICKETS_SAC_INICIALES: TicketSAC[] = [
  {
    id: 'sac-101',
    radicado: 'CLK-SAC-2026-081',
    clienteNombre: 'Ing. Mauricio Bermúdez (Constructora Bolívar)',
    clienteEmail: 'mauricio.bermudez@cbolivar.com.co',
    clienteTelefono: '+57 310 998 8776',
    canal: 'Formulario PQR',
    asunto: 'Certificado de Lavabilidad y Adherencia NTC 1335 para Proyecto Alborada',
    mensaje: 'Buenas tardes. Requerimos la copia oficial del certificado de ensayo de lavabilidad y adherencia de Koraza 5 para radicar en interventoría antes del desembolso de la segunda fase de fachada.',
    fechaCreacion: '2026-09-25 08:30',
    fechaUltimaActividad: '2026-09-25 10:45',
    estado: 'En proceso',
    prioridad: 'Alta',
    categoria: 'Certificación NTC 1335',
    agenteAsignadoId: 'func-10',
    agenteAsignadoNombre: 'Laura Patricia Vélez',
    slaHorasLimite: 24,
    slaVencido: false,
    mensajes: [
      {
        id: 'msg-1',
        remitenteTipo: 'cliente',
        remitenteNombre: 'Mauricio Bermúdez',
        texto: 'Buenas tardes. Requerimos la copia oficial del certificado de ensayo de lavabilidad y adherencia de Koraza 5 para radicar en interventoría.',
        fecha: '2026-09-25 08:30',
      },
      {
        id: 'msg-2',
        remitenteTipo: 'agente',
        remitenteNombre: 'Laura Patricia Vélez (SAC)',
        remitenteAvatar: 'LP',
        texto: 'Estimado Ing. Mauricio, un cordial saludo. Con gusto gestionamos su certificado con el laboratorio central de calidad. Ya solicitamos la copia firmada al Ing. Javier Restrepo.',
        fecha: '2026-09-25 09:15',
      },
      {
        id: 'msg-3',
        remitenteTipo: 'agente',
        remitenteNombre: 'Laura Patricia Vélez',
        remitenteAvatar: 'LP',
        texto: 'Nota interna: Se envió copia del requerimiento al correo javier.restrepo@pintuco.com con radicado prioritario.',
        fecha: '2026-09-25 09:20',
        esNotaInterna: true,
      },
    ],
  },
  {
    id: 'sac-102',
    radicado: 'CLK-SAC-2026-082',
    clienteNombre: 'Andrés Felipe Gómez (Pinturas del Valle)',
    clienteEmail: 'andres.gomez@pinturasvalle.co',
    clienteTelefono: '+57 315 443 2211',
    canal: 'Chat Web Público',
    asunto: 'Consulta sobre compatibilidad de sellador antialcalino en muro húmedo',
    mensaje: 'Hola, tengo una pared de concreto vaciado con humedad residual del 14%. ¿Puedo aplicar Koraza directo o debo sellar primero con Aquablock?',
    fechaCreacion: '2026-09-25 11:20',
    fechaUltimaActividad: '2026-09-25 11:25',
    estado: 'Nuevo',
    prioridad: 'Media',
    categoria: 'Asesoría Técnica Pinturas',
    slaHorasLimite: 8,
    slaVencido: false,
    mensajes: [
      {
        id: 'msg-102',
        remitenteTipo: 'cliente',
        remitenteNombre: 'Andrés Felipe Gómez',
        texto: 'Hola, tengo una pared de concreto vaciado con humedad residual del 14%. ¿Puedo aplicar Koraza directo o debo sellar primero con Aquablock?',
        fecha: '2026-09-25 11:20',
      },
    ],
  },
  {
    id: 'sac-103',
    radicado: 'CLK-SAC-2026-083',
    clienteNombre: 'Sonia Esperanza Ramírez',
    clienteEmail: 'sonia.ramirez.arq@gmail.com',
    clienteTelefono: '+57 320 665 4433',
    canal: 'Cotizador Inteligente',
    asunto: 'Verificación de guía de entrega orden #CLK-8912 para Tunja',
    mensaje: 'Buenas tardes equipo ColorLink. Realicé la compra ayer de 12 galones de Viniltex Pro y me gustaría saber el número de placa del camión para coordinar recibo en la portería del conjunto.',
    fechaCreacion: '2026-09-24 16:40',
    fechaUltimaActividad: '2026-09-25 08:10',
    estado: 'Resuelto',
    prioridad: 'Media',
    categoria: 'Seguimiento Despacho',
    agenteAsignadoId: 'func-10',
    agenteAsignadoNombre: 'Laura Patricia Vélez',
    slaHorasLimite: 24,
    slaVencido: false,
    motivoResolucion: 'Se compartió la guía de transporte NHR-420 con conductor Álvaro Patiño y contacto de cabina.',
    mensajes: [
      {
        id: 'msg-201',
        remitenteTipo: 'cliente',
        remitenteNombre: 'Sonia Esperanza Ramírez',
        texto: 'Buenas tardes equipo ColorLink. Realicé la compra ayer de 12 galones de Viniltex Pro y me gustaría saber el número de placa del camión.',
        fecha: '2026-09-24 16:40',
      },
      {
        id: 'msg-202',
        remitenteTipo: 'agente',
        remitenteNombre: 'Laura Patricia Vélez (SAC)',
        remitenteAvatar: 'LP',
        texto: 'Estimada Sonia, su pedido va en el vehículo NHR-420 a cargo de don Álvaro Patiño. Hora estimada de llegada: 11:30 AM.',
        fecha: '2026-09-25 08:10',
      },
    ],
  },
];

// -------------------------------------------------------------
// INVENTARIO CORPORATIVO REAL
// -------------------------------------------------------------
export const INVENTARIO_CORP_INICIAL: ItemInventarioCorp[] = [
  {
    id: 'inv-1',
    sku: 'PIN-VIN-AVZ',
    nombre: 'Viniltex Avanzado Máxima Lavabilidad',
    marca: 'Pintuco',
    categoria: 'Pintura Interior',
    stockGalones: 840,
    stockCunetes: 168,
    stockMinimoGalones: 200,
    ubicacionBodega: 'CEDI Rionegro - Pasillo A-04',
    costoUnitarioGL: 52000,
    precioVentaGL: 84900,
    activo: true,
    movimientos: [
      { id: 'mov-1', fecha: '2026-09-20', tipo: 'Entrada', cantidadGalones: 300, motivo: 'Lote de producción 2026-L42', usuarioNombre: 'Carlos E. Montoya', stockPosterior: 840 },
    ],
  },
  {
    id: 'inv-2',
    sku: 'PIN-KRZ-5',
    nombre: 'Koraza 5 Fachadas Máxima Durabilidad',
    marca: 'Pintuco',
    categoria: 'Pintura Fachada',
    stockGalones: 620,
    stockCunetes: 124,
    stockMinimoGalones: 250,
    ubicacionBodega: 'CEDI Rionegro - Pasillo B-02',
    costoUnitarioGL: 68000,
    precioVentaGL: 104900,
    activo: true,
    movimientos: [
      { id: 'mov-2', fecha: '2026-09-22', tipo: 'Salida', cantidadGalones: 120, motivo: 'Despacho Obra San Telmo', usuarioNombre: 'Álvaro Patiño', stockPosterior: 620 },
    ],
  },
  {
    id: 'inv-3',
    sku: 'PIN-AQB-10',
    nombre: 'Aquablock Impermeabilizante 10 Años',
    marca: 'Pintuco',
    categoria: 'Zonas Húmedas',
    stockGalones: 180,
    stockCunetes: 36,
    stockMinimoGalones: 200,
    ubicacionBodega: 'CEDI Rionegro - Pasillo C-01',
    costoUnitarioGL: 79000,
    precioVentaGL: 119900,
    activo: true,
    movimientos: [
      { id: 'mov-3', fecha: '2026-09-23', tipo: 'Ajuste Inventario', cantidadGalones: -10, motivo: 'Toma de muestras ICONTEC', usuarioNombre: 'Javier Restrepo', stockPosterior: 180 },
    ],
  },
  {
    id: 'inv-4',
    sku: 'PIN-SEL-ACR',
    nombre: 'Sellador Acrílico Antialcalino 50%',
    marca: 'Pintuco',
    categoria: 'Selladores',
    stockGalones: 450,
    stockCunetes: 90,
    stockMinimoGalones: 150,
    ubicacionBodega: 'CEDI Rionegro - Pasillo A-08',
    costoUnitarioGL: 32000,
    precioVentaGL: 54900,
    activo: true,
    movimientos: [],
  },
  {
    id: 'inv-5',
    sku: 'PIN-LUX-BRI',
    nombre: 'Pintulux Esmalte Sintético Brillante',
    marca: 'Pintuco',
    categoria: 'Esmaltes',
    stockGalones: 310,
    stockCunetes: 62,
    stockMinimoGalones: 100,
    ubicacionBodega: 'CEDI Rionegro - Pasillo D-05',
    costoUnitarioGL: 41000,
    precioVentaGL: 68900,
    activo: true,
    movimientos: [],
  },
];

// -------------------------------------------------------------
// REGISTROS DE AUDITORÍA INICIALES
// -------------------------------------------------------------
export const AUDITORIA_INICIAL: RegistroAuditoria[] = [
  {
    id: 'aud-1',
    fecha: '2026-09-25 08:30:14',
    usuarioNombre: 'Dra. Valentina Restrepo',
    usuarioEmail: 'valentina.restrepo@pintuco.com',
    usuarioRol: 'Superadministrador',
    modulo: 'Seguridad',
    accion: 'Inicio de Sesión Exitoso',
    detalle: 'Autenticación con 2FA SMS verificada desde IP corporativa 190.25.102.4',
  },
  {
    id: 'aud-2',
    fecha: '2026-09-25 09:12:40',
    usuarioNombre: 'Diana Marcela Salazar',
    usuarioEmail: 'diana.salazar@pintuco.com',
    usuarioRol: 'Director o Gerente',
    modulo: 'Tareas',
    accion: 'Creación de Tarea B2B',
    detalle: 'Creación de tarea "Despacho macroproyecto Torres de San Telmo" asignada a Logística.',
  },
  {
    id: 'aud-3',
    fecha: '2026-09-25 09:25:05',
    usuarioNombre: 'Álvaro Patiño Morales',
    usuarioEmail: 'alvaro.patino@pintuco.com',
    usuarioRol: 'Jefe de Área',
    modulo: 'Inventario',
    accion: 'Salida de Inventario Registrada',
    detalle: 'Deducción de 45 cuñetes de Koraza 5 para guía DESP-401.',
  },
  {
    id: 'aud-4',
    fecha: '2026-09-25 10:15:33',
    usuarioNombre: 'Laura Patricia Vélez',
    usuarioEmail: 'laura.velez@pintuco.com',
    usuarioRol: 'Agente de Atención al Cliente (SAC)',
    modulo: 'SAC',
    accion: 'Respuesta Enviada a Cliente',
    detalle: 'Respuesta al radicado CLK-SAC-2026-081 con copia a laboratorio de calidad.',
  },
];

// -------------------------------------------------------------
// NOTIFICACIONES INICIALES
// -------------------------------------------------------------
export const NOTIFICACIONES_INICIALES: NotificacionCorp[] = [
  {
    id: 'notif-1',
    destinatarioEmail: 'todos',
    tipo: 'comunicado',
    titulo: 'Renovación NTC 1335 aprobada por ICONTEC',
    mensaje: 'La Dirección General felicita a todo el equipo por el 100% de cumplimiento en ensayos de lavabilidad.',
    fecha: 'Hoy, 09:15 AM',
    leida: false,
    linkModulo: 'noticias',
  },
  {
    id: 'notif-2',
    destinatarioEmail: 'alvaro.patino@pintuco.com',
    tipo: 'tarea',
    titulo: 'Nueva tarea asignada: Despacho San Telmo',
    mensaje: 'Se le ha asignado la coordinación de 45 cuñetes con prioridad urgente.',
    fecha: 'Hoy, 08:45 AM',
    leida: false,
    linkModulo: 'tareas',
    linkId: 'task-102',
  },
  {
    id: 'notif-3',
    destinatarioEmail: 'todos',
    tipo: 'inventario',
    titulo: 'Alerta de Stock Mínimo: Aquablock 10 Años',
    mensaje: 'El stock disponible de Aquablock (180 galones) se encuentra por debajo del umbral mínimo configurado (200 GL).',
    fecha: 'Ayer, 05:20 PM',
    leida: true,
    linkModulo: 'inventario',
    linkId: 'inv-3',
  },
  {
    id: 'notif-4',
    destinatarioEmail: 'laura.velez@pintuco.com',
    tipo: 'sac',
    titulo: 'Nueva consulta técnica entrante desde la web pública',
    mensaje: 'El cliente Andrés Felipe Gómez envió una pregunta sobre sellador en muro húmedo.',
    fecha: 'Hoy, 11:20 AM',
    leida: false,
    linkModulo: 'sac',
    linkId: 'sac-102',
  },
];

// =============================================================
// STORAGE KEYS Y MÉTODOS DE ACCESO CON PERSISTENCIA
// =============================================================
const STORAGE_AREAS = 'colorlink_corp_areas';
const STORAGE_ROLES = 'colorlink_corp_roles';
const STORAGE_FUNCIONARIOS = 'colorlink_corp_funcionarios';
const STORAGE_TAREAS = 'colorlink_corp_tareas';
const STORAGE_POSTS = 'colorlink_corp_posts';
const STORAGE_TICKETS = 'colorlink_customer_tickets';
const STORAGE_INVENTARIO = 'colorlink_corp_inventario';
const STORAGE_AUDITORIA = 'colorlink_corp_auditoria';
const STORAGE_NOTIFICACIONES = 'colorlink_corp_notificaciones';

function loadOrInit<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading ${key}:`, e);
  }
  try {
    localStorage.setItem(key, JSON.stringify(initial));
  } catch (e) {}
  return initial;
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('colorlink_corporate_updated', { detail: { key } }));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

// -------------------------------------------------------------
// ÁREAS ORGANIZACIONALES
// -------------------------------------------------------------
export function getAreas(): AreaCorporativa[] {
  return loadOrInit(STORAGE_AREAS, AREAS_INICIALES);
}

export function saveAreas(areas: AreaCorporativa[]): void {
  save(STORAGE_AREAS, areas);
}

export function createArea(area: Omit<AreaCorporativa, 'id' | 'empleadosCount' | 'kpis'>): AreaCorporativa {
  const current = getAreas();
  const newArea: AreaCorporativa = {
    ...area,
    id: `area-${Date.now()}`,
    empleadosCount: 0,
    kpis: [
      { label: 'Cumplimiento Operativo', valor: '100%', meta: '90%', tendencia: '0%' },
      { label: 'Procesos Activos', valor: '3', meta: '5', tendencia: 'Normal' },
    ],
  };
  saveAreas([...current, newArea]);
  registrarAuditoria('Áreas', 'Creación de Área', `Nueva área creada: ${newArea.nombre} (${newArea.codigo})`);
  return newArea;
}

export function updateArea(id: string, updates: Partial<AreaCorporativa>): AreaCorporativa | null {
  const current = getAreas();
  let updated: AreaCorporativa | null = null;
  const next = current.map((a) => {
    if (a.id === id) {
      updated = { ...a, ...updates };
      return updated;
    }
    return a;
  });
  saveAreas(next);
  if (updated) {
    registrarAuditoria('Áreas', 'Actualización de Área', `Área modificada: ${id}`);
  }
  return updated;
}

// -------------------------------------------------------------
// FUNCIONARIOS Y USUARIOS
// -------------------------------------------------------------
export function getFuncionarios(): Funcionario[] {
  return loadOrInit(STORAGE_FUNCIONARIOS, FUNCIONARIOS_INICIALES);
}

export function saveFuncionarios(funcs: Funcionario[]): void {
  save(STORAGE_FUNCIONARIOS, funcs);
}

export function createFuncionario(data: Omit<Funcionario, 'id' | 'tareasAsignadasCount' | 'ultimoAcceso'>): Funcionario {
  const current = getFuncionarios();
  const nuevo: Funcionario = {
    ...data,
    id: `func-${Date.now()}`,
    tareasAsignadasCount: 0,
    ultimoAcceso: 'Nunca',
  };
  saveFuncionarios([...current, nuevo]);
  
  // Actualizar contador del área
  const areas = getAreas();
  const nextAreas = areas.map((a) => a.id === nuevo.areaId ? { ...a, empleadosCount: a.empleadosCount + 1 } : a);
  saveAreas(nextAreas);

  registrarAuditoria('Usuarios', 'Creación de Funcionario', `Funcionario creado: ${nuevo.nombre} (${nuevo.email}) con rol ${nuevo.rolNombre}`);
  return nuevo;
}

export function updateFuncionario(id: string, updates: Partial<Funcionario>): Funcionario | null {
  const current = getFuncionarios();
  let updated: Funcionario | null = null;
  const next = current.map((f) => {
    if (f.id === id) {
      updated = { ...f, ...updates };
      return updated;
    }
    return f;
  });
  saveFuncionarios(next);
  if (updated) {
    registrarAuditoria('Usuarios', 'Edición de Funcionario', `Datos actualizados para: ${id}`);
  }
  return updated;
}

// -------------------------------------------------------------
// TAREAS
// -------------------------------------------------------------
export function getTareas(): TareaLaboral[] {
  return loadOrInit(STORAGE_TAREAS, TAREAS_INICIALES);
}

export function saveTareas(tareas: TareaLaboral[]): void {
  save(STORAGE_TAREAS, tareas);
}

export function createTarea(tarea: Omit<TareaLaboral, 'id' | 'fechaCreacion' | 'comentarios' | 'historial' | 'progresoPct'>): TareaLaboral {
  const current = getTareas();
  const nueva: TareaLaboral = {
    ...tarea,
    id: `task-${Date.now()}`,
    fechaCreacion: new Date().toISOString().split('T')[0],
    progresoPct: 0,
    comentarios: [],
    historial: [
      {
        id: `h-${Date.now()}`,
        fecha: new Date().toLocaleString(),
        usuario: tarea.creadorNombre,
        accion: `Tarea creada y asignada a ${tarea.responsableNombre}`,
      },
    ],
  };
  saveTareas([nueva, ...current]);
  
  // Notificación al responsable
  crearNotificacion({
    destinatarioEmail: nueva.responsableEmail,
    tipo: 'tarea',
    titulo: `Nueva tarea asignada: ${nueva.titulo}`,
    mensaje: `Se le ha asignado una tarea en el área ${nueva.areaNombre} con fecha límite ${nueva.fechaLimite}.`,
    linkModulo: 'tareas',
    linkId: nueva.id,
  });

  registrarAuditoria('Tareas', 'Creación de Tarea', `Tarea creada: "${nueva.titulo}" asignada a ${nueva.responsableNombre}`);
  return nueva;
}

export function updateTarea(id: string, updates: Partial<TareaLaboral>, usuarioAccion = 'Sistema'): TareaLaboral | null {
  const current = getTareas();
  let updated: TareaLaboral | null = null;
  const next = current.map((t) => {
    if (t.id === id) {
      const historial = [...t.historial];
      if (updates.estado && updates.estado !== t.estado) {
        historial.push({
          id: `h-${Date.now()}`,
          fecha: new Date().toLocaleString(),
          usuario: usuarioAccion,
          accion: `Estado cambiado de ${t.estado} a ${updates.estado}`,
        });
      }
      if (updates.progresoPct !== undefined && updates.progresoPct !== t.progresoPct) {
        historial.push({
          id: `h-${Date.now()}`,
          fecha: new Date().toLocaleString(),
          usuario: usuarioAccion,
          accion: `Avance actualizado a ${updates.progresoPct}%`,
        });
      }
      updated = { ...t, ...updates, historial };
      return updated;
    }
    return t;
  });
  saveTareas(next);
  if (updated) {
    registrarAuditoria('Tareas', 'Actualización de Tarea', `Tarea ${id} actualizada por ${usuarioAccion}`);
  }
  return updated;
}

// -------------------------------------------------------------
// COMUNIDAD Y PUBLICACIONES
// -------------------------------------------------------------
export function getPublicaciones(): PublicacionComunidad[] {
  return loadOrInit(STORAGE_POSTS, PUBLICACIONES_INICIALES);
}

export function savePublicaciones(posts: PublicacionComunidad[]): void {
  save(STORAGE_POSTS, posts);
}

export function createPublicacion(post: Omit<PublicacionComunidad, 'id' | 'fecha' | 'meGusta' | 'usuariosMeGusta' | 'comentarios'>): PublicacionComunidad {
  const current = getPublicaciones();
  const nueva: PublicacionComunidad = {
    ...post,
    id: `post-${Date.now()}`,
    fecha: 'Hace un momento',
    meGusta: 0,
    usuariosMeGusta: [],
    comentarios: [],
  };
  savePublicaciones([nueva, ...current]);

  if (nueva.fijado) {
    crearNotificacion({
      destinatarioEmail: 'todos',
      tipo: 'comunicado',
      titulo: `Comunicado Oficial: ${nueva.titulo}`,
      mensaje: nueva.contenido.slice(0, 120) + '...',
      linkModulo: 'noticias',
    });
  }

  registrarAuditoria('Comunidad', 'Publicación Creada', `Post publicado: "${nueva.titulo}" por ${nueva.autorNombre}`);
  return nueva;
}

// -------------------------------------------------------------
// SAC / ATENCIÓN AL CLIENTE (CONEXIÓN PÚBLICA / INTRANET)
// -------------------------------------------------------------
export function getTicketsSAC(): TicketSAC[] {
  return loadOrInit(STORAGE_TICKETS, TICKETS_SAC_INICIALES);
}

export function saveTicketsSAC(tickets: TicketSAC[]): void {
  save(STORAGE_TICKETS, tickets);
  window.dispatchEvent(new CustomEvent('colorlink_tickets_updated', { detail: tickets }));
}

/**
 * Radicar consulta desde la web pública (Chat / Formulario PQR / Cotizador)
 */
export function radicarConsultaWeb(consulta: {
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono?: string;
  canal: TicketSAC['canal'];
  asunto: string;
  mensaje: string;
  categoria?: TicketSAC['categoria'];
}): TicketSAC {
  const current = getTicketsSAC();
  const nuevoRadicado = `CLK-SAC-2026-${String(current.length + 85).padStart(3, '0')}`;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const nuevoTicket: TicketSAC = {
    id: `sac-${Date.now()}`,
    radicado: nuevoRadicado,
    clienteNombre: consulta.clienteNombre.trim() || 'Visitante Web',
    clienteEmail: consulta.clienteEmail.trim() || 'anonimo@cliente.com',
    clienteTelefono: consulta.clienteTelefono?.trim() || '+57 300 000 0000',
    canal: consulta.canal,
    asunto: consulta.asunto.trim() || 'Consulta técnica en línea',
    mensaje: consulta.mensaje.trim(),
    fechaCreacion: now,
    fechaUltimaActividad: now,
    estado: 'Nuevo',
    prioridad: 'Media',
    categoria: consulta.categoria || 'Asesoría Técnica Pinturas',
    slaHorasLimite: 8,
    slaVencido: false,
    mensajes: [
      {
        id: `msg-${Date.now()}`,
        remitenteTipo: 'cliente',
        remitenteNombre: consulta.clienteNombre.trim() || 'Cliente',
        texto: consulta.mensaje.trim(),
        fecha: now,
      },
    ],
  };

  saveTicketsSAC([nuevoTicket, ...current]);

  // Notificar al equipo SAC en la intranet
  crearNotificacion({
    destinatarioEmail: 'laura.velez@pintuco.com',
    tipo: 'sac',
    titulo: `Nuevo mensaje de cliente: ${nuevoTicket.asunto}`,
    mensaje: `${nuevoTicket.clienteNombre} envió una consulta por el canal ${nuevoTicket.canal}. Radicado: ${nuevoTicket.radicado}.`,
    linkModulo: 'sac',
    linkId: nuevoTicket.id,
  });

  registrarAuditoria('SAC', 'Recepción de Mensaje Web', `Radicado entrante ${nuevoTicket.radicado} desde ${nuevoTicket.canal} por ${nuevoTicket.clienteNombre}`);
  return nuevoTicket;
}

/**
 * Responder ticket desde la Intranet hacia el cliente
 */
export function responderTicketSAC(
  ticketId: string, 
  respuestaTexto: string, 
  agenteNombre: string, 
  agenteAvatar: string,
  esNotaInterna = false
): TicketSAC | null {
  const current = getTicketsSAC();
  let updatedTicket: TicketSAC | null = null;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const next = current.map((t) => {
    if (t.id === ticketId) {
      const nuevoMensaje: MensajeTicket = {
        id: `msg-${Date.now()}`,
        remitenteTipo: 'agente',
        remitenteNombre: agenteNombre,
        remitenteAvatar: agenteAvatar,
        texto: respuestaTexto.trim(),
        fecha: now,
        esNotaInterna,
      };

      updatedTicket = {
        ...t,
        fechaUltimaActividad: now,
        estado: esNotaInterna ? t.estado : (t.estado === 'Nuevo' ? 'En proceso' : t.estado),
        mensajes: [...t.mensajes, nuevoMensaje],
      };
      return updatedTicket;
    }
    return t;
  });

  saveTicketsSAC(next);

  if (updatedTicket) {
    registrarAuditoria('SAC', esNotaInterna ? 'Nota Interna Agregada' : 'Respuesta a Cliente Enviada', `Agente ${agenteNombre} respondió ticket ${(updatedTicket as TicketSAC).radicado}`);
  }
  return updatedTicket;
}

// -------------------------------------------------------------
// INVENTARIO Y BODEGA (MATRIZ COMPLETA DE COLORLINK)
// -------------------------------------------------------------
export function getStockEnSede(item: ItemInventarioCorp, sedeId: string): number {
  if (!item) return 0;
  if (!sedeId || sedeId === 'todas') {
    return item.stockUnidades ?? item.stockGalones ?? 0;
  }
  if (item.stockPorSede && item.stockPorSede[sedeId] !== undefined) {
    return item.stockPorSede[sedeId];
  }
  return 0;
}

export function sanitizeInventarioItem(item: any): ItemInventarioCorp {
  if (!item) return {} as ItemInventarioCorp;
  const gal = Number(item.stockGalones) || 0;
  const pres = (item.presentacion || item.medida || '').toLowerCase();
  
  let defaultUnidades = gal;
  if (pres.includes('cuñete') || pres.includes('5')) {
    defaultUnidades = item.stockCunetes !== undefined ? Number(item.stockCunetes) : Math.floor(gal / 5);
  } else if (pres.includes('cuarto') || pres.includes('1/4')) {
    defaultUnidades = Math.round(gal * 4);
  }

  const stockUnidades = item.stockUnidades !== undefined ? Math.max(0, Number(item.stockUnidades)) : Math.max(0, defaultUnidades);

  // Inicializar o sanitizar existencias por sede si no existen
  let stockPorSede: Record<string, number> = {};
  if (item.stockPorSede && typeof item.stockPorSede === 'object' && Object.keys(item.stockPorSede).length > 0) {
    stockPorSede = { ...item.stockPorSede };
  } else {
    // Reparto representativo por sedes CEDI oficial
    const u = stockUnidades;
    const bog = Math.round(u * 0.35);
    const rio = Math.round(u * 0.30);
    const med = Math.round(u * 0.15);
    const cal = Math.round(u * 0.10);
    const bar = Math.round(u * 0.05);
    const buc = Math.max(0, u - (bog + rio + med + cal + bar));
    stockPorSede = {
      bogota: bog,
      rionegro: rio,
      medellin: med,
      cali: cal,
      barranquilla: bar,
      bucaramanga: buc,
    };
  }

  return {
    ...item,
    id: item.id || `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sku: item.sku || 'PIN-SKU',
    nombre: item.nombre || 'Producto Pintuco',
    marca: item.marca || 'Pintuco',
    categoria: item.categoria || 'Pintura Interior',
    stockGalones: gal,
    stockCunetes: item.stockCunetes !== undefined ? Number(item.stockCunetes) : Math.floor(gal / 5),
    stockUnidades,
    stockPorSede,
    stockMinimoGalones: Number(item.stockMinimoGalones) || 20,
    stockMinimoUnidades: item.stockMinimoUnidades !== undefined ? Number(item.stockMinimoUnidades) : Math.max(5, Math.round(stockUnidades * 0.2)),
    precioVentaGL: Number(item.precioVentaGL) || 84900,
    costoUnitarioGL: Number(item.costoUnitarioGL) || 52000,
    ubicacionBodega: item.ubicacionBodega || 'CEDI Rionegro',
    activo: item.activo !== false,
    movimientos: Array.isArray(item.movimientos) ? item.movimientos : [],
  };
}

export function getInventarioCorp(): ItemInventarioCorp[] {
  const loaded = loadOrInit(STORAGE_INVENTARIO, INVENTARIO_CATALOGO_COMPLETO);
  // Si la versión guardada en localStorage es la versión antigua de pocas referencias (< 50),
  // actualizamos automáticamente a la matriz completa del catálogo oficial
  if (Array.isArray(loaded) && loaded.length < 50) {
    save(STORAGE_INVENTARIO, INVENTARIO_CATALOGO_COMPLETO);
    return INVENTARIO_CATALOGO_COMPLETO.map(sanitizeInventarioItem);
  }
  if (!Array.isArray(loaded)) return INVENTARIO_CATALOGO_COMPLETO.map(sanitizeInventarioItem);
  return loaded.map(sanitizeInventarioItem);
}

export function saveInventarioCorp(items: ItemInventarioCorp[]): void {
  save(STORAGE_INVENTARIO, (items || []).map(sanitizeInventarioItem));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('colorlink_inventory_updated', { detail: items }));
  }
}

export function registrarMovimientoStock(
  itemId: string,
  tipo: MovimientoInventario['tipo'],
  cantidad: number,
  motivo: string,
  usuarioNombre: string,
  sedeId: string = 'bogota',
  sedeNombre?: string
): ItemInventarioCorp | null {
  const current = getInventarioCorp();
  let updated: ItemInventarioCorp | null = null;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const targetSede = SEDES_CEDI_CONFIG.find((s) => s.id === sedeId);
  const resolvedSedeNombre = sedeNombre || targetSede?.nombre || 'Bogotá - CEDI Principal';

  const next = current.map((item) => {
    if (item.id === itemId) {
      let delta = cantidad;
      if (tipo === 'Salida') delta = -Math.abs(cantidad);
      if (tipo === 'Entrada') delta = Math.abs(cantidad);

      // Descuento / aumento en unidades y galones
      const presNorm = (item.presentacion || item.medida || '').toLowerCase();
      let factorGal = 1;
      if (presNorm.includes('cuñete') || presNorm.includes('5')) factorGal = 5;
      else if (presNorm.includes('cuarto') || presNorm.includes('1/4')) factorGal = 0.25;

      const galonesDelta = Math.round(delta * factorGal);
      const nuevoStockGal = Math.max(0, item.stockGalones + galonesDelta);
      const nuevoCunetes = Math.floor(nuevoStockGal / 5);
      const nuevoStockUnidades = Math.max(0, (item.stockUnidades ?? item.stockGalones ?? 0) + delta);

      const stockPorSede = { ...(item.stockPorSede || {}) };
      const currentEnSede = stockPorSede[sedeId] ?? Math.round(nuevoStockUnidades * 0.3);
      stockPorSede[sedeId] = Math.max(0, currentEnSede + delta);

      const nuevoMov: MovimientoInventario = {
        id: `mov-${Date.now()}`,
        fecha: now,
        tipo,
        cantidadGalones: Math.abs(galonesDelta),
        cantidadUnidades: Math.abs(cantidad),
        motivo,
        usuarioNombre,
        stockPosterior: nuevoStockUnidades,
        sede: resolvedSedeNombre,
        sku: item.sku,
        varianteNombre: item.nombre,
      };

      updated = {
        ...item,
        stockGalones: nuevoStockGal,
        stockCunetes: nuevoCunetes,
        stockUnidades: nuevoStockUnidades,
        stockPorSede,
        movimientos: [nuevoMov, ...item.movimientos],
      };
      return updated;
    }
    return item;
  });

  saveInventarioCorp(next);
  if (updated) {
    registrarAuditoria('Inventario', 'Movimiento de Stock', `${tipo} de ${cantidad} unidades (${resolvedSedeNombre}) en ${(updated as ItemInventarioCorp).sku} por ${usuarioNombre}`);
  }
  return updated;
}

export function crearProductoInventario(
  producto: {
    nombre: string;
    categoria: string;
    sku: string;
    precioVentaGL: number;
    stockGalones: number;
    stockMinimoGalones?: number;
    ubicacionBodega?: string;
    marca?: 'Pintuco' | 'Color In';
    costoUnitarioGL?: number;
  },
  usuarioNombre: string
): ItemInventarioCorp {
  const current = getInventarioCorp();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const stockGal = Math.max(0, Number(producto.stockGalones) || 0);
  const cunetes = Math.floor(stockGal / 5);

  const newItem: ItemInventarioCorp = {
    id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sku: producto.sku.trim().toUpperCase(),
    nombre: producto.nombre.trim(),
    marca: producto.marca || 'Pintuco',
    categoria: producto.categoria.trim() || 'Pintura General',
    stockGalones: stockGal,
    stockCunetes: cunetes,
    stockMinimoGalones: Number(producto.stockMinimoGalones) || 50,
    ubicacionBodega: producto.ubicacionBodega?.trim() || 'CEDI Rionegro - Bodega Principal',
    costoUnitarioGL: Number(producto.costoUnitarioGL) || Math.round((Number(producto.precioVentaGL) || 85000) * 0.65),
    precioVentaGL: Number(producto.precioVentaGL) || 85000,
    activo: true,
    movimientos: [
      {
        id: `mov-${Date.now()}`,
        fecha: now,
        tipo: 'Entrada',
        cantidadGalones: stockGal,
        motivo: 'Alta de nuevo producto en catálogo y bodega corporativa',
        usuarioNombre,
        stockPosterior: stockGal,
      },
    ],
  };

  const next = [newItem, ...current];
  saveInventarioCorp(next);
  registrarAuditoria(
    'Inventario',
    'Creación de Producto',
    `Producto "${newItem.nombre}" (SKU: ${newItem.sku}) creado con stock inicial de ${stockGal} GL por ${usuarioNombre}`
  );
  return newItem;
}

/**
 * Crea una matriz estructurada de variantes por Color + Tamaño a partir de un producto base,
 * generando SKUs únicos, existencias individuales y trazabilidad Kardex en tiempo real.
 */
export function crearMatrizVariantesInventario(
  productoBase: {
    nombre: string;
    categoria: string;
    marca: 'Pintuco' | 'Color In';
    skuBase: string;
    ubicacionBodega?: string;
  },
  variantes: Array<{
    sku: string;
    color: string;
    colorHex?: string;
    presentacion: string;
    precioVentaGL: number;
    stockGalones: number;
    stockMinimoGalones: number;
    costoUnitarioGL?: number;
  }> = [],
  usuarioNombre: string
): ItemInventarioCorp[] {
  const current = getInventarioCorp();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const baseSku = (productoBase?.skuBase || 'PIN-PROD').toLowerCase().replace(/[^a-z0-9]/g, '-');
  const baseId = `prod-${baseSku}-${Date.now().toString().slice(-4)}`;

  const safeVariantes = Array.isArray(variantes) ? variantes : [];
  const nuevosItems: ItemInventarioCorp[] = safeVariantes.map((v, idx) => {
    const pres = v.presentacion || 'Galón';
    const isCuñete = pres.includes('Cuñete') || pres.includes('5');
    const isCuarto = pres.includes('Cuarto') || pres.includes('1/4');
    const isUnidad = pres.includes('Unidad');
    
    // Calcular galones y unidades
    let galonesEquiv = Number(v.stockGalones) || 0;
    let unidades = galonesEquiv;
    if (isCuñete) {
      unidades = galonesEquiv;
      galonesEquiv = unidades * 5;
    } else if (isCuarto) {
      unidades = galonesEquiv;
      galonesEquiv = Math.round(unidades * 0.25);
    }

    const skuClean = v.sku.trim().toUpperCase();
    const itemId = `inv-${baseId}-${v.color.slice(0, 3).toLowerCase()}-${v.presentacion.slice(0, 3).toLowerCase()}-${idx}`;

    return {
      id: itemId,
      sku: skuClean,
      nombre: `${productoBase.nombre} - ${v.color} (${v.presentacion})`,
      marca: productoBase.marca || 'Pintuco',
      categoria: productoBase.categoria || 'Pintura Interior',
      productoBaseId: baseId,
      productoBaseNombre: productoBase.nombre,
      color: v.color,
      colorHex: v.colorHex || '#CBD5E1',
      presentacion: v.presentacion,
      medida: v.presentacion,
      stockGalones: galonesEquiv,
      stockCunetes: Math.floor(galonesEquiv / 5),
      stockUnidades: unidades,
      stockMinimoGalones: Number(v.stockMinimoGalones) || 20,
      ubicacionBodega: productoBase.ubicacionBodega || 'CEDI Rionegro - Pasillo A-01',
      costoUnitarioGL: v.costoUnitarioGL || Math.round(v.precioVentaGL * 0.62),
      precioVentaGL: Number(v.precioVentaGL) || 79900,
      activo: true,
      movimientos: [
        {
          id: `mov-${Date.now()}-${idx}`,
          fecha: now,
          tipo: 'Entrada',
          cantidadGalones: galonesEquiv,
          motivo: `Alta de matriz ${v.color} (${v.presentacion}) en CEDI`,
          usuarioNombre,
          stockPosterior: galonesEquiv,
        },
      ],
    };
  });

  const next = [...nuevosItems, ...current];
  saveInventarioCorp(next);
  registrarAuditoria(
    'Inventario',
    'Creación de Matriz de Variantes',
    `Matriz de ${nuevosItems.length} variantes creada para "${productoBase.nombre}" (Base SKU: ${productoBase.skuBase}) por ${usuarioNombre}`
  );

  return next;
}

export function actualizarProductoInventario(
  id: string,
  datos: Partial<ItemInventarioCorp>,
  usuarioNombre: string
): ItemInventarioCorp | null {
  const current = getInventarioCorp();
  let updated: ItemInventarioCorp | null = null;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const next = current.map((item) => {
    if (item.id === id) {
      const stockAnterior = item.stockGalones;
      const nuevoStock = datos.stockGalones !== undefined ? Math.max(0, Number(datos.stockGalones)) : item.stockGalones;
      const stockCunetes = Math.floor(nuevoStock / 5);

      const movimientos = [...item.movimientos];
      if (nuevoStock !== stockAnterior) {
        const delta = nuevoStock - stockAnterior;
        movimientos.unshift({
          id: `mov-${Date.now()}`,
          fecha: now,
          tipo: delta > 0 ? 'Entrada' : 'Ajuste Inventario',
          cantidadGalones: Math.abs(delta),
          motivo: 'Ajuste operativo al editar ficha de producto',
          usuarioNombre,
          stockPosterior: nuevoStock,
        });
      }

      updated = {
        ...item,
        ...datos,
        stockGalones: nuevoStock,
        stockCunetes,
        movimientos,
      };
      return updated;
    }
    return item;
  });

  if (updated) {
    saveInventarioCorp(next);
    registrarAuditoria(
      'Inventario',
      'Edición de Producto',
      `Producto SKU ${(updated as ItemInventarioCorp).sku} ("${(updated as ItemInventarioCorp).nombre}") modificado por ${usuarioNombre}`
    );
  }
  return updated;
}

export function eliminarODesactivarProductoInventario(
  id: string,
  usuarioNombre: string,
  accion: 'desactivar' | 'activar' | 'eliminar' = 'desactivar'
): ItemInventarioCorp[] {
  const current = getInventarioCorp();
  const target = current.find((item) => item.id === id);
  if (!target) return current;

  let next: ItemInventarioCorp[];
  if (accion === 'eliminar') {
    next = current.filter((item) => item.id !== id);
    registrarAuditoria(
      'Inventario',
      'Eliminación de Producto',
      `Producto SKU ${target.sku} ("${target.nombre}") eliminado definitivamente por ${usuarioNombre}`
    );
  } else {
    const nuevoEstado = accion === 'activar';
    next = current.map((item) => (item.id === id ? { ...item, activo: nuevoEstado } : item));
    registrarAuditoria(
      'Inventario',
      nuevoEstado ? 'Activación de Producto' : 'Desactivación de Producto',
      `Producto SKU ${target.sku} ("${target.nombre}") ${nuevoEstado ? 'activado' : 'desactivado/inactivado'} por ${usuarioNombre}`
    );
  }

  saveInventarioCorp(next);
  return next;
}

// -------------------------------------------------------------
// AUDITORÍA
// -------------------------------------------------------------
export function getAuditoria(): RegistroAuditoria[] {
  return loadOrInit(STORAGE_AUDITORIA, AUDITORIA_INICIAL);
}

export function registrarAuditoria(modulo: RegistroAuditoria['modulo'], accion: string, detalle: string, usuarioNombre = 'Administrador General'): void {
  const current = getAuditoria();
  const nuevo: RegistroAuditoria = {
    id: `aud-${Date.now()}`,
    fecha: new Date().toISOString().replace('T', ' ').slice(0, 19),
    usuarioNombre,
    usuarioEmail: `${usuarioNombre.toLowerCase().replace(/[^a-z]/g, '.')}@pintuco.com`,
    usuarioRol: 'Personal Autorizado',
    modulo,
    accion,
    detalle,
  };
  save(STORAGE_AUDITORIA, [nuevo, ...current.slice(0, 99)]); // Guardar últimos 100
}

// -------------------------------------------------------------
// NOTIFICACIONES
// -------------------------------------------------------------
export function getNotificaciones(): NotificacionCorp[] {
  return loadOrInit(STORAGE_NOTIFICACIONES, NOTIFICACIONES_INICIALES);
}

export function crearNotificacion(notif: Omit<NotificacionCorp, 'id' | 'fecha' | 'leida'>): void {
  const current = getNotificaciones();
  const nueva: NotificacionCorp = {
    ...notif,
    id: `notif-${Date.now()}`,
    fecha: 'Hace un momento',
    leida: false,
  };
  save(STORAGE_NOTIFICACIONES, [nueva, ...current]);
}

export function marcarNotificacionLeida(id: string): void {
  const current = getNotificaciones();
  const next = current.map((n) => (n.id === id ? { ...n, leida: true } : n));
  save(STORAGE_NOTIFICACIONES, next);
}

export function marcarTodasNotificacionesLeidas(): void {
  const current = getNotificaciones();
  const next = current.map((n) => ({ ...n, leida: true }));
  save(STORAGE_NOTIFICACIONES, next);
}

// -------------------------------------------------------------
// DESCUENTO AUTOMÁTICO DE INVENTARIO Y TRAZABILIDAD (KARDEX)
// -------------------------------------------------------------
export interface ResultadoDescuentoInventario {
  exito: boolean;
  totalDescontadoGalones: number;
  itemsDescontados: Array<{
    sku: string;
    nombre: string;
    cantidadUnidades: number;
    cantidadGalones: number;
    stockAnterior: number;
    stockNuevo: number;
  }>;
  mensaje?: string;
}

export const STORAGE_DISCOUNTED_ORDERS = 'colorlink_discounted_orders_v1';

export function isOrderAlreadyDiscounted(orderNumber: string): boolean {
  if (!orderNumber || typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(STORAGE_DISCOUNTED_ORDERS);
    const list: string[] = raw ? JSON.parse(raw) : [];
    return list.includes(orderNumber);
  } catch {
    return false;
  }
}

export function markOrderAsDiscounted(orderNumber: string): void {
  if (!orderNumber || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_DISCOUNTED_ORDERS);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(orderNumber)) {
      list.push(orderNumber);
      localStorage.setItem(STORAGE_DISCOUNTED_ORDERS, JSON.stringify(list));
    }
  } catch {}
}

/**
 * Resuelve la Sede CEDI asignada para el despacho según hub, sedeId o ciudad del pedido.
 */
export function resolverSedeDespacho(pedido: any): { id: string; nombre: string } {
  const directId = (
    pedido.sedeId ||
    pedido.sedeDestinoId ||
    pedido.hubDespacho ||
    pedido.form?.hub_despacho ||
    pedido.form?.sede_despacho ||
    pedido.form?.sede ||
    ''
  ).toLowerCase();

  for (const s of SEDES_CEDI_CONFIG) {
    if (directId.includes(s.id) || directId.includes(s.ciudad.toLowerCase())) {
      return { id: s.id, nombre: s.nombre };
    }
  }

  const ciudad = (
    pedido.ciudadEntrega ||
    pedido.form?.ciudad ||
    pedido.form?.ciudad_obra ||
    pedido.form?.ciudadEntrega ||
    ''
  ).toLowerCase();

  if (
    ciudad.includes('medellin') ||
    ciudad.includes('valle de aburra') ||
    ciudad.includes('bello') ||
    ciudad.includes('envigado') ||
    ciudad.includes('itagui') ||
    ciudad.includes('sabaneta')
  ) {
    return { id: 'medellin', nombre: 'Medellín - CEDI Regional' };
  }
  if (
    ciudad.includes('rionegro') ||
    ciudad.includes('oriente') ||
    ciudad.includes('marinilla') ||
    ciudad.includes('guarne')
  ) {
    return { id: 'rionegro', nombre: 'CEDI Rionegro - Planta Principal' };
  }
  if (
    ciudad.includes('cali') ||
    ciudad.includes('valle') ||
    ciudad.includes('yumbo') ||
    ciudad.includes('palmira') ||
    ciudad.includes('jamundi')
  ) {
    return { id: 'cali', nombre: 'Cali - CEDI Occidente' };
  }
  if (
    ciudad.includes('barranquilla') ||
    ciudad.includes('cartagena') ||
    ciudad.includes('santa marta') ||
    ciudad.includes('soledad') ||
    ciudad.includes('atlantico') ||
    ciudad.includes('bolivar')
  ) {
    return { id: 'barranquilla', nombre: 'Barranquilla - CEDI Caribe' };
  }
  if (
    ciudad.includes('bucaramanga') ||
    ciudad.includes('floridablanca') ||
    ciudad.includes('giron') ||
    ciudad.includes('piedecuesta') ||
    ciudad.includes('santander')
  ) {
    return { id: 'bucaramanga', nombre: 'Bucaramanga - CEDI Santander' };
  }

  return { id: 'bogota', nombre: 'Bogotá - CEDI Principal' };
}

/**
 * Descuenta automáticamente del inventario la cantidad exacta de la variante
 * (Color + Tamaño / Presentación) seleccionada en el pedido, y registra el Kardex.
 */
export function descontarInventarioPorPedido(
  pedido: {
    id?: string;
    numeroOrden: string;
    form?: any;
    calculo?: any;
    items?: any[];
    customerName?: string;
    hubDespacho?: string;
    sedeId?: string;
    ciudadEntrega?: string;
  },
  usuarioResponsable: string = 'Sistema Logística CEDI'
): ResultadoDescuentoInventario {
  const ordenNum = pedido.numeroOrden || `ORD-${Date.now().toString().slice(-6)}`;

  // Control de idempotencia estricto: evita doble descuento de inventario
  if (isOrderAlreadyDiscounted(ordenNum)) {
    return {
      exito: false,
      totalDescontadoGalones: 0,
      itemsDescontados: [],
      mensaje: `El pedido ${ordenNum} ya fue descontado previamente del inventario.`,
    };
  }

  const inventario = getInventarioCorp();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const clienteNombre = pedido.form?.nombre_razon_social || pedido.customerName || 'Cliente COLORLINK';

  let itemsDescontados: ResultadoDescuentoInventario['itemsDescontados'] = [];
  let totalGalonesDescontados = 0;

  // Lista temporal mutable
  const inventarioActualizado = inventario.map((invItem) => ({ ...invItem }));

  // Helper para buscar un item en inventario
  const buscarItem = (criterios: {
    sku?: string;
    productoNombre?: string;
    color?: string;
    presentacion?: string;
  }): ItemInventarioCorp | undefined => {
    // 1. Por SKU exacto
    if (criterios.sku) {
      const cleanSku = criterios.sku.trim().toUpperCase();
      const porSku = inventarioActualizado.find(
        (i) => i.sku.trim().toUpperCase() === cleanSku
      );
      if (porSku) return porSku;
    }

    // 2. Por Producto Base + Color + Presentación
    if (criterios.productoNombre) {
      const normNombre = criterios.productoNombre.toLowerCase();
      const normColor = (criterios.color || '').toLowerCase();
      const normPres = (criterios.presentacion || '').toLowerCase();

      // Intento por color y presentación
      const match = inventarioActualizado.find((i) => {
        const iProd = (i.productoBaseNombre || i.nombre).toLowerCase();
        const sameProd = iProd.includes(normNombre) || normNombre.includes(iProd);
        if (!sameProd) return false;

        const iColor = (i.color || '').toLowerCase();
        const sameColor = !normColor || iColor.includes(normColor) || normColor.includes(iColor);

        const iPres = (i.presentacion || i.medida || '').toLowerCase();
        const samePres = !normPres || iPres.includes(normPres) || normPres.includes(iPres);

        return sameColor && samePres;
      });

      if (match) return match;

      // Intento solo por producto y presentación
      const matchPres = inventarioActualizado.find((i) => {
        const iProd = (i.productoBaseNombre || i.nombre).toLowerCase();
        const sameProd = iProd.includes(normNombre) || normNombre.includes(iProd);
        if (!sameProd) return false;
        const iPres = (i.presentacion || i.medida || '').toLowerCase();
        return !normPres || iPres.includes(normPres) || normPres.includes(iPres);
      });

      if (matchPres) return matchPres;

      // Fallback: solo por producto base
      return inventarioActualizado.find((i) => {
        const iProd = (i.productoBaseNombre || i.nombre).toLowerCase();
        return iProd.includes(normNombre) || normNombre.includes(iProd);
      });
    }

    return undefined;
  };

  // 1. Identificar la Sede / CEDI asignada para el despacho
  const sedeAsignada = resolverSedeDespacho(pedido);
  const sedeId = sedeAsignada.id;
  const sedeNombre = sedeAsignada.nombre;

  // CASO A: El pedido tiene items de Carrito (E-commerce / Shopping Cart)
  if (pedido.items && pedido.items.length > 0) {
    for (const cartItem of pedido.items) {
      const match = buscarItem({
        sku: cartItem.sku,
        productoNombre: cartItem.nombre,
        color: cartItem.colorSeleccionado,
        presentacion: cartItem.presentacion || cartItem.varianteSeleccionada,
      });

      if (match) {
        // Calcular galones equivalentes según presentación
        const unidades = Math.max(1, Number(cartItem.cantidad) || 1);
        let factorGal = 1;
        const presNorm = (match.presentacion || cartItem.presentacion || '').toLowerCase();
        if (presNorm.includes('cuñete') || presNorm.includes('5')) factorGal = 5;
        else if (presNorm.includes('cuarto') || presNorm.includes('1/4')) factorGal = 0.25;
        else if (presNorm.includes('unidad')) factorGal = 1;

        const galonesADescontar = Math.max(1, Math.round(unidades * factorGal));
        const stockAnterior = match.stockGalones;
        const stockNuevo = Math.max(0, stockAnterior - galonesADescontar);
        match.stockGalones = stockNuevo;
        match.stockCunetes = Math.floor(stockNuevo / 5);
        const stockUnidadesAnt = match.stockUnidades ?? match.stockGalones ?? 0;
        match.stockUnidades = Math.max(0, stockUnidadesAnt - unidades);

        // Descontar en la sede específica
        if (!match.stockPorSede) match.stockPorSede = {};
        const currentSedeStock = match.stockPorSede[sedeId] ?? Math.round(stockUnidadesAnt * 0.3);
        match.stockPorSede[sedeId] = Math.max(0, currentSedeStock - unidades);

        // 3. Generar entrada automática en el "Historial Kardex"
        const nuevoMov: MovimientoInventario = {
          id: `mov-salida-${ordenNum}-${match.sku}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          fecha: now,
          tipo: 'Salida por Venta / Despacho',
          cantidadGalones: galonesADescontar,
          cantidadUnidades: unidades,
          motivo: `Salida por Venta / Despacho - Orden ${ordenNum} [${match.sku} -${unidades} Unds] para cliente: ${clienteNombre}`,
          usuarioNombre: usuarioResponsable,
          clienteNombre: clienteNombre,
          stockPosterior: match.stockUnidades,
          sede: sedeNombre,
          sedeId: sedeId,
          sedeNombre: sedeNombre,
          sku: match.sku,
          varianteNombre: match.nombre,
          numeroOrden: ordenNum,
          detalle: `SKU: ${match.sku} | Cantidad: -${unidades} Unds (${galonesADescontar} GL) | Fecha/Hora: ${now} | Cliente: ${clienteNombre}`,
        };
        match.movimientos = [nuevoMov, ...(match.movimientos || [])];

        itemsDescontados.push({
          sku: match.sku,
          nombre: match.nombre,
          cantidadUnidades: unidades,
          cantidadGalones: galonesADescontar,
          stockAnterior,
          stockNuevo,
        });
        totalGalonesDescontados += galonesADescontar;
      }
    }
  }

  // CASO B: El pedido proviene de la Calculadora / Cotizador FMV (Volumetría calculada)
  if (pedido.calculo) {
    const calc = pedido.calculo;
    const form = pedido.form || {};
    const prodNombre = form.producto_deseado || calc.productoSugerido || 'Viniltex Avanzado';
    const colorSeleccionado = form.color_acabado || 'Blanco Puro Mate 1001';

    // 1. Descontar cuñetes de pintura si hay
    if (calc.cuñetesPintura && calc.cuñetesPintura > 0) {
      const matchCunete = buscarItem({
        productoNombre: prodNombre,
        color: colorSeleccionado,
        presentacion: 'Cuñete (5 Gal)',
      });

      if (matchCunete) {
        const unidades = calc.cuñetesPintura;
        const galonesADescontar = unidades * 5;
        const stockAnterior = matchCunete.stockGalones;
        const stockNuevo = Math.max(0, stockAnterior - galonesADescontar);
        matchCunete.stockGalones = stockNuevo;
        matchCunete.stockCunetes = Math.floor(stockNuevo / 5);
        const stockUnidadesAnt = matchCunete.stockUnidades ?? matchCunete.stockCunetes ?? 0;
        matchCunete.stockUnidades = Math.max(0, stockUnidadesAnt - unidades);

        if (!matchCunete.stockPorSede) matchCunete.stockPorSede = {};
        const currSede = matchCunete.stockPorSede[sedeId] ?? Math.round(stockUnidadesAnt * 0.3);
        matchCunete.stockPorSede[sedeId] = Math.max(0, currSede - unidades);

        const nuevoMov: MovimientoInventario = {
          id: `mov-salida-${ordenNum}-cun-${Date.now()}`,
          fecha: now,
          tipo: 'Salida por Venta / Despacho',
          cantidadGalones: galonesADescontar,
          cantidadUnidades: unidades,
          motivo: `Salida por Venta / Despacho - Orden ${ordenNum} [${matchCunete.sku} -${unidades} Cuñetes 5GL] para cliente: ${clienteNombre}`,
          usuarioNombre: usuarioResponsable,
          clienteNombre: clienteNombre,
          stockPosterior: matchCunete.stockUnidades,
          sede: sedeNombre,
          sedeId: sedeId,
          sedeNombre: sedeNombre,
          sku: matchCunete.sku,
          varianteNombre: matchCunete.nombre,
          numeroOrden: ordenNum,
          detalle: `SKU: ${matchCunete.sku} | Cantidad: -${unidades} Cuñetes 5GL | Fecha/Hora: ${now} | Cliente: ${clienteNombre}`,
        };
        matchCunete.movimientos = [nuevoMov, ...(matchCunete.movimientos || [])];

        itemsDescontados.push({
          sku: matchCunete.sku,
          nombre: matchCunete.nombre,
          cantidadUnidades: unidades,
          cantidadGalones: galonesADescontar,
          stockAnterior,
          stockNuevo,
        });
        totalGalonesDescontados += galonesADescontar;
      }
    }

    // 2. Descontar galones sueltos de pintura si hay
    if (calc.galonesSueltosPintura && calc.galonesSueltosPintura > 0) {
      const matchGalon = buscarItem({
        productoNombre: prodNombre,
        color: colorSeleccionado,
        presentacion: 'Galón',
      });

      if (matchGalon) {
        const unidades = calc.galonesSueltosPintura;
        const galonesADescontar = unidades;
        const stockAnterior = matchGalon.stockGalones;
        const stockNuevo = Math.max(0, stockAnterior - galonesADescontar);
        matchGalon.stockGalones = stockNuevo;
        matchGalon.stockCunetes = Math.floor(stockNuevo / 5);
        const stockUnidadesAnt = matchGalon.stockUnidades ?? matchGalon.stockGalones ?? 0;
        matchGalon.stockUnidades = Math.max(0, stockUnidadesAnt - unidades);

        if (!matchGalon.stockPorSede) matchGalon.stockPorSede = {};
        const currSede = matchGalon.stockPorSede[sedeId] ?? Math.round(stockUnidadesAnt * 0.3);
        matchGalon.stockPorSede[sedeId] = Math.max(0, currSede - unidades);

        const nuevoMov: MovimientoInventario = {
          id: `mov-salida-${ordenNum}-gal-${Date.now()}`,
          fecha: now,
          tipo: 'Salida por Venta / Despacho',
          cantidadGalones: galonesADescontar,
          cantidadUnidades: unidades,
          motivo: `Salida por Venta / Despacho - Orden ${ordenNum} [${matchGalon.sku} -${unidades} GL] para cliente: ${clienteNombre}`,
          usuarioNombre: usuarioResponsable,
          clienteNombre: clienteNombre,
          stockPosterior: matchGalon.stockUnidades,
          sede: sedeNombre,
          sedeId: sedeId,
          sedeNombre: sedeNombre,
          sku: matchGalon.sku,
          varianteNombre: matchGalon.nombre,
          numeroOrden: ordenNum,
          detalle: `SKU: ${matchGalon.sku} | Cantidad: -${unidades} Galones | Fecha/Hora: ${now} | Cliente: ${clienteNombre}`,
        };
        matchGalon.movimientos = [nuevoMov, ...(matchGalon.movimientos || [])];

        itemsDescontados.push({
          sku: matchGalon.sku,
          nombre: matchGalon.nombre,
          cantidadUnidades: unidades,
          cantidadGalones: galonesADescontar,
          stockAnterior,
          stockNuevo,
        });
        totalGalonesDescontados += galonesADescontar;
      }
    }

    // 3. Descontar sellador si el cálculo lo requiere
    if (calc.requiereSellador && calc.galonesSellador && calc.galonesSellador > 0) {
      const matchSellador = buscarItem({
        productoNombre: calc.productoSelladorSugerido || 'Sellador Acrílico',
        presentacion: 'Galón',
      });

      if (matchSellador) {
        const unidades = calc.galonesSellador;
        const galonesADescontar = unidades;
        const stockAnterior = matchSellador.stockGalones;
        const stockNuevo = Math.max(0, stockAnterior - galonesADescontar);
        matchSellador.stockGalones = stockNuevo;
        matchSellador.stockCunetes = Math.floor(stockNuevo / 5);
        const stockUnidadesAnt = matchSellador.stockUnidades ?? matchSellador.stockGalones ?? 0;
        matchSellador.stockUnidades = Math.max(0, stockUnidadesAnt - unidades);

        if (!matchSellador.stockPorSede) matchSellador.stockPorSede = {};
        const currSede = matchSellador.stockPorSede[sedeId] ?? Math.round(stockUnidadesAnt * 0.3);
        matchSellador.stockPorSede[sedeId] = Math.max(0, currSede - unidades);

        const nuevoMov: MovimientoInventario = {
          id: `mov-salida-${ordenNum}-sel-${Date.now()}`,
          fecha: now,
          tipo: 'Salida por Venta / Despacho',
          cantidadGalones: galonesADescontar,
          cantidadUnidades: unidades,
          motivo: `Salida por Venta / Despacho - Orden ${ordenNum} [${matchSellador.sku} -${unidades} GL Sellador] para cliente: ${clienteNombre}`,
          usuarioNombre: usuarioResponsable,
          clienteNombre: clienteNombre,
          stockPosterior: matchSellador.stockUnidades,
          sede: sedeNombre,
          sedeId: sedeId,
          sedeNombre: sedeNombre,
          sku: matchSellador.sku,
          varianteNombre: matchSellador.nombre,
          numeroOrden: ordenNum,
          detalle: `SKU: ${matchSellador.sku} | Cantidad: -${unidades} GL Sellador | Fecha/Hora: ${now} | Cliente: ${clienteNombre}`,
        };
        matchSellador.movimientos = [nuevoMov, ...(matchSellador.movimientos || [])];

        itemsDescontados.push({
          sku: matchSellador.sku,
          nombre: matchSellador.nombre,
          cantidadUnidades: unidades,
          cantidadGalones: galonesADescontar,
          stockAnterior,
          stockNuevo,
        });
        totalGalonesDescontados += galonesADescontar;
      }
    }
  }

  // Guardar inventario actualizado y registrar auditoría general
  if (itemsDescontados.length > 0) {
    saveInventarioCorp(inventarioActualizado);
    markOrderAsDiscounted(ordenNum);

    const detalleSkus = itemsDescontados.map((i) => `${i.sku} (-${i.cantidadUnidades} U)`).join(', ');
    registrarAuditoria(
      'Inventario',
      'Descuento Automático por Pedido',
      `Orden ${ordenNum} descontó ${itemsDescontados.reduce((a, b) => a + b.cantidadUnidades, 0)} envases en ${sedeNombre}: [${detalleSkus}] para cliente ${clienteNombre}`,
      usuarioResponsable
    );
  }

  return {
    exito: itemsDescontados.length > 0,
    totalDescontadoGalones: totalGalonesDescontados,
    itemsDescontados,
    mensaje: `Se descontaron ${itemsDescontados.reduce((a, b) => a + b.cantidadUnidades, 0)} unidades en ${sedeNombre} en ${itemsDescontados.length} variante(s).`,
  };
}

// -------------------------------------------------------------
// GESTIÓN Y RECEPCIÓN DE ÓRDENES DE COMPRA (COMPRAS VS. LOGÍSTICA)
// -------------------------------------------------------------
export const STORAGE_ORDENES_COMPRA = 'colorlink_ordenes_compra_corp_v1';

export const ORDENES_COMPRA_INICIALES: OrdenCompraCorp[] = [
  {
    id: 'oc-2026-0812',
    numeroOC: 'OC-2026-0812',
    numeroFacturaProveedor: 'FAC-PNT-4401',
    proveedor: 'Pintuco S.A.S. - Planta Central Rionegro',
    fechaEmision: '2026-10-08',
    fechaEstimadaLlegada: '2026-10-13',
    sedeDestinoId: 'bogota',
    sedeDestinoNombre: 'Bogotá - CEDI Principal',
    estado: 'Pendiente Recibo',
    items: [
      {
        id: 'item-oc-1',
        sku: 'PIN-VTX-01-BLA-5GL',
        productoNombre: 'Viniltex Avanzado Máxima Lavabilidad',
        color: 'Blanco Puro Mate 1001',
        presentacion: 'Cuñete (5 Gal)',
        cantidadEsperada: 30,
        precioUnitarioEstimado: 349000,
      },
      {
        id: 'item-oc-2',
        sku: 'PIN-KOR-02-GRI-5GL',
        productoNombre: 'Koraza Protección 5 Años Fachadas',
        color: 'Gris Niebla 1002',
        presentacion: 'Cuñete (5 Gal)',
        cantidadEsperada: 20,
        precioUnitarioEstimado: 389000,
      },
    ],
    totalEstimadoCOP: 18250000,
    compradorResponsable: 'Beatriz Eugenia Henao (Compras & Abastecimiento)',
    observaciones: 'Remesa programada en tractomula termo-sellada con precinto #7781.',
  },
  {
    id: 'oc-2026-0815',
    numeroOC: 'OC-2026-0815',
    numeroFacturaProveedor: 'FAC-AKZ-8910',
    proveedor: 'AkzoNobel Coatings Andina S.A.S.',
    fechaEmision: '2026-10-09',
    fechaEstimadaLlegada: '2026-10-14',
    sedeDestinoId: 'medellin',
    sedeDestinoNombre: 'Medellín - CEDI Regional',
    estado: 'Pendiente Recibo',
    items: [
      {
        id: 'item-oc-3',
        sku: 'PIN-VTX-01-BLA-1GL',
        productoNombre: 'Viniltex Avanzado Máxima Lavabilidad',
        color: 'Blanco Puro Mate 1001',
        presentacion: 'Galón',
        cantidadEsperada: 50,
        precioUnitarioEstimado: 84900,
      },
      {
        id: 'item-oc-4',
        sku: 'PIN-DOM-05-BLA-1GL',
        productoNombre: 'Pintulux Esmalte Sintético Brillante',
        color: 'Blanco Puro 1001',
        presentacion: 'Galón',
        cantidadEsperada: 35,
        precioUnitarioEstimado: 89900,
      },
    ],
    totalEstimadoCOP: 7391500,
    compradorResponsable: 'Beatriz Eugenia Henao (Compras & Abastecimiento)',
    observaciones: 'Repedido semanal para abastecer sucursales del Valle de Aburrá.',
  },
  {
    id: 'oc-2026-0820',
    numeroOC: 'OC-2026-0820',
    numeroFacturaProveedor: 'FAC-PRV-3312',
    proveedor: 'Solventes y Resinas Químicas del Valle',
    fechaEmision: '2026-10-10',
    fechaEstimadaLlegada: '2026-10-15',
    sedeDestinoId: 'cali',
    sedeDestinoNombre: 'Cali - CEDI Occidente',
    estado: 'Pendiente Recibo',
    items: [
      {
        id: 'item-oc-5',
        sku: 'PIN-IMP-07-BLA-5GL',
        productoNombre: 'Impermeabilizante Paraguas Cubiertas y Terrazas',
        color: 'Blanco Térmico Reflexivo',
        presentacion: 'Cuñete (5 Gal)',
        cantidadEsperada: 25,
        precioUnitarioEstimado: 412000,
      },
    ],
    totalEstimadoCOP: 10300000,
    compradorResponsable: 'Beatriz Eugenia Henao (Compras & Abastecimiento)',
    observaciones: 'Atención a temporada de lluvias en el Valle del Cauca.',
  },
  {
    id: 'oc-2026-0801',
    numeroOC: 'OC-2026-0801',
    numeroFacturaProveedor: 'FAC-PNT-4310',
    proveedor: 'Pintuco S.A.S. - Planta Central Rionegro',
    fechaEmision: '2026-09-28',
    fechaEstimadaLlegada: '2026-10-02',
    fechaRecepcion: '2026-10-02 11:20',
    sedeDestinoId: 'rionegro',
    sedeDestinoNombre: 'CEDI Rionegro - Planta Principal',
    estado: 'Recibido Conforme',
    items: [
      {
        id: 'item-oc-6',
        sku: 'PIN-PIS-08-GRI-5GL',
        productoNombre: 'Pintura Tráfico y Pisos Epóxica Alta Resistencia',
        color: 'Gris Tráfico Industrial',
        presentacion: 'Cuñete (5 Gal)',
        cantidadEsperada: 40,
        cantidadRecibida: 40,
        loteFabricacion: 'LOT-2026-0881-PIS',
        precioUnitarioEstimado: 489000,
      },
    ],
    totalEstimadoCOP: 19560000,
    compradorResponsable: 'Beatriz Eugenia Henao (Compras & Abastecimiento)',
    recibidoPor: 'Carlos E. Montoya (Superintendente de Bodegas y CEDI)',
    recibidoPorDocumento: 'CC 71.392.810 de Rionegro',
    fechaHoraRecepcion: '2026-10-02 11:20:00',
    actaConsecutivo: 'ACT-REC-2026-0801',
    loteGeneral: 'LOT-2026-0881-PIS',
    observaciones: 'Verificación física satisfactoria. Densidad y viscosidad conforme a ficha técnica.',
  },
];

export function getOrdenesCompraCorp(): OrdenCompraCorp[] {
  const loaded = loadOrInit(STORAGE_ORDENES_COMPRA, ORDENES_COMPRA_INICIALES);
  const arr = Array.isArray(loaded) ? loaded : ORDENES_COMPRA_INICIALES;
  return arr.map((oc: any) => {
    const totalCalc = Array.isArray(oc.items)
      ? oc.items.reduce((acc: number, it: any) => acc + (Number(it.cantidadEsperada) || 0), 0)
      : 0;
    return {
      ...oc,
      totalUnidades: oc.totalUnidades !== undefined && !isNaN(Number(oc.totalUnidades)) ? Number(oc.totalUnidades) : totalCalc,
    };
  });
}

export function saveOrdenesCompraCorp(ordenes: OrdenCompraCorp[]): void {
  save(STORAGE_ORDENES_COMPRA, ordenes);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('colorlink_ordenes_compra_updated', { detail: ordenes }));
  }
}

// -------------------------------------------------------------
// TRASLADOS INTER-SEDES (REMISSIONES BODEGA A BODEGA)
// -------------------------------------------------------------
export const STORAGE_TRASLADOS = 'colorlink_traslados_intersedes_corp_v1';

export const TRASLADOS_INICIALES: TrasladoInterSede[] = [
  {
    id: 'tras-2026-0041',
    numeroRemision: 'REM-TR-2026-0041',
    sedeOrigenId: 'rionegro',
    sedeOrigenNombre: 'CEDI Rionegro - Planta Principal',
    sedeDestinoId: 'bogota',
    sedeDestinoNombre: 'Bogotá - CEDI Principal',
    fechaDespacho: '2026-10-12',
    fechaEstimadaLlegada: '2026-10-14',
    estado: 'En Tránsito',
    transportadora: 'Flota Propia Pintuco (Tractomula T-42)',
    numeroGuia: 'REM-RIO-BOG-9921',
    despachadoPor: 'Carlos E. Montoya (Superintendente Bodega Rionegro)',
    loteGeneral: 'LOT-2026-0910-VTX',
    observaciones: 'Reabastecimiento estratégico de Viniltex y Koraza para alta demanda en Bogotá.',
    items: [
      {
        id: 'it-tr-1',
        sku: 'PIN-VTX-01-BLA-5GL',
        productoNombre: 'Viniltex Avanzado Máxima Lavabilidad',
        color: 'Blanco Puro Mate 1001',
        presentacion: 'Cuñete (5 Gal)',
        cantidadEnviada: 25,
        loteFabricacion: 'LOT-2026-0910-VTX',
      },
      {
        id: 'it-tr-2',
        sku: 'PIN-KOR-02-GRI-5GL',
        productoNombre: 'Koraza Protección 5 Años Fachadas',
        color: 'Gris Niebla 1002',
        presentacion: 'Cuñete (5 Gal)',
        cantidadEnviada: 15,
        loteFabricacion: 'LOT-2026-0880-KOR',
      },
    ],
    totalUnidades: 40,
  },
  {
    id: 'tras-2026-0038',
    numeroRemision: 'REM-TR-2026-0038',
    sedeOrigenId: 'bogota',
    sedeOrigenNombre: 'Bogotá - CEDI Principal',
    sedeDestinoId: 'medellin',
    sedeDestinoNombre: 'Medellín - CEDI Regional',
    fechaDespacho: '2026-10-05',
    fechaEstimadaLlegada: '2026-10-07',
    fechaRecepcion: '2026-10-07 14:30',
    estado: 'Recibido Conforme',
    transportadora: 'Coordinadora Mercantil',
    numeroGuia: 'CM-7829103',
    despachadoPor: 'Andrés Felipe Morales (Coordinador Logístico)',
    recibidoPor: 'Jorge Restrepo (Líder Bodega Medellín)',
    loteGeneral: 'LOT-2026-0771-DOM',
    observaciones: 'Traslado completado sin novedades ni roturas.',
    items: [
      {
        id: 'it-tr-3',
        sku: 'PIN-DOM-05-BLA-1GL',
        productoNombre: 'Pintulux Esmalte Sintético Brillante',
        color: 'Blanco Puro 1001',
        presentacion: 'Galón',
        cantidadEnviada: 20,
        cantidadRecibida: 20,
        loteFabricacion: 'LOT-2026-0771-DOM',
      },
    ],
    totalUnidades: 20,
  },
];

export function getTrasladosInterSedes(): TrasladoInterSede[] {
  const loaded = loadOrInit(STORAGE_TRASLADOS, TRASLADOS_INICIALES);
  const arr = Array.isArray(loaded) ? loaded : TRASLADOS_INICIALES;
  return arr.map((tr: any) => {
    const totalCalc = Array.isArray(tr.items)
      ? tr.items.reduce((acc: number, it: any) => acc + (Number(it.cantidadEnviada) || 0), 0)
      : 0;
    return {
      ...tr,
      totalUnidades: tr.totalUnidades !== undefined && !isNaN(Number(tr.totalUnidades)) ? Number(tr.totalUnidades) : totalCalc,
    };
  });
}

export function saveTrasladosInterSedes(traslados: TrasladoInterSede[]): void {
  save(STORAGE_TRASLADOS, traslados);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('colorlink_traslados_updated', { detail: traslados }));
  }
}

/**
 * Crear un nuevo Traslado Inter-Sedes:
 * Resta inmediatamente el stock disponible de la Sede Origen y deja la remisión "En Tránsito".
 * Asienta la salida en el Kardex de la Sede Origen.
 */
export function crearTrasladoInterSede(datos: {
  sedeOrigenId: string;
  sedeDestinoId: string;
  items: Array<{ sku: string; cantidadEnviada: number; loteFabricacion?: string }>;
  transportadora?: string;
  numeroGuia?: string;
  fechaEstimadaLlegada?: string;
  observaciones?: string;
  usuarioNombre: string;
}): { nuevoTraslado: TrasladoInterSede; inventarioActualizado: ItemInventarioCorp[] } {
  const sedeOrigenObj = SEDES_CEDI_CONFIG.find((s) => s.id === datos.sedeOrigenId);
  const sedeDestinoObj = SEDES_CEDI_CONFIG.find((s) => s.id === datos.sedeDestinoId);
  const sedeOrigenNombre = sedeOrigenObj?.nombre || 'Sede Origen';
  const sedeDestinoNombre = sedeDestinoObj?.nombre || 'Sede Destino';

  const currentTraslados = getTrasladosInterSedes();
  const inventario = getInventarioCorp();
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const remNum = `REM-TR-${new Date().getFullYear()}-${String(currentTraslados.length + 42).padStart(4, '0')}`;

  const itemsMapeados: ItemTrasladoInterSede[] = [];
  let totalUnidadesTraslado = 0;

  // 1. Descontar stock de la sede origen para cada variante
  const inventarioActualizado = inventario.map((item) => {
    const itemReq = datos.items.find(
      (it) => it.sku.trim().toUpperCase() === item.sku.trim().toUpperCase()
    );

    if (itemReq && itemReq.cantidadEnviada > 0) {
      const cantAEnviar = Number(itemReq.cantidadEnviada) || 0;
      totalUnidadesTraslado += cantAEnviar;

      const stockPorSede = { ...(item.stockPorSede || {}) };
      const currentStockOrigen = stockPorSede[datos.sedeOrigenId] ?? 0;
      stockPorSede[datos.sedeOrigenId] = Math.max(0, currentStockOrigen - cantAEnviar);

      // Total general en tránsito
      const nuevoStockUnidades = Math.max(0, (item.stockUnidades || 0) - cantAEnviar);

      let factorGal = 1;
      const presNorm = (item.presentacion || item.medida || '').toLowerCase();
      if (presNorm.includes('cuñete') || presNorm.includes('5')) factorGal = 5;
      else if (presNorm.includes('cuarto') || presNorm.includes('1/4')) factorGal = 0.25;

      const galonesRestados = Math.round(cantAEnviar * factorGal);
      const nuevoStockGalones = Math.max(0, item.stockGalones - galonesRestados);
      const nuevoCunetes = Math.floor(nuevoStockGalones / 5);

      const nuevoMov: MovimientoInventario = {
        id: `mov-tr-salida-${remNum}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        fecha: now,
        tipo: 'Salida',
        cantidadGalones: galonesRestados,
        cantidadUnidades: cantAEnviar,
        motivo: `Traslado Inter-Sedes despachado (${remNum} hacia ${sedeDestinoNombre})`,
        usuarioNombre: datos.usuarioNombre,
        stockPosterior: stockPorSede[datos.sedeOrigenId],
        sede: sedeOrigenNombre,
        sku: item.sku,
        varianteNombre: item.nombre,
        numeroOrden: remNum,
        lote: itemReq.loteFabricacion || 'LOT-TRASLADO',
      };

      itemsMapeados.push({
        id: `it-tr-${Date.now()}-${item.sku}`,
        sku: item.sku,
        productoNombre: item.nombre,
        color: item.color,
        colorHex: item.colorHex,
        presentacion: item.presentacion || 'Unidad',
        cantidadEnviada: cantAEnviar,
        loteFabricacion: itemReq.loteFabricacion || `LOT-TR-${new Date().getFullYear()}`,
      });

      return {
        ...item,
        stockUnidades: nuevoStockUnidades,
        stockPorSede,
        stockGalones: nuevoStockGalones,
        stockCunetes: nuevoCunetes,
        movimientos: [nuevoMov, ...item.movimientos],
      };
    }
    return item;
  });

  saveInventarioCorp(inventarioActualizado);

  const nuevoTraslado: TrasladoInterSede = {
    id: `tras-${Date.now()}`,
    numeroRemision: remNum,
    sedeOrigenId: datos.sedeOrigenId,
    sedeOrigenNombre,
    sedeDestinoId: datos.sedeDestinoId,
    sedeDestinoNombre,
    fechaDespacho: now.slice(0, 10),
    fechaEstimadaLlegada: datos.fechaEstimadaLlegada || new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    estado: 'En Tránsito',
    transportadora: datos.transportadora || 'Flota Propia Pintuco CEDI',
    numeroGuia: datos.numeroGuia || `GUIA-${remNum}`,
    despachadoPor: datos.usuarioNombre,
    observaciones: datos.observaciones || '',
    items: itemsMapeados,
    totalUnidades: totalUnidadesTraslado,
  };

  saveTrasladosInterSedes([nuevoTraslado, ...currentTraslados]);

  registrarAuditoria(
    'Inventario',
    'Despacho de Traslado Inter-Sedes',
    `Remisión ${remNum} despachada desde ${sedeOrigenNombre} hacia ${sedeDestinoNombre}. Total ${totalUnidadesTraslado} unidades. Guía: ${nuevoTraslado.numeroGuia}`,
    datos.usuarioNombre
  );

  return { nuevoTraslado, inventarioActualizado };
}

/**
 * Confirmar y Recibir un Traslado Inter-Sedes en la Sede Destino:
 * Suma directamente el stock de cada variante en la Sede Destino activa y en el stock global.
 * Asienta la entrada en el Kardex de la Sede Destino.
 */
export function corroborarYRecibirTrasladoInterSede(
  trasladoId: string,
  datosRecepcion: {
    sedeRecepcionId: string;
    sedeRecepcionNombre: string;
    fechaRecepcion: string;
    loteFabricacion?: string;
    itemsRecibidos: Array<{ sku: string; cantidadRecibida: number }>;
    usuarioNombre: string;
    observaciones?: string;
  }
): { trasladoActualizado: TrasladoInterSede | null; inventarioActualizado: ItemInventarioCorp[] } {
  const traslados = getTrasladosInterSedes();
  const inventario = getInventarioCorp();
  let trasladoActualizado: TrasladoInterSede | null = null;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  // 1. Actualizar remisión de traslado
  const trasladosActualizados = traslados.map((tr) => {
    if (tr.id === trasladoId) {
      let todasCompletas = true;
      const itemsActualizados = tr.items.map((it) => {
        const itemRecibido = datosRecepcion.itemsRecibidos.find(
          (r) => r.sku.trim().toUpperCase() === it.sku.trim().toUpperCase()
        );
        const cantRecibida = itemRecibido !== undefined ? itemRecibido.cantidadRecibida : it.cantidadEnviada;
        if (cantRecibida < it.cantidadEnviada) {
          todasCompletas = false;
        }
        return {
          ...it,
          cantidadRecibida: cantRecibida,
          loteFabricacion: datosRecepcion.loteFabricacion || it.loteFabricacion,
        };
      });

      trasladoActualizado = {
        ...tr,
        estado: todasCompletas ? 'Recibido Conforme' : 'Recibido Parcial',
        fechaRecepcion: datosRecepcion.fechaRecepcion || now,
        recibidoPor: datosRecepcion.usuarioNombre,
        loteGeneral: datosRecepcion.loteFabricacion || tr.loteGeneral,
        sedeDestinoId: datosRecepcion.sedeRecepcionId || tr.sedeDestinoId,
        sedeDestinoNombre: datosRecepcion.sedeRecepcionNombre || tr.sedeDestinoNombre,
        items: itemsActualizados,
        observaciones: datosRecepcion.observaciones
          ? `${tr.observaciones ? tr.observaciones + ' | ' : ''}Recepción: ${datosRecepcion.observaciones}`
          : tr.observaciones,
      };
      return trasladoActualizado;
    }
    return tr;
  });

  saveTrasladosInterSedes(trasladosActualizados);

  // 2. INCREMENTAR DIRECTAMENTE EL STOCK EN LA SEDE DESTINO Y ASENTAR EN KARDEX
  const inventarioActualizado = inventario.map((item) => {
    const itemRecibido = datosRecepcion.itemsRecibidos.find(
      (r) => r.sku.trim().toUpperCase() === item.sku.trim().toUpperCase()
    );

    if (itemRecibido && itemRecibido.cantidadRecibida > 0) {
      const cantRecibida = Number(itemRecibido.cantidadRecibida) || 0;
      const sedeId = datosRecepcion.sedeRecepcionId;
      const stockPorSede = { ...(item.stockPorSede || {}) };
      const stockSedeAnterior = Number(stockPorSede[sedeId]) || 0;
      const nuevoStockSede = stockSedeAnterior + cantRecibida;
      stockPorSede[sedeId] = nuevoStockSede;

      const nuevoStockUnidades = (Number(item.stockUnidades) || 0) + cantRecibida;

      let factorGal = 1;
      const presNorm = (item.presentacion || item.medida || '').toLowerCase();
      if (presNorm.includes('cuñete') || presNorm.includes('5')) factorGal = 5;
      else if (presNorm.includes('cuarto') || presNorm.includes('1/4')) factorGal = 0.25;

      const galonesAgregados = Math.round(cantRecibida * factorGal);
      const nuevoStockGalones = (Number(item.stockGalones) || 0) + galonesAgregados;
      const nuevoCunetes = Math.floor(nuevoStockGalones / 5);

      const nuevoMov: MovimientoInventario = {
        id: `mov-tr-entrada-${trasladoActualizado?.numeroRemision || trasladoId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        fecha: now,
        tipo: 'Entrada',
        cantidadGalones: galonesAgregados,
        cantidadUnidades: cantRecibida,
        motivo: `Recepción Traslado Inter-Sedes ${trasladoActualizado?.numeroRemision} (Procedente de: ${trasladoActualizado?.sedeOrigenNombre})`,
        usuarioNombre: datosRecepcion.usuarioNombre,
        stockPosterior: nuevoStockSede,
        sede: datosRecepcion.sedeRecepcionNombre,
        sku: item.sku,
        varianteNombre: item.nombre,
        numeroOrden: trasladoActualizado?.numeroRemision,
        lote: datosRecepcion.loteFabricacion || trasladoActualizado?.loteGeneral || 'LOT-TRASLADO',
      };

      return {
        ...item,
        stockUnidades: nuevoStockUnidades,
        stockPorSede,
        stockGalones: nuevoStockGalones,
        stockCunetes: nuevoCunetes,
        movimientos: [nuevoMov, ...item.movimientos],
      };
    }
    return item;
  });

  saveInventarioCorp(inventarioActualizado);

  const totalRecibidas = datosRecepcion.itemsRecibidos.reduce((a, b) => a + (Number(b.cantidadRecibida) || 0), 0);
  registrarAuditoria(
    'Inventario',
    'Recepción de Traslado Inter-Sedes',
    `Remisión ${trasladoActualizado?.numeroRemision} recibida en ${datosRecepcion.sedeRecepcionNombre}. ${totalRecibidas} unidades incrementadas al stock disponible por ${datosRecepcion.usuarioNombre}`,
    datosRecepcion.usuarioNombre
  );

  return { trasladoActualizado, inventarioActualizado };
}

export function corroborarYRecibirOrdenCompra(
  ordenId: string,
  datosRecepcion: {
    sedeRecepcionId: string;
    sedeRecepcionNombre: string;
    fechaRecepcion: string;
    fechaHoraRecepcion?: string;
    loteFabricacion: string;
    itemsRecibidos: Array<{ sku: string; cantidadRecibida: number }>;
    usuarioNombre: string;
    usuarioDocumento: string;
    usuarioCargo?: string;
    actaConsecutivo?: string;
    observaciones?: string;
  }
): { ordenActualizada: OrdenCompraCorp | null; inventarioActualizado: ItemInventarioCorp[] } {
  const ordenes = getOrdenesCompraCorp();
  const inventario = getInventarioCorp();
  let ordenActualizada: OrdenCompraCorp | null = null;
  const currentDate = new Date();
  const now = datosRecepcion.fechaHoraRecepcion ||
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')} ${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}:${String(currentDate.getSeconds()).padStart(2, '0')}`;

  // 1. Actualizar orden de compra (Inmutable una vez asentada)
  const ordenesActualizadas = ordenes.map((oc) => {
    if (oc.id === ordenId) {
      let todasCompletas = true;
      const itemsActualizados = oc.items.map((it) => {
        const itemRecibido = datosRecepcion.itemsRecibidos.find(
          (r) => r.sku.toUpperCase() === it.sku.toUpperCase()
        );
        const cantRecibida = itemRecibido !== undefined ? itemRecibido.cantidadRecibida : it.cantidadEsperada;
        if (cantRecibida < it.cantidadEsperada) {
          todasCompletas = false;
        }
        return {
          ...it,
          cantidadRecibida: cantRecibida,
          loteFabricacion: datosRecepcion.loteFabricacion,
        };
      });

      const consecutivo = datosRecepcion.actaConsecutivo || oc.actaConsecutivo || `ACT-REC-2026-${oc.numeroOC.replace(/[^0-9]/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000)}`;

      ordenActualizada = {
        ...oc,
        estado: todasCompletas ? 'Recibido Conforme' : 'Recibido Parcial',
        fechaRecepcion: datosRecepcion.fechaRecepcion || now.slice(0, 10),
        fechaHoraRecepcion: now,
        recibidoPor: datosRecepcion.usuarioNombre,
        recibidoPorDocumento: datosRecepcion.usuarioDocumento,
        recibidoPorCargo: datosRecepcion.usuarioCargo || 'Superintendente / Auxiliar de Bodega',
        actaConsecutivo: consecutivo,
        loteGeneral: datosRecepcion.loteFabricacion,
        sedeDestinoId: datosRecepcion.sedeRecepcionId || oc.sedeDestinoId,
        sedeDestinoNombre: datosRecepcion.sedeRecepcionNombre || oc.sedeDestinoNombre,
        items: itemsActualizados,
        observaciones: datosRecepcion.observaciones
          ? `${oc.observaciones ? oc.observaciones + ' | ' : ''}Recepción: ${datosRecepcion.observaciones}`
          : oc.observaciones,
      };
      return ordenActualizada;
    }
    return oc;
  });

  saveOrdenesCompraCorp(ordenesActualizadas);

  // 2. Incrementar stock disponible en inventario para la Sede correspondiente y asentar Kardex
  const inventarioActualizado = inventario.map((item) => {
    const itemRecibido = datosRecepcion.itemsRecibidos.find(
      (r) => r.sku.toUpperCase() === item.sku.toUpperCase()
    );

    if (itemRecibido && itemRecibido.cantidadRecibida > 0) {
      const cantRecibida = itemRecibido.cantidadRecibida;
      const sedeId = datosRecepcion.sedeRecepcionId;
      const stockPorSede = { ...(item.stockPorSede || {}) };
      const stockSedeAnterior = stockPorSede[sedeId] || 0;
      stockPorSede[sedeId] = stockSedeAnterior + cantRecibida;

      const nuevoStockUnidades = (item.stockUnidades || 0) + cantRecibida;

      let factorGal = 1;
      const presNorm = (item.presentacion || item.medida || '').toLowerCase();
      if (presNorm.includes('cuñete') || presNorm.includes('5')) factorGal = 5;
      else if (presNorm.includes('cuarto') || presNorm.includes('1/4')) factorGal = 0.25;

      const galonesAgregados = Math.round(cantRecibida * factorGal);
      const nuevoStockGalones = item.stockGalones + galonesAgregados;
      const nuevoCunetes = Math.floor(nuevoStockGalones / 5);

      const nuevoMov: MovimientoInventario = {
        id: `mov-oc-${ordenActualizada?.numeroOC || ordenId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        fecha: now,
        tipo: 'Entrada',
        cantidadGalones: galonesAgregados,
        cantidadUnidades: cantRecibida,
        motivo: `Recepción OC ${ordenActualizada?.numeroOC} (Acta: ${ordenActualizada?.actaConsecutivo}, Lote: ${datosRecepcion.loteFabricacion})`,
        usuarioNombre: datosRecepcion.usuarioNombre,
        stockPosterior: nuevoStockUnidades,
        sede: datosRecepcion.sedeRecepcionNombre,
        sku: item.sku,
        varianteNombre: item.nombre,
        numeroOrden: ordenActualizada?.numeroOC,
        numeroFactura: ordenActualizada?.numeroFacturaProveedor,
        lote: datosRecepcion.loteFabricacion,
      };

      return {
        ...item,
        stockUnidades: nuevoStockUnidades,
        stockPorSede,
        stockGalones: nuevoStockGalones,
        stockCunetes: nuevoCunetes,
        movimientos: [nuevoMov, ...item.movimientos],
      };
    }
    return item;
  });

  saveInventarioCorp(inventarioActualizado);

  const totalRecibidas = datosRecepcion.itemsRecibidos.reduce((a, b) => a + b.cantidadRecibida, 0);
  registrarAuditoria(
    'Inventario',
    'Acta de Recepción Oficial Asentada en Kardex',
    `Acta ${ordenActualizada?.actaConsecutivo} - Orden ${ordenActualizada?.numeroOC} (Factura ${ordenActualizada?.numeroFacturaProveedor}) recibida en ${datosRecepcion.sedeRecepcionNombre}. Responsable: ${datosRecepcion.usuarioNombre} (Doc: ${datosRecepcion.usuarioDocumento}). Lote: ${datosRecepcion.loteFabricacion}. ${totalRecibidas} unidades ingresadas a inventario CEDI. Registro legal inmutable.`,
    datosRecepcion.usuarioNombre
  );

  return { ordenActualizada, inventarioActualizado };
}


