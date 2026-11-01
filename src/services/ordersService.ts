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
  if (!isSupabaseConfigured) return false;

  try {
    const payload = {
      order_number: order.numeroOrden,
      user_email: order.customerEmail || (order.form?.responsable_contacto?.includes('@') ? order.form.responsable_contacto : null),
      customer_name: order.customerName || order.form?.nombre_razon_social,
      customer_phone: order.customerPhone,
      customer_document: order.customerDocument || order.form?.documento,
      shipping_address: order.direccionEntrega,
      city: order.ciudadEntrega,
      department: order.departamentoEntrega,
      delivery_mode: order.form?.modalidad_entrega || 'domicilio',
      items: order.items || [],
      total: order.total,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('orders').insert([payload]);
    if (error) {
      console.warn('Nota: No se pudo insertar en orders (posible esquema personalizado):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error guardando orden en Supabase:', err);
    return false;
  }
}
