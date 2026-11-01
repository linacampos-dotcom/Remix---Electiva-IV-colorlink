import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Wrench, 
  ArrowRight, 
  Tag, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';
import { ClientNavigationTab } from '../types';

export interface HeroCarouselProps {
  onNavigateTab: (tab: ClientNavigationTab, category?: string) => void;
}

interface SlideData {
  id: string;
  tag: string;
  tagIcon: React.ReactNode;
  badge: string;
  badgeColor: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  description: string;
  features: string[];
  buttonText: string;
  targetTab: ClientNavigationTab;
  targetCategory?: string;
  bgGradient: string;
  accentColor: string;
  productImage: string;
  productAlt: string;
  backdropImage?: string;
  brandTag: string;
}

const SLIDES: SlideData[] = [
  // =========================================================================
  // SLIDE 1: VINILTEX ADVANCED / INTERIORES
  // =========================================================================
  {
    id: 'slide-viniltex',
    tag: 'Fácil de limpiar • Más cubrimiento',
    tagIcon: <Sparkles className="w-3.5 h-3.5 text-cyan-300" />,
    badge: '6% OFF',
    badgeColor: 'bg-rose-600 text-white shadow-rose-600/30',
    titlePrefix: '',
    titleHighlight: 'Viniltex Advanced',
    titleSuffix: ', paredes interiores de máxima lavabilidad.',
    description: 'Pintura vinil acrílica premium Tipo 1 con tecnología antibacterial y antimanchas. Resiste más de 20,000 ciclos de lavado para lucir impecable día tras día.',
    features: [
      '+20,000 ciclos de lavado (Norma NTC 1335)',
      'Tecnología Antibacterial y Cero Olor',
      'Máximo rendimiento: hasta 32 m² por galón'
    ],
    buttonText: 'Ver productos en oferta',
    targetTab: 'catalog',
    targetCategory: 'ofertas',
    bgGradient: 'from-slate-900 via-blue-900 to-indigo-950 text-white',
    accentColor: '#002266',
    productImage: '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
    productAlt: 'Caneca oficial Viniltex Advanced Pintuco',
    backdropImage: '/src/assets/images/living_room_wall_1789834592467.jpg',
    brandTag: 'PINTUCO • INTERIORES'
  },

  // =========================================================================
  // SLIDE 2: KORAZA DOBLE VIDA / EXTERIORES
  // =========================================================================
  {
    id: 'slide-koraza',
    tag: 'Protección Sol & Lluvia • Máxima Durabilidad',
    tagIcon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />,
    badge: 'OFERTA ESPECIAL',
    badgeColor: 'bg-amber-500 text-slate-950 shadow-amber-500/30',
    titlePrefix: '',
    titleHighlight: 'Koraza Protección Total',
    titleSuffix: ', la solución ideal para fachadas y exteriores.',
    description: 'Pintura acrílica elastomérica de alta tecnología con barrera hidrorrepelente que resiste lluvia torrencial, hongos, rayos ultravioleta y puentea fisuras.',
    features: [
      'Garantía Certificada de hasta 13 años',
      'Puentea microfisuras de hasta 1 mm',
      'Filtro solar UV que preserva el color original'
    ],
    buttonText: 'Explorar Línea Exterior',
    targetTab: 'catalog',
    targetCategory: 'exterior',
    bgGradient: 'from-slate-950 via-[#003366] to-emerald-950 text-white',
    accentColor: '#003366',
    productImage: '/src/assets/images/koraza_bucket_studio_1790894419359.jpg',
    productAlt: 'Cuñete oficial Koraza Doble Vida Pintuco Fachadas',
    backdropImage: '/src/assets/images/facade_wall_1789834604798.jpg',
    brandTag: 'PINTUCO • FACHADAS'
  },

  // =========================================================================
  // SLIDE 3: ESMALTES Y HERRAMIENTAS PINTUCO
  // =========================================================================
  {
    id: 'slide-herramientas',
    tag: 'Equípate como un Profesional',
    tagIcon: <Wrench className="w-3.5 h-3.5 text-cyan-300" />,
    badge: 'COMPLEMENTOS DE PINTURA',
    badgeColor: 'bg-rose-600 text-white shadow-rose-600/30',
    titlePrefix: '',
    titleHighlight: 'Kits de Pintura & Herramientas Pintuco',
    titleSuffix: '.',
    description: 'Línea técnica de aplicación y preparación: rodillos cero gota de microfibra, brochas monobloque con cerdas anticaída, espátulas de acero inoxidable y cintas de alta precisión.',
    features: [
      'Rodillos de microfibra con mínima salpicadura',
      'Brochas profesionales con cerdas cónicas vulcanizadas',
      'Cinta azul de enmascarar con remoción limpia hasta 14 días'
    ],
    buttonText: 'Comprar Herramientas',
    targetTab: 'catalog',
    targetCategory: 'herramientas',
    bgGradient: 'from-slate-900 via-indigo-950 to-blue-900 text-white',
    accentColor: '#002266',
    productImage: '/src/assets/images/paint_roller_tray_1790894457076.jpg',
    productAlt: 'Kit Profesional de Herramientas Pintuco',
    backdropImage: '/src/assets/images/sandpaper_tape_tools_1790894466804.jpg',
    brandTag: 'PINTUCO • ACCESORIOS'
  }
];

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onNavigateTab }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Autoplay effect every 5 seconds, pauses on hover
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  // Touch swipe handling for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  const activeSlide = SLIDES[currentSlide];

  return (
    <div 
      className="hero-container hero-card hero-banner relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-blue-900/50 select-none group/carousel bg-[#001020]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Promociones Principales Pintuco"
    >
      {/* Slides Container */}
      <div className="relative min-h-[420px] sm:min-h-[450px] lg:min-h-[470px] w-full flex items-stretch overflow-hidden">
        {SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out flex items-stretch overflow-hidden ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
              aria-hidden={!isActive}
            >
              {/* Dynamic Slide Background with depth gradient */}
              <div className="w-full h-full bg-gradient-to-br from-[#001020] via-[#001A38] to-[#0A2E5C] text-white p-5 sm:p-8 lg:p-10 flex flex-col justify-center relative overflow-hidden">
                
                {/* Architectural ambient lifestyle background */}
                {slide.backdropImage && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-15 pointer-events-none mix-blend-luminosity transition-transform duration-1000 scale-105 overflow-hidden"
                    style={{ backgroundImage: `url(${slide.backdropImage})` }}
                  />
                )}

                {/* Depth gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#001020]/95 via-[#001A38]/85 to-[#0A2E5C]/60 pointer-events-none overflow-hidden" />

                {/* Atmospheric lighting accents */}
                <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center max-w-6xl mx-auto w-full">
                  
                  {/* =========================================================
                      COLUMNA IZQUIERDA: INFORMACIÓN Y PROMOCIÓN EDITORIAL
                  ========================================================= */}
                  <div className="hero-text-container lg:col-span-7 space-y-3.5 text-left relative top-0 mt-0">
                    
                    {/* Eyebrow kicker: editorial y limpio */}
                    <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-cyan-400">
                      <span>{slide.brandTag}</span>
                      <span className="text-cyan-700" aria-hidden="true">·</span>
                      <span className="text-slate-300 font-medium normal-case tracking-normal">{slide.tag}</span>
                    </div>

                    {/* Main Title con Jerarquía arquitectónica moderna */}
                    <h2 className="hero-title text-2xl sm:text-4xl lg:text-[40px] font-black text-white leading-[1.1] tracking-tight text-balance relative top-0 mt-0">
                      <span>{slide.titleHighlight}</span>
                      <span className="block text-sky-300 font-bold text-lg sm:text-2xl lg:text-3xl mt-1">
                        {slide.titleSuffix.replace(/^[,\.\s]+/, '')}
                      </span>
                    </h2>

                    {/* Description legible y precisa */}
                    <p className="hero-subtitle text-xs sm:text-sm text-slate-200 leading-relaxed font-normal max-w-xl relative top-0 mt-0">
                      {slide.description}
                    </p>

                    {/* Technical Features Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      {slide.features.map((feature, fIndex) => (
                        <div key={fIndex} className="flex items-center gap-2 text-xs sm:text-sm text-slate-100 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons: Principal destacado y secundario discreto */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onNavigateTab(slide.targetTab, slide.targetCategory)}
                        className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black shadow-lg shadow-blue-950/60 rounded-xl px-5 sm:px-6 py-2.5 sm:py-3 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer inline-flex items-center gap-2 text-xs sm:text-sm group/btn"
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-1 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigateTab('cotizador')}
                        className="px-4 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs sm:text-sm font-semibold text-sky-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 group/sec"
                      >
                        <span>Calcular m² exactos</span>
                        <ArrowRight className="w-3.5 h-3.5 text-sky-400 group-hover/sec:translate-x-1 transition-transform" />
                      </button>
                    </div>

                  </div>

                  {/* =========================================================
                      COLUMNA DERECHA: IMAGEN DE PRODUCTO HEROICA
                  ========================================================= */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                    
                    {/* Ethereal Ambient Radial Glow */}
                    <div className="absolute w-64 h-64 sm:w-80 sm:h-80 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.25)_0%,transparent_70%)] pointer-events-none" />

                    {/* Product Image con sombra de apoyo realista */}
                    <img
                      src={slide.productImage}
                      alt={slide.productAlt}
                      referrerPolicy="no-referrer"
                      className="w-auto max-w-full h-auto max-h-[240px] sm:max-h-[280px] lg:max-h-[320px] object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.8)] transition-transform duration-700 group-hover/carousel:scale-105 relative z-10"
                      loading="eager"
                    />

                    {/* Indicador sutil de certificación */}
                    <div className="mt-2.5 text-center text-[11px] font-mono tracking-wide text-sky-200/90 bg-black/40 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/15 shadow-xs relative z-10">
                      <span>Norma Técnica NTC 1335 · Grupo AkzoNobel</span>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          CONTROLES DE NAVEGACIÓN: FLECHAS LATERALES (< y >)
      ===================================================================== */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Diapositiva anterior"
        className="hero-nav-btn hero-nav-btn-prev absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white border border-white/15 backdrop-blur-md shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 sm:opacity-0 group-hover/carousel:opacity-100"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Diapositiva siguiente"
        className="hero-nav-btn hero-nav-btn-next absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white border border-white/15 backdrop-blur-md shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 sm:opacity-0 group-hover/carousel:opacity-100"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* =====================================================================
          INDICADORES INFERIORES: PUNTOS/BARRAS DISCRETAS Y ELEGANTES
      ===================================================================== */}
      <div className="hero-indicators absolute bottom-4 inset-x-0 z-20 flex items-center justify-center gap-2">
        {SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Ir a diapositiva ${index + 1}: ${slide.titleHighlight}`}
              aria-current={isActive ? 'true' : 'false'}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                isActive 
                  ? 'w-8 bg-cyan-400 shadow-sm shadow-cyan-400/50' 
                  : 'w-2 bg-white/25 hover:bg-white/60'
              }`}
            />
          );
        })}
      </div>

    </div>
  );
};

export default HeroCarousel;
