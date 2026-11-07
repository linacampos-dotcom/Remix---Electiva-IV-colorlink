import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FMVFormData, CalculationResult, UserSession, CartItem, COLORLINKOrder } from '../types';
import { 
  X, 
  Send, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Layers, 
  Trash2,
  Camera,
  ShoppingCart,
  Palette,
  ArrowRight,
  Download,
  Eye,
  Plus,
  Paperclip,
  HeadphonesIcon,
  Calculator,
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  FileText,
  Check,
  ExternalLink,
  Phone,
  Truck
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AddToCartModal, ProductToConfigure } from './AddToCartModal';
import { downloadQuotationSheet } from '../utils/quotationSheetGenerator';
import { ImageVisualizer } from './ImageVisualizer';
import { SEDES_PINTUCO, SedePintuco } from './ColombiaInteractiveMap';
import { DEPARTAMENTOS_COLOMBIA } from '../data/colombiaLogistics';
import { fetchUserOrdersFromDatabase, isMockOrder } from '../services/ordersService';
const sampleWallImg = '/src/assets/images/living_room_wall_1789834592467.jpg';
const facadeWallImg = '/src/assets/images/facade_wall_1789834604798.jpg';

export const PINTUCO_AI_AVATAR_URL = '/images/pintuco_character_clean.png';

export type ChatStep = 'IDLE' | 'AWAITING_SQM' | 'SHOW_RECOMMENDATIONS' | 'SIMULATION';

export interface ChatState {
  categoriaGeneral?: string | null;
  tipoEspacio?: string | null;
  subtipoEspacio?: string | null;
  metrosCuadrados?: number | null;
  estadoPared?: string | null;
  fotoSubida?: boolean;
  productoRecomendado?: string | null;
}

export interface CartAction {
  tipo?: 'recomendada' | 'alternativa';
  badge?: string;
  productName: string;
  descripcion?: string;
  sku: string;
  cantidad: number;
  presentacion: string;
  precioUnitario: number;
  precioGalon?: number;
  precioCunete?: number;
  imagenUrl?: string;
}

export interface ToolItem {
  nombre: string;
  sku: string;
  cantidad: number;
  precioUnitario: number;
  imagenUrl?: string;
}

export const DEFAULT_TOOLS_KIT: ToolItem[] = [
  {
    nombre: 'Rodillo 9" Microfibra Cero Gota con Manija',
    sku: 'PIN-ROD-9INT',
    cantidad: 1,
    precioUnitario: 28500,
    imagenUrl: '/src/assets/images/paint_roller_tray_1790894457076.jpg'
  },
  {
    nombre: 'Brocha Profesional Master 2.5"',
    sku: 'PIN-BRO-25',
    cantidad: 1,
    precioUnitario: 16900,
    imagenUrl: '/src/assets/images/pro_brushes_set_1790894448620.jpg'
  },
  {
    nombre: 'Cinta de Enmascarar Azul Antirastro 1"',
    sku: 'PIN-CIN-AZUL',
    cantidad: 1,
    precioUnitario: 9800,
    imagenUrl: '/src/assets/images/cinta_azul_rollo_1790894607849.jpg'
  },
  {
    nombre: 'Lija de Agua Pintuco Grano 220',
    sku: 'PIN-LIJ-220',
    cantidad: 2,
    precioUnitario: 2400,
    imagenUrl: '/src/assets/images/lija_agua_pintuco_1790894597920.jpg'
  }
];

export interface QuickChipItem {
  id: 'cotizar' | 'rastrear' | 'sedes' | 'subir_imagen' | 'simulador';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const QUICK_ACTION_CHIPS: QuickChipItem[] = [
  { id: 'cotizar', label: 'Cotizar', icon: Calculator },
  { id: 'rastrear', label: 'Rastrear pedido', icon: Package },
  { id: 'sedes', label: 'Sedes y horarios', icon: MapPin },
  { id: 'subir_imagen', label: 'Subir imagen para cotización', icon: Camera },
  { id: 'simulador', label: 'Simulador de color', icon: Palette },
];

// FUENTE ÚNICA DE DATOS (Single Source of Truth vinculada al Mapa Interactivo)
export const QUICK_CITIES = SEDES_PINTUCO.map((sede) => ({
  id: sede.id,
  name: sede.ciudad,
  departamento: sede.departamento,
  region: sede.region,
}));

export function getSedesForCity(cityInput: string): {
  cityName: string;
  hubs: SedePintuco[];
  notaRegional?: string;
} {
  const norm = cityInput
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // 1. Coincidencia directa por nombre de ciudad, departamento, región o id en SEDES_PINTUCO
  let matchedHubs = SEDES_PINTUCO.filter((s) => {
    const sCityNorm = s.ciudad.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const sDeptNorm = s.departamento.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const sNameNorm = s.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const sIdNorm = s.id.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return (
      sCityNorm.includes(norm) || norm.includes(sCityNorm) ||
      sDeptNorm.includes(norm) || norm.includes(sDeptNorm) ||
      sNameNorm.includes(norm) || norm.includes(sNameNorm) ||
      sIdNorm === norm
    );
  });

  // 2. Coincidencia por alias metropolitanos de las 12 sedes del mapa
  if (matchedHubs.length === 0) {
    if (norm.includes('santa marta') || norm.includes('santamarta') || norm.includes('magdalena') || norm.includes('taganga') || norm.includes('rodadero') || norm.includes('sierra')) {
      matchedHubs = SEDES_PINTUCO.filter((s) => s.id === 'santamarta');
    } else if (norm.includes('pasto') || norm.includes('narino') || norm.includes('ipiales') || norm.includes('tumaco') || norm.includes('torobajo')) {
      matchedHubs = SEDES_PINTUCO.filter((s) => s.id === 'pasto');
    } else if (norm.includes('villavicencio') || norm.includes('meta') || norm.includes('kirpas') || norm.includes('catama') || norm.includes('llanos')) {
      matchedHubs = SEDES_PINTUCO.filter((s) => s.id === 'villavicencio');
    } else if (norm.includes('ibague') || norm.includes('tolima') || norm.includes('salado') || norm.includes('espinal')) {
      matchedHubs = SEDES_PINTUCO.filter((s) => s.id === 'ibague');
    } else if (norm.includes('cucuta') || norm.includes('norte de santander') || norm.includes('villa del rosario') || norm.includes('los patios')) {
      matchedHubs = SEDES_PINTUCO.filter((s) => s.id === 'cucuta');
    } else if (norm.includes('bogota') || norm.includes('cundinamarca') || norm.includes('soacha') || norm.includes('chia') || norm.includes('fontibon') || norm.includes('montevideo')) {
      matchedHubs = SEDES_PINTUCO.filter((s) => s.id === 'bogota');
    } else if (norm.includes('medellin') || norm.includes('rionegro') || norm.includes('antioquia') || norm.includes('bello') || norm.includes('itagui') || norm.includes('envigado') || norm.includes('sabaneta') || norm.includes('guayabal')) {
      matchedHubs = SEDES_PINTUCO.filter((s) => s.id === 'medellin');
    } else if (norm.includes('cali') || norm.includes('yumbo') || norm.includes('valle') || norm.includes('palmira') || norm.includes('jamundi') || norm.includes('acopi')) {
      matchedHubs = SEDES_PINTUCO.filter((s) => s.id === 'cali');
    } else if (norm.includes('barranquilla') || norm.includes('soledad') || norm.includes('atlantico') || norm.includes('via 40') || norm.includes('malecon')) {
      matchedHubs = SEDES_PINTUCO.filter((s) => s.id === 'barranquilla');
    } else if (norm.includes('cartagena') || norm.includes('mamonal') || norm.includes('bolivar')) {
      matchedHubs = SEDES_PINTUCO.filter((s) => s.id === 'cartagena');
    } else if (norm.includes('bucaramanga') || norm.includes('santander') || norm.includes('giron') || norm.includes('floridablanca') || norm.includes('piedecuesta')) {
      matchedHubs = SEDES_PINTUCO.filter((s) => s.id === 'bucaramanga');
    } else if (norm.includes('pereira') || norm.includes('dosquebradas') || norm.includes('risaralda') || norm.includes('manizales') || norm.includes('armenia') || norm.includes('eje cafetero')) {
      matchedHubs = SEDES_PINTUCO.filter((s) => s.id === 'pereira');
    }
  }

  if (matchedHubs.length > 0) {
    const displayCity = matchedHubs[0].ciudad;
    return {
      cityName: displayCity,
      hubs: matchedHubs,
    };
  }

  // 3. Búsqueda en los 32 departamentos y municipios de Colombia
  const matchedDept = DEPARTAMENTOS_COLOMBIA.find((d) => {
    const dNorm = d.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cNorm = d.capital.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return (
      dNorm.includes(norm) || norm.includes(dNorm) ||
      cNorm.includes(norm) || norm.includes(cNorm) ||
      d.municipios.some((m) => m.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(norm))
    );
  });

  if (matchedDept) {
    const deptNorm = matchedDept.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let nearestSede = SEDES_PINTUCO.find((s) => s.departamento.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === deptNorm);

    if (!nearestSede) {
      if (deptNorm.includes('cesar') || deptNorm.includes('guajira')) {
        nearestSede = SEDES_PINTUCO.find((s) => s.id === 'santamarta') || SEDES_PINTUCO.find((s) => s.id === 'barranquilla');
      } else if (deptNorm.includes('caldas') || deptNorm.includes('quindio')) {
        nearestSede = SEDES_PINTUCO.find((s) => s.id === 'pereira');
      } else if (deptNorm.includes('huila') || deptNorm.includes('caqueta')) {
        nearestSede = SEDES_PINTUCO.find((s) => s.id === 'ibague');
      } else if (deptNorm.includes('cauca')) {
        nearestSede = SEDES_PINTUCO.find((s) => s.id === 'cali');
      } else if (deptNorm.includes('casanare') || deptNorm.includes('arauca')) {
        nearestSede = SEDES_PINTUCO.find((s) => s.id === 'villavicencio');
      } else if (deptNorm.includes('cordoba') || deptNorm.includes('sucre')) {
        nearestSede = SEDES_PINTUCO.find((s) => s.id === 'cartagena');
      } else {
        nearestSede = SEDES_PINTUCO.find((s) => s.id === 'bogota')!;
      }
    }

    const targetSede = nearestSede || SEDES_PINTUCO[0];
    return {
      cityName: matchedDept.capital || cityInput,
      hubs: [targetSede],
      notaRegional: `Para ${matchedDept.nombre} (${matchedDept.capital}), ColorLink opera mediante despachos logísticos directos y red de ferreterías aliadas respaldados desde el nodo de ${targetSede.nombre} en ${targetSede.ciudad}. Tiempo de entrega garantizado: ${targetSede.tiempoEntrega}.`
    };
  }

  // 4. Fallback estándar si no es reconocido
  return {
    cityName: cityInput,
    hubs: [SEDES_PINTUCO.find((s) => s.id === 'bogota') || SEDES_PINTUCO[0]],
    notaRegional: `ColorLink y Pintuco cuentan con cobertura de despachos directos en todo el territorio colombiano y retiro presencial en los 12 nodos estratégicos del mapa nacional.`
  };
}

export function isCityOrSedeQuery(query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Ciudades activas del mapa interactivo (Single Source of Truth)
  const mapCityNames = SEDES_PINTUCO.map((s) => 
    s.ciudad.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );

  const additionalAliases = [
    'santa marta', 'santamarta', 'pasto', 'villavicencio', 'ibague', 'cucuta',
    'rionegro', 'yumbo', 'dosquebradas', 'giron', 'floridablanca', 'soledad',
    'torobajo', 'kirpas', 'mamonal', 'fontibon', 'guayabal'
  ];

  const allCityKeywords = Array.from(new Set([...mapCityNames, ...additionalAliases]));

  const hasCity = allCityKeywords.some((c) => q.includes(c));
  const hasSedeIntent = /sede|tienda|horario|donde comprar|donde queda|sucursal|direccion|atencion|bodega|cedi|punto|ubicacion/i.test(q);

  return (hasCity && hasSedeIntent) || allCityKeywords.some((c) => q === c || q === `en ${c}`);
}

export function parseSquareMeters(text: string): number | null {
  if (!text) return null;
  const clean = text.toLowerCase().replace(',', '.');

  const multiMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:x|\*|por)\s*(\d+(?:\.\d+)?)/i);
  if (multiMatch) {
    const w = parseFloat(multiMatch[1]);
    const h = parseFloat(multiMatch[2]);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      return Math.round(w * h * 10) / 10;
    }
  }

  const metricMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:m2|m²|mts2|metros\s*cuadrados|metros|mts|m\b)/i);
  if (metricMatch) {
    const val = parseFloat(metricMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val * 10) / 10;
  }

  const numMatch = clean.match(/\b(\d+(?:\.\d+)?)\b/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (!isNaN(val) && val > 0 && val < 5000) return Math.round(val * 10) / 10;
  }

  return null;
}

export function generateDualRecommendations(sqmValue: number, surfaceType: string): CartAction[] {
  const isExterior = /exterior|fachada|terraza|patio|cerca|reja/i.test(surfaceType);

  if (isExterior) {
    const galonesPrem = Math.max(1, Math.ceil((sqmValue / 28) * 1.10));
    const isCunetePrem = galonesPrem >= 5;
    const galonesEcon = Math.max(1, Math.ceil((sqmValue / 28) * 1.10));
    const isCuneteEcon = galonesEcon >= 5;

    return [
      {
        tipo: 'recomendada',
        badge: '⭐ Opción Recomendada / Premium (NTC 1335)',
        productName: 'Koraza Doble Vida Protección Clima Extremo',
        descripcion: 'Máxima resistencia a intemperie, lluvia torrencial, rayos UV y polución. Garantía superior.',
        sku: 'PIN-KOR-02',
        cantidad: isCunetePrem ? Math.ceil(galonesPrem / 5) : galonesPrem,
        presentacion: isCunetePrem ? 'Cuñete (5 Gal)' : 'Galón',
        precioUnitario: isCunetePrem ? 429000 : 98900,
        precioGalon: 98900,
        precioCunete: 429000,
        imagenUrl: '/src/assets/images/koraza_bucket_studio_1790894419359.jpg',
      },
      {
        tipo: 'alternativa',
        badge: '💡 Opción Económica / Eficiente',
        productName: 'Koraza Tradicional Protección Exterior',
        descripcion: 'Excelente durabilidad en fachadas con óptima relación costo por m².',
        sku: 'PIN-KOR-01',
        cantidad: isCuneteEcon ? Math.ceil(galonesEcon / 5) : galonesEcon,
        presentacion: isCuneteEcon ? 'Cuñete (5 Gal)' : 'Galón',
        precioUnitario: isCuneteEcon ? 369000 : 84900,
        precioGalon: 84900,
        precioCunete: 369000,
        imagenUrl: '/src/assets/images/koraza_bucket_studio_1790894419359.jpg',
      }
    ];
  }

  const galonesPrem = Math.max(1, Math.ceil((sqmValue / 32) * 1.10));
  const isCunetePrem = galonesPrem >= 5;
  const galonesEcon = Math.max(1, Math.ceil((sqmValue / 30) * 1.10));
  const isCuneteEcon = galonesEcon >= 5;

  return [
    {
      tipo: 'recomendada',
      badge: '⭐ Opción Recomendada / Premium (NTC 1335)',
      productName: 'Viniltex Avanzado Máxima Lavabilidad',
      descripcion: 'Ultra lavable, máxima resistencia a manchas y rayones, acabado mate sedoso de alta gama.',
      sku: 'PIN-VTX-01',
      cantidad: isCunetePrem ? Math.ceil(galonesPrem / 5) : galonesPrem,
      presentacion: isCunetePrem ? 'Cuñete (5 Gal)' : 'Galón',
      precioUnitario: isCunetePrem ? 349000 : 79900,
      precioGalon: 79900,
      precioCunete: 349000,
      imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
    },
    {
      tipo: 'alternativa',
      badge: '💡 Opción Económica / Eficiente',
      productName: 'Intervinil Cielos y Muros Mate',
      descripcion: 'Excelente poder cubriente y blancura superior para muros interiores y cielos rasos.',
      sku: 'CIN-INT-CL',
      cantidad: isCuneteEcon ? Math.ceil(galonesEcon / 5) : galonesEcon,
      presentacion: isCuneteEcon ? 'Cuñete (5 Gal)' : 'Galón',
      precioUnitario: isCuneteEcon ? 239000 : 54900,
      precioGalon: 54900,
      precioCunete: 239000,
      imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
    }
  ];
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  formData: FMVFormData;
  calculation: CalculationResult;
  userSession?: UserSession | null;
  onNavigateTab?: (tab: any) => void;
  onApplyCalculation?: (area: number, productName?: string) => void;
  onAddToCart?: (item: CartItem) => void;
  onOpenCart?: () => void;
  onOpenHumanSupport?: () => void;
  onOpenAuth?: (reason?: string) => void;
  onOpenCoverageMap?: () => void;
  orders?: COLORLINKOrder[];
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  imageUrl?: string;
  savedSupabaseId?: string;
  cartAction?: CartAction;
  cartActions?: CartAction[];
  toolsKit?: ToolItem[];
  areaM2?: number;
  spaceType?: string;
  totalCotizacionCOP?: number;
  showQuickChips?: boolean;
  orderTrackingData?: any[];
  sedeInfo?: boolean;
  isCitySelectionPrompt?: boolean;
  storeHubs?: SedePintuco[];
  selectedCity?: string;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  formData,
  calculation,
  userSession,
  onNavigateTab,
  onApplyCalculation,
  onAddToCart,
  onOpenCart,
  onOpenHumanSupport,
  onOpenAuth,
  onOpenCoverageMap,
  orders,
}) => {
  // Sincronización en tiempo real con Supabase Auth (user_id y email)
  const [supabaseAuthUser, setSupabaseAuthUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && isMounted) {
          setSupabaseAuthUser({ id: user.id, email: user.email || '' });
        }
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [userSession, isOpen]);

  const activeUserId = supabaseAuthUser?.id || userSession?.id || null;
  const activeUserEmail = (supabaseAuthUser?.email || userSession?.email || '').trim().toLowerCase();
  const isUserAuthenticated = Boolean(
    (supabaseAuthUser && supabaseAuthUser.id) ||
    (userSession && (userSession.isLoggedIn === true || Boolean(userSession.email)))
  );
  const activeUserName = userSession?.nombre || (activeUserEmail ? activeUserEmail.split('@')[0] : 'Cliente');

  const chatStorageKey = `colorlink_chat_${activeUserEmail || 'guest'}`;
  const chatStateKey = `colorlink_chat_state_${activeUserEmail || 'guest'}`;

  // Saludo oficial con contexto del usuario autenticado en Supabase
  const OFFICIAL_GREETING = isUserAuthenticated && activeUserName
    ? `¡Hola, ${activeUserName}! Soy tu Asistente IA de Pintuco / ColorLink. Tu cuenta (${activeUserEmail}) está sincronizada. ¿En qué puedo ayudarte hoy?`
    : '¡Hola! Soy tu Asistente IA de Pintuco/ColorLink. ¿En qué puedo ayudarte hoy?';

  const getInitialMessages = (): Message[] => [
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: OFFICIAL_GREETING,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      showQuickChips: true,
    },
  ];

  const [chatState, setChatState] = useState<ChatState>(() => {
    try {
      const saved = localStorage.getItem(chatStateKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error cargando chatState de localStorage:', e);
    }
    return {};
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(chatStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: Message, idx: number) => {
            if (idx === 0 && m.sender === 'assistant') {
              return {
                ...m,
                text: OFFICIAL_GREETING,
                showQuickChips: true,
              };
            }
            return m;
          });
        }
      }
    } catch (e) {
      console.error('Error cargando historial de chat de localStorage:', e);
    }
    return getInitialMessages();
  });

  // Recargar historial al cambiar de usuario autenticado
  useEffect(() => {
    try {
      const saved = localStorage.getItem(chatStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {}
    setMessages(getInitialMessages());
  }, [chatStorageKey]);

  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(isSupabaseConfigured);
  const [addedToCartMap, setAddedToCartMap] = useState<Record<string, boolean>>({});
  const [selectedProductToConfigure, setSelectedProductToConfigure] = useState<ProductToConfigure | null>(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [activeMessageIdForConfig, setActiveMessageIdForConfig] = useState<string | null>(null);
  const [isAwaitingCityForSedes, setIsAwaitingCityForSedes] = useState<boolean>(false);

  const [chatStep, setChatStep] = useState<ChatStep>(() => {
    try {
      const saved = localStorage.getItem(`colorlink_chat_step_${activeUserEmail}`);
      if (saved === 'AWAITING_SQM' || saved === 'SHOW_RECOMMENDATIONS' || saved === 'SIMULATION') {
        return saved as ChatStep;
      }
    } catch {}
    return 'IDLE';
  });

  const [uploadedImage, setUploadedImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`colorlink_chat_uploaded_img_${activeUserEmail}`) || null;
    } catch {
      return null;
    }
  });

  const [detectedSurface, setDetectedSurface] = useState<string>(() => {
    try {
      return localStorage.getItem(`colorlink_chat_detected_surf_${activeUserEmail}`) || '';
    } catch {
      return '';
    }
  });

  const [sqm, setSqm] = useState<number | null>(() => {
    try {
      const val = localStorage.getItem(`colorlink_chat_sqm_${activeUserEmail}`);
      return val ? parseFloat(val) : null;
    } catch {
      return null;
    }
  });

  const [simulatedProduct, setSimulatedProduct] = useState<CartAction | null>(() => {
    try {
      const saved = localStorage.getItem(`colorlink_chat_sim_prod_${activeUserEmail}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeSimulationColor, setActiveSimulationColor] = useState<{
    name: string;
    code: string;
    hex: string;
  }>({
    name: 'Azul Caribe',
    code: '2481',
    hex: '#2481A6',
  });
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});
  const [simulatedCanvasMap, setSimulatedCanvasMap] = useState<Record<string, string>>({});
  const [isDownloadingSheet, setIsDownloadingSheet] = useState<boolean>(false);
  const [downloadToast, setDownloadToast] = useState<{ message: string; type: 'info' | 'success' } | null>(null);

  const SIMULATION_SWATCHES = [
    { name: 'Azul Caribe', code: '2481', hex: '#2481A6' },
    { name: 'Blanco Puro', code: '1001', hex: '#F9FAFB' },
    { name: 'Arena Cálida', code: '1023', hex: '#E2D9C8' },
    { name: 'Verde Salvia', code: '6021', hex: '#A3B18A' },
    { name: 'Gris Niebla', code: '7035', hex: '#CBD5E1' },
    { name: 'Terracota Colonial', code: '3016', hex: '#C05621' },
    { name: 'Amarillo Trigo', code: '1018', hex: '#E5B942' },
    { name: 'Gris Grafito', code: '7024', hex: '#4B5563' },
  ];

  useEffect(() => {
    try {
      localStorage.setItem(`colorlink_chat_step_${activeUserEmail}`, chatStep);
      if (uploadedImage && uploadedImage.length < 150000) {
        localStorage.setItem(`colorlink_chat_uploaded_img_${activeUserEmail}`, uploadedImage);
      } else if (!uploadedImage) {
        localStorage.removeItem(`colorlink_chat_uploaded_img_${activeUserEmail}`);
      }
      if (detectedSurface) {
        localStorage.setItem(`colorlink_chat_detected_surf_${activeUserEmail}`, detectedSurface);
      } else {
        localStorage.removeItem(`colorlink_chat_detected_surf_${activeUserEmail}`);
      }
      if (sqm !== null) {
        localStorage.setItem(`colorlink_chat_sqm_${activeUserEmail}`, sqm.toString());
      } else {
        localStorage.removeItem(`colorlink_chat_sqm_${activeUserEmail}`);
      }
      if (simulatedProduct) {
        localStorage.setItem(`colorlink_chat_sim_prod_${activeUserEmail}`, JSON.stringify(simulatedProduct));
      } else {
        localStorage.removeItem(`colorlink_chat_sim_prod_${activeUserEmail}`);
      }
    } catch (e) {
      console.warn('Error guardando variables de estado:', e);
    }
  }, [chatStep, uploadedImage, detectedSurface, sqm, simulatedProduct, activeUserEmail]);

  const handleDownloadTechnicalSheet = async (msg?: Message, action?: CartAction) => {
    try {
      setIsDownloadingSheet(true);
      setDownloadToast({ message: 'Generando tu ficha de cotización...', type: 'info' });

      const targetAction = action || simulatedProduct || (msg?.cartActions && msg.cartActions[0]) || msg?.cartAction;
      const originalImage = msg?.imageUrl || uploadedImage || sampleWallImg;
      const simulatedImageToUse = (msg && simulatedCanvasMap[msg.id]) || simulatedCanvasMap['latest'] || originalImage;
      const areaToUse = sqm || chatState.metrosCuadrados || 24;

      await downloadQuotationSheet({
        simulatedImageUrl: simulatedImageToUse,
        originalImageUrl: (msg?.imageUrl || uploadedImage) ? originalImage : undefined,
        productName: targetAction?.productName || 'Viniltex Avanzado Máxima Lavabilidad',
        sku: targetAction?.sku || 'PIN-VTX-01',
        colorName: activeSimulationColor.name,
        colorCode: activeSimulationColor.code,
        colorHex: activeSimulationColor.hex,
        cantidad: targetAction?.cantidad || Math.max(1, Math.ceil((areaToUse / 32) * 1.10)),
        presentacion: targetAction?.presentacion || 'Galón',
        areaM2: areaToUse,
        clientName: userSession?.nombre || 'Cliente Pintuco / ColorLink',
        clientEmail: userSession?.email || 'cliente@pintuco.com',
        esPersonalizado: true,
        tiempoEstimado: 'Alistamiento en centro de distribución: 24 a 48 horas hábiles.',
      });

      setDownloadToast({ message: '¡Ficha de cotización descargada con éxito!', type: 'success' });
      setTimeout(() => setDownloadToast(null), 4000);
    } catch (err) {
      console.error('Error generando ficha técnica:', err);
      setDownloadToast({ message: 'Hubo un inconveniente al generar la imagen. Intenta de nuevo.', type: 'info' });
      setTimeout(() => setDownloadToast(null), 3500);
    } finally {
      setIsDownloadingSheet(false);
    }
  };
  
  const drawerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const cameraUploadInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    };
    if (isAttachMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAttachMenuOpen]);

  const handleDrawerWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (messagesContainerRef.current) {
      const target = e.target as HTMLElement | null;
      const isInsideScrollable = target ? messagesContainerRef.current.contains(target) : false;
      if (!isInsideScrollable) {
        messagesContainerRef.current.scrollTop += e.deltaY;
      }
    }
  };

  useEffect(() => {
    const drawerEl = drawerRef.current;
    if (!drawerEl || !isOpen) return;

    const handleNativeWheel = (e: WheelEvent) => {
      const messagesEl = messagesContainerRef.current;
      if (!messagesEl) return;

      const target = e.target as HTMLElement | null;
      const isInsideMessages = messagesEl.contains(target);

      if (!isInsideMessages) {
        messagesEl.scrollTop += e.deltaY;
        e.preventDefault();
      } else {
        const { scrollTop, scrollHeight, clientHeight } = messagesEl;
        const isAtTop = scrollTop <= 0 && e.deltaY < 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
        if (isAtTop || isAtBottom) {
          e.preventDefault();
        }
      }
    };

    drawerEl.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      drawerEl.removeEventListener('wheel', handleNativeWheel);
    };
  }, [isOpen]);

  const handleOpenColorSelector = (action: CartAction, messageId: string) => {
    setSelectedProductToConfigure({
      productName: action.productName,
      sku: action.sku,
      cantidad: action.cantidad,
      presentacion: action.presentacion,
      precioUnitario: action.precioUnitario,
      precioGalon: action.precioGalon,
      precioCunete: action.precioCunete,
      imagenUrl: action.imagenUrl,
      badge: action.badge,
      descripcion: action.descripcion,
    });
    setActiveMessageIdForConfig(messageId);
    setIsColorModalOpen(true);
  };

  const handleStartSimulation = (action: CartAction, messageId: string) => {
    setSimulatedProduct(action);
    setChatStep('SIMULATION');
    setActiveMessageIdForConfig(messageId);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Agregar pintura individual al carrito
  const handleConfirmAddToCartDirect = (action: CartAction, color: { name: string; code: string; hex: string }) => {
    const itemToAdd: CartItem = {
      id: `${action.sku}-${color.code}-${Date.now()}`,
      sku: action.sku,
      nombre: action.productName,
      precioUnitario: action.precioUnitario,
      presentacion: (action.presentacion as any) || 'Galón',
      cantidad: action.cantidad,
      colorSeleccionado: `${color.name} (#${color.code})`,
      imagenUrl: action.imagenUrl || sampleWallImg,
      subtotal: action.cantidad * action.precioUnitario,
      esPersonalizado: true,
      marca: 'Pintuco',
    };

    if (onAddToCart) {
      onAddToCart(itemToAdd);
    }

    setAddedToCartMap((prev) => ({ ...prev, [action.sku]: true }));
    setDownloadToast({
      message: `¡${action.productName} (${color.name}) agregado al carrito!`,
      type: 'success',
    });
    setTimeout(() => setDownloadToast(null), 3500);
  };

  // BOTÓN DE LLAMADA A LA ACCIÓN: Proceder con la compra del paquete completo (Pintura + Kit de Herramientas)
  const handleProceedFullQuotationPurchase = (
    paintAction: CartAction,
    tools: ToolItem[] = DEFAULT_TOOLS_KIT,
    color = activeSimulationColor
  ) => {
    // 1. Agregar pintura con el color seleccionado
    const paintItem: CartItem = {
      id: `${paintAction.sku}-${color.code}-${Date.now()}`,
      sku: paintAction.sku,
      nombre: paintAction.productName,
      precioUnitario: paintAction.precioUnitario,
      presentacion: (paintAction.presentacion as any) || 'Galón',
      cantidad: paintAction.cantidad,
      colorSeleccionado: `${color.name} (#${color.code})`,
      imagenUrl: paintAction.imagenUrl || sampleWallImg,
      subtotal: paintAction.cantidad * paintAction.precioUnitario,
      esPersonalizado: true,
      marca: 'Pintuco',
    };

    if (onAddToCart) {
      onAddToCart(paintItem);
    }

    // 2. Agregar cada herramienta del kit
    tools.forEach((t, i) => {
      const toolItem: CartItem = {
        id: `${t.sku}-${Date.now()}-${i}`,
        sku: t.sku,
        nombre: t.nombre,
        precioUnitario: t.precioUnitario,
        presentacion: 'Unidad',
        cantidad: t.cantidad,
        colorSeleccionado: 'Estándar Profesional',
        imagenUrl: t.imagenUrl || '/src/assets/images/paint_roller_tray_1790894457076.jpg',
        subtotal: t.cantidad * t.precioUnitario,
        esPersonalizado: false,
        marca: 'Pintuco',
      };
      if (onAddToCart) {
        onAddToCart(toolItem);
      }
    });

    setAddedToCartMap((prev) => ({ ...prev, [paintAction.sku]: true, fullOrder: true }));
    setDownloadToast({
      message: `¡Cotización completa agregada al carrito! (${paintAction.productName} + Kit de Herramientas)`,
      type: 'success',
    });

    setTimeout(() => {
      setDownloadToast(null);
      if (onOpenCart) {
        onOpenCart();
      }
    }, 700);
  };

  const handleConfirmAddToCartFromModal = (configuredItem: CartItem) => {
    if (onAddToCart) {
      onAddToCart(configuredItem);
    }
    if (activeMessageIdForConfig) {
      setAddedToCartMap((prev) => ({ ...prev, [activeMessageIdForConfig]: true }));
    }
  };

  useEffect(() => {
    try {
      const savedMsgs = localStorage.getItem(chatStorageKey);
      if (savedMsgs) {
        const parsed = JSON.parse(savedMsgs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const updated = parsed.map((m: Message, idx: number) => {
            if (idx === 0 && m.sender === 'assistant') {
              return {
                ...m,
                text: OFFICIAL_GREETING,
                showQuickChips: true,
              };
            }
            return m;
          });
          setMessages(updated);
        } else {
          setMessages(getInitialMessages());
        }
      } else {
        setMessages(getInitialMessages());
      }

      const savedState = localStorage.getItem(chatStateKey);
      if (savedState) {
        setChatState(JSON.parse(savedState));
      } else {
        setChatState({});
      }
    } catch (e) {
      console.error('Error actualizando chat por cambio de usuario:', e);
      setMessages(getInitialMessages());
      setChatState({});
    }
  }, [chatStorageKey, chatStateKey]);

  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(chatStorageKey, JSON.stringify(messages));
      }
    } catch (e) {
      console.warn('Ajustando almacenamiento local por cuota:', e);
      try {
        const safeMessages = messages.map(m => ({
          ...m,
          imageUrl: m.imageUrl && m.imageUrl.length > 100000 ? undefined : m.imageUrl,
        }));
        localStorage.setItem(chatStorageKey, JSON.stringify(safeMessages));
      } catch {}
    }
  }, [messages, chatStorageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(chatStateKey, JSON.stringify(chatState));
    } catch (e) {
      console.warn('Error guardando chatState:', e);
    }
  }, [chatState, chatStateKey]);

  const handleClearHistory = () => {
    try {
      localStorage.removeItem(chatStorageKey);
      localStorage.removeItem(chatStateKey);
      localStorage.removeItem(`colorlink_chat_step_${activeUserEmail}`);
      localStorage.removeItem(`colorlink_chat_uploaded_img_${activeUserEmail}`);
      localStorage.removeItem(`colorlink_chat_detected_surf_${activeUserEmail}`);
      localStorage.removeItem(`colorlink_chat_sqm_${activeUserEmail}`);
      localStorage.removeItem(`colorlink_chat_sim_prod_${activeUserEmail}`);
    } catch (e) {
      console.error('Error limpiando historial:', e);
    }
    setAttachedImage(null);
    setUploadedImage(null);
    setDetectedSurface('');
    setSqm(null);
    setSimulatedProduct(null);
    setIsAwaitingCityForSedes(false);
    setChatStep('IDLE');
    setChatState({});
    setMessages(getInitialMessages());
  };

  useEffect(() => {
    if (isOpen) {
      async function verifySupabase() {
        try {
          const { data, error } = await supabase.from('productos').select('id').limit(1);
          if (!error && data) {
            setSupabaseConnected(true);
          }
        } catch {}
      }
      verifySupabase();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, attachedImage]);

  if (!isOpen) return null;

  // Manejo de carga de imagen y disparo inmediato de simulación + cotización
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          handleProcessUploadedImageDirectly(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
    setIsAttachMenuOpen(false);
  };

  const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          handleProcessUploadedImageDirectly(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
    setIsAttachMenuOpen(false);
  };

  // Procesar imagen directamente: genera simulación visual y cotización completa
  const handleProcessUploadedImageDirectly = async (dataUrl: string) => {
    setUploadedImage(dataUrl);
    setAttachedImage(null);
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: '📷 He adjuntado una fotografía de mi espacio para simulación y cotización precisa.',
      imageUrl: dataUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/ai/chat-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Analiza esta fotografía, estima el tipo de espacio y sus metros cuadrados, selecciona la pintura Pintuco ideal según NTC 1335 y genera la cotización precisa con el kit de herramientas reglamentario.',
          imageUrl: dataUrl,
          history: messages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          userSession: {
            id: activeUserId,
            user_id: activeUserId,
            email: activeUserEmail,
            nombre: activeUserName,
            documento: userSession?.documento || '',
            isLoggedIn: isUserAuthenticated,
          },
        }),
      });

      const data = await response.json();
      const identified = data.superficieIdentificada || 'sala interior';
      const isExterior = /exterior|fachada|terraza|patio/i.test(identified);
      const estimatedM2 = Number(data.areaEstimadaM2) || (isExterior ? 60 : 24);

      setDetectedSurface(identified);
      setSqm(estimatedM2);
      setChatStep('SIMULATION');

      const actionsToUse: CartAction[] = (Array.isArray(data.cartActions) && data.cartActions.length > 0)
        ? data.cartActions
        : generateDualRecommendations(estimatedM2, identified);

      const primaryAction = actionsToUse[0];
      setSimulatedProduct(primaryAction);

      const toolsToUse: ToolItem[] = (Array.isArray(data.toolsKit) && data.toolsKit.length > 0)
        ? data.toolsKit
        : DEFAULT_TOOLS_KIT;

      const subtotalPintura = primaryAction.cantidad * primaryAction.precioUnitario;
      const subtotalTools = toolsToUse.reduce((acc, t) => acc + (t.cantidad * t.precioUnitario), 0);
      const totalEstimado = subtotalPintura + subtotalTools;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply || `He procesado con éxito la fotografía de tu ${identified}.
Estimo un área aproximada de ${estimatedM2} m² calculada bajo la norma técnica colombiana NTC 1335 (base oficial de rendimiento: ${isExterior ? 'Koraza 28 m²/gal' : 'Viniltex 32 m²/gal'} a 2 manos + 10% desperdicio).

✨ He activado la simulación visual en tiempo real. Puedes interactuar con la paleta de colores oficiales y alternar con el botón "Ver Antes" para apreciar el cambio.

A continuación te presento la cotización precisa de materiales requeridos y el botón de llamada a la acción para ordenar tu pedido completo:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cartActions: actionsToUse,
        toolsKit: toolsToUse,
        areaM2: estimatedM2,
        spaceType: identified,
        totalCotizacionCOP: totalEstimado,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.warn('Fallback en procesamiento de imagen:', err);
      const isExterior = false;
      const estimatedM2 = 24;
      const identified = 'sala interior';
      setDetectedSurface(identified);
      setSqm(estimatedM2);
      setChatStep('SIMULATION');

      const dual = generateDualRecommendations(estimatedM2, identified);
      setSimulatedProduct(dual[0]);

      const subtotalPintura = dual[0].cantidad * dual[0].precioUnitario;
      const subtotalTools = DEFAULT_TOOLS_KIT.reduce((acc, t) => acc + (t.cantidad * t.precioUnitario), 0);
      const totalEstimado = subtotalPintura + subtotalTools;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `He procesado tu fotografía. Identifico un/a ${identified} con un área estimada estándar de ${estimatedM2} m² bajo norma NTC 1335.
A continuación tienes la simulación visual interactiva antes/después y el desglose de cotización con pintura y herramientas oficiales Pintuco:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cartActions: dual,
        toolsKit: DEFAULT_TOOLS_KIT,
        areaM2: estimatedM2,
        spaceType: identified,
        totalCotizacionCOP: totalEstimado,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo de Selección de Ciudad para Sedes y Horarios
  const handleSelectCity = (cityName: string) => {
    setIsAwaitingCityForSedes(false);
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: cityName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const { cityName: resolvedCity, hubs, notaRegional } = getSedesForCity(cityName);

    const hubsFormattedText = hubs.map((h) => 
      `• **${h.nombre}** (${h.tipo}):\n  📍 Dirección: ${h.direccion}\n  🕒 Horario: ${h.horario}\n  📞 Teléfono: ${h.telefono}\n  🚚 Tiempo de Entrega: ${h.tiempoEntrega}${h.asesorRegional ? `\n  👤 Asesor Regional: ${h.asesorRegional}` : ''}`
    ).join('\n\n');

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      text: `📍 **Sede Oficial Pintuco / ColorLink en ${resolvedCity}**:

${hubsFormattedText}

${notaRegional ? `\n💡 ${notaRegional}\n` : ''}
📞 **Línea Gratuita Nacional**: 01 8000 111 247 | WhatsApp SAC: +57 310 450 8890`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sedeInfo: true,
      storeHubs: hubs,
      selectedCity: resolvedCity,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  };

  // Lógica oficial para Rastrear Pedido sincronizada con la cuenta de Supabase Auth
  const handleTrackOrderQuery = async (alreadyAddedUserMessage: boolean = false) => {
    if (!alreadyAddedUserMessage) {
      const userMsg: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: 'Rastrear pedido',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    // 1. Si no ha iniciado sesión, requerir autenticación
    if (!isUserAuthenticated || !activeUserEmail) {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `🔒 Validación de Seguridad Requerida:
Por motivos de protección de datos y confidencialidad comercial, para rastrear pedidos debes iniciar sesión con tu cuenta registrada en Pintuco / ColorLink.

He abierto el módulo de acceso seguro para ti. Una vez ingreses tus credenciales de Supabase Auth, podrás consultar el estado de tus compras en tiempo real.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (onOpenAuth) {
        onOpenAuth('Rastreo Seguro de Pedido');
      }
      return;
    }

    // 2. Usuario autenticado: consulta en la base de datos (tabla de pedidos/orders) filtrando por el ID del usuario
    setIsLoading(true);

    try {
      const userOrders = await fetchUserOrdersFromDatabase(
        activeUserId,
        activeUserEmail,
        userSession?.documento
      );

      // Si la consulta retorna 0 pedidos (como en el caso de un cliente nuevo):
      if (!userOrders || userOrders.length === 0) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'Actualmente no tienes ningún pedido u Orden de Compra registrada a tu nombre. ¡Realiza tu primera compra en la tienda para hacerle seguimiento!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          orderTrackingData: undefined,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Si la consulta retorna pedidos existentes, debe mostrar el listado o estado de sus órdenes reales, en lugar de enviarlo automáticamente a una OC predeterminada o ficticia
        const orderSummaryLines = userOrders.map((o) => 
          `• **Orden ${o.numeroOrden}**: Estado: **${o.estado || 'En Alistamiento'}** • Destino: ${o.ciudadEntrega || o.direccionEntrega || 'Dirección registrada'}`
        ).join('\n');

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Hola ${activeUserName}. Encontramos ${userOrders.length} orden(es) de compra registrada(s) a tu cuenta (${activeUserEmail}):\n\n${orderSummaryLines}\n\nA continuación puedes consultar el estado en tiempo real de tu(s) pedido(s):`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          orderTrackingData: userOrders,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('Error al consultar pedidos en Supabase:', err);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'Actualmente no tienes ningún pedido u Orden de Compra registrada a tu nombre. ¡Realiza tu primera compra en la tienda para hacerle seguimiento!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderTrackingData: undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo de los 5 Chips Interactivos
  const handleQuickAction = (chipId: QuickChipItem['id']) => {
    if (chipId === 'cotizar') {
      const userMsg: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: 'Cotizar',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `¡Perfecto! Vamos a cotizar tu proyecto de pintura bajo la norma técnica oficial colombiana NTC 1335 (rendimiento Viniltex hasta 32 m²/gal a 2 manos + 10% desperdicio).

¿Qué superficie deseas pintar (sala interior, fachada, habitación, techos o rejas metálicas) y cuántos m² aproximados tiene?

💡 También puedes pulsar **"Subir imagen para cotización"** para estimar el área automáticamente, o abrir directamente el Cotizador Inteligente:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
    } else if (chipId === 'rastrear') {
      handleTrackOrderQuery();
    } else if (chipId === 'sedes') {
      setIsAwaitingCityForSedes(true);
      const userMsg: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: 'Sedes y horarios',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: '¿En qué ciudad te encuentras para buscar la sede más cercana? 📍',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCitySelectionPrompt: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
    } else if (chipId === 'subir_imagen') {
      fileUploadInputRef.current?.click();
    } else if (chipId === 'simulador') {
      if (uploadedImage) {
        setChatStep('SIMULATION');
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        // Cargar simulación inmediata con sala de estar de muestra y cotización
        handleSimulatePresetSpace('sala');
      }
    }
  };

  const handleSimulatePresetSpace = (preset: 'sala' | 'fachada') => {
    const isFachada = preset === 'fachada';
    const imageToUse = isFachada ? facadeWallImg : sampleWallImg;
    const surf = isFachada ? 'fachada exterior' : 'sala interior';
    const area = isFachada ? 60 : 24;

    setUploadedImage(imageToUse);
    setDetectedSurface(surf);
    setSqm(area);
    setChatStep('SIMULATION');

    const recommendedAction: CartAction = isFachada ? {
      tipo: 'recomendada',
      badge: '⭐ Opción Recomendada / Fachadas (NTC 1335)',
      productName: 'Koraza Doble Vida Protección Clima Extremo',
      descripcion: 'Máxima durabilidad en intemperie, hidrófuga y barrera contra rayos UV y hongos.',
      sku: 'PIN-KOR-02',
      cantidad: 3,
      presentacion: 'Galón',
      precioUnitario: 98900,
      precioGalon: 98900,
      precioCunete: 429000,
      imagenUrl: '/src/assets/images/koraza_bucket_studio_1790894419359.jpg',
    } : {
      tipo: 'recomendada',
      badge: '⭐ Opción Recomendada / Interiores (NTC 1335)',
      productName: 'Viniltex Avanzado Máxima Lavabilidad',
      descripcion: 'Rinde hasta 32 m²/gal a 2 manos. Ultra lavable +20.000 ciclos y bajo olor.',
      sku: 'PIN-VTX-01',
      cantidad: 1,
      presentacion: 'Galón',
      precioUnitario: 79900,
      precioGalon: 79900,
      precioCunete: 349000,
      imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
    };

    setSimulatedProduct(recommendedAction);

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: isFachada ? 'Simulador de Color en Fachada Exterior' : 'Simulador de Color en Sala de Estar',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const subtotalPintura = recommendedAction.cantidad * recommendedAction.precioUnitario;
    const subtotalTools = DEFAULT_TOOLS_KIT.reduce((acc, t) => acc + (t.cantidad * t.precioUnitario), 0);
    const totalEstimado = subtotalPintura + subtotalTools;

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      text: `🎨 **Simulador Visual de Color Pintuco / ColorLink**:
He cargado la simulación para tu ${surf} (estimado ${area} m² bajo norma NTC 1335). Puedes interactuar con la paleta de colores oficiales y alternar entre el antes y el después con el botón "Ver Antes".

A continuación tienes el desglose detallado de la cotización precisa con la pintura oficial y el kit de herramientas reglamentario para tu compra:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cartActions: [recommendedAction],
      toolsKit: DEFAULT_TOOLS_KIT,
      areaM2: area,
      spaceType: surf,
      totalCotizacionCOP: totalEstimado,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    const imageToSend = attachedImage;

    if (!query && !imageToSend) return;
    if (isLoading) return;

    if (imageToSend) {
      handleProcessUploadedImageDirectly(imageToSend);
      if (!textToSend) setInput('');
      return;
    }

    const currentUploadedImage = uploadedImage;
    const parsedM2 = parseSquareMeters(query);

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');

    // Detección directa de respuesta sobre ciudad / sedes y horarios
    if (isAwaitingCityForSedes || isCityOrSedeQuery(query)) {
      setIsAwaitingCityForSedes(false);
      const { cityName: resolvedCity, hubs, notaRegional } = getSedesForCity(query);
      const hubsFormattedText = hubs.map((h) => 
        `• **${h.nombre}** (${h.tipo}):\n  📍 Dirección: ${h.direccion}\n  🕒 Horario: ${h.horario}\n  📞 Teléfono: ${h.telefono}\n  🚚 Tiempo de Entrega: ${h.tiempoEntrega}${h.asesorRegional ? `\n  👤 Asesor Regional: ${h.asesorRegional}` : ''}`
      ).join('\n\n');

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `📍 **Sede Oficial Pintuco / ColorLink en ${resolvedCity}**:

${hubsFormattedText}

${notaRegional ? `\n💡 ${notaRegional}\n` : ''}
📞 **Línea Gratuita Nacional**: 01 8000 111 247 | WhatsApp SAC: +57 310 450 8890`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sedeInfo: true,
        storeHubs: hubs,
        selectedCity: resolvedCity,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      return;
    }

    setIsLoading(true);

    if (parsedM2 !== null) {
      const confirmedM2 = parsedM2;
      setSqm(confirmedM2);
      setChatState((prev) => ({ ...prev, metrosCuadrados: confirmedM2 }));
      setChatStep('SHOW_RECOMMENDATIONS');

      const surfaceToUse = detectedSurface || 'muro interior';
      const dualActions = generateDualRecommendations(confirmedM2, surfaceToUse);

      try {
        const response = await fetch('/api/ai/chat-advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            imageUrl: currentUploadedImage || undefined,
            history: messages.slice(-8).map((m) => ({
              role: m.sender === 'user' ? 'user' : 'model',
              text: m.text,
            })),
            userSession,
          }),
        });
        const data = await response.json();
        const actionsToUse = (Array.isArray(data.cartActions) && data.cartActions.length > 0)
          ? data.cartActions
          : dualActions;

        const toolsToUse = (Array.isArray(data.toolsKit) && data.toolsKit.length > 0)
          ? data.toolsKit
          : DEFAULT_TOOLS_KIT;

        const subtotalP = actionsToUse[0].cantidad * actionsToUse[0].precioUnitario;
        const subtotalT = toolsToUse.reduce((acc: number, t: ToolItem) => acc + (t.cantidad * t.precioUnitario), 0);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: data.reply || `Entendido, ${confirmedM2} m². Calculado con la norma técnica colombiana NTC 1335 (2 manos + 10% desperdicio). A continuación te presento la cotización precisa de materiales:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cartActions: actionsToUse,
          toolsKit: toolsToUse,
          areaM2: confirmedM2,
          spaceType: surfaceToUse,
          totalCotizacionCOP: subtotalP + subtotalT,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const subtotalP = dualActions[0].cantidad * dualActions[0].precioUnitario;
        const subtotalT = DEFAULT_TOOLS_KIT.reduce((acc, t) => acc + (t.cantidad * t.precioUnitario), 0);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Entendido, ${confirmedM2} m². Calculado con la norma técnica colombiana NTC 1335 (2 manos + 10% desperdicio). A continuación te presento las alternativas recomendadas de Pintuco:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cartActions: dualActions,
          toolsKit: DEFAULT_TOOLS_KIT,
          areaM2: confirmedM2,
          spaceType: surfaceToUse,
          totalCotizacionCOP: subtotalP + subtotalT,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Consultas generales con filtro de restricción de alcance
    try {
      const response = await fetch('/api/ai/chat-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          imageUrl: currentUploadedImage || undefined,
          history: messages.slice(-8).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          userSession,
        }),
      });
      const data = await response.json();

      if (data.chatState?.metrosCuadrados) {
        setSqm(data.chatState.metrosCuadrados);
      }
      if (data.chatState?.tipoEspacio) {
        setDetectedSurface(data.chatState.tipoEspacio);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply || '¿Podrías indicarme qué área específica deseas pintar o cuántos m² aproximados tiene tu espacio?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cartAction: data.cartAction || undefined,
        cartActions: Array.isArray(data.cartActions) && data.cartActions.length > 0 ? data.cartActions : undefined,
        toolsKit: Array.isArray(data.toolsKit) && data.toolsKit.length > 0 ? data.toolsKit : undefined,
        totalCotizacionCOP: data.toolsKit && data.cartAction ? (data.cartAction.cantidad * data.cartAction.precioUnitario) + 60000 : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'Tuvimos un inconveniente momentáneo conectando con el Asesor Técnico. Como Asistente Oficial de Pintuco / ColorLink, te invito a formular tu consulta sobre pinturas o preparación de superficies bajo norma NTC 1335.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const drawerContent = (
    <div 
      ref={drawerRef}
      onWheel={handleDrawerWheel}
      className="fixed inset-y-0 right-0 z-[9999] w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 flex flex-col text-slate-800 animate-fadeIn pointer-events-auto overscroll-contain select-auto"
      style={{ 
        zIndex: 9999,
        pointerEvents: 'auto',
        overscrollBehavior: 'contain',
      }}
    >
      
      {/* Header Corporativo con Avatar Oficial Pintuco */}
      <div className="p-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-sky-400 shadow-md bg-[#002244] shrink-0 p-0.5 flex items-center justify-center">
            <img 
              src={PINTUCO_AI_AVATAR_URL} 
              alt="Asesor Técnico IA ColorLink" 
              className="w-full h-full object-contain" 
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs"></span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-900 truncate">
                Asesor Técnico IA • ColorLink
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                <span>NTC 1335</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {isUserAuthenticated && userSession?.nombre 
                ? `Asesorando a: ${userSession.nombre}` 
                : 'Asesoría Oficial Pintuco / ColorLink'}
            </p>
          </div>
        </div>

        {/* Acciones del encabezado: Limpiar Historial, Asesor SAC y Cerrar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onOpenHumanSupport && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHumanSupport();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors text-xs font-bold cursor-pointer shadow-2xs"
              title="Hablar con asesor humano / Radicar PQR oficial"
            >
              <HeadphonesIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">SAC</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 transition-colors text-xs font-bold border border-slate-200 cursor-pointer shadow-2xs"
            title="Limpiar y reiniciar el historial de conversación"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Limpiar</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
            title="Cerrar Asistente"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {downloadToast && (
        <div className="absolute top-16 left-3 right-3 z-50 p-3 rounded-2xl bg-slate-900/95 text-white backdrop-blur-md shadow-2xl border border-sky-400/40 flex items-center justify-between gap-3 animate-slideDown">
          <div className="flex items-center gap-2.5 min-w-0">
            {downloadToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-amber-400 shrink-0" />
            )}
            <span className="text-xs font-bold truncate">{downloadToast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadToast(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mini info bar */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <Layers className="w-3.5 h-3.5 text-blue-900 shrink-0" />
          <span className="truncate">
            {detectedSurface || chatState.tipoEspacio || formData.nombre_razon_social || 'Diagnóstico de Superficie'}
            {sqm ? ` • ${sqm} m²` : ''}
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 shrink-0">
          Norma NTC 1335
        </span>
      </div>

      {/* Chat Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50 overscroll-contain pointer-events-auto"
        style={{ overscrollBehavior: 'contain' }}
      >
        {messages.map((msg) => {
          const isMsgActiveForSimulation = 
            chatStep === 'SIMULATION' && 
            Boolean(simulatedProduct) && 
            (activeMessageIdForConfig === msg.id || !activeMessageIdForConfig);

          return (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-start gap-2.5'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-sky-300 shadow-xs shrink-0 bg-[#002244] mt-0.5 flex items-center justify-center p-0.5">
                  <img
                    src={PINTUCO_AI_AVATAR_URL}
                    alt="Asesor Técnico IA"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div
                className={`max-w-[90%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#002244] text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none'
                }`}
              >
                {/* Foto adjuntada por el usuario */}
                {msg.imageUrl && (
                  <div className="mb-2.5 rounded-xl overflow-hidden border border-white/20 shadow-xs max-w-sm">
                    <img
                      src={msg.imageUrl}
                      alt="Superficie adjuntada para análisis"
                      className="w-full max-h-56 object-cover rounded-xl"
                    />
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* BOTONES DE RESPUESTA RÁPIDA (CHIPS INLINE DENTRO DEL PRIMER MENSAJE DE BIENVENIDA) */}
                {(msg.showQuickChips || msg.id === 'welcome-1') && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                    {QUICK_ACTION_CHIPS.map((chip) => {
                      const Icon = chip.icon;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => handleQuickAction(chip.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-sky-50 text-slate-800 hover:text-blue-900 border border-slate-200 hover:border-sky-300 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                        >
                          <Icon className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                          <span>{chip.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Botón de acceso directo al módulo de autenticación para rastreo de pedidos */}
                {msg.text.includes('Validación de Seguridad Requerida') && !isUserAuthenticated && onOpenAuth && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenAuth('Rastreo Seguro de Pedido')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Iniciar Sesión para Rastrear Pedido →</span>
                    </button>
                  </div>
                )}

                {/* TARJETA DE RASTREO DE PEDIDO (Si el usuario consultó rastreo y está autenticado) */}
                {msg.orderTrackingData && msg.orderTrackingData.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                    {msg.orderTrackingData.map((order: any) => (
                      <div
                        key={order.id}
                        className="p-3 rounded-2xl bg-gradient-to-br from-teal-50/70 to-sky-50/50 border border-teal-200 text-slate-800 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            {order.numeroOrden || order.id}
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-800 text-white">
                            {order.estado || 'En Alistamiento'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">
                          Destino: <strong>{order.ciudad || order.form?.ciudad || 'Bogotá D.C.'}</strong> • Fecha: {order.fecha || 'Hoy'}
                        </p>
                        {order.calculo?.costoEstimadoCOP && (
                          <p className="text-[11px] font-bold text-blue-950 mt-0.5">
                            Total: ${Number(order.calculo.costoEstimadoCOP).toLocaleString('es-CO')} COP
                          </p>
                        )}
                        <div className="mt-2 pt-2 border-t border-teal-200/60 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigateTab) onNavigateTab('tracking');
                              onClose();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Ver Seguimiento en Vivo →</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* SELECTOR INTERACTIVO DE CIUDADES PARA SEDES Y HORARIOS (Single Source of Truth del Mapa) */}
                {msg.isCitySelectionPrompt && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold text-slate-700">
                        Selecciona tu ciudad (12 sedes del mapa interactivo):
                      </p>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                        12 Nodos Activos
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_CITIES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCity(c.name)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-sky-50 hover:bg-sky-100 text-blue-900 border border-sky-200 hover:border-sky-300 transition-all cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <MapPin className="w-3 h-3 text-sky-600 shrink-0" />
                          <span>{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* TARJETAS DETALLADAS DE SEDES Y HORARIOS POR CIUDAD */}
                {msg.storeHubs && msg.storeHubs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-900" />
                        <span>Sedes Oficiales Pintuco ({msg.selectedCity || 'Sedes'})</span>
                      </span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Atención Presencial
                      </span>
                    </div>

                    <div className="space-y-2">
                      {msg.storeHubs.map((hub) => (
                        <div
                          key={hub.id}
                          className="p-3 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 text-slate-800 shadow-2xs hover:border-sky-300 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-900 text-white">
                                {hub.tipo}
                              </span>
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 mt-1">
                                {hub.nombre}
                              </h4>
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                              {hub.ciudad}
                            </span>
                          </div>

                          <div className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span className="font-semibold text-slate-800">{hub.direccion}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span className="text-slate-600">{hub.horario}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <a
                                href={`tel:${hub.telefono.replace(/[^\d+]/g, '')}`}
                                className="text-blue-900 font-bold hover:underline font-mono text-[11px]"
                              >
                                {hub.telefono}
                              </a>
                            </div>
                            {hub.tiempoEntrega && (
                              <div className="flex items-start gap-2">
                                <Truck className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                                <span className="text-slate-700 font-medium">Entrega estimada: <strong>{hub.tiempoEntrega}</strong></span>
                              </div>
                            )}
                            {hub.asesorRegional && (
                              <div className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5">
                                <span className="font-bold text-slate-700">Asesor:</span>
                                <span>{hub.asesorRegional}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {onOpenCoverageMap && (
                      <div className="pt-1 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => onOpenCoverageMap()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-300" />
                          <span>Ver Mapa Interactivo de Sedes →</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* BOTÓN DE MAPA DE SEDES (Si se consultó sedes y horarios sin tarjetas individuales) */}
                {msg.sedeInfo && (!msg.storeHubs || msg.storeHubs.length === 0) && onOpenCoverageMap && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenCoverageMap()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-300" />
                      <span>Ver Mapa Interactivo de Sedes →</span>
                    </button>
                  </div>
                )}

                {/* RECOMENDACIÓN DE PINTURA (Paso 3) */}
                {((msg.cartActions && msg.cartActions.length > 0) || msg.cartAction) && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200 space-y-2.5">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pinturas Oficiales Pintuco (NTC 1335)</span>
                      </span>
                      <span className="text-[10px] text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Garantía de Fábrica
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(msg.cartActions || [msg.cartAction!]).map((action, actionIdx) => {
                        const isPremium = action.tipo === 'recomendada' || actionIdx === 0;
                        const isSelectedInSim = simulatedProduct?.sku === action.sku;

                        return (
                          <div
                            key={`${msg.id}-action-${actionIdx}`}
                            className={`p-3 rounded-2xl border transition-all ${
                              isSelectedInSim
                                ? 'bg-gradient-to-br from-amber-50/90 via-sky-50/50 to-blue-50/40 border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
                                : isPremium
                                ? 'bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border-blue-200 shadow-2xs hover:border-blue-300'
                                : 'bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border-emerald-200 shadow-2xs hover:border-emerald-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                      isPremium
                                        ? 'bg-blue-900 text-white'
                                        : 'bg-emerald-800 text-white'
                                    }`}
                                  >
                                    {action.badge || (isPremium ? '⭐ Opción Recomendada / Premium' : '💡 Opción Alternativa')}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    SKU: {action.sku}
                                  </span>
                                </div>

                                <h4 className="text-xs sm:text-sm font-black text-slate-900 mt-1 leading-snug">
                                  {action.productName}
                                </h4>

                                {action.descripcion && (
                                  <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                    {action.descripcion}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-800 shadow-2xs">
                                    {action.cantidad} {action.presentacion}
                                  </span>
                                  <span className="font-black text-blue-950">
                                    ${(action.cantidad * action.precioUnitario).toLocaleString('es-CO')} COP
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    (${action.precioUnitario.toLocaleString('es-CO')}/un)
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleStartSimulation(action, msg.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer ${
                                  isSelectedInSim
                                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                                    : 'bg-blue-900 hover:bg-blue-800 text-white'
                                }`}
                              >
                                <Palette className="w-3.5 h-3.5" />
                                <span>🎨 Probar Simulación de Color</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleConfirmAddToCartDirect(action, activeSimulationColor)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                              >
                                <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Agregar Pintura</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* TARJETA DE SIMULACIÓN VISUAL DEL ESPACIO (Antes y Después con paleta Pintuco) */}
                    {isMsgActiveForSimulation && simulatedProduct && (
                      <div className="mt-3 rounded-2xl border-2 border-amber-400/80 bg-white overflow-hidden shadow-lg text-slate-800 animate-fadeIn">
                        <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#002244] via-[#003366] to-[#004080] text-white flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-xs font-black uppercase tracking-wider block truncate">
                                {showOriginalMap[msg.id] 
                                  ? '📷 Foto Original (Antes)' 
                                  : `✨ Simulación: ${activeSimulationColor.name} (#${activeSimulationColor.code})`}
                              </span>
                              <span className="text-[10px] text-sky-200 font-medium block truncate">
                                {simulatedProduct.productName} • {simulatedProduct.cantidad} {simulatedProduct.presentacion}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowOriginalMap((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                            className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-300" />
                            <span>{showOriginalMap[msg.id] ? 'Ver Simulado' : 'Ver Antes'}</span>
                          </button>
                        </div>

                        {/* Visor Inpainting con segmentación de muros */}
                        <div className="relative overflow-hidden w-full bg-slate-900 rounded-b-none">
                          <ImageVisualizer
                            imageUrl={uploadedImage || msg.imageUrl || sampleWallImg}
                            selectedColor={activeSimulationColor}
                            showOriginal={Boolean(showOriginalMap[msg.id])}
                            surfaceType={detectedSurface || chatState.tipoEspacio || 'fachada'}
                            onToggleOriginal={() => setShowOriginalMap((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                            onSimulationRendered={(simDataUrl) => {
                              setSimulatedCanvasMap((prev) => ({
                                ...prev,
                                [msg.id]: simDataUrl,
                                latest: simDataUrl,
                              }));
                            }}
                          />
                        </div>

                        {/* Paleta Oficial Colorlink */}
                        <div className="p-3 bg-slate-50 border-t border-slate-100">
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                              <Palette className="w-3 h-3 text-blue-900" />
                              <span>Paleta de Color Pintuco:</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono font-bold">
                              {activeSimulationColor.name} (#{activeSimulationColor.code})
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5">
                            {SIMULATION_SWATCHES.map((swatch) => {
                              const isSelected = activeSimulationColor.code === swatch.code;
                              return (
                                <button
                                  key={swatch.code}
                                  type="button"
                                  onClick={() => {
                                    setActiveSimulationColor(swatch);
                                    setShowOriginalMap((prev) => ({ ...prev, [msg.id]: false }));
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-blue-900 bg-blue-50 text-blue-950 ring-2 ring-blue-900/30 shadow-xs'
                                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  <span
                                    className="w-3 h-3 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                                    style={{ backgroundColor: swatch.hex }}
                                  />
                                  <span className="truncate">{swatch.name.split(' ')[0]}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Descargar ficha */}
                        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center justify-end">
                          <button
                            type="button"
                            disabled={isDownloadingSheet}
                            onClick={() => handleDownloadTechnicalSheet(msg, simulatedProduct)}
                            className="inline-flex items-center gap-1.5 text-xs text-blue-900 hover:text-blue-950 font-bold hover:underline cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar Ficha Técnica con Simulación (PNG)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* DESGLOSE PRECISO DE COTIZACIÓN (PINTURA + KIT DE HERRAMIENTAS) */}
                    {simulatedProduct && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-white border-2 border-blue-900/30 shadow-md">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-900" />
                            <h4 className="text-xs sm:text-sm font-black text-slate-900">
                              Cotización Oficial Estimada (Norma NTC 1335)
                            </h4>
                          </div>
                          <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            {sqm || msg.areaM2 || 24} m²
                          </span>
                        </div>

                        {/* Ítem 1: Pintura recomendada */}
                        <div className="mt-3 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-800 font-bold">
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="w-2 h-2 rounded-full bg-blue-900 shrink-0" />
                              <span className="truncate">{simulatedProduct.productName} ({simulatedProduct.cantidad} {simulatedProduct.presentacion})</span>
                            </span>
                            <span className="font-black text-slate-900 shrink-0">
                              ${(simulatedProduct.cantidad * simulatedProduct.precioUnitario).toLocaleString('es-CO')} COP
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 pl-3.5">
                            Color: <strong>{activeSimulationColor.name}</strong> (#{activeSimulationColor.code}) • Rendimiento certificado a 2 manos
                          </p>
                        </div>

                        {/* Ítem 2: Kit de herramientas Pintuco */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                            🛠️ Kit Profesional de Preparación y Aplicación:
                          </span>
                          <div className="space-y-1 text-xs">
                            {(msg.toolsKit || DEFAULT_TOOLS_KIT).map((tool, tIdx) => (
                              <div key={tIdx} className="flex items-center justify-between text-slate-700 text-[11px]">
                                <span className="truncate">• {tool.cantidad}x {tool.nombre}</span>
                                <span className="font-semibold text-slate-900 shrink-0">
                                  ${(tool.cantidad * tool.precioUnitario).toLocaleString('es-CO')} COP
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Total Estimado en COP */}
                        <div className="mt-3.5 pt-2.5 border-t-2 border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black uppercase text-slate-500 block">Total Estimado Obra:</span>
                            <span className="text-[10px] text-slate-400">IVA 19% incluido en COP</span>
                          </div>
                          <div className="text-right">
                            <span className="text-base sm:text-lg font-black text-blue-950 block">
                              ${(
                                (simulatedProduct.cantidad * simulatedProduct.precioUnitario) +
                                (msg.toolsKit || DEFAULT_TOOLS_KIT).reduce((acc, t) => acc + (t.cantidad * t.precioUnitario), 0)
                              ).toLocaleString('es-CO')} COP
                            </span>
                          </div>
                        </div>

                        {/* BOTÓN DE LLAMADA A LA ACCIÓN (CTA PRINCIPAL) */}
                        <div className="mt-3.5 pt-2 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => handleProceedFullQuotationPurchase(
                              simulatedProduct,
                              msg.toolsKit || DEFAULT_TOOLS_KIT,
                              activeSimulationColor
                            )}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                          >
                            <ShoppingCart className="w-4 h-4 shrink-0 text-slate-950" />
                            <span>Proceder con la Compra / Agregar al Pedido</span>
                          </button>

                          <div className="flex items-center justify-between gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                if (onApplyCalculation) {
                                  onApplyCalculation(sqm || msg.areaM2 || 24, simulatedProduct.productName);
                                } else if (onNavigateTab) {
                                  onNavigateTab('cotizador');
                                }
                                onClose();
                              }}
                              className="text-blue-900 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Ver en Cotizador Inteligente (BOM)</span>
                            </button>

                            {onOpenCart && (
                              <button
                                type="button"
                                onClick={onOpenCart}
                                className="text-slate-600 hover:text-slate-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <span>Ver Carrito ({addedToCartMap.fullOrder ? '1 paquete' : '0'}) →</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`text-[10px] mt-2 text-right ${
                    msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-sky-300 shadow-xs shrink-0 bg-[#002244] mt-0.5 animate-pulse flex items-center justify-center p-0.5">
              <img
                src={PINTUCO_AI_AVATAR_URL}
                alt="Asesor Técnico IA"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-white p-3.5 rounded-2xl rounded-tl-none border border-slate-200 shadow-xs animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
              <span>Procesando espacio, aplicando norma NTC 1335 y calculando cotización oficial...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Previsualización de Imagen Adjunta */}
      {attachedImage && (
        <div className="px-3 pt-2.5 pb-1.5 bg-sky-50/80 border-t border-sky-100 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={attachedImage}
                alt="Foto a enviar"
                className="w-12 h-12 rounded-xl object-cover border border-sky-200 shadow-xs"
              />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 block truncate">Fotografía de tu espacio adjuntada</span>
              <span className="text-[10px] text-teal-700 font-medium block truncate">Lista para simulación visual y cálculo de cotización</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttachedImage(null)}
            className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer border border-slate-200 shrink-0"
            title="Quitar foto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Área de Entrada con Menú '+' */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 relative"
      >
        <input
          type="file"
          ref={fileUploadInputRef}
          accept="image/*,.pdf"
          id="file-upload"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <input
          type="file"
          ref={cameraUploadInputRef}
          accept="image/*"
          capture="environment"
          id="camera-upload"
          style={{ display: 'none' }}
          onChange={handleCameraUpload}
        />

        {/* Botón '+' con popover */}
        <div ref={attachMenuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsAttachMenuOpen((prev) => !prev)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 border ${
              isAttachMenuOpen
                ? 'bg-blue-900 text-white border-blue-900 rotate-45'
                : 'bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-[#003366] border-slate-300 hover:border-sky-300'
            }`}
            title="Opciones de archivo / cámara"
            aria-label="Adjuntar o tomar foto"
          >
            <Plus className="w-5 h-5 transition-transform duration-200" />
          </button>

          {isAttachMenuOpen && (
            <div 
              className="absolute left-0 bottom-full mb-2.5 z-50 w-56 sm:w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 animate-scaleUp text-slate-800"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                Adjuntar a la consulta
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  fileUploadInputRef.current?.click();
                }}
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-sky-50 text-slate-700 hover:text-[#003366] text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-100 group-hover:bg-[#003366] text-sky-800 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                  <Paperclip className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block leading-tight font-extrabold text-slate-900 group-hover:text-[#003366]">
                    📎 Adjuntar foto o archivo
                  </span>
                  <span className="block text-[10px] text-slate-500 font-normal truncate">
                    Para simulación y cotización
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsAttachMenuOpen(false);
                  cameraUploadInputRef.current?.click();
                }}
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer group mt-0.5"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block leading-tight font-extrabold text-slate-900 group-hover:text-emerald-900">
                    📷 Tomar foto
                  </span>
                  <span className="block text-[10px] text-slate-500 font-normal truncate">
                    Cámara en vivo de tu espacio
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={attachedImage ? "Añade un comentario sobre tu foto (opcional)..." : "¿Qué proyecto de pintura deseas cotizar?"}
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 text-slate-900 border border-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
        />

        <button
          type="submit"
          disabled={(!input.trim() && !attachedImage) || isLoading}
          className="p-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          title="Enviar consulta"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>

    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return (
    <>
      {createPortal(drawerContent, document.body)}
      <AddToCartModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        product={selectedProductToConfigure}
        onConfirmAddToCart={handleConfirmAddToCartFromModal}
        onOpenCart={onOpenCart}
      />
    </>
  );
};
