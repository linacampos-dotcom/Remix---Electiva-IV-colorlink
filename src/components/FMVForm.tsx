import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  FMVFormData, 
  TipoDocumento, 
  SuperficieTipo, 
  AmbienteTipo, 
  CondicionPared,
  CalculationResult,
  UserSession,
  CartItem
} from '../types';
import { 
  COLOR_PALETTE, 
  ColorPaletteItem,
  PRESET_PROJECTS, 
  PINTUCO_CATALOG 
} from '../data/pintucoData';
import { 
  DEPARTAMENTOS_COLOMBIA, 
  PINTUCO_STORE_HUBS, 
  calculateShipping 
} from '../data/colombiaLogistics';
import { calculateMaterials } from '../utils/calculator';
import { SupabaseProducto } from '../lib/supabaseClient';
import { useCart } from '../context/CartContext';
import { 
  Paintbrush, 
  Maximize2, 
  Truck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Info, 
  RotateCcw, 
  Home, 
  Building2, 
  Layers, 
  ShieldCheck, 
  Palette, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  Sliders, 
  MapPin, 
  User, 
  Phone, 
  ShoppingBag, 
  Send, 
  Printer, 
  AlertCircle,
  Clock,
  Warehouse,
  Droplet,
  Save,
  Plus,
  Minus,
  Wrench,
  Trash2,
  X,
  Undo2
} from 'lucide-react';

// ============================================================================
// BASE DE DATOS DE TIENDAS Y PUNTOS DE VENTA PINTUCO PARA RETIRO EN TIENDA (PICKUP)
// ============================================================================
export interface PintucoPickupStoreLocation {
  id: string;
  nombre: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  horario: string;
  telefono: string;
  badge?: string;
}

export const PINTUCO_PICKUP_STORES: PintucoPickupStoreLocation[] = [
  // Bogotá D.C.
  {
    id: 'bog-calle80',
    nombre: 'Pintuco Bogotá Calle 80',
    departamento: 'Bogotá D.C.',
    ciudad: 'Bogotá D.C.',
    direccion: 'Calle 80 No. 69-45, Sector Las Ferias / Bonanza',
    horario: 'Lunes a Sábado 7:30 am - 6:00 pm',
    telefono: '+57 (601) 311 8899',
    badge: 'Tienda Insignia Pro'
  },
  {
    id: 'bog-autonorte',
    nombre: 'Pintuco Bogotá Autopista Norte',
    departamento: 'Bogotá D.C.',
    ciudad: 'Bogotá D.C.',
    direccion: 'Autopista Norte No. 145-30, Cedritos',
    horario: 'Lunes a Sábado 8:00 am - 6:30 pm',
    telefono: '+57 (601) 627 4410',
    badge: 'Pintumarket Pro'
  },
  {
    id: 'bog-fontibon',
    nombre: 'CEDI Central Fontibón - Pintuco',
    departamento: 'Bogotá D.C.',
    ciudad: 'Bogotá D.C.',
    direccion: 'Carrera 106 No. 15-25, Zona Industrial Fontibón',
    horario: 'Lunes a Viernes 7:00 am - 5:30 pm | Sábados 7:30 am - 1:00 pm',
    telefono: '+57 (601) 745 8800',
    badge: 'CEDI Nacional'
  },
  {
    id: 'bog-centro',
    nombre: 'Pintuco Bogotá Centro Carrera 10',
    departamento: 'Bogotá D.C.',
    ciudad: 'Bogotá D.C.',
    direccion: 'Carrera 10 No. 18-35, Centro',
    horario: 'Lunes a Sábado 8:00 am - 5:30 pm',
    telefono: '+57 (601) 282 4500',
    badge: 'Punto Oficial'
  },
  {
    id: 'bog-kennedy',
    nombre: 'Pintuco Bogotá Kennedy Plaza',
    departamento: 'Bogotá D.C.',
    ciudad: 'Bogotá D.C.',
    direccion: 'Av. Primero de Mayo No. 71D-20',
    horario: 'Lunes a Sábado 7:30 am - 6:00 pm',
    telefono: '+57 (601) 451 9020',
    badge: 'Pintumarket Pro'
  },
  {
    id: 'bog-chapinero',
    nombre: 'Pintuco Bogotá Chapinero',
    departamento: 'Bogotá D.C.',
    ciudad: 'Bogotá D.C.',
    direccion: 'Carrera 13 No. 58-42',
    horario: 'Lunes a Sábado 8:00 am - 6:00 pm',
    telefono: '+57 (601) 345 1290',
    badge: 'Tienda Oficial'
  },

  // Santander
  {
    id: 'bga-centro',
    nombre: 'Pintuco Bucaramanga Centro',
    departamento: 'Santander',
    ciudad: 'Bucaramanga',
    direccion: 'Calle 36 No. 16-24, Centro Comercial del Pintor',
    horario: 'Lunes a Sábado 7:30 am - 6:00 pm',
    telefono: '+57 (607) 633 4580',
    badge: 'Tienda Principal'
  },
  {
    id: 'bga-chimita',
    nombre: 'Pintuco Sede Oriente Chimitá',
    departamento: 'Santander',
    ciudad: 'Bucaramanga',
    direccion: 'Km 3 Vía Palenque-Café Madrid, Sector Chimitá',
    horario: 'Lunes a Viernes 7:30 am - 5:00 pm | Sábados 8:00 am - 12:00 m',
    telefono: '+57 (607) 676 2200',
    badge: 'Hub Regional'
  },
  {
    id: 'bga-cabecera',
    nombre: 'Pintuco Bucaramanga Cabecera',
    departamento: 'Santander',
    ciudad: 'Bucaramanga',
    direccion: 'Carrera 33 No. 48-15, Cabecera del Llano',
    horario: 'Lunes a Sábado 8:00 am - 6:30 pm',
    telefono: '+57 (607) 643 8910',
    badge: 'Pintumarket Pro'
  },
  {
    id: 'bga-floridablanca',
    nombre: 'Pintuco Floridablanca Autopista',
    departamento: 'Santander',
    ciudad: 'Floridablanca',
    direccion: 'Autopista Floridablanca Km 4 Vía Piedecuesta',
    horario: 'Lunes a Sábado 7:30 am - 6:00 pm',
    telefono: '+57 (607) 675 3300',
    badge: 'Tienda Oficial'
  },
  {
    id: 'bga-barranca',
    nombre: 'Pintuco Barrancabermeja Puerto',
    departamento: 'Santander',
    ciudad: 'Barrancabermeja',
    direccion: 'Calle 50 No. 18-22, Sector Comercial',
    horario: 'Lunes a Sábado 7:30 am - 5:30 pm',
    telefono: '+57 (607) 622 1450',
    badge: 'Tienda Oficial'
  },

  // Antioquia
  {
    id: 'med-guayabal',
    nombre: 'CEDI Guayabal & Ventas Mayoristas Pintuco',
    departamento: 'Antioquia',
    ciudad: 'Medellín',
    direccion: 'Carrera 52 No. 14-80, Guayabal',
    horario: 'Lunes a Viernes 7:30 am - 5:30 pm | Sábados 8:00 am - 1:00 pm',
    telefono: '+57 (604) 370 2000',
    badge: 'CEDI Regional'
  },
  {
    id: 'med-poblado',
    nombre: 'Pintuco Medellín El Poblado',
    departamento: 'Antioquia',
    ciudad: 'Medellín',
    direccion: 'Calle 10 No. 43E-28, Sector Manila / Poblado',
    horario: 'Lunes a Sábado 8:00 am - 6:30 pm',
    telefono: '+57 (604) 312 8090',
    badge: 'Tienda Insignia'
  },
  {
    id: 'med-laureles',
    nombre: 'Pintuco Medellín Laureles',
    departamento: 'Antioquia',
    ciudad: 'Medellín',
    direccion: 'Circular 4ta No. 73-18, Segundo Parque Laureles',
    horario: 'Lunes a Sábado 8:00 am - 6:00 pm',
    telefono: '+57 (604) 411 9500',
    badge: 'Pintumarket Pro'
  },
  {
    id: 'med-centro',
    nombre: 'Pintuco Medellín Centro Palacé',
    departamento: 'Antioquia',
    ciudad: 'Medellín',
    direccion: 'Carrera 50 No. 44-12, Sector San Antonio',
    horario: 'Lunes a Sábado 7:30 am - 5:30 pm',
    telefono: '+57 (604) 512 3040',
    badge: 'Tienda Oficial'
  },
  {
    id: 'med-bello',
    nombre: 'Pintuco Bello Autopista Norte',
    departamento: 'Antioquia',
    ciudad: 'Bello',
    direccion: 'Diagonal 55 No. 34-10, Sector Niquía',
    horario: 'Lunes a Sábado 7:30 am - 6:00 pm',
    telefono: '+57 (604) 456 2200',
    badge: 'Pintumarket Pro'
  },
  {
    id: 'med-envigado',
    nombre: 'Pintuco Envigado Las Vegas',
    departamento: 'Antioquia',
    ciudad: 'Envigado',
    direccion: 'Carrera 48 No. 25 Sur-15, Avenida Las Vegas',
    horario: 'Lunes a Sábado 8:00 am - 6:00 pm',
    telefono: '+57 (604) 331 4050',
    badge: 'Tienda Oficial'
  },
  {
    id: 'med-rionegro',
    nombre: 'Planta Principal Rionegro - Pintuco',
    departamento: 'Antioquia',
    ciudad: 'Rionegro',
    direccion: 'Autopista Medellín-Bogotá Km 38, Vía Rionegro',
    horario: 'Lunes a Viernes 6:30 am - 5:00 pm | Sábados 7:00 am - 12:00 m',
    telefono: '+57 (604) 569 8000',
    badge: 'Planta Principal'
  },

  // Valle del Cauca
  {
    id: 'cali-norte',
    nombre: 'Pintuco Cali Norte',
    departamento: 'Valle del Cauca',
    ciudad: 'Cali',
    direccion: 'Avenida 6N No. 28N-40, Barrio Santa Mónica',
    horario: 'Lunes a Sábado 7:30 am - 6:00 pm',
    telefono: '+57 (602) 667 8000',
    badge: 'Tienda Insignia'
  },
  {
    id: 'cali-pasoancho',
    nombre: 'Pintuco Cali Pasoancho',
    departamento: 'Valle del Cauca',
    ciudad: 'Cali',
    direccion: 'Calle 13 No. 66-15, Pasoancho',
    horario: 'Lunes a Sábado 8:00 am - 6:00 pm',
    telefono: '+57 (602) 330 4500',
    badge: 'Pintumarket Pro'
  },
  {
    id: 'cali-centro',
    nombre: 'Pintuco Cali Centro Histórico',
    departamento: 'Valle del Cauca',
    ciudad: 'Cali',
    direccion: 'Carrera 5 No. 12-30, Centro',
    horario: 'Lunes a Sábado 8:00 am - 5:30 pm',
    telefono: '+57 (602) 883 1290',
    badge: 'Tienda Oficial'
  },
  {
    id: 'cali-yumbo',
    nombre: 'Hub Regional Yumbo - Pintuco',
    departamento: 'Valle del Cauca',
    ciudad: 'Yumbo',
    direccion: 'Calle 15 No. 28-90, Zona Industrial Acopi Yumbo',
    horario: 'Lunes a Viernes 7:30 am - 5:00 pm | Sábados 8:00 am - 12:30 pm',
    telefono: '+57 (602) 695 5000',
    badge: 'Hub Regional'
  },

  // Atlántico
  {
    id: 'baq-norte',
    nombre: 'Pintuco Barranquilla Norte',
    departamento: 'Atlántico',
    ciudad: 'Barranquilla',
    direccion: 'Calle 84 No. 51B-32, Alto Prado',
    horario: 'Lunes a Sábado 7:30 am - 6:00 pm',
    telefono: '+57 (605) 378 9000',
    badge: 'Tienda Insignia'
  },
  {
    id: 'baq-via40',
    nombre: 'CEDI Vía 40 Costa Caribe - Pintuco',
    departamento: 'Atlántico',
    ciudad: 'Barranquilla',
    direccion: 'Vía 40 No. 73-120, Sector Industrial',
    horario: 'Lunes a Viernes 7:30 am - 5:00 pm | Sábados 8:00 am - 1:00 pm',
    telefono: '+57 (605) 369 4000',
    badge: 'Hub Regional'
  },
  {
    id: 'baq-murillo',
    nombre: 'Pintuco Barranquilla Murillo',
    departamento: 'Atlántico',
    ciudad: 'Barranquilla',
    direccion: 'Calle 45 (Av. Murillo) No. 23-40',
    horario: 'Lunes a Sábado 7:30 am - 5:30 pm',
    telefono: '+57 (605) 365 2100',
    badge: 'Tienda Oficial'
  },

  // Bolívar
  {
    id: 'ctg-bocagrande',
    nombre: 'Pintuco Cartagena Manga / Bocagrande',
    departamento: 'Bolívar',
    ciudad: 'Cartagena',
    direccion: 'Avenida Miramar No. 24-50, Manga',
    horario: 'Lunes a Sábado 7:30 am - 6:00 pm',
    telefono: '+57 (605) 660 4500',
    badge: 'Tienda Insignia'
  },
  {
    id: 'ctg-mamonal',
    nombre: 'Centro Logístico Mamonal - Pintuco',
    departamento: 'Bolívar',
    ciudad: 'Cartagena',
    direccion: 'Corredor de Carga Km 7, Sector Mamonal',
    horario: 'Lunes a Viernes 7:30 am - 5:00 pm | Sábados 8:00 am - 12:30 pm',
    telefono: '+57 (605) 668 9000',
    badge: 'Hub Regional'
  },

  // Eje Cafetero
  {
    id: 'pei-30agosto',
    nombre: 'Pintuco Pereira Av. 30 de Agosto',
    departamento: 'Risaralda',
    ciudad: 'Pereira',
    direccion: 'Avenida 30 de Agosto No. 45-20',
    horario: 'Lunes a Sábado 8:00 am - 6:00 pm',
    telefono: '+57 (606) 329 8800',
    badge: 'Tienda Insignia'
  },
  {
    id: 'manizales-centro',
    nombre: 'Pintuco Manizales Centro',
    departamento: 'Caldas',
    ciudad: 'Manizales',
    direccion: 'Carrera 22 No. 25-10, Centro',
    horario: 'Lunes a Sábado 8:00 am - 6:00 pm',
    telefono: '+57 (606) 884 2000',
    badge: 'Tienda Oficial'
  },
  {
    id: 'armenia-bolivar',
    nombre: 'Pintuco Armenia Av. Bolívar',
    departamento: 'Quindío',
    ciudad: 'Armenia',
    direccion: 'Avenida Bolívar No. 14N-25',
    horario: 'Lunes a Sábado 8:00 am - 6:00 pm',
    telefono: '+57 (606) 749 3300',
    badge: 'Tienda Oficial'
  },

  // Otras Capitales
  {
    id: 'ibague-quinta',
    nombre: 'Pintuco Ibagué Carrera 5ta',
    departamento: 'Tolima',
    ciudad: 'Ibagué',
    direccion: 'Carrera 5 No. 38-20',
    horario: 'Lunes a Sábado 8:00 am - 6:00 pm',
    telefono: '+57 (608) 265 1100',
    badge: 'Tienda Oficial'
  },
  {
    id: 'cucuta-diagonal',
    nombre: 'Pintuco Cúcuta Diagonal Santander',
    departamento: 'Norte de Santander',
    ciudad: 'Cúcuta',
    direccion: 'Diagonal Santander No. 3-80',
    horario: 'Lunes a Sábado 7:30 am - 6:00 pm',
    telefono: '+57 (607) 571 9000',
    badge: 'Tienda Insignia'
  },
  {
    id: 'villavo-centro',
    nombre: 'Pintuco Villavicencio Llano Lindo',
    departamento: 'Meta',
    ciudad: 'Villavicencio',
    direccion: 'Avenida 40 No. 26-15, Sector Llano Lindo',
    horario: 'Lunes a Sábado 7:30 am - 6:00 pm',
    telefono: '+57 (608) 668 4000',
    badge: 'Tienda Oficial'
  },
  {
    id: 'santamarta-ferrocarril',
    nombre: 'Pintuco Santa Marta Ferrocarril',
    departamento: 'Magdalena',
    ciudad: 'Santa Marta',
    direccion: 'Avenida del Ferrocarril No. 22-18',
    horario: 'Lunes a Sábado 7:30 am - 6:00 pm',
    telefono: '+57 (605) 421 9500',
    badge: 'Tienda Oficial'
  },
  {
    id: 'pasto-panam',
    nombre: 'Pintuco Pasto Panamericana',
    departamento: 'Nariño',
    ciudad: 'Pasto',
    direccion: 'Calle 18 No. 24-30, Vía Panamericana',
    horario: 'Lunes a Sábado 8:00 am - 5:30 pm',
    telefono: '+57 (602) 723 8000',
    badge: 'Tienda Oficial'
  }
];

export function getAvailableStoresForLocation(departamento: string, ciudad: string): PintucoPickupStoreLocation[] {
  const normCity = (ciudad || '').toLowerCase().trim();
  const normDepto = (departamento || '').toLowerCase().trim();

  // 1. Coincidencia por ciudad
  const cityMatches = PINTUCO_PICKUP_STORES.filter(s => 
    s.ciudad.toLowerCase().includes(normCity) || normCity.includes(s.ciudad.toLowerCase())
  );
  if (cityMatches.length > 0) return cityMatches;

  // 2. Coincidencia por departamento
  const deptoMatches = PINTUCO_PICKUP_STORES.filter(s => 
    s.departamento.toLowerCase().includes(normDepto) || normDepto.includes(s.departamento.toLowerCase())
  );
  if (deptoMatches.length > 0) return deptoMatches;

  // 3. Generación de punto autorizado oficial para cualquier otro municipio
  return [
    {
      id: `pintuco-${normCity || 'local'}-centro`,
      nombre: `Punto de Venta Autorizado Pintuco - ${ciudad || 'Ciudad'} Centro`,
      departamento: departamento || 'Nacional',
      ciudad: ciudad || 'Centro',
      direccion: `Sector Comercial Principal / Parque Central, ${ciudad}`,
      horario: 'Lunes a Sábado 8:00 am - 5:30 pm',
      telefono: 'Línea Directa Pintuco: 01 8000 111 247',
      badge: 'Distribuidor Autorizado'
    }
  ];
}

// ============================================================================
// CARTAS DE COLOR DINÁMICAS SEGÚN TIPO DE PINTURA PINTUCO
// ============================================================================

// 1. VINILTEX: Tonos pastel, neutros y vivos de interior (Norma NTC 1335)
export const VINILTEX_INTERIOR_PALETTE: ColorPaletteItem[] = [
  // Tonos Neutros y Clásicos
  { name: 'Blanco Puro Mate 1001', code: '1001', shortName: 'Blanco Puro', hex: '#F9FAFB', category: 'Clásicos', acabado: 'Mate', lrv: 88, description: 'Máxima luminosidad y amplitud espacial interior.' },
  { name: 'Blanco Almendra Satinado 1020', code: '1020', shortName: 'Blanco Almendra', hex: '#F4EFEA', category: 'Clásicos', acabado: 'Satinado', lrv: 82, description: 'Calidez sutil con destellos marfil acogedor.' },
  { name: 'Gris Niebla Mate 7035', code: '7035', shortName: 'Gris Niebla', hex: '#CBD5E1', category: 'Modernos', acabado: 'Mate', lrv: 62, description: 'Tono neutro balanceado para salas y alcobas.' },
  { name: 'Gris Basalto Satinado 7012', code: '7012', shortName: 'Gris Basalto', hex: '#4A5568', category: 'Modernos', acabado: 'Satinado', lrv: 26, description: 'Gris arquitectónico de alta presencia para muros de acento.' },
  { name: 'Arena Cálida 1023', code: '1023', shortName: 'Arena Cálida', hex: '#E2D9C8', category: 'Tierras', acabado: 'Mate', lrv: 67, description: 'Inspirado en sedimentos naturales y calma orgánica.' },

  // Tonos Pastel Suaves de Interior
  { name: 'Vainilla Pastel 1015', code: '1015', shortName: 'Vainilla Pastel', hex: '#FEF3C7', category: 'Clásicos', acabado: 'Mate', lrv: 84, description: 'Tono pastel cálido, ilumina espacios reducidos.' },
  { name: 'Menta Suave Pastel 6019', code: '6019', shortName: 'Menta Pastel', hex: '#D1FAE5', category: 'Naturales', acabado: 'Mate', lrv: 76, description: 'Frescura botánica pastel para descanso y armonía.' },
  { name: 'Azul Celeste Fresco 5012', code: '5012', shortName: 'Azul Celeste', hex: '#93C5FD', category: 'Acentos', acabado: 'Mate', lrv: 60, description: 'Sensación de cielo despejado y ligereza.' },
  { name: 'Rosa Palo Suave 3015', code: '3015', shortName: 'Rosa Palo', hex: '#FBCFE8', category: 'Acentos', acabado: 'Mate', lrv: 70, description: 'Delicadeza moderna para recámaras y espacios infantiles.' },
  { name: 'Lila Lavanda 4005', code: '4005', shortName: 'Lila Lavanda', hex: '#E9D5FF', category: 'Acentos', acabado: 'Mate', lrv: 72, description: 'Sensación relajante y creativa para estudios.' },

  // Tonos Vivos y Acentos de Interior
  { name: 'Amarillo Canario Vivo 1018', code: '1018', shortName: 'Amarillo Canario', hex: '#FBBF24', category: 'Vibrantes', acabado: 'Semibrillante', lrv: 55, description: 'Energía solar y vitalidad activa.' },
  { name: 'Azul Caribe Vivo 5015', code: '5015', shortName: 'Azul Caribe', hex: '#2481A6', category: 'Vibrantes', acabado: 'Satinado', lrv: 35, description: 'Tono vibrante icónico de alta energía arquitectónica.' },
  { name: 'Verde Manzana Vivo 6018', code: '6018', shortName: 'Verde Manzana', hex: '#4ADE80', category: 'Vibrantes', acabado: 'Semibrillante', lrv: 52, description: 'Impacto fresco y vital para zonas familiares.' },
  { name: 'Naranja Mandarina Vivo 2004', code: '2004', shortName: 'Naranja Vivo', hex: '#FB923C', category: 'Vibrantes', acabado: 'Satinado', lrv: 44, description: 'Calidez dinámica y confort estimulante.' },
  { name: 'Verde Salvia Calm 6021', code: '6021', shortName: 'Verde Salvia', hex: '#A3B18A', category: 'Naturales', acabado: 'Mate', lrv: 48, description: 'Tono botánico atenuado con matiz nórdico.' },
  { name: 'Verde Bosque Andino 6005', code: '6005', shortName: 'Verde Bosque', hex: '#14532D', category: 'Naturales', acabado: 'Satinado', lrv: 12, description: 'Riqueza vegetal andina de máxima sofisticación.' },
  { name: 'Azul Océano Profundo 5003', code: '5003', shortName: 'Azul Océano', hex: '#1E3A8A', category: 'Acentos', acabado: 'Semibrillante', lrv: 14, description: 'Elegancia sobria de gran profundidad marina.' },
  { name: 'Negro Ébano Mate 9005', code: '9005', shortName: 'Negro Ébano', hex: '#1E293B', category: 'Contemporáneos', acabado: 'Mate', lrv: 6, description: 'Profundidad moderna y contraste contemporáneo.' },
];

// 2. KORAZA: Tonos de alta resistencia exterior e intemperie (Protección Solar y Lluvia)
export const KORAZA_EXTERIOR_PALETTE: ColorPaletteItem[] = [
  { name: 'Blanco Ostra Exterior 1013', code: '1013', shortName: 'Blanco Ostra', hex: '#F5F5F0', category: 'Clásicos', acabado: 'Mate', lrv: 85, description: 'Blanco hidrorrepelente con filtro solar UV para fachadas.' },
  { name: 'Arena Colonial Intemperie 1024', code: '1024', shortName: 'Arena Colonial', hex: '#D8CBB5', category: 'Tierras', acabado: 'Mate', lrv: 64, description: 'Tono tierra mineral resistente a la salinidad y polución.' },
  { name: 'Gris Piedra Fachada 7038', code: '7038', shortName: 'Gris Piedra', hex: '#9CA3AF', category: 'Modernos', acabado: 'Mate', lrv: 46, description: 'Gris natural exterior, oculta la polución y suciedad ambiental.' },
  { name: 'Gris Grafito Exterior 7024', code: '7024', shortName: 'Gris Grafito', hex: '#374151', category: 'Modernos', acabado: 'Satinado', lrv: 22, description: 'Gris oscuro arquitectónico de alta resistencia a la intemperie.' },
  { name: 'Terracota Colonial Resistente 3016', code: '3016', shortName: 'Terracota Colonial', hex: '#B45309', category: 'Tierras', acabado: 'Satinado', lrv: 24, description: 'Arcilla horneada tradicional para fachadas y balcones.' },
  { name: 'Ocre Andino Fachadas 1006', code: '1006', shortName: 'Ocre Andino', hex: '#C27803', category: 'Tierras', acabado: 'Mate', lrv: 34, description: 'Pigmento mineral terroso con alta solidez a la radiación solar.' },
  { name: 'Ladrillo Clásico Exterior 3009', code: '3009', shortName: 'Ladrillo Clásico', hex: '#881337', category: 'Tierras', acabado: 'Satinado', lrv: 18, description: 'Rojo rústico tradicional para exteriores y cerramientos.' },
  { name: 'Verde Oliva Campestre 6003', code: '6003', shortName: 'Verde Oliva', hex: '#4D5D43', category: 'Naturales', acabado: 'Mate', lrv: 28, description: 'Verde campero resistente a hongos y humedad exterior.' },
  { name: 'Marrón Tabaco Fachada 8011', code: '8011', shortName: 'Marrón Tabaco', hex: '#5A3825', category: 'Tierras', acabado: 'Mate', lrv: 15, description: 'Marrón profundo para molduras, zócalos y muros expuestos.' },
  { name: 'Azul Colonial Balcones 5001', code: '5001', shortName: 'Azul Colonial', hex: '#1E3A5F', category: 'Acentos', acabado: 'Satinado', lrv: 16, description: 'Azul tradicional para chambranas, dinteles y fachadas coloniales.' },
  { name: 'Café Colonial Techo 8017', code: '8017', shortName: 'Café Colonial', hex: '#382216', category: 'Tierras', acabado: 'Mate', lrv: 10, description: 'Tono café oscuro para remates y muros de fachada.' },
  { name: 'Trigo Dorado Intemperie 1002', code: '1002', shortName: 'Trigo Dorado', hex: '#E2BF7D', category: 'Tierras', acabado: 'Mate', lrv: 58, description: 'Calidez dorada exterior con excelente estabilidad lumínica.' },
];

// 3. PINTULUX / ESMALTE: Colores brillante / semibrillante específicos para metales y maderas
export const PINTULUX_ESMALTE_PALETTE: ColorPaletteItem[] = [
  { name: 'Blanco Puro Brillante E-100', code: 'E-100', shortName: 'Blanco Puro', hex: '#FFFFFF', category: 'Clásicos', acabado: 'Brillante', lrv: 90, description: 'Línea directa de fábrica con alto brillo y nivelación para metales.' },
  { name: 'Negro Ébano Brillante E-900', code: 'E-900', shortName: 'Negro Ébano', hex: '#111827', category: 'Contemporáneos', acabado: 'Brillante', lrv: 5, description: 'Esmalte negro profundo para rejas, portones y tuberías.' },
  { name: 'Gris Perla Maquinaria E-700', code: 'E-700', shortName: 'Gris Perla', hex: '#6B7280', category: 'Modernos', acabado: 'Brillante', lrv: 45, description: 'Tono industrial estándar para perfiles y estructuras.' },
  { name: 'Gris Carbón Semibrillante E-750', code: 'E-750', shortName: 'Gris Carbón', hex: '#374151', category: 'Modernos', acabado: 'Semibrillante', lrv: 22, description: 'Acabado semibrillante contemporáneo de alta dureza.' },
  { name: 'Rojo Colonial Brillante E-300', code: 'E-300', shortName: 'Rojo Colonial', hex: '#B91C1C', category: 'Tierras', acabado: 'Brillante', lrv: 22, description: 'Color tradicional para barandas, carpintería metálica y techos.' },
  { name: 'Azul Real Brillante E-501', code: 'E-501', shortName: 'Azul Real', hex: '#1D4ED8', category: 'Acentos', acabado: 'Brillante', lrv: 18, description: 'Tono corporativo vibrante de gran poder cubriente.' },
  { name: 'Verde Máquina Brillante E-600', code: 'E-600', shortName: 'Verde Máquina', hex: '#15803D', category: 'Naturales', acabado: 'Brillante', lrv: 20, description: 'Verde bosque industrial para cercas, motores y rejas.' },
  { name: 'Amarillo Seguridad Brillante E-101', code: 'E-101', shortName: 'Amarillo Seguridad', hex: '#EAB308', category: 'Vibrantes', acabado: 'Brillante', lrv: 50, description: 'Color preventivo para barandas, escaleras y demarcación.' },
  { name: 'Aluminio Brillante E-500', code: 'E-500', shortName: 'Aluminio', hex: '#94A3B8', category: 'Modernos', acabado: 'Brillante', lrv: 58, description: 'Pigmentación metálica anticorrosiva de alta reflectividad.' },
  { name: 'Caoba Maderas Semibrillante E-310', code: 'E-310', shortName: 'Caoba Semibrillante', hex: '#6B271A', category: 'Tierras', acabado: 'Semibrillante', lrv: 16, description: 'Tono rojizo elegante para puertas, marcos y maderas tratadas.' },
  { name: 'Bronce Colonial E-450', code: 'E-450', shortName: 'Bronce Colonial', hex: '#78350F', category: 'Tierras', acabado: 'Semibrillante', lrv: 20, description: 'Bronce decorativo para forja, cancelería y faroles.' },
  { name: 'Tabaco Maderas Semibrillante E-820', code: 'E-820', shortName: 'Tabaco Semibrillante', hex: '#451A03', category: 'Contemporáneos', acabado: 'Semibrillante', lrv: 9, description: 'Tono marrón profundo satinado para carpintería de madera y metal.' }
];

export const MADERA_BARNICES_PALETTE: ColorPaletteItem[] = [
  { name: 'Natural / Incoloro M-01', code: 'M-01', shortName: 'Natural', hex: '#E5D0B1', category: 'Naturales', acabado: 'Brillante', lrv: 65, description: 'Resalta la veta original sin alterar el color base de la madera.' },
  { name: 'Cedro Tradicional M-02', code: 'M-02', shortName: 'Cedro', hex: '#A0522D', category: 'Tierras', acabado: 'Satinado', lrv: 35, description: 'Tono rojizo cálido clásico para puertas y marcos.' },
  { name: 'Caoba Real M-03', code: 'M-03', shortName: 'Caoba', hex: '#8B2500', category: 'Tierras', acabado: 'Brillante', lrv: 20, description: 'Elegancia clásica profunda con matices vino tinto.' },
  { name: 'Teca Maderas Tropicales M-04', code: 'M-04', shortName: 'Teca', hex: '#8B5A2B', category: 'Tierras', acabado: 'Satinado', lrv: 28, description: 'Especial para decks, muebles de terraza y maderas expuestas al sol.' },
  { name: 'Caramel / Roble Claro M-05', code: 'M-05', shortName: 'Caramel', hex: '#C68B59', category: 'Clásicos', acabado: 'Satinado', lrv: 42, description: 'Miel ambarino suave para interiores nórdicos.' },
  { name: 'Wengué Contemporáneo M-06', code: 'M-06', shortName: 'Wengué', hex: '#3E2723', category: 'Contemporáneos', acabado: 'Mate', lrv: 8, description: 'Marrón café casi negro para ebanistería moderna.' }
];

export const EPOXICOS_TRAFICO_PALETTE: ColorPaletteItem[] = [
  { name: 'Amarillo Tráfico Vial NTC 1360', code: 'T-10', shortName: 'Amarillo Tráfico', hex: '#FACC15', category: 'Vibrantes', acabado: 'Mate', lrv: 55, description: 'Demarcación de doble línea, zonas de parqueo y líneas divisorias.' },
  { name: 'Blanco Señalización Vial T-01', code: 'T-01', shortName: 'Blanco Tráfico', hex: '#F8FAFC', category: 'Clásicos', acabado: 'Mate', lrv: 85, description: 'Paso de cebras peatonales, flechas de giro y bordes de vía.' },
  { name: 'Gris Concreto Pavimento T-70', code: 'T-70', shortName: 'Gris Pavimento', hex: '#4B5563', category: 'Modernos', acabado: 'Mate', lrv: 30, description: 'Fondos de canchas, pisos de bodegas y talleres mecánicos.' },
  { name: 'Verde Seguridad Industrial T-60', code: 'T-60', shortName: 'Verde Seguridad', hex: '#16A34A', category: 'Naturales', acabado: 'Mate', lrv: 25, description: 'Rutas de evacuación, zonas seguras y ciclorrutas.' },
  { name: 'Azul Discapacidad Reglamentario T-50', code: 'T-50', shortName: 'Azul Accesibilidad', hex: '#2563EB', category: 'Acentos', acabado: 'Mate', lrv: 22, description: 'Parqueaderos y rampas para personas con movilidad reducida.' },
  { name: 'Negro Demarcación T-90', code: 'T-90', shortName: 'Negro Borrado', hex: '#0F172A', category: 'Contemporáneos', acabado: 'Mate', lrv: 6, description: 'Cubrimiento de líneas antiguas y demarcación de contraste.' }
];

export const IMPERMEABILIZANTES_PALETTE: ColorPaletteItem[] = [
  { name: 'Blanco Térmico Ultra Reflectivo AQ-01', code: 'AQ-01', shortName: 'Blanco Térmico', hex: '#FFFFFF', category: 'Clásicos', acabado: 'Mate', lrv: 92, description: 'Alta reflectividad de rayos solares, reduce la temperatura interior.' },
  { name: 'Gris Cemento Impermeable AQ-70', code: 'AQ-70', shortName: 'Gris Cemento', hex: '#64748B', category: 'Modernos', acabado: 'Mate', lrv: 35, description: 'Integración estética con losas de concreto y placas de terraza.' },
  { name: 'Rojo Teja Colonial AQ-30', code: 'AQ-30', shortName: 'Rojo Teja', hex: '#991B1B', category: 'Tierras', acabado: 'Mate', lrv: 22, description: 'Impermeabilización de cubiertas, tejas de barro y fibrocemento.' },
  { name: 'Verde Terraza AQ-60', code: 'AQ-60', shortName: 'Verde Terraza', hex: '#15803D', category: 'Naturales', acabado: 'Mate', lrv: 24, description: 'Cubiertas transitables y terrazas ajardinadas.' },
  { name: 'Incoloro Bloqueador AQ-00', code: 'AQ-00', shortName: 'Incoloro', hex: '#F1F5F9', category: 'Clásicos', acabado: 'Mate', lrv: 80, description: 'Sellado hidrófugo sin alterar la apariencia del ladrillo o piedra.' }
];

// Re-exportaciones compatibles
export const VINILOS_AGUA_PALETTE = VINILTEX_INTERIOR_PALETTE;
export const ESMALTES_ANTICORROSIVOS_PALETTE = PINTULUX_ESMALTE_PALETTE;

/**
 * Obtiene la paleta de colores reactiva correspondiente a un producto Pintuco
 */
export function getPaletteForProductName(productName: string): ColorPaletteItem[] {
  const p = (productName || '').toLowerCase();
  if (p.includes('koraza')) return KORAZA_EXTERIOR_PALETTE;
  if (p.includes('pintulux') || p.includes('esmalte') || p.includes('anticorrosivo')) return PINTULUX_ESMALTE_PALETTE;
  if (p.includes('tráfico') || p.includes('trafico')) return EPOXICOS_TRAFICO_PALETTE;
  if (p.includes('madera') || p.includes('barniz') || p.includes('tinte')) return MADERA_BARNICES_PALETTE;
  if (p.includes('aquablock') || p.includes('impermeabiliz') || p.includes('fill')) return IMPERMEABILIZANTES_PALETTE;
  return VINILTEX_INTERIOR_PALETTE;
}

export function getPaintPrices(productName: string): { galon: number; cunete: number } {
  const p = (productName || '').toLowerCase();
  if (p.includes('altos sólidos') || p.includes('hospitalario')) return { galon: 165000, cunete: 759000 };
  if (p.includes('siliconada')) return { galon: 158000, cunete: 726800 };
  if (p.includes('pintucoat') || p.includes('epóxico') || p.includes('epoxico')) return { galon: 148000, cunete: 620000 };
  if (p.includes('antialgas')) return { galon: 134000, cunete: 616400 };
  if (p.includes('techos') || (p.includes('aquablock') && p.includes('membrana'))) return { galon: 128900, cunete: 592900 };
  if (p.includes('5 a') || p.includes('5 años') || p.includes('5a')) return { galon: 119900, cunete: 551500 };
  if (p.includes('tráfico') || p.includes('trafico')) {
    if (p.includes('agua')) return { galon: 112000, cunete: 515200 };
    return { galon: 119000, cunete: 499000 };
  }
  if (p.includes('canchas') || p.includes('antideslizante')) return { galon: 108900, cunete: 500900 };
  if (p.includes('aquablock')) return { galon: 104900, cunete: 459000 };
  if (p.includes('doble vida') || p.includes('sol & lluvia') || p.includes('sol y lluvia') || p.includes('tradicional') || p.includes('koraza')) {
    return { galon: 98900, cunete: 429000 };
  }
  if (p.includes('antiviral')) return { galon: 95900, cunete: 441000 };
  if (p.includes('fibrado')) return { galon: 94500, cunete: 434700 };
  if (p.includes('acriltex')) return { galon: 92500, cunete: 399000 };
  if (p.includes('vida') || p.includes('luz')) return { galon: 92500, cunete: 425500 };
  if (p.includes('deck')) return { galon: 89900, cunete: 413500 };
  if (p.includes('baños') || p.includes('banos') || p.includes('cocina')) return { galon: 89900, cunete: 389000 };
  if (p.includes('seda')) return { galon: 87900, cunete: 404300 };
  if (p.includes('marino') || p.includes('laca catalizada')) return { galon: 86500, cunete: 397900 };
  if (p.includes('madera') || p.includes('barniz')) return { galon: 82900, cunete: 355000 };
  if (p.includes('acua') || (p.includes('pintulux') && p.includes('agua'))) return { galon: 91900, cunete: 389000 };
  if (p.includes('corrostyl') || p.includes('zinc')) return { galon: 76500, cunete: 329000 };
  if (p.includes('pintulux') || p.includes('esmalte')) {
    if (p.includes('doméstico') || p.includes('domestico')) return { galon: 58900, cunete: 270900 };
    return { galon: 84900, cunete: 369000 };
  }
  if (p.includes('fill')) return { galon: 69900, cunete: 299000 };
  if (p.includes('imprimante') || p.includes('50/50')) return { galon: 62900, cunete: 269000 };
  if (p.includes('cielos')) return { galon: 54900, cunete: 239000 };
  if (p.includes('estandar') || p.includes('estándar')) return { galon: 46900, cunete: 215700 };
  if (p.includes('intervinil')) return { galon: 49900, cunete: 229500 };
  if (p.includes('estuco')) return { galon: 42900, cunete: 197300 };
  return { galon: 79900, cunete: 349000 };
}

export function getSkuForPaint(productName: string, type: 'cunete' | 'galon'): string {
  const p = (productName || '').toLowerCase();
  const suffix = type === 'cunete' ? 'CUN-05' : 'GAL-01';
  if (p.includes('siliconada')) return `PIN-KRZ-SIL-${suffix}`;
  if (p.includes('koraza')) return `PIN-KRZ-${suffix}`;
  if (p.includes('baños') || p.includes('banos')) return `PIN-VTX-BC-${suffix}`;
  if (p.includes('acriltex')) return `PIN-VTX-ACR-${suffix}`;
  if (p.includes('vida') || p.includes('luz')) return `PIN-VTX-VL-${suffix}`;
  if (p.includes('cielos')) return `CIN-INT-CIE-${suffix}`;
  if (p.includes('intervinil')) return `CIN-INT-${suffix}`;
  if (p.includes('corrostyl') || p.includes('zinc')) return `PIN-CORR-${suffix}`;
  if (p.includes('acua') || (p.includes('pintulux') && p.includes('agua'))) return `PIN-PLX-ACU-${suffix}`;
  if (p.includes('pintulux') || p.includes('esmalte')) return `PIN-PLX-${suffix}`;
  if (p.includes('fill')) return `PIN-AQB-FIL-${suffix}`;
  if (p.includes('aquablock')) return `PIN-AQB-${suffix}`;
  if (p.includes('epóxico') || p.includes('epoxico') || p.includes('pintucoat')) return `PIN-PCOAT-${suffix}`;
  if (p.includes('tráfico') || p.includes('trafico')) return `PIN-TRF-${suffix}`;
  if (p.includes('madera') || p.includes('barniz')) return `PIN-MAD-${suffix}`;
  return `PIN-VTX-${suffix}`;
}

export function getImageUrlForPaint(productName: string): string {
  const p = (productName || '').toLowerCase();
  if (p.includes('koraza')) return '/src/assets/images/koraza_bucket_studio_1790894419359.jpg';
  if (p.includes('aquablock') || p.includes('fill')) return '/src/assets/images/koraza_bucket_studio_1790894419359.jpg';
  if (p.includes('tráfico') || p.includes('trafico')) return '/src/assets/images/pintutrafico_bucket_studio_1790894438735.jpg';
  if (p.includes('pintulux') || p.includes('esmalte') || p.includes('corrostyl')) return '/src/assets/images/pintulux_enamel_can_1790894428353.jpg';
  return '/src/assets/images/viniltex_can_studio_1790894409491.jpg';
}

export function getSwatchHex(colorName: string, productName?: string): string {
  const pal = productName ? getPaletteForProductName(productName) : VINILTEX_INTERIOR_PALETTE;
  const match = pal.find(c => c.name === colorName || (colorName && colorName.includes(c.code)) || c.code === colorName);
  if (match) return match.hex;
  const matchGlobal = COLOR_PALETTE.find(c => c.name === colorName);
  if (matchGlobal) return matchGlobal.hex;
  return '#E2E8F0';
}

export function getPaintCategoryInfo(productName: string) {
  const prod = (productName || '').toLowerCase();
  if (prod.includes('koraza')) {
    return {
      type: 'koraza',
      label: 'Koraza Clima Extremo (Fachadas y Exteriores)',
      paintLineName: 'Koraza Doble Vida Protección Clima Extremo',
      palette: KORAZA_EXTERIOR_PALETTE,
      allowsCustomTinting: true,
      badgeText: 'Fachadas y Muros Exteriores',
      badgeColor: 'bg-blue-100 text-[#004B93] border-blue-200',
      restrictionNotice: undefined as string | undefined,
    };
  }
  if (prod.includes('pintulux') || prod.includes('esmalte') || prod.includes('anticorrosivo')) {
    return {
      type: 'pintulux',
      label: 'Pintulux Esmalte Sintético Anticorrosivo',
      paintLineName: 'Pintulux / Esmaltes Metálicos y Madera',
      palette: PINTULUX_ESMALTE_PALETTE,
      allowsCustomTinting: false,
      badgeText: 'Metales, Carpintería y Maderas',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
      restrictionNotice: '⚠️ Los esmaltes sintéticos alquídicos manejan colores estándar de fábrica de secado rápido. No aplican para mezcla tintométrica Color In de vinilos de agua.'
    };
  }
  if (prod.includes('aquablock') || prod.includes('impermeabiliz') || prod.includes('fill')) {
    return {
      type: 'aquablock',
      label: 'Aquablock Antihumedad e Impermeabilizantes',
      paintLineName: 'Aquablock Bloqueador / Sellador Fibrado',
      palette: IMPERMEABILIZANTES_PALETTE,
      allowsCustomTinting: false,
      badgeText: 'Protección Contra Filtraciones y Humedad',
      badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-200',
      restrictionNotice: '⚠️ Las formulaciones elastoméricas e impermeabilizantes utilizan pigmentos de alta densidad y colores de barrera solar estándar.'
    };
  }
  if (prod.includes('tráfico') || prod.includes('trafico')) {
    return {
      type: 'trafico',
      label: 'Pintutráfico Vías y Señalización Industrial',
      paintLineName: 'Pintutráfico Base Solvente Alto Tráfico',
      palette: EPOXICOS_TRAFICO_PALETTE,
      allowsCustomTinting: false,
      badgeText: 'Demarcación Vial y Tráfico Pesado',
      badgeColor: 'bg-yellow-100 text-yellow-950 border-yellow-300',
      restrictionNotice: '⚠️ Las pinturas para demarcación vial y pisos industriales utilizan únicamente colores reglamentarios de fábrica. La preparación tintométrica no está habilitada.'
    };
  }
  if (prod.includes('madera') || prod.includes('barniz') || prod.includes('tinte')) {
    return {
      type: 'madera',
      label: 'Línea Maderas, Tintes y Barnices Pintuco',
      paintLineName: 'Madetec Barniz Uretanado y Tintes',
      palette: MADERA_BARNICES_PALETTE,
      allowsCustomTinting: false,
      badgeText: 'Maderas Naturales y Pérgolas',
      badgeColor: 'bg-orange-100 text-orange-950 border-orange-200',
      restrictionNotice: undefined as string | undefined,
    };
  }
  return {
    type: 'viniltex',
    label: 'Viniltex y Vinilos Interiores Base Agua (Tipo 1)',
    paintLineName: 'Viniltex Avanzado Máxima Lavabilidad',
    palette: VINILTEX_INTERIOR_PALETTE,
    allowsCustomTinting: true,
    badgeText: 'Interiores y Paredes Lavables',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    restrictionNotice: undefined as string | undefined,
  };
}

export interface CotizadorPaintItem {
  id: string;
  nombre: string;
  titulo: string;
  subtitulo: string;
  icono: string;
  familia: string;
  precioGalon: number;
  precioCunete: number;
  area_m2: number;
  color_acabado: string;
  badge: string;
  tag: string;
  tagColor: string;
  descripcion: string;
  editedCunetes?: number;
  editedGalones?: number;
}

export interface CalculatedProductItem {
  id: string;
  paintId: string;
  type: 'cunete' | 'galon' | 'sellador' | 'herramienta';
  productName: string;
  displayName: string;
  presentation: 'Cuñete (5 Gal)' | 'Galón' | 'Unidad' | 'Caneca' | 'Cuarto (1/4 Gal)';
  quantity: number;
  unitPrice: number;
  color: string;
  colorHex: string;
  sku: string;
  imagenUrl: string;
  area_m2?: number;
}

// ============================================================================
// ATAJOS FRECUENTES DE ESPACIOS (AMPLIADOS SEGÚN REQUERIMIENTOS)
// ============================================================================
export interface SpaceShortcutItem {
  id: string;
  label: string;
  area: number;
  desc: string;
  icon: string;
  ambiente: string;
  superficie: SuperficieTipo;
  producto: string;
}

export const SPACE_SHORTCUTS: SpaceShortcutItem[] = [
  {
    id: 'interiores',
    label: 'Interiores / Habitación',
    area: 35,
    desc: 'Salas, alcobas y muros estándar',
    icon: '🏠',
    ambiente: 'Interior',
    superficie: 'Pañete / Revoque Liso',
    producto: 'Viniltex Avanzado Máxima Lavabilidad'
  },
  {
    id: 'fachadas',
    label: 'Fachadas y Exteriores',
    area: 120,
    desc: 'Muros intemperie y clima extremo',
    icon: '🏢',
    ambiente: 'Exterior Fachada',
    superficie: 'Mampostería',
    producto: 'Koraza Máxima Protección Clima Extremo'
  },
  {
    id: 'pisos',
    label: 'Pisos y Concreto',
    area: 60,
    desc: 'Alto tráfico, canchas, garajes y bodegas',
    icon: '🧱',
    ambiente: 'Industrial / Pisos',
    superficie: 'Concreto Vaciado',
    producto: 'Pintutráfico Base Solvente Alto Desempeño'
  },
  {
    id: 'impermeabilizacion',
    label: 'Impermeabilización / Techos',
    area: 45,
    desc: 'Goteras, terrazas, tanques y humedad',
    icon: '💧',
    ambiente: 'Techos / Cielorrasos',
    superficie: 'Mampostería',
    producto: 'Aquablock Sellador Antihumedad Bloqueador'
  },
  {
    id: 'madera',
    label: 'Madera y Carpintería',
    area: 25,
    desc: 'Muebles, puertas, pérgolas y decks',
    icon: '🪑',
    ambiente: 'Interior',
    superficie: 'Madera',
    producto: 'Pintulux Esmalte Sintético Anticorrosivo'
  },
  {
    id: 'metal',
    label: 'Estructuras Metálicas / Anticorrosivo',
    area: 20,
    desc: 'Rejas, portones, perfiles y tuberías',
    icon: '⚙️',
    ambiente: 'Exterior Fachada',
    superficie: 'Metal / Estructura',
    producto: 'Pintulux Esmalte Sintético Anticorrosivo'
  },
  {
    id: 'otro',
    label: 'Otro / Proyecto Personalizado',
    area: 50,
    desc: 'Describe tu proyecto o espacio especial',
    icon: '➕',
    ambiente: 'Otro / Proyecto Personalizado',
    superficie: 'Pintura Existente',
    producto: 'Viniltex Avanzado Máxima Lavabilidad'
  }
];

// ============================================================================
// ATAJOS DE METRAJE DIRECTOS SEGÚN CATEGORÍA (PASO 2)
// ============================================================================
export interface AreaShortcutItem {
  id: string;
  label: string;
  area: number;
  desc: string;
}

export function getAreaShortcutsForContext(ambiente: string, superficie: string): { categoryTitle: string; shortcuts: AreaShortcutItem[] } {
  const amb = (ambiente || '').toLowerCase();
  const sup = (superficie || '').toLowerCase();

  // 1. Madera y Carpintería
  if (sup.includes('madera')) {
    return {
      categoryTitle: 'Madera y Carpintería',
      shortcuts: [
        { id: 'mad-1', label: 'Puertas y Marcos', area: 6, desc: '2 a 3 puertas con marcos (~6 m²)' },
        { id: 'mad-2', label: 'Muebles / Pérgola', area: 15, desc: 'Mueblería o pérgola (~15 m²)' },
        { id: 'mad-3', label: 'Deck Exterior', area: 25, desc: 'Piso o balcón de madera (~25 m²)' },
        { id: 'mad-4', label: 'Techo Machihembrado', area: 60, desc: 'Cielo raso y vigas (~60 m²)' },
      ]
    };
  }

  // 2. Estructuras Metálicas / Anticorrosivo
  if (sup.includes('metal')) {
    return {
      categoryTitle: 'Estructuras Metálicas',
      shortcuts: [
        { id: 'met-1', label: 'Rejas y Ventanas', area: 8, desc: 'Rejas de seguridad (~8 m²)' },
        { id: 'met-2', label: 'Portón Vehicular', area: 20, desc: 'Portón y cerramiento frontal (~20 m²)' },
        { id: 'met-3', label: 'Estructura Mediana', area: 45, desc: 'Marquesina o cerchas (~45 m²)' },
        { id: 'met-4', label: 'Cubierta Metálica', area: 100, desc: 'Vigas y nave estructural (~100 m²)' },
      ]
    };
  }

  // 3. Fachadas y Exteriores
  if (amb.includes('exterior') || amb.includes('fachada')) {
    return {
      categoryTitle: 'Fachadas y Exteriores',
      shortcuts: [
        { id: 'fac-1', label: 'Fachada Casa 1 Piso', area: 40, desc: 'Frontis unifamiliar (~40 m²)' },
        { id: 'fac-2', label: 'Fachada Casa 2 Pisos', area: 80, desc: 'Frontal y lateral (~80 m²)' },
        { id: 'fac-3', label: 'Edificio / Conjunto', area: 150, desc: 'Fachada de edificio (~150 m²)' },
        { id: 'fac-4', label: 'Gran Fachada / Proyecto', area: 300, desc: 'Muros perimetrales (~300 m²)' },
      ]
    };
  }

  // 4. Pisos y Concreto
  if (amb.includes('piso') || amb.includes('industrial')) {
    return {
      categoryTitle: 'Pisos y Concreto',
      shortcuts: [
        { id: 'pis-1', label: 'Garaje / Parqueadero', area: 20, desc: '1 parqueadero individual (~20 m²)' },
        { id: 'pis-2', label: 'Taller / Local Mediano', area: 50, desc: 'Piso de alto tráfico (~50 m²)' },
        { id: 'pis-3', label: 'Cancha Deportiva', area: 120, desc: 'Cancha o parqueaderos (~120 m²)' },
        { id: 'pis-4', label: 'Bodega Industrial', area: 300, desc: 'Planta de almacenamiento (~300 m²)' },
      ]
    };
  }

  // 5. Impermeabilización / Techos
  if (amb.includes('techo') || amb.includes('impermeabiliz')) {
    return {
      categoryTitle: 'Impermeabilización / Techos',
      shortcuts: [
        { id: 'imp-1', label: 'Terraza / Balcón', area: 15, desc: 'Zona de ropas o balcón (~15 m²)' },
        { id: 'imp-2', label: 'Placa Residencial', area: 45, desc: 'Losa de casa estándar (~45 m²)' },
        { id: 'imp-3', label: 'Cubierta Amplia', area: 90, desc: 'Techo completo (~90 m²)' },
        { id: 'imp-4', label: 'Gran Cubierta / Bodega', area: 200, desc: 'Cubierta gran formato (~200 m²)' },
      ]
    };
  }

  // 6. Interiores (Default o seleccionado en Paso 1)
  if (amb.includes('interior')) {
    return {
      categoryTitle: 'Interiores',
      shortcuts: [
        { id: 'int-1', label: 'Habitación pequeña', area: 15, desc: 'Estudio o dormitorio individual (~15 m²)' },
        { id: 'int-2', label: 'Apartamento Estándar', area: 35, desc: 'Sala comedor o 2 alcobas (~35 m²)' },
        { id: 'int-3', label: 'Casa / Área Grande', area: 80, desc: 'Vivienda completa o local (~80 m²)' },
        { id: 'int-4', label: 'Proyecto Inmobiliario', area: 150, desc: 'Obra multifamiliar extensa (~150 m²)' },
      ]
    };
  }

  // 7. Proyecto Personalizado / General
  return {
    categoryTitle: 'Proyecto Personalizado',
    shortcuts: [
      { id: 'gen-1', label: 'Área Pequeña', area: 15, desc: 'Espacio reducido o retoque (~15 m²)' },
      { id: 'gen-2', label: 'Área Mediana / Estándar', area: 35, desc: 'Espacio estándar (~35 m²)' },
      { id: 'gen-3', label: 'Casa / Área Grande', area: 80, desc: 'Superficie amplia (~80 m²)' },
      { id: 'gen-4', label: 'Gran Proyecto', area: 200, desc: 'Obra civil o comercial (~200 m²)' },
    ]
  };
}

export interface ComplementaryProduct {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  presentacion: 'Unidad' | 'Galón' | 'Cuarto (1/4 Gal)' | 'Caneca';
  sku: string;
  descripcion: string;
  imagenUrl: string;
}

export const RECOMMENDED_PROJECT_TOOLS: ComplementaryProduct[] = [
  {
    id: 'tool-kit-pro',
    nombre: 'Kit Profesional Pintor (Rodillo + Bandeja + Brocha)',
    categoria: 'Aplicación',
    precio: 34900,
    presentacion: 'Unidad',
    sku: 'PIN-KIT-01',
    descripcion: 'Bandeja ergonómica, rodillo de felpa antigoteo y brocha para esquinas.',
    imagenUrl: '/src/assets/images/paint_roller_tray_1790894457076.jpg',
  },
  {
    id: 'tool-cinta-azul',
    nombre: 'Cinta de Enmascarar Azul Pintor (48mm x 50m)',
    categoria: 'Protección',
    precio: 12500,
    presentacion: 'Unidad',
    sku: 'PIN-CIN-48',
    descripcion: 'Líneas nítidas sin desprendimiento de estuco ni residuos de pegamento.',
    imagenUrl: '/src/assets/images/cinta_azul_rollo_1790894607849.jpg',
  },
  {
    id: 'tool-lijas-pack',
    nombre: 'Juego de Lijas al Agua Pintuco (5 pliegos)',
    categoria: 'Preparación',
    precio: 8900,
    presentacion: 'Unidad',
    sku: 'PIN-LIJ-05',
    descripcion: 'Granos 150/220/360 para suavizar masilla, revoque o estuco antes de pintar.',
    imagenUrl: '/src/assets/images/lija_agua_pintuco_1790894597920.jpg',
  },
  {
    id: 'tool-espatula-inox',
    nombre: 'Espátula Acero Inoxidable Flexible 4"',
    categoria: 'Herramientas',
    precio: 14200,
    presentacion: 'Unidad',
    sku: 'PIN-ESP-04',
    descripcion: 'Ideal para resanes, aplicación de masilla para grietas y remoción de asperezas.',
    imagenUrl: '/src/assets/images/espatula_acero_inox_1790894617251.jpg',
  },
  {
    id: 'tool-destapador',
    nombre: 'Abrecuñetes Ergonómico Profesional',
    categoria: 'Apertura',
    precio: 9500,
    presentacion: 'Unidad',
    sku: 'PIN-DST-01',
    descripcion: 'Palanca de destape seguro que protege la tapa para conservaciones posteriores.',
    imagenUrl: '/src/assets/images/destapa_cunetes_herramienta_1790894634999.jpg',
  },
];

// ============================================================================
// CONSEJO PINTUCO DINÁMICO SEGÚN EL CONTEXTO ESTRICTO DE COMPRA (PASO 4)
// ============================================================================
export interface DynamicConsejoPintuco {
  badge: string;
  badgeColor: string;
  titulo: string;
  icono: string;
  parrafoPrincipal: string;
  tips: string[];
  normaReferencia: string;
}

export function getDynamicConsejoPintuco(
  formData: FMVFormData,
  calculation: CalculationResult
): DynamicConsejoPintuco {
  const prod = (formData.producto_deseado || calculation.productoSugerido || '').toLowerCase();
  const amb = (formData.ambiente || '').toLowerCase();
  const sup = (formData.superficie || '').toLowerCase();
  const cond = (formData.condicion || '').toLowerCase();

  // 1. Impermeabilizantes, Humedades o Techos
  if (
    prod.includes('aquablock') || 
    prod.includes('impermeabiliz') || 
    prod.includes('fill') ||
    amb.includes('techo') || 
    amb.includes('impermeabiliz') ||
    cond.includes('humedad') ||
    cond.includes('fisur')
  ) {
    return {
      badge: 'Protección Hidrófuga • NTC 1335',
      badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
      titulo: 'Consejo Experto Pintuco • Sellado de Juntas, Grietas y Pendientes',
      icono: '💧',
      parrafoPrincipal:
        'En impermeabilizaciones (techos, terrazas o muros con humedad), el 80% de la durabilidad radica en el sellado previo de puntos críticos y chaflanes antes de aplicar Aquablock.',
      tips: [
        'Sella previamente grietas y juntas de dilatación con masilla elastomérica y tela de refuerzo antes de fondear.',
        'Verifica que la cubierta o terraza cuente con una pendiente mínima del 1% para evitar encharcamientos permanentes.',
        'Aplica mínimo 2 manos cruzadas respetando 4 a 6 horas de secado entre capas, con traslape de 10 cm en encuentros pared-piso.',
      ],
      normaReferencia: 'Especificación Técnica Pintuco Aquablock & Sellado Elastomérico',
    };
  }

  // 2. Exteriores / Fachadas / Koraza
  if (
    prod.includes('koraza') || 
    amb.includes('exterior') || 
    amb.includes('fachada') || 
    amb.includes('marítimo') || 
    amb.includes('costero')
  ) {
    return {
      badge: 'Máxima Resistencia Intemperie • NTC 1335 Tipo 1',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      titulo: 'Consejo Experto Pintuco • Fachadas de Alta Intemperie y Protección UV',
      icono: '☀️',
      parrafoPrincipal:
        'Las fachadas exteriores soportan radiación solar extrema y lluvias continuas. La tecnología Koraza crea un escudo elástico hidrorrepelente que no se cuartea.',
      tips: [
        'Aplica en horas de sombra matutina (antes de 10:00 a.m.) o vespertina (después de 3:00 p.m.) para evitar secado acelerado en muros calientes.',
        'No diluyas con más del 15% de agua limpia: un exceso de dilución debilita la película polimérica protectora contra hongos y lluvia ácida.',
        'Aplica 2 manos cruzadas con rodillo de felpa de 3/4" sobre revoques o mampostería para cubrir toda la textura.',
      ],
      normaReferencia: 'Norma Técnica NTC 1335 Tipo 1 (Pinturas para Exterior con Resistencia UV)',
    };
  }

  // 3. Esmaltes / Metales y Maderas / Pintulux
  if (
    prod.includes('pintulux') || 
    prod.includes('esmalte') || 
    prod.includes('anticorrosivo') || 
    sup.includes('metal') || 
    sup.includes('madera')
  ) {
    return {
      badge: 'Anticorrosivo & Brillo Espejo • Dureza Sintética',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      titulo: 'Consejo Experto Pintuco • Desengrase, Lijado y Capas Finas en Metales',
      icono: '🛡️',
      parrafoPrincipal:
        'En rejas, perfiles metálicos y maderas tratadas, la adherencia y el brillo de espejo del esmalte Pintulux dependen enteramente de la preparación del sustrato.',
      tips: [
        'Desengrasa totalmente la superficie y lija con lija al agua #220 a #320 para abrir poro de adherencia mecánica.',
        'Si hay óxido visible, retíralo con espátula o cepillo de alambre y aplica previamente Base Anticorrosiva Pintuco.',
        'Aplica 2 capas finas y parejas en lugar de una gruesa: las capas gruesas de esmalte tardan en curar internamente y pueden arrugarse.',
      ],
      normaReferencia: 'Guía Técnica Pintulux Resinas Alquídicas de Alta Nivelación',
    };
  }

  // 4. Zonas Húmedas / Baños y Cocinas
  if (
    prod.includes('baños') || 
    prod.includes('cocina') || 
    amb.includes('baños') || 
    amb.includes('húmedas')
  ) {
    return {
      badge: 'Fungicida Activo • Barrera Antivapor',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
      titulo: 'Consejo Experto Pintuco • Prevención de Moho y Adherencia en Ambientes Húmedos',
      icono: '🛁',
      parrafoPrincipal:
        'La condensación de vapor de agua y la grasa ambiental en baños y cocinas deterioran las pinturas convencionales.',
      tips: [
        'Lava los muros previamente con agua y vinagre blanco o solución al 10% de cloro para eliminar esporas latentes de moho.',
        'Deja secar completamente y asegura ventilación adecuada antes, durante y 48 horas después del pintado.',
        'Viniltex Baños y Cocinas contiene fungicidas activos de larga duración; no diluyas con más del 10% de agua para no alterar su efectividad.',
      ],
      normaReferencia: 'NTC 1335 Grado Lavabilidad Superior con Biocida Activo',
    };
  }

  // 5. Alto Tráfico / Demarcación / Pintutráfico / Epóxicos
  if (
    prod.includes('tráfico') || 
    prod.includes('trafico') || 
    amb.includes('tráfico') || 
    amb.includes('piso') || 
    amb.includes('industrial')
  ) {
    return {
      badge: 'Resistencia a Abrasión Pesada • Curado Rápido',
      badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
      titulo: 'Consejo Experto Pintuco • Curado, Prueba de Humedad y Anclaje en Pisos',
      icono: '🚜',
      parrafoPrincipal:
        'La pintura vial y para pisos industriales requiere un anclaje químico superior para resistir paso de llantas y maquinaria.',
      tips: [
        'Prueba del plástico: coloca 30x30 cm de polietileno sellado en el suelo por 24 horas; si hay humedad condensada, el piso aún no está apto.',
        'El concreto debe tener mínimo 28 días de vaciado para garantizar curado completo y estabilidad de pH.',
        'Permite mínimo 24 horas para tráfico peatonal y 72 horas para tránsito vehicular pesado.',
      ],
      normaReferencia: 'NTC 1360 Demarcación y Recubrimiento de Pavimentos Industriales',
    };
  }

  // 6. Superficies Especiales / Sustratos no Convencionales
  if (
    sup.includes('otro') || 
    sup.includes('especial') || 
    sup.includes('drywall') || 
    sup.includes('azulejo')
  ) {
    return {
      badge: 'Superficie Especial • Imprimación Técnica',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      titulo: 'Consejo Experto Pintuco • Anclaje en Sustratos Porosos o No Convencionales',
      icono: '🧪',
      parrafoPrincipal:
        'En sustratos especiales (azulejos, plástico, drywall, fibra de vidrio o yeso), la adherencia directa sin imprimante puede fallar.',
      tips: [
        'En Drywall o yeso cartón, aplica obligatoriamente una mano de Sellador Fijador Antialcalino para igualar absorciones entre placas y cinta.',
        'En materiales brillantes o plásticos, lija suavemente con grano #360 para crear microanclaje mecánico.',
        'Aplica una pequeña prueba testigo en una esquina y espera 24h para comprobar adherencia antes del pintado general.',
      ],
      normaReferencia: 'Manual Técnico Pintuco de Preparación de Sustratos Especiales',
    };
  }

  // 7. Interiores Tradicionales / Viniltex Avanzado (Default)
  return {
    badge: 'Máxima Lavabilidad • NTC 1335 Tipo 1',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    titulo: 'Consejo Experto Pintuco • Recorte de Bordes, Iluminación y Manos Cruzadas',
    icono: '🎨',
    parrafoPrincipal:
      'Para interiores residenciales y oficinas, la técnica adecuada garantiza paredes impecables sin sombras ni marcas de rodillo.',
    tips: [
      'Inicia recortando con brocha fina (2") en esquinas, filos y bordes de interruptores antes de pasar el rodillo central.',
      'Aplica el rodillo en dirección hacia la entrada de luz natural de las ventanas para que los empalmes queden completamente invisibles.',
      'Aplica 2 manos respetando 2 a 3 horas de secado al tacto. Viniltex Avanzado alcanza su lavabilidad óptima a los 7 días de curado.',
    ],
    normaReferencia: 'Certificación NTC 1335 Tipo 1 (> 800 ciclos de lavabilidad con esponja)',
  };
}

// ============================================================================
// RECOMENDACIONES INTELIGENTES DE COMPLEMENTOS CONTEXTUALES (PRE-PAGO)
// ============================================================================
export interface ContextualToolItem {
  id: string;
  nombre: string;
  categoria: string;
  precio: number;
  presentacion: 'Unidad' | 'Galón' | 'Cuarto (1/4 Gal)' | 'Caneca';
  sku: string;
  descripcion: string;
  imagenUrl: string;
  matchScore: number;
  matchReason: string;
}

export function getContextualToolRecommendations(
  formData: FMVFormData,
  calculation: CalculationResult,
  selectedTools: Record<string, number>
): ContextualToolItem[] {
  const prod = (formData.producto_deseado || calculation.productoSugerido || '').toLowerCase();
  const sup = (formData.superficie || '').toLowerCase();
  const hasTape = (selectedTools['tool-cinta-azul'] || 0) > 0;
  const hasRoller = (selectedTools['tool-kit-rodillo'] || 0) > 0;
  const hasBrushes = (selectedTools['tool-kit-brochas'] || 0) > 0;
  const hasSandpaper = (selectedTools['tool-lijas-pack'] || 0) > 0;
  const hasSpatula = (selectedTools['tool-espatula-inox'] || 0) > 0;
  const hasCunetes = calculation.cuñetesPintura > 0;

  return RECOMMENDED_PROJECT_TOOLS.map(tool => {
    let matchScore = 1;
    let matchReason = 'Accesorio recomendado para tu proyecto';

    if (tool.id === 'tool-kit-brochas') {
      if (hasTape) {
        matchScore = 10;
        matchReason = 'Ideal con tu cinta azul: cerdas finas para recortar esquinas con máxima precisión';
      } else if (hasRoller) {
        matchScore = 8;
        matchReason = 'Complemento esencial: el rodillo no llega a marcos ni filos; usa la brocha';
      } else {
        matchReason = 'Cerdas finas sin caída de pelos para cortes limpios en molduras y uniones';
      }
    } else if (tool.id === 'tool-cinta-azul') {
      if (hasBrushes || hasRoller) {
        matchScore = 9;
        matchReason = 'Protege marcos de puertas, zócalos e interruptores sin dejar residuos de pegamento';
      } else {
        matchReason = 'Cinta de pintor con bloqueo de pintura para líneas 100% nítidas';
      }
    } else if (tool.id === 'tool-espatula-inox') {
      if (hasTape || hasSandpaper) {
        matchScore = 9;
        matchReason = 'Perfecta para alisar masilla en grietas y asentar bordes de cinta';
      } else if (sup.includes('otro') || sup.includes('revoque') || sup.includes('drywall')) {
        matchScore = 8;
        matchReason = 'Herramienta clave para resanes y curado de imperfecciones previas';
      } else {
        matchReason = 'Hoja flexible de acero inoxidable anticorrosivo para empastes duraderos';
      }
    } else if (tool.id === 'tool-lijas-pack') {
      if (prod.includes('pintulux') || prod.includes('esmalte') || sup.includes('metal') || sup.includes('madera')) {
        matchScore = 10;
        matchReason = 'Imprescindible para lijar y desengrasar antes de aplicar esmaltes o barnices';
      } else if (hasSpatula) {
        matchScore = 9;
        matchReason = 'Pule los resanes de tu espátula dejando la pared completamente sedosa';
      } else {
        matchReason = 'Suaviza asperezas y abre poro para garantizar máxima adherencia de la pintura';
      }
    } else if (tool.id === 'tool-destapador') {
      if (hasCunetes) {
        matchScore = 10;
        matchReason = 'Especial para tus cuñetes de 5 Gal: destapa sin romper la tapa ni lastimarte';
      } else {
        matchReason = 'Apertura limpia y segura para conservar herméticamente sobrantes de pintura';
      }
    } else if (tool.id === 'tool-kit-rodillo') {
      if (formData.area_m2 >= 20) {
        matchScore = 9;
        matchReason = `Para tus ${formData.area_m2} m², este rodillo antigoteo rinde el doble con bandeja dosificadora`;
      } else {
        matchReason = 'Acabado parejo sin salpicaduras en paredes y techos';
      }
    }

    return {
      ...tool,
      matchScore,
      matchReason,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export interface PaintLineOptionItem {
  id: string;
  nombre: string;
  titulo: string;
  subtitulo: string;
  icono: string;
  precio: string;
  tag: string;
  tagColor: string;
  badge: string;
  descripcion: string;
  familia: string;
}

export const PAINT_LINE_OPTIONS: Record<'interiores' | 'exteriores' | 'especiales', PaintLineOptionItem[]> = {
  interiores: [
    {
      id: 'viniltex-avanzado',
      nombre: 'Viniltex Avanzado Máxima Lavabilidad',
      titulo: 'Viniltex Avanzado',
      subtitulo: 'Paredes Interiores, Salas y Alcobas',
      icono: '🎨',
      precio: '$79.900/GL',
      tag: 'Más Popular • NTC 1335 Tipo 1',
      tagColor: 'bg-emerald-100 text-emerald-800',
      badge: 'Tonos pastel, neutros y vivos',
      descripcion: 'Vinilo acrílico Tipo 1 de alta resistencia, máxima lavabilidad (+20.000 ciclos), bajo olor y cero VOC.',
      familia: 'viniltex'
    },
    {
      id: 'viniltex-acriltex',
      nombre: 'Viniltex Acriltex Satinado Alta Resistencia',
      titulo: 'Viniltex Acriltex',
      subtitulo: 'Paredes de Alto Tráfico y Pasillos',
      icono: '✨',
      precio: '$92.500/GL',
      tag: 'Acabado Satinado Sedoso',
      tagColor: 'bg-purple-100 text-purple-800',
      badge: 'Brillo Sedoso y Elegante',
      descripcion: 'Pintura 100% acrílica con acabado satinado sedoso que aporta elegancia visual y facilidad de limpieza sin dejar brillos indeseados.',
      familia: 'viniltex'
    },
    {
      id: 'viniltex-banos',
      nombre: 'Viniltex Baños y Cocinas Antibacterial',
      titulo: 'Viniltex Baños y Cocinas',
      subtitulo: 'Zonas Húmedas Interiores',
      icono: '🚿',
      precio: '$89.900/GL',
      tag: 'Fungicida Activo',
      tagColor: 'bg-teal-100 text-teal-800',
      badge: 'Resistencia a Vapor y Grasa',
      descripcion: 'Película protectora antibacterial y antihongos, resistente a condensación de vapor y lavado frecuente.',
      familia: 'viniltex'
    },
    {
      id: 'intervinil-cielos',
      nombre: 'Intervinil Cielos Mate Antirreflejo',
      titulo: 'Intervinil Cielos',
      subtitulo: 'Cielorrasos, Techos y Drywall',
      icono: '☁️',
      precio: '$54.900/GL',
      tag: 'Mate Antirreflejo',
      tagColor: 'bg-blue-100 text-[#004B93]',
      badge: 'Blanco Puro y Tonos Suaves',
      descripcion: 'Formulación de acabado ultragraso mate que disimula imperfecciones por luz rasante en techos y placas de yeso.',
      familia: 'viniltex'
    },
    {
      id: 'viniltex-vida-luz',
      nombre: 'Viniltex Vida & Luz Purificador de Aire',
      titulo: 'Viniltex Vida & Luz',
      subtitulo: 'Habitaciones Infantiles y Clínicas',
      icono: '🌿',
      precio: '$92.500/GL',
      tag: 'Zero VOC & Olor Cero',
      tagColor: 'bg-green-100 text-green-800',
      badge: 'Salud & Purificación',
      descripcion: 'Pintura ecológica de tecnología activa fotocatalítica que purifica el aire interior y elimina bacterias en un 99.9%.',
      familia: 'viniltex'
    },
    {
      id: 'intervinil-lavable-t2',
      nombre: 'Intervinil Lavable Rendimiento Pro',
      titulo: 'Intervinil Lavable',
      subtitulo: 'Grandes Áreas, Proyectos y Primeras Manos',
      icono: '🏢',
      precio: '$49.900/GL',
      tag: 'Rendimiento Pro NTC Tipo 2',
      tagColor: 'bg-amber-100 text-amber-800',
      badge: 'Máximo Poder Cubriente',
      descripcion: 'Vinilo tipo 2 de alta economía y cubrimiento uniforme, ideal para obras nuevas, bodegas y primeras manos de fondeo.',
      familia: 'viniltex'
    },
    {
      id: 'viniltex-antiviral',
      nombre: 'Viniltex Antiviral y Antibacterial Iones de Plata',
      titulo: 'Viniltex Antiviral',
      subtitulo: 'Espacios Clínicos, Consultorios y Hogar',
      icono: '🛡️',
      precio: '$95.900/GL',
      tag: 'Iones de Plata Activos',
      tagColor: 'bg-cyan-100 text-cyan-800',
      badge: 'Grado Hospitalario',
      descripcion: 'Formulación con micropartículas de plata que inactiva virus y bacterias al contacto en menos de 15 minutos.',
      familia: 'viniltex'
    },
    {
      id: 'viniltex-seda',
      nombre: 'Viniltex Seda Acabado Satinado Suave',
      titulo: 'Viniltex Seda',
      subtitulo: 'Salas Contemporáneas y Dormitorios',
      icono: '🌸',
      precio: '$87.900/GL',
      tag: 'Tacto Aterciopelado',
      tagColor: 'bg-rose-100 text-rose-800',
      badge: 'Elegancia Soft Touch',
      descripcion: 'Pintura vinil-acrílica con tacto sedoso que atenúa el reflejo lumínico brindando calidez espacial superior.',
      familia: 'viniltex'
    },
    {
      id: 'intervinil-estandar',
      nombre: 'Intervinil Estándar Tipo 2 Rendimiento Máximo',
      titulo: 'Intervinil Estándar',
      subtitulo: 'Cielos y Superficies de Bajo Roce',
      icono: '📦',
      precio: '$46.900/GL',
      tag: 'Línea Económica Constructor',
      tagColor: 'bg-slate-100 text-slate-800',
      badge: 'Alta Blancura Mate',
      descripcion: 'Pintura base agua económica para cielorrasos y superficies interiores con acabado mate de gran poder cubridor.',
      familia: 'viniltex'
    },
    {
      id: 'plx-agua-int',
      nombre: 'Pintulux Agua Esmalte Ecológico Secado Rápido',
      titulo: 'Pintulux Acua Interior',
      subtitulo: 'Puertas, Marcos y Zócalos Habitados',
      icono: '💧',
      precio: '$91.900/GL',
      tag: 'Base Agua Cero Olor',
      tagColor: 'bg-teal-100 text-teal-800',
      badge: 'Secado Rápido 30 Min',
      descripcion: 'Esmalte 100% acrílico sin olor a solvente. No amarillea en interiores y permite habitar el espacio el mismo día.',
      familia: 'pintulux'
    },
    {
      id: 'estuco-acrilico-int',
      nombre: 'Estuco Acrílico Profesional Interiores Blanco',
      titulo: 'Estuco Acrílico Pro',
      subtitulo: 'Alistamiento y Resane de Paredes',
      icono: '🧱',
      precio: '$42.900/GL',
      tag: 'Base Preparación Acrílica',
      tagColor: 'bg-violet-100 text-violet-800',
      badge: 'Acabado Extra Liso',
      descripcion: 'Masilla lista para usar de máxima blancura y fácil lijabilidad para emparejar y nivelar muros antes de pintar.',
      familia: 'viniltex'
    }
  ],
  exteriores: [
    {
      id: 'koraza-doble-vida',
      nombre: 'Koraza Doble Vida Clima Extremo',
      titulo: 'Koraza Doble Vida',
      subtitulo: 'Fachadas, Muros Exteriores y Balcones',
      icono: '🛡️',
      precio: '$98.900/GL',
      tag: '13 Años Garantía Certificada',
      tagColor: 'bg-blue-100 text-[#004B93]',
      badge: 'Protección Extrema Fachadas',
      descripcion: 'Pintura 100% acrílica hidrorrepelente para intemperie. Protección extrema contra rayos UV, lluvia torrencial y algas.',
      familia: 'koraza'
    },
    {
      id: 'koraza-sol-lluvia',
      nombre: 'Koraza Protección Sol & Lluvia Elastomérica',
      titulo: 'Koraza Sol & Lluvia',
      subtitulo: 'Muros Medianeros, Terrazas y Patios',
      icono: '☀️',
      precio: '$88.900/GL',
      tag: '8 Años Garantía UV',
      tagColor: 'bg-amber-100 text-amber-900',
      badge: 'Filtro Solar Activo',
      descripcion: 'Barrera protectora continua contra la radiación ultravioleta y el desgaste por cambios drásticos de temperatura ambiental.',
      familia: 'koraza'
    },
    {
      id: 'koraza-tradicional',
      nombre: 'Koraza Tradicional Fachadas Tipo 1',
      titulo: 'Koraza Tradicional',
      subtitulo: 'Fachadas Clásicas y Cerramientos',
      icono: '🏡',
      precio: '$74.900/GL',
      tag: '5 Años Durabilidad',
      tagColor: 'bg-emerald-100 text-emerald-800',
      badge: 'Fachadas Tipo 1',
      descripcion: 'Fórmula clásica para fachadas y cerramientos con alta solidez a la intemperie y excelente relación costo-beneficio.',
      familia: 'koraza'
    },
    {
      id: 'koraza-siliconada',
      nombre: 'Koraza Siliconada Protección Superior',
      titulo: 'Koraza Siliconada',
      subtitulo: 'Fachadas con Autolimpieza por Lluvia',
      icono: '🏰',
      precio: '$158.000/GL',
      tag: 'Efecto Hidrofóbico Loto',
      tagColor: 'bg-sky-100 text-sky-800',
      badge: 'Fachadas Siempre Limpias',
      descripcion: 'Nanotecnología siliconada que repele el polvo y el agua mediante el lavado natural de las lluvias sin decolorarse.',
      familia: 'koraza'
    },
    {
      id: 'koraza-5a',
      nombre: 'Koraza 5 Años Protección Exterior Acrílica',
      titulo: 'Koraza 5 Años',
      subtitulo: 'Muros Exteriores, Cerramientos y Patios',
      icono: '☀️',
      precio: '$119.900/GL',
      tag: '5 Años Garantía',
      tagColor: 'bg-indigo-100 text-indigo-800',
      badge: 'Resistencia UV Equilibrada',
      descripcion: 'Acrílica para intemperie con sellado elástico que previene microfisuras y resiste sol implacable a precio óptimo.',
      familia: 'koraza'
    },
    {
      id: 'pintulux-esmalte',
      nombre: 'Pintulux Esmalte Sintético Anticorrosivo',
      titulo: 'Pintulux / Esmalte',
      subtitulo: 'Rejas, Portones, Metales y Maderas',
      icono: '⚙️',
      precio: '$84.900/GL',
      tag: 'Anticorrosivo Alquídico',
      tagColor: 'bg-amber-100 text-amber-900',
      badge: 'Brillante y Semibrillante',
      descripcion: 'Esmalte sintético de secado rápido con acción inhibidora del óxido y acabado brillante para cerramientos y carpintería.',
      familia: 'pintulux'
    },
    {
      id: 'pintulux-agua',
      nombre: 'Pintulux Agua Esmalte Ecológico Secado Rápido',
      titulo: 'Pintulux Acua',
      subtitulo: 'Metales y Carpintería Sin Olor a Solvente',
      icono: '💧',
      precio: '$91.900/GL',
      tag: 'Base Agua Cero Olor',
      tagColor: 'bg-teal-100 text-teal-800',
      badge: 'Secado Rápido en 30 Min',
      descripcion: 'Esmalte 100% acrílico libre de solventes tóxicos, que no amarillea con el sol y permite pintar rejas y marcos habitando el hogar.',
      familia: 'pintulux'
    },
    {
      id: 'corrostyl-zinc',
      nombre: 'Corrostyl Anticorrosivo Cromato de Zinc',
      titulo: 'Corrostyl Anticorrosivo',
      subtitulo: 'Estructuras Metálicas, Techos de Zinc y Perfiles',
      icono: '🏗️',
      precio: '$76.500/GL',
      tag: 'Inhibidor de Óxido NTC 1651',
      tagColor: 'bg-red-100 text-red-800',
      badge: 'Protección Catódica',
      descripcion: 'Fondo primario anticorrosivo de cromato de zinc de máxima adherencia sobre hierro negro, láminas galvanizadas y perfiles.',
      familia: 'pintulux'
    },
    {
      id: 'madera-barniz',
      nombre: 'Barniz Poliuretano y Tintes Filtro Solar',
      titulo: 'Barniz Poliuretano',
      subtitulo: 'Puertas, Muebles, Pérgolas y Decks',
      icono: '🪵',
      precio: '$82.900/GL',
      tag: 'Filtro Solar UV',
      tagColor: 'bg-orange-100 text-orange-900',
      badge: 'Tonos Naturales de Madera',
      descripcion: 'Barniz uretanado y tintes protectores que realzan la veta natural de la madera con máxima elasticidad contra la intemperie.',
      familia: 'madera'
    },
    {
      id: 'madetec-deck',
      nombre: 'Madetec Esmalte Poliuretano Madera & Deck',
      titulo: 'Madetec Decks',
      subtitulo: 'Decks de Madera, Terrazas y Pérgolas',
      icono: '🌳',
      precio: '$89.900/GL',
      tag: 'Tráfico Peatonal Decks',
      tagColor: 'bg-yellow-100 text-yellow-900',
      badge: 'Alta Dureza Exterior',
      descripcion: 'Recubrimiento protector de máxima dureza contra intemperie, lluvia constante y fricción peatonal en maderas exteriores.',
      familia: 'madera'
    },
    {
      id: 'koraza-antialgas',
      nombre: 'Koraza Fachadas Antialgas Máxima Resistencia',
      titulo: 'Koraza Antialgas',
      subtitulo: 'Climas Húmedos, Costeros y Sombríos',
      icono: '🌿',
      precio: '$134.000/GL',
      tag: 'Biocida Encapsulado',
      tagColor: 'bg-emerald-100 text-emerald-900',
      badge: 'Anti Musgo y Algas',
      descripcion: 'Fórmula enriquecida con biocidas microencapsulados para climas húmedos donde proliferan hongos, musgo y algas verdes.',
      familia: 'koraza'
    },
    {
      id: 'esmalte-domestico',
      nombre: 'Esmalte Doméstico Barniz Sintético Metales',
      titulo: 'Esmalte Doméstico',
      subtitulo: 'Rejas, Ventanas y Herrería Residencial',
      icono: '🚪',
      precio: '$58.900/GL',
      tag: 'Uso General Doméstico',
      tagColor: 'bg-slate-100 text-slate-800',
      badge: 'Brillo Duradero',
      descripcion: 'Esmalte económico de uso general para rejas, ventanas y tuberías expuestas a la intemperie con acabado brillante duradero.',
      familia: 'pintulux'
    }
  ],
  especiales: [
    {
      id: 'aquablock-bloqueador',
      nombre: 'Aquablock Sellador Antihumedad Bloqueador',
      titulo: 'Aquablock Antihumedad',
      subtitulo: 'Techos, Terrazas, Muros y Fisuras',
      icono: '💧',
      precio: '$104.900/GL',
      tag: 'Barrera Bloqueadora 7 Años',
      tagColor: 'bg-cyan-100 text-cyan-900',
      badge: 'Anticapilaridad Sótanos',
      descripcion: 'Penetra en los poros de la mampostería cristalizando y bloqueando el paso de la humedad por capilaridad y eflorescencias.',
      familia: 'aquablock'
    },
    {
      id: 'pintuco-fill',
      nombre: 'Pintuco Fill Masilla Elastomérica Grietas & Juntas',
      titulo: 'Pintuco Fill Masilla',
      subtitulo: 'Fisuras Activas, Grietas y Juntas de Muros',
      icono: '🏠',
      precio: '$69.900/GL',
      tag: 'Puentea Fisuras Activas',
      tagColor: 'bg-emerald-100 text-emerald-800',
      badge: 'Elasticidad 8 Años',
      descripcion: 'Resanador y sellador elastomérico de alto desempeño para fisuras activas, juntas de dilatación y pre-tratamiento.',
      familia: 'aquablock'
    },
    {
      id: 'imp-acr',
      nombre: 'Imprimante Acrílico Sellador 50/50',
      titulo: 'Imprimante Sellador 50/50',
      subtitulo: 'Neutralizador de Alcalinidad en Revoques Nuevos',
      icono: '🧪',
      precio: '$62.900/GL',
      tag: 'Neutralizador Alcalino',
      tagColor: 'bg-blue-100 text-blue-900',
      badge: 'Rendimiento 45 m²/GL',
      descripcion: 'Fija partículas sueltas, neutraliza alcalinidad del cemento fresco y reduce drásticamente el consumo excesivo de pintura.',
      familia: 'aquablock'
    },
    {
      id: 'pintutrafico-pisos',
      nombre: 'Pintutráfico Base Solvente Alto Desempeño',
      titulo: 'Pintutráfico Pisos y Vías',
      subtitulo: 'Canchas, Parqueaderos y Pavimentos',
      icono: '🚜',
      precio: '$119.000/GL',
      tag: 'Norma Vial NTC 1360',
      tagColor: 'bg-amber-100 text-amber-900',
      badge: 'Colores Reglamentarios',
      descripcion: 'Pintura acrílica alquídica para concreto y asfalto según norma NTC 1360 de secado ultrarrápido y máxima resistencia.',
      familia: 'trafico'
    },
    {
      id: 'pintucoat-epoxico',
      nombre: 'Pintucoat Esmalte Epóxico Pisos & Tanques',
      titulo: 'Pintucoat Epóxico',
      subtitulo: 'Pisos de Hospitales, Garajes y Tanques',
      icono: '🧪',
      precio: '$148.000/GL',
      tag: 'Grado Sanitario y Químico',
      tagColor: 'bg-purple-100 text-purple-800',
      badge: 'Brillo Alto Espejo',
      descripcion: 'Sistema epóxico bicomponente de alta resistencia química y mecánica. Apto para pisos industriales y tanques de agua potable.',
      familia: 'trafico'
    },
    {
      id: 'viniltex-banos-esp',
      nombre: 'Viniltex Baños y Cocinas Antibacterial Zonas Vapor',
      titulo: 'Viniltex Baños y Cocinas',
      subtitulo: 'Zonas de Vapor y Humedad Crítica',
      icono: '🛁',
      precio: '$89.900/GL',
      tag: 'Antihongos & Antibacterial',
      tagColor: 'bg-teal-100 text-teal-800',
      badge: 'Resiste Vapor Constante',
      descripcion: 'Protección con biocida contra moho para muros y techos con vapor constante en baños, cocinas industriales y lavanderías.',
      familia: 'viniltex'
    },
    {
      id: 'aquablock-techos',
      nombre: 'Aquablock Techos & Terrazas Membrana Líquida',
      titulo: 'Aquablock Techos & Terrazas',
      subtitulo: 'Cubiertas, Losas y Techos Transitables',
      icono: '🌊',
      precio: '$128.900/GL',
      tag: 'Membrana Fibrada Transitable',
      tagColor: 'bg-sky-100 text-sky-900',
      badge: 'Reflectivo Térmico Blanco',
      descripcion: 'Impermeabilizante fibrado transitable para cubiertas y losas con microfibras sintéticas que eliminan filtraciones y goteras directas.',
      familia: 'aquablock'
    },
    {
      id: 'pintutrafico-agua',
      nombre: 'Pintutráfico Acrílico Base Agua Vial NTC 1360',
      titulo: 'Pintutráfico Acua Vial',
      subtitulo: 'Parqueaderos, Ciclorrutas y Bodegas',
      icono: '🚴',
      precio: '$112.000/GL',
      tag: 'Base Agua Ecológica Vial',
      tagColor: 'bg-yellow-100 text-yellow-950',
      badge: 'Bajo Olor y Rápido Secado',
      descripcion: 'Pintura vial base agua de secado rápido, amigable con el medio ambiente y de alta visibilidad para demarcación urbana.',
      familia: 'trafico'
    },
    {
      id: 'madetec-marino',
      nombre: 'Madetec Laca Catalizada y Barniz Marino',
      titulo: 'Madetec Marino',
      subtitulo: 'Carpintería Marina, Muelles y Puertas',
      icono: '⛵',
      precio: '$86.500/GL',
      tag: 'Resistencia Salina Marina',
      tagColor: 'bg-amber-100 text-amber-900',
      badge: 'Alto Brillo Marino',
      descripcion: 'Laca de alta viscosidad y dureza con filtro solar para carpintería marina, embarcaciones, muelles y puertas expuestas al rocío marino.',
      familia: 'madera'
    },
    {
      id: 'epoxico-altos-solidos',
      nombre: 'Epóxico Altos Sólidos Grado Sanitario Hospitalario',
      titulo: 'Epóxico Altos Sólidos',
      subtitulo: 'Quirófanos, Alimentos y Farmacéutica',
      icono: '🏥',
      precio: '$165.000/GL',
      tag: 'Aprobación INVIMA Sanitaria',
      tagColor: 'bg-indigo-100 text-indigo-900',
      badge: 'Cero Porosidad Asepsia',
      descripcion: 'Pintura epóxica libre de solventes para quirófanos, plantas procesadoras de alimentos y laboratorios farmacéuticos certificados.',
      familia: 'trafico'
    },
    {
      id: 'pisos-canchas-sport',
      nombre: 'Pintura para Pisos y Canchas Antideslizante',
      titulo: 'Pintura Canchas Sport',
      subtitulo: 'Canchas Polideportivas, Rampas y Senderos',
      icono: '🏀',
      precio: '$108.900/GL',
      tag: 'Textura Antideslizante',
      tagColor: 'bg-green-100 text-green-900',
      badge: 'Canchas Polideportivas',
      descripcion: 'Recubrimiento acrílico antideslizante con textura mineral para canchas deportivas múltiples, senderos peatonales y rampas.',
      familia: 'trafico'
    },
    {
      id: 'sellador-fibrado',
      nombre: 'Sellador Fibrado Impermeabilizante Frentes y Culatas',
      titulo: 'Sellador Fibrado Culatas',
      subtitulo: 'Muros Culata y Medianeros de Difícil Acceso',
      icono: '🧱',
      precio: '$94.500/GL',
      tag: 'Refuerzo con Microfibras',
      tagColor: 'bg-teal-100 text-teal-900',
      badge: 'Muros Culata y Medianeros',
      descripcion: 'Compuesto acrílico reforzado con fibras de polipropileno para impermeabilizar muros culatas y medianerías de difícil acceso.',
      familia: 'aquablock'
    }
  ]
};

/**
 * Mapea e inyecta dinámicamente todo el catálogo oficial sin ninguna restricción ni .slice()
 */
export function buildComprehensiveCatalogPaints(
  category: 'interiores' | 'exteriores' | 'especiales',
  supabaseProducts?: SupabaseProducto[]
): PaintLineOptionItem[] {
  const baseList: PaintLineOptionItem[] = [...(PAINT_LINE_OPTIONS[category] || [])];
  const seenIds = new Set<string>(baseList.map(item => item.id.toLowerCase()));
  const seenNames = new Set<string>(baseList.map(item => item.nombre.toLowerCase().trim()));

  // 1. Inyección complementaria desde PINTUCO_CATALOG para garantizar que ninguna referencia oficial quede excluida
  PINTUCO_CATALOG.forEach((p) => {
    if (!p || p.categoriaCatalogo === 'herramientas') return;
    const cat = p.categoriaCatalogo;
    const nameLower = (p.nombre || '').toLowerCase();
    const lineaLower = (p.linea || '').toLowerCase();
    const tipoLower = (p.tipoPintura || '').toLowerCase();

    let belongs = false;
    if (category === 'interiores') {
      belongs = cat === 'interiores' || lineaLower.includes('interior') || tipoLower.includes('vinilo') || nameLower.includes('viniltex') || nameLower.includes('intervinil') || nameLower.includes('cielos') || nameLower.includes('estuco');
    } else if (category === 'exteriores') {
      belongs = cat === 'exteriores' || cat === 'metales_madera' || lineaLower.includes('exterior') || lineaLower.includes('fachada') || nameLower.includes('koraza') || nameLower.includes('pintulux') || nameLower.includes('corrostyl') || nameLower.includes('madera') || nameLower.includes('barniz') || nameLower.includes('deck');
    } else if (category === 'especiales') {
      belongs = cat === 'especiales' || nameLower.includes('aquablock') || nameLower.includes('tráfico') || nameLower.includes('trafico') || nameLower.includes('epóxico') || nameLower.includes('epoxico') || nameLower.includes('fill') || nameLower.includes('imprimante') || nameLower.includes('baños') || nameLower.includes('banos') || nameLower.includes('sellador');
    }

    if (belongs && !seenIds.has(p.id.toLowerCase()) && !seenNames.has(nameLower.trim())) {
      seenIds.add(p.id.toLowerCase());
      seenNames.add(nameLower.trim());
      const prices = getPaintPrices(p.nombre);
      const isExt = category === 'exteriores';
      const isEsp = category === 'especiales';
      baseList.push({
        id: p.id,
        nombre: p.nombre,
        titulo: p.nombre.replace(/Pintuco\s*/i, '').replace(/Máxima\s*/i, '').trim(),
        subtitulo: p.linea || (isExt ? 'Fachadas y Muros Exteriores' : isEsp ? 'Uso Técnico Especial' : 'Paredes y Techos Interiores'),
        icono: isExt ? '🛡️' : isEsp ? '💧' : '🎨',
        precio: `$${(p.precioGalon || prices.galon).toLocaleString('es-CO')}/GL`,
        tag: p.garantia || 'Pintuco Certificado',
        tagColor: isExt ? 'bg-blue-100 text-[#004B93]' : isEsp ? 'bg-cyan-100 text-cyan-900' : 'bg-emerald-100 text-emerald-800',
        badge: p.acabado || 'Acabado Profesional',
        descripcion: p.descripcion || `${p.tipoPintura || 'Pintura'} de alto rendimiento para proyectos profesionales.`,
        familia: isExt ? 'koraza' : isEsp ? 'aquablock' : 'viniltex'
      });
    }
  });

  // 2. Inyección dinámica de productos provenientes de base de datos Supabase
  if (Array.isArray(supabaseProducts)) {
    supabaseProducts.forEach((sp) => {
      if (!sp || !sp.nombre) return;
      const spName = sp.nombre.toLowerCase().trim();
      let belongs = false;
      if (category === 'interiores') {
        belongs = spName.includes('viniltex') || spName.includes('intervinil') || spName.includes('interior') || spName.includes('cielos') || spName.includes('estuco');
      } else if (category === 'exteriores') {
        belongs = spName.includes('koraza') || spName.includes('exterior') || spName.includes('fachada') || spName.includes('pintulux') || spName.includes('esmalte') || spName.includes('corrostyl') || spName.includes('madera');
      } else if (category === 'especiales') {
        belongs = spName.includes('aquablock') || spName.includes('tráfico') || spName.includes('trafico') || spName.includes('epoxi') || spName.includes('fill') || spName.includes('sellador') || spName.includes('imprimante') || spName.includes('baños');
      }

      const spId = String(sp.id || sp.sku || sp.nombre);
      if (belongs && !seenIds.has(spId.toLowerCase()) && !seenNames.has(spName)) {
        seenIds.add(spId.toLowerCase());
        seenNames.add(spName);
        const prices = getPaintPrices(sp.nombre);
        baseList.push({
          id: spId,
          nombre: sp.nombre,
          titulo: sp.nombre,
          subtitulo: sp.ambiente || 'Catálogo Oficial Pintuco',
          icono: category === 'exteriores' ? '🛡️' : category === 'especiales' ? '💧' : '🎨',
          precio: `$${prices.galon.toLocaleString('es-CO')}/GL`,
          tag: 'Oficial Pintuco',
          tagColor: 'bg-blue-100 text-[#004B93]',
          badge: 'Stock Disponible',
          descripcion: sp.rendimiento_m2 ? `Rendimiento estimado de ${sp.rendimiento_m2} m²/GL a dos manos.` : 'Pintura oficial garantizada de alta densidad y durabilidad.',
          familia: category === 'exteriores' ? 'koraza' : category === 'especiales' ? 'aquablock' : 'viniltex'
        });
      }
    });
  }

  // RETORNO COMPLETO SIN NINGÚN .slice(), LÍMITE O RESTRICCIÓN
  return baseList;
}

export interface FMVFormProps {
  formData: FMVFormData;
  onChange: (field: keyof FMVFormData, value: any) => void;
  onApplyPreset: (presetData: FMVFormData) => void;
  onReset: () => void;
  onOpenNLPExtractor: () => void;
  supabaseProducts?: SupabaseProducto[];
  isUsingSupabaseCatalog?: boolean;
  // Enhanced props for 4-step wizard integration
  calculation?: CalculationResult;
  userSession?: UserSession | null;
  onAddToCart?: (
    customQtys?: { cunetes?: number; galones?: number; sellador?: number },
    proceedToCheckout?: boolean,
    addedTools?: Array<{
      id: string;
      nombre: string;
      presentacion: 'Unidad' | 'Galón' | 'Cuarto (1/4 Gal)' | 'Caneca';
      cantidad: number;
      precioUnitario: number;
      sku: string;
      imagenUrl: string;
    }>,
    deliveryData?: any,
    calculatedProductsList?: CartItem[]
  ) => void;
  onSaveOrder?: (tipo?: 'pedido' | 'cotizacion') => Promise<void>;
  isSaving?: boolean;
  onOpenPrintable?: () => void;
  onOpenChat?: () => void;
}

export const FMVForm: React.FC<FMVFormProps> = ({
  formData,
  onChange,
  onApplyPreset,
  onReset,
  onOpenNLPExtractor,
  supabaseProducts,
  isUsingSupabaseCatalog,
  calculation: propCalculation,
  userSession,
  onAddToCart,
  onSaveOrder,
  isSaving = false,
  onOpenPrintable,
  onOpenChat,
}) => {
  const cartContext = useCart();
  // Wizard current active step (1: ¿Qué vas a pintar?, 2: Medidas y Color, 3: Datos y Forma de Entrega, 4: Resumen y Consejo)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Pestaña rápida activa en 2.1 (Interiores | Exteriores | Zonas Húmedas / Especiales)
  const [paintFilterTab, setPaintFilterTab] = useState<'interiores' | 'exteriores' | 'especiales'>('interiores');

  // Ref y estado para carrusel horizontal fluido de catálogo de pinturas (Paso 2)
  const paintCarouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [carouselProgress, setCarouselProgress] = useState(0);

  const updateCarouselScrollState = useCallback(() => {
    const el = paintCarouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      const pct = Math.max(0, Math.min(100, Math.round((scrollLeft / maxScroll) * 100)));
      setCarouselProgress(pct);
    } else {
      setCarouselProgress(100);
    }
  }, []);

  const handleCarouselScroll = useCallback((direction: 'left' | 'right') => {
    const el = paintCarouselRef.current;
    if (!el) return;
    const scrollAmount = 330;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }, []);

  // Re-evaluar estado del carrusel al cambiar de pestaña y resetear scroll al inicio
  useEffect(() => {
    if (paintCarouselRef.current) {
      paintCarouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
    const timer = setTimeout(() => {
      updateCarouselScrollState();
    }, 150);
    return () => clearTimeout(timer);
  }, [paintFilterTab, updateCarouselScrollState]);

  // Tools descartadas voluntariamente ("No me interesa / Omitir")
  const [dismissedTools, setDismissedTools] = useState<Record<string, boolean>>({});

  // Indicador si los datos de entrega fueron autocompletados desde el perfil del usuario autenticado
  const [autocompletedFromProfile, setAutocompletedFromProfile] = useState<boolean>(false);

  // Quick dimension calculator state in Step 2 (Ancho x Alto)
  const [showDimensionCalc, setShowDimensionCalc] = useState(false);
  const [dimAncho, setDimAncho] = useState<number>(4);
  const [dimAlto, setDimAlto] = useState<number>(2.5);
  const [dimParedes, setDimParedes] = useState<number>(4);

  // Technical advanced accordion in Step 3
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Modal / Dropdown to switch paint manually in Step 1
  const [showCatalogSelector, setShowCatalogSelector] = useState(false);

  // Real-time calculation fallback if not passed via props
  const calculation: CalculationResult = useMemo(() => {
    if (propCalculation) return propCalculation;
    return calculateMaterials(formData);
  }, [propCalculation, formData]);

  // Cantidades editables para compra: Pinturas calculadas por defecto; Sellador como sugerencia opcional
  const [editedQuantities, setEditedQuantities] = useState({
    cunetes: calculation.cuñetesPintura,
    galones: calculation.galonesSueltosPintura,
    sellador: Boolean(formData.incluir_sellador_forzado) ? calculation.galonesSellador : 0,
  });

  // Herramientas complementarias sugeridas que el cliente agregue voluntariamente
  const [selectedTools, setSelectedTools] = useState<Record<string, number>>({});

  // Modal de Complementos Sugeridos (Pre-Checkout)
  const [showComplementsModal, setShowComplementsModal] = useState<boolean>(false);

  // Autocompletar datos de entrega y facturación utilizando el perfil del usuario autenticado (Paso 3)
  useEffect(() => {
    if (userSession && userSession.isLoggedIn) {
      queueMicrotask(() => {
        let filledAny = false;
        if (userSession.nombre && (!formData.nombre_razon_social || formData.nombre_razon_social.trim() === '')) {
          onChange('nombre_razon_social', userSession.nombre);
          filledAny = true;
        }
        if ((userSession.documento || userSession.cedula) && (!formData.documento || formData.documento.trim() === '')) {
          onChange('documento', userSession.documento || userSession.cedula || '');
          filledAny = true;
        }
        if (userSession.tipoDocumento && !formData.tipo_documento) {
          onChange('tipo_documento', userSession.tipoDocumento);
          filledAny = true;
        }
        if (userSession.telefono && (!formData.telefono || formData.telefono.trim() === '')) {
          onChange('telefono', userSession.telefono);
          filledAny = true;
        }
        if (userSession.email && (!formData.correo_electronico || formData.correo_electronico.trim() === '')) {
          onChange('correo_electronico', userSession.email);
          filledAny = true;
        }

        // Dirección guardada en el perfil
        const defaultAddr = userSession.direcciones?.find(d => d.esPredeterminada) || userSession.direcciones?.[0];
        const savedAddr = defaultAddr?.direccion || userSession.direccion || userSession.address;
        if (savedAddr && (!formData.direccion_obra || formData.direccion_obra.trim() === '')) {
          onChange('direccion_obra', savedAddr);
          filledAny = true;
        }

        const savedCity = defaultAddr?.ciudad || userSession.ciudad;
        if (savedCity && (!formData.ciudad || formData.ciudad === 'Bogotá D.C.')) {
          onChange('ciudad', savedCity);
          filledAny = true;
        }

        const savedDepto = defaultAddr?.departamento || userSession.departamento;
        if (savedDepto && !formData.departamento) {
          onChange('departamento', savedDepto);
          filledAny = true;
        }

        if (filledAny) {
          setAutocompletedFromProfile(true);
        }
      });
    }
  }, [userSession]);

  // Lista unificada y completa de todas las opciones de pintura sin restricciones ni .slice()
  const allPaintOptions = useMemo(() => [
    ...buildComprehensiveCatalogPaints('interiores', supabaseProducts),
    ...buildComprehensiveCatalogPaints('exteriores', supabaseProducts),
    ...buildComprehensiveCatalogPaints('especiales', supabaseProducts),
  ], [supabaseProducts]);

  // Lista de pinturas disponibles para la categoría activa
  const currentCategoryPaints = useMemo(() => {
    return buildComprehensiveCatalogPaints(paintFilterTab, supabaseProducts);
  }, [paintFilterTab, supabaseProducts]);

  const findPaintOption = (nameOrId: string): PaintLineOptionItem => {
    return allPaintOptions.find(p => 
      p.id === nameOrId || 
      p.nombre === nameOrId || 
      (nameOrId && p.nombre.toLowerCase().includes(nameOrId.toLowerCase()))
    ) || allPaintOptions[0];
  };

  // Estado reactivo de pinturas seleccionadas (Paso 2.1)
  const [selectedPaints, setSelectedPaints] = useState<CotizadorPaintItem[]>(() => {
    const desired = formData.producto_deseado || 'Viniltex Avanzado Máxima Lavabilidad';
    const all = [
      ...buildComprehensiveCatalogPaints('interiores', supabaseProducts),
      ...buildComprehensiveCatalogPaints('exteriores', supabaseProducts),
      ...buildComprehensiveCatalogPaints('especiales', supabaseProducts),
    ];
    const opt = all.find(p => p.nombre === desired || p.nombre.toLowerCase().includes(desired.toLowerCase())) || all[0];
    const prices = getPaintPrices(opt.nombre);
    const pal = getPaletteForProductName(opt.nombre);
    const defColor = formData.color_acabado || (pal[0]?.name ?? 'Blanco Puro');
    return [{
      id: opt.id,
      nombre: opt.nombre,
      titulo: opt.titulo,
      subtitulo: opt.subtitulo,
      icono: opt.icono,
      familia: opt.familia,
      precioGalon: prices.galon,
      precioCunete: prices.cunete,
      area_m2: Math.max(1, formData.area_m2 || 35),
      color_acabado: defColor,
      badge: opt.badge,
      tag: opt.tag,
      tagColor: opt.tagColor,
      descripcion: opt.descripcion,
    }];
  });

  // Sincronizar producto deseado si viene de Paso 1 o Preset y solo hay 1 pintura seleccionada
  useEffect(() => {
    if (selectedPaints.length === 1 && formData.producto_deseado) {
      const currentName = selectedPaints[0].nombre;
      if (currentName !== formData.producto_deseado && !formData.producto_deseado.includes(' + ')) {
        const opt = allPaintOptions.find(p => p.nombre === formData.producto_deseado || p.nombre.toLowerCase().includes(formData.producto_deseado.toLowerCase()));
        if (opt) {
          const prices = getPaintPrices(opt.nombre);
          const pal = getPaletteForProductName(opt.nombre);
          const defColor = formData.color_acabado || (pal[0]?.name ?? 'Blanco Puro');
          setSelectedPaints([{
            id: opt.id,
            nombre: opt.nombre,
            titulo: opt.titulo,
            subtitulo: opt.subtitulo,
            icono: opt.icono,
            familia: opt.familia,
            precioGalon: prices.galon,
            precioCunete: prices.cunete,
            area_m2: Math.max(1, formData.area_m2 || 35),
            color_acabado: defColor,
            badge: opt.badge,
            tag: opt.tag,
            tagColor: opt.tagColor,
            descripcion: opt.descripcion,
          }]);
        }
      }
    }
  }, [formData.producto_deseado, allPaintOptions]);

  // Sincronizar cambios simples de m2 y color si solo hay 1 pintura
  useEffect(() => {
    if (selectedPaints.length === 1) {
      if (formData.area_m2 && selectedPaints[0].area_m2 !== formData.area_m2) {
        setSelectedPaints(prev => prev.map(p => ({ ...p, area_m2: formData.area_m2 })));
      }
      if (formData.color_acabado && selectedPaints[0].color_acabado !== formData.color_acabado) {
        setSelectedPaints(prev => prev.map(p => ({ ...p, color_acabado: formData.color_acabado })));
      }
    }
  }, [formData.area_m2, formData.color_acabado]);

  // Funciones de gestión de pinturas seleccionadas
  const handleTogglePaint = (option: PaintLineOptionItem) => {
    const exists = selectedPaints.some(p => p.id === option.id || p.nombre === option.nombre);
    if (exists) {
      if (selectedPaints.length <= 1) return;
      const next = selectedPaints.filter(p => p.id !== option.id && p.nombre !== option.nombre);
      const totalArea = next.reduce((sum, p) => sum + p.area_m2, 0);
      setSelectedPaints(next);
      onChange('area_m2', Number(totalArea.toFixed(2)));
      onChange('producto_deseado', next.length === 1 ? next[0].nombre : next.map(p => p.titulo).join(' + '));
    } else {
      const prices = getPaintPrices(option.nombre);
      const palette = getPaletteForProductName(option.nombre);
      const defColor = palette[0]?.name ?? 'Blanco Puro';
      const defaultArea = 25;
      const newPaint: CotizadorPaintItem = {
        id: option.id,
        nombre: option.nombre,
        titulo: option.titulo,
        subtitulo: option.subtitulo,
        icono: option.icono,
        familia: option.familia,
        precioGalon: prices.galon,
        precioCunete: prices.cunete,
        area_m2: defaultArea,
        color_acabado: defColor,
        badge: option.badge,
        tag: option.tag,
        tagColor: option.tagColor,
        descripcion: option.descripcion,
      };
      const next = [...selectedPaints, newPaint];
      const totalArea = next.reduce((sum, p) => sum + p.area_m2, 0);
      setSelectedPaints(next);
      onChange('area_m2', Number(totalArea.toFixed(2)));
      onChange('producto_deseado', next.map(p => p.titulo).join(' + '));
    }
  };

  const handleSelectOnlyPaint = (option: PaintLineOptionItem) => {
    const prices = getPaintPrices(option.nombre);
    const palette = getPaletteForProductName(option.nombre);
    const defColor = palette[0]?.name ?? 'Blanco Puro';
    const single: CotizadorPaintItem = {
      id: option.id,
      nombre: option.nombre,
      titulo: option.titulo,
      subtitulo: option.subtitulo,
      icono: option.icono,
      familia: option.familia,
      precioGalon: prices.galon,
      precioCunete: prices.cunete,
      area_m2: formData.area_m2 || 35,
      color_acabado: defColor,
      badge: option.badge,
      tag: option.tag,
      tagColor: option.tagColor,
      descripcion: option.descripcion,
    };
    setSelectedPaints([single]);
    onChange('producto_deseado', option.nombre);
    onChange('color_acabado', defColor);
  };

  const handleUpdatePaintArea = (paintId: string, newArea: number) => {
    const safeArea = Math.max(0.1, Number(newArea.toFixed(2)));
    const next = selectedPaints.map(p => p.id === paintId ? { ...p, area_m2: safeArea, editedCunetes: undefined, editedGalones: undefined } : p);
    const totalArea = next.reduce((sum, p) => sum + p.area_m2, 0);
    setSelectedPaints(next);
    onChange('area_m2', Number(totalArea.toFixed(2)));
  };

  const handleUpdatePaintColor = (paintId: string, newColor: string) => {
    const next = selectedPaints.map(p => p.id === paintId ? { ...p, color_acabado: newColor } : p);
    setSelectedPaints(next);
    if (next.length > 0 && next[0].id === paintId) {
      onChange('color_acabado', newColor);
    }
  };

  // Precios unitarios compatibles según producto principal
  const unitPrices = useMemo(() => {
    const mainPaint = selectedPaints[0];
    const prices = mainPaint ? getPaintPrices(mainPaint.nombre) : { galon: 84900, cunete: 390500 };
    return {
      baseGalon: prices.galon,
      cunetePrice: prices.cunete,
      selladorPrice: 78000,
    };
  }, [selectedPaints]);

  // Generación integral de productos calculados (REQUISITO 2)
  const calculatedProducts = useMemo(() => {
    const items: CalculatedProductItem[] = [];
    const supLower = (formData.superficie || '').toLowerCase();
    const esSuperficieRugosa = supLower.includes('mampostería') || supLower.includes('rugosa') || supLower.includes('ladrillo') || supLower.includes('bloque');
    const factorCorreccion = esSuperficieRugosa ? 1.15 : 1.0;
    const manos = Math.max(1, Number(formData.manos_capas) || 2);
    const desperdicio = formData.metodo_aplicacion?.includes('15%') ? 1.15 : formData.metodo_aplicacion?.includes('10%') ? 1.10 : 1.05;

    selectedPaints.forEach((paint) => {
      const area = Math.max(0, Number(paint.area_m2) || 0);
      const rendimientoBase = 32;
      const consumoNeto = (area * (manos / 2) / rendimientoBase) * factorCorreccion * desperdicio;
      const galonesTotales = Math.max(0, Math.ceil(consumoNeto));

      let cunetes = Math.floor(galonesTotales / 5);
      let galonesSueltos = galonesTotales % 5;

      if (paint.editedCunetes !== undefined) {
        cunetes = paint.editedCunetes;
      }
      if (paint.editedGalones !== undefined) {
        galonesSueltos = paint.editedGalones;
      }

      const prices = getPaintPrices(paint.nombre);
      const swatchHex = getSwatchHex(paint.color_acabado, paint.nombre);
      const imgUrl = getImageUrlForPaint(paint.nombre);

      // Cuñetes
      items.push({
        id: `cunete-${paint.id}`,
        paintId: paint.id,
        type: 'cunete',
        productName: paint.nombre,
        displayName: `${paint.titulo || paint.nombre} • Cuñete (5 Gal)`,
        presentation: 'Cuñete (5 Gal)',
        quantity: cunetes,
        unitPrice: prices.cunete,
        color: paint.color_acabado,
        colorHex: swatchHex,
        sku: getSkuForPaint(paint.nombre, 'cunete'),
        imagenUrl: imgUrl,
        area_m2: paint.area_m2,
      });

      // Galones
      items.push({
        id: `galon-${paint.id}`,
        paintId: paint.id,
        type: 'galon',
        productName: paint.nombre,
        displayName: `${paint.titulo || paint.nombre} • Galón (1 Gal)`,
        presentation: 'Galón',
        quantity: galonesSueltos,
        unitPrice: prices.galon,
        color: paint.color_acabado,
        colorHex: swatchHex,
        sku: getSkuForPaint(paint.nombre, 'galon'),
        imagenUrl: imgUrl,
        area_m2: paint.area_m2,
      });
    });

    // Sellador
    const selladorQty = editedQuantities.sellador !== undefined 
      ? editedQuantities.sellador 
      : (Boolean(formData.incluir_sellador_forzado) || calculation.requiereSellador ? (calculation.galonesSellador || 1) : 0);
      
    if (selladorQty > 0) {
      items.push({
        id: 'sellador-galon',
        paintId: 'sellador',
        type: 'sellador',
        productName: 'Sellador Antialcalino / Fijador Imprimante',
        displayName: 'Sellador Antialcalino / Fijador Imprimante (1 Gal)',
        presentation: 'Galón',
        quantity: selladorQty,
        unitPrice: 78000,
        color: 'Incoloro / Sellador',
        colorHex: '#F1F5F9',
        sku: 'PIN-AQB-01',
        imagenUrl: '/src/assets/images/koraza_bucket_studio_1790894419359.jpg',
      });
    }

    return items;
  }, [selectedPaints, formData.superficie, formData.manos_capas, formData.metodo_aplicacion, editedQuantities.sellador, formData.incluir_sellador_forzado, calculation]);

  // Filtrado indispensable requerido por la especificación:
  const activeItems = calculatedProducts.filter(item => item.quantity > 0);

  const handleUpdateItemQuantity = (itemId: string, newQty: number) => {
    const safeQty = Math.max(0, newQty);
    if (itemId === 'sellador-galon') {
      setEditedQuantities(prev => ({ ...prev, sellador: safeQty }));
      return;
    }
    setSelectedPaints(prev => prev.map(paint => {
      if (itemId === `cunete-${paint.id}`) {
        return { ...paint, editedCunetes: safeQty };
      }
      if (itemId === `galon-${paint.id}`) {
        return { ...paint, editedGalones: safeQty };
      }
      return paint;
    }));
  };

  // Totales de volumen
  const totalGalonesAll = useMemo(() => {
    return activeItems
      .filter(i => i.type !== 'sellador')
      .reduce((sum, i) => sum + (i.presentation.includes('5 Gal') ? i.quantity * 5 : i.quantity), 0);
  }, [activeItems]);

  const totalCunetesAll = useMemo(() => {
    return activeItems
      .filter(i => i.type === 'cunete')
      .reduce((sum, i) => sum + i.quantity, 0);
  }, [activeItems]);

  const totalGalonesSueltosAll = useMemo(() => {
    return activeItems
      .filter(i => i.type === 'galon')
      .reduce((sum, i) => sum + i.quantity, 0);
  }, [activeItems]);

  // Totales recalculados en tiempo real según las cantidades de activeItems y herramientas añadidas
  const liveSummaryTotals = useMemo(() => {
    const subtotalCunetes = activeItems
      .filter(i => i.type === 'cunete')
      .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const subtotalGalones = activeItems
      .filter(i => i.type === 'galon')
      .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const subtotalSellador = activeItems
      .filter(i => i.type === 'sellador')
      .reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const subtotalPinturaYSellador = activeItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

    const subtotalTools = Object.entries(selectedTools).reduce((acc, [toolId, qty]) => {
      const tool = RECOMMENDED_PROJECT_TOOLS.find(t => t.id === toolId);
      return acc + (tool ? tool.precio * qty : 0);
    }, 0);

    const totalCOP = subtotalPinturaYSellador + subtotalTools;

    return {
      subtotalCunetes,
      subtotalGalones,
      subtotalSellador,
      subtotalPinturaYSellador,
      subtotalTools,
      totalCOP,
    };
  }, [activeItems, selectedTools]);

  const handleToggleTool = (toolId: string) => {
    setSelectedTools(prev => {
      const current = prev[toolId] || 0;
      if (current > 0) {
        const copy = { ...prev };
        delete copy[toolId];
        return copy;
      }
      return { ...prev, [toolId]: 1 };
    });
  };

  const handleUpdateToolQty = (toolId: string, newQty: number) => {
    setSelectedTools(prev => {
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[toolId];
        return copy;
      }
      return { ...prev, [toolId]: newQty };
    });
  };

  const handleDismissTool = (toolId: string) => {
    setDismissedTools(prev => ({ ...prev, [toolId]: true }));
    setSelectedTools(prev => {
      if (prev[toolId]) {
        const copy = { ...prev };
        delete copy[toolId];
        return copy;
      }
      return prev;
    });
  };

  const handleRestoreTool = (toolId: string) => {
    setDismissedTools(prev => {
      const copy = { ...prev };
      delete copy[toolId];
      return copy;
    });
  };

  // Consejo Pintuco 100% dinámico y reactivo a la compra actual
  const activeDynamicConsejo = useMemo(() => {
    return getDynamicConsejoPintuco(formData, calculation);
  }, [formData, calculation]);

  // Recomendaciones inteligentes de complementos según lo que lleva el carrito
  const contextualRecommendations = useMemo(() => {
    return getContextualToolRecommendations(formData, calculation, selectedTools);
  }, [formData, calculation, selectedTools]);

  // Sincronización total de cantidades de pintura, sellador, herramientas y datos de despacho al Carrito
  const handleSyncToCart = (proceedToCheckout: boolean) => {
    // 1. Convertir activeItems en ítems de carrito con sus colores y presentaciones individuales
    const calculatedProductsPayload: CartItem[] = activeItems.map((item, idx) => ({
      id: `quote-${item.id}-${Date.now()}-${idx}`,
      nombre: item.displayName,
      sku: item.sku,
      presentacion: item.presentation as any,
      cantidad: item.quantity,
      precioUnitario: item.unitPrice,
      colorSeleccionado: item.color,
      marca: 'Pintuco',
      imagenUrl: item.imagenUrl,
      subtotal: item.quantity * item.unitPrice,
    }));

    const toolsPayload = Object.entries(selectedTools)
      .filter(([_, qty]) => qty > 0)
      .map(([toolId, qty]) => {
        const tool = RECOMMENDED_PROJECT_TOOLS.find(t => t.id === toolId)!;
        return {
          id: tool.id,
          nombre: tool.nombre,
          presentacion: tool.presentacion,
          cantidad: qty,
          precioUnitario: tool.precio,
          sku: tool.sku,
          imagenUrl: tool.imagenUrl,
        };
      });

    const deliveryPayload = {
      isDefined: true,
      modalidad: currentModalidad,
      departamento: activeDepartamentoName,
      ciudad: formData.ciudad || activeDeptoObj.capital,
      sede: currentModalidad === 'retiro_tienda' ? (formData.sede_retiro || (availableStores[0]?.nombre ?? '')) : undefined,
      direccion: currentModalidad === 'retiro_tienda'
        ? (formData.direccion_obra || `Retiro en Tienda: ${formData.sede_retiro || (availableStores[0]?.nombre ?? '')}`)
        : (formData.direccion_obra || ''),
      nombre: formData.nombre_razon_social || '',
      documento: formData.documento || '',
      tipoDocumento: formData.tipo_documento || 'CC',
      telefono: formData.telefono || '',
      email: formData.correo_electronico || userSession?.email || '',
      costoFlete: liveShipping.costoFlete,
      hubDespacho: liveShipping.hubDespacho,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('colorlink_quote_delivery', JSON.stringify(deliveryPayload));
      localStorage.setItem('colorlink_shipping_state', JSON.stringify(deliveryPayload));
      if (deliveryPayload.direccion) {
        localStorage.setItem('shippingAddress', deliveryPayload.direccion);
        localStorage.setItem('colorlink_shipping_address', deliveryPayload.direccion);
        localStorage.setItem('colorlink_user_address', deliveryPayload.direccion);
      }
      if (deliveryPayload.ciudad) {
        localStorage.setItem('colorlink_shipping_city', deliveryPayload.ciudad);
      }
      if (deliveryPayload.departamento) {
        localStorage.setItem('colorlink_shipping_depto', deliveryPayload.departamento);
      }
      if (deliveryPayload.modalidad) {
        localStorage.setItem('colorlink_shipping_modalidad', deliveryPayload.modalidad);
      }
      if (deliveryPayload.nombre) {
        localStorage.setItem('colorlink_customer_name', deliveryPayload.nombre);
      }
      if (deliveryPayload.documento) {
        localStorage.setItem('colorlink_customer_doc', deliveryPayload.documento);
      }
      if (deliveryPayload.telefono) {
        localStorage.setItem('colorlink_customer_phone', deliveryPayload.telefono);
      }

      window.dispatchEvent(new CustomEvent('colorlink_quote_delivery_updated', { detail: deliveryPayload }));
      window.dispatchEvent(new CustomEvent('colorlink_shipping_state_updated', { detail: deliveryPayload }));
      window.dispatchEvent(new CustomEvent('colorlink_shipping_address_updated', {
        detail: { address: deliveryPayload.direccion, city: deliveryPayload.ciudad }
      }));
    } catch (e) {
      console.warn('Error saving delivery data to localStorage:', e);
    }

    if (proceedToCheckout) {
      try {
        sessionStorage.setItem('colorlink_open_checkout_step', 'true');
      } catch {}
    }

    if (onAddToCart) {
      onAddToCart(editedQuantities, proceedToCheckout, toolsPayload, deliveryPayload, calculatedProductsPayload);
    } else if (onSaveOrder) {
      onSaveOrder(proceedToCheckout ? 'pedido' : 'cotizacion');
    }
  };

  // Superficies mapping with human-friendly details
  const surfaceOptions: { id: SuperficieTipo; label: string; desc: string; icon: string }[] = [
    { id: 'Pañete / Revoque Liso', label: 'Pañete o Revoque', desc: 'Muro tradicional frisado liso', icon: '🧱' },
    { id: 'Pintura Existente', label: 'Pintura Existente / Estuco', desc: 'Pared empastada o pintada', icon: '✨' },
    { id: 'Drywall / Yeso', label: 'Drywall o Yeso Cartón', desc: 'Placas livianas interiores', icon: '📐' },
    { id: 'Mampostería', label: 'Ladrillo o Mampostería', desc: 'Poroso, requiere +15% rendimiento', icon: '🧱' },
    { id: 'Concreto Vaciado', label: 'Concreto o Cemento', desc: 'Estructuras firmes o columnas', icon: '🏗️' },
    { id: 'Madera', label: 'Madera o Metales', desc: 'Carpintería o perfiles estructurales', icon: '🪵' },
    { 
      id: 'Otro / Superficie Especial', 
      label: 'Otro / Superficie Especial', 
      desc: 'Azulejos, plástico, fibra de vidrio u otros materiales no convencionales', 
      icon: '🧪' 
    },
  ];

  // Condición de la pared
  const conditionOptions: { id: CondicionPared; label: string; tag: string; desc: string; requiresSealer: boolean }[] = [
    { 
      id: 'Obra Nueva / Revoque Nuevo', 
      label: 'Obra Nueva / Sin Pintura Previa', 
      tag: 'Requiere Sellador NTC 1335',
      desc: 'Superficie virgen recién pañetada o estucada. Requiere imprimante antialcalino.',
      requiresSealer: true
    },
    { 
      id: 'Buen Estado / Repinte', 
      label: 'Repinte en Buen Estado', 
      tag: 'Aplicación Directa',
      desc: 'Pintura existente firme y limpia, sin manchas severas ni descascaramiento.',
      requiresSealer: false
    },
    { 
      id: 'Superficie con Humedad / Fisuras', 
      label: 'Pared con Humedad o Fisuras', 
      tag: 'Protección Especial',
      desc: 'Presencia de hongos, filtración o microfisuras. Requiere sellador impermeabilizante.',
      requiresSealer: true
    },
  ];

  // Department & City Cascading
  const activeDepartamentoName = formData.departamento || (() => {
    const matched = DEPARTAMENTOS_COLOMBIA.find(d => 
      d.municipios.some(m => m.nombre.toLowerCase() === (formData.ciudad || '').toLowerCase()) ||
      d.capital.toLowerCase() === (formData.ciudad || '').toLowerCase()
    );
    return matched ? matched.nombre : 'Bogotá D.C.';
  })();

  const activeDeptoObj = useMemo(() => {
    return DEPARTAMENTOS_COLOMBIA.find(
      d => d.nombre.toLowerCase() === activeDepartamentoName.toLowerCase()
    ) || DEPARTAMENTOS_COLOMBIA[0];
  }, [activeDepartamentoName]);

  const currentModalidad = formData.modalidad_entrega || 'domicilio';

  // Tiendas Pintuco disponibles según departamento y ciudad para Retiro en Tienda
  const availableStores = useMemo(() => {
    return getAvailableStoresForLocation(activeDepartamentoName, formData.ciudad);
  }, [activeDepartamentoName, formData.ciudad]);

  const selectedStore = useMemo(() => {
    return availableStores.find(s => s.nombre === formData.sede_retiro) || availableStores[0];
  }, [availableStores, formData.sede_retiro]);

  // Sincronizar automáticamente sede_retiro y direccion_obra si cambia la ciudad o la modalidad a retiro
  useEffect(() => {
    if (currentModalidad === 'retiro_tienda' && availableStores.length > 0) {
      const isCurrentStoreValid = availableStores.some(s => s.nombre === formData.sede_retiro);
      if (!isCurrentStoreValid) {
        const defaultStore = availableStores[0];
        queueMicrotask(() => {
          onChange('sede_retiro', defaultStore.nombre);
          onChange('direccion_obra', `Retiro en Tienda: ${defaultStore.nombre} - ${defaultStore.direccion}`);
        });
      }
    }
  }, [currentModalidad, availableStores, formData.sede_retiro, onChange]);

  // ============================================================================
  // FILTRO DINÁMICO DE PALETA DE COLOR SEGÚN EL TIPO DE PINTURA SELECCIONADA
  // ============================================================================
  const activePaintCategory = useMemo(() => {
    const prod = (formData.producto_deseado || '').toLowerCase();

    // 1. Koraza: Alta resistencia exterior e intemperie
    if (prod.includes('koraza')) {
      return {
        type: 'koraza',
        label: 'Koraza Clima Extremo (Fachadas y Exteriores)',
        paintLineName: 'Koraza Doble Vida Protección Clima Extremo',
        palette: KORAZA_EXTERIOR_PALETTE,
        allowsCustomTinting: true,
        badgeText: 'Tonos de Alta Resistencia Exterior e Intemperie',
        badgeColor: 'bg-blue-100 text-[#004B93] border-blue-300',
        restrictionNotice: null
      };
    }

    // 2. Pintulux / Esmaltes: Colores brillante/semibrillante para metales y maderas
    if (prod.includes('pintulux') || prod.includes('esmalte') || prod.includes('anticorrosivo')) {
      return {
        type: 'esmalte_anticorrosivo',
        label: 'Pintulux Esmalte (Metales y Maderas)',
        paintLineName: 'Pintulux Esmalte Sintético Anticorrosivo',
        palette: PINTULUX_ESMALTE_PALETTE,
        allowsCustomTinting: false,
        badgeText: 'Colores Brillante y Semibrillante para Metales y Maderas',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        restrictionNotice: 'ℹ️ Esmaltes anticorrosivos de secado rápido para rejas, cancelería, puertas y maderas. Pigmentación formulada de fábrica.'
      };
    }

    // 3. Epóxicos y Tráfico / Demarcación
    if (prod.includes('tráfico') || prod.includes('trafico')) {
      return {
        type: 'epoxico_trafico',
        label: 'Epóxicos y Demarcación de Tráfico',
        paintLineName: 'Pintutráfico / Epóxicos Industriales',
        palette: EPOXICOS_TRAFICO_PALETTE,
        allowsCustomTinting: false,
        badgeText: 'Colores Reglamentarios NTC 1360',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        restrictionNotice: '⚠️ Las pinturas para demarcación vial y pisos industriales utilizan únicamente colores reglamentarios de fábrica. La preparación tintométrica personalizada no está habilitada para esta línea técnica.'
      };
    }

    // 4. Barnices y Tintes para Madera
    if (prod.includes('barniz') || prod.includes('madera') || prod.includes('tinte')) {
      return {
        type: 'madera_barniz',
        label: 'Barnices y Tintes para Madera',
        paintLineName: 'Línea Maderas y Barnices Pintuco',
        palette: MADERA_BARNICES_PALETTE,
        allowsCustomTinting: false,
        badgeText: 'Tonos Naturales de Madera',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        restrictionNotice: '⚠️ Los barnices y tintes vienen formulados de fábrica en tonos de maderas nobles traslúcidas con filtro UV. No admiten sistema tintométrico arquitectónico.'
      };
    }

    // 5. Impermeabilizantes y Techos (Aquablock)
    if (prod.includes('aquablock') || prod.includes('impermeabiliz') || prod.includes('fill')) {
      return {
        type: 'impermeabilizante',
        label: 'Impermeabilizantes y Techos (Aquablock)',
        paintLineName: 'Aquablock Barrera Impermeabilizante',
        palette: IMPERMEABILIZANTES_PALETTE,
        allowsCustomTinting: false,
        badgeText: 'Tonos Elastoméricos Barrera Solar',
        badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
        restrictionNotice: 'ℹ️ Tonos elastoméricos especializados con alta reflectancia solar para reducción térmica y aislamiento de filtraciones.'
      };
    }

    // 6. Default: Viniltex (Vinilos de agua: tonos pastel, neutros y vivos de interior)
    return {
      type: 'viniltex',
      label: 'Viniltex Avanzado (Interiores y Zonas Húmedas)',
      paintLineName: 'Viniltex Avanzado Máxima Lavabilidad',
      palette: VINILTEX_INTERIOR_PALETTE,
      allowsCustomTinting: true,
      badgeText: 'Tonos Pastel, Neutros y Vivos de Interior',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      restrictionNotice: null
    };
  }, [formData.producto_deseado]);

  // Identificador de la familia activa para los botones y tarjetas del Paso 2
  const selectedPaintFamilyKey = useMemo(() => {
    const prod = (formData.producto_deseado || '').toLowerCase();
    if (prod.includes('koraza')) return 'koraza';
    if (prod.includes('pintulux') || prod.includes('esmalte') || prod.includes('anticorrosivo')) return 'pintulux';
    if (prod.includes('aquablock') || prod.includes('impermeabiliz')) return 'aquablock';
    if (prod.includes('tráfico') || prod.includes('trafico')) return 'trafico';
    if (prod.includes('barniz') || prod.includes('madera')) return 'madera';
    return 'viniltex';
  }, [formData.producto_deseado]);

  // Callback para cambiar tipo de pintura y resetear reactivamente el color al primer tono de la nueva paleta
  const handleSelectPaintType = (productName: string) => {
    onChange('producto_deseado', productName);
    const newPalette = getPaletteForProductName(productName);
    const defColor = (newPalette && newPalette.length > 0) ? newPalette[0].name : 'Blanco Puro';
    onChange('color_acabado', defColor);

    const opt = allPaintOptions.find(p => p.nombre === productName || p.nombre.toLowerCase().includes(productName.toLowerCase()));
    if (opt) {
      handleSelectOnlyPaint(opt);
    }
  };

  // Sincronización inteligente de pinturas según lo elegido en el Paso 1 (Espacio, Superficie y Condición)
  const lastStep1Signature = useRef<string>(`${formData.ambiente}|${formData.superficie}|${formData.condicion}`);
  useEffect(() => {
    const currentSig = `${formData.ambiente}|${formData.superficie}|${formData.condicion}`;
    if (lastStep1Signature.current !== currentSig) {
      lastStep1Signature.current = currentSig;

      const cond = (formData.condicion || '').toLowerCase();
      const amb = (formData.ambiente || '').toLowerCase();
      const sup = (formData.superficie || '').toLowerCase();

      queueMicrotask(() => {
        // 1. Humedad / Fisuras -> Preseleccionar Aquablock
        if (cond.includes('humedad') || cond.includes('fisura')) {
          setPaintFilterTab('especiales');
          handleSelectPaintType('Aquablock Sellador Antihumedad Bloqueador');
        } 
        // 2. Fachadas / Exteriores -> Preseleccionar Koraza
        else if (amb.includes('exterior') || amb.includes('fachada')) {
          setPaintFilterTab('exteriores');
          handleSelectPaintType('Koraza Doble Vida Protección Clima Extremo');
        } 
        // 3. Estructuras Metálicas -> Preseleccionar Pintulux Esmalte
        else if (sup.includes('metal')) {
          setPaintFilterTab('exteriores');
          handleSelectPaintType('Pintulux Esmalte Sintético Anticorrosivo');
        } 
        // 4. Maderas -> Preseleccionar Línea Maderas y Barnices
        else if (sup.includes('madera')) {
          setPaintFilterTab('especiales');
          handleSelectPaintType('Línea Maderas y Barnices Pintuco');
        } 
        // 5. Zonas Húmedas / Baños y Cocinas -> Preseleccionar Viniltex Baños y Cocinas
        else if (amb.includes('baño') || amb.includes('cocina') || amb.includes('húmeda')) {
          setPaintFilterTab('especiales');
          handleSelectPaintType('Viniltex Baños y Cocinas Antibacterial');
        } 
        // 6. Techos / Cielorrasos -> Preseleccionar Intervinil Cielos Mate
        else if (amb.includes('techo') || amb.includes('cielo')) {
          setPaintFilterTab('interiores');
          handleSelectPaintType('Intervinil Cielos Mate Antirreflejo');
        } 
        // 7. Interiores (Default) -> Viniltex Avanzado
        else {
          setPaintFilterTab('interiores');
          handleSelectPaintType('Viniltex Avanzado Máxima Lavabilidad');
        }
      });
    }
  }, [formData.ambiente, formData.superficie, formData.condicion]);

  // Sincronizar y resetear automáticamente el color seleccionado al primer tono cuando cambia la paleta del tipo de pintura
  const lastPaletteTypeRef = useRef<string>(activePaintCategory.type);
  useEffect(() => {
    // Si cambió el tipo de pintura, resetear siempre al primer color de la nueva paleta
    if (lastPaletteTypeRef.current !== activePaintCategory.type) {
      lastPaletteTypeRef.current = activePaintCategory.type;
      if (activePaintCategory.palette.length > 0) {
        queueMicrotask(() => {
          onChange('color_acabado', activePaintCategory.palette[0].name);
        });
      }
      return;
    }

    // Si el color actual no pertenece a la paleta activa, resetear al primer tono disponible
    const currentPalette = activePaintCategory.palette;
    const isColorValid = currentPalette.some(
      c => c.name === formData.color_acabado || (formData.color_acabado && formData.color_acabado.includes(c.code))
    );
    if (!isColorValid && currentPalette.length > 0) {
      queueMicrotask(() => {
        onChange('color_acabado', currentPalette[0].name);
      });
    }
  }, [activePaintCategory, formData.color_acabado, onChange]);

  // Live Shipping calculation
  const liveShipping = useMemo(() => {
    return calculateShipping(
      activeDepartamentoName,
      formData.ciudad || activeDeptoObj.capital,
      Math.max(1, Math.ceil((formData.area_m2 || 10) / 30 * 1.05)),
      currentModalidad,
      650000
    );
  }, [activeDepartamentoName, formData.ciudad, activeDeptoObj.capital, formData.area_m2, currentModalidad]);

  const handleDeptoChange = (newDepto: string) => {
    onChange('departamento', newDepto);
    const found = DEPARTAMENTOS_COLOMBIA.find(d => d.nombre === newDepto);
    if (found && found.municipios.length > 0) {
      const firstCity = found.municipios[0].nombre;
      onChange('ciudad', firstCity);
      if (currentModalidad === 'retiro_tienda') {
        const stores = getAvailableStoresForLocation(newDepto, firstCity);
        if (stores.length > 0) {
          onChange('sede_retiro', stores[0].nombre);
          onChange('direccion_obra', `Retiro en Tienda: ${stores[0].nombre} - ${stores[0].direccion}`);
        }
      }
    }
  };

  // 1. Estado Global Compartido de Entrega: Sincronización en tiempo real al seleccionar o editar campos de Paso 3
  useEffect(() => {
    const isPickup = currentModalidad === 'retiro_tienda' || (currentModalidad as string) === 'pickup';
    const storeObj = isPickup ? (availableStores.find(s => s.nombre === formData.sede_retiro) || availableStores[0]) : null;
    const storeName = isPickup ? (formData.sede_retiro || storeObj?.nombre || '') : '';
    
    let resolvedAddr = formData.direccion_obra || '';
    if (isPickup) {
      resolvedAddr = storeObj ? `Retiro en Tienda: ${storeObj.nombre} - ${storeObj.direccion}` : (storeName ? `Retiro en Tienda: ${storeName}` : 'Retiro en Tienda Pintuco');
    }

    const fee = isPickup ? 0 : liveShipping.costoFlete;

    const deliveryPayload = {
      isDefined: true,
      modalidad: isPickup ? ('retiro_tienda' as const) : ('domicilio' as const),
      deliveryMode: isPickup ? ('pickup' as const) : ('delivery' as const),
      departamento: activeDepartamentoName,
      department: activeDepartamentoName,
      ciudad: formData.ciudad || activeDeptoObj.capital,
      city: formData.ciudad || activeDeptoObj.capital,
      sede: isPickup ? storeName : undefined,
      pickupStore: isPickup ? storeName : undefined,
      direccion: resolvedAddr,
      deliveryAddress: resolvedAddr,
      shippingAddress: resolvedAddr,
      costoFlete: fee,
      hubDespacho: isPickup ? storeName : liveShipping.hubDespacho,
      nombre: formData.nombre_razon_social || userSession?.nombre || '',
      documento: formData.documento || userSession?.documento || '',
      tipoDocumento: formData.tipo_documento || 'CC',
      telefono: formData.telefono || userSession?.telefono || '',
      email: formData.correo_electronico || userSession?.email || '',
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('colorlink_quote_delivery', JSON.stringify(deliveryPayload));
      localStorage.setItem('colorlink_shipping_state', JSON.stringify(deliveryPayload));
      if (resolvedAddr) {
        localStorage.setItem('shippingAddress', resolvedAddr);
        localStorage.setItem('colorlink_shipping_address', resolvedAddr);
      }
      if (deliveryPayload.ciudad) {
        localStorage.setItem('colorlink_shipping_city', deliveryPayload.ciudad);
      }
      if (deliveryPayload.departamento) {
        localStorage.setItem('colorlink_shipping_depto', deliveryPayload.departamento);
      }
      localStorage.setItem('colorlink_shipping_modalidad', deliveryPayload.modalidad);

      window.dispatchEvent(new CustomEvent('colorlink_quote_delivery_updated', { detail: deliveryPayload }));
      window.dispatchEvent(new CustomEvent('colorlink_shipping_state_updated', { detail: deliveryPayload }));
    } catch {}

    if (cartContext && cartContext.setShippingState) {
      cartContext.setShippingState(deliveryPayload);
    }
  }, [
    currentModalidad,
    formData.sede_retiro,
    formData.direccion_obra,
    formData.ciudad,
    activeDepartamentoName,
    availableStores,
    liveShipping.costoFlete,
    liveShipping.hubDespacho,
    formData.nombre_razon_social,
    formData.documento,
    formData.telefono,
    formData.correo_electronico,
    userSession,
  ]);

  const applyDimensionsCalc = () => {
    const calculatedArea = Number((dimAncho * dimAlto * dimParedes).toFixed(2));
    onChange('area_m2', Math.max(0.1, calculatedArea));
    setShowDimensionCalc(false);
  };

  // Find color swatch in active palette, with fallback
  const selectedColorObj = useMemo(() => {
    const found = activePaintCategory.palette.find(
      c => c.name === formData.color_acabado || formData.color_acabado.includes(c.code)
    );
    if (found) return found;
    return activePaintCategory.palette[0] || COLOR_PALETTE[0];
  }, [activePaintCategory, formData.color_acabado]);

  // Atajos de metraje contextuales según la categoría elegida en el Paso 1
  const currentAreaContext = useMemo(() => {
    return getAreaShortcutsForContext(formData.ambiente, formData.superficie);
  }, [formData.ambiente, formData.superficie]);

  // Price estimate for calculation
  const estimatedPriceCOP = useMemo(() => {
    const baseGalon = calculation.productoSugerido.includes('Koraza') ? 142000 :
      calculation.productoSugerido.includes('Baños') ? 128000 : 115000;
    const cunetePrice = Math.round(baseGalon * 4.6);
    const totalPintura = (calculation.cuñetesPintura * cunetePrice) + (calculation.galonesSueltosPintura * baseGalon);
    const totalSellador = calculation.galonesSellador * 78000;
    return totalPintura + totalSellador;
  }, [calculation]);

  return (
    <div className="bg-[#F4F6F8] rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-slate-900 transition-all">
      
      {/* =====================================================================
          1. CABECERA ELEGANTE DEL WIZARD: STEPPER EN 3 PASOS
      ===================================================================== */}
      <div className="bg-gradient-to-r from-[#004B93] via-[#003B75] to-[#0A0E17] text-white p-5 sm:p-6 border-b border-slate-200/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0">
              <Paintbrush className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#E30613] text-white">
                  COLORLINK Pintuco
                </span>
                <span className="text-xs text-blue-200 font-medium hidden sm:inline">
                  Calculadora Paso a Paso NTC 1335
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
                Cotizador Inteligente de Pintura
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Reiniciar formulario"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
            <button
              type="button"
              onClick={onOpenNLPExtractor}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Pegar Mensaje IA</span>
            </button>
          </div>
        </div>

        {/* Wizard Stepper Pills Bar (4 Pasos Oficiales) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/20 p-1.5 sm:p-2 rounded-2xl backdrop-blur-sm border border-white/10">
          
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentStep === 1
                ? 'bg-white text-[#004B93] shadow-md shadow-black/20 scale-[1.01]'
                : currentStep > 1
                ? 'bg-white/15 text-white hover:bg-white/25'
                : 'text-blue-200/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
              currentStep === 1
                ? 'bg-[#004B93] text-white'
                : currentStep > 1
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-white/20 text-white'
            }`}>
              {currentStep > 1 ? '✓' : '1'}
            </span>
            <span className="truncate">1. ¿Qué pintarás?</span>
          </button>

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentStep === 2
                ? 'bg-white text-[#004B93] shadow-md shadow-black/20 scale-[1.01]'
                : currentStep > 2
                ? 'bg-white/15 text-white hover:bg-white/25'
                : 'text-blue-200/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
              currentStep === 2
                ? 'bg-[#004B93] text-white'
                : currentStep > 2
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-white/20 text-white'
            }`}>
              {currentStep > 2 ? '✓' : '2'}
            </span>
            <span className="truncate">2. Pintura y Medidas</span>
          </button>

          {/* Step 3 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentStep === 3
                ? 'bg-white text-[#004B93] shadow-md shadow-black/20 scale-[1.01]'
                : currentStep > 3
                ? 'bg-white/15 text-white hover:bg-white/25'
                : 'text-blue-200/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
              currentStep === 3
                ? 'bg-[#004B93] text-white'
                : currentStep > 3
                ? 'bg-emerald-400 text-slate-950'
                : 'bg-white/20 text-white'
            }`}>
              {currentStep > 3 ? '✓' : '3'}
            </span>
            <span className="truncate">3. Datos y Entrega</span>
          </button>

          {/* Step 4 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentStep === 4
                ? 'bg-white text-[#004B93] shadow-md shadow-black/20 scale-[1.01]'
                : 'text-blue-200/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
              currentStep === 4
                ? 'bg-[#004B93] text-white'
                : 'bg-white/20 text-white'
            }`}>
              4
            </span>
            <span className="truncate">4. Resumen y Consejo</span>
          </button>

        </div>

      </div>

      {/* =====================================================================
          2. CONTENIDO PRINCIPAL POR PASO (WIZARD BODY)
      ===================================================================== */}
      <div className="p-5 sm:p-8">

        {/* -------------------------------------------------------------------
            PASO 1: ¿QUÉ VAS A PINTAR? (Ambiente, Superficie, Condición)
        -------------------------------------------------------------------- */}
        {currentStep === 1 && (
          <div className="space-y-7 animate-fadeIn">
            
            {/* Step Header */}
            <div className="border-b border-slate-200/80 pb-4">
              <span className="text-[11px] font-bold text-[#004B93] uppercase tracking-wider">
                Paso 1 de 4 • Identificación del Espacio
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                ¿Qué tipo de espacio vas a transformar hoy?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Selecciona el ambiente y el sustrato para que el motor de IA asigne la fórmula Pintuco certificada.
              </p>
            </div>

            {/* 1.1 AMBIENTE / TIPO DE ESPACIO AMPLIADO */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1.1 ¿En qué tipo de espacio vas a aplicar la pintura?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                
                {/* Interiores */}
                <div
                  onClick={() => {
                    onChange('ambiente', 'Interior');
                    onChange('superficie', 'Pañete / Revoque Liso');
                    onChange('producto_deseado', 'Viniltex Avanzado Máxima Lavabilidad');
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    formData.ambiente.toLowerCase().includes('interior') && !formData.ambiente.toLowerCase().includes('otro')
                      ? 'border-[#004B93] bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                    formData.ambiente.toLowerCase().includes('interior') && !formData.ambiente.toLowerCase().includes('otro')
                      ? 'bg-[#004B93] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    🏠
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-900">Interiores</h4>
                      {formData.ambiente.toLowerCase().includes('interior') && !formData.ambiente.toLowerCase().includes('otro') && (
                        <Check className="w-3.5 h-3.5 text-[#004B93]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Salas, alcobas, comedores y pasillos.
                    </p>
                  </div>
                </div>

                {/* Fachadas / Exteriores */}
                <div
                  onClick={() => {
                    onChange('ambiente', 'Exterior Fachada');
                    onChange('superficie', 'Mampostería');
                    onChange('producto_deseado', 'Koraza Máxima Protección Clima Extremo');
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    formData.ambiente.toLowerCase().includes('exterior') || formData.ambiente.toLowerCase().includes('fachada')
                      ? 'border-[#004B93] bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                    formData.ambiente.toLowerCase().includes('exterior') || formData.ambiente.toLowerCase().includes('fachada')
                      ? 'bg-[#004B93] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    🏢
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-900">Fachadas y Exteriores</h4>
                      {(formData.ambiente.toLowerCase().includes('exterior') || formData.ambiente.toLowerCase().includes('fachada')) && (
                        <Check className="w-3.5 h-3.5 text-[#004B93]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Muros a la intemperie y terrazas.
                    </p>
                  </div>
                </div>

                {/* Pisos y Concreto */}
                <div
                  onClick={() => {
                    onChange('ambiente', 'Industrial / Pisos');
                    onChange('superficie', 'Concreto Vaciado');
                    onChange('producto_deseado', 'Pintutráfico Base Solvente Alto Desempeño');
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    formData.ambiente.toLowerCase().includes('piso') || formData.ambiente.toLowerCase().includes('industrial')
                      ? 'border-[#004B93] bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                    formData.ambiente.toLowerCase().includes('piso') || formData.ambiente.toLowerCase().includes('industrial')
                      ? 'bg-[#004B93] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    🧱
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-900">Pisos y Concreto</h4>
                      {(formData.ambiente.toLowerCase().includes('piso') || formData.ambiente.toLowerCase().includes('industrial')) && (
                        <Check className="w-3.5 h-3.5 text-[#004B93]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Alto tráfico, canchas, garajes y bodegas.
                    </p>
                  </div>
                </div>

                {/* Impermeabilización / Techos */}
                <div
                  onClick={() => {
                    onChange('ambiente', 'Techos / Cielorrasos');
                    onChange('superficie', 'Mampostería');
                    onChange('producto_deseado', 'Aquablock Sellador Antihumedad Bloqueador');
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    formData.ambiente.toLowerCase().includes('techo') || formData.ambiente.toLowerCase().includes('impermeabiliz')
                      ? 'border-[#004B93] bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                    formData.ambiente.toLowerCase().includes('techo') || formData.ambiente.toLowerCase().includes('impermeabiliz')
                      ? 'bg-[#004B93] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    💧
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-900">Impermeabilización / Techos</h4>
                      {(formData.ambiente.toLowerCase().includes('techo') || formData.ambiente.toLowerCase().includes('impermeabiliz')) && (
                        <Check className="w-3.5 h-3.5 text-[#004B93]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Goteras, humedades, cubiertas y tanques.
                    </p>
                  </div>
                </div>

                {/* Madera y Carpintería */}
                <div
                  onClick={() => {
                    onChange('ambiente', 'Interior');
                    onChange('superficie', 'Madera');
                    onChange('producto_deseado', 'Pintulux Esmalte Sintético Anticorrosivo');
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    formData.superficie.toLowerCase().includes('madera')
                      ? 'border-[#004B93] bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                    formData.superficie.toLowerCase().includes('madera')
                      ? 'bg-[#004B93] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    🪑
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-900">Madera y Carpintería</h4>
                      {formData.superficie.toLowerCase().includes('madera') && (
                        <Check className="w-3.5 h-3.5 text-[#004B93]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Muebles, puertas, pérgolas y decks.
                    </p>
                  </div>
                </div>

                {/* Estructuras Metálicas / Anticorrosivo */}
                <div
                  onClick={() => {
                    onChange('ambiente', 'Exterior Fachada');
                    onChange('superficie', 'Metal / Estructura');
                    onChange('producto_deseado', 'Pintulux Esmalte Sintético Anticorrosivo');
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    formData.superficie.toLowerCase().includes('metal')
                      ? 'border-[#004B93] bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                    formData.superficie.toLowerCase().includes('metal')
                      ? 'bg-[#004B93] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    ⚙️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-900">Estructuras Metálicas</h4>
                      {formData.superficie.toLowerCase().includes('metal') && (
                        <Check className="w-3.5 h-3.5 text-[#004B93]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Rejas, portones, tuberías y perfiles.
                    </p>
                  </div>
                </div>

                {/* Otro / Proyecto Personalizado */}
                <div
                  onClick={() => {
                    onChange('ambiente', 'Otro / Proyecto Personalizado');
                    onChange('superficie', 'Pintura Existente');
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 sm:col-span-2 lg:col-span-3 ${
                    formData.ambiente.toLowerCase().includes('otro') || formData.ambiente.toLowerCase().includes('personalizado')
                      ? 'border-[#004B93] bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl ${
                    formData.ambiente.toLowerCase().includes('otro') || formData.ambiente.toLowerCase().includes('personalizado')
                      ? 'bg-[#004B93] text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    ➕
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-900">Otro / Proyecto Personalizado</h4>
                      {(formData.ambiente.toLowerCase().includes('otro') || formData.ambiente.toLowerCase().includes('personalizado')) && (
                        <Check className="w-3.5 h-3.5 text-[#004B93]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Pisos de alto tráfico, humedades/goteras, tanques de agua, muebles o requerimientos específicos.
                    </p>
                  </div>
                </div>

              </div>

              {/* Campo para describir el proyecto personalizado */}
              {(formData.ambiente.toLowerCase().includes('otro') || formData.ambiente.toLowerCase().includes('personalizado')) && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5 animate-fadeIn">
                  <label className="block text-xs font-bold text-[#004B93] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#004B93]" />
                    <span>Describe tu proyecto o espacio personalizado:</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Tanque de reserva de agua, Cancha múltiple, Muebles de cocina empotrados, etc."
                    value={formData.tipo_obra || ''}
                    onChange={(e) => onChange('tipo_obra', e.target.value)}
                    className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                  />
                </div>
              )}
            </div>

            {/* 1.2 TIPO DE SUPERFICIE */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1.2 ¿Qué superficie tiene la pared?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {surfaceOptions.map((s) => {
                  const isSelected = formData.superficie === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => onChange('superficie', s.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#004B93] bg-blue-50/70 shadow-xs ring-1 ring-[#004B93]/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xl">{s.icon}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#004B93]" />}
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-slate-900">{s.label}</h5>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nota explicativa para Otro / Superficie Especial */}
              {formData.superficie === 'Otro / Superficie Especial' && (
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1.5 animate-fadeIn">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#004B93]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Superficie Especial (Azulejos, Plástico, Fibra de Vidrio, PVC o Materiales No Convencionales):</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Para azulejos esmaltados, PVC, fibra de vidrio o plásticos rígidos, se recomienda aplicar un promotor de adherencia / imprimante epóxico antes de la pintura de acabado para asegurar un anclaje duradero.
                  </p>
                </div>
              )}
            </div>

            {/* 1.3 ESTADO O CONDICIÓN DE LA PARED */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1.3 ¿Cuál es el estado actual de la superficie?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {conditionOptions.map((c) => {
                  const isSelected = formData.condicion === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => onChange('condicion', c.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#004B93] bg-blue-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            c.requiresSealer ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {c.tag}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-[#004B93]" />}
                        </div>
                        <h5 className="font-extrabold text-xs text-slate-900 mt-1">{c.label}</h5>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{c.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTÓN CONTINUAR AL PASO 2 */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#004B93] hover:bg-[#003B75] text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <span>Continuar a Tipo de Pintura y Medidas (Paso 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------------
            PASO 2: TIPO DE PINTURA, MEDIDAS Y COLOR PINTUCO
        -------------------------------------------------------------------- */}
        {currentStep === 2 && (
          <div className="space-y-7 animate-fadeIn">
            
            {/* Step Header */}
            <div className="border-b border-slate-200/80 pb-4">
              <span className="text-[11px] font-bold text-[#004B93] uppercase tracking-wider">
                Paso 2 de 4 • Tipo de Pintura, Medidas y Color
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                ¿Qué tipo de pintura prefieres, cuánto mide tu espacio y qué color deseas?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Elige la línea técnica Pintuco para tu proyecto, define los metros cuadrados y selecciona el tono oficial correspondiente.
              </p>
            </div>

            {/* 2.1 SELECCIÓN DE TIPO DE PINTURA PINTUCO CON SELECCIÓN MÚLTIPLE O ÚNICA */}
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                      2.1 ¿Qué tipo de pintura Pintuco prefieres?
                    </label>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-[#E30613] border border-red-200">
                      Línea Oficial Pintuco
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#004B93] border border-blue-200">
                      Selección Múltiple Habilitada
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Puedes elegir una pintura principal o seleccionar varias (ej. paredes, cielos y zonas húmedas). Cada una tendrá su metraje (m²) y color independiente.
                  </p>
                </div>

                {/* Badges de pinturas activas seleccionadas */}
                <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {selectedPaints.length > 1 ? `Pinturas seleccionadas (${selectedPaints.length}):` : 'Pintura activa:'}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedPaints.map((p) => (
                      <span
                        key={p.id}
                        className="text-[11px] font-bold text-[#004B93] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{p.icono}</span>
                        <strong className="text-slate-900 font-extrabold truncate max-w-[150px]">{p.titulo}</strong>
                        {selectedPaints.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const opt = allPaintOptions.find(o => o.id === p.id || o.nombre === p.nombre);
                              if (opt) handleTogglePaint(opt);
                            }}
                            className="w-4 h-4 rounded-full bg-slate-200 hover:bg-red-500 hover:text-white text-slate-600 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer ml-0.5"
                            title="Quitar esta pintura"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Encabezado de Pestañas y Navegación del Carrusel */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                {/* Pestañas de Filtrado Rápido: Interiores | Exteriores | Zonas Húmedas / Especiales */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl w-full sm:w-fit border border-slate-200 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setPaintFilterTab('interiores')}
                    className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      paintFilterTab === 'interiores'
                        ? 'bg-[#004B93] text-white shadow-xs ring-1 ring-[#004B93]'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <span>🏠</span>
                    <span>Interiores</span>
                    <span className="text-[10px] opacity-80 font-normal">({buildComprehensiveCatalogPaints('interiores', supabaseProducts).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaintFilterTab('exteriores')}
                    className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      paintFilterTab === 'exteriores'
                        ? 'bg-[#004B93] text-white shadow-xs ring-1 ring-[#004B93]'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <span>☀️</span>
                    <span>Exteriores</span>
                    <span className="text-[10px] opacity-80 font-normal">({buildComprehensiveCatalogPaints('exteriores', supabaseProducts).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaintFilterTab('especiales')}
                    className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      paintFilterTab === 'especiales'
                        ? 'bg-[#004B93] text-white shadow-xs ring-1 ring-[#004B93]'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <span>💧</span>
                    <span>Zonas Húmedas / Especiales</span>
                    <span className="text-[10px] opacity-80 font-normal">({buildComprehensiveCatalogPaints('especiales', supabaseProducts).length})</span>
                  </button>
                </div>

                {/* Controles rápidos de carrusel superior */}
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="text-[11px] bg-blue-50 text-[#004B93] border border-blue-200 font-bold px-2.5 py-1 rounded-lg">
                    {currentCategoryPaints.length} referencias en catálogo
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCarouselScroll('left')}
                      disabled={!canScrollLeft}
                      aria-label="Desplazar carrusel a la izquierda"
                      className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 hover:text-[#004B93] transition-colors shadow-2xs cursor-pointer"
                      title="Anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCarouselScroll('right')}
                      disabled={!canScrollRight}
                      aria-label="Desplazar carrusel a la derecha"
                      className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 hover:text-[#004B93] transition-colors shadow-2xs cursor-pointer"
                      title="Siguiente"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Carrusel Horizontal Fluido con Soporte Multi-Selección */}
              <div 
                ref={paintCarouselRef}
                onScroll={updateCarouselScrollState}
                className="flex items-stretch gap-3.5 overflow-x-auto pb-2.5 pt-1 px-1 scroll-smooth snap-x snap-mandatory focus:outline-hidden touch-pan-x cursor-grab active:cursor-grabbing select-none"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#004B93 #E2E8F0',
                }}
              >
                {currentCategoryPaints.map((item) => {
                  const isSelected = selectedPaints.some(p => p.id === item.id || p.nombre === item.nombre);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleTogglePaint(item)}
                      className={`w-[290px] sm:w-[325px] shrink-0 snap-start p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group relative select-none ${
                        isSelected
                          ? 'border-[#004B93] bg-blue-50/80 shadow-xs ring-1 ring-[#004B93]/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{item.icono}</span>
                            <div>
                              <h4 className={`font-extrabold text-sm transition-colors ${
                                isSelected ? 'text-[#004B93]' : 'text-slate-900 group-hover:text-[#004B93]'
                              }`}>
                                {item.titulo}
                              </h4>
                              <span className="text-[10px] font-bold text-slate-500">{item.subtitulo}</span>
                            </div>
                          </div>
                          {isSelected ? (
                            <span className="w-6 h-6 rounded-full bg-[#004B93] text-white flex items-center justify-center text-xs font-black shadow-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold text-slate-400">{item.precio}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {item.descripcion}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {item.badge}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {!isSelected ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOnlyPaint(item);
                              }}
                              className="text-[10px] font-bold text-slate-500 hover:text-[#004B93] hover:underline px-1.5 py-0.5"
                              title="Seleccionar solo esta pintura"
                            >
                              Solo esta
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              ✓ Seleccionada
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.tagColor}`}>
                            {item.tag}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Barra de Navegación y Desplazamiento Visible del Carrusel */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 text-xs text-slate-600 bg-slate-50/90 border border-slate-200/80 rounded-xl px-3.5 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#004B93] animate-pulse"></span>
                  <span className="font-semibold text-slate-700">
                    Catálogo: {paintFilterTab === 'interiores' ? 'Interiores' : paintFilterTab === 'exteriores' ? 'Exteriores' : 'Zonas Húmedas / Especiales'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
                    ({currentCategoryPaints.length} referencias • Desliza para explorar)
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Barra de progreso de desplazamiento visible */}
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial" title={`Progreso del carrusel: ${carouselProgress}%`}>
                    <span className="text-[10px] font-mono text-slate-400 hidden xs:inline">Scroll</span>
                    <div className="w-24 sm:w-36 h-2 bg-slate-200 rounded-full overflow-hidden p-0.5">
                      <div 
                        className="h-full bg-[#004B93] rounded-full transition-all duration-200"
                        style={{ width: `${Math.max(16, carouselProgress)}%` }}
                      />
                    </div>
                  </div>

                  {/* Botones de navegación horizontal */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCarouselScroll('left')}
                      disabled={!canScrollLeft}
                      aria-label="Desplazar a la izquierda"
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 hover:text-[#004B93] transition-colors shadow-2xs cursor-pointer"
                      title="Referencia anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCarouselScroll('right')}
                      disabled={!canScrollRight}
                      aria-label="Desplazar a la derecha"
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 hover:text-[#004B93] transition-colors shadow-2xs cursor-pointer"
                      title="Siguiente referencia"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2.2 ÁREA A PINTAR (METROS CUADRADOS) - GOBERNADO 1:1 POR selectedPaints */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                      2.2 Área a Pintar por Cada Tipo de Pintura (Metros Cuadrados)
                    </label>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#004B93] border border-blue-200">
                      {selectedPaints.length === 1 ? '1 pintura seleccionada' : `${selectedPaints.length} pinturas seleccionadas`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPaints.length === 1
                      ? 'Define los metros cuadrados para tu pintura seleccionada:'
                      : 'Define los metros cuadrados específicos para cada una de las pinturas seleccionadas en tu proyecto:'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl w-fit">
                  Área total combinada: <strong className="text-[#004B93] font-mono text-xs">{formData.area_m2} m²</strong>
                </span>
              </div>

              {/* RENDERIZADO ESTRICTO 1:1: 1 bloque por cada elemento en selectedPaints */}
              <div className="space-y-3.5 animate-fadeIn">
                {selectedPaints.map((paint, idx) => {
                  const estGalones = Math.max(1, Math.ceil((paint.area_m2 * 2 / 32) * 1.05));
                  return (
                    <div
                      key={paint.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{paint.icono}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-extrabold text-sm text-slate-900">{paint.titulo}</h5>
                              {selectedPaints.length > 1 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  #{idx + 1}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500">{paint.subtitulo} • {paint.badge}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-[11px] font-semibold text-slate-600">
                            Consumo est.: <strong className="text-slate-900 font-mono">~{estGalones} gal</strong>
                          </span>
                          <span className="text-xs font-mono font-black text-[#004B93] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl">
                            {paint.area_m2} m²
                          </span>
                        </div>
                      </div>

                      {/* Atajos rápidos de metraje para esta pintura */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Atajos rápidos:</span>
                        {[15, 25, 40, 60, 100, 200].map((quickArea) => (
                          <button
                            key={quickArea}
                            type="button"
                            onClick={() => handleUpdatePaintArea(paint.id, quickArea)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                              paint.area_m2 === quickArea
                                ? 'bg-[#004B93] text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            ~{quickArea} m²
                          </button>
                        ))}
                      </div>

                      {/* Slider y Controles de Ajuste Fino */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                        <div className="flex-1">
                          <input
                            type="range"
                            min="1"
                            max="500"
                            step="1"
                            value={paint.area_m2 || 1}
                            onChange={(e) => handleUpdatePaintArea(paint.id, Math.max(0.1, Number(e.target.value)))}
                            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#004B93]"
                          />
                          <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                            <span>1 m²</span>
                            <span>50 m²</span>
                            <span>150 m²</span>
                            <span>300 m²</span>
                            <span>500 m²</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleUpdatePaintArea(paint.id, Math.max(0.1, Number((paint.area_m2 - 1).toFixed(2))))}
                            className="w-9 h-9 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
                            title="Restar 1 m²"
                          >
                            -1
                          </button>
                          <div className="relative">
                            <input
                              type="number"
                              step="any"
                              min="0.1"
                              value={paint.area_m2 === 0 ? '' : paint.area_m2}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdatePaintArea(paint.id, val === '' ? 0 : parseFloat(val) || 0.1);
                              }}
                              className="w-28 text-center font-black text-base p-2 rounded-xl border-2 border-[#004B93] bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B93]/30"
                            />
                            <span className="absolute right-2.5 top-2.5 text-xs text-slate-500 font-bold pointer-events-none">m²</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpdatePaintArea(paint.id, Number((paint.area_m2 + 1).toFixed(2)))}
                            className="w-9 h-9 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition-colors"
                            title="Sumar 1 m²"
                          >
                            +1
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2.3 SELECCIÓN DINÁMICA DE COLOR INDEPENDIENTE POR PINTURA - GOBERNADO 1:1 POR selectedPaints */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                    2.3 Asignación de Tonos y Color Oficial Pintuco
                  </label>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPaints.length === 1
                      ? 'Elige el color oficial para tu pintura seleccionada:'
                      : 'Elige el color oficial independiente para cada una de las pinturas seleccionadas en tu proyecto:'}
                  </p>
                </div>
              </div>

              {/* RENDERIZADO ESTRICTO 1:1: 1 bloque de selección de color por cada elemento en selectedPaints */}
              <div className="space-y-4 animate-fadeIn">
                {selectedPaints.map((paint, idx) => {
                  const catInfo = getPaintCategoryInfo(paint.nombre);
                  const paintColorObj = catInfo.palette.find(
                    c => c.name === paint.color_acabado || paint.color_acabado.includes(c.code)
                  ) || catInfo.palette[0] || COLOR_PALETTE[0];

                  return (
                    <div
                      key={paint.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{paint.icono}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-extrabold text-sm text-slate-900">{paint.titulo}</h5>
                              {selectedPaints.length > 1 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  #{idx + 1}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${catInfo.badgeColor}`}>
                                {catInfo.badgeText}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Línea: {catInfo.paintLineName}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                          <div
                            className="w-4 h-4 rounded-full border border-black/20 shadow-xs shrink-0"
                            style={{ backgroundColor: paintColorObj.hex }}
                          />
                          <span className="text-xs font-bold text-slate-700">
                            Tono asignado: <strong className="text-[#004B93]">{paint.color_acabado}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Mensaje de restricción o advertencia si aplica */}
                      {catInfo.restrictionNotice && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">{catInfo.restrictionNotice}</p>
                        </div>
                      )}

                      {/* Grilla de Swatches de Color */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                        {catInfo.palette.map((color) => {
                          const isSelected = paint.color_acabado === color.name || paint.color_acabado.includes(color.code);
                          return (
                            <button
                              key={color.code}
                              type="button"
                              onClick={() => handleUpdatePaintColor(paint.id, color.name)}
                              className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'border-[#004B93] bg-blue-50/70 shadow-xs ring-1 ring-[#004B93]/20'
                                  : 'border-slate-200 bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div
                                  className="w-7 h-7 rounded-full border border-black/20 shadow-xs shrink-0"
                                  style={{ backgroundColor: color.hex }}
                                />
                                {isSelected && <Check className="w-4 h-4 text-[#004B93]" />}
                              </div>
                              <div>
                                <h6 className="font-extrabold text-xs text-slate-900 leading-tight truncate">{color.shortName}</h6>
                                <span className="text-[10px] text-slate-500 font-mono">Cód: {color.code}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Muestra en Vivo Bar */}
                      <div
                        className="p-4 rounded-2xl border border-slate-300 flex items-center justify-between shadow-2xs"
                        style={{
                          backgroundColor: paintColorObj.hex,
                          color: paintColorObj.lrv > 50 ? '#0F172A' : '#FFFFFF',
                        }}
                      >
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
                            Muestra en Vivo • {paintColorObj.acabado}
                          </span>
                          <h5 className="font-black text-base">{paintColorObj.name}</h5>
                          <p className="text-xs opacity-90">{paintColorObj.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur-xs">
                            Reflectancia: {paintColorObj.lrv}%
                          </span>
                        </div>
                      </div>

                      {/* Preparación tintométrica personalizada si aplica */}
                      {catInfo.allowsCustomTinting && (
                        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#004B93] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#004B93]" />
                              <span>¿Buscas un tono específico del abanico Color In Pintuco?</span>
                            </span>
                            <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                              Preparación Tintométrica
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Ej: Coral Sunset 4280, Verde Botánico 6115, Azul Caribe..."
                              value={paint.color_acabado}
                              onChange={(e) => handleUpdatePaintColor(paint.id, e.target.value)}
                              className="flex-1 text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTONES NAVEGACIÓN PASO 2 */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Superficie (Paso 1)</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#004B93] hover:bg-[#003B75] text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <span>Continuar a Datos y Forma de Entrega (Paso 3)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------------
            PASO 3: DATOS Y FORMA DE ENTREGA (Exclusivo Despacho y Ubicación)
        -------------------------------------------------------------------- */}
        {currentStep === 3 && (
          <div className="space-y-7 animate-fadeIn">
            
            {/* Step Header */}
            <div className="border-b border-slate-200/80 pb-4">
              <span className="text-[11px] font-bold text-[#004B93] uppercase tracking-wider">
                Paso 3 de 4 • Datos y Forma de Entrega
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                Lugar de entrega y datos de despacho
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Configura la modalidad de envío, tu dirección u obra y confirma los datos de contacto para la entrega oficial.
              </p>
            </div>

            {/* Banner de Autocompletado con Perfil del Usuario Autenticado */}
            {userSession && userSession.isLoggedIn && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-sky-50 border border-blue-200 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#004B93] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-[#004B93]">
                        Datos autocompletados desde tu perfil oficial Pintuco
                      </span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {userSession.userType || 'Cliente'} Verificado
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Titular: <strong>{formData.nombre_razon_social || userSession.nombre}</strong> • Tel: <strong>{formData.telefono || userSession.telefono || 'Sin teléfono'}</strong> • Doc: <strong>{formData.documento || userSession.documento || 'Sin doc'}</strong>
                    </p>
                  </div>
                </div>

                {/* Selector rápido de direcciones guardadas en el perfil */}
                {userSession.direcciones && userSession.direcciones.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tus Direcciones:</span>
                    {userSession.direcciones.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          onChange('modalidad_entrega', 'domicilio');
                          onChange('direccion_obra', d.direccion);
                          if (d.ciudad) onChange('ciudad', d.ciudad);
                          if (d.departamento) handleDeptoChange(d.departamento);
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                          formData.direccion_obra === d.direccion
                            ? 'bg-[#004B93] text-white border-[#004B93]'
                            : 'bg-white hover:bg-blue-50 text-slate-700 border-slate-300'
                        }`}
                        title={d.direccion}
                      >
                        <MapPin className="w-3 h-3" />
                        <span>{d.etiqueta}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3.1 MODALIDAD Y UBICACIÓN DE ENTREGA */}
            <div className="space-y-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3.1 Modalidad de Despacho y Ubicación en Colombia
              </label>

              {/* Modalidad Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => {
                    onChange('modalidad_entrega', 'domicilio');
                    if (!formData.direccion_obra || formData.direccion_obra.startsWith('Retiro en Tienda')) {
                      const defaultAddr = userSession?.direcciones?.find(d => d.esPredeterminada) || userSession?.direcciones?.[0];
                      const savedResidencia = defaultAddr?.direccion ||
                        userSession?.direccion ||
                        userSession?.address ||
                        localStorage.getItem('colorlink_user_address') ||
                        '';
                      if (savedResidencia) {
                        onChange('direccion_obra', savedResidencia);
                      }
                    }
                  }}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    currentModalidad === 'domicilio'
                      ? 'border-[#004B93] bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Truck className={`w-5 h-5 ${currentModalidad === 'domicilio' ? 'text-[#004B93]' : 'text-slate-500'}`} />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Envío a Domicilio / Obra</h5>
                    <p className="text-[11px] text-slate-500">Despacho en 24 a 48h a pie de obra</p>
                  </div>
                </div>

                <div
                  onClick={() => {
                    onChange('modalidad_entrega', 'retiro_tienda');
                    const stores = getAvailableStoresForLocation(activeDepartamentoName, formData.ciudad);
                    if (stores.length > 0) {
                      const store = stores.find(s => s.nombre === formData.sede_retiro) || stores[0];
                      onChange('sede_retiro', store.nombre);
                      onChange('direccion_obra', `Retiro en Tienda: ${store.nombre} - ${store.direccion}`);
                    }
                  }}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                    currentModalidad === 'retiro_tienda'
                      ? 'border-[#004B93] bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Warehouse className={`w-5 h-5 ${currentModalidad === 'retiro_tienda' ? 'text-[#004B93]' : 'text-slate-500'}`} />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">Retiro en Tienda Pintuco (Pickup)</h5>
                    <p className="text-[11px] text-emerald-700 font-semibold">Gratis en sede autorizada ($0 COP)</p>
                  </div>
                </div>
              </div>

              {/* Cascading Departamento / Ciudad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {currentModalidad === 'retiro_tienda' ? 'Departamento de la Tienda' : 'Departamento de Despacho'}
                  </label>
                  <select
                    value={activeDepartamentoName}
                    onChange={(e) => handleDeptoChange(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                  >
                    {DEPARTAMENTOS_COLOMBIA.map((d) => (
                      <option key={d.codigoDANE} value={d.nombre}>
                        {d.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {currentModalidad === 'retiro_tienda' ? 'Municipio / Ciudad de la Tienda' : 'Municipio / Ciudad de Entrega'}
                  </label>
                  <select
                    value={formData.ciudad}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      onChange('ciudad', newCity);
                      if (currentModalidad === 'retiro_tienda') {
                        const stores = getAvailableStoresForLocation(activeDepartamentoName, newCity);
                        if (stores.length > 0) {
                          onChange('sede_retiro', stores[0].nombre);
                          onChange('direccion_obra', `Retiro en Tienda: ${stores[0].nombre} - ${stores[0].direccion}`);
                        }
                      }
                    }}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                  >
                    {activeDeptoObj.municipios.map((m) => (
                      <option key={m.nombre} value={m.nombre}>
                        {m.nombre} {m.tipo === 'principal' ? '★' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LÓGICA CONDICIONAL: RETIRO EN TIENDA VS ENVÍO A DOMICILIO */}
              {currentModalidad === 'retiro_tienda' ? (
                /* RETIRO EN TIENDA: OCULTA DIRECCIÓN RESIDENCIAL Y MUESTRA TIENDAS PINTUCO */
                <div className="space-y-3 pt-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#004B93]" />
                      <span>Selecciona la Tienda Pintuco para Recoger ({formData.ciudad || activeDeptoObj.capital})</span>
                    </label>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Flete $0 COP
                    </span>
                  </div>

                  {/* Menú de selección interactivo de tiendas Pintuco */}
                  <select
                    value={formData.sede_retiro || (availableStores[0]?.nombre ?? '')}
                    onChange={(e) => {
                      const storeName = e.target.value;
                      const store = availableStores.find(s => s.nombre === storeName);
                      onChange('sede_retiro', storeName);
                      if (store) {
                        onChange('direccion_obra', `Retiro en Tienda: ${store.nombre} - ${store.direccion}`);
                      }
                    }}
                    className="w-full text-xs font-bold p-3 rounded-xl border-2 border-[#004B93] bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B93] shadow-xs cursor-pointer"
                  >
                    {availableStores.map((store) => (
                      <option key={store.id} value={store.nombre}>
                        {store.nombre} — {store.direccion}
                      </option>
                    ))}
                  </select>

                  {/* Tarjeta Resumen de la Tienda Seleccionada */}
                  {selectedStore && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-slate-50 border border-blue-200/90 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#004B93] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Warehouse className="w-5 h-5" />
                          </div>
                          <div>
                            <h6 className="font-extrabold text-xs sm:text-sm text-slate-900">{selectedStore.nombre}</h6>
                            <span className="text-[10px] text-slate-500 font-semibold">{selectedStore.badge || 'Punto Oficial Pintuco'}</span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black shrink-0 border border-emerald-300">
                          Listo en 2-4 hrs
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 pt-1 border-t border-blue-100">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-4 h-4 text-[#004B93] shrink-0 mt-0.5" />
                          <span><strong>Dirección:</strong> {selectedStore.direccion}</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Clock className="w-4 h-4 text-[#004B93] shrink-0 mt-0.5" />
                          <span><strong>Horario:</strong> {selectedStore.horario}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:col-span-2">
                          <Phone className="w-4 h-4 text-[#004B93] shrink-0" />
                          <span><strong>Atención y Soporte:</strong> {selectedStore.telefono}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-blue-200/60 text-[11px] text-slate-600 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Presenta tu cédula o NIT en el mostrador para retirar tu pedido empacado sin filas.</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* DOMICILIO: MUESTRA DIRECCIÓN EXACTA DE ENTREGA A PIE DE OBRA */
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dirección exacta de entrega o punto de referencia
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Calle 127 # 15-40, Apto 402 / Obra Torres del Parque"
                      value={formData.direccion_obra || ''}
                      onChange={(e) => onChange('direccion_obra', e.target.value)}
                      className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                    />
                  </div>

                  {/* Feedback logístico de flete */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#004B93]" />
                      Hub de despacho: <strong>{liveShipping.hubDespacho}</strong>
                    </span>
                    <span className="font-semibold text-emerald-700">
                      {liveShipping.costoFlete === 0 ? 'Flete Bonificado / Gratis' : `Flete estimado: $${liveShipping.costoFlete.toLocaleString('es-CO')}`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3.2 IDENTIFICACIÓN DEL CLIENTE */}
            <div className="space-y-3.5 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3.2 Datos de Facturación y Contacto
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo Documento</label>
                  <select
                    value={formData.tipo_documento}
                    onChange={(e) => onChange('tipo_documento', e.target.value as TipoDocumento)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="NIT">NIT (Empresa)</option>
                    <option value="CE">Cédula Extranjería (CE)</option>
                    <option value="RUT">RUT</option>
                  </select>
                </div>

                <div className="sm:col-span-8">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Número de Documento / Cédula</label>
                  <input
                    type="text"
                    placeholder="Ej: 1028727371 o 900.845.120-4"
                    value={formData.documento}
                    onChange={(e) => onChange('documento', e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo o Razón Social</label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos Gómez o Constructora Bolivar"
                    value={formData.nombre_razon_social}
                    onChange={(e) => onChange('nombre_razon_social', e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / Celular de Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej: 310 456 7890"
                    value={formData.telefono || ''}
                    onChange={(e) => onChange('telefono', e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 3.3 ACORDEÓN DESPLEGABLE: PARÁMETROS TÉCNICOS AVANZADOS (OPCIONAL) */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-800">
                    Opciones Técnicas Avanzadas (Opcional para Contratistas e Ingenieros)
                  </span>
                </div>
                {showAdvancedOptions ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showAdvancedOptions && (
                <div className="p-4 border-t border-slate-200/80 bg-slate-50 space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Manos de Pintura</label>
                      <select
                        value={formData.manos_capas || 2}
                        onChange={(e) => onChange('manos_capas', Number(e.target.value))}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="1">1 Mano (Retoque suave)</option>
                        <option value="2">2 Manos (Norma oficial NTC 1335)</option>
                        <option value="3">3 Manos (Colores intensos / saturados)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Método de Aplicación</label>
                      <select
                        value={formData.metodo_aplicacion || 'Rodillo Convencional (+5% desperdicio)'}
                        onChange={(e) => onChange('metodo_aplicacion', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="Rodillo Convencional (+5% desperdicio)">Rodillo (+5% desperdicio)</option>
                        <option value="Brocha / Trabajo Detallado (+10% desperdicio)">Brocha (+10% desperdicio)</option>
                        <option value="Equipo Airless / Pistola (+15% desperdicio)">Airless / Pistola (+15% desperdicio)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Sellador Forzado</label>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.incluir_sellador_forzado)}
                          onChange={(e) => onChange('incluir_sellador_forzado', e.target.checked)}
                          className="w-4 h-4 text-[#004B93] rounded"
                        />
                        <span className="text-xs text-slate-700 font-medium">Incluir sellador siempre</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* BOTONES NAVEGACIÓN PASO 3 */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Pintura y Medidas (Paso 2)</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#004B93] hover:bg-[#003B75] text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <span>Continuar a Resumen y Consejo Pintuco (Paso 4)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------------
            PASO 4: RESUMEN DE PRODUCTOS, CONSEJO CONTEXTUAL Y COMPLEMENTOS
        -------------------------------------------------------------------- */}
        {currentStep === 4 && (
          <div className="space-y-7 animate-fadeIn">
            
            {/* Step Header */}
            <div className="border-b border-slate-200/80 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#004B93] uppercase tracking-wider">
                  Paso 4 de 4 • Resumen de Productos y Consejo Contextual
                </span>
                <span className="text-[10px] font-extrabold bg-blue-50 text-[#004B93] px-2.5 py-0.5 rounded-full border border-blue-200">
                  Norma NTC 1335
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                Resumen final de compra, asesoría técnica y complementos
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Revisa los productos calculados, aprovecha las recomendaciones de nuestros expertos y añade los accesorios compatibles antes de continuar.
              </p>
            </div>

            {/* 4.1 RESUMEN VOLUMÉTRICO OFICIAL NTC 1335 */}
            <div className="p-6 rounded-3xl bg-white text-slate-900 border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-[#004B93] uppercase tracking-wider block">
                      Resumen Volumétrico Oficial NTC 1335
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Área total: {formData.area_m2} m²
                    </span>
                    {selectedPaints.length > 1 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#004B93] border border-blue-200">
                        {selectedPaints.length} Referencias Pintuco
                      </span>
                    )}
                  </div>

                  <h4 className="text-xl font-black text-slate-900 mt-1">
                    {selectedPaints.length > 1 
                      ? selectedPaints.map(p => p.titulo).join(' + ')
                      : (selectedPaints[0]?.titulo || calculation.productoSugerido)}
                  </h4>

                  {/* Listado de tonos y pinturas asignadas */}
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1.5 flex-wrap">
                    {selectedPaints.map((p) => {
                      const swatch = getSwatchHex(p.color_acabado, p.nombre);
                      return (
                        <div key={p.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                          <div 
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0" 
                            style={{ backgroundColor: swatch }} 
                          />
                          <span className="font-semibold text-slate-800">{p.titulo}:</span>
                          <span className="font-bold text-[#004B93]">{p.color_acabado}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({p.area_m2} m²)</span>
                        </div>
                      );
                    })}
                    <span>•</span>
                    <span className="text-slate-600">
                      Destino: <strong className="text-slate-900">
                        {currentModalidad === 'retiro_tienda' 
                          ? `Retiro en ${formData.sede_retiro || selectedStore?.nombre || 'Tienda Pintuco'} (${formData.ciudad})`
                          : `${formData.direccion_obra || 'Dirección registrada'} (${formData.ciudad})`
                        }
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Valor Estimado COP</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">
                    ${liveSummaryTotals.totalCOP.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {liveShipping.costoFlete === 0 ? 'Flete $0 COP (Bonificado)' : `Flete est.: $${liveShipping.costoFlete.toLocaleString('es-CO')}`}
                  </span>
                </div>
              </div>

              {/* Units Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Cuñetes y Galones de Pintura */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#004B93] uppercase tracking-wider">
                      Volumen Total de Pintura
                    </span>
                    <span className="text-xs font-mono font-bold bg-[#004B93] px-2.5 py-0.5 rounded-full text-white">
                      {totalGalonesAll} Galones Totales
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                    {totalCunetesAll > 0 && (
                      <>
                        <span className="text-3xl font-black font-mono text-slate-900">
                          {totalCunetesAll}
                        </span>
                        <span className="text-xs text-slate-600 font-bold">Cuñete{totalCunetesAll > 1 ? 's' : ''} (5 Gal)</span>
                        {totalGalonesSueltosAll > 0 && <span className="text-slate-400 font-bold">+</span>}
                      </>
                    )}
                    {(totalGalonesSueltosAll > 0 || totalCunetesAll === 0) && (
                      <>
                        <span className="text-2xl font-black font-mono text-slate-900">
                          {totalGalonesSueltosAll}
                        </span>
                        <span className="text-xs text-slate-600 font-bold">Galón{totalGalonesSueltosAll !== 1 ? 'es' : ''} (1 Gal)</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Empaquetado optimizado para minimizar sobrantes de obra según norma técnica NTC 1335.
                  </p>
                </div>

                {/* Sellador */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                      Sellador Fijador / Imprimante
                    </span>
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      editedQuantities.sellador > 0
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {editedQuantities.sellador > 0 ? 'Agregado al Pedido' : 'Sugerido / Opcional'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-slate-900">
                      {editedQuantities.sellador > 0 ? editedQuantities.sellador : (calculation.galonesSellador || 1)}
                    </span>
                    <span className="text-xs text-slate-600 font-bold">
                      {editedQuantities.sellador > 0 ? 'Galones Agregados' : 'Galones Sugeridos'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    {editedQuantities.sellador > 0
                      ? 'Previene alcalinidad y garantiza máxima adherencia del color elegido.'
                      : 'Recomendación experta: sella poros, resalta el color y previene manchas.'}
                  </p>
                </div>

              </div>

              {/* 4.2 DESGLOSE DE PRODUCTOS Y CANTIDADES EDITABLES */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#004B93]" />
                      <span>Desglose de Pintura y Sellador Calculados</span>
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Presentaciones activas con cantidad mayor a cero. Ajusta con los botones +/- antes de enviar al carrito:
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 w-fit">
                    {activeItems.length} {activeItems.length === 1 ? 'ítem activo' : 'ítems activos'}
                  </span>
                </div>

                {/* FILTRADO INDISPENSABLE: RENDERIZA ÚNICAMENTE EL ARRAY activeItems (quantity > 0) */}
                <div className="space-y-2.5">
                  {activeItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn transition-all hover:border-slate-300"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={item.imagenUrl}
                            alt={item.displayName}
                            className="w-12 h-12 object-contain rounded-xl bg-slate-50 border border-slate-200 p-1"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = '/src/assets/images/viniltex_bucket_studio_1790894419359.jpg';
                            }}
                          />
                          {item.colorHex && item.type !== 'sellador' && (
                            <div
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-xs"
                              style={{ backgroundColor: item.colorHex }}
                              title={`Color: ${item.color}`}
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate flex items-center gap-2">
                            <span>{item.displayName}</span>
                            {item.type === 'sellador' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300">
                                Imprimante
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span>${item.unitPrice.toLocaleString('es-CO')} COP / unid.</span>
                            {item.color && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-slate-700">Tono: {item.color}</span>
                              </>
                            )}
                            {item.area_m2 && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500">Para: ~{item.area_m2} m²</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        {/* Controles de Cantidad (+ / -) */}
                        <div className="flex items-center rounded-xl overflow-hidden border border-slate-300 bg-slate-100 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-1.5 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Disminuir unidades"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              handleUpdateItemQuantity(item.id, isNaN(val) ? 0 : Math.max(0, val));
                            }}
                            className="w-12 text-center text-xs font-black text-slate-900 bg-white border-x border-slate-300 py-1.5 focus:outline-none focus:bg-slate-50"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                            className="px-2.5 py-1.5 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Aumentar unidades"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Subtotal en COP */}
                        <div className="text-right min-w-[100px]">
                          <span className="text-xs sm:text-sm font-mono font-black text-emerald-700 block">
                            ${(item.quantity * item.unitPrice).toLocaleString('es-CO')}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">Subtotal COP</span>
                        </div>

                        {/* Botón Eliminar / Poner en 0 */}
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQuantity(item.id, 0)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar presentación de la cotización"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Si el sellador no está en activeItems, ofrecer banner para añadirlo */}
                  {!activeItems.some(i => i.type === 'sellador') && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">🛡️</span>
                        <div>
                          <span className="font-extrabold text-amber-950">¿Deseas incluir Sellador Antialcalino Imprimante?</span>
                          <span className="text-[11px] text-amber-800/80 block mt-0.5">
                            Recomendado por norma NTC 1335 para sellar poros y garantizar 100% adherencia y rendimiento del color.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedQuantities(prev => ({
                            ...prev,
                            sellador: Math.max(1, calculation.galonesSellador || 1),
                          }));
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
                      >
                        + Agregar Sellador ($78.000 COP)
                      </button>
                    </div>
                  )}
                </div>

                {/* Subtotal Pinturas y Sellador */}
                <div className="pt-2 flex justify-between items-center text-xs text-slate-600 border-t border-slate-200">
                  <span>Subtotal Pinturas & Sellador:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    ${liveSummaryTotals.subtotalPinturaYSellador.toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

              {/* 4.3 CONSEJO PINTUCO 100% DINÁMICO SEGÚN LA COMPRA ACTUAL */}
              <div className="rounded-2xl border-2 border-blue-200/90 bg-gradient-to-br from-blue-50/90 via-sky-50/60 to-white p-5 space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" role="img" aria-label="consejo">{activeDynamicConsejo.icono}</span>
                    <div>
                      <span className="text-[10px] font-black uppercase text-[#004B93] tracking-wider block">
                        Asesoría Técnica Oficial Pintuco
                      </span>
                      <h5 className="font-black text-sm text-slate-900 mt-0.5">
                        {activeDynamicConsejo.titulo}
                      </h5>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${activeDynamicConsejo.badgeColor} w-fit shadow-2xs`}>
                    {activeDynamicConsejo.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {activeDynamicConsejo.parrafoPrincipal}
                </p>

                <div className="space-y-2 pt-1 bg-white/70 p-3.5 rounded-xl border border-blue-100">
                  <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider block mb-1">
                    Tips Claves para tu Proyecto:
                  </span>
                  {activeDynamicConsejo.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{tip}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-blue-100">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#004B93]" />
                    <span>{activeDynamicConsejo.normaReferencia}</span>
                  </span>
                  <span className="font-bold text-slate-700 hidden sm:inline">
                    Pintuco • Grupo AkzoNobel
                  </span>
                </div>
              </div>

              {/* 4.4 TOTAL ESTIMADO DE TU COTIZACIÓN */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base">Total Estimado de tu Cotización:</span>
                  <div className="text-[11px] text-slate-600 flex items-center gap-2 flex-wrap">
                    <span>Pintura & Sellador</span>
                    <span>•</span>
                    <span>Calculado para {formData.area_m2} m²</span>
                    <span>•</span>
                    <span>{currentModalidad === 'retiro_tienda' ? `Retiro en ${formData.sede_retiro || selectedStore?.nombre || 'Tienda Pintuco'}` : `Envío a domicilio en ${formData.ciudad}`}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-xl sm:text-3xl font-black font-mono text-emerald-600">
                    ${liveSummaryTotals.subtotalPinturaYSellador.toLocaleString('es-CO')} COP
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {liveShipping.costoFlete === 0 ? 'Flete $0 COP (Bonificado)' : `Flete est.: $${liveShipping.costoFlete.toLocaleString('es-CO')}`}
                  </span>
                </div>
              </div>

              {/* 4.5 BOTONES PRINCIPALES DE ACCIÓN */}
              <div className="pt-2 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Botón Izquierdo: Añadir al Carrito (Sincronización Total) */}
                  <button
                    type="button"
                    onClick={() => handleSyncToCart(false)}
                    disabled={isSaving}
                    className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-blue-700 to-[#004B93] hover:from-blue-800 hover:to-[#003B75] active:scale-[0.99] text-white shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] border border-blue-600 disabled:opacity-60"
                  >
                    <ShoppingBag className="w-5 h-5 text-amber-300 shrink-0" />
                    <span>Añadir al Carrito</span>
                  </button>

                  {/* Botón Derecho: Continuar Proceso de Compra (Abre Modal de Complementos Pre-Checkout) */}
                  <button
                    type="button"
                    onClick={() => setShowComplementsModal(true)}
                    disabled={isSaving}
                    className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm bg-[#E30613] hover:bg-[#C20510] active:bg-[#A3040D] text-white shadow-md shadow-red-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                  >
                    <ArrowRight className="w-5 h-5 text-yellow-300 shrink-0" />
                    <span>Continuar Proceso de Compra</span>
                  </button>

                </div>

                {/* Botón Secundario Delineado: Imprimir / Exportar Ficha Técnica Oficial */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenPrintable) {
                      onOpenPrintable();
                    } else {
                      window.print();
                    }
                  }}
                  className="w-full py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 hover:border-slate-400 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Imprimir / Exportar Ficha Técnica Oficial NTC 1335</span>
                </button>
              </div>

            </div>

            {/* BOTONES NAVEGACIÓN PASO 4 */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Modificar Datos y Forma de Entrega (Paso 3)</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-[#004B93] font-bold hover:underline"
              >
                Volver al inicio del wizard (Paso 1)
              </button>
            </div>

          </div>
        )}

      </div>

      {/* ====================================================================
          MODAL DE COMPLEMENTOS RECOMENDADOS (PRE-CHECKOUT)
      ==================================================================== */}
      {showComplementsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowComplementsModal(false);
            }
          }}
        >
          <div 
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200/90 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/40 flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#004B93] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-900/20">
                  <Sparkles className="w-5 h-5 text-[#FFD100]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase text-[#004B93] bg-blue-100/70 px-2 py-0.5 rounded-full tracking-wider">
                      Accesorios Recomendados
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Paso previo a la Finalización de Compra
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 leading-snug">
                    Complementos recomendados para tu proyecto
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Personalizamos estos accesorios según los productos de tu cotización para asegurar un acabado óptimo y evitar retrasos en tu obra.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowComplementsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer shrink-0"
                title="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Lista de Accesorios con botón 'Agregar a la compra' */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/60">
              {contextualRecommendations.map((tool) => {
                const qty = selectedTools[tool.id] || 0;
                const isAdded = qty > 0;

                return (
                  <div
                    key={tool.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isAdded
                        ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={tool.imagenUrl}
                        alt={tool.nombre}
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1.5 shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const currentSrc = target.getAttribute('src') || '';
                          if (currentSrc.includes('/src/assets/images/')) {
                            target.src = currentSrc.replace('/src/assets/images/', '/images/');
                          } else if (currentSrc.includes('/images/')) {
                            target.src = currentSrc.replace('/images/', '/src/assets/images/');
                          }
                        }}
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] font-extrabold uppercase text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded">
                                {tool.categoria}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                SKU: {tool.sku}
                              </span>
                              {isAdded && (
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5 text-emerald-600" /> Agregado
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 leading-snug">
                              {tool.nombre}
                            </h4>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs sm:text-sm font-black font-mono text-[#004B93] block">
                              ${tool.precio.toLocaleString('es-CO')}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              COP / {tool.presentacion}
                            </span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 line-clamp-2">
                          {tool.matchReason || tool.descripcion}
                        </p>

                        {/* Botón interactivo: 'Agregar a la compra' / 'Quitar' / Stepper */}
                        <div className="pt-1.5 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400">
                            {isAdded ? 'Cantidad en tu compra:' : 'Accesorio oficial Pintuco'}
                          </span>

                          {isAdded ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center rounded-xl overflow-hidden border border-amber-300 bg-white shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateToolQty(tool.id, qty - 1)}
                                  className="px-2.5 py-1 text-slate-700 hover:bg-amber-100/60 transition-colors cursor-pointer"
                                  title="Disminuir unidades"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-2.5 text-xs font-mono font-black text-slate-900">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateToolQty(tool.id, qty + 1)}
                                  className="px-2.5 py-1 text-slate-700 hover:bg-amber-100/60 transition-colors cursor-pointer"
                                  title="Aumentar unidades"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUpdateToolQty(tool.id, 0)}
                                className="text-[10px] font-bold text-red-600 hover:underline px-1 py-0.5 cursor-pointer"
                                title="Quitar accesorio"
                              >
                                Quitar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleTool(tool.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#004B93] hover:bg-[#003B75] text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95 hover:scale-[1.02]"
                            >
                              <Plus className="w-3.5 h-3.5 text-[#FFD100]" />
                              <span>Agregar a la compra</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>

              {/* Modal Footer: Botones de Control */}
              <div className="p-4 sm:p-5 border-t border-slate-200/90 bg-white shrink-0 space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-slate-600">
                    Total estimado {liveSummaryTotals.subtotalTools > 0 ? `(con ${Object.values(selectedTools).filter(q => q > 0).length} accesorios):` : ':'}
                  </span>
                  <span className="font-mono font-black text-sm sm:text-base text-emerald-600">
                    ${liveSummaryTotals.totalCOP.toLocaleString('es-CO')} COP
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  {/* Botón Secundario: Omitir y continuar al carrito / sin accesorios */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTools({});
                      setShowComplementsModal(false);
                      handleSyncToCart(true);
                    }}
                    className="w-full sm:w-auto flex-1 py-3 px-4 rounded-2xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer text-center"
                  >
                    Omitir y continuar al carrito
                  </button>

                  {/* Botón Primario: Continuar al Checkout */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowComplementsModal(false);
                      handleSyncToCart(true);
                    }}
                    className="w-full sm:w-auto flex-1 py-3 px-5 rounded-2xl bg-[#E30613] hover:bg-[#C20510] active:bg-[#A3040D] text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                  >
                    <span>Continuar al Checkout</span>
                    <ArrowRight className="w-4 h-4 text-yellow-300" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

    </div>
  );
};
