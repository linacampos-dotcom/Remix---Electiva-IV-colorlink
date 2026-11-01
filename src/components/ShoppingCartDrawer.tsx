import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CartItem, UserSession, COLORLINKOrder, TipoDocumento } from '../types';
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
  Sliders
} from 'lucide-react';
import { 
  DEPARTAMENTOS_COLOMBIA, 
  PINTUCO_STORE_HUBS, 
  calculateShipping 
} from '../data/colombiaLogistics';
import { persistShippingAddress, saveOrderToSupabase } from '../services/ordersService';
import { descontarInventarioPorPedido } from '../services/corporateService';

interface ShoppingCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onOpenCatalog: () => void;
  userSession?: UserSession | null;
  onUpdateUserSession?: (updatedSession: UserSession) => void;
  onConfirmOrder?: (newOrder: COLORLINKOrder) => void;
}

export const ShoppingCartDrawer: React.FC<ShoppingCartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onOpenCatalog,
  userSession,
  onUpdateUserSession,
  onConfirmOrder,
}) => {
  const [isCheckoutStep, setIsCheckoutStep] = useState(false);
  const [modalidad, setModalidad] = useState<'domicilio' | 'retiro_tienda'>(() => {
    try {
      const saved = localStorage.getItem('colorlink_quote_delivery');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.modalidad) return parsed.modalidad;
      }
    } catch {}
    return 'domicilio';
  });
  const [selectedDepto, setSelectedDepto] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('colorlink_quote_delivery');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.departamento) return parsed.departamento;
      }
    } catch {}
    return 'Bogotá D.C.';
  });
  const [selectedCiudad, setSelectedCiudad] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('colorlink_quote_delivery');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.ciudad) return parsed.ciudad;
      }
    } catch {}
    return 'Bogotá D.C.';
  });
  const [selectedSede, setSelectedSede] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('colorlink_quote_delivery');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sede) return parsed.sede;
      }
    } catch {}
    return PINTUCO_STORE_HUBS[0].nombre;
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

  // Checkout Form State
  const [checkoutNombre, setCheckoutNombre] = useState('');
  const [checkoutTipoDoc, setCheckoutTipoDoc] = useState<TipoDocumento>('Cédula de Ciudadanía');
  const [checkoutDocumento, setCheckoutDocumento] = useState('');
  const [checkoutTelefono, setCheckoutTelefono] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutDireccion, setCheckoutDireccion] = useState<string>(() => {
    try {
      return localStorage.getItem('shippingAddress') || localStorage.getItem('colorlink_shipping_address') || '';
    } catch {
      return '';
    }
  });
  const [checkoutNotas, setCheckoutNotas] = useState('');
  const [metodoPago, setMetodoPago] = useState<'contraentrega' | 'pse' | 'credito'>('contraentrega');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  // Sync userSession values when opening or when userSession changes
  useEffect(() => {
    if (userSession && userSession.isLoggedIn) {
      if (userSession.nombre) setCheckoutNombre(userSession.nombre);
      if (userSession.documento) setCheckoutDocumento(userSession.documento);
      if (userSession.tipoDocumento) setCheckoutTipoDoc(userSession.tipoDocumento);
      if (userSession.telefono) setCheckoutTelefono(userSession.telefono);
      if (userSession.email) setCheckoutEmail(userSession.email);
      
      const defaultAddr = userSession.direcciones?.find(d => d.esPredeterminada) || userSession.direcciones?.[0];
      if (defaultAddr) {
        setCheckoutDireccion(defaultAddr.direccion);
        if (defaultAddr.ciudad) setSelectedCiudad(defaultAddr.ciudad);
        if (defaultAddr.departamento) setSelectedDepto(defaultAddr.departamento);
      } else if (userSession.direccion) {
        setCheckoutDireccion(userSession.direccion);
      } else {
        const localAddr = localStorage.getItem('colorlink_shipping_address');
        if (localAddr) setCheckoutDireccion(localAddr);
      }
      if (userSession.ciudad) {
        setSelectedCiudad(userSession.ciudad);
      }
    } else {
      const localAddr = localStorage.getItem('colorlink_shipping_address');
      if (localAddr) setCheckoutDireccion(localAddr);
    }
  }, [userSession, isOpen]);

  // Sincronizar datos de entrega del Cotizador automáticamente al abrir o recibir evento
  useEffect(() => {
    const syncQuoteDelivery = () => {
      try {
        const saved = localStorage.getItem('colorlink_quote_delivery');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.departamento) setSelectedDepto(parsed.departamento);
          if (parsed.ciudad) setSelectedCiudad(parsed.ciudad);
          if (parsed.modalidad) setModalidad(parsed.modalidad);
          if (parsed.sede) setSelectedSede(parsed.sede);
          if (parsed.direccion) setCheckoutDireccion(parsed.direccion);
          if (parsed.nombre) setCheckoutNombre(parsed.nombre);
          if (parsed.documento) setCheckoutDocumento(parsed.documento);
          if (parsed.telefono) setCheckoutTelefono(parsed.telefono);
          if (parsed.tipoDocumento) setCheckoutTipoDoc(parsed.tipoDocumento);
          if (parsed.isDefined || parsed.departamento || parsed.ciudad) {
            setIsQuoteDeliveryActive(true);
            setIsModifyingDelivery(false);
          }
        }
      } catch {}
    };

    if (isOpen) {
      syncQuoteDelivery();
    }

    const handleCustomUpdate = () => {
      syncQuoteDelivery();
    };

    window.addEventListener('colorlink_quote_delivery_updated', handleCustomUpdate);
    window.addEventListener('storage', syncQuoteDelivery);

    return () => {
      window.removeEventListener('colorlink_quote_delivery_updated', handleCustomUpdate);
      window.removeEventListener('storage', syncQuoteDelivery);
    };
  }, [isOpen]);

  // Reset checkout step when closing
  useEffect(() => {
    if (!isOpen) {
      setIsCheckoutStep(false);
      setCheckoutError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotalCOP = cart.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);

  // Compute equivalent gallons for shipping calculation
  const totalGalonesEquivalentes = cart.reduce((sum, item) => {
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

  const envioCOP = shipping.costoFlete;
  const totalCOP = subtotalCOP + envioCOP;

  const currentDeptoObj = DEPARTAMENTOS_COLOMBIA.find(d => d.nombre === selectedDepto) || DEPARTAMENTOS_COLOMBIA[0];

  const handleDeptoChange = (newDepto: string) => {
    setSelectedDepto(newDepto);
    const found = DEPARTAMENTOS_COLOMBIA.find(d => d.nombre === newDepto);
    if (found && found.municipios.length > 0) {
      setSelectedCiudad(found.municipios[0].nombre);
    }
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

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

    const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: COLORLINKOrder = {
      id: `ord-${Date.now()}`,
      numeroOrden: orderNumber,
      fechaCreacion: new Date().toISOString(),
      customerDocument: checkoutDocumento.trim(),
      customerName: checkoutNombre.trim(),
      customerEmail: checkoutEmail.trim(),
      customerPhone: checkoutTelefono.trim(),
      direccionEntrega: modalidad === 'retiro_tienda' ? `Retiro en Sede Pintuco: ${selectedSede}` : checkoutDireccion.trim(),
      ciudadEntrega: selectedCiudad,
      departamentoEntrega: selectedDepto,
      items: [...cart],
      total: totalCOP,
      estado: 'Pendiente Alistamiento',
      responsableAlistamiento: 'Bodega Central Pintuco',
      observacionesBodega: checkoutNotas.trim() ? `Nota cliente: ${checkoutNotas.trim()}` : undefined,
      form: {
        tipo_documento: checkoutTipoDoc,
        documento: checkoutDocumento.trim(),
        nombre_razon_social: checkoutNombre.trim(),
        responsable_contacto: checkoutNombre.trim(),
        canal_entrada: 'Portal Web B2B',
        ciudad: selectedCiudad,
        departamento: selectedDepto,
        tipo_obra: 'Despacho Directo E-Commerce',
        area_m2: totalGalonesEquivalentes * 30,
        fecha_requerida: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        superficie: 'Multisuperficie Pintuco',
        ambiente: 'General',
        condicion: 'Nueva',
        color_acabado: 'Catálogo Oficial Pintuco',
        costo_flete: envioCOP,
        modalidad_entrega: modalidad,
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
        diasRestantes: 3,
        alertaDespacho: 'Alistamiento inmediato en bodega',
        markdownOutput: '',
        cuñetesPintura: Math.floor(totalGalonesEquivalentes / 5),
        galonesSueltosPintura: totalGalonesEquivalentes % 5,
        cuñetesSellador: 0,
        galonesSueltosSellador: 0,
        skuPinturaSugerido: cart[0]?.sku || 'SKU-PTC',
        skuSelladorSugerido: '',
        costo_total_estimado: totalCOP,
        costo_flete: envioCOP,
        es_flete_gratis: shipping.esFleteGratis,
        tiempo_entrega_estimado: shipping.tiempoEstimado,
        modalidad_entrega: modalidad,
        hub_despacho: shipping.hubDespacho,
      },
    };

    // Persistencia inmediata de dirección y sincronización con perfil
    if (modalidad === 'domicilio' && checkoutDireccion.trim()) {
      persistShippingAddress(checkoutDireccion.trim(), selectedCiudad, checkoutEmail.trim(), checkoutDocumento.trim());
    }

    // Save directly in localStorage
    try {
      const saved = localStorage.getItem('colorlink_orders');
      const existing = saved ? JSON.parse(saved) : [];
      localStorage.setItem('colorlink_orders', JSON.stringify([newOrder, ...existing]));
      localStorage.setItem('colorlink_last_order', JSON.stringify(newOrder));
      const userOrders = localStorage.getItem('colorlink_user_orders');
      const existingUser = userOrders ? JSON.parse(userOrders) : [];
      localStorage.setItem('colorlink_user_orders', JSON.stringify([newOrder, ...existingUser]));
    } catch (err) {
      console.error(err);
    }

    // Guardar en tabla 'orders' de Supabase
    saveOrderToSupabase(newOrder);

    // Descuento automático de inventario y trazabilidad en Kardex
    try {
      descontarInventarioPorPedido(newOrder, newOrder.customerName || 'Cliente Tienda Online');
    } catch (err) {
      console.error('Error al descontar inventario en checkout:', err);
    }

    if (onConfirmOrder) {
      onConfirmOrder(newOrder);
    } else {
      onCheckout();
    }

    onClearCart();
    setIsCheckoutStep(false);
    onClose();
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
            {isCheckoutStep ? (
              <button
                type="button"
                onClick={() => setIsCheckoutStep(false)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Volver al Carrito"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {isCheckoutStep ? 'Finalización de Compra (Checkout)' : 'Carrito de Compras'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                  {totalItems} {totalItems === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isCheckoutStep ? 'Ingresa tus datos de facturación y despacho' : 'Despacho oficial Pintuco / Color In'}
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
              PASO 2: FORMULARIO DE CHECKOUT (FINALIZACIÓN DE COMPRA & DESPACHO)
          ========================================================================= */
          <form onSubmit={handleConfirmCheckout} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {checkoutError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Resumen rápido de productos y total */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Resumen de tu pedido:</span>
                <span className="text-red-600 font-extrabold text-sm">${totalCOP.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="text-[11px] text-slate-500 space-y-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="truncate max-w-[200px]">{item.cantidad}x {item.nombre} ({item.presentacion})</span>
                    <span>${(item.cantidad * item.precioUnitario).toLocaleString('es-CO')}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-slate-200 font-semibold text-slate-700">
                  <span>Flete ({shipping.tipoZona}):</span>
                  <span>{shipping.esFleteGratis ? '¡Gratis!' : `$${shipping.costoFlete.toLocaleString('es-CO')}`}</span>
                </div>
              </div>
            </div>

            {/* Datos de Identificación y Facturación (CÉDULA / NIT OBLIGATORIO) */}
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
                  onChange={(e) => setCheckoutNombre(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>

              {/* CAMPO OBLIGATORIO: NÚMERO DE CÉDULA / NIT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Tipo Doc.
                  </label>
                  <select
                    value={checkoutTipoDoc}
                    onChange={(e) => setCheckoutTipoDoc(e.target.value as TipoDocumento)}
                    className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    <option value="Cédula de Ciudadanía">Cédula (CC)</option>
                    <option value="NIT">NIT (Empresa)</option>
                    <option value="Cédula de Extranjería">C.E.</option>
                    <option value="Pasaporte">Pasaporte</option>
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
                      onChange={(e) => setCheckoutDocumento(e.target.value)}
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
                      onChange={(e) => setCheckoutTelefono(e.target.value)}
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
                      onChange={(e) => setCheckoutEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* Dirección de Entrega a Obra */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>2. Destino y Modalidad de Entrega</span>
              </h4>

              {modalidad === 'domicilio' ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Dirección Completa de Obra / Domicilio <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carrera 15 # 93-60, Edificio Torre A, Apto 402"
                    value={checkoutDireccion}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Destino: <strong>{selectedCiudad}, {selectedDepto}</strong>
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-blue-800">
                    <Warehouse className="w-4 h-4 text-blue-600" />
                    <span>Retiro en Tienda Pintuco:</span>
                  </div>
                  <p className="font-semibold text-xs">{selectedSede} ({selectedCiudad})</p>
                  <p className="text-[11px] text-blue-700">Sin costo de flete. Presenta tu cédula para reclamar.</p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Indicaciones adicionales para el transportista (Opcional)
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

            {/* Método de Pago */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>3. Método de Pago</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setMetodoPago('contraentrega')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                    metodoPago === 'contraentrega'
                      ? 'bg-red-50 border-red-500 text-red-900 font-bold shadow-xs ring-1 ring-red-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold">Contra Entrega</span>
                  <span className="text-[10px] text-slate-500 font-normal">Datáfono / Efectivo en obra</span>
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
                  <span className="block font-bold">PSE / Bancolombia</span>
                  <span className="text-[10px] text-slate-500 font-normal">Transferencia inmediata</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoPago('credito')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between cursor-pointer transition-all ${
                    metodoPago === 'credito'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold">Crédito Constructor</span>
                  <span className="text-[10px] text-slate-500 font-normal">Factura a 30 días</span>
                </button>
              </div>
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
                Al confirmar, se asociará a tu Cédula/NIT para consulta inmediata en la pestaña de <strong>Trazabilidad</strong>.
              </p>
            </div>
          </form>
        ) : (
          /* =========================================================================
              PASO 1: LISTA DEL CARRITO DE COMPRAS
          ========================================================================= */
          <>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cart.length === 0 ? (
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-transform hover:scale-105"
              >
                <span>Explorar Catálogo Pintuco</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            cart.map((item) => (
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
            ))
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
                    onCheckout();
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
