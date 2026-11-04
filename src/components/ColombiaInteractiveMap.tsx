import React, { useState } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker,
  Line
} from 'react-simple-maps';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Truck, 
  Building2, 
  CheckCircle2, 
  Warehouse,
  ExternalLink,
  Sparkles,
  Calculator,
  ArrowLeft
} from 'lucide-react';
import { COLOMBIA_GEOJSON } from '../data/colombiaGeoJson';
import { getDepartmentFillColor } from '../data/colombiaMapStyles';

export interface SedePintuco {
  id: string;
  nombre: string;
  ciudad: string;
  departamento: string;
  region: string;
  // Geographic Coordinates [longitud, latitud] para react-simple-maps
  coordinates: [number, number];
  tipo: 'Megaplanta & CEDI' | 'CEDI Regional' | 'Hub Portuario & Distribución' | 'Bodega de Despacho Rápido';
  direccion: string;
  telefono: string;
  horario: string;
  tiempoEntrega: string;
  stockCuñetesEstimado: number;
  tiendasCobertura: number;
  asesorRegional: string;
  colorHex: string;
  imagen: string;
}

export const SEDES_PINTUCO: SedePintuco[] = [
  {
    id: 'santamarta',
    nombre: 'Hub Sierra & Puerto Marítimo',
    ciudad: 'Santa Marta',
    departamento: 'Magdalena',
    region: 'Costa Caribe',
    coordinates: [-74.20, 11.24],
    tipo: 'Bodega de Despacho Rápido',
    direccion: 'Vía Alterna al Puerto Km 2, Bodega 7',
    telefono: '+57 (605) 431 8020',
    horario: 'Lunes a Viernes 7:30 AM - 5:00 PM',
    tiempoEntrega: '24 a 48 horas',
    stockCuñetesEstimado: 2900,
    tiendasCobertura: 18,
    asesorRegional: 'Asesor Técnico Comercial',
    colorHex: '#E31C23',
    imagen: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'barranquilla',
    nombre: 'CEDI Caribe Vía 40 & Malecón',
    ciudad: 'Barranquilla',
    departamento: 'Atlántico',
    region: 'Costa Caribe',
    coordinates: [-74.80, 10.96],
    tipo: 'Hub Portuario & Distribución',
    direccion: 'Vía 40 # 77B-120, Zona Portuaria Industrial',
    telefono: '+57 (605) 385 4100 / Cel. +57 320 902 4411',
    horario: 'Lunes a Viernes 7:00 AM - 5:00 PM | Sábados 7:30 AM - 12:00 M',
    tiempoEntrega: '24 a 48 horas costa atlántica',
    stockCuñetesEstimado: 8900,
    tiendasCobertura: 40,
    asesorRegional: 'Lic. Álvaro Char (Zona Norte)',
    colorHex: '#E31C23',
    imagen: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cartagena',
    nombre: 'Hub Mamonal & Protección Marina',
    ciudad: 'Cartagena',
    departamento: 'Bolívar',
    region: 'Costa Caribe',
    coordinates: [-75.51, 10.39],
    tipo: 'Hub Portuario & Distribución',
    direccion: 'Zona Industrial Mamonal Km 7, Complejo Logístico del Caribe',
    telefono: '+57 (605) 668 5200 / Cel. +57 318 430 7712',
    horario: 'Lunes a Viernes 7:30 AM - 5:00 PM | Sábados 8:00 AM - 1:00 PM',
    tiempoEntrega: '24 horas zona metropolitana',
    stockCuñetesEstimado: 6400,
    tiendasCobertura: 28,
    asesorRegional: 'Ing. Carmen Silgado (Especialista Marino / Koraza)',
    colorHex: '#0033A0',
    imagen: '/images/cartagena_mamonal_hub.jpg',
  },
  {
    id: 'cucuta',
    nombre: 'Sede Frontera Norte Zona Franca',
    ciudad: 'Cúcuta',
    departamento: 'Norte de Santander',
    region: 'Andina / Santanderes',
    coordinates: [-72.50, 7.89],
    tipo: 'Bodega de Despacho Rápido',
    direccion: 'Zona Franca de Cúcuta, Manzana 4 Bodega B',
    telefono: '+57 (607) 578 3344',
    horario: 'Lunes a Viernes 8:00 AM - 5:00 PM | Sábados 8:00 AM - 12:00 M',
    tiempoEntrega: '24 a 48 horas',
    stockCuñetesEstimado: 3200,
    tiendasCobertura: 19,
    asesorRegional: 'Ing. Patricia Colmenares',
    colorHex: '#0033A0',
    imagen: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'bucaramanga',
    nombre: 'Centro Logístico Nororiente Girón',
    ciudad: 'Bucaramanga',
    departamento: 'Santander',
    region: 'Andina / Santanderes',
    coordinates: [-73.12, 7.12],
    tipo: 'CEDI Regional',
    direccion: 'Anillo Vial Girón - Floridablanca Km 3, Bodega 12',
    telefono: '+57 (607) 646 9000 / Cel. +57 312 301 9988',
    horario: 'Lunes a Viernes 7:30 AM - 5:30 PM | Sábados 8:00 AM - 1:00 PM',
    tiempoEntrega: '24 horas hábiles',
    stockCuñetesEstimado: 4800,
    tiendasCobertura: 29,
    asesorRegional: 'Ing. Rodrigo Villamizar',
    colorHex: '#0033A0',
    imagen: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'medellin',
    nombre: 'Megaplanta Rionegro & Sede Guayabal',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    region: 'Andina',
    coordinates: [-75.56, 6.24],
    tipo: 'Megaplanta & CEDI',
    direccion: 'Carrera 42 # 14-35 (Guayabal) & Autopista Medellín-Bogotá Km 38',
    telefono: '+57 (604) 374 8800 / WhatsApp +57 310 450 8890',
    horario: 'Lunes a Viernes 6:30 AM - 6:00 PM | Sábados 7:00 AM - 2:00 PM',
    tiempoEntrega: '12 a 24 horas garantizadas',
    stockCuñetesEstimado: 18500,
    tiendasCobertura: 68,
    asesorRegional: 'Gerencia Técnica & Especificaciones (Zona Occidente)',
    colorHex: '#E31C23',
    imagen: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pereira',
    nombre: 'CEDI Eje Cafetero Dosquebradas',
    ciudad: 'Pereira',
    departamento: 'Risaralda',
    region: 'Andina / Eje Cafetero',
    coordinates: [-75.69, 4.81],
    tipo: 'CEDI Regional',
    direccion: 'Avenida del Ferrocarril # 18-40, Dosquebradas',
    telefono: '+57 (606) 330 2000 / Cel. +57 311 200 4567',
    horario: 'Lunes a Viernes 7:30 AM - 5:30 PM | Sábados 8:00 AM - 1:00 PM',
    tiempoEntrega: '24 horas',
    stockCuñetesEstimado: 5100,
    tiendasCobertura: 32,
    asesorRegional: 'Arq. Jorge Mario Giraldo',
    colorHex: '#E31C23',
    imagen: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'ibague',
    nombre: 'Centro Logístico Tolima Grande El Salado',
    ciudad: 'Ibagué',
    departamento: 'Tolima',
    region: 'Andina / Tolima',
    coordinates: [-75.23, 4.43],
    tipo: 'Bodega de Despacho Rápido',
    direccion: 'Vía al Salado Km 4, Parque Empresarial El Jardín',
    telefono: '+57 (608) 277 8900',
    horario: 'Lunes a Viernes 7:30 AM - 5:00 PM | Sábados 8:00 AM - 1:00 PM',
    tiempoEntrega: '24 horas',
    stockCuñetesEstimado: 3600,
    tiendasCobertura: 22,
    asesorRegional: 'Lic. Camilo Arciniegas',
    colorHex: '#0033A0',
    imagen: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'bogota',
    nombre: 'CEDI Central Fontibón & Sabanagrande',
    ciudad: 'Bogotá D.C.',
    departamento: 'Cundinamarca',
    region: 'Andina / Centro',
    coordinates: [-74.07, 4.71],
    tipo: 'Megaplanta & CEDI',
    direccion: 'Zona Industrial Montevideo, Calle 19 # 68-50 (Fontibón)',
    telefono: '+57 (601) 325 5000 / Línea Nal. 018000 111 247',
    horario: 'Lunes a Viernes 7:00 AM - 5:30 PM | Sábados 7:30 AM - 1:00 PM',
    tiempoEntrega: 'Mismo día / 24 horas a pie de obra',
    stockCuñetesEstimado: 12400,
    tiendasCobertura: 85,
    asesorRegional: 'Ing. Fernando Salamanca (Zona Centro)',
    colorHex: '#0033A0',
    imagen: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'villavicencio',
    nombre: 'CEDI Puerta al Llano Kirpas',
    ciudad: 'Villavicencio',
    departamento: 'Meta',
    region: 'Orinoquía',
    coordinates: [-73.63, 4.14],
    tipo: 'Bodega de Despacho Rápido',
    direccion: 'Vía Catama Km 3, Anillo Vial Kirpas',
    telefono: '+57 (608) 662 3340',
    horario: 'Lunes a Viernes 7:00 AM - 5:00 PM | Sábados 7:30 AM - 12:30 PM',
    tiempoEntrega: '24 horas',
    stockCuñetesEstimado: 3800,
    tiendasCobertura: 24,
    asesorRegional: 'Ing. Fabio Echeverry',
    colorHex: '#0033A0',
    imagen: 'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'cali',
    nombre: 'CEDI Pacífico & Valle Acopi Yumbo',
    ciudad: 'Cali',
    departamento: 'Valle del Cauca',
    region: 'Pacífica',
    coordinates: [-76.52, 3.45],
    tipo: 'CEDI Regional',
    direccion: 'Acopi Yumbo, Calle 15 # 24N-10, Vía Cali-Yumbo',
    telefono: '+57 (602) 690 1200 / Cel. +57 315 889 0214',
    horario: 'Lunes a Viernes 7:30 AM - 5:00 PM | Sábados 8:00 AM - 12:30 PM',
    tiempoEntrega: '24 horas a pie de obra',
    stockCuñetesEstimado: 7200,
    tiendasCobertura: 44,
    asesorRegional: 'Arq. Julián Caicedo (Zona Valle & Cauca)',
    colorHex: '#0033A0',
    imagen: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'pasto',
    nombre: 'Centro de Enlace Nariño Torobajo',
    ciudad: 'Pasto',
    departamento: 'Nariño',
    region: 'Pacífica / Sur',
    coordinates: [-77.28, 1.21],
    tipo: 'Bodega de Despacho Rápido',
    direccion: 'Sector Torobajo, Vía Panamericana Sur Km 1.5',
    telefono: '+57 (602) 723 4400',
    horario: 'Lunes a Viernes 8:00 AM - 5:30 PM | Sábados 8:00 AM - 1:00 PM',
    tiempoEntrega: '24 a 48 horas',
    stockCuñetesEstimado: 2600,
    tiendasCobertura: 16,
    asesorRegional: 'Ing. Darío Narváez',
    colorHex: '#0033A0',
    imagen: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'leticia',
    nombre: 'Base Fluvial & Frontera Leticia Amazonas',
    ciudad: 'Leticia',
    departamento: 'Amazonas',
    region: 'Amazonía',
    coordinates: [-69.94, -4.21],
    tipo: 'Bodega de Despacho Rápido',
    direccion: 'Avenida Internacional # 8-45, Puerto Leticia',
    telefono: '+57 (608) 592 7700',
    horario: 'Lunes a Viernes 8:00 AM - 5:00 PM',
    tiempoEntrega: '3 a 5 días fluviales',
    stockCuñetesEstimado: 1900,
    tiendasCobertura: 12,
    asesorRegional: 'Lic. Germán Souza (Amazonía)',
    colorHex: '#0033A0',
    imagen: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
  }
];

// Red Nacional de Conexiones Logísticas Inteligentes Pintuco
export const NETWORK_CONNECTIONS: Array<{ from: [number, number]; to: [number, number]; id: string }> = [
  // Conexiones troncales desde Megaplanta Medellín
  { id: 'med-bog', from: [-75.56, 6.24], to: [-74.07, 4.71] },
  { id: 'med-cal', from: [-75.56, 6.24], to: [-76.52, 3.45] },
  { id: 'med-baq', from: [-75.56, 6.24], to: [-74.80, 10.96] },
  { id: 'med-per', from: [-75.56, 6.24], to: [-75.69, 4.81] },
  { id: 'med-buc', from: [-75.56, 6.24], to: [-73.12, 7.12] },
  // Conexiones troncales desde Bogotá Central
  { id: 'bog-iba', from: [-74.07, 4.71], to: [-75.23, 4.43] },
  { id: 'bog-vil', from: [-74.07, 4.71], to: [-73.63, 4.14] },
  { id: 'bog-buc', from: [-74.07, 4.71], to: [-73.12, 7.12] },
  { id: 'bog-cal', from: [-74.07, 4.71], to: [-76.52, 3.45] },
  { id: 'bog-per', from: [-74.07, 4.71], to: [-75.69, 4.81] },
  { id: 'bog-baq', from: [-74.07, 4.71], to: [-74.80, 10.96] },
  { id: 'bog-let', from: [-74.07, 4.71], to: [-69.94, -4.21] },
  { id: 'bog-pas', from: [-74.07, 4.71], to: [-77.28, 1.21] },
  // Troncales Regionales
  { id: 'buc-cuc', from: [-73.12, 7.12], to: [-72.50, 7.89] },
  { id: 'baq-ctg', from: [-74.80, 10.96], to: [-75.51, 10.39] },
  { id: 'baq-smr', from: [-74.80, 10.96], to: [-74.20, 11.24] },
  { id: 'cal-pas', from: [-76.52, 3.45], to: [-77.28, 1.21] },
];

// Desplazamiento Inteligente de Etiquetas (Smart Labels) para evitar solapamientos regionales
export const SEDE_LABEL_OFFSETS: Record<string, { dx: number; dy: number }> = {
  santamarta:    { dx: 54,  dy: -20 }, // Hacia el noreste (mar/Guajira)
  barranquilla:  { dx: -56, dy: -22 }, // Hacia el noroeste (mar)
  cartagena:     { dx: -54, dy: 16 },  // Hacia el suroeste costero
  cucuta:        { dx: 50,  dy: -8 },  // Hacia el oriente (frontera)
  bucaramanga:   { dx: -58, dy: -12 }, // Hacia el occidente (valle Magdalena)
  medellin:      { dx: -58, dy: -18 }, // Hacia el noroccidente
  pereira:       { dx: -52, dy: 10 },  // Hacia el occidente
  ibague:        { dx: -48, dy: 28 },  // Hacia el sur-occidente
  bogota:        { dx: 56,  dy: -8 },  // Hacia el oriente
  villavicencio: { dx: 60,  dy: 22 },  // Hacia el sur-oriente (Llanos)
  cali:          { dx: -50, dy: 8 },   // Hacia el occidente (Pacífico)
  pasto:         { dx: -48, dy: 18 },  // Hacia el sur-occidente
  leticia:       { dx: 52,  dy: -10 }, // Hacia el oriente
};

interface ColombiaInteractiveMapProps {
  onSelectSede?: (sede: SedePintuco) => void;
  selectedCityName?: string;
  compact?: boolean;
  onGoToCotizador?: () => void;
  onBackToHome?: () => void;
}

export const ColombiaInteractiveMap: React.FC<ColombiaInteractiveMapProps> = ({
  onSelectSede,
  selectedCityName,
  compact = false,
  onGoToCotizador,
  onBackToHome,
}) => {
  const [selectedSedeId, setSelectedSedeId] = useState<string | null>(() => {
    if (selectedCityName) {
      const match = SEDES_PINTUCO.find((s) => s.ciudad.toLowerCase().includes(selectedCityName.toLowerCase()));
      if (match) return match.id;
    }
    return null;
  });
  const [hoveredSede, setHoveredSede] = useState<SedePintuco | null>(null);
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  // Sede activa en el panel lateral: previsualiza hoveredSede si el cursor está sobre un marcador,
  // o muestra la sede seleccionada. Si no hay ninguna, se muestra el estado inicial "Encuentra tu sede".
  const activeSede = hoveredSede || (selectedSedeId ? SEDES_PINTUCO.find((s) => s.id === selectedSedeId) || null : null);

  const handleSelect = (sede: SedePintuco) => {
    setSelectedSedeId(sede.id);
    if (onSelectSede) {
      onSelectSede(sede);
    }
    setConfirmationNotice(`Sede fijada: ${sede.ciudad} (${sede.nombre})`);
    setTimeout(() => setConfirmationNotice(null), 3500);
  };

  const filteredSedes = SEDES_PINTUCO.filter((s) => {
    if (filterRegion === 'all') return true;
    if (filterRegion === 'caribe') return s.region.toLowerCase().includes('caribe');
    if (filterRegion === 'andina') return s.region.toLowerCase().includes('andina');
    if (filterRegion === 'pacifico') return s.region.toLowerCase().includes('pacífica');
    if (filterRegion === 'orinoquia') return s.region.toLowerCase().includes('orinoquía') || s.region.toLowerCase().includes('amazonía');
    return true;
  });

  return (
    <div id="coverage-section" className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-fadeIn">
      
      {/* =========================================================================
          ENCABEZADO INTEGRADO DENTRO DE LA COMPOSICIÓN DEL MAPA
      ========================================================================= */}
      <div className="bg-gradient-to-r from-[#002244] via-[#003366] to-[#0A4D68] text-white p-4 sm:p-5 border-b border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {onBackToHome && (
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer mr-1"
                  title="Volver a Inicio"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Inicio</span>
                </button>
              )}
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-xs">
                COBERTURA NACIONAL
              </span>
              <span className="text-xs text-cyan-200 font-semibold hidden sm:inline flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                Red Logística & Sedes Oficiales Pintuco
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Pintuco está más cerca de ti
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl font-normal leading-relaxed">
              Encuentra sedes, CEDIs y Megaplantas en todo Colombia.
            </p>
          </div>

          {/* Quick Metrics & Acceso Directo */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 shadow-inner">
              <div className="text-center px-2">
                <span className="text-[11px] text-slate-300 font-semibold block">Sedes Hub</span>
                <span className="text-base sm:text-lg font-black text-white">12 CEDI</span>
              </div>
              <div className="w-px h-7 bg-white/20" />
              <div className="text-center px-2">
                <span className="text-[11px] text-slate-300 font-semibold block">Despacho</span>
                <span className="text-base sm:text-lg font-black text-amber-300">24-48h</span>
              </div>
              <div className="w-px h-7 bg-white/20" />
              <div className="text-center px-2">
                <span className="text-[11px] text-slate-300 font-semibold block">Cobertura</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">100% País</span>
              </div>
            </div>

            {onGoToCotizador && (
              <button
                type="button"
                onClick={onGoToCotizador}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-slate-950" />
                <span>Ir al Cotizador</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: GeoJSON Map (60-65%) + Side Information Panel (35-40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-3.5 sm:p-5 bg-[#030e1f] border-b border-cyan-900/30 items-stretch">
        
        {/* Left: react-simple-maps GeoJSON Map Canvas (60–65% de ancho) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-start relative w-full">
          
          {/* Legend and guidance */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00E5FF]" />
                Megaplantas
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38BDF8]" />
                CEDIs Regionales
              </span>
              <span className="flex items-center gap-1.5 font-medium text-cyan-400/80 hidden sm:inline">
                <span className="w-3.5 h-0.5 border-t border-dashed border-cyan-400" />
                Vectores de Cobertura
              </span>
            </div>
            <span className="text-[11px] font-semibold text-cyan-400/70 hidden sm:inline">
              Pasa el cursor para previsualizar • Clic para fijar sede
            </span>
          </div>

          {/* Map Canvas with high-tech dark navy & digital network background */}
          <div 
            id="coverage-map-svg-container"
            className="relative w-full rounded-3xl border border-cyan-500/30 shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-300 bg-[#020B17]"
            style={{ 
              width: '100%', 
              height: '620px',
              background: 'radial-gradient(ellipse at 50% 42%, #09264a 0%, #05142c 55%, #020915 100%)'
            }}
            onMouseLeave={() => setHoveredSede(null)}
          >
            {/* HUD Status Bar Superior */}
            <div className="absolute top-3.5 left-4 z-20 flex items-center gap-2 bg-[#031326]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="text-[10px] font-mono tracking-wider text-cyan-300 font-bold uppercase">
                RED NACIONAL INTELIGENTE PINTUCO • 100% ACTIVA
              </span>
            </div>

            <div className="absolute top-3.5 right-4 z-20 hidden sm:flex items-center gap-2 bg-[#031326]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/25 shadow-lg text-[10px] font-mono text-slate-300">
              <span className="text-cyan-400 font-bold">11 NODOS ESTRATÉGICOS</span>
              <span className="text-cyan-600">•</span>
              <span>44+ CIUDADES</span>
            </div>

            {/* HUD Leyenda Inferior */}
            <div className="absolute bottom-3.5 left-4 z-20 flex items-center gap-3 sm:gap-4 bg-[#031326]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-cyan-500/25 shadow-lg text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00E5FF]" />
                <span className="font-semibold text-white">Megaplanta</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38BDF8]" />
                <span className="font-semibold text-slate-200">CEDI / Hub</span>
              </span>
              <span className="hidden md:flex items-center gap-1.5 text-cyan-400/80 font-mono text-[10px]">
                <span className="w-4 h-0.5 border-t border-dashed border-cyan-400" />
                <span>Troncal Logística</span>
              </span>
            </div>

            {/* Coordenadas HUD Inferior Derecha */}
            <div className="absolute bottom-3.5 right-4 z-20 hidden lg:flex items-center gap-1.5 text-[9px] font-mono text-cyan-400/60 bg-[#031326]/60 px-2.5 py-1 rounded-lg border border-cyan-500/15">
              <span>LAT: 04°35'N</span>
              <span>•</span>
              <span>LON: 74°04'W</span>
            </div>

            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 2750,
                center: [-73.0, 4.0] // Centered & optimized so whole Colombia is visible without cutting Guajira or Amazonía
              }}
              width={800}
              height={1000}
              viewBox="0 0 800 1000"
              style={{ 
                width: '100%', 
                height: '100%', 
                maxHeight: '620px', 
                objectFit: 'contain' 
              }}
            >
              <defs>
                {/* 1. Gradiente luminoso para máximo contraste de la silueta de Colombia contra el fondo marino */}
                <linearGradient id="colombiaSilhouetteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0A2540" />
                  <stop offset="50%" stopColor="#003366" />
                  <stop offset="100%" stopColor="#001A33" />
                </linearGradient>

                {/* 2. Malla digital de textura inteligente: pattern de puntos cian con baja opacidad */}
                <pattern id="colombiaTechGridPattern" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="8" cy="8" r="0.85" fill="#00f2fe" fillOpacity="0.25" />
                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(0, 242, 254, 0.08)" strokeWidth="0.5" />
                </pattern>

                {/* 3. Resplandor y borde exterior intenso (Glow Effect) alrededor del contorno de Colombia */}
                <filter id="colombiaNeonContourGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="#00f2fe" floodOpacity="0.65" />
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00f2fe" floodOpacity="0.95" />
                </filter>

                {/* Resplandor tecnológico para nodos luminosos */}
                <filter id="techNodeGlow" x="-60%" y="-60%" width="220%" height="220%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00f2fe" floodOpacity="0.9" />
                </filter>

                {/* Resplandor intenso para nodo activo / hovered */}
                <filter id="techNodeGlowActive" x="-80%" y="-80%" width="260%" height="260%">
                  <feDropShadow dx="0" dy="0" stdDeviation="11" floodColor="#00f2fe" floodOpacity="1" />
                </filter>

                {/* Resplandor vibrante para Megaplanta (acento naranja/cyan) */}
                <filter id="megaplantaGlow" x="-80%" y="-80%" width="260%" height="260%">
                  <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#FF6600" floodOpacity="0.9" />
                  <feDropShadow dx="0" dy="0" stdDeviation="14" floodColor="#00f2fe" floodOpacity="0.65" />
                </filter>

                {/* Retícula digital sutil de fondo tecnológico */}
                <pattern id="techGridMap" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 229, 255, 0.04)" strokeWidth="0.8" />
                  <circle cx="40" cy="40" r="0.8" fill="rgba(0, 229, 255, 0.16)" />
                </pattern>

                {/* Aura de resplandor central detrás de la silueta */}
                <radialGradient id="techCenterAura" cx="50%" cy="45%" r="55%">
                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.12" />
                  <stop offset="50%" stopColor="#0284c7" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#020B17" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Malla digital de fondo */}
              <rect width="800" height="1000" fill="url(#techGridMap)" pointerEvents="none" />

              {/* Halo radial de profundidad detrás de Colombia */}
              <circle cx="400" cy="480" r="350" fill="url(#techCenterAura)" pointerEvents="none" />

              {/* CAPA 1: Silueta de Colombia con Relleno Gradiente y Borde Resplandeciente Neón (#00f2fe / 1.5px) */}
              <g filter="url(#colombiaNeonContourGlow)">
                <Geographies geography={COLOMBIA_GEOJSON}>
                  {({ geographies }) =>
                    geographies.map((geo, idx) => (
                      <Geography
                        key={`base-${geo.rsmKey || geo.id || idx}`}
                        geography={geo}
                        fill="url(#colombiaSilhouetteGradient)"
                        stroke="#00f2fe"
                        strokeWidth={1.5}
                        className="transition-all duration-300 outline-none cursor-default"
                        style={{ outline: 'none' }}
                      />
                    ))
                  }
                </Geographies>
              </g>

              {/* CAPA 2: Malla Tecnológica Digital Inteligente (Pattern de Puntos y Líneas Cian) */}
              <Geographies geography={COLOMBIA_GEOJSON}>
                {({ geographies }) =>
                  geographies.map((geo, idx) => (
                    <Geography
                      key={`mesh-${geo.rsmKey || geo.id || idx}`}
                      geography={geo}
                      fill="url(#colombiaTechGridPattern)"
                      stroke="rgba(0, 242, 254, 0.35)"
                      strokeWidth={0.75}
                      className="pointer-events-none outline-none"
                      style={{ outline: 'none', pointerEvents: 'none' }}
                    />
                  ))
                }
              </Geographies>

              {/* Red de Vectores de Conexión Logística entre Hubs y Sedes con Flujo Animado */}
              {NETWORK_CONNECTIONS.map((link) => {
                const isDirectHover = hoveredSede && (
                  (link.from[0] === hoveredSede.coordinates[0] && link.from[1] === hoveredSede.coordinates[1]) ||
                  (link.to[0] === hoveredSede.coordinates[0] && link.to[1] === hoveredSede.coordinates[1])
                );
                const isBogotaConnect = hoveredSede && hoveredSede.id === 'bogota' && (
                  (link.from[0] === -74.07 && link.from[1] === 4.71) ||
                  (link.to[0] === -74.07 && link.to[1] === 4.71)
                );
                const isHighlighted = isDirectHover || isBogotaConnect;

                return (
                  <Line
                    key={link.id}
                    from={link.from}
                    to={link.to}
                    stroke={isHighlighted ? "#FFFFFF" : "#00f2fe"}
                    strokeWidth={isHighlighted ? 2.6 : 1.3}
                    strokeDasharray={isHighlighted ? "6 3" : "5 4"}
                    strokeOpacity={isHighlighted ? 1 : 0.45}
                    className="animate-network-flow transition-all duration-300 pointer-events-none"
                    style={{
                      filter: isHighlighted ? 'drop-shadow(0 0 8px #00f2fe)' : 'none'
                    }}
                  />
                );
              })}

              {/* Conexión directa resaltada hacia Bogotá y Megaplanta al hacer hover sobre cualquier sede */}
              {hoveredSede && hoveredSede.id !== 'bogota' && (
                <Line
                  from={hoveredSede.coordinates}
                  to={[-74.07, 4.71]}
                  stroke="#00f2fe"
                  strokeWidth={3}
                  strokeDasharray="6 3"
                  strokeOpacity={1}
                  className="animate-network-flow pointer-events-none"
                  style={{ filter: 'drop-shadow(0 0 10px #00f2fe)' }}
                />
              )}
              {hoveredSede && hoveredSede.id !== 'medellin' && (
                <Line
                  from={hoveredSede.coordinates}
                  to={[-75.56, 6.24]}
                  stroke="#FF8800"
                  strokeWidth={2.4}
                  strokeDasharray="5 3"
                  strokeOpacity={0.85}
                  className="animate-network-flow pointer-events-none"
                  style={{ filter: 'drop-shadow(0 0 8px #FF6600)' }}
                />
              )}

              {/* Puntos de Cobertura: Nodos Luminosos de Alta Energía con Smart Labels */}
              {SEDES_PINTUCO.map((sede) => {
                const isSelected = sede.id === selectedSedeId;
                const isHovered = hoveredSede?.id === sede.id;
                const isHighlighted = isSelected || isHovered;
                const isMegaplanta = sede.tipo.includes('Megaplanta');
                const labelOffset = SEDE_LABEL_OFFSETS[sede.id] || { dx: 52, dy: -12 };
                const textLabel = isSelected ? `✓ ${sede.ciudad}` : sede.ciudad;
                const pillWidth = Math.max(56, textLabel.length * 7.4 + 18);
                const pillHeight = 22;
                
                return (
                  <Marker
                    key={sede.id}
                    coordinates={sede.coordinates}
                    onClick={() => handleSelect(sede)}
                    onMouseEnter={() => setHoveredSede(sede)}
                    className="map-sede-marker cursor-pointer select-none"
                  >
                    {/* 1. LÍNEA GUÍA / LEADER LINE: Conecta limpiamente la coordenada con la etiqueta */}
                    <line
                      x1={0}
                      y1={0}
                      x2={labelOffset.dx}
                      y2={labelOffset.dy}
                      stroke={
                        isHovered 
                          ? '#FACC15' 
                          : isMegaplanta 
                          ? '#FF8800' 
                          : '#00f2fe'
                      }
                      strokeWidth={isHovered ? 2.2 : 1.5}
                      strokeOpacity={isHovered ? 1 : 0.75}
                      strokeDasharray={isHovered ? 'none' : '3 1.5'}
                      className="pointer-events-none transition-all duration-200"
                      style={{
                        filter: isHovered 
                          ? 'drop-shadow(0 0 6px #FACC15)' 
                          : 'drop-shadow(0 0 4px rgba(0,242,254,0.6))'
                      }}
                    />

                    {/* Punto ancla del conector en el origen */}
                    <circle
                      cx={0}
                      cy={0}
                      r={2.5}
                      fill={isHovered ? '#FACC15' : isMegaplanta ? '#FF8800' : '#00f2fe'}
                      className="pointer-events-none"
                    />

                    {/* 2. MARCADOR DEL NODO CON RELIEVE 3D Y AGRANDAMIENTO AL 130% EN HOVER */}
                    <g
                      style={{ filter: 'drop-shadow(0px 2px 6px rgba(0,0,0,0.9))' }}
                      className="transition-transform duration-300"
                      transform={isHovered ? 'scale(1.3)' : isSelected ? 'scale(1.15)' : 'scale(1)'}
                    >
                      {/* Doble anillo concéntrico en pulso */}
                      {/* Anillo concéntrico 1 (onda expansiva) */}
                      <circle
                        cx={0}
                        cy={0}
                        r={isMegaplanta ? 26 : 22}
                        fill={isMegaplanta ? "rgba(255, 102, 0, 0.22)" : "rgba(0, 242, 254, 0.2)"}
                        stroke={isMegaplanta ? "#FF6600" : "#00f2fe"}
                        strokeWidth={1.5}
                        className="animate-ping pointer-events-none"
                        style={{ animationDuration: isHovered ? '1.4s' : '2.5s' }}
                      />

                      {/* Anillo concéntrico 2 (halo resplandeciente) */}
                      <circle
                        cx={0}
                        cy={0}
                        r={isMegaplanta ? 16 : 13}
                        fill={isMegaplanta ? "rgba(255, 102, 0, 0.45)" : "rgba(0, 242, 254, 0.4)"}
                        stroke={isMegaplanta ? "#FF9900" : "#38bdf8"}
                        strokeWidth={1.8}
                        filter={isMegaplanta ? "url(#megaplantaGlow)" : isHighlighted ? "url(#techNodeGlowActive)" : "url(#techNodeGlow)"}
                      />

                      {/* Anillo orbital selector en hover o activo */}
                      {isHighlighted && (
                        <circle
                          cx={0}
                          cy={0}
                          r={isMegaplanta ? 20 : 17}
                          fill="none"
                          stroke={isHovered ? "#FACC15" : isMegaplanta ? "#FF6600" : "#00f2fe"}
                          strokeWidth={2}
                          strokeDasharray="3 2"
                          className="pointer-events-none"
                        />
                      )}

                      {/* Base del nodo: Megaplanta naranja o CEDI cian neón */}
                      <circle
                        cx={0}
                        cy={0}
                        r={isMegaplanta ? 11 : 9}
                        fill={isMegaplanta ? '#FF6600' : isSelected ? '#00f2fe' : '#0284c7'}
                        stroke="#FFFFFF"
                        strokeWidth={2.4}
                        filter={isMegaplanta ? "url(#megaplantaGlow)" : isHighlighted ? "url(#techNodeGlowActive)" : "url(#techNodeGlow)"}
                      />

                      {/* Círculo blanco central: 12px (r=6) para Megaplanta, 10px (r=5) para CEDIs */}
                      <circle
                        cx={0}
                        cy={0}
                        r={isMegaplanta ? 6 : 5}
                        fill="#FFFFFF"
                        className="pointer-events-none"
                      />
                    </g>

                    {/* 3. ETIQUETA PÍLDORA INTELIGENTE DE ALTO CONTRASTE (#030712 + BORDE CIAN TRASLÚCIDO) */}
                    <g 
                      transform={`translate(${labelOffset.dx}, ${labelOffset.dy})`}
                      className="transition-all duration-200"
                    >
                      <rect
                        x={-pillWidth / 2}
                        y={-pillHeight / 2}
                        width={pillWidth}
                        height={pillHeight}
                        rx={pillHeight / 2}
                        fill="#030712"
                        stroke={
                          isHovered 
                            ? '#FACC15' 
                            : isSelected 
                            ? '#00f2fe' 
                            : 'rgba(0, 242, 254, 0.4)'
                        }
                        strokeWidth={isHovered ? 1.8 : 1}
                        style={{
                          filter: isHovered 
                            ? 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.85))' 
                            : isSelected
                            ? 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.7))'
                            : 'drop-shadow(0px 2px 6px rgba(0,0,0,0.9))'
                        }}
                        className="transition-all duration-200"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        y={0}
                        style={{
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          fill: isHovered ? '#FACC15' : isSelected ? '#38bdf8' : '#FFFFFF',
                          letterSpacing: '0.3px',
                          userSelect: 'none',
                          pointerEvents: 'none',
                          filter: isHovered ? 'drop-shadow(0 0 5px rgba(250, 204, 21, 0.8))' : 'none'
                        }}
                      >
                        {textLabel}
                      </text>
                    </g>
                  </Marker>
                );
              })}
            </ComposableMap>
          </div>

          {/* Toast de confirmación al seleccionar */}
          {confirmationNotice && (
            <div className="absolute bottom-6 left-6 right-6 bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-fadeIn z-30 border border-cyan-500/40 backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{confirmationNotice}</span>
            </div>
          )}
        </div>

        {/* Right: Panel Lateral de Información de Sede (aprox. 35–40% de ancho) */}
        <div className="lg:col-span-5 flex flex-col justify-between w-full">
          <div className="bg-[#001D3D] text-white rounded-3xl border border-cyan-500/30 shadow-2xl p-5 sm:p-6 flex flex-col justify-between h-full min-h-[580px] lg:min-h-[620px] relative overflow-hidden">
            
            {/* Background ambient gradient glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {!activeSede ? (
              /* =========================================================================
                 ESTADO INICIAL: CUANDO EL USUARIO TODAVÍA NO HA SELECCIONADO UNA SEDE
              ========================================================================= */
              <div 
                key="initial-state"
                className="sede-panel-transition flex flex-col items-center justify-center text-center h-full my-auto py-8 px-2 space-y-6 relative z-10"
              >
                {/* Ícono de ubicación moderno con halo pulsante */}
                <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#003366] to-[#001D3D] border-2 border-cyan-400/40 shadow-xl shadow-cyan-950/50">
                  <MapPin className="w-10 h-10 text-orange-400 animate-pulse drop-shadow-md" />
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-400"></span>
                  </span>
                </div>

                <div className="space-y-2 max-w-sm">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 inline-block">
                    Localizador de Sedes ColorLink
                  </span>
                  <h4 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Encuentra tu sede
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    Selecciona una ubicación en el mapa para consultar información, horarios y datos de contacto.
                  </p>
                </div>

                {/* Guía rápida interactiva con detalles de ColorLink */}
                <div className="w-full max-w-sm bg-slate-900/80 border border-cyan-500/20 rounded-2xl p-4 text-left space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 text-orange-300 font-medium">
                    <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>Pasa el cursor o haz clic en cualquier pin del mapa</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-yellow-300 font-medium">
                    <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                    <span>Consulta horarios y despachos express en 24-48h</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-emerald-300 font-medium">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Contacto directo con asesor técnico regional</span>
                  </div>
                </div>

                {/* Acceso rápido a las ciudades principales */}
                <div className="w-full max-w-sm pt-2">
                  <span className="text-[11px] text-cyan-200/80 font-bold block mb-2 uppercase tracking-wider">
                    Sedes principales sugeridas:
                  </span>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {SEDES_PINTUCO.slice(0, 5).map((sede) => (
                      <button
                        key={sede.id}
                        type="button"
                        onClick={() => handleSelect(sede)}
                        onMouseEnter={() => setHoveredSede(sede)}
                        onMouseLeave={() => setHoveredSede(null)}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-cyan-900/60 border border-cyan-500/30 text-white text-[11px] font-bold transition-all hover:scale-105 cursor-pointer shadow-xs"
                      >
                        📍 {sede.ciudad}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* =========================================================================
                 PANEL DE INFORMACIÓN DE SEDE (TRANSICIÓN SUAVE 200-300ms)
              ========================================================================= */
              <div 
                key={activeSede.id}
                className="sede-panel-transition flex flex-col justify-between h-full space-y-4 relative z-10"
              >
                <div className="space-y-3.5">
                  
                  {/* 1. Imagen de la sede en la parte superior con badges y gradiente */}
                  <div className="relative h-44 sm:h-48 w-full rounded-2xl overflow-hidden border border-cyan-500/30 shadow-lg group">
                    <img 
                      src={activeSede.imagen} 
                      alt={activeSede.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#001D3D] via-[#001D3D]/30 to-transparent" />
                    
                    {/* 2. Etiqueta del tipo de sede (Top-Left) */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md backdrop-blur-md border ${
                        activeSede.tipo.includes('Megaplanta') 
                          ? 'bg-red-600/90 border-red-400/50' 
                          : 'bg-blue-600/90 border-cyan-400/40'
                      }`}>
                        {activeSede.tipo}
                      </span>
                    </div>

                    {/* Indicador de selección / Vista previa (Top-Right) */}
                    <div className="absolute top-3 right-3">
                      {activeSede.id === selectedSedeId ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 border border-emerald-300 shadow-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-slate-950 stroke-[3]" />
                          <span>Sede Seleccionada</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-cyan-300 bg-slate-950/70 border border-cyan-500/40 backdrop-blur-md">
                          Previsualizando
                        </span>
                      )}
                    </div>

                    {/* 3. Nombre de la ciudad y departamento (Bottom-Left) */}
                    <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-end justify-between">
                      <div>
                        <h4 className="text-xl sm:text-2xl font-black text-white drop-shadow-md tracking-tight">
                          {activeSede.ciudad}
                        </h4>
                        <p className="text-xs text-orange-400 font-bold drop-shadow-xs flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          <span>{activeSede.departamento} • {activeSede.region}</span>
                        </p>
                      </div>

                      {/* 8. Estado o disponibilidad (Verde/turquesa) */}
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Disponible</span>
                      </span>
                    </div>
                  </div>

                  {/* 4. Nombre de la sede */}
                  <div className="bg-slate-900/60 p-3 rounded-2xl border border-cyan-500/20 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-cyan-300/80 font-bold block uppercase tracking-wider">Nombre del Hub / Sede:</span>
                      <span className="text-xs sm:text-sm font-extrabold text-white truncate block">{activeSede.nombre}</span>
                    </div>
                  </div>

                  {/* Bloque de Información detallada con la paleta estricta */}
                  <div className="space-y-2.5 text-xs bg-slate-900/90 p-4 rounded-2xl border border-cyan-500/20 shadow-inner">
                    
                    {/* 5. Dirección (Naranja para ubicación) */}
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <span className="text-[10px] text-orange-300/90 font-bold block uppercase tracking-wide">
                          Dirección de Despacho & Bodega:
                        </span>
                        <span className="text-white font-medium leading-relaxed block">
                          {activeSede.direccion}
                        </span>
                      </div>
                    </div>

                    {/* 6. Teléfono (Verde/turquesa para teléfono o disponibilidad) */}
                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 shrink-0 mt-0.5">
                        <Phone className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-300/90 font-bold block uppercase tracking-wide">
                          Teléfono / Línea de Despacho:
                        </span>
                        <span className="text-emerald-300 font-mono font-bold leading-relaxed block">
                          {activeSede.telefono}
                        </span>
                      </div>
                    </div>

                    {/* 7. Horario de atención (Amarillo únicamente cuando corresponda a horarios) */}
                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-800">
                      <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 text-yellow-400" />
                      </div>
                      <div>
                        <span className="text-[10px] text-yellow-300/90 font-bold block uppercase tracking-wide">
                          Horario de Atención:
                        </span>
                        <span className="text-yellow-200 font-medium leading-relaxed block">
                          {activeSede.horario}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Estadísticas operativas */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-slate-900/60 rounded-xl border border-cyan-500/20">
                      <Truck className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-0.5" />
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Entrega</span>
                      <span className="text-[11px] font-black text-white block">{activeSede.tiempoEntrega}</span>
                    </div>

                    <div className="p-2.5 bg-slate-900/60 rounded-xl border border-cyan-500/20">
                      <Warehouse className="w-3.5 h-3.5 text-teal-400 mx-auto mb-0.5" />
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Stock Cuñetes</span>
                      <span className="text-[11px] font-black text-teal-300 block">~{activeSede.stockCuñetesEstimado.toLocaleString()} GL</span>
                    </div>

                    <div className="p-2.5 bg-slate-900/60 rounded-xl border border-cyan-500/20">
                      <Building2 className="w-3.5 h-3.5 text-sky-400 mx-auto mb-0.5" />
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">Tiendas</span>
                      <span className="text-[11px] font-black text-sky-300 block">{activeSede.tiendasCobertura} Puntos</span>
                    </div>
                  </div>

                  {/* Asesor regional */}
                  <div className="p-3 bg-slate-900/70 rounded-xl border border-cyan-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center font-black text-[10px] text-white">
                        CL
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Asesor Técnico de Obra:</span>
                        <span className="font-bold text-white text-xs block">{activeSede.asesorRegional}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                      En línea
                    </span>
                  </div>

                </div>

                {/* 9. Botón "Seleccionar sede" */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleSelect(activeSede)}
                    className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      activeSede.id === selectedSedeId
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50 shadow-emerald-950/50'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 border border-amber-400/40 shadow-orange-950/40'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {activeSede.id === selectedSedeId
                        ? `✓ Sede ${activeSede.ciudad} Seleccionada`
                        : `Seleccionar sede: ${activeSede.ciudad}`}
                    </span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

      {/* Bottom Directory: Quick list */}
      <div className="bg-[#020a17] p-6 border-t border-cyan-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>Directorio de Hubs y Nodos Logísticos Pintuco en Colombia</span>
          </h4>

          {/* Region Filter Buttons */}
          <div className="flex flex-wrap gap-1 bg-slate-900/90 p-1 rounded-xl border border-cyan-500/20 text-xs shadow-inner">
            <button
              type="button"
              onClick={() => setFilterRegion('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterRegion === 'all' ? 'bg-cyan-500 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Todos (12)
            </button>
            <button
              type="button"
              onClick={() => setFilterRegion('andina')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterRegion === 'andina' ? 'bg-cyan-500 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Región Andina
            </button>
            <button
              type="button"
              onClick={() => setFilterRegion('caribe')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterRegion === 'caribe' ? 'bg-cyan-500 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Costa Caribe
            </button>
            <button
              type="button"
              onClick={() => setFilterRegion('pacifico')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterRegion === 'pacifico' ? 'bg-cyan-500 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Pacífico & Sur
            </button>
            <button
              type="button"
              onClick={() => setFilterRegion('orinoquia')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterRegion === 'orinoquia' ? 'bg-cyan-500 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              Orinoquía & Amazonía
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {filteredSedes.map((sede) => {
            const isSelected = sede.id === selectedSedeId;
            return (
              <button
                key={sede.id}
                type="button"
                onClick={() => handleSelect(sede)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-400/30 shadow-[0_0_15px_rgba(0,229,255,0.2)] text-white'
                    : 'bg-slate-900/60 border-cyan-500/20 hover:border-cyan-400/50 hover:bg-slate-800/80 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[11px] font-black ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                    {sede.ciudad}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${sede.tipo.includes('Megaplanta') ? 'bg-cyan-400 shadow-[0_0_6px_#00E5FF]' : 'bg-sky-400'}`} />
                </div>
                <span className="text-[10px] text-slate-400 block truncate">
                  {sede.departamento}
                </span>
                <span className="text-[9px] font-bold text-cyan-400/80 block mt-1">
                  {sede.tiempoEntrega}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
