import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  FileText,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Plus,
  Trash2,
  Printer,
  ChevronRight,
  ExternalLink,
  MapPin,
  X,
  User,
  Users,
  Check,
  Edit3,
  Calendar,
  Building2,
  Award,
  Sparkles,
  Layers,
  Activity,
  AlertCircle,
  Eye,
  Paperclip,
  ArrowRight,
  ShieldAlert,
  Send,
  FileSpreadsheet,
  Camera,
} from 'lucide-react';
import {
  ActaReunionCorp,
  CompromisoActa,
  FirmaAsistenteActa,
  InformeAuditoriaCorp,
  HallazgoAuditoria,
  RegistroAuditoria,
  Funcionario,
  NoConformidadRNC,
  CriticidadRNC,
  EstadoRNC,
  TipoHallazgoRNC,
  EvidenciaRNC,
  SEDES_CEDI_CONFIG,
  getAreas,
  getActasReunion,
  saveActasReunion,
  crearActaReunion,
  actualizarActaReunion,
  firmarActaReunion,
  getInformesAuditoria,
  saveInformesAuditoria,
  crearInformeAuditoria,
  getNoConformidadesRNC,
  saveNoConformidadesRNC,
  crearNoConformidadRNC,
  actualizarNoConformidadRNC,
  adjuntarEvidenciaRNC,
  cerrarNoConformidadRNC,
} from '../services/corporateService';
import { UserSession } from '../types';

export interface AuditoriaActasManagerProps {
  activeSubTab: 'informes' | 'actas' | 'rnc' | 'trazabilidad';
  onChangeSubTab: (subTab: 'informes' | 'actas' | 'rnc' | 'trazabilidad') => void;
  selectedSede: string;
  onChangeSede: (sedeId: string) => void;
  userSession?: UserSession | null;
  funcionarios: Funcionario[];
  auditoria: RegistroAuditoria[];
  onExportCSV: (tipo: string) => void;
  onRegistrarAuditoria?: (modulo: 'Seguridad' | 'Usuarios' | 'Inventario', accion: string, detalle: string) => void;
}

export const AuditoriaActasManager: React.FC<AuditoriaActasManagerProps> = ({
  activeSubTab,
  onChangeSubTab,
  selectedSede,
  onChangeSede,
  userSession,
  funcionarios,
  auditoria,
  onExportCSV,
  onRegistrarAuditoria,
}) => {
  // Áreas corporativas oficiales para los selectores
  const areasList = useMemo(() => getAreas(), []);

  // Estado de Actas de Reunión
  const [actas, setActas] = useState<ActaReunionCorp[]>(() => getActasReunion());
  const [actaSearchQuery, setActaSearchQuery] = useState('');
  const [actaTypeFilter, setActaTypeFilter] = useState('todos');
  const [actaStatusFilter, setActaStatusFilter] = useState('todos');
  const [selectedActaForDetail, setSelectedActaForDetail] = useState<ActaReunionCorp | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estado de Informes de Auditoría
  const [informes, setInformes] = useState<InformeAuditoriaCorp[]>(() => getInformesAuditoria());
  const [informeSearchQuery, setInformeSearchQuery] = useState('');
  const [informeTypeFilter, setInformeTypeFilter] = useState('todos');
  const [selectedInformeForDetail, setSelectedInformeForDetail] = useState<InformeAuditoriaCorp | null>(null);
  const [isInformeDetailModalOpen, setIsInformeDetailModalOpen] = useState(false);

  // Estado de No Conformidades (RNC)
  const [rncs, setRncs] = useState<NoConformidadRNC[]>(() => getNoConformidadesRNC());
  const [rncSearchQuery, setRncSearchQuery] = useState('');
  const [rncAreaDestinoFilter, setRncAreaDestinoFilter] = useState('todos');
  const [rncStatusFilter, setRncStatusFilter] = useState('todos');
  const [rncCriticidadFilter, setRncCriticidadFilter] = useState('todos');
  const [selectedRNCForDetail, setSelectedRNCForDetail] = useState<NoConformidadRNC | null>(null);
  const [isRNCDetailModalOpen, setIsRNCDetailModalOpen] = useState(false);
  const [isRNCCreateModalOpen, setIsRNCCreateModalOpen] = useState(false);
  const [isRNCStatusModalOpen, setIsRNCStatusModalOpen] = useState(false);
  const [isRNCEvidenciaModalOpen, setIsRNCEvidenciaModalOpen] = useState(false);
  const [rncToUpdate, setRncToUpdate] = useState<NoConformidadRNC | null>(null);

  // Estado de búsqueda en Trazabilidad (Log)
  const [trazabilidadSearch, setTrazabilidadSearch] = useState('');
  const [trazabilidadModuloFilter, setTrazabilidadModuloFilter] = useState('todos');

  // Sincronización con eventos locales de almacenamiento
  useEffect(() => {
    const handleActasUpdate = () => setActas(getActasReunion());
    const handleInformesUpdate = () => setInformes(getInformesAuditoria());
    const handleRncsUpdate = () => setRncs(getNoConformidadesRNC());

    window.addEventListener('colorlink_actas_updated', handleActasUpdate);
    window.addEventListener('colorlink_informes_auditoria_updated', handleInformesUpdate);
    window.addEventListener('colorlink_rncs_updated', handleRncsUpdate);

    return () => {
      window.removeEventListener('colorlink_actas_updated', handleActasUpdate);
      window.removeEventListener('colorlink_informes_auditoria_updated', handleInformesUpdate);
      window.removeEventListener('colorlink_rncs_updated', handleRncsUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // FORMULARIO: CREACIÓN DE NUEVA ACTA DE REUNIÓN
  // -------------------------------------------------------------
  const [formTitulo, setFormTitulo] = useState('');
  const [formTipo, setFormTipo] = useState<ActaReunionCorp['tipo']>('Comité Operativo');
  const [formFecha, setFormFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [formHoraInicio, setFormHoraInicio] = useState('09:00');
  const [formHoraFin, setFormHoraFin] = useState('10:30');
  const [formSedeId, setFormSedeId] = useState(selectedSede === 'todas' ? 'bogota' : selectedSede);
  const [formLugar, setFormLugar] = useState('Sala de Juntas CEDI & Microsoft Teams');
  const [formModeradorNombre, setFormModeradorNombre] = useState(userSession?.nombre || 'Ing. Carlos Mendoza');
  const [formModeradorCargo, setFormModeradorCargo] = useState('Jefe de Operaciones / Calidad');
  const [formAsistentesIds, setFormAsistentesIds] = useState<string[]>([]);
  const [formInvitadosExternos, setFormInvitadosExternos] = useState<string[]>([]);
  const [newInvitadoInput, setNewInvitadoInput] = useState('');
  const [formOrdenDelDia, setFormOrdenDelDia] = useState<string[]>([
    '1. Verificación del quórum y bienvenida',
    '2. Revisión de cumplimiento de compromisos anteriores',
    '3. Tratamiento de puntos normativos NTC 1335 y control de procesos',
    '4. Asignación de nuevos compromisos y cierre',
  ]);
  const [newPuntoOrdenInput, setNewPuntoOrdenInput] = useState('');
  const [formTemasTratados, setFormTemasTratados] = useState('');
  const [formConclusiones, setFormConclusiones] = useState('');
  const [formCompromisos, setFormCompromisos] = useState<Omit<CompromisoActa, 'id'>[]>([
    {
      descripcion: 'Actualizar matriz de calibración de dosificadoras y archivar contramuestra',
      responsableNombre: userSession?.nombre || 'Coordinador de Calidad',
      fechaLimite: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      estado: 'En Progreso',
    },
  ]);

  const handleToggleAsistente = (func: Funcionario) => {
    setFormAsistentesIds((prev) =>
      prev.includes(func.id) ? prev.filter((id) => id !== func.id) : [...prev, func.id]
    );
  };

  const handleAddInvitado = () => {
    if (!newInvitadoInput.trim()) return;
    setFormInvitadosExternos((prev) => [...prev, newInvitadoInput.trim()]);
    setNewInvitadoInput('');
  };

  const handleRemoveInvitado = (index: number) => {
    setFormInvitadosExternos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPuntoOrden = () => {
    if (!newPuntoOrdenInput.trim()) return;
    setFormOrdenDelDia((prev) => [...prev, newPuntoOrdenInput.trim()]);
    setNewPuntoOrdenInput('');
  };

  const handleRemovePuntoOrden = (index: number) => {
    setFormOrdenDelDia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCompromiso = () => {
    setFormCompromisos((prev) => [
      ...prev,
      {
        descripcion: '',
        responsableNombre: '',
        fechaLimite: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        estado: 'Pendiente',
      },
    ]);
  };

  const handleUpdateCompromiso = (
    index: number,
    field: keyof Omit<CompromisoActa, 'id'>,
    value: string
  ) => {
    setFormCompromisos((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveCompromiso = (index: number) => {
    setFormCompromisos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitNuevaActa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formTemasTratados.trim()) {
      alert('Por favor completa el título y los temas tratados del acta.');
      return;
    }

    const sedeObj = SEDES_CEDI_CONFIG.find((s) => s.id === formSedeId) || {
      id: 'todas',
      nombre: 'Todas las Sedes (Consolidado Nacional)',
    };

    const asistentesFinales: FirmaAsistenteActa[] = formAsistentesIds.map((fId) => {
      const f = funcionarios.find((item) => item.id === fId);
      return {
        funcionarioId: fId,
        nombre: f ? f.nombre : 'Funcionario Asistente',
        cargo: f?.cargo || 'Funcionario Autorizado',
        areaNombre: f?.areaNombre || 'Operaciones',
        firmado: false,
      };
    });

    const moderadorNombreFinal = formModeradorNombre.trim() || userSession?.nombre || 'Moderador';
    if (!asistentesFinales.some((a) => a.nombre.toLowerCase() === moderadorNombreFinal.toLowerCase())) {
      asistentesFinales.unshift({
        funcionarioId: userSession?.id || 'mod-id',
        nombre: moderadorNombreFinal,
        cargo: formModeradorCargo.trim() || 'Moderador de Sesión',
        areaNombre: 'Auditoría & Calidad',
        firmado: true,
        fechaFirma: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
    }

    const compromisosFinales: CompromisoActa[] = formCompromisos
      .filter((c) => c.descripcion.trim().length > 0)
      .map((c, idx) => ({
        ...c,
        id: `comp-${Date.now()}-${idx}`,
      }));

    const nueva = crearActaReunion({
      titulo: formTitulo.trim(),
      tipo: formTipo,
      fecha: formFecha,
      horaInicio: formHoraInicio,
      horaFin: formHoraFin,
      sedeId: sedeObj.id,
      sedeNombre: sedeObj.nombre,
      lugar: formLugar.trim(),
      moderadorNombre: moderadorNombreFinal,
      moderadorCargo: formModeradorCargo.trim(),
      asistentes: asistentesFinales,
      invitadosExternos: formInvitadosExternos,
      ordenDelDia: formOrdenDelDia,
      temasTratados: formTemasTratados.trim(),
      conclusiones: formConclusiones.trim() || 'Se concluye la sesión con conformidad unánime de los asistentes.',
      compromisos: compromisosFinales,
      estado: 'En Firma',
      creadoPor: userSession?.nombre || moderadorNombreFinal,
    });

    setActas(getActasReunion());
    setIsCreateModalOpen(false);
    showToast(`¡Acta ${nueva.consecutivo} radicada con éxito y puesta En Firma!`);

    setFormTitulo('');
    setFormTemasTratados('');
    setFormConclusiones('');
    setFormAsistentesIds([]);
    setFormInvitadosExternos([]);
  };

  const handleFirmarActa = (acta: ActaReunionCorp) => {
    const funcionarioId = userSession?.id || 'usr-current';
    const funcionarioNombre = userSession?.nombre || 'Funcionario Autorizado';

    const actualizada = firmarActaReunion(acta.id, funcionarioId, funcionarioNombre);
    if (actualizada) {
      setActas(getActasReunion());
      if (selectedActaForDetail?.id === acta.id) {
        setSelectedActaForDetail(actualizada);
      }
      showToast(`¡Firma digital de ${funcionarioNombre} asentada correctamente en Acta ${acta.consecutivo}!`);
    }
  };

  // -------------------------------------------------------------
  // FORMULARIO: REGISTRO DE NUEVA NO CONFORMIDAD (RNC)
  // -------------------------------------------------------------
  const [rncTitulo, setRncTitulo] = useState('');
  const [rncAreaEmisoraId, setRncAreaEmisoraId] = useState('area-8'); // Auditoría & Calidad
  const [rncReportadoPor, setRncReportadoPor] = useState(userSession?.nombre || 'Dra. Valentina Restrepo');
  const [rncReportadoPorCargo, setRncReportadoPorCargo] = useState('Auditor Líder de Calidad');
  const [rncAreaDestinoId, setRncAreaDestinoId] = useState('area-3'); // Logística & Bodega
  const [rncResponsableDestinoNombre, setRncResponsableDestinoNombre] = useState('Carlos Mendoza');
  const [rncSedeId, setRncSedeId] = useState(selectedSede === 'todas' ? 'bogota' : selectedSede);
  const [rncTipoHallazgo, setRncTipoHallazgo] = useState<TipoHallazgoRNC>('Incumplimiento de NTC 1335');
  const [rncCriticidad, setRncCriticidad] = useState<CriticidadRNC>('Alta');
  const [rncNormaAsociada, setRncNormaAsociada] = useState('Norma ICONTEC NTC 1335 Numeral 4.2.3');
  const [rncDescripcion, setRncDescripcion] = useState('');
  const [rncAccionesInmediatas, setRncAccionesInmediatas] = useState('');
  const [rncPlanAccionPropuesto, setRncPlanAccionPropuesto] = useState('');
  const [rncFechaLimiteCierre, setRncFechaLimiteCierre] = useState(
    () => new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)
  );
  const [rncEvidenciasNombres, setRncEvidenciasNombres] = useState<string[]>([]);
  const [newEvidenciaInput, setNewEvidenciaInput] = useState('');

  const handleAddEvidenciaNombre = () => {
    if (!newEvidenciaInput.trim()) return;
    setRncEvidenciasNombres((prev) => [...prev, newEvidenciaInput.trim()]);
    setNewEvidenciaInput('');
  };

  const handleRemoveEvidenciaNombre = (idx: number) => {
    setRncEvidenciasNombres((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitNuevaRNC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rncTitulo.trim() || !rncDescripcion.trim() || !rncPlanAccionPropuesto.trim()) {
      alert('Por favor completa el título, la descripción de la desviación y el plan de acción propuesto.');
      return;
    }

    const areaEmisoraObj = areasList.find((a) => a.id === rncAreaEmisoraId) || {
      id: rncAreaEmisoraId,
      nombre: 'Auditoría & Control de Calidad',
    };
    const areaDestinoObj = areasList.find((a) => a.id === rncAreaDestinoId) || {
      id: rncAreaDestinoId,
      nombre: 'Logística & Bodega',
    };
    const sedeObj = SEDES_CEDI_CONFIG.find((s) => s.id === rncSedeId) || {
      id: 'todas',
      nombre: 'Todas las Sedes (Consolidado Nacional)',
    };

    const evidenciasIniciales: EvidenciaRNC[] = rncEvidenciasNombres.map((name, i) => ({
      id: `ev-${Date.now()}-${i}`,
      nombre: name,
      tipo: name.toLowerCase().endsWith('.pdf') ? 'documento' : 'imagen',
      fechaSubida: new Date().toISOString().replace('T', ' ').slice(0, 16),
    }));

    const nuevaRNC = crearNoConformidadRNC({
      titulo: rncTitulo.trim(),
      areaEmisoraId: areaEmisoraObj.id,
      areaEmisoraNombre: areaEmisoraObj.nombre,
      reportadoPor: rncReportadoPor.trim(),
      reportadoPorCargo: rncReportadoPorCargo.trim(),
      areaDestinoId: areaDestinoObj.id,
      areaDestinoNombre: areaDestinoObj.nombre,
      responsableDestinoNombre: rncResponsableDestinoNombre.trim(),
      sedeId: sedeObj.id,
      sedeNombre: sedeObj.nombre,
      tipoHallazgo: rncTipoHallazgo,
      criticidad: rncCriticidad,
      normaAsociada: rncNormaAsociada.trim() || undefined,
      descripcion: rncDescripcion.trim(),
      accionesInmediatas: rncAccionesInmediatas.trim() || undefined,
      planAccionPropuesto: rncPlanAccionPropuesto.trim(),
      fechaLimiteCierre: rncFechaLimiteCierre,
      estado: 'Abierta',
      evidencias: evidenciasIniciales,
    });

    setRncs(getNoConformidadesRNC());
    setIsRNCCreateModalOpen(false);
    showToast(`¡No Conformidad ${nuevaRNC.consecutivo} radicada formalmente hacia ${areaDestinoObj.nombre}!`);

    // Reset fields
    setRncTitulo('');
    setRncDescripcion('');
    setRncPlanAccionPropuesto('');
    setRncAccionesInmediatas('');
    setRncEvidenciasNombres([]);
  };

  // Gestión de cambio de estado / cierre de RNC
  const [modalNewStatus, setModalNewStatus] = useState<EstadoRNC>('En Plan de Acción');
  const [modalNotasCierre, setModalNotasCierre] = useState('');
  const [modalVerificador, setModalVerificador] = useState(userSession?.nombre || 'Auditor de Calidad');

  const handleOpenStatusModal = (rnc: NoConformidadRNC) => {
    setRncToUpdate(rnc);
    setModalNewStatus(rnc.estado);
    setModalNotasCierre(rnc.notasCierre || '');
    setModalVerificador(userSession?.nombre || rnc.verificadoPor || 'Auditor de Calidad');
    setIsRNCStatusModalOpen(true);
  };

  const handleSaveRNCStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rncToUpdate) return;

    if (modalNewStatus === 'Cerrada / Verificada') {
      const actualizada = cerrarNoConformidadRNC(
        rncToUpdate.id,
        modalNotasCierre.trim() || 'Verificación en sitio satisfactoria.',
        modalVerificador.trim()
      );
      if (actualizada) {
        setRncs(getNoConformidadesRNC());
        if (selectedRNCForDetail?.id === rncToUpdate.id) {
          setSelectedRNCForDetail(actualizada);
        }
        showToast(`¡No Conformidad ${rncToUpdate.consecutivo} cerrada y verificada con éxito!`);
      }
    } else {
      const actualizada = actualizarNoConformidadRNC(rncToUpdate.id, {
        estado: modalNewStatus,
      });
      if (actualizada) {
        setRncs(getNoConformidadesRNC());
        if (selectedRNCForDetail?.id === rncToUpdate.id) {
          setSelectedRNCForDetail(actualizada);
        }
        showToast(`¡Estado de RNC ${rncToUpdate.consecutivo} actualizado a ${modalNewStatus}!`);
      }
    }
    setIsRNCStatusModalOpen(false);
  };

  // Adjuntar evidencia adicional
  const [nuevaEvidenciaInputModal, setNuevaEvidenciaInputModal] = useState('');
  const [tipoEvidenciaModal, setTipoEvidenciaModal] = useState<'imagen' | 'documento'>('imagen');

  const handleOpenEvidenciaModal = (rnc: NoConformidadRNC) => {
    setRncToUpdate(rnc);
    setNuevaEvidenciaInputModal('');
    setIsRNCEvidenciaModalOpen(true);
  };

  const handleSaveNuevaEvidencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rncToUpdate || !nuevaEvidenciaInputModal.trim()) return;

    const actualizada = adjuntarEvidenciaRNC(rncToUpdate.id, {
      nombre: nuevaEvidenciaInputModal.trim(),
      tipo: tipoEvidenciaModal,
    });

    if (actualizada) {
      setRncs(getNoConformidadesRNC());
      if (selectedRNCForDetail?.id === rncToUpdate.id) {
        setSelectedRNCForDetail(actualizada);
      }
      showToast(`¡Evidencia "${nuevaEvidenciaInputModal}" adjuntada con éxito a ${rncToUpdate.consecutivo}!`);
    }
    setIsRNCEvidenciaModalOpen(false);
  };

  // Filtrado de No Conformidades (RNC)
  const filteredRncs = useMemo(() => {
    return rncs.filter((r) => {
      const matchSede = selectedSede === 'todas' || r.sedeId === selectedSede || r.sedeId === 'todas';
      const matchAreaDestino = rncAreaDestinoFilter === 'todos' || r.areaDestinoId === rncAreaDestinoFilter;
      const matchStatus = rncStatusFilter === 'todos' || r.estado === rncStatusFilter;
      const matchCriticidad = rncCriticidadFilter === 'todos' || r.criticidad === rncCriticidadFilter;

      const q = rncSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        r.consecutivo.toLowerCase().includes(q) ||
        r.titulo.toLowerCase().includes(q) ||
        r.areaEmisoraNombre.toLowerCase().includes(q) ||
        r.areaDestinoNombre.toLowerCase().includes(q) ||
        r.responsableDestinoNombre.toLowerCase().includes(q) ||
        r.descripcion.toLowerCase().includes(q) ||
        r.tipoHallazgo.toLowerCase().includes(q);

      return matchSede && matchAreaDestino && matchStatus && matchCriticidad && matchQuery;
    });
  }, [rncs, selectedSede, rncAreaDestinoFilter, rncStatusFilter, rncCriticidadFilter, rncSearchQuery]);

  // Filtrado de Actas
  const filteredActas = useMemo(() => {
    return actas.filter((a) => {
      const matchSede = selectedSede === 'todas' || a.sedeId === selectedSede || a.sedeId === 'todas';
      const matchType = actaTypeFilter === 'todos' || a.tipo === actaTypeFilter;
      const matchStatus = actaStatusFilter === 'todos' || a.estado === actaStatusFilter;
      const q = actaSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        a.consecutivo.toLowerCase().includes(q) ||
        a.titulo.toLowerCase().includes(q) ||
        a.moderadorNombre.toLowerCase().includes(q) ||
        a.temasTratados.toLowerCase().includes(q);

      return matchSede && matchType && matchStatus && matchQuery;
    });
  }, [actas, selectedSede, actaTypeFilter, actaStatusFilter, actaSearchQuery]);

  // Filtrado de Informes de Auditoría
  const filteredInformes = useMemo(() => {
    return informes.filter((inf) => {
      const matchSede = selectedSede === 'todas' || inf.sedeId === selectedSede || inf.sedeId === 'todas';
      const matchType = informeTypeFilter === 'todos' || inf.tipoAuditoria === informeTypeFilter;
      const q = informeSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        inf.codigoInforme.toLowerCase().includes(q) ||
        inf.titulo.toLowerCase().includes(q) ||
        inf.auditorLider.toLowerCase().includes(q) ||
        inf.resumenEjecutivo.toLowerCase().includes(q);

      return matchSede && matchType && matchQuery;
    });
  }, [informes, selectedSede, informeTypeFilter, informeSearchQuery]);

  // Filtrado de Trazabilidad (Log)
  const filteredTrazabilidad = useMemo(() => {
    return auditoria.filter((reg) => {
      const matchModulo = trazabilidadModuloFilter === 'todos' || reg.modulo === trazabilidadModuloFilter;
      const q = trazabilidadSearch.toLowerCase().trim();
      const matchQuery =
        !q ||
        reg.usuarioNombre.toLowerCase().includes(q) ||
        reg.accion.toLowerCase().includes(q) ||
        reg.detalle.toLowerCase().includes(q) ||
        reg.fecha.includes(q);

      return matchModulo && matchQuery;
    });
  }, [auditoria, trazabilidadModuloFilter, trazabilidadSearch]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* =========================================================================
          ENCABEZADO DINÁMICO: SUBMÓDULO ACTIVO + BADGES + SELECTOR DE SEDE CEDI
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#001D3D] via-[#002D5C] to-[#0A192F] text-violet-300 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-violet-500/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-none">
                Auditoría & Informes •{' '}
                {activeSubTab === 'informes'
                  ? 'Informes y Reportes de Auditoría'
                  : activeSubTab === 'actas'
                  ? 'Gestión de Actas de Reunión'
                  : activeSubTab === 'rnc'
                  ? 'No Conformidades & Acciones Correctivas (RNC)'
                  : 'Registro de Trazabilidad'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-black bg-violet-50 text-violet-800 border border-violet-200 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeSubTab === 'informes'
                  ? `${informes.length} Informes Emitidos`
                  : activeSubTab === 'actas'
                  ? `${actas.length} Actas Radicadas`
                  : activeSubTab === 'rnc'
                  ? `${rncs.length} No Conformidades (RNC)`
                  : `${auditoria.length} Registros Inmutables`}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 font-medium mt-0.5 leading-tight">
              Aseguramiento de Calidad NTC 1335, Control Documental de Comités, RNC Inter-Áreas y Trazabilidad
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera: Selector de Sede + Exportar */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/90 py-1 px-2.5 rounded-md border border-slate-200/90 transition-all shadow-2xs shrink-0">
            <div className="w-5 h-5 rounded bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-200/80 shrink-0 shadow-2xs">
              <MapPin className="w-3 h-3" />
            </div>
            <div className="text-left">
              <label htmlFor="sedeSelectorAuditoriaManager" className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block leading-none">
                Sede / CEDI Activo:
              </label>
              <select
                id="sedeSelectorAuditoriaManager"
                value={selectedSede}
                onChange={(e) => onChangeSede(e.target.value)}
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

          <button
            type="button"
            onClick={() => onExportCSV(activeSubTab === 'actas' ? 'actas' : activeSubTab === 'rnc' ? 'rnc' : 'auditoria')}
            className="px-3.5 py-1.5 rounded-xl bg-[#001D3D] hover:bg-blue-900 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-300" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* TOAST DE FEEDBACK */}
      {toastMessage && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-900 text-emerald-100 rounded-xl border border-emerald-700 shadow-md animate-fadeIn text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-emerald-800 rounded text-emerald-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          BARRA DE PESTAÑAS SUB-MÓDULO AUDITORÍA (INFORMES, ACTAS, RNC, TRAZABILIDAD)
      ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => onChangeSubTab('informes')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'informes'
              ? 'bg-[#001D3D] text-white shadow-sm ring-2 ring-violet-500/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4 text-cyan-400" />
          <span>Informes y Reportes de Auditoría</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-slate-800 text-cyan-200 font-mono">
            {informes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('actas')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'actas'
              ? 'bg-[#001D3D] text-white shadow-sm ring-2 ring-violet-500/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-violet-400" />
          <span>Gestión de Actas de Reunión</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-slate-800 text-violet-200 font-mono">
            {actas.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('rnc')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'rnc'
              ? 'bg-[#001D3D] text-white shadow-sm ring-2 ring-violet-500/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>No Conformidades (RNC)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-slate-800 text-amber-200 font-mono">
            {rncs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeSubTab('trazabilidad')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'trazabilidad'
              ? 'bg-[#001D3D] text-white shadow-sm ring-2 ring-violet-500/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Registro de Trazabilidad (Log Inmutable)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-slate-800 text-emerald-200 font-mono">
            {auditoria.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          SUB-VISTA: NO CONFORMIDADES & ACCIONES CORRECTIVAS (RNC CRUZADAS)
      ========================================================================= */}
      {activeSubTab === 'rnc' && (
        <div className="space-y-6">
          {/* Tarjetas de Métricas de No Conformidades */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Total RNCs Registradas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">{rncs.length}</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  Inter-Áreas
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500">Hallazgos cruzados de calidad y operaciones</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Abiertas / En Análisis
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-600 font-mono">
                  {rncs.filter((r) => r.estado === 'Abierta' || r.estado === 'En Análisis').length}
                </span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  Requieren Acción
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500">En revisión inicial de causas raíz</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                En Plan de Acción
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-violet-600 font-mono">
                  {rncs.filter((r) => r.estado === 'En Plan de Acción').length}
                </span>
                <span className="text-[10px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                  En Ejecución
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500">Con acciones correctivas en curso</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Cerradas / Verificadas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  {rncs.filter((r) => r.estado === 'Cerrada / Verificada').length}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Eficacia Comprobada
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500">Auditadas y cerradas con evidencia</p>
            </div>
          </div>

          {/* Barra de Acciones y Filtros de RNCs */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rncSearchQuery}
                  onChange={(e) => setRncSearchQuery(e.target.value)}
                  placeholder="Buscar RNC por consecutivo, título, área, norma o evidencia..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <select
                value={rncAreaDestinoFilter}
                onChange={(e) => setRncAreaDestinoFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="todos">Todas las Áreas Destino</option>
                {areasList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>

              <select
                value={rncCriticidadFilter}
                onChange={(e) => setRncCriticidadFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="todos">Toda Criticidad</option>
                <option value="Crítica">Crítica</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>

              <select
                value={rncStatusFilter}
                onChange={(e) => setRncStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="Abierta">Abierta</option>
                <option value="En Análisis">En Análisis</option>
                <option value="En Plan de Acción">En Plan de Acción</option>
                <option value="Cerrada / Verificada">Cerrada / Verificada</option>
              </select>
            </div>

            {/* Botón "+ Registrar Nueva No Conformidad" */}
            <button
              type="button"
              onClick={() => setIsRNCCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-800 via-rose-900 to-[#001D3D] hover:from-red-700 hover:to-blue-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-cyan-300" />
              <span>+ Registrar Nueva No Conformidad (RNC)</span>
            </button>
          </div>

          {/* Tabla / Listado de No Conformidades Cruzadas */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                    <th className="py-3 px-4">Consecutivo</th>
                    <th className="py-3 px-4">Hallazgo / Desviación</th>
                    <th className="py-3 px-4">Flujo Inter-Áreas</th>
                    <th className="py-3 px-4">Sede / CEDI</th>
                    <th className="py-3 px-4">Criticidad</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Fecha Límite</th>
                    <th className="py-3 px-4">Evidencias</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRncs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                        No se encontraron No Conformidades con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredRncs.map((rnc) => (
                      <tr key={rnc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-red-950">
                          <span className="block">{rnc.consecutivo}</span>
                          <span className="text-[9.5px] font-medium text-slate-400">{rnc.fechaReporte}</span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 truncate" title={rnc.titulo}>
                            {rnc.titulo}
                          </div>
                          <span className="inline-block mt-0.5 text-[10px] text-slate-500 font-medium truncate max-w-xs block">
                            {rnc.tipoHallazgo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                            <span className="text-slate-600 truncate max-w-[100px]">{rnc.areaEmisoraNombre.split('&')[0]}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <strong className="text-blue-900 truncate max-w-[100px]">{rnc.areaDestinoNombre.split('&')[0]}</strong>
                          </div>
                          <span className="text-[9.5px] text-slate-400 block truncate">Resp: {rnc.responsableDestinoNombre}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <span className="text-[11px] font-bold block">{rnc.sedeNombre.split('(')[0]}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              rnc.criticidad === 'Crítica'
                                ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                                : rnc.criticidad === 'Alta'
                                ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                : rnc.criticidad === 'Media'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {rnc.criticidad}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              rnc.estado === 'Cerrada / Verificada'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : rnc.estado === 'En Plan de Acción'
                                ? 'bg-violet-100 text-violet-800 border border-violet-300'
                                : rnc.estado === 'En Análisis'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {rnc.estado}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {rnc.fechaLimiteCierre}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
                            <Paperclip className="w-3 h-3 text-slate-400" />
                            {rnc.evidencias.length}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRNCForDetail(rnc);
                                setIsRNCDetailModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Ver</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(rnc)}
                              title="Gestionar Plan de Acción / Estado"
                              className="px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-800 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Gestionar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEvidenciaModal(rnc)}
                              title="Adjuntar Evidencia (Foto / Documento)"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRNCForDetail(rnc);
                                setTimeout(() => window.print(), 200);
                              }}
                              title="Exportar a PDF / Imprimir"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VISTA 1: INFORMES Y REPORTES DE AUDITORÍA
      ========================================================================= */}
      {activeSubTab === 'informes' && (
        <div className="space-y-6">
          {/* Tarjetas Ejecutivas de Cumplimiento Global */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Cumplimiento Global NTC 1335
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-700 font-mono">98.0%</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Excelente
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500">Promedio de los 8 centros CEDI y Planta Rionegro</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                No Conformidades Mayores
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 font-mono">0</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  100% Cero Riesgo
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500">Ningún lote bloqueado por fallas críticas</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Hallazgos Menores / Oportunidades
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-600 font-mono">5</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  En Tratamiento
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500">Planes de acción en curso con fecha límite</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">
                Sello de Calidad Vigente
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-black text-blue-900">ICONTEC NTC 1335</span>
              </div>
              <p className="text-[10.5px] text-emerald-700 font-bold">✓ Homologación Oficial 2026</p>
            </div>
          </div>

          {/* Barra de Filtros para Informes */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={informeSearchQuery}
                onChange={(e) => setInformeSearchQuery(e.target.value)}
                placeholder="Buscar por código, título, auditor o alcance..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={informeTypeFilter}
                onChange={(e) => setInformeTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los Tipos de Auditoría</option>
                <option value="Inspección NTC 1335 de Calidad">Inspección NTC 1335</option>
                <option value="Auditoría de Procesos de Bodega y CEDI">Bodega y CEDI</option>
                <option value="Control de Calidad y Tiempos SAC">Control SAC / PQRS</option>
                <option value="Calibración y Metrología Tintométrica">Metrología Tintométrica</option>
              </select>
            </div>
          </div>

          {/* Listado de Fichas Ejecutivas de Auditoría */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredInformes.map((inf) => (
              <div
                key={inf.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black font-mono bg-violet-50 text-violet-800 border border-violet-200">
                      {inf.codigoInforme}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Cumplimiento {inf.porcentajeCumplimiento}%
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 tracking-tight leading-snug line-clamp-2">
                      {inf.titulo}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {inf.resumenEjecutivo}
                    </p>
                  </div>

                  {/* Barra de progreso de cumplimiento */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>Nivel de Conformidad</span>
                      <span className="font-mono text-emerald-700">{inf.porcentajeCumplimiento}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                        style={{ width: `${inf.porcentajeCumplimiento}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] border border-slate-100">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Auditor Líder:</span>
                      <strong className="text-slate-900">{inf.auditorLider.split('(')[0]}</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Sede:</span>
                      <span className="text-slate-800">{inf.sedeNombre.split('(')[0]}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Hallazgos Totales:</span>
                      <span className="font-mono font-bold text-slate-900">{inf.hallazgos.length}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInformeForDetail(inf);
                      setIsInformeDetailModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Ficha Completa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInformeForDetail(inf);
                      setTimeout(() => window.print(), 200);
                    }}
                    title="Imprimir / Exportar Ficha Técnica"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VISTA 2: GESTIÓN DE ACTAS DE REUNIÓN
      ========================================================================= */}
      {activeSubTab === 'actas' && (
        <div className="space-y-6">
          {/* Barra de Acciones y Filtros de Actas */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={actaSearchQuery}
                  onChange={(e) => setActaSearchQuery(e.target.value)}
                  placeholder="Buscar acta por consecutivo, título, moderador o temas..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <select
                value={actaTypeFilter}
                onChange={(e) => setActaTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los Comités</option>
                <option value="Comité Operativo">Comité Operativo</option>
                <option value="Auditoría de Calidad NTC 1335">Auditoría NTC 1335</option>
                <option value="Control de Inventarios y Bodega">Inventarios & Bodega</option>
                <option value="Comité SAC / PQRS">Comité SAC / PQRS</option>
              </select>

              <select
                value={actaStatusFilter}
                onChange={(e) => setActaStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los Estados</option>
                <option value="Borrador">Borrador</option>
                <option value="En Firma">En Firma</option>
                <option value="Aprobada">Aprobada</option>
              </select>
            </div>

            {/* Botón "+ Crear Nueva Acta" */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#001D3D] to-[#002D5C] hover:from-[#002D5C] hover:to-blue-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-cyan-300" />
              <span>+ Crear Nueva Acta de Reunión</span>
            </button>
          </div>

          {/* Tabla de Actas Radicadas */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                    <th className="py-3 px-4">Consecutivo</th>
                    <th className="py-3 px-4">Título del Acta / Comité</th>
                    <th className="py-3 px-4">Tipo de Sesión</th>
                    <th className="py-3 px-4">Fecha & Sede</th>
                    <th className="py-3 px-4">Moderador</th>
                    <th className="py-3 px-4">Compromisos</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        No se encontraron actas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredActas.map((acta) => (
                      <tr key={acta.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-900">
                          {acta.consecutivo}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                          {acta.titulo}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold">
                            {acta.tipo}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="font-mono text-[11px] text-slate-800">{acta.fecha}</div>
                          <div className="text-[10px] text-slate-400">{acta.sedeNombre.split('(')[0]}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-900 font-medium block">{acta.moderadorNombre}</span>
                          <span className="text-[10px] text-slate-400">{acta.moderadorCargo}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-800">
                            {acta.compromisos.filter((c) => c.estado === 'Cumplido').length} / {acta.compromisos.length}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              acta.estado === 'Aprobada'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : acta.estado === 'En Firma'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {acta.estado}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedActaForDetail(acta);
                                setIsDetailModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Ver Acta</span>
                            </button>

                            {acta.estado === 'En Firma' && (
                              <button
                                type="button"
                                onClick={() => handleFirmarActa(acta)}
                                title="Asentar Firma Digital"
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Firmar</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedActaForDetail(acta);
                                setTimeout(() => window.print(), 200);
                              }}
                              title="Exportar a PDF / Imprimir"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VISTA 3: REGISTRO DE TRAZABILIDAD (LOG INMUTABLE HISTÓRICO)
      ========================================================================= */}
      {activeSubTab === 'trazabilidad' && (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trazabilidadSearch}
                onChange={(e) => setTrazabilidadSearch(e.target.value)}
                placeholder="Buscar por usuario, acción o detalle técnico..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={trazabilidadModuloFilter}
                onChange={(e) => setTrazabilidadModuloFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
              >
                <option value="todos">Todos los Módulos</option>
                <option value="Usuarios">Usuarios</option>
                <option value="Inventario">Inventario</option>
                <option value="SAC">SAC</option>
                <option value="Tareas">Tareas</option>
                <option value="Seguridad">Seguridad, Actas & RNC</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Usuario Responsable</th>
                    <th className="py-3 px-4">Módulo</th>
                    <th className="py-3 px-4">Acción</th>
                    <th className="py-3 px-4">Detalle Técnico Inmutable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTrazabilidad.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">{a.fecha}</td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block">{a.usuarioNombre}</strong>
                        <span className="text-[10px] text-slate-400">{a.usuarioRol}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold">
                          {a.modulo}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{a.accion}</td>
                      <td className="py-3 px-4 text-slate-600 text-[11px] max-w-md">{a.detalle}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REGISTRAR NUEVA NO CONFORMIDAD (RNC)
      ========================================================================= */}
      {isRNCCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-800 text-white flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Registrar Nueva No Conformidad & Acción Correctiva (RNC)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Apertura formal de desviación inter-áreas bajo norma NTC 1335 y Sistema de Gestión de Calidad
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRNCCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNuevaRNC} className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-red-600" />
                  1. Clasificación del Hallazgo y Flujo Inter-Áreas
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Título Descriptivo de la No Conformidad: *
                    </label>
                    <input
                      type="text"
                      required
                      value={rncTitulo}
                      onChange={(e) => setRncTitulo(e.target.value)}
                      placeholder="Ej: Desviación de lavabilidad Gardner en Lote #2026-PT-402"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Área Emisora / Auditor: *</label>
                    <select
                      value={rncAreaEmisoraId}
                      onChange={(e) => setRncAreaEmisoraId(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      {areasList.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Reportado Por (Nombre y Cargo):</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={rncReportadoPor}
                        onChange={(e) => setRncReportadoPor(e.target.value)}
                        placeholder="Nombre auditor..."
                        className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        value={rncReportadoPorCargo}
                        onChange={(e) => setRncReportadoPorCargo(e.target.value)}
                        placeholder="Cargo..."
                        className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Área Destino / Responsable: *</label>
                    <select
                      value={rncAreaDestinoId}
                      onChange={(e) => setRncAreaDestinoId(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-blue-900"
                    >
                      {areasList.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Responsable Asignado en Destino: *</label>
                    <input
                      type="text"
                      required
                      value={rncResponsableDestinoNombre}
                      onChange={(e) => setRncResponsableDestinoNombre(e.target.value)}
                      placeholder="Ej: Carlos Mendoza (Jefe Logística)"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Hallazgo: *</label>
                    <select
                      value={rncTipoHallazgo}
                      onChange={(e) => setRncTipoHallazgo(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold"
                    >
                      <option value="Incumplimiento de NTC 1335">Incumplimiento de NTC 1335</option>
                      <option value="Desviación de Proceso">Desviación de Proceso</option>
                      <option value="Error de Inventario / Kardex">Error de Inventario / Kardex</option>
                      <option value="Falla Operativa en Despacho">Falla Operativa en Despacho</option>
                      <option value="Incompatibilidad de Almacenamiento MSDS">Incompatibilidad de Almacenamiento MSDS</option>
                      <option value="Reclamación Técnica SAC">Reclamación Técnica SAC</option>
                      <option value="Descalibración Tintométrica">Descalibración Tintométrica</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nivel de Criticidad: *</label>
                      <select
                        value={rncCriticidad}
                        onChange={(e) => setRncCriticidad(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold text-red-900"
                      >
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                        <option value="Crítica">Crítica</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Sede / CEDI Afectada: *</label>
                      <select
                        value={rncSedeId}
                        onChange={(e) => setRncSedeId(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold"
                      >
                        <option value="todas">🏢 Consolidado Nacional</option>
                        {SEDES_CEDI_CONFIG.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre.split('(')[0]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Norma o Procedimiento Técnico Asociado:</label>
                    <input
                      type="text"
                      value={rncNormaAsociada}
                      onChange={(e) => setRncNormaAsociada(e.target.value)}
                      placeholder="Ej: Norma Técnica NTC 1335 Numeral 4.2.3 o MSDS SGA Sección 6"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 2. DESCRIPCIÓN DETALLADA Y ACCIONES INMEDIATAS */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  2. Evidencia Objetiva y Plan de Acción
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Descripción Detallada del Hallazgo o Evidencia: *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rncDescripcion}
                    onChange={(e) => setRncDescripcion(e.target.value)}
                    placeholder="Describa los hechos observables, mediciones numéricas, lotes afectados y desviaciones encontradas..."
                    className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Acción Inmediata de Contención (Disposición preventiva):
                  </label>
                  <input
                    type="text"
                    value={rncAccionesInmediatas}
                    onChange={(e) => setRncAccionesInmediatas(e.target.value)}
                    placeholder="Ej: Lote puesto en cuarentena física y bloqueado para facturación en ERP"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Plan de Acción Propuesto / Acciones Correctivas: *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rncPlanAccionPropuesto}
                    onChange={(e) => setRncPlanAccionPropuesto(e.target.value)}
                    placeholder="Especifique el análisis de causa raíz y las actividades correctivas que el área destino debe implementar..."
                    className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Fecha Límite de Cierre / Solución: *</label>
                    <input
                      type="date"
                      required
                      value={rncFechaLimiteCierre}
                      onChange={(e) => setRncFechaLimiteCierre(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Adjuntar Archivos / Fotos de Evidencia:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newEvidenciaInput}
                        onChange={(e) => setNewEvidenciaInput(e.target.value)}
                        placeholder="Nombre de archivo (ej: Foto_Ensayo_Leneta.jpg)..."
                        className="flex-1 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddEvidenciaNombre();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddEvidenciaNombre}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold"
                      >
                        + Añadir
                      </button>
                    </div>
                    {rncEvidenciasNombres.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {rncEvidenciasNombres.map((evName, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10.5px] flex items-center gap-1 font-mono">
                            <Paperclip className="w-3 h-3 text-slate-500" />
                            {evName}
                            <button type="button" onClick={() => handleRemoveEvidenciaNombre(idx)} className="hover:text-red-600">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRNCCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-800 to-slate-900 text-white font-bold text-xs shadow-md hover:from-red-700 hover:to-slate-800"
                >
                  Guardar y Notificar No Conformidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VISUALIZADOR DETALLE COMPLETO DE RNC (HOJA MEMBRETADA & PDF)
      ========================================================================= */}
      {isRNCDetailModalOpen && selectedRNCForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs bg-red-100 text-red-900 px-2.5 py-0.5 rounded-md border border-red-200">
                  {selectedRNCForDetail.consecutivo}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    selectedRNCForDetail.criticidad === 'Crítica'
                      ? 'bg-red-600 text-white'
                      : selectedRNCForDetail.criticidad === 'Alta'
                      ? 'bg-orange-500 text-white'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  Criticidad {selectedRNCForDetail.criticidad}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Estado: {selectedRNCForDetail.estado}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Exportar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRNCDetailModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Hoja membretada oficial RNC */}
            <div className="p-6 rounded-2xl border-2 border-slate-300 bg-white space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h3 className="font-black text-base text-[#001D3D]">COLORLINK • PINTUCO S.A.</h3>
                  <p className="text-[10px] font-bold text-slate-500">
                    REGISTRO DE NO CONFORMIDAD Y ACCIONES CORRECTIVAS (RNC)
                  </p>
                </div>
                <div className="text-right font-mono text-[10.5px]">
                  <p className="font-black text-red-900">{selectedRNCForDetail.consecutivo}</p>
                  <p className="text-slate-500">Fecha de Reporte: {selectedRNCForDetail.fechaReporte}</p>
                </div>
              </div>

              <div>
                <h4 className="font-black text-sm text-slate-900 mb-1">{selectedRNCForDetail.titulo}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-50 rounded-xl text-[10.5px] border border-slate-200">
                  <div><strong>Área Emisora:</strong> {selectedRNCForDetail.areaEmisoraNombre}</div>
                  <div><strong>Área Destino:</strong> {selectedRNCForDetail.areaDestinoNombre}</div>
                  <div><strong>Responsable Destino:</strong> {selectedRNCForDetail.responsableDestinoNombre}</div>
                  <div><strong>Sede Afectada:</strong> {selectedRNCForDetail.sedeNombre}</div>
                </div>
              </div>

              {selectedRNCForDetail.normaAsociada && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span><strong>Norma Técnica Referenciada:</strong> {selectedRNCForDetail.normaAsociada}</span>
                </div>
              )}

              <div className="space-y-1">
                <strong className="text-[11px] text-slate-900 block">Descripción Detallada del Hallazgo / Evidencia Objetiva:</strong>
                <p className="text-slate-700 leading-relaxed text-[11px] bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {selectedRNCForDetail.descripcion}
                </p>
              </div>

              {selectedRNCForDetail.accionesInmediatas && (
                <div className="space-y-1">
                  <strong className="text-[11px] text-amber-900 block">Acción Inmediata de Contención:</strong>
                  <p className="text-amber-900 text-[11px] bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                    {selectedRNCForDetail.accionesInmediatas}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <strong className="text-[11px] text-slate-900 block">Plan de Acción Correctiva y Causa Raíz:</strong>
                <p className="text-slate-700 leading-relaxed text-[11px] bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {selectedRNCForDetail.planAccionPropuesto}
                </p>
              </div>

              {/* Evidencias Adjuntas */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <strong className="text-[11px] text-slate-900 block">Evidencias Objetivas Adjuntas ({selectedRNCForDetail.evidencias.length}):</strong>
                  <button
                    type="button"
                    onClick={() => handleOpenEvidenciaModal(selectedRNCForDetail)}
                    className="text-[10.5px] text-blue-700 font-bold hover:underline flex items-center gap-1"
                  >
                    + Adjuntar nueva evidencia
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedRNCForDetail.evidencias.map((ev) => (
                    <div key={ev.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 truncate">
                        {ev.tipo === 'imagen' ? (
                          <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        <span className="font-mono text-slate-800 truncate">{ev.nombre}</span>
                      </div>
                      <span className="text-[9.5px] font-mono text-slate-400 shrink-0">{ev.fechaSubida}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verificación de Cierre si aplica */}
              {selectedRNCForDetail.estado === 'Cerrada / Verificada' && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1 text-[11px] text-emerald-900">
                  <div className="flex items-center justify-between">
                    <strong>Verificación de Eficacia y Cierre:</strong>
                    <span className="font-mono text-[10px]">Cerrado el: {selectedRNCForDetail.fechaCierreReal}</span>
                  </div>
                  <p>{selectedRNCForDetail.notasCierre}</p>
                  <p className="text-[10px] text-emerald-700 font-bold">Verificado por: {selectedRNCForDetail.verificadoPor}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleOpenStatusModal(selectedRNCForDetail)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#001D3D] text-white hover:bg-blue-900"
              >
                Actualizar Estado / Cierre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: GESTIONAR ESTADO / CIERRE DE RNC
      ========================================================================= */}
      {isRNCStatusModalOpen && rncToUpdate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Actualizar Estado de {rncToUpdate.consecutivo}
                </h3>
                <p className="text-[11px] text-slate-500">{rncToUpdate.titulo}</p>
              </div>
              <button type="button" onClick={() => setIsRNCStatusModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveRNCStatus} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nuevo Estado:</label>
                <select
                  value={modalNewStatus}
                  onChange={(e) => setModalNewStatus(e.target.value as EstadoRNC)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-bold text-xs"
                >
                  <option value="Abierta">Abierta</option>
                  <option value="En Análisis">En Análisis</option>
                  <option value="En Plan de Acción">En Plan de Acción</option>
                  <option value="Cerrada / Verificada">Cerrada / Verificada</option>
                </select>
              </div>

              {modalNewStatus === 'Cerrada / Verificada' && (
                <div className="space-y-3 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Constancia de Verificación de Eficacia</span>
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-emerald-900 mb-1">Notas de Cierre y Verificación en Sitio: *</label>
                    <textarea
                      required
                      rows={3}
                      value={modalNotasCierre}
                      onChange={(e) => setModalNotasCierre(e.target.value)}
                      placeholder="Describa cómo se comprobó la eficacia de la acción correctiva..."
                      className="w-full p-2.5 bg-white rounded-xl border border-emerald-300 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-emerald-900 mb-1">Auditor / Verificador Responsable: *</label>
                    <input
                      type="text"
                      required
                      value={modalVerificador}
                      onChange={(e) => setModalVerificador(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white rounded-xl border border-emerald-300 text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRNCStatusModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#001D3D] text-white font-bold rounded-xl hover:bg-blue-900 shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADJUNTAR NUEVA EVIDENCIA A RNC
      ========================================================================= */}
      {isRNCEvidenciaModalOpen && rncToUpdate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Adjuntar Evidencia a {rncToUpdate.consecutivo}
                </h3>
                <p className="text-[11px] text-slate-500">Fotografía de ensayo o documento técnico</p>
              </div>
              <button type="button" onClick={() => setIsRNCEvidenciaModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveNuevaEvidencia} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Evidencia:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoEvidenciaModal('imagen')}
                    className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 ${
                      tipoEvidenciaModal === 'imagen'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Fotografía</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoEvidenciaModal('documento')}
                    className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 ${
                      tipoEvidenciaModal === 'documento'
                        ? 'bg-blue-50 border-blue-500 text-blue-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Documento PDF</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nombre o Descripción del Archivo: *</label>
                <input
                  type="text"
                  required
                  value={nuevaEvidenciaInputModal}
                  onChange={(e) => setNuevaEvidenciaInputModal(e.target.value)}
                  placeholder="Ej: Foto_Panel_Leneta_Reproceso.jpg"
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRNCEvidenciaModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#001D3D] text-white font-bold rounded-xl hover:bg-blue-900 shadow-sm"
                >
                  Adjuntar Evidencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CREAR NUEVA ACTA DE REUNIÓN (FORMULARIO COMPLETO)
      ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#001D3D] text-cyan-300 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Radicar Nueva Acta de Reunión / Comité
                  </h3>
                  <p className="text-xs text-slate-500">
                    Constancia formal inmutable bajo estándares de aseguramiento de calidad NTC 1335
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNuevaActa} className="space-y-5 text-xs">
              {/* 1. DATOS GENERALES */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  1. Datos Generales de la Sesión
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Título Oficial de la Reunión / Comité: *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitulo}
                      onChange={(e) => setFormTitulo(e.target.value)}
                      placeholder="Ej: Comité Extraordinario de Aseguramiento de Calidad NTC 1335"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Sesión: *</label>
                    <select
                      value={formTipo}
                      onChange={(e) => setFormTipo(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="Comité Operativo">Comité Operativo</option>
                      <option value="Auditoría de Calidad NTC 1335">Auditoría de Calidad NTC 1335</option>
                      <option value="Control de Inventarios y Bodega">Control de Inventarios y Bodega</option>
                      <option value="Comité SAC / PQRS">Comité SAC / PQRS</option>
                      <option value="Dirección y Gerencia General">Dirección y Gerencia General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sede / CEDI: *</label>
                    <select
                      value={formSedeId}
                      onChange={(e) => setFormSedeId(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="todas">🏢 Todas las Sedes (Consolidado Nacional)</option>
                      {SEDES_CEDI_CONFIG.map((s) => (
                        <option key={s.id} value={s.id}>
                          📍 {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Fecha:</label>
                      <input
                        type="date"
                        value={formFecha}
                        onChange={(e) => setFormFecha(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Hora Inicio:</label>
                      <input
                        type="time"
                        value={formHoraInicio}
                        onChange={(e) => setFormHoraInicio(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Hora Fin:</label>
                      <input
                        type="time"
                        value={formHoraFin}
                        onChange={(e) => setFormHoraFin(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Lugar / Sala:</label>
                    <input
                      type="text"
                      value={formLugar}
                      onChange={(e) => setFormLugar(e.target.value)}
                      placeholder="Ej: Sala de Juntas Planta Rionegro / Virtual Teams"
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Moderador / Líder:</label>
                    <input
                      type="text"
                      value={formModeradorNombre}
                      onChange={(e) => setFormModeradorNombre(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Cargo del Moderador:</label>
                    <input
                      type="text"
                      value={formModeradorCargo}
                      onChange={(e) => setFormModeradorCargo(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 2. ASISTENTES E INVITADOS EXTERNOS */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  2. Asistentes y Participantes
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                    Seleccionar Funcionarios de la Intranet ({formAsistentesIds.length} seleccionados):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                    {funcionarios.map((func) => {
                      const isSelected = formAsistentesIds.includes(func.id);
                      return (
                        <div
                          key={func.id}
                          onClick={() => handleToggleAsistente(func)}
                          className={`p-2 rounded-lg border text-[11px] cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="truncate">
                            <span className="block truncate">{func.nombre}</span>
                            <span className="text-[9.5px] text-slate-400 block truncate">{func.cargo}</span>
                          </div>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'}`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Invitados Externos (Auditores ICONTEC, Interventores, Contratistas):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInvitadoInput}
                      onChange={(e) => setNewInvitadoInput(e.target.value)}
                      placeholder="Ej: Ing. Andrés Silva (Auditor Delegado ICONTEC)"
                      className="flex-1 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddInvitado();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddInvitado}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      + Agregar
                    </button>
                  </div>
                  {formInvitadosExternos.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formInvitadosExternos.map((inv, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10.5px] flex items-center gap-1">
                          {inv}
                          <button type="button" onClick={() => handleRemoveInvitado(idx)} className="hover:text-red-600">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. ORDEN DEL DÍA Y TEMAS TRATADOS */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  3. Orden del Día, Temas Tratados y Conclusiones
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Puntos del Orden del Día:</label>
                  <div className="space-y-1 mb-2">
                    {formOrdenDelDia.map((punto, idx) => (
                      <div key={idx} className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 text-[11px]">
                        <span>{punto}</span>
                        <button type="button" onClick={() => handleRemovePuntoOrden(idx)} className="text-slate-400 hover:text-red-600 p-0.5">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPuntoOrdenInput}
                      onChange={(e) => setNewPuntoOrdenInput(e.target.value)}
                      placeholder="Nuevo punto del orden del día..."
                      className="flex-1 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPuntoOrden();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddPuntoOrden}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      + Añadir Punto
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Temas Tratados y Desarrollo de la Sesión: *</label>
                  <textarea
                    required
                    rows={4}
                    value={formTemasTratados}
                    onChange={(e) => setFormTemasTratados(e.target.value)}
                    placeholder="Describa detalladamente los análisis realizados, hallazgos discutidos y decisiones tomadas..."
                    className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs leading-relaxed focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Conclusiones Finales:</label>
                  <textarea
                    rows={2}
                    value={formConclusiones}
                    onChange={(e) => setFormConclusiones(e.target.value)}
                    placeholder="Resumen ejecutivo de acuerdos adoptados..."
                    className="w-full p-3 bg-white rounded-xl border border-slate-200 text-xs leading-relaxed"
                  />
                </div>
              </div>

              {/* 4. COMPROMISOS Y TAREAS ASIGNADAS */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    4. Matriz de Compromisos y Tareas Asignadas
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCompromiso}
                    className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-[11px] hover:bg-blue-200"
                  >
                    + Añadir Fila
                  </button>
                </div>

                <div className="space-y-2">
                  {formCompromisos.map((comp, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-5">
                        <label className="text-[9.5px] font-bold text-slate-400 block mb-0.5">Descripción de la Tarea:</label>
                        <input
                          type="text"
                          required
                          value={comp.descripcion}
                          onChange={(e) => handleUpdateCompromiso(idx, 'descripcion', e.target.value)}
                          placeholder="Compromiso acordado..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[9.5px] font-bold text-slate-400 block mb-0.5">Responsable:</label>
                        <input
                          type="text"
                          required
                          value={comp.responsableNombre}
                          onChange={(e) => handleUpdateCompromiso(idx, 'responsableNombre', e.target.value)}
                          placeholder="Nombre responsable..."
                          className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[9.5px] font-bold text-slate-400 block mb-0.5">Fecha Límite:</label>
                        <input
                          type="date"
                          value={comp.fechaLimite}
                          onChange={(e) => handleUpdateCompromiso(idx, 'fechaLimite', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]"
                        />
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-1 pt-3 sm:pt-0">
                        <select
                          value={comp.estado}
                          onChange={(e) => handleUpdateCompromiso(idx, 'estado', e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[10.5px] font-bold"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Progreso">En Progreso</option>
                          <option value="Cumplido">Cumplido</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveCompromiso(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#001D3D] to-blue-900 text-white font-bold text-xs shadow-md hover:from-blue-900 hover:to-blue-800"
                >
                  Guardar y Radicar Acta Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VISUALIZADOR DE ACTA COMPLETA MEMBRETADA (LECTURA & PDF)
      ========================================================================= */}
      {isDetailModalOpen && selectedActaForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                  {selectedActaForDetail.consecutivo}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Estado: {selectedActaForDetail.estado}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Exportar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl border-2 border-slate-300 bg-white space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h3 className="font-black text-base text-[#001D3D]">COLORLINK • PINTUCO S.A.</h3>
                  <p className="text-[10px] font-bold text-slate-500">ACTA OFICIAL DE COMITÉ Y AUDITORÍA</p>
                </div>
                <div className="text-right font-mono text-[10.5px]">
                  <p className="font-black text-blue-900">{selectedActaForDetail.consecutivo}</p>
                  <p className="text-slate-500">{selectedActaForDetail.fecha} • {selectedActaForDetail.horaInicio} - {selectedActaForDetail.horaFin}</p>
                </div>
              </div>

              <div>
                <h4 className="font-black text-sm text-slate-900 mb-1">{selectedActaForDetail.titulo}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-50 rounded-xl text-[10.5px] border border-slate-200">
                  <div><strong>Tipo:</strong> {selectedActaForDetail.tipo}</div>
                  <div><strong>Sede:</strong> {selectedActaForDetail.sedeNombre}</div>
                  <div><strong>Lugar:</strong> {selectedActaForDetail.lugar}</div>
                  <div><strong>Moderador:</strong> {selectedActaForDetail.moderadorNombre}</div>
                </div>
              </div>

              <div className="space-y-1">
                <strong className="text-[11px] text-slate-900 block">Orden del Día:</strong>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-slate-600">
                  {selectedActaForDetail.ordenDelDia.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1">
                <strong className="text-[11px] text-slate-900 block">Temas Tratados y Desarrollo:</strong>
                <p className="text-slate-700 leading-relaxed text-[11px] bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {selectedActaForDetail.temasTratados}
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-[11px] text-slate-900 block">Conclusiones:</strong>
                <p className="text-slate-700 text-[11px] bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  {selectedActaForDetail.conclusiones}
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <strong className="text-[11px] text-slate-900 block">Compromisos Asignados ({selectedActaForDetail.compromisos.length}):</strong>
                <table className="w-full text-left text-[11px] border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-[#001D3D] text-white font-bold text-[10px]">
                    <tr>
                      <th className="p-2">Compromiso / Tarea</th>
                      <th className="p-2">Responsable</th>
                      <th className="p-2">Fecha Límite</th>
                      <th className="p-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {selectedActaForDetail.compromisos.map((c) => (
                      <tr key={c.id}>
                        <td className="p-2 font-medium text-slate-900">{c.descripcion}</td>
                        <td className="p-2 text-slate-700">{c.responsableNombre}</td>
                        <td className="p-2 font-mono text-slate-500">{c.fechaLimite}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            c.estado === 'Cumplido' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {c.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-200">
                <strong className="text-[11px] text-slate-900 block">Firmas Digitales de Asistencia y Conformidad:</strong>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedActaForDetail.asistentes.map((a, i) => (
                    <div key={i} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[10.5px] space-y-1">
                      <div className="font-bold text-slate-900 truncate">{a.nombre}</div>
                      <div className="text-slate-500 text-[9.5px] truncate">{a.cargo}</div>
                      {a.firmado ? (
                        <div className="text-emerald-700 font-mono text-[9px] font-black flex items-center gap-1 pt-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>FIRMADO DIGITALMENTE ({a.fechaFirma || 'Validado'})</span>
                        </div>
                      ) : (
                        <div className="text-amber-700 text-[9.5px] font-bold pt-1 flex items-center justify-between">
                          <span>Pendiente Firma</span>
                          {selectedActaForDetail.estado === 'En Firma' && (
                            <button
                              type="button"
                              onClick={() => handleFirmarActa(selectedActaForDetail)}
                              className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-[9px]"
                            >
                              Firmar
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VISUALIZADOR DE INFORME DE AUDITORÍA COMPLETO
      ========================================================================= */}
      {isInformeDetailModalOpen && selectedInformeForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs bg-violet-100 text-violet-900 px-2 py-0.5 rounded">
                  {selectedInformeForDetail.codigoInforme}
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  Cumplimiento: {selectedInformeForDetail.porcentajeCumplimiento}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Exportar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsInformeDetailModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 rounded-2xl border-2 border-slate-300 bg-white space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h3 className="font-black text-base text-[#001D3D]">COLORLINK • PINTUCO S.A.</h3>
                  <p className="text-[10px] font-bold text-slate-500">INFORME EJECUTIVO DE AUDITORÍA Y CALIDAD</p>
                </div>
                <div className="text-right font-mono text-[10.5px]">
                  <p className="font-black text-violet-900">{selectedInformeForDetail.codigoInforme}</p>
                  <p className="text-slate-500">Fecha: {selectedInformeForDetail.fechaAuditoria}</p>
                </div>
              </div>

              <div>
                <h4 className="font-black text-sm text-slate-900 mb-1">{selectedInformeForDetail.titulo}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-slate-50 rounded-xl text-[10.5px] border border-slate-200">
                  <div><strong>Tipo:</strong> {selectedInformeForDetail.tipoAuditoria}</div>
                  <div><strong>Sede:</strong> {selectedInformeForDetail.sedeNombre}</div>
                  <div><strong>Auditor Líder:</strong> {selectedInformeForDetail.auditorLider}</div>
                  <div><strong>Nivel de Riesgo:</strong> {selectedInformeForDetail.nivelRiesgo}</div>
                </div>
              </div>

              <div className="space-y-1">
                <strong className="text-[11px] text-slate-900 block">Resumen Ejecutivo:</strong>
                <p className="text-slate-700 text-[11px] leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {selectedInformeForDetail.resumenEjecutivo}
                </p>
              </div>

              <div className="space-y-1.5">
                <strong className="text-[11px] text-slate-900 block">Hallazgos y Observaciones Levantadas ({selectedInformeForDetail.hallazgos.length}):</strong>
                <div className="space-y-2">
                  {selectedInformeForDetail.hallazgos.map((h) => (
                    <div key={h.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{h.tipo}: {h.clausulaNorma}</span>
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                          h.estado === 'Cerrado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {h.estado}
                        </span>
                      </div>
                      <p className="text-slate-600">{h.descripcion}</p>
                      <div className="text-[10px] text-slate-400">
                        <strong>Evidencia:</strong> {h.evidencia} • <strong>Responsable:</strong> {h.responsable} • <strong>Cierre estimado:</strong> {h.fechaCierreEstimada}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-200">
                <strong className="text-[11px] text-slate-900 block">Conclusiones de la Dirección de Calidad:</strong>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {selectedInformeForDetail.conclusionesGenerales}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
