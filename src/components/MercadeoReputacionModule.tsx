import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Star,
  Award,
  Truck,
  HeadphonesIcon,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Search,
  Image as ImageIcon,
  ShieldCheck,
  Clock,
  MapPin,
  BarChart3,
  X,
} from 'lucide-react';
import {
  OrderSatisfactionReview,
  ReviewAlertFinding,
  toggleHighlightReviewForMarketing,
  alertReviewToSacOrLogistics,
} from '../services/reviewsService';

interface MercadeoReputacionModuleProps {
  reviews: OrderSatisfactionReview[];
  subTab: 'tablero' | 'resenas';
  onChangeSubTab: (tab: 'tablero' | 'resenas') => void;
  staffName: string;
  onReviewsUpdated: (reviews: OrderSatisfactionReview[]) => void;
  onNavigateToModule?: (tab: 'sac' | 'logistica') => void;
}

const renderStarsInline = (score: number) => {
  const rounded = Math.round(score);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${
            n <= rounded ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
          }`}
        />
      ))}
    </div>
  );
};

export const MercadeoReputacionModule: React.FC<MercadeoReputacionModuleProps> = ({
  reviews,
  subTab,
  onChangeSubTab,
  staffName,
  onReviewsUpdated,
  onNavigateToModule,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<
    'todas' | 'positivas' | 'alertas' | 'autorizadas' | 'destacadas'
  >('todas');
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [selectedAlertFinding, setSelectedAlertFinding] = useState<
    Record<string, ReviewAlertFinding>
  >({});

  const showNotice = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 4500);
  };

  // KPIs Calculados en Tiempo Real
  const kpis = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        total: 0,
        avgCalidad: 0,
        avgEntrega: 0,
        avgAtencion: 0,
        avgGlobal: 0,
        autorizadasCount: 0,
        destacadasCount: 0,
        alertasPendientesCount: 0,
        punctuality: { antes: 0, aTiempo: 0, retraso: 0 },
        distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0, pct: 0 })),
      };
    }

    const sumCalidad = reviews.reduce((acc, r) => acc + r.ratingCalidadProducto, 0);
    const sumEntrega = reviews.reduce((acc, r) => acc + r.ratingTiempoEntrega, 0);
    const sumAtencion = reviews.reduce((acc, r) => acc + r.ratingAtencion, 0);
    const avgCalidad = Number((sumCalidad / total).toFixed(2));
    const avgEntrega = Number((sumEntrega / total).toFixed(2));
    const avgAtencion = Number((sumAtencion / total).toFixed(2));
    const avgGlobal = Number(((avgCalidad + avgEntrega + avgAtencion) / 3).toFixed(2));

    const autorizadasCount = reviews.filter((r) => r.autorizaPublicidad).length;
    const destacadasCount = reviews.filter((r) => r.destacadoPublicidad).length;
    const alertasPendientesCount = reviews.filter(
      (r) =>
        (r.ratingAtencion <= 3 || r.ratingTiempoEntrega <= 3 || r.ratingCalidadProducto <= 3) &&
        !r.alertadoSacLogistica
    ).length;

    const punctuality = {
      antes: reviews.filter((r) => r.puntualidadEntrega === 'Antes de lo esperado').length,
      aTiempo: reviews.filter((r) => r.puntualidadEntrega === 'A tiempo').length,
      retraso: reviews.filter((r) => r.puntualidadEntrega === 'Con retraso').length,
    };

    const distribution = [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((r) => {
        const rounded = Math.round(
          (r.ratingAtencion + r.ratingTiempoEntrega + r.ratingCalidadProducto) / 3
        );
        return rounded === stars;
      }).length;
      return { stars, count, pct: Math.round((count / total) * 100) };
    });

    return {
      total,
      avgCalidad,
      avgEntrega,
      avgAtencion,
      avgGlobal,
      autorizadasCount,
      destacadasCount,
      alertasPendientesCount,
      punctuality,
      distribution,
    };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const avg = (r.ratingAtencion + r.ratingTiempoEntrega + r.ratingCalidadProducto) / 3;
      const hasLowScore =
        r.ratingAtencion <= 3 || r.ratingTiempoEntrega <= 3 || r.ratingCalidadProducto <= 3;

      if (filterMode === 'positivas' && (avg < 4 || hasLowScore)) return false;
      if (filterMode === 'alertas' && !hasLowScore) return false;
      if (filterMode === 'autorizadas' && !r.autorizaPublicidad) return false;
      if (filterMode === 'destacadas' && !r.destacadoPublicidad) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          r.numeroOrden.toLowerCase().includes(q) ||
          r.clienteNombre.toLowerCase().includes(q) ||
          r.comentario.toLowerCase().includes(q) ||
          (r.ciudadEntrega || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reviews, filterMode, searchQuery]);

  const getDefaultFindingForReview = (r: OrderSatisfactionReview): ReviewAlertFinding => {
    if (selectedAlertFinding[r.id]) return selectedAlertFinding[r.id];
    if (r.ratingTiempoEntrega <= r.ratingCalidadProducto && r.ratingTiempoEntrega <= r.ratingAtencion) {
      return 'tiempo_entrega';
    }
    if (r.ratingCalidadProducto <= r.ratingAtencion) {
      return 'producto';
    }
    return 'atencion';
  };

  const handleToggleHighlight = async (review: OrderSatisfactionReview) => {
    const next = await toggleHighlightReviewForMarketing(review.id, staffName);
    onReviewsUpdated(next);
    showNotice(
      !review.destacadoPublicidad
        ? `⭐ Orden ${review.numeroOrden} destacada para Publicidad / Catálogo.`
        : `Orden ${review.numeroOrden} retirada de Publicidad / Catálogo.`
    );
  };

  const handleAlertSacLogistics = async (review: OrderSatisfactionReview) => {
    const finding = getDefaultFindingForReview(review);
    const { reviews: next, radicado } = await alertReviewToSacOrLogistics(
      review.id,
      finding,
      staffName
    );
    onReviewsUpdated(next);
    const label =
      finding === 'tiempo_entrega'
        ? 'Tiempo de Entrega (Logística)'
        : finding === 'producto'
        ? 'Calidad de Producto (SAC)'
        : 'Atención al Cliente (SAC)';
    showNotice(
      `🚨 Alerta enviada por ${label}. Radicado generado: ${radicado || 'SAC-OK'}.`
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Banner Header del Módulo */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Mercadeo & Reputación de Marca
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                {kpis.total} {kpis.total === 1 ? 'Reseña Verificada' : 'Reseñas Verificadas'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Voz del cliente en pedidos entregados: monitoreo de calidad, puntualidad logística, testimonios y escalamiento a SAC.
            </p>
          </div>
        </div>

        {/* Switcher de Sub-vistas */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => onChangeSubTab('tablero')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'tablero'
                ? 'bg-white text-[#001D3D] shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-rose-600" />
            <span>1. Tablero de Satisfacción</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeSubTab('resenas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'resenas'
                ? 'bg-white text-[#001D3D] shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
            <span>2. Reseñas & Galería ({kpis.total})</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {actionToast && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionToast(null)}
            className="text-emerald-700 hover:text-emerald-950 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ============================================================
          SUBVISTA 1: TABLERO DE SATISFACCIÓN & REPUTACIÓN
      ============================================================ */}
      {subTab === 'tablero' && (
        <div className="space-y-4">
          {/* KPIs con los 3 promedios medibles + total reseñas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
            {/* KPI 1: Calidad de Producto */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-500">
                  Calidad de Producto
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {kpis.avgCalidad.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 5.0</span>
              </div>
              <div className="flex items-center justify-between">
                {renderStarsInline(kpis.avgCalidad)}
                <span className="text-[10px] font-bold text-emerald-700">Acabado & Norma</span>
              </div>
            </div>

            {/* KPI 2: Tiempo de Entrega Logística */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-500">
                  Tiempo de Entrega Logística
                </span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-teal-700" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {kpis.avgEntrega.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 5.0</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                {renderStarsInline(kpis.avgEntrega)}
                <span className="text-[10px] font-bold text-teal-800 truncate">
                  {kpis.punctuality.antes + kpis.punctuality.aTiempo} puntuales
                </span>
              </div>
            </div>

            {/* KPI 3: Atención al Cliente */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-slate-500">
                  Atención al Cliente
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <HeadphonesIcon className="w-4 h-4 text-blue-900" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {kpis.avgAtencion.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-400">/ 5.0</span>
              </div>
              <div className="flex items-center justify-between">
                {renderStarsInline(kpis.avgAtencion)}
                <span className="text-[10px] font-bold text-blue-900">Asesoría & Trato</span>
              </div>
            </div>

            {/* KPI 4: Total Reseñas Recibidas */}
            <div className="bg-gradient-to-br from-[#001D3D] to-[#0A4D68] text-white rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase text-sky-200">
                  Total Reseñas Recibidas
                </span>
                <Sparkles className="w-4 h-4 text-[#FFD100]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#FFD100] font-mono">
                  {kpis.total}
                </span>
                <span className="text-xs font-bold text-sky-200">
                  • Promedio {kpis.avgGlobal.toFixed(1)}★
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-sky-100">
                <span>{kpis.autorizadasCount} autorizadas publicidad</span>
                <span>{kpis.destacadasCount} destacadas</span>
              </div>
            </div>
          </div>

          {/* Distribución & Puntualidad */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                Distribución Global de Calificaciones
              </h3>
              <div className="space-y-2">
                {kpis.distribution.map((row) => (
                  <div key={row.stars} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-bold text-slate-700 flex items-center gap-1">
                      {row.stars} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    </span>
                    <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          row.stars >= 4
                            ? 'bg-emerald-500'
                            : row.stars === 3
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-mono text-[11px] font-bold text-slate-600">
                      {row.count} ({row.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Pulso de Puntualidad en Despachos CEDI
                </h3>
                {kpis.alertasPendientesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('alertas');
                      onChangeSubTab('resenas');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-black cursor-pointer hover:bg-rose-100"
                  >
                    {kpis.alertasPendientesCount} por revisar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-lg font-black text-emerald-800 font-mono block">
                    {kpis.punctuality.antes}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-900">
                    Antes de lo esperado
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                  <span className="text-lg font-black text-blue-900 font-mono block">
                    {kpis.punctuality.aTiempo}
                  </span>
                  <span className="text-[10px] font-bold text-blue-900">A tiempo</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-lg font-black text-amber-900 font-mono block">
                    {kpis.punctuality.retraso}
                  </span>
                  <span className="text-[10px] font-bold text-amber-900">Con retraso</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => onChangeSubTab('resenas')}
                  className="px-4 py-2 rounded-xl bg-[#001D3D] hover:bg-[#003366] text-white text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Ir a Reseñas & Galería de Clientes →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          SUBVISTA 2: RESEÑAS & GALERÍA DE CLIENTES
      ============================================================ */}
      {subTab === 'resenas' && (
        <div className="space-y-4">
          {/* Filtros y Buscador */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por orden (ORD-2026-...), cliente, ciudad o comentario..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'todas', label: 'Todas' },
                  { id: 'positivas', label: '4-5 ★ Positivas' },
                  { id: 'alertas', label: '1-3 ★ Hallazgos' },
                  { id: 'autorizadas', label: 'Autoriza Publicidad' },
                  { id: 'destacadas', label: 'Destacadas' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                    filterMode === tab.id
                      ? 'bg-[#001D3D] text-white border-[#001D3D]'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Reseñas */}
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 text-xs">
              No hay reseñas que coincidan con el filtro seleccionado.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredReviews.map((r) => {
                const hasLowScore =
                  r.ratingAtencion <= 3 ||
                  r.ratingTiempoEntrega <= 3 ||
                  r.ratingCalidadProducto <= 3;
                const isPositive =
                  r.ratingAtencion >= 4 &&
                  r.ratingTiempoEntrega >= 4 &&
                  r.ratingCalidadProducto >= 4;
                const activeFinding = getDefaultFindingForReview(r);

                return (
                  <div
                    key={r.id}
                    className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs space-y-3.5 ${
                      r.destacadoPublicidad
                        ? 'border-amber-300 ring-1 ring-amber-200/70'
                        : hasLowScore && !r.alertadoSacLogistica
                        ? 'border-rose-200'
                        : 'border-slate-200'
                    }`}
                  >
                    {/* Header tarjeta */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-[#001D3D] bg-slate-100 px-2 py-0.5 rounded-md">
                            {r.numeroOrden}
                          </span>
                          <strong className="text-xs sm:text-sm font-extrabold text-slate-900">
                            {r.clienteNombre}
                          </strong>
                          {r.ciudadEntrega && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {r.ciudadEntrega}
                            </span>
                          )}
                        </div>
                        {r.productosResumen && (
                          <p className="text-[11px] text-slate-500">{r.productosResumen}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {r.autorizaPublicidad ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Autoriza Publicidad
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Uso Interno
                          </span>
                        )}

                        {r.destacadoPublicidad && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Destacado Catálogo
                          </span>
                        )}

                        {r.alertadoSacLogistica && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Alertado ({r.alertadoTicketRadicado || 'SAC'})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Desglose de las 3 calificaciones + Comentario + Foto */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-8 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              Atención al Cliente
                            </span>
                            <div className="flex items-center justify-between mt-1">
                              {renderStarsInline(r.ratingAtencion)}
                              <span className="text-xs font-black text-slate-900 font-mono">
                                {r.ratingAtencion}/5
                              </span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              Tiempo de Entrega
                            </span>
                            <div className="flex items-center justify-between mt-1">
                              {renderStarsInline(r.ratingTiempoEntrega)}
                              <span className="text-xs font-black text-slate-900 font-mono">
                                {r.ratingTiempoEntrega}/5
                              </span>
                            </div>
                            {r.puntualidadEntrega && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 mt-1">
                                <Clock className="w-2.5 h-2.5" /> {r.puntualidadEntrega}
                              </span>
                            )}
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">
                              Calidad del Producto
                            </span>
                            <div className="flex items-center justify-between mt-1">
                              {renderStarsInline(r.ratingCalidadProducto)}
                              <span className="text-xs font-black text-slate-900 font-mono">
                                {r.ratingCalidadProducto}/5
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
                          <span className="font-bold text-slate-900">Observación del cliente: </span>
                          {r.comentario ? `"${r.comentario}"` : 'Sin comentario adicional registrado.'}
                        </div>
                      </div>

                      {/* Foto adjunta si existe */}
                      <div className="lg:col-span-4">
                        {r.fotoBase64 ? (
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(r.fotoBase64 || null)}
                            className="w-full h-36 rounded-xl overflow-hidden border border-slate-200 group relative cursor-pointer"
                            title="Ampliar fotografía del proyecto"
                          >
                            <img
                              src={r.fotoBase64}
                              alt={`Proyecto ${r.numeroOrden}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/70 text-white text-[10px] font-bold flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" /> Ver Foto
                            </span>
                          </button>
                        ) : (
                          <div className="w-full h-36 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-slate-400 text-[11px] gap-1">
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                            <span>Sin foto adjunta</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones Rápidas */}
                    <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="text-[11px] text-slate-400">
                        Registrada el {new Date(r.fechaCreacion).toLocaleDateString('es-CO')}
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Botón Destacar para casos positivos 4-5 estrellas */}
                        {isPositive && (
                          <button
                            type="button"
                            onClick={() => handleToggleHighlight(r)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              r.destacadoPublicidad
                                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-2xs'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              {r.destacadoPublicidad
                                ? '✓ Destacado para Publicidad / Catálogo'
                                : 'Destacar para Publicidad / Catálogo'}
                            </span>
                          </button>
                        )}

                        {/* Botón Alertar a SAC / Logística si alguna calificación es 1-3 estrellas */}
                        {hasLowScore && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {!r.alertadoSacLogistica && (
                              <select
                                value={activeFinding}
                                onChange={(e) =>
                                  setSelectedAlertFinding((prev) => ({
                                    ...prev,
                                    [r.id]: e.target.value as ReviewAlertFinding,
                                  }))
                                }
                                className="px-2 py-1.5 rounded-lg border border-rose-200 bg-rose-50/70 text-[11px] font-bold text-rose-900 focus:outline-none"
                                title="Motivo principal del hallazgo"
                              >
                                <option value="tiempo_entrega">Hallazgo: Tiempo de Entrega</option>
                                <option value="producto">Hallazgo: Calidad de Producto</option>
                                <option value="atencion">Hallazgo: Atención al Cliente</option>
                              </select>
                            )}

                            {!r.alertadoSacLogistica ? (
                              <button
                                type="button"
                                onClick={() => handleAlertSacLogistics(r)}
                                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Alertar a SAC / Logística</span>
                              </button>
                            ) : (
                              onNavigateToModule && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onNavigateToModule(
                                      r.alertadoMotivo === 'tiempo_entrega' ? 'logistica' : 'sac'
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 cursor-pointer"
                                >
                                  Ver seguimiento ({r.alertadoTicketRadicado || 'SAC'}) →
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lightbox para foto adjunta */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-[100001] bg-slate-950/85 flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-white text-slate-900 shadow-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewPhoto}
              alt="Fotografía cliente"
              className="max-h-[82vh] w-auto rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};
