import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  Briefcase,
  Users,
  Truck,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  Printer,
  X,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  FolderOpen,
  Calendar,
  Sparkles,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import {
  DocumentoCorporativo,
  CategoriaDocCorp,
  EstadoDocCorp,
  CATEGORIAS_DOCUMENTOS_CORP,
  getDocumentosCorporativos,
  crearDocumentoCorporativo,
  actualizarDocumentoCorporativo,
  registrarAuditoria,
  SEDES_CEDI_CONFIG,
} from '../services/corporateService';

interface ArchivoDocumentosManagerProps {
  userSession?: any;
  selectedSede: string;
  onChangeSede?: (sedeId: string) => void;
  onRegistrarAuditoria?: (modulo: 'Seguridad' | 'Usuarios' | 'Inventario', accion: string, detalle: string) => void;
}

export const ArchivoDocumentosManager: React.FC<ArchivoDocumentosManagerProps> = ({
  userSession,
  selectedSede,
  onChangeSede,
  onRegistrarAuditoria,
}) => {
  const [documentos, setDocumentos] = useState<DocumentoCorporativo[]>(() => getDocumentosCorporativos());
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaDocCorp | 'todas'>('todas');
  const [selectedEstado, setSelectedEstado] = useState<EstadoDocCorp | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modales
  const [previewDoc, setPreviewDoc] = useState<DocumentoCorporativo | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Formulario nuevo documento
  const [nuevoForm, setNuevoForm] = useState<{
    codigo: string;
    nombre: string;
    categoria: CategoriaDocCorp;
    version: string;
    estado: EstadoDocCorp;
    formato: 'PDF' | 'DOCX' | 'XLSX';
    responsable: string;
    sedeAplica: string;
    descripcion: string;
    tags: string;
    archivoSimuladoNombre: string;
  }>({
    codigo: '',
    nombre: '',
    categoria: 'calidad',
    version: 'v1.0 (2026)',
    estado: 'Vigente',
    formato: 'PDF',
    responsable: userSession?.nombre || 'Gestor Documental Central',
    sedeAplica: 'Nacional (Todas las Sedes)',
    descripcion: '',
    tags: '',
    archivoSimuladoNombre: '',
  });

  // Escuchar actualizaciones externas
  useEffect(() => {
    const handleUpdate = () => {
      setDocumentos(getDocumentosCorporativos());
    };
    window.addEventListener('colorlink_docs_corp_updated', handleUpdate);
    return () => window.removeEventListener('colorlink_docs_corp_updated', handleUpdate);
  }, []);

  // Filtrado de documentos
  const documentosFiltrados = useMemo(() => {
    return documentos.filter((doc) => {
      // Filtro categoría
      if (selectedCategoria !== 'todas' && doc.categoria !== selectedCategoria) {
        return false;
      }
      // Filtro estado
      if (selectedEstado !== 'todos' && doc.estado !== selectedEstado) {
        return false;
      }
      // Filtro búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = doc.codigo.toLowerCase().includes(q);
        const matchNombre = doc.nombre.toLowerCase().includes(q);
        const matchDesc = doc.descripcion.toLowerCase().includes(q);
        const matchResp = doc.responsable.toLowerCase().includes(q);
        const matchTags = doc.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchCode && !matchNombre && !matchDesc && !matchResp && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [documentos, selectedCategoria, selectedEstado, searchQuery]);

  // Contadores por categoría
  const countPorCategoria = useMemo(() => {
    const counts: Record<string, number> = { todas: documentos.length };
    CATEGORIAS_DOCUMENTOS_CORP.forEach((c) => {
      counts[c.id] = documentos.filter((d) => d.categoria === c.id).length;
    });
    return counts;
  }, [documentos]);

  // Descarga de archivo formateado
  const handleDownload = (doc: DocumentoCorporativo) => {
    const logUser = userSession?.nombre || 'Funcionario Autorizado';
    registrarAuditoria(
      'Seguridad',
      'Descarga de Documento Corporativo',
      `Descarga de [${doc.codigo}] ${doc.nombre} (${doc.version}) en formato ${doc.formato}. Usuario: ${logUser}.`,
      logUser
    );
    if (onRegistrarAuditoria) {
      onRegistrarAuditoria(
        'Seguridad',
        'Descarga de Documento Corporativo',
        `Descarga de [${doc.codigo}] ${doc.nombre} (${doc.version}).`
      );
    }

    // Generar archivo de descarga
    const fileContent = `================================================================================
PINTUCO S.A. / COLORLINK - GESTIÓN DOCUMENTAL CORPORATIVA
SISTEMA INTEGRADO DE GESTIÓN (ISO 9001:2015 • ICONTEC NTC 1335)
================================================================================

DOCUMENTO OFICIAL HOMOLOGADO
Código de Control Interno: ${doc.codigo}
Título del Documento:     ${doc.nombre}
Categoría Oficial:        ${doc.categoriaNombre}
Versión Actual:           ${doc.version}
Estado Normativo:         ${doc.estado}
Fecha Última Aprobación:  ${doc.fechaActualizacion}
Responsable de Emisión:   ${doc.responsable}
Sedes con Aplicabilidad:  ${doc.sedeAplica}
Formato de Custodia:      ${doc.formato} (${doc.tamano})
Tags / Claves:            ${doc.tags.join(', ')}

--------------------------------------------------------------------------------
DESCRIPCIÓN Y ALCANCE:
${doc.descripcion}

--------------------------------------------------------------------------------
CONTENIDO ESTRUCTURADO Y DISPOSICIONES VIGENTES:
${doc.contenidoPrevisualizacion?.map((line) => `• ${line}`).join('\n') || 'Contenido archivado en bóveda digital central.'}

================================================================================
Este documento es copia controlada digital emitida bajo la custodia de la
Secretaría General y Dirección de Calidad de Pintuco S.A.
Descargado por: ${logUser} el ${new Date().toLocaleString('es-CO')}
================================================================================`;

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.codigo}_${doc.nombre.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 35)}_${doc.version}.${doc.formato.toLowerCase() === 'xlsx' ? 'txt' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setToastMessage(`Descargando documento "${doc.codigo} - ${doc.nombre}" (${doc.formato}). Registro de auditoría guardado.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Exportar matriz completa a CSV
  const handleExportCSV = () => {
    const headers = ['Código', 'Nombre del Documento', 'Categoría', 'Versión', 'Estado', 'Última Actualización', 'Responsable', 'Sede Aplica', 'Formato', 'Tamaño'];
    const rows = documentos.map((d) => [
      `"${d.codigo}"`,
      `"${d.nombre.replace(/"/g, '""')}"`,
      `"${d.categoriaNombre}"`,
      `"${d.version}"`,
      `"${d.estado}"`,
      `"${d.fechaActualizacion}"`,
      `"${d.responsable}"`,
      `"${d.sedeAplica}"`,
      `"${d.formato}"`,
      `"${d.tamano}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Archivo_Documentos_Corporativos_Pintuco_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage('Matriz de documentos corporativos exportada en formato CSV.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Crear nuevo documento
  const handleCrearDocumento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoForm.codigo.trim() || !nuevoForm.nombre.trim() || !nuevoForm.descripcion.trim()) {
      alert('Por favor completa el código, nombre y descripción del documento.');
      return;
    }

    const catObj = CATEGORIAS_DOCUMENTOS_CORP.find((c) => c.id === nuevoForm.categoria);
    const tagsArray = nuevoForm.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const docCreado = crearDocumentoCorporativo({
      codigo: nuevoForm.codigo.trim().toUpperCase(),
      nombre: nuevoForm.nombre.trim(),
      categoria: nuevoForm.categoria,
      categoriaNombre: catObj?.titulo || 'Gestión Corporativa',
      version: nuevoForm.version.trim() || 'v1.0 (2026)',
      estado: nuevoForm.estado,
      fechaActualizacion: new Date().toISOString().slice(0, 10),
      formato: nuevoForm.formato,
      tamano: `${(Math.random() * 4 + 1.2).toFixed(1)} MB`,
      responsable: nuevoForm.responsable.trim(),
      sedeAplica: nuevoForm.sedeAplica.trim(),
      descripcion: nuevoForm.descripcion.trim(),
      tags: tagsArray.length > 0 ? tagsArray : ['corporativo', 'proceso'],
      contenidoPrevisualizacion: [
        `1. OBJETO Y PROPÓSITO: ${nuevoForm.descripcion.trim()}`,
        `2. RESPONSABLE DE APLICACIÓN: ${nuevoForm.responsable.trim()} en ${nuevoForm.sedeAplica.trim()}.`,
        `3. VIGENCIA Y CUMPLIMIENTO: Documento oficial formalizado bajo el Sistema Integrado de Gestión Pintuco / ColorLink.`,
      ],
    });

    setDocumentos(getDocumentosCorporativos());
    setIsUploadModalOpen(false);
    setNuevoForm({
      codigo: '',
      nombre: '',
      categoria: 'calidad',
      version: 'v1.0 (2026)',
      estado: 'Vigente',
      formato: 'PDF',
      responsable: userSession?.nombre || 'Gestor Documental Central',
      sedeAplica: 'Nacional (Todas las Sedes)',
      descripcion: '',
      tags: '',
      archivoSimuladoNombre: '',
    });

    setToastMessage(`Documento "${docCreado.codigo} - ${docCreado.nombre}" cargado exitosamente en el archivo corporativo.`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Helper de icono por categoría
  const getCategoriaIcon = (catId: CategoriaDocCorp) => {
    switch (catId) {
      case 'calidad':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'sgsst':
        return <AlertTriangle className="w-4 h-4 text-emerald-600" />;
      case 'legal':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      case 'talento':
        return <Users className="w-4 h-4 text-amber-600" />;
      case 'logistica':
        return <Truck className="w-4 h-4 text-cyan-600" />;
      case 'comercial':
        return <TrendingUp className="w-4 h-4 text-rose-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  // Helper de badge distintivo y colorido por categoría
  const getCategoriaBadge = (catId: CategoriaDocCorp, nombre: string) => {
    switch (catId) {
      case 'calidad':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate max-w-[140px]">{nombre}</span>
          </span>
        );
      case 'sgsst':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate max-w-[140px]">{nombre}</span>
          </span>
        );
      case 'legal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">
            <Briefcase className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="truncate max-w-[140px]">{nombre}</span>
          </span>
        );
      case 'talento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
            <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate max-w-[140px]">{nombre}</span>
          </span>
        );
      case 'logistica':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200/80 shadow-2xs">
            <Truck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span className="truncate max-w-[140px]">{nombre}</span>
          </span>
        );
      case 'comercial':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="truncate max-w-[140px]">{nombre}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
            <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate max-w-[140px]">{nombre}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* =========================================================================
          ENCABEZADO: TÍTULO, INSIGNIAS DE CONTROL Y BOTONES DE ACCIÓN
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#001D3D] via-[#002D5C] to-[#0A192F] text-cyan-300 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-cyan-500/30">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                Archivo & Documentos Legales Corporativos
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-50 text-cyan-800 border border-cyan-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                6 Categorías Estructuradas • ISO 9001 & NTC 1335
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-tight">
              Repositorio maestro de calidad, SG-SST, gobierno corporativo, gestión humana, logística y estrategia comercial
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            title="Exportar matriz documental completa en CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cargar Nuevo Documento</span>
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
            className="p-1 hover:bg-slate-800 rounded text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* =========================================================================
          1. SELECTOR Y PESTAÑAS DE CATEGORÍAS DOCUMENTALES (6 CATEGORÍAS OFICIALES)
      ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Estructura de Carpetas & Categorías Corporativas:
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Total {documentos.length} documentos indexados
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {/* Opción Todas */}
          <button
            type="button"
            onClick={() => setSelectedCategoria('todas')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              selectedCategoria === 'todas'
                ? 'bg-[#001D3D] text-white border-[#001D3D] shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <FolderOpen className={`w-4 h-4 ${selectedCategoria === 'todas' ? 'text-cyan-300' : 'text-slate-500'}`} />
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                selectedCategoria === 'todas' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {countPorCategoria.todas}
              </span>
            </div>
            <div className="mt-2">
              <p className="text-xs font-black leading-tight">Todas las Áreas</p>
              <p className={`text-[10px] mt-0.5 leading-tight ${selectedCategoria === 'todas' ? 'text-slate-300' : 'text-slate-400'}`}>
                Archivo Global
              </p>
            </div>
          </button>

          {/* 6 Categorías */}
          {CATEGORIAS_DOCUMENTOS_CORP.map((cat) => {
            const isSelected = selectedCategoria === cat.id;
            const count = countPorCategoria[cat.id] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoria(cat.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-slate-100'}`}>
                    {getCategoriaIcon(cat.id)}
                  </div>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`text-[9.5px] font-mono font-bold block ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    CAT {cat.numero}
                  </span>
                  <p className="text-xs font-black leading-tight truncate" title={cat.titulo}>
                    {cat.titulo}
                  </p>
                  <p className={`text-[10px] mt-0.5 leading-tight line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`} title={cat.descripcion}>
                    {cat.descripcion}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          2. BARRA DE HERRAMIENTAS: BÚSQUEDA RÁPIDA + FILTRO POR ESTADO
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        {/* Barra de búsqueda */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por código (ej: SGC-MAP-001), nombre del documento, palabra clave o responsable..."
            className="w-full pl-9 pr-8 py-2 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro por estado */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] font-bold text-slate-500 shrink-0">Estado:</span>
          <select
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value as any)}
            className="bg-slate-50 text-slate-800 font-bold text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="todos">Todos los Estados</option>
            <option value="Vigente">🟢 Vigente</option>
            <option value="En revisión">🟡 En revisión</option>
            <option value="Histórico">⚪ Histórico</option>
          </select>
        </div>
      </div>

      {/* =========================================================================
          3. TABLA / BANDEJA DE DOCUMENTOS CORPORATIVOS
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              {selectedCategoria === 'todas'
                ? 'Todos los Documentos Corporativos'
                : CATEGORIAS_DOCUMENTOS_CORP.find((c) => c.id === selectedCategoria)?.titulo}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
              {documentosFiltrados.length} {documentosFiltrados.length === 1 ? 'documento' : 'documentos'}
            </span>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            Control documental normativo ISO 9001 • NTC 1335
          </span>
        </div>

        {documentosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No se encontraron documentos en este criterio</p>
            <p className="text-xs text-slate-400 mt-1">
              Prueba modificando el término de búsqueda o cambiando el filtro de categoría.
            </p>
            {(searchQuery || selectedCategoria !== 'todas' || selectedEstado !== 'todos') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoria('todas');
                  setSelectedEstado('todos');
                }}
                className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Restablecer filtros</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-50/70">
                  <th className="py-2.5 px-3.5">Código & Documento</th>
                  <th className="py-2.5 px-3">Categoría</th>
                  <th className="py-2.5 px-2.5 text-center">Versión</th>
                  <th className="py-2.5 px-2.5 text-center">Estado</th>
                  <th className="py-2.5 px-3">Última Actualización</th>
                  <th className="py-2.5 px-3">Responsable & Sede</th>
                  <th className="py-2.5 px-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {documentosFiltrados.map((doc) => {
                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Código y Nombre */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                            {doc.formato === 'XLSX' ? (
                              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <FileText className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[11px] font-black text-slate-900 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 shadow-2xs tracking-tight shrink-0">
                                {doc.codigo}
                              </span>
                              <span className="text-[10px] font-mono font-medium text-slate-400">
                                {doc.formato} • {doc.tamano}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left text-xs leading-snug mt-0.5 block truncate max-w-sm sm:max-w-md cursor-pointer"
                              title={`Previsualizar ${doc.nombre}`}
                            >
                              {doc.nombre}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Categoría con Badge Colorido */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {getCategoriaBadge(doc.categoria, doc.categoriaNombre)}
                      </td>

                      {/* Versión centrada */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                          {doc.version}
                        </span>
                      </td>

                      {/* Estado centrado */}
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        {doc.estado === 'Vigente' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Vigente
                          </span>
                        )}
                        {doc.estado === 'En revisión' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            En revisión
                          </span>
                        )}
                        {doc.estado === 'Histórico' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                            Histórico
                          </span>
                        )}
                      </td>

                      {/* Fecha de actualización */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{doc.fechaActualizacion}</span>
                        </div>
                      </td>

                      {/* Responsable & Sede */}
                      <td className="py-2.5 px-3">
                        <div className="max-w-[190px]">
                          <p className="font-semibold text-slate-800 text-xs truncate leading-snug" title={doc.responsable}>
                            {doc.responsable}
                          </p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate leading-none" title={doc.sedeAplica}>
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{doc.sedeAplica}</span>
                          </p>
                        </div>
                      </td>

                      {/* Botones de acción alineados a la derecha */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Previsualizar */}
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                            title="Previsualizar documento estructurado"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Previsualizar</span>
                          </button>

                          {/* Descargar */}
                          <button
                            type="button"
                            onClick={() => handleDownload(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                            title="Descargar archivo en PDF / Excel"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Descargar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: PREVISUALIZACIÓN FORMAL DE DOCUMENTO CORPORATIVO
      ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full my-auto overflow-hidden animate-scaleUp">
            {/* Cabecera del modal */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#001D3D] via-[#002D5C] to-[#0A192F] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-cyan-400/20 text-cyan-200 px-2 py-0.5 rounded border border-cyan-400/30">
                      {previewDoc.codigo}
                    </span>
                    <span className="text-[11px] text-cyan-200 font-mono">
                      {previewDoc.version} • {previewDoc.formato}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white mt-1 leading-tight">
                    {previewDoc.nombre}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hoja formal de documento */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-700 bg-slate-50/50">
              {/* Membrete formal */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm tracking-tight">
                      PINTUCO S.A. • COLORLINK
                    </h4>
                    <p className="text-[10px] text-slate-500 font-mono">
                      SISTEMA INTEGRADO DE GESTIÓN (ISO 9001:2015 • NTC 1335)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                      DOCUMENTO {previewDoc.estado.toUpperCase()}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Actualizado: {previewDoc.fechaActualizacion}
                    </p>
                  </div>
                </div>

                {/* Grilla de metadatos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px]">CÓDIGO INTERNO:</span>
                    <span className="font-mono font-bold text-slate-900">{previewDoc.codigo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px]">CATEGORÍA:</span>
                    <span className="font-bold text-slate-900">{previewDoc.categoriaNombre}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px]">VERSIÓN:</span>
                    <span className="font-mono font-bold text-slate-900">{previewDoc.version}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold text-[10px]">TAMAÑO / FORMATO:</span>
                    <span className="font-mono font-bold text-slate-900">{previewDoc.formato} ({previewDoc.tamano})</span>
                  </div>
                </div>
              </div>

              {/* Responsable y Sede */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Responsable de Custodia & Aprobación:
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">{previewDoc.responsable}</p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">
                    Ámbito de Aplicabilidad / Sedes:
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">{previewDoc.sedeAplica}</p>
                </div>
              </div>

              {/* Objeto y Descripción */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                  1. Objeto y Alcance del Documento
                </h5>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {previewDoc.descripcion}
                </p>
              </div>

              {/* Contenido / Cláusulas Estructuradas */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
                <h5 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                  2. Disposiciones Normativas & Cláusulas Aplicables
                </h5>
                <div className="space-y-2 text-xs text-slate-700">
                  {previewDoc.contenidoPrevisualizacion?.map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{line}</span>
                    </div>
                  )) || (
                    <p className="text-slate-400 italic">No hay previsualización de texto extendido disponible.</p>
                  )}
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-bold text-slate-400">Palabras clave:</span>
                {previewDoc.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200/80 text-slate-700">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Pie del modal con acciones */}
            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Copia controlada digital • NTC 1335
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleDownload(previewDoc);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Copia ({previewDoc.formato})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: CARGA DE NUEVO DOCUMENTO CORPORATIVO
      ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-auto overflow-hidden animate-scaleUp">
            {/* Encabezado */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black">Cargar Nuevo Documento Corporativo</h3>
                  <p className="text-[11px] text-blue-100">
                    Ingresa los datos normativos para indexar el documento en el archivo corporativo
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCrearDocumento} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Código y Nombre */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Código de Control *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoForm.codigo}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ej: SGC-MAP-002"
                    className="w-full font-mono px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Nombre Oficial del Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoForm.nombre}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, nombre: e.target.value })}
                    placeholder="Ej: Manual de Aseguramiento Metrológico en Balanzas"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Categoría y Versión */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Categoría Corporativa *
                  </label>
                  <select
                    value={nuevoForm.categoria}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, categoria: e.target.value as CategoriaDocCorp })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                  >
                    {CATEGORIAS_DOCUMENTOS_CORP.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.numero}. {c.titulo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Versión *
                  </label>
                  <input
                    type="text"
                    value={nuevoForm.version}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, version: e.target.value })}
                    placeholder="v1.0 (2026)"
                    className="w-full font-mono px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Estado, Formato y Sede */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Estado *
                  </label>
                  <select
                    value={nuevoForm.estado}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, estado: e.target.value as EstadoDocCorp })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                  >
                    <option value="Vigente">Vigente</option>
                    <option value="En revisión">En revisión</option>
                    <option value="Histórico">Histórico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Formato *
                  </label>
                  <select
                    value={nuevoForm.formato}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, formato: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                  >
                    <option value="PDF">PDF (Acrobat)</option>
                    <option value="DOCX">DOCX (Word)</option>
                    <option value="XLSX">XLSX (Excel)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                    Sede / Ámbito *
                  </label>
                  <input
                    type="text"
                    value={nuevoForm.sedeAplica}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, sedeAplica: e.target.value })}
                    placeholder="Nacional / Planta Rionegro"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Responsable */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Funcionario / Responsable del Documento *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoForm.responsable}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, responsable: e.target.value })}
                  placeholder="Nombre y cargo del responsable"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Descripción Detallada & Alcance *
                </label>
                <textarea
                  required
                  rows={3}
                  value={nuevoForm.descripcion}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, descripcion: e.target.value })}
                  placeholder="Explica el propósito del documento, áreas a las que aplica y requisitos normativos que cumple..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-normal"
                />
              </div>

              {/* Palabras clave */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1">
                  Palabras Clave / Tags (Separadas por coma)
                </label>
                <input
                  type="text"
                  value={nuevoForm.tags}
                  onChange={(e) => setNuevoForm({ ...nuevoForm, tags: e.target.value })}
                  placeholder="Ej: calidad, auditoria, calibracion, iso 9001"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                />
              </div>

              {/* Carga de archivo simulada */}
              <div className="p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                <FolderOpen className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">Adjuntar Archivo Digital</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Formatos permitidos: PDF, DOCX, XLSX (Hasta 25 MB)</p>
                <input
                  type="file"
                  id="archivoCorporativoInput"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNuevoForm({
                        ...nuevoForm,
                        archivoSimuladoNombre: file.name,
                      });
                    }
                  }}
                />
                <label
                  htmlFor="archivoCorporativoInput"
                  className="mt-2.5 inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  {nuevoForm.archivoSimuladoNombre ? `✓ ${nuevoForm.archivoSimuladoNombre}` : 'Seleccionar Archivo Local'}
                </label>
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
                >
                  Guardar & Indexar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
