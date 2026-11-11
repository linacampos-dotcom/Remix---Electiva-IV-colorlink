import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  FlaskConical,
  BookOpen,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ChevronRight,
  ExternalLink,
  Layers,
  Table,
  Sparkles,
  Info,
  Clock,
  MapPin,
  X,
  FileCheck,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import { SEDES_CEDI_CONFIG } from '../services/corporateService';

export type ManualId = 'ntc1335' | 'msds' | 'poe' | 'superficies';

export interface DocumentViewerNTC1335Props {
  selectedManualId: ManualId;
  onSelectManualId: (id: ManualId) => void;
  docCategoryFilter: 'todos' | 'fichas';
  onSelectCategoryFilter: (cat: 'todos' | 'fichas') => void;
  selectedSede: string;
  onSelectSede: (sedeId: string) => void;
  onRegistrarAuditoria?: (modulo: 'Seguridad' | 'Usuarios' | 'Inventario', accion: string, detalle: string) => void;
}

interface SeccionManual {
  id: string;
  numero: string;
  titulo: string;
  resumen: string;
  contenido: React.ReactNode;
  tags: string[];
}

interface ManualConfig {
  id: ManualId;
  codigo: string;
  titulo: string;
  subtitulo: string;
  entidadEmisora: string;
  version: string;
  estado: string;
  fechaActualizacion: string;
  categoria: 'normativo' | 'fichas';
  badgeColor: string;
  icon: React.ReactNode;
  secciones: SeccionManual[];
}

export const DocumentViewerNTC1335: React.FC<DocumentViewerNTC1335Props> = ({
  selectedManualId,
  onSelectManualId,
  docCategoryFilter,
  onSelectCategoryFilter,
  selectedSede,
  onSelectSede,
  onRegistrarAuditoria,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('todos');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Manuales y Normativas oficiales de Pintuco / ColorLink
  const manualesData: Record<ManualId, ManualConfig> = useMemo(() => ({
    ntc1335: {
      id: 'ntc1335',
      codigo: 'NTC 1335:2026 (Cuarta Revisión)',
      titulo: 'Norma Técnica Colombiana NTC 1335: Pinturas al Agua Tipo Emulsión para Uso Arquitectónico',
      subtitulo: 'Especificaciones técnicas obligatorias de calidad, durabilidad, ciclos de lavabilidad, abrasión húmeda y poder cubriente.',
      entidadEmisora: 'ICONTEC Internacional • Comité Técnico 122 Pinturas y Barnices & Laboratorios Pintuco S.A.',
      version: 'Rev. 2026-02 (Oficial Homologada)',
      estado: 'Vigente • Certificación Obligatoria Nacional',
      fechaActualizacion: '15 de Febrero de 2026',
      categoria: 'normativo',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <FileText className="w-5 h-5 text-cyan-600" />,
      secciones: [
        {
          id: 'ntc-obj',
          numero: 'Capítulo 1',
          titulo: 'Objeto, Alcance y Clasificación Oficial (Tipo 1, Tipo 2, Tipo 3)',
          resumen: 'Define los requisitos normativos aplicables a pinturas formuladas a base de dispersiones acrílicas o vinil-acrílicas en medio acuoso.',
          tags: ['alcance', 'tipo 1', 'tipo 2', 'tipo 3', 'clasificación', 'arquitectónico'],
          contenido: (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                Esta norma técnica establece los requisitos físico-químicos y métodos de ensayo que deben cumplir las pinturas
                en emulsión base agua destinadas a la protección y decoración de edificaciones sobre mampostería, pañete, estuco,
                drywall, concreto y madera tratada.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white uppercase tracking-wider mb-1.5">
                    Tipo 1 • Alta Exigencia
                  </span>
                  <p className="font-bold text-slate-900 text-xs mb-1">Viniltex Avanzado & Koraza</p>
                  <p className="text-[11px] text-slate-600">
                    Máxima lavabilidad, resistencia a la abrasión húmeda y excelente retención del color. Formulada para interiores
                    de alto tráfico y exteriores con intemperie severa.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-slate-600 text-white uppercase tracking-wider mb-1.5">
                    Tipo 2 • Exigencia Media
                  </span>
                  <p className="font-bold text-slate-900 text-xs mb-1">Pinturas de Uso General</p>
                  <p className="text-[11px] text-slate-600">
                    Lavabilidad intermedia y buena cobertura en interiores residenciales de tráfico moderado como alcobas y pasillos secundarios.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-amber-600 text-white uppercase tracking-wider mb-1.5">
                    Tipo 3 • Cielos y Techos
                  </span>
                  <p className="font-bold text-slate-900 text-xs mb-1">Cielorrasos y Mampostería Básica</p>
                  <p className="text-[11px] text-slate-600">
                    Acabado ultra mate de bajo reflejo lumínico. No apta para lavado con esponja abrasiva ni zonas con roce continuo.
                  </p>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'ntc-fq',
          numero: 'Capítulo 2',
          titulo: 'Requisitos Físico-Químicos Obligatorios y Composición',
          resumen: 'Especificaciones cuantificables de viscosidad, densidad, pH, finura de molienda y porcentaje de sólidos.',
          tags: ['viscosidad', 'sólidos', 'ph', 'finura', 'ku', 'hegman', 'voc'],
          contenido: (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#001D3D] text-white uppercase font-bold text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Propiedad Físico-Química</th>
                      <th className="px-3 py-2.5">Método de Ensayo</th>
                      <th className="px-3 py-2.5">Pintura Tipo 1</th>
                      <th className="px-3 py-2.5">Pintura Tipo 2</th>
                      <th className="px-3 py-2.5">Pintura Tipo 3</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-bold text-slate-900">Materia No Volátil (% Sólidos en Peso)</td>
                      <td className="px-3 py-2 font-mono text-slate-500">ASTM D2369</td>
                      <td className="px-3 py-2 font-bold text-emerald-700">Mínimo 50.0%</td>
                      <td className="px-3 py-2 text-slate-700">Mínimo 45.0%</td>
                      <td className="px-3 py-2 text-slate-700">Mínimo 40.0%</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-bold text-slate-900">Viscosidad Krebs-Stormer (25°C)</td>
                      <td className="px-3 py-2 font-mono text-slate-500">ASTM D562</td>
                      <td className="px-3 py-2 font-bold text-slate-900">90 - 110 KU</td>
                      <td className="px-3 py-2 text-slate-700">85 - 105 KU</td>
                      <td className="px-3 py-2 text-slate-700">80 - 100 KU</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-bold text-slate-900">Finura de Dispersión (Escala Hegman)</td>
                      <td className="px-3 py-2 font-mono text-slate-500">ASTM D1210</td>
                      <td className="px-3 py-2 font-bold text-emerald-700">≥ 4.5 Hegman</td>
                      <td className="px-3 py-2 text-slate-700">≥ 3.5 Hegman</td>
                      <td className="px-3 py-2 text-slate-700">≥ 2.5 Hegman</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-bold text-slate-900">Potencial de Hidrógeno (pH)</td>
                      <td className="px-3 py-2 font-mono text-slate-500">Potenciométrico</td>
                      <td className="px-3 py-2 font-bold text-slate-900">8.0 - 9.5</td>
                      <td className="px-3 py-2 text-slate-700">8.0 - 9.5</td>
                      <td className="px-3 py-2 text-slate-700">7.5 - 9.5</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-bold text-slate-900">Contenido de VOCs (Compuestos Volátiles)</td>
                      <td className="px-3 py-2 font-mono text-slate-500">Cromatografía Gases</td>
                      <td className="px-3 py-2 font-bold text-emerald-700">&lt; 40 g / L (Ultra Bajo)</td>
                      <td className="px-3 py-2 text-slate-700">&lt; 50 g / L</td>
                      <td className="px-3 py-2 text-slate-700">&lt; 50 g / L</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-bold text-slate-900">Estabilidad en Almacenamiento (50°C x 14d)</td>
                      <td className="px-3 py-2 font-mono text-slate-500">NTC 1335 Cap. 7</td>
                      <td className="px-3 py-2 font-bold text-emerald-700">Sin sinéresis ni coagulación</td>
                      <td className="px-3 py-2 text-slate-700">Conforme</td>
                      <td className="px-3 py-2 text-slate-700">Conforme</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ),
        },
        {
          id: 'ntc-lavabilidad',
          numero: 'Capítulo 3',
          titulo: 'Métodos de Ensayo: Lavabilidad y Resistencia a la Abrasión Húmeda (Gardner)',
          resumen: 'Prueba central de calidad NTC 1335 ejecutada sobre paneles plásticos opacos con medio abrasivo normalizado.',
          tags: ['lavabilidad', 'gardner', 'abrasión', 'ciclos', 'detergente', 'ensayo'],
          contenido: (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                La prueba de abrasión húmeda con la máquina <strong>Gardner Scrub Tester</strong> somete la película curada
                de pintura (espesor seco 0.08 mm a 0.10 mm) a frotamiento oscilatorio con un cepillo de cerdas de nylon
                sumergido en medio abrasivo estandarizado según la norma ASTM D2486 / NTC 1335.
              </p>
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="font-bold text-cyan-300 uppercase tracking-wider text-[10.5px]">
                    Criterios Obligatorios de Lavabilidad por Ciclos
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">NTC 1335 • Numeral 4.2.3</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-cyan-500/30">
                    <span className="text-cyan-400 font-mono text-lg font-black block">&gt; 1,000 Ciclos</span>
                    <span className="text-[10px] text-slate-300 font-bold block">Pintura Tipo 1 (Pintuco Viniltex Avanzado)</span>
                    <span className="text-[9.5px] text-slate-400 mt-1 block">Supera holgadamente las 20,000 frotadas de limpieza doméstica sin desgaste ni decoloración.</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                    <span className="text-slate-200 font-mono text-lg font-black block">&gt; 400 Ciclos</span>
                    <span className="text-[10px] text-slate-300 font-bold block">Pintura Tipo 2</span>
                    <span className="text-[9.5px] text-slate-400 mt-1 block">Resiste limpieza con esponja suave humedecida en agua jabonosa no abrasiva.</span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                    <span className="text-slate-400 font-mono text-lg font-black block">&gt; 100 Ciclos</span>
                    <span className="text-[10px] text-slate-400 font-bold block">Pintura Tipo 3</span>
                    <span className="text-[9.5px] text-slate-400 mt-1 block">Únicamente apta para remoción de polvo superficial en seco o paño ligeramente húmedo.</span>
                  </div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs">Nota de Auditoría de Calidad ICONTEC:</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Cualquier lote que presente pérdida prematura de adhesión, rotura de película o exposición del sustrato antes
                    de alcanzar el número mínimo de ciclos queda inmediatamente bloqueado en cuarentena del CEDI y no puede ser
                    despachado a obras comerciales ni ferreterías.
                  </p>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'ntc-cubrimiento',
          numero: 'Capítulo 4',
          titulo: 'Poder de Cubrimiento y Relación de Contraste (Opacidad)',
          resumen: 'Medición espectrofotométrica sobre cartulinas de contraste blanco/negro Leneta para garantizar óptimo rendimiento por galón.',
          tags: ['cubrimiento', 'contraste', 'opacidad', 'leneta', 'rendimiento', 'm2'],
          contenido: (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                El poder de cubrimiento se evalúa mediante la <strong>relación de contraste (Rc)</strong> calculada como el cociente
                entre la reflectancia luminosa de la pintura aplicada sobre fondo negro (Yb) y sobre fondo blanco (Yw) a un espesor de
                película húmeda de 0.075 mm (3 mils):
              </p>
              <div className="p-3 bg-slate-100 rounded-xl font-mono text-center text-xs text-slate-900 font-bold border border-slate-300">
                Rc = ( Reflectancia sobre fondo negro Yb / Reflectancia sobre fondo blanco Yw ) × 100%
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-[11px] text-slate-600">
                <li><strong className="text-slate-900">Tipo 1:</strong> Relación de contraste mínima de <strong>96.0%</strong> (98.0% en Viniltex Blanco Puro). Permite rendimiento oficial de <strong>28 a 32 m²/galón a 2 manos</strong>.</li>
                <li><strong className="text-slate-900">Tipo 2:</strong> Relación de contraste mínima de <strong>90.0%</strong>. Rendimiento recomendado de 20 a 24 m²/galón a 2 manos.</li>
                <li><strong className="text-slate-900">Tipo 3:</strong> Relación de contraste mínima de <strong>85.0%</strong>. Requiere 3 manos sobre sustratos de color contrastante.</li>
              </ul>
            </div>
          ),
        },
        {
          id: 'ntc-intemperie',
          numero: 'Capítulo 5',
          titulo: 'Resistencia a la Intemperie, Radiación UV y Envejecimiento Acelerado',
          resumen: 'Requisitos específicos para recubrimientos de exterior (Pintuco Koraza) sometidos a ciclos de condensación y lámparas fluorescentes UV-A.',
          tags: ['intemperie', 'quv', 'uv', 'koraza', 'ampollamiento', 'tizado', 'solidez'],
          contenido: (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                Las pinturas en emulsión clasificadas para exterior deben someterse a <strong>500 horas de ensayo QUV</strong> (ciclos alternados
                de 4 horas de luz UV a 60°C y 4 horas de condensación a 50°C según norma ASTM G154):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-bold text-slate-900 text-xs mb-1">Cero Tizado (Chalking):</p>
                  <p className="text-[11px] text-slate-600">
                    Calificación no inferior a 8 según ASTM D4214. La película mantiene su cohesión molecular sin pulverizarse al frote manual.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="font-bold text-slate-900 text-xs mb-1">Cero Ampollamiento (Blistering):</p>
                  <p className="text-[11px] text-slate-600">
                    Ausencia total de burbujas osmóticas o microfisuras (ensayo ASTM D714). Retención de brillo y color ΔE &lt; 1.5.
                  </p>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'ntc-embalaje',
          numero: 'Capítulo 6',
          titulo: 'Rotulado Obligatorio, Envase y Criterios de Aceptación y Rechazo',
          resumen: 'Parámetros legales de etiquetado comercial, lote de fabricación, fecha de vencimiento y trazabilidad CEDI.',
          tags: ['rotulado', 'etiquetado', 'lote', 'vencimiento', 'garantía', 'rechazo'],
          contenido: (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                Todo recipiente de pintura despachado desde plantas de Pintuco debe portar de manera indeleble la siguiente información:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-medium">✓ Nombre comercial y fabricante</div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-medium">✓ Clasificación Tipo (1, 2 o 3)</div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-medium">✓ Sello oficial NTC 1335</div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-medium">✓ Volumen neto en Gal / Litros</div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-medium">✓ Número de Lote y Fecha</div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-medium">✓ Instrucciones de dilución</div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-medium">✓ Contenido de VOC en g/L</div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-medium">✓ Consejos de seguridad SGA</div>
              </div>
            </div>
          ),
        },
      ],
    },
    msds: {
      id: 'msds',
      codigo: 'MSDS-SGA-2026-PTC-702',
      titulo: 'Fichas de Datos de Seguridad MSDS (SGA / GHS): Recubrimientos y Resinas Acrílicas',
      subtitulo: 'Protocolo de manejo seguro, almacenamiento de materias primas, control de derrames y toxicología ocupacional.',
      entidadEmisora: 'Gerencia de Salud Ocupacional, Seguridad y Medio Ambiente (SST-MA) Pintuco',
      version: 'v4.8 - Sistema Globalmente Armonizado (SGA Rev. 9)',
      estado: 'Aprobado y Vigente 2026',
      fechaActualizacion: '10 de Enero de 2026',
      categoria: 'fichas',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
      secciones: [
        {
          id: 'msds-peligros',
          numero: 'Sección 1 & 2',
          titulo: 'Identificación de Sustancias Químicas y Clasificación de Peligros SGA',
          resumen: 'Elementos del etiquetado de seguridad: pictogramas normalizados, palabras de advertencia y frases de peligro.',
          tags: ['sga', 'pictogramas', 'peligros', 'frases h', 'frases p', 'químico'],
          contenido: (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                  <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm mb-2 border border-red-300">
                    !
                  </div>
                  <p className="font-bold text-red-900 text-xs mb-1">GHS07 • Signo de Exclamación</p>
                  <p className="text-[11px] text-red-800 leading-tight">
                    Irritación ocular leve (Cat. 2B), sensibilización cutánea potencial en personas alérgicas a isotiazolinonas (Cat. 1).
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs mb-2 border border-slate-300">
                    SGA
                  </div>
                  <p className="font-bold text-slate-900 text-xs mb-1">Palabra de Advertencia: ATENCIÓN</p>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Producto base acuosa no inflamable. En condiciones normales de uso no representa riesgo de explosión ni fuego directo.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs mb-2 border border-emerald-300">
                    Eco
                  </div>
                  <p className="font-bold text-emerald-900 text-xs mb-1">GHS09 • Medio Ambiente</p>
                  <p className="text-[11px] text-emerald-800 leading-tight">
                    Tóxico moderado para organismos acuáticos en estado puro no diluido (H412). No verter en alcantarillados.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900 text-xs mb-1.5">Frases de Prudencia Obligatorias (P):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <p><strong>P261:</strong> Evitar respirar vapores de aspersión en pistola airless.</p>
                  <p><strong>P280:</strong> Llevar guantes de nitrilo y gafas con protección lateral.</p>
                  <p><strong>P305+P351:</strong> En caso de contacto con ojos, enjuagar con agua durante 15 min.</p>
                  <p><strong>P501:</strong> Eliminar el contenido/recipiente en centro autorizado de reciclaje.</p>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'msds-primeros-auxilios',
          numero: 'Sección 3 & 4',
          titulo: 'Composición Química e Instrucciones de Primeros Auxilios Inmediatos',
          resumen: 'Procedimientos de respuesta rápida ante inhalación masiva, contacto ocular, dérmico o ingestión accidental.',
          tags: ['primeros auxilios', 'ojos', 'inhalación', 'ingestión', 'biocida', 'cmit'],
          contenido: (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#001D3D] text-white uppercase font-bold text-[10px]">
                    <tr>
                      <th className="px-3.5 py-2.5">Componente Crítico</th>
                      <th className="px-3 py-2.5">Número CAS</th>
                      <th className="px-3 py-2.5">Concentración (% p/p)</th>
                      <th className="px-3 py-2.5">Límite Permisible (TLV-TWA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-bold text-slate-900">Polímero Acrílico Puro / Vinil-VeoVa</td>
                      <td className="px-3 py-2 font-mono text-slate-500">25085-34-1</td>
                      <td className="px-3 py-2">25.0% - 40.0%</td>
                      <td className="px-3 py-2 text-emerald-700 font-bold">No Aplica (No tóxico)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-bold text-slate-900">Dióxido de Titanio Rutilo (TiO2)</td>
                      <td className="px-3 py-2 font-mono text-slate-500">13463-67-7</td>
                      <td className="px-3 py-2">15.0% - 25.0%</td>
                      <td className="px-3 py-2">10 mg/m³ (Polvo inhalable)</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-bold text-slate-900">Biocida Isotiazolinonas (MIT / CMIT)</td>
                      <td className="px-3 py-2 font-mono text-slate-500">55965-84-9</td>
                      <td className="px-3 py-2 font-bold text-amber-700">&lt; 0.05%</td>
                      <td className="px-3 py-2">0.05 mg/m³</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ),
        },
        {
          id: 'msds-almacenamiento',
          numero: 'Sección 7 & 8',
          titulo: 'Almacenamiento Seguro en CEDIs y Controles de Exposición Ocupacional / EPP',
          resumen: 'Reglas de estibado, ventilación en bodegas de distribución, temperatura operativa y elementos de protección.',
          tags: ['almacenamiento', 'cedi', 'epp', 'guantes', 'estiba', 'ventilación'],
          contenido: (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-600" />
                    Protocolo en Bodegas de CEDIs Pintuco:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Temperatura controlada entre <strong>5°C y 38°C</strong>. Evitar congelación o exposición solar continua.</li>
                    <li>Estibado máximo vertical: <strong>3 niveles de cuñetes</strong> o <strong>4 niveles de cajas de galones</strong> sobre estiba certificada.</li>
                    <li>Separación mínima de 60 cm entre filas y paredes para ventilación y pasillos de montacargas.</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Equipo de Protección Personal (EPP):
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                    <li><strong>Manos:</strong> Guantes de nitrilo o neopreno calibre 15 mils.</li>
                    <li><strong>Ojos:</strong> Monogafas de seguridad con ventilación indirecta (ANSI Z87.1).</li>
                    <li><strong>Respiración:</strong> Mascarilla N95 para ambientes de dosificación tintométrica.</li>
                    <li><strong>Cuerpo:</strong> Overol de algodón o peto impermeable resistente a salpicaduras.</li>
                  </ul>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'msds-derrames',
          numero: 'Sección 6 & 13',
          titulo: 'Protocolo de Contención de Derrames y Disposición Ecológica de Residuos',
          resumen: 'Actuación en caso de fuga en bodega, material absorbente inerte y tratamiento de aguas de lavado.',
          tags: ['derrames', 'absorbente', 'arena', 'residuos', 'lodos', 'medio ambiente'],
          contenido: (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                En caso de rotura de cuñete o derrame accidental en muelles de carga o área de tintometría:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 text-[11px] text-slate-600">
                <li>Acordonar el área afectada e impedir que el fluido alcance rejillas de aguas lluvias o alcantarillado.</li>
                <li>Cubrir el derrame con <strong>arena seca, arcilla expandida o aserrín inerte</strong> para solidificar la emulsión.</li>
                <li>Recoger con pala antichispas y depositar en tambor plástico rotulado como <em>"Residuo Sólido No Peligroso - Lodos de Pintura"</em>.</li>
                <li>Lavar el piso residual con mínima cantidad de agua recolectando el efluente en el sistema de trampa de grasas y sólidos del CEDI.</li>
              </ol>
            </div>
          ),
        },
      ],
    },
    poe: {
      id: 'poe',
      codigo: 'POE-LAB-CAL-042-B2B',
      titulo: 'Procedimiento Operativo Estandarizado (POE): Calibración Tintométrica y Muestreo en Cuarentena',
      subtitulo: 'Control metrológico de máquinas dosificadoras, dispensación de colorantes, agitación giroscópica y liberación de pedidos B2B.',
      entidadEmisora: 'Dirección de Operaciones Industriales y Control Metrológico Pintuco',
      version: 'v3.2 - Procedimiento Vigente Oficial',
      estado: 'Aprobado • Auditoría Semestral CEDI',
      fechaActualizacion: '22 de Enero de 2026',
      categoria: 'fichas',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: <FlaskConical className="w-5 h-5 text-purple-600" />,
      secciones: [
        {
          id: 'poe-purga',
          numero: 'POE 01',
          titulo: 'Verificación Matutina, Purga y Limpieza de Boquillas Tintométricas',
          resumen: 'Mantenimiento preventivo diario al inicio de jornada para evitar formación de costras o taponamiento en los 16 canisters.',
          tags: ['purga', 'boquillas', 'canisters', 'dosificadora', 'tintometría', 'matutino'],
          contenido: (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                Al inicio de cada turno operativo (06:00 AM o apertura de despacho), el operario asignado debe ejecutar:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900 text-xs mb-1">Paso 1: Humectación de Boquillas:</p>
                  <p className="text-[11px] text-slate-600">
                    Limpiar el anillo dosificador con paño libre de pelusa impregnado en agua desmineralizada. Verificar que la esponja del humidificador contenga líquido suficiente.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-900 text-xs mb-1">Paso 2: Disparo de Purga Oficial:</p>
                  <p className="text-[11px] text-slate-600">
                    Ejecutar desde el software el comando <em>"Purga Completa 16 Circuitos"</em> (disparo de 0.2 mL por colorante) en la bandeja colectora para purgar aire atrapado.
                  </p>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'poe-tolerancia',
          numero: 'POE 02',
          titulo: 'Calibración Volumétrica (Tolerancia ±0.05 mL) y Control Gravimétrico',
          resumen: 'Validación metrológica con balanza analítica de 3 cifras decimales para garantizar repetibilidad de color entre galones.',
          tags: ['tolerancia', 'balanza', 'calibración', 'gravimétrico', 'mililitros', 'onza'],
          contenido: (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <p>
                Cada 15 días o tras cada cambio de lote de colorante universal, se efectúa la comprobación metrológica
                por triplicado pesando una inyección de <strong>1/48 de onza fluida (0.616 mL)</strong> y <strong>1 onza fluida (29.57 mL)</strong>:
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#001D3D] text-white uppercase font-bold text-[10px]">
                    <tr>
                      <th className="px-3.5 py-2">Volumen Teórico</th>
                      <th className="px-3 py-2">Tolerancia Máxima Permitida</th>
                      <th className="px-3 py-2">Criterio de Aprobación</th>
                      <th className="px-3 py-2">Acción Correctiva</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-bold text-slate-900">Micro-dosis (0.10 a 0.50 mL)</td>
                      <td className="px-3 py-2 font-mono text-emerald-700 font-bold">± 0.02 mL (± 3.0%)</td>
                      <td className="px-3 py-2">Aprobado para tonos pastel</td>
                      <td className="px-3 py-2 text-slate-500">Recalibrar micropaso de pistón</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-3.5 py-2 font-bold text-slate-900">Macro-dosis (&gt; 1.00 mL)</td>
                      <td className="px-3 py-2 font-mono text-emerald-700 font-bold">± 0.05 mL (± 0.5%)</td>
                      <td className="px-3 py-2">Aprobado para tonos acentuados</td>
                      <td className="px-3 py-2 text-slate-500">Ajustar factor K de la bomba</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ),
        },
        {
          id: 'poe-agitacion',
          numero: 'POE 03',
          titulo: 'Protocolo de Homogeneización por Agitación Giroscópica Biaxial',
          resumen: 'Tiempos mínimos obligatorios de mezclado mecánico para garantizar dispersión completa del colorante sin cizallamiento térmico.',
          tags: ['agitación', 'giroscópica', 'mezclado', 'cuñete', 'galón', 'tiempo'],
          contenido: (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200">
                  <span className="text-[10px] font-black uppercase text-purple-700 block">Cuñete (5 Galones)</span>
                  <span className="text-xl font-black text-purple-900 font-mono my-1 block">3:30 min</span>
                  <p className="text-[11px] text-purple-800">
                    Rotación simultánea sobre ambos ejes a 180 RPM. Obligatorio verificar ausencia de pigmento sedimentado en el fondo.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-700 block">Galón (1 Galón)</span>
                  <span className="text-xl font-black text-slate-900 font-mono my-1 block">2:00 min</span>
                  <p className="text-[11px] text-slate-600">
                    Tiempo óptimo para bases Pastel, Tint y Deep en Viniltex y Koraza.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-700 block">Cuarto (1/4 Galón)</span>
                  <span className="text-xl font-black text-slate-900 font-mono my-1 block">1:30 min</span>
                  <p className="text-[11px] text-slate-600">
                    Suficiente para dispersión homogénea sin sobrecalentar el producto.
                  </p>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'poe-cuarentena',
          numero: 'POE 04 & 06',
          titulo: 'Muestreo en Cuarentena CEDI y Matriz de Desviación de Color ΔE',
          resumen: 'Control de calidad espectrofotométrico en despachos de alto volumen B2B para constructoras y contratistas.',
          tags: ['delta e', 'espectrofotómetro', 'cuarentena', 'muestreo', 'b2b', 'calidad'],
          contenido: (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                Para pedidos institucionales superiores a 20 cuñetes de un mismo color preparado:
              </p>
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] border-b border-slate-700 pb-1.5">
                  <span className="font-bold text-cyan-300">Tolerancia Espectrofotométrica CIE L*a*b* (Iluminante D65 / 10°)</span>
                  <span className="font-mono text-emerald-400">ΔE Oficial Pintuco</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                  <div className="p-2.5 bg-slate-800 rounded-lg">
                    <span className="font-mono text-emerald-400 font-bold block">ΔE ≤ 0.80</span>
                    <span className="text-slate-300 font-bold block">Conformidad Total</span>
                    <span className="text-[10px] text-slate-400">Liberación inmediata de pedido B2B.</span>
                  </div>
                  <div className="p-2.5 bg-slate-800 rounded-lg">
                    <span className="font-mono text-amber-400 font-bold block">0.81 &lt; ΔE ≤ 1.20</span>
                    <span className="text-slate-300 font-bold block">Ajuste de Tintometría</span>
                    <span className="text-[10px] text-slate-400">Requiere adición milimétrica de compensación.</span>
                  </div>
                  <div className="p-2.5 bg-slate-800 rounded-lg">
                    <span className="font-mono text-red-400 font-bold block">ΔE &gt; 1.20</span>
                    <span className="text-slate-300 font-bold block">Rechazo de Lote</span>
                    <span className="text-[10px] text-slate-400">Bloqueo en cuarentena y remisión a fábrica.</span>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    superficies: {
      id: 'superficies',
      codigo: 'MAN-TECN-OBRA-2026',
      titulo: 'Manual Técnico: Preparación de Superficies, Diagnóstico de Humedad y Ensayos de Adherencia',
      subtitulo: 'Procedimiento de inspección de obra, neutralización de alcalinidad y garantía de durabilidad.',
      entidadEmisora: 'División de Soporte Técnico Especializado ColorLink & Pintuco',
      version: 'v2.5 - Especificación de Campo',
      estado: 'Aprobado para Interventoría',
      fechaActualizacion: '05 de Febrero de 2026',
      categoria: 'normativo',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <Layers className="w-5 h-5 text-amber-600" />,
      secciones: [
        {
          id: 'sup-humedad',
          numero: 'Capítulo 1',
          titulo: 'Diagnóstico de Humedad Capilar, Eflorescencias y Porosidad',
          resumen: 'Uso de higrómetro de carburo y cintas reactivas de pH para validar si el muro está listo para recibir pintura.',
          tags: ['humedad', 'higrómetro', 'eflorescencias', 'ph', 'alcalinidad', 'muro'],
          contenido: (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                Ninguna pintura debe aplicarse sobre pañetes o estucos que no hayan completado su tiempo de curado de al menos
                <strong> 28 días</strong> o que presenten mediciones fuera de los siguientes rangos de seguridad:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-0.5">Humedad del Sustrato:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm block">Máximo 4.0%</span>
                  <p className="text-slate-600 text-[10.5px] mt-1">Medido con higrómetro digital de contacto en al menos 5 puntos aleatorios por cada 50 m².</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-0.5">Alcalinidad Residual (pH):</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm block">pH entre 7.0 y 8.5</span>
                  <p className="text-slate-600 text-[10.5px] mt-1">Si el pH es superior a 9.0, es obligatorio aplicar Sellador Antialcalino Pintuco antes de la pintura de acabado.</p>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: 'sup-adherencia',
          numero: 'Capítulo 4',
          titulo: 'Ensayo de Adherencia en Obra: Prueba de Cuadrícula (Cross-Hatch Test)',
          resumen: 'Método normalizado ASTM D3359 para verificar la fijación mecánica de la pintura sobre el estuco o pintura antigua.',
          tags: ['adherencia', 'cuadrícula', 'astm d3359', 'cinta', 'desprendimiento'],
          contenido: (
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>
                Se realizan 6 cortes paralelos verticales y 6 horizontales separados por 1 mm con cuchilla de precisión formando una cuadrícula de 25 cuadros.
                Se adhiere cinta normalizada sensible a la presión y se desprende de un tirón rápido a 180°:
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
                <strong>Criterio de Aprobación Oficial:</strong> Se exige clasificación <strong>5B (0% de desprendimiento)</strong> o <strong>4B (&lt;5% en intersecciones)</strong>.
                Si se desprende más del 15% (Clasificación 2B o inferior), la superficie debe ser lijada a fondo hasta el sustrato firme y reimprimada.
              </div>
            </div>
          ),
        },
      ],
    },
  }), []);

  const currentManual = manualesData[selectedManualId] || manualesData.ntc1335;

  // Filtrado de secciones por búsqueda y selector de capítulo
  const filteredSecciones = useMemo(() => {
    let result = currentManual.secciones;

    if (selectedSectionFilter !== 'todos') {
      result = result.filter((sec) => sec.id === selectedSectionFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (sec) =>
          sec.titulo.toLowerCase().includes(q) ||
          sec.numero.toLowerCase().includes(q) ||
          sec.resumen.toLowerCase().includes(q) ||
          sec.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return result;
  }, [currentManual, selectedSectionFilter, searchQuery]);

  // Manejo de Descarga / Generación de Documento Oficial
  const handleDownloadDocument = () => {
    if (onRegistrarAuditoria) {
      onRegistrarAuditoria(
        'Seguridad',
        'Descarga de Documento Normativo',
        `Descarga/Exportación del manual: ${currentManual.titulo} (${currentManual.codigo}) - Sede: ${selectedSede}`
      );
    }

    setDownloadSuccessToast(
      `¡Documento oficial "${currentManual.codigo}" generado con sello de certificación NTC 1335!`
    );

    setTimeout(() => {
      setDownloadSuccessToast(null);
    }, 4500);

    // Abrir ventana de impresión formateada
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* =========================================================================
          ENCABEZADO DINÁMICO: TÍTULO + BADGE NORMATIVO + SELECTOR DE SEDE CEDI
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#001D3D] via-[#002D5C] to-[#0A192F] text-cyan-300 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-cyan-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none">
                Manuales & NTC 1335 • {docCategoryFilter === 'fichas' ? 'Fichas MSDS & POE' : 'Repositorio Normativo'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-black bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Normativa ICONTEC NTC 1335 • Vigente 2026
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5 leading-tight">
              Ensayos de Laboratorio, Hojas de Seguridad MSDS y Procedimientos Oficiales de Calidad
            </p>
          </div>
        </div>

        {/* Selector de Sede CEDI activo */}
        <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/90 py-1 px-2.5 rounded-md border border-slate-200/90 transition-all shadow-2xs self-start sm:self-auto shrink-0">
          <div className="w-5 h-5 rounded bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200/80 shrink-0 shadow-2xs">
            <MapPin className="w-3 h-3" />
          </div>
          <div className="text-left">
            <label htmlFor="sedeSelectorDocsViewer" className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block leading-none">
              Sede / CEDI Activo:
            </label>
            <select
              id="sedeSelectorDocsViewer"
              value={selectedSede}
              onChange={(e) => onSelectSede(e.target.value)}
              className="bg-transparent text-slate-900 font-black text-[11px] focus:outline-none cursor-pointer mt-0.5 pr-1 leading-tight"
            >
              <option value="todas">🏢 Todas las Sedes (Consolidado Nacional)</option>
              {SEDES_CEDI_CONFIG.map((sede) => (
                <option key={sede.id} value={sede.id}>
                  📍 {sede.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TOAST DE CONFIRMACIÓN DE DESCARGA */}
      {downloadSuccessToast && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-900 text-emerald-100 rounded-xl border border-emerald-700 shadow-md animate-fadeIn text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadSuccessToast(null)}
            className="p-1 hover:bg-emerald-800 rounded text-emerald-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          1. TARJETAS PRINCIPALES DEL REPOSITORIO NORMATIVO (100% INTERACTIVAS ONCLICK)
      ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Selecciona un Manual o Documento para Lectura Completa:
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Mostrando 4 manuales homologados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tarjeta 1: Norma ICONTEC NTC 1335 */}
          <div
            onClick={() => {
              onSelectManualId('ntc1335');
              onSelectCategoryFilter('todos');
              setSelectedSectionFilter('todos');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              selectedManualId === 'ntc1335'
                ? 'bg-gradient-to-b from-blue-50/80 to-white border-blue-600 shadow-md ring-2 ring-blue-500/30'
                : 'bg-white border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300'
            }`}
          >
            {selectedManualId === 'ntc1335' && (
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                <div className="absolute transform rotate-45 bg-blue-600 text-white text-[9px] font-black py-0.5 right-[-35px] top-[18px] w-[120px] text-center shadow-xs">
                  ACTIVO
                </div>
              </div>
            )}
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-transform group-hover:scale-105 ${
                selectedManualId === 'ntc1335' ? 'bg-blue-600 text-white' : 'bg-cyan-100 text-cyan-900'
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                NTC 1335
              </span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors">
              Norma ICONTEC NTC 1335
            </h3>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              Lavabilidad Gardner, abrasión húmeda (&gt;1,000 ciclos), poder de cubrimiento y sólidos.
            </p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
              <span className="font-bold text-emerald-700">Vigente 2026</span>
              <span className="text-slate-400 group-hover:text-blue-600 font-bold flex items-center gap-0.5">
                Leer documento <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Fichas de Seguridad MSDS */}
          <div
            onClick={() => {
              onSelectManualId('msds');
              onSelectCategoryFilter('fichas');
              setSelectedSectionFilter('todos');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              selectedManualId === 'msds'
                ? 'bg-gradient-to-b from-blue-50/80 to-white border-blue-600 shadow-md ring-2 ring-blue-500/30'
                : 'bg-white border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300'
            }`}
          >
            {selectedManualId === 'msds' && (
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                <div className="absolute transform rotate-45 bg-blue-600 text-white text-[9px] font-black py-0.5 right-[-35px] top-[18px] w-[120px] text-center shadow-xs">
                  ACTIVO
                </div>
              </div>
            )}
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-transform group-hover:scale-105 ${
                selectedManualId === 'msds' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                SGA / GHS
              </span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-blue-700 transition-colors">
              Fichas de Seguridad MSDS
            </h3>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              Hojas técnicas de manejo de pigmentos, biocidas y solventes bajo el Sistema Globalmente Armonizado.
            </p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
              <span className="font-bold text-emerald-700">14 Fichas CEDI</span>
              <span className="text-slate-400 group-hover:text-blue-600 font-bold flex items-center gap-0.5">
                Leer documento <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Procedimientos Operativos POE */}
          <div
            onClick={() => {
              onSelectManualId('poe');
              onSelectCategoryFilter('fichas');
              setSelectedSectionFilter('todos');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              selectedManualId === 'poe'
                ? 'bg-gradient-to-b from-blue-50/80 to-white border-blue-600 shadow-md ring-2 ring-blue-500/30'
                : 'bg-white border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-300'
            }`}
          >
            {selectedManualId === 'poe' && (
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                <div className="absolute transform rotate-45 bg-blue-600 text-white text-[9px] font-black py-0.5 right-[-35px] top-[18px] w-[120px] text-center shadow-xs">
                  ACTIVO
                </div>
              </div>
            )}
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-transform group-hover:scale-105 ${
                selectedManualId === 'poe' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-900'
              }`}>
                <FlaskConical className="w-5 h-5" />
              </div>
              <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                POE LAB
              </span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-purple-700 transition-colors">
              Procedimientos Operativos POE
            </h3>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              Calibración tintométrica (±0.05 mL), purgas y toma de muestras en cuarentena para B2B.
            </p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
              <span className="font-bold text-purple-700">Calibración Activa</span>
              <span className="text-slate-400 group-hover:text-purple-600 font-bold flex items-center gap-0.5">
                Leer documento <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Tarjeta 4: Manual de Superficies y Adherencia */}
          <div
            onClick={() => {
              onSelectManualId('superficies');
              onSelectCategoryFilter('todos');
              setSelectedSectionFilter('todos');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
              selectedManualId === 'superficies'
                ? 'bg-gradient-to-b from-blue-50/80 to-white border-blue-600 shadow-md ring-2 ring-blue-500/30'
                : 'bg-white border-slate-200/90 shadow-2xs hover:shadow-md hover:border-amber-300'
            }`}
          >
            {selectedManualId === 'superficies' && (
              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                <div className="absolute transform rotate-45 bg-blue-600 text-white text-[9px] font-black py-0.5 right-[-35px] top-[18px] w-[120px] text-center shadow-xs">
                  ACTIVO
                </div>
              </div>
            )}
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-transform group-hover:scale-105 ${
                selectedManualId === 'superficies' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Campo & Obra
              </span>
            </div>
            <h3 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-amber-700 transition-colors">
              Preparación de Superficies
            </h3>
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              Diagnóstico de humedad capilar, eflorescencias, pH y pruebas de adherencia ASTM D3359.
            </p>
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
              <span className="font-bold text-amber-700">Interventoría</span>
              <span className="text-slate-400 group-hover:text-amber-600 font-bold flex items-center gap-0.5">
                Leer documento <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. VISTA DETALLADA DEL DOCUMENTO / MANUAL SELECCIONADO (PANEL DERECHO)
      ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* CABECERA NORMATIVA OFICIAL */}
        <div className="bg-gradient-to-r from-[#001D3D] via-[#002D5C] to-[#0A192F] text-white p-5 sm:p-6 border-b border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black font-mono bg-cyan-400/20 text-cyan-200 border border-cyan-400/30">
                  {currentManual.codigo}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                  {currentManual.estado}
                </span>
                <span className="text-[10.5px] text-slate-300 font-mono">
                  {currentManual.version} • Actualizado: {currentManual.fechaActualizacion}
                </span>
              </div>

              <h1 className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tight leading-snug">
                {currentManual.titulo}
              </h1>

              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                {currentManual.subtitulo}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-cyan-200 font-medium pt-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{currentManual.entidadEmisora}</span>
              </div>
            </div>

            {/* BOTÓN DESCARGAR / IMPRIMIR PDF */}
            <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
              <button
                type="button"
                onClick={handleDownloadDocument}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer transform active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Documento / PDF</span>
              </button>
            </div>
          </div>

          {/* SELECTOR RÁPIDO DE DOCUMENTOS (PÍLDORAS) */}
          <div className="flex items-center gap-2 overflow-x-auto pt-5 mt-4 border-t border-slate-700/60 pb-1 scrollbar-thin">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Documentos:
            </span>
            {(['ntc1335', 'msds', 'poe', 'superficies'] as ManualId[]).map((mId) => {
              const m = manualesData[mId];
              const isSelected = selectedManualId === mId;
              return (
                <button
                  key={mId}
                  type="button"
                  onClick={() => {
                    onSelectManualId(mId);
                    setSelectedSectionFilter('todos');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-[#001D3D] shadow-sm font-black'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-600' : 'bg-slate-400'}`} />
                  {m.codigo.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* BARRA DE HERRAMIENTAS: BÚSQUEDA INTERNA + FILTRO POR SECCIONES */}
        <div className="p-4 sm:p-5 bg-slate-50/90 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar en ${currentManual.codigo} (ej: lavabilidad, abrasión, biocida, calibración, pH, sólidos, VOC)...`}
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro por Capítulos / Secciones */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedSectionFilter}
              onChange={(e) => setSelectedSectionFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="todos">Todos los Capítulos / Secciones ({currentManual.secciones.length})</option>
              {currentManual.secciones.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.numero}: {sec.titulo.slice(0, 45)}...
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CONTENIDO ESTRUCTURADO DEL MANUAL EN FORMATO DE LECTURA PROFESIONAL */}
        <div className="p-5 sm:p-7 space-y-6">
          {filteredSecciones.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <FileCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No se encontraron secciones para "{searchQuery}"</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Intenta con otros términos como "lavabilidad", "abrasión húmeda", "Gardner", "pH", "viscosidad" o limpia el filtro de búsqueda.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSectionFilter('todos');
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100"
              >
                Ver todo el documento
              </button>
            </div>
          ) : (
            filteredSecciones.map((sec, idx) => (
              <article
                key={sec.id}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-3.5"
              >
                {/* Cabecera de la Sección */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#001D3D] text-cyan-300 font-mono">
                      {sec.numero}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                      {sec.titulo}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {sec.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[9.5px] font-medium bg-slate-100 text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resumen Ejecutivo de la Sección */}
                <p className="text-xs text-slate-500 italic bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                  <strong>Resumen Normativo:</strong> {sec.resumen}
                </p>

                {/* Cuerpo y Tablas Técnicas */}
                <div className="pt-1">{sec.contenido}</div>
              </article>
            ))
          )}
        </div>

        {/* PIE DE PÁGINA NORMATIVO CON TRAZABILIDAD NTC 1335 */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Documento oficial auditado bajo la norma <strong>NTC 1335 e ICONTEC</strong>. Prohibida su alteración sin autorización del Comité Técnico.
            </span>
          </div>
          <div className="font-mono text-[10px] text-slate-400">
            Sello Digital: PNT-NTC1335-2026-VAL
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL DE VISTA PREVIA / IMPRESIÓN OFICIAL FORMATEADA
      ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#001D3D] text-cyan-300 flex items-center justify-center font-bold">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Certificado de Consulta y Ficha Técnica Oficial
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Documento exportable con sello de homologación NTC 1335
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hoja membretada oficial */}
            <div className="p-6 rounded-2xl border-2 border-slate-300 bg-white space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h4 className="font-black text-base text-[#001D3D]">COLORLINK • PINTUCO S.A.</h4>
                  <p className="text-[10px] font-bold text-slate-500">REPOSITORIO TÉCNICO NORMATIVO Y CALIDAD</p>
                </div>
                <div className="text-right font-mono text-[10px]">
                  <p className="font-bold text-slate-900">{currentManual.codigo}</p>
                  <p className="text-slate-500">Fecha: {new Date().toLocaleDateString('es-CO')}</p>
                </div>
              </div>

              <div>
                <h5 className="font-black text-sm text-slate-900 mb-1">{currentManual.titulo}</h5>
                <p className="text-slate-600 text-[11px] leading-relaxed">{currentManual.subtitulo}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] grid grid-cols-2 gap-2">
                <div><strong>Entidad Emisora:</strong> {currentManual.entidadEmisora}</div>
                <div><strong>Versión Oficial:</strong> {currentManual.version}</div>
                <div><strong>Estado de Certificación:</strong> {currentManual.estado}</div>
                <div><strong>Sede / CEDI:</strong> {selectedSede === 'todas' ? 'Consolidado Nacional' : selectedSede.toUpperCase()}</div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="font-bold text-slate-900 text-xs">Secciones Certificadas Incluidas ({currentManual.secciones.length}):</p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
                  {currentManual.secciones.map((s) => (
                    <li key={s.id}>
                      <strong>{s.numero}:</strong> {s.titulo}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>Certificación Oficial ICONTEC NTC 1335</span>
                <span>Firma Autorizada: Dirección de Calidad Pintuco</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#001D3D] text-white hover:bg-[#002D5C] flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Guardar como PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
