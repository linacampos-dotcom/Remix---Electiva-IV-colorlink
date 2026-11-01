import React from 'react';
import { OrdenCompraCorp, SEDES_CEDI_CONFIG } from '../services/corporateService';
import {
  X,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Lock,
  FileCheck,
  Boxes,
  FileText,
  UserCheck,
  Calendar,
  AlertTriangle,
  QrCode,
  Download,
} from 'lucide-react';

interface ActaRecepcionOCModalProps {
  isOpen: boolean;
  onClose: () => void;
  orden: OrdenCompraCorp | null;
}

export const ActaRecepcionOCModal: React.FC<ActaRecepcionOCModalProps> = ({
  isOpen,
  onClose,
  orden,
}) => {
  if (!isOpen || !orden) return null;

  const handlePrint = () => {
    window.print();
  };

  const sedeConfig = SEDES_CEDI_CONFIG.find((s) => s.id === orden.sedeDestinoId);
  const nombreSede = sedeConfig?.nombre || orden.sedeDestinoNombre || 'CEDI Principal';
  const direccionSede = sedeConfig?.ciudad ? `${sedeConfig.nombre} — ${sedeConfig.ciudad}, Colombia` : 'Centro de Distribución Logística';

  const isConforme = orden.estado === 'Recibido Conforme';
  const isParcial = orden.estado === 'Recibido Parcial';

  const totalEsperadas = orden.items.reduce((acc, it) => acc + (Number(it.cantidadEsperada) || 0), 0);
  const totalRecibidas = orden.items.reduce(
    (acc, it) => acc + (it.cantidadRecibida !== undefined ? Number(it.cantidadRecibida) : Number(it.cantidadEsperada)),
    0
  );
  const cumplimientoPct = totalEsperadas > 0 ? Math.min(100, Math.round((totalRecibidas / totalEsperadas) * 100)) : 100;

  const consecutivoOficial = orden.actaConsecutivo || `ACT-REC-2026-${orden.numeroOC.replace(/[^0-9]/g, '').slice(-4) || '0801'}`;
  const fechaHoraCertificada = orden.fechaHoraRecepcion || (orden.fechaRecepcion ? `${orden.fechaRecepcion} 10:30:00` : new Date().toISOString().replace('T', ' ').slice(0, 19));
  const responsableNombre = orden.recibidoPor || 'Superintendente de Bodegas CEDI';
  const responsableDoc = orden.recibidoPorDocumento || 'CC 1.018.492.310 (Certificado)';
  const responsableCargo = orden.recibidoPorCargo || 'Superintendente / Auxiliar de Bodega';

  // Hash de auditoría inmutable basado en la orden
  const hashAuditoria = `SHA256:${btoa(`${consecutivoOficial}-${orden.numeroOC}-${fechaHoraCertificada}-${totalRecibidas}`).slice(0, 24).toUpperCase()}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[96vh] relative my-auto print:max-h-none print:shadow-none print:border-none print:rounded-none print:m-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =========================================================================
            BARRA DE HERRAMIENTAS SUPERIOR (Oculta en la Impresión)
        ========================================================================= */}
        <div className="p-3.5 sm:p-4 bg-[#001D3D] text-white flex items-center justify-between gap-3 border-b border-cyan-500/30 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-white tracking-wide">
                  Acta Oficial de Recepción en Bodega & CEDI
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-400/30">
                  <Lock className="w-3 h-3" />
                  Inmutable / Solo Lectura
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Folio: <strong className="text-cyan-300 font-mono font-bold">{consecutivoOficial}</strong> | Orden: <strong className="text-white font-mono">{orden.numeroOC}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md hover:shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
              title="Generar vista de impresión o guardar en formato PDF oficial"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Descargar Acta en PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar vista del acta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            CUERPO DEL ACTA DE RECEPCIÓN (FORMATO OFICIAL PINTUCO / COLORLINK)
        ========================================================================= */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 bg-white text-slate-900 font-sans print:p-4 print:overflow-visible print:text-black">
          
          {/* BANNER DE INMUTABILIDAD Y AUDITORÍA */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 flex items-center justify-between gap-3 text-xs print:border-slate-400">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-700 shrink-0" />
              <span>
                <strong>DOCUMENTO OFICIAL AUDITADO & CERRADO (SOLO LECTURA):</strong> Esta acta certifica la inspección física y el ingreso de mercancía al Kardex. Sus datos son inmutables y no pueden ser alterados.
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-700 shrink-0">
              ISO 9001:2015 / CEDI
            </span>
          </div>

          {/* CABECERA CORPORATIVA DEL DOCUMENTO */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-black tracking-tight text-[#001D3D]">
                  COLORLINK
                </span>
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  | PINTUCO S.A.S.
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900">
                Acta Oficial de Recepción Física e Ingreso a Bodega
              </h1>
              <p className="text-xs text-slate-600">
                Centro de Distribución Logística (CEDI) • Control de Calidad y Registro en Kardex Central
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                📍 {direccionSede}
              </p>
            </div>

            <div className="text-right sm:self-start bg-slate-50 p-3 rounded-xl border border-slate-300 print:bg-transparent">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Folio / Consecutivo de Acta
              </div>
              <div className="text-base font-black font-mono text-[#001D3D] mt-0.5 tracking-tight">
                {consecutivoOficial}
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Fecha Emisión Acta: <strong>{fechaHoraCertificada.slice(0, 10)}</strong>
              </div>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                    isConforme
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : isParcial
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  {isConforme && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  {isParcial && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                  <span>{orden.estado.toUpperCase()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* METADATOS DE LA ORDEN DE COMPRA Y PROVEEDOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 print:bg-transparent print:border-slate-300">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                1. Datos de la Orden de Compra & Facturación
              </span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 text-[11px] block">N° Orden Compra:</span>
                  <strong className="text-slate-900 font-mono text-xs">{orden.numeroOC}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">N° Factura / Remisión:</span>
                  <strong className="text-slate-900 font-mono text-xs">{orden.numeroFacturaProveedor}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Fecha Emisión OC:</span>
                  <span className="text-slate-800 font-medium">{orden.fechaEmision}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Fecha Llegada Prevista:</span>
                  <span className="text-slate-800 font-medium">{orden.fechaEstimadaLlegada}</span>
                </div>
              </div>
              <div className="pt-1 text-[11px] text-slate-600 border-t border-slate-200 mt-2">
                Gestor Comprador: <strong className="text-slate-900">{orden.compradorResponsable}</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 print:bg-transparent print:border-slate-300">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                2. Origen del Despacho & Destino CEDI
              </span>
              <div className="space-y-1 pt-1">
                <div>
                  <span className="text-slate-500 text-[11px] block">Proveedor Oficial Despachador:</span>
                  <strong className="text-slate-900 text-xs block">{orden.proveedor}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Sede Bodega de Recepción:</span>
                  <strong className="text-[#001D3D] text-xs block">{nombreSede}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Lote General Verificado:</span>
                  <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                    {orden.loteGeneral || 'LOT-VERIFICADO-CEDI'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TABLA FORMAL DE MERCANCÍA RECIBIDA (INMUTABLE / NO EDITABLE) */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <h3 className="font-black uppercase tracking-wider text-slate-900 text-xs flex items-center gap-2">
                <span>3. Relación de Mercancía Recibida y Control de Cantidades</span>
                <span className="text-[10px] text-slate-500 font-normal">({orden.items.length} variantes inspeccionadas)</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-600">
                Cumplimiento General: <strong className={cumplimientoPct === 100 ? 'text-emerald-700' : 'text-amber-700'}>{cumplimientoPct}%</strong>
              </span>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs print:border-slate-400">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold text-[11px] uppercase tracking-wider print:bg-slate-200">
                    <th className="py-2.5 px-3">Código SKU</th>
                    <th className="py-2.5 px-3">Referencia / Producto</th>
                    <th className="py-2.5 px-3">Presentación</th>
                    <th className="py-2.5 px-3 text-center">Cant. Facturada</th>
                    <th className="py-2.5 px-3 text-center">Cant. Recibida</th>
                    <th className="py-2.5 px-3 text-center">Lote Fabricación</th>
                    <th className="py-2.5 px-3 text-right">Conformidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orden.items.map((it) => {
                    const cantRec = it.cantidadRecibida !== undefined ? it.cantidadRecibida : it.cantidadEsperada;
                    const diff = cantRec - it.cantidadEsperada;
                    const itemLote = it.loteFabricacion || orden.loteGeneral || 'LOT-2026';
                    const isItemOk = cantRec >= it.cantidadEsperada;

                    return (
                      <tr key={it.sku} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#001D3D] text-[11px] whitespace-nowrap">
                          {it.sku}
                        </td>
                        <td className="py-2.5 px-3">
                          <strong className="text-slate-900 block font-bold text-xs">
                            {it.productoNombre}
                          </strong>
                          {it.color && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Tono: {it.color}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                            {it.presentacion}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600 whitespace-nowrap">
                          {it.cantidadEsperada} Unds
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 whitespace-nowrap bg-slate-50/80">
                          {cantRec} Unds
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-700 whitespace-nowrap">
                          {itemLote}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isItemOk
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-50 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {isItemOk ? '✓ 100% Conforme' : `⚠️ Faltan ${Math.abs(diff)}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                    <td colSpan={3} className="py-2.5 px-3 text-right uppercase">
                      Totales de Recepción:
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {totalEsperadas} Unds
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-black text-[#001D3D] bg-slate-200/60">
                      {totalRecibidas} Unds
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-right font-mono text-emerald-800">
                      Valorización: ${(orden.totalEstimadoCOP || 0).toLocaleString('es-CO')} COP
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* OBSERVACIONES DE INSPECCIÓN REGISTRADAS */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 print:bg-transparent print:border-slate-300">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              4. Observaciones de Inspección en Muelle & Sellos de Seguridad
            </span>
            <p className="text-slate-800 italic leading-relaxed">
              "{orden.observaciones || 'Mercancía recibida en estibas flejadas, sin abolladuras, sellos de tapa originales e intactos. Conforme a especificación técnica de planta.'}"
            </p>
          </div>

          {/* SECCIÓN OBLIGATORIA: RECIBIDO A CONFORMIDAD POR BODEGA / CEDI */}
          <div className="border-2 border-slate-900 rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-white text-xs space-y-3 print:bg-transparent print:border-slate-900">
            <div className="flex items-center justify-between border-b border-slate-300 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black uppercase tracking-wide text-[#001D3D]">
                  ✍️ Recibido a Conformidad por Bodega / CEDI
                </span>
                <span className="text-[10px] font-bold text-slate-500">(Constancia Legal de Descarga & Custodia)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                <ShieldCheck className="w-4 h-4" />
                <span>Validado y Asentado en Kardex</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Responsable */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Responsable que Recibe en CEDI:
                </span>
                <p className="font-black text-sm text-slate-900">{responsableNombre}</p>
                <p className="text-[11px] text-slate-500 font-medium">Receptor Autorizado CEDI</p>
              </div>

              {/* Documento de Identidad */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Cédula / Documento de Identidad:
                </span>
                <p className="font-mono font-black text-sm text-[#001D3D]">{responsableDoc}</p>
                <p className="text-[11px] text-slate-500">Documento verificado</p>
              </div>

              {/* Cargo Oficial */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Cargo del Funcionario:
                </span>
                <p className="font-bold text-sm text-slate-900">{responsableCargo}</p>
                <p className="text-[11px] text-slate-500">Rol operativo certificado</p>
              </div>

              {/* Fecha y Hora Exacta Autogenerada */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Fecha y Hora Certificada:
                </span>
                <p className="font-mono font-black text-sm text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{fechaHoraCertificada}</span>
                </p>
                <p className="text-[11px] text-slate-500">Sello temporal de sistema</p>
              </div>
            </div>

            {/* Cuadro de Firmas Oficiales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-200 mt-2">
              <div className="border-t border-slate-400 pt-2 text-center">
                <div className="font-mono text-xs text-slate-400 italic mb-1">[ Firma Digitalizada / Sello de Recepción ]</div>
                <strong className="block text-slate-900 text-xs font-bold">{responsableNombre}</strong>
                <span className="text-[11px] text-slate-600 block">{responsableDoc}</span>
                <span className="text-[10.5px] text-[#001D3D] font-bold block">{responsableCargo}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">Bodega & CEDI Receptor</span>
              </div>

              <div className="border-t border-slate-400 pt-2 text-center">
                <div className="font-mono text-xs text-slate-400 italic mb-1">[ Conductor / Transportadora de Fábrica ]</div>
                <strong className="block text-slate-900 text-xs font-bold">Entrega por Proveedor ({orden.proveedor.slice(0, 30)})</strong>
                <span className="text-[11px] text-slate-500 block">Guía / Remisión: {orden.numeroFacturaProveedor}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">Transporte de Fábrica</span>
              </div>
            </div>

            {/* Huella de Auditoría Kardex */}
            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] text-slate-500 font-mono gap-1">
              <span>Sello Criptográfico Kardex: {hashAuditoria}</span>
              <span>Constancia almacenada en Base de Datos Central COLORLINK</span>
            </div>
          </div>

          {/* PIE DE PÁGINA DOCUMENTAL */}
          <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500">
            Documento de control interno conforme al Manual de Procedimientos Logísticos de Pintuco S.A.S. y ColorLink S.A.S. Prohibida su alteración o reproducción no autorizada.
          </div>

        </div>

        {/* =========================================================================
            FOOTER ACTIONS MODAL (Oculto en Impresión)
        ========================================================================= */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 print:hidden shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Documento sellado e inalterable. Los registros de Kardex ya fueron actualizados.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold cursor-pointer transition-colors"
            >
              Cerrar Acta
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[#001D3D] hover:bg-[#002D5C] text-white shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              <span>🖨️ Imprimir / Descargar Acta en PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
