import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { COLORLINKOrder, CartItem } from '../types';

export interface PendingOrderResult {
  id: string;
  order_number: string;
  numeroOrden: string;
  user_email: string;
  customer_name: string;
  customer_phone?: string;
  customer_document?: string;
  shipping_address: string;
  direccionEntrega?: string;
  city?: string;
  department?: string;
  status: string;
  estado?: string;
  total: number;
  created_at: string;
  items?: CartItem[];
  color_code?: string;
  color_name?: string;
}

/**
 * Validador estricto para excluir órdenes simuladas o mock predeterminadas
 */
export function isMockOrder(o: any): boolean {
  if (!o) return true;
  const id = String(o.id || '').toLowerCase();
  const num = String(o.numeroOrden || o.order_number || o.orderId || '').toLowerCase();
  const name = String(o.customerName || o.customer_name || o.form?.nombre_razon_social || '').toLowerCase();
  const doc = String(o.customerDocument || o.customer_document || o.form?.documento || '').replace(/[\.\-\s]/g, '');

  if (id === 'clk-mock-1' || id === 'clk-mock-2' || id === 'ord-init-1' || id === 'ord-init-2') return true;
  if (id.includes('mock') || num.includes('mock')) return true;
  if (num === '#clk-8492' || num === '#clk-94210' || num === 'clk-8492' || num === 'clk-94210') return true;
  if (id.includes('a93ec3fe') || num.includes('a93ec3fe') || num.includes('sb-a93ec3fe')) return true;
  if (name.includes('sara ramirez') && (doc.includes('1028727371') || doc === '')) return true;
  if (num.includes('sb-') && name.includes('sara')) return true;
  if (o.form?.nombre_razon_social === 'Constructora Bolívar S.A.' || o.form?.nombre_razon_social === 'Clínica Las Américas') return true;

  return false;
}

/**
 * Consulta de Pedidos reales en Supabase vinculados al usuario autenticado (ID / Email)
 * Garantiza que si el usuario no tiene pedidos retorne un arreglo vacío sin simular OC genéricas
 */
export async function fetchUserOrdersFromDatabase(
  userId?: string | null,
  userEmail?: string | null,
  userDoc?: string | null
): Promise<COLORLINKOrder[]> {
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const rawDoc = (userDoc || '').trim();
  const cleanDoc = rawDoc.replace(/[\.\-\s]/g, '').toLowerCase();
  const cleanId = (userId || '').trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

  if (!cleanId && !cleanEmail && !cleanDoc) {
    return [];
  }

  const resultOrders: COLORLINKOrder[] = [];

  const normalizeOrderKey = (o: Partial<COLORLINKOrder>): string =>
    String(o.numeroOrden || o.id || '').replace(/^#/, '').trim().toLowerCase();

  const isDeliveredStatus = (status?: string): boolean => {
    const s = String(status || '').toLowerCase();
    return s.includes('entregad') || s.includes('delivered') || s.includes('completad');
  };

  // 1. Consulta directa a Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      // 1.A Consulta en tabla 'orders' filtrando solo con tipos compatibles (UUID solo si cleanId es UUID válido)
      const orConditions: string[] = [];
      if (cleanId && isUuid) orConditions.push(`user_id.eq.${cleanId}`);
      if (cleanEmail) orConditions.push(`user_email.ilike.${cleanEmail}`);
      if (cleanDoc) orConditions.push(`customer_document.eq.${cleanDoc}`);
      if (rawDoc && rawDoc !== cleanDoc) orConditions.push(`customer_document.eq.${rawDoc}`);

      let dbOrders: any[] | null = null;
      let ordersErr: any = null;

      if (orConditions.length > 0) {
        let query = supabase.from('orders').select('*');
        if (orConditions.length === 1) {
          if (cleanId && isUuid) query = query.eq('user_id', cleanId);
          else if (cleanEmail) query = query.ilike('user_email', cleanEmail);
          else query = query.eq('customer_document', cleanDoc);
        } else {
          query = query.or(orConditions.join(','));
        }

        const orderedRes = await query.order('created_at', { ascending: false });
        if (!orderedRes.error) {
          dbOrders = orderedRes.data;
        } else {
          // Reintentar por user_email si alguna columna opcional falló
          if (cleanEmail) {
            const emailRes = await supabase
              .from('orders')
              .select('*')
              .ilike('user_email', cleanEmail);
            if (!emailRes.error) {
              dbOrders = emailRes.data;
            } else {
              ordersErr = emailRes.error;
            }
          } else {
            ordersErr = orderedRes.error;
          }
        }
      }

      if (!ordersErr && Array.isArray(dbOrders) && dbOrders.length > 0) {
        dbOrders.forEach((row: any) => {
          let statusText = row.status || 'Pendiente Alistamiento';
          const s = String(statusText).toLowerCase();
          if (s === 'pending' || s === 'pendiente') statusText = 'Pendiente Alistamiento';
          else if (s === 'processing' || s === 'en_proceso') statusText = 'En Bodega';
          else if (s === 'preparing' || s === 'en_preparacion') statusText = 'En Preparación';
          else if (s === 'paid' || s === 'pagado') statusText = 'Listo para Despacho';
          else if (s === 'shipped' || s === 'despachado') statusText = 'Despachado';
          else if (s === 'delivered' || s === 'entregado') statusText = 'Entregado';

          const mapped: COLORLINKOrder = {
            id: row.id || `ord-${Date.now()}`,
            numeroOrden: row.order_number || row.numeroOrden || row.numero_orden || `#CLK-${String(row.id || '').slice(0, 6).toUpperCase()}`,
            fechaCreacion: row.created_at || row.fecha_creacion || new Date().toISOString(),
            customerName: row.customer_name || 'Cliente Pintuco',
            customerEmail: row.user_email || cleanEmail,
            customerPhone: row.customer_phone || '',
            customerDocument: row.customer_document || rawDoc || cleanDoc,
            direccionEntrega: row.shipping_address || 'Dirección de obra',
            ciudadEntrega: row.city || row.ciudad || 'Colombia',
            departamentoEntrega: row.department || '',
            estado: statusText,
            total: Number(row.total) || 0,
            items: Array.isArray(row.items) ? row.items : [],
          };

          const mappedKey = normalizeOrderKey(mapped);
          if (!isMockOrder(mapped) && mappedKey && !resultOrders.some(r => normalizeOrderKey(r) === mappedKey)) {
            resultOrders.push(mapped);
          }
        });
      }
    } catch (err) {
      console.warn('Error en fetchUserOrdersFromDatabase (orders):', err);
    }

    // 1.B Complementar con proyectos asociados al cliente en tabla 'proyectos'
    if (cleanEmail || cleanDoc) {
      try {
        const orClientConds: string[] = [];
        if (cleanEmail) orClientConds.push(`email.ilike.${cleanEmail}`);
        if (cleanDoc) orClientConds.push(`numero_documento.eq.${cleanDoc}`);
        if (rawDoc && rawDoc !== cleanDoc) orClientConds.push(`numero_documento.eq.${rawDoc}`);

        const { data: clients } = await supabase
          .from('clientes')
          .select('id, nombre, numero_documento, ciudad')
          .or(orClientConds.join(','));

        if (clients && clients.length > 0) {
          const clientIds = clients.map((c: any) => c.id).filter(Boolean);
          if (clientIds.length > 0) {
            const { data: projs, error: projsErr } = await supabase
              .from('proyectos')
              .select('*')
              .in('cliente_id', clientIds)
              .order('created_at', { ascending: false });

            if (!projsErr && Array.isArray(projs) && projs.length > 0) {
              projs.forEach((p: any) => {
                const clientInfo = clients.find((c: any) => c.id === p.cliente_id) || {};
                const mapped: COLORLINKOrder = {
                  id: p.id,
                  numeroOrden: `SB-${String(p.id).slice(0, 8).toUpperCase()}`,
                  fechaCreacion: p.created_at || new Date().toISOString(),
                  customerName: clientInfo.nombre || 'Cliente Pintuco',
                  customerEmail: cleanEmail,
                  customerDocument: clientInfo.numero_documento || rawDoc || cleanDoc,
                  direccionEntrega: 'Dirección de obra',
                  ciudadEntrega: clientInfo.ciudad || 'Colombia',
                  estado: p.estado_pedido || 'Cotizado',
                  total: (Number(p.galones_pintura) || 1) * 79900,
                  items: [{
                    id: p.id,
                    sku: p.producto_id || 'PIN-PRJ-01',
                    nombre: p.producto_nombre || 'Pintura Pintuco Especial',
                    marca: 'Pintuco',
                    cantidad: Number(p.galones_pintura) || 1,
                    presentacion: 'Galón',
                    precioUnitario: 79900,
                    subtotal: (Number(p.galones_pintura) || 1) * 79900,
                  }],
                };

                const mappedKey = normalizeOrderKey(mapped);
                if (!isMockOrder(mapped) && mappedKey && !resultOrders.some(r => normalizeOrderKey(r) === mappedKey)) {
                  resultOrders.push(mapped);
                }
              });
            }
          }
        }
      } catch (err) {
        console.warn('Error en fetchUserOrdersFromDatabase (proyectos):', err);
      }
    }
  }

  // 2. Complementar y actualizar estados recientes desde localStorage REALES del usuario (NUNCA mocks)
  try {
    const rawKeys = [localStorage.getItem('colorlink_user_orders'), localStorage.getItem('colorlink_orders')];
    rawKeys.forEach((raw) => {
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      parsed.forEach((order: COLORLINKOrder) => {
        if (!order || isMockOrder(order)) return;

        const emailCandidates = [
          order.customerEmail,
          (order as any).user_email,
          (order as any).email,
          (order as any).customer_email,
          order.form?.correo_electronico,
          order.form?.responsable_contacto,
        ]
          .filter(Boolean)
          .map((e) => String(e).trim().toLowerCase());

        const orderDoc = String(order.customerDocument || (order as any).customer_document || order.form?.documento || '')
          .replace(/[\.\-\s]/g, '')
          .toLowerCase()
          .trim();
        const orderUserId = String((order as any).userId || (order as any).user_id || (order as any).customerId || (order as any).clienteId || '')
          .trim()
          .toLowerCase();

        const emailMatch = Boolean(cleanEmail && emailCandidates.some((e) => e === cleanEmail || e.includes(cleanEmail)));
        const docMatch = Boolean(cleanDoc && orderDoc && orderDoc === cleanDoc);
        const idMatch = Boolean(cleanId && orderUserId && orderUserId === cleanId.toLowerCase());

        if (emailMatch || docMatch || idMatch) {
          const orderKey = normalizeOrderKey(order);
          if (!orderKey) return;
          const existingIdx = resultOrders.findIndex((r) => normalizeOrderKey(r) === orderKey);
          if (existingIdx === -1) {
            resultOrders.push(order);
          } else {
            // Si la versión local tiene estado más avanzado (ej. Entregado por Logística), preservarla
            const existing = resultOrders[existingIdx];
            if (isDeliveredStatus(order.estado) || (!isDeliveredStatus(existing.estado) && order.estado && order.estado !== existing.estado)) {
              resultOrders[existingIdx] = { ...existing, ...order };
            }
          }
        }
      });
    });
  } catch (e) {
    console.error('Error sincronizando órdenes locales:', e);
  }

  // Filtrar estrictamente cualquier mock order residual
  return resultOrders.filter(o => !isMockOrder(o));
}

/**
 * Consulta de Pedidos Pendientes en Supabase para el usuario activo
 * Filtra por user_email y estados ['pending', 'processing', 'preparing']
 */
export async function fetchPendingOrdersFromSupabase(
  userEmail: string
): Promise<{ data: COLORLINKOrder[]; error: string | null }> {
  if (!userEmail) {
    return { data: [], error: 'Email de usuario requerido' };
  }

  const cleanEmail = userEmail.trim().toLowerCase();
  let fetchedOrders: COLORLINKOrder[] = [];

  try {
    if (isSupabaseConfigured) {
      // 1. Consulta estándar en tabla 'orders' filtrada por email y estados pendientes solicitados
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_email', cleanEmail)
        .in('status', ['pending', 'processing', 'preparing', 'pendiente', 'en_proceso', 'en_preparacion'])
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        fetchedOrders = data.map((row: any) => {
          let statusText = 'Pendiente Alistamiento';
          const s = String(row.status || '').toLowerCase();
          if (s === 'processing' || s === 'en_proceso') {
            statusText = 'En Procesamiento';
          } else if (s === 'preparing' || s === 'en_preparacion') {
            statusText = 'En Preparación';
          } else if (s === 'delivered' || s === 'entregado') {
            statusText = 'Entregado';
          }

          return {
            id: row.id || `ord-${Date.now()}`,
            numeroOrden: row.order_number || row.numeroOrden || row.numero_orden || `#CLK-${row.id?.slice(0, 6)}`,
            fechaCreacion: row.created_at || row.fecha_creacion || new Date().toISOString(),
            customerName: row.customer_name || row.customerName || 'Cliente Pintuco',
            customerEmail: row.user_email || row.customerEmail || cleanEmail,
            customerPhone: row.customer_phone || row.customerPhone || '',
            customerDocument: row.customer_document || row.customerDocument || '',
            direccionEntrega: row.shipping_address || row.direccionEntrega || row.direccion_entrega || 'Dirección registrada',
            ciudadEntrega: row.city || row.ciudadEntrega || row.ciudad || 'Colombia',
            departamentoEntrega: row.department || row.departamentoEntrega || '',
            estado: statusText,
            total: Number(row.total) || 0,
            items: Array.isArray(row.items) ? row.items : [],
            color_code: row.color_code || '',
            color_name: row.color_name || '',
          };
        });
      }
    }
  } catch (err: any) {
    console.warn('Error consultando tabla orders en Supabase:', err.message);
  }

  // 2. Complementar con pedidos guardados en localStorage para ese usuario si no hubiere red o mientras sincroniza
  try {
    const local = localStorage.getItem('colorlink_orders');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        parsed.forEach((order: COLORLINKOrder) => {
          const orderEmail = (order.customerEmail || order.form?.responsable_contacto || '').toLowerCase();
          const orderStatus = (order.estado || '').toLowerCase();
          const isPending = 
            orderStatus.includes('pendiente') || 
            orderStatus.includes('alistamiento') || 
            orderStatus.includes('bodega') || 
            orderStatus.includes('proces') ||
            orderStatus.includes('prepar') ||
            orderStatus.includes('pending') ||
            orderStatus.includes('processing') ||
            orderStatus.includes('preparing');

          // Filtrar estrictamente por el email del usuario activo
          if (isPending && orderEmail && (orderEmail === cleanEmail || orderEmail.includes(cleanEmail))) {
            if (!fetchedOrders.some((f) => f.numeroOrden === order.numeroOrden || f.id === order.id)) {
              fetchedOrders.push(order);
            }
          }
        });
      }
    }
  } catch (e) {
    console.error('Error leyendo orders locales:', e);
  }

  return { data: fetchedOrders, error: null };
}

/**
 * Persiste la dirección de envío en estado global, localStorage y en Supabase (perfil de usuario / clientes)
 */
export async function persistShippingAddress(
  address: string,
  city: string,
  userEmail?: string,
  userDoc?: string
): Promise<void> {
  const cleanAddr = address.trim();
  if (!cleanAddr) return;

  // 1. Guardar en múltiples llaves de localStorage para máxima compatibilidad con componentes
  try {
    localStorage.setItem('colorlink_shipping_address', cleanAddr);
    localStorage.setItem('shippingAddress', cleanAddr);
    localStorage.setItem('colorlink_user_address', cleanAddr);
    if (city) localStorage.setItem('colorlink_shipping_city', city);

    // Actualizar perfil local de usuario (colorlink_user_session)
    const savedUser = localStorage.getItem('colorlink_user_session');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      parsed.direccion = cleanAddr;
      parsed.address = cleanAddr;
      if (city) parsed.ciudad = city;
      localStorage.setItem('colorlink_user_session', JSON.stringify(parsed));
    }

    // Notificar a todos los listeners de la ventana
    window.dispatchEvent(new CustomEvent('colorlink_shipping_address_updated', { 
      detail: { address: cleanAddr, city } 
    }));
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.warn('Error guardando dirección local:', err);
  }

  // 2. Actualizar en Supabase si está disponible
  if (isSupabaseConfigured) {
    try {
      if (userDoc && userDoc.trim()) {
        await supabase
          .from('clientes')
          .update({ direccion: cleanAddr, ciudad: city || undefined })
          .eq('numero_documento', userDoc.trim());
      }

      if (userEmail && userEmail.trim()) {
        const cleanMail = userEmail.trim().toLowerCase();
        await supabase
          .from('clientes')
          .update({ direccion: cleanAddr, ciudad: city || undefined })
          .ilike('email', cleanMail);
      }
    } catch (err) {
      console.warn('No se pudo actualizar dirección en Supabase:', err);
    }
  }
}

/**
 * Inserta un nuevo pedido en la tabla 'orders' de Supabase
 */
export async function saveOrderToSupabase(order: COLORLINKOrder): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    let authUserId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) authUserId = user.id;
    } catch {}

    const formModalidad = (order.form as any)?.modalidad_entrega;
    const isPickup = formModalidad === 'retiro_tienda' ||
      formModalidad === 'pickup' ||
      Boolean(order.direccionEntrega && order.direccionEntrega.startsWith('Retiro en Tienda'));

    const deliveryModeStr = isPickup ? 'pickup' : 'delivery';

    const payload: any = {
      order_number: order.numeroOrden,
      user_id: authUserId,
      user_email: order.customerEmail || (order.form?.responsable_contacto?.includes('@') ? order.form.responsable_contacto : null),
      customer_name: order.customerName || order.form?.nombre_razon_social,
      customer_phone: order.customerPhone,
      customer_document: order.customerDocument || order.form?.documento,
      shipping_address: order.direccionEntrega,
      city: order.ciudadEntrega,
      department: order.departamentoEntrega,
      delivery_mode: deliveryModeStr,
      items: order.items || [],
      total: order.total,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    let { error } = await supabase.from('orders').insert([payload]);
    if (error && error.message?.includes('column')) {
      // Reintentar sin columnas opcionales en caso de esquema previo en Supabase
      const fallbackPayload: any = {
        order_number: order.numeroOrden,
        user_email: payload.user_email,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        customer_document: payload.customer_document,
        shipping_address: payload.shipping_address,
        city: payload.city,
        department: payload.department,
        items: payload.items,
        total: payload.total,
        status: 'pending',
        created_at: payload.created_at,
      };
      const retry = await supabase.from('orders').insert([fallbackPayload]);
      error = retry.error;
    }

    if (error) {
      console.warn('Nota: No se pudo insertar en orders:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error guardando orden en Supabase:', err);
    return false;
  }
}
