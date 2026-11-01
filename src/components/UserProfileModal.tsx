import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UserSession, UserAddress, COLORLINKOrder } from '../types';
import { 
  getPintucoUsersDb, 
  savePintucoUsersDb, 
  normalizeEmail, 
  normalizeDocument,
  syncActiveSession 
} from '../utils/userDatabase';
import { COLOR_PALETTE } from '../data/pintucoData';
import { SectorPaintAvatar } from './UserProfileDropdown';
import { supabase } from '../lib/supabaseClient';
import { fetchPendingOrdersFromSupabase } from '../services/ordersService';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  MapPin, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Save, 
  ShieldCheck, 
  Building2, 
  Home, 
  Briefcase,
  AlertCircle,
  FileText,
  Truck,
  PackageCheck,
  Copy,
  ShoppingBag,
  ExternalLink,
  Search,
  Clock,
  Calendar,
  RotateCcw,
  Sparkles,
  Download,
  Filter,
  Database,
  LogOut,
  Camera,
  Bell,
  MessageSquare,
  Send,
  CheckCircle2,
  HeadphonesIcon
} from 'lucide-react';
import { getTicketsSAC, TicketSAC, radicarConsultaWeb } from '../services/corporateService';

export const DEFAULT_PROFILE_MOCK_ORDERS: COLORLINKOrder[] = [
  {
    id: 'clk-mock-1',
    numeroOrden: '#CLK-8492',
    fechaCreacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    form: {
      tipo_documento: 'Cédula de Ciudadanía',
      documento: '1020304050',
      nombre_razon_social: 'Cliente Pintuco',
      responsable_contacto: 'Cliente Pintuco',
      canal_entrada: 'Portal Web B2B',
      ciudad: 'Medellín',
      departamento: 'Antioquia',
      tipo_obra: 'Pintura Fachada Edificio Norte',
      area_m2: 120,
      fecha_requerida: '2026-09-30',
      producto_deseado: 'Koraza Protección 5 Años',
      superficie: 'Pañete / Revoque Liso',
      ambiente: 'Exterior Fachada',
      condicion: 'Buen Estado / Repinte',
      color_acabado: 'Gris Basalto',
      direccion_obra: 'Calle 10 #43E-20, El Poblado',
    },
    calculo: {
      rendimientoBase: 30,
      factorCorreccion: 1,
      esSuperficieRugosa: false,
      requiereSellador: false,
      rendimientoSellador: 40,
      metodoAplicacion: 'Rodillo Felpa 3/8"',
      margenDesperdicioPct: 10,
      factorDesperdicio: 1.1,
      consumoPinturaNeto: 6.5,
      galonesPintura: 7,
      galonesSellador: 0,
      productoSugerido: 'Koraza Protección 5 Años',
      productoSelladorSugerido: 'Sellador Antialcalino Pintuco',
      lineaProducto: 'Pintuco',
      tratamientoPrevio: 'Limpieza superficial',
      prioridad: 'Alta',
      diasRestantes: 2,
      alertaDespacho: 'Alistamiento Prioritario en Bodega',
      markdownOutput: '',
      cuñetesPintura: 1,
      galonesSueltosPintura: 2,
      cuñetesSellador: 0,
      galonesSueltosSellador: 0,
      skuPinturaSugerido: 'KRZ-5Y-01',
      skuSelladorSugerido: '',
      costo_total_estimado: 485000,
    },
    estado: 'En Bodega',
    total: 485000,
    customerName: 'Cliente Pintuco',
    customerDocument: '1020304050',
    ciudadEntrega: 'Medellín',
    direccionEntrega: 'Calle 10 #43E-20, El Poblado',
  },
  {
    id: 'clk-mock-2',
    numeroOrden: '#CLK-7301',
    fechaCreacion: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    form: {
      tipo_documento: 'Cédula de Ciudadanía',
      documento: '1020304050',
      nombre_razon_social: 'Cliente Pintuco',
      responsable_contacto: 'Cliente Pintuco',
      canal_entrada: 'Portal Web B2B',
      ciudad: 'Bogotá D.C.',
      departamento: 'Cundinamarca',
      tipo_obra: 'Renovación Sala y Comedor',
      area_m2: 65,
      fecha_requerida: '2026-09-20',
      producto_deseado: 'Viniltex Avanzado Antibacterial',
      superficie: 'Pintura Existente',
      ambiente: 'Interior',
      condicion: 'Buen Estado / Repinte',
      color_acabado: 'Blanco Puro Mate',
      direccion_obra: 'Carrera 15 #93-40, Chicó',
    },
    calculo: {
      rendimientoBase: 32,
      factorCorreccion: 1,
      esSuperficieRugosa: false,
      requiereSellador: false,
      rendimientoSellador: 40,
      metodoAplicacion: 'Rodillo Microfibra',
      margenDesperdicioPct: 10,
      factorDesperdicio: 1.1,
      consumoPinturaNeto: 4.2,
      galonesPintura: 5,
      galonesSellador: 0,
      productoSugerido: 'Viniltex Avanzado Antibacterial',
      productoSelladorSugerido: '',
      lineaProducto: 'Pintuco',
      tratamientoPrevio: 'Lijado suave',
      prioridad: 'Normal',
      diasRestantes: 0,
      alertaDespacho: 'Entregado a entera satisfacción',
      markdownOutput: '',
      cuñetesPintura: 1,
      galonesSueltosPintura: 0,
      cuñetesSellador: 0,
      galonesSueltosSellador: 0,
      skuPinturaSugerido: 'VTX-AVZ-01',
      skuSelladorSugerido: '',
      costo_total_estimado: 295000,
    },
    estado: 'Entregado',
    total: 295000,
    customerName: 'Cliente Pintuco',
    customerDocument: '1020304050',
    ciudadEntrega: 'Bogotá D.C.',
    direccionEntrega: 'Carrera 15 #93-40, Chicó',
  },
  {
    id: 'clk-mock-3',
    numeroOrden: '#CLK-5520',
    fechaCreacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    form: {
      tipo_documento: 'Cédula de Ciudadanía',
      documento: '1020304050',
      nombre_razon_social: 'Cliente Pintuco',
      responsable_contacto: 'Cliente Pintuco',
      canal_entrada: 'Portal Web B2B',
      ciudad: 'Cali',
      departamento: 'Valle del Cauca',
      tipo_obra: 'Impermeabilización Terraza Principal',
      area_m2: 150,
      fecha_requerida: '2026-10-05',
      producto_deseado: 'Aquablock Techos & Muros 7 Años',
      superficie: 'Concreto Vaciado',
      ambiente: 'Exterior Fachada',
      condicion: 'Humedad / Filtraciones',
      color_acabado: 'Rojo Teja Colonial',
      direccion_obra: 'Avenida 6N #28-15, Santa Mónica',
    },
    calculo: {
      rendimientoBase: 25,
      factorCorreccion: 1.15,
      esSuperficieRugosa: true,
      requiereSellador: true,
      rendimientoSellador: 35,
      metodoAplicacion: 'Rodillo Especial Impermeabilizante',
      margenDesperdicioPct: 15,
      factorDesperdicio: 1.15,
      consumoPinturaNeto: 9.8,
      galonesPintura: 11,
      galonesSellador: 3,
      productoSugerido: 'Aquablock Techos & Muros 7 Años',
      productoSelladorSugerido: 'Sellador Antihumedad Silicona',
      lineaProducto: 'Pintuco',
      tratamientoPrevio: 'Lavado a presión e imprimación',
      prioridad: 'Alta',
      diasRestantes: 5,
      alertaDespacho: 'Cotización Técnica Registrada',
      markdownOutput: '',
      cuñetesPintura: 2,
      galonesSueltosPintura: 1,
      cuñetesSellador: 0,
      galonesSueltosSellador: 3,
      skuPinturaSugerido: 'AQB-7Y-01',
      skuSelladorSugerido: 'PIN-AQB-SL',
      costo_total_estimado: 640000,
    },
    estado: 'Cotización Guardada',
    total: 640000,
    customerName: 'Cliente Pintuco',
    customerDocument: '1020304050',
    ciudadEntrega: 'Cali',
    direccionEntrega: 'Avenida 6N #28-15, Santa Mónica',
  },
  {
    id: 'clk-mock-4',
    numeroOrden: '#CLK-6110',
    fechaCreacion: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    form: {
      tipo_documento: 'Cédula de Ciudadanía',
      documento: '1020304050',
      nombre_razon_social: 'Cliente Pintuco',
      responsable_contacto: 'Cliente Pintuco',
      canal_entrada: 'Portal Web B2B',
      ciudad: 'Barranquilla',
      departamento: 'Atlántico',
      tipo_obra: 'Habitaciones & Pasillos Interiores',
      area_m2: 80,
      fecha_requerida: '2026-10-02',
      producto_deseado: 'Viniltex Acriltex Lavable',
      superficie: 'Drywall / Yeso',
      ambiente: 'Interior',
      condicion: 'Buen Estado / Repinte',
      color_acabado: 'Azul Noche Cósmico',
      direccion_obra: 'Carrera 53 #76-120, El Prado',
    },
    calculo: {
      rendimientoBase: 30,
      factorCorreccion: 1,
      esSuperficieRugosa: false,
      requiereSellador: false,
      rendimientoSellador: 40,
      metodoAplicacion: 'Rodillo Felpa 3/8"',
      margenDesperdicioPct: 10,
      factorDesperdicio: 1.1,
      consumoPinturaNeto: 5.3,
      galonesPintura: 6,
      galonesSellador: 0,
      productoSugerido: 'Viniltex Acriltex Lavable',
      productoSelladorSugerido: '',
      lineaProducto: 'Pintuco',
      tratamientoPrevio: 'Limpieza superficial',
      prioridad: 'Normal',
      diasRestantes: 3,
      alertaDespacho: 'En Alistamiento de Tinturado',
      markdownOutput: '',
      cuñetesPintura: 1,
      galonesSueltosPintura: 1,
      cuñetesSellador: 0,
      galonesSueltosSellador: 0,
      skuPinturaSugerido: 'VTX-ACR-01',
      skuSelladorSugerido: '',
      costo_total_estimado: 320000,
    },
    estado: 'En Procesamiento',
    total: 320000,
    customerName: 'Cliente Pintuco',
    customerDocument: '1020304050',
    ciudadEntrega: 'Barranquilla',
    direccionEntrega: 'Carrera 53 #76-120, El Prado',
  },
];

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  onUpdateUserSession: (updatedSession: UserSession) => void;
  onShowToast: (msg: string) => void;
  initialTab?: 'datos' | 'pedidos' | 'orders' | 'direcciones' | 'seguridad' | 'solicitudes';
  onNavigateToTracking?: () => void;
  onNavigateToStore?: () => void;
  onOpenChat?: () => void;
  orders?: COLORLINKOrder[];
  onReorder?: (order: COLORLINKOrder) => void;
  onViewDetailPDF?: (order: COLORLINKOrder) => void;
  onResetOrders?: (orders: COLORLINKOrder[]) => void;
  onLogout?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userSession,
  onUpdateUserSession,
  onShowToast,
  initialTab = 'datos',
  onNavigateToTracking,
  onNavigateToStore,
  onOpenChat,
  orders = [],
  onReorder,
  onViewDetailPDF,
  onResetOrders,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'datos' | 'pedidos' | 'orders' | 'seguridad' | 'direcciones' | 'solicitudes'>(
    (initialTab as any) === 'orders' ? 'orders' : (initialTab as any) === 'solicitudes' ? 'solicitudes' : initialTab
  );

  const [supabasePendingOrders, setSupabasePendingOrders] = useState<COLORLINKOrder[]>([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(false);

  // Sincronización de tickets de SAC / PQRS
  const [profileTickets, setProfileTickets] = useState<TicketSAC[]>(() => {
    try {
      return getTicketsSAC();
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleSyncTickets = () => {
      try {
        setProfileTickets(getTicketsSAC());
      } catch {}
    };
    window.addEventListener('colorlink_tickets_updated', handleSyncTickets);
    return () => window.removeEventListener('colorlink_tickets_updated', handleSyncTickets);
  }, []);

  const [newProfilePqrsOpen, setNewProfilePqrsOpen] = useState(false);
  const [newProfilePqrsAsunto, setNewProfilePqrsAsunto] = useState('');
  const [newProfilePqrsCategoria, setNewProfilePqrsCategoria] = useState<TicketSAC['categoria']>('Asesoría Técnica Pinturas');
  const [newProfilePqrsMensaje, setNewProfilePqrsMensaje] = useState('');
  const [isSubmittingProfilePqrs, setIsSubmittingProfilePqrs] = useState(false);

  // Sincronizar tab inicial cuando cambie
  useEffect(() => {
    if (initialTab) {
      setActiveTab((initialTab as any) === 'orders' ? 'orders' : (initialTab as any) === 'solicitudes' ? 'solicitudes' : initialTab);
    }
  }, [initialTab]);

  // Consulta de 'Pedidos Pendientes' en Supabase para el usuario activo
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'pedidos' || activeTab === 'orders') {
      let isMounted = true;
      async function querySupabasePendingOrders() {
        setIsLoadingSupabase(true);
        const userEmail = (userSession?.email || '').trim().toLowerCase();
        try {
          if (userEmail) {
            // Consulta exacta solicitada en Supabase:
            const { data: dbOrders, error } = await supabase
              .from('orders')
              .select('*')
              .eq('user_email', userEmail)
              .in('status', ['pending', 'processing', 'preparing', 'pendiente', 'en_proceso', 'en_preparacion', 'Pendiente Alistamiento', 'En Bodega'])
              .order('created_at', { ascending: false });

            if (!error && Array.isArray(dbOrders) && isMounted) {
              const mapped: COLORLINKOrder[] = dbOrders.map((row: any) => ({
                id: row.id || `ord-${Date.now()}`,
                numeroOrden: row.order_number || row.numeroOrden || row.numero_orden || `#CLK-${row.id?.slice(0, 6)}`,
                fechaCreacion: row.created_at || row.fecha_creacion || new Date().toISOString(),
                customerName: row.customer_name || userSession.nombre || 'Cliente Pintuco',
                customerEmail: row.user_email || userEmail,
                customerPhone: row.customer_phone || userSession.telefono || '',
                customerDocument: row.customer_document || userSession.documento || '',
                direccionEntrega: row.shipping_address || row.direccionEntrega || 'Dirección de obra',
                ciudadEntrega: row.city || row.ciudadEntrega || 'Colombia',
                departamentoEntrega: row.department || row.departamentoEntrega || '',
                estado: row.status === 'pending' ? 'Pendiente Alistamiento' : row.status === 'processing' ? 'En Bodega' : row.status || 'Pendiente Alistamiento',
                total: Number(row.total) || 0,
                items: Array.isArray(row.items) ? row.items : [],
              }));
              setSupabasePendingOrders(mapped);
            } else {
              const fallback = await fetchPendingOrdersFromSupabase(userEmail);
              if (isMounted) setSupabasePendingOrders(fallback.data);
            }
          } else {
            const fallback = await fetchPendingOrdersFromSupabase('');
            if (isMounted) setSupabasePendingOrders(fallback.data);
          }
        } catch (err) {
          console.warn('Error cargando pedidos pendientes en Supabase:', err);
          const fallback = await fetchPendingOrdersFromSupabase(userEmail);
          if (isMounted) setSupabasePendingOrders(fallback.data);
        } finally {
          if (isMounted) setIsLoadingSupabase(false);
        }
      }
      querySupabasePendingOrders();
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, activeTab, userSession?.email]);

  // Filtros de la pestaña "Mis Pedidos / Proyectos Radicados"
  const [orderFilterQuery, setOrderFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'En Procesamiento' | 'Entregados' | 'Cotizaciones'>('Todos');
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Helper para resolver el color hexadecimal a partir del nombre Pintuco
  const resolveColorHex = (colorName?: string): string => {
    if (!colorName) return '#4A5568';
    const match = COLOR_PALETTE.find(
      (c) =>
        c.name.toLowerCase() === colorName.toLowerCase() ||
        c.shortName.toLowerCase() === colorName.toLowerCase() ||
        colorName.toLowerCase().includes(c.shortName.toLowerCase())
    );
    if (match) return match.hex;

    const lower = colorName.toLowerCase();
    if (lower.includes('basalto')) return '#4A5568';
    if (lower.includes('blanco') || lower.includes('white')) return '#F8FAFC';
    if (lower.includes('niebla') || lower.includes('gris') || lower.includes('gray')) return '#64748B';
    if (lower.includes('azul') || lower.includes('blue') || lower.includes('cósmico')) return '#1E3A8A';
    if (lower.includes('rojo') || lower.includes('red') || lower.includes('teja')) return '#991B1B';
    if (lower.includes('almendra') || lower.includes('marfil') || lower.includes('arena') || lower.includes('beige')) return '#E2D9CC';
    if (lower.includes('verde') || lower.includes('green')) return '#065F46';
    if (lower.includes('amarillo') || lower.includes('yellow') || lower.includes('ocre')) return '#D97706';
    if (lower.includes('terracota') || lower.includes('arcilla')) return '#C2410C';
    return '#004B93';
  };

  // Helper para formatear la cantidad total (Cuñetes + Galones)
  const formatQuantity = (order: COLORLINKOrder): string => {
    const calc = order.calculo;
    if (calc) {
      if (calc.cuñetesPintura > 0 && calc.galonesSueltosPintura > 0) {
        return `${calc.cuñetesPintura} Cuñete${calc.cuñetesPintura > 1 ? 's' : ''} + ${calc.galonesSueltosPintura} Galón${calc.galonesSueltosPintura > 1 ? 'es' : ''}`;
      } else if (calc.cuñetesPintura > 0) {
        return `${calc.cuñetesPintura} Cuñete${calc.cuñetesPintura > 1 ? 's' : ''} (5 Gal)`;
      } else if (calc.galonesPintura > 0) {
        return `${calc.galonesPintura} Galón${calc.galonesPintura > 1 ? 'es' : ''}`;
      }
    }
    if (order.items && order.items.length > 0) {
      return order.items.map((i) => `${i.cantidad} ${i.presentacion || 'Gal'}`).join(' + ');
    }
    return '1 Cuñete + 1 Galón';
  };

  // Helper para renderizar la etiqueta de estado con el color correspondiente (Dark Theme)
  const renderStatusBadge = (estado?: string) => {
    const st = (estado || 'Cotización').toLowerCase();
    if (st.includes('entregado')) {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border bg-emerald-950/80 text-emerald-300 border-emerald-600/70 inline-flex items-center gap-1 shadow-xs">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Entregado</span>
        </span>
      );
    }
    if (
      st.includes('bodega') ||
      st.includes('procesamiento') ||
      st.includes('alistamiento') ||
      st.includes('producción') ||
      st.includes('despacho') ||
      st.includes('radicado')
    ) {
      return (
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border bg-blue-950/80 text-blue-300 border-blue-500/70 inline-flex items-center gap-1 shadow-xs">
          <Truck className="w-3 h-3 text-cyan-400" />
          <span>{estado || 'En Bodega'}</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border bg-amber-950/80 text-amber-300 border-amber-600/70 inline-flex items-center gap-1 shadow-xs">
        <Clock className="w-3 h-3 text-amber-400" />
        <span>{estado || 'Cotización Guardada'}</span>
      </span>
    );
  };

  // Helper para formatear fecha de radicación
  const formatDate = (isoString?: string) => {
    if (!isoString) return '25/09/2026';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '25/09/2026';
      return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '25/09/2026';
    }
  };

  // Carga automática de órdenes del usuario combinando Supabase, props.orders y localStorage
  const userOrders = useMemo<COLORLINKOrder[]>(() => {
    const list: COLORLINKOrder[] = [];
    const seen = new Set<string>();
    const userEmail = (userSession?.email || '').trim().toLowerCase();

    const isPendingStatus = (statusStr?: string) => {
      const s = String(statusStr || '').toLowerCase();
      return (
        s.includes('pend') ||
        s.includes('proces') ||
        s.includes('prepar') ||
        s.includes('alistamiento') ||
        s.includes('bodega')
      );
    };

    // 1. Agregar órdenes en tiempo real desde Supabase (tabla 'orders')
    if (Array.isArray(supabasePendingOrders)) {
      supabasePendingOrders.forEach((o) => {
        if (!o) return;
        const key = o.id || o.numeroOrden;
        if (key && !seen.has(key)) {
          seen.add(key);
          list.push(o);
        }
      });
    }

    // 2. Agregar órdenes en tiempo real desde el estado global (props.orders)
    if (Array.isArray(orders)) {
      orders.forEach((o) => {
        if (!o) return;
        const oEmail = (o.customerEmail || o.form?.responsable_contacto || '').trim().toLowerCase();
        if (userEmail && oEmail && oEmail !== userEmail && !oEmail.includes(userEmail)) return;
        if (!isPendingStatus(o.estado)) return;

        const key = o.id || o.numeroOrden;
        if (key && !seen.has(key)) {
          seen.add(key);
          list.push(o);
        }
      });
    }

    // 3. Agregar órdenes almacenadas en localStorage si pertenecen a este usuario y están pendientes
    try {
      const stored = localStorage.getItem('colorlink_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((o) => {
            if (!o) return;
            const oEmail = (o.customerEmail || o.form?.responsable_contacto || '').trim().toLowerCase();
            if (userEmail && oEmail && oEmail !== userEmail && !oEmail.includes(userEmail)) return;
            if (!isPendingStatus(o.estado)) return;

            const key = o.id || o.numeroOrden;
            if (key && !seen.has(key)) {
              seen.add(key);
              list.push(o);
            }
          });
        }
      }
    } catch {}

    // Filtrar posibles restos inválidos si los hubiera
    const cleanedOrders = list.filter((o) => {
      const id = String(o.id || '').toLowerCase();
      const num = String(o.numeroOrden || '').toLowerCase();
      if (id === 'ord-init-1' || id === 'ord-init-2') return false;
      if (id.includes('a93ec3fe') || num.includes('a93ec3fe') || num.includes('sb-a93ec3fe')) return false;
      return true;
    });

    return cleanedOrders;
  }, [orders, supabasePendingOrders, isOpen, userSession?.email, activeTab]);

  // Filtro dinámico e instantáneo en la barra de búsqueda y botones de filtro rápido
  const filteredUserOrders = useMemo(() => {
    return userOrders.filter((order) => {
      // 1. Filtro rápido por chip de estado
      if (statusFilter !== 'Todos') {
        const st = (order.estado || '').toLowerCase();
        if (statusFilter === 'En Procesamiento') {
          const isProc =
            st.includes('bodega') ||
            st.includes('procesamiento') ||
            st.includes('alistamiento') ||
            st.includes('producción') ||
            st.includes('despacho') ||
            st.includes('radicado');
          if (!isProc) return false;
        } else if (statusFilter === 'Entregados') {
          if (!st.includes('entregado')) return false;
        } else if (statusFilter === 'Cotizaciones') {
          if (!st.includes('cotiz')) return false;
        }
      }

      // 2. Filtro instantáneo por barra de búsqueda
      // Criterios: Número de Orden/Cotización, Nombre del Proyecto, Color Seleccionado o Estado
      if (!orderFilterQuery.trim()) return true;
      const q = orderFilterQuery.trim().toLowerCase();
      const qClean = q.replace(/[\#\.\-\s]/g, '');

      const num = (order.numeroOrden || '').toLowerCase();
      const numClean = num.replace(/[\#\.\-\s]/g, '');
      const id = (order.id || '').toLowerCase();
      const idClean = id.replace(/[\#\.\-\s]/g, '');
      const projectName = (order.form?.tipo_obra || (order as any).proyectoNombre || '').toLowerCase();
      const color = (order.form?.color_acabado || '').toLowerCase();
      const status = (order.estado || '').toLowerCase();
      const product = (order.calculo?.productoSugerido || order.form?.producto_deseado || '').toLowerCase();

      return (
        num.includes(q) ||
        (qClean.length > 0 && numClean.includes(qClean)) ||
        id.includes(q) ||
        (qClean.length > 0 && idClean.includes(qClean)) ||
        projectName.includes(q) ||
        color.includes(q) ||
        status.includes(q) ||
        product.includes(q)
      );
    });
  }, [userOrders, statusFilter, orderFilterQuery]);

  // Contador para chips de filtro
  const countForChip = (chip: 'Todos' | 'En Procesamiento' | 'Entregados' | 'Cotizaciones') => {
    if (chip === 'Todos') return userOrders.length;
    return userOrders.filter((order) => {
      const st = (order.estado || '').toLowerCase();
      if (chip === 'En Procesamiento') {
        return (
          st.includes('bodega') ||
          st.includes('procesamiento') ||
          st.includes('alistamiento') ||
          st.includes('producción') ||
          st.includes('despacho') ||
          st.includes('radicado')
        );
      }
      if (chip === 'Entregados') return st.includes('entregado');
      if (chip === 'Cotizaciones') return st.includes('cotiz');
      return false;
    }).length;
  };

  const handleCopyOrder = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedOrderId(code);
    onShowToast(`Número de orden ${code} copiado al portapapeles`);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleViewDetailPDF = (order: COLORLINKOrder) => {
    if (onViewDetailPDF) {
      onViewDetailPDF(order);
    } else {
      onShowToast(`Generando y visualizando PDF de la orden ${order.numeroOrden}...`);
    }
  };

  const handleReorder = (order: COLORLINKOrder) => {
    if (onReorder) {
      onReorder(order);
    } else {
      onShowToast(`Duplicando cotización de ${order.form?.tipo_obra || order.numeroOrden}`);
    }
  };

  // Botón de control / prueba: Permite borrar y restablecer la memoria local de órdenes durante pruebas
  const handleResetLocalStorageOrders = () => {
    try {
      localStorage.removeItem('colorlink_user_orders');
      localStorage.removeItem('colorlink_orders');
      localStorage.setItem('colorlink_user_orders', JSON.stringify(DEFAULT_PROFILE_MOCK_ORDERS));
      localStorage.setItem('colorlink_orders', JSON.stringify(DEFAULT_PROFILE_MOCK_ORDERS));
      if (onResetOrders) {
        onResetOrders(DEFAULT_PROFILE_MOCK_ORDERS);
      }
      onShowToast('Memoria local restablecida con las órdenes de prueba iniciales');
    } catch {
      onShowToast('Error al reiniciar memoria local de pedidos');
    }
  };

  // Datos personales
  const [nombre, setNombre] = useState(userSession.nombre || '');
  const [telefono, setTelefono] = useState(userSession.telefono || '');
  const [email, setEmail] = useState(userSession.email || '');
  const [documento, setDocumento] = useState(userSession.documento || '');
  const [tipoDocumento, setTipoDocumento] = useState<any>(userSession.tipoDocumento || 'Cédula de Ciudadanía');

  // Foto de perfil persistente por usuario en localStorage
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const userEmailNorm = (userSession?.email || email || '').trim().toLowerCase();
  const avatarKey = userEmailNorm ? `colorlink_user_avatar_${userEmailNorm}` : 'colorlink_user_avatar_guest';
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(() => {
    try {
      if (userEmailNorm) {
        return localStorage.getItem(avatarKey);
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    const syncAvatar = () => {
      if (userEmailNorm) {
        try {
          const saved = localStorage.getItem(avatarKey);
          setProfileAvatarUrl(saved || null);
        } catch {
          setProfileAvatarUrl(null);
        }
      } else {
        setProfileAvatarUrl(null);
      }
    };
    syncAvatar();
    window.addEventListener('colorlink_avatar_updated', syncAvatar);
    return () => window.removeEventListener('colorlink_avatar_updated', syncAvatar);
  }, [userEmailNorm, avatarKey]);

  const handleUploadProfileAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && userEmailNorm) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setProfileAvatarUrl(base64);
          try {
            localStorage.setItem(avatarKey, base64);
            window.dispatchEvent(new Event('colorlink_avatar_updated'));
            onShowToast('Foto de perfil actualizada correctamente');
          } catch (err) {
            console.warn('Error guardando avatar en localStorage:', err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Seguridad: Cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Libreta de Direcciones: estrictamente vacía [] por defecto para usuario nuevo
  const [addresses, setAddresses] = useState<UserAddress[]>(() => {
    try {
      const saved = localStorage.getItem('colorlink_user_addresses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filtrar direcciones de prueba antiguas si existían
          const clean = parsed.filter(
            (a: any) =>
              a.id !== 'addr-1' &&
              a.id !== 'addr-2' &&
              a.id !== 'addr-3' &&
              !a.etiqueta?.includes('Santa Marta') &&
              !a.etiqueta?.includes('Bodega Principal')
          );
          if (clean.length > 0) return clean;
        }
      }
    } catch {}
    if (userSession.direcciones && Array.isArray(userSession.direcciones)) {
      const clean = userSession.direcciones.filter(
        (a: any) =>
          a.id !== 'addr-1' &&
          a.id !== 'addr-2' &&
          a.id !== 'addr-3' &&
          !a.etiqueta?.includes('Santa Marta') &&
          !a.etiqueta?.includes('Bodega Principal')
      );
      if (clean.length > 0) return clean;
    }
    // Si sólo había direcciones demo anteriores en localStorage, limpiarlas
    localStorage.removeItem('colorlink_user_addresses');
    return [];
  });

  // Modal / Formulario para agregar o editar dirección
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrEtiqueta, setAddrEtiqueta] = useState('');
  const [addrDireccion, setAddrDireccion] = useState('');
  const [addrDepartamento, setAddrDepartamento] = useState('Cundinamarca');
  const [addrCiudad, setAddrCiudad] = useState('Bogotá D.C.');
  const [addrDetalles, setAddrDetalles] = useState('');
  const [addrEsPredeterminada, setAddrEsPredeterminada] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      setNombre(userSession.nombre || '');
      setTelefono(userSession.telefono || '');
      setEmail(userSession.email || '');
      setDocumento(userSession.documento || '');
      setTipoDocumento(userSession.tipoDocumento || 'Cédula de Ciudadanía');
      setPasswordSuccess(null);
      setPasswordError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsAddingAddress(false);
      setEditingAddressId(null);
      setOrderFilterQuery('');
      setStatusFilter('Todos');
    }
  }, [isOpen, userSession, initialTab]);

  if (!isOpen) return null;

  const handleSavePersonalData = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      onShowToast('El nombre completo no puede estar vacío');
      return;
    }
    if (!documento.trim()) {
      onShowToast('El Número de Cédula / NIT es obligatorio');
      return;
    }

    const updated: UserSession = {
      ...userSession,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      documento: documento.trim(),
      tipoDocumento: tipoDocumento,
      direcciones: addresses,
    };

    // 1. Actualizar el objeto del usuario actual en la sesión activa (currentUser y colorlink_user_session)
    syncActiveSession(updated);
    onUpdateUserSession(updated);

    // 2. Actualizar la ficha correspondiente dentro de 'pintuco_users_db' en localStorage
    try {
      const usersDb = getPintucoUsersDb();
      const normEmail = normalizeEmail(userSession.email || email);
      const normDoc = normalizeDocument(userSession.documento || documento);

      const userIdx = usersDb.findIndex(u => 
        (normEmail && normalizeEmail(u.email) === normEmail) ||
        (normDoc && normalizeDocument(u.cedula) === normDoc)
      );

      if (userIdx !== -1) {
        usersDb[userIdx] = {
          ...usersDb[userIdx],
          nombre: nombre.trim(),
          email: email.trim(),
          cedula: documento.trim(),
          telefono: telefono.trim(),
          tipoDocumento: tipoDocumento,
          direcciones: addresses,
        };
        savePintucoUsersDb(usersDb);
      } else {
        // Si no existía en el registro local, guardarlo
        usersDb.push({
          id: `usr-${Date.now()}`,
          nombre: nombre.trim(),
          email: email.trim(),
          cedula: documento.trim(),
          telefono: telefono.trim(),
          password: 'pintuco_saved',
          direcciones: addresses,
          tipoDocumento: tipoDocumento,
        });
        savePintucoUsersDb(usersDb);
      }
    } catch (err) {
      console.error('Error updating pintuco_users_db from profile:', err);
    }

    // 3. Notificación/toast de confirmación requerida: "Datos actualizados correctamente"
    onShowToast('Datos actualizados correctamente');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 4) {
      setPasswordError('La nueva contraseña debe tener al menos 4 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    // Actualizar en 'pintuco_users_db'
    try {
      const usersDb = getPintucoUsersDb();
      const normEmail = normalizeEmail(userSession.email || email);
      const userIdx = usersDb.findIndex(u => normalizeEmail(u.email) === normEmail);
      if (userIdx !== -1) {
        usersDb[userIdx].password = newPassword.trim();
        savePintucoUsersDb(usersDb);
      }
    } catch {}

    // Call server to persist password if applicable
    fetch('/api/auth/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userSession.email,
        currentPassword,
        newPassword,
      }),
    }).catch(() => {});

    setPasswordSuccess('Contraseña actualizada con éxito');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onShowToast('Contraseña de seguridad actualizada');
  };

  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      esPredeterminada: a.id === id,
    }));
    setAddresses(updated);
    localStorage.setItem('colorlink_user_addresses', JSON.stringify(updated));
    
    // Also update main user session default address
    const defaultAddr = updated.find((a) => a.id === id);
    if (defaultAddr) {
      const updatedSession: UserSession = {
        ...userSession,
        ciudad: defaultAddr.ciudad,
        direccion: defaultAddr.direccion,
        direcciones: updated,
      };
      onUpdateUserSession(updatedSession);
    }
    onShowToast('Dirección predeterminada actualizada');
  };

  const handleDeleteAddress = (id: string) => {
    const filtered = addresses.filter((a) => a.id !== id);
    // If we deleted the default one, make the first one default
    if (filtered.length > 0 && !filtered.some((a) => a.esPredeterminada)) {
      filtered[0].esPredeterminada = true;
    }
    setAddresses(filtered);
    localStorage.setItem('colorlink_user_addresses', JSON.stringify(filtered));

    const defaultAddr = filtered.find((a) => a.esPredeterminada) || filtered[0];
    const updatedSession: UserSession = {
      ...userSession,
      direcciones: filtered,
      ciudad: defaultAddr ? defaultAddr.ciudad : userSession.ciudad,
      direccion: defaultAddr ? defaultAddr.direccion : '',
    };
    onUpdateUserSession(updatedSession);
    onShowToast('Dirección eliminada');
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrEtiqueta.trim() || !addrDireccion.trim()) {
      onShowToast('Ingresa el nombre o alias y la dirección');
      return;
    }

    let updated: UserAddress[];

    if (editingAddressId) {
      // Editar existente
      updated = addresses.map((a) => {
        if (a.id === editingAddressId) {
          return {
            ...a,
            etiqueta: addrEtiqueta.trim(),
            direccion: addrDireccion.trim(),
            departamento: addrDepartamento.trim(),
            ciudad: addrCiudad.trim(),
            detalles: addrDetalles.trim(),
            esPredeterminada: addrEsPredeterminada || a.esPredeterminada,
          };
        }
        return addrEsPredeterminada ? { ...a, esPredeterminada: false } : a;
      });
    } else {
      // Nueva dirección
      const newAddr: UserAddress = {
        id: `addr-${Date.now()}`,
        etiqueta: addrEtiqueta.trim(),
        direccion: addrDireccion.trim(),
        departamento: addrDepartamento.trim(),
        ciudad: addrCiudad.trim(),
        detalles: addrDetalles.trim(),
        esPredeterminada: addrEsPredeterminada || addresses.length === 0,
      };
      updated = (addrEsPredeterminada || addresses.length === 0)
        ? [...addresses.map((a) => ({ ...a, esPredeterminada: false })), newAddr]
        : [...addresses, newAddr];
    }

    setAddresses(updated);
    localStorage.setItem('colorlink_user_addresses', JSON.stringify(updated));

    const defaultAddr = updated.find((a) => a.esPredeterminada) || updated[0];
    const updatedSession: UserSession = {
      ...userSession,
      direcciones: updated,
      ciudad: defaultAddr ? defaultAddr.ciudad : userSession.ciudad,
      direccion: defaultAddr ? defaultAddr.direccion : userSession.direccion,
    };
    onUpdateUserSession(updatedSession);

    setIsAddingAddress(false);
    setEditingAddressId(null);
    setAddrEtiqueta('');
    setAddrDireccion('');
    setAddrDepartamento('Cundinamarca');
    setAddrCiudad('Bogotá D.C.');
    setAddrDetalles('');
    setAddrEsPredeterminada(false);
    onShowToast(editingAddressId ? 'Dirección actualizada con éxito' : 'Dirección guardada correctamente');
  };

  const handleOpenEditAddress = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setAddrEtiqueta(addr.etiqueta);
    setAddrDireccion(addr.direccion);
    setAddrDepartamento(addr.departamento || 'Cundinamarca');
    setAddrCiudad(addr.ciudad);
    setAddrDetalles(addr.detalles || '');
    setAddrEsPredeterminada(addr.esPredeterminada);
    setIsAddingAddress(true);
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Modal Corporativo Brisa Marina con Avatar Oficial / Personalizado */}
        <div className="bg-gradient-to-r from-blue-900 via-[#003366] to-teal-800 text-white p-5 sm:p-6 flex items-center justify-between border-b border-blue-950">
          <div className="flex items-center gap-3.5">
            {/* Input oculto para subida de foto */}
            <input
              type="file"
              ref={avatarFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleUploadProfileAvatar}
            />

            {/* Avatar Técnico o Personalizado con Botón de Cámara estilo red social */}
            <div 
              className="relative group/avatar cursor-pointer shrink-0" 
              onClick={() => avatarFileInputRef.current?.click()}
              title="Haz clic para subir o cambiar tu foto de perfil"
            >
              {profileAvatarUrl ? (
                <img
                  src={profileAvatarUrl}
                  alt={nombre || 'Foto de perfil'}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shadow-lg border-2 border-white group-hover/avatar:opacity-90 transition-all ring-2 ring-sky-300/60"
                />
              ) : (
                <SectorPaintAvatar size="lg" className="w-14 h-14 sm:w-16 sm:h-16" />
              )}
              <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Mi Perfil & Gestión de Cuenta
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFD100] text-slate-950 shadow-xs">
                  {userSession.userType === 'funcionario' ? 'Corporativo' : 'Cliente'}
                </span>
              </div>
              <p className="text-xs text-sky-100/90 mt-0.5">
                {email || 'Gestiona tus datos personales, contraseña y direcciones de entrega'}
              </p>
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/15 hover:bg-white/25 text-sky-100 text-[11px] font-bold border border-white/20 transition-colors cursor-pointer"
              >
                <Camera className="w-3 h-3 text-sky-200" />
                <span>📷 Subir o cambiar foto de perfil</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm border border-rose-500/50"
                title="Cerrar sesión actual"
              >
                <LogOut className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pestañas de Navegación de Perfil (Brisa Marina) */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-3 gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('datos')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap rounded-t-lg ${
              activeTab === 'datos'
                ? 'border-blue-900 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4 text-blue-900" />
            <span>Datos Personales</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('orders');
              setStatusFilter('Todos');
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap rounded-t-lg ${
              activeTab === 'pedidos' || activeTab === 'orders'
                ? 'border-blue-900 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-4 h-4 text-teal-600" />
            <span>Pedidos Pendientes ({userOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seguridad')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap rounded-t-lg ${
              activeTab === 'seguridad'
                ? 'border-blue-900 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Seguridad & Contraseña</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('direcciones')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap rounded-t-lg ${
              activeTab === 'direcciones'
                ? 'border-blue-900 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Libreta de Direcciones ({addresses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('solicitudes')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap rounded-t-lg ${
              activeTab === 'solicitudes'
                ? 'border-blue-900 text-blue-900 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span>Mis Solicitudes & PQRS</span>
          </button>
        </div>

        {/* Contenido de la pestaña */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-slate-800 bg-slate-50/50">
          
          {/* 1. DATOS PERSONALES */}
          {activeTab === 'datos' && (
            <form onSubmit={handleSavePersonalData} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-900 shrink-0" />
                <span>Tus datos se utilizan para la facturación y rotulación oficial de tus pedidos de pintura.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre Completo / Razón Social
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-colors shadow-2xs"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Número de Cédula / NIT obligatorio para facturación y trazabilidad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tipo de Documento
                  </label>
                  <select
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-colors shadow-2xs"
                  >
                    <option value="Cédula de Ciudadanía">Cédula de Ciudadanía (CC)</option>
                    <option value="NIT">NIT (Empresas)</option>
                    <option value="Cédula de Extranjería">Cédula de Extranjería (CE)</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Número de Cédula / NIT</span>
                    <span className="text-[10px] text-rose-600 font-extrabold">* Obligatorio para trazabilidad</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ej: 1.020.304.506 o 900.845.120-4"
                      value={documento}
                      onChange={(e) => setDocumento(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-colors shadow-2xs"
                    />
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Teléfono Celular
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+57 300 123 4567"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-colors shadow-2xs"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-colors shadow-2xs"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>
              </div>

              {userSession.cargo && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cargo / Rol Institucional
                  </label>
                  <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                    {userSession.cargo} — {userSession.departamento || 'Pintuco Colombia'}
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. MIS PEDIDOS / PROYECTOS RADICADOS (Brisa Marina & Supabase Live) */}
          {(activeTab === 'pedidos' || activeTab === 'orders') && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Barra Informativa Superior */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    Historial para: <strong className="text-slate-900">{userSession.nombre || 'Usuario Registrado'}</strong> • Correo: <strong className="text-slate-900">{userSession.email || 'cliente@pintuco.com'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isLoadingSupabase && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      <span>Sincronizando con Supabase...</span>
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                    {userOrders.length} pedido{userOrders.length === 1 ? '' : 's'} registrado{userOrders.length === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              {/* BÚSQUEDA RÁPIDA Y FILTROS POR ESTADO (CHIPS) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-blue-900" />
                    <span>Filtrar por Estado:</span>
                  </span>
                  {(statusFilter !== 'Todos' || orderFilterQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('Todos');
                        setOrderFilterQuery('');
                      }}
                      className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restablecer filtros</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {(['Todos', 'En Procesamiento', 'Entregados', 'Cotizaciones'] as const).map((chip) => {
                    const isSelected = statusFilter === chip;
                    const count = countForChip(chip);
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setStatusFilter(chip)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                          isSelected
                            ? 'bg-blue-900 text-white shadow-sm ring-2 ring-blue-900/20'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span>{chip}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BARRA DE BÚSQUEDA DE ÓRDENES */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={orderFilterQuery}
                  onChange={(e) => setOrderFilterQuery(e.target.value)}
                  placeholder="Buscar por orden (#CLK-8492), proyecto, color o estado..."
                  className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 font-medium shadow-2xs transition-colors"
                />
                {orderFilterQuery && (
                  <button
                    type="button"
                    onClick={() => setOrderFilterQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                    title="Limpiar texto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Mensaje de resultados de búsqueda */}
              {orderFilterQuery && (
                <div className="text-[11px] text-slate-500 px-1 flex items-center justify-between">
                  <span>
                    Coincidencias encontradas: <strong className="text-slate-900">{filteredUserOrders.length}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOrderFilterQuery('')}
                    className="text-teal-700 font-bold hover:underline cursor-pointer"
                  >
                    Limpiar término
                  </button>
                </div>
              )}

              {/* LISTA DE TARJETAS DE PEDIDO */}
              {filteredUserOrders.length === 0 ? (
                /* Estado vacío amigable (Sin pedidos pendientes) */
                <div className="p-8 sm:p-10 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-2xs">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center mx-auto shadow-xs">
                    <ShoppingBag className="w-8 h-8 text-blue-900" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="font-black text-slate-900 text-base">
                      {orderFilterQuery
                        ? `No se encontraron pedidos con "${orderFilterQuery}".`
                        : 'No tienes pedidos pendientes en este momento'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {orderFilterQuery
                        ? 'Prueba con otro número de orden o limpia los filtros de búsqueda.'
                        : 'Tus compras confirmadas y cotizaciones aparecerán aquí para seguimiento en tiempo real de alistamiento y entrega.'}
                    </p>
                  </div>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onNavigateToStore) {
                          onNavigateToStore();
                        } else if (onNavigateToTracking) {
                          onNavigateToTracking();
                        }
                      }}
                      className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-black rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.02] active:scale-98"
                    >
                      <ShoppingBag className="w-4 h-4 text-amber-300" />
                      <span>🛒 Ir a la Tienda / Consultar Asesor</span>
                    </button>
                    {orderFilterQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setOrderFilterQuery('');
                          setStatusFilter('Todos');
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Restablecer filtros
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
                  {filteredUserOrders.map((order) => {
                    const colorHex = resolveColorHex(order.form?.color_acabado);
                    const colorName = order.form?.color_acabado || 'Color Pintuco Estándar';
                    const projectName = order.form?.tipo_obra || (order as any).proyectoNombre || 'Proyecto de Pintura';
                    const totalQty = formatQuantity(order);
                    const totalCOP = order.total || order.calculo?.costo_total_estimado || 320000;
                    const dateFormatted = formatDate(order.fechaCreacion);

                    return (
                      <div
                        key={order.id || order.numeroOrden}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-400 hover:shadow-md transition-all space-y-3.5 shadow-2xs group"
                      >
                        {/* ENCABEZADO DE LA TARJETA: Código de Orden, Fecha y Estado */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            {/* Código de orden con botón de copiar */}
                            <span className="font-mono font-black text-xs bg-slate-100 text-slate-900 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                              <span>{order.numeroOrden}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyOrder(order.numeroOrden)}
                                className="text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                                title="Copiar código de orden"
                              >
                                {copiedOrderId === order.numeroOrden ? (
                                  <Check className="w-3.5 h-3.5 text-teal-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </span>

                            {/* Fecha */}
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>Fecha: <strong className="text-slate-700">{dateFormatted}</strong></span>
                            </span>
                          </div>

                          {/* Estado */}
                          <div>
                            {renderStatusBadge(order.estado)}
                          </div>
                        </div>

                        {/* CUERPO DE LA TARJETA */}
                        <div className="space-y-3">
                          {/* Proyecto y Total en COP */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                Nombre del Proyecto / Pedido
                              </span>
                              <h4 className="text-sm font-black text-slate-900 group-hover:text-blue-900 transition-colors">
                                {projectName}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {order.calculo?.productoSugerido || order.form?.producto_deseado || 'Pintura Pintuco'}
                              </p>
                            </div>

                            <div className="sm:text-right shrink-0">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                                Total Pedido ($ COP)
                              </span>
                              <strong className="text-base sm:text-lg font-black text-teal-700 font-mono">
                                ${totalCOP.toLocaleString('es-CO')} COP
                              </strong>
                            </div>
                          </div>

                          {/* DIRECCIÓN DE ENTREGA (Destacada) */}
                          <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate">
                              Dirección de entrega: <strong className="text-slate-900">{order.direccionEntrega || (order as any).shipping_address || 'Dirección de obra registrada'}</strong>
                              {(order.ciudadEntrega || (order as any).city) && ` • ${order.ciudadEntrega || (order as any).city}`}
                            </span>
                          </div>

                          {/* PRODUCTOS / COLORLINK SELECCIONADOS */}
                          {order.items && order.items.length > 0 ? (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Productos / Colorlink Seleccionados:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {order.items.map((it: any, itIdx: number) => (
                                  <span
                                    key={itIdx}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs"
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full border border-slate-300 bg-amber-500 shrink-0" />
                                    <span>{it.nombre} ({it.cantidad} {it.presentacion || 'Gal'})</span>
                                    {it.colorSeleccionado && (
                                      <span className="text-[10px] text-blue-900 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                        Colorlink: {it.colorSeleccionado}
                                      </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            /* Fila de Miniatura de Color y Cantidad Total si es cotización tradicional */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                                <div
                                  className="w-7 h-7 rounded-lg border border-slate-300 shadow-2xs shrink-0 ring-1 ring-black/5"
                                  style={{ backgroundColor: colorHex }}
                                  title={`Color: ${colorName}`}
                                />
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                    Colorlink Seleccionado
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 truncate block">
                                    {colorName}
                                  </span>
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center shrink-0">
                                  <ShoppingBag className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                    Cantidad Total
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 block">
                                    {totalQty}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ACCIONES DE LA TARJETA */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleViewDetailPDF(order)}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:border-slate-300 active:scale-98"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-500" />
                            <span>Ver Detalle / Descargar PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-sky-200" />
                            <span>Reordenar / Duplicar Cotización</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* BOTÓN DE CONTROL / PRUEBA */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Database className="w-3.5 h-3.5 text-teal-600" />
                  <span>Persistencia: <code className="text-slate-700 font-mono">localStorage (colorlink_user_orders)</code></span>
                </span>

                <button
                  type="button"
                  onClick={handleResetLocalStorageOrders}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Borrar memoria local y reiniciar con pedidos de prueba iniciales"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-600" />
                  <span>Restablecer Datos de Prueba</span>
                </button>
              </div>

            </div>
          )}

          {/* 3. SEGURIDAD & CAMBIO DE CONTRASEÑA (Brisa Marina) */}
          {activeTab === 'seguridad' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Establece una contraseña fuerte de al menos 6 caracteres para proteger tu cuenta de compras y despachos.</span>
              </div>

              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 font-bold flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Ingresa tu contraseña actual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-colors shadow-2xs"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-colors shadow-2xs"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Repite la nueva contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-colors shadow-2xs"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Actualizar Contraseña</span>
                </button>
              </div>
            </form>
          )}

          {/* 4. LIBRETA DE DIRECCIONES MÚLTIPLES (Brisa Marina) */}
          {activeTab === 'direcciones' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">
                    Direcciones de Entrega y Despacho
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Registra y selecciona la dirección predeterminada para el despacho de materiales a tus obras.
                  </p>
                </div>
                {!isAddingAddress && addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddressId(null);
                      setAddrEtiqueta('');
                      setAddrDireccion('');
                      setAddrDepartamento('Cundinamarca');
                      setAddrCiudad('Bogotá D.C.');
                      setAddrDetalles('');
                      setAddrEsPredeterminada(false);
                      setIsAddingAddress(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-102"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar Nueva Dirección</span>
                  </button>
                )}
              </div>

              {/* Formulario para registrar o editar dirección */}
              {isAddingAddress && (
                <form onSubmit={handleSaveAddress} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3.5 shadow-sm animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      {editingAddressId ? 'Editar Dirección' : 'Registrar Nueva Dirección'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Nombre / Alias de la dirección
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        placeholder='Ej: "Casa", "Oficina", "Obra"'
                        value={addrEtiqueta}
                        onChange={(e) => setAddrEtiqueta(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Dirección completa (Calle/Carrera, número)
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="off"
                        placeholder="Ej: Carrera 15 # 93-60, Edificio Torre A"
                        value={addrDireccion}
                        onChange={(e) => setAddrDireccion(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Departamento
                      </label>
                      <select
                        value={addrDepartamento}
                        onChange={(e) => setAddrDepartamento(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-2xs"
                      >
                        <option value="Cundinamarca">Cundinamarca</option>
                        <option value="Antioquia">Antioquia</option>
                        <option value="Valle del Cauca">Valle del Cauca</option>
                        <option value="Atlántico">Atlántico</option>
                        <option value="Bolívar">Bolívar</option>
                        <option value="Santander">Santander</option>
                        <option value="Risaralda">Risaralda</option>
                        <option value="Magdalena">Magdalena</option>
                        <option value="Norte de Santander">Norte de Santander</option>
                        <option value="Tolima">Tolima</option>
                        <option value="Meta">Meta</option>
                        <option value="Caldas">Caldas</option>
                        <option value="Quindío">Quindío</option>
                        <option value="Boyacá">Boyacá</option>
                        <option value="Huila">Huila</option>
                        <option value="Cesar">Cesar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Ciudad
                      </label>
                      <select
                        value={addrCiudad}
                        onChange={(e) => setAddrCiudad(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-2xs"
                      >
                        <option value="Bogotá D.C.">Bogotá D.C.</option>
                        <option value="Medellín">Medellín</option>
                        <option value="Cali">Cali</option>
                        <option value="Barranquilla">Barranquilla</option>
                        <option value="Cartagena">Cartagena</option>
                        <option value="Bucaramanga">Bucaramanga</option>
                        <option value="Pereira">Pereira</option>
                        <option value="Santa Marta">Santa Marta</option>
                        <option value="Cúcuta">Cúcuta</option>
                        <option value="Ibagué">Ibagué</option>
                        <option value="Villavicencio">Villavicencio</option>
                        <option value="Manizales">Manizales</option>
                        <option value="Armenia">Armenia</option>
                        <option value="Tunja">Tunja</option>
                        <option value="Neiva">Neiva</option>
                        <option value="Valledupar">Valledupar</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nota / Indicaciones adicionales
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder='Ej: "Apt 201", "Dejar en portería", "Muelle de carga 2"'
                      value={addrDetalles}
                      onChange={(e) => setAddrDetalles(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-2xs"
                    />
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer pt-1 select-none">
                    <input
                      type="checkbox"
                      checked={addrEsPredeterminada}
                      onChange={(e) => setAddrEsPredeterminada(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-900 focus:ring-blue-900 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Marcar como dirección predeterminada de entrega
                    </span>
                  </label>

                  <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs shadow-sm cursor-pointer transition-colors"
                    >
                      Guardar Dirección
                    </button>
                  </div>
                </form>
              )}

              {/* Estado Vacío (Empty State) cuando no hay direcciones registradas */}
              {addresses.length === 0 && !isAddingAddress && (
                <div className="text-center py-10 px-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white space-y-4 animate-fadeIn">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center mx-auto text-teal-600">
                    <MapPin className="w-7 h-7 text-teal-600" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h5 className="text-sm font-extrabold text-slate-900">
                      Aún no tienes direcciones de entrega registradas.
                    </h5>
                    <p className="text-xs text-slate-500">
                      Registra la dirección de tu obra, oficina o casa para despachar tus pedidos y cotizaciones con Pintuco.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddressId(null);
                      setAddrEtiqueta('');
                      setAddrDireccion('');
                      setAddrDepartamento('Cundinamarca');
                      setAddrCiudad('Bogotá D.C.');
                      setAddrDetalles('');
                      setAddrEsPredeterminada(true);
                      setIsAddingAddress(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs shadow-sm transition-all hover:scale-102 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Agregar Nueva Dirección</span>
                  </button>
                </div>
              )}

              {/* Lista de Direcciones Guardadas Dinámicamente */}
              {addresses.length > 0 && (
                <div className="space-y-2.5">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        addr.esPredeterminada
                          ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          addr.esPredeterminada ? 'bg-blue-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {addr.etiqueta.toLowerCase().includes('obra') ? (
                            <Building2 className="w-5 h-5" />
                          ) : addr.etiqueta.toLowerCase().includes('oficina') ? (
                            <Briefcase className="w-5 h-5" />
                          ) : (
                            <Home className="w-5 h-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-slate-900 truncate">
                              {addr.etiqueta}
                            </h5>
                            {addr.esPredeterminada && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1 shrink-0">
                                <Check className="w-2.5 h-2.5" /> Predeterminada
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 font-medium">
                            {addr.direccion}, {addr.ciudad}{addr.departamento ? `, ${addr.departamento}` : ''}
                          </p>
                          {addr.detalles && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Nota: {addr.detalles}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {!addr.esPredeterminada && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Marcar como predeterminada"
                          >
                            Hacer Predeterminada
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditAddress(addr)}
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar dirección"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. MIS SOLICITUDES, SEGUIMIENTO LOGÍSTICO Y PQRS SAC */}
          {activeTab === 'solicitudes' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* SECCIÓN A: SEGUIMIENTO DE PEDIDOS (INTEGRADO CON LOGÍSTICA CEDI) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-900" />
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Seguimiento de Pedidos (Integrado con Logística CEDI)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Estado y trazabilidad actualizada en tiempo real desde nuestras plantas y centros de distribución.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900">
                    {userOrders.length} {userOrders.length === 1 ? 'Pedido' : 'Pedidos'}
                  </span>
                </div>

                {userOrders.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                    <Truck className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No tienes pedidos pendientes registrados.</p>
                    <p className="text-[11px] text-slate-400">Tus compras y cotizaciones aprobadas aparecerán aquí con seguimiento en vivo.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map((order) => {
                      const st = (order.estado || '').toLowerCase();
                      let bannerText = '🎨 ¡Estamos preparando tus pinturas en nuestro CEDI!';
                      let bannerBg = 'bg-amber-50 border-amber-300 text-amber-950';
                      let bannerIcon = '🎨';

                      if (st.includes('entregado') || st.includes('completado')) {
                        bannerText = '✅ ¡Pedido entregado! Disfruta dándole color a tu espacio.';
                        bannerBg = 'bg-emerald-50 border-emerald-300 text-emerald-950';
                        bannerIcon = '✅';
                      } else if (st.includes('despachado') || st.includes('tránsito') || st.includes('transito') || st.includes('ruta') || st.includes('camino') || st.includes('despacho')) {
                        bannerText = '🚚 ¡Tu pedido va en camino! Guía de transporte asignada.';
                        bannerBg = 'bg-blue-50 border-blue-300 text-blue-950';
                        bannerIcon = '🚚';
                      }

                      const items = Array.isArray(order.items) ? order.items : [];

                      return (
                        <div key={order.id || order.numeroOrden} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                          {/* Cabecera Orden */}
                          <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-900 to-[#002244] text-white flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black text-amber-300">
                                {order.numeroOrden || order.id}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white border border-white/20">
                                {order.estado}
                              </span>
                              <span className="text-[10px] text-slate-300">
                                {order.fechaCreacion ? new Date(order.fechaCreacion).toLocaleDateString('es-CO') : 'Reciente'}
                              </span>
                            </div>
                            {order.total && order.total > 0 && (
                              <span className="text-xs font-black text-amber-300 font-mono">
                                ${order.total.toLocaleString('es-CO')} COP
                              </span>
                            )}
                          </div>

                          {/* MENSAJE AMIGABLE Y CERCANO EN VIVO */}
                          <div className={`p-3 border-b flex items-center gap-2.5 ${bannerBg}`}>
                            <span className="text-lg shrink-0">{bannerIcon}</span>
                            <div className="min-w-0">
                              <span className="text-[9px] uppercase font-black tracking-wider block opacity-75">
                                Notificación de Estado en Vivo
                              </span>
                              <p className="text-xs font-extrabold leading-tight">
                                {bannerText}
                              </p>
                            </div>
                          </div>

                          {/* Detalles rápidos y dirección */}
                          <div className="p-3 text-xs text-slate-600 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">
                                Entrega en: <strong className="text-slate-800">{order.direccionEntrega || 'Dirección de obra'}</strong> ({order.ciudadEntrega || 'Colombia'})
                              </span>
                            </div>
                            {items.length > 0 && (
                              <span className="text-[11px] text-slate-500 font-semibold shrink-0">
                                {items.length} {items.length === 1 ? 'referencia' : 'referencias'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECCIÓN B: BANDEJA DE PQRS Y CONTACTO (INTEGRADO CON SAC) */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-teal-700" />
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Bandeja de PQRS y Contacto (Integrado con SAC)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Casos radicados, peritajes técnicos y respuestas oficiales del equipo de Atención al Cliente.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !newProfilePqrsOpen;
                      setNewProfilePqrsOpen(nextState);
                      if (nextState) {
                        window.dispatchEvent(new CustomEvent('colorlink_close_ai_chat'));
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                  >
                    <HeadphonesIcon className="w-3.5 h-3.5" />
                    <span>{newProfilePqrsOpen ? 'Cerrar' : 'Radicar PQR'}</span>
                  </button>
                </div>

                {/* Formulario rápido para radicar */}
                {newProfilePqrsOpen && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newProfilePqrsAsunto.trim() || !newProfilePqrsMensaje.trim()) return;
                      setIsSubmittingProfilePqrs(true);
                      setTimeout(() => {
                        const nuevoTicket = radicarConsultaWeb({
                          clienteNombre: userSession.nombre || nombre || 'Cliente Registrado',
                          clienteEmail: userSession.email || email || 'cliente@pintuco.com',
                          clienteTelefono: userSession.telefono || telefono || '',
                          canal: 'Formulario PQR',
                          asunto: newProfilePqrsAsunto.trim(),
                          mensaje: newProfilePqrsMensaje.trim(),
                          categoria: newProfilePqrsCategoria,
                        });
                        setProfileTickets(getTicketsSAC());
                        setIsSubmittingProfilePqrs(false);
                        setNewProfilePqrsOpen(false);
                        setNewProfilePqrsAsunto('');
                        setNewProfilePqrsMensaje('');
                        onShowToast(`✅ Radicado ${nuevoTicket.radicado} creado con éxito.`);
                      }, 300);
                    }}
                    className="p-4 bg-white rounded-2xl border border-blue-200 shadow-md space-y-3"
                  >
                    <div className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                      <HeadphonesIcon className="w-4 h-4" />
                      <span>Nueva Solicitud Técnica o Reclamación SAC</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Categoría</label>
                        <select
                          value={newProfilePqrsCategoria}
                          onChange={(e) => setNewProfilePqrsCategoria(e.target.value as any)}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none"
                        >
                          <option value="Asesoría Técnica Pinturas">Asesoría Técnica Pinturas</option>
                          <option value="Cotización B2B / Obra">Cotización B2B / Obra</option>
                          <option value="Certificación NTC 1335">Certificación NTC 1335</option>
                          <option value="Seguimiento Despacho">Seguimiento Despacho</option>
                          <option value="Garantía / Reclamación">Garantía / Reclamación</option>
                          <option value="Información General">Información General</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Asunto</label>
                        <input
                          type="text"
                          required
                          value={newProfilePqrsAsunto}
                          onChange={(e) => setNewProfilePqrsAsunto(e.target.value)}
                          placeholder="Ej. Solicitud de certificado de adherencia"
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Detalle del Requerimiento</label>
                      <textarea
                        required
                        rows={2}
                        value={newProfilePqrsMensaje}
                        onChange={(e) => setNewProfilePqrsMensaje(e.target.value)}
                        placeholder="Describe detalladamente tu solicitud para el equipo de SAC..."
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* Cumplimiento Normativo Habeas Data - Ley Estatutaria 1581 de 2012 */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 leading-relaxed flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <p>
                        <strong>Habeas Data (Ley 1581 de 2012):</strong> Autorizo a Pintuco S.A. el tratamiento de mis datos personales exclusivamente para la gestión técnica y trazabilidad de este radicado PQRS.
                      </p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setNewProfilePqrsOpen(false)}
                        className="px-3 py-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingProfilePqrs}
                        className="px-4 py-1 rounded-lg bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1 shadow-2xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isSubmittingProfilePqrs ? 'Radicando...' : 'Radicar Solicitud'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Listado de Casos y Respuestas de SAC */}
                {profileTickets.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No tienes radicados de PQRS en este momento.</p>
                    <p className="text-[11px] text-slate-400">Puedes radicar una solicitud técnica cuando lo necesites.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {profileTickets.map((t) => {
                      const officialAgentMessages = t.mensajes.filter((m) => m.remitenteTipo === 'agente' && !m.esNotaInterna);
                      const isRespondido = officialAgentMessages.length > 0 || t.estado === 'Resuelto' || t.estado === 'Cerrado';

                      return (
                        <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                          {/* Cabecera Radicado */}
                          <div className="p-3.5 bg-gradient-to-r from-[#002244] to-[#0A4D68] text-white flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-black text-amber-300">
                                  {t.radicado}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                                  isRespondido 
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                                }`}>
                                  {isRespondido ? '✅ Respondido' : '⏳ En revisión'}
                                </span>
                                <span className="text-[10px] text-slate-300">
                                  {t.fechaCreacion}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-white mt-1">
                                {t.asunto}
                              </h5>
                            </div>
                          </div>

                          <div className="p-3.5 space-y-3">
                            {/* Solicitud del Cliente */}
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                              <span className="text-[10px] font-bold text-slate-500 block uppercase">
                                Tu Solicitud Radicada:
                              </span>
                              <p className="mt-0.5">{t.mensaje}</p>
                            </div>

                            {/* TEXTO COMPLETO DE LA RESPUESTA OFICIAL REDACTADA POR SAC */}
                            {officialAgentMessages.length > 0 ? (
                              <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Respuesta Oficial del Equipo SAC Pintuco</span>
                                </span>

                                {officialAgentMessages.map((msg) => (
                                  <div 
                                    key={msg.id}
                                    className="p-3 rounded-xl bg-teal-50/70 border border-teal-200 text-xs space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        {msg.remitenteAvatar ? (
                                          <img src={msg.remitenteAvatar} alt={msg.remitenteNombre} className="w-6 h-6 rounded-full object-cover border border-teal-600" />
                                        ) : (
                                          <div className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center">SAC</div>
                                        )}
                                        <strong className="text-teal-950 font-bold">{msg.remitenteNombre}</strong>
                                      </div>
                                      <span className="text-[10px] text-teal-700">{msg.fecha}</span>
                                    </div>
                                    <div className="text-slate-800 leading-relaxed whitespace-pre-line pl-1">
                                      {msg.texto}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>Tu requerimiento está en análisis técnico por parte del equipo de SAC.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer Brisa Marina */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
};
