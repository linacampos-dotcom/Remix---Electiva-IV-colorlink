/**
 * Estilos y Paleta Tecnológica de la Red Nacional de Cobertura Pintuco
 * Silueta unificada digital en azul navy / azul profundo / cyan
 * con límites departamentales sutiles y casi imperceptibles.
 */

// Paleta unificada digital de alta tecnología (sin colores políticos/arcoíris)
export const DIGITAL_COLOMBIA_PALETTE = {
  base: '#0c2340',        // Azul navy profundo base
  subtle1: '#0e2b4e',     // Variación suave de profundidad
  subtle2: '#10325b',     // Variación luminosa tecnológica
  border: 'rgba(0, 229, 255, 0.18)', // Frontera sutil cyan tenue
  borderHover: 'rgba(0, 229, 255, 0.45)',
};

export const DEPARTMENT_COLORS: Record<string, string> = {
  // Todos los departamentos comparten una tonalidad armónica de azul navy tecnológico
  'ANTIOQUIA': '#10325b',
  'ATLANTICO': '#0e2b4e',
  'SANTAFE DE BOGOTA D.C': '#123764',
  'BOLIVAR': '#0c2543',
  'BOYACA': '#0f2f54',
  'CALDAS': '#113560',
  'CAQUETA': '#0a1f38',
  'CAUCA': '#0d2847',
  'CESAR': '#0e2b4e',
  'CORDOBA': '#0c2543',
  'CUNDINAMARCA': '#113560',
  'CHOCO': '#091c33',
  'HUILA': '#0d2847',
  'LA GUAJIRA': '#10325b',
  'MAGDALENA': '#0c2543',
  'META': '#0b213b',
  'NARIÑO': '#0a1f38',
  'NORTE DE SANTANDER': '#0e2b4e',
  'QUINDIO': '#113560',
  'RISARALDA': '#10325b',
  'SANTANDER': '#10325b',
  'SUCRE': '#0c2543',
  'TOLIMA': '#0e2b4e',
  'VALLE DEL CAUCA': '#113560',
  'ARAUCA': '#0b213b',
  'CASANARE': '#0c2543',
  'PUTUMAYO': '#091c33',
  'AMAZONAS': '#08182c',
  'GUAINIA': '#08182c',
  'GUAVIARE': '#0a1f38',
  'VAUPES': '#08182c',
  'VICHADA': '#0a1f38',
  'ARCHIPIELAGO DE SAN ANDRES PROVIDENCIA Y SANTA CATALINA': '#10325b',
};

const UNIFIED_TECH_PALETTE = [
  '#0c2340',
  '#0e2b4e',
  '#10325b',
  '#0d2847',
  '#0f2f54',
  '#0b213b',
];

export function getDepartmentFillColor(geo: any, index: number): string {
  const rawName = (geo.properties?.name || geo.properties?.NOMBRE_DPT || '').toUpperCase().trim();
  if (DEPARTMENT_COLORS[rawName]) {
    return DEPARTMENT_COLORS[rawName];
  }
  return UNIFIED_TECH_PALETTE[index % UNIFIED_TECH_PALETTE.length];
}

