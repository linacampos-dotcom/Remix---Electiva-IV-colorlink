import React, { useState } from 'react';
import { CorporateRole, UserSession, COLORLINKOrder } from '../types';
import { OmnichannelNotificationsModal } from './OmnichannelNotificationsModal';
import { GerenciaAnalyticsCharts } from './GerenciaAnalyticsCharts';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Truck, 
  HeadphonesIcon, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  Boxes, 
  Send, 
  UserCheck, 
  LogOut, 
  RefreshCw, 
  Download, 
  Filter, 
  Search, 
  BadgePercent,
  Bot
} from 'lucide-react';

interface CorporateRBACDashboardProps {
  userSession?: UserSession | null;
  onLogout: () => void;
  orders: COLORLINKOrder[];
  onUpdateOrderStatus: (id: string, newStatus: COLORLINKOrder['estado']) => void;
  onOpenOrderTracking?: (order: COLORLINKOrder) => void;
}

export const CorporateRBACDashboard: React.FC<CorporateRBACDashboardProps> = ({
  userSession,
  onLogout,
  orders,
  onUpdateOrderStatus,
  onOpenOrderTracking,
}) => {
  const [activeRole, setActiveRole] = useState<CorporateRole>(userSession?.corporateRole || 'gerencia');
  const role = activeRole;

  // Selected Order for Omni-Channel Dispatch
  const [selectedOrderForNotice, setSelectedOrderForNotice] = useState<COLORLINKOrder | null>(null);
  const [isOmniModalOpen, setIsOmniModalOpen] = useState(false);

  // Department-specific mock states & interactive actions
  // 1. Tesorería
  const [facturasEmitidas, setFacturasEmitidas] = useState([
    { id: 'FEV-98214', cliente: 'Constructora Bolívar S.A.', cufe: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', monto: 38500000, estadoDian: 'Validado DIAN', fecha: '2026-09-21' },
    { id: 'FEV-98215', cliente: 'Amarilo S.A.S.', cufe: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4', monto: 64200000, estadoDian: 'Validado DIAN', fecha: '2026-09-20' },
    { id: 'FEV-98216', cliente: 'Marval Construcciones', cufe: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb', monto: 21800000, estadoDian: 'En Proceso DIAN', fecha: '2026-09-21' },
  ]);
  const [cuposCredito, setCuposCredito] = useState([
    { constructora: 'Constructora Bolívar S.A.', cupoAprobado: 350000000, cupoUtilizado: 180000000, garantia: 'Pagaré Bancario Bancolombia', calificacion: 'AAA' },
    { constructora: 'Amarilo S.A.S.', cupoAprobado: 500000000, cupoUtilizado: 310000000, garantia: 'Póliza Seguros Bolívar', calificacion: 'AAA' },
    { constructora: 'Constructora Colpatria', cupoAprobado: 280000000, cupoUtilizado: 95000000, garantia: 'Garantía Mobiliaria', calificacion: 'AA+' },
  ]);

  // 2. Compras y Abastecimiento
  const [insumosQuimicos, setInsumosQuimicos] = useState([
    { nombre: 'Resina Acrílica 100% Pura Estirenada', proveedor: 'Dow Chemical Colombia', stockActual: '14,500 Kg', stockMinimo: '5,000 Kg', estado: 'Normal', leadTime: '4 días' },
    { nombre: 'Dióxido de Titanio TiONA 595 (Pigmento Blanco)', proveedor: 'Cristal Global / Tronox', stockActual: '2,200 Kg', stockMinimo: '3,000 Kg', estado: 'Alerta Stock', leadTime: '8 días' },
    { nombre: 'Biocida Antihongos y Antialgas de Amplio Espectro', proveedor: 'Thor Especialidades', stockActual: '850 Kg', stockMinimo: '400 Kg', estado: 'Normal', leadTime: '3 días' },
    { nombre: 'Espesante Celulósico Hidroxietil (HEC)', proveedor: 'Ashland Colombia', stockActual: '1,100 Kg', stockMinimo: '600 Kg', estado: 'Normal', leadTime: '5 días' },
  ]);

  // 3. Logística y Bodega
  const [despachosEnCurso, setDespachosEnCurso] = useState([
    { id: 'DESP-401', destino: 'Bogotá - Obra Torres de San Telmo', vehiculo: 'Camión Chevrolet NHR (WLL-420)', cuñetes: 45, conductor: 'Álvaro Patiño', fase: 'En Ruta', horaSalida: '07:30 AM' },
    { id: 'DESP-402', destino: 'Medellín - Proyecto Ciudad del Río', vehiculo: 'Turbo Hino Dutro (SKL-102)', cuñetes: 60, conductor: 'Carlos E. Montoya', fase: 'En Alistamiento', horaSalida: '11:00 AM' },
    { id: 'DESP-403', destino: 'Cali - Macroproyecto Valle del Lili', vehiculo: 'Camión Isuzu FTR (TZZ-889)', cuñetes: 110, conductor: 'Javier Restrepo', fase: 'Tinturado en Máquina', horaSalida: '02:00 PM' },
  ]);

  // 4. Ventas y Comercial
  const [proyectosB2B, setProyectosB2B] = useState([
    { proyecto: 'Complejo Hospitalario San Jerónimo', constructora: 'Arquitectura & Concreto', m2: 18500, cuñetes: 240, valorCotizado: 186000000, costoEstimado: 112000000, margenPct: 39.8, probabilidad: '90%' },
    { proyecto: 'Edificio Residencial Serena del Mar', constructora: 'Novus Civitas Cartagena', m2: 9200, cuñetes: 115, valorCotizado: 89000000, costoEstimado: 54000000, margenPct: 39.3, probabilidad: '75%' },
    { proyecto: 'Centro Logístico Fontibón Fase II', constructora: 'Latinoamericana de Construcciones', m2: 26000, cuñetes: 320, valorCotizado: 245000000, costoEstimado: 154000000, margenPct: 37.1, probabilidad: '95%' },
  ]);

  // 5. SAC y PQRS
  const [pqrsCasos, setPqrsCasos] = useState([
    { radicado: 'PQRS-2026-091', constructora: 'Conconcreto', motivo: 'Solicitud de Certificado de Adherencia NTC 1335 en Obra', prioridad: 'Alta', slaHoras: 18, estado: 'En Peritaje Técnico', asesor: 'Ing. Diana Salazar' },
    { radicado: 'PQRS-2026-092', constructora: 'Amarilo', motivo: 'Ajuste de Matiz Color NCS S 1502-Y (Gris Platino)', prioridad: 'Media', slaHoras: 34, estado: 'Colorimetría Aprobada', asesor: 'Técnico Germán Arango' },
    { radicado: 'PQRS-2026-093', constructora: 'Bolívar', motivo: 'Consulta sobre compatibilidad con estuco plástico en clima húmedo', prioridad: 'Baja', slaHoras: 42, estado: 'Resuelto', asesor: 'SAC Pintuco' },
  ]);

  // Quick Action notification trigger
  const handleOpenOmniNotice = (order: COLORLINKOrder) => {
    setSelectedOrderForNotice(order);
    setIsOmniModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner: Corporate Identity & Clearance */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0033A0] text-white flex items-center justify-center font-black shadow-lg shadow-blue-600/30 border border-blue-400/30 shrink-0">
              {role === 'tesoreria' ? <DollarSign className="w-7 h-7 text-emerald-400" /> :
               role === 'compras' ? <Boxes className="w-7 h-7 text-blue-300" /> :
               role === 'logistica' ? <Truck className="w-7 h-7 text-amber-400" /> :
               role === 'ventas' ? <TrendingUp className="w-7 h-7 text-red-400" /> :
               role === 'sac' ? <HeadphonesIcon className="w-7 h-7 text-purple-400" /> :
               <Sparkles className="w-7 h-7 text-amber-300" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white">
                  Área Restringida RBAC
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Sesión Verificada con Token Seguro
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                {userSession?.departamento || (
                  role === 'tesoreria' ? 'Departamento de Tesorería y Contabilidad' :
                  role === 'compras' ? 'Departamento de Compras y Abastecimiento' :
                  role === 'logistica' ? 'Departamento de Logística y Bodega' :
                  role === 'ventas' ? 'Departamento de Ventas y Comercial' :
                  role === 'sac' ? 'Departamento de SAC y Atención al Cliente' :
                  'Gerencia General & Analytics Corporativo'
                )}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Colaborador: <strong>{userSession?.nombre || 'Funcionario Corporativo'}</strong> • {userSession?.email || 'pintuco@akzonobel.com'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (orders.length > 0) {
                  setSelectedOrderForNotice(orders[0]);
                }
                setIsOmniModalOpen(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md transition-transform hover:scale-105 flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Notificaciones Omni-Canal (SMS/Voz)</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Access Restriction Notice */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Acceso estrictamente restringido a funciones autorizadas según la Política de Gobernanza de Datos Pintuco.
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            NTC ISO 27001 • DIAN Resolución 000042
          </span>
        </div>
      </div>

      {/* Selector Rápido de Módulos Departamentales (RBAC) */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-600 px-3 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#0033A0]" />
          Áreas ERP:
        </span>
        <button
          type="button"
          id="btn-nav-gerencia"
          onClick={() => setActiveRole('gerencia')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            role === 'gerencia'
              ? 'bg-[#0033A0] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${role === 'gerencia' ? 'text-amber-300' : 'text-slate-400'}`} />
          <span>Gerencia / Analytics</span>
        </button>
        <button
          type="button"
          id="btn-nav-tesoreria"
          onClick={() => setActiveRole('tesoreria')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            role === 'tesoreria'
              ? 'bg-[#0033A0] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className={`w-3.5 h-3.5 ${role === 'tesoreria' ? 'text-emerald-300' : 'text-slate-400'}`} />
          <span>Tesorería & DIAN</span>
        </button>
        <button
          type="button"
          id="btn-nav-ventas"
          onClick={() => setActiveRole('ventas')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            role === 'ventas'
              ? 'bg-[#0033A0] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className={`w-3.5 h-3.5 ${role === 'ventas' ? 'text-red-300' : 'text-slate-400'}`} />
          <span>Ventas & Obras B2B</span>
        </button>
        <button
          type="button"
          id="btn-nav-logistica"
          onClick={() => setActiveRole('logistica')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            role === 'logistica'
              ? 'bg-[#0033A0] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className={`w-3.5 h-3.5 ${role === 'logistica' ? 'text-amber-300' : 'text-slate-400'}`} />
          <span>Logística & Bodega</span>
        </button>
        <button
          type="button"
          id="btn-nav-compras"
          onClick={() => setActiveRole('compras')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            role === 'compras'
              ? 'bg-[#0033A0] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className={`w-3.5 h-3.5 ${role === 'compras' ? 'text-blue-300' : 'text-slate-400'}`} />
          <span>Compras & Insumos</span>
        </button>
        <button
          type="button"
          id="btn-nav-sac"
          onClick={() => setActiveRole('sac')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            role === 'sac'
              ? 'bg-[#0033A0] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HeadphonesIcon className={`w-3.5 h-3.5 ${role === 'sac' ? 'text-purple-300' : 'text-slate-400'}`} />
          <span>SAC & PQRS</span>
        </button>
      </div>

      {/* =====================================================================
          1. TESORERÍA Y CONTABILIDAD
      ===================================================================== */}
      {role === 'tesoreria' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Recaudo Mensual COP</span>
              <span className="text-2xl font-black text-slate-900">$1,485,200,000</span>
              <span className="text-xs font-bold text-emerald-600 block mt-1">+14.2% vs mes anterior</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cartera Corriente (0-30 Días)</span>
              <span className="text-2xl font-black text-slate-900">$840,500,000</span>
              <span className="text-xs text-slate-500 block mt-1">94% al día sin mora</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Garantías Bancarias Activas</span>
              <span className="text-2xl font-black text-slate-900">$1,130,000,000</span>
              <span className="text-xs font-bold text-blue-600 block mt-1">3 Constructoras AAA</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Facturas DIAN Emitidas</span>
              <span className="text-2xl font-black text-slate-900">142 FEV</span>
              <span className="text-xs font-bold text-emerald-600 block mt-1">100% CUFE Verificados</span>
            </div>
          </div>

          {/* Facturación Electrónica DIAN Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Emisión de Facturación Electrónica de Venta (FEV) • DIAN
                </h3>
                <p className="text-xs text-slate-500">
                  Generación y validación automática de XML con código CUFE y firma digital institucional.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newFev = {
                    id: `FEV-${Math.floor(98217 + Math.random() * 50)}`,
                    cliente: 'Constructora Capital S.A.S.',
                    cufe: 'a71b83d9e847120a4b7593c28591aef0371948ba582103a4b91837492c1039d',
                    monto: 45600000,
                    estadoDian: 'Validado DIAN',
                    fecha: '2026-09-21'
                  };
                  setFacturasEmitidas([newFev, ...facturasEmitidas]);
                }}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                + Emitir FEV a DIAN
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-6">Prefijo / N°</th>
                    <th className="py-3.5 px-6">Cliente / Razón Social</th>
                    <th className="py-3.5 px-6">Código CUFE (Firma DIAN)</th>
                    <th className="py-3.5 px-6">Total COP</th>
                    <th className="py-3.5 px-6">Estado Fiscal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facturasEmitidas.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/70">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">{f.id}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">{f.cliente}</td>
                      <td className="py-4 px-6 font-mono text-[10px] text-slate-500 max-w-xs truncate" title={f.cufe}>
                        {f.cufe}
                      </td>
                      <td className="py-4 px-6 font-black text-slate-900">${f.monto.toLocaleString('es-CO')}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {f.estadoDian}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cupos de Crédito & Garantías Bancarias */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Garantías de Pago & Cupos de Crédito B2B Aprobados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cuposCredito.map((c) => (
                <div key={c.constructora} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-slate-900 text-sm">{c.constructora}</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[10px] font-bold">
                      {c.calificacion}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Cupo Total:</span>
                      <span className="font-bold text-slate-800">${c.cupoAprobado.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Cupo Utilizado:</span>
                      <span className="font-bold text-red-600">${c.cupoUtilizado.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Garantía:</span>
                      <span className="font-medium text-slate-700">{c.garantia}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#0033A0] h-full" 
                      style={{ width: `${(c.cupoUtilizado / c.cupoAprobado) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* =====================================================================
          2. COMPRAS Y ABASTECIMIENTO
      ===================================================================== */}
      {role === 'compras' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Gestión de Insumos Químicos & Materias Primas de Fabricación
                </h3>
                <p className="text-xs text-slate-500">
                  Monitoreo de tanques de emulsión acrílica, pigmentos y biocidas en megaplanta Rionegro.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  alert('Orden de Reabastecimiento de Dióxido de Titanio TiONA enviada a Cristal Global.');
                }}
                className="py-2.5 px-4 rounded-xl bg-[#0033A0] hover:bg-blue-800 text-white font-bold text-xs shadow-xs"
              >
                + Generar Orden de Compra Insumos
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-6">Materia Prima / Insumo</th>
                    <th className="py-3.5 px-6">Proveedor Certificado</th>
                    <th className="py-3.5 px-6">Stock en Tanques</th>
                    <th className="py-3.5 px-6">Tiempo de Entrega</th>
                    <th className="py-3.5 px-6">Estado</th>
                    <th className="py-3.5 px-6 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {insumosQuimicos.map((item) => (
                    <tr key={item.nombre} className="hover:bg-slate-50/70">
                      <td className="py-4 px-6 font-bold text-slate-900">{item.nombre}</td>
                      <td className="py-4 px-6 text-slate-600">{item.proveedor}</td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-800">{item.stockActual}</td>
                      <td className="py-4 px-6 text-slate-500">{item.leadTime}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.estado === 'Alerta Stock' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => alert(`Orden enviada para ${item.nombre}`)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                        >
                          Reabastecer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. LOGÍSTICA Y BODEGA
      ===================================================================== */}
      {role === 'logistica' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Control de Alistamiento, Tinturado Datacolor y Despacho de Flotas
                </h3>
                <p className="text-xs text-slate-500">
                  Seguimiento de camiones con plataforma hidráulica para entrega en obra y remisiones de transporte.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (orders.length > 0) {
                    setSelectedOrderForNotice(orders[0]);
                  }
                  setIsOmniModalOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
              >
                <Bot className="w-4 h-4" />
                <span>Emitir Notificación a Contratista</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {despachosEnCurso.map((d) => (
                <div key={d.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#0033A0] text-xs">{d.id}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                      {d.fase}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{d.destino}</h4>
                  <div className="space-y-1 text-xs text-slate-600">
                    <p><strong>Vehículo:</strong> {d.vehiculo}</p>
                    <p><strong>Carga:</strong> {d.cuñetes} Cuñetes de 5 Galones</p>
                    <p><strong>Conductor:</strong> {d.conductor}</p>
                    <p><strong>Salida:</strong> {d.horaSalida}</p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (orders.length > 0) {
                          setSelectedOrderForNotice(orders[0]);
                        }
                        setIsOmniModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      <span>Notificar por SMS / Voz IA</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. VENTAS Y COMERCIAL
      ===================================================================== */}
      {role === 'ventas' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Pipeline de Cotizaciones Activas & Análisis de Margen por Proyecto B2B
              </h3>
              <p className="text-xs text-slate-500">
                Rendimiento de cuentas clave, metros cuadrados presupuestados y margen bruto garantizado.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3.5 px-6">Proyecto Institucional</th>
                    <th className="py-3.5 px-6">Constructora</th>
                    <th className="py-3.5 px-6">Área (m²) / Cuñetes</th>
                    <th className="py-3.5 px-6">Valor Cotizado COP</th>
                    <th className="py-3.5 px-6">Margen Bruto</th>
                    <th className="py-3.5 px-6">Probabilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proyectosB2B.map((p) => (
                    <tr key={p.proyecto} className="hover:bg-slate-50/70">
                      <td className="py-4 px-6 font-bold text-slate-900">{p.proyecto}</td>
                      <td className="py-4 px-6 text-slate-700">{p.constructora}</td>
                      <td className="py-4 px-6 font-mono text-slate-600">{p.m2.toLocaleString()} m² ({p.cuñetes} cuñetes)</td>
                      <td className="py-4 px-6 font-black text-slate-900">${p.valorCotizado.toLocaleString('es-CO')}</td>
                      <td className="py-4 px-6">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {p.margenPct}%
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-blue-700">{p.probabilidad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. SAC Y ATENCIÓN AL CLIENTE
      ===================================================================== */}
      {role === 'sac' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Gestión de PQRS & Peritajes Técnicos de Garantía NTC 1335
              </h3>
              <p className="text-xs text-slate-500">
                Seguimiento a solicitudes de contratistas, visitas técnicas de adherencia en obra y SLA de atención.
              </p>
            </div>

            <div className="space-y-3">
              {pqrsCasos.map((c) => (
                <div key={c.radicado} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#0033A0]">{c.radicado}</span>
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                        {c.prioridad}
                      </span>
                      <span className="text-xs font-bold text-slate-800">• {c.constructora}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">{c.motivo}</p>
                    <p className="text-[11px] text-slate-400">Asignado a: {c.asesor} • SLA Restante: {c.slaHoras} horas</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700">
                      {c.estado}
                    </span>
                    <button
                      type="button"
                      onClick={() => alert(`Abriendo expediente técnico de ${c.radicado}`)}
                      className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                    >
                      Ver Peritaje
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. GERENCIA / ANALYTICS
      ===================================================================== */}
      {role === 'gerencia' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Executive KPI Board */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ventas Consolidadas Trimestre</span>
              <span className="text-2xl font-black text-slate-900">$2,840,000,000 COP</span>
              <span className="text-xs font-bold text-emerald-600 block mt-1">+18.5% de cumplimiento</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cuñetes Despachados</span>
              <span className="text-2xl font-black text-slate-900">14,250 Cuñetes</span>
              <span className="text-xs font-bold text-blue-600 block mt-1">98.2% a tiempo en obra</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Margen EBITDA Operativo</span>
              <span className="text-2xl font-black text-slate-900">26.8%</span>
              <span className="text-xs font-bold text-emerald-600 block mt-1">Dentro del rango óptimo</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">CSAT Contratistas & Obra</span>
              <span className="text-2xl font-black text-slate-900">94.2 / 100</span>
              <span className="text-xs font-bold text-purple-600 block mt-1">Garantía NTC 1335</span>
            </div>
          </div>

          {/* Gráficas Interactivas de Gerencia con Recharts (Proyectado vs Real por Ciudad y Categoría) */}
          <GerenciaAnalyticsCharts orders={orders} />

          {/* Product Line Breakdown Highlights */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Distribución de Volumen por Línea de Producto
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                <span className="text-xs font-bold text-red-900 block">Koraza Doble Vida</span>
                <span className="text-xl font-black text-red-900 block mt-1">44%</span>
                <span className="text-[11px] text-red-700">Fachadas de alto rendimiento</span>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-xs font-bold text-blue-900 block">Viniltex Baños y Cocinas</span>
                <span className="text-xl font-black text-blue-900 block mt-1">36%</span>
                <span className="text-[11px] text-blue-700">Zonas de asepsia hospitalaria</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900 block">Aquablock & Impermeabilizantes</span>
                <span className="text-xl font-black text-emerald-900 block mt-1">12%</span>
                <span className="text-[11px] text-emerald-700">Cubiertas y cimentaciones</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300">
                <span className="text-xs font-bold text-slate-900 block">Esmaltes & Anticorrosivos</span>
                <span className="text-xl font-black text-slate-900 block mt-1">8%</span>
                <span className="text-[11px] text-slate-700">Estructuras metálicas</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Omnichannel Dispatch Modal */}
      <OmnichannelNotificationsModal
        isOpen={isOmniModalOpen}
        onClose={() => setIsOmniModalOpen(false)}
        order={selectedOrderForNotice}
        onStatusNotified={(newSt) => {
          if (selectedOrderForNotice) {
            onUpdateOrderStatus(selectedOrderForNotice.id, newSt);
          }
        }}
      />

    </div>
  );
};
