import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CartItem, UserSession, COLORLINKOrder, TipoDocumento, FMVFormData } from '../types';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  ArrowRight,
  ArrowLeft,
  PackageCheck,
  Warehouse,
  Clock,
  CheckCircle2,
  MapPin,
  FileText,
  User,
  Phone,
  Mail,
  CreditCard,
  Building2,
  AlertCircle,
  Check,
  Sliders,
  Sparkles,
  Lock
} from 'lucide-react';
import { 
  DEPARTAMENTOS_COLOMBIA, 
  PINTUCO_STORE_HUBS, 
  calculateShipping 
} from '../data/colombiaLogistics';
import { persistShippingAddress, saveOrderToSupabase } from '../services/ordersService';
import { descontarInventarioPorPedido } from '../services/corporateService';

export interface CartComplementaryTool {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  presentacion: 'Unidad' | 'Galón' | 'Cuarto (1/4 Gal)' | 'Caneca';
  sku: string;
  descripcion: string;
  imagenUrl: string;
  motivo: string;
}

export const CART_COMPLEMENTARY_TOOLS: CartComplementaryTool[] = [
  {
    id: 'tool-kit-pro',
    nombre: 'Kit Profesional Pintor (Rodillo + Bandeja + Brocha)',
    categoria: 'Aplicación',
    precio: 34900,
    presentacion: 'Unidad',
    sku: 'PIN-KIT-01',
    descripcion: 'Bandeja ergonómica, rodillo de felpa antigoteo y brocha para esquinas.',
    imagenUrl: '/src/assets/images/paint_roller_tray_1790894457076.jpg',
    motivo: 'Rendimiento parejo sin marcas de rodillo en paredes y techos',
  },
  {
    id: 'tool-cinta-azul',
    nombre: 'Cinta de Enmascarar Azul Pintor (48mm x 50m)',
    categoria: 'Protección',
    precio: 12500,
    presentacion: 'Unidad',
    sku: 'PIN-CIN-48',
    descripcion: 'Líneas nítidas sin desprendimiento de estuco ni residuos de pegamento.',
    imagenUrl: '/src/assets/images/cinta_azul_rollo_1790894607849.jpg',
    motivo: 'Protege marcos de puertas, zócalos e interruptores con bordes perfectos',
  },
  {
    id: 'tool-espatula-inox',
    nombre: 'Espátula Acero Inoxidable Flexible 4"',
    categoria: 'Preparación',
    precio: 14200,
    presentacion: 'Unidad',
    sku: 'PIN-ESP-04',
    descripcion: 'Hoja flexible de acero inoxidable para empastes, masilla y resanes.',
    imagenUrl: '/src/assets/images/espatula_acero_inox_1790894617251.jpg',
    motivo: 'Curado y alisado de fisuras antes de aplicar la pintura de acabado',
  },
  {
    id: 'tool-lijas-pack',
    nombre: 'Juego de Lijas al Agua Pintuco (5 pliegos)',
    categoria: 'Preparación',
    precio: 8900,
    presentacion: 'Unidad',
    sku: 'PIN-LIJ-05',
    descripcion: 'Granos 150/220/360 para suavizar masilla, revoque o estuco antes de pintar.',
    imagenUrl: '/src/assets/images/lija_agua_pintuco_1790894597920.jpg',
    motivo: 'Abre poro y suaviza la pared para una adherencia 100% homogénea',
  },
  {
    id: 'tool-destapador',
    nombre: 'Abrecuñetes Ergonómico Profesional',
    categoria: 'Apertura',
    precio: 9500,
    presentacion: 'Unidad',
    sku: 'PIN-DST-01',
    descripcion: 'Palanca de destape seguro que protege la tapa para conservaciones posteriores.',
    imagenUrl: '/src/assets/images/destapa_cunetes_herramienta_1790894634999.jpg',
    motivo: 'Apertura limpia y segura de cuñetes de 5 Galones sin deformar la tapa',
  },
];

export const normalizeTipoDocumento = (val?: string): TipoDocumento => {
  if (!val) return 'Cédula de Ciudadanía';
  const v = val.trim();
  const upper = v.toUpperCase();
  if (upper === 'CC' || upper.includes('CIUDADAN') || upper.includes('CEDULA') || upper.includes('CÉDULA')) {
    return 'Cédula de Ciudadanía';
  }
  if (upper === 'NIT' || upper.includes('NIT') || upper === 'RUT') {
    return 'NIT';
  }
  if (upper === 'CE' || upper.includes('EXTRANJER')) {
    return 'Cédula de Extranjería';
  }
  if (upper.includes('PASAPORTE')) {
    return 'Pasaporte';
  }
  return (val as TipoDocumento) || 'Cédula de Ciudadanía';
};

export const resolveInitialCustomerData = (
  userSession?: UserSession | null,
  formData?: FMVFormData
) => {
  let nombre = '';
  let documento = '';
  let tipoDoc: TipoDocumento = 'Cédula de Ciudadanía';
  let telefono = '';
  let email = '';
  let direccion = '';
  let ciudad = '';
  let departamento = '';
  let modalidad: 'domicilio' | 'retiro_tienda' = 'domicilio';
  let sede = '';

  // 1. Prioridad: Sesión activa del usuario (userSession prop o localStorage)
  let activeSession = userSession;
  if (!activeSession) {
    try {
      const savedSession = localStorage.getItem('colorlink_user_session') || localStorage.getItem('currentUser') || localStorage.getItem('colorlink_active_session');
      if (savedSession) {
        activeSession = JSON.parse(savedSession);
      }
    } catch {}
  }

  if (activeSession) {
    if (activeSession.nombre) nombre = activeSession.nombre;
    if (activeSession.documento || activeSession.cedula) documento = activeSession.documento || activeSession.cedula || '';
    if (activeSession.tipoDocumento) tipoDoc = normalizeTipoDocumento(activeSession.tipoDocumento);
    if (activeSession.telefono) telefono = activeSession.telefono;
    if (activeSession.email) email = activeSession.email;

    let savedList = Array.isArray(activeSession.direcciones) ? activeSession.direcciones : [];
    if (savedList.length === 0) {
      try {
        const emailNorm = (activeSession.email || '').trim().toLowerCase();
        const rawScoped = emailNorm
          ? localStorage.getItem(`colorlink_user_addresses_${emailNorm}`)
          : null;
        const rawGlobal = localStorage.getItem('colorlink_user_addresses');
        const parsed = JSON.parse(rawScoped || rawGlobal || '[]');
        if (Array.isArray(parsed)) savedList = parsed;
      } catch {}
    }

    const defAddr = savedList.find(d => d.esPredeterminada) || savedList[0];
    const formattedDefDir = defAddr?.direccion
      ? (defAddr.barrio ? `${defAddr.direccion}, Barrio ${defAddr.barrio}` : defAddr.direccion)
      : '';
    if (formattedDefDir || activeSession.direccion || activeSession.address) {
      direccion = formattedDefDir || activeSession.direccion || activeSession.address || '';
    }
    if (defAddr?.ciudad || activeSession.ciudad) {
      ciudad = defAddr?.ciudad || activeSession.ciudad || '';
    }
    if (defAddr?.departamento || activeSession.departamento) {
      departamento = defAddr?.departamento || activeSession.departamento || '';
    }
  }

  // 2. Datos del Cotizador Inteligente (formData prop o colorlink_current_fmv)
  let currentFmv = formData;
  if (!currentFmv) {
    try {
      const savedFmv = localStorage.getItem('colorlink_current_fmv');
      if (savedFmv) currentFmv = JSON.parse(savedFmv);
    } catch {}
  }

  if (currentFmv) {
    if (!nombre && (currentFmv.nombre_razon_social || currentFmv.responsable_contacto)) {
      nombre = currentFmv.nombre_razon_social || currentFmv.responsable_contacto || '';
    }
    if (!documento && currentFmv.documento) {
      documento = currentFmv.documento;
    }
    if (currentFmv.tipo_documento && tipoDoc === 'Cédula de Ciudadanía') {
      tipoDoc = normalizeTipoDocumento(currentFmv.tipo_documento);
    }
    if (!telefono && currentFmv.telefono) {
      telefono = currentFmv.telefono;
    }
    if (!email && currentFmv.correo_electronico) {
      email = currentFmv.correo_electronico;
    }
    if (!direccion && currentFmv.direccion_obra) {
      direccion = currentFmv.direccion_obra;
    }
    if (!ciudad && currentFmv.ciudad) {
      ciudad = currentFmv.ciudad;
    }
    if (!departamento && currentFmv.departamento) {
      departamento = currentFmv.departamento;
    }
    if (currentFmv.modalidad_entrega) {
      modalidad = currentFmv.modalidad_entrega;
    }
    if (currentFmv.sede_retiro) {
      sede = currentFmv.sede_retiro;
    }
  }

  // 3. Datos previos de despacho/cotización en localStorage (colorlink_quote_delivery o colorlink_shipping_state)
  try {
    const rawQuote = localStorage.getItem('colorlink_quote_delivery') || localStorage.getItem('colorlink_shipping_state');
    if (rawQuote) {
      const q = JSON.parse(rawQuote);
      if (!nombre && (q.nombre || q.customerName)) nombre = q.nombre || q.customerName;
      if (!documento && (q.documento || q.customerDocument)) documento = q.documento || q.customerDocument;
      if (q.tipoDocumento || q.tipoDoc) tipoDoc = normalizeTipoDocumento(q.tipoDocumento || q.tipoDoc);
      if (!telefono && (q.telefono || q.customerPhone)) telefono = q.telefono || q.customerPhone;
      if (!email && (q.email || q.customerEmail || q.correo)) email = q.email || q.customerEmail || q.correo;
      if (!direccion && (q.direccion || q.deliveryAddress || q.shippingAddress)) {
        const d = q.direccion || q.deliveryAddress || q.shippingAddress;
        if (!d.startsWith('Retiro en Tienda')) direccion = d;
      }
      if (!ciudad && (q.ciudad || q.city)) ciudad = q.ciudad || q.city;
      if (!departamento && (q.departamento || q.department)) departamento = q.departamento || q.department;
      if (q.modalidad || q.deliveryMode) {
        const rawM = q.modalidad || q.deliveryMode;
        modalidad = rawM === 'pickup' || rawM === 'retiro_tienda' ? 'retiro_tienda' : 'domicilio';
      }
      if (!sede && (q.sede || q.pickupStore)) sede = q.sede || q.pickupStore;
    }
  } catch {}

  // 4. Claves individuales de respaldo en localStorage
  try {
    if (!nombre) nombre = localStorage.getItem('colorlink_customer_name') || '';
    if (!documento) documento = localStorage.getItem('colorlink_customer_doc') || '';
    if (!telefono) telefono = localStorage.getItem('colorlink_customer_phone') || '';
    if (!email) email = localStorage.getItem('colorlink_customer_email') || '';
    const savedTipo = localStorage.getItem('colorlink_customer_tipodoc');
    if (savedTipo) tipoDoc = normalizeTipoDocumento(savedTipo);
    if (!direccion) {
      const a = localStorage.getItem('colorlink_shipping_address') || localStorage.getItem('shippingAddress') || localStorage.getItem('colorlink_user_address') || '';
      if (!a.startsWith('Retiro en Tienda')) direccion = a;
    }
    if (!ciudad) ciudad = localStorage.getItem('colorlink_shipping_city') || '';
    if (!departamento) departamento = localStorage.getItem('colorlink_shipping_depto') || '';
  } catch {}

  return {
    nombre: nombre.trim(),
    documento: documento.trim(),
    tipoDoc,
    telefono: telefono.trim(),
    email: email.trim(),
    direccion: direccion.trim(),
    ciudad: ciudad || 'Bogotá D.C.',
    departamento: departamento || 'Bogotá D.C.',
    modalidad,
    sede: sede || PINTUCO_STORE_HUBS[0].nombre,
  };
};

interface ShoppingCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  formData?: FMVFormData;
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onOpenCatalog: () => void;
  onAddToCartItem?: (item: CartItem) => void;
  userSession?: UserSession | null;
  onUpdateUserSession?: (updatedSession: UserSession) => void;
  onConfirmOrder?: (newOrder: COLORLINKOrder) => void;
  onOpenTracking?: () => void;
  onOpenAuth?: () => void;
}

export const ShoppingCartDrawer: React.FC<ShoppingCartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  formData,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onOpenCatalog,
  onAddToCartItem,
  userSession,
  onUpdateUserSession,
  onConfirmOrder,
  onOpenTracking,
  onOpenAuth,
}) => {
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [dismissedTools, setDismissedTools] = useState<Record<string, boolean>>({});

  // Ubicación y Modalidad sincronizadas con estado global y cotizador
  const [modalidad, setModalidad] = useState<'domicilio' | 'retiro_tienda'>(() => {
    return resolveInitialCustomerData(userSession, formData).modalidad;
  });
  const [selectedDepto, setSelectedDepto] = useState<string>(() => {
    return resolveInitialCustomerData(userSession, formData).departamento;
  });
  const [selectedCiudad, setSelectedCiudad] = useState<string>(() => {
    return resolveInitialCustomerData(userSession, formData).ciudad;
  });
  const [selectedSede, setSelectedSede] = useState<string>(() => {
    return resolveInitialCustomerData(userSession, formData).sede;
  });

  // Estado para la tarjeta de confirmación del cotizador y modo edición
  const [isQuoteDeliveryActive, setIsQuoteDeliveryActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('colorlink_quote_delivery');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isDefined || parsed.departamento || parsed.ciudad);
      }
    } catch {}
    return false;
  });
  const [isModifyingDelivery, setIsModifyingDelivery] = useState<boolean>(false);

  // Checkout Form State con autocompletado automático inicial
  const [checkoutNombre, setCheckoutNombre] = useState<string>(() => {
    return resolveInitialCustomerData(userSession, formData).nombre;
  });
  const [checkoutTipoDoc, setCheckoutTipoDoc] = useState<TipoDocumento>(() => {
    return resolveInitialCustomerData(userSession, formData).tipoDoc;
  });
  const [checkoutDocumento, setCheckoutDocumento] = useState<string>(() => {
    return resolveInitialCustomerData(userSession, formData).documento;
  });
  const [checkoutTelefono, setCheckoutTelefono] = useState<string>(() => {
    return resolveInitialCustomerData(userSession, formData).telefono;
  });
  const [checkoutEmail, setCheckoutEmail] = useState<string>(() => {
    return resolveInitialCustomerData(userSession, formData).email;
  });
  const [checkoutDireccion, setCheckoutDireccion] = useState<string>(() => {
    return resolveInitialCustomerData(userSession, formData).direccion;
  });
  const [checkoutNotas, setCheckoutNotas] = useState('');
  const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'pse' | 'contraentrega'>('tarjeta');
  const [cardNumero, setCardNumero] = useState('');
  const [cardNombre, setCardNombre] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardCuotas, setCardCuotas] = useState('1');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Estados para flujo ficticio de pago y recomendaciones inteligentes (Pre-Seguimiento)
  const [checkoutFlowStage, setCheckoutFlowStage] = useState<'form' | 'processing' | 'upsell'>('form');
  const [pendingOrder, setPendingOrder] = useState<COLORLINKOrder | null>(null);
  const [upsellRecommendations, setUpsellRecommendations] = useState<CartComplementaryTool[]>([]);
  const [addedUpsellIds, setAddedUpsellIds] = useState<string[]>([]);

  // Manejador de cambio de dirección con persistencia inmediata en estado global y localStorage
  const handleAddressChange = (newVal: string) => {
    setCheckoutDireccion(newVal);
    try {
      localStorage.setItem('colorlink_shipping_address', newVal);
      localStorage.setItem('shippingAddress', newVal);
      localStorage.setItem('colorlink_user_address', newVal);

      const savedUser = localStorage.getItem('colorlink_user_session');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.direccion = newVal;
        parsed.address = newVal;
        localStorage.setItem('colorlink_user_session', JSON.stringify(parsed));
      }

      if (userSession && onUpdateUserSession) {
        onUpdateUserSession({
          ...userSession,
          direccion: newVal,
          address: newVal,
        });
      }

      window.dispatchEvent(new CustomEvent('colorlink_shipping_address_updated', {
        detail: { address: newVal, city: selectedCiudad }
      }));
    } catch {}
  };

  const handleAddComplementaryTool = (tool: CartComplementaryTool) => {
    const existing = cart.find(c => c.id === tool.id || c.sku === tool.sku);
    if (existing) {
      onUpdateQuantity(existing.id, existing.cantidad + 1);
    } else if (onAddToCartItem) {
      onAddToCartItem({
        id: tool.id,
        nombre: tool.nombre,
        sku: tool.sku,
        presentacion: tool.presentacion,
        cantidad: 1,
        precioUnitario: tool.precio,
        imagenUrl: tool.imagenUrl,
        marca: 'Pintuco',
        subtotal: tool.precio,
      });
    } else {
      window.dispatchEvent(new CustomEvent('colorlink_add_to_cart', {
        detail: {
          id: tool.id,
          nombre: tool.nombre,
          sku: tool.sku,
          presentacion: tool.presentacion,
          cantidad: 1,
          precioUnitario: tool.precio,
          imagenUrl: tool.imagenUrl,
          marca: 'Pintuco',
          subtotal: tool.precio,
        }
      }));
    }
  };

  // Sync userSession values when opening or when userSession changes
  // Sincronización Integral y Automática de Datos del Cliente y Despacho
  const syncAllCustomerAndDeliveryData = useCallback((forceAddressSync = false) => {
    const resolved = resolveInitialCustomerData(userSession, formData);

    // 1. Capturar de inmediato los datos del perfil activo (Nombre, Doc, TipoDoc, Teléfono y Correo)
    let activeSession = userSession;
    if (!activeSession || !activeSession.isLoggedIn) {
      try {
        const raw = localStorage.getItem('currentUser') || localStorage.getItem('colorlink_user_session') || localStorage.getItem('colorlink_active_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.isLoggedIn || parsed.email || parsed.nombre || parsed.documento)) {
            activeSession = parsed;
          }
        }
      } catch {}
    }

    if (activeSession && (activeSession.isLoggedIn || activeSession.nombre || activeSession.documento || activeSession.email)) {
      if (activeSession.nombre) setCheckoutNombre(activeSession.nombre);
      if (activeSession.documento || activeSession.cedula) setCheckoutDocumento(activeSession.documento || activeSession.cedula);
      if (activeSession.tipoDocumento) setCheckoutTipoDoc(normalizeTipoDocumento(activeSession.tipoDocumento));
      if (activeSession.telefono) setCheckoutTelefono(activeSession.telefono);
      if (activeSession.email) setCheckoutEmail(activeSession.email);
    } else {
      setCheckoutNombre((prev) => (prev.trim() ? prev : resolved.nombre));
      setCheckoutDocumento((prev) => (prev.trim() ? prev : resolved.documento));
      setCheckoutTipoDoc((prev) => (prev ? normalizeTipoDocumento(prev) : resolved.tipoDoc));
      setCheckoutTelefono((prev) => (prev.trim() ? prev : resolved.telefono));
      setCheckoutEmail((prev) => (prev.trim() ? prev : resolved.email));
    }

    // 2. Sincronizar ubicación y modalidad
    if (resolved.departamento) {
      setSelectedDepto(resolved.departamento);
    }
    if (resolved.ciudad) {
      setSelectedCiudad(resolved.ciudad);
    }
    if (resolved.modalidad) {
      setModalidad(resolved.modalidad);
    }
    if (resolved.sede) {
      setSelectedSede(resolved.sede);
    }

    // 3. Sincronizar dirección según modalidad
    if (resolved.modalidad === 'retiro_tienda') {
      const storeObj = PINTUCO_STORE_HUBS.find(h => h.nombre === resolved.sede) ||
        PINTUCO_STORE_HUBS.find(h => h.ciudad.toLowerCase() === resolved.ciudad.toLowerCase()) ||
        PINTUCO_STORE_HUBS[0];
      const pickupText = `Retiro en Tienda: ${storeObj.nombre} - ${storeObj.direccion}`;
      setCheckoutDireccion(pickupText);
    } else {
      if (resolved.direccion && !resolved.direccion.startsWith('Retiro en Tienda')) {
        setCheckoutDireccion((prev) =>
          forceAddressSync || !prev.trim() || prev.startsWith('Retiro en Tienda')
            ? resolved.direccion
            : prev
        );
      }
    }

    try {
      const saved = localStorage.getItem('colorlink_quote_delivery');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isDefined || parsed.departamento || parsed.ciudad) {
          setIsQuoteDeliveryActive(true);
        }
      }
    } catch {}
  }, [userSession, formData]);

  // Ejecutar sincronización al abrir el drawer o al cambiar a la vista de checkout
  useEffect(() => {
    if (isOpen) {
      syncAllCustomerAndDeliveryData(false);

      try {
        if (sessionStorage.getItem('colorlink_open_checkout_step') === 'true') {
          setIsCheckoutStep(true);
          sessionStorage.removeItem('colorlink_open_checkout_step');
        }
      } catch {}
    }

    const handleExternalUpdate = () => {
      syncAllCustomerAndDeliveryData(true);
    };

    window.addEventListener('colorlink_quote_delivery_updated', handleExternalUpdate);
    window.addEventListener('colorlink_shipping_state_updated', handleExternalUpdate);
    window.addEventListener('colorlink_shipping_address_updated', handleExternalUpdate);
    window.addEventListener('colorlink_user_session_updated', handleExternalUpdate);

    return () => {
      window.removeEventListener('colorlink_quote_delivery_updated', handleExternalUpdate);
      window.removeEventListener('colorlink_shipping_state_updated', handleExternalUpdate);
      window.removeEventListener('colorlink_shipping_address_updated', handleExternalUpdate);
      window.removeEventListener('colorlink_user_session_updated', handleExternalUpdate);
    };
  }, [isOpen, isCheckoutStep, syncAllCustomerAndDeliveryData]);

  // Reset checkout step when closing
  useEffect(() => {
    if (!isOpen) {
      setIsCheckoutStep(false);
      setCheckoutError(null);
      setCheckoutFlowStage('form');
      setPendingOrder(null);
      setAddedUpsellIds([]);
    }
  }, [isOpen]);

  // Nodos y tiendas disponibles calculados con useMemo antes de cualquier return condicional (Reglas de Hooks)
  const availableStores = useMemo(() => {
    const filtered = PINTUCO_STORE_HUBS.filter(
      h => h.departamento.toLowerCase() === selectedDepto.toLowerCase() ||
           h.ciudad.toLowerCase() === selectedCiudad.toLowerCase()
    );
    return filtered.length > 0 ? filtered : PINTUCO_STORE_HUBS;
  }, [selectedDepto, selectedCiudad]);

  const matchingStore = useMemo(() => {
    return PINTUCO_STORE_HUBS.find(h => h.nombre === selectedSede) || availableStores[0] || PINTUCO_STORE_HUBS[0];
  }, [selectedSede, availableStores]);

  const activeCartItems = useMemo(() => cart.filter(item => item.cantidad > 0), [cart]);

  if (!isOpen) return null;

  const totalItems = activeCartItems.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotalCOP = activeCartItems.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);

  // Compute equivalent gallons for shipping calculation
  const totalGalonesEquivalentes = activeCartItems.reduce((sum, item) => {
    const factor = item.presentacion === 'Cuñete (5 Gal)' ? 5 : item.presentacion === 'Galón' ? 1 : 0.25;
    return sum + (item.cantidad * factor);
  }, 0);

  const shipping = calculateShipping(
    selectedDepto,
    selectedCiudad,
    Math.max(1, totalGalonesEquivalentes),
    modalidad,
    subtotalCOP
  );

  // Discriminación transparente: Si es Retiro en Tienda O subtotal >= $350k, Flete es estrictamente $0 COP
  const esEnvioGratis = modalidad === 'retiro_tienda' || subtotalCOP >= 350000 || shipping.esFleteGratis;
  const envioCOP = esEnvioGratis ? 0 : shipping.costoFlete;
  const totalCOP = subtotalCOP + envioCOP;

  // Discriminación formal de IVA 19% (incluido según estatuto tributario colombiano)
  const baseGravable = Math.round(subtotalCOP / 1.19);
  const iva19 = subtotalCOP - baseGravable;

  const currentDeptoObj = DEPARTAMENTOS_COLOMBIA.find(d => d.nombre === selectedDepto) || DEPARTAMENTOS_COLOMBIA[0];

  const handleDeptoChange = (newDepto: string) => {
    setSelectedDepto(newDepto);
    const found = DEPARTAMENTOS_COLOMBIA.find(d => d.nombre === newDepto);
    if (found && found.municipios.length > 0) {
      setSelectedCiudad(found.municipios[0].nombre);
    }
  };

  // Motor de recomendaciones inteligentes pre-seguimiento según los productos adquiridos
  const getSmartRecommendationsForCart = (items: CartItem[]): CartComplementaryTool[] => {
    const existingSkusOrIds = new Set(
      items.flatMap(i => [i.id.toLowerCase(), (i.sku || '').toLowerCase(), i.nombre.toLowerCase()])
    );
    const itemNames = items.map(i => i.nombre.toLowerCase()).join(' ');

    const hasPintura = /viniltex|koraza|esmalte|pintura|barniz|intervinil|acrílica|acrilica|latex|base|sellador/i.test(itemNames);
    const hasLija = /lija|lijas|pulir/i.test(itemNames);
    const hasCunete = items.some(i => 
      (i.presentacion || '').toLowerCase().includes('cuñete') || 
      (i.presentacion || '').toLowerCase().includes('5 gal')
    );

    const recs: CartComplementaryTool[] = [];

    // Pinturas / Barnices -> Kit Profesional Pintor & Cinta de Enmascarar Azul
    if (hasPintura) {
      const kitPro = CART_COMPLEMENTARY_TOOLS.find(t => t.id === 'tool-kit-pro');
      if (kitPro && !existingSkusOrIds.has(kitPro.id) && !existingSkusOrIds.has(kitPro.sku.toLowerCase())) {
        recs.push({ ...kitPro, motivo: 'Recomendado para tu pintura: rodillo antigoteo y brocha para esquinas limpias' });
      }
      const cinta = CART_COMPLEMENTARY_TOOLS.find(t => t.id === 'tool-cinta-azul');
      if (cinta && !existingSkusOrIds.has(cinta.id) && !existingSkusOrIds.has(cinta.sku.toLowerCase())) {
        recs.push({ ...cinta, motivo: 'Protege zócalos y marcos sin levantar la película de pintura' });
      }
    }

    // Lijas -> Espátula de acero inoxidable
    if (hasLija) {
      const espatula = CART_COMPLEMENTARY_TOOLS.find(t => t.id === 'tool-espatula-inox');
      if (espatula && !existingSkusOrIds.has(espatula.id) && !existingSkusOrIds.has(espatula.sku.toLowerCase())) {
        recs.push({ ...espatula, motivo: 'Complemento de lijado: espátula flexible para nivelar y aplicar masilla' });
      }
    }

    // Cuñetes de 5 galones -> Abrecuñetes ergonómico
    if (hasCunete) {
      const destapador = CART_COMPLEMENTARY_TOOLS.find(t => t.id === 'tool-destapador');
      if (destapador && !existingSkusOrIds.has(destapador.id) && !existingSkusOrIds.has(destapador.sku.toLowerCase())) {
        recs.push({ ...destapador, motivo: 'Apertura limpia y segura de cuñetes de 5 Galones sin deformar la tapa' });
      }
    }

    // Si aún no hay complementos sugeridos, ofrecer los complementos principales que falten
    if (recs.length === 0) {
      for (const tool of CART_COMPLEMENTARY_TOOLS) {
        if (!existingSkusOrIds.has(tool.id) && !existingSkusOrIds.has(tool.sku.toLowerCase())) {
          recs.push(tool);
          if (recs.length >= 2) break;
        }
      }
    }

    return recs;
  };

  const handleAddUpsellToOrder = (tool: CartComplementaryTool) => {
    if (!pendingOrder || addedUpsellIds.includes(tool.id)) return;

    const newItem: CartItem = {
      id: tool.id,
      nombre: tool.nombre,
      sku: tool.sku,
      presentacion: tool.presentacion,
      cantidad: 1,
      precioUnitario: tool.precio,
      imagenUrl: tool.imagenUrl,
      marca: 'Pintuco',
      subtotal: tool.precio,
    };

    const updatedItems = [...pendingOrder.items, newItem];
    const newTotal = pendingOrder.total + tool.precio;

    const updatedOrder: COLORLINKOrder = {
      ...pendingOrder,
      items: updatedItems,
      total: newTotal,
      calculo: {
        ...pendingOrder.calculo,
        costo_total_estimado: newTotal,
      }
    };

    setPendingOrder(updatedOrder);
    setAddedUpsellIds(prev => [...prev, tool.id]);
  };

  const finalizeAndRedirect = (orderToSave: COLORLINKOrder) => {
    // Persistencia inmediata de dirección y sincronización con perfil
    if (modalidad === 'domicilio' && checkoutDireccion.trim()) {
      persistShippingAddress(checkoutDireccion.trim(), selectedCiudad, checkoutEmail.trim(), checkoutDocumento.trim());
    }

    // Save directly in localStorage
    try {
      const saved = localStorage.getItem('colorlink_orders');
      const existing = saved ? JSON.parse(saved) : [];
      localStorage.setItem('colorlink_orders', JSON.stringify([orderToSave, ...existing]));
      localStorage.setItem('colorlink_last_order', JSON.stringify(orderToSave));
      const userOrders = localStorage.getItem('colorlink_user_orders');
      const existingUser = userOrders ? JSON.parse(userOrders) : [];
      localStorage.setItem('colorlink_user_orders', JSON.stringify([orderToSave, ...existingUser]));
    } catch (err) {
      console.error(err);
    }

    // Guardar en tabla 'orders' de Supabase
    saveOrderToSupabase(orderToSave);

    // Descuento automático de inventario y trazabilidad en Kardex
    try {
      descontarInventarioPorPedido(orderToSave, orderToSave.customerName || 'Cliente Tienda Online');
    } catch (err) {
      console.error('Error al descontar inventario en checkout:', err);
    }

    if (onConfirmOrder) {
      onConfirmOrder(orderToSave);
    } else {
      onCheckout();
    }

    onClearCart();
    setIsCheckoutStep(false);
    setCheckoutFlowStage('form');
    setPendingOrder(null);
    setAddedUpsellIds([]);
    onClose();

    // Redirigir automáticamente al módulo de Seguimiento de Compra / Trazabilidad
    if (onOpenTracking) {
      onOpenTracking();
    }
    window.dispatchEvent(new CustomEvent('colorlink_open_tracking', {
      detail: { orderId: orderToSave.id, orderNumber: orderToSave.numeroOrden }
    }));
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    const isUserAuth = Boolean(userSession && userSession.isLoggedIn);
    if (!isUserAuth) {
      setCheckoutError('Debes iniciar sesión con tu cuenta oficial Pintuco antes de continuar al pago para emitir tu factura legal y validar tu despacho.');
      if (onOpenAuth) {
        onOpenAuth();
      } else {
        window.dispatchEvent(new CustomEvent('colorlink_open_auth', {
          detail: { mode: 'login', reason: 'Inicia sesión para autocompletar tus datos y continuar al pago de tu pedido.' }
        }));
      }
      return;
    }

    if (!checkoutNombre.trim()) {
      setCheckoutError('Por favor ingresa tu Nombre Completo o Razón Social.');
      return;
    }
    if (!checkoutDocumento.trim()) {
      setCheckoutError('El Número de Cédula / NIT es OBLIGATORIO para facturación y trazabilidad.');
      return;
    }
    if (!checkoutTelefono.trim()) {
      setCheckoutError('Por favor ingresa un número de teléfono celular de contacto.');
      return;
    }
    if (modalidad === 'domicilio' && !checkoutDireccion.trim()) {
      setCheckoutError('Por favor ingresa la dirección de entrega de tu obra o domicilio.');
      return;
    }

    if (metodoPago === 'tarjeta') {
      const cleanCardNum = cardNumero.replace(/\s/g, '');
      if (!cleanCardNum) {
        setCheckoutError('Por favor ingresa el Número de tu Tarjeta Débito o Crédito.');
        return;
      }
      if (cleanCardNum.length < 15) {
        setCheckoutError('El número de tarjeta debe contener al menos 15 dígitos.');
        return;
      }
      if (!cardNombre.trim()) {
        setCheckoutError('Por favor ingresa el Nombre del titular tal como aparece en la tarjeta.');
        return;
      }
      if (!cardExp.trim()) {
        setCheckoutError('Por favor ingresa la fecha de vencimiento (MM/AA).');
        return;
      }
      if (cardExp.length < 5 || !cardExp.includes('/')) {
        setCheckoutError('La fecha de vencimiento debe tener el formato MM/AA (Ej: 12/28).');
        return;
      }
      if (!cardCvv.trim()) {
        setCheckoutError('Por favor ingresa el código de seguridad CVV de tu tarjeta.');
        return;
      }
      if (cardCvv.length < 3) {
        setCheckoutError('El código CVV debe tener al menos 3 dígitos.');
        return;
      }
    }

    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalDireccion = modalidad === 'retiro_tienda' 
      ? `Retiro en Tienda: ${matchingStore?.nombre || selectedSede} - ${matchingStore?.direccion || 'Sede oficial autorizada'}` 
      : checkoutDireccion.trim();

    const newOrder: COLORLINKOrder = {
      id: `ord-${Date.now()}`,
      numeroOrden: orderNumber,
      fechaCreacion: new Date().toISOString(),
      customerDocument: checkoutDocumento.trim(),
      customerName: checkoutNombre.trim(),
      customerEmail: checkoutEmail.trim(),
      customerPhone: checkoutTelefono.trim(),
      direccionEntrega: finalDireccion,
      ciudadEntrega: selectedCiudad,
      departamentoEntrega: selectedDepto,
      items: [...cart],
      total: totalCOP,
      estado: 'Pendiente Alistamiento',
      responsableAlistamiento: modalidad === 'retiro_tienda' ? `Mostrador ${selectedSede}` : 'Bodega Central Pintuco',
      observacionesBodega: checkoutNotas.trim() ? `Nota cliente: ${checkoutNotas.trim()}` : undefined,
      form: {
        tipo_documento: checkoutTipoDoc,
        documento: checkoutDocumento.trim(),
        nombre_razon_social: checkoutNombre.trim(),
        responsable_contacto: checkoutNombre.trim(),
        canal_entrada: 'Portal Web B2B',
        ciudad: selectedCiudad,
        departamento: selectedDepto,
        tipo_obra: modalidad === 'retiro_tienda' ? 'Retiro en Tienda Oficial' : 'Despacho Directo E-Commerce',
        area_m2: totalGalonesEquivalentes * 30,
        fecha_requerida: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        superficie: 'Multisuperficie Pintuco',
        ambiente: 'General',
        condicion: 'Nueva',
        color_acabado: 'Catálogo Oficial Pintuco',
        costo_flete: envioCOP,
        modalidad_entrega: modalidad,
        sede_retiro: modalidad === 'retiro_tienda' ? selectedSede : undefined,
      },
      calculo: {
        rendimientoBase: 30,
        factorCorreccion: 1,
        esSuperficieRugosa: false,
        requiereSellador: false,
        rendimientoSellador: 40,
        metodoAplicacion: 'Rodillo Convencional',
        margenDesperdicioPct: 5,
        factorDesperdicio: 1.05,
        consumoPinturaNeto: totalGalonesEquivalentes,
        galonesPintura: totalGalonesEquivalentes,
        galonesSellador: 0,
        productoSugerido: cart[0]?.nombre || 'Pintura Pintuco Especializada',
        productoSelladorSugerido: '',
        lineaProducto: 'Pintuco',
        tratamientoPrevio: 'Limpieza estándar',
        prioridad: 'Alta',
        diasRestantes: modalidad === 'retiro_tienda' ? 0 : 3,
        alertaDespacho: modalidad === 'retiro_tienda' ? 'Disponible para retiro en 2 a 4 horas' : 'Alistamiento inmediato en bodega',
        markdownOutput: '',
        cuñetesPintura: Math.floor(totalGalonesEquivalentes / 5),
        galonesSueltosPintura: totalGalonesEquivalentes % 5,
        cuñetesSellador: 0,
        galonesSueltosSellador: 0,
        skuPinturaSugerido: cart[0]?.sku || 'SKU-PTC',
        skuSelladorSugerido: '',
        costo_total_estimado: totalCOP,
        costo_flete: envioCOP,
        es_flete_gratis: esEnvioGratis,
        tiempo_entrega_estimado: shipping.tiempoEstimado,
        modalidad_entrega: modalidad,
        hub_despacho: shipping.hubDespacho,
      },
    };

    setPendingOrder(newOrder);
    setCheckoutFlowStage('processing');

    // Flujo de pago seguro de 2 segundos (2000 ms) antes de redirigir directamente al seguimiento
    setTimeout(() => {
      finalizeAndRedirect(newOrder);
    }, 2000);
  };

  const drawerContent = (
    <div 
      className="cart-drawer-overlay fixed inset-0 z-[9999] flex justify-end bg-black/50 backdrop-blur-sm animate-fadeIn"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
      }}
      onClick={onClose}
      data-cart-drawer="true"
    >
      <div 
        className="cart-drawer-panel w-full max-w-md sm:max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-200"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          height: '100vh',
          zIndex: 9999,
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            {isCheckoutStep && checkoutFlowStage === 'form' ? (
              <button
                type="button"
                onClick={() => setIsCheckoutStep(false)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Volver al Carrito"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : isCheckoutStep && checkoutFlowStage === 'processing' ? (
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md animate-pulse">
                <Lock className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {checkoutFlowStage === 'processing'
                    ? 'Procesando Pago Seguro'
                    : isCheckoutStep
                    ? 'Finalización de Compra (Checkout)'
                    : 'Carrito de Compras'}
                </h3>
                {checkoutFlowStage === 'form' && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                    {totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {checkoutFlowStage === 'processing'
                  ? 'Autorizando transacción bancaria encriptada...'
                  : isCheckoutStep
                  ? 'Ingresa tus datos de facturación y despacho'
                  : 'Despacho oficial Pintuco / Color In'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            title="Cerrar Carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator (Only in Cart step) */}
        {!isCheckoutStep && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-600" />
              {subtotalCOP >= 350000 ? (
                <span className="font-bold text-emerald-700">¡Tienes Envío Express a Obra GRATIS!</span>
              ) : (
                <span>
                  Agrega <strong>${(350000 - subtotalCOP).toLocaleString('es-CO')} COP</strong> más para despacho gratis
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] font-bold text-amber-700">
              {Math.min(100, Math.round((subtotalCOP / 350000) * 100))}%
            </span>
          </div>
        )}

        {isCheckoutStep ? (
          /* =========================================================================
              PASO 2: EXPERIENCIA CHECKOUT (FORMULARIO, PAGO 2S Y UPSELL INTELIGENTE)
          ========================================================================= */
          checkoutFlowStage === 'processing' ? (
            /* 5.a) Pantalla de Procesando pago seguro (flujo ficticio de 2 segundos) */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 animate-fadeIn">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-slate-200 border-t-red-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-[#0033A0] animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-black text-slate-900">Procesando pago seguro...</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Conectando con la pasarela financiera oficial y validando autorización bancaria encriptada con estándar PCI-DSS.
                </p>
              </div>

              <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#004B93] h-2 rounded-full animate-[pulse_1s_ease-in-out_infinite] w-4/5"></div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left w-full max-w-xs space-y-1">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Monto autorizado:</span>
                  <strong className="text-slate-900">${totalCOP.toLocaleString('es-CO')} COP</strong>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Método:</span>
                  <span className="font-semibold text-slate-800">
                    {metodoPago === 'tarjeta' ? 'Tarjeta Débito/Crédito' : metodoPago === 'pse' ? 'PSE / Bancolombia' : 'Contra Entrega'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Cifrado SSL 256 bits
                </span>
                <span>•</span>
                <span>Redeban / PSE</span>
                <span>•</span>
                <span>Pintuco Pay</span>
              </div>
            </div>
          ) : (
            /* Formulario normal de checkout */
            <form onSubmit={handleConfirmCheckout} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {checkoutError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* 3. Discriminación Transparente del Resumen de Pago */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-black uppercase text-slate-800 tracking-wider">
                  <span>Resumen de tu pedido:</span>
                  <span className="text-[11px] font-semibold text-slate-500">{totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}</span>
                </div>

                {/* Lista compacta de items */}
                <div className="max-h-28 overflow-y-auto pr-1 space-y-1.5 text-[11px] text-slate-600">
                  {activeCartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="truncate max-w-[210px] font-medium">
                        {item.cantidad}x {item.nombre} <span className="text-slate-400">({item.presentacion})</span>
                      </span>
                      <span className="font-semibold text-slate-800">${(item.cantidad * item.precioUnitario).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>

                {/* Desglose formal y transparente */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal de Productos:</span>
                    <span className="font-bold text-slate-900">${subtotalCOP.toLocaleString('es-CO')} COP</span>
                  </div>
                  
                  <div className="flex justify-between text-[11px] text-slate-500 pl-2.5 border-l-2 border-slate-300">
                    <span>• Base Gravable:</span>
                    <span className="font-mono text-slate-700">${baseGravable.toLocaleString('es-CO')} COP</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pl-2.5 border-l-2 border-slate-300">
                    <span>• IVA (19% incluido):</span>
                    <span className="font-mono text-emerald-700 font-semibold">${iva19.toLocaleString('es-CO')} COP</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-700 pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Costo de Envío / Flete:</span>
                    </span>
                    {esEnvioGratis ? (
                      <span className="font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300 text-[11px]">
                        $0 COP (Envío GRATIS)
                      </span>
                    ) : (
                      <span className="font-bold text-slate-900">
                        ${envioCOP.toLocaleString('es-CO')} COP
                      </span>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-black text-slate-900 block">Total Neto a Pagar:</span>
                      <span className="text-[10px] text-slate-400 font-normal">Factura legal Pintuco S.A.</span>
                    </div>
                    <span className="text-xl font-black text-red-600 tracking-tight">
                      ${totalCOP.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                </div>
              </div>

              {/* VERIFICACIÓN DE SESIÓN Y AUTOCOMPLETADO */}
              {userSession && userSession.isLoggedIn ? (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-emerald-950">Sesión Activa Verificada</span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                          {userSession.userType || 'Cliente'} Oficial
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        {userSession.nombre} • {checkoutTipoDoc}: {checkoutDocumento || 'Registrado'} • Datos autocompletados
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2.5 shadow-xs animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-black text-xs uppercase tracking-wide text-amber-950">
                        Inicia sesión antes de pagar
                      </h5>
                      <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                        Para emitir tu factura legal oficial y evitar que el formulario quede vacío, inicia sesión. Tu Nombre, Cédula/NIT, Teléfono y Correo se autocompletarán de inmediato.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAuth) {
                        onOpenAuth();
                      } else {
                        window.dispatchEvent(new CustomEvent('colorlink_open_auth', {
                          detail: { mode: 'login', reason: 'Inicia sesión para autocompletar tus datos y continuar al pago.' }
                        }));
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>Iniciar Sesión / Registrarse para Autocompletar</span>
                  </button>
                </div>
              )}

              {/* 1. Datos del Cliente / Identificación (CÉDULA / NIT OBLIGATORIO) */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0033A0]" />
                  <span>1. Datos del Cliente / Identificación</span>
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nombre Completo / Razón Social <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Constructora San Jerónimo o Juan Pérez"
                    value={checkoutNombre}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCheckoutNombre(val);
                      try {
                        localStorage.setItem('colorlink_customer_name', val);
                      } catch {}
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Tipo Doc.
                    </label>
                    <select
                      value={checkoutTipoDoc}
                      onChange={(e) => {
                        const val = normalizeTipoDocumento(e.target.value);
                        setCheckoutTipoDoc(val);
                        try {
                          localStorage.setItem('colorlink_customer_tipodoc', val);
                        } catch {}
                      }}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white cursor-pointer"
                    >
                      <option value="Cédula de Ciudadanía">Cédula de Ciudadanía (CC)</option>
                      <option value="CC">Cédula (CC)</option>
                      <option value="NIT">NIT (Empresa)</option>
                      <option value="Cédula de Extranjería">Cédula de Extranjería (CE)</option>
                      <option value="CE">C.E. Extranjería</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="RUT">RUT</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                      <span>Número de Cédula / NIT <span className="text-red-600 font-black">*</span></span>
                      <span className="text-[9px] text-red-600 font-bold bg-red-50 px-1 rounded">Obligatorio</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Ej: 1.020.304.506 o 900.845.120-4"
                        value={checkoutDocumento}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCheckoutDocumento(val);
                          try {
                            localStorage.setItem('colorlink_customer_doc', val);
                          } catch {}
                        }}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border-2 border-red-300 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      />
                      <FileText className="w-4 h-4 text-red-500 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Teléfono Celular <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="Ej: 310 123 4567"
                        value={checkoutTelefono}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCheckoutTelefono(val);
                          try {
                            localStorage.setItem('colorlink_customer_phone', val);
                          } catch {}
                        }}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      />
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="tu-correo@ejemplo.com"
                        value={checkoutEmail}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCheckoutEmail(val);
                          try {
                            localStorage.setItem('colorlink_customer_email', val);
                          } catch {}
                        }}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      />
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DESTINO Y MODALIDAD DE ENTREGA en Checkout */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>DESTINO Y MODALIDAD DE ENTREGA</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#004B93] border border-blue-200">
                    Sincronizado con Cotizador
                  </span>
                </div>

                {/* Selector de Modalidad */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setModalidad('domicilio');
                      try {
                        const saved = localStorage.getItem('colorlink_quote_delivery');
                        const parsed = saved ? JSON.parse(saved) : {};
                        localStorage.setItem('colorlink_quote_delivery', JSON.stringify({ ...parsed, modalidad: 'domicilio' }));
                      } catch {}
                      if (!checkoutDireccion || checkoutDireccion.startsWith('Retiro en Tienda')) {
                        const defaultAddr = userSession?.direcciones?.find(d => d.esPredeterminada) || userSession?.direcciones?.[0];
                        const savedHome = defaultAddr?.direccion ||
                          userSession?.direccion ||
                          userSession?.address ||
                          formData?.direccion_obra ||
                          localStorage.getItem('colorlink_user_address') ||
                          '';
                        if (savedHome) {
                          handleAddressChange(savedHome);
                        }
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      modalidad === 'domicilio'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Envío a Domicilio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalidad('retiro_tienda');
                      try {
                        const saved = localStorage.getItem('colorlink_quote_delivery');
                        const parsed = saved ? JSON.parse(saved) : {};
                        localStorage.setItem('colorlink_quote_delivery', JSON.stringify({ ...parsed, modalidad: 'retiro_tienda' }));
                      } catch {}
                      const pickupText = `Retiro en Tienda: ${matchingStore?.nombre || selectedSede} - ${matchingStore?.direccion || 'Sede oficial autorizada'}`;
                      handleAddressChange(pickupText);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      modalidad === 'retiro_tienda'
                        ? 'bg-white text-[#004B93] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Warehouse className="w-3.5 h-3.5 text-[#004B93]" />
                    <span>Retiro en Tienda ($0)</span>
                  </button>
                </div>

                {/* Selectores de Departamento y Ciudad sincronizados */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-600 font-bold block mb-1 uppercase">
                      Departamento Destino:
                    </label>
                    <select
                      value={selectedDepto}
                      onChange={(e) => {
                        const newDepto = e.target.value;
                        handleDeptoChange(newDepto);
                        try {
                          const saved = localStorage.getItem('colorlink_quote_delivery');
                          const parsed = saved ? JSON.parse(saved) : {};
                          localStorage.setItem('colorlink_quote_delivery', JSON.stringify({ ...parsed, departamento: newDepto }));
                        } catch {}
                      }}
                      className="w-full text-xs rounded-xl border border-slate-300 px-2.5 py-2 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DEPARTAMENTOS_COLOMBIA.map((d) => (
                        <option key={d.codigoDANE} value={d.nombre}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-600 font-bold block mb-1 uppercase">
                      Ciudad / Municipio:
                    </label>
                    <select
                      value={selectedCiudad}
                      onChange={(e) => {
                        const newCity = e.target.value;
                        setSelectedCiudad(newCity);
                        try {
                          const saved = localStorage.getItem('colorlink_quote_delivery');
                          const parsed = saved ? JSON.parse(saved) : {};
                          localStorage.setItem('colorlink_quote_delivery', JSON.stringify({ ...parsed, ciudad: newCity }));
                        } catch {}
                      }}
                      className="w-full text-xs rounded-xl border border-slate-300 px-2.5 py-2 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {currentDeptoObj.municipios.map((m) => (
                        <option key={m.nombre} value={m.nombre}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {modalidad === 'domicilio' ? (
                  <div className="space-y-2">
                    {userSession?.direcciones && userSession.direcciones.length > 0 && (
                      <div className="space-y-1">
                        <span className="block text-[10px] font-bold text-slate-600 uppercase">
                          Mis Direcciones Guardadas:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {userSession.direcciones.map((savedAddr) => {
                            const formatted = savedAddr.barrio
                              ? `${savedAddr.direccion}, Barrio ${savedAddr.barrio}`
                              : savedAddr.direccion;
                            const isSelected = checkoutDireccion.trim() === formatted.trim();
                            return (
                              <button
                                key={savedAddr.id}
                                type="button"
                                onClick={() => {
                                  handleAddressChange(formatted);
                                  if (savedAddr.departamento) setSelectedDepto(savedAddr.departamento);
                                  if (savedAddr.ciudad) setSelectedCiudad(savedAddr.ciudad);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-900 text-white border-blue-900'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {savedAddr.etiqueta}{savedAddr.esPredeterminada ? ' ★' : ''}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Dirección de Residencia / Obra <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Carrera 15 # 93-60, Edificio Torre A, Apto 402"
                        value={checkoutDireccion}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                      />
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>Destino confirmado: <strong>{selectedCiudad}, {selectedDepto}</strong></span>
                        <span className="text-emerald-700 font-bold">{shipping.tiempoEstimado}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-blue-50/80 border-2 border-blue-300 rounded-2xl text-xs text-blue-950 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold flex items-center gap-1.5 text-blue-900">
                        <Warehouse className="w-4 h-4 text-blue-600" />
                        <span>Sede Pintuco Oficial para Retiro:</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Flete $0 COP
                      </span>
                    </div>

                    {/* Dirección autocompletada para Retiro en Tienda */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-blue-900 uppercase">
                        Dirección de Retiro en Tienda:
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`Retiro en Tienda: ${matchingStore?.nombre || selectedSede} - ${matchingStore?.direccion || 'Sede oficial autorizada'}`}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-blue-300 bg-white font-bold text-blue-950 shadow-2xs cursor-default"
                      />
                    </div>

                    {/* Dropdown de Sedes disponibles */}
                    <div>
                      <label className="block text-[10px] font-bold text-blue-900 uppercase mb-1">
                        Cambiar Sede o CEDI ({selectedCiudad}):
                      </label>
                      <select
                        value={selectedSede}
                        onChange={(e) => {
                          const newSede = e.target.value;
                          setSelectedSede(newSede);
                          const store = availableStores.find(s => s.nombre === newSede);
                          if (store) {
                            handleAddressChange(`Retiro en Tienda: ${store.nombre} - ${store.direccion}`);
                          }
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-blue-300 font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {availableStores.map((store) => (
                          <option key={store.id} value={store.nombre}>
                            {store.nombre} — {store.direccion}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Tarjeta de Detalle de la Sede Seleccionada */}
                    <div className="bg-white p-3 rounded-xl border border-blue-200 space-y-1">
                      <p className="font-black text-xs text-slate-900">{selectedSede}</p>
                      <p className="text-[11px] text-slate-600 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{matchingStore?.direccion || `Ciudad: ${selectedCiudad}, ${selectedDepto}`}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-start gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{matchingStore?.horario || 'Lunes a Sábado - Horario hábil'}</span>
                      </p>
                    </div>

                    <p className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Flete $0 COP. Tu pedido estará listo para retiro en 2 a 4 horas hábiles.</span>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Indicaciones adicionales para el transportista o bodega (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder='Ej: "Dejar en portería", "Muelle de descarga torre 2"'
                    value={checkoutNotas}
                    onChange={(e) => setCheckoutNotas(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  />
                </div>
              </div>

              {/* 4. Actualización de Métodos de Pago: Tarjeta Débito/Crédito */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>3. Método de Pago</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('tarjeta')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                      metodoPago === 'tarjeta'
                        ? 'bg-red-50 border-red-500 text-red-900 font-bold shadow-xs ring-1 ring-red-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Agregar Tarjeta</span>
                    <span className="text-[10px] text-slate-500 font-normal">Débito / Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('pse')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                      metodoPago === 'pse'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">PSE / Transferencia</span>
                    <span className="text-[10px] text-slate-500 font-normal">Bancolombia, Nequi, etc.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoPago('contraentrega')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                      metodoPago === 'contraentrega'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Contra Entrega</span>
                    <span className="text-[10px] text-slate-500 font-normal">Datáfono / Efectivo</span>
                  </button>
                </div>

                {/* Mockup interactivo de Tarjeta Débito / Crédito */}
                {metodoPago === 'tarjeta' && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase">Datos de la Tarjeta</span>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black">VISA</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-black">MC</span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-black">AMEX</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Número de Tarjeta <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={19}
                          placeholder="Ej: 4532 8901 2345 6789"
                          value={cardNumero}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
                            const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                            setCardNumero(formatted);
                          }}
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        />
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Nombre en la Tarjeta <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: JUAN PÉREZ"
                          value={cardNombre}
                          onChange={(e) => setCardNombre(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Vence (MM/AA) <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={5}
                            placeholder="MM/AA"
                            value={cardExp}
                            onChange={(e) => {
                              let val = e.target.value.replace(/[^\d/]/g, '');
                              if (val.length === 2 && !val.includes('/')) val += '/';
                              setCardExp(val.slice(0, 5));
                            }}
                            className="w-full px-2.5 py-2 text-xs text-center rounded-xl border border-slate-300 font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            CVV <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full px-2.5 py-2 text-xs text-center rounded-xl border border-slate-300 font-mono font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                        Número de Cuotas
                      </label>
                      <select
                        value={cardCuotas}
                        onChange={(e) => setCardCuotas(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white cursor-pointer"
                      >
                        <option value="1">1 cuota (Sin intereses - Débito / Crédito)</option>
                        <option value="2">2 cuotas</option>
                        <option value="3">3 cuotas</option>
                        <option value="6">6 cuotas</option>
                        <option value="12">12 cuotas</option>
                        <option value="24">24 cuotas</option>
                      </select>
                    </div>
                  </div>
                )}

                {metodoPago === 'pse' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                    <p className="font-bold">Pago Seguro por PSE (Redeban / ACH Colombia)</p>
                    <p className="text-[11px] text-blue-700">
                      Serás redirigido a la pasarela bancaria oficial para autorizar el débito desde tu cuenta de ahorros o corriente (Bancolombia, Davivienda, Nequi, etc.).
                    </p>
                  </div>
                )}

                {metodoPago === 'contraentrega' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                    <p className="font-bold">Pago Contra Entrega en Obra</p>
                    <p className="text-[11px] text-emerald-700">
                      Pagas al recibir los productos directamente con datáfono inalámbrico o efectivo verificado por el transportista oficial Pintuco.
                    </p>
                  </div>
                )}
              </div>

              {/* Botón de Confirmación y Radicación */}
              <div className="pt-3 border-t border-slate-200 space-y-2 shrink-0">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-extrabold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#FFD100]" />
                  <span>Confirmar y Radicar Pedido (${totalCOP.toLocaleString('es-CO')} COP)</span>
                </button>
                <p className="text-[10px] text-slate-500 text-center">
                  Al confirmar, se procesará el pago seguro y se asociará a tu Cédula/NIT para consulta inmediata en <strong>Trazabilidad</strong>.
                </p>
              </div>
            </form>
          )
        ) : (
          /* =========================================================================
              PASO 1: LISTA DEL CARRITO DE COMPRAS
          ========================================================================= */
          <>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeCartItems.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">Tu carrito está vacío</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Agrega pinturas o cuñetes desde el Catálogo de Productos o desde el Cotizador Inteligente.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCatalog();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-transform hover:scale-105 cursor-pointer active:scale-95"
              >
                <span>Explorar Catálogo Pintuco</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {activeCartItems.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-all flex gap-3 sm:gap-4 items-center"
              >
                {/* Product Thumbnail */}
                {item.imagenUrl ? (
                  <img
                    src={item.imagenUrl}
                    alt={item.nombre}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const currentSrc = target.getAttribute('src') || '';
                      if (currentSrc.includes('/src/assets/images/')) {
                        target.src = currentSrc.replace('/src/assets/images/', '/images/');
                      } else if (currentSrc.includes('/images/')) {
                        target.src = currentSrc.replace('/images/', '/src/assets/images/');
                      }
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                    <PackageCheck className="w-6 h-6 text-slate-400" />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-red-600 tracking-wider">
                        {item.marca || 'Pintuco'} • SKU: {item.sku}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.nombre}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      {item.presentacion}
                    </span>
                    {item.colorSeleccionado && (
                      <span className="text-[11px] text-slate-700 font-medium">
                        Color: {item.colorSeleccionado}
                      </span>
                    )}
                    {item.esPersonalizado ? (
                      <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        🎨 Colorlink
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ⚡ Stock Inmediato
                      </span>
                    )}
                  </div>

                  {item.tiempoEstimadoEntrega && (
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{item.tiempoEstimadoEntrega}</span>
                    </div>
                  )}

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Disminuir cantidad"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          onUpdateQuantity(item.id, isNaN(val) ? 1 : Math.max(1, val));
                        }}
                        className="w-12 text-center text-xs font-bold text-slate-900 bg-white border-x border-slate-200 py-1 focus:outline-none focus:ring-1 focus:ring-red-500"
                        title="Editar cantidad directamente"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Aumentar cantidad"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <span className="text-xs sm:text-sm font-black text-slate-900">
                        ${(item.cantidad * item.precioUnitario).toLocaleString('es-CO')} COP
                      </span>
                      <p className="text-[10px] text-slate-400">
                        ${item.precioUnitario.toLocaleString('es-CO')} / {item.presentacion}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* SECCIÓN: COMPLEMENTA TU PROYECTO (RECOMENDACIONES DE COMPLEMENTOS) */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-slate-50 border border-amber-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h5 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    Complementa tu proyecto
                  </h5>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Accesorios Recomendados
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                Herramientas compatibles con tus pinturas para que tu acabado quede impecable:
              </p>

              <div className="space-y-2.5">
                {CART_COMPLEMENTARY_TOOLS.map((tool) => {
                  if (dismissedTools[tool.id]) return null;
                  const inCartItem = cart.find(c => c.id === tool.id || c.sku === tool.sku);
                  const isAdded = Boolean(inCartItem && inCartItem.cantidad > 0);

                  return (
                    <div
                      key={tool.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isAdded
                          ? 'bg-amber-50/80 border-amber-300'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={tool.imagenUrl}
                          alt={tool.nombre}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const currentSrc = target.getAttribute('src') || '';
                            if (currentSrc.includes('/src/assets/images/')) {
                              target.src = currentSrc.replace('/src/assets/images/', '/images/');
                            } else if (currentSrc.includes('/images/')) {
                              target.src = currentSrc.replace('/images/', '/src/assets/images/');
                            }
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-bold uppercase text-amber-800 tracking-wider">
                              {tool.categoria}
                            </span>
                            {isAdded && (
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                                En tu pedido ✓
                              </span>
                            )}
                          </div>
                          <h6 className="text-xs font-bold text-slate-900 truncate">
                            {tool.nombre}
                          </h6>
                          <p className="text-[10px] text-slate-500 line-clamp-1">
                            {tool.motivo}
                          </p>
                          <span className="text-xs font-mono font-bold text-slate-900 mt-0.5 block">
                            ${tool.precio.toLocaleString('es-CO')} COP
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {isAdded && inCartItem ? (
                          <div className="flex items-center border border-amber-300 rounded-lg overflow-hidden bg-white">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(inCartItem.id, inCartItem.cantidad - 1)}
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                              title="Disminuir"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-mono font-bold text-slate-900">
                              {inCartItem.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(inCartItem.id, inCartItem.cantidad + 1)}
                              className="px-2 py-1 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                              title="Aumentar"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddComplementaryTool(tool)}
                            className="px-3 py-1.5 rounded-lg bg-[#FFD100] hover:bg-[#F5C800] text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDismissedTools(prev => ({ ...prev, [tool.id]: true }))}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="No me interesa"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </>
          )}
        </div>

        {/* Footer Summary with Logistics and Cascade Selector */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 space-y-3.5 overflow-y-auto max-h-[50vh]">
            
            {/* LÓGICA DE ENTREGA Y DESPACHO: TARJETA DE CONFIRMACIÓN O SELECTORES */}
            {isQuoteDeliveryActive && !isModifyingDelivery ? (
              /* TARJETA DE CONFIRMACIÓN VISUAL DE DESPACHO PREDEFINIDO SEGÚN COTIZACIÓN */
              <div className="p-3.5 rounded-2xl bg-white border border-emerald-300 shadow-xs space-y-2.5 animate-fadeIn">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-emerald-800 block">
                        ✓ Datos de despacho predefinidos según tu cotización
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Cargados automáticamente sin necesidad de reingresarlos
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsModifyingDelivery(true)}
                    className="text-[11px] font-bold text-[#004B93] hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer shrink-0 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Modificar ubicación / entrega</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2.5">
                  {modalidad === 'retiro_tienda' ? (
                    <Warehouse className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  ) : (
                    <Truck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-900">
                        {modalidad === 'retiro_tienda' ? 'Retiro en Sede Oficial Pintuco' : 'Envío a Domicilio / Obra'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        modalidad === 'retiro_tienda'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}>
                        {modalidad === 'retiro_tienda' ? 'Flete Gratis ($0)' : shipping.esFleteGratis ? 'Flete Gratis' : `$${shipping.costoFlete.toLocaleString('es-CO')} COP`}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                      {modalidad === 'retiro_tienda' ? (
                        <span><strong>Sede Seleccionada:</strong> {selectedSede} ({selectedCiudad}, {selectedDepto})</span>
                      ) : (
                        <span>
                          <strong>Destino:</strong> {selectedCiudad}, {selectedDepto}
                          {checkoutDireccion ? ` • ${checkoutDireccion}` : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* SELECTORES DE DESPACHO (SI NO SE HAN PREDEFINIDO O SI EL CLIENTE ELIGE MODIFICAR) */
              <div className="space-y-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block">
                    Modalidad y Ubicación de Entrega:
                  </span>
                  {isQuoteDeliveryActive && (
                    <button
                      type="button"
                      onClick={() => setIsModifyingDelivery(false)}
                      className="text-[10px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalidad('domicilio');
                      try {
                        const saved = localStorage.getItem('colorlink_quote_delivery');
                        const parsed = saved ? JSON.parse(saved) : {};
                        localStorage.setItem('colorlink_quote_delivery', JSON.stringify({ ...parsed, modalidad: 'domicilio' }));
                      } catch {}
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      modalidad === 'domicilio'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Envío a Obra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalidad('retiro_tienda');
                      try {
                        const saved = localStorage.getItem('colorlink_quote_delivery');
                        const parsed = saved ? JSON.parse(saved) : {};
                        localStorage.setItem('colorlink_quote_delivery', JSON.stringify({ ...parsed, modalidad: 'retiro_tienda' }));
                      } catch {}
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      modalidad === 'retiro_tienda'
                        ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Warehouse className="w-3.5 h-3.5" />
                    <span>Retiro Sede ($0)</span>
                  </button>
                </div>

                {/* Selector en Cascada Departamento -> Municipio */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">
                      Departamento:
                    </label>
                    <select
                      value={selectedDepto}
                      onChange={(e) => {
                        handleDeptoChange(e.target.value);
                        try {
                          const saved = localStorage.getItem('colorlink_quote_delivery');
                          const parsed = saved ? JSON.parse(saved) : {};
                          localStorage.setItem('colorlink_quote_delivery', JSON.stringify({ ...parsed, departamento: e.target.value }));
                        } catch {}
                      }}
                      className="w-full text-xs rounded-lg border border-slate-300 px-2 py-1.5 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      {DEPARTAMENTOS_COLOMBIA.map((d) => (
                        <option key={d.codigoDANE} value={d.nombre}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">
                      Ciudad / Municipio:
                    </label>
                    <select
                      value={selectedCiudad}
                      onChange={(e) => {
                        const newCity = e.target.value;
                        setSelectedCiudad(newCity);
                        try {
                          const saved = localStorage.getItem('colorlink_quote_delivery');
                          const parsed = saved ? JSON.parse(saved) : {};
                          localStorage.setItem('colorlink_quote_delivery', JSON.stringify({ ...parsed, ciudad: newCity }));
                        } catch {}
                      }}
                      className="w-full text-xs rounded-lg border border-slate-300 px-2 py-1.5 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      {currentDeptoObj.municipios.map((m) => (
                        <option key={m.nombre} value={m.nombre}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sede selector if retiro */}
                {modalidad === 'retiro_tienda' && (
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                    <span className="text-[10px] font-bold text-blue-900 block mb-1">
                      Sede Oficial Pintuco:
                    </span>
                    <select
                      value={selectedSede}
                      onChange={(e) => {
                        const newSede = e.target.value;
                        setSelectedSede(newSede);
                        try {
                          const saved = localStorage.getItem('colorlink_quote_delivery');
                          const parsed = saved ? JSON.parse(saved) : {};
                          localStorage.setItem('colorlink_quote_delivery', JSON.stringify({ ...parsed, sede: newSede }));
                        } catch {}
                      }}
                      className="w-full text-xs rounded-lg border border-blue-300 px-2 py-1.5 bg-white text-slate-800 font-medium"
                    >
                      {PINTUCO_STORE_HUBS.map((hub) => (
                        <option key={hub.id} value={hub.nombre}>
                          {hub.nombre} ({hub.ciudad})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isModifyingDelivery && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModifyingDelivery(false);
                        setIsQuoteDeliveryActive(true);
                        try {
                          const updated = {
                            modalidad,
                            departamento: selectedDepto,
                            ciudad: selectedCiudad,
                            sede: selectedSede,
                            direccion: checkoutDireccion,
                            isDefined: true,
                            timestamp: Date.now()
                          };
                          localStorage.setItem('colorlink_quote_delivery', JSON.stringify(updated));
                        } catch {}
                      }}
                      className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirmar nueva ubicación</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Logistics Badge */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Tiempo: <strong className="text-slate-900">{shipping.tiempoEstimado}</strong></span>
              </div>
              <span className="text-slate-400">•</span>
              <div className="truncate max-w-[140px] text-right">
                <span className="text-slate-500 font-medium">{shipping.hubDespacho}</span>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex justify-between">
                <span>Subtotal productos ({totalItems} uds):</span>
                <span className="font-semibold text-slate-900">${subtotalCOP.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between">
                <span>Flete / Despacho ({shipping.tipoZona}):</span>
                <span className="font-semibold text-slate-900">
                  {shipping.esFleteGratis ? (
                    <strong className="text-emerald-600">¡Flete Gratis!</strong>
                  ) : (
                    `$${shipping.costoFlete.toLocaleString('es-CO')} COP`
                  )}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm sm:text-base font-black text-slate-900">
                <span>Total Estimado:</span>
                <span className="text-red-600">${totalCOP.toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            {/* Alerta clara si no ha iniciado sesión antes de continuar al pago */}
            {(!userSession || !userSession.isLoggedIn) && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-start sm:items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                  <span className="text-[11px] font-semibold text-amber-900 leading-tight">
                    Inicia sesión para capturar tu Cédula/NIT y continuar al pago sin formularios vacíos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAuth) {
                      onOpenAuth();
                    } else {
                      window.dispatchEvent(new CustomEvent('colorlink_open_auth', {
                        detail: { mode: 'login', reason: 'Inicia sesión para autocompletar tus datos y continuar al pago.' }
                      }));
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] shrink-0 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Iniciar Sesión</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClearCart}
                className="px-3 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
              >
                Vaciar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (userSession && userSession.isLoggedIn) {
                    setIsCheckoutStep(true);
                  } else {
                    if (onOpenAuth) {
                      onOpenAuth();
                    } else {
                      window.dispatchEvent(new CustomEvent('colorlink_open_auth', {
                        detail: { mode: 'login', reason: 'Inicia sesión o regístrate para capturar tu información de despacho y facturación y continuar con tu compra.' }
                      }));
                      onCheckout();
                    }
                  }
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer"
              >
                <span>Continuar Proceso de Compra</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Garantía de fábrica Pintuco y norma NTC 1335</span>
            </div>
          </div>
        )}
        </>
      )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(drawerContent, document.body);
};
