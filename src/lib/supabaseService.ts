import { supabase, isSupabaseConfigured, reconfigureSupabaseClient, SupabaseCliente, SupabaseProducto, SupabaseProyecto } from './supabaseClient';
import { FMVFormData, CalculationResult, COLORLINKOrder, CatalogProduct } from '../types';
import { PINTUCO_CATALOG } from '../data/pintucoData';

export interface SupabaseProjectWithRelations {
  id: string;
  cliente_id: string;
  producto_id?: string | null;
  producto_nombre?: string | null;
  area_m2: number;
  condicion_pared: string;
  galones_pintura: number;
  galones_sellador: number;
  estado_pedido: string;
  created_at?: string;
  fecha_creacion?: string;
  clientes?: SupabaseCliente | null;
  productos?: SupabaseProducto | null;
}

/**
 * Checks server-side environment for Supabase credentials and reconfigures client if available
 */
export async function checkAndInitServerSupabase(): Promise<boolean> {
  if (isSupabaseConfigured) return true;

  try {
    const res = await fetch('/api/supabase-env');
    if (res.ok) {
      const json = await res.json();
      if (json.configured && json.url && json.anonKey) {
        return reconfigureSupabaseClient(json.url, json.anonKey);
      }
    }
  } catch (err) {
    console.debug('No server supabase-env available:', err);
  }
  return false;
}

/**
 * Fetch products from Supabase 'productos' table.
 * Falls back to local PINTUCO_CATALOG if Supabase is offline or empty.
 */
export async function fetchSupabaseProducts(): Promise<{
  data: SupabaseProducto[];
  fromSupabase: boolean;
  error?: string;
}> {
  await checkAndInitServerSupabase();

  if (!isSupabaseConfigured) {
    // Map local catalog to SupabaseProducto shape
    const localMapped: SupabaseProducto[] = PINTUCO_CATALOG.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      ambiente: p.presetAmbiente || p.ambienteIdeal[0] || 'Interior / Exterior',
      rendimiento_m2: p.rendimientoBaseM2 || 30,
      sku: p.skuBase,
    }));
    return { data: localMapped, fromSupabase: false };
  }

  try {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, ambiente, rendimiento_m2, sku')
      .order('nombre', { ascending: true });

    if (error) {
      console.warn('Error fetching productos from Supabase:', error.message);
      return {
        data: PINTUCO_CATALOG.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          ambiente: p.presetAmbiente || p.ambienteIdeal[0] || 'Interior / Exterior',
          rendimiento_m2: p.rendimientoBaseM2 || 30,
          sku: p.skuBase,
        })),
        fromSupabase: false,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        data: PINTUCO_CATALOG.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          ambiente: p.presetAmbiente || p.ambienteIdeal[0] || 'Interior / Exterior',
          rendimiento_m2: p.rendimientoBaseM2 || 30,
          sku: p.skuBase,
        })),
        fromSupabase: false,
      };
    }

    return { data: data as SupabaseProducto[], fromSupabase: true };
  } catch (err: any) {
    console.error('Supabase products query failed:', err);
    return {
      data: PINTUCO_CATALOG.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        ambiente: p.presetAmbiente || p.ambienteIdeal[0] || 'Interior / Exterior',
        rendimiento_m2: p.rendimientoBaseM2 || 30,
        sku: p.skuBase,
      })),
      fromSupabase: false,
      error: err.message,
    };
  }
}

/**
 * 1. INSERCIÓN DE DATOS (INSERT):
 *    - Al hacer clic en "Radicar Proyecto", inserta primero un registro en la tabla 'clientes'
 *      con los campos: tipo_documento, numero_documento, nombre, ciudad.
 *    - Luego, inserta la cotización en la tabla 'proyectos' vinculando el cliente_id generado,
 *      junto con producto_nombre, area_m2, condicion_pared, galones_pintura, galones_sellador y estado_pedido ('Cotizado').
 */
export async function insertSupabaseOrder(
  formData: FMVFormData,
  calculation: CalculationResult,
  orderNumber: string
): Promise<{
  success: boolean;
  proyectoId?: string;
  clienteId?: string;
  fromSupabase: boolean;
  error?: string;
}> {
  await checkAndInitServerSupabase();

  if (!isSupabaseConfigured) {
    return {
      success: true,
      fromSupabase: false,
    };
  }

  try {
    const cleanDoc = formData.documento.trim();
    const cleanTipoDoc = formData.tipo_documento.trim();
    const cleanNombre = formData.nombre_razon_social.trim();
    const cleanCiudad = formData.ciudad.trim();

    // =========================================================================
    // PASO 1: INSERT EN TABLA 'clientes'
    // Campos: tipo_documento, numero_documento, nombre, ciudad
    // =========================================================================
    let clienteId: string = '';

    const clientePayload = {
      tipo_documento: cleanTipoDoc,
      numero_documento: cleanDoc,
      nombre: cleanNombre,
      ciudad: cleanCiudad,
    };

    const { data: newClient, error: clientInsertErr } = await supabase
      .from('clientes')
      .insert(clientePayload)
      .select('id')
      .single();

    if (!clientInsertErr && newClient?.id) {
      clienteId = newClient.id;
    } else {
      // Si ya existe (p. ej. restricción unique por documento), recuperar su id y actualizar datos
      const { data: existingClients, error: searchErr } = await supabase
        .from('clientes')
        .select('id')
        .eq('numero_documento', cleanDoc)
        .limit(1);

      if (!searchErr && existingClients && existingClients.length > 0) {
        clienteId = existingClients[0].id;
        await supabase
          .from('clientes')
          .update({
            tipo_documento: cleanTipoDoc,
            nombre: cleanNombre,
            ciudad: cleanCiudad,
          })
          .eq('id', clienteId);
      } else {
        throw new Error(clientInsertErr?.message || 'No se pudo registrar el cliente en Supabase');
      }
    }

    if (!clienteId) {
      throw new Error('No se pudo generar o vincular el cliente_id en Supabase');
    }

    // =========================================================================
    // PASO 2: INSERT EN TABLA 'proyectos'
    // Campos: cliente_id, producto_nombre, area_m2, condicion_pared,
    // galones_pintura, galones_sellador, estado_pedido ('Cotizado')
    // =========================================================================
    const productoNombre = calculation.productoSugerido || formData.producto_deseado || 'Viniltex Avanzado Pintuco';
    const areaM2 = Number(formData.area_m2) || 1;
    const condicionPared = formData.condicion || 'Buen Estado / Repinte';
    const galonesPintura = Number(calculation.galonesPintura) || 0;
    const galonesSellador = Number(calculation.galonesSellador) || 0;
    const estadoPedido = 'Cotizado';

    // Para compatibilidad hacia atrás si la tabla en Supabase tiene producto_id FK:
    let productoId: string | null = null;
    try {
      const { data: matchedProd } = await supabase
        .from('productos')
        .select('id')
        .ilike('nombre', `%${productoNombre.split(' ')[0]}%`)
        .limit(1);

      if (matchedProd && matchedProd.length > 0) {
        productoId = matchedProd[0].id;
      } else {
        const { data: anyProd } = await supabase.from('productos').select('id').limit(1);
        if (anyProd && anyProd.length > 0) {
          productoId = anyProd[0].id;
        }
      }
    } catch (_) {
      // Ignorar si no existe tabla productos
    }

    const proyectoPayload: Record<string, any> = {
      cliente_id: clienteId,
      producto_nombre: productoNombre,
      area_m2: areaM2,
      condicion_pared: condicionPared,
      galones_pintura: galonesPintura,
      galones_sellador: galonesSellador,
      estado_pedido: estadoPedido,
    };

    if (productoId) {
      proyectoPayload.producto_id = productoId;
    }

    // Ejecutar INSERT directo en la tabla 'proyectos' sin incluir fecha_creacion
    let newProyecto: any = null;
    let proyectoErr: any = null;

    const initialInsert = await supabase
      .from('proyectos')
      .insert(proyectoPayload)
      .select('id, cliente_id, area_m2, condicion_pared, galones_pintura, galones_sellador, estado_pedido')
      .single();

    newProyecto = initialInsert.data;
    proyectoErr = initialInsert.error;

    // Manejar esquemas donde la columna producto_id no exista
    if (proyectoErr && (proyectoErr.message?.includes('producto_id') || proyectoErr.code === '42703')) {
      delete proyectoPayload.producto_id;
      const retry1 = await supabase
        .from('proyectos')
        .insert(proyectoPayload)
        .select('id, cliente_id, area_m2, condicion_pared, galones_pintura, galones_sellador, estado_pedido')
        .single();
      newProyecto = retry1.data;
      proyectoErr = retry1.error;
    }

    // Manejar esquemas donde producto_nombre no exista en Supabase
    if (proyectoErr && (proyectoErr.message?.includes('producto_nombre') || proyectoErr.code === '42703')) {
      delete proyectoPayload.producto_nombre;
      if (!proyectoPayload.producto_id && productoId) {
        proyectoPayload.producto_id = productoId;
      }
      const retry2 = await supabase
        .from('proyectos')
        .insert(proyectoPayload)
        .select('id, cliente_id, area_m2, condicion_pared, galones_pintura, galones_sellador, estado_pedido')
        .single();
      newProyecto = retry2.data;
      proyectoErr = retry2.error;
    }

    // Manejar esquemas antiguos donde estado_pedido no admitía 'Cotizado'
    if (proyectoErr && proyectoErr.message?.includes('estado_pedido')) {
      proyectoPayload.estado_pedido = 'Radicado';
      const retry3 = await supabase
        .from('proyectos')
        .insert(proyectoPayload)
        .select('id, cliente_id, area_m2, condicion_pared, galones_pintura, galones_sellador, estado_pedido')
        .single();
      newProyecto = retry3.data;
      proyectoErr = retry3.error;
    }

    // Si aún falla por alguna columna no existente en el .select(), intentar seleccionando solo el 'id'
    if (proyectoErr && proyectoErr.code === '42703') {
      const retrySelectId = await supabase
        .from('proyectos')
        .insert(proyectoPayload)
        .select('id')
        .single();
      if (!retrySelectId.error && retrySelectId.data) {
        newProyecto = retrySelectId.data;
        proyectoErr = null;
      }
    }

    if (proyectoErr || !newProyecto) {
      throw new Error(proyectoErr?.message || 'Error al insertar en la tabla "proyectos"');
    }

    return {
      success: true,
      proyectoId: newProyecto.id,
      clienteId,
      fromSupabase: true,
    };
  } catch (err: any) {
    console.error('insertSupabaseOrder error:', err);
    return {
      success: false,
      fromSupabase: true,
      error: err.message || 'Error en inserción a Supabase',
    };
  }
}

/**
 * 2. CONSULTA DE PROYECTOS (SELECT):
 *    En la Vista Administrador y en la consulta por cliente, realiza una petición SELECT
 *    directa a la tabla 'proyectos' para traer las filas almacenadas en Supabase en tiempo real.
 */
export async function fetchSupabaseProjects(): Promise<{
  data: SupabaseProjectWithRelations[];
  fromSupabase: boolean;
  error?: string;
}> {
  await checkAndInitServerSupabase();

  if (!isSupabaseConfigured) {
    return { data: [], fromSupabase: false };
  }

  try {
    // Petición SELECT directa a la tabla 'proyectos'
    // Probamos ordenar primero por 'created_at' (estándar en Supabase), luego por 'fecha_creacion', o sin cláusula ORDER BY
    let rawProyectos: any[] | null = null;
    let proyectosErr: any = null;

    const resCreated = await supabase
      .from('proyectos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!resCreated.error && resCreated.data) {
      rawProyectos = resCreated.data;
    } else {
      const resFecha = await supabase
        .from('proyectos')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (!resFecha.error && resFecha.data) {
        rawProyectos = resFecha.data;
      } else {
        const resUnordered = await supabase
          .from('proyectos')
          .select('*');
        rawProyectos = resUnordered.data;
        proyectosErr = resUnordered.error;
      }
    }

    if (proyectosErr) {
      console.warn('SELECT directo a proyectos error:', proyectosErr.message);
      return { data: [], fromSupabase: false, error: proyectosErr.message };
    }

    if (!rawProyectos || rawProyectos.length === 0) {
      return { data: [], fromSupabase: true };
    }

    // Ordenar en memoria por fecha más reciente (created_at o fecha_creacion)
    rawProyectos.sort((a, b) => {
      const timeA = new Date(a.created_at || a.fecha_creacion || 0).getTime();
      const timeB = new Date(b.created_at || b.fecha_creacion || 0).getTime();
      return timeB - timeA;
    });

    // Enriquecer con los clientes vinculados
    const clientIds = Array.from(new Set(rawProyectos.map((p) => p.cliente_id).filter(Boolean)));
    const clientsMap = new Map<string, SupabaseCliente>();

    if (clientIds.length > 0) {
      const { data: clientsData } = await supabase
        .from('clientes')
        .select('*')
        .in('id', clientIds);

      (clientsData || []).forEach((c) => {
        if (c.id) clientsMap.set(c.id, c);
      });
    }

    // Enriquecer con los productos vinculados si existen
    const productIds = Array.from(new Set(rawProyectos.map((p) => p.producto_id).filter(Boolean)));
    const productsMap = new Map<string, SupabaseProducto>();

    if (productIds.length > 0) {
      const { data: prodsData } = await supabase
        .from('productos')
        .select('id, nombre, ambiente, rendimiento_m2, sku')
        .in('id', productIds);

      (prodsData || []).forEach((p) => {
        if (p.id) productsMap.set(p.id, p);
      });
    }

    // Formatear filas con soporte para created_at y fecha_creacion
    const formatted: SupabaseProjectWithRelations[] = rawProyectos.map((item: any) => {
      const client = clientsMap.get(item.cliente_id) || null;
      const product = item.producto_id ? productsMap.get(item.producto_id) || null : null;
      const dateVal = item.created_at || item.fecha_creacion || new Date().toISOString();

      return {
        id: item.id,
        cliente_id: item.cliente_id,
        producto_id: item.producto_id || null,
        producto_nombre: item.producto_nombre || product?.nombre || 'Pintura Pintuco Especial',
        area_m2: Number(item.area_m2) || 0,
        condicion_pared: item.condicion_pared || 'Buen Estado / Repinte',
        galones_pintura: Number(item.galones_pintura) || 0,
        galones_sellador: Number(item.galones_sellador) || 0,
        estado_pedido: item.estado_pedido || 'Cotizado',
        created_at: dateVal,
        fecha_creacion: dateVal,
        clientes: client,
        productos: product,
      };
    });

    return { data: formatted, fromSupabase: true };
  } catch (err: any) {
    console.error('fetchSupabaseProjects query failed:', err);
    return { data: [], fromSupabase: false, error: err.message };
  }
}

/**
 * Search projects by client document or order id
 */
export async function searchSupabaseProjects(query: string): Promise<{
  data: SupabaseProjectWithRelations[];
  fromSupabase: boolean;
  error?: string;
}> {
  await checkAndInitServerSupabase();

  if (!isSupabaseConfigured || !query.trim()) {
    return { data: [], fromSupabase: false };
  }

  try {
    const clean = query.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);

    if (isUuid) {
      const { data: projData, error: projErr } = await supabase
        .from('proyectos')
        .select('*')
        .eq('id', clean);

      if (!projErr && projData && projData.length > 0) {
        const item = projData[0];
        let client: SupabaseCliente | null = null;
        if (item.cliente_id) {
          const { data: cData } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', item.cliente_id)
            .single();
          client = cData || null;
        }

        const dateVal = item.created_at || item.fecha_creacion || new Date().toISOString();
        return {
          data: [
            {
              id: item.id,
              cliente_id: item.cliente_id,
              producto_id: item.producto_id || null,
              producto_nombre: item.producto_nombre || 'Pintura Pintuco Especial',
              area_m2: Number(item.area_m2) || 0,
              condicion_pared: item.condicion_pared || '',
              galones_pintura: Number(item.galones_pintura) || 0,
              galones_sellador: Number(item.galones_sellador) || 0,
              estado_pedido: item.estado_pedido || 'Cotizado',
              created_at: dateVal,
              fecha_creacion: dateVal,
              clientes: client,
            },
          ],
          fromSupabase: true,
        };
      }
    }

    // Buscar por clientes (documento o nombre)
    const { data: matchingClients } = await supabase
      .from('clientes')
      .select('*')
      .or(`numero_documento.ilike.%${clean}%,nombre.ilike.%${clean}%`);

    const clientIds = (matchingClients || []).map((c) => c.id).filter(Boolean);
    const clientsMap = new Map<string, SupabaseCliente>();
    (matchingClients || []).forEach((c) => {
      if (c.id) clientsMap.set(c.id, c);
    });

    let queryBuilder = supabase.from('proyectos').select('*');

    if (clientIds.length > 0) {
      queryBuilder = queryBuilder.in('cliente_id', clientIds);
    } else {
      queryBuilder = queryBuilder.ilike('producto_nombre', `%${clean}%`);
    }

    // Ordenar probando created_at primero, luego fecha_creacion
    let proyectos: any[] | null = null;
    let pErr: any = null;

    const resCreated = await queryBuilder.order('created_at', { ascending: false });
    if (!resCreated.error && resCreated.data) {
      proyectos = resCreated.data;
    } else {
      const resFecha = await queryBuilder.order('fecha_creacion', { ascending: false });
      if (!resFecha.error && resFecha.data) {
        proyectos = resFecha.data;
      } else {
        const resSimple = await queryBuilder;
        proyectos = resSimple.data;
        pErr = resSimple.error;
      }
    }

    if (pErr) {
      return { data: [], fromSupabase: false, error: pErr.message };
    }

    if (proyectos && proyectos.length > 0) {
      proyectos.sort((a, b) => {
        const timeA = new Date(a.created_at || a.fecha_creacion || 0).getTime();
        const timeB = new Date(b.created_at || b.fecha_creacion || 0).getTime();
        return timeB - timeA;
      });
    }

    const formatted: SupabaseProjectWithRelations[] = (proyectos || []).map((item: any) => {
      const dateVal = item.created_at || item.fecha_creacion || new Date().toISOString();
      return {
        id: item.id,
        cliente_id: item.cliente_id,
        producto_id: item.producto_id || null,
        producto_nombre: item.producto_nombre || 'Pintura Pintuco Especial',
        area_m2: Number(item.area_m2) || 0,
        condicion_pared: item.condicion_pared || '',
        galones_pintura: Number(item.galones_pintura) || 0,
        galones_sellador: Number(item.galones_sellador) || 0,
        estado_pedido: item.estado_pedido || 'Cotizado',
        created_at: dateVal,
        fecha_creacion: dateVal,
        clientes: clientsMap.get(item.cliente_id) || null,
      };
    });

    return { data: formatted, fromSupabase: true };
  } catch (err: any) {
    console.error('searchSupabaseProjects failed:', err);
    return { data: [], fromSupabase: false, error: err.message };
  }
}

/**
 * Update order status in Supabase
 */
export async function updateSupabaseProjectStatus(
  proyectoId: string,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  await checkAndInitServerSupabase();

  if (!isSupabaseConfigured) return { success: true };

  try {
    const { error } = await supabase
      .from('proyectos')
      .update({ estado_pedido: newStatus })
      .eq('id', proyectoId);

    if (error) {
      console.warn('updateSupabaseProjectStatus error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
