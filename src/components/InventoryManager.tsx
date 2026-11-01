import React, { useState } from 'react';
import { InventoryItem, COLORLINKOrder } from '../types';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Minus, 
  Search, 
  Filter, 
  Layers, 
  Warehouse, 
  TrendingUp, 
  RefreshCw,
  Boxes,
  ShieldCheck,
  Building2,
  DollarSign
} from 'lucide-react';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  orders: COLORLINKOrder[];
  onUpdateStock: (id: string, newGalones: number) => void;
  onAddNewLot?: (id: string, additionalGalones: number, lotNumber: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  orders,
  onUpdateStock,
  onAddNewLot,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState<'all' | 'Pintuco' | 'Color In'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'ok'>('all');

  // Modal for new lot arrival
  const [lotModalItem, setLotModalItem] = useState<InventoryItem | null>(null);
  const [lotAmount, setLotAmount] = useState<number>(20);
  const [lotCode, setLotCode] = useState<string>('');

  // Calculate committed gallons from pending orders
  const committedGallonsByProduct = orders.reduce((acc, order) => {
    if (order.estado !== 'Entregado') {
      const prodName = order.calculo.productoSugerido;
      acc[prodName] = (acc[prodName] || 0) + order.calculo.galonesPintura;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalGallonsInStock = inventory.reduce((sum, item) => sum + item.stockGalones, 0);
  const totalBucketsInStock = Math.floor(totalGallonsInStock / 5);
  const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.stockGalones * item.costoUnitarioGL), 0);
  const lowStockItemsCount = inventory.filter((item) => item.stockGalones <= item.stockMinimoGalones).length;

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = 
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ubicacionBodega.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBrand = brandFilter === 'all' || item.marca === brandFilter;

    const isLow = item.stockGalones <= item.stockMinimoGalones;
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'low' && isLow) || 
      (statusFilter === 'ok' && !isLow);

    return matchesSearch && matchesBrand && matchesStatus;
  });

  const handleOpenLotModal = (item: InventoryItem) => {
    setLotModalItem(item);
    setLotAmount(20);
    setLotCode(`LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleConfirmLot = () => {
    if (lotModalItem && lotAmount > 0) {
      if (onAddNewLot) {
        onAddNewLot(lotModalItem.id, lotAmount, lotCode);
      } else {
        onUpdateStock(lotModalItem.id, lotModalItem.stockGalones + lotAmount);
      }
      setLotModalItem(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Stock Total Disponible
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {totalGallonsInStock} <span className="text-xs font-normal text-slate-500">GL</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Equivalente a ~{totalBucketsInStock} Cuñetes de 5 GL
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className={`p-3 rounded-xl border ${
            lowStockItemsCount > 0 
              ? 'bg-amber-50 text-amber-600 border-amber-200' 
              : 'bg-emerald-50 text-emerald-600 border-emerald-200'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Alertas de Stock Mínimo
            </span>
            <div className={`text-xl font-black font-mono ${lowStockItemsCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {lowStockItemsCount} <span className="text-xs font-normal text-slate-500">Refs</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {lowStockItemsCount > 0 ? 'Requiere reabastecimiento en planta' : 'Todos los SKUs en nivel óptimo'}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Bodegas Pintuco
            </span>
            <div className="text-xl font-black text-slate-900">
              3 <span className="text-xs font-normal text-slate-500">Sedes</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Medellín • Bogotá • Cali
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Valorización Inventario
            </span>
            <div className="text-lg font-black text-slate-900 font-mono">
              ${(totalInventoryValue / 1000000).toFixed(1)}M <span className="text-xs font-normal text-slate-500">COP</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              Costo ponderado en bodega
            </span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
        
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU, producto, pasillo..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
          
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setBrandFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                brandFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setBrandFilter('Pintuco')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                brandFilter === 'Pintuco' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600 hover:text-red-700'
              }`}
            >
              Pintuco
            </button>
            <button
              onClick={() => setBrandFilter('Color In')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                brandFilter === 'Color In' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Color In
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs rounded-xl border border-slate-300 px-3 py-1.5 bg-white text-slate-700"
          >
            <option value="all">Todos los Niveles</option>
            <option value="low">Solo Stock Bajo / Crítico</option>
            <option value="ok">Solo Stock Óptimo</option>
          </select>

        </div>

      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-bold tracking-tight">
              Control Físico y Disponibilidad de Stock en Bodega
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {filteredInventory.length} Referencias listadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">Referencia / Producto</th>
                <th className="p-3.5">SKU / Marca</th>
                <th className="p-3.5 text-center">Ubicación Bodega</th>
                <th className="p-3.5 text-center">Stock Actual</th>
                <th className="p-3.5 text-center">Nivel Mínimo</th>
                <th className="p-3.5 text-center">Estado Stock</th>
                <th className="p-3.5 text-right">Ajuste Rápido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.map((item) => {
                const isLow = item.stockGalones <= item.stockMinimoGalones;
                const isCritical = item.stockGalones < item.stockMinimoGalones * 0.6;
                const buckets = Math.floor(item.stockGalones / 5);
                const loose = item.stockGalones % 5;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    
                    {/* Name */}
                    <td className="p-3.5 font-medium text-slate-900">
                      <div className="font-bold text-xs">{item.nombre}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Categoría: <span className="font-semibold text-slate-700">{item.categoria}</span> • Lote: <span className="font-mono text-slate-600">{item.ultimoLote}</span>
                      </div>
                    </td>

                    {/* SKU & Brand */}
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-slate-700 text-[11px]">{item.sku}</div>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                        item.marca === 'Pintuco' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.marca}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="p-3.5 text-center text-slate-600">
                      <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 px-2 py-1 rounded-lg font-mono">
                        <Warehouse className="w-3 h-3 text-slate-400" />
                        {item.ubicacionBodega}
                      </span>
                    </td>

                    {/* Stock Numbers */}
                    <td className="p-3.5 text-center">
                      <div className="font-black text-sm text-slate-900 font-mono">
                        {item.stockGalones} <span className="text-[10px] font-normal text-slate-500">GL</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {buckets} Cuñetes + {loose} Gal
                      </div>
                    </td>

                    {/* Minimum stock */}
                    <td className="p-3.5 text-center font-mono text-slate-500">
                      {item.stockMinimoGalones} GL
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 text-center">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Crítico
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Stock Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Óptimo
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        
                        <button
                          onClick={() => onUpdateStock(item.id, Math.max(0, item.stockGalones - 5))}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 border border-slate-200 transition-colors"
                          title="Restar 5 galones (1 cuñete)"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onUpdateStock(item.id, item.stockGalones + 5)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-colors"
                          title="Sumar 5 galones (1 cuñete)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenLotModal(item)}
                          className="ml-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1"
                          title="Registrar ingreso de nuevo lote de fábrica"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Lote</span>
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lot Arrival Modal */}
      {lotModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 max-w-md w-full space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Ingreso de Lote a Bodega</h3>
                  <p className="text-xs text-slate-500">Recepción de planta Pintuco / Color In</p>
                </div>
              </div>
              <button
                onClick={() => setLotModalItem(null)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Producto Seleccionado:</span>
                <strong className="text-slate-900">{lotModalItem.nombre}</strong>
                <div className="text-slate-500 font-mono text-[11px]">{lotModalItem.sku}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Número / Código de Lote de Fabricación:
                </label>
                <input
                  type="text"
                  value={lotCode}
                  onChange={(e) => setLotCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">
                  Galones a Ingresar:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={lotAmount}
                    onChange={(e) => setLotAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm font-bold focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                  <span className="text-slate-500 font-medium">GL (~{Math.floor(lotAmount / 5)} Cuñetes)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                Stock actual: <strong>{lotModalItem.stockGalones} GL</strong> › Nuevo stock proyectado: <strong className="text-emerald-700">{lotModalItem.stockGalones + lotAmount} GL</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLotModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLot}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md transition-colors"
              >
                Confirmar Ingreso a Bodega
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
