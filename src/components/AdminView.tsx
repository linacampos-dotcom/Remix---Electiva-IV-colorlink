import React, { useState } from 'react';
import { FMVFormData, CalculationResult, COLORLINKOrder, InventoryItem, AIAnalysis, CatalogProduct } from '../types';
import { InventoryManager } from './InventoryManager';
import { OutputSummary } from './OutputSummary';
import { BOMVisualizer } from './BOMVisualizer';
import { AIDiagnosticCard } from './AIDiagnosticCard';
import { FMVForm } from './FMVForm';
import { CatalogSection } from './CatalogSection';
import { exportOrdersToExcel } from '../utils/excelExport';
import { SupabaseProducto } from '../lib/supabaseClient';
import { 
  Boxes, 
  Layers, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Truck, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Printer, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  ShieldCheck, 
  UserCheck,
  Edit3,
  Calculator,
  RefreshCw,
  FileSpreadsheet,
  Download,
  LogOut,
  Database
} from 'lucide-react';

interface AdminViewProps {
  orders: COLORLINKOrder[];
  onUpdateOrderStatus: (id: string, newStatus: COLORLINKOrder['estado']) => void;
  onUpdateOrderDetails: (id: string, updates: Partial<COLORLINKOrder>) => void;
  onSelectOrderForSimulation: (order: COLORLINKOrder) => void;
  onOpenPrintable: (order: COLORLINKOrder) => void;
  inventory: InventoryItem[];
  onUpdateStock: (id: string, newGalones: number) => void;
  onAddNewLot?: (id: string, additionalGalones: number, lotNumber: string) => void;
  onLogout?: () => void;
  // Simulator props
  formData: FMVFormData;
  calculation: CalculationResult;
  onFormChange: (field: keyof FMVFormData, value: any) => void;
  onApplyPreset: (presetData: FMVFormData) => void;
  onResetForm: () => void;
  onOpenNLPExtractor: () => void;
  aiAnalysis?: AIAnalysis;
  onRunAIDiagnosis: () => Promise<void>;
  isLoadingAI: boolean;
  onSaveOrderFromSimulator: () => Promise<void>;
  isSavingSimulator: boolean;
  supabaseProducts?: SupabaseProducto[];
  isUsingSupabaseCatalog?: boolean;
  onRefreshSupabase?: () => void;
  isSupabaseLive?: boolean;
}

export const AdminView: React.FC<AdminViewProps> = ({
  orders,
  onUpdateOrderStatus,
  onUpdateOrderDetails,
  onSelectOrderForSimulation,
  onOpenPrintable,
  inventory,
  onUpdateStock,
  onAddNewLot,
  onLogout,
  formData,
  calculation,
  onFormChange,
  onApplyPreset,
  onResetForm,
  onOpenNLPExtractor,
  aiAnalysis,
  onRunAIDiagnosis,
  isLoadingAI,
  onSaveOrderFromSimulator,
  isSavingSimulator,
  supabaseProducts,
  isUsingSupabaseCatalog,
  onRefreshSupabase,
  isSupabaseLive,
}) => {
  const [adminTab, setAdminTab] = useState<'orders' | 'inventory' | 'catalog' | 'simulator'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');

  // Order detail modal / drawer state
  const [selectedOrder, setSelectedOrder] = useState<COLORLINKOrder | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ id: string; notes: string; manager: string; tracking: string } | null>(null);

  // Metrics
  const totalOrders = orders.length;
  const urgentOrders = orders.filter((o) => o.calculo.prioridad === 'Alta').length;
  const inProgressOrders = orders.filter((o) => o.estado === 'En Producción' || o.estado === 'Pendiente Alistamiento').length;
  const readyOrders = orders.filter((o) => o.estado === 'Listo para Despacho').length;
  const totalCommittedGallons = orders
    .filter((o) => o.estado !== 'Entregado')
    .reduce((sum, o) => sum + o.calculo.galonesPintura, 0);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.numeroOrden.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.form.nombre_razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.form.documento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.form.ciudad.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || order.estado === filterStatus;
    const matchesPriority = filterPriority === 'all' || order.calculo.prioridad === filterPriority;
    const matchesCity = filterCity === 'all' || order.form.ciudad === filterCity;

    return matchesSearch && matchesStatus && matchesPriority && matchesCity;
  });

  const getStatusBadge = (status: COLORLINKOrder['estado']) => {
    switch (status) {
      case 'Cotizado':
        return 'bg-blue-100 text-blue-800 border-blue-300';
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

  const handleOpenEditNotes = (order: COLORLINKOrder) => {
    setEditingNotes({
      id: order.id,
      notes: order.observacionesBodega || '',
      manager: order.responsableAlistamiento || 'Bodega Central Pintuco',
      tracking: order.guiaDespacho || '',
    });
  };

  const handleSaveNotes = () => {
    if (editingNotes) {
      onUpdateOrderDetails(editingNotes.id, {
        observacionesBodega: editingNotes.notes,
        responsableAlistamiento: editingNotes.manager,
        guiaDespacho: editingNotes.tracking,
      });
      setEditingNotes(null);
    }
  };

  const handleSelectProductFromCatalog = (product: CatalogProduct) => {
    onFormChange('producto_deseado', product.nombre);
    if (product.presetSuperficie) {
      onFormChange('superficie', product.presetSuperficie);
    }
    if (product.presetAmbiente) {
      onFormChange('ambiente', product.presetAmbiente);
    }
    setAdminTab('simulator');
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Top Action & Mode Selector Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-amber-400 border border-slate-800 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Panel de Control de Bodega & Producción
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Acceso Total Administrador
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión centralizada de pedidos, reportes ejecutivos en Excel e inventario físico Pintuco / Color In
            </p>
          </div>
        </div>

        {/* Right Actions: Excel Export Button & Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          
          {/* Supabase Connection Status Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700">
            <Database className={`w-3.5 h-3.5 ${isSupabaseLive ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="hidden sm:inline text-[11px]">Supabase:</span>
            <span className={`text-[11px] font-bold ${isSupabaseLive ? 'text-emerald-700' : 'text-slate-600'}`}>
              {isSupabaseLive ? 'Conectado' : 'Modo Seguro Local'}
            </span>
            {onRefreshSupabase && (
              <button
                type="button"
                onClick={onRefreshSupabase}
                title="Sincronizar proyectos y productos desde Supabase"
                className="ml-1 p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-600 hover:text-slate-900"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Prominent Excel Export Button */}
          <button
            type="button"
            onClick={() => exportOrdersToExcel(orders)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm hover:shadow-md transition-all shrink-0 border border-emerald-800"
            title="Exportar todos los proyectos y órdenes registradas a archivo Microsoft Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>📊 Descargar Excel</span>
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 hover:border-red-200 transition-all shrink-0 shadow-2xs"
              title="Cerrar sesión de administrador y regresar a Vista Cliente"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>🚪 Cerrar Sesión</span>
            </button>
          )}

          {/* Tab Controls */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto w-full sm:w-auto">
            
            <button
              type="button"
              onClick={() => setAdminTab('orders')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                adminTab === 'orders'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              <span>Órdenes ({orders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('inventory')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                adminTab === 'inventory'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-amber-400" />
              <span>Inventario</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('catalog')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                adminTab === 'catalog'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-red-400" />
              <span>Catálogo Pintuco</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('simulator')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                adminTab === 'simulator'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>Calculador</span>
            </button>

          </div>

        </div>

      </div>

      {/* ADMIN TAB 1: ORDERS & LOGISTICS DASHBOARD */}
      {adminTab === 'orders' && (
        <div className="space-y-6">
          
          {/* Metrics KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-slate-900 text-white">
                <FileText className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Órdenes</span>
                <div className="text-xl font-black text-slate-900 font-mono">{totalOrders}</div>
                <span className="text-[10px] text-slate-500">{readyOrders} listas para despacho</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Prioridad Alta (&lt; 3 Días)</span>
                <div className="text-xl font-black text-red-600 font-mono">{urgentOrders}</div>
                <span className="text-[10px] text-slate-500">Despacho crítico</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">En Alistamiento</span>
                <div className="text-xl font-black text-amber-700 font-mono">{inProgressOrders}</div>
                <span className="text-[10px] text-slate-500">En bodega central</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Volumen Comprometido</span>
                <div className="text-xl font-black text-emerald-700 font-mono">{totalCommittedGallons} <span className="text-xs font-normal">GL</span></div>
                <span className="text-[10px] text-slate-500">~{Math.ceil(totalCommittedGallons / 5)} Cuñetes</span>
              </div>
            </div>

          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col lg:flex-row gap-3 items-center justify-between">
            
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, documento, orden o ciudad..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end text-xs">
              
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Estado:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white text-slate-700 font-medium"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="Cotizado">Cotizado</option>
                  <option value="Pendiente Alistamiento">Pendiente Alistamiento</option>
                  <option value="En Producción">En Producción</option>
                  <option value="Listo para Despacho">Listo para Despacho</option>
                  <option value="Despachado">Despachado</option>
                  <option value="Entregado">Entregado</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-600">Prioridad:</span>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white text-slate-700 font-medium"
                >
                  <option value="all">Todas</option>
                  <option value="Alta">Alta (Urgente)</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>

            </div>

          </div>

          {/* Orders List / Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold tracking-tight">
                  Registro Maestro de Órdenes de Producción Pintuco
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {filteredOrders.length} / {orders.length} Órdenes
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <FileText className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-sm font-semibold">No se encontraron órdenes con los filtros seleccionados</p>
                <p className="text-xs">Diligencie un nuevo FMV o ajuste los términos de búsqueda.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const calc = order.calculo;
                  const form = order.form;

                  return (
                    <div
                      key={order.id}
                      className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      {/* Order Info Left */}
                      <div className="space-y-2 flex-1">
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-900 text-white">
                            {order.numeroOrden}
                          </span>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(order.estado)}`}>
                            {order.estado}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            calc.prioridad === 'Alta'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            Prioridad: {calc.prioridad}
                          </span>
                          <span className="text-xs text-slate-400">
                            Radicado: {new Date(order.fechaCreacion).toLocaleDateString('es-CO')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{form.nombre_razon_social}</h4>
                          <span className="text-xs font-mono text-slate-500">({form.tipo_documento} {form.documento})</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {form.ciudad}
                          </span>
                          <span>Obra: <strong>{form.tipo_obra}</strong></span>
                          <span>Área: <strong>{form.area_m2} m²</strong></span>
                          <span>Producto: <strong className="text-slate-900">{calc.productoSugerido}</strong></span>
                          <span>Pintura: <strong className="text-red-700">{calc.galonesPintura} GL ({calc.cuñetesPintura} Cuñetes)</strong></span>
                          {calc.galonesSellador > 0 && (
                            <span>Sellador: <strong className="text-cyan-700">{calc.galonesSellador} GL</strong></span>
                          )}
                          <span className="text-red-700 font-semibold">Entrega: {form.fecha_requerida}</span>
                        </div>

                        {order.observacionesBodega && (
                          <div className="text-xs text-slate-600 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 inline-block">
                            <span className="font-bold text-amber-900">Nota Bodega:</span> {order.observacionesBodega}
                          </div>
                        )}

                      </div>

                      {/* Order Controls Right */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        
                        {/* Status Switcher */}
                        <select
                          value={order.estado}
                          onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as COLORLINKOrder['estado'])}
                          className="text-xs font-semibold rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:ring-2 focus:ring-red-500 shadow-2xs"
                        >
                          <option value="Cotizado">Cotizado</option>
                          <option value="Pendiente Alistamiento">Pendiente Alistamiento</option>
                          <option value="En Producción">En Producción</option>
                          <option value="Listo para Despacho">Listo para Despacho</option>
                          <option value="Despachado">Despachado</option>
                          <option value="Entregado">Entregado</option>
                        </select>

                        {/* Edit Notes */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditNotes(order)}
                          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                          title="Editar notas de bodega y guía de transporte"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Print PDF */}
                        <button
                          type="button"
                          onClick={() => onOpenPrintable(order)}
                          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                          title="Imprimir Ficha Oficial / Orden de Producción"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Load in Simulator */}
                        <button
                          type="button"
                          onClick={() => onSelectOrderForSimulation(order)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 transition-all"
                          title="Cargar y recalcular en Simulador Técnico"
                        >
                          <span>Simular</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ADMIN TAB 2: INVENTORY MANAGER */}
      {adminTab === 'inventory' && (
        <InventoryManager
          inventory={inventory}
          orders={orders}
          onUpdateStock={onUpdateStock}
          onAddNewLot={onAddNewLot}
        />
      )}

      {/* ADMIN TAB 3: TECHNICAL CALCULATOR & SIMULATOR */}
      {adminTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <div className="lg:col-span-6 space-y-6">
            <FMVForm
              formData={formData}
              onChange={onFormChange}
              onApplyPreset={onApplyPreset}
              onReset={onResetForm}
              onOpenNLPExtractor={onOpenNLPExtractor}
              supabaseProducts={supabaseProducts}
              isUsingSupabaseCatalog={isUsingSupabaseCatalog}
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            <OutputSummary
              formData={formData}
              calculation={calculation}
              onSaveOrder={onSaveOrderFromSimulator}
              onOpenPrintable={() => {
                onOpenPrintable({
                  id: 'SIM',
                  numeroOrden: `COT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                  fechaCreacion: new Date().toISOString(),
                  form: formData,
                  calculo: calculation,
                  estado: 'Cotizado',
                });
              }}
              isSaving={isSavingSimulator}
            />

            <BOMVisualizer
              calculation={calculation}
              formData={formData}
              onToggleForcedSealer={(forced) => onFormChange('incluir_sellador_forzado', forced)}
            />

            <AIDiagnosticCard
              formData={formData}
              calculation={calculation}
              aiAnalysis={aiAnalysis}
              onRunAIDiagnosis={onRunAIDiagnosis}
              isLoadingAI={isLoadingAI}
            />
          </div>

        </div>
      )}

      {/* ADMIN TAB 4: PINTUCO & COLOR IN CATALOG */}
      {adminTab === 'catalog' && (
        <div className="animate-fadeIn">
          <CatalogSection
            onSelectProductForQuote={handleSelectProductFromCatalog}
          />
        </div>
      )}

      {/* Notes / Dispatch Guide Modal */}
      {editingNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-900 text-amber-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Control Logístico de Bodega</h3>
                  <p className="text-xs text-slate-500">Alistamiento y despacho</p>
                </div>
              </div>
              <button
                onClick={() => setEditingNotes(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Responsable de Alistamiento / Bodega:
                </label>
                <input
                  type="text"
                  value={editingNotes.manager}
                  onChange={(e) => setEditingNotes({ ...editingNotes, manager: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Guía de Despacho / Transportador:
                </label>
                <input
                  type="text"
                  value={editingNotes.tracking}
                  onChange={(e) => setEditingNotes({ ...editingNotes, tracking: e.target.value })}
                  placeholder="Ej: Servientrega 892014-B o Camión Propio Pintuco #4"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Observaciones Técnicas o de Entrega:
                </label>
                <textarea
                  rows={3}
                  value={editingNotes.notes}
                  onChange={(e) => setEditingNotes({ ...editingNotes, notes: e.target.value })}
                  placeholder="Ej: Tinturado especial en máquina Fast & Fluid. Entregar en portería 2 de obra."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingNotes(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md transition-colors"
              >
                Guardar Cambios
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
