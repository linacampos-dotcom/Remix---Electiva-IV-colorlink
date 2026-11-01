import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  FMVFormData, 
  CalculationResult, 
  COLORLINKOrder, 
  AIAnalysis, 
  AppRole, 
  InventoryItem,
  CartItem,
  UserSession,
  CatalogProduct,
  ClientNavigationTab
} from './types';
import { calculateMaterials } from './utils/calculator';
import { PRESET_PROJECTS, getFutureDateString, INITIAL_INVENTORY, PINTUCO_CATALOG } from './data/pintucoData';
import { Header } from './components/Header';
import { ClientView } from './components/ClientView';
import { AdminView } from './components/AdminView';
import { OrdersHistoryModal } from './components/OrdersHistoryModal';
import { CatalogModal } from './components/CatalogModal';
import { AIChatDrawer } from './components/AIChatDrawer';
import { NLPExtractorModal } from './components/NLPExtractorModal';
import { PrintableOrderModal } from './components/PrintableOrderModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ShoppingCartDrawer } from './components/ShoppingCartDrawer';
import { UnifiedAuthModal } from './components/UnifiedAuthModal';
import { CorporateRBACDashboard } from './components/CorporateRBACDashboard';
import { CorporateIntranetView } from './components/CorporateIntranetView';
import { OmnichannelNotificationsModal } from './components/OmnichannelNotificationsModal';
import { UserProfileModal, DEFAULT_PROFILE_MOCK_ORDERS } from './components/UserProfileModal';
import { ClientNotificationsModal } from './components/ClientNotificationsModal';
import { CorporateRole } from './types';
import { 
  getPintucoUsersDb, 
  syncActiveSession, 
  normalizeEmail, 
  normalizeDocument 
} from './utils/userDatabase';
import { CompanyHistoryModal } from './components/CompanyHistoryModal';
import { CoverageModal } from './components/CoverageModal';
import { descontarInventarioPorPedido } from './services/corporateService';
import { CustomerInquiryModal } from './components/CustomerInquiryModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { DraggableAIChatButton } from './components/DraggableAIChatButton';
import { checkIsIntranetRoute } from './utils/safeNavigation';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Info, 
  User, 
  Building2, 
  Database, 
  Sparkles,
  ArrowRight,
  X,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { 
  fetchSupabaseProducts, 
  insertSupabaseOrder, 
  fetchSupabaseProjects, 
  updateSupabaseProjectStatus 
} from './lib/supabaseService';
import { isSupabaseConfigured, SupabaseProducto, supabase } from './lib/supabaseClient';
import { 
  getStoredFavorites, 
  toggleStoredFavorite, 
  syncFavoritesWithSupabase 
} from './utils/favoritesService';

const INITIAL_FORM_DATA: FMVFormData = {
  tipo_documento: 'NIT',
  documento: '',
  nombre_razon_social: '',
  responsable_contacto: '',
  canal_entrada: 'Portal Web B2B',
  ciudad: 'Bogotá D.C.',
  tipo_obra: 'Residencial Nuevo',
  area_m2: 120,
  fecha_requerida: getFutureDateString(5),
  producto_deseado: 'Koraza Doble Vida Protección Clima Extremo',
  superficie: 'Pañete / Revoque Liso',
  ambiente: 'Exterior Fachada',
  condicion: 'Nueva',
  color_acabado: 'Blanco Puro Mate 1001',
  metodo_aplicacion: 'Rodillo Convencional (+5% desperdicio)',
  foto_obra_url: '',
};

export default function App() {
  // Role State (default to 'cliente' as requested, with URL parameter support for direct admin / logistica access)
  const [userRole, setUserRole] = useState<AppRole>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('role');
      const tab = params.get('tab');
      if (r === 'admin' || tab === 'admin' || tab === 'logistica' || tab === 'bodega' || tab === 'intranet') {
        return 'admin';
      }
    }
    const saved = localStorage.getItem('colorlink_user_role');
    return (saved as AppRole) || 'cliente';
  });

  // Admin Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('role');
      const tab = params.get('tab');
      if (r === 'admin' || tab === 'admin' || tab === 'logistica' || tab === 'bodega' || tab === 'intranet') {
        return true;
      }
    }
    return localStorage.getItem('colorlink_admin_auth') === 'true';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState<FMVFormData>(() => {
    const saved = localStorage.getItem('colorlink_current_fmv');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_FORM_DATA;
      }
    }
    return INITIAL_FORM_DATA;
  });

  const [orders, setOrders] = useState<COLORLINKOrder[]>(() => {
    try {
      const saved = localStorage.getItem('colorlink_user_orders') || localStorage.getItem('colorlink_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filtrar órdenes simuladas corruptas antiguas si existieran
          const clean = parsed.filter((o: any) => {
            if (!o) return false;
            const id = String(o.id || '').toLowerCase();
            const num = String(o.numeroOrden || '').toLowerCase();
            if (num.includes('clk-') || id.includes('clk-')) return true;
            if (id === 'ord-init-1' || id === 'ord-init-2') return false;
            if (id.includes('a93ec3fe') || num.includes('a93ec3fe') || num.includes('sb-a93ec3fe')) return false;
            return true;
          });
          if (clean.length > 0) {
            localStorage.setItem('colorlink_user_orders', JSON.stringify(clean));
            localStorage.setItem('colorlink_orders', JSON.stringify(clean));
            return clean;
          }
        }
      }
    } catch (e) {
      console.error('Error cargando pedidos en inicio:', e);
    }
    // Si es la primera vez que se usa la app y localStorage está vacío, asignar las órdenes de prueba iniciales (mock data) y guardarlas en localStorage
    const initialMocks = DEFAULT_PROFILE_MOCK_ORDERS;
    try {
      localStorage.setItem('colorlink_user_orders', JSON.stringify(initialMocks));
      localStorage.setItem('colorlink_orders', JSON.stringify(initialMocks));
    } catch {}
    return initialMocks;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('colorlink_inventory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_INVENTORY;
      }
    }
    return INITIAL_INVENTORY;
  });

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | undefined>(undefined);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    id: number;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [lastSavedOrder, setLastSavedOrder] = useState<COLORLINKOrder | null>(null);

  // Supabase State & Products
  const [supabaseProducts, setSupabaseProducts] = useState<SupabaseProducto[]>([]);
  const [isUsingSupabaseCatalog, setIsUsingSupabaseCatalog] = useState<boolean>(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(isSupabaseConfigured);

  // Load products from Supabase ('productos' table)
  const loadCatalogFromSupabase = useCallback(async () => {
    try {
      const res = await fetchSupabaseProducts();
      if (res.data && res.data.length > 0) {
        setSupabaseProducts(res.data);
        setIsUsingSupabaseCatalog(res.fromSupabase);
        setIsSupabaseLive(res.fromSupabase);
      }
    } catch (err) {
      console.warn('Could not load Supabase catalog:', err);
    }
  }, []);

  // Sync projects from Supabase (SELECT directo a la tabla 'proyectos')
  const loadProjectsFromSupabase = useCallback(async () => {
    try {
      const res = await fetchSupabaseProjects();
      if (res.fromSupabase && res.data && res.data.length > 0) {
        setIsSupabaseLive(true);
        // Map Supabase rows to COLORLINKOrder items
        const mappedOrders: COLORLINKOrder[] = res.data.map((sbProj) => {
          const clientName = sbProj.clientes?.nombre || 'Cliente General';
          const docNum = sbProj.clientes?.numero_documento || 'Sin Documento';
          const docType = (sbProj.clientes?.tipo_documento as any) || 'NIT';
          const city = sbProj.clientes?.ciudad || 'Bogotá D.C.';
          const prodName = sbProj.producto_nombre || sbProj.productos?.nombre || 'Pintura Pintuco Especial';

          const synthesizedForm: FMVFormData = {
            tipo_documento: docType,
            documento: docNum,
            nombre_razon_social: clientName,
            responsable_contacto: clientName,
            canal_entrada: 'Portal Web B2B',
            ciudad: city,
            tipo_obra: 'Obra Registrada Supabase',
            area_m2: Number(sbProj.area_m2) || 100,
            fecha_requerida: getFutureDateString(3),
            producto_deseado: prodName,
            superficie: 'Pañete / Revoque Liso',
            ambiente: sbProj.productos?.ambiente?.includes('Exterior') ? 'Exterior Fachada' : 'Interior',
            condicion: (sbProj.condicion_pared as any) || 'Buen Estado / Repinte',
            color_acabado: 'Color Estándar',
          };

          const calculated = calculateMaterials(synthesizedForm);

          // Map estado_pedido ('Cotizado', 'Radicado', 'En Alistamiento', etc.) to COLORLINKOrder['estado']
          let mappedStatus: COLORLINKOrder['estado'] = 'Cotizado';
          if (sbProj.estado_pedido === 'Cotizado') mappedStatus = 'Cotizado';
          else if (sbProj.estado_pedido === 'Radicado' || sbProj.estado_pedido === 'Pendiente Alistamiento') mappedStatus = 'Pendiente Alistamiento';
          else if (sbProj.estado_pedido === 'En Alistamiento' || sbProj.estado_pedido === 'En Producción') mappedStatus = 'En Producción';
          else if (sbProj.estado_pedido === 'Listo para Despacho') mappedStatus = 'Listo para Despacho';
          else if (sbProj.estado_pedido === 'Despachado') mappedStatus = 'Despachado';
          else if (sbProj.estado_pedido === 'Entregado') mappedStatus = 'Entregado';

          return {
            id: sbProj.id,
            numeroOrden: `SB-${sbProj.id.slice(0, 8).toUpperCase()}`,
            fechaCreacion: sbProj.created_at || sbProj.fecha_creacion || new Date().toISOString(),
            form: synthesizedForm,
            calculo: {
              ...calculated,
              productoSugerido: prodName,
              galonesPintura: Number(sbProj.galones_pintura) || calculated.galonesPintura,
              galonesSellador: Number(sbProj.galones_sellador) ?? calculated.galonesSellador,
            },
            estado: mappedStatus,
            responsableAlistamiento: 'Bodega Central (Supabase)',
            observacionesBodega: `Registrado en Supabase (tabla proyectos). ID: ${sbProj.id}`,
          };
        }).filter((o) => {
          const id = String(o.id || '').toLowerCase();
          const num = String(o.numeroOrden || '').toLowerCase();
          const name = String(o.form?.nombre_razon_social || '').toLowerCase();
          const doc = String(o.form?.documento || '').replace(/[\.\-\s]/g, '');
          if (id.includes('a93ec3fe') || num.includes('a93ec3fe') || num.includes('sb-a93ec3fe')) return false;
          if (name.includes('sara ramirez') || doc.includes('1028727371')) return false;
          return true;
        });

        // Merge with existing non-conflicting orders
        setOrders((prev) => {
          const supabaseIds = new Set(mappedOrders.map((o) => o.id));
          const filteredLocal = prev.filter((o) => !supabaseIds.has(o.id));
          return [...mappedOrders, ...filteredLocal];
        });
      }
    } catch (err) {
      console.warn('Could not sync projects from Supabase:', err);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    loadCatalogFromSupabase();
    loadProjectsFromSupabase();
  }, [loadCatalogFromSupabase, loadProjectsFromSupabase]);

  // Modals and tabs state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNLPOpen, setIsNLPOpen] = useState(false);
  const [isCustomerInquiryOpen, setIsCustomerInquiryOpen] = useState(false);
  const [isPrintableOpen, setIsPrintableOpen] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<COLORLINKOrder | null>(null);

  // Cerrar y minimizar automáticamente el chat de IA cuando se abre el modal/sección de PQRS
  useEffect(() => {
    if (isCustomerInquiryOpen) {
      setIsChatOpen(false);
    }
  }, [isCustomerInquiryOpen]);

  useEffect(() => {
    const handleCloseChat = () => setIsChatOpen(false);
    window.addEventListener('colorlink_close_ai_chat', handleCloseChat);
    return () => window.removeEventListener('colorlink_close_ai_chat', handleCloseChat);
  }, []);

  // E-commerce Platform Modals & States with URL Synchronization
  const [activeClientTab, setActiveClientTab] = useState<ClientNavigationTab | 'tracking'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('categoria') || params.get('cat');
      const tabParam = params.get('tab');
      if (catParam || tabParam === 'catalog' || tabParam === 'catalogo') {
        return 'catalog';
      }
      if (tabParam === 'cotizador' || tabParam === 'calculadora') {
        return 'cotizador';
      }
      if (tabParam === 'cobertura' || tabParam === 'tiendas' || tabParam === 'mapa') {
        return 'cobertura';
      }
      if (tabParam === 'nosotros') {
        return 'nosotros';
      }
      if (tabParam === 'tracking' || tabParam === 'rastreo') {
        return 'tracking';
      }
      if (tabParam === 'favorites' || tabParam === 'favoritos') {
        return 'favorites';
      }
    }
    return 'home';
  });

  const [authInitialTab, setAuthInitialTab] = useState<'client' | 'corporate'>('client');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [catalogCategory, setCatalogCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('categoria') || params.get('cat');
      if (catParam) {
        return catParam;
      }
    }
    return 'Todos';
  });

  const handleSelectCategory = (category: string) => {
    setCatalogCategory(category);
    setActiveClientTab('catalog');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (category.toLowerCase() === 'todos') {
        url.searchParams.delete('categoria');
        url.searchParams.delete('cat');
      } else {
        url.searchParams.set('categoria', category);
      }
      url.searchParams.set('tab', 'catalog');
      window.history.pushState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('categoria') || params.get('cat');
      const tabParam = params.get('tab');
      if (catParam) {
        setCatalogCategory(catParam);
        setActiveClientTab('catalog');
      } else if (tabParam) {
        setActiveClientTab(tabParam as ClientNavigationTab);
      } else {
        setActiveClientTab('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCompanyHistoryOpen, setIsCompanyHistoryOpen] = useState(false);
  const [isCoverageOpen, setIsCoverageOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<CatalogProduct | null>(null);

  // Cart State with localStorage persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('colorlink_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('colorlink_cart', JSON.stringify(cart));
  }, [cart]);

  // User Session State: Restaura sesión activa desde 'currentUser' o 'colorlink_user_session', sincronizada con 'pintuco_users_db'
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('currentUser') || localStorage.getItem('colorlink_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn === true && (parsed.email || parsed.nombre)) {
          // Sincronizar Cédula/NIT y datos más recientes desde 'pintuco_users_db'
          const usersDb = getPintucoUsersDb();
          const normEmail = normalizeEmail(parsed.email);
          const normDoc = normalizeDocument(parsed.documento || parsed.cedula);

          const dbUser = usersDb.find(u => 
            (normEmail && normalizeEmail(u.email) === normEmail) ||
            (normDoc && normalizeDocument(u.cedula) === normDoc)
          );

          if (dbUser) {
            const restored: UserSession = {
              ...parsed,
              nombre: dbUser.nombre || parsed.nombre,
              documento: dbUser.cedula || parsed.documento,
              telefono: dbUser.telefono || parsed.telefono,
              email: dbUser.email || parsed.email,
              tipoDocumento: dbUser.tipoDocumento || parsed.tipoDocumento || 'CC',
              direcciones: dbUser.direcciones && dbUser.direcciones.length > 0 ? dbUser.direcciones : (parsed.direcciones || []),
            };
            syncActiveSession(restored);
            return restored;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error cargando sesión persistente:', e);
    }
    return null;
  });

  // Mis Favoritos vinculados estrictamente al perfil del usuario autenticado
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    const isAuth = Boolean(userSession && (userSession.isLoggedIn === true || (userSession.email && userSession.email.trim().length > 0)));
    if (!isAuth) return [];
    const userIdentifier = userSession?.documento || userSession?.email || userSession?.id || null;
    return getStoredFavorites(userIdentifier);
  });

  // Sincronizar y recargar favoritos al cambiar la sesión (login/logout)
  useEffect(() => {
    const isAuth = Boolean(userSession && (userSession.isLoggedIn === true || (userSession.email && userSession.email.trim().length > 0)));
    if (!isAuth) {
      setFavoriteIds([]);
      return;
    }
    const userIdentifier = userSession?.documento || userSession?.email || userSession?.id || null;
    const userFavs = getStoredFavorites(userIdentifier);
    setFavoriteIds(userFavs);
    if (userIdentifier) {
      syncFavoritesWithSupabase(userIdentifier, userFavs).then((synced) => {
        setFavoriteIds(synced);
      });
    }
  }, [userSession?.documento, userSession?.email, userSession?.id, userSession?.isLoggedIn]);

  // Si el usuario no está autenticado e intenta navegar a favoritos, redirigir al inicio
  useEffect(() => {
    const isAuth = Boolean(userSession && (userSession.isLoggedIn === true || (userSession.email && userSession.email.trim().length > 0)));
    if (activeClientTab === 'favorites' && !isAuth) {
      setActiveClientTab('home');
    }
  }, [activeClientTab, userSession]);

  const handleToggleFavorite = (productId: string) => {
    const isAuth = Boolean(userSession && (userSession.isLoggedIn === true || (userSession.email && userSession.email.trim().length > 0)));
    if (!isAuth) {
      setAuthInitialTab('client');
      setAuthMode('login');
      setAuthReason('Inicia sesión para guardar productos en tus favoritos y sincronizarlos con tu cuenta.');
      setIsAuthOpen(true);
      showToast('Inicia sesión para guardar productos en tus favoritos');
      return;
    }
    const userIdentifier = userSession?.documento || userSession?.email || userSession?.id || null;
    const updated = toggleStoredFavorite(userIdentifier, productId, favoriteIds);
    setFavoriteIds(updated);
    const isNowFav = updated.includes(productId);
    showToast(isNowFav ? 'Producto añadido a tus favoritos' : 'Producto removido de tus favoritos');
  };

  // User Profile Modal State ("Mi Perfil")
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'datos' | 'pedidos' | 'orders' | 'direcciones' | 'seguridad' | 'solicitudes'>('datos');

  const handleOpenUserProfile = (tab: 'datos' | 'pedidos' | 'orders' | 'direcciones' | 'seguridad' | 'solicitudes' = 'datos') => {
    setProfileInitialTab(tab);
    setIsProfileOpen(true);
  };

  // Panel Unificado de Notificaciones & Mis Solicitudes (Seguimiento CEDI y PQRS SAC)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [notificationsInitialTab, setNotificationsInitialTab] = useState<'seguimiento' | 'pqrs' | 'notificaciones'>('notificaciones');

  const handleOpenNotifications = (tab: 'seguimiento' | 'pqrs' | 'notificaciones' = 'notificaciones') => {
    if (tab === 'pqrs') {
      setIsChatOpen(false);
    }
    setNotificationsInitialTab(tab);
    setIsNotificationsOpen(true);
  };

  // Conteo de notificaciones de órdenes estrictamente para el usuario autenticado
  const userNotificationsCount = useMemo(() => {
    if (!userSession || (!userSession.isLoggedIn && !userSession.email)) return 0;
    const userEmail = (userSession.email || '').trim().toLowerCase();
    const userDoc = ((userSession as any).cedula || (userSession as any).documento || '').replace(/[\.\-\s]/g, '').toLowerCase();
    const userName = (userSession.nombre || '').trim().toLowerCase();
    const userId = (userSession.id || '').trim().toLowerCase();

    return orders.filter((o) => {
      const oEmail = (o.customerEmail || o.form?.responsable_contacto || '').trim().toLowerCase();
      const oDoc = (o.customerDocument || o.form?.documento || '').replace(/[\.\-\s]/g, '').toLowerCase();
      const oName = (o.customerName || o.form?.nombre_razon_social || '').trim().toLowerCase();
      const oUserId = String((o as any).userId || (o as any).customerId || (o as any).clienteId || '').trim().toLowerCase();

      return (
        (userEmail && oEmail && (oEmail === userEmail || oEmail.includes(userEmail))) ||
        (userDoc && oDoc && oDoc === userDoc) ||
        (userId && oUserId && oUserId === userId) ||
        (userName && oName && (oName === userName || oName.includes(userName)))
      );
    }).length;
  }, [orders, userSession]);

  // Omni-channel Notifications Modal State
  const [isOmniNoticeOpen, setIsOmniNoticeOpen] = useState<boolean>(false);
  const [omniNoticeOrder, setOmniNoticeOrder] = useState<COLORLINKOrder | null>(null);

  // Admin Sub-Tab: 'intranet' (Intranet & Kanban), 'rbac' (Departmental RBAC) or 'bodega' (Warehouse)
  const [adminTab, setAdminTab] = useState<'intranet' | 'rbac' | 'bodega'>('intranet');

  // Detección segura y robusta de Intranet / Vista Corporativa para ocultar el bot de IA
  const isIntranetActive = useMemo(() => {
    if (userRole !== 'cliente' || Boolean(userSession?.isCorporate)) {
      return true;
    }
    return checkIsIntranetRoute({
      userRole,
      isCorporateSession: Boolean(userSession?.isCorporate),
      activeTab: activeClientTab,
      adminSubTab: adminTab,
    });
  }, [userRole, userSession, activeClientTab, adminTab]);

  const handleClientLogin = (session: UserSession, isNewRegistration: boolean = false) => {
    const token = `token-client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const sessionWithToken: UserSession = {
      ...session,
      isLoggedIn: true,
      sessionToken: token,
    };
    sessionStorage.setItem('colorlink_auth_token', token);
    syncActiveSession(sessionWithToken);
    setUserSession(sessionWithToken);
    setUserRole('cliente');

    // Requisito 3: Al registrar una cuenta nueva o iniciar sesión por primera vez con un usuario,
    // el carrito de compras debe inicializarse completamente VACÍO (0 elementos).
    const userIdentifier = session.documento || session.email || 'anon';
    const userKey = userIdentifier.replace(/[^a-zA-Z0-9]/g, '_');
    const seenUserKey = `colorlink_user_seen_${userKey}`;
    const isFirstTime = isNewRegistration || !localStorage.getItem(seenUserKey);

    if (isFirstTime) {
      localStorage.setItem(seenUserKey, 'true');
      setCart([]);
      localStorage.removeItem('colorlink_cart');
      localStorage.setItem('colorlink_cart', '[]');
    }

    // Al volver a iniciar sesión, cargar de inmediato los pedidos almacenados para ese perfil desde localStorage
    try {
      const stored = localStorage.getItem('colorlink_user_orders') || localStorage.getItem('colorlink_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOrders(parsed);
        }
      }
    } catch (e) {
      console.error('Error cargando pedidos al iniciar sesión:', e);
    }

    setFormData((prev) => ({
      ...prev,
      nombre_razon_social: session.nombre,
      documento: session.documento,
      tipo_documento: session.tipoDocumento || 'NIT',
      responsable_contacto: session.nombre,
      ciudad: session.ciudad || prev.ciudad,
    }));
    showToast(`Bienvenido/a, ${session.nombre}`);
  };

  const handleCorporateLogin = (session: UserSession, role: CorporateRole) => {
    const token = `token-corp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const updatedSession: UserSession = {
      ...session,
      isLoggedIn: true,
      isCorporate: true,
      corporateRole: role,
      sessionToken: token,
    };
    sessionStorage.setItem('colorlink_auth_token', token);
    syncActiveSession(updatedSession);
    localStorage.setItem('colorlink_admin_auth', 'true');
    localStorage.setItem('colorlink_user_role', 'admin');
    setUserSession(updatedSession);
    setUserRole('admin');
    setIsAdminAuthenticated(true);
    setAdminTab('intranet');
    showToast(`Sesión Corporativa iniciada: ${session.departamento || role.toUpperCase()}`);
  };

  const handleOpenOmniForOrder = (order: COLORLINKOrder) => {
    setOmniNoticeOrder(order);
    setIsOmniNoticeOpen(true);
  };

  const handleOpenGeneralOmni = () => {
    if (orders.length > 0) {
      setOmniNoticeOrder(orders[0]);
    }
    setIsOmniNoticeOpen(true);
  };

  const handleAddToCart = (item: CartItem) => {
    setCart((prev) => {
      const extractColorKey = (colorStr?: string): string => {
        if (!colorStr) return '';
        const trimmed = colorStr.trim().toLowerCase();
        const parenMatch = trimmed.match(/\((?:#)?([a-z0-9]+)\)/i);
        if (parenMatch) return parenMatch[1].toLowerCase();
        const hexMatch = trimmed.match(/#([a-z0-9]+)/i);
        if (hexMatch) return hexMatch[1].toLowerCase();
        return trimmed.replace(/[^a-z0-9áéíóúüñ]/gi, '').toLowerCase();
      };

      const normalizePresentation = (pres?: string): string => {
        if (!pres) return 'galon';
        const p = pres.trim().toLowerCase();
        if (p.includes('cuñete') || p.includes('cunete') || p.includes('5 gal')) return 'cunete';
        if (p.includes('cuarto') || p.includes('1/4')) return 'cuarto';
        if (p.includes('gal')) return 'galon';
        return p;
      };

      const newSku = (item.sku || '').trim().toLowerCase();
      const newColor = extractColorKey(item.colorSeleccionado);
      const newPres = normalizePresentation(item.presentacion);
      const newName = (item.nombre || '').trim().toLowerCase();

      const idx = prev.findIndex((i) => {
        const itemSku = (i.sku || '').trim().toLowerCase();
        const itemColor = extractColorKey(i.colorSeleccionado);
        const itemPres = normalizePresentation(i.presentacion);
        const itemName = (i.nombre || '').trim().toLowerCase();

        // 1. Si ambos tienen SKU definido, comparar SKU + color + presentación
        if (newSku && itemSku && newSku === itemSku) {
          return itemColor === newColor && itemPres === newPres;
        }

        // 2. Si el SKU no coincide o está ausente, comparar por nombre + color + presentación
        return itemName === newName && itemColor === newColor && itemPres === newPres;
      });

      if (idx > -1) {
        const updated = [...prev];
        const existing = updated[idx];
        const newQty = existing.cantidad + (item.cantidad || 1);
        updated[idx] = {
          ...existing,
          cantidad: newQty,
          subtotal: newQty * existing.precioUnitario,
        };
        return updated;
      }

      const calculatedSubtotal = (item.cantidad || 1) * (item.precioUnitario || 0);
      return [...prev, { ...item, subtotal: item.subtotal || calculatedSubtotal }];
    });
    showToast(`"${item.nombre}" (${item.cantidad || 1} ${item.presentacion}) añadido al carrito`);
  };

  const handleUpdateCartQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveCartItem(id);
      return;
    }
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, cantidad: qty } : item)));
  };

  const handleRemoveCartItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showToast('Producto eliminado del carrito');
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('Carrito de compras vaciado');
  };

  const handleCartCheckout = () => {
    setIsCartOpen(false);
    if (!userSession || !userSession.isLoggedIn) {
      setAuthMode('login');
      setAuthReason('Para procesar tu pedido y despacho a obra, debes Iniciar Sesión o Registrarte.');
      setIsAuthOpen(true);
      showToast('Por favor inicia sesión o regístrate para completar tu pedido');
      return;
    }
    setActiveClientTab('cotizador');
    showToast('Procesando solicitud de despacho a obra');
  };

  // Synchronous calculation
  const calculation: CalculationResult = useMemo(() => {
    return calculateMaterials(formData);
  }, [formData]);

  // Persist role with Authentication Protection
  const handleRoleChange = (newRole: AppRole) => {
    if (newRole === 'admin') {
      if (!isAdminAuthenticated) {
        setIsAdminLoginOpen(true);
        return;
      }
      setUserRole('admin');
      localStorage.setItem('colorlink_user_role', 'admin');
      showToast('Bienvenida al Panel Administrador');
    } else {
      setUserRole('cliente');
      localStorage.setItem('colorlink_user_role', 'cliente');
      showToast('Cambiado a Vista Cliente');
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    localStorage.setItem('colorlink_admin_auth', 'true');
    setUserRole('admin');
    localStorage.setItem('colorlink_user_role', 'admin');
    setIsAdminLoginOpen(false);
    showToast('Sesión de Administrador iniciada correctamente');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('colorlink_admin_auth');
    sessionStorage.removeItem('colorlink_auth_token');
    syncActiveSession(null);
    setUserSession(null);
    setUserRole('cliente');
    localStorage.setItem('colorlink_user_role', 'cliente');
    showToast('Sesión cerrada. Acceso restringido');
  };

  const handleUserLogout = async () => {
    // 1. Supabase Auth signOut si está disponible
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Error en supabase signOut:', e);
    }

    // 2. Limpieza de LocalStorage y SessionStorage según requerimiento
    localStorage.removeItem('colorlink_user');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('colorlink_user_session');
    localStorage.removeItem('colorlink_auth_token');
    localStorage.removeItem('colorlink_admin_auth');
    localStorage.removeItem('colorlink_cart');
    sessionStorage.removeItem('colorlink_auth_token');

    // 3. Reiniciar el carrito a 0 items y limpiar favoritos activos
    setCart([]);
    setFavoriteIds([]);
    if (activeClientTab === 'favorites') {
      setActiveClientTab('home');
    }

    // 4. Limpiar estado de sesión y desvincular historial de chat para vista de visitante
    syncActiveSession(null);
    setUserSession(null);
    setUserRole('cliente');
    setIsAdminAuthenticated(false);
    localStorage.setItem('colorlink_user_role', 'cliente');

    // 5. Notificar a componentes (Header, AIChatDrawer, etc.) para sincronizar estado de inmediato
    window.dispatchEvent(new Event('colorlink_user_changed'));
    window.dispatchEvent(new Event('storage'));

    showToast('Has cerrado sesión correctamente. Carrito reiniciado a 0 items.');
  };

  // Persist form to localStorage
  useEffect(() => {
    localStorage.setItem('colorlink_current_fmv', JSON.stringify(formData));
  }, [formData]);

  // Persist orders to localStorage (permanente bajo colorlink_user_orders)
  useEffect(() => {
    try {
      localStorage.setItem('colorlink_user_orders', JSON.stringify(orders));
      localStorage.setItem('colorlink_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Error sincronizando localStorage:', e);
    }
  }, [orders]);

  // Persist inventory to localStorage
  useEffect(() => {
    localStorage.setItem('colorlink_inventory', JSON.stringify(inventory));
  }, [inventory]);

  // Toast notification helper con soporte para acciones como "Ver en Mi Perfil"
  const showToast = useCallback((msg: string, actionLabel?: string, onAction?: () => void) => {
    const id = Date.now();
    setToast({ id, message: msg, actionLabel, onAction });
    const timeout = actionLabel ? 7500 : 4000;
    setTimeout(() => {
      setToast((cur) => (cur?.id === id ? null : cur));
    }, timeout);
  }, []);

  // Botón de control / prueba: Permite restablecer la memoria local de órdenes
  const handleResetAllOrdersData = () => {
    try {
      localStorage.removeItem('colorlink_user_orders');
      localStorage.removeItem('colorlink_orders');
      localStorage.setItem('colorlink_user_orders', JSON.stringify(DEFAULT_PROFILE_MOCK_ORDERS));
      localStorage.setItem('colorlink_orders', JSON.stringify(DEFAULT_PROFILE_MOCK_ORDERS));
      setOrders(DEFAULT_PROFILE_MOCK_ORDERS);
      showToast('Memoria local restablecida con pedidos de prueba iniciales');
    } catch {
      showToast('Error al reiniciar pedidos en localStorage');
    }
  };

  // Run AI Diagnosis with Gemini API
  const runAIDiagnosis = useCallback(async () => {
    setIsLoadingAI(true);
    try {
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: formData,
          calculation,
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setAiAnalysis(data.analysis);
        showToast('Diagnóstico técnico de IA actualizado con éxito');
      } else {
        showToast('No se pudo completar el análisis de IA');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al conectar con el motor de IA');
    } finally {
      setIsLoadingAI(false);
    }
  }, [formData, calculation, showToast]);

  // Handle Field Change
  const handleFieldChange = (field: keyof FMVFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Apply Preset
  const handleApplyPreset = (presetData: FMVFormData) => {
    setFormData(presetData);
    showToast(`Plantilla "${presetData.tipo_obra}" cargada`);
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      tipo_documento: 'NIT',
      documento: '',
      nombre_razon_social: '',
      responsable_contacto: '',
      canal_entrada: 'Asesor Comercial',
      ciudad: 'Medellín',
      tipo_obra: 'Residencial Nuevo',
      area_m2: 100,
      fecha_requerida: getFutureDateString(5),
      superficie: 'Pañete / Revoque Liso',
      ambiente: 'Interior',
      condicion: 'Buen Estado / Repinte',
      color_acabado: 'Blanco Puro Mate 1001',
    });
    setAiAnalysis(undefined);
    setLastSavedOrder(null);
    showToast('Formulario FMV reiniciado');
  };

  // Apply Extracted NLP Data
  const handleApplyExtractedData = (extracted: FMVFormData) => {
    setFormData(extracted);
    showToast('¡Datos extraídos con IA aplicados al formulario FMV!');
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {}
  };

  // Save Order / Cotización
  const handleSaveOrder = async (tipo: 'pedido' | 'cotizacion' = 'pedido') => {
    // RESTRICCIÓN OBLIGATORIA: Cualquier persona puede calcular/cotizar libremente, pero para realizar el pedido o guardar cotización debe Iniciar Sesión o Registrarse
    if (!userSession || !userSession.isLoggedIn) {
      setAuthMode('login');
      setAuthReason(
        tipo === 'pedido'
          ? 'Para radicar este pedido a bodega Pintuco, debes Iniciar Sesión o Registrarte.'
          : 'Para guardar esta cotización en tu perfil, debes Iniciar Sesión o Registrarte.'
      );
      setIsAuthOpen(true);
      showToast('Por favor inicia sesión o regístrate para continuar');
      return;
    }

    if (!formData.nombre_razon_social.trim() || !formData.documento.trim()) {
      showToast('Por favor complete el nombre del cliente y documento antes de guardar');
      return;
    }

    setIsSavingOrder(true);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `#CLK-${randomCode}`;
    const orderId = `CLK-${Date.now()}`;
    const estadoFinal: COLORLINKOrder['estado'] = tipo === 'cotizacion' ? 'Cotización Guardada' : 'En Bodega';

    const calculatedTotal = calculation.costo_total_estimado || (
      (calculation.cuñetesPintura * 350000) +
      (calculation.galonesSueltosPintura * 82000) +
      (calculation.requiereSellador ? calculation.galonesSellador * 68000 : 0) +
      (calculation.costo_flete || 0)
    );

    const newOrder: COLORLINKOrder = {
      id: orderId,
      numeroOrden: orderNumber,
      fechaCreacion: new Date().toISOString(),
      form: { ...formData },
      calculo: { ...calculation, costo_total_estimado: calculatedTotal },
      aiAnalysis,
      estado: estadoFinal,
      responsableAlistamiento: 'Bodega Central Pintuco',
      customerDocument: userSession.documento || formData.documento,
      customerName: userSession.nombre || formData.nombre_razon_social,
      customerEmail: userSession.email || (formData as any).correo_electronico,
      customerPhone: userSession.telefono || formData.telefono,
      direccionEntrega: formData.direccion_obra || `${formData.ciudad}, Colombia`,
      ciudadEntrega: formData.ciudad,
      departamentoEntrega: formData.departamento || 'Colombia',
      total: calculatedTotal,
    };

    // 1. PERSISTENCIA INMEDIATA EN LOCALSTORAGE (colorlink_user_orders y colorlink_orders)
    // Obtén la lista actual de pedidos desde localStorage, agrega la nueva orden al inicio de la lista y guarda de nuevo el array actualizado en localStorage.
    let currentSavedOrders: COLORLINKOrder[] = [];
    try {
      const stored = localStorage.getItem('colorlink_user_orders') || localStorage.getItem('colorlink_orders');
      if (stored) {
        currentSavedOrders = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error leyendo orders desde localStorage:', e);
    }

    const updatedOrdersList = [
      newOrder,
      ...currentSavedOrders.filter((o) => o.id !== newOrder.id && o.numeroOrden !== newOrder.numeroOrden),
    ];

    try {
      localStorage.setItem('colorlink_user_orders', JSON.stringify(updatedOrdersList));
      localStorage.setItem('colorlink_orders', JSON.stringify(updatedOrdersList));
    } catch (e) {
      console.error('Error guardando orders en localStorage:', e);
    }

    // Actualización inmediata en memoria de orders
    setOrders(updatedOrdersList);
    setLastSavedOrder(newOrder);

    // 2. DESCUENTO AUTOMÁTICO DE STOCK EN INVENTARIO (KARDEX) SI ES PEDIDO
    if (tipo === 'pedido') {
      try {
        const resDescuento = descontarInventarioPorPedido(newOrder, userSession.nombre || 'Cliente Web');
        if (resDescuento.exito) {
          console.log('Stock descontado exitosamente:', resDescuento.mensaje);
        }
      } catch (e) {
        console.error('Error descontando stock en pedido:', e);
      }
    }

    // 3. INDICADOR VISUAL DE CONFIRMACIÓN (Toast Alert) CON OPCIÓN DIRECTA A "Ver en Mi Perfil"
    const successToastMessage = tipo === 'cotizacion'
      ? `¡Cotización ${orderNumber} guardada en tu perfil con éxito!`
      : `¡Pedido ${orderNumber} radicado y descontado de bodega con éxito!`;

    showToast(
      successToastMessage,
      'Ver en Mi Perfil',
      () => {
        handleOpenUserProfile('pedidos');
      }
    );

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    try {
      // INSERCIÓN DE DATOS COMPLEMENTARIA EN SUPABASE (si está configurado)
      const sbResult = await insertSupabaseOrder(formData, calculation, orderNumber);
      if (sbResult.fromSupabase && sbResult.success) {
        await loadProjectsFromSupabase();
      }

      // Persistencia complementaria en API local / buffer
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder),
        });
      } catch (_) {}
    } catch (err: any) {
      console.warn('Nota de inserción en backend complementario:', err);
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Update order status (Admin & Logística)
  const handleUpdateOrderStatus = async (
    id: string,
    newStatus: COLORLINKOrder['estado'],
    updates?: Partial<COLORLINKOrder>
  ) => {
    try {
      // Sync update with Supabase if ID matches a UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        await updateSupabaseProjectStatus(id, newStatus);
      }

      await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus, ...(updates || {}) }),
      });
    } catch (err) {
      console.error(err);
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const mergedOrder: COLORLINKOrder = { ...o, estado: newStatus, ...(updates || {}) };
          // Si pasa a estado Aprobado / Listo para Despacho, En preparación o Despachado
          const isTransitionToActive =
            newStatus === 'En preparación' ||
            newStatus === 'Despachado' ||
            newStatus === 'Aprobado' ||
            newStatus === 'Aprobado / Listo para Despacho' ||
            (typeof newStatus === 'string' && (newStatus.toLowerCase().includes('aprobado') || newStatus.toLowerCase().includes('listo')));
          const wasAlreadyActive = o.estado === 'En preparación' || o.estado === 'Despachado' || o.estado === 'En tránsito' || o.estado === 'Entregado';

          if (isTransitionToActive && !wasAlreadyActive) {
            try {
              descontarInventarioPorPedido(mergedOrder, userSession?.nombre || 'Funcionario Logística CEDI');
            } catch (e) {
              console.error('Error al descontar stock por cambio de estado:', e);
            }
          }
          return mergedOrder;
        }
        return o;
      })
    );
    showToast(`Estado actualizado a: ${newStatus}`);
  };

  // Update order details (Admin notes, tracking)
  const handleUpdateOrderDetails = (id: string, updates: Partial<COLORLINKOrder>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
    showToast('Datos de despacho y notas de bodega guardadas');
  };

  // Update inventory stock (Admin)
  const handleUpdateStock = (id: string, newGalones: number) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stockGalones: newGalones,
              stockCuñetes: Math.floor(newGalones / 5),
            }
          : item
      )
    );
    showToast('Stock de bodega actualizado');
  };

  // Add new lot (Admin)
  const handleAddNewLot = (id: string, additionalGalones: number, lotNumber: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              stockGalones: item.stockGalones + additionalGalones,
              stockCuñetes: Math.floor((item.stockGalones + additionalGalones) / 5),
              ultimoLote: lotNumber,
            }
          : item
      )
    );
    showToast(`Ingreso de ${additionalGalones} galones registrado con lote ${lotNumber}`);
  };

  // Open printable order modal
  const handleOpenPrintableOrder = (order: COLORLINKOrder) => {
    setOrderToPrint(order);
    setIsPrintableOpen(true);
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-[#003366] selection:text-white overflow-x-hidden">
      
      {/* Toast Notification Flotante con Soporte para Acciones como "Ver en Mi Perfil" */}
      {toast && (
        <div 
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 right-6 z-50 bg-white text-slate-800 text-xs sm:text-sm font-semibold px-4 py-3.5 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-3 animate-bounce max-w-md backdrop-blur-md"
        >
          <div className="w-7 h-7 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-slate-800 block leading-tight">{toast.message}</span>
          </div>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
              className="shrink-0 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <span>{toast.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-200" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-1 ml-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Navigation with Role Switcher (E-commerce Header) */}
      <Header
        currentRole={userRole}
        isAuthenticatedAdmin={isAdminAuthenticated}
        onRoleChange={handleRoleChange}
        onLogoutAdmin={handleAdminLogout}
        onOpenHistory={() => {
          setActiveClientTab('tracking');
          setIsHistoryOpen(true);
        }}
        onOpenCatalog={() => {
          setActiveClientTab('catalog');
        }}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenNLPExtractor={() => setIsNLPOpen(true)}
        onOpenSmartQuote={() => setActiveClientTab('cotizador')}
        onOpenCompanyHistory={() => setActiveClientTab('nosotros')}
        onOpenCoverage={() => setActiveClientTab('cobertura')}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={(mode?: 'login' | 'register') => {
          setAuthInitialTab('client');
          if (mode) setAuthMode(mode);
          else setAuthMode('login');
          setIsAuthOpen(true);
        }}
        onOpenCorporateAuth={() => {
          setAuthInitialTab('corporate');
          setIsAuthOpen(true);
        }}
        onOpenOmniNotification={handleOpenGeneralOmni}
        onSelectProduct={(prod) => {
          setSelectedProductForDetail(prod);
        }}
        onSelectCategory={handleSelectCategory}
        activeClientTab={activeClientTab}
        onSelectClientTab={(tab) => {
          if (tab === 'catalog') {
            handleSelectCategory('todos');
          } else {
            setActiveClientTab(tab);
          }
        }}
        favoriteIds={favoriteIds}
        onToggleFavorite={handleToggleFavorite}
        ordersCount={userNotificationsCount}
        cartCount={cart.reduce((sum, item) => sum + item.cantidad, 0)}
        userSession={userSession}
        onOpenProfile={(tab) => handleOpenUserProfile(tab || 'datos')}
        onLogout={handleUserLogout}
        onOpenNotifications={handleOpenNotifications}
      />

      {/* Main Content Area: Conditional based on User Role */}
      <main className={`main-content page-content content-wrapper flex-1 w-full mx-auto ${userRole === 'cliente' ? 'max-w-7xl px-4 sm:px-6 lg:px-8' : 'max-w-none px-2 sm:px-4 lg:px-6'} pt-2 sm:pt-2.5 pb-6 overflow-x-hidden relative z-1`}>
        
        {userRole === 'cliente' ? (
          /* VISTA CLIENTE: ACCESO CORPORATIVO Y E-COMMERCE */
          <ClientView
            formData={formData}
            userSession={userSession}
            onChange={handleFieldChange}
            onApplyPreset={handleApplyPreset}
            onReset={handleReset}
            onOpenNLPExtractor={() => setIsNLPOpen(true)}
            onOpenChat={() => setIsChatOpen(true)}
            onOpenPrintable={() => setIsPrintableOpen(true)}
            calculation={calculation}
            onSaveOrder={handleSaveOrder}
            isSaving={isSavingOrder}
            orders={orders}
            lastSavedOrder={lastSavedOrder}
            supabaseProducts={supabaseProducts}
            isUsingSupabaseCatalog={isUsingSupabaseCatalog}
            onOpenCompanyHistory={() => setActiveClientTab('nosotros')}
            onOpenCoverage={() => setActiveClientTab('cobertura')}
            onOpenCorporateAuth={() => {
              setAuthInitialTab('corporate');
              setIsAuthOpen(true);
            }}
            onSelectProductDetail={(product) => setSelectedProductForDetail(product)}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartOpen(true)}
            activeClientTab={activeClientTab}
            setActiveClientTab={setActiveClientTab}
            onOpenOmniNotification={handleOpenOmniForOrder}
            catalogCategory={catalogCategory}
            onSelectCategory={handleSelectCategory}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          /* VISTA ADMINISTRADOR & CORPORATIVA RBAC */
          <div className="space-y-6">
            {/* Admin Sub Navigation Toggle */}
            <div className="bg-white p-2.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setAdminTab('intranet')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    adminTab === 'intranet'
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>Intranet Corporativa (Noticias, Kanban, Áreas)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('rbac')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    adminTab === 'rbac'
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>ERP Departamental (RBAC: 6 Roles)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdminTab('bodega')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    adminTab === 'bodega'
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Consola Integral de Operaciones & Bodega</span>
                </button>
              </div>

              <div className="text-right pr-2">
                <span className="text-[11px] text-slate-500 block font-mono">
                  Sesión activa: <strong className="text-slate-900">{userSession.nombre || 'Administrador Corporativo'}</strong>
                </span>
                <span className="text-[10px] text-teal-600 font-semibold flex items-center justify-end gap-1">
                  <ShieldCheck className="w-3 h-3" /> Verificación 2FA SMS Activa
                </span>
              </div>
            </div>

            {adminTab === 'intranet' ? (
              <CorporateIntranetView
                userSession={userSession}
                onLogout={handleAdminLogout}
                orders={orders}
                onUpdateOrderStatus={(id, st, updates) => handleUpdateOrderStatus(id, st, updates)}
                onOpenOrderTracking={handleOpenOmniForOrder}
              />
            ) : adminTab === 'rbac' ? (
              <CorporateRBACDashboard
                userSession={userSession}
                onLogout={handleAdminLogout}
                orders={orders}
                onUpdateOrderStatus={(id, st) => handleUpdateOrderStatus(id, st)}
                onOpenOrderTracking={handleOpenOmniForOrder}
              />
            ) : (
              <AdminView
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onUpdateOrderDetails={handleUpdateOrderDetails}
                onSelectOrderForSimulation={(order) => {
                  setFormData(order.form);
                  if (order.aiAnalysis) setAiAnalysis(order.aiAnalysis);
                  showToast(`Orden ${order.numeroOrden} cargada en el simulador`);
                }}
                onOpenPrintable={handleOpenPrintableOrder}
                inventory={inventory}
                onUpdateStock={handleUpdateStock}
                onAddNewLot={handleAddNewLot}
                onLogout={handleAdminLogout}
                formData={formData}
                calculation={calculation}
                onFormChange={handleFieldChange}
                onApplyPreset={handleApplyPreset}
                onResetForm={handleReset}
                onOpenNLPExtractor={() => setIsNLPOpen(true)}
                aiAnalysis={aiAnalysis}
                onRunAIDiagnosis={runAIDiagnosis}
                isLoadingAI={isLoadingAI}
                onSaveOrderFromSimulator={handleSaveOrder}
                isSavingSimulator={isSavingOrder}
                supabaseProducts={supabaseProducts}
                isUsingSupabaseCatalog={isUsingSupabaseCatalog}
                onRefreshSupabase={() => {
                  loadCatalogFromSupabase();
                  loadProjectsFromSupabase();
                  showToast('Sincronizando con Supabase...');
                }}
                isSupabaseLive={isSupabaseLive}
              />
            )}
          </div>
        )}

      </main>

      {/* Footer Limpio Brisa Marina */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 text-xs text-slate-500 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span className="font-medium text-slate-600">Cumple con norma técnica NTC 1335 y especificaciones oficiales de producto.</span>
          <span className="text-[11px] text-slate-500 font-semibold">COLORLINK para Pintuco • Grupo AkzoNobel</span>
        </div>
      </footer>

      {/* Global Modals & Drawers */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      <OrdersHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orders={orders}
        userSession={userSession}
        onSelectOrder={(selectedOrder) => {
          setFormData(selectedOrder.form);
          if (selectedOrder.aiAnalysis) {
            setAiAnalysis(selectedOrder.aiAnalysis);
          }
          showToast(`Orden ${selectedOrder.numeroOrden} cargada en pantalla`);
        }}
        onUpdateStatus={handleUpdateOrderStatus}
      />

      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onAddToCart={handleAddToCart}
        onSelectProduct={(productName) => {
          handleFieldChange('producto_deseado', productName);
          const match = PINTUCO_CATALOG.find(p => p.nombre === productName);
          if (match) {
            if (match.presetSuperficie) {
              handleFieldChange('superficie', match.presetSuperficie);
            }
            if (match.presetAmbiente) {
              handleFieldChange('ambiente', match.presetAmbiente);
            }
          }
          showToast(`Producto "${productName}" seleccionado para cotizar`);
        }}
      />

      <AIChatDrawer
        isOpen={isChatOpen && !isIntranetActive}
        onClose={() => setIsChatOpen(false)}
        formData={formData}
        calculation={calculation}
        userSession={userSession}
        onNavigateTab={(tab) => {
          setActiveClientTab(tab);
          setIsChatOpen(false);
        }}
        onApplyCalculation={(area, productName) => {
          handleFieldChange('area_m2', area);
          if (productName) handleFieldChange('producto_deseado', productName);
          setActiveClientTab('cotizador');
          setIsChatOpen(false);
          showToast(`Cálculo de ${area} m² cargado en el Cotizador Inteligente`);
        }}
        onAddToCart={handleAddToCart}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenHumanSupport={() => {
          setIsChatOpen(false);
          setIsCustomerInquiryOpen(true);
        }}
      />

      <CustomerInquiryModal
        isOpen={isCustomerInquiryOpen}
        onClose={() => setIsCustomerInquiryOpen(false)}
      />

      <NLPExtractorModal
        isOpen={isNLPOpen}
        onClose={() => setIsNLPOpen(false)}
        onApplyExtractedData={handleApplyExtractedData}
      />

      <PrintableOrderModal
        isOpen={isPrintableOpen}
        onClose={() => {
          setIsPrintableOpen(false);
          setOrderToPrint(null);
        }}
        formData={orderToPrint ? orderToPrint.form : formData}
        calculation={orderToPrint ? orderToPrint.calculo : calculation}
      />

      {/* E-Commerce Shopping Cart Drawer */}
      <ShoppingCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onCheckout={handleCartCheckout}
        onOpenCatalog={() => {
          setActiveClientTab('catalog');
          setIsCatalogOpen(true);
        }}
        userSession={userSession}
        onUpdateUserSession={(updated) => {
          setUserSession(updated);
          syncActiveSession(updated);
        }}
        onConfirmOrder={(newOrder) => {
          // Descontar automáticamente del inventario
          try {
            descontarInventarioPorPedido(newOrder, userSession?.nombre || 'Cliente Tienda Online');
          } catch (e) {
            console.error('Error descontando stock en pedido carrito:', e);
          }

          setOrders((prev) => [newOrder, ...prev]);
          setLastSavedOrder(newOrder);
          if (newOrder.direccionEntrega && userSession) {
            const updatedUser = {
              ...userSession,
              direccion: newOrder.direccionEntrega,
              address: newOrder.direccionEntrega,
              ciudad: newOrder.ciudadEntrega || userSession.ciudad,
            };
            setUserSession(updatedUser);
            try {
              localStorage.setItem('colorlink_user_session', JSON.stringify(updatedUser));
            } catch {}
          }
          showToast(`✅ Pedido ${newOrder.numeroOrden} confirmado y descontado de bodega con éxito.`);
          setActiveClientTab('tracking');
        }}
      />

      {/* User Session / Iniciar Sesión / Crear Cuenta Modal (B2B/B2C y Corporativo RBAC con OTP) */}
      <UnifiedAuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthReason(null);
        }}
        onLoginClient={handleClientLogin}
        onLoginCorporate={handleCorporateLogin}
        currentSession={userSession}
        initialTab={authInitialTab}
        initialMode={authMode}
        requiredActionReason={authReason}
        onLogout={handleUserLogout}
      />

      {/* Módulo Mi Perfil y Gestión de Direcciones Múltiples */}
      {userSession && (
        <UserProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userSession={userSession}
          onUpdateUserSession={(updated) => {
            setUserSession(updated);
            syncActiveSession(updated);
          }}
          onShowToast={showToast}
          initialTab={profileInitialTab}
          onLogout={handleUserLogout}
          onNavigateToTracking={() => {
            setIsProfileOpen(false);
            setActiveClientTab('tracking');
          }}
          onNavigateToStore={() => {
            setIsProfileOpen(false);
            setActiveClientTab('catalog');
          }}
          onOpenChat={() => {
            setIsProfileOpen(false);
            setIsChatOpen(true);
          }}
          orders={orders}
          onResetOrders={(newOrders) => {
            setOrders(newOrders);
            try {
              localStorage.setItem('colorlink_user_orders', JSON.stringify(newOrders));
              localStorage.setItem('colorlink_orders', JSON.stringify(newOrders));
            } catch {}
          }}
          onReorder={(order) => {
            if (order.form) {
              setFormData({ ...order.form });
            }
            setIsProfileOpen(false);
            setActiveClientTab('cotizador');
            showToast(`Cotización ${order.numeroOrden} cargada en el Cotizador Inteligente`);
          }}
          onViewDetailPDF={(order) => {
            setOrderToPrint(order);
            setIsPrintableOpen(true);
          }}
        />
      )}

      {/* Panel Unificado de Notificaciones, Seguimiento CEDI y Mis Solicitudes PQRS SAC */}
      <ClientNotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        userSession={userSession}
        orders={orders}
        initialTab={notificationsInitialTab}
        onNavigateToCatalog={() => {
          setIsNotificationsOpen(false);
          setActiveClientTab('catalog');
        }}
        onShowToast={showToast}
      />

      {/* Simulador de Notificaciones Omni-Canal (SMS, Correo HTML, Llamada Voz IA) */}
      {omniNoticeOrder && (
        <OmnichannelNotificationsModal
          isOpen={isOmniNoticeOpen}
          onClose={() => setIsOmniNoticeOpen(false)}
          order={omniNoticeOrder}
          onStatusNotified={(newStatus) => {
            handleUpdateOrderStatus(omniNoticeOrder.id, newStatus);
            showToast(`Estado actualizado y notificado a la obra: ${newStatus}`);
          }}
        />
      )}

      {/* Quiénes Somos / Historia Modal */}
      <CompanyHistoryModal
        isOpen={isCompanyHistoryOpen}
        onClose={() => setIsCompanyHistoryOpen(false)}
        onOpenCatalog={() => {
          setActiveClientTab('catalog');
          setIsCatalogOpen(true);
        }}
      />

      {/* Nuestra Ubicación & Cobertura Modal */}
      <CoverageModal
        isOpen={isCoverageOpen}
        onClose={() => setIsCoverageOpen(false)}
        onSelectCity={(city) => {
          handleFieldChange('ciudad', city);
          showToast(`Ciudad de despacho establecida en ${city}`);
        }}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProductForDetail}
        isOpen={Boolean(selectedProductForDetail)}
        onClose={() => setSelectedProductForDetail(null)}
        onAddToCart={handleAddToCart}
        isFavorite={selectedProductForDetail ? favoriteIds.includes(selectedProductForDetail.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onStartQuote={(product) => {
          handleFieldChange('producto_deseado', product.nombre);
          if (product.presetSuperficie) {
            handleFieldChange('superficie', product.presetSuperficie);
          }
          if (product.presetAmbiente) {
            handleFieldChange('ambiente', product.presetAmbiente);
          }
          setActiveClientTab('cotizador');
          showToast(`Producto ${product.nombre} cargado en el Cotizador Inteligente`);
        }}
      />

      {/* Floating Chatbot Assistant Button (Arrastrable en pantalla, oculto de forma segura en la Intranet y cuando el chat o formulario PQRS está abierto) */}
      {!isChatOpen && !isIntranetActive && !isCustomerInquiryOpen && !(isNotificationsOpen && notificationsInitialTab === 'pqrs') && (
        <DraggableAIChatButton 
          onClick={() => setIsChatOpen(true)} 
          isOpen={isChatOpen}
          hideOnIntranet={isIntranetActive}
          isCorporateView={isIntranetActive}
          currentTab={activeClientTab}
        />
      )}

    </div>
  );
}
