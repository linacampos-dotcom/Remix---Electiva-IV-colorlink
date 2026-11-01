import React, { useState, useRef } from 'react';
import { HeroCarousel } from './HeroCarousel';
import { ClientNavigationTab } from '../types';
import { ColombiaInteractiveMap, SedePintuco } from './ColombiaInteractiveMap';
import { 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  Calculator, 
  Award, 
  Bot, 
  MapPin, 
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

export interface HomeProps {
  onNavigateTab: (tab: ClientNavigationTab, category?: string) => void;
  onOpenChat: () => void;
  onSelectSede?: (sede: SedePintuco) => void;
}

export const Home: React.FC<HomeProps> = ({
  onNavigateTab,
  onOpenChat,
  onSelectSede,
}) => {
  // Estado para controlar la visibilidad de la sección de Sedes y Mapa (oculto por defecto)
  const [showSedes, setShowSedes] = useState<boolean>(false);
  const sedesSectionRef = useRef<HTMLDivElement | null>(null);

  const handleToggleSedes = () => {
    setShowSedes((prev) => {
      const nextState = !prev;
      if (nextState) {
        // Scroll suave hacia la sección de sedes al abrir
        setTimeout(() => {
          sedesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      return nextState;
    });
  };
  return (
    <div className="page-content content-wrapper animate-fadeIn relative z-1 flex flex-col">
      
      {/* =====================================================================
          1. CARRUSEL PRINCIPAL DE PROMOCIONES DE PINTURAS (HeroCarousel)
          - Comienza inmediatamente debajo del header con separación visual limpia
          - Autoplay cada 5 segundos con pausa en hover
          - Flechas (< y >) y puntos/barras de posición en bg-blue-900
      ===================================================================== */}
      <HeroCarousel onNavigateTab={onNavigateTab} />

      {/* =====================================================================
          2. ACCESOS DIRECTOS Y HERRAMIENTAS CORPORATIVAS PINTUCO
          - Módulos de servicio interactivos de alto nivel
          - Iconografía técnica, micro-acentos de color y jerarquía de texto clara
      ===================================================================== */}
      <div className="mt-2.5 sm:mt-3 bg-transparent grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        
        {/* 1. Cotizador */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('cotizador')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateTab('cotizador');
            }
          }}
          className="h-full min-h-[165px] p-4 sm:p-4.5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-500 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-[#003366]/30 relative overflow-hidden"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/30">
                <Calculator className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                NTC 1335
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                Cotizador
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Calcula metros cuadrados exactos, manos requeridas y dosificación de pintura.
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:text-blue-900 transition-colors">
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Calcular proyecto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 2. Catálogo */}
        <div 
          role="button"
          tabIndex={0}
          onClick={() => onNavigateTab('catalog')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigateTab('catalog');
            }
          }}
          className="h-full min-h-[165px] p-4 sm:p-4.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-500 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-indigo-500/30 relative overflow-hidden"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/30">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                OFICIAL
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">
                Catálogo
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Interiores Viniltex, fachadas Koraza, esmaltes Pintulux y herramientas de pintor.
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-700 group-hover:text-indigo-900 transition-colors">
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Ver productos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* 3. Red de Sedes y Cobertura */}
        <div 
          role="button"
          tabIndex={0}
          onClick={handleToggleSedes}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggleSedes();
            }
          }}
          className={`h-full min-h-[165px] p-4 sm:p-4.5 rounded-2xl bg-white border transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-teal-500/30 relative overflow-hidden ${
            showSedes 
              ? 'border-teal-500 shadow-xl ring-2 ring-teal-500/20' 
              : 'border-slate-200/90 hover:border-teal-500 shadow-xs hover:shadow-xl'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-teal-700 transition-all shadow-sm shadow-teal-600/30">
                <MapPin className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                showSedes 
                  ? 'bg-teal-100 text-teal-800 border-teal-200' 
                  : 'bg-teal-50 text-teal-700 border-teal-100'
              }`}>
                {showSedes ? 'ABIERTO' : '32 DPTOS'}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                Sedes y Puntos de Venta
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Retiro inmediato en tienda y centros de despacho autorizados en todo el país.
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-900 transition-colors">
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>{showSedes ? 'Ocultar mapa de sedes' : 'Explorar sedes en mapa'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
            {showSedes ? (
              <ChevronUp className="w-4 h-4 text-teal-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-y-0.5 transition-transform" />
            )}
          </div>
        </div>

        {/* 4. Asesor Virtual Especializado */}
        <div 
          role="button"
          tabIndex={0}
          onClick={onOpenChat}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenChat();
            }
          }}
          className="h-full min-h-[165px] p-4 sm:p-4.5 rounded-2xl bg-white border border-slate-200/90 hover:border-cyan-500 shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-cyan-500/30 relative overflow-hidden"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-700 transition-all shadow-sm shadow-cyan-600/30">
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">
                IA 24/7
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-cyan-900 transition-colors">
                Asesor Técnico IA
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Diagnóstico de humedad, recomendaciones de resinas y preparación de muros.
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-cyan-700 group-hover:text-cyan-900 transition-colors">
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Iniciar asesoría</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>
        </div>

      </div>

      {/* =====================================================================
          3. SECCIÓN OFICIAL DE COBERTURA Y MAPA NACIONAL (OCULTA POR DEFECTO)
          Se activa únicamente cuando el usuario hace clic en "Sedes" o "Tiendas"
      ===================================================================== */}
      {showSedes && (
        <div 
          ref={sedesSectionRef}
          className="mt-3 sm:mt-3.5 space-y-3 animate-fadeIn transition-all duration-300 scroll-mt-20"
        >
          {/* Barra superior de control del mapa con botón de cierre rápido */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 bg-gradient-to-r from-[#001224] via-[#001D3D] to-[#0A2E5C] rounded-2xl text-white shadow-md border border-cyan-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-300 border border-cyan-400/30">
                <MapPin className="w-4 h-4 text-cyan-300" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
                  Red Oficial de Sedes y Puntos de Despacho Pintuco
                </h4>
                <p className="text-[11px] text-cyan-200/80">
                  Selecciona tu sede o departamento para retirar en tienda o calcular despacho a domicilio.
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setShowSedes(false)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/20 hover:border-white/40"
              title="Ocultar sección de sedes"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar mapa</span>
            </button>
          </div>

          <ColombiaInteractiveMap
            onSelectSede={(sede) => {
              if (onSelectSede) {
                onSelectSede(sede);
              } else {
                onNavigateTab('cotizador');
              }
            }}
            onGoToCotizador={() => onNavigateTab('cotizador')}
          />
        </div>
      )}

      {/* =====================================================================
          4. TARJETA DE TRAYECTORIA CORPORATIVA (+75 AÑOS AKZONOBEL)
      ===================================================================== */}
      <div className="mt-3 sm:mt-3.5 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#001224] via-[#001D3D] to-[#0A2E5C] text-white border border-blue-900/60 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-cyan-400/10 to-transparent pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-lg shadow-black/30 shrink-0 group-hover:scale-105 transition-transform">
            75+
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Más de 75 años de Excelencia e Innovación Pintuco
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/15 text-cyan-200 border border-white/20 backdrop-blur-xs">
                1945 - Presente · Grupo AkzoNobel
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl font-normal">
              Liderando la industria con pinturas y recubrimientos de alto desempeño que protegen y dan color a hogares, infraestructuras y proyectos arquitectónicos en Colombia.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('nosotros')}
          className="relative z-10 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <span>Conocer Trayectoria</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </div>

    </div>
  );
};

export default Home;
