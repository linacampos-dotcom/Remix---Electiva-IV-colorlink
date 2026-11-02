import { createClient } from '@supabase/supabase-js';

// Clean and normalize Supabase URL (strip any accidental /rest/v1 suffix)
export function normalizeSupabaseUrl(url?: string): string {
  if (!url) return 'https://hyzzdjtckejrcfxptjel.supabase.co';
  let clean = url.trim();
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  clean = clean.replace(/\/+$/, '');
  return clean || 'https://hyzzdjtckejrcfxptjel.supabase.co';
}

// Configuration keys with support for import.meta.env or fallback placeholders
// In Vite applications, public variables can use VITE_ prefix or standard env
const uncleanedUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL : '') || 
  'https://hyzzdjtckejrcfxptjel.supabase.co';

const rawUrl = normalizeSupabaseUrl(uncleanedUrl);

const rawAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY : '') || 
  'sb_publishable_fX0rW_21X7HN_Rbbs3iWfw_uwAKIKyG';

export let isSupabaseConfigured = Boolean(
  rawUrl && 
  rawAnonKey && 
  !rawUrl.includes('AQUÍ_TÚ_PROJECT_URL') && 
  !rawAnonKey.includes('AQUÍ_TU_ANON_KEY') &&
  rawUrl.startsWith('http')
);

const fallbackUrl = 'https://hyzzdjtckejrcfxptjel.supabase.co';
const fallbackKey = 'sb_publishable_fX0rW_21X7HN_Rbbs3iWfw_uwAKIKyG';

const clientTargetUrl = (rawUrl && rawUrl.startsWith('http') && !rawUrl.includes('AQUÍ_TÚ_PROJECT_URL'))
  ? normalizeSupabaseUrl(rawUrl)
  : fallbackUrl;

const clientTargetKey = (rawAnonKey && !rawAnonKey.includes('AQUÍ_TU_ANON_KEY'))
  ? rawAnonKey
  : fallbackKey;

let supabaseInstance: any;
try {
  supabaseInstance = createClient(clientTargetUrl, clientTargetKey);
} catch (e) {
  console.warn('Fallback Supabase client initialization:', e);
  supabaseInstance = createClient(fallbackUrl, fallbackKey);
}

export let supabase = supabaseInstance;

/**
 * Configure or re-initialize the Supabase client at runtime (e.g. from /api/supabase-env)
 */
export function reconfigureSupabaseClient(url: string, anonKey: string) {
  if (url && anonKey && url.startsWith('http') && !url.includes('AQUÍ_TÚ_PROJECT_URL')) {
    try {
      supabase = createClient(url, anonKey);
      isSupabaseConfigured = true;
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export interface SupabaseCliente {
  id?: string;
  tipo_documento: string;
  numero_documento: string;
  nombre: string;
  ciudad: string;
  created_at?: string;
  fecha_creacion?: string;
}

export interface SupabaseProducto {
  id: string;
  nombre: string;
  ambiente: string;
  rendimiento_m2: number;
  sku: string;
  created_at?: string;
  fecha_creacion?: string;
}

export interface SupabaseProyecto {
  id?: string;
  cliente_id: string;
  producto_id?: string | null;
  producto_nombre?: string;
  area_m2: number;
  condicion_pared: string;
  galones_pintura: number;
  galones_sellador: number;
  estado_pedido: string;
  created_at?: string;
  fecha_creacion?: string;
}
