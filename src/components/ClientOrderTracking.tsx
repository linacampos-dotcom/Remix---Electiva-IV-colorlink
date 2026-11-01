import React, { useState, useEffect, useMemo } from 'react';
import { COLORLINKOrder, UserSession } from '../types';
import { 
  Search, 
  PackageCheck, 
  Clock, 
  Truck, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  Calendar, 
  Layers, 
  FileText, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Database,
  Loader2,
  ShoppingBag,
  Phone,
  User,
  Copy,
  Check,
  Warehouse,
  CreditCard,
  Building2,
  X
} from 'lucide-react';
import { searchSupabaseProjects, SupabaseProjectWithRelations } from '../lib/supabaseService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export const isMockOrder = (o: any): boolean => {
  if (!o) return true;
  const id = String(o.id || '').toLowerCase();
  const num = String(o.numeroOrden || '').toLowerCase();
  const orderId = String(o.orderId || '').toLowerCase();
  const name = String(o.customerName || o.form?.nombre_razon_social || '').toLowerCase();
  const doc = String(o.customerDocument || o.form?.documento || '').replace(/[\.\-\s]/g, '');

  // Las órdenes oficiales COLORLINK (#CLK-...) NUNCA deben ser descartadas
  if (num.includes('clk-') || id.includes('clk-') || orderId.includes('clk-')) return false;

  if (id === 'ord-init-1' || id === 'ord-init-2') return true;
  if (id.includes('a93ec3fe') || num.includes('a93ec3fe') || num.includes('sb-a93ec3fe') || orderId.includes('a93ec3fe')) return true;
  if (name.includes('sara ramirez') && (doc.includes('1028727371') || doc === '')) return true;
  if (num.includes('sb-') && name.includes('sara')) return true;
  if (o.form?.nombre_razon_social === 'Constructora Bolívar S.A.' || o.form?.nombre_razon_social === 'Clínica Las Américas') return true;
  return false;
};

interface ClientOrderTrackingProps {
  orders: COLORLINKOrder[];
  userSession?: UserSession | null;
  onSelectNewOrderTab?: () => void;
  onOpenOmniNotification?: (order: COLORLINKOrder) => void;
}

export const ClientOrderTracking: React.FC<ClientOrderTrackingProps> = ({
  orders,
  userSession,
  onSelectNewOrderTab,
  onOpenOmniNotification,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingSupabase, setIsSearchingSupabase] = useState(false);
  const [supabaseResults, setSupabaseResults] = useState<SupabaseProjectWithRelations[]>([]);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Sync orders with localStorage colorlink_orders in real-time, strictly purging mock orders
  const [allOrders, setAllOrders] = useState<COLORLINKOrder[]>(() => {
    return (orders || []).filter((o) => !isMockOrder(o));
  });

  useEffect(() => {
    const syncLocalOrders = () => {
      try {
        const stored = localStorage.getItem('colorlink_user_orders') || localStorage.getItem('colorlink_orders');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const map = new Map<string, COLORLINKOrder>();
            let hasMock = false;
            // Add stored orders first, excluding unwanted mock orders
            parsed.forEach((o: COLORLINKOrder) => {
              if (isMockOrder(o)) {
                hasMock = true;
                return;
              }
              if (o && (o.id || o.numeroOrden)) {
                map.set(o.id || o.numeroOrden, o);
              }
            });
            // Merge with props orders
            orders.forEach((o: COLORLINKOrder) => {
              if (isMockOrder(o)) return;
              if (o && (o.id || o.numeroOrden) && !map.has(o.id || o.numeroOrden)) {
                map.set(o.id || o.numeroOrden, o);
              }
            });
            const cleanList = Array.from(map.values());
            if (hasMock) {
              localStorage.setItem('colorlink_user_orders', JSON.stringify(cleanList));
              localStorage.setItem('colorlink_orders', JSON.stringify(cleanList));
            }
            setAllOrders(cleanList);
            return;
          }
        }
      } catch (err) {
        console.error('Error syncing local orders:', err);
      }
      setAllOrders((orders || []).filter((o) => !isMockOrder(o)));
    };

    syncLocalOrders();

    // Listen to local storage changes from other tabs or actions
    window.addEventListener('storage', syncLocalOrders);
    return () => window.removeEventListener('storage', syncLocalOrders);
  }, [orders]);

  // Active user credentials check (from props or localStorage currentUser)
  const currentUser = useMemo(() => {
    if (userSession && userSession.isLoggedIn) return userSession;
    try {
      const raw = localStorage.getItem('currentUser') || localStorage.getItem('colorlink_user_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.isLoggedIn) return parsed;
      }
    } catch {}
    return null;
  }, [userSession]);

  const isUserLoggedIn = Boolean(currentUser && currentUser.isLoggedIn);

  const userDocClean = useMemo(() => {
    if (!currentUser) return '';
    return (currentUser.documento || (currentUser as any).cedula || '').replace(/[\.\-\s]/g, '').toLowerCase();
  }, [currentUser]);

  const userEmailClean = useMemo(() => {
    if (!currentUser) return '';
    return (currentUser.email || '').trim().toLowerCase();
  }, [currentUser]);

  // Carga automática de pedidos del cliente logueado sin necesidad de búsqueda manual
  // Muestra ÚNICAMENTE compras reales del usuario activo
  const userAutoOrders = useMemo(() => {
    if (!isUserLoggedIn || (!userDocClean && !userEmailClean)) return [];

    return allOrders.filter((o) => {
      if (isMockOrder(o)) return false;

      const orderDocClean = (o.customerDocument || o.form?.documento || '').replace(/[\.\-\s]/g, '').toLowerCase();
      const orderEmail = (o.customerEmail || o.form?.correo_electronico || '').trim().toLowerCase();

      const docMatch = Boolean(userDocClean && orderDocClean && orderDocClean === userDocClean);
      const emailMatch = Boolean(userEmailClean && orderEmail && orderEmail === userEmailClean);

      return docMatch || emailMatch;
    });
  }, [allOrders, isUserLoggedIn, userDocClean, userEmailClean]);

  // 1. BÚSQUEDA DUAL EN EL BUSCADOR (POR NÚMERO DE ORDEN Y CÉDULA/NIT)
  // Lógica requerida: órdenesEncontradas = orders.filter(o => o.orderId === query || o.customerDocument === query)
  const matchingOrders = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) {
      // Si la barra está vacía y el usuario está logueado, carga automática de sus pedidos reales
      return isUserLoggedIn ? userAutoOrders : [];
    }

    const queryLower = rawQuery.toLowerCase();
    const queryDocClean = rawQuery.replace(/[\.\-\s]/g, '').toLowerCase();

    // Pool de órdenes: si el usuario está logueado, la búsqueda es un filtro secundario sobre sus propios pedidos reales
    const pool = isUserLoggedIn ? userAutoOrders : allOrders.filter((o) => !isMockOrder(o));

    const directMatches = pool.filter((o: any) => {
      if (isMockOrder(o)) return false;

      const oId = (o.id || '').trim().toLowerCase();
      const oNumero = (o.numeroOrden || '').trim().toLowerCase();
      const oOrderId = (o.orderId || '').trim().toLowerCase();

      const oDocRaw = (o.customerDocument || o.form?.documento || '').trim();
      const oDocLower = oDocRaw.toLowerCase();
      const oDocClean = oDocRaw.replace(/[\.\-\s]/g, '').toLowerCase();

      // Regla estricta: Coincidencia por Identificador de Orden (ej. "ORD-2026-4513")
      const orderIdExact = oOrderId === queryLower || oNumero === queryLower || oId === queryLower;
      // Regla estricta: Coincidencia por Número de Cédula/NIT
      const documentExact = oDocLower === queryLower || (queryDocClean.length > 0 && oDocClean === queryDocClean);

      if (orderIdExact || documentExact) {
        return true;
      }

      // Soporte secundario: coincidencia parcial si la consulta tiene 3 o más caracteres
      if (queryLower.length >= 3) {
        if (oNumero.includes(queryLower) || oId.includes(queryLower) || oOrderId.includes(queryLower)) {
          return true;
        }
        if (queryDocClean.length >= 3 && oDocClean.includes(queryDocClean)) {
          return true;
        }
        const customerName = (o.customerName || o.form?.nombre_razon_social || '').toLowerCase();
        if (customerName.includes(queryLower)) {
          return true;
        }
      }

      return false;
    });

    if (directMatches.length > 0) return directMatches;

    // Si escribió un código exacto pero no estaba en su lista previa, buscar en órdenes generales no mock
    if (queryLower.length >= 4) {
      return allOrders.filter((o: any) => {
        if (isMockOrder(o)) return false;
        const oId = (o.id || '').trim().toLowerCase();
        const oNumero = (o.numeroOrden || '').trim().toLowerCase();
        const oOrderId = (o.orderId || '').trim().toLowerCase();
        return oOrderId === queryLower || oNumero === queryLower || oId === queryLower;
      });
    }

    return [];
  }, [allOrders, searchQuery, isUserLoggedIn, userAutoOrders]);

  const handleSearchOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isSupabaseConfigured && searchQuery.trim()) {
      setIsSearchingSupabase(true);
      try {
        const res = await searchSupabaseProjects(searchQuery.trim());
        const cleanResults = (res.data || []).filter((p) => {
          const id = String(p.id || '').toLowerCase();
          const name = String(p.clientes?.nombre || '').toLowerCase();
          const doc = String(p.clientes?.numero_documento || '');
          if (id.includes('a93ec3fe') || name.includes('sara ramirez') || doc.includes('1028727371')) return false;
          return true;
        });
        setSupabaseResults(cleanResults);
      } catch (err) {
        console.error('Error querying Supabase:', err);
      } finally {
        setIsSearchingSupabase(false);
      }
    }
  };

  const handleCopyOrder = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedOrderId(code);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  // Stepper mapping: 4 etapas cronológicas
  // 1: En preparación -> 2: Listo para despacho -> 3: En camino -> 4: Entregado
  const getStepStatus = (orderStatus: COLORLINKOrder['estado'], stepIndex: number) => {
    let currentStepIndex = 0;
    if (orderStatus === 'Cotizado' || orderStatus === 'Pendiente Alistamiento' || orderStatus === 'En Producción') {
      currentStepIndex = 0;
    } else if (orderStatus === 'Listo para Despacho') {
      currentStepIndex = 1;
    } else if (orderStatus === 'Despachado') {
      currentStepIndex = 2;
    } else if (orderStatus === 'Entregado') {
      currentStepIndex = 3;
    }

    if (currentStepIndex > stepIndex) return 'completed';
    if (currentStepIndex === stepIndex) return 'current';
    return 'upcoming';
  };

  const steps = [
    { 
      title: 'En Preparación', 
      desc: 'Alistamiento en bodega y tinturado de pintura',
      icon: Clock
    },
    { 
      title: 'Listo para Despacho', 
      desc: 'Control de calidad NTC 1335 y embalaje flejado',
      icon: PackageCheck
    },
    { 
      title: 'En Camino', 
      desc: 'Despachado con guía de transporte hacia la obra',
      icon: Truck
    },
    { 
      title: 'Entregado', 
      desc: 'Recibido a conformidad en obra o tienda',
      icon: CheckCircle2
    },
  ];

  const getProgressPercentage = (orderStatus: COLORLINKOrder['estado']) => {
    switch (orderStatus) {
      case 'Cotizado':
      case 'Pendiente Alistamiento':
        return 20;
      case 'En Producción':
        return 35;
      case 'Listo para Despacho':
        return 65;
      case 'Despachado':
        return 85;
      case 'Entregado':
        return 100;
      default:
        return 25;
    }
  };

  // Determinar si debemos mostrar la sección de resultados
  const shouldShowResults = Boolean(searchQuery.trim()) || isUserLoggedIn;

  return (
    <div className="space-y-3.5">
      
      {/* 1. ENCABEZADO COMPACTO Y ELEGANTE UNIFICADO (Sin badges ni textos redundantes) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs px-4 sm:px-5 py-3 sm:py-3.5 mb-2 sm:mb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Título discreto */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                Consulta y Trazabilidad de su Pedido Pintuco
              </h2>
            </div>
          </div>

          {/* 2. BARRA DE BÚSQUEDA INTEGRADA Y COMPACTA (En una sola línea horizontal estilizada) */}
          <form onSubmit={handleSearchOrder} className="flex items-center gap-2 w-full md:w-auto md:min-w-[340px] md:max-w-md shrink-0">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cédula/NIT o Código de Orden..."
                className="w-full pl-9 pr-7 py-1.5 sm:py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0033A0] focus:border-[#0033A0] text-xs font-semibold transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Limpiar filtro"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isUserLoggedIn ? 'Filtrar Pedido' : 'Consultar'}</span>
            </button>
          </form>

        </div>
      </div>

      {/* Resultados de Trazabilidad y Lista de Órdenes */}
      {shouldShowResults ? (
        <div className="space-y-4 animate-fadeIn">
          {isSearchingSupabase && (
            <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-center justify-center gap-2 text-xs text-cyan-800 font-medium animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
              <span>Consultando registros en vivo en base de datos...</span>
            </div>
          )}

          {matchingOrders.length === 0 && supabaseResults.length === 0 && !isSearchingSupabase ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 text-center max-w-xl mx-auto space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {searchQuery ? 'No se encontraron órdenes vinculadas' : 'Aún no tienes cotizaciones o pedidos registrados'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                  {searchQuery ? (
                    <>No encontramos pedidos asociados a <strong>"{searchQuery}"</strong>. Verifique haber ingresado su Número de Cédula / NIT o Código de Orden correctamente.</>
                  ) : (
                    'Aún no tienes cotizaciones o pedidos registrados. Realiza un cálculo para generar tu primera orden.'
                  )}
                </p>
              </div>
              {onSelectNewOrderTab && (
                <button
                  type="button"
                  onClick={onSelectNewOrderTab}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/20 transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Realizar Cálculo / Nueva Cotización</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Título de Listado si el usuario está visualizando pedidos */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-[#0033A0]" />
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    {searchQuery ? `Resultados de Búsqueda (${matchingOrders.length})` : `Historial de Pedidos Activos (${matchingOrders.length})`}
                  </span>
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-[#0033A0] hover:underline font-bold"
                  >
                    Ver todos mis pedidos
                  </button>
                )}
              </div>

              {/* Órdenes locales y de la aplicación */}
              {matchingOrders.map((order) => {
                const calc = order.calculo;
                const form = order.form;
                const items = order.items && order.items.length > 0 ? order.items : [];
                
                // Información del cliente dinámica tomada del usuario autenticado actual o de la orden
                const clientDisplayName = (currentUser && currentUser.nombre) 
                  ? currentUser.nombre 
                  : (order.customerName || form?.nombre_razon_social || 'Cliente Registrado');

                const clientDisplayCedula = (currentUser && ((currentUser as any).cedula || currentUser.documento))
                  ? ((currentUser as any).cedula || currentUser.documento)
                  : (order.customerDocument || form?.documento || 'Sin Documento');

                const deliveryAddress = order.direccionEntrega || form.direccion_obra || 'Dirección de obra registrada';
                const deliveryCity = order.ciudadEntrega || form.ciudad;
                const deliveryDepto = order.departamentoEntrega || form.departamento;
                const progressPct = getProgressPercentage(order.estado);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100 hover:shadow-md transition-shadow"
                  >
                    {/* 1. Header con Código de Orden y Estado */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-black text-xs bg-red-600 px-3 py-1 rounded-lg text-white shadow-xs tracking-wider flex items-center gap-1.5">
                            <span>{order.numeroOrden}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyOrder(order.numeroOrden)}
                              className="text-white/80 hover:text-white transition-colors"
                              title="Copiar Código de Orden"
                            >
                              {copiedOrderId === order.numeroOrden ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </span>

                          <span className="text-xs font-black px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>{order.estado}</span>
                          </span>

                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(order.fechaCreacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>

                        <div className="text-xs text-slate-300">
                          Cliente: <strong className="text-white">{clientDisplayName}</strong> • Cédula/NIT: <strong className="text-[#FFD100]">{clientDisplayCedula}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {onOpenOmniNotification && (
                          <button
                            type="button"
                            onClick={() => onOpenOmniNotification(order)}
                            className="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-400/30 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Simular avisos en tiempo real por SMS, Correo y Voz"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#FFD100]" />
                            <span className="hidden xs:inline">Notificaciones Omni</span>
                          </button>
                        )}
                        {order.total && order.total > 0 && (
                          <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15 text-right">
                            <span className="text-[10px] text-slate-300 uppercase block font-semibold">Total Compra</span>
                            <strong className="text-sm font-black text-[#FFD100] font-mono">
                              ${order.total.toLocaleString('es-CO')} COP
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Mensaje Amigable y Cercano en Tiempo Real */}
                    {(() => {
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

                      return (
                        <div className={`px-4 py-3 border-b flex items-center gap-3 ${bannerBg}`}>
                          <span className="text-xl shrink-0">{bannerIcon}</span>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-black tracking-wider block opacity-75">
                              Novedad de Despacho en Vivo
                            </span>
                            <p className="text-xs sm:text-sm font-black leading-tight mt-0.5">
                              {bannerText}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2. Barra de Estado Visual de Alistamiento / Despacho */}
                    <div className="p-4 sm:p-5 bg-slate-50/50 space-y-3.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-red-600" />
                          <span>Trazabilidad y Etapa de Despacho</span>
                        </div>
                        <span className="font-mono text-xs text-red-700 font-extrabold">
                          {progressPct}% Completado
                        </span>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="bg-gradient-to-r from-red-600 to-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* 4 Pasos Visuales */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {steps.map((step, idx) => {
                          const status = getStepStatus(order.estado, idx);
                          const IconComponent = step.icon;

                          return (
                            <div
                              key={idx}
                              className={`p-3.5 rounded-2xl border transition-all relative ${
                                status === 'completed'
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs'
                                  : status === 'current'
                                  ? 'bg-red-50 border-red-300 text-red-950 shadow-xs ring-2 ring-red-500/20'
                                  : 'bg-white border-slate-200 text-slate-400 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-md ${
                                  status === 'completed' 
                                    ? 'bg-emerald-200/60 text-emerald-900' 
                                    : status === 'current'
                                    ? 'bg-red-200 text-red-900'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  Paso {idx + 1}
                                </span>
                                {status === 'completed' && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                )}
                                {status === 'current' && (
                                  <IconComponent className="w-4 h-4 text-red-600 shrink-0 animate-pulse" />
                                )}
                              </div>
                              <div className="text-xs font-black leading-tight flex items-center gap-1.5">
                                <span>{step.title}</span>
                              </div>
                              <div className="text-[10px] mt-1 text-slate-500 leading-tight">
                                {step.desc}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Lista de Productos Comprados */}
                    <div className="p-4 sm:p-5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-red-600" />
                          <span>Lista de Productos Comprados ({items.length > 0 ? items.length : '1 Ref'})</span>
                        </div>
                        {order.total && order.total > 0 && (
                          <span className="text-xs font-bold text-slate-700">
                            Subtotal Pedido: <strong className="text-slate-900">${order.total.toLocaleString('es-CO')} COP</strong>
                          </span>
                        )}
                      </div>

                      {items.length > 0 ? (
                        <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50/50">
                          {items.map((item, idx) => (
                            <div key={item.id || idx} className="p-3.5 flex items-center justify-between gap-3 text-xs bg-white">
                              <div className="flex items-center gap-3 min-w-0">
                                {item.imagenUrl ? (
                                  <img 
                                    src={item.imagenUrl} 
                                    alt={item.nombre} 
                                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                                    <PackageCheck className="w-6 h-6" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-extrabold text-slate-900 truncate">
                                    {item.nombre}
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 border border-slate-200">
                                      {item.presentacion}
                                    </span>
                                    {item.sku && (
                                      <span className="font-mono text-slate-400">SKU: {item.sku}</span>
                                    )}
                                    {item.colorSeleccionado && (
                                      <span className="text-red-700 font-medium">Color: {item.colorSeleccionado}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="font-bold text-slate-900">
                                  {item.cantidad} {item.cantidad === 1 ? 'unidad' : 'unidades'}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  ${(item.subtotal || item.precioUnitario * item.cantidad).toLocaleString('es-CO')} COP
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Fallback desde cotizador FMV */
                        <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                          <div className="p-4 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                                <PackageCheck className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm">
                                  {calc.productoSugerido || 'Pintura Pintuco Especializada'}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Línea: {calc.lineaProducto || 'Pintuco Profesional'} • Acabado: {form.color_acabado}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-red-700 text-sm font-mono block">
                                {calc.galonesPintura} Galones
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {calc.cuñetesPintura} Cuñetes (5 GL) + {calc.galonesSueltosPintura} GL
                              </span>
                            </div>
                          </div>

                          {calc.requiereSellador && (
                            <div className="p-4 flex items-center justify-between gap-3 text-xs bg-cyan-50/30">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                                  <Layers className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-slate-900 text-sm">
                                    Sellador / Imprimante de Base
                                  </h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    Preparación para superficie: {form.superficie}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-cyan-800 text-sm font-mono block">
                                  {calc.galonesSellador} Galones
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {calc.cuñetesSellador} Cuñetes + {calc.galonesSueltosSellador} GL
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 4. Dirección de Entrega Registrada */}
                    <div className="p-4 sm:p-5 bg-slate-50/50 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      
                      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span>Dirección de Entrega Registrada</span>
                        </div>
                        <div className="space-y-2">
                          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                            <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                              Destino y Domicilio:
                            </span>
                            <p className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">
                              {deliveryAddress}
                            </p>
                            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                              {deliveryCity}, {deliveryDepto} — Colombia
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                            <div>
                              <span className="text-slate-500 block font-semibold">Contacto en Obra:</span>
                              <strong className="text-slate-800">{form.responsable_contacto || clientDisplayName}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500 block font-semibold">Teléfono Celular:</span>
                              <strong className="text-slate-800">{order.customerPhone || currentUser?.telefono || form.telefono || 'Confirmado'}</strong>
                            </div>
                          </div>

                          {order.observacionesBodega && (
                            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-900 text-[11px]">
                              <span className="font-bold block text-[10px] uppercase text-amber-800">Nota Especial de Entrega:</span>
                              <span>{order.observacionesBodega}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <Truck className="w-4 h-4 text-red-600" />
                          <span>Operación Logística Pintuco</span>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-600 font-semibold">Responsable de Bodega:</span>
                            <strong className="text-slate-900 font-mono">
                              {order.responsableAlistamiento || 'Bodega Central Pintuco'}
                            </strong>
                          </div>

                          {order.guiaDespacho && (
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950">
                              <span className="font-semibold text-blue-800">Guía de Transporte:</span>
                              <strong className="font-mono text-blue-900">{order.guiaDespacho}</strong>
                            </div>
                          )}

                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-600 font-semibold">Garantía del Producto:</span>
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Sello de Calidad NTC 1335</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <span className="text-slate-600 font-semibold">Modalidad de Entrega:</span>
                            <strong className="text-slate-800">
                              {order.calculo?.modalidad_entrega === 'retiro_tienda' ? 'Retiro en Tienda' : 'Despacho Directo a Obra'}
                            </strong>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : (
        /* Estado inicial para usuarios sin sesión que aún no han buscado */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-lg mx-auto space-y-3">
          <Truck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
            Rastreo Centralizado de Envíos Pintuco
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ingresa tu <strong>Número de Cédula / NIT</strong> o el <strong>Código de Orden</strong> en la barra superior para consultar el estado de tu pedido en tiempo real.
          </p>
        </div>
      )}

    </div>
  );
};

