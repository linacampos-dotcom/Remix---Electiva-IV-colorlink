import React, { useState, useEffect, useMemo } from 'react';
import { UserSession } from '../types';
import {
  ItemInventarioCorp,
  OrdenCompraCorp,
  RequisicionCompra,
  ItemRequisicion,
  ProveedorCorp,
  getRequisicionesCompra,
  saveRequisicionesCompra,
  crearRequisicionCompra,
  getProveedoresCorp,
  saveProveedoresCorp,
  crearProveedorCorp,
  saveOrdenesCompraCorp,
  getOrdenesCompraCorp,
  calcularMetricasStockSKU,
  SEDES_CEDI_CONFIG,
  getStockEnSede,
} from '../services/corporateService';
import {
  ShoppingBag,
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  Building2,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ArrowUpRight,
  X,
  FileText,
  FileCheck,
  Truck,
  RotateCcw,
  Download,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Package,
  Boxes,
  Send,
  Phone,
  Mail,
  MapPin,
  Award,
  DollarSign,
  HelpCircle,
} from 'lucide-react';

export type SubTabCompras = 'requisiciones' | 'ordenes_compra' | 'proveedores' | 'alertas_stock';

interface ComprasAbastecimientoManagerProps {
  activeSubTab: SubTabCompras;
  onChangeSubTab: (tab: SubTabCompras) => void;
  selectedSede: string;
  onChangeSede?: (sede: string) => void;
  userSession?: UserSession | null;
  inventario: ItemInventarioCorp[];
  ordenesCompra: OrdenCompraCorp[];
  onUpdateOrdenesCompra?: (ordenes: OrdenCompraCorp[]) => void;
  pedidosCliente?: any[];
  onNavigateToRecepcionBodega?: (ocNumero: string) => void;
  onRegistrarAuditoria?: (modulo: string, accion: string, detalle: string) => void;
}

export const ComprasAbastecimientoManager: React.FC<ComprasAbastecimientoManagerProps> = ({
  activeSubTab,
  onChangeSubTab,
  selectedSede,
  onChangeSede,
  userSession,
  inventario,
  ordenesCompra,
  onUpdateOrdenesCompra,
  pedidosCliente = [],
  onNavigateToRecepcionBodega,
  onRegistrarAuditoria,
}) => {
  // Estado local sincronizado
  const [requisiciones, setRequisiciones] = useState<RequisicionCompra[]>(getRequisicionesCompra);
  const [proveedores, setProveedores] = useState<ProveedorCorp[]>(getProveedoresCorp);
  const [localOrdenes, setLocalOrdenes] = useState<OrdenCompraCorp[]>(ordenesCompra);

  // Escuchar eventos globales de sincronización
  useEffect(() => {
    const handleRequisicionesUpdate = () => {
      setRequisiciones(getRequisicionesCompra());
    };
    const handleProveedoresUpdate = () => {
      setProveedores(getProveedoresCorp());
    };
    const handleOCsUpdate = () => {
      setLocalOrdenes(getOrdenesCompraCorp());
    };

    window.addEventListener('colorlink_requisiciones_updated', handleRequisicionesUpdate);
    window.addEventListener('colorlink_proveedores_updated', handleProveedoresUpdate);
    window.addEventListener('colorlink_ordenes_compra_updated', handleOCsUpdate);

    return () => {
      window.removeEventListener('colorlink_requisiciones_updated', handleRequisicionesUpdate);
      window.removeEventListener('colorlink_proveedores_updated', handleProveedoresUpdate);
      window.removeEventListener('colorlink_ordenes_compra_updated', handleOCsUpdate);
    };
  }, []);

  useEffect(() => {
    setLocalOrdenes(ordenesCompra);
  }, [ordenesCompra]);

  // Mensaje de notificación / toast interno
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // FILTROS
  // -------------------------------------------------------------
  // 1. Requisiciones
  const [reqSearch, setReqSearch] = useState('');
  const [reqStatusFilter, setReqStatusFilter] = useState<string>('todos');
  const [reqPriorityFilter, setReqPriorityFilter] = useState<string>('todos');

  // 2. Órdenes de Compra
  const [ocSearch, setOcSearch] = useState('');
  const [ocStatusFilter, setOcStatusFilter] = useState<string>('todos');

  // 3. Proveedores
  const [provSearch, setProvSearch] = useState('');
  const [provCatFilter, setProvCatFilter] = useState<string>('todos');

  // 4. Alertas de Stock
  const [alertaSearch, setAlertaSearch] = useState('');
  const [alertaNivelFilter, setAlertaNivelFilter] = useState<'todos' | 'critico' | 'reorden' | 'optimo'>('todos');

  // -------------------------------------------------------------
  // MODALES
  // -------------------------------------------------------------
  // Modal: Convertir Requisición en Orden de Compra
  const [selectedReqForOC, setSelectedReqForOC] = useState<RequisicionCompra | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertForm, setConvertForm] = useState({
    proveedorId: '',
    proveedorNombre: '',
    proveedorNit: '',
    numeroOC: '',
    numeroFacturaProveedor: '',
    sedeDestinoId: 'bogota',
    fechaEstimadaLlegada: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    condicionPago: 'Crédito 30 días',
    estado: 'Enviada a Proveedor' as OrdenCompraCorp['estado'],
    observaciones: '',
    itemsPrecios: {} as Record<string, number>,
  });

  // Modal: Detalle de Requisición
  const [selectedReqForDetail, setSelectedReqForDetail] = useState<RequisicionCompra | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Modal: Nuevo Proveedor
  const [isNewProvModalOpen, setIsNewProvModalOpen] = useState(false);
  const [newProvForm, setNewProvForm] = useState<Omit<ProveedorCorp, 'id'>>({
    nit: '',
    razonSocial: '',
    nombreComercial: '',
    categoria: 'Pinturas Base & Esmaltes',
    contactoNombre: '',
    email: '',
    telefono: '',
    ciudad: 'Bogotá D.C.',
    direccion: '',
    condicionPago: 'Crédito 30 días',
    tiempoEntregaDiasSLA: 3,
    calificacionSLA: 98.0,
    certificaciones: ['ISO 9001:2015', 'NTC 1335'],
    activo: true,
    observaciones: '',
  });

  // Modal: Crear Requisición Rápida (desde Alertas de Stock)
  const [isQuickReqModalOpen, setIsQuickReqModalOpen] = useState(false);
  const [quickReqForm, setQuickReqForm] = useState({
    sku: '',
    sedeId: 'bogota',
    cantidad: 20,
    prioridad: 'Alta' as RequisicionCompra['prioridad'],
    motivo: '',
  });

  // -------------------------------------------------------------
  // MÉTRICAS Y CÁLCULOS
  // -------------------------------------------------------------
  const statsRequisiciones = useMemo(() => {
    const total = requisiciones.length;
    const pendientes = requisiciones.filter((r) => r.estado === 'Pendiente').length;
    const convertidas = requisiciones.filter((r) => r.estado === 'Convertida en OC').length;
    const criticas = requisiciones.filter((r) => r.prioridad === 'Crítica / Quiebre Stock' && r.estado === 'Pendiente').length;
    return { total, pendientes, convertidas, criticas };
  }, [requisiciones]);

  const statsOCs = useMemo(() => {
    const total = localOrdenes.length;
    const enTransito = localOrdenes.filter((o) => o.estado === 'En Tránsito' || o.estado === 'Enviada a Proveedor').length;
    const pendientesRecibo = localOrdenes.filter((o) => o.estado === 'Pendiente Recibo').length;
    const totalValorCOP = localOrdenes.reduce((acc, o) => acc + (Number(o.totalEstimadoCOP) || 0), 0);
    return { total, enTransito, pendientesRecibo, totalValorCOP };
  }, [localOrdenes]);

  // Lista calculada de salud de inventario por SKU
  const stockSaludList = useMemo(() => {
    return inventario.map((item) => {
      const metricas = calcularMetricasStockSKU(item.sku, selectedSede, inventario, localOrdenes, pedidosCliente);
      return {
        item,
        ...metricas,
      };
    });
  }, [inventario, selectedSede, localOrdenes, pedidosCliente]);

  const statsAlertas = useMemo(() => {
    const criticos = stockSaludList.filter((s) => s.nivelAlerta === 'critico').length;
    const reorden = stockSaludList.filter((s) => s.nivelAlerta === 'reorden').length;
    const optimos = stockSaludList.filter((s) => s.nivelAlerta === 'optimo').length;
    const deficitInversion = stockSaludList
      .filter((s) => s.nivelAlerta !== 'optimo')
      .reduce((acc, s) => acc + s.sugeridoReorden * (s.item.costoUnitarioGL || 45000), 0);
    return { criticos, reorden, optimos, deficitInversion };
  }, [stockSaludList]);

  // -------------------------------------------------------------
  // ACCIÓN: CONVERTIR REQUISICIÓN EN ORDEN DE COMPRA
  // -------------------------------------------------------------
  const handleOpenConvertModal = (req: RequisicionCompra) => {
    setSelectedReqForOC(req);
    const defaultProv = proveedores[0];
    const nextNum = localOrdenes.length + 1;
    const numOC = `OC-2026-${String(nextNum).padStart(3, '0')}`;

    const initialPrices: Record<string, number> = {};
    req.items.forEach((it) => {
      initialPrices[it.sku] = it.precioUnitarioEstimado || 340000;
    });

    setConvertForm({
      proveedorId: defaultProv?.id || '',
      proveedorNombre: defaultProv?.razonSocial || 'Pintuco S.A. Planta Rionegro',
      proveedorNit: defaultProv?.nit || '890.900.123-4',
      numeroOC: numOC,
      numeroFacturaProveedor: `FAC-PROV-${Math.floor(10000 + Math.random() * 90000)}`,
      sedeDestinoId: req.sedeSolicitanteId,
      fechaEstimadaLlegada: new Date(Date.now() + 86400000 * (defaultProv?.tiempoEntregaDiasSLA || 3)).toISOString().slice(0, 10),
      condicionPago: defaultProv?.condicionPago || 'Crédito 30 días',
      estado: 'Enviada a Proveedor',
      observaciones: `Generada a partir de la Requisición de Bodega ${req.consecutivo}. Motivo: ${req.motivo}`,
      itemsPrecios: initialPrices,
    });

    setIsConvertModalOpen(true);
  };

  const handleConfirmConvertOC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForOC) return;

    const sedeObj = SEDES_CEDI_CONFIG.find((s) => s.id === convertForm.sedeDestinoId) || SEDES_CEDI_CONFIG[0];
    const provObj = proveedores.find((p) => p.id === convertForm.proveedorId);

    // Calcular items y total
    const ocItems = selectedReqForOC.items.map((it) => {
      const unitPrice = convertForm.itemsPrecios[it.sku] || it.precioUnitarioEstimado || 300000;
      return {
        id: `it-oc-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        sku: it.sku,
        productoNombre: it.productoNombre,
        color: it.color,
        colorHex: it.colorHex,
        presentacion: it.presentacion,
        cantidadEsperada: it.cantidadSolicitada,
        loteFabricacion: `LOT-OC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        precioUnitarioEstimado: unitPrice,
      };
    });

    const totalCOP = ocItems.reduce((acc, it) => acc + it.cantidadEsperada * (it.precioUnitarioEstimado || 0), 0);
    const totalUnidades = ocItems.reduce((acc, it) => acc + it.cantidadEsperada, 0);

    const nuevaOC: OrdenCompraCorp = {
      id: `oc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      numeroOC: convertForm.numeroOC.trim() || `OC-2026-${Date.now().toString().slice(-3)}`,
      numeroFacturaProveedor: convertForm.numeroFacturaProveedor,
      proveedor: provObj?.razonSocial || convertForm.proveedorNombre,
      proveedorNit: provObj?.nit || convertForm.proveedorNit,
      fechaEmision: new Date().toISOString().slice(0, 10),
      fechaEstimadaLlegada: convertForm.fechaEstimadaLlegada,
      fechaEnvio: new Date().toISOString().slice(0, 10),
      sedeDestinoId: sedeObj.id,
      sedeDestinoNombre: sedeObj.nombre,
      estado: convertForm.estado,
      items: ocItems,
      totalEstimadoCOP: totalCOP,
      totalUnidades,
      compradorResponsable: userSession?.nombre || 'Coordinador de Compras Corporativas',
      requisicionOrigenId: selectedReqForOC.id,
      requisicionOrigenConsecutivo: selectedReqForOC.consecutivo,
      condicionPago: convertForm.condicionPago,
      observaciones: convertForm.observaciones,
    };

    // Guardar OC en la base central de órdenes de compra
    const ocsActuales = getOrdenesCompraCorp();
    const ocsActualizadas = [nuevaOC, ...ocsActuales];
    saveOrdenesCompraCorp(ocsActualizadas);
    setLocalOrdenes(ocsActualizadas);
    if (onUpdateOrdenesCompra) {
      onUpdateOrdenesCompra(ocsActualizadas);
    }

    // Actualizar Requisición a "Convertida en OC"
    const reqsActuales = getRequisicionesCompra();
    const reqsActualizadas = reqsActuales.map((r) => {
      if (r.id === selectedReqForOC.id) {
        return {
          ...r,
          estado: 'Convertida en OC' as const,
          ordenCompraGeneradaId: nuevaOC.id,
          ordenCompraNumero: nuevaOC.numeroOC,
          fechaAprobacion: new Date().toISOString().slice(0, 10),
          aprobadoPor: userSession?.nombre || 'Dra. Carolina Martínez (Directora de Compras)',
        };
      }
      return r;
    });
    saveRequisicionesCompra(reqsActualizadas);
    setRequisiciones(reqsActualizadas);

    // Auditoría
    if (onRegistrarAuditoria) {
      onRegistrarAuditoria(
        'Inventario',
        'Generación de Orden de Compra desde Requisición',
        `Requisición ${selectedReqForOC.consecutivo} convertida en Orden de Compra ${nuevaOC.numeroOC}. Proveedor: ${nuevaOC.proveedor}. Destino: ${nuevaOC.sedeDestinoNombre}. Total COP: $${totalCOP.toLocaleString()}.`
      );
    }

    setIsConvertModalOpen(false);
    setSelectedReqForOC(null);
    showToast(`Orden de Compra ${nuevaOC.numeroOC} emitida exitosamente para ${nuevaOC.proveedor}`);
  };

  // -------------------------------------------------------------
  // ACCIÓN: CREAR REQUISICIÓN RÁPIDA DESDE ALERTA DE STOCK
  // -------------------------------------------------------------
  const handleOpenQuickReq = (item: ItemInventarioCorp, sugerido: number) => {
    setQuickReqForm({
      sku: item.sku,
      sedeId: selectedSede === 'todas' ? 'bogota' : selectedSede,
      cantidad: Math.max(10, sugerido),
      prioridad: 'Alta',
      motivo: `Reposición automática por nivel crítico de inventario. SKU: ${item.sku}. Existencia actual por debajo del punto de reorden.`,
    });
    setIsQuickReqModalOpen(true);
  };

  const handleConfirmQuickReq = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = inventario.find((i) => i.sku === quickReqForm.sku);
    if (!targetItem) return;

    const sedeObj = SEDES_CEDI_CONFIG.find((s) => s.id === quickReqForm.sedeId) || SEDES_CEDI_CONFIG[0];
    const metricas = calcularMetricasStockSKU(targetItem.sku, sedeObj.id, inventario, localOrdenes, pedidosCliente);

    const nueva = crearRequisicionCompra({
      sedeSolicitanteId: sedeObj.id,
      sedeSolicitanteNombre: sedeObj.nombre,
      solicitanteNombre: userSession?.nombre || 'Analista de Abastecimiento CEDI',
      solicitanteCargo: userSession?.cargo || 'Control de Inventarios & Compras',
      prioridad: quickReqForm.prioridad,
      motivo: quickReqForm.motivo || 'Reabastecimiento urgente de existencias.',
      items: [
        {
          id: `it-req-${Date.now()}`,
          sku: targetItem.sku,
          productoNombre: targetItem.nombre,
          color: targetItem.color,
          colorHex: targetItem.colorHex,
          presentacion: targetItem.presentacion || 'Cuñete (5 Gal)',
          cantidadSolicitada: Number(quickReqForm.cantidad) || 10,
          stockActual: metricas.stockFisico,
          stockReservado: metricas.stockReservado,
          stockEnTransito: metricas.stockEnTransito,
          puntoReorden: metricas.puntoReorden,
          precioUnitarioEstimado: targetItem.precioVentaGL * 5 * 0.7 || 320000,
        },
      ],
      observacionesCompras: 'Generada desde el Tablero de Alertas de Stock & Reorden.',
    });

    setRequisiciones(getRequisicionesCompra());
    setIsQuickReqModalOpen(false);
    showToast(`Requisición ${nueva.consecutivo} creada con éxito`);
  };

  // -------------------------------------------------------------
  // ACCIÓN: REGISTRAR PROVEEDOR
  // -------------------------------------------------------------
  const handleCreateProvSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvForm.razonSocial.trim() || !newProvForm.nit.trim()) return;

    crearProveedorCorp(newProvForm);
    setProveedores(getProveedoresCorp());
    setIsNewProvModalOpen(false);
    showToast(`Proveedor ${newProvForm.razonSocial} homologado correctamente.`);
  };

  // -------------------------------------------------------------
  // ACCIÓN: CAMBIAR ESTADO DE ORDEN DE COMPRA
  // -------------------------------------------------------------
  const handleUpdateOCStatus = (ocId: string, nuevoEstado: OrdenCompraCorp['estado']) => {
    const ocs = getOrdenesCompraCorp();
    const actualizadas = ocs.map((o) => {
      if (o.id === ocId) {
        return {
          ...o,
          estado: nuevoEstado,
          fechaEnvio: nuevoEstado === 'Enviada a Proveedor' ? new Date().toISOString().slice(0, 10) : o.fechaEnvio,
        };
      }
      return o;
    });

    saveOrdenesCompraCorp(actualizadas);
    setLocalOrdenes(actualizadas);
    if (onUpdateOrdenesCompra) {
      onUpdateOrdenesCompra(actualizadas);
    }
    showToast(`Estado de OC actualizado a "${nuevoEstado}"`);
  };

  // -------------------------------------------------------------
  // FILTRADO DINÁMICO
  // -------------------------------------------------------------
  const filteredRequisiciones = useMemo(() => {
    return requisiciones.filter((req) => {
      const matchSede = selectedSede === 'todas' || req.sedeSolicitanteId === selectedSede;
      const matchStatus = reqStatusFilter === 'todos' || req.estado === reqStatusFilter;
      const matchPriority = reqPriorityFilter === 'todos' || req.prioridad === reqPriorityFilter;
      const q = reqSearch.toLowerCase();
      const matchSearch =
        !q ||
        req.consecutivo.toLowerCase().includes(q) ||
        req.solicitanteNombre.toLowerCase().includes(q) ||
        req.motivo.toLowerCase().includes(q) ||
        req.items.some((it) => it.sku.toLowerCase().includes(q) || it.productoNombre.toLowerCase().includes(q));

      return matchSede && matchStatus && matchPriority && matchSearch;
    });
  }, [requisiciones, selectedSede, reqStatusFilter, reqPriorityFilter, reqSearch]);

  const filteredOCs = useMemo(() => {
    return localOrdenes.filter((oc) => {
      const matchSede = selectedSede === 'todas' || oc.sedeDestinoId === selectedSede;
      const matchStatus = ocStatusFilter === 'todos' || oc.estado === ocStatusFilter;
      const q = ocSearch.toLowerCase();
      const matchSearch =
        !q ||
        oc.numeroOC.toLowerCase().includes(q) ||
        oc.proveedor.toLowerCase().includes(q) ||
        (oc.numeroFacturaProveedor && oc.numeroFacturaProveedor.toLowerCase().includes(q)) ||
        oc.items.some((it) => it.sku.toLowerCase().includes(q) || it.productoNombre.toLowerCase().includes(q));

      return matchSede && matchStatus && matchSearch;
    });
  }, [localOrdenes, selectedSede, ocStatusFilter, ocSearch]);

  const filteredProveedores = useMemo(() => {
    return proveedores.filter((prov) => {
      const matchCat = provCatFilter === 'todos' || prov.categoria === provCatFilter;
      const q = provSearch.toLowerCase();
      const matchSearch =
        !q ||
        prov.razonSocial.toLowerCase().includes(q) ||
        prov.nit.toLowerCase().includes(q) ||
        prov.contactoNombre.toLowerCase().includes(q) ||
        prov.ciudad.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [proveedores, provCatFilter, provSearch]);

  const filteredAlertas = useMemo(() => {
    return stockSaludList.filter((itemSalud) => {
      const matchNivel = alertaNivelFilter === 'todos' || itemSalud.nivelAlerta === alertaNivelFilter;
      const q = alertaSearch.toLowerCase();
      const matchSearch =
        !q ||
        itemSalud.item.sku.toLowerCase().includes(q) ||
        itemSalud.item.nombre.toLowerCase().includes(q) ||
        (itemSalud.item.color && itemSalud.item.color.toLowerCase().includes(q));

      return matchNivel && matchSearch;
    });
  }, [stockSaludList, alertaNivelFilter, alertaSearch]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Notificación Toast interna */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[1200] max-w-md bg-[#001D3D] text-white px-4 py-3 rounded-xl shadow-2xl border border-cyan-500/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          CABECERA PRINCIPAL: TÍTULO INSTITUCIONAL + SUB-PESTAÑAS + SELECTOR DE SEDE
      ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#001D3D] via-[#002D5C] to-[#0A192F] text-amber-300 flex items-center justify-center shrink-0 shadow-sm border border-amber-400/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Compras & Abastecimiento Estratégico
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300/60 uppercase">
                  Cadena de Suministro NTC
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Gestión de requisiciones de bodega, emisión de OCs a proveedores homologados y reabastecimiento en tiempo real.
              </p>
            </div>
          </div>

          {/* Selector de Sede CEDI */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-900" />
              <span>Sede:</span>
            </span>
            <select
              value={selectedSede}
              onChange={(e) => onChangeSede && onChangeSede(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer shadow-2xs"
            >
              <option value="todas">🏢 Todas las Sedes / Consolidado Nacional</option>
              {SEDES_CEDI_CONFIG.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NAVEGACIÓN POR SUB-PESTAÑAS */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-3 pt-3 border-t border-slate-200 overflow-x-auto no-scrollbar">
          {/* Sub-pestaña 1: Requisiciones */}
          <button
            type="button"
            onClick={() => onChangeSubTab('requisiciones')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'requisiciones'
                ? 'bg-[#001D3D] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-cyan-300" />
            <span>1. Requisiciones de Bodega</span>
            {statsRequisiciones.pendientes > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                {statsRequisiciones.pendientes}
              </span>
            )}
          </button>

          {/* Sub-pestaña 2: Órdenes de Compra */}
          <button
            type="button"
            onClick={() => onChangeSubTab('ordenes_compra')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'ordenes_compra'
                ? 'bg-[#001D3D] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-300" />
            <span>2. Órdenes de Compra (OC)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-slate-200 text-slate-800">
              {statsOCs.total}
            </span>
          </button>

          {/* Sub-pestaña 3: Directorio de Proveedores */}
          <button
            type="button"
            onClick={() => onChangeSubTab('proveedores')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'proveedores'
                ? 'bg-[#001D3D] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-300" />
            <span>3. Directorio de Proveedores</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-slate-200 text-slate-800">
              {proveedores.length}
            </span>
          </button>

          {/* Sub-pestaña 4: Alertas de Stock & Reorden */}
          <button
            type="button"
            onClick={() => onChangeSubTab('alertas_stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSubTab === 'alertas_stock'
                ? 'bg-[#001D3D] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>4. Alertas de Stock & Reorden</span>
            {statsAlertas.criticos > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white">
                {statsAlertas.criticos} Críticos
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800">
                Óptimo
              </span>
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-PESTAÑA 1: REQUISICIONES DE BODEGA
      ========================================================================= */}
      {activeSubTab === 'requisiciones' && (
        <div className="space-y-3">
          {/* Tarjetas KPI Requisiciones */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Total Requisiciones</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">{statsRequisiciones.total}</span>
              <span className="text-[10px] text-slate-500 font-medium">Registradas en el sistema</span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-amber-800 block">Pendientes por Cotizar/OC</span>
              <span className="text-xl font-black text-amber-600 block mt-0.5">{statsRequisiciones.pendientes}</span>
              <span className="text-[10px] text-amber-700 font-bold">Requieren atención de Compras</span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-rose-800 block">Prioridad Crítica / Quiebre</span>
              <span className="text-xl font-black text-rose-600 block mt-0.5">{statsRequisiciones.criticas}</span>
              <span className="text-[10px] text-rose-700 font-bold">Riesgo inminente de desabastecimiento</span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-emerald-800 block">Convertidas en OC</span>
              <span className="text-xl font-black text-emerald-700 block mt-0.5">{statsRequisiciones.convertidas}</span>
              <span className="text-[10px] text-emerald-700 font-medium">En proceso de despacho por proveedor</span>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={reqSearch}
                  onChange={(e) => setReqSearch(e.target.value)}
                  placeholder="Buscar por código REQ-2026-..., solicitante, producto o SKU..."
                  className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                {reqSearch && (
                  <button
                    type="button"
                    onClick={() => setReqSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={reqStatusFilter}
                  onChange={(e) => setReqStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Convertida en OC">Convertida en OC</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="Rechazada">Rechazada</option>
                </select>

                <select
                  value={reqPriorityFilter}
                  onChange={(e) => setReqPriorityFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="todos">Todas las Prioridades</option>
                  <option value="Crítica / Quiebre Stock">Crítica / Quiebre</option>
                  <option value="Alta">Alta</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLA PRINCIPAL DE REQUISICIONES CON DESGLOSE DE STOCK */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2.5 px-3">Código & Fecha</th>
                    <th className="py-2.5 px-3">Sede & Solicitante</th>
                    <th className="py-2.5 px-3">Prioridad</th>
                    <th className="py-2.5 px-3">SKU & Desglose de Stock</th>
                    <th className="py-2.5 px-3 text-center">Cant. Solicitada</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                    <th className="py-2.5 px-3 text-right">Acción Compras</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequisiciones.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <Boxes className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600 text-xs">No hay requisiciones registradas con los filtros aplicados.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRequisiciones.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Código & Fecha */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-black text-blue-950 block text-xs">
                            {req.consecutivo}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {req.fechaSolicitud}
                          </span>
                        </td>

                        {/* 2. Sede & Solicitante */}
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                            {req.sedeSolicitanteNombre}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                            Por: {req.solicitanteNombre} ({req.solicitanteCargo})
                          </span>
                        </td>

                        {/* 3. Prioridad */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black ${
                              req.prioridad.includes('Crítica')
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : req.prioridad === 'Alta'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {req.prioridad.includes('Crítica') && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping shrink-0" />
                            )}
                            {req.prioridad}
                          </span>
                        </td>

                        {/* 4. SKU & Desglose Completo de Stock */}
                        <td className="py-2.5 px-3">
                          <div className="space-y-1.5">
                            {req.items.map((it) => {
                              const metricas = calcularMetricasStockSKU(
                                it.sku,
                                req.sedeSolicitanteId,
                                inventario,
                                localOrdenes,
                                pedidosCliente
                              );

                              return (
                                <div key={it.id} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px]">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-1.5 truncate">
                                      {it.colorHex && (
                                        <span
                                          className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                                          style={{ backgroundColor: it.colorHex }}
                                        />
                                      )}
                                      <span className="font-mono font-bold text-blue-900 text-[10px]">{it.sku}</span>
                                      <span className="font-bold text-slate-800 truncate max-w-[200px]">{it.productoNombre}</span>
                                    </div>
                                    <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-bold shrink-0">
                                      {it.presentacion}
                                    </span>
                                  </div>

                                  {/* Desglose de Stock: Físico | Reservado | En Tránsito */}
                                  <div className="flex items-center gap-2 text-[10px] pt-1 border-t border-slate-200">
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-400">Físico:</span>
                                      <strong className={`font-mono ${metricas.stockFisico <= metricas.puntoReorden ? 'text-rose-600' : 'text-emerald-700'}`}>
                                        {metricas.stockFisico} Und
                                      </strong>
                                    </div>
                                    <span className="text-slate-300">•</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-400">Reservado:</span>
                                      <strong className="font-mono text-blue-700">{metricas.stockReservado} Und</strong>
                                    </div>
                                    <span className="text-slate-300">•</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-400">En Tránsito:</span>
                                      <strong className="font-mono text-purple-700">{metricas.stockEnTransito} Und</strong>
                                    </div>
                                    <span className="text-slate-300">•</span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-400">Reorden:</span>
                                      <span className="font-mono text-slate-600">{metricas.puntoReorden}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* 5. Cantidad Solicitada */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className="font-black text-slate-900 text-sm font-sans block">
                            {req.items.reduce((acc, it) => acc + it.cantidadSolicitada, 0)}
                          </span>
                          <span className="text-[9.5px] text-slate-400">Unidades totales</span>
                        </td>

                        {/* 6. Estado */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {req.estado === 'Pendiente' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Pendiente
                            </span>
                          ) : req.estado === 'Convertida en OC' ? (
                            <div className="flex flex-col items-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Convertida en OC
                              </span>
                              {req.ordenCompraNumero && (
                                <span className="text-[9.5px] font-mono font-bold text-blue-900 mt-0.5">
                                  {req.ordenCompraNumero}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {req.estado}
                            </span>
                          )}
                        </td>

                        {/* 7. Acción Compras */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {req.estado === 'Pendiente' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenConvertModal(req)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-xs hover:shadow-sm cursor-pointer transition-all active:scale-95"
                                title="Consolidar y generar Orden de Compra oficial"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>+ Convertir en OC</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedReqForDetail(req);
                                  setIsDetailModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                                <span>Ver Detalle</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-PESTAÑA 2: ÓRDENES DE COMPRA (OC)
      ========================================================================= */}
      {activeSubTab === 'ordenes_compra' && (
        <div className="space-y-3">
          {/* Tarjetas KPI Órdenes de Compra */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Total OCs Emitidas</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">{statsOCs.total}</span>
              <span className="text-[10px] text-slate-500 font-medium">Histórico y activas</span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-blue-200 bg-blue-50/30 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-blue-800 block">En Tránsito a Bodega</span>
              <span className="text-xl font-black text-blue-700 block mt-0.5">{statsOCs.enTransito}</span>
              <span className="text-[10px] text-blue-700 font-bold">Despachadas por proveedor</span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-amber-800 block">Por Recibir en CEDI</span>
              <span className="text-xl font-black text-amber-600 block mt-0.5">{statsOCs.pendientesRecibo}</span>
              <span className="text-[10px] text-amber-700 font-medium">Pendientes de corroboración física</span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-emerald-800 block">Valor Comprometido</span>
              <span className="text-lg sm:text-xl font-black text-emerald-700 block mt-0.5 font-mono">
                ${statsOCs.totalValorCOP.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-700 font-medium">COP Facturado / Estimado</span>
            </div>
          </div>

          {/* Filtros OC */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={ocSearch}
                onChange={(e) => setOcSearch(e.target.value)}
                placeholder="Buscar por OC-2026-..., proveedor, factura o SKU..."
                className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={ocStatusFilter}
                onChange={(e) => setOcStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="Borrador">Borrador</option>
                <option value="Enviada a Proveedor">Enviada a Proveedor</option>
                <option value="En Tránsito">En Tránsito</option>
                <option value="Pendiente Recibo">Pendiente Recibo</option>
                <option value="Recibido Conforme">Recibido Conforme</option>
              </select>
            </div>
          </div>

          {/* TABLA DE ÓRDENES DE COMPRA */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2.5 px-3">Número OC & Fecha</th>
                    <th className="py-2.5 px-3">Proveedor Homologado</th>
                    <th className="py-2.5 px-3">CEDI Destino</th>
                    <th className="py-2.5 px-3">Items & Unidades</th>
                    <th className="py-2.5 px-3 text-right">Total COP</th>
                    <th className="py-2.5 px-3 text-center">Estado OC</th>
                    <th className="py-2.5 px-3 text-right">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOCs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-slate-600 text-xs">No hay órdenes de compra registradas con este filtro.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredOCs.map((oc) => (
                      <tr key={oc.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-black text-blue-950 block text-xs">{oc.numeroOC}</span>
                          <span className="text-[10px] text-slate-400">Emisión: {oc.fechaEmision}</span>
                          {oc.requisicionOrigenConsecutivo && (
                            <span className="text-[9.5px] text-cyan-800 font-mono block mt-0.5">
                              Orig: {oc.requisicionOrigenConsecutivo}
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <strong className="text-slate-900 block font-bold text-xs truncate max-w-[200px]">
                            {oc.proveedor}
                          </strong>
                          {oc.proveedorNit && (
                            <span className="text-[10px] text-slate-500 font-mono block">NIT: {oc.proveedorNit}</span>
                          )}
                          {oc.numeroFacturaProveedor && (
                            <span className="text-[9.5px] text-slate-400 block">Fac: {oc.numeroFacturaProveedor}</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-800 block text-xs truncate max-w-[170px]">
                            {oc.sedeDestinoNombre}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Llegada Est: {oc.fechaEstimadaLlegada}
                          </span>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block text-xs">
                            {oc.items.length} Referencias ({oc.totalUnidades || oc.items.reduce((s, i) => s + i.cantidadEsperada, 0)} Unds)
                          </span>
                          <span className="text-[10px] text-slate-500 truncate block max-w-[200px]">
                            {oc.items.map((i) => i.sku).join(', ')}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span className="font-mono font-black text-slate-900 text-xs block">
                            ${Number(oc.totalEstimadoCOP || 0).toLocaleString()}
                          </span>
                          <span className="text-[9.5px] text-slate-400 block">{oc.condicionPago || 'Crédito 30d'}</span>
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              oc.estado === 'Recibido Conforme'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : oc.estado === 'En Tránsito'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : oc.estado === 'Enviada a Proveedor'
                                ? 'bg-cyan-100 text-cyan-800 border border-cyan-300'
                                : oc.estado === 'Borrador'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {oc.estado}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {oc.estado === 'Borrador' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOCStatus(oc.id, 'Enviada a Proveedor')}
                                className="px-2 py-1 rounded bg-blue-900 hover:bg-blue-800 text-white font-bold text-[10px] cursor-pointer"
                              >
                                Enviar
                              </button>
                            )}
                            {oc.estado === 'Enviada a Proveedor' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateOCStatus(oc.id, 'En Tránsito')}
                                className="px-2 py-1 rounded bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-[10px] cursor-pointer flex items-center gap-1"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Marcar Tránsito</span>
                              </button>
                            )}
                            {(oc.estado === 'En Tránsito' || oc.estado === 'Pendiente Recibo') && onNavigateToRecepcionBodega && (
                              <button
                                type="button"
                                onClick={() => onNavigateToRecepcionBodega(oc.numeroOC)}
                                className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                title="Ir a la pestaña de Recepción Física en Logística"
                              >
                                <Boxes className="w-3 h-3" />
                                <span>Recibir en CEDI</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-PESTAÑA 3: DIRECTORIO DE PROVEEDORES
      ========================================================================= */}
      {activeSubTab === 'proveedores' && (
        <div className="space-y-3">
          {/* Barra de Filtros y Botón Nuevo Proveedor */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={provSearch}
                onChange={(e) => setProvSearch(e.target.value)}
                placeholder="Buscar proveedor por razón social, NIT, contacto o ciudad..."
                className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={provCatFilter}
                onChange={(e) => setProvCatFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="todos">Todas las Categorías</option>
                <option value="Pinturas Base & Esmaltes">Pinturas Base & Esmaltes</option>
                <option value="Resinas & Solventes">Resinas & Solventes</option>
                <option value="Envases & Empaques">Envases & Empaques</option>
                <option value="Herramientas & Brochas">Herramientas & Brochas</option>
                <option value="Pigmentos & Colorantes">Pigmentos & Colorantes</option>
              </select>

              <button
                type="button"
                onClick={() => setIsNewProvModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#001D3D] hover:bg-[#002D5C] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-300" />
                <span>+ Registrar Proveedor</span>
              </button>
            </div>
          </div>

          {/* TARJETAS DE PROVEEDORES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProveedores.map((prov) => (
              <div
                key={prov.id}
                className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:shadow-xs transition-all space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-black flex items-center justify-center text-xs">
                        {prov.razonSocial.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-xs leading-snug">{prov.razonSocial}</h3>
                        <span className="text-[10px] text-slate-500 font-mono">NIT: {prov.nit}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-50 text-cyan-800 border border-cyan-200">
                      {prov.categoria}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">
                    {prov.observaciones || 'Proveedor homologado certificado bajo estándares NTC y SGC.'}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1 text-[10.5px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Condición Comercial:</span>
                      <strong className="text-slate-800">{prov.condicionPago}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tiempo Entrega SLA:</span>
                      <strong className="text-blue-900 font-mono">{prov.tiempoEntregaDiasSLA} días hábiles</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cumplimiento Histórico:</span>
                      <strong className="text-emerald-700 font-mono">{prov.calificacionSLA}%</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Contacto:</span>
                      <span className="text-slate-700 font-medium truncate max-w-[150px]">{prov.contactoNombre}</span>
                    </div>
                  </div>

                  {/* Certificaciones */}
                  {prov.certificaciones && prov.certificaciones.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap mt-2 pt-2 border-t border-slate-100">
                      {prov.certificaciones.map((c) => (
                        <span key={c} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[9px] font-bold">
                          ✓ {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {prov.ciudad}
                  </span>
                  <a
                    href={`mailto:${prov.email}`}
                    className="text-cyan-700 hover:text-cyan-800 font-bold flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Contactar</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-PESTAÑA 4: ALERTAS DE STOCK & REORDEN
      ========================================================================= */}
      {activeSubTab === 'alertas_stock' && (
        <div className="space-y-3">
          {/* Tarjetas de Salud de Stock */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <div
              onClick={() => setAlertaNivelFilter(alertaNivelFilter === 'critico' ? 'todos' : 'critico')}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                statsAlertas.criticos > 0
                  ? 'bg-rose-50 border-rose-300 shadow-xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-rose-800">Crítico / Quiebre Inminente</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <span className="text-2xl font-black text-rose-600 block mt-0.5">{statsAlertas.criticos}</span>
              <span className="text-[10px] text-rose-700 font-bold">Stock ≤ 35% del mínimo de seguridad</span>
            </div>

            <div
              onClick={() => setAlertaNivelFilter(alertaNivelFilter === 'reorden' ? 'todos' : 'reorden')}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                statsAlertas.reorden > 0
                  ? 'bg-amber-50 border-amber-300 shadow-xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <span className="text-[10px] font-black uppercase text-amber-800 block">En Punto de Reorden</span>
              <span className="text-2xl font-black text-amber-600 block mt-0.5">{statsAlertas.reorden}</span>
              <span className="text-[10px] text-amber-700 font-bold">Stock ≤ Nivel de reposición sugerido</span>
            </div>

            <div
              onClick={() => setAlertaNivelFilter(alertaNivelFilter === 'optimo' ? 'todos' : 'optimo')}
              className="bg-white p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-all"
            >
              <span className="text-[10px] font-black uppercase text-emerald-800 block">Existencias Óptimas</span>
              <span className="text-2xl font-black text-emerald-700 block mt-0.5">{statsAlertas.optimos}</span>
              <span className="text-[10px] text-emerald-700 font-medium">Capacidad suficiente de despacho</span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 block">Inversión Sugerida Reorden</span>
              <span className="text-xl font-black text-blue-950 block mt-0.5 font-mono">
                ${statsAlertas.deficitInversion.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Para restablecer stock óptimo CEDI</span>
            </div>
          </div>

          {/* Filtros Alertas */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={alertaSearch}
                onChange={(e) => setAlertaSearch(e.target.value)}
                placeholder="Buscar SKU en alerta, color, presentación..."
                className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={alertaNivelFilter}
                onChange={(e) => setAlertaNivelFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="todos">Todos los Niveles</option>
                <option value="critico">Solo Críticos (Rojo)</option>
                <option value="reorden">En Reorden (Amarillo)</option>
                <option value="optimo">Óptimos (Verde)</option>
              </select>
            </div>
          </div>

          {/* TABLA DE SALUD Y REABASTECIMIENTO RÁPIDO */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2.5 px-3">Estado Urgencia</th>
                    <th className="py-2.5 px-3">SKU & Referencia</th>
                    <th className="py-2.5 px-3 text-center">Stock Físico</th>
                    <th className="py-2.5 px-3 text-center">Reservado</th>
                    <th className="py-2.5 px-3 text-center">En Tránsito</th>
                    <th className="py-2.5 px-3 text-center">Punto Reorden</th>
                    <th className="py-2.5 px-3 text-center">Sugerido Reorden</th>
                    <th className="py-2.5 px-3 text-right">Acción Rápida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAlertas.map((s) => {
                    const isCrit = s.nivelAlerta === 'critico';
                    const isReord = s.nivelAlerta === 'reorden';

                    return (
                      <tr
                        key={s.item.id}
                        className={`transition-colors ${
                          isCrit ? 'bg-rose-50/40 hover:bg-rose-50/80' : isReord ? 'bg-amber-50/30 hover:bg-amber-50/70' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {isCrit ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
                              CRÍTICO
                            </span>
                          ) : isReord ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              REORDEN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              ✓ Óptimo
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            {s.item.colorHex && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: s.item.colorHex }}
                              />
                            )}
                            <div>
                              <span className="font-mono font-bold text-blue-950 block text-xs">{s.item.sku}</span>
                              <strong className="text-slate-900 block font-bold text-[11.5px] truncate max-w-[240px]">
                                {s.item.nombre}
                              </strong>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {s.item.presentacion || 'Cuñete'} • {s.item.categoria}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono font-black text-xs">
                          <span className={isCrit ? 'text-rose-600' : isReord ? 'text-amber-700' : 'text-slate-900'}>
                            {s.stockFisico} Und
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono font-bold text-xs text-blue-700">
                          {s.stockReservado} Und
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono font-bold text-xs text-purple-700">
                          {s.stockEnTransito} Und
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono text-slate-600 text-xs">
                          {s.puntoReorden} Und
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-950 font-black text-xs font-mono">
                            +{s.sugeridoReorden} Und
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenQuickReq(s.item, s.sugeridoReorden)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs cursor-pointer transition-all ${
                              isCrit
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : 'bg-[#001D3D] hover:bg-[#002D5C] text-white'
                            }`}
                            title="Emitir solicitud de reabastecimiento inmediata"
                          >
                            <Send className="w-3 h-3 text-cyan-300" />
                            <span>+ Solicitar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONVERTIR REQUISICIÓN EN ORDEN DE COMPRA (OC)
      ========================================================================= */}
      {isConvertModalOpen && selectedReqForOC && (
        <div className="fixed inset-0 z-[1300] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Cabecera del Modal */}
            <div className="bg-gradient-to-r from-[#001D3D] via-[#002D5C] to-[#0A192F] px-4 py-3 sm:px-6 sm:py-4 text-white flex items-center justify-between border-b-2 border-amber-400">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-400 text-slate-950 font-black">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base tracking-tight">
                    Convertir Requisición en Orden de Compra (OC)
                  </h3>
                  <span className="text-xs text-amber-300 font-mono">
                    Origen: {selectedReqForOC.consecutivo} • {selectedReqForOC.sedeSolicitanteNombre}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConvertModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleConfirmConvertOC} className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Asignación de Proveedor y Datos de OC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proveedor Homologado Asignado *</label>
                  <select
                    value={convertForm.proveedorId}
                    onChange={(e) => {
                      const p = proveedores.find((prov) => prov.id === e.target.value);
                      setConvertForm({
                        ...convertForm,
                        proveedorId: e.target.value,
                        proveedorNombre: p?.razonSocial || '',
                        proveedorNit: p?.nit || '',
                        condicionPago: p?.condicionPago || convertForm.condicionPago,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-cyan-500"
                    required
                  >
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.razonSocial} (SLA: {p.tiempoEntregaDiasSLA}d)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Consecutivo Orden de Compra *</label>
                  <input
                    type="text"
                    value={convertForm.numeroOC}
                    onChange={(e) => setConvertForm({ ...convertForm, numeroOC: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-blue-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Estimada de Llegada al CEDI *</label>
                  <input
                    type="date"
                    value={convertForm.fechaEstimadaLlegada}
                    onChange={(e) => setConvertForm({ ...convertForm, fechaEstimadaLlegada: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Condición de Pago Acordada</label>
                  <select
                    value={convertForm.condicionPago}
                    onChange={(e) => setConvertForm({ ...convertForm, condicionPago: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  >
                    <option value="Contado">Contado</option>
                    <option value="Crédito 15 días">Crédito 15 días</option>
                    <option value="Crédito 30 días">Crédito 30 días</option>
                    <option value="Crédito 45 días">Crédito 45 días</option>
                    <option value="Crédito 60 días">Crédito 60 días</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado Inicial de la OC *</label>
                  <select
                    value={convertForm.estado}
                    onChange={(e) => setConvertForm({ ...convertForm, estado: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold text-slate-900"
                  >
                    <option value="Enviada a Proveedor">Enviada a Proveedor</option>
                    <option value="En Tránsito">En Tránsito</option>
                    <option value="Borrador">Borrador</option>
                    <option value="Pendiente Recibo">Pendiente Recibo en Bodega</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">CEDI de Destino y Descargue</label>
                  <select
                    value={convertForm.sedeDestinoId}
                    onChange={(e) => setConvertForm({ ...convertForm, sedeDestinoId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  >
                    {SEDES_CEDI_CONFIG.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items a consolidar con ajuste de precio unitario */}
              <div className="pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800 block mb-2">
                  Items Requeridos (Consolidación Oficial):
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedReqForOC.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <span className="font-mono font-bold text-blue-900 text-[11px] block">{it.sku}</span>
                        <strong className="text-slate-900 text-xs block truncate">{it.productoNombre}</strong>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {it.presentacion} • Solicitado: {it.cantidadSolicitada} Unds
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-slate-500">Precio Unit. COP:</span>
                        <input
                          type="number"
                          value={convertForm.itemsPrecios[it.sku] ?? (it.precioUnitarioEstimado || 340000)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setConvertForm({
                              ...convertForm,
                              itemsPrecios: {
                                ...convertForm.itemsPrecios,
                                [it.sku]: val,
                              },
                            });
                          }}
                          className="w-28 px-2 py-1 rounded bg-white border border-slate-300 font-mono font-bold text-right text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Notas / Instrucciones de Despacho</label>
                <textarea
                  value={convertForm.observaciones}
                  onChange={(e) => setConvertForm({ ...convertForm, observaciones: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  placeholder="Instrucciones para el transportador o proveedor..."
                />
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsConvertModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Emitir Orden de Compra Oficial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REGISTRAR PROVEEDOR HOMOLOGADO
      ========================================================================= */}
      {isNewProvModalOpen && (
        <div className="fixed inset-0 z-[1300] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#001D3D] px-4 py-3 sm:px-6 sm:py-4 text-white flex items-center justify-between border-b-2 border-cyan-400">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-300" />
                <h3 className="font-black text-sm sm:text-base">Registrar Nuevo Proveedor Homologado</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProvModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProvSubmit} className="p-4 sm:p-6 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Razón Social *</label>
                  <input
                    type="text"
                    value={newProvForm.razonSocial}
                    onChange={(e) => setNewProvForm({ ...newProvForm, razonSocial: e.target.value })}
                    placeholder="Ej: Pinturas & Recubrimientos Andina S.A."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIT / Identificación Tributaria *</label>
                  <input
                    type="text"
                    value={newProvForm.nit}
                    onChange={(e) => setNewProvForm({ ...newProvForm, nit: e.target.value })}
                    placeholder="Ej: 900.123.456-7"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría de Materia Prima *</label>
                  <select
                    value={newProvForm.categoria}
                    onChange={(e) => setNewProvForm({ ...newProvForm, categoria: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  >
                    <option value="Pinturas Base & Esmaltes">Pinturas Base & Esmaltes</option>
                    <option value="Resinas & Solventes">Resinas & Solventes</option>
                    <option value="Envases & Empaques">Envases & Empaques</option>
                    <option value="Herramientas & Brochas">Herramientas & Brochas</option>
                    <option value="Pigmentos & Colorantes">Pigmentos & Colorantes</option>
                    <option value="Químicos Especiales">Químicos Especiales</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Condición de Pago Acordada</label>
                  <select
                    value={newProvForm.condicionPago}
                    onChange={(e) => setNewProvForm({ ...newProvForm, condicionPago: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  >
                    <option value="Contado">Contado</option>
                    <option value="Crédito 15 días">Crédito 15 días</option>
                    <option value="Crédito 30 días">Crédito 30 días</option>
                    <option value="Crédito 45 días">Crédito 45 días</option>
                    <option value="Crédito 60 días">Crédito 60 días</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiempo de Entrega SLA (Días)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={newProvForm.tiempoEntregaDiasSLA}
                    onChange={(e) => setNewProvForm({ ...newProvForm, tiempoEntregaDiasSLA: Number(e.target.value) || 3 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ciudad Principal</label>
                  <input
                    type="text"
                    value={newProvForm.ciudad}
                    onChange={(e) => setNewProvForm({ ...newProvForm, ciudad: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre de Contacto Comercial</label>
                  <input
                    type="text"
                    value={newProvForm.contactoNombre}
                    onChange={(e) => setNewProvForm({ ...newProvForm, contactoNombre: e.target.value })}
                    placeholder="Ej: Lic. Mauricio Gómez"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico Oficial</label>
                  <input
                    type="email"
                    value={newProvForm.email}
                    onChange={(e) => setNewProvForm({ ...newProvForm, email: e.target.value })}
                    placeholder="ventas@proveedor.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones / Especificaciones Técnicas</label>
                <textarea
                  value={newProvForm.observaciones}
                  onChange={(e) => setNewProvForm({ ...newProvForm, observaciones: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  placeholder="Detalles sobre capacidad de planta, certificaciones ISO, etc."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewProvModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#001D3D] hover:bg-[#002D5C] text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-300" />
                  <span>Guardar Proveedor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EMISIÓN RÁPIDA DE REQUISICIÓN DESDE ALERTA DE STOCK
      ========================================================================= */}
      {isQuickReqModalOpen && (
        <div className="fixed inset-0 z-[1300] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-gradient-to-r from-rose-900 to-[#001D3D] px-4 py-3 sm:px-6 sm:py-4 text-white flex items-center justify-between border-b-2 border-rose-400">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <h3 className="font-black text-sm sm:text-base">Requisición Rápida de Reabastecimiento</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickReqModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmQuickReq} className="p-4 sm:p-6 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">SKU a Reabastecer *</label>
                <select
                  value={quickReqForm.sku}
                  onChange={(e) => setQuickReqForm({ ...quickReqForm, sku: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
                  required
                >
                  {inventario.map((i) => (
                    <option key={i.id} value={i.sku}>
                      [{i.sku}] {i.nombre} ({i.presentacion || 'Cuñete'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cantidad a Solicitar (Unidades) *</label>
                  <input
                    type="number"
                    min={1}
                    value={quickReqForm.cantidad}
                    onChange={(e) => setQuickReqForm({ ...quickReqForm, cantidad: Number(e.target.value) || 10 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-base text-blue-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nivel de Prioridad *</label>
                  <select
                    value={quickReqForm.prioridad}
                    onChange={(e) => setQuickReqForm({ ...quickReqForm, prioridad: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica / Quiebre Stock">Crítica / Quiebre Stock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sede CEDI Solicitante</label>
                <select
                  value={quickReqForm.sedeId}
                  onChange={(e) => setQuickReqForm({ ...quickReqForm, sedeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                >
                  {SEDES_CEDI_CONFIG.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Justificación de la Solicitud</label>
                <textarea
                  value={quickReqForm.motivo}
                  onChange={(e) => setQuickReqForm({ ...quickReqForm, motivo: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  placeholder="Explique el motivo del pedido para Compras..."
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsQuickReqModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar a Compras</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DETALLE DE REQUISICIÓN CONVERTIDA
      ========================================================================= */}
      {isDetailModalOpen && selectedReqForDetail && (
        <div className="fixed inset-0 z-[1300] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Detalle de Requisición {selectedReqForDetail.consecutivo}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Sede: {selectedReqForDetail.sedeSolicitanteNombre}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-bold">Estado:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                  {selectedReqForDetail.estado}
                </span>
              </div>
              {selectedReqForDetail.ordenCompraNumero && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-blue-900 font-bold">Orden de Compra Asociada:</span>
                  <span className="font-mono font-black text-blue-900 text-xs">
                    {selectedReqForDetail.ordenCompraNumero}
                  </span>
                </div>
              )}
              <div>
                <span className="font-bold text-slate-700 block mb-1">Motivo / Justificación:</span>
                <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  {selectedReqForDetail.motivo}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">Items Solicitados:</span>
                <div className="space-y-1">
                  {selectedReqForDetail.items.map((it) => (
                    <div key={it.id} className="p-2 rounded bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-blue-900">{it.sku}</span>
                        <span className="text-slate-800 block">{it.productoNombre}</span>
                      </div>
                      <span className="font-black text-slate-900">{it.cantidadSolicitada} Unds</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
