import { supabase, isSupabaseConfigured, reconfigureSupabaseClient, SupabaseCliente, SupabaseProducto, SupabaseProyecto } from './supabaseClient';
import { FMVFormData, CalculationResult, COLORLINKOrder, CatalogProduct, UserAddress } from '../types';
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

export interface UnifiedUserStatus {
  email: string;
  existsInAuth: boolean;
  hasClientProfile: boolean;
  clientProfile?: {
    id?: string;
    nombre?: string;
    numero_documento?: string;
    tipo_documento?: string;
    ciudad?: string;
    telefono?: string;
  } | null;
  authUserId?: string | null;
}

/**
 * Normaliza tipo de documento para coincidir con la restricción CHECK de la tabla clientes:
 * CHECK (tipo_documento IN ('CC', 'NIT', 'CE', 'Pasaporte'))
 */
export function normalizeTipoDocumento(raw?: string): 'CC' | 'NIT' | 'CE' | 'Pasaporte' {
  if (!raw) return 'CC';
  const clean = raw.trim().toUpperCase();
  if (clean === 'NIT') return 'NIT';
  if (clean.includes('CE') || clean.includes('EXTRANJER')) return 'CE';
  if (clean.includes('PASAPORTE') || clean.includes('PASAP')) return 'Pasaporte';
  return 'CC';
}

/**
 * Verificación unificada en Supabase Auth y tabla de clientes
 */
export async function checkUnifiedUserStatus(
  email: string,
  cedula?: string
): Promise<UnifiedUserStatus> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanCedula = (cedula || '').trim();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return {
      email: cleanEmail,
      existsInAuth: false,
      hasClientProfile: false,
    };
  }

  try {
    const res = await fetch('/api/auth/check-user-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, cedula: cleanCedula }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return {
          email: cleanEmail,
          existsInAuth: Boolean(data.existsInAuth),
          hasClientProfile: Boolean(data.hasClientProfile),
          clientProfile: data.clientProfile || null,
          authUserId: data.authUserId || null,
        };
      }
    }
  } catch (err) {
    console.debug('Error en consulta check-user-status:', err);
  }

  // Fallback directo desde el cliente
  let existsInAuth = false;
  let hasClientProfile = false;
  let clientProfile: any = null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: false },
      });
      const notInAuth = error && (
        error.message.toLowerCase().includes('signups not allowed') ||
        error.message.toLowerCase().includes('signup not allowed') ||
        error.message.toLowerCase().includes('user not found')
      );
      existsInAuth = !notInAuth;
    } catch {}

    if (cleanCedula) {
      try {
        const { data: clients } = await supabase
          .from('clientes')
          .select('id, tipo_documento, numero_documento, nombre, ciudad')
          .eq('numero_documento', cleanCedula)
          .limit(1);
        if (clients && clients.length > 0) {
          hasClientProfile = true;
          clientProfile = clients[0];
        }
      } catch {}
    }
  }

  return {
    email: cleanEmail,
    existsInAuth,
    hasClientProfile,
    clientProfile,
  };
}

/**
 * Guarda o actualiza el perfil del cliente en la base de datos (tabla 'clientes' y Supabase Auth)
 * vinculándolo limpiamente sin generar falsos errores de validación.
 */
export async function syncClientProfileToSupabase(profile: {
  id?: string;
  user_id?: string;
  email: string;
  nombre: string;
  cedula: string;
  telefono?: string;
  tipoDocumento?: string;
  ciudad?: string;
  direccion?: string;
  direcciones?: UserAddress[];
}): Promise<{
  success: boolean;
  clienteId?: string;
  error?: string;
}> {
  await checkAndInitServerSupabase();

  const cleanEmail = (profile.email || '').trim().toLowerCase();
  const cleanNombre = (profile.nombre || '').trim();
  const cleanDoc = (profile.cedula || '').trim();
  const cleanTipoDoc = normalizeTipoDocumento(profile.tipoDocumento);
  const cleanCiudad = (profile.ciudad || 'Bogotá D.C.').trim();
  const cleanTelefono = (profile.telefono || '').trim();
  const cleanDireccion = (profile.direccion || '').trim();

  let clienteId = profile.user_id || profile.id || '';

  // 1. Guardar en tabla 'clientes' de Supabase
  if (isSupabaseConfigured && supabase && cleanDoc) {
    try {
      const { data: existingClients, error: searchErr } = await supabase
        .from('clientes')
        .select('id, tipo_documento, numero_documento, nombre, ciudad')
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
        const insertPayload: any = {
          tipo_documento: cleanTipoDoc,
          numero_documento: cleanDoc,
          nombre: cleanNombre,
          ciudad: cleanCiudad,
        };

        const { data: newClient, error: insertErr } = await supabase
          .from('clientes')
          .insert(insertPayload)
          .select('id')
          .single();

        if (!insertErr && newClient?.id) {
          clienteId = newClient.id;
        } else if (insertErr) {
          console.warn('Advertencia insertando en clientes:', insertErr.message);
        }
      }

      // Actualizar metadata de Supabase Auth si hay sesión activa
      try {
        const metaUpdate: Record<string, any> = {
          nombre: cleanNombre,
          cedula: cleanDoc,
          numero_documento: cleanDoc,
          telefono: cleanTelefono,
          tipoDocumento: cleanTipoDoc,
          ciudad: cleanCiudad,
        };
        if (cleanDireccion) metaUpdate.direccion = cleanDireccion;
        if (Array.isArray(profile.direcciones)) metaUpdate.direcciones = profile.direcciones;
        await supabase.auth.updateUser({ data: metaUpdate });
      } catch (authMetaErr) {
        console.debug('No active session for updateUser:', authMetaErr);
      }
    } catch (err: any) {
      console.warn('Excepción sincronizando clientes en Supabase:', err);
    }
  }

  // 2. Notificar al servidor Express para respaldo multidispositivo
  try {
    await fetch('/api/auth/sync-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        nombre: cleanNombre,
        cedula: cleanDoc,
        telefono: cleanTelefono,
        tipoDocumento: cleanTipoDoc,
        ciudad: cleanCiudad,
        direccion: cleanDireccion || undefined,
        direcciones: Array.isArray(profile.direcciones) ? profile.direcciones : undefined,
        userId: clienteId,
      }),
    });
  } catch {}

  return {
    success: true,
    clienteId,
  };
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

// ==============================================================================
// SINCRONIZACIÓN MULTIDISPOSITIVO: PERFIL, DIRECCIONES, PEDIDOS, SAC Y CHAT IA
// ==============================================================================

/**
 * Obtiene perfil completo y libreta de direcciones desde Supabase (user_addresses, user_metadata, clientes)
 * y respaldo del servidor para restaurar la cuenta en cualquier dispositivo.
 */
export interface RemoteUserProfile {
  nombre?: string;
  documento?: string;
  tipoDocumento?: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;
  direcciones: UserAddress[];
}

export async function fetchUserProfileAndAddressesFromSupabase(
  userId?: string | null,
  userEmail?: string | null,
  userDoc?: string | null
): Promise<RemoteUserProfile> {
  await checkAndInitServerSupabase();
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const cleanDoc = (userDoc || '').trim();
  const result: RemoteUserProfile = { direcciones: [] };

  const addrsMap = new Map<string, UserAddress>();
  const addAddressList = (list: any[]) => {
    if (!Array.isArray(list)) return;
    list.forEach((a: any) => {
      if (!a || !a.direccion) return;
      if (a.id === 'addr-1' || a.id === 'addr-2' || a.id === 'addr-3') return;
      const key = String(a.id || `${a.etiqueta}_${a.direccion}`).toLowerCase();
      if (!addrsMap.has(key)) {
        addrsMap.set(key, {
          id: a.id || `addr-${Date.now()}`,
          etiqueta: a.etiqueta || 'Dirección guardada',
          direccion: a.direccion,
          departamento: a.departamento || 'Cundinamarca',
          ciudad: a.ciudad || 'Bogotá D.C.',
          detalles: a.detalles || '',
          esPredeterminada: Boolean(a.es_predeterminada ?? a.esPredeterminada),
        });
      }
    });
  };

  if (isSupabaseConfigured && supabase) {
    // 1. Metadata de Supabase Auth del usuario autenticado (viaja siempre entre dispositivos)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const meta = user.user_metadata || {};
        if (meta.nombre) result.nombre = meta.nombre;
        if (meta.cedula || meta.documento || meta.numero_documento) {
          result.documento = meta.cedula || meta.documento || meta.numero_documento;
        }
        if (meta.tipoDocumento) result.tipoDocumento = meta.tipoDocumento;
        if (meta.telefono) result.telefono = meta.telefono;
        if (meta.ciudad) result.ciudad = meta.ciudad;
        if (meta.direccion) result.direccion = meta.direccion;
        if (Array.isArray(meta.direcciones)) addAddressList(meta.direcciones);
      }
    } catch {}

    // 2. Tabla user_addresses de Supabase
    if (userId || cleanEmail) {
      try {
        let query = supabase.from('user_addresses').select('*');
        if (userId && cleanEmail) {
          query = query.or(`user_id.eq.${userId},user_email.ilike.${cleanEmail}`);
        } else if (userId) {
          query = query.eq('user_id', userId);
        } else if (cleanEmail) {
          query = query.ilike('user_email', cleanEmail);
        }
        const { data: dbAddrs, error: addrErr } = await query.order('created_at', { ascending: true });
        if (!addrErr && Array.isArray(dbAddrs) && dbAddrs.length > 0) {
          addAddressList(dbAddrs);
        }
      } catch {}
    }

    // 3. Tabla clientes de Supabase (si tiene documento o email)
    const docToQuery = result.documento || cleanDoc;
    if (docToQuery) {
      try {
        const { data: clients } = await supabase
          .from('clientes')
          .select('*')
          .eq('numero_documento', docToQuery)
          .limit(1);
        if (clients && clients.length > 0) {
          const c: any = clients[0];
          if (!result.nombre && c.nombre) result.nombre = c.nombre;
          if (!result.ciudad && c.ciudad) result.ciudad = c.ciudad;
          if (!result.tipoDocumento && c.tipo_documento) result.tipoDocumento = c.tipo_documento;
          if (!result.telefono && c.telefono) result.telefono = c.telefono;
          if (!result.direccion && c.direccion) result.direccion = c.direccion;
        }
      } catch {}
    }
  }

  // 4. Respaldo del servidor Express por correo electrónico
  if (cleanEmail) {
    try {
      const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(cleanEmail)}`);
      if (res.ok) {
        const json = await res.json();
        const p = json?.profile;
        if (p) {
          if (!result.nombre && p.nombre) result.nombre = p.nombre;
          if (!result.documento && (p.cedula || p.documento)) result.documento = p.cedula || p.documento;
          if (!result.tipoDocumento && p.tipoDocumento) result.tipoDocumento = p.tipoDocumento;
          if (!result.telefono && p.telefono) result.telefono = p.telefono;
          if (!result.ciudad && p.ciudad) result.ciudad = p.ciudad;
          if (!result.direccion && p.direccion) result.direccion = p.direccion;
          if (Array.isArray(p.direcciones)) addAddressList(p.direcciones);
        }
      }
    } catch {}
  }

  result.direcciones = Array.from(addrsMap.values());
  return result;
}

/**
 * Guarda la libreta de direcciones en Supabase (user_addresses + auth.user_metadata) y respaldo servidor.
 */
export async function saveUserAddressesToSupabase(
  addresses: UserAddress[],
  profile?: {
    userId?: string;
    email?: string;
    nombre?: string;
    documento?: string;
    telefono?: string;
    tipoDocumento?: string;
    ciudad?: string;
  }
): Promise<void> {
  await checkAndInitServerSupabase();
  const cleanEmail = (profile?.email || '').trim().toLowerCase();
  const defaultAddr = addresses.find((a) => a.esPredeterminada) || addresses[0];

  if (isSupabaseConfigured && supabase) {
    let authUid = profile?.userId || null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) authUid = user.id;
      if (user) {
        await supabase.auth.updateUser({
          data: {
            direcciones: addresses,
            ...(defaultAddr ? { direccion: defaultAddr.direccion, ciudad: defaultAddr.ciudad } : {}),
          },
        });
      }
    } catch {}

    // Sincronizar con tabla user_addresses en Supabase si existe
    if (cleanEmail) {
      try {
        await supabase.from('user_addresses').delete().ilike('user_email', cleanEmail);
        if (addresses.length > 0) {
          const rows = addresses.map((a) => ({
            id: a.id,
            user_id: authUid,
            user_email: cleanEmail,
            etiqueta: a.etiqueta,
            direccion: a.direccion,
            departamento: a.departamento || 'Cundinamarca',
            ciudad: a.ciudad || 'Bogotá D.C.',
            detalles: a.detalles || '',
            es_predeterminada: Boolean(a.esPredeterminada),
          }));
          await supabase.from('user_addresses').upsert(rows, { onConflict: 'id' });
        }
      } catch {}
    }
  }

  // Respaldo servidor Express
  if (cleanEmail) {
    try {
      await fetch('/api/auth/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          nombre: profile?.nombre,
          cedula: profile?.documento,
          telefono: profile?.telefono,
          tipoDocumento: profile?.tipoDocumento,
          ciudad: defaultAddr?.ciudad || profile?.ciudad,
          direccion: defaultAddr?.direccion,
          direcciones: addresses,
          userId: profile?.userId,
        }),
      });
    } catch {}
  }
}

/**
 * Actualiza el estado del pedido en Supabase ('orders' y 'proyectos') para disparar Realtime en otros dispositivos.
 */
export async function updateSupabaseOrderStatus(
  orderIdOrNumber: string,
  newStatus: string,
  updates?: {
    numeroOrden?: string;
    guiaDespacho?: string;
    observacionesBodega?: string;
    responsableAlistamiento?: string;
  }
): Promise<void> {
  await checkAndInitServerSupabase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdOrNumber);

  if (isSupabaseConfigured && supabase) {
    // 1. Actualizar tabla 'proyectos' si es UUID
    if (isUuid) {
      let projStatus = 'Radicado';
      const st = newStatus.toLowerCase();
      if (st.includes('entregado')) projStatus = 'Entregado';
      else if (st.includes('despachado') || st.includes('tránsito') || st.includes('transito')) projStatus = 'Despachado';
      else if (st.includes('listo') || st.includes('aprobado')) projStatus = 'Listo para Despacho';
      else if (st.includes('alistamiento') || st.includes('prepar') || st.includes('bodega') || st.includes('producc')) projStatus = 'En Alistamiento';
      else if (st.includes('cancelado')) projStatus = 'Cancelado';
      else if (st.includes('cotiz')) projStatus = 'Cotizado';

      try {
        await supabase
          .from('proyectos')
          .update({
            estado_pedido: projStatus,
            ...(updates?.guiaDespacho ? { guia_transporte: updates.guiaDespacho } : {}),
            ...(updates?.observacionesBodega ? { observaciones_bodega: updates.observacionesBodega } : {}),
          })
          .eq('id', orderIdOrNumber);
      } catch {
        // Fallback si aún no existen las columnas opcionales
        await updateSupabaseProjectStatus(orderIdOrNumber, projStatus);
      }
    }

    // 2. Actualizar tabla 'orders' por id o por order_number
    try {
      const orderPayload: Record<string, any> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      if (updates?.guiaDespacho !== undefined) orderPayload.guia_transporte = updates.guiaDespacho;
      if (updates?.observacionesBodega !== undefined) orderPayload.observaciones_bodega = updates.observacionesBodega;

      if (isUuid) {
        await supabase.from('orders').update(orderPayload).eq('id', orderIdOrNumber);
      }
      if (updates?.numeroOrden) {
        await supabase.from('orders').update(orderPayload).eq('order_number', updates.numeroOrden);
      }
    } catch {}
  }

  // 3. Respaldo en servidor Express
  try {
    await fetch(`/api/orders/${encodeURIComponent(orderIdOrNumber)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: newStatus,
        guiaDespacho: updates?.guiaDespacho,
        observacionesBodega: updates?.observacionesBodega,
        responsableAlistamiento: updates?.responsableAlistamiento,
      }),
    });
  } catch {}
}

/**
 * Consulta tickets SAC / PQRS en Supabase y servidor por usuario (o todos para intranet).
 */
export async function fetchTicketsFromSupabase(
  userEmail?: string | null,
  userId?: string | null
): Promise<any[]> {
  await checkAndInitServerSupabase();
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const collected: any[] = [];
  const seen = new Set<string>();

  const pushTicket = (t: any) => {
    if (!t || (!t.id && !t.radicado)) return;
    const key = t.id || t.radicado;
    if (!seen.has(key)) {
      seen.add(key);
      collected.push(t);
    }
  };

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('tickets').select('*');
      if (cleanEmail) {
        query = query.ilike('cliente_email', cleanEmail);
      } else if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        data.forEach((row: any) => {
          pushTicket({
            id: row.id,
            radicado: row.radicado,
            clienteId: row.user_id,
            clienteNombre: row.cliente_nombre,
            clienteEmail: row.cliente_email,
            clienteTelefono: row.cliente_telefono || '',
            canal: row.canal || 'Formulario PQR',
            categoria: row.categoria || 'Asesoría Técnica Pinturas',
            asunto: row.asunto,
            mensaje: row.mensaje,
            estado: row.estado || 'Nuevo',
            prioridad: row.prioridad || 'Media',
            fechaCreacion: row.fecha_creacion || (row.created_at ? String(row.created_at).replace('T', ' ').slice(0, 16) : ''),
            fechaUltimaActividad: row.fecha_ultima_actividad || (row.updated_at ? String(row.updated_at).replace('T', ' ').slice(0, 16) : ''),
            slaHorasLimite: row.sla_horas_limite || 8,
            slaVencido: Boolean(row.sla_vencido),
            mensajes: Array.isArray(row.mensajes) && row.mensajes.length > 0
              ? row.mensajes
              : [{
                  id: `msg-${row.id}`,
                  remitenteTipo: 'cliente',
                  remitenteNombre: row.cliente_nombre,
                  texto: row.mensaje,
                  fecha: row.fecha_creacion || '',
                }],
          });
        });
      }
    } catch {}
  }

  // Consultar respaldo del servidor Express
  try {
    const qs = cleanEmail ? `?email=${encodeURIComponent(cleanEmail)}` : '';
    const res = await fetch(`/api/tickets${qs}`);
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.tickets)) {
        json.tickets.forEach(pushTicket);
      }
    }
  } catch {}

  return collected;
}

/**
 * Guarda o actualiza un ticket SAC / PQRS en Supabase y servidor para propagación Realtime.
 */
export async function upsertTicketToSupabase(ticket: any): Promise<void> {
  if (!ticket) return;
  await checkAndInitServerSupabase();

  let authUserId: string | null = ticket.clienteId || ticket.userId || null;
  if (isSupabaseConfigured && supabase) {
    try {
      if (!authUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) authUserId = user.id;
      }
      const payload = {
        id: ticket.id,
        radicado: ticket.radicado,
        user_id: authUserId,
        cliente_nombre: ticket.clienteNombre,
        cliente_email: (ticket.clienteEmail || '').trim().toLowerCase(),
        cliente_telefono: ticket.clienteTelefono || '',
        canal: ticket.canal || 'Formulario PQR',
        categoria: ticket.categoria || 'Asesoría Técnica Pinturas',
        asunto: ticket.asunto,
        mensaje: ticket.mensaje,
        estado: ticket.estado || 'Nuevo',
        prioridad: ticket.prioridad || 'Media',
        mensajes: Array.isArray(ticket.mensajes) ? ticket.mensajes : [],
        sla_horas_limite: ticket.slaHorasLimite || 8,
        sla_vencido: Boolean(ticket.slaVencido),
        fecha_creacion: ticket.fechaCreacion,
        fecha_ultima_actividad: ticket.fechaUltimaActividad,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('tickets').upsert([payload], { onConflict: 'id' });
      if (error && error.message?.includes('column')) {
        await supabase.from('tickets').upsert([{
          id: ticket.id,
          radicado: ticket.radicado,
          user_id: authUserId,
          cliente_nombre: ticket.clienteNombre,
          cliente_email: (ticket.clienteEmail || '').trim().toLowerCase(),
          cliente_telefono: ticket.clienteTelefono || '',
          categoria: ticket.categoria || 'Asesoría Técnica Pinturas',
          asunto: ticket.asunto,
          mensaje: ticket.mensaje,
          estado: ticket.estado || 'Nuevo',
        }], { onConflict: 'id' });
      }
    } catch {}
  }

  try {
    await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket, user_id: authUserId }),
    });
  } catch {}
}

/**
 * Carga historial de chat de Linky desde Supabase (chat_messages / user_metadata) y respaldo servidor.
 */
export async function fetchChatHistoryFromSupabase(
  userId?: string | null,
  userEmail?: string | null
): Promise<any[]> {
  await checkAndInitServerSupabase();
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  if (!userId && !cleanEmail) return [];

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('chat_messages').select('*');
      if (userId && cleanEmail) {
        query = query.or(`user_id.eq.${userId},user_email.ilike.${cleanEmail}`);
      } else if (userId) {
        query = query.eq('user_id', userId);
      } else {
        query = query.ilike('user_email', cleanEmail);
      }
      const { data, error } = await query.order('created_at', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row: any) => ({
          ...(row.metadata || {}),
          id: row.message_id || row.id,
          sender: row.sender,
          text: row.text,
          imageUrl: row.image_url || row.metadata?.imageUrl,
          timestamp: row.metadata?.timestamp || (row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
        }));
      }
    } catch {}

    // Fallback a user_metadata si aún no existe la tabla chat_messages
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const metaHistory = user?.user_metadata?.linky_chat_history;
      if (Array.isArray(metaHistory) && metaHistory.length > 0) {
        return metaHistory;
      }
    } catch {}
  }

  // Respaldo servidor Express
  if (cleanEmail) {
    try {
      const res = await fetch(`/api/chat-history?email=${encodeURIComponent(cleanEmail)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.messages) && json.messages.length > 0) {
          return json.messages;
        }
      }
    } catch {}
  }

  return [];
}

/**
 * Sincroniza el historial de mensajes con Linky hacia Supabase y respaldo multidispositivo.
 */
export async function saveChatHistoryToSupabase(
  userId: string | null,
  userEmail: string,
  messages: any[]
): Promise<void> {
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  if (!cleanEmail || !Array.isArray(messages) || messages.length === 0) return;

  await checkAndInitServerSupabase();

  const compactMessages = messages.slice(-40).map((m) => ({
    id: m.id,
    sender: m.sender,
    text: m.text,
    timestamp: m.timestamp,
    showQuickChips: m.showQuickChips,
    cartActions: m.cartActions,
    cartAction: m.cartAction,
    toolsKit: m.toolsKit,
    superficieIdentificada: m.superficieIdentificada,
    areaEstimadaM2: m.areaEstimadaM2,
    imageUrl: m.imageUrl && String(m.imageUrl).length < 40000 ? m.imageUrl : undefined,
  }));

  if (isSupabaseConfigured && supabase) {
    try {
      const rows = compactMessages.map((m) => {
        const { id, sender, text, imageUrl, ...rest } = m;
        return {
          id: `${cleanEmail}_${id}`,
          user_id: userId || null,
          user_email: cleanEmail,
          message_id: String(id),
          sender: String(sender || 'assistant'),
          text: String(text || ''),
          image_url: imageUrl || null,
          metadata: rest,
        };
      });
      await supabase.from('chat_messages').upsert(rows, { onConflict: 'id' });
    } catch {}

    // Guardar copia ligera en auth.user_metadata (los últimos 15 mensajes sin imágenes pesadas)
    try {
      const metaCopy = compactMessages.slice(-15).map((m) => ({
        id: m.id,
        sender: m.sender,
        text: String(m.text || '').slice(0, 600),
        timestamp: m.timestamp,
        showQuickChips: m.showQuickChips,
      }));
      await supabase.auth.updateUser({
        data: { linky_chat_history: metaCopy },
      });
    } catch {}
  }

  try {
    await fetch('/api/chat-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, messages: compactMessages }),
    });
  } catch {}
}

/**
 * Limpia el historial de Linky del usuario en Supabase y respaldo.
 */
export async function clearChatHistoryInSupabase(
  userId: string | null,
  userEmail: string
): Promise<void> {
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  if (!cleanEmail) return;
  await checkAndInitServerSupabase();

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('chat_messages').delete().ilike('user_email', cleanEmail);
      await supabase.auth.updateUser({ data: { linky_chat_history: [] } });
    } catch {}
  }

  try {
    await fetch(`/api/chat-history?email=${encodeURIComponent(cleanEmail)}`, { method: 'DELETE' });
  } catch {}
}

