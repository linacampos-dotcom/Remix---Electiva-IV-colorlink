import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Boxes, 
  DollarSign, 
  BarChart3, 
  LineChart as LineChartIcon,
  Filter, 
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  MapPin
} from 'lucide-react';
import { COLORLINKOrder } from '../types';

interface GerenciaAnalyticsChartsProps {
  orders?: COLORLINKOrder[];
}

// ============================================================================
// 1. DATOS DE CATEGORÍAS PARA LA GRÁFICA DE BARRAS APILADAS
// Proyectado vs. Real segmentado por Canal (Constructoras B2B vs Retail) y Presentación
// ============================================================================
interface CategoryAnalyticsItem {
  categoria: string;
  categoriaCorta: string;
  lineaPrincipal: string;
  color: string;
  // Valores en Millones COP
  proyB2B_COP: number;
  proyRetail_COP: number;
  realB2B_COP: number;
  realRetail_COP: number;
  // Valores en Galones
  proyB2B_Gal: number;
  proyRetail_Gal: number;
  realB2B_Gal: number;
  realRetail_Gal: number;
  // Presentación en Galones (Cuñetes 5GL vs Galones 1GL)
  proyCunetes_Gal: number;
  proyGalon_Gal: number;
  realCunetes_Gal: number;
  realGalon_Gal: number;
}

const BASE_CATEGORY_STACKED: CategoryAnalyticsItem[] = [
  {
    categoria: 'Fachadas e Intemperie',
    categoriaCorta: 'Fachadas (Koraza)',
    lineaPrincipal: 'Koraza Doble Vida, Koraza 5, Acrilcoat',
    color: '#E31C23', // Rojo Pintuco
    proyB2B_COP: 820,
    proyRetail_COP: 430,
    realB2B_COP: 940,
    realRetail_COP: 450,
    proyB2B_Gal: 39000,
    proyRetail_Gal: 20000,
    realB2B_Gal: 45500,
    realRetail_Gal: 20700,
    proyCunetes_Gal: 46000,
    proyGalon_Gal: 13000,
    realCunetes_Gal: 52000,
    realGalon_Gal: 14200,
  },
  {
    categoria: 'Vinilos Arquitectónicos',
    categoriaCorta: 'Vinilos (Viniltex)',
    lineaPrincipal: 'Viniltex Avanzado, Baños & Cocinas, Pro 1000',
    color: '#0033A0', // Azul Pintuco
    proyB2B_COP: 660,
    proyRetail_COP: 440,
    realB2B_COP: 720,
    realRetail_COP: 460,
    proyB2B_Gal: 34000,
    proyRetail_Gal: 22000,
    realB2B_Gal: 37500,
    realRetail_Gal: 23000,
    proyCunetes_Gal: 41000,
    proyGalon_Gal: 15000,
    realCunetes_Gal: 45000,
    realGalon_Gal: 15500,
  },
  {
    categoria: 'Impermeabilizantes',
    categoriaCorta: 'Impermeab. (Aquablock)',
    lineaPrincipal: 'Aquablock Ultra 1000, Techos & Terrazas, Siliconas',
    color: '#0284C7', // Azul Técnico
    proyB2B_COP: 380,
    proyRetail_COP: 240,
    realB2B_COP: 420,
    realRetail_COP: 255,
    proyB2B_Gal: 17500,
    proyRetail_Gal: 10500,
    realB2B_Gal: 19500,
    realRetail_Gal: 11300,
    proyCunetes_Gal: 21500,
    proyGalon_Gal: 6500,
    realCunetes_Gal: 24000,
    realGalon_Gal: 6800,
  },
  {
    categoria: 'Esmaltes & Anticorrosivos',
    categoriaCorta: 'Esmaltes (Pintulux)',
    lineaPrincipal: 'Pintulux Máxima Protección, Pintóxido, Anticorrosivo',
    color: '#F59E0B', // Ámbar Alerta
    proyB2B_COP: 290,
    proyRetail_COP: 190,
    realB2B_COP: 275,
    realRetail_COP: 175,
    proyB2B_Gal: 13500,
    proyRetail_Gal: 8500,
    realB2B_Gal: 12800,
    realRetail_Gal: 7800,
    proyCunetes_Gal: 14000,
    proyGalon_Gal: 8000,
    realCunetes_Gal: 13200,
    realGalon_Gal: 7400,
  },
  {
    categoria: 'Epóxicas & Tráfico Pesado',
    categoriaCorta: 'Epóxicas (Pintucoat)',
    lineaPrincipal: 'Pintucoat Epóxico, Pintutráfico Acrílico, Alto Tráfico',
    color: '#10B981', // Esmeralda Industrial
    proyB2B_COP: 310,
    proyRetail_COP: 140,
    realB2B_COP: 345,
    realRetail_COP: 150,
    proyB2B_Gal: 14500,
    proyRetail_Gal: 6500,
    realB2B_Gal: 16200,
    realRetail_Gal: 6900,
    proyCunetes_Gal: 16000,
    proyGalon_Gal: 5000,
    realCunetes_Gal: 18000,
    realGalon_Gal: 5100,
  },
  {
    categoria: 'Maderas y Especialidades',
    categoriaCorta: 'Maderas (Madetec)',
    lineaPrincipal: 'Madetec Barniz Poliuretano, Selladores y Tintes',
    color: '#8B5CF6', // Púrpura Especial
    proyB2B_COP: 140,
    proyRetail_COP: 110,
    realB2B_COP: 148,
    realRetail_COP: 118,
    proyB2B_Gal: 6500,
    proyRetail_Gal: 5000,
    realB2B_Gal: 6900,
    realRetail_Gal: 5400,
    proyCunetes_Gal: 6000,
    proyGalon_Gal: 5500,
    realCunetes_Gal: 6500,
    realGalon_Gal: 5800,
  }
];

// ============================================================================
// 2. DATOS DE VOLUMEN DE VENTAS POR CIUDAD A LO LARGO DEL ÚLTIMO TRIMESTRE
// (Q3: Julio, Agosto, Septiembre 2026) - En Galones
// ============================================================================
interface CityTimelinePoint {
  periodo: string;
  mes: string;
  Bogota: number;
  Medellin: number;
  Cali: number;
  Barranquilla: number;
  Bucaramanga: number;
  Cartagena: number;
  Pereira: number;
  totalPeriodo: number;
}

const CITY_VOLUME_QUARTER_DATA: CityTimelinePoint[] = [
  {
    periodo: 'Julio Q1 (Sem 1-2)',
    mes: 'Julio',
    Bogota: 9600,
    Medellin: 7200,
    Cali: 3850,
    Barranquilla: 3750,
    Bucaramanga: 2450,
    Cartagena: 2800,
    Pereira: 1720,
    totalPeriodo: 31370
  },
  {
    periodo: 'Julio Q2 (Sem 3-4)',
    mes: 'Julio',
    Bogota: 10200,
    Medellin: 7600,
    Cali: 4050,
    Barranquilla: 4050,
    Bucaramanga: 2650,
    Cartagena: 3000,
    Pereira: 1780,
    totalPeriodo: 33330
  },
  {
    periodo: 'Agosto Q1 (Sem 5-6)',
    mes: 'Agosto',
    Bogota: 10050,
    Medellin: 7450,
    Cali: 3950,
    Barranquilla: 4100,
    Bucaramanga: 2600,
    Cartagena: 2950,
    Pereira: 1800,
    totalPeriodo: 32900
  },
  {
    periodo: 'Agosto Q2 (Sem 7-8)',
    mes: 'Agosto',
    Bogota: 10350,
    Medellin: 7650,
    Cali: 4150,
    Barranquilla: 4200,
    Bucaramanga: 2700,
    Cartagena: 3150,
    Pereira: 1800,
    totalPeriodo: 34000
  },
  {
    periodo: 'Septiembre Q1 (Sem 9-10)',
    mes: 'Septiembre',
    Bogota: 10600,
    Medellin: 7800,
    Cali: 4200,
    Barranquilla: 4350,
    Bucaramanga: 2750,
    Cartagena: 3200,
    Pereira: 1900,
    totalPeriodo: 34800
  },
  {
    periodo: 'Septiembre Q2 (Sem 11-12)',
    mes: 'Septiembre',
    Bogota: 10900,
    Medellin: 8000,
    Cali: 4300,
    Barranquilla: 4550,
    Bucaramanga: 2850,
    Cartagena: 3300,
    Pereira: 2000,
    totalPeriodo: 35900
  }
];

// Configuración de Ciudades para la Gráfica de Líneas
export interface CityConfig {
  key: keyof Omit<CityTimelinePoint, 'periodo' | 'mes' | 'totalPeriodo'>;
  nombre: string;
  color: string;
  sede: string;
  strokeWidth: number;
}

export const CITIES_CONFIG: CityConfig[] = [
  { key: 'Bogota', nombre: 'Bogotá D.C.', color: '#0033A0', sede: 'CEDI Central Fontibón', strokeWidth: 3 },
  { key: 'Medellin', nombre: 'Medellín', color: '#E31C23', sede: 'Planta Principal Rionegro / Guayabal', strokeWidth: 3 },
  { key: 'Cali', nombre: 'Cali', color: '#F59E0B', sede: 'Hub Regional Yumbo', strokeWidth: 2.5 },
  { key: 'Barranquilla', nombre: 'Barranquilla', color: '#10B981', sede: 'Centro Logístico Vía 40', strokeWidth: 2.5 },
  { key: 'Bucaramanga', nombre: 'Bucaramanga', color: '#8B5CF6', sede: 'Sede Oriente Chimitá', strokeWidth: 2 },
  { key: 'Cartagena', nombre: 'Cartagena', color: '#06B6D4', sede: 'Mamonal Zona Industrial', strokeWidth: 2 },
  { key: 'Pereira', nombre: 'Pereira', color: '#EC4899', sede: 'Eje Cafetero Dosquebradas', strokeWidth: 2 }
];

export const GerenciaAnalyticsCharts: React.FC<GerenciaAnalyticsChartsProps> = ({ orders = [] }) => {
  // Estados para Gráfica de Barras Apiladas (Categorías)
  const [metricCategoryUnit, setMetricCategoryUnit] = useState<'cop' | 'galones'>('cop');
  const [stackingCategoryMode, setStackingCategoryMode] = useState<'canales' | 'presentaciones'>('canales');

  // Estados para Gráfica de Líneas (Ciudades Último Trimestre)
  const [metricCityUnit, setMetricCityUnit] = useState<'galones' | 'cunetes' | 'cop'>('galones');
  const [visibleCities, setVisibleCities] = useState<Record<string, boolean>>({
    Bogota: true,
    Medellin: true,
    Cali: true,
    Barranquilla: true,
    Bucaramanga: true,
    Cartagena: true,
    Pereira: true
  });
  const [timeGranularity, setTimeGranularity] = useState<'quincenal' | 'mensual'>('quincenal');

  // Integración reactiva de órdenes reales en memoria
  const { categoryDataWithOrders, cityTimelineWithOrders } = useMemo(() => {
    // Clonar base de datos
    const dynamicCats = BASE_CATEGORY_STACKED.map((c) => ({ ...c }));
    const dynamicTimeline = CITY_VOLUME_QUARTER_DATA.map((t) => ({ ...t }));

    orders.forEach((ord) => {
      const orderTotalCOP = (ord.calculo?.costo_total_estimado || 0) / 1000000;
      const orderGal = ord.calculo?.total_galones || 0;
      const prodName = (ord.form?.producto_deseado || '').toLowerCase();
      const orderCity = (ord.form?.ciudad || '').toLowerCase();

      // Categoría
      let targetCat = dynamicCats[1]; // Vinilos default
      if (prodName.includes('koraza') || prodName.includes('fachada') || prodName.includes('acril')) {
        targetCat = dynamicCats[0];
      } else if (prodName.includes('aqua') || prodName.includes('impermeab')) {
        targetCat = dynamicCats[2];
      } else if (prodName.includes('esmalt') || prodName.includes('lux') || prodName.includes('óxido')) {
        targetCat = dynamicCats[3];
      } else if (prodName.includes('epóx') || prodName.includes('tráfico') || prodName.includes('coat')) {
        targetCat = dynamicCats[4];
      } else if (prodName.includes('madetec') || prodName.includes('madera')) {
        targetCat = dynamicCats[5];
      }

      // Asignar al canal B2B Constructoras en tiempo real
      targetCat.realB2B_COP += Number(orderTotalCOP.toFixed(2));
      targetCat.realB2B_Gal += Math.round(orderGal);
      targetCat.realCunetes_Gal += Math.round(orderGal * 0.85);
      targetCat.realGalon_Gal += Math.round(orderGal * 0.15);

      // Ciudad en el último período de Septiembre
      const lastPeriod = dynamicTimeline[dynamicTimeline.length - 1];
      if (orderCity.includes('bogotá') || orderCity.includes('bogota')) {
        lastPeriod.Bogota += Math.round(orderGal);
      } else if (orderCity.includes('medellín') || orderCity.includes('medellin')) {
        lastPeriod.Medellin += Math.round(orderGal);
      } else if (orderCity.includes('cali')) {
        lastPeriod.Cali += Math.round(orderGal);
      } else if (orderCity.includes('barranquilla')) {
        lastPeriod.Barranquilla += Math.round(orderGal);
      } else if (orderCity.includes('bucaramanga')) {
        lastPeriod.Bucaramanga += Math.round(orderGal);
      } else if (orderCity.includes('cartagena')) {
        lastPeriod.Cartagena += Math.round(orderGal);
      } else if (orderCity.includes('pereira')) {
        lastPeriod.Pereira += Math.round(orderGal);
      }
      lastPeriod.totalPeriodo += Math.round(orderGal);
    });

    return {
      categoryDataWithOrders: dynamicCats,
      cityTimelineWithOrders: dynamicTimeline
    };
  }, [orders]);

  // Transformar datos de categorías para Recharts
  const formattedCategoryChartData = useMemo(() => {
    return categoryDataWithOrders.map((item) => {
      const isCOP = metricCategoryUnit === 'cop';
      
      if (stackingCategoryMode === 'canales') {
        const proyB2B = isCOP ? item.proyB2B_COP : item.proyB2B_Gal;
        const proyRetail = isCOP ? item.proyRetail_COP : item.proyRetail_Gal;
        const realB2B = isCOP ? item.realB2B_COP : item.realB2B_Gal;
        const realRetail = isCOP ? item.realRetail_COP : item.realRetail_Gal;

        const totalProy = proyB2B + proyRetail;
        const totalReal = realB2B + realRetail;
        const cumplimiento = Number(((totalReal / totalProy) * 100).toFixed(1));

        return {
          categoria: item.categoriaCorta,
          nombreCompleto: item.categoria,
          lineas: item.lineaPrincipal,
          color: item.color,
          // Segmentos apilados Proyectado
          proyB2B,
          proyRetail,
          totalProy,
          // Segmentos apilados Real
          realB2B,
          realRetail,
          totalReal,
          gap: totalReal - totalProy,
          cumplimiento
        };
      } else {
        // Modo Presentaciones
        const proyCunetes = isCOP ? Math.round(item.proyCunetes_Gal * (item.proyB2B_COP / item.proyB2B_Gal)) : item.proyCunetes_Gal;
        const proyGalones = isCOP ? Math.round(item.proyGalon_Gal * (item.proyRetail_COP / item.proyRetail_Gal)) : item.proyGalon_Gal;
        const realCunetes = isCOP ? Math.round(item.realCunetes_Gal * (item.realB2B_COP / item.realB2B_Gal)) : item.realCunetes_Gal;
        const realGalones = isCOP ? Math.round(item.realGalon_Gal * (item.realRetail_COP / item.realRetail_Gal)) : item.realGalon_Gal;

        const totalProy = proyCunetes + proyGalones;
        const totalReal = realCunetes + realGalones;
        const cumplimiento = Number(((totalReal / totalProy) * 100).toFixed(1));

        return {
          categoria: item.categoriaCorta,
          nombreCompleto: item.categoria,
          lineas: item.lineaPrincipal,
          color: item.color,
          // Segmentos apilados Proyectado
          proyCunetes,
          proyGalones,
          totalProy,
          // Segmentos apilados Real
          realCunetes,
          realGalones,
          totalReal,
          gap: totalReal - totalProy,
          cumplimiento
        };
      }
    });
  }, [categoryDataWithOrders, metricCategoryUnit, stackingCategoryMode]);

  // Totales de la gráfica de barras apiladas
  const categorySummaryTotals = useMemo(() => {
    let proySum = 0;
    let realSum = 0;
    formattedCategoryChartData.forEach((d) => {
      proySum += d.totalProy;
      realSum += d.totalReal;
    });
    const cumplimientoGlobal = Number(((realSum / proySum) * 100).toFixed(1));
    return {
      proySum,
      realSum,
      gap: realSum - proySum,
      cumplimientoGlobal
    };
  }, [formattedCategoryChartData]);

  // Transformar datos de la línea de tiempo de ciudades según unidad y granularidad
  const formattedCityTimelineData = useMemo(() => {
    const rawData = cityTimelineWithOrders;

    // Si la granularidad es mensual, agrupar por mes
    let points = rawData;
    if (timeGranularity === 'mensual') {
      const monthMap: Record<string, CityTimelinePoint> = {};
      rawData.forEach((pt) => {
        if (!monthMap[pt.mes]) {
          monthMap[pt.mes] = {
            periodo: pt.mes + ' 2026',
            mes: pt.mes,
            Bogota: 0,
            Medellin: 0,
            Cali: 0,
            Barranquilla: 0,
            Bucaramanga: 0,
            Cartagena: 0,
            Pereira: 0,
            totalPeriodo: 0
          };
        }
        monthMap[pt.mes].Bogota += pt.Bogota;
        monthMap[pt.mes].Medellin += pt.Medellin;
        monthMap[pt.mes].Cali += pt.Cali;
        monthMap[pt.mes].Barranquilla += pt.Barranquilla;
        monthMap[pt.mes].Bucaramanga += pt.Bucaramanga;
        monthMap[pt.mes].Cartagena += pt.Cartagena;
        monthMap[pt.mes].Pereira += pt.Pereira;
        monthMap[pt.mes].totalPeriodo += pt.totalPeriodo;
      });
      points = Object.values(monthMap);
    }

    // Convertir según unidad métrica seleccionada
    return points.map((p) => {
      let multiplier = 1;
      if (metricCityUnit === 'cunetes') {
        multiplier = 0.2; // 1 cuñete = 5 galones
      } else if (metricCityUnit === 'cop') {
        multiplier = 0.0215; // aprox $21,500 COP por galón promedio corporativo en Millones
      }

      return {
        periodo: p.periodo,
        mes: p.mes,
        Bogota: Number((p.Bogota * multiplier).toFixed(metricCityUnit === 'cop' ? 1 : 0)),
        Medellin: Number((p.Medellin * multiplier).toFixed(metricCityUnit === 'cop' ? 1 : 0)),
        Cali: Number((p.Cali * multiplier).toFixed(metricCityUnit === 'cop' ? 1 : 0)),
        Barranquilla: Number((p.Barranquilla * multiplier).toFixed(metricCityUnit === 'cop' ? 1 : 0)),
        Bucaramanga: Number((p.Bucaramanga * multiplier).toFixed(metricCityUnit === 'cop' ? 1 : 0)),
        Cartagena: Number((p.Cartagena * multiplier).toFixed(metricCityUnit === 'cop' ? 1 : 0)),
        Pereira: Number((p.Pereira * multiplier).toFixed(metricCityUnit === 'cop' ? 1 : 0)),
        totalPeriodo: Number((p.totalPeriodo * multiplier).toFixed(metricCityUnit === 'cop' ? 1 : 0))
      };
    });
  }, [cityTimelineWithOrders, timeGranularity, metricCityUnit]);

  // Totales acumulados en el trimestre por ciudad
  const cityQuarterTotals = useMemo(() => {
    const totals: Record<string, number> = {
      Bogota: 0,
      Medellin: 0,
      Cali: 0,
      Barranquilla: 0,
      Bucaramanga: 0,
      Cartagena: 0,
      Pereira: 0
    };
    cityTimelineWithOrders.forEach((pt) => {
      totals.Bogota += pt.Bogota;
      totals.Medellin += pt.Medellin;
      totals.Cali += pt.Cali;
      totals.Barranquilla += pt.Barranquilla;
      totals.Bucaramanga += pt.Bucaramanga;
      totals.Cartagena += pt.Cartagena;
      totals.Pereira += pt.Pereira;
    });
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
    return { totals, grandTotal };
  }, [cityTimelineWithOrders]);

  // Formateadores auxiliares
  const formatValue = (val: number, unit: 'cop' | 'galones' | 'cunetes') => {
    if (unit === 'cop') return `$${val.toLocaleString('es-CO')}M`;
    if (unit === 'cunetes') return `${val.toLocaleString('es-CO')} Cuñ`;
    return `${val.toLocaleString('es-CO')} Gal`;
  };

  // Alternar visibilidad de ciudad en la gráfica de líneas
  const toggleCity = (cityKey: string) => {
    setVisibleCities((prev) => ({
      ...prev,
      [cityKey]: !prev[cityKey]
    }));
  };

  // Seleccionar todas o sólo una ciudad
  const handleSelectOnlyCity = (cityKey: string) => {
    setVisibleCities({
      Bogota: cityKey === 'Bogota',
      Medellin: cityKey === 'Medellin',
      Cali: cityKey === 'Cali',
      Barranquilla: cityKey === 'Barranquilla',
      Bucaramanga: cityKey === 'Bucaramanga',
      Cartagena: cityKey === 'Cartagena',
      Pereira: cityKey === 'Pereira'
    });
  };

  const handleSelectAllCities = () => {
    setVisibleCities({
      Bogota: true,
      Medellin: true,
      Cali: true,
      Barranquilla: true,
      Bucaramanga: true,
      Cartagena: true,
      Pereira: true
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="tablero-gerencia-analytics">
      
      {/* =====================================================================
          CABECERA EJECUTIVA: CONTEXTO DEL TRIMESTRE Q3 2026
      ===================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0033A0] text-white">
                Inteligencia de Negocios Corporativa
              </span>
              <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Auditoría Trimestral Q3 2026 (Julio - Septiembre)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tablero de Mando Gerencial: Ventas y Despachos Nacionales
            </h2>
            <p className="text-xs text-slate-600">
              Análisis comparativo de metas proyectadas vs. facturación real por portafolio técnico y curva de volumen por plaza regional.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-right">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Cumplimiento Global Q3</span>
              <span className="text-xl font-black text-emerald-700">{categorySummaryTotals.cumplimientoGlobal}%</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-right">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Volumen Q3 Consolidado</span>
              <span className="text-xl font-black text-[#0033A0]">
                {cityQuarterTotals.grandTotal.toLocaleString('es-CO')} Gal
              </span>
            </div>
          </div>
        </div>

        {/* Resumen Rápido de Directrices */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Líder en Facturación:</strong>
              Fachadas (Koraza) supera la meta en +11.2% por expansión en proyectos VIS y No VIS.
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Plaza de Mayor Crecimiento:</strong>
              Barranquilla y Cartagena registran incremento sostenido del +14.8% en epóxicas marinas.
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 font-bold">Aprovisionamiento Blindado:</strong>
              Resina y dióxido de titanio garantizados para el pico estacional del cierre de año (Q4).
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MÓDULO 1: GRÁFICA DE BARRAS APILADAS (STACKED BAR CHART)
          Comparativa Ventas Proyectadas vs Reales por Categoría de Producto
      ===================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6" id="seccion-barras-apiladas">
        
        {/* Cabecera del Módulo con Controles de Apilado y Unidades */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E31C23]" />
              <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0033A0]" />
                <span>Ventas Proyectadas vs. Reales por Categoría (Barras Apiladas)</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Cada barra desglosa de forma apilada la composición de la cuota proyectada y la venta real por canal comercial o formato.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle Modo de Apilado */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
              <button
                type="button"
                id="btn-stack-canales"
                onClick={() => setStackingCategoryMode('canales')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  stackingCategoryMode === 'canales'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Apilar por Canal (B2B Obra vs Retail)</span>
              </button>
              <button
                type="button"
                id="btn-stack-presentaciones"
                onClick={() => setStackingCategoryMode('presentaciones')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  stackingCategoryMode === 'presentaciones'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Apilar por Envase (Cuñete vs Galón)</span>
              </button>
            </div>

            {/* Toggle Unidad Métrica */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
              <button
                type="button"
                id="btn-metric-cat-cop"
                onClick={() => setMetricCategoryUnit('cop')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  metricCategoryUnit === 'cop'
                    ? 'bg-[#0033A0] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Millones COP ($)</span>
              </button>
              <button
                type="button"
                id="btn-metric-cat-galones"
                onClick={() => setMetricCategoryUnit('galones')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  metricCategoryUnit === 'galones'
                    ? 'bg-[#0033A0] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Volumen (Galones)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Indicadores Clave de Barras Apiladas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Proyectado Presupuestal</span>
            <span className="text-xl font-black text-slate-800">
              {formatValue(categorySummaryTotals.proySum, metricCategoryUnit)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Suma de todas las familias</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block">Total Real Facturado</span>
            <span className="text-xl font-black text-[#0033A0]">
              {formatValue(categorySummaryTotals.realSum, metricCategoryUnit)}
            </span>
            <span className="text-[10px] text-blue-600 block mt-0.5">Órdenes confirmadas en ERP</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">Superávit Comercial (Gap)</span>
            <span className="text-xl font-black text-emerald-700">
              +{formatValue(categorySummaryTotals.gap, metricCategoryUnit)}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Tracción positiva en obra</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200">
            <span className="text-[10px] font-bold text-red-900 uppercase tracking-wider block">Cumplimiento Global</span>
            <span className="text-xl font-black text-[#E31C23]">
              {categorySummaryTotals.cumplimientoGlobal}%
            </span>
            <span className="text-[10px] text-red-700 font-bold block mt-0.5">Objetivo corporativo superado</span>
          </div>
        </div>

        {/* GRÁFICA DE BARRAS APILADAS CON RECHARTS */}
        <div className="w-full h-88 sm:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedCategoryChartData}
              margin={{ top: 20, right: 25, left: 15, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="categoria" 
                tick={{ fontSize: 11, fill: '#0F172A', fontWeight: 700 }}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickFormatter={(val) => metricCategoryUnit === 'cop' ? `$${val}M` : `${val/1000}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-2.5 min-w-[240px]">
                        <div className="border-b border-slate-800 pb-2">
                          <span className="font-bold text-sm text-white block">{data.nombreCompleto}</span>
                          <span className="text-[11px] text-slate-400 italic block">{data.lineas}</span>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-500/20 text-blue-300">
                            Cumplimiento: {data.cumplimiento}%
                          </span>
                        </div>

                        {stackingCategoryMode === 'canales' ? (
                          <div className="space-y-2 font-mono text-[11px]">
                            {/* Proyectado apilado */}
                            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                              <span className="text-slate-400 font-bold block text-[10px] uppercase">
                                Meta Proyectada Apilada: {formatValue(data.totalProy, metricCategoryUnit)}
                              </span>
                              <div className="flex justify-between text-slate-300">
                                <span>• B2B Constructoras:</span>
                                <strong>{formatValue(data.proyB2B, metricCategoryUnit)}</strong>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>• Retail Ferreterías:</span>
                                <strong>{formatValue(data.proyRetail, metricCategoryUnit)}</strong>
                              </div>
                            </div>

                            {/* Real apilado */}
                            <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-800/60 space-y-1">
                              <span className="text-blue-300 font-bold block text-[10px] uppercase">
                                Venta Real Apilada: {formatValue(data.totalReal, metricCategoryUnit)}
                              </span>
                              <div className="flex justify-between text-emerald-400">
                                <span>• B2B Constructoras:</span>
                                <strong>{formatValue(data.realB2B, metricCategoryUnit)}</strong>
                              </div>
                              <div className="flex justify-between text-blue-300">
                                <span>• Retail Ferreterías:</span>
                                <strong>{formatValue(data.realRetail, metricCategoryUnit)}</strong>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 font-mono text-[11px]">
                            {/* Presentación apilada */}
                            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                              <span className="text-slate-400 font-bold block text-[10px] uppercase">
                                Proyectado Apilado: {formatValue(data.totalProy, metricCategoryUnit)}
                              </span>
                              <div className="flex justify-between text-slate-300">
                                <span>• Cuñetes (5 Gal):</span>
                                <strong>{formatValue(data.proyCunetes, metricCategoryUnit)}</strong>
                              </div>
                              <div className="flex justify-between text-slate-400">
                                <span>• Galones (1 Gal):</span>
                                <strong>{formatValue(data.proyGalones, metricCategoryUnit)}</strong>
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-800/60 space-y-1">
                              <span className="text-blue-300 font-bold block text-[10px] uppercase">
                                Real Apilado: {formatValue(data.totalReal, metricCategoryUnit)}
                              </span>
                              <div className="flex justify-between text-emerald-400">
                                <span>• Cuñetes (5 Gal):</span>
                                <strong>{formatValue(data.realCunetes, metricCategoryUnit)}</strong>
                              </div>
                              <div className="flex justify-between text-blue-300">
                                <span>• Galones (1 Gal):</span>
                                <strong>{formatValue(data.realGalones, metricCategoryUnit)}</strong>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="pt-1 border-t border-slate-800 flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">Variación Neta:</span>
                          <strong className={data.gap >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {data.gap >= 0 ? '+' : ''}{formatValue(data.gap, metricCategoryUnit)}
                          </strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '15px', fontSize: '11px', fontWeight: 600 }}
              />

              {/* BARRAS APILADAS POR CANAL O POR PRESENTACIÓN */}
              {stackingCategoryMode === 'canales' ? (
                <>
                  {/* Pila 1: Proyectado (stackId="proyectado") */}
                  <Bar 
                    name="Proyectado B2B Constructoras"
                    dataKey="proyB2B"
                    stackId="proyectado"
                    fill="#94A3B8"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={38}
                  />
                  <Bar 
                    name="Proyectado Retail Ferreterías"
                    dataKey="proyRetail"
                    stackId="proyectado"
                    fill="#CBD5E1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />

                  {/* Pila 2: Real (stackId="real") */}
                  <Bar 
                    name="Real B2B Constructoras"
                    dataKey="realB2B"
                    stackId="real"
                    fill="#0033A0"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={38}
                  />
                  <Bar 
                    name="Real Retail Ferreterías"
                    dataKey="realRetail"
                    stackId="real"
                    fill="#E31C23"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                </>
              ) : (
                <>
                  {/* Pila 1: Proyectado Cuñetes + Galones (stackId="proyectado") */}
                  <Bar 
                    name="Proyectado Cuñetes (5 Gal)"
                    dataKey="proyCunetes"
                    stackId="proyPres"
                    fill="#64748B"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={38}
                  />
                  <Bar 
                    name="Proyectado Galones (1 Gal)"
                    dataKey="proyGalones"
                    stackId="proyPres"
                    fill="#94A3B8"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />

                  {/* Pila 2: Real Cuñetes + Galones (stackId="real") */}
                  <Bar 
                    name="Real Cuñetes (5 Gal)"
                    dataKey="realCunetes"
                    stackId="realPres"
                    fill="#0033A0"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={38}
                  />
                  <Bar 
                    name="Real Galones (1 Gal)"
                    dataKey="realGalones"
                    stackId="realPres"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={38}
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla Descriptiva de Cumplimiento por Categoría */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-800 font-black uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Familia Técnica</th>
                <th className="py-3 px-4">Líneas Representativas</th>
                <th className="py-3 px-4 text-right">Meta Proyectada</th>
                <th className="py-3 px-4 text-right">Ejecución Real</th>
                <th className="py-3 px-4 text-right">Superávit / Brecha</th>
                <th className="py-3 px-4 text-center">Cumplimiento</th>
                <th className="py-3 px-4">Comportamiento en Obra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {formattedCategoryChartData.map((cat) => (
                <tr key={cat.categoria} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span>{cat.nombreCompleto}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{cat.lineas}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">
                    {formatValue(cat.totalProy, metricCategoryUnit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatValue(cat.totalReal, metricCategoryUnit)}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono font-bold ${cat.gap >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {cat.gap >= 0 ? '+' : ''}{formatValue(cat.gap, metricCategoryUnit)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                      cat.cumplimiento >= 100 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {cat.cumplimiento >= 100 ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-600" />}
                      {cat.cumplimiento}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {cat.cumplimiento >= 110 
                      ? 'Demanda sobresaliente en obras de gran formato' 
                      : cat.cumplimiento >= 100 
                      ? 'Despacho alineado con cronograma presupuestal' 
                      : 'Ajuste de inventarios en tiendas distritales'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* =====================================================================
          MÓDULO 2: GRÁFICA DE LÍNEAS (LINE CHART)
          Volumen de Ventas por Ciudad a lo largo del Último Trimestre (Q3 2026)
      ===================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6" id="seccion-lineas-ciudades">
        
        {/* Cabecera del Módulo con Controles de Tiempo y Filtros de Ciudad */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0033A0]" />
              <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <LineChartIcon className="w-5 h-5 text-[#E31C23]" />
                <span>Volumen de Ventas por Ciudad a lo largo del Último Trimestre</span>
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Trayectoria quincenal y mensual de despachos por hub regional (Bogotá, Medellín, Cali, Barranquilla, Bucaramanga, Cartagena y Pereira).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle Granularidad Temporal */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
              <button
                type="button"
                id="btn-time-quincenal"
                onClick={() => setTimeGranularity('quincenal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  timeGranularity === 'quincenal'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Quincenal (6 Hitos Q3)</span>
              </button>
              <button
                type="button"
                id="btn-time-mensual"
                onClick={() => setTimeGranularity('mensual')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  timeGranularity === 'mensual'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Mensual (Jul / Ago / Sep)</span>
              </button>
            </div>

            {/* Toggle Unidad de Volumen */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
              <button
                type="button"
                id="btn-metric-city-galones"
                onClick={() => setMetricCityUnit('galones')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  metricCityUnit === 'galones'
                    ? 'bg-[#0033A0] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Galones</span>
              </button>
              <button
                type="button"
                id="btn-metric-city-cunetes"
                onClick={() => setMetricCityUnit('cunetes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  metricCityUnit === 'cunetes'
                    ? 'bg-[#0033A0] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Cuñetes (5GL)</span>
              </button>
              <button
                type="button"
                id="btn-metric-city-cop"
                onClick={() => setMetricCityUnit('cop')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  metricCityUnit === 'cop'
                    ? 'bg-[#0033A0] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>COP ($M)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Filtro Rápido de Ciudades (Pills Activos) */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Filtrar Ciudades:
            </span>
            <button
              type="button"
              onClick={handleSelectAllCities}
              className="text-[11px] font-bold text-[#0033A0] hover:underline px-2 py-0.5"
            >
              (Mostrar Todas)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {CITIES_CONFIG.map((c) => {
              const isVisible = visibleCities[c.key];
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleCity(c.key)}
                  onDoubleClick={() => handleSelectOnlyCity(c.key)}
                  title={`Doble clic para aislar sólo ${c.nombre}`}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    isVisible
                      ? 'bg-white text-slate-900 shadow-xs border-slate-300'
                      : 'bg-slate-200/60 text-slate-400 border-transparent opacity-60'
                  }`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: isVisible ? c.color : '#94A3B8' }} 
                  />
                  <span>{c.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* GRÁFICA DE LÍNEAS CON RECHARTS */}
        <div className="w-full h-88 sm:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedCityTimelineData}
              margin={{ top: 20, right: 30, left: 15, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="periodo" 
                tick={{ fontSize: 11, fill: '#0F172A', fontWeight: 600 }}
                axisLine={{ stroke: '#CBD5E1' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickFormatter={(val) => {
                  if (metricCityUnit === 'cop') return `$${val}M`;
                  if (metricCityUnit === 'cunetes') return `${val}`;
                  return `${val/1000}k`;
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 text-xs space-y-2.5 min-w-[240px]">
                        <div className="border-b border-slate-800 pb-1.5 flex justify-between items-center">
                          <span className="font-bold text-sm text-white">{label}</span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            Total: {formatValue(data.totalPeriodo, metricCityUnit)}
                          </span>
                        </div>

                        <div className="space-y-1.5 font-mono text-[11px]">
                          {CITIES_CONFIG.filter((c) => visibleCities[c.key]).map((c) => {
                            const val = data[c.key];
                            return (
                              <div key={c.key} className="flex justify-between items-center text-slate-300">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                                  <span className="font-sans text-xs">{c.nombre}:</span>
                                </span>
                                <strong className="text-white">
                                  {formatValue(val, metricCityUnit)}
                                </strong>
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
                          Sedes operando con certificación ISO 9001 & NTC 1335
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '15px', fontSize: '11px', fontWeight: 600 }}
              />

              {/* LÍNEAS INDIVIDUALES POR CIUDAD */}
              {CITIES_CONFIG.map((c) => {
                if (!visibleCities[c.key]) return null;
                return (
                  <Line
                    key={c.key}
                    type="monotone"
                    dataKey={c.key}
                    name={c.nombre}
                    stroke={c.color}
                    strokeWidth={c.strokeWidth}
                    dot={{ fill: c.color, strokeWidth: 2, r: 3.5 }}
                    activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tarjetas Informativas de Sede Regional (Hubs de Despacho) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {CITIES_CONFIG.slice(0, 4).map((c) => {
            const totalVol = cityQuarterTotals.totals[c.key] || 0;
            const pctShare = ((totalVol / cityQuarterTotals.grandTotal) * 100).toFixed(1);
            return (
              <div key={c.key} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.nombre}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-black">
                    {pctShare}% Mix
                  </span>
                </div>
                <div className="text-lg font-black text-slate-900">
                  {totalVol.toLocaleString('es-CO')} Galones
                </div>
                <p className="text-[10px] text-slate-500 truncate">{c.sede}</p>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
