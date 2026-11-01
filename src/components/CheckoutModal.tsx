import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Truck, 
  Warehouse, 
  CreditCard, 
  Clock, 
  MapPin, 
  ShoppingBag, 
  ArrowRight, 
  ArrowLeft,
  Mail, 
  Phone, 
  User, 
  FileText, 
  Lock, 
  RefreshCw,
  QrCode,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { CartItem, COLORLINKOrder, UserSession, TipoDocumento } from '../types';
import { PINTUCO_STORE_HUBS, DEPARTAMENTOS_COLOMBIA, calculateShipping } from '../data/colombiaLogistics';
import { paymentService } from '../services/paymentService';
import { useCart } from '../context/CartContext';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  userSession?: UserSession | null;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onConfirmOrder?: (order: COLORLINKOrder) => void;
  onClearCart?: () => void;
  onOpenCatalog?: () => void;
  onNavigateToTracking?: () => void;
}

type CheckoutStep = 'review_and_shipping' | 'otp_verification' | 'success';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  userSession,
  onOpenAuth,
  onConfirmOrder,
  onClearCart,
  onOpenCatalog,
  onNavigateToTracking,
}) => {
  const { shippingAddress: globalAddr, setShippingAddress: setGlobalAddr } = useCart();

  // Paso actual del flujo de checkout
  const [step, setStep] = useState<CheckoutStep>('review_and_shipping');

  // Modalidad de entrega: Domicilio a Obra o Retiro en Tienda Pintuco
  const [modalidad, setModalidad] = useState<'domicilio' | 'retiro_tienda'>('domicilio');

  // Ubicación Geográfica
  const [selectedDepto, setSelectedDepto] = useState<string>('Bogotá D.C.');
  const [selectedCiudad, setSelectedCiudad] = useState<string>('Bogotá D.C.');
  const [selectedSede, setSelectedSede] = useState<string>('');

  // Datos de Facturación y Contacto
  const [nombre, setNombre] = useState('');
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento>('Cédula de Ciudadanía');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const [metodoPago, setMetodoPago] = useState<'contraentrega' | 'pse' | 'credito'>('contraentrega');

  // Estado del flujo OTP
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(60);
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const [previewEmailUrl, setPreviewEmailUrl] = useState<string | null>(null);

  // Orden confirmada resultante
  const [confirmedOrder, setConfirmedOrder] = useState<COLORLINKOrder | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sincronizar datos del usuario autenticado
  useEffect(() => {
    if (userSession && userSession.isLoggedIn) {
      if (userSession.nombre) setNombre(userSession.nombre);
      if (userSession.documento) setDocumento(userSession.documento);
      if (userSession.tipoDocumento) setTipoDoc(userSession.tipoDocumento);
      if (userSession.telefono) setTelefono(userSession.telefono);
      if (userSession.email) setEmail(userSession.email);
      if (userSession.direccion) {
        setDireccion(userSession.direccion);
      } else if (globalAddr) {
        setDireccion(globalAddr);
      }
      if (userSession.ciudad) setSelectedCiudad(userSession.ciudad);
    } else {
      const savedAddr = globalAddr || localStorage.getItem('shippingAddress') || localStorage.getItem('colorlink_shipping_address');
      if (savedAddr) setDireccion(savedAddr);
    }
  }, [userSession, globalAddr, isOpen]);

  // Temporizador para reenvío de OTP (60s)
  useEffect(() => {
    let interval: any;
    if (step === 'otp_verification' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Lista de municipios del departamento seleccionado
  const municipiosDelDepto = useMemo(() => {
    const deptoObj = DEPARTAMENTOS_COLOMBIA.find((d) => d.nombre === selectedDepto);
    return deptoObj ? deptoObj.municipios : [];
  }, [selectedDepto]);

  // Actualizar ciudad si cambia el departamento
  const handleDeptoChange = (newDepto: string) => {
    setSelectedDepto(newDepto);
    const deptoObj = DEPARTAMENTOS_COLOMBIA.find((d) => d.nombre === newDepto);
    if (deptoObj && deptoObj.municipios.length > 0) {
      setSelectedCiudad(deptoObj.municipios[0].nombre);
    }
  };

  // =========================================================================
  // REQUISITO CLAVE: FILTRADO ESTRICTO DE SEDES POR DEPARTAMENTO Y CIUDAD
  // Si se selecciona "Tolima -> Mariquita", NO se muestran sedes de Bogotá ni otras ciudades.
  // Solo se muestran sedes ubicadas en la misma ciudad o municipio exacto.
  // =========================================================================
  const availableSedes = useMemo(() => {
    const normCity = (selectedCiudad || '').toLowerCase().trim();
    const normDepto = (selectedDepto || '').toLowerCase().trim();

    if (!normCity || !normDepto) return [];

    return PINTUCO_STORE_HUBS.filter((hub) => {
      const hubCity = hub.ciudad.toLowerCase().trim();
      const hubDepto = hub.departamento.toLowerCase().trim();

      // Debe pertenecer obligatoriamente al mismo departamento
      if (hubDepto !== normDepto) {
        return false;
      }

      // 1. Coincidencia directa de ciudad/municipio
      if (hubCity === normCity) return true;

      // 2. Manejo de ciudades compuestas o metropolitanas delimitadas por "/"
      // ej: "Yumbo / Cali" -> válido si normCity es "cali" o "yumbo"
      const segments = hubCity.split('/').map((s) => s.trim().toLowerCase());
      if (segments.some((seg) => seg === normCity)) {
        return true;
      }

      // 3. Caso especial Bogotá D.C. donde las localidades pertenecen al Distrito Capital
      if (normDepto === 'bogotá d.c.' && hubDepto === 'bogotá d.c.') {
        return true;
      }

      return false;
    });
  }, [selectedCiudad, selectedDepto]);

  // Sincronizar sede seleccionada con las sedes filtradas
  useEffect(() => {
    if (availableSedes.length > 0) {
      const exists = availableSedes.some((h) => h.nombre === selectedSede);
      if (!exists) {
        setSelectedSede(availableSedes[0].nombre);
      }
    } else {
      setSelectedSede('');
    }
  }, [availableSedes, selectedSede]);

  // Manejador de persistencia inmediata de dirección
  const handleAddressChange = (newVal: string) => {
    setDireccion(newVal);
    setGlobalAddr(newVal);
  };

  if (!isOpen) return null;

  // Cálculos de carrito y fletes
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotalCOP = cart.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0);
  const totalGalonesEquivalentes = cart.reduce((sum, item) => {
    const pres = (item.presentacion || '').toLowerCase();
    if (pres.includes('cuñete') || pres.includes('5 gal')) return sum + item.cantidad * 5;
    if (pres.includes('cuarto') || pres.includes('1/4')) return sum + item.cantidad * 0.25;
    return sum + item.cantidad;
  }, 0);

  const shipping = calculateShipping(selectedDepto, selectedCiudad, totalGalonesEquivalentes, modalidad, subtotalCOP);
  const envioCOP = modalidad === 'retiro_tienda' ? 0 : shipping.costoFlete;
  const totalCOP = subtotalCOP + envioCOP;

  // Iniciar envío de código OTP al correo del cliente
  const handleStartOtpPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setOtpError(null);

    // 1. Control de autenticación estricto
    const targetEmail = (email || userSession?.email || '').trim().toLowerCase();
    if (!userSession || !userSession.isLoggedIn || !targetEmail) {
      setErrorMessage('Debes iniciar sesión con tu cuenta de correo para continuar y recibir el recibo oficial.');
      if (onOpenAuth) {
        onOpenAuth('login');
      }
      return;
    }

    // 2. Validaciones de formulario
    if (!nombre.trim()) {
      setErrorMessage('Por favor ingresa tu Nombre Completo o Razón Social.');
      return;
    }
    if (!documento.trim()) {
      setErrorMessage('El Número de Cédula / NIT es obligatorio para facturación legal.');
      return;
    }
    if (!telefono.trim()) {
      setErrorMessage('Por favor ingresa un número de teléfono celular de contacto.');
      return;
    }

    if (modalidad === 'domicilio' && !direccion.trim()) {
      setErrorMessage('Por favor ingresa la dirección exacta de entrega en obra o domicilio.');
      return;
    }

    if (modalidad === 'retiro_tienda' && availableSedes.length === 0) {
      setErrorMessage(`No hay sedes de retiro oficiales disponibles en ${selectedCiudad}, ${selectedDepto}. Por favor selecciona "Envío a Domicilio".`);
      return;
    }

    // 3. Generar número temporal de orden para referencia en el correo
    const tempOrderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    setIsSendingOtp(true);
    try {
      const res = await paymentService.requestOtp(targetEmail, nombre, totalCOP, tempOrderNumber);
      if (!res.success) {
        setErrorMessage(res.error || 'No se pudo enviar el código de seguridad. Intenta de nuevo.');
        return;
      }

      setMaskedEmail(res.maskedEmail || targetEmail);
      setPreviewEmailUrl(res.previewUrl || null);
      setResendTimer(60);
      setStep('otp_verification');
    } catch (err: any) {
      setErrorMessage('Error al conectar con la pasarela de autenticación OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Reenviar código OTP al correo
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setOtpError(null);
    setIsSendingOtp(true);
    try {
      const targetEmail = (email || userSession?.email || '').trim().toLowerCase();
      const res = await paymentService.requestOtp(targetEmail, nombre, totalCOP, `ORD-RESEND-${Date.now().toString().slice(-4)}`);
      if (res.success) {
        setResendTimer(60);
        if (res.previewUrl) setPreviewEmailUrl(res.previewUrl);
      } else {
        setOtpError(res.error || 'No se pudo reenviar el código.');
      }
    } catch {
      setOtpError('Error al reenviar el código OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Validar OTP y aprobar compra
  const handleVerifyOtpAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setOtpError('Por favor ingresa el código completo de 6 dígitos enviado a tu correo.');
      return;
    }

    const targetEmail = (email || userSession?.email || '').trim().toLowerCase();
    setIsVerifyingOtp(true);

    try {
      // 1. Validar OTP en servidor
      const verifyRes = await paymentService.verifyOtp(targetEmail, cleanOtp);
      if (!verifyRes.success) {
        setOtpError(verifyRes.error || 'El código ingresado no es válido. Revisa tu bandeja de entrada o spam.');
        return;
      }

      // 2. Construir objeto de orden oficial
      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newOrder: COLORLINKOrder = {
        id: `ord-${Date.now()}`,
        numeroOrden: orderNumber,
        fechaCreacion: new Date().toISOString(),
        customerDocument: documento.trim(),
        customerName: nombre.trim(),
        customerEmail: targetEmail,
        customerPhone: telefono.trim(),
        direccionEntrega: modalidad === 'retiro_tienda' ? `Retiro en Sede: ${selectedSede}` : direccion.trim(),
        ciudadEntrega: selectedCiudad,
        departamentoEntrega: selectedDepto,
        items: [...cart],
        total: totalCOP,
        estado: 'paid', // Estado oficial solicitado: 'paid'
        responsableAlistamiento: 'Bodega Central Pintuco',
        observacionesBodega: notas.trim() ? `Nota cliente: ${notas.trim()}` : undefined,
      };

      // 3. Completar pago, guardar en Supabase ('paid') y enviar el SEGUNDO correo (recibo oficial)
      const payResult = await paymentService.completeOrderPayment({
        order: newOrder,
        userEmail: targetEmail,
        customerName: nombre.trim(),
      });

      setConfirmedOrder(payResult.order || newOrder);
      if (payResult.previewUrl) setPreviewEmailUrl(payResult.previewUrl);

      if (onConfirmOrder) {
        onConfirmOrder(payResult.order || newOrder);
      }

      if (onClearCart) {
        onClearCart();
      }

      setStep('success');
    } catch (err: any) {
      setOtpError('Ocurrió un error al procesar el pago. Por favor intenta nuevamente.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden animate-fadeIn"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
    >
      <div className="bg-white w-full max-w-[900px] max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800">
        
        {/* ENCABEZADO */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              {step === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : step === 'otp_verification' ? (
                <Lock className="w-5 h-5 text-amber-300" />
              ) : (
                <CreditCard className="w-5 h-5 text-sky-300" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>
                  {step === 'success'
                    ? '¡Compra Confirmada y Pagada!'
                    : step === 'otp_verification'
                    ? 'Validación de Pago por Correo (OTP)'
                    : 'Pasarela de Pago y Despacho Oficial Pintuco'}
                </span>
              </h2>
              <p className="text-xs text-sky-200">
                {step === 'success'
                  ? 'Recibo oficial enviado a tu correo'
                  : step === 'otp_verification'
                  ? 'Código de verificación de 6 dígitos'
                  : 'Garantía directa de fábrica y trazabilidad NTC 1335'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENIDO DEL MODAL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* PASO 1: REVISIÓN DE ORDEN, UBICACIÓN, SEDE Y DATOS */}
          {step === 'review_and_shipping' && (
            <form onSubmit={handleStartOtpPayment} className="space-y-5">
              
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* CONTROL DE AUTENTICACIÓN PREVIA */}
              {(!userSession || !userSession.isLoggedIn) && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-amber-900">Inicio de Sesión Requerido</h4>
                      <p className="text-[11px] text-amber-800">
                        Debes identificarte con tu correo para recibir el código OTP y el recibo de compra oficial.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth('login');
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm transition-transform active:scale-95 whitespace-nowrap"
                  >
                    🔐 Iniciar Sesión / Registrarme
                  </button>
                </div>
              )}

              {/* RESUMEN DE PRODUCTOS */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-blue-900" />
                    <span>Resumen de Productos ({totalItems} ítems):</span>
                  </span>
                  <span className="text-red-600 font-extrabold text-sm">
                    ${subtotalCOP.toLocaleString('es-CO')} COP
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs text-slate-700 bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                      <div className="truncate max-w-[280px]">
                        <strong className="text-slate-900">{item.cantidad}x</strong> {item.nombre} ({item.presentacion})
                        {item.colorSeleccionado && (
                          <span className="block text-[10px] text-blue-900 font-medium">Color: {item.colorSeleccionado}</span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-slate-900 shrink-0">
                        ${(item.cantidad * item.precioUnitario).toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SELECCIÓN DE MODALIDAD Y UBICACIÓN */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-900" />
                  <span>1. Modalidad de Entrega y Ubicación</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalidad('domicilio')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      modalidad === 'domicilio'
                        ? 'border-blue-900 bg-blue-50/60 ring-2 ring-blue-900/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Truck className={`w-5 h-5 ${modalidad === 'domicilio' ? 'text-blue-900' : 'text-slate-400'}`} />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">Envío a Obra / Domicilio</strong>
                      <span className="text-[11px] text-slate-500">
                        {shipping.esFleteGratis ? '¡Flete GRATIS!' : `$${shipping.costoFlete.toLocaleString('es-CO')} COP`}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalidad('retiro_tienda')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      modalidad === 'retiro_tienda'
                        ? 'border-blue-900 bg-blue-50/60 ring-2 ring-blue-900/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Warehouse className={`w-5 h-5 ${modalidad === 'retiro_tienda' ? 'text-blue-900' : 'text-slate-400'}`} />
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">Retiro Sede ($0)</strong>
                      <span className="text-[11px] text-emerald-700 font-bold">Sin costo adicional en bodega</span>
                    </div>
                  </button>
                </div>

                {/* SELECTORES DE DEPARTAMENTO Y CIUDAD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Departamento
                    </label>
                    <select
                      value={selectedDepto}
                      onChange={(e) => handleDeptoChange(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-blue-900"
                    >
                      {DEPARTAMENTOS_COLOMBIA.map((d) => (
                        <option key={d.codigoDANE} value={d.nombre}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Ciudad / Municipio
                    </label>
                    <select
                      value={selectedCiudad}
                      onChange={(e) => setSelectedCiudad(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-800 font-semibold focus:ring-2 focus:ring-blue-900"
                    >
                      {municipiosDelDepto.map((m) => (
                        <option key={m.nombre} value={m.nombre}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SELECTOR DE SEDES FILTRADO EXCLUSIVAMENTE POR CIUDAD */}
                {modalidad === 'retiro_tienda' && (
                  <div className="pt-2">
                    {availableSedes.length > 0 ? (
                      <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-1.5 animate-fadeIn">
                        <label className="block text-[10px] font-black text-blue-950 uppercase tracking-wider">
                          Sede Oficial Autorizada en {selectedCiudad} ({selectedDepto}):
                        </label>
                        <select
                          value={selectedSede}
                          onChange={(e) => setSelectedSede(e.target.value)}
                          className="w-full text-xs rounded-xl border border-blue-300 px-3 py-2 bg-white text-slate-900 font-bold focus:ring-2 focus:ring-blue-900 shadow-2xs"
                        >
                          {availableSedes.map((hub) => (
                            <option key={hub.id} value={hub.nombre}>
                              {hub.nombre} • {hub.direccion}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-blue-800 pt-1">
                          Presenta tu cédula y el código de verificación generado al confirmar la compra.
                        </p>
                      </div>
                    ) : (
                      /* MENSAJE CLARO SI NO HAY SEDES EN ESA CIUDAD (ej. Tolima -> Mariquita) */
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2 animate-fadeIn shadow-2xs">
                        <div className="flex items-center gap-2 font-black text-amber-950">
                          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>No hay sedes de retiro disponibles en {selectedCiudad}, {selectedDepto}</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Pintuco no cuenta actualmente con un punto de retiro físico directo en este municipio. 
                          Te recomendamos cambiar a la opción <strong>"Envío a Obra / Domicilio"</strong> para despachar tu pedido directamente con nuestra transportadora especializada.
                        </p>
                        <button
                          type="button"
                          onClick={() => setModalidad('domicilio')}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                        >
                          🚚 Cambiar a Envío a Domicilio
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* CAMPO DE DIRECCIÓN SI ES DOMICILIO */}
                {modalidad === 'domicilio' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Dirección Completa de Obra / Domicilio <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Carrera 15 # 93-60, Edificio Torre A, Apto 402"
                      value={direccion}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                    />
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Destino confirmado: <strong>{selectedCiudad}, {selectedDepto}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* DATOS DEL COMPRADOR */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-900" />
                  <span>2. Datos de Facturación y Contacto</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Nombre Completo o Razón Social <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Constructora Bolívar S.A.S."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Correo Electrónico (Para OTP y Recibo) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Tipo y N° de Documento / NIT <span className="text-red-600">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={tipoDoc}
                        onChange={(e) => setTipoDoc(e.target.value as TipoDocumento)}
                        className="w-28 text-xs rounded-xl border border-slate-300 px-2 py-2 bg-white text-slate-800 font-semibold shrink-0"
                      >
                        <option value="Cédula de Ciudadanía">C.C.</option>
                        <option value="NIT">NIT</option>
                        <option value="Cédula de Extranjería">C.E.</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={documento}
                        onChange={(e) => setDocumento(e.target.value)}
                        placeholder="1020304050"
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Teléfono Celular de Contacto <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="310 123 4567"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-semibold text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* TOTAL Y BOTÓN DE PAGO CON OTP */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Total a Pagar ($ COP):</span>
                  <strong className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                    ${totalCOP.toLocaleString('es-CO')} COP
                  </strong>
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full sm:w-auto px-7 py-3.5 bg-blue-900 hover:bg-blue-800 disabled:bg-slate-400 text-white rounded-2xl font-black text-xs sm:text-sm cursor-pointer shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSendingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Enviando código al correo...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-300" />
                      <span>Continuar y Validar por Correo (OTP)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* PASO 2: VALIDACIÓN POR CÓDIGO OTP AL CORREO */}
          {step === 'otp_verification' && (
            <div className="max-w-md mx-auto py-4 text-center space-y-6 animate-fadeIn">
              
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8 text-blue-900" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">Código de Verificación Enviado</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Hemos enviado un código OTP de 6 dígitos a tu correo:
                  <br />
                  <strong className="text-blue-900 font-mono text-sm">{maskedEmail}</strong>
                </p>
              </div>

              {otpError && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center justify-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtpAndPay} className="space-y-4">
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-56 text-center text-3xl font-mono tracking-[10px] font-black py-3 rounded-2xl border-2 border-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-900/20 bg-slate-50 text-slate-900 shadow-inner mx-auto block"
                  />
                  <span className="text-[11px] text-slate-500 block mt-2">
                    Ingresa el código numérico de 6 dígitos
                  </span>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || otpCode.length < 6}
                    className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-200" />
                        <span>Validando transacción y orden...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5 text-emerald-200" />
                        <span>Verificar y Confirmar Pago (${totalCOP.toLocaleString('es-CO')} COP)</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('review_and_shipping')}
                      className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver al formulario</span>
                    </button>

                    <button
                      type="button"
                      disabled={resendTimer > 0 || isSendingOtp}
                      onClick={handleResendOtp}
                      className="text-blue-900 font-bold hover:underline disabled:text-slate-400 cursor-pointer"
                    >
                      {resendTimer > 0 ? `Reenviar código (${resendTimer}s)` : 'Reenviar código ahora'}
                    </button>
                  </div>
                </div>
              </form>

              {/* ENLACE DE PREVISUALIZACIÓN DE CORREO EN CASO DE AMBIENTE LOCAL */}
              {previewEmailUrl && (
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-[11px] flex items-center justify-between gap-2 text-left">
                  <span>✉️ ¿No ves el correo? Abre la bandeja de prueba en tiempo real:</span>
                  <a
                    href={previewEmailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline text-blue-900 shrink-0 inline-flex items-center gap-1"
                  >
                    Ver Email <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* PASO 3: ÉXITO, ORDEN PAID Y RECIBO ENVIADO */}
          {step === 'success' && confirmedOrder && (
            <div className="max-w-lg mx-auto py-4 text-center space-y-6 animate-scaleUp">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
                <Check className="w-10 h-10 text-emerald-700 stroke-[3]" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ESTADO: PAID (PAGADO Y CONFIRMADO)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  ¡Gracias por tu compra en Pintuco!
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Tu orden <strong className="text-slate-900 font-mono text-sm">{confirmedOrder.numeroOrden}</strong> ha sido radicada y enviada a alistamiento inmediato.
                </p>
              </div>

              {/* TARJETA DE CONFIRMACIÓN */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-2 font-bold">
                  <span className="text-slate-500">Total Transacción:</span>
                  <span className="text-emerald-700 font-mono font-black text-sm">
                    ${(confirmedOrder.total || totalCOP).toLocaleString('es-CO')} COP
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Destino / Entrega:</span>
                  <p className="font-bold text-slate-800">{confirmedOrder.direccionEntrega}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Recibo Oficial:</span>
                  <p className="font-bold text-blue-900">Enviado a {confirmedOrder.customerEmail}</p>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToTracking) {
                      onNavigateToTracking();
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <Truck className="w-4 h-4 text-sky-200" />
                  <span>Ver Trazabilidad en Tiempo Real</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenCatalog) {
                      onOpenCatalog();
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Seguir Comprando
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
};

export default CheckoutModal;
