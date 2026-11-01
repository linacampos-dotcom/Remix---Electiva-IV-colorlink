import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FMVFormData, CalculationResult, UserSession, CartItem } from '../types';
import { 
  X, 
  Send, 
  Bot, 
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
  Image as ImageIcon,
  Plus,
  Paperclip,
  HeadphonesIcon
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AddToCartModal, ProductToConfigure } from './AddToCartModal';
import { downloadQuotationSheet } from '../utils/quotationSheetGenerator';
import { ImageVisualizer } from './ImageVisualizer';
import sampleWallImg from '../assets/images/living_room_wall_1789834592467.jpg';

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

// Analizador numérico estricto de metros cuadrados
export function parseSquareMeters(text: string): number | null {
  if (!text) return null;
  const clean = text.toLowerCase().replace(',', '.');

  // Multiplicaciones: "5x4", "5 * 4", "5 por 4", "4.5 x 3"
  const multiMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:x|\*|por)\s*(\d+(?:\.\d+)?)/i);
  if (multiMatch) {
    const w = parseFloat(multiMatch[1]);
    const h = parseFloat(multiMatch[2]);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      return Math.round(w * h * 10) / 10;
    }
  }

  // Unidades explícitas: "25 m2", "25m2", "25 m²", "unos 25 metros cuadrados", "25 mts", "25 metros"
  const metricMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:m2|m²|mts2|metros\s*cuadrados|metros|mts|m\b)/i);
  if (metricMatch) {
    const val = parseFloat(metricMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round(val * 10) / 10;
  }

  // Números aislados: "25", "son 25", "tengo 30"
  const numMatch = clean.match(/\b(\d+(?:\.\d+)?)\b/);
  if (numMatch) {
    const val = parseFloat(numMatch[1]);
    if (!isNaN(val) && val > 0 && val < 5000) return Math.round(val * 10) / 10;
  }

  return null;
}

// Generador de recomendaciones duales del catálogo Pintuco (Premium vs Económica)
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
        badge: '⭐ Opción Recomendada / Premium',
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

  // Interiores por defecto
  const galonesPrem = Math.max(1, Math.ceil((sqmValue / 32) * 1.10));
  const isCunetePrem = galonesPrem >= 5;
  const galonesEcon = Math.max(1, Math.ceil((sqmValue / 30) * 1.10));
  const isCuneteEcon = galonesEcon >= 5;

  return [
    {
      tipo: 'recomendada',
      badge: '⭐ Opción Recomendada / Premium',
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
}) => {
  // Manejo de sesión de usuario y almacenamiento de chat disociado para visitante
  const isUserAuthenticated = Boolean(
    userSession && (userSession.isLoggedIn === true || Boolean(userSession.email))
  );
  const activeUserEmail = isUserAuthenticated && userSession?.email
    ? userSession.email.trim().toLowerCase()
    : 'guest';
  const chatStorageKey = `colorlink_chat_${activeUserEmail}`;
  const chatStateKey = `colorlink_chat_state_${activeUserEmail}`;

  // Mensaje de bienvenida inicial técnico: 2 alternativas claras (Foto vs Preguntas de rutina)
  const getInitialMessages = (): Message[] => [
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `¡Hola! Soy tu Asesor Técnico Virtual de Pinturas Pintuco / COLORLINK.\n\nPara asesorarte con precisión tienes dos alternativas rápidas:\n• **Opción 1**: Toma o adjunta una foto de tu pared con el botón de cámara 📷 para diagnosticar la superficie y simular el color en tiempo real.\n• **Opción 2**: Cuéntame: ¿Qué tipo de espacio deseas pintar (interior, exterior, baño) y cuántos m² aproximados tiene?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  // Estado del hilo conversacional persistente (chatState)
  const [chatState, setChatState] = useState<ChatState>(() => {
    try {
      const saved = localStorage.getItem(chatStateKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error cargando chatState de localStorage:', e);
    }
    return {};
  });

  // Carga persistente de mensajes desde localStorage vinculada al usuario
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(chatStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error cargando historial de chat de localStorage:', e);
    }
    return getInitialMessages();
  });

  const [input, setInput] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(isSupabaseConfigured);
  const [addedToCartMap, setAddedToCartMap] = useState<Record<string, boolean>>({});
  const [selectedProductToConfigure, setSelectedProductToConfigure] = useState<ProductToConfigure | null>(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [activeMessageIdForConfig, setActiveMessageIdForConfig] = useState<string | null>(null);

  // MÁQUINA DE ESTADOS ESTRICTA (Secuencia Bloqueada: IDLE -> AWAITING_SQM -> SHOW_RECOMMENDATIONS -> SIMULATION)
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

  // Estados para Simulación Visual de Color y Descarga de Ficha Técnica
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

  // Guardar variables de estado persistentes en localStorage
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
      console.warn('Error guardando variables de la máquina de estados:', e);
    }
  }, [chatStep, uploadedImage, detectedSurface, sqm, simulatedProduct, activeUserEmail]);

  const handleDownloadTechnicalSheet = async (msg?: Message, action?: CartAction) => {
    try {
      setIsDownloadingSheet(true);
      setDownloadToast({ message: 'Guardando tu ficha de cotización...', type: 'info' });

      const targetAction = action || simulatedProduct || (msg?.cartActions && msg.cartActions[0]) || msg?.cartAction;
      const originalImage = msg?.imageUrl || uploadedImage || sampleWallImg;
      const simulatedImageToUse = (msg && simulatedCanvasMap[msg.id]) || simulatedCanvasMap['latest'] || originalImage;
      const areaToUse = sqm || chatState.metrosCuadrados || 20;

      await downloadQuotationSheet({
        simulatedImageUrl: simulatedImageToUse,
        originalImageUrl: (msg?.imageUrl || uploadedImage) ? originalImage : undefined,
        productName: targetAction?.productName || 'Viniltex Avanzado Máxima Lavabilidad',
        sku: targetAction?.sku || 'PIN-VTX-01',
        colorName: activeSimulationColor.name,
        colorCode: activeSimulationColor.code,
        colorHex: activeSimulationColor.hex,
        cantidad: targetAction?.cantidad || Math.max(1, Math.ceil((areaToUse / 28) * 1.10)),
        presentacion: targetAction?.presentacion || 'Galón',
        areaM2: areaToUse,
        clientName: userSession?.nombre || 'Cliente Pintuco',
        clientEmail: userSession?.email || 'mostrador@pintuco.com',
        esPersonalizado: true,
        tiempoEstimado: 'Preparación personalizada en tienda. Tiempo de alistamiento estimado: 24 a 48 horas hábiles.',
      });

      setDownloadToast({ message: '¡Ficha de cotización descargada con éxito! Llévala a tu tienda Pintuco.', type: 'success' });
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

  // Estado para el menú desplegable del botón '+'
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  // Cerrar el menú desplegable al hacer clic fuera
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

  // Redirigir el desplazamiento de la rueda del mouse (onWheel) desde cualquier parte
  // de la ventana del chat (encabezado, bordes, márgenes laterales o pie) al contenedor de mensajes
  const handleDrawerWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (messagesContainerRef.current) {
      const target = e.target as HTMLElement | null;
      const isInsideScrollable = target ? messagesContainerRef.current.contains(target) : false;
      if (!isInsideScrollable) {
        messagesContainerRef.current.scrollTop += e.deltaY;
      }
    }
  };

  // Listener nativo con { passive: false } para capturar la rueda del mouse en toda la superficie
  // del modal (incluyendo bordes, encabezado y pie) y contener estrictamente el overscroll
  useEffect(() => {
    const drawerEl = drawerRef.current;
    if (!drawerEl || !isOpen) return;

    const handleNativeWheel = (e: WheelEvent) => {
      const messagesEl = messagesContainerRef.current;
      if (!messagesEl) return;

      const target = e.target as HTMLElement | null;
      const isInsideMessages = messagesEl.contains(target);

      if (!isInsideMessages) {
        // El puntero está sobre el encabezado, footer, bordes o márgenes del modal:
        // Redirigir el desplazamiento vertical directamente al contenedor de mensajes
        messagesEl.scrollTop += e.deltaY;
        e.preventDefault();
      } else {
        // El puntero está sobre los mensajes. Si alcanza el límite superior o inferior,
        // bloquear la propagación para evitar que se desplace la página web de fondo
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

  // Abre el Selector de Color y Configurador Colorlink
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

  // Iniciar Simulación Visual de un producto seleccionado (Transiciona a chatStep = 'SIMULATION')
  const handleStartSimulation = (action: CartAction, messageId: string) => {
    setSimulatedProduct(action);
    setChatStep('SIMULATION');
    setActiveMessageIdForConfig(messageId);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Agregar al carrito directamente desde la tarjeta de simulación
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
    } else {
      try {
        const existing = localStorage.getItem('colorlink_cart');
        const cartList: CartItem[] = existing ? JSON.parse(existing) : [];
        const existingIdx = cartList.findIndex(
          (c) => c.sku === itemToAdd.sku && c.colorSeleccionado === itemToAdd.colorSeleccionado && c.presentacion === itemToAdd.presentacion
        );
        if (existingIdx > -1) {
          cartList[existingIdx].cantidad += itemToAdd.cantidad;
          cartList[existingIdx].subtotal = cartList[existingIdx].cantidad * cartList[existingIdx].precioUnitario;
        } else {
          cartList.push(itemToAdd);
        }
        localStorage.setItem('colorlink_cart', JSON.stringify(cartList));
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }

    setAddedToCartMap((prev) => ({ ...prev, [action.sku]: true }));
    setDownloadToast({
      message: `¡${action.productName} (${color.name}) agregado al carrito!`,
      type: 'success',
    });
    setTimeout(() => setDownloadToast(null), 3500);
  };

  // Manejo de confirmación desde el Modal de Color
  const handleConfirmAddToCartFromModal = (configuredItem: CartItem) => {
    if (onAddToCart) {
      onAddToCart(configuredItem);
    } else {
      try {
        const existing = localStorage.getItem('colorlink_cart');
        const cartList: CartItem[] = existing ? JSON.parse(existing) : [];
        const extractKey = (c?: string) => {
          if (!c) return '';
          const m = c.match(/\((?:#)?([a-z0-9]+)\)/i) || c.match(/#([a-z0-9]+)/i);
          return m ? m[1].toLowerCase() : c.replace(/[^a-z0-9]/gi, '').toLowerCase();
        };
        const itemColor = extractKey(configuredItem.colorSeleccionado);
        const itemSku = (configuredItem.sku || '').trim().toLowerCase();
        const itemPres = (configuredItem.presentacion || '').trim().toLowerCase();

        const existingIdx = cartList.findIndex((it) => {
          const itSku = (it.sku || '').trim().toLowerCase();
          const itColor = extractKey(it.colorSeleccionado);
          const itPres = (it.presentacion || '').trim().toLowerCase();
          if (itemSku && itSku && itemSku === itSku) {
            return itColor === itemColor && itPres === itemPres;
          }
          return it.nombre?.toLowerCase() === configuredItem.nombre?.toLowerCase() && itColor === itemColor && itPres === itemPres;
        });

        if (existingIdx > -1) {
          cartList[existingIdx].cantidad += (configuredItem.cantidad || 1);
          cartList[existingIdx].subtotal = cartList[existingIdx].cantidad * cartList[existingIdx].precioUnitario;
        } else {
          cartList.push(configuredItem);
        }
        localStorage.setItem('colorlink_cart', JSON.stringify(cartList));
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }

    if (activeMessageIdForConfig) {
      setAddedToCartMap((prev) => ({ ...prev, [activeMessageIdForConfig]: true }));
    }
  };

  // Sincronizar historial y estado si cambia la cuenta/correo del usuario
  useEffect(() => {
    try {
      const savedMsgs = localStorage.getItem(chatStorageKey);
      if (savedMsgs) {
        const parsed = JSON.parse(savedMsgs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
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

  // Guardar automáticamente cada actualización del chat en localStorage con tolerancia de cuota
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

  // Guardar chatState en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(chatStateKey, JSON.stringify(chatState));
    } catch (e) {
      console.warn('Error guardando chatState:', e);
    }
  }, [chatState, chatStateKey]);

  // Limpiar y reiniciar historial y memoria de la conversación
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
    setChatStep('IDLE');
    setChatState({});
    setMessages(getInitialMessages());
  };

  // Check Supabase connection on open
  useEffect(() => {
    if (isOpen) {
      async function verifySupabase() {
        try {
          const { data, error } = await supabase.from('productos').select('id').limit(1);
          if (!error && data) {
            setSupabaseConnected(true);
          }
        } catch {
          // Keep configured status
        }
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

  // 1. Manejador para adjuntar foto o archivo desde galería/explorador
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setAttachedImage(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
    setIsAttachMenuOpen(false);
  };

  // 2. Manejador para capturar foto en vivo con la cámara
  const handleCameraUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setAttachedImage(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
    setIsAttachMenuOpen(false);
  };

  // Helper compatible
  const handleImageSelected = handleFileUpload;

  // Envío conversacional con MÁQUINA DE ESTADOS ESTRICTA:
  // Paso 1: Subida de foto -> Identificación de superficie (NUNCA simular aquí) -> Pide m²
  // Paso 2: Reconocimiento numérico de m² -> Guarda m² inmediatamente (NUNCA repetir pregunta) -> Muestra recomendación dual
  // Paso 3: Recomendación dual -> Botón [ 🎨 Elegir Color y Probar Simulación ]
  // Paso 4: Simulación visual segmentada (sólo tras elegir color)
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    const imageToSend = attachedImage;

    // Si no hay texto ni foto, no enviar
    if (!query && !imageToSend) return;
    if (isLoading) return;

    // Registrar foto subida en la memoria del asistente
    if (imageToSend) {
      setUploadedImage(imageToSend);
    }

    const currentUploadedImage = imageToSend || uploadedImage;
    const parsedM2 = parseSquareMeters(query);

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query || '📷 [Foto adjuntada de mi pared/espacio para diagnóstico]',
      imageUrl: imageToSend || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    // =========================================================================
    // ESTADO 1: SUBIDA DE FOTO / IDENTIFICACIÓN DE SUPERFICIE
    // Al subir foto, la IA SOLO identifica objeto/espacio y pregunta por m².
    // ESTRICTAMENTE PROHIBIDO: No disparar simulación visual ni filtros.
    // Transiciona a chatStep = 'AWAITING_SQM'.
    // =========================================================================
    if (imageToSend && !parsedM2) {
      let surf = 'muro interior';
      const qLower = query.toLowerCase();
      if (/exterior|fachada|terraza|patio/i.test(qLower)) surf = 'fachada exterior';
      else if (/cielo|techo|drywall/i.test(qLower)) surf = 'cielo raso';
      else if (/baño|cocina|humedad/i.test(qLower)) surf = 'área de baño o cocina';
      else if (/cerca|reja|madera|metal/i.test(qLower)) surf = 'cerca / reja perimetral';

      setDetectedSurface(surf);
      setChatStep('AWAITING_SQM');
      setChatState((prev) => ({ ...prev, tipoEspacio: surf, metrosCuadrados: null }));

      try {
        const response = await fetch('/api/ai/chat-advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: query,
            imageUrl: imageToSend,
            history: messages.slice(-10).map((m) => ({
              role: m.sender === 'user' ? 'user' : 'model',
              text: m.text,
            })),
            userSession,
          }),
        });
        const data = await response.json();
        const identified = data.superficieIdentificada || surf;
        setDetectedSurface(identified);
        setChatState((prev) => ({ ...prev, tipoEspacio: identified, metrosCuadrados: null }));

        const replyText = data.reply || `Identifico un/a ${identified}. ¿Cuántos metros cuadrados (m²) o qué medidas aproximadas tiene esta superficie?`;
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Identifico un/a ${surf}. ¿Cuántos metros cuadrados (m²) o qué medidas aproximadas tiene esta superficie?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // =========================================================================
    // ESTADO 2: PROCESAMIENTO DE METROS CUADRADOS (Reconocimiento numérico)
    // Cuando se envía un número o medida (ej. "25", "25m2", "5x5", "unos 25 metros")
    // CAPTURAR EL VALOR INMEDIATAMENTE: setSqm(25)
    // NUNCA REPETIR LA PREGUNTA DE M²
    // TRANSICIONAR INMEDIATAMENTE A chatStep = 'SHOW_RECOMMENDATIONS'
    // =========================================================================
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
            imageUrl: imageToSend || currentUploadedImage || undefined,
            history: messages.slice(-10).map((m) => ({
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

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: data.reply || `Entendido, ${confirmedM2} m². Calculado con la norma técnica NTC 1335 (2 manos + 10% desperdicio). A continuación te presento las 2 opciones recomendadas del catálogo Pintuco:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cartActions: actionsToUse,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Entendido, ${confirmedM2} m². Calculado con la norma técnica NTC 1335 (2 manos + 10% desperdicio). A continuación te presento las 2 mejores alternativas de Pintuco para tu proyecto:`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cartActions: dualActions,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // =========================================================================
    // CASO 3: CONSULTAS TÉCNICAS O PREGUNTAS GENERALES
    // =========================================================================
    try {
      const response = await fetch('/api/ai/chat-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          imageUrl: imageToSend || currentUploadedImage || undefined,
          history: messages.slice(-10).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text,
          })),
          userSession,
        }),
      });
      const data = await response.json();
      if (data.chatState?.metrosCuadrados) {
        setSqm(data.chatState.metrosCuadrados);
        setChatStep('SHOW_RECOMMENDATIONS');
      }
      if (data.chatState?.tipoEspacio) {
        setDetectedSurface(data.chatState.tipoEspacio);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply || '¿Podrías indicarme qué área específica deseas pintar o cuántos m² aproximados tiene?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cartAction: data.cartAction || undefined,
        cartActions: Array.isArray(data.cartActions) && data.cartActions.length > 0 ? data.cartActions : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'Tuvimos un inconveniente momentáneo conectando con el Asesor Técnico. Por favor formula tu consulta nuevamente.',
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
      
      {/* Header Corporativo con botón de Limpiar Historial */}
      <div className="p-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-900 border border-blue-100 shadow-2xs shrink-0">
            <Bot className="w-5 h-5 text-blue-900" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-900 truncate">
                Asesor Técnico Virtual IA
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                <span>Supabase Live</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              {isUserAuthenticated && userSession?.nombre 
                ? `Usuario: ${userSession.nombre}` 
                : 'Asesor Técnico en Vivo • Modo Visitante'}
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
              <span className="hidden sm:inline">Asesor SAC</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 transition-colors text-xs font-bold border border-slate-200 cursor-pointer shadow-2xs"
            title="Limpiar y reiniciar el historial de conversación"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Limpiar Historial</span>
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

      {/* Notificación Toast de Descarga de Ficha Técnica y Simulación */}
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

      {/* Mini info bar: Proyecto y Estado de Memoria Conversacional (Sin asumir m² por defecto) */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <Layers className="w-3.5 h-3.5 text-blue-900 shrink-0" />
          <span className="truncate">
            {detectedSurface || chatState.tipoEspacio || formData.nombre_razon_social || 'Diagnóstico de Superficie'}
            {sqm ? ` • ${sqm} m²` : ''}
            {chatState.estadoPared ? ` • ${chatState.estadoPared}` : ''}
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 shrink-0">
          NTC 1335
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
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-900 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                }`}
              >
                {/* FOTO ADJUNTADA POR EL USUARIO (Paso 1: limpia, sin simulación prematura) */}
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

                {/* RECOMENDACIÓN DUAL DE PRODUCTOS (Paso 3: Solo con m² confirmados) */}
                {((msg.cartActions && msg.cartActions.length > 0) || msg.cartAction) && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200 space-y-2.5">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Opciones Técnicas Recomendadas (NTC 1335)</span>
                      </span>
                      <span className="text-[10px] text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Catálogo Pintuco
                      </span>
                    </div>

                    <div className="space-y-2.5">
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
                                    {action.badge || (isPremium ? '⭐ Opción Recomendada / Premium' : '💡 Opción Económica / Eficiente')}
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

                            {/* Botón para Elegir Color y Probar Simulación (Paso 3 -> Paso 4) */}
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleStartSimulation(action, msg.id)}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer ${
                                  isSelectedInSim
                                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400'
                                    : isPremium
                                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                    : 'bg-blue-900 hover:bg-blue-800 text-white'
                                }`}
                              >
                                <Palette className="w-3.5 h-3.5" />
                                <span>🎨 Elegir Color y Probar Simulación</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownloadTechnicalSheet(msg, action)}
                                disabled={isDownloadingSheet}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-sky-50 text-slate-700 hover:text-blue-900 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                                title="Descargar Ficha Técnica Oficial para mostrador"
                              >
                                <Download className="w-3.5 h-3.5 text-blue-900" />
                                <span>Ficha PDF / PNG</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* TARJETA DE SIMULACIÓN VISUAL SEGMENTADA (Paso 4: Únicamente tras elegir color) */}
                    {isMsgActiveForSimulation && simulatedProduct && (
                      <div className="mt-3 rounded-2xl border-2 border-amber-400/80 bg-white overflow-hidden shadow-lg text-slate-800 animate-fadeIn">
                        {/* Cabecera de la simulación */}
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

                        {/* Visor de Imagen con Segmentación Arquitectónica: 
                            Afecta los muros preservando intactos puertas de madera, ventanas, marcos, tejados, suelo y vegetación */}
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

                        {/* Selector de Paleta Colorlink en Vivo */}
                        <div className="p-3 bg-slate-50 border-t border-slate-100">
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1">
                              <Palette className="w-3 h-3 text-blue-900" />
                              <span>Paleta Oficial Colorlink:</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{activeSimulationColor.code}
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

                        {/* Botones de Acción de la Simulación: Descargar Ficha y Agregar al Carrito */}
                        <div className="p-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2">
                          <button
                            type="button"
                            disabled={isDownloadingSheet}
                            onClick={() => handleDownloadTechnicalSheet(msg, simulatedProduct)}
                            className="w-full sm:flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 text-slate-800 hover:text-blue-900 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                            title="Descargar Ficha Técnica Oficial en PNG"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                            <span>📥 Descargar Ficha PNG</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleConfirmAddToCartDirect(simulatedProduct, activeSimulationColor)}
                            className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                            title="Agregar este producto y color simulado al carrito"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                            <span>🛒 Agregar al Carrito</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {addedToCartMap[simulatedProduct?.sku || ''] && onOpenCart && (
                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>¡Producto agregado con éxito al carrito!</span>
                        </span>
                        <button
                          type="button"
                          onClick={onOpenCart}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Ver Carrito →
                        </button>
                      </div>
                    )}
                  </div>
                )}

              {/* Saved to Supabase Badge */}
              {msg.savedSupabaseId && (
                <div className="mt-3 p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Cotización registrada en Supabase (ID: {msg.savedSupabaseId.slice(0, 8)}...)</span>
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
          <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-white p-3.5 rounded-2xl border border-slate-200 w-fit shadow-xs animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Consultando catálogo técnico oficial Pintuco...</span>
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
              <span className="text-xs font-bold text-slate-800 block truncate">Foto de tu espacio / pared adjuntada</span>
              <span className="text-[10px] text-teal-700 font-medium block truncate">Lista para análisis multimodal con Asesor IA</span>
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

      {/* Área de Entrada Limpia con botón '+' y menú desplegable para adjuntar o tomar foto */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 relative"
      >
        {/* Input 1: Adjuntar foto o archivo desde la galería / explorador del dispositivo */}
        <input
          type="file"
          ref={fileUploadInputRef}
          accept="image/*,.pdf"
          id="file-upload"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Input 2: Tomar foto directamente con la cámara del dispositivo */}
        <input
          type="file"
          ref={cameraUploadInputRef}
          accept="image/*"
          capture="environment"
          id="camera-upload"
          style={{ display: 'none' }}
          onChange={handleCameraUpload}
        />

        {/* Botón Principal Redondo '+' con Menú Desplegable */}
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

          {/* Menú Emergente (Popover/Dropdown) */}
          {isAttachMenuOpen && (
            <div 
              className="absolute left-0 bottom-full mb-2.5 z-50 w-56 sm:w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 animate-scaleUp text-slate-800"
              style={{ pointerEvents: 'auto' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                Adjuntar a la consulta
              </div>

              {/* Opción 1: Adjuntar foto o archivo */}
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
                    Desde tu galería o explorador
                  </span>
                </div>
              </button>

              {/* Opción 2: Tomar foto */}
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
                    Abrir cámara en vivo
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
          placeholder={attachedImage ? "Añade un comentario sobre tu foto (opcional)..." : "Escribe tu consulta..."}
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
