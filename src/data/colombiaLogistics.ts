export interface MunicipioInfo {
  nombre: string;
  tipo: 'principal' | 'secundario' | 'especial';
  hubCercano: string;
}

export interface DepartamentoData {
  nombre: string;
  codigoDANE: string;
  capital: string;
  hubPrincipal: string;
  municipios: MunicipioInfo[];
}

export interface PintucoStoreHub {
  id: string;
  nombre: string;
  ciudad: string;
  departamento: string;
  direccion: string;
  telefono: string;
  horario: string;
  tipo: 'Planta Principal' | 'CEDI Nacional' | 'Hub Regional' | 'Tienda Pintumarket Pro';
  coordenadas?: { lat: number; lng: number };
}

// Sedes Oficiales Pintuco / Color In para Retiro en Tienda / CEDI
export const PINTUCO_STORE_HUBS: PintucoStoreHub[] = [
  {
    id: 'hub-bogota-cedi',
    nombre: 'CEDI Central Fontibón - Pintuco',
    ciudad: 'Bogotá D.C.',
    departamento: 'Bogotá D.C.',
    direccion: 'Carrera 106 No. 15-25, Zona Industrial Fontibón',
    telefono: '+57 (601) 745 8800 Ext. 102',
    horario: 'Lunes a Viernes 7:00 am - 5:30 pm | Sábados 7:30 am - 1:00 pm',
    tipo: 'CEDI Nacional'
  },
  {
    id: 'hub-bogota-norte',
    nombre: 'Pintumarket Pro Autopista Norte',
    ciudad: 'Bogotá D.C.',
    departamento: 'Bogotá D.C.',
    direccion: 'Autopista Norte No. 145-30',
    telefono: '+57 (601) 627 4410',
    horario: 'Lunes a Sábado 8:00 am - 6:00 pm',
    tipo: 'Tienda Pintumarket Pro'
  },
  {
    id: 'hub-medellin-rionegro',
    nombre: 'Planta Principal Rionegro - Pintuco',
    ciudad: 'Rionegro',
    departamento: 'Antioquia',
    direccion: 'Autopista Medellín-Bogotá Km 38, Vía Rionegro',
    telefono: '+57 (604) 569 8000',
    horario: 'Lunes a Viernes 6:30 am - 5:00 pm | Sábados 7:00 am - 12:00 m',
    tipo: 'Planta Principal'
  },
  {
    id: 'hub-medellin-guayabal',
    nombre: 'CEDI Guayabal & Ventas Mayoristas',
    ciudad: 'Medellín',
    departamento: 'Antioquia',
    direccion: 'Carrera 52 No. 14-80, Guayabal',
    telefono: '+57 (604) 370 2000',
    horario: 'Lunes a Viernes 7:30 am - 5:30 pm | Sábados 8:00 am - 1:00 pm',
    tipo: 'Hub Regional'
  },
  {
    id: 'hub-cali-yumbo',
    nombre: 'Hub Regional Yumbo - Valle del Cauca',
    ciudad: 'Yumbo / Cali',
    departamento: 'Valle del Cauca',
    direccion: 'Calle 15 No. 28-90, Zona Industrial Acopi Yumbo',
    telefono: '+57 (602) 695 5000',
    horario: 'Lunes a Viernes 7:30 am - 5:00 pm | Sábados 8:00 am - 12:30 pm',
    tipo: 'Hub Regional'
  },
  {
    id: 'hub-barranquilla-via40',
    nombre: 'CEDI Vía 40 Costa Caribe',
    ciudad: 'Barranquilla',
    departamento: 'Atlántico',
    direccion: 'Vía 40 No. 73-120, Sector Industrial',
    telefono: '+57 (605) 369 4000',
    horario: 'Lunes a Viernes 7:30 am - 5:00 pm | Sábados 8:00 am - 1:00 pm',
    tipo: 'Hub Regional'
  },
  {
    id: 'hub-bucaramanga-chimita',
    nombre: 'Sede Oriente Chimitá',
    ciudad: 'Bucaramanga',
    departamento: 'Santander',
    direccion: 'Km 3 Vía Palenque-Café Madrid, Chimitá',
    telefono: '+57 (607) 676 2200',
    horario: 'Lunes a Viernes 7:30 am - 5:00 pm | Sábados 8:00 am - 12:00 m',
    tipo: 'Hub Regional'
  },
  {
    id: 'hub-cartagena-mamonal',
    nombre: 'Centro Logístico Mamonal',
    ciudad: 'Cartagena',
    departamento: 'Bolívar',
    direccion: 'Corredor de Carga Km 7, Sector Mamonal',
    telefono: '+57 (605) 668 9000',
    horario: 'Lunes a Viernes 7:30 am - 5:00 pm | Sábados 8:00 am - 12:30 pm',
    tipo: 'Hub Regional'
  },
  {
    id: 'hub-pereira-dosquebradas',
    nombre: 'Hub Eje Cafetero Dosquebradas',
    ciudad: 'Pereira / Dosquebradas',
    departamento: 'Risaralda',
    direccion: 'Avenida del Ferrocarril No. 12-45',
    telefono: '+57 (606) 330 1500',
    horario: 'Lunes a Viernes 7:30 am - 5:30 pm | Sábados 8:00 am - 1:00 pm',
    tipo: 'Hub Regional'
  }
];

// Base de Datos Geográfica y Logística de los 32 Departamentos de Colombia + Bogotá D.C.
export const DEPARTAMENTOS_COLOMBIA: DepartamentoData[] = [
  {
    nombre: 'Bogotá D.C.',
    codigoDANE: '11',
    capital: 'Bogotá D.C.',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'Bogotá D.C.', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Usaquén', tipo: 'principal', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'Suba', tipo: 'principal', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'Engativá', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Fontibón', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Kennedy', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Bosa', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Chapinero', tipo: 'principal', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'Teusaquillo', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Puente Aranda', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' }
    ]
  },
  {
    nombre: 'Antioquia',
    codigoDANE: '05',
    capital: 'Medellín',
    hubPrincipal: 'Planta Principal Rionegro - Pintuco',
    municipios: [
      { nombre: 'Medellín', tipo: 'principal', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Bello', tipo: 'principal', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Itagüí', tipo: 'principal', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Envigado', tipo: 'principal', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Sabaneta', tipo: 'principal', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Rionegro', tipo: 'principal', hubCercano: 'Planta Principal Rionegro - Pintuco' },
      { nombre: 'La Estrella', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Caldas', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Copacabana', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Girardota', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Apartadó', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Turbo', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Carepa', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Marinilla', tipo: 'secundario', hubCercano: 'Planta Principal Rionegro - Pintuco' },
      { nombre: 'Guarne', tipo: 'secundario', hubCercano: 'Planta Principal Rionegro - Pintuco' },
      { nombre: 'El Carmen de Viboral', tipo: 'secundario', hubCercano: 'Planta Principal Rionegro - Pintuco' },
      { nombre: 'La Ceja', tipo: 'secundario', hubCercano: 'Planta Principal Rionegro - Pintuco' },
      { nombre: 'Caucasia', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Yarumal', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Santa Rosa de Osos', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Santa Fe de Antioquia', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' }
    ]
  },
  {
    nombre: 'Cundinamarca',
    codigoDANE: '25',
    capital: 'Bogotá D.C.',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'Soacha', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Chía', tipo: 'principal', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'Zipaquirá', tipo: 'principal', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'Facatativá', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Mosquera', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Madrid', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Funza', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Cota', tipo: 'principal', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'Cajicá', tipo: 'principal', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'Girardot', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Fusagasugá', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Sopó', tipo: 'secundario', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'Tocancipá', tipo: 'secundario', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'Gachancipá', tipo: 'secundario', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'Tenjo', tipo: 'secundario', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'Tabio', tipo: 'secundario', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'La Calera', tipo: 'secundario', hubCercano: 'Pintumarket Pro Autopista Norte' },
      { nombre: 'Sibaté', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Villeta', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Guaduas', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Ubaté', tipo: 'secundario', hubCercano: 'Pintumarket Pro Autopista Norte' }
    ]
  },
  {
    nombre: 'Valle del Cauca',
    codigoDANE: '76',
    capital: 'Cali',
    hubPrincipal: 'Hub Regional Yumbo - Valle del Cauca',
    municipios: [
      { nombre: 'Cali', tipo: 'principal', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Yumbo', tipo: 'principal', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Palmira', tipo: 'principal', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Buenaventura', tipo: 'principal', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Tuluá', tipo: 'principal', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Buga (Guadalajara de Buga)', tipo: 'principal', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Cartago', tipo: 'principal', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'Jamundí', tipo: 'principal', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Candelaria', tipo: 'secundario', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Zarzal', tipo: 'secundario', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Roldanillo', tipo: 'secundario', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Pradera', tipo: 'secundario', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Florida', tipo: 'secundario', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' }
    ]
  },
  {
    nombre: 'Atlántico',
    codigoDANE: '08',
    capital: 'Barranquilla',
    hubPrincipal: 'CEDI Vía 40 Costa Caribe',
    municipios: [
      { nombre: 'Barranquilla', tipo: 'principal', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Soledad', tipo: 'principal', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Malambo', tipo: 'principal', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Puerto Colombia', tipo: 'principal', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Galapa', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Baranoa', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Sabanalarga', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Palmar de Varela', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' }
    ]
  },
  {
    nombre: 'Santander',
    codigoDANE: '68',
    capital: 'Bucaramanga',
    hubPrincipal: 'Sede Oriente Chimitá',
    municipios: [
      { nombre: 'Bucaramanga', tipo: 'principal', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Floridablanca', tipo: 'principal', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Girón', tipo: 'principal', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Piedecuesta', tipo: 'principal', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Barrancabermeja', tipo: 'principal', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'San Gil', tipo: 'secundario', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Socorro', tipo: 'secundario', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Barbosa', tipo: 'secundario', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Lebrija', tipo: 'secundario', hubCercano: 'Sede Oriente Chimitá' }
    ]
  },
  {
    nombre: 'Bolívar',
    codigoDANE: '13',
    capital: 'Cartagena',
    hubPrincipal: 'Centro Logístico Mamonal',
    municipios: [
      { nombre: 'Cartagena', tipo: 'principal', hubCercano: 'Centro Logístico Mamonal' },
      { nombre: 'Turbaco', tipo: 'principal', hubCercano: 'Centro Logístico Mamonal' },
      { nombre: 'Arjona', tipo: 'secundario', hubCercano: 'Centro Logístico Mamonal' },
      { nombre: 'Magangué', tipo: 'secundario', hubCercano: 'Centro Logístico Mamonal' },
      { nombre: 'El Carmen de Bolívar', tipo: 'secundario', hubCercano: 'Centro Logístico Mamonal' }
    ]
  },
  {
    nombre: 'Risaralda',
    codigoDANE: '66',
    capital: 'Pereira',
    hubPrincipal: 'Hub Eje Cafetero Dosquebradas',
    municipios: [
      { nombre: 'Pereira', tipo: 'principal', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'Dosquebradas', tipo: 'principal', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'Santa Rosa de Cabal', tipo: 'secundario', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'La Virginia', tipo: 'secundario', hubCercano: 'Hub Eje Cafetero Dosquebradas' }
    ]
  },
  {
    nombre: 'Caldas',
    codigoDANE: '17',
    capital: 'Manizales',
    hubPrincipal: 'Hub Eje Cafetero Dosquebradas',
    municipios: [
      { nombre: 'Manizales', tipo: 'principal', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'Villamaría', tipo: 'secundario', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'Chinchiná', tipo: 'secundario', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'La Dorada', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Anserma', tipo: 'secundario', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'Riosucio', tipo: 'secundario', hubCercano: 'Hub Eje Cafetero Dosquebradas' }
    ]
  },
  {
    nombre: 'Quindío',
    codigoDANE: '63',
    capital: 'Armenia',
    hubPrincipal: 'Hub Eje Cafetero Dosquebradas',
    municipios: [
      { nombre: 'Armenia', tipo: 'principal', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'Calarcá', tipo: 'secundario', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'Montenegro', tipo: 'secundario', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'Quimbaya', tipo: 'secundario', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'La Tebaida', tipo: 'secundario', hubCercano: 'Hub Eje Cafetero Dosquebradas' },
      { nombre: 'Circasia', tipo: 'secundario', hubCercano: 'Hub Eje Cafetero Dosquebradas' }
    ]
  },
  {
    nombre: 'Tolima',
    codigoDANE: '73',
    capital: 'Ibagué',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'Ibagué', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Espinal', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Melgar', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Flandes', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Chaparral', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Mariquita', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Honda', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' }
    ]
  },
  {
    nombre: 'Huila',
    codigoDANE: '41',
    capital: 'Neiva',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'Neiva', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Pitalito', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Garzón', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'La Plata', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Campoalegre', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' }
    ]
  },
  {
    nombre: 'Meta',
    codigoDANE: '50',
    capital: 'Villavicencio',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'Villavicencio', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Acacías', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Granada', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Puerto López', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Cumaral', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' }
    ]
  },
  {
    nombre: 'Boyacá',
    codigoDANE: '15',
    capital: 'Tunja',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'Tunja', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Duitama', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Sogamoso', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Chiquinquirá', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Paipa', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Villa de Leyva', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Nobsa', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Moniquirá', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' }
    ]
  },
  {
    nombre: 'Norte de Santander',
    codigoDANE: '54',
    capital: 'Cúcuta',
    hubPrincipal: 'Sede Oriente Chimitá',
    municipios: [
      { nombre: 'Cúcuta', tipo: 'principal', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Los Patios', tipo: 'principal', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Villa del Rosario', tipo: 'principal', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Ocaña', tipo: 'secundario', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Pamplona', tipo: 'secundario', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Tibú', tipo: 'secundario', hubCercano: 'Sede Oriente Chimitá' }
    ]
  },
  {
    nombre: 'Cesar',
    codigoDANE: '20',
    capital: 'Valledupar',
    hubPrincipal: 'CEDI Vía 40 Costa Caribe',
    municipios: [
      { nombre: 'Valledupar', tipo: 'principal', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Aguachica', tipo: 'secundario', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Agustín Codazzi', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Bosconia', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'La Jagua de Ibirico', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' }
    ]
  },
  {
    nombre: 'Córdoba',
    codigoDANE: '23',
    capital: 'Montería',
    hubPrincipal: 'CEDI Guayabal & Ventas Mayoristas',
    municipios: [
      { nombre: 'Montería', tipo: 'principal', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Cereté', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Lorica', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Sahagún', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Montelíbano', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Planeta Rica', tipo: 'secundario', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' }
    ]
  },
  {
    nombre: 'Magdalena',
    codigoDANE: '47',
    capital: 'Santa Marta',
    hubPrincipal: 'CEDI Vía 40 Costa Caribe',
    municipios: [
      { nombre: 'Santa Marta', tipo: 'principal', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Ciénaga', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Fundación', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Plato', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'El Banco', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' }
    ]
  },
  {
    nombre: 'Nariño',
    codigoDANE: '52',
    capital: 'Pasto',
    hubPrincipal: 'Hub Regional Yumbo - Valle del Cauca',
    municipios: [
      { nombre: 'Pasto', tipo: 'principal', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Ipiales', tipo: 'secundario', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Tumaco', tipo: 'secundario', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Túquerres', tipo: 'secundario', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' }
    ]
  },
  {
    nombre: 'Cauca',
    codigoDANE: '19',
    capital: 'Popayán',
    hubPrincipal: 'Hub Regional Yumbo - Valle del Cauca',
    municipios: [
      { nombre: 'Popayán', tipo: 'principal', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Santander de Quilichao', tipo: 'secundario', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Puerto Tejada', tipo: 'secundario', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Patía (El Bordo)', tipo: 'secundario', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' }
    ]
  },
  {
    nombre: 'Sucre',
    codigoDANE: '70',
    capital: 'Sincelejo',
    hubPrincipal: 'Centro Logístico Mamonal',
    municipios: [
      { nombre: 'Sincelejo', tipo: 'principal', hubCercano: 'Centro Logístico Mamonal' },
      { nombre: 'Corozal', tipo: 'secundario', hubCercano: 'Centro Logístico Mamonal' },
      { nombre: 'San Marcos', tipo: 'secundario', hubCercano: 'Centro Logístico Mamonal' },
      { nombre: 'Tolú', tipo: 'secundario', hubCercano: 'Centro Logístico Mamonal' },
      { nombre: 'Coveñas', tipo: 'secundario', hubCercano: 'Centro Logístico Mamonal' }
    ]
  },
  {
    nombre: 'La Guajira',
    codigoDANE: '44',
    capital: 'Riohacha',
    hubPrincipal: 'CEDI Vía 40 Costa Caribe',
    municipios: [
      { nombre: 'Riohacha', tipo: 'principal', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Maicao', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Uribia', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Fonseca', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'San Juan del Cesar', tipo: 'secundario', hubCercano: 'CEDI Vía 40 Costa Caribe' }
    ]
  },
  {
    nombre: 'Casanare',
    codigoDANE: '85',
    capital: 'Yopal',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'Yopal', tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Aguazul', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Villanueva', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Tauramena', tipo: 'secundario', hubCercano: 'CEDI Central Fontibón - Pintuco' }
    ]
  },
  {
    nombre: 'Chocó',
    codigoDANE: '27',
    capital: 'Quibdó',
    hubPrincipal: 'CEDI Guayabal & Ventas Mayoristas',
    municipios: [
      { nombre: 'Quibdó', tipo: 'especial', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Istmina', tipo: 'especial', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Condoto', tipo: 'especial', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' },
      { nombre: 'Bahía Solano', tipo: 'especial', hubCercano: 'CEDI Guayabal & Ventas Mayoristas' }
    ]
  },
  {
    nombre: 'Caquetá',
    codigoDANE: '18',
    capital: 'Florencia',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'Florencia', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'San Vicente del Caguán', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Curillo', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' }
    ]
  },
  {
    nombre: 'Putumayo',
    codigoDANE: '86',
    capital: 'Mocoa',
    hubPrincipal: 'Hub Regional Yumbo - Valle del Cauca',
    municipios: [
      { nombre: 'Mocoa', tipo: 'especial', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Puerto Asís', tipo: 'especial', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' },
      { nombre: 'Orito', tipo: 'especial', hubCercano: 'Hub Regional Yumbo - Valle del Cauca' }
    ]
  },
  {
    nombre: 'Arauca',
    codigoDANE: '81',
    capital: 'Arauca',
    hubPrincipal: 'Sede Oriente Chimitá',
    municipios: [
      { nombre: 'Arauca', tipo: 'especial', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Tame', tipo: 'especial', hubCercano: 'Sede Oriente Chimitá' },
      { nombre: 'Saravena', tipo: 'especial', hubCercano: 'Sede Oriente Chimitá' }
    ]
  },
  {
    nombre: 'Amazonas',
    codigoDANE: '91',
    capital: 'Leticia',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'Leticia', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Puerto Nariño', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' }
    ]
  },
  {
    nombre: 'San Andrés y Providencia',
    codigoDANE: '88',
    capital: 'San Andrés',
    hubPrincipal: 'CEDI Vía 40 Costa Caribe',
    municipios: [
      { nombre: 'San Andrés', tipo: 'especial', hubCercano: 'CEDI Vía 40 Costa Caribe' },
      { nombre: 'Providencia', tipo: 'especial', hubCercano: 'CEDI Vía 40 Costa Caribe' }
    ]
  },
  {
    nombre: 'Guaviare',
    codigoDANE: '95',
    capital: 'San José del Guaviare',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'San José del Guaviare', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'El Retorno', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' }
    ]
  },
  {
    nombre: 'Guainía',
    codigoDANE: '94',
    capital: 'Inírida',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'Inírida', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Barranco Minas', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' }
    ]
  },
  {
    nombre: 'Vaupés',
    codigoDANE: '97',
    capital: 'Mitú',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'Mitú', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'Carurú', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' }
    ]
  },
  {
    nombre: 'Vichada',
    codigoDANE: '99',
    capital: 'Puerto Carreño',
    hubPrincipal: 'CEDI Central Fontibón - Pintuco',
    municipios: [
      { nombre: 'Puerto Carreño', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' },
      { nombre: 'La Primavera', tipo: 'especial', hubCercano: 'CEDI Central Fontibón - Pintuco' }
    ]
  }
];

// Función para encontrar el tipo de municipio y hub de despacho
export function getMunicipioLogistics(deptoNombre: string, muniNombre: string): {
  tipo: 'principal' | 'secundario' | 'especial';
  hubCercano: string;
} {
  const depto = DEPARTAMENTOS_COLOMBIA.find(
    (d) => d.nombre.toLowerCase() === deptoNombre.toLowerCase()
  );
  if (!depto) {
    return { tipo: 'principal', hubCercano: 'CEDI Central Fontibón - Pintuco' };
  }

  const muni = depto.municipios.find(
    (m) => m.nombre.toLowerCase() === muniNombre.toLowerCase()
  );
  if (!muni) {
    return { tipo: 'secundario', hubCercano: depto.hubPrincipal };
  }

  return {
    tipo: muni.tipo,
    hubCercano: muni.hubCercano || depto.hubPrincipal
  };
}

// Cálculo Dinámico de Costo y Tiempo de Flete Nacional
export interface ShippingCalculation {
  costoFlete: number;
  costoFleteOriginal: number;
  esFleteGratis: boolean;
  tiempoEstimado: string;
  diasHabilesMin: number;
  diasHabilesMax: number;
  tipoZona: 'Troncal Principal' | 'Intermunicipal' | 'Trayecto Especial / Reexpedición';
  hubDespacho: string;
  mensajeLogistica: string;
}

export function calculateShipping(
  departamento: string,
  municipio: string,
  totalGalones: number,
  modalidad: 'domicilio' | 'retiro_tienda' = 'domicilio',
  subtotalEstimado: number = 0
): ShippingCalculation {
  const logistics = getMunicipioLogistics(departamento, municipio);

  // Retiro en Tienda / Sede Pintuco: Costo 0, tiempo 2-4 horas
  if (modalidad === 'retiro_tienda') {
    return {
      costoFlete: 0,
      costoFleteOriginal: 0,
      esFleteGratis: true,
      tiempoEstimado: 'Listo en 2 a 4 horas hábiles (Mismo día)',
      diasHabilesMin: 0,
      diasHabilesMax: 1,
      tipoZona: 'Troncal Principal',
      hubDespacho: logistics.hubCercano,
      mensajeLogistica: `Retiro sin costo en ${logistics.hubCercano}. Acreditación de compra requerida.`
    };
  }

  // Envío Directo a Obra / Domicilio
  const cuñetesEquivalentes = Math.ceil(totalGalones / 5);
  let baseTarifa = 35000;
  let tarifaPorGalon = 1600;
  let tiempo = '24 a 48 horas hábiles';
  let minDias = 1;
  let maxDias = 2;
  let zona: 'Troncal Principal' | 'Intermunicipal' | 'Trayecto Especial / Reexpedición' = 'Troncal Principal';

  if (logistics.tipo === 'principal') {
    baseTarifa = 32000;
    tarifaPorGalon = 1400;
    tiempo = '24 a 48 horas hábiles (Despacho Express)';
    minDias = 1;
    maxDias = 2;
    zona = 'Troncal Principal';
  } else if (logistics.tipo === 'secundario') {
    baseTarifa = 52000;
    tarifaPorGalon = 2200;
    tiempo = '48 a 72 horas hábiles (Ruta Intermunicipal)';
    minDias = 2;
    maxDias = 3;
    zona = 'Intermunicipal';
  } else {
    // Especial (Amazonas, San Andrés, Chocó, etc.)
    baseTarifa = 98000;
    tarifaPorGalon = 3800;
    tiempo = '3 a 5 días hábiles (Flete Aéreo / Fluvial Especializado)';
    minDias = 3;
    maxDias = 5;
    zona = 'Trayecto Especial / Reexpedición';
  }

  const costoCalculado = Math.round(baseTarifa + (totalGalones * tarifaPorGalon));

  // Umbrales de Flete Bonificado B2B:
  // Si la compra supera $1,200,000 COP o más de 8 cuñetes en Troncal Principal -> Flete 100% GRATIS
  const esFleteGratis = (subtotalEstimado >= 1200000 || totalGalones >= 40) && logistics.tipo === 'principal';

  return {
    costoFlete: esFleteGratis ? 0 : costoCalculado,
    costoFleteOriginal: costoCalculado,
    esFleteGratis,
    tiempoEstimado: tiempo,
    diasHabilesMin: minDias,
    diasHabilesMax: maxDias,
    tipoZona: zona,
    hubDespacho: logistics.hubCercano,
    mensajeLogistica: esFleteGratis 
      ? '¡Flete Bonificado 100% por volumen de obra institucional B2B!' 
      : `Despacho cubierto por flota certificada Pintuco desde ${logistics.hubCercano}`
  };
}
