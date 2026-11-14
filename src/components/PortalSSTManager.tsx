import React, { useState, useEffect } from 'react';
import { UserSession } from '../types';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Users,
  HardHat,
  FileText,
  FileCheck,
  CheckCircle2,
  Clock,
  Phone,
  Search,
  Filter,
  Download,
  Plus,
  X,
  Building2,
  MapPin,
  Calendar,
  Activity,
  Award,
  Sparkles,
  ChevronRight,
  Eye,
  AlertCircle,
  FileSpreadsheet,
  Check,
  RefreshCw,
} from 'lucide-react';

export type SubTabSST = 'iperc' | 'emergencias' | 'copasst' | 'atel' | 'epp_capacitaciones';

interface PortalSSTManagerProps {
  activeSubTab: SubTabSST;
  onChangeSubTab: (tab: SubTabSST) => void;
  selectedSede: string;
  onChangeSede?: (sede: string) => void;
  userSession?: UserSession | null;
  onRegistrarAuditoria?: (modulo: string, accion: string, detalle: string) => void;
}

// ---------------------------------------------------------------------------
// TIPOS DE DATOS SST
// ---------------------------------------------------------------------------
export interface PeligroIPERC {
  id: string;
  codigo: string;
  proceso: string;
  zona: string;
  peligroTipo: 'Químico' | 'Físico' | 'Mecánico' | 'Ergonómico' | 'Locativo';
  descripcionPeligro: string;
  efectosPosibles: string;
  nivelDeficiencia: number; // 2, 6, 10
  nivelExposicion: number; // 1, 2, 3, 4
  nivelConsecuencia: number; // 10, 25, 60, 100
  nivelRiesgo: number; // Deficiencia * Exposicion * Consecuencia
  clasificacionRiesgo: 'I (No Aceptable)' | 'II (Aceptable con Control)' | 'III (Aceptable)';
  controlesExistentes: string;
  medidasPropuestas: string;
  responsable: string;
}

export interface IncidenteSST {
  id: string;
  folio: string;
  fecha: string;
  hora: string;
  sede: string;
  areaTrabajo: string;
  tipoEvento: 'Condición Insegura' | 'Acto Inseguro' | 'Casi-Accidente' | 'Accidente de Trabajo';
  reportante: string;
  cargoReportante: string;
  descripcion: string;
  severidad: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  medidasInmediatas: string;
  estado: 'Abierto' | 'En Investigación' | 'Cerrado con Medidas';
  leccionAprendida?: string;
}

export interface Brigadista {
  id: string;
  nombre: string;
  sede: string;
  rolBrigada: 'Líder General de Brigada' | 'Primeros Auxilios' | 'Control de Derrames & Incendio' | 'Evacuación & Rescate';
  telefonoContacto: string;
  certificacionVigente: string;
  estado: 'Activo' | 'Capacitación';
}

export interface EntregaEPP {
  id: string;
  funcionarioNombre: string;
  cargo: string;
  sede: string;
  eppDetalle: string;
  fechaEntrega: string;
  proximoRecambio: string;
  normaCertificacion: string;
  firmado: boolean;
}

export interface SesionCapacitacionSST {
  id: string;
  tema: string;
  tipo: 'Inducción' | 'Manejo Sustancias Químicas' | 'Trabajo Seguro' | 'Ergonomía' | 'Primeros Auxilios';
  fechaProgramada: string;
  instructor: string;
  asistentesEsperados: number;
  asistentesConfirmados: number;
  estado: 'Ejecutada' | 'Programada';
  calificacionPromedio: number;
}

// ---------------------------------------------------------------------------
// DATOS SEMILLA SST
// ---------------------------------------------------------------------------
const PELIGROS_IPERC_DEFAULT: PeligroIPERC[] = [
  {
    id: 'iperc-1',
    codigo: 'IPERC-QUI-001',
    proceso: 'Preparación y Dosificación de Tintes',
    zona: 'Tintometría & Laboratorio de Color',
    peligroTipo: 'Químico',
    descripcionPeligro: 'Inhalación de vapores orgánicos volátiles (COVs) y solventes al mezclar esmaltes sintéticos.',
    efectosPosibles: 'Cefalea, irritación de mucosas, mareo, toxicidad acumulativa.',
    nivelDeficiencia: 6,
    nivelExposicion: 3,
    nivelConsecuencia: 25,
    nivelRiesgo: 450,
    clasificacionRiesgo: 'II (Aceptable con Control)',
    controlesExistentes: 'Cabinas con extracción localizada de aire, renovación por filtros de carbón activado.',
    medidasPropuestas: 'Respiradores media cara 3M con cartucho 6003 contra vapores orgánicos y gases ácidos; rotulado SGA obligatorio.',
    responsable: 'Coordinador SST & Jefe Tintometría',
  },
  {
    id: 'iperc-2',
    codigo: 'IPERC-ERG-002',
    proceso: 'Cargue y Descargue de Pintura',
    zona: 'Bodega CEDI & Zona de Despachos',
    peligroTipo: 'Ergonómico',
    descripcionPeligro: 'Levantamiento y manipulación manual de cargas pesadas (cuñetes de 5 galones / 25 kg).',
    efectosPosibles: 'Lumbalgias, espasmos musculares y lesiones osteomusculares crónicas.',
    nivelDeficiencia: 6,
    nivelExposicion: 3,
    nivelConsecuencia: 25,
    nivelRiesgo: 450,
    clasificacionRiesgo: 'II (Aceptable con Control)',
    controlesExistentes: 'Transpaletas manuales y carretillas tipo zorra para transporte.',
    medidasPropuestas: 'Capacitación en técnica biomecánica de levantamiento, fajas ergonómicas y limitación de carga unipersonal a 25 kg.',
    responsable: 'Líder de Bodega & Fisioterapeuta ARL',
  },
  {
    id: 'iperc-3',
    codigo: 'IPERC-MEC-003',
    proceso: 'Agitación y Mezclado Mecánico',
    zona: 'Zona de Mezcladores Giroscópicos',
    peligroTipo: 'Mecánico',
    descripcionPeligro: 'Atrapamiento de extremidades o ropa suelta en eje de máquinas agitadoras de latas.',
    efectosPosibles: 'Trauma en manos, fracturas por atrapamiento rotacional.',
    nivelDeficiencia: 2,
    nivelExposicion: 2,
    nivelConsecuencia: 60,
    nivelRiesgo: 240,
    clasificacionRiesgo: 'II (Aceptable con Control)',
    controlesExistentes: 'Carcasa cerrada con interruptor de fin de carrera que detiene el motor si la compuerta se abre.',
    medidasPropuestas: 'Inspección bimestral de microswitches de seguridad y señalización de parada de emergencia.',
    responsable: 'Mantenimiento Industrial & SST',
  },
  {
    id: 'iperc-4',
    codigo: 'IPERC-LOC-004',
    proceso: 'Tránsito peatonal y montacargas',
    zona: 'Pasillos de Almacenamiento CEDI',
    peligroTipo: 'Locativo',
    descripcionPeligro: 'Caídas a nivel por derrames accidentales de pintura vinílica o base solvente en piso epóxico.',
    efectosPosibles: 'Contusiones, esguinces de tobillo, golpes.',
    nivelDeficiencia: 2,
    nivelExposicion: 2,
    nivelConsecuencia: 10,
    nivelRiesgo: 40,
    clasificacionRiesgo: 'III (Aceptable)',
    controlesExistentes: 'Kit anti-derrames con material absorbente y señalización de piso húmedo.',
    medidasPropuestas: 'Protocolo de limpieza inmediata y calzado de seguridad con suela antideslizante certificada.',
    responsable: 'Servicios Generales & Brigadistas',
  },
];

const INCIDENTES_DEFAULT: IncidenteSST[] = [
  {
    id: 'inc-1',
    folio: 'SST-INC-2026-081',
    fecha: '2026-10-18',
    hora: '10:45 AM',
    sede: 'Medellín / Itagüí (CEDI Principal)',
    areaTrabajo: 'Tintometría y Mezcla',
    tipoEvento: 'Casi-Accidente',
    reportante: 'Carlos Mario Restrepo',
    cargoReportante: 'Operador de Máquina Tintométrica',
    descripcion: 'Al manipular un envase de 1 galón de solvente xileno, la válvula de desfogue presentó una fuga de presión sin contacto en ojos.',
    severidad: 'Media',
    medidasInmediatas: 'Se cerró válvula general, se colocó mascarilla con filtro y se cambió empaque de teflón del dosificador.',
    estado: 'Cerrado con Medidas',
    leccionAprendida: 'Revisión obligatoria de empaques de sellado previa a cada turno de tinturado.',
  },
  {
    id: 'inc-2',
    folio: 'SST-INC-2026-082',
    fecha: '2026-10-29',
    hora: '03:15 PM',
    sede: 'Bogotá (CEDI Fontibón)',
    areaTrabajo: 'Muelle de Carga',
    tipoEvento: 'Condición Insegura',
    reportante: 'Yeison Steven Vargas',
    cargoReportante: 'Auxiliar Logístico',
    descripcion: 'Estiba de madera astillada con riesgo de perforación en saco de pigmento de dióxido de titanio.',
    severidad: 'Baja',
    medidasInmediatas: 'Se retiró estiba a zona de reciclaje y se trasladó la mercancía a estiba plástica certificada.',
    estado: 'Cerrado con Medidas',
    leccionAprendida: 'Inspección visual obligatoria en recepción de maderas según norma fitosanitaria.',
  },
  {
    id: 'inc-3',
    folio: 'SST-INC-2026-083',
    fecha: '2026-11-04',
    hora: '11:20 AM',
    sede: 'Cali (CEDI Yumbo)',
    areaTrabajo: 'Almacén de Químicos',
    tipoEvento: 'Acto Inseguro',
    reportante: 'Lina María Ospina',
    cargoReportante: 'Supervisora de Calidad & SST',
    descripcion: 'Trabajador contratista ingresó a zona de trasvase sin portar monogafas de protección química.',
    severidad: 'Media',
    medidasInmediatas: 'Se detuvo la labor, se suministraron las monogafas y se realizó charla de 5 minutos sobre riesgo ocular.',
    estado: 'Cerrado con Medidas',
    leccionAprendida: 'No se permite ingreso a contratistas sin verificación previa de EPP completo.',
  },
];

const BRIGADISTAS_DEFAULT: Brigadista[] = [
  {
    id: 'brig-1',
    nombre: 'Ing. Mateo Gómez Montoya',
    sede: 'Medellín / Itagüí (CEDI Principal)',
    rolBrigada: 'Líder General de Brigada',
    telefonoContacto: '+57 (311) 782-9014',
    certificacionVigente: 'Cruz Roja Colombiana • Nivel Avanzado 2026',
    estado: 'Activo',
  },
  {
    id: 'brig-2',
    nombre: 'Laura Camila Henao',
    sede: 'Medellín / Itagüí (CEDI Principal)',
    rolBrigada: 'Primeros Auxilios',
    telefonoContacto: '+57 (314) 555-8912',
    certificacionVigente: 'SOP-BLS Soporte Vital Básico 2026',
    estado: 'Activo',
  },
  {
    id: 'brig-3',
    nombre: 'Nelson Javier Torres',
    sede: 'Bogotá (CEDI Fontibón)',
    rolBrigada: 'Control de Derrames & Incendio',
    telefonoContacto: '+57 (318) 420-1178',
    certificacionVigente: 'Bomberos Oficiales Bogotá • Manejo Químicos NFPA',
    estado: 'Activo',
  },
  {
    id: 'brig-4',
    nombre: 'Diana Marcela Cárdenas',
    sede: 'Cali (CEDI Yumbo)',
    rolBrigada: 'Evacuación & Rescate',
    telefonoContacto: '+57 (312) 890-3456',
    certificacionVigente: 'ARL Sura • Coordinador de Evacuación',
    estado: 'Activo',
  },
];

const ENTREGAS_EPP_DEFAULT: EntregaEPP[] = [
  {
    id: 'epp-1',
    funcionarioNombre: 'Carlos Mario Restrepo',
    cargo: 'Operador de Máquina Tintométrica',
    sede: 'Medellín (Itagüí)',
    eppDetalle: 'Respirador media cara 3M + Cartuchos 6003 (Vapores Orgánicos) + Monogafas antiempañantes + Guantes de nitrilo resistente a solventes',
    fechaEntrega: '2026-10-01',
    proximoRecambio: '2026-12-01',
    normaCertificacion: 'NIOSH TC-23C / ANSI Z87.1',
    firmado: true,
  },
  {
    id: 'epp-2',
    funcionarioNombre: 'Yeison Steven Vargas',
    cargo: 'Auxiliar Logístico de Bodega',
    sede: 'Bogotá (Fontibón)',
    eppDetalle: 'Botas de seguridad con puntera dieléctrica + Guantes anticorte nivel 5 + Chaleco reflectivo de alta visibilidad clase 2',
    fechaEntrega: '2026-09-15',
    proximoRecambio: '2027-03-15',
    normaCertificacion: 'ASTM F2413-18 / EN 388',
    firmado: true,
  },
  {
    id: 'epp-3',
    funcionarioNombre: 'Nelson Javier Torres',
    cargo: 'Operador de Envasado & Rotulado',
    sede: 'Medellín (Itagüí)',
    eppDetalle: 'Protector auditivo tipo copa 27 dB + Delantal de PVC resistente a salpicaduras químicas + Guantes de neopreno',
    fechaEntrega: '2026-10-10',
    proximoRecambio: '2027-04-10',
    normaCertificacion: 'ANSI S3.19 / EN 374-1',
    firmado: true,
  },
];

const CAPACITACIONES_DEFAULT: SesionCapacitacionSST[] = [
  {
    id: 'cap-1',
    tema: 'Manejo Seguro de Sustancias Químicas y Sistema Globalmente Armonizado (SGA)',
    tipo: 'Manejo Sustancias Químicas',
    fechaProgramada: '2026-10-15',
    instructor: 'Ing. Químico Especialista SST (ARL Sura)',
    asistentesEsperados: 25,
    asistentesConfirmados: 25,
    estado: 'Ejecutada',
    calificacionPromedio: 4.9,
  },
  {
    id: 'cap-2',
    tema: 'Higiene Postural y Biomecánica en la Manipulación de Cuñetes de 5 Galones',
    tipo: 'Ergonomía',
    fechaProgramada: '2026-10-24',
    instructor: 'Fisioterapeuta Ocupacional ARL',
    asistentesEsperados: 30,
    asistentesConfirmados: 29,
    estado: 'Ejecutada',
    calificacionPromedio: 4.8,
  },
  {
    id: 'cap-3',
    tema: 'Simulacro Teórico-Práctico: Control de Derrames Químicos y Uso de Absorbentes',
    tipo: 'Manejo Sustancias Químicas',
    fechaProgramada: '2026-11-05',
    instructor: 'Líder de Brigada de Emergencia',
    asistentesEsperados: 20,
    asistentesConfirmados: 20,
    estado: 'Ejecutada',
    calificacionPromedio: 5.0,
  },
  {
    id: 'cap-4',
    tema: 'Primeros Auxilios Básicos y Activación de la Cadena de Supervivencia',
    tipo: 'Primeros Auxilios',
    fechaProgramada: '2026-11-20',
    instructor: 'Paramédico Cruz Roja Colombiana',
    asistentesEsperados: 22,
    asistentesConfirmados: 18,
    estado: 'Programada',
    calificacionPromedio: 0,
  },
];

export const PortalSSTManager: React.FC<PortalSSTManagerProps> = ({
  activeSubTab,
  onChangeSubTab,
  selectedSede,
  userSession,
  onRegistrarAuditoria,
}) => {
  // Estados de datos
  const [peligros, setPeligros] = useState<PeligroIPERC[]>(() => {
    const saved = localStorage.getItem('colorlink_sst_peligros');
    return saved ? JSON.parse(saved) : PELIGROS_IPERC_DEFAULT;
  });

  const [incidentes, setIncidentes] = useState<IncidenteSST[]>(() => {
    const saved = localStorage.getItem('colorlink_sst_incidentes');
    return saved ? JSON.parse(saved) : INCIDENTES_DEFAULT;
  });

  const [brigadistas] = useState<Brigadista[]>(BRIGADISTAS_DEFAULT);
  const [entregasEPP] = useState<EntregaEPP[]>(ENTREGAS_EPP_DEFAULT);
  const [capacitaciones] = useState<SesionCapacitacionSST[]>(CAPACITACIONES_DEFAULT);

  // Filtros
  const [ipercFilterTipo, setIpercFilterTipo] = useState<string>('todos');
  const [searchIPERC, setSearchIPERC] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal para Reportar Incidente / Condición Insegura
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    tipoEvento: 'Casi-Accidente' as IncidenteSST['tipoEvento'],
    sede: 'Medellín / Itagüí (CEDI Principal)',
    areaTrabajo: 'Tintometría y Mezcla de Pinturas',
    reportante: userSession?.nombre || 'Funcionario SST',
    cargoReportante: userSession?.corporateRole || 'Operador Industrial',
    severidad: 'Media' as IncidenteSST['severidad'],
    descripcion: '',
    medidasInmediatas: '',
  });

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem('colorlink_sst_incidentes', JSON.stringify(incidentes));
  }, [incidentes]);

  // Manejo de nuevo reporte
  const handleCrearReporteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.descripcion.trim()) {
      alert('Por favor detalla la descripción del incidente o condición insegura.');
      return;
    }

    const folioNum = Math.floor(100 + Math.random() * 900);
    const nuevoIncidente: IncidenteSST = {
      id: `inc-${Date.now()}`,
      folio: `SST-INC-2026-${folioNum}`,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sede: reportForm.sede,
      areaTrabajo: reportForm.areaTrabajo,
      tipoEvento: reportForm.tipoEvento,
      reportante: reportForm.reportante,
      cargoReportante: reportForm.cargoReportante,
      descripcion: reportForm.descripcion.trim(),
      severidad: reportForm.severidad,
      medidasInmediatas: reportForm.medidasInmediatas.trim() || 'Aislamiento del punto y aviso a brigadista.',
      estado: 'En Investigación',
      leccionAprendida: 'En proceso de investigación por Comité Paritario COPASST.',
    };

    const actualizados = [nuevoIncidente, ...incidentes];
    setIncidentes(actualizados);
    setIsReportModalOpen(false);

    if (onRegistrarAuditoria) {
      onRegistrarAuditoria(
        'SST',
        'REPORTE_INCIDENTE',
        `Radicado ${nuevoIncidente.folio} (${nuevoIncidente.tipoEvento}) en ${nuevoIncidente.sede} reportado por ${nuevoIncidente.reportante}.`
      );
    }

    setToastMessage(`¡Alerta SST Radicada exitosamente con folio ${nuevoIncidente.folio}! Se notificó al equipo de brigada.`);
    setTimeout(() => setToastMessage(null), 5000);

    // Reset form
    setReportForm({
      tipoEvento: 'Casi-Accidente',
      sede: 'Medellín / Itagüí (CEDI Principal)',
      areaTrabajo: 'Tintometría y Mezcla de Pinturas',
      reportante: userSession?.nombre || 'Funcionario SST',
      cargoReportante: userSession?.corporateRole || 'Operador Industrial',
      severidad: 'Media',
      descripcion: '',
      medidasInmediatas: '',
    });
  };

  // Exportar IPERC a CSV
  const handleExportIPERC = () => {
    const headers = ['Código', 'Proceso', 'Zona', 'Tipo', 'Descripción Peligro', 'Efectos', 'ND', 'NE', 'NC', 'NR', 'Clasificación', 'Controles Existentes', 'Medidas Propuestas', 'Responsable'];
    const rows = peligros.map((p) => [
      `"${p.codigo}"`,
      `"${p.proceso}"`,
      `"${p.zona}"`,
      `"${p.peligroTipo}"`,
      `"${p.descripcionPeligro.replace(/"/g, '""')}"`,
      `"${p.efectosPosibles.replace(/"/g, '""')}"`,
      p.nivelDeficiencia,
      p.nivelExposicion,
      p.nivelConsecuencia,
      p.nivelRiesgo,
      `"${p.clasificacionRiesgo}"`,
      `"${p.controlesExistentes.replace(/"/g, '""')}"`,
      `"${p.medidasPropuestas.replace(/"/g, '""')}"`,
      `"${p.responsable}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Matriz_IPERC_Pintuco_SST_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage('Matriz IPERC descargada exitosamente en formato CSV / Excel.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtrado de peligros IPERC
  const peligrosFiltrados = peligros.filter((p) => {
    const matchTipo = ipercFilterTipo === 'todos' || p.peligroTipo === ipercFilterTipo;
    const matchSearch =
      !searchIPERC.trim() ||
      p.codigo.toLowerCase().includes(searchIPERC.toLowerCase()) ||
      p.proceso.toLowerCase().includes(searchIPERC.toLowerCase()) ||
      p.descripcionPeligro.toLowerCase().includes(searchIPERC.toLowerCase()) ||
      p.zona.toLowerCase().includes(searchIPERC.toLowerCase());
    return matchTipo && matchSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* =========================================================================
          ENCABEZADO INSTITUCIONAL DEL PORTAL SST
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-700 to-[#001D3D] text-white flex items-center justify-center shrink-0 shadow-xs ring-1 ring-emerald-500/30">
            <ShieldAlert className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                Portal SST • Seguridad y Salud en el Trabajo
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Decreto 1072 de 2015 • ISO 45001:2018
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-tight">
              Sistema de Gestión SST Pintuco / ColorLink • Prevención de riesgos, brigadas y cultura de autocuidado
            </p>
          </div>
        </div>

        {/* Botón de Acción Rápida: Reportar Incidente */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportIPERC}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            title="Exportar Matriz IPERC"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar Matriz</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-700 text-white hover:from-red-700 hover:to-rose-800 transition-all cursor-pointer shadow-sm hover:shadow-md ring-2 ring-red-600/20"
          >
            <AlertTriangle className="w-4 h-4 text-white animate-bounce" />
            <span>+ Reportar Incidente / Acto Inseguro</span>
          </button>
        </div>
      </div>

      {/* TOAST DE NOTIFICACIÓN */}
      {toastMessage && (
        <div className="flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-xl border border-slate-700 shadow-lg text-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          INDICADORES GLOBALES (KPIs DE SST)
      ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Días sin Accidentes */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 shadow-2xs relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Días sin Accidentes</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">148</span>
            <span className="text-xs font-bold text-emerald-600">Cero Daño</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Meta corporativa: &gt; 365 días continuos</span>
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
        </div>

        {/* KPI 2: Incidentes Reportados */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/90 shadow-2xs relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alertas Reportadas</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">{incidentes.length}</span>
            <span className="text-xs font-bold text-amber-600">100% Atendidas</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Tiempo prom. respuesta: &lt; 2 horas</span>
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
        </div>

        {/* KPI 3: Cumplimiento COPASST */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200/90 shadow-2xs relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Plan COPASST</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">96.4%</span>
            <span className="text-xs font-bold text-blue-600">Conforme</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-500" />
            <span>10 de 10 actas mensuales al día</span>
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
        </div>

        {/* KPI 4: Capacitaciones Ejecutadas */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200/90 shadow-2xs relative overflow-hidden group hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Capacitaciones SST</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">18 / 20</span>
            <span className="text-xs font-bold text-purple-600">90% Avance</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span>94 operarios capacitados en 2026</span>
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
        </div>
      </div>

      {/* =========================================================================
          SELECTOR DE SUBPESTAÑAS SST (5 SUBMÓDULOS NORMATIVOS)
      ========================================================================= */}
      <div className="bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-1 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {/* Submódulo 1 */}
          <button
            type="button"
            onClick={() => onChangeSubTab('iperc')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'iperc'
                ? 'bg-[#001D3D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${activeSubTab === 'iperc' ? 'text-amber-300' : 'text-slate-500'}`} />
            <span>1. Matriz IPERC & Riesgos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
              activeSubTab === 'iperc' ? 'bg-amber-400/20 text-amber-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {peligros.length}
            </span>
          </button>

          {/* Submódulo 2 */}
          <button
            type="button"
            onClick={() => onChangeSubTab('emergencias')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'emergencias'
                ? 'bg-[#001D3D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${activeSubTab === 'emergencias' ? 'text-red-300' : 'text-slate-500'}`} />
            <span>2. Plan de Emergencias & Brigadas</span>
          </button>

          {/* Submódulo 3 */}
          <button
            type="button"
            onClick={() => onChangeSubTab('copasst')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'copasst'
                ? 'bg-[#001D3D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className={`w-3.5 h-3.5 ${activeSubTab === 'copasst' ? 'text-blue-300' : 'text-slate-500'}`} />
            <span>3. Comité COPASST & Convivencia</span>
          </button>

          {/* Submódulo 4 */}
          <button
            type="button"
            onClick={() => onChangeSubTab('atel')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'atel'
                ? 'bg-[#001D3D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <AlertCircle className={`w-3.5 h-3.5 ${activeSubTab === 'atel' ? 'text-rose-300' : 'text-slate-500'}`} />
            <span>4. Accidentes & Incidentes (ATEL)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
              activeSubTab === 'atel' ? 'bg-rose-400/20 text-rose-200' : 'bg-slate-100 text-slate-600'
            }`}>
              {incidentes.length}
            </span>
          </button>

          {/* Submódulo 5 */}
          <button
            type="button"
            onClick={() => onChangeSubTab('epp_capacitaciones')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'epp_capacitaciones'
                ? 'bg-[#001D3D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HardHat className={`w-3.5 h-3.5 ${activeSubTab === 'epp_capacitaciones' ? 'text-emerald-300' : 'text-slate-500'}`} />
            <span>5. Capacitaciones & EPP</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          CONTENIDO: SUBMÓDULO 1: MATRIZ IPERC & RIESGOS
      ========================================================================= */}
      {activeSubTab === 'iperc' && (
        <div className="space-y-4">
          {/* Barra de filtros IPERC */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchIPERC}
                onChange={(e) => setSearchIPERC(e.target.value)}
                placeholder="Buscar peligro por código (ej: IPERC-QUI-001), proceso, zona o solvente..."
                className="w-full pl-9 pr-8 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
              {searchIPERC && (
                <button
                  type="button"
                  onClick={() => setSearchIPERC('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-bold text-slate-500 shrink-0">Clasificación:</span>
              <select
                value={ipercFilterTipo}
                onChange={(e) => setIpercFilterTipo(e.target.value)}
                className="bg-slate-50 text-slate-800 font-bold text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="todos">Todos los Peligros ({peligros.length})</option>
                <option value="Químico">🧪 Químico (Solventes / Vapores)</option>
                <option value="Ergonómico">📦 Ergonómico (Cuñetes / Carga)</option>
                <option value="Mecánico">⚙️ Mecánico (Agitadores / Máquinas)</option>
                <option value="Locativo">🏢 Locativo (Pisos / Derrames)</option>
              </select>
            </div>
          </div>

          {/* Tabla IPERC */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Matriz de Identificación de Peligros, Evaluación y Control de Riesgos (GTC 45)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {peligrosFiltrados.length} {peligrosFiltrados.length === 1 ? 'registro' : 'registros'} evaluados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-50/60">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Proceso & Zona</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Descripción del Peligro</th>
                    <th className="py-2.5 px-2 text-center">Valoración NR</th>
                    <th className="py-2.5 px-3">Controles & Medidas Propuestas</th>
                    <th className="py-2.5 px-3">Responsable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {peligrosFiltrados.map((p) => {
                    return (
                      <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                            {p.codigo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900 leading-tight">{p.proceso}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{p.zona}</span>
                          </p>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.peligroTipo === 'Químico'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : p.peligroTipo === 'Ergonómico'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : p.peligroTipo === 'Mecánico'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {p.peligroTipo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 max-w-xs">
                          <p className="font-medium text-slate-800 leading-snug">{p.descripcionPeligro}</p>
                          <p className="text-[10px] text-rose-600 mt-0.5">Efecto: {p.efectosPosibles}</p>
                        </td>
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <div className="inline-block px-2 py-1 rounded-lg bg-slate-100 border border-slate-200">
                            <span className="font-mono font-black text-xs block text-slate-900">{p.nivelRiesgo}</span>
                            <span className={`text-[9px] font-bold block ${
                              p.clasificacionRiesgo.includes('I ')
                                ? 'text-red-700'
                                : p.clasificacionRiesgo.includes('II ')
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}>
                              {p.clasificacionRiesgo.split(' ')[0]}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 max-w-sm">
                          <p className="text-[11px] text-slate-600">
                            <strong className="text-slate-800">Existente:</strong> {p.controlesExistentes}
                          </p>
                          <p className="text-[11px] text-emerald-700 mt-0.5">
                            <strong className="text-emerald-800">Mejora:</strong> {p.medidasPropuestas}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 text-[11px]">
                          {p.responsable}
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
          CONTENIDO: SUBMÓDULO 2: PLAN DE EMERGENCIAS & BRIGADAS
      ========================================================================= */}
      {activeSubTab === 'emergencias' && (
        <div className="space-y-5">
          {/* Directorio de Emergencias Externas */}
          <div className="bg-gradient-to-r from-red-900 via-rose-900 to-[#001D3D] text-white p-5 rounded-2xl border border-red-800 shadow-sm">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-300" />
                <h3 className="text-sm font-black tracking-wide uppercase">
                  Directorio de Emergencias Médicas & Líneas de Ayuda Externa (24/7)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-400/20 text-red-200 border border-red-400/30">
                Activación Inmediata
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
                <span className="text-[10px] font-bold text-red-200 block">Cuerpo de Bomberos</span>
                <span className="text-lg font-black font-mono text-white mt-0.5 block">119</span>
                <span className="text-[10px] text-slate-300 mt-1 block">Conato de incendio / Derrames</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
                <span className="text-[10px] font-bold text-emerald-200 block">Línea Salvavidas ARL Sura</span>
                <span className="text-sm font-black font-mono text-white mt-1 block">01 8000 511 414</span>
                <span className="text-[10px] text-slate-300 mt-1 block">Urgencias laborales ATEL</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
                <span className="text-[10px] font-bold text-cyan-200 block">CISPROQUIM (Químicos)</span>
                <span className="text-sm font-black font-mono text-white mt-1 block">01 8000 916 012</span>
                <span className="text-[10px] text-slate-300 mt-1 block">Asesoría toxicológica solventes</span>
              </div>
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15">
                <span className="text-[10px] font-bold text-amber-200 block">Cruz Roja & Ambulancias</span>
                <span className="text-lg font-black font-mono text-white mt-0.5 block">132 / 123</span>
                <span className="text-[10px] text-slate-300 mt-1 block">Atención prehospitalaria</span>
              </div>
            </div>
          </div>

          {/* Brigadistas Oficiales de Emergencia */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Brigada de Emergencia Certificada por Sede
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {brigadistas.length} integrantes activos con chaleco y dotación
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {brigadistas.map((b) => (
                <div key={b.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-800 border border-red-200">
                      {b.rolBrigada}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {b.estado}
                    </span>
                  </div>
                  <h4 className="font-black text-slate-900 text-xs">{b.nombre}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>{b.sede}</span>
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[10px] text-slate-600 space-y-1">
                    <p className="flex items-center gap-1 text-blue-700 font-bold font-mono">
                      <Phone className="w-3 h-3 text-blue-600" />
                      <span>{b.telefonoContacto}</span>
                    </p>
                    <p className="text-slate-400 text-[9.5px] truncate" title={b.certificacionVigente}>
                      {b.certificacionVigente}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rutas de Evacuación y Puntos de Encuentro */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Puntos de Encuentro Seguro y Recursos por Sede
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-slate-700 mt-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block text-xs">Sede Medellín / Itagüí (CEDI Principal)</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  <strong>Punto de Encuentro:</strong> Zona verde exterior frente a Portería 1 (Avenida Los Guayabales).
                </p>
                <p className="text-[10px] text-emerald-700 mt-1">
                  Equipamiento: 6 Gabinetes contra incendio, 12 Extintores Solkaflam & Polvo Químico ABC, Camilla rígida y DEA.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block text-xs">Sede Bogotá (CEDI Fontibón)</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  <strong>Punto de Encuentro:</strong> Parqueadero de visitantes sector norte junto a rampa peatonal.
                </p>
                <p className="text-[10px] text-emerald-700 mt-1">
                  Equipamiento: Ducha lavaojos de emergencia en zona de tinturado, kit de control de derrames de 55 galones.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block text-xs">Sede Cali (CEDI Yumbo)</span>
                <p className="text-[11px] text-slate-500 mt-1">
                  <strong>Punto de Encuentro:</strong> Plazoleta central de maniobras costado oriental.
                </p>
                <p className="text-[10px] text-emerald-700 mt-1">
                  Equipamiento: Extintores de CO2 para tableros eléctricos, botiquín tipo B de trauma y alarma sonora industrial.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTENIDO: SUBMÓDULO 3: COMITÉ COPASST & CONVIVENCIA
      ========================================================================= */}
      {activeSubTab === 'copasst' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Comité Paritario de Seguridad y Salud en el Trabajo (COPASST 2025-2027)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Órgano de promoción y vigilancia de las normas de SST según Resolución 2013 de 1986 y Decreto 1072.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                Periodo Legal Vigente
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Representantes Empleador */}
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 block mb-2">
                  Representantes del Empleador (Pintuco / ColorLink)
                </span>
                <ul className="text-xs text-slate-700 space-y-2">
                  <li className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-100">
                    <div>
                      <p className="font-bold text-slate-900">Dr. Roberto Valenzuela</p>
                      <p className="text-[10px] text-slate-500">Director de Operaciones & Logística</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 font-mono">Principal</span>
                  </li>
                  <li className="flex items-center justify-between bg-white p-2 rounded-lg border border-blue-100">
                    <div>
                      <p className="font-bold text-slate-900">Ing. Laura Cristina Restrepo</p>
                      <p className="text-[10px] text-slate-500">Jefe de Aseguramiento de Calidad</p>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 font-mono">Suplente</span>
                  </li>
                </ul>
              </div>

              {/* Representantes Trabajadores */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 block mb-2">
                  Representantes Elegidos por los Trabajadores
                </span>
                <ul className="text-xs text-slate-700 space-y-2">
                  <li className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-100">
                    <div>
                      <p className="font-bold text-slate-900">Carlos Mario Restrepo</p>
                      <p className="text-[10px] text-slate-500">Líder Operario de Tintometría</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 font-mono">Principal</span>
                  </li>
                  <li className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-100">
                    <div>
                      <p className="font-bold text-slate-900">Yeison Steven Vargas</p>
                      <p className="text-[10px] text-slate-500">Auxiliar de Despachos & Almacén</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 font-mono">Suplente</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actas Mensuales COPASST 2026 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Historial de Actas Ordinarias Formalizadas 2026
            </h4>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-mono font-bold text-slate-900 mr-2">ACTA-COPASST-2026-10</span>
                  <span className="font-bold text-slate-800">Reunión Ordinaria Mensual de Octubre</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Seguimiento a inspección de extintores, dotación de mascarillas para tintometría y preparación del simulacro.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Aprobada 100%
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setToastMessage('Acta COPASST descargada en PDF formal.');
                      setTimeout(() => setToastMessage(null), 3500);
                    }}
                    className="p-1.5 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Descargar Acta"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-mono font-bold text-slate-900 mr-2">ACTA-COPASST-2026-09</span>
                  <span className="font-bold text-slate-800">Reunión Ordinaria Mensual de Septiembre</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Revisión de matriz de dotación de EPP, mediciones higiénicas de ruido en mezcladores y luminiscencia en bodega.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Aprobada 100%
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setToastMessage('Acta COPASST descargada en PDF formal.');
                      setTimeout(() => setToastMessage(null), 3500);
                    }}
                    className="p-1.5 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                    title="Descargar Acta"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTENIDO: SUBMÓDULO 4: ACCIDENTES & INCIDENTES (ATEL)
      ========================================================================= */}
      {activeSubTab === 'atel' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Bandeja de Eventos ATEL & Cuasi-Accidentes Reportados
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Reporte</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-50/60">
                    <th className="py-2.5 px-3">Folio Radicado</th>
                    <th className="py-2.5 px-3">Fecha & Sede</th>
                    <th className="py-2.5 px-3">Tipo de Evento</th>
                    <th className="py-2.5 px-3">Descripción de lo Ocurrido</th>
                    <th className="py-2.5 px-2 text-center">Severidad</th>
                    <th className="py-2.5 px-3">Medidas Inmediatas & Cierre</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {incidentes.map((inc) => (
                    <tr key={inc.id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                          {inc.folio}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <p className="font-mono text-slate-900 font-bold">{inc.fecha} • {inc.hora}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{inc.sede}</p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.tipoEvento === 'Accidente de Trabajo'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : inc.tipoEvento === 'Casi-Accidente'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : inc.tipoEvento === 'Condición Insegura'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                          {inc.tipoEvento}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <p className="font-bold text-slate-900 leading-snug">{inc.areaTrabajo}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{inc.descripcion}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Reportó: {inc.reportante}</p>
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                          inc.severidad === 'Crítica' || inc.severidad === 'Alta'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : inc.severidad === 'Media'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {inc.severidad}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs text-[11px]">
                        <p className="text-emerald-800 font-medium">{inc.medidasInmediatas}</p>
                        {inc.leccionAprendida && (
                          <p className="text-slate-400 text-[10px] mt-0.5 italic">{inc.leccionAprendida}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          {inc.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTENIDO: SUBMÓDULO 5: CAPACITACIONES & EPP
      ========================================================================= */}
      {activeSubTab === 'epp_capacitaciones' && (
        <div className="space-y-5">
          {/* Cronograma de Capacitaciones */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Cronograma Anual de Capacitación & Inducción SST 2026
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Conforme al Plan de Trabajo Anual Decreto 1072
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {capacitaciones.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                      {c.tipo}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.estado === 'Ejecutada' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.estado}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs leading-snug">{c.tema}</h4>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/80">
                    <span>Fecha: <strong className="text-slate-800 font-mono">{c.fechaProgramada}</strong></span>
                    <span>Asistencia: <strong className="text-slate-800 font-mono">{c.asistentesConfirmados}/{c.asistentesEsperados}</strong></span>
                    {c.calificacionPromedio > 0 && (
                      <span className="text-emerald-700 font-bold">★ {c.calificacionPromedio} / 5.0</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matriz y Registro de Entrega de EPP */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Control y Registro de Entrega de Elementos de Protección Personal (EPP)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Con firma y trazabilidad de recambio normativo
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-50/60">
                    <th className="py-2.5 px-3">Funcionario & Cargo</th>
                    <th className="py-2.5 px-3">Sede</th>
                    <th className="py-2.5 px-3">Dotación EPP Entregada</th>
                    <th className="py-2.5 px-3">Norma Certificada</th>
                    <th className="py-2.5 px-3">Fecha Entrega</th>
                    <th className="py-2.5 px-3">Próximo Recambio</th>
                    <th className="py-2.5 px-3 text-center">Firma Digital</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {entregasEPP.map((epp) => (
                    <tr key={epp.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{epp.funcionarioNombre}</p>
                        <p className="text-[10px] text-slate-500">{epp.cargo}</p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        {epp.sede}
                      </td>
                      <td className="py-2.5 px-3 max-w-md">
                        <p className="text-slate-800 font-medium leading-snug">{epp.eppDetalle}</p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {epp.normaCertificacion}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600">
                        {epp.fechaEntrega}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-amber-700 font-bold">
                        {epp.proximoRecambio}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Firmado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REPORTAR INCIDENTE / ACTO / CONDICIÓN INSEGURA
      ========================================================================= */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full my-auto overflow-hidden animate-scaleUp">
            {/* Header del modal */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">
                    Reportar Incidente, Casi-Accidente o Condición Insegura
                  </h3>
                  <p className="text-[11px] text-red-100 font-medium">
                    Notificación inmediata al Comité COPASST y Brigada de Emergencia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCrearReporteSubmit} className="p-5 space-y-4 text-xs text-slate-700 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tipo de Evento */}
                <div>
                  <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">
                    Tipo de Evento *
                  </label>
                  <select
                    value={reportForm.tipoEvento}
                    onChange={(e) => setReportForm({ ...reportForm, tipoEvento: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-2.5 font-bold text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="Casi-Accidente">⚠️ Casi-Accidente (Near Miss)</option>
                    <option value="Condición Insegura">🔍 Condición Insegura (Entorno/Equipos)</option>
                    <option value="Acto Inseguro">👤 Acto Inseguro (Comportamiento)</option>
                    <option value="Accidente de Trabajo">🚨 Accidente de Trabajo (AT)</option>
                  </select>
                </div>

                {/* Severidad */}
                <div>
                  <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">
                    Severidad Preliminar *
                  </label>
                  <select
                    value={reportForm.severidad}
                    onChange={(e) => setReportForm({ ...reportForm, severidad: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-2.5 font-bold text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="Baja">Baja (Sin lesión ni daño material)</option>
                    <option value="Media">Media (Riesgo potencial moderado)</option>
                    <option value="Alta">Alta (Peligro grave inminente)</option>
                    <option value="Crítica">Crítica (Atención inmediata requerida)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sede */}
                <div>
                  <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">
                    Sede de Ocurrencia *
                  </label>
                  <select
                    value={reportForm.sede}
                    onChange={(e) => setReportForm({ ...reportForm, sede: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-2.5 font-bold text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    <option value="Medellín / Itagüí (CEDI Principal)">Medellín / Itagüí (CEDI Principal)</option>
                    <option value="Bogotá (CEDI Fontibón)">Bogotá (CEDI Fontibón)</option>
                    <option value="Cali (CEDI Yumbo)">Cali (CEDI Yumbo)</option>
                    <option value="Barranquilla (CEDI Norte)">Barranquilla (CEDI Norte)</option>
                    <option value="Bucaramanga (CEDI Oriente)">Bucaramanga (CEDI Oriente)</option>
                  </select>
                </div>

                {/* Área de Trabajo */}
                <div>
                  <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">
                    Área o Puesto de Trabajo *
                  </label>
                  <input
                    type="text"
                    value={reportForm.areaTrabajo}
                    onChange={(e) => setReportForm({ ...reportForm, areaTrabajo: e.target.value })}
                    placeholder="Ej: Tintometría, Muelle 2, Pasillo B..."
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 px-2.5 font-bold text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">
                  Descripción Detallada de los Hechos *
                </label>
                <textarea
                  rows={3}
                  value={reportForm.descripcion}
                  onChange={(e) => setReportForm({ ...reportForm, descripcion: e.target.value })}
                  placeholder="Describe qué ocurrió, sustancias o equipos involucrados, personas presentes y cómo se detectó..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  required
                />
              </div>

              {/* Medidas Inmediatas Tomadas */}
              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">
                  Medidas Inmediatas Tomadas en Sitio
                </label>
                <input
                  type="text"
                  value={reportForm.medidasInmediatas}
                  onChange={(e) => setReportForm({ ...reportForm, medidasInmediatas: e.target.value })}
                  placeholder="Ej: Se acordonó la zona, se colocó aserrín absorbente, se notificó al brigadista..."
                  className="w-full bg-white border border-slate-300 rounded-lg py-2 px-2.5 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              {/* Footer de botones */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-red-600 to-rose-700 text-white hover:from-red-700 hover:to-rose-800 transition-all cursor-pointer shadow-sm"
                >
                  Radicar Reporte SST
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
