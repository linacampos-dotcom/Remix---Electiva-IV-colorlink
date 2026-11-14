import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { crearNotificacion, radicarConsultaWeb, registrarAuditoria } from './corporateService';

export type DeliveryPunctualityOption = 'Antes de lo esperado' | 'A tiempo' | 'Con retraso';
export type ReviewAlertFinding = 'tiempo_entrega' | 'producto' | 'atencion';

export interface OrderSatisfactionReview {
  id: string;
  orderId: string;
  numeroOrden: string;
  clienteNombre: string;
  clienteEmail: string;
  ciudadEntrega?: string;
  productosResumen?: string;
  ratingAtencion: number; // 1..5
  ratingTiempoEntrega: number; // 1..5
  puntualidadEntrega?: DeliveryPunctualityOption;
  ratingCalidadProducto: number; // 1..5
  comentario: string;
  fotoBase64?: string;
  autorizaPublicidad: boolean;
  destacadoPublicidad?: boolean;
  alertadoSacLogistica?: boolean;
  alertadoMotivo?: ReviewAlertFinding;
  alertadoFecha?: string;
  alertadoTicketRadicado?: string;
  fechaCreacion: string;
}

const STORAGE_REVIEWS_KEY = 'colorlink_satisfaction_reviews';

const INITIAL_REVIEWS: OrderSatisfactionReview[] = [
  {
    id: 'rev-init-1',
    orderId: 'ord-rep-8410',
    numeroOrden: 'ORD-2026-8410',
    clienteNombre: 'Constructora Altos del Parque S.A.S.',
    clienteEmail: 'compras@altosdelparque.co',
    ciudadEntrega: 'Medellín',
    productosResumen: 'Viniltex Avanzado Blanco Puro (Cuñete 5 GL) • Estuco Acrílico',
    ratingAtencion: 5,
    ratingTiempoEntrega: 5,
    puntualidadEntrega: 'Antes de lo esperado',
    ratingCalidadProducto: 5,
    comentario:
      'Excelente cubrimiento en primera mano en zonas comunes y la entrega en obra llegó media hora antes de la ventana programada.',
    autorizaPublicidad: true,
    destacadoPublicidad: true,
    fechaCreacion: '2026-11-10T15:20:00.000Z',
  },
  {
    id: 'rev-init-2',
    orderId: 'ord-rep-8592',
    numeroOrden: 'ORD-2026-8592',
    clienteNombre: 'Estudio Arquitectónico Boreal',
    clienteEmail: 'proyectos@estudioboreal.com',
    ciudadEntrega: 'Bogotá D.C.',
    productosResumen: 'Koraza Protección 5 Años Gris Basalto • Sellador Antialcalino',
    ratingAtencion: 5,
    ratingTiempoEntrega: 4,
    puntualidadEntrega: 'A tiempo',
    ratingCalidadProducto: 5,
    comentario:
      'El asesor técnico nos ayudó a calcular exactamente los galones para la fachada exterior y el acabado mate quedó impecable.',
    autorizaPublicidad: true,
    destacadoPublicidad: false,
    fechaCreacion: '2026-11-11T18:05:00.000Z',
  },
  {
    id: 'rev-init-3',
    orderId: 'ord-rep-8645',
    numeroOrden: 'ORD-2026-8645',
    clienteNombre: 'Inmobiliaria Costa Verde Ltda.',
    clienteEmail: 'mantenimiento@costaverde.co',
    ciudadEntrega: 'Barranquilla',
    productosResumen: 'Pintulux 3 en 1 Negro Mate • Anticorrosivo Industrial',
    ratingAtencion: 4,
    ratingTiempoEntrega: 2,
    puntualidadEntrega: 'Con retraso',
    ratingCalidadProducto: 5,
    comentario:
      'La pintura metálica cumplió perfecto en rejas exteriores, pero el transportador llegó un día después de la fecha estimada.',
    autorizaPublicidad: false,
    destacadoPublicidad: false,
    alertadoSacLogistica: false,
    fechaCreacion: '2026-11-12T11:40:00.000Z',
  },
];

function emitReviewsUpdated(list: OrderSatisfactionReview[]) {
  try {
    window.dispatchEvent(new CustomEvent('colorlink_reviews_updated', { detail: list }));
  } catch {}
}

export function getSatisfactionReviews(): OrderSatisfactionReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_REVIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading satisfaction reviews:', e);
  }
  try {
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(INITIAL_REVIEWS));
  } catch {}
  return [...INITIAL_REVIEWS];
}

export function saveSatisfactionReviews(reviews: OrderSatisfactionReview[]): void {
  try {
    localStorage.setItem(STORAGE_REVIEWS_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.error('Error saving satisfaction reviews:', e);
  }
  emitReviewsUpdated(reviews);
}

export function findReviewForOrder(
  orderNumberOrId: string,
  reviewsList?: OrderSatisfactionReview[]
): OrderSatisfactionReview | undefined {
  const key = (orderNumberOrId || '').trim().toLowerCase();
  if (!key) return undefined;
  const list = reviewsList || getSatisfactionReviews();
  return list.find(
    (r) =>
      r.numeroOrden.trim().toLowerCase() === key ||
      r.orderId.trim().toLowerCase() === key
  );
}

function mapSupabaseRowToReview(row: any): OrderSatisfactionReview {
  return {
    id: String(row.id || `rev-${Date.now()}`),
    orderId: String(row.order_id || row.orderId || row.numero_orden || ''),
    numeroOrden: String(row.numero_orden || row.numeroOrden || row.order_number || ''),
    clienteNombre: String(row.cliente_nombre || row.clienteNombre || 'Cliente ColorLink'),
    clienteEmail: String(row.cliente_email || row.clienteEmail || ''),
    ciudadEntrega: row.ciudad_entrega || row.ciudadEntrega || '',
    productosResumen: row.productos_resumen || row.productosResumen || '',
    ratingAtencion: Number(row.rating_atencion ?? row.ratingAtencion) || 5,
    ratingTiempoEntrega: Number(row.rating_tiempo_entrega ?? row.ratingTiempoEntrega) || 5,
    puntualidadEntrega: row.puntualidad_entrega || row.puntualidadEntrega || 'A tiempo',
    ratingCalidadProducto: Number(row.rating_calidad_producto ?? row.ratingCalidadProducto) || 5,
    comentario: String(row.comentario || ''),
    fotoBase64: row.foto_base64 || row.fotoBase64 || undefined,
    autorizaPublicidad: Boolean(row.autoriza_publicidad ?? row.autorizaPublicidad),
    destacadoPublicidad: Boolean(row.destacado_publicidad ?? row.destacadoPublicidad),
    alertadoSacLogistica: Boolean(row.alertado_sac_logistica ?? row.alertadoSacLogistica),
    alertadoMotivo: row.alertado_motivo || row.alertadoMotivo || undefined,
    alertadoFecha: row.alertado_fecha || row.alertadoFecha || undefined,
    alertadoTicketRadicado: row.alertado_ticket_radicado || row.alertadoTicketRadicado || undefined,
    fechaCreacion: row.fecha_creacion || row.created_at || row.fechaCreacion || new Date().toISOString(),
  };
}

export async function fetchSatisfactionReviewsFromSupabase(): Promise<OrderSatisfactionReview[]> {
  const local = getSatisfactionReviews();
  if (!isSupabaseConfigured || !supabase) return local;

  const mergedMap = new Map<string, OrderSatisfactionReview>();
  local.forEach((r) => mergedMap.set(r.numeroOrden.trim().toLowerCase() || r.id, r));

  // 1. Intentar leer tabla satisfaction_reviews en Supabase si existe
  try {
    const { data, error } = await supabase
      .from('satisfaction_reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      data.forEach((row: any) => {
        const mapped = mapSupabaseRowToReview(row);
        const k = mapped.numeroOrden.trim().toLowerCase() || mapped.id;
        if (k) mergedMap.set(k, mapped);
      });
    }
  } catch {}

  // 2. Complementar con metadata de Auth si el usuario tiene reseñas sincronizadas
  try {
    const { data: userData } = await supabase.auth.getUser();
    const metaReviews = userData?.user?.user_metadata?.satisfaction_reviews;
    if (Array.isArray(metaReviews)) {
      metaReviews.forEach((row: any) => {
        const mapped = mapSupabaseRowToReview(row);
        const k = mapped.numeroOrden.trim().toLowerCase() || mapped.id;
        if (k && !mergedMap.has(k)) {
          mergedMap.set(k, mapped);
        }
      });
    }
  } catch {}

  const merged = Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
  );
  saveSatisfactionReviews(merged);
  return merged;
}

export async function submitSatisfactionReview(
  payload: Omit<OrderSatisfactionReview, 'id' | 'fechaCreacion'>
): Promise<OrderSatisfactionReview> {
  const current = getSatisfactionReviews();
  const normOrder = (payload.numeroOrden || payload.orderId).trim().toLowerCase();

  const newReview: OrderSatisfactionReview = {
    ...payload,
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fechaCreacion: new Date().toISOString(),
    destacadoPublicidad: false,
    alertadoSacLogistica: false,
  };

  const withoutDuplicate = current.filter(
    (r) =>
      r.numeroOrden.trim().toLowerCase() !== normOrder &&
      r.orderId.trim().toLowerCase() !== normOrder
  );
  const next = [newReview, ...withoutDuplicate];
  saveSatisfactionReviews(next);

  // Registro en auditoría interna
  try {
    registrarAuditoria(
      'SAC',
      'Encuesta de Satisfacción Recibida',
      `Orden ${newReview.numeroOrden} (${newReview.clienteNombre}): Atención ${newReview.ratingAtencion}/5, Entrega ${newReview.ratingTiempoEntrega}/5, Calidad ${newReview.ratingCalidadProducto}/5.`,
      newReview.clienteNombre
    );
  } catch {}

  // Persistencia en Supabase (tabla satisfaction_reviews + respaldo en user_metadata)
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('satisfaction_reviews').upsert({
        id: newReview.id,
        order_id: newReview.orderId,
        numero_orden: newReview.numeroOrden,
        cliente_nombre: newReview.clienteNombre,
        cliente_email: newReview.clienteEmail,
        ciudad_entrega: newReview.ciudadEntrega || null,
        productos_resumen: newReview.productosResumen || null,
        rating_atencion: newReview.ratingAtencion,
        rating_tiempo_entrega: newReview.ratingTiempoEntrega,
        puntualidad_entrega: newReview.puntualidadEntrega || null,
        rating_calidad_producto: newReview.ratingCalidadProducto,
        comentario: newReview.comentario,
        foto_base64: newReview.fotoBase64 || null,
        autoriza_publicidad: newReview.autorizaPublicidad,
        destacado_publicidad: false,
        alertado_sac_logistica: false,
        fecha_creacion: newReview.fechaCreacion,
      });
    } catch {}

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const prevMeta = Array.isArray(sessionData.session.user.user_metadata?.satisfaction_reviews)
          ? sessionData.session.user.user_metadata.satisfaction_reviews
          : [];
        const updatedMeta = [
          newReview,
          ...prevMeta.filter(
            (r: any) =>
              String(r.numeroOrden || '').trim().toLowerCase() !== normOrder
          ),
        ].slice(0, 25);
        await supabase.auth.updateUser({
          data: { satisfaction_reviews: updatedMeta },
        });
      }
    } catch {}
  }

  return newReview;
}

export async function toggleHighlightReviewForMarketing(
  reviewId: string,
  staffName = 'Equipo Mercadeo'
): Promise<OrderSatisfactionReview[]> {
  const current = getSatisfactionReviews();
  let targetReview: OrderSatisfactionReview | undefined;
  const next = current.map((r) => {
    if (r.id === reviewId) {
      targetReview = { ...r, destacadoPublicidad: !r.destacadoPublicidad };
      return targetReview;
    }
    return r;
  });
  saveSatisfactionReviews(next);

  if (targetReview) {
    try {
      registrarAuditoria(
        'Comunidad',
        targetReview.destacadoPublicidad
          ? 'Reseña Destacada para Publicidad / Catálogo'
          : 'Reseña Retirada de Destacados',
        `Orden ${targetReview.numeroOrden} (${targetReview.clienteNombre}) por ${staffName}.`,
        staffName
      );
    } catch {}

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('satisfaction_reviews')
          .update({ destacado_publicidad: targetReview.destacadoPublicidad })
          .eq('id', reviewId);
      } catch {}
    }
  }

  return next;
}

export async function alertReviewToSacOrLogistics(
  reviewId: string,
  motivo: ReviewAlertFinding,
  staffName = 'Equipo Mercadeo'
): Promise<{ reviews: OrderSatisfactionReview[]; radicado?: string }> {
  const current = getSatisfactionReviews();
  const target = current.find((r) => r.id === reviewId);
  if (!target) return { reviews: current };

  const motivoLabel =
    motivo === 'tiempo_entrega'
      ? 'Tiempo de Entrega / Puntualidad Logística'
      : motivo === 'producto'
      ? 'Calidad y Acabado del Producto'
      : 'Atención al Cliente y Asesoría';

  const ticket = radicarConsultaWeb({
    clienteNombre: target.clienteNombre,
    clienteEmail: target.clienteEmail || 'cliente@colorlink.pintuco.com',
    canal: 'Formulario PQR',
    categoria:
      motivo === 'tiempo_entrega'
        ? 'Seguimiento Despacho'
        : motivo === 'producto'
        ? 'Garantía / Reclamación'
        : 'Asesoría Técnica Pinturas',
    asunto: `[Alerta Mercadeo] Seguimiento Orden ${target.numeroOrden} — ${motivoLabel}`,
    mensaje: `Alerta generada desde Mercadeo & Reputación por calificación baja en ${motivoLabel}.\n\nDesglose encuesta:\n• Atención al Cliente: ${target.ratingAtencion}/5\n• Tiempo de Entrega: ${target.ratingTiempoEntrega}/5 (${target.puntualidadEntrega || 'Sin dato'})\n• Calidad del Producto: ${target.ratingCalidadProducto}/5\n\nComentario del cliente:\n"${target.comentario || 'Sin comentarios adicionales'}"`,
  });

  // Notificar internamente a Logística o SAC según hallazgo
  crearNotificacion({
    destinatarioEmail: motivo === 'tiempo_entrega' ? 'alvaro.patino@pintuco.com' : 'laura.velez@pintuco.com',
    tipo: motivo === 'tiempo_entrega' ? 'inventario' : 'sac',
    titulo: `Alerta de Reputación (${motivoLabel}) — ${target.numeroOrden}`,
    mensaje: `${staffName} escaló la reseña de ${target.clienteNombre}. Radicado SAC: ${ticket.radicado}.`,
    linkModulo: motivo === 'tiempo_entrega' ? 'logistica' : 'sac',
    linkId: ticket.id,
  });

  const now = new Date().toISOString();
  const next = current.map((r) =>
    r.id === reviewId
      ? {
          ...r,
          alertadoSacLogistica: true,
          alertadoMotivo: motivo,
          alertadoFecha: now,
          alertadoTicketRadicado: ticket.radicado,
        }
      : r
  );
  saveSatisfactionReviews(next);

  try {
    registrarAuditoria(
      'SAC',
      'Alerta Escalamiento Mercadeo -> SAC/Logística',
      `Reseña ${target.numeroOrden} escalada por ${motivoLabel}. Radicado generado: ${ticket.radicado}.`,
      staffName
    );
  } catch {}

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('satisfaction_reviews')
        .update({
          alertado_sac_logistica: true,
          alertado_motivo: motivo,
          alertado_fecha: now,
          alertado_ticket_radicado: ticket.radicado,
        })
        .eq('id', reviewId);
    } catch {}
  }

  return { reviews: next, radicado: ticket.radicado };
}
