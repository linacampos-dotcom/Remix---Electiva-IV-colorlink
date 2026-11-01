import React from 'react';
import { createPortal } from 'react-dom';
import { FMVFormData, CalculationResult } from '../types';
import { X, Printer, Download, CheckCircle2, ShieldAlert, Building2, Camera, Layers, Droplet, Paintbrush } from 'lucide-react';

interface PrintableOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: FMVFormData;
  calculation: CalculationResult;
}

export const PrintableOrderModal: React.FC<PrintableOrderModalProps> = ({
  isOpen,
  onClose,
  formData,
  calculation,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const orderNum = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const isUrgent = calculation.prioridad === 'Alta';

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Toolbar (hidden when printing) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <div>
              <span className="font-bold text-sm">Ficha Comercial & Técnica de Cotización Oficial</span>
              <span className="text-[11px] text-slate-400 block sm:inline sm:ml-2">Listo para imprimir o guardar en PDF</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar en PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible">
          
          {/* Header Document */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-red-600">COLORLINK</span>
                <span className="text-xs uppercase font-bold text-slate-600">| Pintuco & Color In Oficial</span>
              </div>
              <h1 className="text-lg font-black uppercase tracking-wide text-slate-900 mt-1">
                Ficha y Cotización Comercial de Materiales
              </h1>
              <p className="text-xs text-slate-600">
                Resumen ejecutivo de especificación arquitectónica, insumos y alistamiento de bodega
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold font-mono px-3 py-1 bg-slate-900 text-white rounded-md">
                {orderNum}
              </span>
              <div className="text-[11px] text-slate-500 mt-1.5">
                Emisión: {new Date().toLocaleDateString('es-CO')}
              </div>
              <div className={`text-xs font-bold mt-1 ${isUrgent ? 'text-red-600' : 'text-emerald-700'}`}>
                PRIORIDAD: {calculation.prioridad.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Section 1: Customer & Site Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px] mb-1">
                Cliente / Razón Social:
              </span>
              <p className="font-bold text-sm text-slate-900">{formData.nombre_razon_social || 'N/A'}</p>
              <p className="text-slate-600 mt-0.5">{formData.tipo_documento}: <span className="font-mono font-semibold">{formData.documento}</span></p>
              <p className="text-slate-600 mt-1">
                Contacto Responsable: <strong>{formData.responsable_contacto}</strong> ({formData.canal_entrada})
              </p>
            </div>
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px] mb-1">
                Datos de Obra & Despacho:
              </span>
              <p className="font-bold text-slate-900">{formData.tipo_obra} • {formData.ciudad}</p>
              <p className="text-slate-600 mt-0.5">
                Área de Paredes a Cubrir: <strong className="text-slate-900">{formData.area_m2} m²</strong>
              </p>
              <p className="text-slate-600 mt-1">
                Fecha Requerida en Obra: <strong className="text-red-700">{formData.fecha_requerida || 'Inmediata'}</strong> ({calculation.diasRestantes} días)
              </p>
            </div>
          </div>

          {/* Section 2: Technical Parameters & Method */}
          <div className="space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
              1. Diagnóstico Técnico y Parámetros de Aplicación
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px]">Superficie:</span>
                <strong className="text-slate-900">{formData.superficie}</strong>
                <span className="text-[10px] text-slate-500 block">Factor corrección: ×{calculation.factorCorreccion}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Ambiente:</span>
                <strong className="text-slate-900">{formData.ambiente}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Condición Pared:</span>
                <strong className="text-slate-900">{formData.condicion}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Método & Desperdicio:</span>
                <strong className="text-slate-900">{calculation.metodoAplicacion}</strong>
                <span className="text-[10px] text-amber-700 font-bold block">+{calculation.margenDesperdicioPct}% incluido</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-bold uppercase mb-0.5">
                Tratamiento Previo Requerido:
              </span>
              <p className="text-slate-800 leading-relaxed">{calculation.tratamientoPrevio}</p>
            </div>
          </div>

          {/* Section 3: Photo Registration if Uploaded */}
          {formData.foto_obra_url && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4 text-xs">
              <div className="w-20 h-16 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-slate-200">
                <img 
                  src={formData.foto_obra_url} 
                  alt="Registro fotográfico de obra" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Camera className="w-4 h-4 text-red-600" />
                  <span>Registro Fotográfico de Obra / Pared Suministrado</span>
                </div>
                <p className="text-slate-600 mt-0.5 text-[11px]">
                  Fotografía cargada por el cliente para validación visual de absorción, sombras y zócalos en el simulador arquitectónico.
                </p>
              </div>
            </div>
          )}

          {/* Section 4: Bill of Materials (BOM Table) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                2. Explosión de Insumos y Empaque (BOM Certificado)
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Base: 30 m²/gal a 2 manos + {calculation.margenDesperdicioPct}% desperdicio técnico
              </span>
            </div>

            <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-900 text-white text-[11px] uppercase">
                <tr>
                  <th className="p-2.5">Ítem / Producto</th>
                  <th className="p-2.5">SKU Referencia</th>
                  <th className="p-2.5">Color / Acabado</th>
                  <th className="p-2.5 text-right">Galones</th>
                  <th className="p-2.5 text-right">Desglose Empaque en Bodega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-white">
                  <td className="p-2.5 font-bold text-slate-900">
                    {calculation.productoSugerido}
                  </td>
                  <td className="p-2.5 font-mono">{calculation.skuPinturaSugerido}</td>
                  <td className="p-2.5 font-semibold text-slate-800">{formData.color_acabado}</td>
                  <td className="p-2.5 text-right font-black text-red-700 text-sm font-mono">
                    {calculation.galonesPintura} GL
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                    {calculation.cuñetesPintura} Cuñetes (5 Gal) + {calculation.galonesSueltosPintura} Gal Sueltos
                  </td>
                </tr>

                {calculation.requiereSellador && (
                  <tr className="bg-slate-50">
                    <td className="p-2.5 font-bold text-cyan-900">
                      {calculation.productoSelladorSugerido || 'Sellador Acrílico Pintuco'}
                    </td>
                    <td className="p-2.5 font-mono">{calculation.skuSelladorSugerido}</td>
                    <td className="p-2.5 text-slate-600">Sellante Neutralizador</td>
                    <td className="p-2.5 text-right font-black text-cyan-800 text-sm font-mono">
                      {calculation.galonesSellador} GL
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-cyan-950">
                      {calculation.cuñetesSellador} Cuñetes (5 Gal) + {calculation.galonesSueltosSellador} Gal Sueltos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Section 5: Warehouse Dispatch Instruction */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Instrucción Oficial de Despacho:
              </span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {calculation.alertaDespacho}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Centro de Distribución:</span>
              <span className="font-bold text-slate-800">{formData.ciudad ? `Bodega Pintuco ${formData.ciudad}` : 'Bodega Central'}</span>
            </div>
          </div>

          {/* Section 6: Warehouse Signature & Dispatch Authorization */}
          <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-xs">
            <div className="border-t border-slate-400 pt-2 text-center text-slate-600">
              <span className="font-semibold block">Responsable Comercial / Alistamiento Pintuco</span>
              <span className="text-[10px] text-slate-400">Firma y Sello de Salida</span>
            </div>
            <div className="border-t border-slate-400 pt-2 text-center text-slate-600">
              <span className="font-semibold block">Cliente / Constructor Encargado</span>
              <span className="text-[10px] text-slate-400">Recibido a Conformidad en Obra</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
};
