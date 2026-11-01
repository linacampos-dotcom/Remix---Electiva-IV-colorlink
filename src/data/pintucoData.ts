import { CatalogProduct, FMVFormData, InventoryItem, ProductVariant } from '../types';
import { PRODUCTS_CATALOG_DATA, CATALOG_CATEGORIES } from './productsData';

export { CATALOG_CATEGORIES };

export const CITIES_COLOMBIA = [
  'Medellín',
  'Bogotá D.C.',
  'Cali',
  'Barranquilla',
  'Bucaramanga',
  'Cartagena',
  'Pereira',
  'Manizales',
  'Cúcuta',
  'Santa Marta',
  'Ibagué',
  'Villavicencio',
  'Pasto',
  'Armenia',
  'Montería',
  'Neiva',
  'Valledupar',
  'Popayán',
  'Sincelejo',
  'Tunja',
  'Rionegro / Oriente Antioqueño',
];

export interface ColorPaletteItem {
  name: string;
  code: string;
  shortName: string;
  hex: string;
  category: 'Clásicos' | 'Modernos' | 'Tierras' | 'Acentos' | 'Naturales' | 'Vibrantes' | 'Contemporáneos';
  acabado: 'Mate' | 'Satinado' | 'Brillante' | 'Semibrillante';
  lrv: number; // Light Reflectance Value (%)
  description: string;
}

export const COLOR_PALETTE: ColorPaletteItem[] = [
  { 
    name: 'Blanco Puro Mate 1001', 
    code: '1001', 
    shortName: 'Blanco Puro', 
    hex: '#F9FAFB', 
    category: 'Clásicos', 
    acabado: 'Mate',
    lrv: 88,
    description: 'Máxima luminosidad y amplitud espacial. Tono neutro puro ideal para cielorrasos e interiores modernos.'
  },
  { 
    name: 'Blanco Almendra Satinado 1020', 
    code: '1020', 
    shortName: 'Blanco Almendra', 
    hex: '#F4EFEA', 
    category: 'Clásicos', 
    acabado: 'Satinado',
    lrv: 82,
    description: 'Calidez sutil con destellos marfil. Brinda confort visual y refleja una luz suave acogedora.'
  },
  { 
    name: 'Gris Basalto Satinado 7012', 
    code: '7012', 
    shortName: 'Gris Basalto', 
    hex: '#4A5568', 
    category: 'Modernos', 
    acabado: 'Satinado',
    lrv: 26,
    description: 'Gris arquitectónico de alta presencia. Óptimo para muros de acento, salas ejecutivas y diseño industrial.'
  },
  { 
    name: 'Gris Niebla Mate 7035', 
    code: '7035', 
    shortName: 'Gris Niebla', 
    hex: '#CBD5E1', 
    category: 'Modernos', 
    acabado: 'Mate',
    lrv: 62,
    description: 'Tono intermedio balanceado. Neutraliza contrastes fuertes y armoniza con maderas claras y concreto visto.'
  },
  { 
    name: 'Arena Cálida 1023', 
    code: '1023', 
    shortName: 'Arena Cálida', 
    hex: '#E2D9C8', 
    category: 'Tierras', 
    acabado: 'Mate',
    lrv: 67,
    description: 'Inspirado en sedimentos naturales. Aporta calma orgánica, perfecto para dormitorios y estancias familiares.'
  },
  { 
    name: 'Terracota Colonial 3016', 
    code: '3016', 
    shortName: 'Terracota Colonial', 
    hex: '#C05621', 
    category: 'Tierras', 
    acabado: 'Satinado',
    lrv: 24,
    description: 'Carácter tradicional y vibrante de arcilla horneada. Ideal para fachadas coloniales, terrazas y restaurantes.'
  },
  { 
    name: 'Azul Océano Profundo 5003', 
    code: '5003', 
    shortName: 'Azul Océano', 
    hex: '#1E3A8A', 
    category: 'Acentos', 
    acabado: 'Semibrillante',
    lrv: 14,
    description: 'Elegancia sobria de gran profundidad marina. Estimula la concentración en estudios, bibliotecas y recepciones.'
  },
  { 
    name: 'Azul Celeste Fresco 5012', 
    code: '5012', 
    shortName: 'Azul Celeste', 
    hex: '#93C5FD', 
    category: 'Acentos', 
    acabado: 'Mate',
    lrv: 60,
    description: 'Sensación de cielo despejado y ligereza. Recomendado para habitaciones juveniles, áreas infantiles y consultorios.'
  },
  { 
    name: 'Verde Bosque Andino 6005', 
    code: '6005', 
    shortName: 'Verde Bosque', 
    hex: '#14532D', 
    category: 'Naturales', 
    acabado: 'Satinado',
    lrv: 12,
    description: 'Riqueza vegetal andina. Crea atmósferas biofílicas sofisticadas en combinación con iluminación cálida indirecta.'
  },
  { 
    name: 'Verde Salvia Calm 6021', 
    code: '6021', 
    shortName: 'Verde Salvia Calm', 
    hex: '#A3B18A', 
    category: 'Naturales', 
    acabado: 'Mate',
    lrv: 48,
    description: 'Tono botánico atenuado con matiz grisáceo. Tendencia en diseño de interiores nórdico y bienestar.'
  },
  { 
    name: 'Amarillo Canario 1018', 
    code: '1018', 
    shortName: 'Amarillo Canario', 
    hex: '#FBBF24', 
    category: 'Vibrantes', 
    acabado: 'Semibrillante',
    lrv: 55,
    description: 'Energía solar y vitalidad. Ideal para señalización arquitectónica, cocinas dinámicas o detalles de impacto.'
  },
  { 
    name: 'Negro Ébano Mate 9005', 
    code: '9005', 
    shortName: 'Negro Ébano', 
    hex: '#1E293B', 
    category: 'Contemporáneos', 
    acabado: 'Mate',
    lrv: 6,
    description: 'El dramatismo del negro puro con bajo brillo. Excelente para perfilar carpintería metálica o muros escenográficos.'
  },
];

export function normalizeCatalogProduct(p: any): CatalogProduct {
  if (!p) return {} as CatalogProduct;
  return {
    ...p,
    coloresCertificados: Array.isArray(p.coloresCertificados) ? [...p.coloresCertificados] : [],
    presentacionesDisponibles: Array.isArray(p.presentacionesDisponibles) ? [...p.presentacionesDisponibles] : [],
    variantes: Array.isArray(p.variantes) ? p.variantes.map((v: any) => ({ ...v })) : [],
    ambienteIdeal: Array.isArray(p.ambienteIdeal) ? [...p.ambienteIdeal] : ['Interior'],
    tipoUso: Array.isArray(p.tipoUso) ? [...p.tipoUso] : [],
    imagenVariantes: p.imagenVariantes || {},
  };
}

export const PINTUCO_CATALOG: CatalogProduct[] = PRODUCTS_CATALOG_DATA.map(normalizeCatalogProduct);

/**
 * Obtiene el catálogo sincronizado en tiempo real con el inventario de la Intranet.
 * Refleja modificaciones de precios, existencias y variantes creadas en bodega.
 */
export function getLiveCatalog(): CatalogProduct[] {
  if (typeof window === 'undefined') return PRODUCTS_CATALOG_DATA.map(normalizeCatalogProduct);
  try {
    const rawInv = localStorage.getItem('colorlink_inventario_corp');
    if (!rawInv) return PRODUCTS_CATALOG_DATA.map(normalizeCatalogProduct);
    const invItems: any[] = JSON.parse(rawInv);
    if (!Array.isArray(invItems) || invItems.length === 0) return PRODUCTS_CATALOG_DATA.map(normalizeCatalogProduct);

    // Crear mapa de productos base clonados
    const baseProdsMap = new Map<string, CatalogProduct>();
    PRODUCTS_CATALOG_DATA.forEach((p) => {
      baseProdsMap.set(p.id, normalizeCatalogProduct(p));
    });

    // Enriquecer productos base con el stock real y variantes de la matriz
    invItems.forEach((item) => {
      if (!item || !item.sku) return;
      const baseId = item.productoBaseId || item.id;
      
      let prod = baseProdsMap.get(baseId);
      // Si es un producto nuevo creado desde la Intranet
      if (!prod) {
        const catKey = (item.categoria || '').toLowerCase().includes('exterior') || (item.categoria || '').toLowerCase().includes('fachada') ? 'exteriores'
          : (item.categoria || '').toLowerCase().includes('esmalte') || (item.categoria || '').toLowerCase().includes('madera') ? 'metales_madera'
          : (item.categoria || '').toLowerCase().includes('herramienta') ? 'herramientas'
          : (item.categoria || '').toLowerCase().includes('impermeab') || (item.categoria || '').toLowerCase().includes('epox') ? 'especiales'
          : 'interiores';

        prod = normalizeCatalogProduct({
          id: baseId,
          nombre: item.productoBaseNombre || (item.nombre ? item.nombre.split(' - ')[0] : '') || item.nombre,
          marca: item.marca || 'Pintuco',
          linea: item.categoria || 'Línea Bodega CEDI',
          tipoPintura: item.categoria || 'Recubrimiento Especial',
          ambienteIdeal: ['Interior', 'Exterior'],
          acabado: 'Mate / Satinado',
          garantia: '5 Años Certificados',
          garantiaAnos: 5,
          lavabilidad: '+20,000 ciclos NTC 1335',
          voc: 'Bajo Olor y Cero VOC',
          rendimientoEstimado: '30-32 m²/gal a 2 manos',
          rendimientoBaseM2: 30,
          precioGalon: item.precioVentaGL || 84900,
          precioCunete: Math.round((item.precioVentaGL || 84900) * 4.4),
          precioCuarto: Math.round((item.precioVentaGL || 84900) * 0.32),
          descripcion: `Línea oficial de alto desempeño suministrada por ${item.marca || 'Pintuco'} CEDI Rionegro.`,
          skuBase: item.sku ? item.sku.split('-').slice(0, 3).join('-') : 'PIN-NEW',
          imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
          imagenCuneteUrl: '/src/assets/images/koraza_bucket_studio_1790894419359.jpg',
          coloresCertificados: item.color ? [item.color] : ['Blanco Puro Mate 1001'],
          presentacionesDisponibles: ['Cuñete (5 Gal)', 'Galón', 'Cuarto (1/4 Gal)'],
          categoriaCatalogo: catKey,
          variantes: [],
        });
        baseProdsMap.set(baseId, prod);
      }

      if (!prod.coloresCertificados) prod.coloresCertificados = [];
      if (!prod.presentacionesDisponibles) prod.presentacionesDisponibles = [];
      if (!prod.variantes) prod.variantes = [];

      const varIndex = prod.variantes.findIndex((v) => v.sku === item.sku || v.id === item.id);
      const varItem: ProductVariant = {
        id: item.id,
        nombre: item.nombre,
        medida: item.medida || item.presentacion || 'Unidad',
        precio: item.precioVentaGL || prod.precioGalon || 79900,
        sku: item.sku,
        color: item.color,
        presentacion: item.presentacion,
        stock: item.stockGalones || 0,
        stockMinimo: item.stockMinimoGalones || 0,
        disponible: item.activo && ((item.stockGalones || 0) > 0 || (item.stockUnidades !== undefined && item.stockUnidades > 0)),
      };

      if (varIndex >= 0) {
        prod.variantes[varIndex] = varItem;
      } else {
        prod.variantes.push(varItem);
      }

      // Actualizar precios de referencia del producto base
      const presNorm = (item.presentacion || item.medida || '').toLowerCase();
      if (presNorm.includes('galón') || presNorm === '1gl') {
        prod.precioGalon = item.precioVentaGL;
      } else if (presNorm.includes('cuñete') || presNorm.includes('5 gal')) {
        prod.precioCunete = item.precioVentaGL;
      } else if (presNorm.includes('cuarto') || presNorm.includes('1/4')) {
        prod.precioCuarto = item.precioVentaGL;
      }

      // Agregar color a coloresCertificados si no existe
      if (item.color && !prod.coloresCertificados.includes(item.color)) {
        prod.coloresCertificados.push(item.color);
      }
    });

    return Array.from(baseProdsMap.values()).map(normalizeCatalogProduct);
  } catch (e) {
    return PRODUCTS_CATALOG_DATA.map(normalizeCatalogProduct);
  }
}

export const PRESET_PROJECTS: Array<{ label: string; description: string; data: FMVFormData }> = [
  {
    label: '🏢 Fachada Edificio Los Rosales (850 m²)',
    description: 'Mampostería a la vista en Bogotá, requiere Koraza exterior con factor 1.15 y sellador por obra nueva.',
    data: {
      tipo_documento: 'NIT',
      documento: '900.845.120-4',
      nombre_razon_social: 'Constructora Bolívar S.A.',
      responsable_contacto: 'Ing. Carlos Mendoza',
      canal_entrada: 'Asesor Comercial',
      ciudad: 'Bogotá D.C.',
      tipo_obra: 'Mantenimiento Fachada',
      area_m2: 850,
      fecha_requerida: getFutureDateString(2), // Urgente (<3 días)
      producto_deseado: 'Koraza Doble Vida Protección Clima Extremo',
      superficie: 'Mampostería',
      ambiente: 'Exterior Fachada',
      condicion: 'Nueva',
      color_acabado: 'Gris Basalto Satinado 7012',
    }
  },
  {
    label: '🏠 Remodelación Apto 402 Envigado (180 m²)',
    description: 'Interior drywall en buen estado, repinte con Viniltex Avanzado en Medellín.',
    data: {
      tipo_documento: 'CC',
      documento: '1.020.485.912',
      nombre_razon_social: 'Constructora & Diseños Habitat SAS',
      responsable_contacto: 'Departamento de Compras',
      canal_entrada: 'Línea WhatsApp',
      ciudad: 'Medellín',
      tipo_obra: 'Remodelación Interior',
      area_m2: 180,
      fecha_requerida: getFutureDateString(6), // Normal
      producto_deseado: 'Viniltex Avanzado Máxima Lavabilidad',
      superficie: 'Drywall / Yeso',
      ambiente: 'Interior',
      condicion: 'Buen Estado / Repinte',
      color_acabado: 'Blanco Puro Mate 1001',
    }
  },
  {
    label: '💧 Restauración Hotel Caribe con Humedad (320 m²)',
    description: 'Superficie con humedad y rugosa en Cartagena, cálculo con factor 1.15 y tratamiento Aquablock.',
    data: {
      tipo_documento: 'NIT',
      documento: '890.312.445-1',
      nombre_razon_social: 'Hoteles del Caribe & Cía',
      responsable_contacto: 'Jefe Mantenimiento Roberto Díaz',
      canal_entrada: 'Portal Web B2B',
      ciudad: 'Cartagena',
      tipo_obra: 'Hospitalario / Salud',
      area_m2: 320,
      fecha_requerida: getFutureDateString(1), // Urgente
      producto_deseado: 'Sellador Antihumedad Aquablock / Silicona Hidrófuga',
      superficie: 'Rugosa',
      ambiente: 'Marítimo / Costero',
      condicion: 'Con Humedad',
      color_acabado: 'Arena Cálida 1023',
    }
  },
  {
    label: '🏫 Colegio San Ignacio de Loyola (550 m²)',
    description: 'Aulas y pasillos de alto tráfico, revoque liso, entrega programada en Cali.',
    data: {
      tipo_documento: 'NIT',
      documento: '860.002.314-8',
      nombre_razon_social: 'Colegio San Ignacio de Loyola',
      responsable_contacto: 'Coordinación de Mantenimiento Institucional',
      canal_entrada: 'Tienda Pintumarket',
      ciudad: 'Cali',
      tipo_obra: 'Educativo',
      area_m2: 550,
      fecha_requerida: getFutureDateString(8), // Normal
      producto_deseado: 'Viniltex Avanzado Máxima Lavabilidad',
      superficie: 'Pañete / Revoque Liso',
      ambiente: 'Alto Tráfico / Institucional',
      condicion: 'Regular / Descascarada',
      color_acabado: 'Verde Salvia Calm 6021',
    }
  }
];

export function getFutureDateString(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    sku: 'PIN-KRZ-DV-01',
    nombre: 'Koraza Doble Vida Protección Clima Extremo (Blanco / Bases)',
    marca: 'Pintuco',
    categoria: 'Pintura Fachada',
    stockGalones: 120,
    stockCuñetes: 24, // 120 / 5
    stockMinimoGalones: 40,
    ubicacionBodega: 'Bodega Central - Pasillo A-02 (Medellín)',
    costoUnitarioGL: 68500,
    precioVentaGL: 98900,
    ultimoLote: 'LOT-2026-KRZ-04',
  },
  {
    id: 'inv-2',
    sku: 'PIN-VTX-01',
    nombre: 'Viniltex Avanzado Máxima Lavabilidad Tipo 1',
    marca: 'Pintuco',
    categoria: 'Pintura Interior',
    stockGalones: 215,
    stockCuñetes: 43,
    stockMinimoGalones: 50,
    ubicacionBodega: 'Bodega Central - Pasillo B-01 (Bogotá)',
    costoUnitarioGL: 54000,
    precioVentaGL: 79900,
    ultimoLote: 'LOT-2026-VTX-09',
  },
  {
    id: 'inv-3',
    sku: 'PIN-VTX-BC',
    nombre: 'Viniltex Baños y Cocinas Antibacterial / Antihongos',
    marca: 'Pintuco',
    categoria: 'Zonas Húmedas',
    stockGalones: 45,
    stockCuñetes: 9,
    stockMinimoGalones: 20,
    ubicacionBodega: 'Bodega Central - Pasillo B-04',
    costoUnitarioGL: 62000,
    precioVentaGL: 89500,
    ultimoLote: 'LOT-2026-VBC-02',
  },
  {
    id: 'inv-4',
    sku: 'PIN-AQB-SEL',
    nombre: 'Sellador Antihumedad Aquablock / Silicona Hidrófuga',
    marca: 'Pintuco',
    categoria: 'Selladores',
    stockGalones: 30,
    stockCuñetes: 6,
    stockMinimoGalones: 25,
    ubicacionBodega: 'Bodega Central - Pasillo C-01',
    costoUnitarioGL: 72000,
    precioVentaGL: 104900,
    ultimoLote: 'LOT-2026-AQB-01',
  },
  {
    id: 'inv-5',
    sku: 'PIN-IMP-ACR',
    nombre: 'Imprimante Acrílico Sellador 50/50 Fijador de Cal',
    marca: 'Pintuco',
    categoria: 'Selladores',
    stockGalones: 85,
    stockCuñetes: 17,
    stockMinimoGalones: 30,
    ubicacionBodega: 'Bodega Central - Pasillo C-03',
    costoUnitarioGL: 41000,
    precioVentaGL: 59900,
    ultimoLote: 'LOT-2026-IMP-07',
  },
  {
    id: 'inv-6',
    sku: 'CIN-INT-CL',
    nombre: 'Intervinil Cielos Mate Ultra Antirreflejo Tipo 2',
    marca: 'Color In',
    categoria: 'Pintura Interior',
    stockGalones: 90,
    stockCuñetes: 18,
    stockMinimoGalones: 30,
    ubicacionBodega: 'Bodega Color In - Estante D-02 (Cali)',
    costoUnitarioGL: 38000,
    precioVentaGL: 52900,
    ultimoLote: 'LOT-2026-CIN-03',
  },
  {
    id: 'inv-7',
    sku: 'PIN-PLX-MAX',
    nombre: 'Pintulux Esmalte Sintético Anticorrosivo Alto Brillo',
    marca: 'Pintuco',
    categoria: 'Esmaltes',
    stockGalones: 60,
    stockCuñetes: 12,
    stockMinimoGalones: 25,
    ubicacionBodega: 'Bodega Químicos - Pasillo E-01',
    costoUnitarioGL: 58000,
    precioVentaGL: 84900,
    ultimoLote: 'LOT-2026-PLX-05',
  },
];
