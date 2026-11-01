import React from 'react';
import { CalculationResult, FMVFormData } from '../types';
import { 
  Package, 
  Layers, 
  TrendingUp, 
  Droplet, 
  Sparkles, 
  Boxes, 
  Clock, 
  MapPin, 
  Truck,
  CheckCircle,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';

interface BOMVisualizerProps {
  calculation: CalculationResult;
  formData: FMVFormData;
  onToggleForcedSealer?: (force: boolean) => void;
}

export const BOMVisualizer: React.FC<BOMVisualizerProps> = ({
  calculation,
  formData,
  onToggleForcedSealer,
}) => {
  const area = Number(formData.area_m2) || 0;
  const rawGallons = area > 0 ? (area / 30) * calculation.factorCorreccion : 0;
  
  const condLower = (formData.condicion || '').toLowerCase();
  const supLower = (formData.superficie || '').toLowerCase();
  const isConditionObligatorio = 
    condLower.includes('obra nueva') ||
    condLower.includes('nueva') || 
    condLower.includes('humed') || 
    condLower.includes('fisura') || 
    condLower.includes('grieta') || 
    condLower.includes('porosa') || 
    condLower.includes('pañete') ||
    condLower.includes('panete') ||
    condLower.includes('revoque') ||
    supLower.includes('pañete') ||
    supLower.includes('revoque') ||
    (formData.tipo_obra || '').toLowerCase().includes('comercial') ||
    (formData.tipo_obra || '').toLowerCase().includes('industrial');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6 p-5 sm:p-6">
      
      {/* Visual BOM Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">
              BOM
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Explosión de Insumos y Envases
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Desglose cuantitativo por tipo de empaque para producción y bodega Pintuco
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Área de Aplicación
          </span>
          <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
            {area.toLocaleString()} m²
          </span>
        </div>
      </div>

      {/* Main Material Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Card 1: Pintura Base */}
        <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-b from-red-50/50 to-white p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 opacity-10">
            <Droplet className="w-32 h-32 text-red-600" />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-2xs">
                Pintura Base
              </span>
              <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                SKU: {calculation.skuPinturaSugerido}
              </span>
            </div>

            <h4 className="text-base font-bold text-slate-900 mb-1 leading-snug">
              {calculation.productoSugerido}
            </h4>

            <p className="text-xs text-slate-600 mb-4">
              Tono: <strong className="text-slate-800">{formData.color_acabado || 'Blanco Estándar'}</strong>
            </p>

            {/* Total Metric */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-4xl font-black text-red-600 tracking-tight font-mono">
                {calculation.galonesPintura}
              </span>
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Galones Totales
              </span>
            </div>

            {/* Packaging Breakdown (Cuñetes + Galones) */}
            <div className="p-3 bg-white rounded-xl border border-red-100 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Sugerencia de Presentación en Bodega:
              </span>
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-2 rounded-lg bg-red-50/80 border border-red-200">
                  <div className="text-lg font-black text-red-700">
                    {calculation.cuñetesPintura}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600 uppercase">
                    Cuñetes (5 Gal)
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-red-50/80 border border-red-200">
                  <div className="text-lg font-black text-red-700">
                    {calculation.galonesSueltosPintura}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-600 uppercase">
                    Galones Sueltos
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Proof */}
          <div className="mt-4 pt-3 border-t border-red-100 text-[11px] text-slate-500 font-mono flex flex-col gap-0.5">
            <span>Fórmula: ceil((({area} ÷ 30) × {calculation.factorCorreccion}) × {calculation.factorDesperdicio}) = </span>
            <div className="flex items-center justify-between">
              <strong className="text-red-700 font-bold">{calculation.galonesPintura} GL Totales</strong>
              <span className="text-[10px] text-slate-500 font-sans">
                {calculation.metodoAplicacion} (+{calculation.margenDesperdicioPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Sellador / Imprimante */}
        <div className={`rounded-2xl border-2 p-5 relative overflow-hidden flex flex-col justify-between transition-all ${
          calculation.requiereSellador 
            ? 'border-cyan-400 bg-gradient-to-b from-cyan-50/60 to-white shadow-xs' 
            : 'border-slate-200 bg-slate-50/70'
        }`}>
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                calculation.requiereSellador 
                  ? 'bg-cyan-700 text-white shadow-2xs' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                Sellador / Imprimante
              </span>
              {calculation.requiereSellador && (
                <span className="text-xs font-mono font-semibold text-cyan-900 bg-cyan-100/90 px-2 py-0.5 rounded border border-cyan-200">
                  SKU: {calculation.skuSelladorSugerido}
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-slate-900 mb-1 leading-snug">
              {calculation.requiereSellador 
                ? (calculation.productoSelladorSugerido || 'Sellador Acrílico Pintuco 100% Interiores/Exteriores')
                : 'No Requerido para esta condición'}
            </h4>

            <p className="text-xs text-slate-600 mb-3">
              Condición evaluada: <strong className="text-slate-800">{formData.condicion}</strong>
              {(formData.tipo_obra?.toLowerCase().includes('comercial') || formData.tipo_obra?.toLowerCase().includes('industrial')) && (
                <span className="ml-1 text-cyan-800 font-semibold">(Estándar {formData.tipo_obra})</span>
              )}
            </p>

            {/* Total Metric */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className={`text-4xl font-black tracking-tight font-mono ${
                calculation.requiereSellador ? 'text-cyan-800' : 'text-slate-400'
              }`}>
                {calculation.galonesSellador}
              </span>
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Galones Totales (1 GL / 40 m²)
              </span>
            </div>

            {/* Packaging Breakdown */}
            {calculation.requiereSellador ? (
              <div className="p-3 bg-white rounded-xl border border-cyan-200/80 shadow-2xs space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Sugerencia de Presentación en Bodega:
                </span>
                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="p-2 rounded-lg bg-cyan-50/90 border border-cyan-200">
                    <div className="text-lg font-black text-cyan-900">
                      {calculation.cuñetesSellador}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-600 uppercase">
                      Cuñetes (5 Gal)
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-cyan-50/90 border border-cyan-200">
                    <div className="text-lg font-black text-cyan-900">
                      {calculation.galonesSueltosSellador}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-600 uppercase">
                      Galones Sueltos
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white/80 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <p>
                  La condición <span className="font-semibold text-slate-800">"{formData.condicion}"</span> no genera orden de sellador obligatoria en el BOM estándar.
                </p>
              </div>
            )}

            {/* Toggle / Checkbox for manual sealer addition */}
            {onToggleForcedSealer && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                {!isConditionObligatorio ? (
                  <>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                      <input
                        type="checkbox"
                        checked={Boolean(formData.incluir_sellador_forzado)}
                        onChange={(e) => onToggleForcedSealer(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-800">
                        Incluir Sellador de preparación por estándar técnico
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-500 mt-1 pl-1">
                      Suma al presupuesto 1 galón por cada 40 m² para sellar poros y fijar el acabado.
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-blue-800 bg-blue-50 p-2 rounded-lg border border-blue-200 font-medium">
                    <Droplet className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sellador activo automáticamente por condición técnica ({formData.condicion}).</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mathematical Proof */}
          <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono">
            {calculation.requiereSellador ? (
              <span>Fórmula: ceil({area} ÷ 40) = <strong className="text-cyan-900 font-bold">{calculation.galonesSellador} GL</strong></span>
            ) : (
              <span>Rendimiento teórico no aplicable (0 Galones)</span>
            )}
          </div>
        </div>

      </div>

      {/* Technical Calculation Rules Matrix */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          Memoria de Cálculo y Factores Aplicados:
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          
          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Rendimiento Base (2 manos)</span>
            <span className="font-bold text-slate-800 font-mono text-sm">30 m² / Galón</span>
          </div>

          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Factor Superficie ({formData.superficie})</span>
            <span className="font-bold text-slate-800 font-mono text-sm">
              {calculation.factorCorreccion === 1.15 ? '1.15 (+15% Rugosa/Mampostería)' : '1.0 (Superficie Estándar)'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-white border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Rendimiento Sellador (1 mano)</span>
            <span className="font-bold text-slate-800 font-mono text-sm">
              {calculation.requiereSellador ? '40 m² / Galón (Activo)' : '0 (No requerido)'}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};
