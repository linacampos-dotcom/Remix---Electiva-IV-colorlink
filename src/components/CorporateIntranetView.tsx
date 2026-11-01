import React, { useState, useEffect, useMemo } from 'react';
import { UserSession, COLORLINKOrder } from '../types';
import {
  AreaCorporativa,
  Funcionario,
  TareaLaboral,
  PublicacionComunidad,
  TicketSAC,
  ItemInventarioCorp,
  RegistroAuditoria,
  NotificacionCorp,
  RolId,
  ROLES_CORPORATIVOS,
  getAreas,
  saveAreas,
  createArea,
  updateArea,
  getFuncionarios,
  saveFuncionarios,
  createFuncionario,
  updateFuncionario,
  getTareas,
  saveTareas,
  createTarea,
  updateTarea,
  getPublicaciones,
  savePublicaciones,
  createPublicacion,
  getTicketsSAC,
  responderTicketSAC,
  getInventarioCorp,
  MovimientoInventario,
  registrarMovimientoStock,
  crearProductoInventario,
  crearMatrizVariantesInventario,
  actualizarProductoInventario,
  eliminarODesactivarProductoInventario,
  getAuditoria,
  registrarAuditoria,
  getNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  OrdenCompraCorp,
  ItemOrdenCompra,
  getOrdenesCompraCorp,
  saveOrdenesCompraCorp,
  corroborarYRecibirOrdenCompra,
  TrasladoInterSede,
  ItemTrasladoInterSede,
  getTrasladosInterSedes,
  saveTrasladosInterSedes,
  crearTrasladoInterSede,
  corroborarYRecibirTrasladoInterSede,
  SEDES_CEDI_CONFIG,
  SedeCEDI,
  getStockEnSede,
  descontarInventarioPorPedido,
} from '../services/corporateService';
import { ActaRecepcionOCModal } from './ActaRecepcionOCModal';
import {
  Building2,
  TrendingUp,
  Truck,
  HeadphonesIcon,
  Sparkles,
  ShieldCheck,
  FileText,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Boxes,
  Send,
  LogOut,
  RefreshCw,
  RotateCcw,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Kanban,
  MessageSquare,
  Bell,
  Users,
  FlaskConical,
  Activity,
  Award,
  BarChart3,
  Calendar,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  ChevronDown,
  UserPlus,
  Edit3,
  Trash2,
  Paperclip,
  ThumbsUp,
  MessageCircle,
  Eye,
  Star,
  Lock,
  Tag,
  Briefcase,
  AlertCircle,
  CornerDownRight,
  ArrowRight,
  Share2,
  Check,
  SlidersHorizontal,
  Package,
  Palette,
  MapPin,
  ClipboardCheck,
  ArrowLeftRight,
} from 'lucide-react';

interface CorporateIntranetViewProps {
  userSession?: UserSession | null;
  onLogout: () => void;
  orders: COLORLINKOrder[];
  onUpdateOrderStatus: (id: string, newStatus: COLORLINKOrder['estado'], updates?: Partial<COLORLINKOrder>) => void;
  onOpenOrderTracking?: (order: COLORLINKOrder) => void;
}

export const CorporateIntranetView: React.FC<CorporateIntranetViewProps> = ({
  userSession,
  onLogout,
  orders,
  onUpdateOrderStatus,
  onOpenOrderTracking,
}) => {
  // -------------------------------------------------------------
  // SIMULACIÓN Y CONTEXTO DE ROL (RBAC)
  // -------------------------------------------------------------
  const [activeSimulatedRole, setActiveSimulatedRole] = useState<RolId>(() => {
    if (userSession?.isSuperAdmin) return 'superadmin';
    if (userSession?.corporateRole === 'gerencia') return 'director_gerente';
    if (userSession?.corporateRole === 'sac') return 'agente_sac';
    if (userSession?.corporateRole === 'logistica') return 'logistica_inventarios';
    return 'superadmin';
  });

  const currentRoleConfig = useMemo(() => {
    return ROLES_CORPORATIVOS.find((r) => r.id === activeSimulatedRole) || ROLES_CORPORATIVOS[0];
  }, [activeSimulatedRole]);

  // -------------------------------------------------------------
  // ESTADO GLOBAL DE DATOS DE LA INTRANET
  // -------------------------------------------------------------
  const [areas, setAreas] = useState<AreaCorporativa[]>(getAreas);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(getFuncionarios);
  const [tareas, setTareas] = useState<TareaLaboral[]>(getTareas);
  const [publicaciones, setPublicaciones] = useState<PublicacionComunidad[]>(getPublicaciones);
  const [ticketsSAC, setTicketsSAC] = useState<TicketSAC[]>(getTicketsSAC);
  const [inventario, setInventario] = useState<ItemInventarioCorp[]>(getInventarioCorp);
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompraCorp[]>(getOrdenesCompraCorp);
  const [traslados, setTraslados] = useState<TrasladoInterSede[]>(getTrasladosInterSedes);
  const [auditoria, setAuditoria] = useState<RegistroAuditoria[]>(getAuditoria);
  const [notificaciones, setNotificaciones] = useState<NotificacionCorp[]>(getNotificaciones);

  // Sincronización en tiempo real ante eventos de storage
  useEffect(() => {
    const handleStorageUpdate = () => {
      setAreas(getAreas());
      setFuncionarios(getFuncionarios());
      setTareas(getTareas());
      setPublicaciones(getPublicaciones());
      setTicketsSAC(getTicketsSAC());
      setInventario(getInventarioCorp());
      setOrdenesCompra(getOrdenesCompraCorp());
      setTraslados(getTrasladosInterSedes());
      setAuditoria(getAuditoria());
      setNotificaciones(getNotificaciones());
    };

    window.addEventListener('colorlink_corporate_updated', handleStorageUpdate);
    window.addEventListener('colorlink_tickets_updated', handleStorageUpdate);
    window.addEventListener('colorlink_inventory_updated', handleStorageUpdate);
    window.addEventListener('colorlink_ordenes_compra_updated', handleStorageUpdate);
    window.addEventListener('colorlink_traslados_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('colorlink_corporate_updated', handleStorageUpdate);
      window.removeEventListener('colorlink_tickets_updated', handleStorageUpdate);
      window.removeEventListener('colorlink_inventory_updated', handleStorageUpdate);
      window.removeEventListener('colorlink_ordenes_compra_updated', handleStorageUpdate);
      window.removeEventListener('colorlink_traslados_updated', handleStorageUpdate);
    };
  }, []);

  // -------------------------------------------------------------
  // NAVEGACIÓN Y VISTAS PRINCIPALES
  // -------------------------------------------------------------
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'areas' | 'funcionarios' | 'tareas' | 'comunidad' | 'logistica' | 'sac' | 'documentos' | 'auditoria'
  >(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('corpTab') || params.get('tab') || params.get('modulo');
      if (tabParam === 'logistica' || tabParam === 'bodega' || tabParam === 'inventario') return 'logistica';
      if (tabParam === 'dashboard') return 'dashboard';
      if (tabParam === 'sac') return 'sac';
      if (tabParam === 'tareas') return 'tareas';
      if (tabParam === 'areas') return 'areas';
      if (tabParam === 'funcionarios') return 'funcionarios';
      if (tabParam === 'comunidad') return 'comunidad';
      if (tabParam === 'documentos') return 'documentos';
      if (tabParam === 'auditoria') return 'auditoria';
      const saved = localStorage.getItem('colorlink_corp_active_tab');
      if (saved && ['dashboard', 'areas', 'funcionarios', 'tareas', 'comunidad', 'logistica', 'sac', 'documentos', 'auditoria'].includes(saved)) {
        return saved as any;
      }
    }
    return 'logistica';
  });

  // Buscador global & Notificaciones dropdown
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // -------------------------------------------------------------
  // MODALES Y SUB-ESTADOS
  // -------------------------------------------------------------
  // Tareas
  const [taskViewMode, setTaskViewMode] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [taskFilterArea, setTaskFilterArea] = useState<string>('todos');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('todos');
  const [taskFilterAssignee, setTaskFilterAssignee] = useState<string>('todos');
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TareaLaboral | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    titulo: '',
    descripcion: '',
    areaId: 'area-1',
    responsableId: 'func-1',
    prioridad: 'Media' as TareaLaboral['prioridad'],
    fechaLimite: '2026-10-30',
    requiereAprobacion: false,
  });

  // Áreas
  const [selectedAreaForDetail, setSelectedAreaForDetail] = useState<AreaCorporativa | null>(null);
  const [isNewAreaModalOpen, setIsNewAreaModalOpen] = useState(false);
  const [newAreaForm, setNewAreaForm] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    liderNombre: '',
    liderCargo: '',
    liderEmail: '',
    colorBadge: 'bg-blue-900 text-white',
  });

  // Funcionarios
  const [selectedFuncForDetail, setSelectedFuncForDetail] = useState<Funcionario | null>(null);
  const [isNewFuncModalOpen, setIsNewFuncModalOpen] = useState(false);
  const [deactivatingFunc, setDeactivatingFunc] = useState<Funcionario | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  const [funcSearch, setFuncSearch] = useState('');
  const [funcFilterArea, setFuncFilterArea] = useState('todos');
  const [funcFilterStatus, setFuncFilterStatus] = useState('todos');

  // Muro / Comunidad
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostType, setNewPostType] = useState<PublicacionComunidad['tipo']>('noticia');
  const [newPostIsOfficial, setNewPostIsOfficial] = useState(false);
  const [newPostComment, setNewPostComment] = useState<{ [postId: string]: string }>({});

  // SAC / Atención al Cliente
  const [selectedTicketId, setSelectedTicketId] = useState<string>(ticketsSAC[0]?.id || '');
  const [ticketFilterTab, setTicketFilterTab] = useState<'todos' | 'nuevos' | 'en_proceso' | 'resueltos'>('todos');
  const [agentReplyText, setAgentReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // Logística, Inventario & Gestión de Productos
  const [logisticsSubTab, setLogisticsSubTab] = useState<'inventario' | 'recepcion_compras' | 'traslados' | 'despachos' | 'kardex'>('inventario');
  const [selectedSede, setSelectedSede] = useState<string>('todas');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('todos');
  const [productLineaFilter, setProductLineaFilter] = useState('todos');
  const [productColorFilter, setProductColorFilter] = useState('todos');
  const [productSizeFilter, setProductSizeFilter] = useState('todos');
  const [productStatusFilter, setProductStatusFilter] = useState<'todos' | 'activos' | 'inactivos' | 'bajo_stock'>('todos');

  // Estado para Recepción de Órdenes de Compra (Compras vs. Logística)
  const [selectedOCForRecepcion, setSelectedOCForRecepcion] = useState<OrdenCompraCorp | null>(null);
  const [isRecepcionModalOpen, setIsRecepcionModalOpen] = useState(false);
  const [selectedOCForActa, setSelectedOCForActa] = useState<OrdenCompraCorp | null>(null);
  const [isActaModalOpen, setIsActaModalOpen] = useState(false);
  const [ocSearchQuery, setOcSearchQuery] = useState('');
  const [ocStatusFilter, setOcStatusFilter] = useState('todos');
  const [recepcionForm, setRecepcionForm] = useState({
    sedeRecepcionId: 'bogota',
    fechaRecepcion: new Date().toISOString().slice(0, 10),
    fechaHoraRecepcion: '',
    nombreResponsable: '',
    documentoResponsable: '',
    cargoResponsable: 'Superintendente / Auxiliar de Bodega',
    loteFabricacion: '',
    observaciones: '',
    cantidadesPorSku: {} as Record<string, number>,
  });

  // Estado para Traslados Inter-Sedes (Remisiones Bodega a Bodega)
  const [selectedTrasladoForRecepcion, setSelectedTrasladoForRecepcion] = useState<TrasladoInterSede | null>(null);
  const [isRecepcionTrasladoModalOpen, setIsRecepcionTrasladoModalOpen] = useState(false);
  const [isNuevoTrasladoModalOpen, setIsNuevoTrasladoModalOpen] = useState(false);
  const [trasladoSearchQuery, setTrasladoSearchQuery] = useState('');
  const [trasladoStatusFilter, setTrasladoStatusFilter] = useState('todos');
  const [recepcionTrasladoForm, setRecepcionTrasladoForm] = useState({
    sedeRecepcionId: 'bogota',
    fechaRecepcion: new Date().toISOString().slice(0, 10),
    loteFabricacion: '',
    observaciones: '',
    cantidadesPorSku: {} as Record<string, number>,
  });
  const [nuevoTrasladoForm, setNuevoTrasladoForm] = useState({
    sedeOrigenId: 'rionegro',
    sedeDestinoId: 'bogota',
    transportadora: 'Flota Propia Pintuco CEDI',
    numeroGuia: '',
    fechaEstimadaLlegada: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
    observaciones: '',
    items: [
      { sku: 'PIN-VTX-01-BLA-5GL', cantidadEnviada: 15, loteFabricacion: `LOT-TR-${new Date().getFullYear()}-01` }
    ],
  });
  
  // Presets oficiales para Matriz de Variantes Pintuco
  const PRESET_PINTUCO_COLORS = useMemo(() => [
    { name: 'Blanco Puro Mate 1001', hex: '#F9FAFB', code: 'BLA' },
    { name: 'Blanco Almendra Satinado 1020', hex: '#F5EFEB', code: 'ALM' },
    { name: 'Gris Niebla Mate 7035', hex: '#CBD5E1', code: 'NIE' },
    { name: 'Arena Cálida 1023', hex: '#E2D9C8', code: 'ARE' },
    { name: 'Azul Océano Profundo 5003', hex: '#1E3A8A', code: 'OCE' },
    { name: 'Verde Salvia Calm 6021', hex: '#15803D', code: 'SAL' },
    { name: 'Negro Mate 9005', hex: '#1E293B', code: 'NEG' },
    { name: 'Rojo Terracota 3016', hex: '#C05621', code: 'TER' },
  ], []);

  const PRESET_PINTUCO_SIZES = useMemo(() => [
    { name: 'Cuñete (5 Gal)', suffix: '5GL', defaultPrice: 349000, defaultStock: 40, defaultStockMin: 15 },
    { name: 'Galón', suffix: '1GL', defaultPrice: 79900, defaultStock: 120, defaultStockMin: 30 },
    { name: 'Cuarto (1/4 Gal)', suffix: 'CUA', defaultPrice: 24900, defaultStock: 60, defaultStockMin: 10 },
  ], []);

  // Modal Crear / Editar Producto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ItemInventarioCorp | null>(null);

  // Estados para Creación de Matriz (+ Nuevo Producto)
  const [matrixBaseName, setMatrixBaseName] = useState('Pintura Viniltex Avanzado Lavable');
  const [matrixCategory, setMatrixCategory] = useState('Pintura Interior');
  const [matrixMarca, setMatrixMarca] = useState<'Pintuco' | 'Color In'>('Pintuco');
  const [matrixSkuBase, setMatrixSkuBase] = useState('PIN-VTX');
  const [matrixUbicacion, setMatrixUbicacion] = useState('CEDI Rionegro - Pasillo A-02');
  const [selectedColorsList, setSelectedColorsList] = useState<Array<{ name: string; hex: string; code: string }>>([
    { name: 'Blanco Puro Mate 1001', hex: '#F9FAFB', code: 'BLA' },
    { name: 'Blanco Almendra Satinado 1020', hex: '#F5EFEB', code: 'ALM' },
    { name: 'Gris Niebla Mate 7035', hex: '#CBD5E1', code: 'NIE' },
  ]);
  const [selectedSizesList, setSelectedSizesList] = useState<string[]>([
    'Cuñete (5 Gal)',
    'Galón',
    'Cuarto (1/4 Gal)',
  ]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#2563EB');
  const [variantMatrixItems, setVariantMatrixItems] = useState<Array<{
    key: string;
    color: string;
    colorHex: string;
    presentacion: string;
    sku: string;
    precio: number;
    stock: number;
    stockMinimo: number;
    enabled: boolean;
  }>>([]);

  const [productForm, setProductForm] = useState({
    nombre: '',
    productoBaseNombre: '',
    categoria: 'Pintura Interior',
    sku: '',
    marca: 'Pintuco' as 'Pintuco' | 'Color In',
    color: 'Blanco Puro Mate 1001',
    presentacion: 'Galón',
    precioVentaGL: 84900,
    stockGalones: 120,
    stockMinimoGalones: 30,
    ubicacionBodega: 'CEDI Rionegro - Pasillo A-01',
    costoUnitarioGL: 52000,
  });

  // Modal Eliminar / Desactivar Producto
  const [productToAction, setProductToAction] = useState<ItemInventarioCorp | null>(null);
  const [productActionType, setProductActionType] = useState<'desactivar' | 'activar' | 'eliminar'>('desactivar');
  const [isProductActionModalOpen, setIsProductActionModalOpen] = useState(false);

  // Despachos y Pedidos Nacionales
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('todos');
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<COLORLINKOrder | null>(null);
  const [isOrderStatusModalOpen, setIsOrderStatusModalOpen] = useState(false);
  const [orderStatusForm, setOrderStatusForm] = useState({
    nuevoEstado: 'En preparación',
    transportadora: 'Coordinadora Mercantil',
    guiaDespacho: '',
    observaciones: '',
  });

  // Notificación de éxito / feedback en Logística
  const [logisticsFeedbackMessage, setLogisticsFeedbackMessage] = useState<string | null>(null);

  // Inventario y Movimientos de Stock (Auditoría Kardex)
  const [isStockMovementModalOpen, setIsStockMovementModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<ItemInventarioCorp | null>(null);
  const [stockMovementForm, setStockMovementForm] = useState({
    tipo: 'Entrada' as 'Entrada' | 'Salida',
    cantidad: 10,
    sedeId: 'bogota',
    motivo: 'Inconsistencia en conteo físico / Auditoría cíclica',
    observacion: '',
  });

  const activeTicket = useMemo(() => {
    return ticketsSAC.find((t) => t.id === selectedTicketId) || ticketsSAC[0] || null;
  }, [ticketsSAC, selectedTicketId]);

  const unreadNotifCount = useMemo(() => {
    return notificaciones.filter((n) => !n.leida).length;
  }, [notificaciones]);

  const activeUserName = userSession?.nombre || 'Administrador General';

  // -------------------------------------------------------------
  // REGLAS DE ACCESO POR ROL
  // -------------------------------------------------------------
  const canAccessTab = (tab: typeof activeTab): boolean => {
    if (activeSimulatedRole === 'superadmin' || activeSimulatedRole === 'admin_intranet') return true;
    if (tab === 'dashboard' || tab === 'tareas' || tab === 'documentos') return true;
    if (tab === 'areas') return currentRoleConfig.permisos.canManageAreas || activeSimulatedRole === 'director_gerente';
    if (tab === 'funcionarios') return currentRoleConfig.permisos.canManageUsers;
    if (tab === 'comunidad') return true;
    if (tab === 'logistica') return currentRoleConfig.permisos.canManageInventory || activeSimulatedRole === 'director_gerente';
    if (tab === 'sac') return currentRoleConfig.permisos.canAnswerCustomerTickets || activeSimulatedRole === 'director_gerente';
    if (tab === 'auditoria') return currentRoleConfig.permisos.canViewAuditLog;
    return false;
  };

  // -------------------------------------------------------------
  // ACCIONES: TAREAS
  // -------------------------------------------------------------
  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.titulo.trim()) return;

    const areaObj = areas.find((a) => a.id === newTaskForm.areaId);
    const respObj = funcionarios.find((f) => f.id === newTaskForm.responsableId);

    const created = createTarea({
      titulo: newTaskForm.titulo.trim(),
      descripcion: newTaskForm.descripcion.trim(),
      areaId: newTaskForm.areaId,
      areaNombre: areaObj?.nombre || 'General',
      creadorNombre: activeUserName,
      creadorEmail: userSession?.email || 'admin@pintuco.com',
      responsableId: newTaskForm.responsableId,
      responsableNombre: respObj?.nombre || 'Funcionario Asignado',
      responsableEmail: respObj?.email || 'asignado@pintuco.com',
      responsableAvatar: respObj?.avatar || 'FA',
      colaboradores: [],
      prioridad: newTaskForm.prioridad,
      estado: 'Pendiente',
      fechaLimite: newTaskForm.fechaLimite,
      subtareas: [
        { id: `s-${Date.now()}-1`, texto: 'Revisión inicial y plan de trabajo', completada: false },
        { id: `s-${Date.now()}-2`, texto: 'Ejecución y registro de evidencias', completada: false },
      ],
      evidencias: [],
      requiereAprobacion: newTaskForm.requiereAprobacion,
    });

    setTareas(getTareas());
    setIsNewTaskModalOpen(false);
    setNewTaskForm({
      titulo: '',
      descripcion: '',
      areaId: areas[0]?.id || 'area-1',
      responsableId: funcionarios[0]?.id || 'func-1',
      prioridad: 'Media',
      fechaLimite: '2026-10-30',
      requiereAprobacion: false,
    });
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TareaLaboral['estado']) => {
    const updated = updateTarea(taskId, { estado: newStatus }, activeUserName);
    if (updated) {
      setTareas(getTareas());
      if (selectedTaskForDetail?.id === taskId) {
        setSelectedTaskForDetail(updated);
      }
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tareas.find((t) => t.id === taskId);
    if (!task) return;

    const nextSub = task.subtareas.map((s) => (s.id === subtaskId ? { ...s, completada: !s.completada } : s));
    const completedCount = nextSub.filter((s) => s.completada).length;
    const progress = Math.round((completedCount / nextSub.length) * 100);

    const updated = updateTarea(
      taskId,
      {
        subtareas: nextSub,
        progresoPct: progress,
        estado: progress === 100 ? (task.requiereAprobacion ? 'En revisión' : 'Completada') : 'En progreso',
      },
      activeUserName
    );

    if (updated) {
      setTareas(getTareas());
      if (selectedTaskForDetail?.id === taskId) {
        setSelectedTaskForDetail(updated);
      }
    }
  };

  const handleApproveTask = (taskId: string) => {
    const updated = updateTarea(
      taskId,
      {
        estado: 'Completada',
        progresoPct: 100,
        aprobadaPor: activeUserName,
        fechaAprobacion: new Date().toISOString().split('T')[0],
      },
      activeUserName
    );
    if (updated) {
      setTareas(getTareas());
      if (selectedTaskForDetail?.id === taskId) {
        setSelectedTaskForDetail(updated);
      }
    }
  };

  // -------------------------------------------------------------
  // ACCIONES: COMUNIDAD Y MURO
  // -------------------------------------------------------------
  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    createPublicacion({
      tipo: newPostType,
      titulo: newPostTitle.trim() || 'Comunicado del equipo ColorLink',
      contenido: newPostContent.trim(),
      autorNombre: activeUserName,
      autorCargo: userSession?.cargo || 'Administrador General',
      autorAvatar: activeUserName.slice(0, 2).toUpperCase(),
      autorArea: 'Dirección General y Gerencia',
      fijado: newPostIsOfficial,
      etiquetas: ['Corporativo', 'Pintuco', newPostType],
    });

    setPublicaciones(getPublicaciones());
    setNewPostContent('');
    setNewPostTitle('');
    setNewPostIsOfficial(false);
  };

  const handleLikePost = (postId: string) => {
    const next = publicaciones.map((p) => {
      if (p.id === postId) {
        const userEmail = userSession?.email || 'admin@pintuco.com';
        const alreadyLiked = p.usuariosMeGusta.includes(userEmail);
        return {
          ...p,
          meGusta: alreadyLiked ? p.meGusta - 1 : p.meGusta + 1,
          usuariosMeGusta: alreadyLiked
            ? p.usuariosMeGusta.filter((e) => e !== userEmail)
            : [...p.usuariosMeGusta, userEmail],
        };
      }
      return p;
    });
    savePublicaciones(next);
    setPublicaciones(next);
  };

  const handleAddPostComment = (postId: string) => {
    const text = newPostComment[postId]?.trim();
    if (!text) return;

    const next = publicaciones.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comentarios: [
            ...p.comentarios,
            {
              id: `c-${Date.now()}`,
              autorNombre: activeUserName,
              autorAvatar: activeUserName.slice(0, 2).toUpperCase(),
              fecha: 'Hace un momento',
              texto: text,
            },
          ],
        };
      }
      return p;
    });
    savePublicaciones(next);
    setPublicaciones(next);
    setNewPostComment((prev) => ({ ...prev, [postId]: '' }));
  };

  // -------------------------------------------------------------
  // ACCIONES: SAC (ATENCIÓN AL CLIENTE)
  // -------------------------------------------------------------
  const handleSendTicketReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentReplyText.trim() || !activeTicket) return;

    const updated = responderTicketSAC(
      activeTicket.id,
      agentReplyText.trim(),
      activeUserName,
      activeUserName.slice(0, 2).toUpperCase(),
      isInternalNote
    );

    if (updated) {
      setTicketsSAC(getTicketsSAC());
      setAgentReplyText('');
      setIsInternalNote(false);
    }
  };

  // -------------------------------------------------------------
  // ACCIONES: DESACTIVACIÓN CON REASIGNACIÓN DE FUNCIONARIOS
  // -------------------------------------------------------------
  const handleConfirmDeactivation = () => {
    if (!deactivatingFunc) return;

    // Si tiene tareas abiertas y se eligió un nuevo responsable, reasignarlas
    if (reassignTargetId) {
      const target = funcionarios.find((f) => f.id === reassignTargetId);
      if (target) {
        const updatedTareas = tareas.map((t) => {
          if (t.responsableId === deactivatingFunc.id && t.estado !== 'Completada') {
            return {
              ...t,
              responsableId: target.id,
              responsableNombre: target.nombre,
              responsableEmail: target.email,
              responsableAvatar: target.avatar,
              historial: [
                ...t.historial,
                {
                  id: `h-${Date.now()}`,
                  fecha: new Date().toLocaleString(),
                  usuario: activeUserName,
                  accion: `Reasignada automáticamente desde ${deactivatingFunc.nombre} a ${target.nombre} por desactivación de cuenta`,
                },
              ],
            };
          }
          return t;
        });
        saveTareas(updatedTareas);
        setTareas(updatedTareas);
      }
    }

    updateFuncionario(deactivatingFunc.id, { estado: 'Inactivo' });
    setFuncionarios(getFuncionarios());
    setDeactivatingFunc(null);
    setReassignTargetId('');
  };

  // -------------------------------------------------------------
  // BÚSQUEDA GLOBAL MULTIMÓDULO
  // -------------------------------------------------------------
  const globalSearchResults = useMemo(() => {
    if (!globalSearchQuery.trim()) return null;
    const q = globalSearchQuery.toLowerCase();

    return {
      tareas: tareas.filter((t) => t.titulo.toLowerCase().includes(q) || t.responsableNombre.toLowerCase().includes(q)),
      funcionarios: funcionarios.filter(
        (f) => f.nombre.toLowerCase().includes(q) || f.cargo.toLowerCase().includes(q) || f.email.toLowerCase().includes(q)
      ),
      areas: areas.filter((a) => a.nombre.toLowerCase().includes(q) || a.codigo.toLowerCase().includes(q)),
      tickets: ticketsSAC.filter((s) => s.asunto.toLowerCase().includes(q) || s.radicado.toLowerCase().includes(q)),
      inventario: inventario.filter((i) => i.nombre.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)),
    };
  }, [globalSearchQuery, tareas, funcionarios, areas, ticketsSAC, inventario]);

  // -------------------------------------------------------------
  // EXPORTACIÓN A CSV DE REPORTES
  // -------------------------------------------------------------
  const handleExportCSV = (tipo: 'tareas' | 'funcionarios' | 'inventario' | 'auditoria' | 'despachos') => {
    let rows: string[][] = [];
    let filename = `reporte_${tipo}_${Date.now()}.csv`;

    if (tipo === 'tareas') {
      rows.push(['ID', 'Título', 'Área', 'Responsable', 'Prioridad', 'Estado', 'Fecha Límite', 'Progreso %']);
      tareas.forEach((t) => {
        rows.push([t.id, `"${t.titulo}"`, `"${t.areaNombre}"`, `"${t.responsableNombre}"`, t.prioridad, t.estado, t.fechaLimite, `${t.progresoPct}%`]);
      });
    } else if (tipo === 'funcionarios') {
      rows.push(['ID', 'Nombre', 'Email', 'Cargo', 'Área', 'Rol', 'Estado', 'Ingreso']);
      funcionarios.forEach((f) => {
        rows.push([f.id, `"${f.nombre}"`, f.email, `"${f.cargo}"`, `"${f.areaNombre}"`, f.rolNombre, f.estado, f.fechaIngreso]);
      });
    } else if (tipo === 'inventario') {
      rows.push(['SKU', 'Nombre', 'Categoría', 'Stock Galones', 'Stock Cuñetes', 'Stock Mínimo', 'Ubicación Bodega', 'Precio']);
      inventario.forEach((i) => {
        rows.push([i.sku, `"${i.nombre}"`, i.categoria, String(i.stockGalones), String(i.stockCunetes), String(i.stockMinimoGalones), `"${i.ubicacionBodega}"`, String(i.precioVentaGL)]);
      });
    } else if (tipo === 'despachos') {
      rows.push(['Numero Orden', 'Fecha', 'Cliente', 'Documento', 'Telefono', 'Ciudad', 'Direccion', 'Estado', 'Guia', 'Transportadora', 'Total COP']);
      (orders || []).forEach((o) => {
        rows.push([
          o.numeroOrden,
          o.fechaCreacion,
          `"${o.form?.nombre_razon_social || o.customerName || 'Cliente'}"`,
          o.form?.documento || o.customerDocument || '',
          o.form?.responsable_contacto || o.customerPhone || '',
          `"${o.form?.ciudad || o.ciudadEntrega || ''}"`,
          `"${o.form?.direccion_obra || o.direccionEntrega || ''}"`,
          o.estado || 'Cotizado',
          o.guiaDespacho || 'S/N',
          'Coordinadora Mercantil',
          String(o.calculo?.costo_total_estimado || o.total || 0),
        ]);
      });
    } else {
      rows.push(['Fecha', 'Usuario', 'Rol', 'Módulo', 'Acción', 'Detalle']);
      auditoria.forEach((a) => {
        rows.push([a.fecha, `"${a.usuarioNombre}"`, a.usuarioRol, a.modulo, `"${a.accion}"`, `"${a.detalle}"`]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // ACCIONES LOGÍSTICA & GESTIÓN DE PRODUCTOS Y MATRIZ SKU
  // -------------------------------------------------------------
  const syncVariantMatrix = (
    baseSku: string,
    colors: Array<{ name: string; hex: string; code: string }> = [],
    sizes: string[] = [],
    existing: typeof variantMatrixItems = []
  ) => {
    const safeColors = Array.isArray(colors) ? colors : [];
    const safeSizes = Array.isArray(sizes) ? sizes : [];
    const safeExisting = Array.isArray(existing) ? existing : [];
    const existingMap = new Map(safeExisting.map((e) => [e.key, e]));
    const list: typeof variantMatrixItems = [];

    safeColors.forEach((col) => {
      if (!col) return;
      safeSizes.forEach((sz) => {
        if (!sz) return;
        const key = `${col.name}___${sz}`;
        const sizeDef = PRESET_PINTUCO_SIZES.find((s) => s.name === sz) || {
          name: sz,
          suffix: sz.includes('5') ? '5GL' : sz.includes('1/4') ? 'CUA' : sz.includes('Gal') ? '1GL' : 'UN',
          defaultPrice: sz.includes('5') ? 349000 : sz.includes('1/4') ? 24900 : sz.includes('Gal') ? 79900 : 15000,
          defaultStock: sz.includes('5') ? 30 : sz.includes('Gal') ? 80 : 40,
          defaultStockMin: sz.includes('5') ? 10 : sz.includes('Gal') ? 20 : 10,
        };

        const prev = existingMap.get(key);
        if (prev) {
          list.push(prev);
        } else {
          list.push({
            key,
            color: col.name,
            colorHex: col.hex,
            presentacion: sz,
            sku: `${baseSku || 'PIN-PROD'}-${col.code}-${sizeDef.suffix}`.toUpperCase(),
            precio: sizeDef.defaultPrice,
            stock: sizeDef.defaultStock,
            stockMinimo: sizeDef.defaultStockMin,
            enabled: true,
          });
        }
      });
    });

    setVariantMatrixItems(list);
  };

  const handleOpenNewProductModal = () => {
    setEditingProduct(null);
    const initialColors = [PRESET_PINTUCO_COLORS[0], PRESET_PINTUCO_COLORS[1], PRESET_PINTUCO_COLORS[2]];
    const initialSizes = ['Cuñete (5 Gal)', 'Galón', 'Cuarto (1/4 Gal)'];
    const initialSku = `PIN-VTX-${Math.floor(10 + Math.random() * 89)}`;

    setMatrixBaseName('Pintura Viniltex Avanzado Lavable');
    setMatrixCategory('Pintura Interior');
    setMatrixMarca('Pintuco');
    setMatrixSkuBase(initialSku);
    setMatrixUbicacion('CEDI Rionegro - Pasillo A-02');
    setSelectedColorsList(initialColors);
    setSelectedSizesList(initialSizes);
    setCustomColorName('');

    syncVariantMatrix(initialSku, initialColors, initialSizes, []);
    setIsProductModalOpen(true);
  };

  const handleToggleColorInMatrix = (colorObj: { name: string; hex: string; code: string }) => {
    const exists = selectedColorsList.some((c) => c.name === colorObj.name);
    let nextColors: typeof selectedColorsList;
    if (exists) {
      if (selectedColorsList.length <= 1) return;
      nextColors = selectedColorsList.filter((c) => c.name !== colorObj.name);
    } else {
      nextColors = [...selectedColorsList, colorObj];
    }
    setSelectedColorsList(nextColors);
    syncVariantMatrix(matrixSkuBase, nextColors, selectedSizesList, variantMatrixItems);
  };

  const handleAddCustomColor = () => {
    if (!customColorName.trim()) return;
    const cleanName = customColorName.trim();
    if (selectedColorsList.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) return;

    const code = cleanName.slice(0, 3).toUpperCase();
    const newColor = { name: cleanName, hex: customColorHex || '#3B82F6', code };
    const nextColors = [...selectedColorsList, newColor];
    setSelectedColorsList(nextColors);
    setCustomColorName('');
    syncVariantMatrix(matrixSkuBase, nextColors, selectedSizesList, variantMatrixItems);
  };

  const handleToggleSizeInMatrix = (sizeName: string) => {
    const exists = selectedSizesList.includes(sizeName);
    let nextSizes: string[];
    if (exists) {
      if (selectedSizesList.length <= 1) return;
      nextSizes = selectedSizesList.filter((s) => s !== sizeName);
    } else {
      nextSizes = [...selectedSizesList, sizeName];
    }
    setSelectedSizesList(nextSizes);
    syncVariantMatrix(matrixSkuBase, selectedColorsList, nextSizes, variantMatrixItems);
  };

  const handleUpdateMatrixItemField = (key: string, field: 'sku' | 'precio' | 'stock' | 'stockMinimo' | 'enabled', value: any) => {
    setVariantMatrixItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, [field]: value } : item))
    );
  };

  const handleOpenEditProductModal = (item: ItemInventarioCorp) => {
    setEditingProduct(item);
    setProductForm({
      nombre: item.nombre,
      productoBaseNombre: item.productoBaseNombre || item.nombre.split(' - ')[0] || item.nombre,
      categoria: item.categoria,
      sku: item.sku,
      marca: item.marca,
      color: item.color || 'Blanco Puro Mate 1001',
      presentacion: item.presentacion || 'Galón',
      precioVentaGL: item.precioVentaGL || 84900,
      stockGalones: item.stockGalones,
      stockMinimoGalones: item.stockMinimoGalones,
      ubicacionBodega: item.ubicacionBodega,
      costoUnitarioGL: item.costoUnitarioGL || 52000,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveMatrixProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matrixBaseName.trim() || !matrixSkuBase.trim()) return;

    const enabledVariants = variantMatrixItems.filter((v) => v.enabled);
    if (enabledVariants.length === 0) {
      alert('Debes mantener al menos una variante activada en la matriz.');
      return;
    }

    crearMatrizVariantesInventario(
      {
        nombre: matrixBaseName.trim(),
        categoria: matrixCategory,
        marca: matrixMarca,
        skuBase: matrixSkuBase.trim().toUpperCase(),
        ubicacionBodega: matrixUbicacion.trim() || 'CEDI Rionegro - Pasillo A-02',
      },
      enabledVariants.map((v) => ({
        sku: v.sku.trim().toUpperCase(),
        color: v.color,
        colorHex: v.colorHex,
        presentacion: v.presentacion,
        precioVentaGL: Number(v.precio) || 79900,
        stockGalones: Number(v.stock) || 0,
        stockMinimoGalones: Number(v.stockMinimo) || 20,
        costoUnitarioGL: Math.round((Number(v.precio) || 79900) * 0.62),
      })),
      activeUserName
    );

    setLogisticsFeedbackMessage(`¡Matriz de ${enabledVariants.length} variantes creada exitosamente para "${matrixBaseName}" y sincronizada con el Catálogo!`);
    setInventario(getInventarioCorp());
    setAuditoria(getAuditoria());
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!productForm.nombre.trim() || !productForm.sku.trim()) return;

    const baseName = productForm.productoBaseNombre.trim() || productForm.nombre.trim();

    actualizarProductoInventario(
      editingProduct.id,
      {
        nombre: productForm.nombre.trim(),
        productoBaseNombre: baseName,
        categoria: productForm.categoria.trim(),
        sku: productForm.sku.trim().toUpperCase(),
        marca: productForm.marca,
        color: productForm.color,
        presentacion: productForm.presentacion,
        medida: productForm.presentacion,
        precioVentaGL: Number(productForm.precioVentaGL) || 84900,
        stockGalones: Number(productForm.stockGalones) || 0,
        stockMinimoGalones: Number(productForm.stockMinimoGalones) || 30,
        ubicacionBodega: productForm.ubicacionBodega.trim() || 'CEDI Rionegro',
        costoUnitarioGL: Number(productForm.costoUnitarioGL) || 52000,
      },
      activeUserName
    );
    setLogisticsFeedbackMessage(`Variante "${productForm.nombre}" (SKU: ${productForm.sku}) actualizada correctamente.`);

    setInventario(getInventarioCorp());
    setAuditoria(getAuditoria());
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleOpenActionModal = (item: ItemInventarioCorp, action: 'desactivar' | 'activar' | 'eliminar') => {
    setProductToAction(item);
    setProductActionType(action);
    setIsProductActionModalOpen(true);
  };

  const handleConfirmProductAction = () => {
    if (!productToAction) return;
    const actionLabel = productActionType === 'eliminar' ? 'eliminado definitivamente' : productActionType === 'desactivar' ? 'desactivado' : 'activado';
    const updated = eliminarODesactivarProductoInventario(
      productToAction.id,
      activeUserName,
      productActionType
    );
    setInventario(updated);
    setAuditoria(getAuditoria());
    setLogisticsFeedbackMessage(`Producto SKU ${productToAction.sku} ("${productToAction.nombre}") ha sido ${actionLabel} exitosamente.`);
    setIsProductActionModalOpen(false);
    setProductToAction(null);
  };

  // -------------------------------------------------------------
  // ACCIONES DESPACHOS Y ACTUALIZACIÓN DE ESTADO DE PEDIDOS
  // -------------------------------------------------------------
  const handleOpenChangeOrderStatusModal = (order: COLORLINKOrder) => {
    setSelectedOrderForStatus(order);
    setOrderStatusForm({
      nuevoEstado: order.estado || 'En preparación',
      transportadora: 'Coordinadora Mercantil',
      guiaDespacho: order.guiaDespacho || `GUIA-${Math.floor(100000 + Math.random() * 900000)}`,
      observaciones: order.observacionesBodega || '',
    });
    setIsOrderStatusModalOpen(true);
  };

  const handleSaveOrderStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForStatus) return;

    onUpdateOrderStatus(selectedOrderForStatus.id, orderStatusForm.nuevoEstado, {
      guiaDespacho: orderStatusForm.guiaDespacho.trim() || undefined,
      responsableAlistamiento: activeUserName,
      observacionesBodega: orderStatusForm.observaciones.trim() || undefined,
    });

    // Descuento automático de inventario y trazabilidad en Kardex si el pedido pasa a Aprobado o Alistamiento
    const isApprovalOrDispatch = 
      orderStatusForm.nuevoEstado === 'Aprobado / Listo para Despacho' ||
      orderStatusForm.nuevoEstado === 'En preparación' ||
      orderStatusForm.nuevoEstado === 'Despachado' ||
      orderStatusForm.nuevoEstado.toLowerCase().includes('aprobado') ||
      orderStatusForm.nuevoEstado.toLowerCase().includes('listo');

    if (isApprovalOrDispatch) {
      try {
        const resDescuento = descontarInventarioPorPedido(selectedOrderForStatus, activeUserName);
        if (resDescuento.exito) {
          setLogisticsFeedbackMessage(`✅ Inventario descontado con éxito (${resDescuento.totalDescontadoGalones} GL). Trazabilidad asentada en Kardex.`);
        }
      } catch (err) {
        console.error('Error al descontar inventario en intranet:', err);
      }
    }

    // Refrescar inventario y auditoría local
    setTimeout(() => {
      setInventario(getInventarioCorp());
      setAuditoria(getAuditoria());
    }, 150);

    registrarAuditoria(
      'Inventario',
      'Actualización Estado Pedido',
      `Orden ${selectedOrderForStatus.numeroOrden} (${selectedOrderForStatus.form?.nombre_razon_social || selectedOrderForStatus.customerName || 'Cliente'}): estado actualizado a "${orderStatusForm.nuevoEstado}". Transportadora: ${orderStatusForm.transportadora}. Guía: ${orderStatusForm.guiaDespacho || 'S/N'}. Obs: ${orderStatusForm.observaciones || 'Actualizado en consola logística'}. Operador: ${activeUserName}`,
      activeUserName
    );
    setAuditoria(getAuditoria());
    setLogisticsFeedbackMessage(`El estado de la orden ${selectedOrderForStatus.numeroOrden} ha sido actualizado a "${orderStatusForm.nuevoEstado}". Número de guía asignado: ${orderStatusForm.guiaDespacho || 'S/N'}. El cliente puede consultar el seguimiento actualizado en tiempo real.`);
    setIsOrderStatusModalOpen(false);
    setSelectedOrderForStatus(null);
  };

  // -------------------------------------------------------------
  // ACCIONES: CORROBORACIÓN Y ACTA DE RECEPCIÓN (COMPRAS VS. LOGÍSTICA)
  // -------------------------------------------------------------
  const handleOpenActaModal = (oc: OrdenCompraCorp) => {
    setSelectedOCForActa(oc);
    setIsActaModalOpen(true);
  };

  const handleOpenRecepcionModal = (oc: OrdenCompraCorp) => {
    // REQUISITO DE INMUTABILIDAD: Si la orden ya fue recibida, abrir SIEMPRE el Acta Oficial en Modo Solo Lectura
    if (oc.estado === 'Recibido Conforme' || oc.estado === 'Recibido Parcial') {
      handleOpenActaModal(oc);
      return;
    }

    setSelectedOCForRecepcion(oc);
    const initialCantidades: Record<string, number> = {};
    oc.items.forEach((it) => {
      initialCantidades[it.sku] = it.cantidadRecibida !== undefined ? it.cantidadRecibida : it.cantidadEsperada;
    });

    const targetSedeId = oc.sedeDestinoId || (selectedSede !== 'todas' ? selectedSede : 'bogota');
    const randomLote = `LOT-2026-${Math.floor(1000 + Math.random() * 9000)}-${oc.proveedor.includes('Pintuco') ? 'PTC' : 'AKZ'}`;

    const now = new Date();
    const fechaHoraActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setRecepcionForm({
      sedeRecepcionId: targetSedeId,
      fechaRecepcion: now.toISOString().slice(0, 10),
      fechaHoraRecepcion: fechaHoraActual,
      nombreResponsable: activeUserName || userSession?.nombre || 'Superintendente de Bodegas CEDI',
      documentoResponsable: (userSession as any)?.documento || 'CC 1.018.492.310',
      cargoResponsable: (userSession as any)?.cargo || 'Superintendente de Bodegas CEDI',
      loteFabricacion: oc.loteGeneral || randomLote,
      observaciones: '',
      cantidadesPorSku: initialCantidades,
    });
    setIsRecepcionModalOpen(true);
  };

  const handleConfirmRecepcion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOCForRecepcion) return;

    if (!recepcionForm.nombreResponsable.trim()) {
      alert('Por favor ingresa el Nombre del Responsable que Recibe en Bodega / CEDI.');
      return;
    }

    if (!recepcionForm.documentoResponsable.trim()) {
      alert('Por favor ingresa el Número de Cédula / Documento de Identidad del Responsable.');
      return;
    }

    if (!recepcionForm.cargoResponsable.trim()) {
      alert('Por favor ingresa el Cargo del Funcionario que Recibe en Bodega / CEDI.');
      return;
    }

    if (!recepcionForm.loteFabricacion.trim()) {
      alert('Por favor ingresa o corrobora el Número de Lote de Fabricación.');
      return;
    }

    const targetSedeObj = SEDES_CEDI_CONFIG.find((s) => s.id === recepcionForm.sedeRecepcionId);
    const sedeNombre = targetSedeObj?.nombre || 'Bogotá - CEDI Principal';

    const itemsRecibidos = selectedOCForRecepcion.items.map((it) => ({
      sku: it.sku,
      cantidadRecibida: Math.max(0, Number(recepcionForm.cantidadesPorSku[it.sku]) || 0),
    }));

    const consecutivoActa = `ACT-REC-2026-${selectedOCForRecepcion.numeroOC.replace(/[^0-9]/g, '').slice(-4) || Math.floor(1000 + Math.random() * 9000)}`;

    const { ordenActualizada } = corroborarYRecibirOrdenCompra(selectedOCForRecepcion.id, {
      sedeRecepcionId: recepcionForm.sedeRecepcionId,
      sedeRecepcionNombre: sedeNombre,
      fechaRecepcion: recepcionForm.fechaRecepcion,
      fechaHoraRecepcion: recepcionForm.fechaHoraRecepcion,
      loteFabricacion: recepcionForm.loteFabricacion.trim().toUpperCase(),
      itemsRecibidos,
      usuarioNombre: recepcionForm.nombreResponsable.trim(),
      usuarioDocumento: recepcionForm.documentoResponsable.trim(),
      usuarioCargo: recepcionForm.cargoResponsable.trim(),
      actaConsecutivo: consecutivoActa,
      observaciones: recepcionForm.observaciones.trim(),
    });

    setOrdenesCompra(getOrdenesCompraCorp());
    setInventario(getInventarioCorp());
    setAuditoria(getAuditoria());

    const totalUnidades = itemsRecibidos.reduce((acc, curr) => acc + curr.cantidadRecibida, 0);
    setLogisticsFeedbackMessage(
      `✅ Acta Oficial ${consecutivoActa} generada e inmutable para Orden ${selectedOCForRecepcion.numeroOC}. Se ingresaron ${totalUnidades} unidades al stock de ${sedeNombre} con Lote ${recepcionForm.loteFabricacion.toUpperCase()}.`
    );

    setIsRecepcionModalOpen(false);
    setSelectedOCForRecepcion(null);

    // Abrir de inmediato el Acta Oficial en Modo Solo Lectura e Inmutable
    if (ordenActualizada) {
      setSelectedOCForActa(ordenActualizada);
      setIsActaModalOpen(true);
    }
  };

  // Handlers para Traslados Inter-Sedes (Remisiones Bodega a Bodega)
  const handleOpenRecepcionTrasladoModal = (tr: TrasladoInterSede) => {
    setSelectedTrasladoForRecepcion(tr);
    const initialCantidades: Record<string, number> = {};
    tr.items.forEach((it) => {
      initialCantidades[it.sku] = it.cantidadRecibida !== undefined ? it.cantidadRecibida : it.cantidadEnviada;
    });
    setRecepcionTrasladoForm({
      sedeRecepcionId: tr.sedeDestinoId || (selectedSede !== 'todas' ? selectedSede : 'bogota'),
      fechaRecepcion: new Date().toISOString().slice(0, 10),
      loteFabricacion: tr.loteGeneral || `LOT-TR-${new Date().getFullYear()}`,
      observaciones: '',
      cantidadesPorSku: initialCantidades,
    });
    setIsRecepcionTrasladoModalOpen(true);
  };

  const handleConfirmRecepcionTraslado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrasladoForRecepcion) return;

    const targetSedeObj = SEDES_CEDI_CONFIG.find((s) => s.id === recepcionTrasladoForm.sedeRecepcionId);
    const sedeNombre = targetSedeObj?.nombre || 'Sede Destino';

    const itemsRecibidos = selectedTrasladoForRecepcion.items.map((it) => ({
      sku: it.sku,
      cantidadRecibida: Math.max(0, Number(recepcionTrasladoForm.cantidadesPorSku[it.sku]) || 0),
    }));

    corroborarYRecibirTrasladoInterSede(selectedTrasladoForRecepcion.id, {
      sedeRecepcionId: recepcionTrasladoForm.sedeRecepcionId,
      sedeRecepcionNombre: sedeNombre,
      fechaRecepcion: recepcionTrasladoForm.fechaRecepcion,
      loteFabricacion: recepcionTrasladoForm.loteFabricacion,
      itemsRecibidos,
      usuarioNombre: activeUserName,
      observaciones: recepcionTrasladoForm.observaciones.trim(),
    });

    setTraslados(getTrasladosInterSedes());
    setInventario(getInventarioCorp());
    setAuditoria(getAuditoria());

    const totalU = itemsRecibidos.reduce((a, b) => a + b.cantidadRecibida, 0);
    setLogisticsFeedbackMessage(
      `🚚 Remisión ${selectedTrasladoForRecepcion.numeroRemision} corroborada y recibida con éxito en ${sedeNombre}. Se incrementaron +${totalU} unidades directamente al stock disponible y se asentó la entrada en Kardex.`
    );

    setIsRecepcionTrasladoModalOpen(false);
    setSelectedTrasladoForRecepcion(null);
  };

  const handleCreateNuevoTraslado = (e: React.FormEvent) => {
    e.preventDefault();
    if (nuevoTrasladoForm.sedeOrigenId === nuevoTrasladoForm.sedeDestinoId) {
      alert('La Sede de Origen y la Sede de Destino no pueden ser iguales. Selecciona sedes diferentes para el traslado.');
      return;
    }
    const itemsValidos = nuevoTrasladoForm.items.filter((it) => it.sku.trim() && it.cantidadEnviada > 0);
    if (itemsValidos.length === 0) {
      alert('Por favor agrega al menos una variante con SKU y cantidad a trasladar mayor a cero.');
      return;
    }

    const res = crearTrasladoInterSede({
      sedeOrigenId: nuevoTrasladoForm.sedeOrigenId,
      sedeDestinoId: nuevoTrasladoForm.sedeDestinoId,
      items: itemsValidos,
      transportadora: nuevoTrasladoForm.transportadora.trim() || 'Flota Propia Pintuco CEDI',
      numeroGuia: nuevoTrasladoForm.numeroGuia.trim(),
      fechaEstimadaLlegada: nuevoTrasladoForm.fechaEstimadaLlegada,
      observaciones: nuevoTrasladoForm.observaciones.trim(),
      usuarioNombre: activeUserName,
    });

    setTraslados(getTrasladosInterSedes());
    setInventario(getInventarioCorp());
    setAuditoria(getAuditoria());

    setLogisticsFeedbackMessage(
      `🚚 Remisión de Traslado ${res.nuevoTraslado.numeroRemision} generada. Se descontaron ${res.nuevoTraslado.totalUnidades} unidades de ${res.nuevoTraslado.sedeOrigenNombre} y el envío se encuentra En Tránsito hacia ${res.nuevoTraslado.sedeDestinoNombre}.`
    );

    setIsNuevoTrasladoModalOpen(false);
    // Reset form
    setNuevoTrasladoForm({
      sedeOrigenId: 'rionegro',
      sedeDestinoId: 'bogota',
      transportadora: 'Flota Propia Pintuco CEDI',
      numeroGuia: '',
      fechaEstimadaLlegada: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      observaciones: '',
      items: [
        { sku: 'PIN-VTX-01-BLA-5GL', cantidadEnviada: 15, loteFabricacion: `LOT-TR-${new Date().getFullYear()}-01` }
      ],
    });
  };

  // Listas únicas para filtros
  const uniqueLineas = useMemo(() => {
    const setL = new Set<string>();
    (inventario || []).forEach((i) => {
      if (!i) return;
      const base = i.productoBaseNombre || (i.nombre ? i.nombre.split(' - ')[0] : '') || i.nombre;
      if (base) setL.add(base);
    });
    return Array.from(setL).sort();
  }, [inventario]);

  const uniqueColores = useMemo(() => {
    const setC = new Set<string>();
    (inventario || []).forEach((i) => {
      if (i?.color) setC.add(i.color);
    });
    return Array.from(setC).sort();
  }, [inventario]);

  const uniqueTamanos = useMemo(() => {
    const setT = new Set<string>();
    (inventario || []).forEach((i) => {
      const p = i?.presentacion || i?.medida;
      if (p) setT.add(p);
    });
    return Array.from(setT).sort();
  }, [inventario]);

  // Filtros de Productos (Línea, Color, Tamaño, Categoría, Estado, Sede y Búsqueda)
  const filteredProducts = useMemo(() => {
    return (inventario || []).filter((item) => {
      if (!item) return false;
      if (productCategoryFilter !== 'todos' && item.categoria !== productCategoryFilter) return false;
      if (productLineaFilter !== 'todos') {
        const base = item.productoBaseNombre || (item.nombre ? item.nombre.split(' - ')[0] : '') || item.nombre;
        if (base !== productLineaFilter) return false;
      }
      if (productColorFilter !== 'todos' && item.color !== productColorFilter) return false;
      if (productSizeFilter !== 'todos') {
        const pres = item.presentacion || item.medida;
        if (pres !== productSizeFilter) return false;
      }
      if (productStatusFilter === 'activos' && !item.activo) return false;
      if (productStatusFilter === 'inactivos' && item.activo) return false;
      if (productStatusFilter === 'bajo_stock') {
        const stockActual = getStockEnSede(item, selectedSede);
        const minStock = selectedSede === 'todas'
          ? (item.stockMinimoUnidades || 10)
          : Math.max(2, Math.round((item.stockMinimoUnidades || 10) * 0.3));
        if (stockActual >= minStock) return false;
      }
      if (productSearchQuery.trim()) {
        const q = productSearchQuery.toLowerCase();
        return (
          (item.nombre || '').toLowerCase().includes(q) ||
          (item.sku || '').toLowerCase().includes(q) ||
          (item.categoria || '').toLowerCase().includes(q) ||
          (item.color || '').toLowerCase().includes(q) ||
          (item.presentacion || '').toLowerCase().includes(q) ||
          (item.productoBaseNombre || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inventario, productCategoryFilter, productLineaFilter, productColorFilter, productSizeFilter, productStatusFilter, productSearchQuery, selectedSede]);

  // Filtros de Pedidos
  const safeOrdersList = useMemo(() => orders || [], [orders]);

  const filteredOrders = useMemo(() => {
    return safeOrdersList.filter((order) => {
      if (orderStatusFilter !== 'todos') {
        const normFilter = orderStatusFilter.toLowerCase();
        const normState = (order.estado || '').toLowerCase();
        if (!normState.includes(normFilter)) return false;
      }
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const num = (order.numeroOrden || '').toLowerCase();
        const cliente = (order.form?.nombre_razon_social || order.customerName || '').toLowerCase();
        const doc = (order.form?.documento || order.customerDocument || '').toLowerCase();
        const ciudad = (order.form?.ciudad || order.ciudadEntrega || '').toLowerCase();
        const prod = (order.form?.producto_deseado || '').toLowerCase();
        return num.includes(q) || cliente.includes(q) || doc.includes(q) || ciudad.includes(q) || prod.includes(q);
      }
      return true;
    });
  }, [safeOrdersList, orderStatusFilter, orderSearchQuery]);

  const productStats = useMemo(() => {
    const totalRef = (inventario || []).length;
    const totalUnidades = (inventario || []).reduce((acc, i) => {
      if (!i || !i.activo) return acc;
      const u = Number(getStockEnSede(i, selectedSede)) || 0;
      return acc + u;
    }, 0);
    const bajoStock = (inventario || []).filter((i) => {
      if (!i || !i.activo) return false;
      const stockActual = Number(getStockEnSede(i, selectedSede)) || 0;
      const minStock = selectedSede === 'todas'
        ? (Number(i.stockMinimoUnidades) || 10)
        : Math.max(2, Math.round((Number(i.stockMinimoUnidades) || 10) * 0.3));
      return stockActual < minStock;
    }).length;
    const ocsPendientes = (ordenesCompra || []).filter((oc) => {
      if (!oc) return false;
      const matchSede = selectedSede === 'todas' || oc.sedeDestinoId === selectedSede;
      return matchSede && (oc.estado === 'Pendiente Recibo' || oc.estado === 'Recibido Parcial');
    }).length;
    return {
      totalRef: isNaN(totalRef) ? 0 : totalRef,
      totalUnidades: isNaN(totalUnidades) ? 0 : totalUnidades,
      bajoStock: isNaN(bajoStock) ? 0 : bajoStock,
      ocsPendientes: isNaN(ocsPendientes) ? 0 : ocsPendientes,
    };
  }, [inventario, selectedSede, ordenesCompra]);

  const trasladosStats = useMemo(() => {
    const list = traslados || [];
    const pendientesRecibo = list.filter((t) => {
      if (!t) return false;
      const matchSede = selectedSede === 'todas' || t.sedeDestinoId === selectedSede;
      return matchSede && t.estado === 'En Tránsito';
    }).length;
    const enTransitoTotal = list.filter((t) => t && t.estado === 'En Tránsito').length;
    const completados = list.filter((t) => t && t.estado === 'Recibido Conforme').length;
    const total = list.length;
    const unidadesEnTransito = list
      .filter((t) => t && t.estado === 'En Tránsito')
      .reduce((acc, t) => acc + (Number(t.totalUnidades) || 0), 0);
    return {
      pendientesRecibo: isNaN(pendientesRecibo) ? 0 : pendientesRecibo,
      enTransitoTotal: isNaN(enTransitoTotal) ? 0 : enTransitoTotal,
      completados: isNaN(completados) ? 0 : completados,
      total: isNaN(total) ? 0 : total,
      unidadesEnTransito: isNaN(unidadesEnTransito) ? 0 : unidadesEnTransito,
    };
  }, [traslados, selectedSede]);

  const orderStats = useMemo(() => {
    const total = safeOrdersList.length;
    const enPrep = safeOrdersList.filter((o) => (o.estado || '').toLowerCase().includes('preparaci') || (o.estado || '').toLowerCase().includes('alistamiento') || (o.estado || '').toLowerCase().includes('bodega')).length;
    const despachados = safeOrdersList.filter((o) => (o.estado || '').toLowerCase().includes('despachad')).length;
    const transito = safeOrdersList.filter((o) => (o.estado || '').toLowerCase().includes('tránsito') || (o.estado || '').toLowerCase().includes('transito')).length;
    const entregados = safeOrdersList.filter((o) => (o.estado || '').toLowerCase().includes('entregad')).length;
    return { total, enPrep, despachados, transito, entregados };
  }, [safeOrdersList]);

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-sans selection:bg-[#003366] selection:text-white">
      {/* =========================================================================
          ENCABEZADO EMPRESARIAL CORPORATIVO (TOP APP BAR)
      ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#001D3D] text-white border-b border-blue-900/60 shadow-md">
        <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          
          {/* Lado Izquierdo: Branding & Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-xl text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={sidebarCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 select-none">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-base shadow-sm">
                P
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-widest text-cyan-300">COLORLINK</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-900 text-sky-200 font-extrabold uppercase border border-blue-700/60">
                    INTRANET
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 block font-medium">
                  Portal Empresarial de Funcionarios Pintuco
                </span>
              </div>
            </div>
          </div>

          {/* Centro: Buscador Global (Quick Launcher) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
            <div 
              onClick={() => setGlobalSearchOpen(true)}
              className="w-full py-1.5 px-3 rounded-xl bg-white/15 hover:bg-white/20 border border-white/20 text-sky-200 text-xs flex items-center justify-between cursor-pointer transition-colors shadow-inner"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-cyan-300" />
                <span>Buscar tareas, funcionarios, áreas, SAC...</span>
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-black/30 text-[10px] font-mono text-cyan-300">Ctrl+K</kbd>
            </div>
          </div>

          {/* Lado Derecho: Selector de Rol / Simulador + Notificaciones + Perfil */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            
            {/* Simulador de Rol (Para administración y pruebas) */}
            <div className="hidden lg:flex items-center gap-1.5 bg-blue-950/80 px-2.5 py-1 rounded-xl border border-blue-700/60 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-[11px] text-sky-200 font-bold">Vista de Rol:</span>
              <select
                value={activeSimulatedRole}
                onChange={(e) => setActiveSimulatedRole(e.target.value as RolId)}
                className="bg-transparent text-white text-xs font-black outline-none cursor-pointer"
              >
                {ROLES_CORPORATIVOS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.nombre} (Nivel {r.nivel})
                  </option>
                ))}
              </select>
            </div>

            {/* Centro de Notificaciones */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Centro de Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Popover de Notificaciones */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 text-slate-800 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-cyan-600" /> Notificaciones ({notificaciones.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        marcarTodasNotificacionesLeidas();
                        setNotificaciones(getNotificaciones());
                      }}
                      className="text-[11px] text-blue-800 hover:underline font-bold cursor-pointer"
                    >
                      Marcar todas como leídas
                    </button>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notificaciones.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          marcarNotificacionLeida(n.id);
                          setNotificaciones(getNotificaciones());
                          setActiveTab(n.linkModulo as any);
                          setNotificationsOpen(false);
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          n.leida ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-sky-50/70 border-sky-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-extrabold">{n.titulo}</strong>
                          <span className="text-[10px] text-slate-400">{n.fecha}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{n.mensaje}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Perfil del Funcionario Activo */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/20">
              <div className="w-8 h-8 rounded-full bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center border-2 border-white shadow-xs">
                {activeUserName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left leading-none">
                <span className="text-xs font-extrabold text-white block truncate max-w-[130px]">
                  {activeUserName}
                </span>
                <span className="text-[10px] text-cyan-300 font-medium block truncate max-w-[130px]">
                  {currentRoleConfig.nombre}
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-600/40 transition-colors cursor-pointer ml-1"
                title="Cerrar sesión corporativa"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* =========================================================================
          CONTENEDOR PRINCIPAL: SIDEBAR + ESPACIO DE TRABAJO
      ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* SIDEBAR CORPORATIVO */}
        <aside
          className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shrink-0 select-none ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Navegación por módulos */}
          <div className="flex-1 py-4 px-2 space-y-4 overflow-y-auto">
            
            {/* GRUPO 1: PRINCIPAL */}
            <div>
              {!sidebarCollapsed && (
                <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">
                  General
                </span>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#001D3D] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Dashboard General"
              >
                <BarChart3 className="w-4 h-4 text-cyan-500 shrink-0" />
                {!sidebarCollapsed && <span>Dashboard Operativo</span>}
              </button>
            </div>

            {/* GRUPO 2: TRABAJO Y ORGANIZACIÓN */}
            <div>
              {!sidebarCollapsed && (
                <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Organización & Tareas
                </span>
              )}

              {/* Tareas */}
              <button
                type="button"
                onClick={() => setActiveTab('tareas')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'tareas'
                    ? 'bg-[#001D3D] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Gestión de Tareas"
              >
                <Kanban className="w-4 h-4 text-amber-500 shrink-0" />
                {!sidebarCollapsed && (
                  <span className="flex-1 flex items-center justify-between">
                    <span>Tareas por Área</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                      {tareas.filter((t) => t.estado !== 'Completada').length}
                    </span>
                  </span>
                )}
              </button>

              {/* Estructura Organizacional */}
              {canAccessTab('areas') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('areas')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer mt-1 ${
                    activeTab === 'areas'
                      ? 'bg-[#001D3D] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Estructura de 13 Áreas"
                >
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                  {!sidebarCollapsed && <span>Estructura (13 Áreas)</span>}
                </button>
              )}

              {/* Gestión de Funcionarios */}
              {canAccessTab('funcionarios') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('funcionarios')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer mt-1 ${
                    activeTab === 'funcionarios'
                      ? 'bg-[#001D3D] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Directorio de Funcionarios"
                >
                  <Users className="w-4 h-4 text-teal-600 shrink-0" />
                  {!sidebarCollapsed && <span>Gestión Funcionarios</span>}
                </button>
              )}
            </div>

            {/* GRUPO 3: OPERACIÓN & ATENCIÓN */}
            <div>
              {!sidebarCollapsed && (
                <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Operaciones & Clientes
                </span>
              )}

              {/* Logística & Inventario */}
              {canAccessTab('logistica') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('logistica')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'logistica'
                      ? 'bg-[#001D3D] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Logística, Productos e Inventarios"
                >
                  <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                  {!sidebarCollapsed && <span>Logística & Bodega</span>}
                </button>
              )}

              {/* SAC / Atención al Cliente */}
              {canAccessTab('sac') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('sac')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer mt-1 ${
                    activeTab === 'sac'
                      ? 'bg-[#001D3D] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Bandeja de Atención al Cliente (SAC)"
                >
                  <HeadphonesIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="flex-1 flex items-center justify-between">
                      <span>Atención al Cliente</span>
                      {ticketsSAC.filter((t) => t.estado === 'Nuevo').length > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                          {ticketsSAC.filter((t) => t.estado === 'Nuevo').length}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* GRUPO 4: CULTURA & CONTROL */}
            <div>
              {!sidebarCollapsed && (
                <span className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Cultura & Auditoría
                </span>
              )}

              {/* Muro Comunidad */}
              <button
                type="button"
                onClick={() => setActiveTab('comunidad')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'comunidad'
                    ? 'bg-[#001D3D] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Comunidad ColorLink"
              >
                <MessageSquare className="w-4 h-4 text-pink-600 shrink-0" />
                {!sidebarCollapsed && <span>Comunidad ColorLink</span>}
              </button>

              {/* Documentos */}
              <button
                type="button"
                onClick={() => setActiveTab('documentos')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer mt-1 ${
                  activeTab === 'documentos'
                    ? 'bg-[#001D3D] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Normativa y Documentación"
              >
                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                {!sidebarCollapsed && <span>Manuales & NTC 1335</span>}
              </button>

              {/* Auditoría */}
              {canAccessTab('auditoria') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('auditoria')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer mt-1 ${
                    activeTab === 'auditoria'
                      ? 'bg-[#001D3D] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Auditoría y Reportes"
                >
                  <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
                  {!sidebarCollapsed && <span>Auditoría & Informes</span>}
                </button>
              )}
            </div>

          </div>

          {/* Footer del Sidebar: Estado del Sistema */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>ColorLink Enterprise</span>
                <span className="text-emerald-600">v3.4 Activo</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Base de Datos Sincronizada</span>
              </div>
            </div>
          )}
        </aside>

        {/* ESPACIO DE TRABAJO PRINCIPAL (FLUIDO FULL-WIDTH) */}
        <main className="flex-1 overflow-y-auto w-full max-w-none px-3 sm:px-4 lg:px-5 py-3 sm:py-4 space-y-3.5">
          
          {/* =========================================================================
              MÓDULO 1: DASHBOARD OPERATIVO (EJECUTIVO / PERSONAL)
          ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Bienvenida y Resumen Estratégico */}
              <div className="bg-gradient-to-r from-[#001D3D] to-[#003366] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
                  <Building2 className="w-72 h-72 text-white" />
                </div>

                <div className="relative z-10 max-w-2xl space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-300 text-xs font-black border border-cyan-400/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Panel de Control Corporativo • Pintuco 2026</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Bienvenido, {activeUserName}
                  </h2>
                  <p className="text-xs sm:text-sm text-sky-200/90 leading-relaxed">
                    Rol activo: <strong className="text-white">{currentRoleConfig.nombre}</strong>. Supervisión integrada de las 13 áreas operativas, cumplimiento NTC 1335 y despacho nacional.
                  </p>
                </div>
              </div>

              {/* 4 Indicadores Clave de Desempeño (KPIs) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>Funcionarios Activos</span>
                    <Users className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {funcionarios.filter((f) => f.estado === 'Activo').length}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="text-emerald-600 font-bold">13 Áreas</span> operativas cubiertas
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>Cumplimiento Tareas</span>
                    <Kanban className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {Math.round((tareas.filter((t) => t.estado === 'Completada').length / tareas.length) * 100)}%
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="font-bold text-slate-900">{tareas.filter((t) => t.estado === 'Completada').length} de {tareas.length}</span> completadas
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>Casos SAC Pendientes</span>
                    <HeadphonesIcon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {ticketsSAC.filter((t) => t.estado === 'Nuevo' || t.estado === 'En proceso').length}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <span>SLA Promedio: 18 min</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>Stock Disponible Total</span>
                    <Boxes className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {inventario.reduce((acc, i) => acc + i.stockGalones, 0).toLocaleString()} GL
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {inventario.reduce((acc, i) => acc + i.stockCunetes, 0)} Cuñetes certificados
                  </div>
                </div>
              </div>

              {/* Grid 2 Columnas: Tareas Urgentes y Comunicados Recientes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Tareas Urgentes y Pendientes */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" /> Tareas Prioritarias
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tareas')}
                      className="text-xs text-blue-900 hover:underline font-bold cursor-pointer"
                    >
                      Ver todas ({tareas.length}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {tareas.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          setSelectedTaskForDetail(t);
                          setActiveTab('tareas');
                        }}
                        className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                            {t.areaNombre}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 truncate mt-1">{t.titulo}</h4>
                          <span className="text-[11px] text-slate-500 block">Resp: {t.responsableNombre} • Vence: {t.fechaLimite}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            t.estado === 'Completada' ? 'bg-emerald-100 text-emerald-800' :
                            t.estado === 'En revisión' ? 'bg-purple-100 text-purple-800' :
                            t.estado === 'Bloqueada' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {t.estado}
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 mt-2 overflow-hidden">
                            <div className="h-full bg-blue-900" style={{ width: `${t.progresoPct}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Últimos Mensajes Entrantes de Clientes (SAC) */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <HeadphonesIcon className="w-4 h-4 text-emerald-600" /> Solicitudes de Clientes en Vivo
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('sac')}
                      className="text-xs text-blue-900 hover:underline font-bold cursor-pointer"
                    >
                      Bandeja SAC ({ticketsSAC.length}) →
                    </button>
                  </div>

                  <div className="space-y-3">
                    {ticketsSAC.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedTicketId(s.id);
                          setActiveTab('sac');
                        }}
                        className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black text-blue-950">{s.radicado}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                            {s.canal}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{s.asunto}</h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{s.clienteNombre}</span>
                          <span className="text-emerald-700 font-bold">{s.estado}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* =========================================================================
              MÓDULO 2: ESTRUCTURA ORGANIZACIONAL (13 ÁREAS)
          ========================================================================= */}
          {activeTab === 'areas' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Encabezado del Módulo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 uppercase">
                      Organigrama Ficticio Académico
                    </span>
                    <span className="text-xs text-slate-400">13 Áreas Propuestas</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">Estructura Organizacional Pintuco</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configuración de jefaturas, permisos modulares, equipos de trabajo e indicadores operativos.
                  </p>
                </div>

                {currentRoleConfig.permisos.canManageAreas && (
                  <button
                    type="button"
                    onClick={() => setIsNewAreaModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Crear Nueva Área</span>
                  </button>
                )}
              </div>

              {/* Grid de las 13 Áreas */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {areas.map((area) => (
                  <div
                    key={area.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${area.colorBadge}`}>
                          {area.codigo} • {area.activa ? 'Activa' : 'Inactiva'}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {area.empleadosCount} colaboradores
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 leading-snug">{area.nombre}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{area.descripcion}</p>

                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block">Líder Responsable:</span>
                        <strong className="text-slate-900 block truncate">{area.liderNombre}</strong>
                        <span className="text-[11px] text-slate-500 block truncate">{area.liderCargo}</span>
                      </div>
                    </div>

                    {/* KPIs del Área */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        {area.kpis.map((kpi, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-sky-50/50 border border-sky-100 text-center">
                            <span className="text-[9px] text-slate-500 block truncate">{kpi.label}</span>
                            <strong className="text-blue-950 font-black text-xs block">{kpi.valor}</strong>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {tareas.filter((t) => t.areaId === area.id).length} tareas asignadas
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setTaskFilterArea(area.id);
                            setActiveTab('tareas');
                          }}
                          className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Ver espacio</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* =========================================================================
              MÓDULO 3: GESTIÓN DE FUNCIONARIOS
          ========================================================================= */}
          {activeTab === 'funcionarios' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Encabezado y Filtros */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Directorio de Funcionarios</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Administración de personal, asignación de cargos, jefaturas inmediatas y control de acceso RBAC.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExportCSV('funcionarios')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar CSV</span>
                  </button>

                  {currentRoleConfig.permisos.canManageUsers && (
                    <button
                      type="button"
                      onClick={() => setIsNewFuncModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Nuevo Funcionario</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filtros de Tabla */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={funcSearch}
                    onChange={(e) => setFuncSearch(e.target.value)}
                    placeholder="Buscar por nombre, correo o cargo..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={funcFilterArea}
                    onChange={(e) => setFuncFilterArea(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                  >
                    <option value="todos">Todas las Áreas</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>

                  <select
                    value={funcFilterStatus}
                    onChange={(e) => setFuncFilterStatus(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                  >
                    <option value="todos">Todos los Estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Suspendido">Suspendido</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Tabla de Funcionarios */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4">Funcionario</th>
                        <th className="py-3 px-4">Cargo & Área</th>
                        <th className="py-3 px-4">Rol RBAC</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Último Acceso</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {funcionarios
                        .filter((f) => {
                          const matchQ = f.nombre.toLowerCase().includes(funcSearch.toLowerCase()) || f.email.toLowerCase().includes(funcSearch.toLowerCase()) || f.cargo.toLowerCase().includes(funcSearch.toLowerCase());
                          const matchA = funcFilterArea === 'todos' || f.areaId === funcFilterArea;
                          const matchS = funcFilterStatus === 'todos' || f.estado === funcFilterStatus;
                          return matchQ && matchA && matchS;
                        })
                        .map((f) => (
                          <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-blue-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                                  {f.avatar}
                                </div>
                                <div className="min-w-0">
                                  <strong className="text-slate-900 block truncate">{f.nombre}</strong>
                                  <span className="text-[11px] text-slate-400 font-mono block truncate">{f.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <strong className="text-slate-800 block truncate">{f.cargo}</strong>
                              <span className="text-[11px] text-slate-500 block truncate">{f.areaNombre}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-900">
                                {f.rolNombre}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                f.estado === 'Activo' ? 'bg-emerald-100 text-emerald-800' :
                                f.estado === 'Suspendido' ? 'bg-amber-100 text-amber-800' :
                                'bg-slate-200 text-slate-700'
                              }`}>
                                {f.estado}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                              {f.ultimoAcceso}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTaskFilterAssignee(f.id);
                                    setActiveTab('tareas');
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-slate-100 cursor-pointer"
                                  title="Ver tareas asignadas"
                                >
                                  <Kanban className="w-4 h-4" />
                                </button>
                                {currentRoleConfig.permisos.canManageUsers && f.estado === 'Activo' && (
                                  <button
                                    type="button"
                                    onClick={() => setDeactivatingFunc(f)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    title="Desactivar cuenta"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal de Desactivación con Trazabilidad y Reasignación */}
              {deactivatingFunc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                  <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center gap-3 text-rose-600">
                      <AlertTriangle className="w-6 h-6 shrink-0" />
                      <h3 className="text-base font-black text-slate-900">
                        Confirmación de Desactivación de Cuenta
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Está a punto de desactivar a <strong className="text-slate-900">{deactivatingFunc.nombre}</strong> ({deactivatingFunc.cargo}).
                      Sus sesiones activas serán invalidadas inmediatamente. Los registros históricos y comentarios se conservarán intactos.
                    </p>

                    {/* Verificación de Tareas Pendientes */}
                    {tareas.filter((t) => t.responsableId === deactivatingFunc.id && t.estado !== 'Completada').length > 0 && (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                        <strong className="text-amber-900 block font-black">
                          ⚠️ Este funcionario tiene {tareas.filter((t) => t.responsableId === deactivatingFunc.id && t.estado !== 'Completada').length} tarea(s) abierta(s):
                        </strong>
                        <p className="text-[11px] text-amber-800">
                          Seleccione a un funcionario del equipo para reasignar automáticamente todas sus tareas y mantener la continuidad operativa:
                        </p>
                        <select
                          value={reassignTargetId}
                          onChange={(e) => setReassignTargetId(e.target.value)}
                          className="w-full p-2 rounded-xl bg-white border border-amber-300 text-xs font-semibold"
                        >
                          <option value="">-- No reasignar de momento --</option>
                          {funcionarios
                            .filter((f) => f.id !== deactivatingFunc.id && f.estado === 'Activo')
                            .map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.nombre} ({f.cargo} - {f.areaNombre})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setDeactivatingFunc(null)}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmDeactivation}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Confirmar Desactivación
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* =========================================================================
              MÓDULO 4: TAREAS POR ÁREA & MIS TAREAS
          ========================================================================= */}
          {activeTab === 'tareas' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Encabezado y Acciones */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Gestión de Tareas y Compromisos</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Planificación por áreas, flujo de revisión y aprobación, tableros Kanban y cálculo de cumplimiento real.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Selector de Vistas */}
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setTaskViewMode('kanban')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        taskViewMode === 'kanban' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Kanban
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskViewMode('list')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        taskViewMode === 'list' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Lista
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExportCSV('tareas')}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="Exportar tareas"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsNewTaskModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Tarea</span>
                  </button>
                </div>
              </div>

              {/* Filtros de Área y Responsable */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={taskFilterArea}
                    onChange={(e) => setTaskFilterArea(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                  >
                    <option value="todos">Todas las Áreas ({tareas.length})</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>

                  <select
                    value={taskFilterAssignee}
                    onChange={(e) => setTaskFilterAssignee(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                  >
                    <option value="todos">Todos los Responsables</option>
                    {funcionarios.map((f) => (
                      <option key={f.id} value={f.id}>{f.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="text-xs text-slate-500 font-bold">
                  {tareas.filter((t) => (taskFilterArea === 'todos' || t.areaId === taskFilterArea) && (taskFilterAssignee === 'todos' || t.responsableId === taskFilterAssignee)).length} tareas filtradas
                </div>
              </div>

              {/* VISTA 1: TABLERO KANBAN */}
              {taskViewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {(['Pendiente', 'En progreso', 'Bloqueada', 'En revisión', 'Completada'] as TareaLaboral['estado'][]).map((colEstado) => {
                    const colTasks = tareas.filter(
                      (t) =>
                        t.estado === colEstado &&
                        (taskFilterArea === 'todos' || t.areaId === taskFilterArea) &&
                        (taskFilterAssignee === 'todos' || t.responsableId === taskFilterAssignee)
                    );

                    return (
                      <div key={colEstado} className="bg-slate-200/60 p-3.5 rounded-3xl space-y-3 min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-300/80">
                          <span className="font-black text-xs text-slate-800">{colEstado}</span>
                          <span className="px-2 py-0.5 rounded-full bg-white text-slate-700 text-[10px] font-black shadow-2xs">
                            {colTasks.length}
                          </span>
                        </div>

                        <div className="flex-1 space-y-3">
                          {colTasks.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => setSelectedTaskForDetail(t)}
                              className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-900 truncate">
                                  {t.areaNombre}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  t.prioridad === 'Urgente' ? 'bg-rose-100 text-rose-800' :
                                  t.prioridad === 'Alta' ? 'bg-amber-100 text-amber-800' :
                                  'bg-slate-100 text-slate-700'
                                }`}>
                                  {t.prioridad}
                                </span>
                              </div>

                              <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">{t.titulo}</h4>

                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-900 h-full" style={{ width: `${t.progresoPct}%` }}></div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                                <span className="truncate max-w-[100px]">{t.responsableNombre.split(' ')[0]}</span>
                                <span className="text-[10px]">{t.fechaLimite.slice(5)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* VISTA 2: LISTA DETALLADA */}
              {taskViewMode === 'list' && (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {tareas
                      .filter(
                        (t) =>
                          (taskFilterArea === 'todos' || t.areaId === taskFilterArea) &&
                          (taskFilterAssignee === 'todos' || t.responsableId === taskFilterAssignee)
                      )
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTaskForDetail(t)}
                          className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                                {t.areaNombre}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                t.prioridad === 'Urgente' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {t.prioridad}
                              </span>
                              <span className="text-xs text-slate-400">Vence: {t.fechaLimite}</span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900">{t.titulo}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{t.descripcion}</p>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-800 block">{t.responsableNombre}</span>
                              <span className="text-[11px] text-blue-900 font-extrabold">{t.progresoPct}% Avance</span>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700">
                              {t.estado}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Modal de Detalle de Tarea con Aprobación */}
              {selectedTaskForDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                  <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                          {selectedTaskForDetail.areaNombre}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-1">{selectedTaskForDetail.titulo}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTaskForDetail(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{selectedTaskForDetail.descripcion}</p>

                    {/* Subtareas */}
                    <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <strong className="text-xs font-black text-slate-900 block">Lista de Verificación / Subtareas:</strong>
                      {selectedTaskForDetail.subtareas.map((sub) => (
                        <label key={sub.id} className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sub.completada}
                            onChange={() => handleToggleSubtask(selectedTaskForDetail.id, sub.id)}
                            className="rounded text-blue-900"
                          />
                          <span className={sub.completada ? 'line-through text-slate-400' : 'font-semibold'}>
                            {sub.texto}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Flujo de Aprobación */}
                    {selectedTaskForDetail.requiereAprobacion && (
                      <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="text-purple-950 font-black flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-purple-700" /> Aprobación Requerida por Jefatura
                          </strong>
                          <span className="text-[11px] text-purple-800">
                            {selectedTaskForDetail.aprobadaPor ? `Aprobada por: ${selectedTaskForDetail.aprobadaPor}` : 'Pendiente de firma'}
                          </span>
                        </div>
                        {currentRoleConfig.permisos.canApproveTasks && !selectedTaskForDetail.aprobadaPor && (
                          <button
                            type="button"
                            onClick={() => handleApproveTask(selectedTaskForDetail.id)}
                            className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs cursor-pointer"
                          >
                            Aprobar y Finalizar Tarea
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedTaskForDetail.estado}
                          onChange={(e) => handleUpdateTaskStatus(selectedTaskForDetail.id, e.target.value as any)}
                          className="px-3 py-1.5 text-xs rounded-xl bg-slate-100 font-bold border border-slate-200"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En progreso">En progreso</option>
                          <option value="En revisión">En revisión</option>
                          <option value="Bloqueada">Bloqueada</option>
                          <option value="Completada">Completada</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedTaskForDetail(null)}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                      >
                        Cerrar Detalle
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Nueva Tarea */}
              {isNewTaskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                  <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-base font-black text-slate-900">Crear Nueva Tarea</h3>
                      <button type="button" onClick={() => setIsNewTaskModalOpen(false)}>
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateTaskSubmit} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Título de la Tarea *</label>
                        <input
                          type="text"
                          required
                          value={newTaskForm.titulo}
                          onChange={(e) => setNewTaskForm({ ...newTaskForm, titulo: e.target.value })}
                          placeholder="Ej. Revisión de protocolos de tintometría"
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Descripción</label>
                        <textarea
                          rows={3}
                          value={newTaskForm.descripcion}
                          onChange={(e) => setNewTaskForm({ ...newTaskForm, descripcion: e.target.value })}
                          placeholder="Detalles y objetivos de la tarea..."
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Área Responsable</label>
                          <select
                            value={newTaskForm.areaId}
                            onChange={(e) => setNewTaskForm({ ...newTaskForm, areaId: e.target.value })}
                            className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200"
                          >
                            {areas.map((a) => (
                              <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Responsable Principal</label>
                          <select
                            value={newTaskForm.responsableId}
                            onChange={(e) => setNewTaskForm({ ...newTaskForm, responsableId: e.target.value })}
                            className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200"
                          >
                            {funcionarios.map((f) => (
                              <option key={f.id} value={f.id}>{f.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Prioridad</label>
                          <select
                            value={newTaskForm.prioridad}
                            onChange={(e) => setNewTaskForm({ ...newTaskForm, prioridad: e.target.value as any })}
                            className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200"
                          >
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Fecha Límite</label>
                          <input
                            type="date"
                            value={newTaskForm.fechaLimite}
                            onChange={(e) => setNewTaskForm({ ...newTaskForm, fechaLimite: e.target.value })}
                            className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={newTaskForm.requiereAprobacion}
                          onChange={(e) => setNewTaskForm({ ...newTaskForm, requiereAprobacion: e.target.checked })}
                          className="rounded text-blue-900"
                        />
                        <span className="font-bold text-slate-700">Requiere aprobación previa de la Jefatura para cerrarse</span>
                      </label>

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsNewTaskModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-xs"
                        >
                          Guardar Tarea
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* =========================================================================
              MÓDULO 5: COMUNIDAD COLORLINK (MURO CORPORATIVO TIPO RED SOCIAL)
          ========================================================================= */}
          {activeTab === 'comunidad' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Encabezado */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Comunidad ColorLink</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Noticias oficiales, logros de equipo, reconocimientos a funcionarios y cultura organizacional.
                  </p>
                </div>
              </div>

              {/* Crear Publicación */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <form onSubmit={handlePublishPost} className="space-y-3">
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Título del comunicado o noticia..."
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-50 border border-slate-200 outline-none"
                  />
                  <textarea
                    rows={3}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Comparte un logro de equipo, comunicado o felicitación con la organización..."
                    className="w-full p-3 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none resize-none"
                  />

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <select
                        value={newPostType}
                        onChange={(e) => setNewPostType(e.target.value as any)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-bold"
                      >
                        <option value="noticia">Noticia General</option>
                        <option value="comunicado">Comunicado Oficial</option>
                        <option value="reconocimiento">Reconocimiento</option>
                        <option value="seguridad">Seguridad & SST</option>
                      </select>

                      {currentRoleConfig.permisos.canPostOfficialNews && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newPostIsOfficial}
                            onChange={(e) => setNewPostIsOfficial(e.target.checked)}
                          />
                          <span>Fijar en el encabezado</span>
                        </label>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!newPostContent.trim()}
                      className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-40"
                    >
                      Publicar
                    </button>
                  </div>
                </form>
              </div>

              {/* Feed de Publicaciones */}
              <div className="space-y-5">
                {publicaciones.map((post) => (
                  <div key={post.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    
                    {/* Header del Post */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-950 text-white font-black text-sm flex items-center justify-center">
                          {post.autorAvatar}
                        </div>
                        <div>
                          <strong className="text-sm font-black text-slate-900 block leading-tight">{post.autorNombre}</strong>
                          <span className="text-[11px] text-slate-500 block">{post.autorCargo} • {post.fecha}</span>
                        </div>
                      </div>

                      {post.fijado && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-900 uppercase">
                          Comunicado Oficial Fijado
                        </span>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="space-y-2">
                      <h3 className="font-black text-base text-slate-900">{post.titulo}</h3>
                      <p className="text-xs text-slate-700 leading-relaxed">{post.contenido}</p>
                    </div>

                    {/* Tarjeta de Reconocimiento si aplica */}
                    {post.reconocimiento && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center shadow-xs shrink-0">
                          <Award className="w-6 h-6 text-slate-950" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-black text-amber-900 block">
                            {post.reconocimiento.categoria} • {post.reconocimiento.periodo}
                          </span>
                          <strong className="text-sm font-black text-slate-900 block">{post.reconocimiento.destacadoNombre}</strong>
                          <p className="text-[11px] text-slate-600 line-clamp-2">{post.reconocimiento.motivo}</p>
                        </div>
                      </div>
                    )}

                    {/* Interacciones (Likes & Comentarios) */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <button
                        type="button"
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                          post.usuariosMeGusta.includes(userSession?.email || 'admin@pintuco.com')
                            ? 'bg-rose-50 text-rose-600'
                            : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{post.meGusta} Me gusta</span>
                      </button>

                      <span className="text-slate-400">{post.comentarios.length} comentarios</span>
                    </div>

                    {/* Hilo de Comentarios */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {post.comentarios.map((c) => (
                        <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900 font-extrabold">{c.autorNombre}</strong>
                            <span className="text-[10px] text-slate-400">{c.fecha}</span>
                          </div>
                          <p className="text-slate-600 text-[11px]">{c.texto}</p>
                        </div>
                      ))}

                      {/* Caja de Comentar */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newPostComment[post.id] || ''}
                          onChange={(e) => setNewPostComment({ ...newPostComment, [post.id]: e.target.value })}
                          placeholder="Escribe un comentario o felicitación..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddPostComment(post.id)}
                          className="px-3 py-1.5 rounded-xl bg-blue-900 text-white text-xs font-bold cursor-pointer"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* =========================================================================
              MÓDULO 6: LOGÍSTICA, PRODUCTOS E INVENTARIOS & DESPACHOS
          ========================================================================= */}
          {activeTab === 'logistica' && (
            <div className="space-y-2.5 sm:space-y-3 animate-fadeIn">
              
              {/* Notificación de feedback temporal */}
              {logisticsFeedbackMessage && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-2.5 shadow-2xs animate-fadeIn">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold leading-tight">{logisticsFeedbackMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogisticsFeedbackMessage(null)}
                    className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 cursor-pointer transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* TIER 1: CABECERA EMPRESARIAL COMPACTA - COMANDO Y SELECTOR DE SEDE CEDI ACTIVO */}
              <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs px-3 py-1.5 sm:px-3.5 sm:py-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#001D3D] via-[#002D5C] to-[#0A192F] text-cyan-300 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-cyan-500/30">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none">
                        Logística, Bodega y Despachos
                      </h2>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-black bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        ERP Enterprise v3.4
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 font-medium mt-0.5 leading-tight">
                      Red Nacional CEDI Pintuco • Control de Existencias, Entradas, Remisiones y Despachos
                    </p>
                  </div>
                </div>

                {/* Selector de Sede CEDI activo estilizado y compacto */}
                <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/90 py-0.5 px-2 rounded-md border border-slate-200/90 transition-all shadow-2xs self-start md:self-auto shrink-0">
                  <div className="w-5 h-5 rounded bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200/80 shrink-0 shadow-2xs">
                    <MapPin className="w-3 h-3" />
                  </div>
                  <div className="text-left">
                    <label htmlFor="sedeSelector" className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block leading-none">
                      Sede / CEDI Activo:
                    </label>
                    <select
                      id="sedeSelector"
                      value={selectedSede}
                      onChange={(e) => setSelectedSede(e.target.value)}
                      className="bg-transparent text-slate-900 font-black text-[11px] focus:outline-none cursor-pointer mt-0.5 pr-1 leading-tight"
                    >
                      <option value="todas">🏢 Todas las Sedes (Consolidado Nacional)</option>
                      {SEDES_CEDI_CONFIG.map((sede) => (
                        <option key={sede.id} value={sede.id}>
                          📍 {sede.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* TIER 2: BARRA DE NAVEGACIÓN DE PESTAÑAS (COMPACTA Y ALINEADA) */}
              <div className="bg-white rounded-lg border border-slate-200/90 p-1 shadow-2xs w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 w-full">
                  <button
                    type="button"
                    onClick={() => setLogisticsSubTab('inventario')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-all cursor-pointer ${
                      logisticsSubTab === 'inventario'
                        ? 'bg-[#001D3D] text-white shadow-sm font-black border border-[#001D3D]'
                        : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold border border-slate-200/70 shadow-2xs'
                    }`}
                  >
                    <Package className={`w-3.5 h-3.5 shrink-0 ${logisticsSubTab === 'inventario' ? 'text-cyan-300' : 'text-slate-500'}`} />
                    <span className="truncate">Inventario & Matriz</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold shrink-0 ${
                      logisticsSubTab === 'inventario' ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/30' : 'bg-slate-200/80 text-slate-700'
                    }`}>
                      {(Number(productStats.totalRef) || 0)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogisticsSubTab('recepcion_compras')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-all cursor-pointer ${
                      logisticsSubTab === 'recepcion_compras'
                        ? 'bg-[#001D3D] text-white shadow-sm font-black border border-[#001D3D]'
                        : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold border border-slate-200/70 shadow-2xs'
                    }`}
                  >
                    <Boxes className={`w-3.5 h-3.5 shrink-0 ${logisticsSubTab === 'recepcion_compras' ? 'text-amber-300' : 'text-amber-600'}`} />
                    <span className="truncate">Recepción Compras</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold shrink-0 ${
                      logisticsSubTab === 'recepcion_compras' ? 'bg-amber-500/25 text-amber-200 border border-amber-400/30' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {(Number(productStats.ocsPendientes) || 0)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogisticsSubTab('traslados')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-all cursor-pointer ${
                      logisticsSubTab === 'traslados'
                        ? 'bg-[#001D3D] text-white shadow-sm font-black border border-[#001D3D]'
                        : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold border border-slate-200/70 shadow-2xs'
                    }`}
                  >
                    <ArrowLeftRight className={`w-3.5 h-3.5 shrink-0 ${logisticsSubTab === 'traslados' ? 'text-cyan-300' : 'text-cyan-600'}`} />
                    <span className="truncate">Traslados Inter-Sedes</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold shrink-0 ${
                      logisticsSubTab === 'traslados' ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/30' : 'bg-cyan-100 text-cyan-900'
                    }`}>
                      {trasladosStats.pendientesRecibo > 0 ? `${trasladosStats.pendientesRecibo} por recibir` : trasladosStats.total}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogisticsSubTab('despachos')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-all cursor-pointer ${
                      logisticsSubTab === 'despachos'
                        ? 'bg-[#001D3D] text-white shadow-sm font-black border border-[#001D3D]'
                        : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold border border-slate-200/70 shadow-2xs'
                    }`}
                  >
                    <Truck className={`w-3.5 h-3.5 shrink-0 ${logisticsSubTab === 'despachos' ? 'text-cyan-300' : 'text-slate-500'}`} />
                    <span className="truncate">Despachos & Pedidos</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold shrink-0 ${
                      logisticsSubTab === 'despachos' ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/30' : 'bg-slate-200/80 text-slate-700'
                    }`}>
                      {(Number(orderStats.total) || 0)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogisticsSubTab('kardex')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-all cursor-pointer col-span-2 sm:col-span-1 ${
                      logisticsSubTab === 'kardex'
                        ? 'bg-[#001D3D] text-white shadow-sm font-black border border-[#001D3D]'
                        : 'bg-slate-50/80 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold border border-slate-200/70 shadow-2xs'
                    }`}
                  >
                    <Clock className={`w-3.5 h-3.5 shrink-0 ${logisticsSubTab === 'kardex' ? 'text-cyan-300' : 'text-slate-500'}`} />
                    <span className="truncate">Historial Kardex</span>
                  </button>
                </div>
              </div>

              {/* =====================================================================
                  SUB-PESTAÑA 1: CATÁLOGO DE PRODUCTOS E INVENTARIO EN BODEGA
              ===================================================================== */}
              {logisticsSubTab === 'inventario' && (
                <div className="space-y-1.5 sm:space-y-2">
                  {/* Tarjetas Métricas de Inventario Compactas */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
                    {/* Tarjeta 1: Total Variantes SKU */}
                    <div 
                      onClick={() => {
                        setProductStatusFilter('todos');
                        setProductColorFilter('todos');
                        setProductSizeFilter('todos');
                        setProductLineaFilter('todos');
                      }}
                      className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-blue-800 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 truncate">Total Variantes SKU</span>
                        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-800 border border-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors shadow-2xs">
                          <Package className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number(productStats.totalRef) || 0)}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[9.5px] text-slate-500 font-medium truncate leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span className="truncate">Matriz color + tamaño en catálogo</span>
                      </div>
                    </div>

                    {/* Tarjeta 2: Stock Disponible */}
                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-cyan-500 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 truncate">Stock Disponible</span>
                        <div className="w-6 h-6 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <Boxes className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number(productStats.totalUnidades) || 0).toLocaleString()} <span className="text-[11px] font-bold text-slate-500">Unds</span>
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[9.5px] font-bold text-cyan-900 truncate leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                        <span className="truncate">
                          {selectedSede === 'todas'
                            ? 'Total consolidado nacional'
                            : `Existencias en ${SEDES_CEDI_CONFIG.find(s => s.id === selectedSede)?.nombre}`}
                        </span>
                      </div>
                    </div>

                    {/* Tarjeta 3: Órdenes de Compra */}
                    <div 
                      onClick={() => setLogisticsSubTab('recepcion_compras')}
                      className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-amber-500 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 truncate">Órdenes de Compra</span>
                        <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors shadow-2xs">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-amber-600 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number(productStats.ocsPendientes) || 0)}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[9.5px] text-amber-800 font-medium truncate leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="truncate">Por corroborar y recibir en bodega</span>
                      </div>
                    </div>

                    {/* Tarjeta 4: Alertas Stock Bajo */}
                    <div 
                      onClick={() => {
                        setProductStatusFilter(productStatusFilter === 'bajo_stock' ? 'todos' : 'bajo_stock');
                      }}
                      className={`p-2 sm:p-2.5 rounded-lg border-t-2 border-x border-b shadow-2xs cursor-pointer transition-all hover:shadow-xs ${
                        productStats.bajoStock > 0
                          ? 'bg-rose-50/50 border-t-rose-500 border-rose-200 hover:border-rose-300'
                          : 'bg-white border-t-emerald-500 border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-slate-500">
                        <span className={`text-[9.5px] font-black uppercase tracking-wider truncate ${productStats.bajoStock > 0 ? 'text-rose-900' : 'text-slate-500'}`}>
                          Alertas Stock Bajo
                        </span>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border shadow-2xs ${
                          productStats.bajoStock > 0 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className={`text-lg sm:text-xl font-black mt-0.5 block tracking-tight font-sans leading-none ${productStats.bajoStock > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                        {(Number(productStats.bajoStock) || 0)}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[9.5px] font-bold truncate leading-none">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${productStats.bajoStock > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <span className={`truncate ${productStats.bajoStock > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {productStats.bajoStock > 0 ? 'Filtrar alertas críticas' : 'Existencias óptimas'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Herramientas & Filtros de Matriz Compacta */}
                  <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-2 space-y-1.5">
                    {/* Fila Superior: Buscador y Botones de Acción */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5">
                      {/* Buscador de Producto / SKU */}
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          placeholder="Buscar por SKU (VIN-BLA-5GL), color, tamaño, producto o pasillo..."
                          className="w-full pl-8 pr-8 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all shadow-2xs h-8"
                        />
                        {productSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setProductSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Botones de Acción Compactos */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleOpenNewProductModal}
                          className="px-2.5 py-1 h-8 rounded-md bg-[#001D3D] hover:bg-[#002D5C] text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer whitespace-nowrap active:scale-[0.99]"
                        >
                          <Plus className="w-3.5 h-3.5 text-cyan-300" />
                          <span>+ Nuevo Producto / Variante</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExportCSV('inventario')}
                          className="px-2.5 py-1 h-8 rounded-md bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs hover:border-slate-300"
                          title="Exportar inventario a formato CSV"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Exportar CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Fila Inferior: Filtros de Matriz Estilizados y de Altura Mínima */}
                    <div className="bg-slate-50/80 px-2 py-1 rounded-md border border-slate-200/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1 leading-none">
                          <Filter className="w-2.5 h-2.5 text-cyan-600" />
                          <span>Filtros Rápidos de Matriz</span>
                        </span>
                        {(productLineaFilter !== 'todos' || productColorFilter !== 'todos' || productSizeFilter !== 'todos' || productCategoryFilter !== 'todos' || productStatusFilter !== 'todos') && (
                          <button
                            type="button"
                            onClick={() => {
                              setProductLineaFilter('todos');
                              setProductColorFilter('todos');
                              setProductSizeFilter('todos');
                              setProductCategoryFilter('todos');
                              setProductStatusFilter('todos');
                            }}
                            className="text-[9px] font-bold text-cyan-700 hover:text-cyan-800 hover:underline cursor-pointer flex items-center gap-1 leading-none"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Limpiar Filtros</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                        {/* 1. Línea */}
                        <div className="bg-white px-2 py-0.5 rounded border border-slate-200/90 shadow-2xs flex flex-col justify-center">
                          <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                            Línea Base:
                          </label>
                          <select
                            value={productLineaFilter}
                            onChange={(e) => setProductLineaFilter(e.target.value)}
                            className="w-full bg-transparent text-[10.5px] font-semibold text-slate-800 focus:outline-none cursor-pointer truncate leading-tight"
                          >
                            <option value="todos">Todas las Líneas ({uniqueLineas.length})</option>
                            {uniqueLineas.map((linea) => (
                              <option key={linea} value={linea}>{linea}</option>
                            ))}
                          </select>
                        </div>

                        {/* 2. Color */}
                        <div className="bg-white px-2 py-0.5 rounded border border-slate-200/90 shadow-2xs flex flex-col justify-center">
                          <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                            Tono / Color:
                          </label>
                          <select
                            value={productColorFilter}
                            onChange={(e) => setProductColorFilter(e.target.value)}
                            className="w-full bg-transparent text-[10.5px] font-semibold text-slate-800 focus:outline-none cursor-pointer truncate leading-tight"
                          >
                            <option value="todos">Todos los Colores ({uniqueColores.length})</option>
                            {uniqueColores.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        {/* 3. Tamaño */}
                        <div className="bg-white px-2 py-0.5 rounded border border-slate-200/90 shadow-2xs flex flex-col justify-center">
                          <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                            Presentación:
                          </label>
                          <select
                            value={productSizeFilter}
                            onChange={(e) => setProductSizeFilter(e.target.value)}
                            className="w-full bg-transparent text-[10.5px] font-semibold text-slate-800 focus:outline-none cursor-pointer truncate leading-tight"
                          >
                            <option value="todos">Todos los Tamaños ({uniqueTamanos.length})</option>
                            {uniqueTamanos.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>

                        {/* 4. Categoría */}
                        <div className="bg-white px-2 py-0.5 rounded border border-slate-200/90 shadow-2xs flex flex-col justify-center">
                          <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                            Categoría:
                          </label>
                          <select
                            value={productCategoryFilter}
                            onChange={(e) => setProductCategoryFilter(e.target.value)}
                            className="w-full bg-transparent text-[10.5px] font-semibold text-slate-800 focus:outline-none cursor-pointer truncate leading-tight"
                          >
                            <option value="todos">Todas las Categorías</option>
                            <option value="Pintura Interior">Pintura Interior</option>
                            <option value="Pintura Fachada">Pintura Fachada</option>
                            <option value="Esmaltes y Maderas">Esmaltes y Maderas</option>
                            <option value="Herramientas y Accesorios">Herramientas</option>
                            <option value="Especiales e Impermeabilizantes">Especiales & Pisos</option>
                          </select>
                        </div>

                        {/* 5. Estado */}
                        <div className="bg-white px-2 py-0.5 rounded border border-slate-200/90 shadow-2xs flex flex-col justify-center">
                          <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                            Nivel Existencias:
                          </label>
                          <select
                            value={productStatusFilter}
                            onChange={(e) => setProductStatusFilter(e.target.value as any)}
                            className="w-full bg-transparent text-[10.5px] font-semibold text-slate-800 focus:outline-none cursor-pointer truncate leading-tight"
                          >
                            <option value="todos">Todos los Estados</option>
                            <option value="activos">Sólo Activos</option>
                            <option value="inactivos">Sólo Inactivos</option>
                            <option value="bajo_stock">⚠️ Alerta Stock Bajo</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Productos e Inventario Optimizada en Espacio */}
                  <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-3 py-1.5 bg-gradient-to-r from-slate-900 to-[#001D3D] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-white/10 text-cyan-300 border border-white/20 flex items-center justify-center shrink-0">
                          <Boxes className="w-3 h-3" />
                        </div>
                        <div>
                          <h3 className="font-black text-[11.5px] uppercase tracking-wider text-white leading-tight">
                            Matriz de Inventario en Bodega — {selectedSede === 'todas' ? 'Consolidado Nacional' : SEDES_CEDI_CONFIG.find(s => s.id === selectedSede)?.nombre}
                          </h3>
                          <span className="text-[9.5px] text-cyan-200/80 font-medium leading-none">
                            Gestión técnica por código SKU, colorimetría y presentación en bodega
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white/15 text-white font-mono text-[9.5px] border border-white/20 self-start sm:self-auto leading-none">
                        Mostrando <strong className="text-cyan-300 font-bold">{filteredProducts.length}</strong> de {inventario.length} variantes
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black text-[9.5px] uppercase tracking-wider">
                            <th className="py-1.5 px-2.5">Código SKU</th>
                            <th className="py-1.5 px-2.5">Referencia / Producto Base</th>
                            <th className="py-1.5 px-2.5">Color / Tono</th>
                            <th className="py-1.5 px-2.5 text-center">Presentación / Tamaño</th>
                            <th className="py-1.5 px-2.5 text-right">Precio COP</th>
                            <th className="py-1.5 px-2.5 text-center">Stock Disponible (Unidades)</th>
                            <th className="py-1.5 px-2.5 text-center">Estado</th>
                            <th className="py-1.5 px-2.5 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredProducts.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-slate-400">
                                <Package className="w-5 h-5 mx-auto mb-1 opacity-50 text-slate-300" />
                                <p className="font-bold text-slate-600 text-xs">No se encontraron variantes con los criterios o en la sede especificada.</p>
                                <button
                                  type="button"
                                  onClick={handleOpenNewProductModal}
                                  className="mt-1 text-cyan-700 font-bold text-xs hover:underline cursor-pointer"
                                >
                                  + Crear nuevo producto o variante ahora
                                </button>
                              </td>
                            </tr>
                          ) : (
                            filteredProducts.map((item) => {
                              if (!item) return null;
                              const baseTitle = item.productoBaseNombre || (item.nombre ? item.nombre.split(' - ')[0] : '') || item.nombre || 'Producto';
                              const stockDisp = getStockEnSede(item, selectedSede);
                              const minStock = selectedSede === 'todas'
                                ? (item.stockMinimoUnidades || 10)
                                : Math.max(2, Math.round((item.stockMinimoUnidades || 10) * 0.3));
                              const isLow = stockDisp < minStock;

                              // Normalización de presentación legible
                              const rawPres = item.presentacion || item.medida || 'Galón';
                              let displayPres = rawPres;
                              if (rawPres.includes('5') || rawPres.toLowerCase().includes('cuñete')) {
                                displayPres = 'Cuñete 5 Gal';
                              } else if (rawPres.includes('1/4') || rawPres.toLowerCase().includes('cuarto')) {
                                displayPres = 'Cuarto 1/4 Gal';
                              } else if (rawPres.toLowerCase() === 'galón' || rawPres.toLowerCase() === 'galon') {
                                displayPres = 'Galón 1 GL';
                              }

                              return (
                                <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${!item.activo ? 'opacity-60 bg-slate-50/40' : ''}`}>
                                  {/* 1. Código SKU Autogenerado */}
                                  <td className="py-1 px-2.5 font-mono font-bold text-blue-950 whitespace-nowrap">
                                    <div className="flex items-center gap-1">
                                      <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200/90 text-blue-950 font-bold text-[10px] tracking-wide font-mono">
                                        {item.sku || 'PTC-BLA-5GL-1001'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard?.writeText(item.sku);
                                          setLogisticsFeedbackMessage(`SKU ${item.sku} copiado al portapapeles.`);
                                        }}
                                        className="p-0.5 rounded text-slate-400 hover:text-blue-900 hover:bg-blue-50 cursor-pointer transition-colors"
                                        title="Copiar Código SKU"
                                      >
                                        <Paperclip className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </td>

                                  {/* 2. Referencia / Producto Base */}
                                  <td className="py-1 px-2.5">
                                    <strong className="text-slate-900 block font-bold text-[11.5px] leading-tight truncate max-w-[280px]">
                                      {baseTitle}
                                    </strong>
                                    <span className="text-[9px] text-slate-500 font-medium leading-none block">{item.categoria || 'Pintura Interior'}</span>
                                  </td>

                                  {/* 3. Color / Tono */}
                                  <td className="py-1 px-2.5 whitespace-nowrap">
                                    {item.color ? (
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className="w-2.5 h-2.5 rounded-full border border-black/20 shadow-2xs shrink-0"
                                          style={{ backgroundColor: item.colorHex || '#CBD5E1' }}
                                        />
                                        <span className="text-[11px] font-semibold text-slate-800">{item.color}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[9.5px] text-slate-400 font-medium">Estándar / N/A</span>
                                    )}
                                  </td>

                                  {/* 4. Presentación / Tamaño */}
                                  <td className="py-1 px-2.5 text-center whitespace-nowrap">
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200/80">
                                      {displayPres}
                                    </span>
                                  </td>

                                  {/* 5. Precio COP */}
                                  <td className="py-1 px-2.5 text-right font-bold text-slate-900 whitespace-nowrap font-mono text-[11px]">
                                    ${(item.precioVentaGL || 84900).toLocaleString('es-CO')}
                                  </td>

                                  {/* 6. Stock Disponible (Unidades) - Unificada sin duplicidad */}
                                  <td className="py-1 px-2.5 text-center whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1">
                                      <span className={`px-1.5 py-0.2 rounded font-bold text-[10.5px] font-mono border ${
                                        isLow
                                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      }`}>
                                        {stockDisp.toLocaleString()} Unds
                                      </span>
                                      {isLow && (
                                        <span className="text-[8px] text-rose-600 font-black uppercase tracking-tight">
                                          ⚠️ Bajo
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* 7. Estado */}
                                  <td className="py-1 px-2.5 text-center whitespace-nowrap">
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                      item.activo
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                                    }`}>
                                      {item.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                  </td>

                                  {/* 8. Acciones */}
                                  <td className="py-1 px-2.5 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1">
                                      {/* Botón Editar Producto */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditProductModal(item)}
                                        className="p-1 rounded bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-900 border border-slate-200/80 transition-all cursor-pointer shadow-2xs"
                                        title="Editar ficha de la variante"
                                      >
                                        <Edit3 className="w-2.5 h-2.5" />
                                      </button>

                                      {/* Botón Movimiento Stock */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedStockItem(item);
                                          setIsStockMovementModalOpen(true);
                                        }}
                                        className="px-1.5 py-0.5 rounded bg-[#001D3D] hover:bg-[#002D5C] text-white font-bold text-[9px] shadow-2xs transition-all cursor-pointer"
                                        title="Registrar entrada, salida o ajuste en unidades"
                                      >
                                        Stock
                                      </button>

                                      {/* Botón Desactivar / Eliminar */}
                                      {item.activo ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenActionModal(item, 'desactivar')}
                                          className="p-1 rounded bg-slate-50 hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-slate-200/80 transition-all cursor-pointer shadow-2xs"
                                          title="Desactivar variante"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenActionModal(item, 'activar')}
                                          className="p-1 rounded bg-slate-50 hover:bg-emerald-50 text-slate-500 hover:text-emerald-800 border border-slate-200/80 transition-all cursor-pointer shadow-2xs"
                                          title="Reactivar variante"
                                        >
                                          <Check className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* =====================================================================
                  SUB-PESTAÑA 2: RECEPCIÓN DE ÓRDENES DE COMPRA (COMPRAS VS. LOGÍSTICA)
              ===================================================================== */}
              {logisticsSubTab === 'recepcion_compras' && (
                <div className="space-y-1.5 sm:space-y-2">
                  {/* Tarjetas Métricas de Recepción Compactas */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-blue-800 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 truncate">Órdenes de Compra</span>
                        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-800 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number((ordenesCompra || []).filter((oc) => selectedSede === 'todas' || oc.sedeDestinoId === selectedSede).length) || 0)}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[9.5px] text-slate-500 font-medium truncate leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span className="truncate">
                          {selectedSede === 'todas' ? 'Consolidado nacional' : `Destino ${SEDES_CEDI_CONFIG.find(s => s.id === selectedSede)?.nombre}`}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-amber-500 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 truncate">Pendientes Recibo Físico</span>
                        <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-amber-600 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number((ordenesCompra || []).filter((oc) => {
                          const matchSede = selectedSede === 'todas' || oc.sedeDestinoId === selectedSede;
                          return matchSede && (oc.estado === 'Pendiente Recibo' || oc.estado === 'Recibido Parcial');
                        }).length) || 0)}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[9.5px] text-amber-800 font-medium truncate leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="truncate">En muelle de descarga</span>
                      </div>
                    </div>

                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-emerald-500 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 truncate">Recibidas Conformes</span>
                        <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number((ordenesCompra || []).filter((oc) => {
                          const matchSede = selectedSede === 'todas' || oc.sedeDestinoId === selectedSede;
                          return matchSede && oc.estado === 'Recibido Conforme';
                        }).length) || 0)}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[9.5px] text-emerald-800 font-medium truncate leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="truncate">En stock y Kardex verificado</span>
                      </div>
                    </div>

                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-cyan-500 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 truncate">Unidades por Recibir</span>
                        <div className="w-6 h-6 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <Boxes className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number((ordenesCompra || [])
                          .filter((oc) => {
                            const matchSede = selectedSede === 'todas' || oc.sedeDestinoId === selectedSede;
                            return matchSede && oc.estado !== 'Recibido Conforme';
                          })
                          .reduce((acc, oc) => {
                            const units = Number(oc.totalUnidades) || (Array.isArray(oc.items) ? oc.items.reduce((s: number, it: any) => s + (Number(it.cantidadEsperada) || 0), 0) : 0);
                            return acc + (Number(units) || 0);
                          }, 0)) || 0).toLocaleString()} <span className="text-[11px] font-bold text-slate-500">Unds</span>
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[9.5px] text-cyan-900 font-bold truncate leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                        <span className="truncate">Envases según facturas de compra</span>
                      </div>
                    </div>
                  </div>

                  {/* Banner Explicativo de Corroboración Compacto */}
                  <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 border border-amber-200/90 flex flex-col md:flex-row md:items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white shadow-2xs flex items-center justify-center shrink-0">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 tracking-tight leading-none">
                          📦 Muelle de Recepción e Inspección Física de Mercancía
                        </h4>
                        <p className="text-[10.5px] text-slate-600 mt-0.5 leading-snug">
                          Al arribar el envío de Compras o Planta Pintuco, el personal de Bodega debe corroborar físicamente la mercancía: contar las unidades reales recibidas de cada variante, ingresar la fecha y el <strong>Número de Lote de Fabricación</strong>. Al confirmar, el stock del CEDI seleccionado y el Kardex se actualizan de forma automática.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Filtros de Órdenes de Compra Compactos */}
                  <div className="p-2 bg-white rounded-lg border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={ocSearchQuery}
                        onChange={(e) => setOcSearchQuery(e.target.value)}
                        placeholder="Buscar por N° OC, Factura, Proveedor..."
                        className="w-full pl-8 pr-3 py-1 h-8 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all shadow-2xs"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <label className="text-[10.5px] font-bold text-slate-500 shrink-0">Estado:</label>
                      <select
                        value={ocStatusFilter}
                        onChange={(e) => setOcStatusFilter(e.target.value)}
                        className="py-1 px-2.5 h-8 rounded-md bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white cursor-pointer transition-all shadow-2xs"
                      >
                        <option value="todos">Todas las Órdenes</option>
                        <option value="Pendiente Recibo">⏳ Pendientes de Recibo</option>
                        <option value="Recibido Parcial">⚠️ Recibido Parcial</option>
                        <option value="Recibido Conforme">✅ Recibido Conforme</option>
                      </select>
                    </div>
                  </div>

                  {/* Tabla de Órdenes de Compra y Facturas de Proveedor */}
                  <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-3 py-1.5 bg-gradient-to-r from-slate-900 to-[#001D3D] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-white/10 text-cyan-300 border border-white/20 flex items-center justify-center shrink-0">
                          <Boxes className="w-3 h-3" />
                        </div>
                        <div>
                          <h3 className="font-black text-[11.5px] uppercase tracking-wider text-white leading-tight">
                            Órdenes de Compra & Facturas de Proveedores — {selectedSede === 'todas' ? 'Todas las Sedes' : SEDES_CEDI_CONFIG.find(s => s.id === selectedSede)?.nombre}
                          </h3>
                          <span className="text-[9.5px] text-cyan-200/80 font-medium leading-none">
                            Control de arribo de camiones desde fábrica y auditoría de lotes
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white/15 text-white font-mono text-[9.5px] border border-white/20 self-start sm:self-auto leading-none">
                        Mostrando {(ordenesCompra || []).filter((oc) => {
                          const matchSede = selectedSede === 'todas' || oc.sedeDestinoId === selectedSede;
                          const matchStatus = ocStatusFilter === 'todos' || oc.estado === ocStatusFilter;
                          const q = ocSearchQuery.toLowerCase();
                          const matchQ = !q || oc.numeroOC.toLowerCase().includes(q) || oc.numeroFacturaProveedor.toLowerCase().includes(q) || oc.proveedor.toLowerCase().includes(q);
                          return matchSede && matchStatus && matchQ;
                        }).length} órdenes
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black text-[9.5px] uppercase tracking-wider">
                            <th className="py-1.5 px-2.5">N° Orden Compra</th>
                            <th className="py-1.5 px-2.5">Proveedor Oficial</th>
                            <th className="py-1.5 px-2.5">N° Factura / Remisión</th>
                            <th className="py-1.5 px-2.5">Sede CEDI Destino</th>
                            <th className="py-1.5 px-2.5">Fecha Envío</th>
                            <th className="py-1.5 px-2.5">Variantes & Cantidades</th>
                            <th className="py-1.5 px-2.5 text-center">Unidades Facturadas</th>
                            <th className="py-1.5 px-2.5 text-center">Estado Recepción</th>
                            <th className="py-1.5 px-2.5 text-right">Acción Operativa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const filteredOCs = (ordenesCompra || []).filter((oc) => {
                              const matchSede = selectedSede === 'todas' || oc.sedeDestinoId === selectedSede;
                              const matchStatus = ocStatusFilter === 'todos' || oc.estado === ocStatusFilter;
                              const q = ocSearchQuery.toLowerCase();
                              const matchQ = !q || oc.numeroOC.toLowerCase().includes(q) || oc.numeroFacturaProveedor.toLowerCase().includes(q) || oc.proveedor.toLowerCase().includes(q);
                              return matchSede && matchStatus && matchQ;
                            });

                            if (filteredOCs.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={9} className="py-6 text-center text-slate-400">
                                    <Boxes className="w-6 h-6 mx-auto mb-1 opacity-50 text-slate-300" />
                                    <p className="font-bold text-slate-600 text-xs">No se encontraron órdenes de compra para los filtros seleccionados.</p>
                                  </td>
                                </tr>
                              );
                            }

                            return filteredOCs.map((oc) => {
                              const isRecibido = oc.estado === 'Recibido Conforme';
                              const isParcial = oc.estado === 'Recibido Parcial';

                              return (
                                <tr key={oc.id} className="hover:bg-slate-50/80 transition-colors">
                                  {/* 1. N° Orden Compra */}
                                  <td className="py-1 px-2.5 whitespace-nowrap">
                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-blue-950 font-bold text-[10px] font-mono">
                                      {oc.numeroOC}
                                    </span>
                                  </td>

                                  {/* 2. Proveedor */}
                                  <td className="py-1 px-2.5">
                                    <strong className="text-slate-900 block font-bold text-[11.5px] leading-tight">
                                      {oc.proveedor}
                                    </strong>
                                    <span className="text-[9px] text-slate-500 font-medium leading-none block">Planta / Proveedor Homologado</span>
                                  </td>

                                  {/* 3. Factura / Remisión */}
                                  <td className="py-1 px-2.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200/80 text-[10.5px]">
                                      {oc.numeroFacturaProveedor}
                                    </span>
                                  </td>

                                  {/* 4. Sede CEDI Destino */}
                                  <td className="py-1 px-2.5 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-cyan-50 text-cyan-900 border border-cyan-200/80">
                                      <MapPin className="w-2.5 h-2.5 text-cyan-600" />
                                      {oc.sedeDestinoNombre}
                                    </span>
                                  </td>

                                  {/* 5. Fecha Envío */}
                                  <td className="py-1 px-2.5 text-slate-600 font-mono text-[10.5px] whitespace-nowrap">
                                    {oc.fechaEnvio}
                                  </td>

                                  {/* 6. Variantes y Cantidades */}
                                  <td className="py-1 px-2.5">
                                    <div className="space-y-0.5 max-w-xs">
                                      {oc.items.map((it, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-[10.5px] gap-2">
                                          <span className="truncate text-slate-700 font-medium">
                                            {it.productoNombre} ({it.presentacion})
                                          </span>
                                          <span className="font-mono font-bold text-slate-900 shrink-0">
                                            {it.cantidadEsperada} unds
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>

                                  {/* 7. Total Unidades */}
                                  <td className="py-1 px-2.5 text-center font-mono font-bold text-slate-900 whitespace-nowrap">
                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200/80 text-[11px]">
                                      {oc.totalUnidades} Unds
                                    </span>
                                  </td>

                                  {/* 8. Estado Recepción */}
                                  <td className="py-1 px-2.5 text-center whitespace-nowrap">
                                    <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border ${
                                      isRecibido
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : isParcial
                                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                                        : 'bg-rose-50 text-rose-800 border-rose-300'
                                    }`}>
                                      {isRecibido ? '✅ Recibido Conforme' : isParcial ? '⚠️ Recibido Parcial' : '⏳ Pendiente Recibo'}
                                    </span>
                                    {oc.loteGeneral && (
                                      <div className="text-[8.5px] font-mono text-slate-500 font-bold mt-0.5">
                                        Lote: {oc.loteGeneral}
                                      </div>
                                    )}
                                  </td>

                                  {/* 9. Acción Operativa */}
                                  <td className="py-1 px-2.5 text-right whitespace-nowrap">
                                    {!isRecibido ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRecepcionModal(oc)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs cursor-pointer transition-all active:scale-[0.99]"
                                      >
                                        <Boxes className="w-3 h-3" />
                                        <span>Corroborar & Recibir</span>
                                      </button>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <span className="text-[9.5px] text-emerald-700 font-bold">
                                          Auditado {oc.fechaRecepcion}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenActaModal(oc)}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-[#001D3D] font-bold text-[11px] border border-blue-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                                          title="Ver Acta Oficial de Recepción Inmutable"
                                        >
                                          <FileText className="w-3 h-3 text-blue-900" />
                                          <span>Ver Acta</span>
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* =====================================================================
                  SUB-PESTAÑA 3: TRASLADOS INTER-SEDES (REMISIONES BODEGA A BODEGA)
              ===================================================================== */}
              {logisticsSubTab === 'traslados' && (
                <div className="space-y-1.5 sm:space-y-2">
                  {/* Tarjetas Métricas de Traslados Compactas */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
                    {/* Tarjeta 1: Total Remisiones */}
                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-blue-800 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 truncate">Total Remisiones</span>
                        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-800 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number(trasladosStats.total) || 0)}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[9.5px] text-slate-500 font-medium truncate leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span className="truncate">
                          {selectedSede === 'todas' ? 'Consolidado nacional' : `Filtrado por sede activa`}
                        </span>
                      </div>
                    </div>

                    {/* Tarjeta 2: En Tránsito Nacional */}
                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-cyan-500 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-cyan-900 truncate">En Tránsito Nacional</span>
                        <div className="w-6 h-6 rounded-md bg-cyan-50 text-cyan-800 border border-cyan-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <Truck className="w-3.5 h-3.5 text-cyan-700" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-cyan-600 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number(trasladosStats.enTransitoTotal) || 0)}
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[9.5px] text-cyan-800 font-medium truncate leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                        <span className="truncate">En flota o transportadora</span>
                      </div>
                    </div>

                    {/* Tarjeta 3: Por Recibir en Esta Sede */}
                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-amber-500 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-900 truncate">Por Recibir en Sede</span>
                        <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <Boxes className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-lg sm:text-xl font-black text-amber-600 tracking-tight font-sans leading-none">
                          {(Number(trasladosStats.pendientesRecibo) || 0)}
                        </span>
                        {trasladosStats.pendientesRecibo > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-900 animate-pulse">
                            En espera
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[9.5px] text-amber-800 font-medium truncate leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="truncate">
                          {selectedSede === 'todas' ? 'Pendientes en alguna sede' : `Por arribar a ${SEDES_CEDI_CONFIG.find(s => s.id === selectedSede)?.nombre}`}
                        </span>
                      </div>
                    </div>

                    {/* Tarjeta 4: Unidades en Tránsito */}
                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-blue-900 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-blue-900 truncate">Unidades en Tránsito</span>
                        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <Package className="w-3.5 h-3.5 text-blue-900" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-blue-950 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number(trasladosStats.unidadesEnTransito) || 0).toLocaleString()} <span className="text-[11px] font-bold text-slate-500">Unds</span>
                      </span>
                      <div className="flex items-center gap-1 mt-1 text-[9.5px] text-slate-500 font-medium truncate leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-900 shrink-0" />
                        <span className="truncate">Envases en movimiento entre bodegas</span>
                      </div>
                    </div>
                  </div>

                  {/* Banner Explicativo de Traslados Inter-Sedes Compacto */}
                  <div className="p-2 sm:p-2.5 rounded-lg bg-gradient-to-r from-cyan-50/80 via-white to-cyan-50/40 border border-cyan-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white shadow-2xs flex items-center justify-center shrink-0">
                        <ArrowLeftRight className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 tracking-tight leading-none">
                          🚚 Logística de Traslados Inter-Sedes (Remisiones Internas CEDI)
                        </h4>
                        <p className="text-[10.5px] text-slate-600 mt-0.5 leading-snug">
                          Al despachar un traslado entre sedes (ej. CEDI Rionegro hacia CEDI Bogotá), el sistema <strong>descuenta automáticamente el stock de la Sede Origen</strong> y asienta la salida en su Kardex. En la Sede Destino, la remisión queda en estado <em>En Tránsito</em> para ser recibida físicamente, <strong>incrementando de inmediato el stock disponible</strong> en destino.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNuevoTrasladoModalOpen(true)}
                      className="px-3 py-1.5 h-8 rounded-md bg-[#001D3D] hover:bg-[#002D5C] text-white font-bold text-xs shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-all active:scale-[0.99] whitespace-nowrap self-start md:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5 text-cyan-300" />
                      <span>Nuevo Traslado Inter-Sedes</span>
                    </button>
                  </div>

                  {/* Barra de Filtros y Búsqueda Compacta */}
                  <div className="bg-white p-2 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={trasladoSearchQuery}
                        onChange={(e) => setTrasladoSearchQuery(e.target.value)}
                        placeholder="Buscar por remisión (REM-TR-0041), sede origen, destino, transportadora o guía..."
                        className="w-full pl-8 pr-4 py-1 h-8 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all shadow-2xs"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={trasladoStatusFilter}
                        onChange={(e) => setTrasladoStatusFilter(e.target.value)}
                        className="py-1 px-2.5 h-8 rounded-md bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white cursor-pointer transition-all shadow-2xs"
                      >
                        <option value="todos">Todos los Estados</option>
                        <option value="En Tránsito">🚚 En Tránsito</option>
                        <option value="Recibido Conforme">✅ Recibido Conforme</option>
                        <option value="Recibido Parcial">⚠️ Recibido Parcial</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => setIsNuevoTrasladoModalOpen(true)}
                        className="px-2.5 py-1 h-8 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-2xs cursor-pointer flex items-center gap-1 transition-all active:scale-[0.99] whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Despachar</span>
                      </button>
                    </div>
                  </div>

                  {/* Tabla de Remisiones / Traslados */}
                  <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-3 py-1.5 bg-gradient-to-r from-slate-900 to-[#001D3D] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-white/10 text-cyan-300 border border-white/20 flex items-center justify-center shrink-0">
                          <ArrowLeftRight className="w-3 h-3" />
                        </div>
                        <div>
                          <h3 className="font-black text-[11.5px] uppercase tracking-wider text-white leading-tight">
                            Bitácora de Remisiones y Traslados entre Bodegas CEDI
                          </h3>
                          <span className="text-[9.5px] text-cyan-200/80 font-medium leading-none">
                            Flujo de reabastecimiento inter-bodegas nacional con trazabilidad en Kardex
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white/15 text-white font-mono text-[9.5px] border border-white/20 self-start sm:self-auto leading-none">
                        Total: {traslados.length} traslados
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black text-[9.5px] uppercase tracking-wider">
                            <th className="py-1.5 px-2.5 whitespace-nowrap">N° Remisión</th>
                            <th className="py-1.5 px-2.5 whitespace-nowrap">Sede Origen</th>
                            <th className="py-1.5 px-2.5 whitespace-nowrap">Sede Destino</th>
                            <th className="py-1.5 px-2.5 whitespace-nowrap">Fechas</th>
                            <th className="py-1.5 px-2.5">Variantes a Trasladar</th>
                            <th className="py-1.5 px-2.5 text-center whitespace-nowrap">Total Unds</th>
                            <th className="py-1.5 px-2.5 whitespace-nowrap">Transporte / Guía</th>
                            <th className="py-1.5 px-2.5 text-center whitespace-nowrap">Estado</th>
                            <th className="py-1.5 px-2.5 text-right whitespace-nowrap">Acción Operativa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            const filteredTraslados = (traslados || []).filter((tr) => {
                              if (!tr) return false;
                              const matchSede =
                                selectedSede === 'todas' ||
                                tr.sedeOrigenId === selectedSede ||
                                tr.sedeDestinoId === selectedSede;
                              const matchStatus =
                                trasladoStatusFilter === 'todos' || tr.estado === trasladoStatusFilter;
                              const q = trasladoSearchQuery.toLowerCase();
                              const matchQ =
                                !q ||
                                tr.numeroRemision.toLowerCase().includes(q) ||
                                tr.sedeOrigenNombre.toLowerCase().includes(q) ||
                                tr.sedeDestinoNombre.toLowerCase().includes(q) ||
                                (tr.transportadora || '').toLowerCase().includes(q) ||
                                (tr.numeroGuia || '').toLowerCase().includes(q);
                              return matchSede && matchStatus && matchQ;
                            });

                            if (filteredTraslados.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={9} className="py-6 text-center text-slate-400">
                                    <ArrowLeftRight className="w-6 h-6 mx-auto mb-1 opacity-50 text-slate-300" />
                                    <p className="font-bold text-slate-600 text-xs">No se encontraron traslados para los filtros seleccionados.</p>
                                  </td>
                                </tr>
                              );
                            }

                            return filteredTraslados.map((tr) => {
                              const isTransito = tr.estado === 'En Tránsito';
                              const isRecibido = tr.estado === 'Recibido Conforme';
                              const isParcial = tr.estado === 'Recibido Parcial';

                              return (
                                <tr key={tr.id} className="hover:bg-slate-50/80 transition-colors">
                                  {/* 1. N° Remisión */}
                                  <td className="py-1 px-2.5 whitespace-nowrap">
                                    <span className="px-1.5 py-0.2 rounded bg-cyan-50 border border-cyan-200 text-cyan-950 font-bold text-[10px] font-mono">
                                      {tr.numeroRemision}
                                    </span>
                                  </td>

                                  {/* 2. Sede Origen */}
                                  <td className="py-1 px-2.5 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                                      📤 {tr.sedeOrigenNombre}
                                    </span>
                                  </td>

                                  {/* 3. Sede Destino */}
                                  <td className="py-1 px-2.5 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-blue-50 text-blue-900 border border-blue-200/80">
                                      📥 {tr.sedeDestinoNombre}
                                    </span>
                                  </td>

                                  {/* 4. Fechas */}
                                  <td className="py-1 px-2.5 text-[10.5px] whitespace-nowrap">
                                    <div className="font-bold text-slate-800 leading-tight">
                                      Despacho: {tr.fechaDespacho}
                                    </div>
                                    <div className="text-slate-500 font-medium leading-none mt-0.5">
                                      Llegada: {tr.fechaEstimadaLlegada}
                                    </div>
                                  </td>

                                  {/* 5. Variantes / Items */}
                                  <td className="py-1 px-2.5">
                                    <div className="space-y-0.5 max-w-xs">
                                      {tr.items.map((it) => (
                                        <div key={it.id || it.sku} className="text-[10.5px] flex items-center justify-between gap-2">
                                          <span className="font-mono font-bold text-slate-900 truncate">
                                            {it.sku}
                                          </span>
                                          <span className="font-bold text-cyan-900 shrink-0 bg-cyan-50 border border-cyan-200/60 px-1 py-0.2 rounded text-[9.5px]">
                                            {it.cantidadEnviada} {it.presentacion || 'Unds'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>

                                  {/* 6. Total Unidades */}
                                  <td className="py-1 px-2.5 text-center whitespace-nowrap">
                                    <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200/80 font-mono font-bold text-[10.5px] text-slate-900">
                                      {(Number(tr.totalUnidades) || tr.items.reduce((a, b) => a + (Number(b.cantidadEnviada) || 0), 0))} Unds
                                    </span>
                                  </td>

                                  {/* 7. Transporte & Guía */}
                                  <td className="py-1 px-2.5 whitespace-nowrap text-[10.5px]">
                                    <div className="font-bold text-slate-800 leading-tight">
                                      {tr.transportadora || 'Flota Propia'}
                                    </div>
                                    {tr.numeroGuia && (
                                      <div className="font-mono text-cyan-700 font-bold text-[9.5px] leading-none mt-0.5">
                                        Guía: {tr.numeroGuia}
                                      </div>
                                    )}
                                  </td>

                                  {/* 8. Estado */}
                                  <td className="py-1 px-2.5 text-center whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold border ${
                                      isRecibido
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : isParcial
                                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                                        : 'bg-cyan-50 text-cyan-900 border-cyan-300'
                                    }`}>
                                      {isRecibido && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
                                      {isTransito && <Truck className="w-2.5 h-2.5 text-cyan-600 animate-pulse" />}
                                      <span>{tr.estado}</span>
                                    </span>
                                  </td>

                                  {/* 9. Acción Operativa */}
                                  <td className="py-1 px-2.5 text-right whitespace-nowrap">
                                    {isTransito ? (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRecepcionTrasladoModal(tr)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs cursor-pointer transition-all active:scale-[0.99]"
                                      >
                                        <Boxes className="w-3 h-3" />
                                        <span>Recibir en Sede</span>
                                      </button>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <span className="text-[9.5px] text-emerald-700 font-bold">
                                          Recibido {tr.fechaRecepcion || ''}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenRecepcionTrasladoModal(tr)}
                                          className="text-xs text-blue-900 font-bold hover:underline cursor-pointer"
                                        >
                                          Ver Acta
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* =====================================================================
                  SUB-PESTAÑA 2: DESPACHOS Y ACTUALIZACIÓN DE PEDIDOS (CLIENTE)
              ===================================================================== */}
              {logisticsSubTab === 'despachos' && (
                <div className="space-y-1.5 sm:space-y-2">
                  {/* Tarjetas Métricas de Pedidos Compactas */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-slate-800 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 truncate">Total Pedidos</span>
                        <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block tracking-tight font-sans leading-none">{(Number(orderStats.total) || 0)}</span>
                      <span className="text-[9.5px] text-slate-400 font-medium truncate block mt-1 leading-none">En base de datos</span>
                    </div>

                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-amber-500 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-amber-700">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-900 truncate">En Preparación</span>
                        <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-amber-600 mt-0.5 block tracking-tight font-sans leading-none">{(Number(orderStats.enPrep) || 0)}</span>
                      <span className="text-[9.5px] text-amber-700 font-medium truncate block mt-1 leading-none">Alistamiento CEDI</span>
                    </div>

                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-blue-700 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-blue-700">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-blue-900 truncate">Despachados</span>
                        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <Boxes className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-blue-600 mt-0.5 block tracking-tight font-sans leading-none">{(Number(orderStats.despachados) || 0)}</span>
                      <span className="text-[9.5px] text-blue-700 font-medium truncate block mt-1 leading-none">Remitidos a transporte</span>
                    </div>

                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-purple-600 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-purple-700">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-purple-900 truncate">En Tránsito</span>
                        <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <Truck className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-purple-600 mt-0.5 block tracking-tight font-sans leading-none">{(Number(orderStats.transito) || 0)}</span>
                      <span className="text-[9.5px] text-purple-700 font-medium truncate block mt-1 leading-none">Ruta nacional a obra</span>
                    </div>

                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-emerald-600 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-emerald-700">
                        <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-900 truncate">Entregados</span>
                        <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5 block tracking-tight font-sans leading-none">{(Number(orderStats.entregados) || 0)}</span>
                      <span className="text-[9.5px] text-emerald-700 font-medium truncate block mt-1 leading-none">Cumplidos a satisfacción</span>
                    </div>
                  </div>

                  {/* Barra de Filtros y Búsqueda de Pedidos Compacta */}
                  <div className="bg-white p-2 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
                    <div className="flex flex-1 items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          placeholder="Buscar por # Orden, cliente, cédula/NIT, ciudad o producto..."
                          className="w-full pl-8 pr-4 py-1 h-8 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all shadow-2xs"
                        />
                      </div>

                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="py-1 px-2.5 h-8 rounded-md bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 text-xs font-bold text-slate-800 focus:outline-none focus:bg-white cursor-pointer transition-all shadow-2xs"
                      >
                        <option value="todos">Todos los Estados</option>
                        <option value="preparaci">En Preparación / Alistamiento</option>
                        <option value="despachad">Despachado</option>
                        <option value="tránsito">En Tránsito</option>
                        <option value="entregad">Entregado</option>
                        <option value="cotiz">Cotizado</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleExportCSV('despachos')}
                        className="px-2.5 py-1 h-8 rounded-md bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs hover:shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Exportar Despachos CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Tabla de Despachos y Pedidos */}
                  <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-3 py-1.5 bg-gradient-to-r from-slate-900 to-[#001D3D] text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-white/10 text-cyan-300 border border-white/20 flex items-center justify-center shrink-0">
                          <Truck className="w-3 h-3" />
                        </div>
                        <div>
                          <h3 className="font-black text-[11.5px] uppercase tracking-wider text-white leading-tight">
                            Consola de Despachos y Envíos Nacionales
                          </h3>
                          <span className="text-[9.5px] text-cyan-200/80 font-medium leading-none">
                            Trazabilidad logística de órdenes de clientes y despacho a obra
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white/15 text-white font-mono text-[9.5px] border border-white/20 leading-none">
                        Mostrando <strong className="text-cyan-300 font-bold">{filteredOrders.length}</strong> órdenes
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black text-[9.5px] uppercase tracking-wider">
                            <th className="py-1.5 px-2.5 whitespace-nowrap"># Orden / Fecha</th>
                            <th className="py-1.5 px-2.5">Cliente / Contacto</th>
                            <th className="py-1.5 px-2.5">Destino / Ciudad</th>
                            <th className="py-1.5 px-2.5">Detalle Obra / Pintura</th>
                            <th className="py-1.5 px-2.5 text-right whitespace-nowrap">Valor Total</th>
                            <th className="py-1.5 px-2.5 text-center whitespace-nowrap">Estado de Despacho</th>
                            <th className="py-1.5 px-2.5 whitespace-nowrap">Guía & Transporte</th>
                            <th className="py-1.5 px-2.5 text-right whitespace-nowrap">Actualización</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredOrders.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-6 text-center text-slate-400">
                                <Truck className="w-6 h-6 mx-auto mb-1 opacity-50 text-slate-300" />
                                <p className="font-bold text-slate-600 text-xs">No se encontraron pedidos con los filtros aplicados.</p>
                              </td>
                            </tr>
                          ) : (
                            filteredOrders.map((ord) => {
                              const normState = (ord.estado || '').toLowerCase();
                              const isEnPrep = normState.includes('preparaci') || normState.includes('alistamiento') || normState.includes('bodega');
                              const isDespachado = normState.includes('despachad');
                              const isTransito = normState.includes('tránsito') || normState.includes('transito');
                              const isEntregado = normState.includes('entregad');

                              const badgeColor = isEntregado
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : isTransito
                                ? 'bg-purple-50 text-purple-800 border-purple-300'
                                : isDespachado
                                ? 'bg-blue-50 text-blue-900 border-blue-300'
                                : isEnPrep
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300';

                              const fechaDisplay = ord.fechaCreacion
                                ? ord.fechaCreacion.split('T')[0]
                                : 'Reciente';

                              return (
                                <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-1 px-2.5 whitespace-nowrap">
                                    <strong className="font-mono text-[11px] font-bold text-blue-950 block">
                                      {ord.numeroOrden}
                                    </strong>
                                    <span className="text-[9px] text-slate-400 font-medium leading-none block mt-0.5">{fechaDisplay}</span>
                                  </td>

                                  <td className="py-1 px-2.5">
                                    <strong className="text-slate-900 font-bold block text-[11.5px] leading-tight">
                                      {ord.form?.nombre_razon_social || ord.customerName || 'Cliente Pintuco'}
                                    </strong>
                                    <span className="text-[9.5px] text-slate-500 font-medium leading-none block mt-0.5">
                                      Doc: {ord.form?.documento || ord.customerDocument || 'N/A'} • Tel: {ord.form?.responsable_contacto || ord.customerPhone || 'N/A'}
                                    </span>
                                  </td>

                                  <td className="py-1 px-2.5">
                                    <span className="font-bold text-slate-800 block text-[11px] leading-tight">
                                      {ord.form?.ciudad || ord.ciudadEntrega || 'Medellín'}
                                    </span>
                                    <span className="text-[9.5px] text-slate-500 truncate max-w-[180px] block font-medium leading-none mt-0.5">
                                      {ord.form?.direccion_obra || ord.direccionEntrega || 'Dirección CEDI'}
                                    </span>
                                  </td>

                                  <td className="py-1 px-2.5">
                                    <strong className="text-slate-900 block font-semibold text-[11px] leading-tight">
                                      {ord.form?.producto_deseado || 'Pinturas y Vinilos Pintuco'}
                                    </strong>
                                    <span className="text-[9.5px] text-cyan-800 font-bold leading-none block mt-0.5">
                                      {ord.form?.area_m2 ? `${ord.form.area_m2} m² calculados` : 'Pedido tienda online'}
                                    </span>
                                  </td>

                                  <td className="py-1 px-2.5 text-right font-black text-slate-900 whitespace-nowrap font-mono text-[11px]">
                                    ${(ord.calculo?.costo_total_estimado || ord.total || 149900).toLocaleString('es-CO')}
                                  </td>

                                  <td className="py-1 px-2.5 text-center whitespace-nowrap">
                                    <span className={`inline-block px-1.5 py-0.2 rounded text-[9.5px] font-bold border ${badgeColor}`}>
                                      {ord.estado || 'Cotizado'}
                                    </span>
                                  </td>

                                  <td className="py-1 px-2.5 whitespace-nowrap">
                                    <span className="font-mono text-[10.5px] font-bold text-slate-800 block leading-tight">
                                      {ord.guiaDespacho || 'S/N Asignada'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-medium leading-none block mt-0.5">Coordinadora / Envía</span>
                                  </td>

                                  <td className="py-1 px-2.5 text-right whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-1">
                                      {/* Botón Cambiar Estado */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenChangeOrderStatusModal(ord)}
                                        className="px-2 py-0.5 rounded-md bg-[#001D3D] hover:bg-[#002D5C] text-white font-bold text-[10.5px] shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-[0.99]"
                                        title="Cambiar estado de orden y notificar al cliente"
                                      >
                                        <Truck className="w-3 h-3 text-cyan-300" />
                                        <span>Cambiar Estado</span>
                                      </button>

                                      {/* Botón Ver Trazabilidad si está disponible */}
                                      {onOpenOrderTracking && (
                                        <button
                                          type="button"
                                          onClick={() => onOpenOrderTracking(ord)}
                                          className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                                          title="Ver simulación omnicanal de notificaciones al cliente"
                                        >
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* =====================================================================
                  SUB-PESTAÑA 3: HISTORIAL DE MOVIMIENTOS Y TRAZABILIDAD (KARDEX)
              ===================================================================== */}
              {logisticsSubTab === 'kardex' && (
                <div className="space-y-1.5 sm:space-y-2">
                  {/* Tarjetas resumen Kardex Compactas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-blue-800 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-slate-500 text-[9.5px] font-black uppercase tracking-wider">
                        <span className="truncate">Total Movimientos Kardex</span>
                        <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number(inventario.reduce((acc, item) => acc + (item.movimientos || []).length, 0)) || 0)}
                      </span>
                      <span className="text-[9.5px] text-slate-400 font-medium truncate block mt-1 leading-none">Entradas, salidas y ajustes auditados</span>
                    </div>

                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-emerald-600 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-emerald-700 text-[9.5px] font-black uppercase tracking-wider">
                        <span className="truncate">Entradas Registradas</span>
                        <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number(inventario.reduce(
                          (acc, item) => acc + (item.movimientos || []).filter((m) => m.tipo === 'Entrada').length,
                          0
                        )) || 0)}
                      </span>
                      <span className="text-[9.5px] text-emerald-700 font-medium truncate block mt-1 leading-none">Producción / Compras / Traslados CEDI</span>
                    </div>

                    <div className="bg-white p-2 sm:p-2.5 rounded-lg border-t-2 border-t-rose-600 border-x border-b border-slate-200/90 shadow-2xs hover:shadow-xs transition-all">
                      <div className="flex items-center justify-between text-rose-700 text-[9.5px] font-black uppercase tracking-wider">
                        <span className="truncate">Salidas por Despacho</span>
                        <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <Truck className="w-3.5 h-3.5 text-rose-600" />
                        </div>
                      </div>
                      <span className="text-lg sm:text-xl font-black text-rose-600 mt-0.5 block tracking-tight font-sans leading-none">
                        {(Number(inventario.reduce(
                          (acc, item) =>
                            acc +
                            (item.movimientos || []).filter((m) => {
                              const matchSede = selectedSede === 'todas' || !m.sedeId || m.sedeId === selectedSede;
                              return matchSede && m.tipo === 'Salida';
                            }).length,
                          0
                        )) || 0)}
                      </span>
                      <span className="text-[9.5px] text-rose-700 font-medium truncate block mt-1 leading-none">Descuentos por pedidos y traslados</span>
                    </div>
                  </div>

                  {/* Tabla de Movimientos Kardex Consolidada y Filtrada por Sede */}
                  <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-3 py-1.5 bg-gradient-to-r from-slate-900 to-[#001D3D] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-white/10 text-cyan-300 border border-white/20 flex items-center justify-center shrink-0">
                          <Clock className="w-3 h-3" />
                        </div>
                        <div>
                          <h3 className="font-black text-[11.5px] uppercase tracking-wider text-white leading-tight">
                            Libro Diario de Movimientos de Inventario (Kardex CEDI) — {selectedSede === 'todas' ? 'Todas las Sedes' : SEDES_CEDI_CONFIG.find(s => s.id === selectedSede)?.nombre}
                          </h3>
                          <span className="text-[9.5px] text-cyan-200/80 font-medium leading-none">
                            Trazabilidad oficial de entradas, salidas y ajustes por orden, factura y lote
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExportCSV('auditoria')}
                        className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer self-start sm:self-auto shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
                      >
                        <Download className="w-3 h-3 text-slate-500" />
                        <span>Exportar Kardex</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black text-[9.5px] uppercase tracking-wider">
                            <th className="py-1.5 px-2.5 whitespace-nowrap">Fecha / Hora</th>
                            <th className="py-1.5 px-2.5 whitespace-nowrap">Sede / CEDI</th>
                            <th className="py-1.5 px-2.5">SKU / Variante</th>
                            <th className="py-1.5 px-2.5 text-center whitespace-nowrap">Tipo de Movimiento</th>
                            <th className="py-1.5 px-2.5 text-right whitespace-nowrap">Cantidad Movida</th>
                            <th className="py-1.5 px-2.5 text-right whitespace-nowrap">Stock Posterior</th>
                            <th className="py-1.5 px-2.5">N° Orden / Factura / Motivo</th>
                            <th className="py-1.5 px-2.5 whitespace-nowrap">Usuario Responsable</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            // Consolidar todos los movimientos de todas las variantes
                            const allMovs: Array<MovimientoInventario & { sku: string; prodNombre: string; color?: string; colorHex?: string; presentacion?: string }> = [];
                            inventario.forEach((item) => {
                              item.movimientos.forEach((m) => {
                                allMovs.push({
                                  ...m,
                                  sku: item.sku,
                                  prodNombre: item.nombre,
                                  color: item.color,
                                  colorHex: item.colorHex,
                                  presentacion: item.presentacion,
                                });
                              });
                            });

                            allMovs.sort((a, b) => b.fecha.localeCompare(a.fecha));

                            // Filtrar por sede si está seleccionada una específica
                            const filteredMovs = allMovs.filter((m) => {
                              if (selectedSede === 'todas') return true;
                              if (m.sedeId) return m.sedeId === selectedSede;
                              return true;
                            });

                            if (filteredMovs.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={8} className="py-6 text-center text-slate-400 font-bold">
                                    <Clock className="w-6 h-6 mx-auto mb-1 opacity-50 text-slate-300" />
                                    <p className="text-slate-600 font-bold text-xs">No hay movimientos registrados en el Kardex para la sede seleccionada.</p>
                                  </td>
                                </tr>
                              );
                            }

                            return filteredMovs.slice(0, 75).map((mov) => {
                              const isEntrada = mov.tipo === 'Entrada';
                              const isSalida = mov.tipo === 'Salida' || mov.tipo === 'Salida por Venta / Despacho';
                              const badgeCls = isEntrada
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : isSalida
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300';

                              const displaySede = mov.sedeNombre || (mov.sedeId ? SEDES_CEDI_CONFIG.find(s => s.id === mov.sedeId)?.nombre : 'Bogotá - CEDI Principal');

                              return (
                                <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                                  {/* 1. Fecha / Hora */}
                                  <td className="py-1 px-2.5 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                                    {mov.fecha}
                                  </td>

                                  {/* 2. Sede / CEDI */}
                                  <td className="py-1 px-2.5 whitespace-nowrap">
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-slate-100 text-slate-800 border border-slate-200/80">
                                      <MapPin className="w-2.5 h-2.5 text-cyan-600" />
                                      {displaySede}
                                    </span>
                                  </td>

                                  {/* 3. SKU / Variante */}
                                  <td className="py-1 px-2.5">
                                    <div className="flex items-center gap-1">
                                      <span className="font-mono font-bold text-blue-950 text-[10px] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/80">
                                        {mov.sku}
                                      </span>
                                      {mov.colorHex && (
                                        <span
                                          className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                                          style={{ backgroundColor: mov.colorHex }}
                                          title={mov.color}
                                        />
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-600 truncate max-w-[220px] block font-medium mt-0.5 leading-none">
                                      {mov.prodNombre}
                                    </span>
                                  </td>

                                  {/* 4. Tipo de Movimiento */}
                                  <td className="py-1 px-2.5 text-center whitespace-nowrap">
                                    <span className={`px-1.5 py-0.2 rounded font-bold text-[9.5px] border ${badgeCls}`}>
                                      {isSalida ? '↓ ' : isEntrada ? '↑ ' : '⇄ '}
                                      {mov.tipo}
                                    </span>
                                  </td>

                                  {/* 5. Cantidad */}
                                  <td className="py-1 px-2.5 text-right font-black font-mono whitespace-nowrap text-[11px]">
                                    <span className={isSalida ? 'text-rose-600' : isEntrada ? 'text-emerald-600' : 'text-slate-800'}>
                                      {isSalida ? '-' : '+'}{mov.cantidadUnidades !== undefined ? `${mov.cantidadUnidades} Unds` : `${mov.cantidadGalones} GL`}
                                    </span>
                                    {mov.cantidadUnidades !== undefined && (
                                      <span className="block text-[8.5px] text-slate-400 font-medium leading-none">
                                        ({mov.cantidadGalones} GL equiv.)
                                      </span>
                                    )}
                                  </td>

                                  {/* 6. Stock Posterior */}
                                  <td className="py-1 px-2.5 text-right font-black font-mono text-slate-900 whitespace-nowrap text-[11px]">
                                    {mov.stockPosterior} Unds
                                  </td>

                                  {/* 7. N° Orden / Factura / Lote / Detalle */}
                                  <td className="py-1 px-2.5 text-slate-700 text-xs">
                                    <div className="space-y-0.5">
                                      {(mov.numeroOrden || mov.numeroFactura || mov.loteFabricacion) && (
                                        <div className="flex flex-wrap items-center gap-1">
                                          {mov.numeroOrden && (
                                            <span className="px-1.5 py-0.2 rounded bg-blue-50 border border-blue-200 text-blue-900 font-mono font-bold text-[9.5px]">
                                              Referencia: {mov.numeroOrden}
                                            </span>
                                          )}
                                          {mov.numeroFactura && (
                                            <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold text-[9.5px]">
                                              Factura: {mov.numeroFactura}
                                            </span>
                                          )}
                                          {mov.loteFabricacion && (
                                            <span className="px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-[9.5px]">
                                              Lote: {mov.loteFabricacion}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      <span className="text-[10px] text-slate-600 block leading-tight">
                                        {mov.detalle || mov.motivo}
                                      </span>
                                      {mov.clienteNombre && (
                                        <span className="text-[9.5px] text-blue-900 font-bold block leading-none">
                                          Cliente: {mov.clienteNombre}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* 8. Usuario Responsable */}
                                  <td className="py-1 px-2.5 text-slate-600 text-xs whitespace-nowrap">
                                    <span className="font-medium text-slate-800 text-[10.5px]">{mov.usuarioNombre}</span>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* =====================================================================
                  MODALES DEL MÓDULO LOGÍSTICO
              ===================================================================== */}

              {/* 1. Modal: Crear Matriz de Variantes / Editar Variante */}
              {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
                  <div className={`w-full ${editingProduct ? 'max-w-lg' : 'max-w-4xl'} bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto`}>
                    
                    {/* Encabezado del Modal */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-950 tracking-wider">
                          {editingProduct ? 'Ficha de Variante Individual' : 'Alta de Nuevo Producto & Matriz SKU'}
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          {editingProduct ? `Editar: ${editingProduct.sku}` : '+ Configurar Matriz de Tonos y Tamaños'}
                        </h3>
                        {!editingProduct && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Define la referencia base, selecciona los tonos y tamaños disponibles, y ajusta las existencias individuales para sincronizar en tiempo real con el catálogo.
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProductModalOpen(false);
                          setEditingProduct(null);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* MODO A: EDITAR VARIANTE INDIVIDUAL */}
                    {editingProduct ? (
                      <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Nombre Comercial de la Variante *</label>
                          <input
                            type="text"
                            required
                            value={productForm.nombre}
                            onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Código SKU *</label>
                            <input
                              type="text"
                              required
                              value={productForm.sku}
                              onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Marca *</label>
                            <select
                              value={productForm.marca}
                              onChange={(e) => setProductForm({ ...productForm, marca: e.target.value as any })}
                              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
                            >
                              <option value="Pintuco">Pintuco®</option>
                              <option value="Color In">Color In (Línea Económica)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Tono / Color</label>
                            <input
                              type="text"
                              value={productForm.color}
                              onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Presentación / Tamaño</label>
                            <input
                              type="text"
                              value={productForm.presentacion}
                              onChange={(e) => setProductForm({ ...productForm, presentacion: e.target.value })}
                              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Categoría *</label>
                            <select
                              value={productForm.categoria}
                              onChange={(e) => setProductForm({ ...productForm, categoria: e.target.value })}
                              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
                            >
                              <option value="Pintura Interior">Pintura Interior</option>
                              <option value="Pintura Fachada">Pintura Fachada</option>
                              <option value="Esmaltes y Anticorrosivos">Esmaltes y Anticorrosivos</option>
                              <option value="Maderas y Barnices">Maderas y Barnices</option>
                              <option value="Impermeabilizantes">Impermeabilizantes</option>
                              <option value="Epóxicos y Alto Tráfico">Epóxicos y Tráfico</option>
                              <option value="Herramientas y Accesorios">Herramientas</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Precio Unitario COP *</label>
                            <input
                              type="number"
                              min="1000"
                              required
                              value={productForm.precioVentaGL}
                              onChange={(e) => setProductForm({ ...productForm, precioVentaGL: parseInt(e.target.value) || 0 })}
                              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black text-slate-900"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Stock Actual (Galones / Unidades) *</label>
                            <input
                              type="number"
                              min="0"
                              required
                              value={productForm.stockGalones}
                              onChange={(e) => setProductForm({ ...productForm, stockGalones: parseInt(e.target.value) || 0 })}
                              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black text-slate-900"
                            />
                            <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                              Modificar genera registro automático en Kardex
                            </span>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 mb-1">Stock Mínimo de Alerta *</label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={productForm.stockMinimoGalones}
                              onChange={(e) => setProductForm({ ...productForm, stockMinimoGalones: parseInt(e.target.value) || 0 })}
                              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black text-slate-900"
                            />
                            <span className="text-[10px] text-slate-500 font-semibold mt-1 block">
                              Dispara alerta roja si existencias ≤ umbral
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Ubicación Física en Bodega</label>
                          <input
                            type="text"
                            value={productForm.ubicacionBodega}
                            onChange={(e) => setProductForm({ ...productForm, ubicacionBodega: e.target.value })}
                            placeholder="Ej. CEDI Rionegro - Pasillo A-03"
                            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setIsProductModalOpen(false);
                              setEditingProduct(null);
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-extrabold shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4 text-cyan-300" />
                            <span>Guardar Cambios</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* MODO B: CREACIÓN DE MATRIZ COMPLETA (COLOR + PRESENTACIÓN) */
                      <form onSubmit={handleSaveMatrixProduct} className="space-y-4 text-xs">
                        {/* 1. Datos del Producto Base */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px] font-black">
                              1
                            </span>
                            <h4 className="font-black text-slate-900 text-xs">Información del Producto Base</h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block font-bold text-slate-700 mb-1">Referencia / Nombre Base *</label>
                              <input
                                type="text"
                                required
                                value={matrixBaseName}
                                onChange={(e) => {
                                  setMatrixBaseName(e.target.value);
                                }}
                                placeholder="Ej. Viniltex Baños y Cocinas Antibacterial"
                                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Prefijo SKU Base *</label>
                              <input
                                type="text"
                                required
                                value={matrixSkuBase}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  setMatrixSkuBase(val);
                                  syncVariantMatrix(val, selectedColorsList, selectedSizesList, variantMatrixItems);
                                }}
                                placeholder="PIN-VTX"
                                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Marca *</label>
                              <select
                                value={matrixMarca}
                                onChange={(e) => setMatrixMarca(e.target.value as any)}
                                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-900"
                              >
                                <option value="Pintuco">Pintuco®</option>
                                <option value="Color In">Color In (Económica)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Categoría *</label>
                              <select
                                value={matrixCategory}
                                onChange={(e) => setMatrixCategory(e.target.value)}
                                className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold text-slate-900"
                              >
                                <option value="Pintura Interior">Pintura Interior</option>
                                <option value="Pintura Fachada">Pintura Fachada</option>
                                <option value="Esmaltes y Anticorrosivos">Esmaltes y Anticorrosivos</option>
                                <option value="Maderas y Barnices">Maderas y Barnices</option>
                                <option value="Impermeabilizantes">Impermeabilizantes</option>
                                <option value="Epóxicos y Alto Tráfico">Epóxicos y Tráfico</option>
                                <option value="Herramientas y Accesorios">Herramientas</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 mb-1">Ubicación Bodega</label>
                              <input
                                type="text"
                                value={matrixUbicacion}
                                onChange={(e) => setMatrixUbicacion(e.target.value)}
                                placeholder="CEDI Rionegro - Pasillo A-02"
                                className="w-full p-2 rounded-xl bg-white border border-slate-200 text-slate-900"
                              />
                            </div>
                          </div>
                        </div>

                        {/* 2. Selección de Tonos / Colores Certificados */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px] font-black">
                                2
                              </span>
                              <h4 className="font-black text-slate-900 text-xs">Tonos y Colores Disponibles</h4>
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {selectedColorsList.length} seleccionados
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {PRESET_PINTUCO_COLORS.map((col) => {
                              const isSelected = selectedColorsList.some((c) => c.name === col.name);
                              return (
                                <button
                                  key={col.name}
                                  type="button"
                                  onClick={() => handleToggleColorInMatrix(col)}
                                  className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  <span
                                    className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                                    style={{ backgroundColor: col.hex }}
                                  />
                                  <div className="truncate flex-1">
                                    <span className="block truncate text-[11px] leading-tight">{col.name}</span>
                                    <span className="text-[9px] text-slate-400 font-mono">{col.code}</span>
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>

                          {/* Añadir otro tono personalizado */}
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                            <span className="text-[10px] text-slate-500 font-bold whitespace-nowrap">+ Añadir otro tono:</span>
                            <input
                              type="text"
                              value={customColorName}
                              onChange={(e) => setCustomColorName(e.target.value)}
                              placeholder="Ej. Amarillo Colonial 1018"
                              className="flex-1 py-1 px-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                            />
                            <input
                              type="color"
                              value={customColorHex}
                              onChange={(e) => setCustomColorHex(e.target.value)}
                              className="w-8 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                              title="Seleccionar color hexadecimal"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomColor}
                              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] cursor-pointer"
                            >
                              Agregar
                            </button>
                          </div>
                        </div>

                        {/* 3. Selección de Presentaciones / Tamaños */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px] font-black">
                                3
                              </span>
                              <h4 className="font-black text-slate-900 text-xs">Presentaciones / Tamaños a Generar</h4>
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {selectedSizesList.length} seleccionadas
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {['Cuñete (5 Gal)', 'Galón', 'Cuarto (1/4 Gal)', 'Unidad'].map((sz) => {
                              const isSelected = selectedSizesList.includes(sz);
                              return (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => handleToggleSizeInMatrix(sz)}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-300'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  <div>
                                    <span className="block text-xs">{sz}</span>
                                    <span className="text-[9px] text-slate-400">
                                      {sz.includes('5') ? '5 GL' : sz.includes('1/4') ? '0.25 GL' : sz.includes('Gal') ? '1 GL' : '1 UN'}
                                    </span>
                                  </div>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 4. Matriz Generada de Variantes (SKUs individuales) */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px] font-black">
                                4
                              </span>
                              <h4 className="font-black text-slate-900 text-xs">
                                Matriz SKU Generada ({variantMatrixItems.filter((v) => v.enabled).length} Variantes Activas)
                              </h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">
                              Personaliza SKU, precio y stock por combinación
                            </span>
                          </div>

                          <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto bg-white shadow-2xs">
                            <table className="w-full text-[11px] text-left">
                              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                  <th className="py-2 px-3 w-8 text-center">Inc.</th>
                                  <th className="py-2 px-3">Tono / Color</th>
                                  <th className="py-2 px-3">Presentación</th>
                                  <th className="py-2 px-3">SKU Único</th>
                                  <th className="py-2 px-3">Precio COP</th>
                                  <th className="py-2 px-3">Stock Inicial</th>
                                  <th className="py-2 px-3">Stock Mínimo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {variantMatrixItems.map((item) => (
                                  <tr
                                    key={item.key}
                                    className={`transition-colors ${item.enabled ? 'hover:bg-slate-50' : 'bg-slate-50/60 opacity-50'}`}
                                  >
                                    <td className="py-2 px-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={item.enabled}
                                        onChange={(e) => handleUpdateMatrixItemField(item.key, 'enabled', e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      />
                                    </td>
                                    <td className="py-2 px-3 whitespace-nowrap">
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                          style={{ backgroundColor: item.colorHex }}
                                        />
                                        <span className="font-bold text-slate-900 truncate max-w-[140px]">{item.color}</span>
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 whitespace-nowrap font-medium text-slate-700">
                                      {item.presentacion}
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="text"
                                        disabled={!item.enabled}
                                        value={item.sku}
                                        onChange={(e) => handleUpdateMatrixItemField(item.key, 'sku', e.target.value.toUpperCase())}
                                        className="w-32 py-1 px-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono font-bold text-[11px] focus:bg-white"
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="number"
                                        disabled={!item.enabled}
                                        min="1000"
                                        value={item.precio}
                                        onChange={(e) => handleUpdateMatrixItemField(item.key, 'precio', parseInt(e.target.value) || 0)}
                                        className="w-24 py-1 px-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-[11px] text-right focus:bg-white"
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="number"
                                        disabled={!item.enabled}
                                        min="0"
                                        value={item.stock}
                                        onChange={(e) => handleUpdateMatrixItemField(item.key, 'stock', parseInt(e.target.value) || 0)}
                                        className="w-20 py-1 px-1.5 rounded-lg bg-slate-50 border border-slate-200 font-black text-[11px] text-right text-blue-900 focus:bg-white"
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="number"
                                        disabled={!item.enabled}
                                        min="1"
                                        value={item.stockMinimo}
                                        onChange={(e) => handleUpdateMatrixItemField(item.key, 'stockMinimo', parseInt(e.target.value) || 0)}
                                        className="w-16 py-1 px-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-[11px] text-right text-slate-600 focus:bg-white"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                          <span className="text-[11px] text-slate-500 font-bold">
                            Total: <strong>{variantMatrixItems.filter((v) => v.enabled).length}</strong> variantes activas para sincronizar
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsProductModalOpen(false);
                                setEditingProduct(null);
                              }}
                              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-5 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-black shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <Check className="w-4 h-4 text-cyan-300" />
                              <span>Crear y Sincronizar Matriz en Bodega</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Modal: Confirmar Desactivación o Eliminación */}
              {isProductActionModalOpen && productToAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                  <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">
                          {productActionType === 'eliminar'
                            ? '¿Eliminar Producto Definitivamente?'
                            : productActionType === 'desactivar'
                            ? '¿Desactivar Producto?'
                            : '¿Reactivar Producto?'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          SKU: <strong className="font-mono text-slate-900">{productToAction.sku}</strong> — {productToAction.nombre}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                      <p>
                        {productActionType === 'eliminar'
                          ? 'Esta acción eliminará el registro de inventario permanentemente. Se recomienda desactivar en lugar de eliminar para conservar el historial de movimientos.'
                          : productActionType === 'desactivar'
                          ? 'Al desactivar el producto, no se sugerirá para nuevos despachos ni cotizaciones, pero se conservará la trazabilidad completa en auditoría.'
                          : 'El producto volverá a estar disponible en el inventario activo.'}
                      </p>

                      {/* Opción para alternar entre Desactivar o Eliminar */}
                      {productActionType !== 'activar' && (
                        <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="actionTypeChoice"
                              checked={productActionType === 'desactivar'}
                              onChange={() => setProductActionType('desactivar')}
                            />
                            Desactivar (Recomendado)
                          </label>
                          <label className="text-[11px] font-bold text-rose-700 flex items-center gap-1.5 cursor-pointer ml-3">
                            <input
                              type="radio"
                              name="actionTypeChoice"
                              checked={productActionType === 'eliminar'}
                              onChange={() => setProductActionType('eliminar')}
                            />
                            Eliminar permanente
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProductActionModalOpen(false);
                          setProductToAction(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmProductAction}
                        className={`px-4 py-2 rounded-xl font-bold text-xs text-white shadow-xs cursor-pointer ${
                          productActionType === 'eliminar'
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : productActionType === 'desactivar'
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        Confirmar Acción
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Modal: Actualizar Estado de Despacho y Pedido */}
              {isOrderStatusModalOpen && selectedOrderForStatus && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                  <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase text-blue-950">Despachos & Logística</span>
                        <h3 className="text-base font-black text-slate-900">
                          Actualizar Estado: Orden {selectedOrderForStatus.numeroOrden}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOrderStatusModalOpen(false);
                          setSelectedOrderForStatus(null);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Resumen del Pedido */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Cliente:</span>
                        <strong className="text-slate-900 font-black">
                          {selectedOrderForStatus.form?.nombre_razon_social || selectedOrderForStatus.customerName || 'Cliente Pintuco'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Destino:</span>
                        <span className="text-slate-800 font-bold">
                          {selectedOrderForStatus.form?.ciudad || selectedOrderForStatus.ciudadEntrega || 'Medellín'} — {selectedOrderForStatus.form?.direccion_obra || selectedOrderForStatus.direccionEntrega || 'Obra'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Estado Actual:</span>
                        <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-slate-200 text-slate-800">
                          {selectedOrderForStatus.estado || 'Cotizado'}
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handleSaveOrderStatus} className="space-y-3.5 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1.5">Nuevo Estado del Pedido *</label>
                        <div className="space-y-2">
                          {[
                            { id: 'Aprobado / Listo para Despacho', label: 'Aprobado / Listo para Despacho', desc: 'Aprobación comercial y descuento automático de inventario para despacho CEDI' },
                            { id: 'En preparación', label: 'En preparación', desc: 'Alistamiento de cuñetes y galones en bodega CEDI' },
                            { id: 'Despachado', label: 'Despachado', desc: 'Mercancía cargada en camión / entregada a transportadora' },
                            { id: 'En tránsito', label: 'En tránsito', desc: 'En ruta nacional o intermunicipal hacia la obra' },
                            { id: 'Entregado', label: 'Entregado', desc: 'Recibido a conformidad por el cliente o maestro de obra' },
                          ].map((st) => (
                            <label
                              key={st.id}
                              className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                                orderStatusForm.nuevoEstado === st.id
                                  ? 'bg-blue-50/80 border-blue-900 shadow-xs'
                                  : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="radio"
                                name="orderStatusOption"
                                value={st.id}
                                checked={orderStatusForm.nuevoEstado === st.id}
                                onChange={(e) => setOrderStatusForm({ ...orderStatusForm, nuevoEstado: e.target.value })}
                                className="mt-0.5 text-blue-900 focus:ring-blue-900"
                              />
                              <div className="min-w-0">
                                <strong className="text-slate-900 font-black block">{st.label}</strong>
                                <span className="text-[11px] text-slate-500 font-medium">{st.desc}</span>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Empresa Transportadora</label>
                          <select
                            value={orderStatusForm.transportadora}
                            onChange={(e) => setOrderStatusForm({ ...orderStatusForm, transportadora: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
                          >
                            <option value="Coordinadora Mercantil">Coordinadora Mercantil</option>
                            <option value="Servientrega">Servientrega</option>
                            <option value="Envía">Envía</option>
                            <option value="Pintuco Express">Flota Propia Pintuco Express</option>
                            <option value="Entrega en Obra Directa">Entrega en Obra Directa</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Número de Guía de Despacho</label>
                          <input
                            type="text"
                            value={orderStatusForm.guiaDespacho}
                            onChange={(e) => setOrderStatusForm({ ...orderStatusForm, guiaDespacho: e.target.value })}
                            placeholder="Ej. GUIA-739201"
                            className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Observaciones / Novedad de Despacho</label>
                        <input
                          type="text"
                          value={orderStatusForm.observaciones}
                          onChange={(e) => setOrderStatusForm({ ...orderStatusForm, observaciones: e.target.value })}
                          placeholder="Ej. Despachado camión NHR placa TPK-204, conductor Carlos Gómez"
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                        />
                      </div>

                      <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-[11px] text-blue-950 font-medium">
                        ℹ️ <strong>Trazabilidad en tiempo real:</strong> Al guardar la actualización, el nuevo estado queda registrado en auditoría y el cliente podrá consultarlo inmediatamente desde el portal web en su historial de pedidos.
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsOrderStatusModalOpen(false);
                            setSelectedOrderForStatus(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4 text-cyan-300" />
                          <span>Guardar y Notificar Estado</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* 4. Modal: ⚙️ Ajuste de Inventario y Auditoría */}
              {isStockMovementModalOpen && selectedStockItem && (() => {
                const currentSedeId = stockMovementForm.sedeId || (selectedSede !== 'todas' ? selectedSede : 'bogota');
                const currentSedeObj = SEDES_CEDI_CONFIG.find((s) => s.id === currentSedeId);
                const stockEnSede = getStockEnSede(selectedStockItem, currentSedeId);
                const stockTotalNacional = selectedStockItem.stockUnidades ?? selectedStockItem.stockGalones ?? 0;
                const delta = stockMovementForm.tipo === 'Entrada' ? stockMovementForm.cantidad : -stockMovementForm.cantidad;
                const stockSedeProyectado = Math.max(0, stockEnSede + delta);
                const stockNacionalProyectado = Math.max(0, stockTotalNacional + delta);
                const obsLength = stockMovementForm.observacion.trim().length;
                const isObsValid = obsLength >= 10;

                return (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                      
                      {/* Cabecera Oficial del Modal */}
                      <div className="p-4 bg-[#001D3D] text-white flex items-center justify-between border-b border-cyan-500/30 shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                                ⚙️ Ajuste de Inventario y Auditoría
                              </h3>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                ISO 9001
                              </span>
                            </div>
                            <p className="text-[11px] text-cyan-200/90 font-medium">
                              Control estricto de existencias con registro auditado en Kardex Central
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsStockMovementModalOpen(false)}
                          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Cuerpo del Formulario con Scroll */}
                      <div className="p-5 overflow-y-auto space-y-4 text-xs">
                        
                        {/* Ficha de la Variante Seleccionada */}
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">
                                Referencia / Variante Seleccionada
                              </span>
                              <strong className="text-slate-900 font-black text-xs block leading-tight">
                                {selectedStockItem.nombre}
                              </strong>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-[10px] font-bold bg-white text-blue-950 px-2 py-0.5 rounded border border-slate-300">
                                  SKU: {selectedStockItem.sku}
                                </span>
                                <span className="text-[10.5px] text-slate-600 font-medium">
                                  Presentación: <strong className="text-slate-800">{selectedStockItem.presentacion || 'Galón'}</strong>
                                </span>
                              </div>
                            </div>
                            {selectedStockItem.colorHex && (
                              <div
                                className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs shrink-0"
                                style={{ backgroundColor: selectedStockItem.colorHex }}
                                title={selectedStockItem.color}
                              />
                            )}
                          </div>
                        </div>

                        {/* Bloque Informativo: Existencias Actuales (Deshabilitada la edición libre) */}
                        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-950 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-blue-700" />
                              <span>Control de Stock en Tiempo Real (Solo Lectura)</span>
                            </span>
                            <span className="text-[9.5px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.2 rounded border border-blue-200">
                              Edición libre deshabilitada
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center pt-1">
                            <div className="p-2 rounded-lg bg-white border border-blue-100 shadow-2xs">
                              <span className="text-[9.5px] font-bold text-slate-500 block">
                                Stock Actual en Sede:
                              </span>
                              <strong className="text-base font-black text-slate-900 font-mono">
                                {stockEnSede} Unds
                              </strong>
                              <span className="text-[8.5px] text-slate-400 block truncate">
                                {currentSedeObj?.nombre || 'Sede CEDI'}
                              </span>
                            </div>

                            <div className="p-2 rounded-lg bg-white border border-blue-100 shadow-2xs">
                              <span className="text-[9.5px] font-bold text-slate-500 block">
                                Stock Proyectado post-ajuste:
                              </span>
                              <strong className={`text-base font-black font-mono ${
                                stockMovementForm.tipo === 'Entrada' ? 'text-emerald-700' : 'text-rose-700'
                              }`}>
                                {stockSedeProyectado} Unds
                              </strong>
                              <span className={`text-[8.5px] font-bold block ${
                                stockMovementForm.tipo === 'Entrada' ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {stockMovementForm.tipo === 'Entrada' ? `+${stockMovementForm.cantidad}` : `-${stockMovementForm.cantidad}`} Unds
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Formulario de Ajuste Auditado */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!isObsValid) {
                              alert('La justificación debe contener al menos 10 caracteres para cumplir con la auditoría obligatoria.');
                              return;
                            }
                            const motivoCompleto = `${stockMovementForm.motivo} — Justificación: ${stockMovementForm.observacion.trim()}`;
                            registrarMovimientoStock(
                              selectedStockItem.id,
                              stockMovementForm.tipo,
                              stockMovementForm.cantidad,
                              motivoCompleto,
                              activeUserName,
                              currentSedeId,
                              currentSedeObj?.nombre
                            );
                            setInventario(getInventarioCorp());
                            setAuditoria(getAuditoria());
                            setLogisticsFeedbackMessage(
                              `✅ Ajuste de ${stockMovementForm.tipo} (${stockMovementForm.cantidad} unidades) asentado en Kardex para ${selectedStockItem.sku} en ${currentSedeObj?.nombre}. Auditor: ${activeUserName}.`
                            );
                            setIsStockMovementModalOpen(false);
                          }}
                          className="space-y-3.5 text-xs"
                        >
                          {/* 1. Sede CEDI de Aplicación */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">
                              📍 Sede CEDI donde se aplica el ajuste *
                            </label>
                            <select
                              value={stockMovementForm.sedeId || (selectedSede !== 'todas' ? selectedSede : 'bogota')}
                              onChange={(e) => setStockMovementForm({ ...stockMovementForm, sedeId: e.target.value })}
                              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                            >
                              {SEDES_CEDI_CONFIG.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.nombre} ({s.ciudad})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 2. Tipo de Ajuste */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">
                              ⚖️ Tipo de Ajuste de Inventario *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setStockMovementForm({ ...stockMovementForm, tipo: 'Entrada' })}
                                className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                  stockMovementForm.tipo === 'Entrada'
                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                                <span>Entrada (+) Ingreso / Reintegro</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setStockMovementForm({ ...stockMovementForm, tipo: 'Salida' })}
                                className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                  stockMovementForm.tipo === 'Salida'
                                    ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                <Truck className="w-4 h-4 text-rose-600" />
                                <span>Salida (-) Merma / Retiro</span>
                              </button>
                            </div>
                          </div>

                          {/* 3. Cantidad de Unidades */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="font-bold text-slate-800">
                                📦 Cantidad a Ajustar (Unidades de {selectedStockItem.presentacion || 'Envases'}) *
                              </label>
                              <span className="text-[10px] text-slate-500 font-medium">
                                Equivalente a {(stockMovementForm.cantidad * (selectedStockItem.presentacion?.includes('5') ? 5 : 1)).toFixed(0)} GL
                              </span>
                            </div>
                            <input
                              type="number"
                              min="1"
                              max="10000"
                              required
                              value={stockMovementForm.cantidad}
                              onChange={(e) => setStockMovementForm({ ...stockMovementForm, cantidad: Math.max(1, parseInt(e.target.value) || 1) })}
                              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono font-black text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                            />
                          </div>

                          {/* 4. Motivo Estructurado */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">
                              📋 Motivo Oficial del Ajuste *
                            </label>
                            <select
                              value={stockMovementForm.motivo}
                              onChange={(e) => setStockMovementForm({ ...stockMovementForm, motivo: e.target.value })}
                              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                            >
                              <option value="Inconsistencia en conteo físico / Auditoría cíclica">
                                Inconsistencia en conteo físico / Auditoría cíclica
                              </option>
                              <option value="Avería / Derrame en bodega">
                                Avería / Derrame en bodega
                              </option>
                              <option value="Muestra técnica / Calidad de laboratorio">
                                Muestra técnica / Calidad de laboratorio
                              </option>
                              <option value="Devolución de cliente no conforme">
                                Devolución de cliente no conforme
                              </option>
                              <option value="Ajuste por calibración de dosificación">
                                Ajuste por calibración de dosificación
                              </option>
                              <option value="Merma autorizada por vencimiento / rotura">
                                Merma autorizada por vencimiento / rotura
                              </option>
                              <option value="Otro motivo justificado">
                                Otro motivo justificado
                              </option>
                            </select>
                          </div>

                          {/* 5. Observación / Justificación Obligatoria (Mínimo 10 caracteres) */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="font-bold text-slate-800">
                                ✍️ Observación / Justificación Obligatoria *
                              </label>
                              <span className={`text-[10px] font-bold ${
                                isObsValid ? 'text-emerald-700' : 'text-amber-700'
                              }`}>
                                {obsLength} / 10 caracteres {isObsValid ? '✓ (Válido)' : '(Mínimo 10 obligatorios)'}
                              </span>
                            </div>
                            <textarea
                              required
                              rows={3}
                              value={stockMovementForm.observacion}
                              onChange={(e) => setStockMovementForm({ ...stockMovementForm, observacion: e.target.value })}
                              placeholder="Describe detalladamente la causa física del ajuste, acta interna o funcionario que autoriza (mínimo 10 caracteres)..."
                              className={`w-full p-2.5 rounded-xl bg-slate-50 border font-medium text-xs text-slate-900 focus:outline-none focus:ring-2 ${
                                isObsValid ? 'border-slate-300 focus:ring-cyan-500/20' : 'border-amber-400 focus:ring-amber-500/20 bg-amber-50/20'
                              }`}
                            />
                            {!isObsValid && (
                              <p className="text-[10px] text-amber-700 font-medium mt-0.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Por política de auditoría interna, se requiere una justificación de mínimo 10 caracteres.</span>
                              </p>
                            )}
                          </div>

                          {/* Huella de Auditoría del Responsable */}
                          <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-[10.5px] text-slate-600 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-900" />
                              <span>Usuario Responsable: <strong>{activeUserName}</strong></span>
                            </span>
                            <span className="font-mono text-[9.5px] text-slate-500">
                              {new Date().toISOString().slice(0, 16).replace('T', ' ')}
                            </span>
                          </div>

                          {/* Botones de Acción */}
                          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                            <button
                              type="button"
                              onClick={() => setIsStockMovementModalOpen(false)}
                              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={!isObsValid || stockMovementForm.cantidad <= 0}
                              className={`px-5 py-2 rounded-xl font-bold text-white shadow-xs transition-all flex items-center gap-1.5 ${
                                isObsValid && stockMovementForm.cantidad > 0
                                  ? 'bg-[#001D3D] hover:bg-[#002D5C] cursor-pointer shadow-md'
                                  : 'bg-slate-400 cursor-not-allowed opacity-60'
                              }`}
                            >
                              <ShieldCheck className="w-4 h-4 text-cyan-300" />
                              <span>Registrar Ajuste en Kardex</span>
                            </button>
                          </div>
                        </form>

                      </div>

                    </div>
                  </div>
                );
              })()}

              {/* 5. Modal: Corroboración y Recepción Física de Orden de Compra (Compras vs. Logística) */}
              {isRecepcionModalOpen && selectedOCForRecepcion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
                  <div className="w-full max-w-3xl bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-200 uppercase tracking-wider">
                            Muelle de Descarga & Recepción Física
                          </span>
                          <span className="text-xs text-slate-400 font-medium">Compras vs. Logística CEDI</span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1">
                          Corroboración de Entrega: Orden {selectedOCForRecepcion.numeroOC}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Proveedor: <strong className="text-slate-800 font-bold">{selectedOCForRecepcion.proveedor}</strong> | Factura / Remisión: <strong className="text-slate-800 font-bold">{selectedOCForRecepcion.numeroFacturaProveedor}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRecepcionModalOpen(false);
                          setSelectedOCForRecepcion(null);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleConfirmRecepcion} className="space-y-4 text-xs">
                      
                      {/* SECCIÓN 1: SEDE Y LOTE DE FABRICACIÓN */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 sm:p-4 rounded-xl bg-amber-50/50 border border-amber-200/80">
                        <div>
                          <label className="block font-bold text-amber-950 mb-1">
                            📍 Sede CEDI de Ingreso Físico *
                          </label>
                          <select
                            value={recepcionForm.sedeRecepcionId}
                            onChange={(e) => setRecepcionForm({ ...recepcionForm, sedeRecepcionId: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-white border border-amber-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          >
                            {SEDES_CEDI_CONFIG.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-amber-950 mb-1">
                            🏷️ N° Lote de Fabricación Verificado *
                          </label>
                          <input
                            type="text"
                            required
                            value={recepcionForm.loteFabricacion}
                            onChange={(e) => setRecepcionForm({ ...recepcionForm, loteFabricacion: e.target.value })}
                            placeholder="Ej. LOT-2026-VTX-882"
                            className="w-full p-2.5 rounded-xl bg-white border border-amber-300 font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                        </div>
                      </div>

                      {/* SECCIÓN 2: FORMALIZACIÓN LEGAL Y RESPONSABLE DE RECEPCIÓN (OBLIGATORIO PARA ACTA) */}
                      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-xs uppercase tracking-wide">
                              ✍️ Formalización Legal & Custodia (Obligatorio)
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                              (Datos requeridos para el Acta Inmutable)
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            Auditoría ISO 9001
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {/* Nombre del Responsable */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">
                              Nombre del Responsable *
                            </label>
                            <input
                              type="text"
                              required
                              value={recepcionForm.nombreResponsable}
                              onChange={(e) => setRecepcionForm({ ...recepcionForm, nombreResponsable: e.target.value })}
                              placeholder="Ej. Carlos Alberto Mendoza"
                              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              Funcionario que recibe
                            </span>
                          </div>

                          {/* Número de Cédula / Documento */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">
                              Cédula / Documento *
                            </label>
                            <input
                              type="text"
                              required
                              value={recepcionForm.documentoResponsable}
                              onChange={(e) => setRecepcionForm({ ...recepcionForm, documentoResponsable: e.target.value })}
                              placeholder="Ej. CC 1.018.492.310"
                              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              Constancia de identidad
                            </span>
                          </div>

                          {/* Cargo del Funcionario */}
                          <div>
                            <label className="block font-bold text-slate-800 mb-1">
                              Cargo del Funcionario *
                            </label>
                            <input
                              type="text"
                              required
                              value={recepcionForm.cargoResponsable}
                              onChange={(e) => setRecepcionForm({ ...recepcionForm, cargoResponsable: e.target.value })}
                              placeholder="Ej. Superintendente de Bodegas CEDI"
                              className="w-full p-2.5 rounded-xl bg-white border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              Rol o cargo oficial
                            </span>
                          </div>

                          {/* Fecha y Hora Autogenerada (Inmutable) */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block font-bold text-slate-800">
                                Fecha & Hora *
                              </label>
                              <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Certificada
                              </span>
                            </div>
                            <input
                              type="text"
                              readOnly
                              value={recepcionForm.fechaHoraRecepcion || new Date().toISOString().slice(0, 16).replace('T', ' ')}
                              className="w-full p-2.5 rounded-xl bg-slate-100 border border-slate-300 font-mono font-bold text-slate-800 cursor-not-allowed select-none"
                              title="Fecha y hora autogenerada por el sistema con sello no modificable"
                            />
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              🕒 Autogenerada por el sistema
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* SECCIÓN 3: CORROBORACIÓN DE ITEMS */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-extrabold text-slate-900 text-xs">
                            Corroboración de Mercancía por Variante (Color + Presentación)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const fullRec: Record<string, number> = {};
                              selectedOCForRecepcion.items.forEach((it) => {
                                fullRec[it.sku] = it.cantidadEsperada;
                              });
                              setRecepcionForm({ ...recepcionForm, cantidadesPorSku: fullRec });
                            }}
                            className="text-xs text-blue-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Marcar Todo Recibido al 100%</span>
                          </button>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                                <th className="py-2.5 px-3">Código SKU</th>
                                <th className="py-2.5 px-3">Referencia / Producto</th>
                                <th className="py-2.5 px-3">Presentación</th>
                                <th className="py-2.5 px-3 text-center">Facturado (Compras)</th>
                                <th className="py-2.5 px-3 text-right">Cantidad Real Recibida</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedOCForRecepcion.items.map((it) => {
                                const currentVal = recepcionForm.cantidadesPorSku[it.sku] !== undefined
                                  ? recepcionForm.cantidadesPorSku[it.sku]
                                  : it.cantidadEsperada;

                                return (
                                  <tr key={it.sku} className="hover:bg-slate-50/70">
                                    <td className="py-2.5 px-3 font-mono font-bold text-blue-950 text-[11px]">
                                      {it.sku}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <strong className="text-slate-900 block font-bold text-xs">
                                        {it.productoNombre}
                                      </strong>
                                      {it.color && (
                                        <span className="text-[10px] text-slate-500 font-medium">
                                          Tono: {it.color}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-bold">
                                        {it.presentacion}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                                      {it.cantidadEsperada} Unds
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <input
                                          type="number"
                                          min="0"
                                          max="10000"
                                          required
                                          value={currentVal}
                                          onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setRecepcionForm({
                                              ...recepcionForm,
                                              cantidadesPorSku: {
                                                ...recepcionForm.cantidadesPorSku,
                                                [it.sku]: val,
                                              },
                                            });
                                          }}
                                          className="w-24 p-1.5 rounded-lg bg-white border border-slate-300 font-mono font-black text-right text-xs text-blue-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                                        />
                                        <span className="text-[11px] text-slate-500 font-bold">Unds</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Observaciones */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Observaciones de Inspección Física / Sellos de Seguridad
                        </label>
                        <input
                          type="text"
                          value={recepcionForm.observaciones}
                          onChange={(e) => setRecepcionForm({ ...recepcionForm, observaciones: e.target.value })}
                          placeholder="Ej. Mercancía recibida en estibas flejadas, sellos de tapa íntegros, sin abolladuras ni derrames."
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                        />
                      </div>

                      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-950 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-800" />
                          <span>Formalización Inmutable de Acta Oficial & Asentamiento en Kardex:</span>
                        </div>
                        <p className="text-slate-700">
                          Al presionar confirmar, se creará el <strong>Acta Oficial de Recepción Inmutable</strong> con folio de auditoría legal. Las cantidades ingresarán de inmediato al stock del CEDI ({SEDES_CEDI_CONFIG.find(s => s.id === recepcionForm.sedeRecepcionId)?.nombre}) y <strong>no podrán ser editadas posteriormente</strong> para garantizar la fidelidad de auditoría.
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRecepcionModalOpen(false);
                            setSelectedOCForRecepcion(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-[#001D3D] hover:bg-[#002D5C] text-white font-bold shadow-xs hover:shadow-md cursor-pointer flex items-center gap-2 transition-all active:scale-[0.99]"
                        >
                          <FileCheck className="w-4 h-4 text-cyan-300" />
                          <span>Formalizar Recepción & Generar Acta Oficial</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal Oficial: Acta de Recepción Inmutable (Modo Solo Lectura con Impresión/PDF) */}
              <ActaRecepcionOCModal
                isOpen={isActaModalOpen}
                onClose={() => {
                  setIsActaModalOpen(false);
                  setSelectedOCForActa(null);
                }}
                orden={selectedOCForActa}
              />

              {/* 6. Modal: Nuevo Traslado Inter-Sedes (Despacho y Resta de Inventario en Origen) */}
              {isNuevoTrasladoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
                  <div className="w-full max-w-2xl bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-50 text-cyan-900 border border-cyan-200 uppercase tracking-wider">
                            Despacho Inter-Bodegas CEDI
                          </span>
                          <span className="text-xs text-slate-400 font-medium">Remisión Oficial COLORLINK</span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1">
                          Generar Nuevo Traslado Inter-Sedes
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Reabastecimiento estratégico entre bodegas con descuento automático en la sede origen.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsNuevoTrasladoModalOpen(false)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateNuevoTraslado} className="space-y-4 text-xs">
                      {/* Sedes Origen y Destino */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 sm:p-4 rounded-xl bg-cyan-50/50 border border-cyan-200/80">
                        <div>
                          <label className="block font-bold text-cyan-950 mb-1">
                            📤 Sede CEDI Origen (Se descuenta el stock) *
                          </label>
                          <select
                            value={nuevoTrasladoForm.sedeOrigenId}
                            onChange={(e) => setNuevoTrasladoForm({ ...nuevoTrasladoForm, sedeOrigenId: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-white border border-cyan-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                          >
                            {SEDES_CEDI_CONFIG.map((s) => (
                              <option key={s.id} value={s.id}>
                                📍 {s.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-cyan-950 mb-1">
                            📥 Sede CEDI Destino (Recibirá el envío) *
                          </label>
                          <select
                            value={nuevoTrasladoForm.sedeDestinoId}
                            onChange={(e) => setNuevoTrasladoForm({ ...nuevoTrasladoForm, sedeDestinoId: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-white border border-cyan-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                          >
                            {SEDES_CEDI_CONFIG.map((s) => (
                              <option key={s.id} value={s.id} disabled={s.id === nuevoTrasladoForm.sedeOrigenId}>
                                📍 {s.nombre} {s.id === nuevoTrasladoForm.sedeOrigenId ? '(Origen actual)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Logística y Transporte */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Empresa Transportadora
                          </label>
                          <select
                            value={nuevoTrasladoForm.transportadora}
                            onChange={(e) => setNuevoTrasladoForm({ ...nuevoTrasladoForm, transportadora: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-800 font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                          >
                            <option value="Flota Propia Pintuco CEDI">Flota Propia Pintuco CEDI</option>
                            <option value="Coordinadora Mercantil">Coordinadora Mercantil</option>
                            <option value="Servientrega">Servientrega</option>
                            <option value="Envía Colvanes">Envía Colvanes</option>
                            <option value="TCC Carga Masiva">TCC Carga Masiva</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            N° Guía / Manifiesto de Carga
                          </label>
                          <input
                            type="text"
                            value={nuevoTrasladoForm.numeroGuia}
                            onChange={(e) => setNuevoTrasladoForm({ ...nuevoTrasladoForm, numeroGuia: e.target.value })}
                            placeholder="Ej. MAN-881290-BOG"
                            className="w-full p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 font-mono text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Fecha Estimada de Llegada *
                          </label>
                          <input
                            type="date"
                            required
                            value={nuevoTrasladoForm.fechaEstimadaLlegada}
                            onChange={(e) => setNuevoTrasladoForm({ ...nuevoTrasladoForm, fechaEstimadaLlegada: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500/20"
                          />
                        </div>
                      </div>

                      {/* Items / Variantes a Trasladar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-extrabold text-slate-900 text-xs">
                            Variantes y Cantidades a Enviar
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const randomItem = (inventario || [])[Math.floor(Math.random() * (inventario || []).length)];
                              setNuevoTrasladoForm({
                                ...nuevoTrasladoForm,
                                items: [
                                  ...nuevoTrasladoForm.items,
                                  {
                                    sku: randomItem?.sku || 'PIN-VTX-01-BLA-1GL',
                                    cantidadEnviada: 10,
                                    loteFabricacion: `LOT-TR-${new Date().getFullYear()}`,
                                  },
                                ],
                              });
                            }}
                            className="text-xs text-cyan-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Agregar Otra Variante</span>
                          </button>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-2xs">
                          {nuevoTrasladoForm.items.map((it, idx) => {
                            const foundItem = (inventario || []).find((i) => i.sku === it.sku);
                            const stockDisponibleOrigen = foundItem ? getStockEnSede(foundItem, nuevoTrasladoForm.sedeOrigenId) : 0;

                            return (
                              <div key={idx} className="p-3 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                                <div className="flex-1">
                                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">
                                    Producto / SKU ({stockDisponibleOrigen} Unds en origen)
                                  </label>
                                  <select
                                    value={it.sku}
                                    onChange={(e) => {
                                      const nextItems = [...nuevoTrasladoForm.items];
                                      nextItems[idx].sku = e.target.value;
                                      setNuevoTrasladoForm({ ...nuevoTrasladoForm, items: nextItems });
                                    }}
                                    className="w-full p-2 rounded-lg bg-white border border-slate-300 font-mono text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                  >
                                    {(inventario || []).slice(0, 40).map((inv) => (
                                      <option key={inv.sku} value={inv.sku}>
                                        {inv.sku} - {inv.nombre}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="w-full sm:w-28">
                                  <label className="text-[10px] text-slate-500 font-bold block mb-0.5">
                                    Cantidad Unds
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="5000"
                                    required
                                    value={it.cantidadEnviada}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseInt(e.target.value) || 0);
                                      const nextItems = [...nuevoTrasladoForm.items];
                                      nextItems[idx].cantidadEnviada = val;
                                      setNuevoTrasladoForm({ ...nuevoTrasladoForm, items: nextItems });
                                    }}
                                    className="w-full p-2 rounded-lg bg-white border border-slate-300 font-mono font-black text-right text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                                  />
                                </div>

                                {nuevoTrasladoForm.items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextItems = nuevoTrasladoForm.items.filter((_, i) => i !== idx);
                                      setNuevoTrasladoForm({ ...nuevoTrasladoForm, items: nextItems });
                                    }}
                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg self-end sm:self-center cursor-pointer transition-colors"
                                    title="Quitar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Observaciones */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Observaciones / Justificación del Traslado
                        </label>
                        <input
                          type="text"
                          value={nuevoTrasladoForm.observaciones}
                          onChange={(e) => setNuevoTrasladoForm({ ...nuevoTrasladoForm, observaciones: e.target.value })}
                          placeholder="Ej. Reabastecimiento por licitación constructora en sede receptora."
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-200 text-[11px] text-cyan-950 font-medium">
                        ℹ️ <strong>Impacto Inmediato:</strong> Al despachar, el sistema restará las unidades de la sede origen (<strong>{SEDES_CEDI_CONFIG.find(s => s.id === nuevoTrasladoForm.sedeOrigenId)?.nombre}</strong>) y registrará la salida en su Kardex. La remisión quedará <em>En Tránsito</em> hacia <strong>{SEDES_CEDI_CONFIG.find(s => s.id === nuevoTrasladoForm.sedeDestinoId)?.nombre}</strong>.
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsNuevoTrasladoModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-[#001D3D] hover:bg-[#002D5C] text-white font-bold shadow-xs hover:shadow-sm cursor-pointer flex items-center gap-1.5 transition-all active:scale-[0.99]"
                        >
                          <Truck className="w-4 h-4 text-cyan-300" />
                          <span>Despachar Traslado & Descontar de Origen</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* 7. Modal: Corroboración y Recepción Física de Traslado Inter-Sedes (Suma Directa en Destino) */}
              {isRecepcionTrasladoModalOpen && selectedTrasladoForRecepcion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
                  <div className="w-full max-w-3xl bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-50 text-cyan-900 border border-cyan-200 uppercase tracking-wider">
                            Recepción Física de Remisión
                          </span>
                          <span className="text-xs text-slate-400 font-medium">Traslado Inter-CEDI</span>
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1">
                          Corroboración de Envío: {selectedTrasladoForRecepcion.numeroRemision}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Procedente de: <strong className="text-slate-800 font-bold">{selectedTrasladoForRecepcion.sedeOrigenNombre}</strong> | Guía: <strong className="text-slate-800 font-bold">{selectedTrasladoForRecepcion.numeroGuia || 'N/A'}</strong> ({selectedTrasladoForRecepcion.transportadora})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRecepcionTrasladoModalOpen(false);
                          setSelectedTrasladoForRecepcion(null);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleConfirmRecepcionTraslado} className="space-y-4 text-xs">
                      {/* Cabecera de Recepción */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 sm:p-4 rounded-xl bg-cyan-50/50 border border-cyan-200/80">
                        <div>
                          <label className="block font-bold text-cyan-950 mb-1">
                            📍 Sede CEDI de Ingreso *
                          </label>
                          <select
                            value={recepcionTrasladoForm.sedeRecepcionId}
                            onChange={(e) => setRecepcionTrasladoForm({ ...recepcionTrasladoForm, sedeRecepcionId: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-white border border-cyan-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                          >
                            {SEDES_CEDI_CONFIG.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-cyan-950 mb-1">
                            📅 Fecha de Recepción Física *
                          </label>
                          <input
                            type="date"
                            required
                            value={recepcionTrasladoForm.fechaRecepcion}
                            onChange={(e) => setRecepcionTrasladoForm({ ...recepcionTrasladoForm, fechaRecepcion: e.target.value })}
                            className="w-full p-2.5 rounded-xl bg-white border border-cyan-300 font-bold text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-cyan-950 mb-1">
                            🏷️ N° Lote de Fabricación *
                          </label>
                          <input
                            type="text"
                            required
                            value={recepcionTrasladoForm.loteFabricacion}
                            onChange={(e) => setRecepcionTrasladoForm({ ...recepcionTrasladoForm, loteFabricacion: e.target.value })}
                            placeholder="Ej. LOT-2026-TR-881"
                            className="w-full p-2.5 rounded-xl bg-white border border-cyan-300 font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                          />
                        </div>
                      </div>

                      {/* Tabla de Corroboración de Items */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-extrabold text-slate-900 text-xs">
                            Conteo Físico por Variante (Color + Presentación)
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const fullRec: Record<string, number> = {};
                              selectedTrasladoForRecepcion.items.forEach((it) => {
                                fullRec[it.sku] = it.cantidadEnviada;
                              });
                              setRecepcionTrasladoForm({ ...recepcionTrasladoForm, cantidadesPorSku: fullRec });
                            }}
                            className="text-xs text-cyan-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Marcar Todo Recibido Conforme al 100%</span>
                          </button>
                        </div>

                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                                <th className="py-2.5 px-3">Código SKU</th>
                                <th className="py-2.5 px-3">Referencia / Producto</th>
                                <th className="py-2.5 px-3">Presentación</th>
                                <th className="py-2.5 px-3 text-center">Despachado (Origen)</th>
                                <th className="py-2.5 px-3 text-right">Cantidad Real Recibida</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedTrasladoForRecepcion.items.map((it) => {
                                const currentVal = recepcionTrasladoForm.cantidadesPorSku[it.sku] !== undefined
                                  ? recepcionTrasladoForm.cantidadesPorSku[it.sku]
                                  : it.cantidadEnviada;

                                return (
                                  <tr key={it.sku} className="hover:bg-slate-50/70">
                                    <td className="py-2.5 px-3 font-mono font-bold text-cyan-950 text-[11px]">
                                      {it.sku}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <strong className="text-slate-900 block font-bold text-xs">
                                        {it.productoNombre}
                                      </strong>
                                      {it.color && (
                                        <span className="text-[10px] text-slate-500 font-medium">
                                          Tono: {it.color}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-bold">
                                        {it.presentacion}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                                      {it.cantidadEnviada} Unds
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <input
                                          type="number"
                                          min="0"
                                          max="10000"
                                          required
                                          value={currentVal}
                                          onChange={(e) => {
                                            const val = Math.max(0, parseInt(e.target.value) || 0);
                                            setRecepcionTrasladoForm({
                                              ...recepcionTrasladoForm,
                                              cantidadesPorSku: {
                                                ...recepcionTrasladoForm.cantidadesPorSku,
                                                [it.sku]: val,
                                              },
                                            });
                                          }}
                                          className="w-24 p-1.5 rounded-lg bg-white border border-slate-300 font-mono font-black text-right text-xs text-cyan-950 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                        />
                                        <span className="text-[11px] text-slate-500 font-bold">Unds</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Observaciones */}
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Observaciones de Recepción / Novedades de Transporte
                        </label>
                        <input
                          type="text"
                          value={recepcionTrasladoForm.observaciones}
                          onChange={(e) => setRecepcionTrasladoForm({ ...recepcionTrasladoForm, observaciones: e.target.value })}
                          placeholder="Ej. Carga recibida sin novedades, precintos y empaques en perfecto estado."
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-200 text-[11px] text-cyan-950 font-medium">
                        ℹ️ <strong>Incremento Directo en Bodega:</strong> Al confirmar, las unidades físicas recibidas se sumarán inmediatamente al stock disponible del CEDI seleccionado (<strong>{SEDES_CEDI_CONFIG.find(s => s.id === recepcionTrasladoForm.sedeRecepcionId)?.nombre}</strong>) y se asentará la entrada en el Kardex.
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsRecepcionTrasladoModalOpen(false);
                            setSelectedTrasladoForRecepcion(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-xs hover:shadow-sm cursor-pointer flex items-center gap-1.5 transition-all active:scale-[0.99]"
                        >
                          <Boxes className="w-4 h-4 text-white" />
                          <span>Confirmar Recepción & Sumar a Inventario CEDI</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* =========================================================================
              MÓDULO 7: ATENCIÓN AL CLIENTE (SAC) CONECTADO A LA WEB PÚBLICA
          ========================================================================= */}
          {activeTab === 'sac' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 uppercase">
                      Integración Web Pública Activa
                    </span>
                    <span className="text-xs text-slate-400">Recepción Inmediata</span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">Bandeja de Atención al Cliente (SAC)</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Respuestas oficiales a mensajes, chats y radicados de visitantes de la página de ColorLink.
                  </p>
                </div>
              </div>

              {/* Layout Dividido: Bandeja a la izquierda, Conversación a la derecha */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
                
                {/* Columna Izquierda: Lista de Tickets */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-4 space-y-3 flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-black text-xs text-slate-900">Casos Radicados ({ticketsSAC.length})</span>
                    <span className="text-[10px] text-emerald-700 font-bold">SLA: &lt; 8 Horas</span>
                  </div>

                  <div className="flex-1 space-y-2.5 overflow-y-auto">
                    {ticketsSAC.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                          activeTicket?.id === t.id
                            ? 'bg-blue-50 border-blue-900 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="font-mono text-xs text-blue-950 font-black">{t.radicado}</strong>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.estado === 'Nuevo' ? 'bg-rose-100 text-rose-800' :
                            t.estado === 'En proceso' ? 'bg-cyan-100 text-cyan-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {t.estado}
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{t.asunto}</h4>
                        
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate max-w-[140px]">{t.clienteNombre}</span>
                          <span className="text-[10px]">{t.fechaCreacion.slice(5)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna Derecha: Hilo de Conversación y Redacción */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4">
                  {activeTicket ? (
                    <>
                      {/* Cabecera del Caso */}
                      <div className="border-b border-slate-200 pb-3 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono">
                              {activeTicket.radicado} • {activeTicket.canal}
                            </span>
                            <h3 className="text-base font-black text-slate-900 mt-1">{activeTicket.asunto}</h3>
                          </div>
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                            Estado: {activeTicket.estado}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-4 pt-1">
                          <span>Cliente: <strong className="text-slate-800">{activeTicket.clienteNombre}</strong></span>
                          <span>Correo: <strong className="text-slate-800 font-mono">{activeTicket.clienteEmail}</strong></span>
                        </div>
                      </div>

                      {/* Hilo de Mensajes */}
                      <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] p-2">
                        {activeTicket.mensajes.map((m) => (
                          <div
                            key={m.id}
                            className={`p-3.5 rounded-2xl text-xs space-y-1 max-w-[85%] ${
                              m.esNotaInterna
                                ? 'bg-amber-50 border border-amber-200 text-amber-950 ml-auto'
                                : m.remitenteTipo === 'agente'
                                ? 'bg-blue-900 text-white ml-auto shadow-xs'
                                : 'bg-slate-100 text-slate-800 mr-auto'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 font-bold">
                              <span>{m.remitenteNombre} {m.esNotaInterna && '• NOTA INTERNA'}</span>
                              <span>{m.fecha}</span>
                            </div>
                            <p className="leading-relaxed">{m.texto}</p>
                          </div>
                        ))}
                      </div>

                      {/* Caja de Respuesta */}
                      <form onSubmit={handleSendTicketReply} className="pt-3 border-t border-slate-200 space-y-2.5">
                        <textarea
                          rows={3}
                          value={agentReplyText}
                          onChange={(e) => setAgentReplyText(e.target.value)}
                          placeholder={isInternalNote ? "Escribe una nota interna (solo visible para personal)..." : "Redacta tu respuesta oficial al cliente..."}
                          className={`w-full p-3 text-xs rounded-2xl border outline-none resize-none ${
                            isInternalNote ? 'bg-amber-50/60 border-amber-300' : 'bg-slate-50 border-slate-200'
                          }`}
                        />

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isInternalNote}
                              onChange={(e) => setIsInternalNote(e.target.checked)}
                            />
                            <span>Guardar como nota interna confidencial</span>
                          </label>

                          <button
                            type="submit"
                            disabled={!agentReplyText.trim()}
                            className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isInternalNote ? 'Guardar Nota' : 'Enviar al Cliente'}</span>
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <div className="text-center py-20 text-slate-400 text-xs">
                      Selecciona una conversación de la bandeja.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* =========================================================================
              MÓDULO 8: DOCUMENTOS & NORMAS NTC 1335
          ========================================================================= */}
          {activeTab === 'documentos' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <h2 className="text-xl font-black text-slate-900">Repositorio Normativo y Fichas Técnicas</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Documentación oficial de ensayos de laboratorio, hojas de seguridad MSDS y procedimientos NTC 1335.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-900 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Norma ICONTEC NTC 1335 (Tipo 1)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Especificaciones técnicas obligatorias de lavabilidad, abrasión húmeda y poder de cubrimiento para recubrimientos arquitectónicos.
                  </p>
                  <span className="text-[10px] font-black text-emerald-700 block">Vigente 2026 • Verificado</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Fichas de Seguridad MSDS (SGA)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hojas técnicas de manejo de pigmentos, biocidas y solventes bajo el Sistema Globalmente Armonizado de clasificación.
                  </p>
                  <span className="text-[10px] font-black text-emerald-700 block">14 Fichas Disponibles</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Procedimientos Operativos POE</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Protocolos de calibración de dosificadoras tintométricas y toma de muestras en cuarentena para despachos B2B.
                  </p>
                  <span className="text-[10px] font-black text-emerald-700 block">Aprobado por Dirección</span>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MÓDULO 9: AUDITORÍA & INFORMES
          ========================================================================= */}
          {activeTab === 'auditoria' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Registro de Auditoría & Trazabilidad</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Historial inmutable de acciones administrativas, movimientos de inventario y respuestas emitidas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportCSV('auditoria')}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs"
                >
                  Exportar Auditoría CSV
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                        <th className="py-3 px-4">Fecha y Hora</th>
                        <th className="py-3 px-4">Usuario Responsable</th>
                        <th className="py-3 px-4">Módulo</th>
                        <th className="py-3 px-4">Acción</th>
                        <th className="py-3 px-4">Detalle Técnico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditoria.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{a.fecha}</td>
                          <td className="py-3 px-4">
                            <strong className="text-slate-900 block">{a.usuarioNombre}</strong>
                            <span className="text-[10px] text-slate-400">{a.usuarioRol}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold">
                              {a.modulo}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">{a.accion}</td>
                          <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate">{a.detalle}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* =========================================================================
          MODAL DE BÚSQUEDA GLOBAL MULTIMÓDULO (CTRL+K)
      ========================================================================= */}
      {globalSearchOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setGlobalSearchOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <Search className="w-5 h-5 text-cyan-600" />
              <input
                type="text"
                autoFocus
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder="Busca funcionarios, tareas, áreas, tickets SAC, referencias..."
                className="w-full text-sm font-bold text-slate-900 outline-none"
              />
              <button type="button" onClick={() => setGlobalSearchOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-3 text-xs">
              {globalSearchResults ? (
                <>
                  {globalSearchResults.tareas.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">Tareas ({globalSearchResults.tareas.length})</span>
                      {globalSearchResults.tareas.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTaskForDetail(t);
                            setActiveTab('tareas');
                            setGlobalSearchOpen(false);
                          }}
                          className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex justify-between"
                        >
                          <span className="font-bold text-slate-900">{t.titulo}</span>
                          <span className="text-slate-400">{t.areaNombre}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {globalSearchResults.funcionarios.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">Funcionarios ({globalSearchResults.funcionarios.length})</span>
                      {globalSearchResults.funcionarios.map((f) => (
                        <div
                          key={f.id}
                          onClick={() => {
                            setActiveTab('funcionarios');
                            setGlobalSearchOpen(false);
                          }}
                          className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex justify-between"
                        >
                          <span className="font-bold text-slate-900">{f.nombre} ({f.cargo})</span>
                          <span className="text-slate-400">{f.email}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {globalSearchResults.tickets.length > 0 && (
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-400 block mb-1">Tickets SAC ({globalSearchResults.tickets.length})</span>
                      {globalSearchResults.tickets.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedTicketId(s.id);
                            setActiveTab('sac');
                            setGlobalSearchOpen(false);
                          }}
                          className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex justify-between"
                        >
                          <span className="font-bold text-slate-900">{s.radicado} - {s.asunto}</span>
                          <span className="text-slate-400">{s.clienteNombre}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  Comienza a escribir para buscar en toda la plataforma corporativa.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
