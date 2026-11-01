import React, { useState } from 'react';
import { CalculationResult, FMVFormData } from '../types';
import { COLOR_PALETTE } from '../data/pintucoData';
import { openWhatsAppDirect, DEFAULT_WHATSAPP_PHONE } from '../utils/whatsappConfig';
import { 
  Copy, 
  Check, 
  Download, 
  Printer, 
  FileText, 
  Send,
  AlertTriangle,
  Building2, 
  Paintbrush, 
  Droplet, 
  ShieldCheck,
  Calendar,
  MapPin,
  User,
  Share2,
  Layers,
  Sparkles,
  Camera,
  CheckCircle2,
  Boxes,
  Truck,
  Warehouse,
  Clock
} from 'lucide-react';

interface OutputSummaryProps {
  formData: FMVFormData;
  calculation: CalculationResult;
  onSaveOrder: () => void;
  onOpenPrintable: () => void;
  isSaving?: boolean;
}

export const OutputSummary: React.FC<OutputSummaryProps> = ({
  formData,
  calculation,
  onSaveOrder,
  onOpenPrintable,
  isSaving = false,
}) => {
  const [copied, setCopied] = useState(false);

  // Find color swatch hex for visual representation
  const matchedColor = COLOR_PALETTE.find(
    (c) => c.name === formData.color_acabado || formData.color_acabado.includes(c.code)
  );
  const colorHex = matchedColor?.hex || '#CBD5E1';

  // Format WhatsApp Share Message
  const handleShareWhatsApp = () => {
    const text = `🎨 *RESUMEN COMERCIAL DE COTIZACIÓN - PINTUCO & COLORLINK*
---------------------------------------
📋 *Cliente:* ${formData.nombre_razon_social || 'Cliente'}
📄 *Documento:* ${formData.tipo_documento} ${formData.documento || 'N/A'}
📍 *Obra:* ${formData.tipo_obra} - ${formData.ciudad} (${formData.departamento || 'Colombia'})
📐 *Área Total:* ${formData.area_m2} m²
🗓️ *Fecha Requerida:* ${formData.fecha_requerida || 'Inmediata'}

🚚 *LOGÍSTICA Y DESPACHO NACIONAL:*
• *Modalidad:* ${formData.modalidad_entrega === 'retiro_tienda' ? `Retiro en Sede (${formData.sede_retiro || 'Tienda Pintuco'})` : 'Envío Directo a Pie de Obra'}
• *Hub Despacho:* ${calculation.hub_despacho || 'CEDI Central'} (${calculation.tipo_zona_logistica || 'Nacional'})
• *Tiempo Estimado:* ${calculation.tiempo_entrega_estimado || '24 a 48 horas'}
• *Flete:* ${calculation.es_flete_gratis ? '¡Flete Bonificado ($0 COP)!' : `$${(calculation.costo_flete || 0).toLocaleString('es-CO')} COP`}

🖌️ *ESPECIFICACIÓN Y CONSUMO:*
• *Pintura:* ${calculation.productoSugerido}
• *Tono / Acabado:* ${formData.color_acabado}
• *Método de Aplicación:* ${calculation.metodoAplicacion} (+${calculation.margenDesperdicioPct}% desperdicio)
• *Total a Despachar:* *${calculation.galonesPintura} Galones*
  - Desglose: ${calculation.cuñetesPintura} Cuñetes (5 Gal) + ${calculation.galonesSueltosPintura} Galones Sueltos
  - SKU: ${calculation.skuPinturaSugerido}

• *Sellador / Imprimante:* ${
      calculation.requiereSellador
        ? `${calculation.productoSelladorSugerido}
  - Total: *${calculation.galonesSellador} Galones* (${calculation.cuñetesSellador} Cuñetes + ${calculation.galonesSueltosSellador} Gal)
  - SKU: ${calculation.skuSelladorSugerido}`
        : 'No requerido para esta condición de pared'
    }

⚡ *Prioridad:* ${calculation.prioridad}
🚚 *Alistamiento:* ${calculation.alertaDespacho}
---------------------------------------
_Generado por Sistema Oficial COLORLINK Pintuco & Color In_`;

    openWhatsAppDirect(DEFAULT_WHATSAPP_PHONE, text);
  };

  // Copy Executive Commercial Text
  const handleCopySummary = () => {
    const text = `RESUMEN COMERCIAL DE COTIZACIÓN - PINTUCO & COLORLINK
Cliente: ${formData.nombre_razon_social || 'N/A'} (${formData.tipo_documento}: ${formData.documento || 'N/A'})
Obra: ${formData.tipo_obra} - ${formData.ciudad} (${formData.departamento || 'Colombia'}) | Área: ${formData.area_m2} m²
Contacto: ${formData.responsable_contacto} (${formData.canal_entrada})
Fecha Requerida: ${formData.fecha_requerida}

LOGÍSTICA Y DESPACHO:
- Modalidad: ${formData.modalidad_entrega === 'retiro_tienda' ? `Retiro en Sede (${formData.sede_retiro || 'Tienda Pintuco'})` : 'Envío Directo a Pie de Obra'}
- Hub / CEDI: ${calculation.hub_despacho || 'CEDI Central'}
- Tiempo Estimado de Entrega: ${calculation.tiempo_entrega_estimado || '24 a 48 horas'}
- Flete: ${calculation.es_flete_gratis ? '¡Flete Bonificado ($0 COP)!' : `$${(calculation.costo_flete || 0).toLocaleString('es-CO')} COP`}

PRODUCTO Y TONO:
- Pintura Base: ${calculation.productoSugerido} (SKU: ${calculation.skuPinturaSugerido})
- Tono Seleccionado: ${formData.color_acabado}
- Método de Aplicación: ${calculation.metodoAplicacion} (+${calculation.margenDesperdicioPct}% desperdicio técnico)
- Tratamiento Previo: ${calculation.tratamientoPrevio}

EXPLOSIÓN DE INSUMOS:
- Pintura Base: ${calculation.galonesPintura} Galones (${calculation.cuñetesPintura} Cuñetes + ${calculation.galonesSueltosPintura} Galones sueltos)
- Sellador / Imprimante: ${
      calculation.requiereSellador
        ? `${calculation.galonesSellador} Galones (${calculation.cuñetesSellador} Cuñetes + ${calculation.galonesSueltosSellador} Gal) - ${calculation.productoSelladorSugerido}`
        : 'No requerido'
    }

ALERTA DE DESPACHO:
- Prioridad: ${calculation.prioridad}
- Despacho: ${calculation.alertaDespacho}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const isUrgent = calculation.prioridad === 'Alta';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      
      {/* 1. Header Comercial Oficial */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white tracking-wide">
              COLORLINK
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Resumen Comercial de Cotización
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Propuesta técnica certificada y cubicación oficial de materiales • Pintuco & Color In
          </p>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
              isUrgent
                ? 'bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isUrgent && <AlertTriangle className="w-3.5 h-3.5" />}
            Prioridad: {calculation.prioridad.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 2. Commercial Action Bar with Prominent PDF Export Button */}
      <div className="p-4 bg-gradient-to-r from-red-50/70 via-white to-amber-50/50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="p-2 rounded-xl bg-red-600 text-white shadow-2xs">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Documento Listo para Presentación a Obra
            </span>
            <span className="text-[11px] text-slate-500">
              Formato oficial en PDF con desglose de empaques, sello y firma de recibido
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          
          {/* Prominent PDF Download Button */}
          <button
            type="button"
            onClick={onOpenPrintable}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer ring-2 ring-slate-900/10"
            title="Descargar o imprimir la ficha técnica oficial en PDF"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Descargar Ficha y Cotización en PDF</span>
          </button>

          {/* WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm transition-all active:scale-95"
            title="Compartir cotización comercial por WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* Copy Summary */}
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-2xs transition-all active:scale-95"
            title="Copiar texto resumen"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar</span>
              </>
            )}
          </button>

        </div>
      </div>

      {/* 3. Resumen Comercial Estructurado */}
      <div className="p-5 sm:p-6 bg-white space-y-5 text-slate-800">
        
        {/* Module 1: Customer and Project Overview */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-red-600" />
              1. Identificación del Cliente y Obra
            </h4>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono">
              {formData.area_m2} m² Área Total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Cliente / Razón Social:</span>
              <p className="font-bold text-sm text-slate-900">{formData.nombre_razon_social || 'No especificado'}</p>
              <p className="text-slate-600 mt-0.5">
                {formData.tipo_documento}: <span className="font-mono font-semibold text-slate-800">{formData.documento || 'N/A'}</span>
              </p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Ubicación y Tipo de Obra:</span>
              <p className="font-bold text-slate-900">{formData.tipo_obra}</p>
              <p className="text-slate-600 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {formData.ciudad || 'No especificada'}
              </p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Responsable y Entrega:</span>
              <p className="font-semibold text-slate-900">{formData.responsable_contacto} ({formData.canal_entrada})</p>
              <p className="text-slate-600 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-red-600" />
                <span>Fecha requerida: <strong className="text-red-700">{formData.fecha_requerida || 'Inmediata'}</strong></span>
                <span className="text-slate-400 font-medium">({calculation.diasRestantes} días restantes)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Module 2: Technical Product & Application Details */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs">
          <div className="border-b border-slate-200/80 pb-2.5 mb-3 flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Paintbrush className="w-4 h-4 text-red-600" />
              2. Especificación Técnica y Color Pintuco
            </h4>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200">
              <span>Método:</span>
              <strong>{calculation.metodoAplicacion}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            {/* Suggested Product Box with Swatch */}
            <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider">
                    Pintura Base Recomendada
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200">
                    SKU: {calculation.skuPinturaSugerido}
                  </span>
                </div>
                <h5 className="text-sm font-black text-slate-900 leading-snug">
                  {calculation.productoSugerido}
                </h5>
                <p className="text-[11px] text-slate-600 mt-1">
                  Línea: <strong>{calculation.lineaProducto}</strong> • Ambiente: <strong>{formData.ambiente}</strong>
                </p>
              </div>

              {/* Color Swatch in Summary */}
              <div className="mt-3 pt-2.5 border-t border-red-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full border border-slate-300 shadow-inner shrink-0"
                    style={{ backgroundColor: colorHex }}
                  />
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Tono Oficial:</span>
                    <span className="font-bold text-slate-900">{formData.color_acabado || 'Blanco Puro'}</span>
                  </div>
                </div>

                {formData.foto_obra_url && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700 shadow-2xs">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Foto de Obra Anexa</span>
                  </div>
                )}
              </div>
            </div>

            {/* Preparation / Surface Treatment */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Tratamiento Previo Requerido
                </span>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {calculation.tratamientoPrevio}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-600">
                <span>Condición: <strong className="text-slate-800">{formData.condicion}</strong></span>
                <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Margen: +{calculation.margenDesperdicioPct}% desperdicio
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Module 3: Quantitative Bill of Materials (BOM) */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5 mb-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              3. Resumen Cuantitativo de Insumos y Empaques (BOM)
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Rendimiento: 30 m²/gal a 2 manos + {calculation.margenDesperdicioPct}% desperdicio
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Card Pintura Base */}
            <div className="p-4 rounded-xl border border-red-200 bg-white shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Paintbrush className="w-3.5 h-3.5 text-red-600" />
                  Pintura Base Acabado
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200">
                  {calculation.galonesPintura} Gal Totales
                </span>
              </div>
              
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {calculation.cuñetesPintura}
                </span>
                <span className="text-xs text-slate-600 font-semibold">
                  Cuñetes (5 gal)
                </span>
                <span className="text-slate-300 font-bold text-lg">+</span>
                <span className="text-3xl font-black text-slate-900 font-mono">
                  {calculation.galonesSueltosPintura}
                </span>
                <span className="text-xs text-slate-600 font-semibold">
                  Galones sueltos
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                Consumo neto: <strong>{calculation.consumoPinturaNeto.toFixed(1)} GL</strong> + {calculation.margenDesperdicioPct}% margen desperdicio.
              </p>
            </div>

            {/* Card Sellador / Imprimante */}
            <div className={`p-4 rounded-xl border shadow-xs ${
              calculation.requiereSellador
                ? 'border-cyan-300 bg-cyan-50/30'
                : 'border-slate-200 bg-white'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Droplet className={`w-3.5 h-3.5 ${calculation.requiereSellador ? 'text-cyan-700' : 'text-slate-400'}`} />
                  Sellador / Imprimante
                </span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  calculation.requiereSellador ? 'bg-cyan-100 text-cyan-900 border border-cyan-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {calculation.galonesSellador} Gal Totales
                </span>
              </div>

              {calculation.requiereSellador ? (
                <>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-cyan-950 font-mono">
                      {calculation.cuñetesSellador}
                    </span>
                    <span className="text-xs text-cyan-900 font-semibold">
                      Cuñetes (5 gal)
                    </span>
                    <span className="text-cyan-300 font-bold text-lg">+</span>
                    <span className="text-3xl font-black text-cyan-950 font-mono">
                      {calculation.galonesSueltosSellador}
                    </span>
                    <span className="text-xs text-cyan-900 font-semibold">
                      Galones sueltos
                    </span>
                  </div>
                  <p className="text-[11px] text-cyan-900 mt-2.5 pt-2 border-t border-cyan-100 truncate">
                    Asignado: <strong>{calculation.productoSelladorSugerido}</strong>
                  </p>
                </>
              ) : (
                <div className="py-2.5">
                  <p className="text-xs text-slate-500 font-medium">
                    No requerido para esta superficie.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Puede activarse opcionalmente en el switch de preparación técnica.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Module 4: Logistics, Dispatch & Freight Summary */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
          <div className="border-b border-slate-200/80 pb-2 flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Truck className="w-4 h-4 text-red-600" />
              4. Logística Nacional, Despacho y Flete Pintuco
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {calculation.tipo_zona_logistica || 'Cobertura Nacional'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Modalidad y Ubicación */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                  Modalidad de Entrega:
                </span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  {formData.modalidad_entrega === 'retiro_tienda' ? (
                    <>
                      <Warehouse className="w-3.5 h-3.5 text-blue-700" />
                      <span>Retiro en Sede Pintuco</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5 text-red-600" />
                      <span>Envío Directo a Pie de Obra</span>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {formData.modalidad_entrega === 'retiro_tienda'
                    ? (formData.sede_retiro || 'Tienda Principal')
                    : `${formData.ciudad}, ${formData.departamento || 'Colombia'}`}
                </p>
              </div>
            </div>

            {/* Hub y Lead Time */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                  Tiempo Estimado & Hub:
                </span>
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{calculation.tiempo_entrega_estimado || '24 a 48 horas hábiles'}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1 truncate">
                  Hub: <strong className="text-slate-800">{calculation.hub_despacho || 'CEDI Central'}</strong>
                </p>
              </div>
            </div>

            {/* Costo de Flete y Total */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                  Costo de Flete Estimado:
                </span>
                <p className="text-sm font-black text-slate-900">
                  {calculation.es_flete_gratis ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>¡Flete Bonificado $0 COP!</span>
                    </span>
                  ) : (
                    `$${(calculation.costo_flete || 0).toLocaleString('es-CO')} COP`
                  )}
                </p>
                {calculation.costo_total_estimado && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Total aprox: <strong className="text-red-700">${calculation.costo_total_estimado.toLocaleString('es-CO')} COP</strong>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>Alerta Bodega: <strong className="text-slate-700">{calculation.alertaDespacho}</strong></span>
            <span className="font-semibold text-slate-600">Prioridad: {calculation.prioridad}</span>
          </div>
        </div>

      </div>

      {/* 4. Bottom Dispatch / Action Bar */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Fórmulas validadas con redondeo técnico al alza e incorporación de factor de desperdicio.</span>
        </div>

        <button
          type="button"
          onClick={onSaveOrder}
          disabled={isSaving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{isSaving ? 'Guardando en Base de Datos...' : 'Radicar Proyecto y Enviar a Bodega'}</span>
        </button>
      </div>

    </div>
  );
};
