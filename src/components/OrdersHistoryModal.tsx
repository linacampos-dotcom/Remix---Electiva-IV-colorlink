import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { COLORLINKOrder, UserSession } from '../types';
import { 
  X, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Truck, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Download
} from 'lucide-react';

interface OrdersHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: COLORLINKOrder[];
  onSelectOrder: (order: COLORLINKOrder) => void;
  onUpdateStatus: (id: string, newStatus: COLORLINKOrder['estado']) => void;
  userSession?: UserSession | null;
}

export const OrdersHistoryModal: React.FC<OrdersHistoryModalProps> = ({
  isOpen,
  onClose,
  orders,
  onSelectOrder,
  onUpdateStatus,
  userSession,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const isCorporateOrAdmin = userSession?.isCorporate || userSession?.userType === 'funcionario';

  // Si el usuario es un cliente autenticado, filtra automáticamente sus órdenes
  const baseOrders = useMemo(() => {
    if (isCorporateOrAdmin || !userSession?.isLoggedIn) return orders;

    const userDoc = (userSession.documento || (userSession as any).cedula || '').replace(/[\.\-\s]/g, '').toLowerCase();
    const userEmail = (userSession.email || '').trim().toLowerCase();

    return orders.filter((o) => {
      const id = String(o.id || '').toLowerCase();
      const num = String(o.numeroOrden || '').toLowerCase();
      const name = String(o.customerName || o.form?.nombre_razon_social || '').toLowerCase();
      const doc = String(o.customerDocument || o.form?.documento || '').replace(/[\.\-\s]/g, '');

      if (id === 'ord-init-1' || id === 'ord-init-2') return false;
      if (id.includes('a93ec3fe') || num.includes('a93ec3fe') || num.includes('sb-a93ec3fe')) return false;
      if (name.includes('sara ramirez') && (doc.includes('1028727371') || doc === '')) return false;
      if (num.includes('sb-') && name.includes('sara')) return false;
      if (o.form?.nombre_razon_social === 'Constructora Bolívar S.A.' || o.form?.nombre_razon_social === 'Clínica Las Américas') return false;

      const oDoc = (o.customerDocument || o.form?.documento || '').replace(/[\.\-\s]/g, '').toLowerCase();
      const oEmail = (o.customerEmail || o.form?.correo_electronico || '').trim().toLowerCase();
      const docMatch = Boolean(userDoc && oDoc && oDoc === userDoc);
      const emailMatch = Boolean(userEmail && oEmail && oEmail === userEmail);
      return docMatch || emailMatch;
    });
  }, [orders, userSession, isCorporateOrAdmin]);

  if (!isOpen) return null;

  const filteredOrders = baseOrders.filter((order) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      order.numeroOrden.toLowerCase().includes(q) ||
      (order.customerDocument && order.customerDocument.toLowerCase().includes(q)) ||
      order.form.nombre_razon_social.toLowerCase().includes(q) ||
      order.form.documento.toLowerCase().includes(q) ||
      order.form.ciudad.toLowerCase().includes(q) ||
      order.form.tipo_obra.toLowerCase().includes(q);

    const matchesPriority = 
      filterPriority === 'all' || order.calculo.prioridad === filterPriority;

    return matchesSearch && matchesPriority;
  });

  const getStatusBadge = (status: COLORLINKOrder['estado']) => {
    switch (status) {
      case 'Listo para Despacho':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'Despachado':
      case 'Entregado':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'En Producción':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-[#003366] to-teal-800 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold">Historial de Órdenes de Producción</h2>
            <p className="text-xs text-sky-100/90">
              Registro de órdenes generadas para producción y despacho en bodega
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por cliente, orden, ciudad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-600">Prioridad:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white text-slate-700 shadow-2xs"
            >
              <option value="all">Todas</option>
              <option value="Alta">Alta (Urgente)</option>
              <option value="Normal">Normal</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold text-slate-700">No se encontraron órdenes registradas</p>
              <p className="text-xs mt-1 text-slate-500">Diligencie el formulario FMV y presione "Generar y Registrar Orden".</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-teal-300 bg-white hover:bg-teal-50/10 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-lg bg-blue-900 text-white">
                      {order.numeroOrden}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(order.estado)}`}>
                      {order.estado}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      order.calculo.prioridad === 'Alta' 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      Prioridad: {order.calculo.prioridad}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-900">
                    {order.form.nombre_razon_social}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {order.form.ciudad}
                    </span>
                    <span>Área: <strong>{order.form.area_m2} m²</strong></span>
                    <span>Pintura: <strong className="text-blue-900">{order.calculo.galonesPintura} GL</strong></span>
                    {order.calculo.galonesSellador > 0 && (
                      <span>Sellador: <strong className="text-teal-700">{order.calculo.galonesSellador} GL</strong></span>
                    )}
                    <span className="text-slate-400">Entrega: {order.form.fecha_requerida}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={order.estado}
                    onChange={(e) => onUpdateStatus(order.id, e.target.value as COLORLINKOrder['estado'])}
                    className="text-xs rounded-xl border border-slate-300 px-2.5 py-1.5 bg-white text-slate-700 shadow-2xs"
                  >
                    <option value="Pendiente Alistamiento">Pendiente Alistamiento</option>
                    <option value="En Producción">En Producción</option>
                    <option value="Listo para Despacho">Listo para Despacho</option>
                    <option value="Despachado">Despachado</option>
                    <option value="Entregado">Entregado</option>
                  </select>

                  <button
                    onClick={() => {
                      onSelectOrder(order);
                      onClose();
                    }}
                    className="p-2 rounded-xl text-blue-900 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                    title="Cargar esta orden en el panel principal"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Total órdenes: {orders.length}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer shadow-2xs"
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
