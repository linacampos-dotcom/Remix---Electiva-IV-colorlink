import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  Truck, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  ArrowRight, 
  X, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  ShoppingBag, 
  Copy, 
  Check, 
  FileText, 
  HeadphonesIcon, 
  Search, 
  RefreshCw,
  ChevronRight,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { COLORLINKOrder, UserSession } from '../types';
import { 
  getTicketsSAC, 
  saveTicketsSAC, 
  radicarConsultaWeb, 
  responderTicketSAC, 
  TicketSAC, 
  MensajeTicket 
} from '../services/corporateService';

export interface ClientNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession | null;
  orders: COLORLINKOrder[];
  initialTab?: 'seguimiento' | 'pqrs' | 'notificaciones';
  onNavigateToOrder?: (order: COLORLINKOrder) => void;
  onNavigateToCatalog?: () => void;
  onShowToast?: (msg: string) => void;
}

export const ClientNotificationsModal: React.FC<ClientNotificationsModalProps> = ({
  isOpen,
  onClose,
  userSession,
  orders = [],
  initialTab = 'notificaciones',
  onNavigateToOrder,
  onNavigateToCatalog,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'seguimiento' | 'pqrs' | 'notificaciones'>(initialTab);
  const [tickets, setTickets] = useState<TicketSAC[]>(() => getTicketsSAC());
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Filtros de búsqueda
  const [orderQuery, setOrderQuery] = useState('');
  const [ticketQuery, setTicketQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Formulario para radicar nueva PQRS
  const [isNewPqrsOpen, setIsNewPqrsOpen] = useState(false);
  const [newPqrsNombre, setNewPqrsNombre] = useState(userSession?.nombre || '');
  const [newPqrsEmail, setNewPqrsEmail] = useState(userSession?.email || '');
  const [newPqrsTelefono, setNewPqrsTelefono] = useState(userSession?.telefono || '');
  const [newPqrsCategoria, setNewPqrsCategoria] = useState<TicketSAC['categoria']>('Asesoría Técnica Pinturas');
  const [newPqrsAsunto, setNewPqrsAsunto] = useState('');
  const [newPqrsMensaje, setNewPqrsMensaje] = useState('');
  const [isSubmittingPqrs, setIsSubmittingPqrs] = useState(false);

  // Respuesta de seguimiento a un ticket
  const [replyText, setReplyText] = useState('');

  // Sincronizar tab inicial
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Minimizar y cerrar el chat de IA cuando se abre este modal o se navega a PQRS
  useEffect(() => {
    if (isOpen) {
      window.dispatchEvent(new CustomEvent('colorlink_close_ai_chat'));
    }
  }, [isOpen, activeTab]);

  // Sincronizar tickets desde corporateService y eventos
  useEffect(() => {
    const handleTicketsUpdated = () => {
      setTickets(getTicketsSAC());
    };
    window.addEventListener('colorlink_tickets_updated', handleTicketsUpdated);
    return () => window.removeEventListener('colorlink_tickets_updated', handleTicketsUpdated);
  }, []);

  // Cargar órdenes persistentes estrictamente del usuario autenticado
  const effectiveOrders = useMemo(() => {
    if (!userSession || (!userSession.isLoggedIn && !userSession.email)) {
      return [];
    }

    const userEmail = (userSession.email || '').trim().toLowerCase();
    const userDoc = ((userSession as any).cedula || (userSession as any).documento || '').replace(/[\.\-\s]/g, '').toLowerCase();
    const userName = (userSession.nombre || '').trim().toLowerCase();
    const userId = (userSession.id || '').trim().toLowerCase();

    const map = new Map<string, COLORLINKOrder>();
    try {
      const stored = localStorage.getItem('colorlink_orders') || localStorage.getItem('colorlink_user_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((o: COLORLINKOrder) => {
            if (o && (o.id || o.numeroOrden)) {
              map.set(o.id || o.numeroOrden, o);
            }
          });
        }
      }
    } catch {}

    orders.forEach((o) => {
      if (o && (o.id || o.numeroOrden)) {
        map.set(o.id || o.numeroOrden, o);
      }
    });

    const list = Array.from(map.values());

    // FILTRADO ESTRICTO POR USUARIO AUTENTICADO (Email, Cédula/NIT, ID o Nombre)
    const userSpecific = list.filter((o) => {
      const oEmail = (o.customerEmail || o.form?.responsable_contacto || '').trim().toLowerCase();
      const oDoc = (o.customerDocument || o.form?.documento || '').replace(/[\.\-\s]/g, '').toLowerCase();
      const oName = (o.customerName || o.form?.nombre_razon_social || '').trim().toLowerCase();
      const oUserId = String((o as any).userId || (o as any).customerId || (o as any).clienteId || '').trim().toLowerCase();

      const matchEmail = Boolean(userEmail && oEmail && (oEmail === userEmail || oEmail.includes(userEmail)));
      const matchDoc = Boolean(userDoc && oDoc && oDoc === userDoc);
      const matchId = Boolean(userId && oUserId && oUserId === userId);
      const matchName = Boolean(userName && oName && (oName === userName || oName.includes(userName)));

      return matchEmail || matchDoc || matchId || matchName;
    });

    return userSpecific;
  }, [orders, userSession]);

  // Mapear los mensajes amigables y cercanos según el estado del pedido
  const getFriendlyStatus = (estado: string) => {
    const st = (estado || '').toLowerCase();
    if (st.includes('entregado') || st.includes('completado')) {
      return {
        key: 'entregado',
        title: 'Entregado a Satisfacción',
        friendlyMessage: '✅ ¡Pedido entregado! Disfruta dándole color a tu espacio.',
        badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        bannerClass: 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border-emerald-300 text-emerald-950',
        icon: CheckCircle2,
        iconColor: 'text-emerald-600',
        step: 4,
        pct: 100,
      };
    }
    if (st.includes('despachado') || st.includes('tránsito') || st.includes('transito') || st.includes('ruta') || st.includes('camino') || st.includes('despacho')) {
      return {
        key: 'despachado',
        title: 'Despachado / En Tránsito',
        friendlyMessage: '🚚 ¡Tu pedido va en camino! Guía de transporte asignada.',
        badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
        bannerClass: 'bg-gradient-to-r from-blue-600/15 via-sky-500/10 to-blue-500/5 border-blue-300 text-blue-950',
        icon: Truck,
        iconColor: 'text-blue-600',
        step: 3,
        pct: 75,
      };
    }
    // Estado "En Preparación" / Alistamiento en CEDI
    return {
      key: 'preparacion',
      title: 'En Preparación CEDI',
      friendlyMessage: '🎨 ¡Estamos preparando tus pinturas en nuestro CEDI!',
      badgeClass: 'bg-amber-100 text-amber-950 border-amber-300',
      bannerClass: 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-amber-300 text-amber-950',
      icon: Clock,
      iconColor: 'text-amber-600',
      step: 2,
      pct: 45,
    };
  };

  // Filtrar órdenes por búsqueda
  const filteredOrders = useMemo(() => {
    if (!orderQuery.trim()) return effectiveOrders;
    const q = orderQuery.trim().toLowerCase();
    return effectiveOrders.filter((o) => {
      const num = (o.numeroOrden || '').toLowerCase();
      const id = (o.id || '').toLowerCase();
      const dest = (o.ciudadEntrega || o.direccionEntrega || '').toLowerCase();
      const status = (o.estado || '').toLowerCase();
      return num.includes(q) || id.includes(q) || dest.includes(q) || status.includes(q);
    });
  }, [effectiveOrders, orderQuery]);

  // Filtrar tickets de PQRS estrictamente del usuario autenticado
  const userTickets = useMemo(() => {
    if (!userSession || (!userSession.isLoggedIn && !userSession.email)) {
      return [];
    }

    const userEmail = (userSession.email || '').trim().toLowerCase();
    const userName = (userSession.nombre || '').trim().toLowerCase();
    const userId = (userSession.id || '').trim().toLowerCase();
    const userPhone = (userSession.telefono || '').replace(/\s+/g, '');

    const matched = tickets.filter((t) => {
      const tEmail = (t.clienteEmail || '').trim().toLowerCase();
      const tName = (t.clienteNombre || '').trim().toLowerCase();
      const tUserId = String((t as any).clienteId || (t as any).userId || '').trim().toLowerCase();
      const tPhone = (t.clienteTelefono || '').replace(/\s+/g, '');

      const matchEmail = Boolean(userEmail && tEmail && (tEmail === userEmail || tEmail.includes(userEmail)));
      const matchId = Boolean(userId && tUserId && tUserId === userId);
      const matchName = Boolean(userName && tName && (tName === userName || tName.includes(userName)));
      const matchPhone = Boolean(userPhone && tPhone && userPhone.length >= 7 && tPhone.includes(userPhone));

      return matchEmail || matchId || matchName || matchPhone;
    });

    if (!ticketQuery.trim()) return matched;
    const q = ticketQuery.trim().toLowerCase();
    return matched.filter(
      (t) =>
        t.radicado.toLowerCase().includes(q) ||
        t.asunto.toLowerCase().includes(q) ||
        t.categoria.toLowerCase().includes(q) ||
        t.estado.toLowerCase().includes(q)
    );
  }, [tickets, userSession, ticketQuery]);

  // Calcular conteo de notificaciones no leídas / activas
  const unreadCount = useMemo(() => {
    // Pedidos en proceso
    const activeOrders = effectiveOrders.filter((o) => {
      const st = (o.estado || '').toLowerCase();
      return !st.includes('entregado') && !st.includes('cancelado');
    }).length;
    // Tickets respondidos
    const answeredTickets = userTickets.filter((t) => {
      return t.mensajes.some((m) => m.remitenteTipo === 'agente' && !m.esNotaInterna);
    }).length;
    return activeOrders + answeredTickets;
  }, [effectiveOrders, userTickets]);

  // Manejar copiado rápido
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Enviar nueva solicitud PQRS
  const handleCreatePqrs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPqrsNombre.trim() || !newPqrsEmail.trim() || !newPqrsMensaje.trim()) {
      alert('Por favor completa tu nombre, correo y el detalle de tu solicitud.');
      return;
    }

    setIsSubmittingPqrs(true);
    setTimeout(() => {
      const nuevoTicket = radicarConsultaWeb({
        clienteNombre: newPqrsNombre.trim(),
        clienteEmail: newPqrsEmail.trim(),
        clienteTelefono: newPqrsTelefono.trim(),
        canal: 'Formulario PQR',
        asunto: newPqrsAsunto.trim() || 'Consulta técnica / Solicitud de cliente',
        mensaje: newPqrsMensaje.trim(),
        categoria: newPqrsCategoria,
      });

      setTickets(getTicketsSAC());
      setIsSubmittingPqrs(false);
      setIsNewPqrsOpen(false);
      setNewPqrsAsunto('');
      setNewPqrsMensaje('');
      setSelectedTicketId(nuevoTicket.id);
      if (onShowToast) {
        onShowToast(`✅ Solicitud radicada con éxito con número ${nuevoTicket.radicado}`);
      }
    }, 400);
  };

  // Enviar mensaje en hilo de PQRS
  const handleSendTicketReply = (ticketId: string) => {
    if (!replyText.trim()) return;
    const currentTickets = getTicketsSAC();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updated = currentTickets.map((t) => {
      if (t.id === ticketId) {
        const nuevoMsg: MensajeTicket = {
          id: `msg-${Date.now()}`,
          remitenteTipo: 'cliente',
          remitenteNombre: userSession?.nombre || t.clienteNombre || 'Cliente',
          texto: replyText.trim(),
          fecha: now,
        };
        return {
          ...t,
          fechaUltimaActividad: now,
          estado: 'Nuevo' as const,
          mensajes: [...t.mensajes, nuevoMsg],
        };
      }
      return t;
    });

    saveTicketsSAC(updated);
    setTickets(updated);
    setReplyText('');
    if (onShowToast) {
      onShowToast('Mensaje enviado al equipo de SAC');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] text-slate-800 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado Corporativo COLORLINK Brisa Marina */}
        <div className="bg-gradient-to-r from-[#002244] via-[#003366] to-[#0A4D68] text-white p-5 sm:p-6 border-b border-blue-900/60 relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30 shadow-xs shrink-0">
                <Bell className="w-6 h-6 animate-swing" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                    Panel Unificado de Notificaciones & Mis Solicitudes
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-xs">
                    {unreadCount} {unreadCount === 1 ? 'Novedad' : 'Novedades'}
                  </span>
                </div>
                <p className="text-xs text-sky-100/90 mt-0.5">
                  Trazabilidad de despachos en tiempo real e historial oficial de PQRS / Servicio al Cliente (SAC)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Pestañas Principales */}
          <div className="flex items-center gap-2 mt-5 border-t border-white/15 pt-3 overflow-x-auto no-scrollbar">
            {/* 1. Centro de Notificaciones */}
            <button
              type="button"
              onClick={() => setActiveTab('notificaciones')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'notificaciones'
                  ? 'bg-white text-[#002244] font-black shadow-md'
                  : 'text-sky-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>Centro de Avisos & Novedades</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* 2. Seguimiento de Pedidos */}
            <button
              type="button"
              onClick={() => setActiveTab('seguimiento')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'seguimiento'
                  ? 'bg-white text-[#002244] font-black shadow-md'
                  : 'text-sky-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-400" />
              <span>Seguimiento de Pedidos ({effectiveOrders.length})</span>
            </button>

            {/* 3. Bandeja de PQRS y SAC */}
            <button
              type="button"
              onClick={() => setActiveTab('pqrs')}
              className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'pqrs'
                  ? 'bg-white text-[#002244] font-black shadow-md'
                  : 'text-sky-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300" />
              <span>Bandeja PQRS & Solicitudes ({userTickets.length})</span>
            </button>
          </div>
        </div>

        {/* Contenido Dinámico por Pestaña */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/70 text-slate-800 space-y-4">

          {/* =========================================================================
              PESTAÑA 1: CENTRO DE AVISOS Y NOVEDADES (RESUMEN COMBINADO EN VIVO)
          ========================================================================= */}
          {activeTab === 'notificaciones' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Tarjeta de Bienvenida y Estado General */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-sky-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-200">
                      Tus novedades en tiempo real
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black">
                    {userSession?.isLoggedIn 
                      ? `¡Hola, ${userSession.nombre || 'Cliente'}! Aquí está la actividad de tu cuenta.` 
                      : '¡Bienvenido! Monitorea tus pedidos y respuestas técnicas aquí.'}
                  </h4>
                  <p className="text-xs text-sky-200/90">
                    Notificaciones conectadas directamente con el CEDI de Logística y la Mesa de Ayuda Técnica SAC.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('seguimiento')}
                    className="px-3 py-1.5 rounded-xl bg-white text-[#002244] font-black text-xs hover:bg-sky-50 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-900" />
                    <span>Ver Pedidos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pqrs')}
                    className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Mis PQRS</span>
                  </button>
                </div>
              </div>

              {/* Feed de Novedades Cronológicas */}
              <div className="space-y-3">
                <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 px-1">
                  <Clock className="w-4 h-4 text-blue-900" />
                  <span>Últimas Novedades Registradas</span>
                </h5>

                {/* Novedades de Pedidos en curso */}
                {effectiveOrders.map((order) => {
                  const statusInfo = getFriendlyStatus(order.estado);
                  const Icon = statusInfo.icon;
                  return (
                    <div 
                      key={`notif-ord-${order.id || order.numeroOrden}`}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          statusInfo.key === 'entregado' 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                            : statusInfo.key === 'despachado'
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-amber-50 border-amber-200 text-amber-600'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-[#002244]">
                              {order.numeroOrden || order.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${statusInfo.badgeClass}`}>
                              {order.estado}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {order.fechaCreacion ? new Date(order.fechaCreacion).toLocaleDateString('es-CO') : 'Reciente'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 mt-1 leading-snug">
                            {statusInfo.friendlyMessage}
                          </p>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Destino: <strong>{order.ciudadEntrega || 'Colombia'}</strong></span>
                            {order.total && (
                              <span>• Total: <strong className="text-slate-800 font-mono">${order.total.toLocaleString('es-CO')} COP</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('seguimiento');
                          setOrderQuery(order.numeroOrden || order.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0 self-end sm:self-center flex items-center gap-1.5"
                      >
                        <span>Rastrear</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Novedades de Solicitudes SAC Respondidas */}
                {userTickets.map((t) => {
                  const hasAgentResponse = t.mensajes.some((m) => m.remitenteTipo === 'agente' && !m.esNotaInterna);
                  const lastAgentMsg = [...t.mensajes].reverse().find((m) => m.remitenteTipo === 'agente' && !m.esNotaInterna);

                  return (
                    <div 
                      key={`notif-tkt-${t.id}`}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          hasAgentResponse 
                            ? 'bg-teal-50 border-teal-200 text-teal-700' 
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-[#002244]">
                              {t.radicado}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                              hasAgentResponse 
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}>
                              {hasAgentResponse ? 'Respondido por SAC' : 'En revisión técnica'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {t.fechaUltimaActividad || t.fechaCreacion}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                            {t.asunto}
                          </p>
                          {hasAgentResponse && lastAgentMsg ? (
                            <div className="mt-1.5 p-2 rounded-xl bg-teal-50/80 border border-teal-200 text-[11px] text-teal-950 line-clamp-2">
                              <strong>{lastAgentMsg.remitenteNombre}:</strong> {lastAgentMsg.texto}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Tu solicitud se encuentra en cola prioritaria de atención técnica.
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('pqrs');
                          setSelectedTicketId(t.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-900 hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer shrink-0 self-end sm:self-center flex items-center gap-1.5"
                      >
                        <span>Ver Respuesta</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {effectiveOrders.length === 0 && userTickets.length === 0 && (
                  <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-3">
                    <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">No tienes notificaciones pendientes en este momento.</p>
                    <p className="text-[11px] text-slate-400">Tus nuevos pedidos y solicitudes de servicio al cliente aparecerán aquí en vivo.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 2: SEGUIMIENTO DE PEDIDOS (INTEGRADO CON LOGÍSTICA CEDI)
          ========================================================================= */}
          {activeTab === 'seguimiento' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Barra de Búsqueda de Pedidos */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    placeholder="Buscar por N° Orden (ej. ORD-2026-4513, #CLK-...) o ciudad..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                  />
                  {orderQuery && (
                    <button
                      type="button"
                      onClick={() => setOrderQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {onNavigateToCatalog && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToCatalog();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Realizar Nuevo Pedido</span>
                  </button>
                )}
              </div>

              {/* Lista Detallada de Pedidos */}
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-3">
                  <Truck className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No se encontraron pedidos que coincidan con la búsqueda.</p>
                  <p className="text-[11px] text-slate-400">Verifica el código de tu orden o realiza un cálculo en el cotizador.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const statusInfo = getFriendlyStatus(order.estado);
                    const items = Array.isArray(order.items) ? order.items : [];
                    const orderNum = order.numeroOrden || order.id;

                    return (
                      <div 
                        key={orderNum}
                        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-0"
                      >
                        {/* 1. Header de la Orden */}
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#001D3D] to-[#0A4D68] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs sm:text-sm font-black text-[#FFD100] tracking-wider">
                                {orderNum}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(orderNum)}
                                className="text-white/70 hover:text-white p-1 rounded transition-colors"
                                title="Copiar N° de Orden"
                              >
                                {copiedText === orderNum ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusInfo.badgeClass}`}>
                                {order.estado}
                              </span>
                              <span className="text-[11px] text-slate-300 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{order.fechaCreacion ? new Date(order.fechaCreacion).toLocaleDateString('es-CO') : 'Reciente'}</span>
                              </span>
                            </div>
                            <p className="text-xs text-sky-100/90 mt-1">
                              Cliente: <strong className="text-white">{order.customerName || userSession?.nombre || 'Cliente COLORLINK'}</strong> • Destino: <strong className="text-sky-200">{order.ciudadEntrega || 'Colombia'}</strong>
                            </p>
                          </div>

                          {order.total && (
                            <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15 text-left sm:text-right shrink-0">
                              <span className="text-[10px] text-sky-200 uppercase block font-bold">Total Facturado</span>
                              <strong className="text-sm font-black text-[#FFD100] font-mono">
                                ${order.total.toLocaleString('es-CO')} COP
                              </strong>
                            </div>
                          )}
                        </div>

                        {/* 2. MENSAJE AMIGABLE Y CERCANO EN VIVO (Requisito Explícito) */}
                        <div className={`p-4 border-y flex items-center gap-3 ${statusInfo.bannerClass}`}>
                          <div className="w-9 h-9 rounded-xl bg-white/80 shadow-xs flex items-center justify-center shrink-0">
                            {statusInfo.key === 'entregado' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                            {statusInfo.key === 'despachado' && <Truck className="w-5 h-5 text-blue-600" />}
                            {statusInfo.key === 'preparacion' && <Clock className="w-5 h-5 text-amber-600" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-75">
                              Estado Actualizado en Tiempo Real
                            </span>
                            <h5 className="text-xs sm:text-sm font-black leading-tight mt-0.5">
                              {statusInfo.friendlyMessage}
                            </h5>
                          </div>
                        </div>

                        {/* 3. Trazabilidad y Barra de Progreso */}
                        <div className="p-4 sm:p-5 bg-slate-50/50 space-y-3">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-4 h-4 text-blue-900" />
                              <span>Línea de Trazabilidad Logística</span>
                            </div>
                            <span className="font-mono text-xs font-extrabold text-blue-900">
                              Etapa {statusInfo.step} de 4 ({statusInfo.pct}%)
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-700 via-indigo-600 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${statusInfo.pct}%` }}
                            />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                            <div className={`p-2.5 rounded-xl border ${statusInfo.step >= 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold' : 'bg-white border-slate-200 text-slate-400'}`}>
                              <span className="block text-[9px] font-mono uppercase text-emerald-700">Paso 1</span>
                              <span>✅ Pedido Confirmado</span>
                            </div>
                            <div className={`p-2.5 rounded-xl border ${statusInfo.step >= 2 ? 'bg-amber-50 border-amber-200 text-amber-950 font-bold' : 'bg-white border-slate-200 text-slate-400'}`}>
                              <span className="block text-[9px] font-mono uppercase text-amber-700">Paso 2</span>
                              <span>🎨 Alistamiento CEDI</span>
                            </div>
                            <div className={`p-2.5 rounded-xl border ${statusInfo.step >= 3 ? 'bg-blue-50 border-blue-200 text-blue-950 font-bold' : 'bg-white border-slate-200 text-slate-400'}`}>
                              <span className="block text-[9px] font-mono uppercase text-blue-700">Paso 3</span>
                              <span>🚚 Despacho en Ruta</span>
                            </div>
                            <div className={`p-2.5 rounded-xl border ${statusInfo.step >= 4 ? 'bg-emerald-50 border-emerald-200 text-emerald-950 font-bold' : 'bg-white border-slate-200 text-slate-400'}`}>
                              <span className="block text-[9px] font-mono uppercase text-emerald-700">Paso 4</span>
                              <span>🏁 Entregado en Obra</span>
                            </div>
                          </div>
                        </div>

                        {/* 4. Lista de Variantes / Productos Descontados de Inventario */}
                        {items.length > 0 && (
                          <div className="p-4 sm:p-5 border-t border-slate-100 space-y-2">
                            <h6 className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-blue-900" />
                              <span>Productos y Variantes en esta Orden ({items.length})</span>
                            </h6>
                            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                              {items.map((it, idx) => (
                                <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                                  <div className="min-w-0">
                                    <strong className="block text-slate-900 font-extrabold truncate">
                                      {it.nombre}
                                    </strong>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                                      {it.presentacion && <span className="font-semibold text-slate-700">{it.presentacion}</span>}
                                      {it.colorSeleccionado && <span className="text-blue-900 font-bold">Color: {it.colorSeleccionado}</span>}
                                      {it.sku && <span className="font-mono text-slate-400">SKU: {it.sku}</span>}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="font-black text-slate-900 block">
                                      {it.cantidad} {it.cantidad === 1 ? 'unidad' : 'unidades'}
                                    </span>
                                    {it.precioUnitario && (
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        ${(it.subtotal || it.precioUnitario * it.cantidad).toLocaleString('es-CO')} COP
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. Destino de Entrega */}
                        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              Dirección: <strong className="text-slate-800">{order.direccionEntrega || 'Dirección de obra registrada'}</strong>, {order.ciudadEntrega || 'Colombia'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('pqrs');
                                setNewPqrsAsunto(`Consulta sobre despacho orden ${orderNum}`);
                                setIsNewPqrsOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-[#002244] text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              <HeadphonesIcon className="w-3 h-3 text-cyan-600" />
                              <span>Soporte para esta orden</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              PESTAÑA 3: BANDEJA DE PQRS Y CONTACTO (INTEGRADO CON SAC)
          ========================================================================= */}
          {activeTab === 'pqrs' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Barra Superior con botón para Radicar Nueva Solicitud */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ticketQuery}
                    onChange={(e) => setTicketQuery(e.target.value)}
                    placeholder="Buscar por N° Radicado (ej. CLK-SAC-2026-081) o asunto..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                  />
                  {ticketQuery && (
                    <button
                      type="button"
                      onClick={() => setTicketQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewPqrsOpen(!isNewPqrsOpen)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-900 to-teal-800 hover:from-blue-800 hover:to-teal-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <HeadphonesIcon className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{isNewPqrsOpen ? 'Cerrar Formulario' : 'Radicar Nueva Solicitud'}</span>
                </button>
              </div>

              {/* Formulario Desplegable para Radicar Nueva PQRS */}
              {isNewPqrsOpen && (
                <form 
                  onSubmit={handleCreatePqrs}
                  className="p-5 bg-white rounded-3xl border border-blue-200 shadow-lg space-y-3.5 animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
                        <MessageSquare className="w-4 h-4 text-blue-900" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900">
                          Formulario Oficial de Radicación PQRS / Soporte Técnico
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Se asignará un número de radicado oficial con trazabilidad directa en nuestro ERP Pintuco.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNewPqrsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Tu Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={newPqrsNombre}
                        onChange={(e) => setNewPqrsNombre(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={newPqrsEmail}
                        onChange={(e) => setNewPqrsEmail(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        value={newPqrsTelefono}
                        onChange={(e) => setNewPqrsTelefono(e.target.value)}
                        placeholder="+57 300 000 0000"
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Categoría Técnica *</label>
                      <select
                        value={newPqrsCategoria}
                        onChange={(e) => setNewPqrsCategoria(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
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
                      <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Asunto de la Solicitud *</label>
                      <input
                        type="text"
                        required
                        value={newPqrsAsunto}
                        onChange={(e) => setNewPqrsAsunto(e.target.value)}
                        placeholder="Ej. Consulta sobre rendimiento Koraza en fachada"
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Detalle de tu Mensaje o Requerimiento *</label>
                    <textarea
                      required
                      rows={3}
                      value={newPqrsMensaje}
                      onChange={(e) => setNewPqrsMensaje(e.target.value)}
                      placeholder="Escribe con detalle tu pregunta, requerimiento técnico o inquietud..."
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                    />
                  </div>

                  {/* Conformidad Habeas Data - Ley Estatutaria 1581 de 2012 */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 leading-relaxed flex items-start gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <p>
                      <strong>Habeas Data (Ley 1581 de 2012):</strong> Autorizo a Pintuco S.A. el tratamiento de mis datos personales exclusivamente para la atención, gestión y trazabilidad técnica de este radicado PQRS.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsNewPqrsOpen(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPqrs}
                      className="px-4 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingPqrs ? 'Radicando...' : 'Radicar Solicitud Oficial'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Listado de Casos y Solicitudes Radicadas */}
              {userTickets.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 space-y-3">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No tienes radicados registrados en este momento.</p>
                  <p className="text-[11px] text-slate-400">
                    Puedes radicar una consulta técnica, garantía o seguimiento de despacho haciendo clic en "Radicar Nueva Solicitud".
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userTickets.map((ticket) => {
                    // Determinar estado actual amigable ("En revisión" vs "Respondido")
                    const hasAgentResponse = ticket.mensajes.some((m) => m.remitenteTipo === 'agente' && !m.esNotaInterna);
                    const isRespondido = hasAgentResponse || ticket.estado === 'Resuelto' || ticket.estado === 'Cerrado';
                    const estadoLabel = isRespondido ? 'Respondido' : 'En revisión';

                    const officialAgentMessages = ticket.mensajes.filter((m) => m.remitenteTipo === 'agente' && !m.esNotaInterna);
                    const isExpanded = selectedTicketId === ticket.id;

                    return (
                      <div 
                        key={ticket.id}
                        className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                      >
                        {/* Cabecera del Caso Radicado */}
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#002244] to-[#003366] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs sm:text-sm font-black text-amber-300 tracking-wider">
                                {ticket.radicado}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(ticket.radicado)}
                                className="text-white/70 hover:text-white p-1 rounded transition-colors"
                                title="Copiar N° de Radicado"
                              >
                                {copiedText === ticket.radicado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              
                              {/* BADGE DE ESTADO REQUERIDO: "En revisión" o "Respondido" */}
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                                isRespondido 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                                  : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                              }`}>
                                {isRespondido ? '✅ Respondido' : '⏳ En revisión'}
                              </span>

                              <span className="text-[11px] text-slate-300 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>Radicado el: {ticket.fechaCreacion}</span>
                              </span>
                            </div>

                            <h4 className="text-sm font-black text-white mt-1">
                              {ticket.asunto}
                            </h4>
                            <div className="text-[11px] text-sky-200/80 mt-0.5 flex items-center gap-2 flex-wrap">
                              <span>Categoría: <strong>{ticket.categoria}</strong></span>
                              <span>• Canal: <strong>{ticket.canal}</strong></span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedTicketId(isExpanded ? null : ticket.id)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer shrink-0 self-end sm:self-center flex items-center gap-1.5 border border-white/20"
                          >
                            <span>{isExpanded ? 'Contraer' : 'Ver Respuestas'}</span>
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </div>

                        {/* Contenido Principal del Radicado */}
                        <div className="p-4 sm:p-5 space-y-4">
                          
                          {/* 1. Mensaje Original Radicado por el Cliente */}
                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <User className="w-3 h-3 text-slate-600" />
                              <span>Tu solicitud radicada ({ticket.clienteNombre})</span>
                            </span>
                            <p className="text-xs text-slate-800 leading-relaxed">
                              {ticket.mensaje}
                            </p>
                          </div>

                          {/* 2. TEXTO COMPLETO DE LA RESPUESTA OFICIAL REDACTADA POR EL EQUIPO DE SAC (Requisito Explícito) */}
                          {officialAgentMessages.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-xs font-black text-teal-800 uppercase tracking-wider">
                                <ShieldCheck className="w-4 h-4 text-teal-600" />
                                <span>Respuesta Oficial del Equipo Técnico SAC Pintuco</span>
                              </div>

                              {officialAgentMessages.map((msg) => (
                                <div 
                                  key={msg.id}
                                  className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 via-emerald-50/50 to-sky-50 border-2 border-teal-300/80 shadow-xs space-y-2 relative"
                                >
                                  {/* Encabezado del Agente */}
                                  <div className="flex items-center justify-between gap-2 border-b border-teal-200/60 pb-2">
                                    <div className="flex items-center gap-2.5">
                                      {msg.remitenteAvatar ? (
                                        <img
                                          src={msg.remitenteAvatar}
                                          alt={msg.remitenteNombre}
                                          className="w-8 h-8 rounded-full object-cover border-2 border-teal-600 shadow-2xs"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                                          SAC
                                        </div>
                                      )}
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <strong className="text-xs font-black text-teal-950">
                                            {msg.remitenteNombre}
                                          </strong>
                                          <span className="px-1.5 py-0.2 rounded-md bg-teal-200/70 text-teal-900 text-[9px] font-extrabold">
                                            Funcionario Oficial SAC
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-teal-700">
                                          Emitido el: {msg.fecha}
                                        </span>
                                      </div>
                                    </div>

                                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1 shadow-2xs">
                                      <CheckCircle2 className="w-3 h-3 text-white" />
                                      <span>Dictamen Certificado</span>
                                    </span>
                                  </div>

                                  {/* TEXTO COMPLETO DE LA RESPUESTA OFICIAL */}
                                  <div className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line pl-1 pt-1">
                                    {msg.texto}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* En Revisión: Aún sin respuesta de agente */
                            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center gap-3 text-xs text-amber-950">
                              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                              <div className="min-w-0">
                                <strong className="font-extrabold block">Tu caso se encuentra en revisión técnica activa.</strong>
                                <span className="text-[11px] text-amber-800">
                                  Nuestro equipo de Servicio al Cliente y Laboratorio Técnico está analizando tu solicitud. Recibirás respuesta formal en un plazo inferior a 8 horas hábiles.
                                </span>
                              </div>
                            </div>
                          )}

                          {/* 3. Área para Responder / Agregar Seguimiento al Caso */}
                          {isExpanded && (
                            <div className="pt-3 border-t border-slate-200 space-y-2">
                              <label className="block text-[11px] font-bold uppercase text-slate-700">
                                Enviar mensaje de seguimiento o aclaración para este radicado:
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Escribe tu mensaje para el agente de SAC..."
                                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleSendTicketReply(ticket.id);
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSendTicketReply(ticket.id)}
                                  className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Responder</span>
                                </button>
                              </div>
                            </div>
                          )}

                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Pie del Modal con Soporte Telefónico y WhatsApp Directo */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-blue-900" />
              <span>Línea Nacional: <strong>01 8000 111 247</strong></span>
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-900" />
              <span>contacto@colorlink.pintuco.com</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cerrar Panel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
