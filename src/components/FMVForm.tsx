import React, { useState, useMemo, useEffect } from 'react';
import { 
  FMVFormData, 
  TipoDocumento, 
  SuperficieTipo, 
  AmbienteTipo, 
  CondicionPared,
  CalculationResult,
  UserSession
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
  Trash2
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
// CARTAS DE COLOR DINÁMICAS SEGÚN TIPO DE PINTURA (AGUA, ESMALTE, MADERA, TRÁFICO)
// ============================================================================
export const VINILOS_AGUA_PALETTE: ColorPaletteItem[] = [
  { name: 'Blanco Puro Mate 1001', code: '1001', shortName: 'Blanco Puro', hex: '#F9FAFB', category: 'Clásicos', acabado: 'Mate', lrv: 88, description: 'Máxima luminosidad y amplitud espacial.' },
  { name: 'Blanco Almendra Satinado 1020', code: '1020', shortName: 'Blanco Almendra', hex: '#F4EFEA', category: 'Clásicos', acabado: 'Satinado', lrv: 82, description: 'Calidez sutil con destellos marfil.' },
  { name: 'Gris Niebla Mate 7035', code: '7035', shortName: 'Gris Niebla', hex: '#CBD5E1', category: 'Modernos', acabado: 'Mate', lrv: 62, description: 'Tono intermedio balanceado.' },
  { name: 'Gris Basalto Satinado 7012', code: '7012', shortName: 'Gris Basalto', hex: '#4A5568', category: 'Modernos', acabado: 'Satinado', lrv: 26, description: 'Gris arquitectónico de alta presencia.' },
  { name: 'Arena Cálida 1023', code: '1023', shortName: 'Arena Cálida', hex: '#E2D9C8', category: 'Tierras', acabado: 'Mate', lrv: 67, description: 'Inspirado en sedimentos naturales.' },
  { name: 'Terracota Colonial 3016', code: '3016', shortName: 'Terracota Colonial', hex: '#C05621', category: 'Tierras', acabado: 'Satinado', lrv: 24, description: 'Carácter tradicional y vibrante de arcilla.' },
  { name: 'Azul Celeste Fresco 5012', code: '5012', shortName: 'Azul Celeste', hex: '#93C5FD', category: 'Acentos', acabado: 'Mate', lrv: 60, description: 'Sensación de cielo despejado.' },
  { name: 'Azul Océano Profundo 5003', code: '5003', shortName: 'Azul Océano', hex: '#1E3A8A', category: 'Acentos', acabado: 'Semibrillante', lrv: 14, description: 'Elegancia sobria de gran profundidad.' },
  { name: 'Verde Salvia Calm 6021', code: '6021', shortName: 'Verde Salvia', hex: '#A3B18A', category: 'Naturales', acabado: 'Mate', lrv: 48, description: 'Tono botánico atenuado con matiz grisáceo.' },
  { name: 'Verde Bosque Andino 6005', code: '6005', shortName: 'Verde Bosque', hex: '#14532D', category: 'Naturales', acabado: 'Satinado', lrv: 12, description: 'Riqueza vegetal andina.' },
  { name: 'Amarillo Canario 1018', code: '1018', shortName: 'Amarillo Canario', hex: '#FBBF24', category: 'Vibrantes', acabado: 'Semibrillante', lrv: 55, description: 'Energía solar y vitalidad.' },
  { name: 'Rosa Palo Suave 3015', code: '3015', shortName: 'Rosa Palo', hex: '#FBCFE8', category: 'Acentos', acabado: 'Mate', lrv: 70, description: 'Delicadeza moderna para espacios de descanso.' }
];

export const ESMALTES_ANTICORROSIVOS_PALETTE: ColorPaletteItem[] = [
  { name: 'Blanco Puro Brillante E-100', code: 'E-100', shortName: 'Blanco Puro', hex: '#FFFFFF', category: 'Clásicos', acabado: 'Brillante', lrv: 90, description: 'Línea directa de fábrica con alto brillo y nivelación para metales.' },
  { name: 'Negro Ébano Brillante E-900', code: 'E-900', shortName: 'Negro Ébano', hex: '#111827', category: 'Contemporáneos', acabado: 'Brillante', lrv: 5, description: 'Esmalte negro profundo para rejas, portones y tuberías.' },
  { name: 'Gris Perla Maquinaria E-700', code: 'E-700', shortName: 'Gris Perla', hex: '#6B7280', category: 'Modernos', acabado: 'Brillante', lrv: 45, description: 'Tono industrial estándar para perfiles y estructuras.' },
  { name: 'Rojo Colonial E-300', code: 'E-300', shortName: 'Rojo Colonial', hex: '#B91C1C', category: 'Tierras', acabado: 'Brillante', lrv: 22, description: 'Color tradicional para barandas, carpintería metálica y techos.' },
  { name: 'Aluminio Brillante E-500', code: 'E-500', shortName: 'Aluminio', hex: '#94A3B8', category: 'Modernos', acabado: 'Brillante', lrv: 58, description: 'Pigmentación metálica anticorrosiva de alta reflectividad.' },
  { name: 'Verde Máquina E-600', code: 'E-600', shortName: 'Verde Máquina', hex: '#15803D', category: 'Naturales', acabado: 'Brillante', lrv: 20, description: 'Verde bosque industrial para cercas, motores y rejas.' },
  { name: 'Azul Real Brillante E-501', code: 'E-501', shortName: 'Azul Real', hex: '#1D4ED8', category: 'Acentos', acabado: 'Brillante', lrv: 18, description: 'Tono corporativo vibrante de gran poder cubriente.' },
  { name: 'Amarillo Seguridad E-101', code: 'E-101', shortName: 'Amarillo Seguridad', hex: '#EAB308', category: 'Vibrantes', acabado: 'Brillante', lrv: 50, description: 'Color preventivo para barandas, escaleras y demarcación.' }
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

export interface FMVFormProps {
  formData: FMVFormData;
  onChange: (field: keyof FMVFormData, value: any) => void;
  onApplyPreset: (presetData: FMVFormData) => void;
  onReset: () => void;
  onOpenNLPExtractor: () => void;
  supabaseProducts?: SupabaseProducto[];
  isUsingSupabaseCatalog?: boolean;
  // Enhanced props for full 3-step wizard integration
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
    }>
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
  // Wizard current active step (1: ¿Qué vas a pintar?, 2: ¿Cuánto mide tu espacio?, 3: Entrega y Cotización)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

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

  // Sincronizar cantidades de pintura y conservar estado del sellador sugerido
  useEffect(() => {
    setEditedQuantities(prev => ({
      cunetes: calculation.cuñetesPintura,
      galones: calculation.galonesSueltosPintura,
      sellador: prev.sellador > 0 || Boolean(formData.incluir_sellador_forzado)
        ? (calculation.galonesSellador || prev.sellador)
        : 0,
    }));
  }, [
    calculation.cuñetesPintura,
    calculation.galonesSueltosPintura,
    calculation.galonesSellador,
    calculation.productoSugerido,
    formData.incluir_sellador_forzado,
  ]);

  // Precios unitarios según el producto seleccionado
  const unitPrices = useMemo(() => {
    const prod = (calculation.productoSugerido || formData.producto_deseado || '').toLowerCase();
    const baseGalon = prod.includes('koraza') ? 142000 :
      prod.includes('baños') || prod.includes('cocina') ? 128000 :
      prod.includes('aquablock') || prod.includes('impermeabiliz') ? 135000 :
      prod.includes('tráfico') || prod.includes('trafico') ? 148000 :
      prod.includes('pintulux') || prod.includes('esmalte') ? 125000 : 115000;
    const cunetePrice = Math.round(baseGalon * 4.6);
    const selladorPrice = 78000;
    return { baseGalon, cunetePrice, selladorPrice };
  }, [calculation.productoSugerido, formData.producto_deseado]);

  // Totales recalculados en tiempo real según las cantidades editadas y herramientas sugeridas añadidas
  const liveSummaryTotals = useMemo(() => {
    const subtotalCunetes = editedQuantities.cunetes * unitPrices.cunetePrice;
    const subtotalGalones = editedQuantities.galones * unitPrices.baseGalon;
    const subtotalSellador = editedQuantities.sellador * unitPrices.selladorPrice;
    const subtotalPinturaYSellador = subtotalCunetes + subtotalGalones + subtotalSellador;

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
  }, [editedQuantities, unitPrices, selectedTools]);

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

  // Superficies mapping with human-friendly details
  const surfaceOptions: { id: SuperficieTipo; label: string; desc: string; icon: string }[] = [
    { id: 'Pañete / Revoque Liso', label: 'Pañete o Revoque', desc: 'Muro tradicional frisado liso', icon: '🧱' },
    { id: 'Pintura Existente', label: 'Pintura Existente / Estuco', desc: 'Pared empastada o pintada', icon: '✨' },
    { id: 'Drywall / Yeso', label: 'Drywall o Yeso Cartón', desc: 'Placas livianas interiores', icon: '📐' },
    { id: 'Mampostería', label: 'Ladrillo o Mampostería', desc: 'Poroso, requiere +15% rendimiento', icon: '🧱' },
    { id: 'Concreto Vaciado', label: 'Concreto o Cemento', desc: 'Estructuras firmes o columnas', icon: '🏗️' },
    { id: 'Madera', label: 'Madera o Metales', desc: 'Carpintería o perfiles estructurales', icon: '🪵' },
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
        onChange('sede_retiro', defaultStore.nombre);
        onChange('direccion_obra', `Retiro en Tienda: ${defaultStore.nombre} - ${defaultStore.direccion}`);
      }
    }
  }, [currentModalidad, availableStores, formData.sede_retiro, onChange]);

  // ============================================================================
  // FILTRO DINÁMICO DE PALETA DE COLOR SEGÚN EL TIPO DE PINTURA SELECCIONADA
  // ============================================================================
  const activePaintCategory = useMemo(() => {
    const prod = (formData.producto_deseado || '').toLowerCase();
    const amb = (formData.ambiente || '').toLowerCase();
    const sup = (formData.superficie || '').toLowerCase();

    // 1. Epóxicos y Tráfico / Demarcación
    if (prod.includes('tráfico') || prod.includes('trafico') || amb.includes('piso') || amb.includes('tráfico') || amb.includes('industrial')) {
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

    // 2. Barnices y Tintes para Madera
    if (sup.includes('madera') || amb.includes('madera') || prod.includes('barniz') || prod.includes('madera') || prod.includes('tinte')) {
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

    // 3. Esmaltes y Anticorrosivos (Pintulux / Doméstico)
    if (sup.includes('metal') || amb.includes('metal') || prod.includes('pintulux') || prod.includes('anticorrosivo') || prod.includes('esmalte') || prod.includes('doméstico')) {
      return {
        type: 'esmalte_anticorrosivo',
        label: 'Esmaltes y Anticorrosivos (Pintulux)',
        paintLineName: 'Pintulux Esmalte Sintético Anticorrosivo',
        palette: ESMALTES_ANTICORROSIVOS_PALETTE,
        allowsCustomTinting: false,
        badgeText: 'Colores de Línea Directa de Fábrica',
        badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
        restrictionNotice: 'ℹ️ Esmaltes de línea directa de fábrica con pigmentación antioxidante de alta resistencia. La preparación de colores personalizados no está disponible para esta formulación.'
      };
    }

    // 4. Impermeabilizantes y Techos (Aquablock)
    if (amb.includes('impermeabiliz') || amb.includes('techo') || prod.includes('aquablock') || prod.includes('fill')) {
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

    // 5. Default: Pinturas de Agua / Vinilos (Viniltex, Koraza, Intervinil)
    return {
      type: 'vinilo_agua',
      label: 'Pinturas de Agua / Vinilos (Viniltex & Koraza)',
      paintLineName: 'Viniltex Avanzado / Koraza Clima Extremo',
      palette: VINILOS_AGUA_PALETTE,
      allowsCustomTinting: true,
      badgeText: 'Sistema Tintométrico Color In (+2.000 Tonos)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      restrictionNotice: null
    };
  }, [formData.producto_deseado, formData.ambiente, formData.superficie]);

  // Sincronizar automáticamente el color seleccionado si no pertenece a la paleta del producto activo
  useEffect(() => {
    const currentPalette = activePaintCategory.palette;
    const isColorValid = currentPalette.some(
      c => c.name === formData.color_acabado || formData.color_acabado.includes(c.code)
    );
    if (!isColorValid && currentPalette.length > 0) {
      onChange('color_acabado', currentPalette[0].name);
    }
  }, [activePaintCategory, formData.color_acabado, onChange]);

  // Live Shipping calculation
  const liveShipping = useMemo(() => {
    return calculateShipping(
      activeDepartamentoName,
      formData.ciudad || activeDeptoObj.capital,
      Math.max(5, Math.ceil((formData.area_m2 || 100) / 30 * 1.05)),
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

  const applyDimensionsCalc = () => {
    const calculatedArea = Math.round(dimAncho * dimAlto * dimParedes);
    onChange('area_m2', Math.max(5, calculatedArea));
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

        {/* Wizard Stepper Pills Bar */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-black/20 p-1.5 sm:p-2 rounded-2xl backdrop-blur-sm border border-white/10">
          
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
            <span className="truncate">2. Medidas y Color</span>
          </button>

          {/* Step 3 Pill */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className={`flex items-center justify-center gap-2 py-2 px-2 sm:px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentStep === 3
                ? 'bg-white text-[#004B93] shadow-md shadow-black/20 scale-[1.01]'
                : 'text-blue-200/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
              currentStep === 3
                ? 'bg-[#004B93] text-white'
                : 'bg-white/20 text-white'
            }`}>
              3
            </span>
            <span className="truncate">3. Entrega y Cotización</span>
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
                Paso 1 de 3 • Identificación del Espacio
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {surfaceOptions.map((s) => {
                  const isSelected = formData.superficie === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => onChange('superficie', s.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#004B93] bg-blue-50/70 shadow-xs'
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

            {/* SUGERENCIA AUTOMÁTICA INTELIGENTE DE PINTURA PINTUCO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-[#E30613] flex items-center justify-center font-black text-lg shrink-0 mt-0.5">
                  ✓
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#E30613] border border-red-200">
                      Pintura Oficial Recomendada por IA
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">Norma NTC 1335</span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    {calculation.productoSugerido}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Rendimiento garantizado de 30 a 32 m²/galón a 2 manos. Alta resistencia y lavabilidad superior.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatalogSelector(!showCatalogSelector)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
                >
                  {showCatalogSelector ? 'Ocultar catálogo' : 'Cambiar pintura'}
                </button>
              </div>
            </div>

            {/* Desplegable opcional para cambiar producto si el usuario desea uno específico */}
            {showCatalogSelector && (
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 animate-fadeIn">
                <span className="text-xs font-bold text-slate-700 block">
                  Selecciona otra pintura del catálogo oficial:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PINTUCO_CATALOG.slice(0, 8).map((catProd) => (
                    <button
                      key={catProd.id}
                      type="button"
                      onClick={() => {
                        onChange('producto_deseado', catProd.nombre);
                        setShowCatalogSelector(false);
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 text-left hover:border-[#004B93] hover:bg-blue-50/50 transition-all group"
                    >
                      <span className="font-bold text-xs text-slate-900 group-hover:text-[#004B93] block">
                        {catProd.nombre}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {catProd.linea} • {catProd.tipoPintura}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* BOTÓN CONTINUAR AL PASO 2 */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#004B93] hover:bg-[#003B75] text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <span>Continuar a Medidas y Color (Paso 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------------
            PASO 2: ¿CUÁNTO MIDE TU ESPACIO? (Área m² y Color Pintuco)
        -------------------------------------------------------------------- */}
        {currentStep === 2 && (
          <div className="space-y-7 animate-fadeIn">
            
            {/* Step Header */}
            <div className="border-b border-slate-200/80 pb-4">
              <span className="text-[11px] font-bold text-[#004B93] uppercase tracking-wider">
                Paso 2 de 3 • Medidas y Acabado
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                ¿Cuánto mide tu espacio y qué color prefieres?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Indica los metros cuadrados totales de pared y selecciona el tono de la carta oficial Pintuco.
              </p>
            </div>

            {/* 2.1 ATAJOS DE METRAJE DIRECTO SEGÚN CATEGORÍA SELECCIONADA EN PASO 1 */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                      2.1 Atajos de metraje recomendados
                    </label>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#004B93] border border-blue-200">
                      Categoría: {currentAreaContext.categoryTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Selecciona un metraje estimado de referencia para tu proyecto o digita los m² exactos:
                  </p>
                </div>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl w-fit">
                  Área asignada: <strong className="text-[#004B93] font-mono text-xs">{formData.area_m2} m²</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {currentAreaContext.shortcuts.map((shortcut) => {
                  const isSelected = formData.area_m2 === shortcut.area;
                  return (
                    <button
                      key={shortcut.id}
                      type="button"
                      onClick={() => onChange('area_m2', shortcut.area)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between group hover:-translate-y-0.5 ${
                        isSelected
                          ? 'border-[#004B93] bg-blue-50/80 shadow-xs ring-1 ring-[#004B93]/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-mono font-black px-2.5 py-1 rounded-xl transition-colors ${
                          isSelected 
                            ? 'bg-[#004B93] text-white shadow-2xs' 
                            : 'bg-slate-100 text-slate-800 group-hover:bg-blue-100 group-hover:text-blue-900'
                        }`}>
                          ~{shortcut.area} m²
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#004B93] text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <div>
                        <h5 className={`font-extrabold text-xs leading-tight transition-colors ${
                          isSelected ? 'text-[#004B93]' : 'text-slate-900'
                        }`}>
                          {shortcut.label}
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          {shortcut.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Si se seleccionó Otro / Proyecto Personalizado en Paso 1, mostrar campo de especificación */}
              {(formData.ambiente === 'Otro / Proyecto Personalizado' || formData.ambiente?.toLowerCase().includes('otro')) && (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2 animate-fadeIn mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">➕</span>
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-900">Proyecto Personalizado / Otro Espacio</h5>
                      <p className="text-[11px] text-slate-600">
                        Describe las particularidades de tu proyecto (ej. Pisos de alto tráfico, humedades severas, tanques de agua, estructuras o áreas industriales):
                      </p>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Ej: Tanque de reserva de agua potable en concreto, Muebles de cocina, Cancha deportiva, etc."
                    value={formData.tipo_obra || ''}
                    onChange={(e) => onChange('tipo_obra', e.target.value)}
                    className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                  />
                </div>
              )}
            </div>

            {/* 2.2 INGRESO DIRECTO DE METROS CUADRADOS */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    2.2 Área Total a Pintar (Metros Cuadrados)
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Medida real de las paredes a cubrir. El cálculo aplicará 2 manos por norma.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDimensionCalc(!showDimensionCalc)}
                  className="text-xs font-bold text-[#004B93] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{showDimensionCalc ? 'Ocultar calculadora de dimensiones' : '¿Calcular con Ancho × Alto?'}</span>
                </button>
              </div>

              {/* Dimension Calculator Accordion */}
              {showDimensionCalc && (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/70 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#004B93]">
                    <Info className="w-4 h-4" />
                    <span>Calculadora rápida de paredes (Ancho × Alto × Número de muros)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Ancho por pared (m)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={dimAncho}
                        onChange={(e) => setDimAncho(Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs font-bold p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Alto de techo (m)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={dimAlto}
                        onChange={(e) => setDimAlto(Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs font-bold p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Número de paredes</label>
                      <input
                        type="number"
                        min="1"
                        value={dimParedes}
                        onChange={(e) => setDimParedes(Math.max(1, Number(e.target.value)))}
                        className="w-full text-xs font-bold p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-600">
                      Resultado estimado: <strong>{Math.round(dimAncho * dimAlto * dimParedes)} m²</strong>
                    </span>
                    <button
                      type="button"
                      onClick={applyDimensionsCalc}
                      className="px-3.5 py-1.5 rounded-lg bg-[#004B93] text-white text-xs font-bold shadow-xs hover:bg-[#003B75] transition-colors"
                    >
                      Aplicar al cálculo
                    </button>
                  </div>
                </div>
              )}

              {/* Slider and Manual Input */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
                <div className="flex-1">
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={formData.area_m2}
                    onChange={(e) => onChange('area_m2', Math.max(5, Number(e.target.value)))}
                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#004B93]"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                    <span>5 m²</span>
                    <span>100 m²</span>
                    <span>250 m²</span>
                    <span>500 m²</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onChange('area_m2', Math.max(5, formData.area_m2 - 10))}
                    className="w-9 h-9 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                  >
                    -10
                  </button>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={formData.area_m2}
                      onChange={(e) => onChange('area_m2', Math.max(1, Number(e.target.value)))}
                      className="w-24 text-center font-black text-lg p-2 rounded-xl border-2 border-[#004B93] bg-white text-slate-900"
                    />
                    <span className="absolute right-2 top-2.5 text-xs text-slate-500 font-bold">m²</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onChange('area_m2', formData.area_m2 + 10)}
                    className="w-9 h-9 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                  >
                    +10
                  </button>
                </div>
              </div>

            </div>

            {/* 2.3 SELECCIÓN DINÁMICA DE COLOR SEGÚN EL TIPO DE PINTURA */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    2.3 Carta de Color Oficial para {activePaintCategory.label}
                  </label>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${activePaintCategory.badgeColor}`}>
                      {activePaintCategory.badgeText}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Línea: {activePaintCategory.paintLineName}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs font-bold text-slate-600 block">
                    Color Seleccionado: <strong className="text-[#004B93]">{formData.color_acabado}</strong>
                  </span>
                </div>
              </div>

              {/* Mensaje de restricción o advertencia si el producto no admite tintometría personalizada */}
              {activePaintCategory.restrictionNotice && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {activePaintCategory.restrictionNotice}
                  </p>
                </div>
              )}

              {/* Swatches Grid Dinámica */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {activePaintCategory.palette.map((color) => {
                  const isSelected = formData.color_acabado === color.name || formData.color_acabado.includes(color.code);
                  return (
                    <button
                      key={color.code}
                      type="button"
                      onClick={() => onChange('color_acabado', color.name)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#004B93] bg-blue-50/70 shadow-xs'
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
                        <h6 className="font-extrabold text-xs text-slate-900 leading-tight">{color.shortName}</h6>
                        <span className="text-[10px] text-slate-500 font-mono">Cód: {color.code}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Color Preview Banner */}
              <div 
                className="p-4 rounded-2xl border border-slate-300 flex items-center justify-between shadow-2xs"
                style={{ 
                  backgroundColor: selectedColorObj.hex,
                  color: selectedColorObj.lrv > 50 ? '#0F172A' : '#FFFFFF'
                }}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
                    Muestra en Vivo • {selectedColorObj.acabado}
                  </span>
                  <h5 className="font-black text-base">{selectedColorObj.name}</h5>
                  <p className="text-xs opacity-90">{selectedColorObj.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-black/20 backdrop-blur-xs">
                    Reflectancia: {selectedColorObj.lrv}%
                  </span>
                </div>
              </div>

              {/* Opción de preparación personalizada tintométrica Color In para Vinilos de Agua */}
              {activePaintCategory.allowsCustomTinting && (
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
                      value={formData.color_acabado}
                      onChange={(e) => onChange('color_acabado', e.target.value)}
                      className="flex-1 text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#004B93]"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Puedes ingresar directamente cualquier código o nombre del abanico tintométrico Pintuco (+2.000 colores formulados).
                  </p>
                </div>
              )}

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
                <span>Continuar a Entrega y Cotización (Paso 3)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------------
            PASO 3: ENTREGA Y COTIZACIÓN FINAL (Ubicación, Contacto, Resumen y CTA)
        -------------------------------------------------------------------- */}
        {currentStep === 3 && (
          <div className="space-y-7 animate-fadeIn">
            
            {/* Step Header */}
            <div className="border-b border-slate-200/80 pb-4">
              <span className="text-[11px] font-bold text-[#004B93] uppercase tracking-wider">
                Paso 3 de 3 • Despacho y Cotización Oficial
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                Lugar de entrega y cálculo final de materiales
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Especifica la ciudad de destino y revisa los galones y cuñetes oficiales para radicar tu pedido.
              </p>
            </div>

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
                      onChange('sede_retiro', stores[0].nombre);
                      onChange('direccion_obra', `Retiro en Tienda: ${stores[0].nombre} - ${stores[0].direccion}`);
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

                  {/* Cuadrícula de Tarjetas Interactivas de Tiendas Pintuco */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {availableStores.map((store) => {
                      const isStoreSelected = (formData.sede_retiro === store.nombre) || (!formData.sede_retiro && store.id === availableStores[0]?.id);
                      return (
                        <div
                          key={store.id}
                          onClick={() => {
                            onChange('sede_retiro', store.nombre);
                            onChange('direccion_obra', `Retiro en Tienda: ${store.nombre} - ${store.direccion}`);
                          }}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isStoreSelected
                              ? 'border-[#004B93] bg-blue-50/80 shadow-xs ring-1 ring-[#004B93]'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <div>
                              <h6 className="font-extrabold text-xs text-slate-900">{store.nombre}</h6>
                              <span className="text-[10px] text-slate-500 font-semibold">{store.badge || 'Punto Oficial Pintuco'}</span>
                            </div>
                            {isStoreSelected && (
                              <span className="w-5 h-5 rounded-full bg-[#004B93] text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#004B93] shrink-0" />
                            <span>{store.direccion}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tarjeta Visual de Información de la Tienda Seleccionada */}
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

            {/* 3.4 RESUMEN OFICIAL DE MATERIALES Y CÁLCULO NTC 1335 (TEMA CLARO / LIGHT MODE) */}
            <div className="p-6 rounded-3xl bg-white text-slate-900 border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-[#004B93] uppercase tracking-wider block">
                    Resumen Volumétrico Oficial NTC 1335
                  </span>
                  <h4 className="text-xl font-black text-slate-900 mt-0.5">
                    {calculation.productoSugerido}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Color: <strong className="text-slate-900">{formData.color_acabado}</strong> • Área total: <strong className="text-slate-900">{formData.area_m2} m²</strong> en <strong className="text-slate-900">{formData.ciudad}</strong>.
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Valor Estimado COP</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">
                    ${liveSummaryTotals.totalCOP.toLocaleString('es-CO')}
                  </span>
                </div>
              </div>

              {/* Units Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Cuñetes y Galones de Pintura */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#004B93] uppercase tracking-wider">
                      Pintura Principal
                    </span>
                    <span className="text-xs font-mono font-bold bg-[#004B93] px-2.5 py-0.5 rounded-full text-white">
                      {calculation.galonesPintura} Galones Totales
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-slate-900">
                      {calculation.cuñetesPintura}
                    </span>
                    <span className="text-xs text-slate-600 font-bold">Cuñetes (5 Gal)</span>
                    <span className="text-slate-400">+</span>
                    <span className="text-2xl font-black font-mono text-slate-900">
                      {calculation.galonesSueltosPintura}
                    </span>
                    <span className="text-xs text-slate-600 font-bold">Galones (1 Gal)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">
                    Empaquetado optimizado para minimizar sobrantes de obra.
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

              {/* 3.5 DESGLOSE DE PRODUCTOS Y CANTIDADES EDITABLES (ESTRICTAMENTE PINTURAS Y SELLADOR CALCULADOS) */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#004B93]" />
                      <span>Resumen de Pintura y Sellador Calculados</span>
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Productos técnicos calculados según tu área. Puedes ajustar las cantidades exactas requeridas:
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 w-fit">
                    Norma NTC 1335
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Ítem 1: Cuñetes Pintura Principal */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {calculation.productoSugerido} • Cuñete (5 Gal)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ${unitPrices.cunetePrice.toLocaleString('es-CO')} COP / cuñete • Color: {formData.color_acabado}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="flex items-center rounded-lg overflow-hidden border border-slate-300 bg-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditedQuantities(prev => ({ ...prev, cunetes: Math.max(0, prev.cunetes - 1) }))}
                          className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Disminuir cuñetes"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={editedQuantities.cunetes}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setEditedQuantities(prev => ({ ...prev, cunetes: isNaN(val) ? 0 : Math.max(0, val) }));
                          }}
                          className="w-12 text-center text-xs font-black text-slate-900 bg-white border-x border-slate-300 py-1 focus:outline-none focus:bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={() => setEditedQuantities(prev => ({ ...prev, cunetes: prev.cunetes + 1 }))}
                          className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Aumentar cuñetes"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right min-w-[95px]">
                        <span className="text-xs font-mono font-bold text-emerald-700 block">
                          ${liveSummaryTotals.subtotalCunetes.toLocaleString('es-CO')}
                        </span>
                        <span className="text-[9px] text-slate-500">Subtotal COP</span>
                      </div>
                    </div>
                  </div>

                  {/* Ítem 2: Galones Pintura Principal */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {calculation.productoSugerido} • Galón (1 Gal)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        ${unitPrices.baseGalon.toLocaleString('es-CO')} COP / galón • Color: {formData.color_acabado}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="flex items-center rounded-lg overflow-hidden border border-slate-300 bg-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditedQuantities(prev => ({ ...prev, galones: Math.max(0, prev.galones - 1) }))}
                          className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Disminuir galones"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={editedQuantities.galones}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setEditedQuantities(prev => ({ ...prev, galones: isNaN(val) ? 0 : Math.max(0, val) }));
                          }}
                          className="w-12 text-center text-xs font-black text-slate-900 bg-white border-x border-slate-300 py-1 focus:outline-none focus:bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={() => setEditedQuantities(prev => ({ ...prev, galones: prev.galones + 1 }))}
                          className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Aumentar galones"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right min-w-[95px]">
                        <span className="text-xs font-mono font-bold text-emerald-700 block">
                          ${liveSummaryTotals.subtotalGalones.toLocaleString('es-CO')}
                        </span>
                        <span className="text-[9px] text-slate-500">Subtotal COP</span>
                      </div>
                    </div>
                  </div>

                  {/* Ítem 3: Sellador Fijador / Imprimante con Sugerencia Educativa */}
                  {editedQuantities.sellador > 0 ? (
                    <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-2">
                          <span>Sellador Antialcalino / Fijador Imprimante (1 Gal)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                            💡 Consejo Pintuco agregado
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          ${unitPrices.selladorPrice.toLocaleString('es-CO')} COP / galón • Sellado de poros y máxima durabilidad
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="flex items-center rounded-lg overflow-hidden border border-slate-300 bg-slate-100">
                          <button
                            type="button"
                            onClick={() => setEditedQuantities(prev => ({ ...prev, sellador: Math.max(0, prev.sellador - 1) }))}
                            className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Disminuir sellador"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={editedQuantities.sellador}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setEditedQuantities(prev => ({ ...prev, sellador: isNaN(val) ? 0 : Math.max(0, val) }));
                            }}
                            className="w-12 text-center text-xs font-black text-slate-900 bg-white border-x border-slate-300 py-1 focus:outline-none focus:bg-slate-50"
                          />
                          <button
                            type="button"
                            onClick={() => setEditedQuantities(prev => ({ ...prev, sellador: prev.sellador + 1 }))}
                            className="px-2.5 py-1 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Aumentar sellador"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right min-w-[95px]">
                          <span className="text-xs font-mono font-bold text-emerald-700 block">
                            ${liveSummaryTotals.subtotalSellador.toLocaleString('es-CO')}
                          </span>
                          <span className="text-[9px] text-slate-500">Subtotal COP</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setEditedQuantities(prev => ({ ...prev, sellador: 0 }))}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Quitar sellador de mi pedido"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* RECOMENDACIÓN CERCANA Y EDUCATIVA (CONSEJO PINTUCO) */
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0" role="img" aria-label="consejo">💡</span>
                        <div className="space-y-1">
                          <h6 className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                            <span>Consejo Pintuco</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              Recomendación para tu proyecto
                            </span>
                          </h6>
                          <p className="text-[11px] text-slate-700 leading-relaxed">
                            Para que el color de tu pintura resalte más, se adhiera mejor y dure años, te sugerimos aplicar un Sellador Antialcalino. ¿Deseas agregarlo?
                          </p>
                          <span className="text-[10px] text-amber-900/90 font-medium block">
                            Cantidad calculada para tus {formData.area_m2} m²: ~{calculation.galonesSellador || 1} galón{(calculation.galonesSellador || 1) > 1 ? 'es' : ''} (${(78000 * (calculation.galonesSellador || 1)).toLocaleString('es-CO')} COP)
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
                        className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-black bg-[#FFD100] hover:bg-[#F5C800] active:scale-95 text-slate-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
                      >
                        <Plus className="w-4 h-4 text-slate-950" />
                        <span>+ Agregar Sellador a mi pedido</span>
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

              {/* 3.6 SECCIÓN DE PRODUCTOS COMPLEMENTARIOS (SUGERIDOS / HERRAMIENTAS) */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h5 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>¿Te gustaría agregar esto para que tu proyecto quede perfecto?</span>
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Recomendados Pintuco para facilitar tu trabajo y lograr un acabado profesional de primera:
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 w-fit">
                    Recomendados Pintuco
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {RECOMMENDED_PROJECT_TOOLS.map((tool) => {
                    const isAdded = (selectedTools[tool.id] || 0) > 0;
                    const qty = selectedTools[tool.id] || 0;
                    return (
                      <div
                        key={tool.id}
                        className={`rounded-xl p-3 border transition-all flex flex-col justify-between gap-3 shadow-xs ${
                          isAdded
                            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300/50'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={tool.imagenUrl}
                            alt={tool.nombre}
                            className="w-14 h-14 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-bold uppercase text-amber-800 tracking-wider block">
                              {tool.categoria}
                            </span>
                            <h6 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                              {tool.nombre}
                            </h6>
                            <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-2">
                              {tool.descripcion}
                            </p>
                            <span className="text-xs font-mono font-black text-slate-900 mt-1 block">
                              ${tool.precio.toLocaleString('es-CO')} COP
                            </span>
                          </div>
                        </div>

                        {/* Botón de acción: + Añadir por $... o Contador de Cantidad */}
                        <div>
                          {!isAdded ? (
                            <button
                              type="button"
                              onClick={() => handleToggleTool(tool.id)}
                              className="w-full py-2 px-3 rounded-lg text-xs font-black bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-950 border border-slate-300 hover:border-amber-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Añadir por ${tool.precio.toLocaleString('es-CO')}</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-between gap-2 p-1 rounded-lg bg-white border border-amber-300 shadow-xs">
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateToolQty(tool.id, qty - 1)}
                                  className="w-7 h-7 rounded text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                                  title="Disminuir"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-xs font-black text-slate-900 font-mono">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateToolQty(tool.id, qty + 1)}
                                  className="w-7 h-7 rounded text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
                                  title="Aumentar"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-amber-900 pr-2">
                                ${(tool.precio * qty).toLocaleString('es-CO')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal Herramientas Seleccionadas */}
                {liveSummaryTotals.subtotalTools > 0 && (
                  <div className="pt-2 flex justify-between items-center text-xs text-amber-900 border-t border-amber-200">
                    <span>Herramientas sugeridas añadidas ({Object.values(selectedTools).reduce((a, b) => a + b, 0)} ítems):</span>
                    <span className="font-mono font-bold text-amber-950 text-sm">
                      +${liveSummaryTotals.subtotalTools.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                )}
              </div>

              {/* TOTAL GENERAL RECALCULADO EN TIEMPO REAL */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">Total de Compra Recalculado:</span>
                  <span className="text-[11px] text-slate-600 block">
                    {liveSummaryTotals.subtotalTools > 0
                      ? `Incluye pinturas, sellador y ${Object.values(selectedTools).reduce((a, b) => a + b, 0)} herramientas sugeridas`
                      : 'Incluye estrictamente pinturas y sellador calculados (0 herramientas)'}
                  </span>
                </div>
                <div className="text-xl sm:text-3xl font-black font-mono text-emerald-600">
                  ${liveSummaryTotals.totalCOP.toLocaleString('es-CO')} COP
                </div>
              </div>

              {/* BOTONES PRINCIPALES DE ACCIÓN CTA: DISPOSICIÓN EN 2 COLUMNAS + FICHA TÉCNICA */}
              <div className="pt-2 space-y-3">
                
                {/* Layout en 2 Columnas Lado a Lado en escritorio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Botón Izquierdo: Añadir al Carrito */}
                  <button
                    type="button"
                    onClick={() => {
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

                      if (onAddToCart) {
                        onAddToCart(editedQuantities, false, toolsPayload);
                      } else if (onSaveOrder) {
                        onSaveOrder('cotizacion');
                      }
                    }}
                    disabled={isSaving}
                    className="w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-blue-700 to-[#004B93] hover:from-blue-800 hover:to-[#003B75] active:scale-[0.99] text-white shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] border border-blue-600 disabled:opacity-60"
                  >
                    <ShoppingBag className="w-5 h-5 text-amber-300 shrink-0" />
                    <span>Añadir al Carrito</span>
                  </button>

                  {/* Botón Derecho: Continuar Proceso de Compra */}
                  <button
                    type="button"
                    onClick={() => {
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

                      if (onAddToCart) {
                        onAddToCart(editedQuantities, true, toolsPayload);
                      } else if (onSaveOrder) {
                        onSaveOrder('pedido');
                      }
                    }}
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
                  <span>Imprimir / Exportar Ficha Técnica Oficial</span>
                </button>

              </div>

            </div>

            {/* BOTONES NAVEGACIÓN PASO 3 */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Medidas (Paso 2)</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-[#004B93] font-bold hover:underline"
              >
                Volver al inicio del wizard
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
