import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { checkIsIntranetRoute } from '../utils/safeNavigation';

// Imagen oficial con transparencia real del personaje Asesor Técnico IA ColorLink
export const PINTUCO_AI_AVATAR_URL = '/images/pintuco_character_clean.png';

interface DraggableAIChatButtonProps {
  onClick: () => void;
  isOpen?: boolean;
  isCorporateView?: boolean;
  currentTab?: string;
  hideOnIntranet?: boolean;
}

interface BrushstrokeRibbon {
  id: number;
}

export const DraggableAIChatButton: React.FC<DraggableAIChatButtonProps> = ({
  onClick,
  isOpen = false,
  isCorporateView = false,
  currentTab = '',
  hideOnIntranet = false,
}) => {
  // Verificación de ruta protegida (oculta el asistente en la intranet corporativa)
  const isIntranetOrCorporate = useMemo(() => {
    if (hideOnIntranet || isCorporateView || currentTab === 'admin' || currentTab === 'intranet') {
      return true;
    }
    try {
      return checkIsIntranetRoute({
        isCorporateSession: isCorporateView,
        activeTab: currentTab,
      });
    } catch (err) {
      console.warn('Inspección de ruta protegida en DraggableAIChatButton:', err);
      return false;
    }
  }, [hideOnIntranet, isCorporateView, currentTab]);

  if (isOpen || isIntranetOrCorporate) {
    return null;
  }

  // Estados de desplazamiento (Scroll) y Reaparición Automática
  const [isScrolling, setIsScrolling] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [activeRibbons, setActiveRibbons] = useState<BrushstrokeRibbon[]>([]);
  const [isPainting, setIsPainting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const brushstrokeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleShowTimerRef = useRef<NodeJS.Timeout | null>(null);
  const paintingResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ribbonIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para disparar la animación de brochazo de pintura (SVG detrás del personaje)
  const triggerBrushRibbon = useCallback(() => {
    const ribbon: BrushstrokeRibbon = { id: Date.now() + Math.random() };
    setActiveRibbons((prev) => [...prev.slice(-1), ribbon]);
    setTimeout(() => {
      setActiveRibbons((prev) => prev.filter((r) => r.id !== ribbon.id));
    }, 2200);
  }, []);

  // 1. Entrada inicial secuencial al cargar la aplicación:
  // Paso 1: Reaparición -> Paso 2: Brochazo -> Paso 3: Mensaje "¿Puedo ayudarte?"
  useEffect(() => {
    const tEntry = setTimeout(() => {
      setHasEntered(true);
      setIsScrolling(false);

      // Paso 2: El brochazo aparece justo después de que el personaje se asienta
      brushstrokeTimerRef.current = setTimeout(() => {
        setIsPainting(true);
        triggerBrushRibbon();

        // Paso 3: Inmediatamente después del brochazo, se muestra el mensaje
        bubbleShowTimerRef.current = setTimeout(() => {
          setShowBubble(true);
        }, 750);

        paintingResetTimerRef.current = setTimeout(() => {
          setIsPainting(false);
        }, 1800);
      }, 440);
    }, 200);

    return () => {
      clearTimeout(tEntry);
      if (brushstrokeTimerRef.current) clearTimeout(brushstrokeTimerRef.current);
      if (bubbleShowTimerRef.current) clearTimeout(bubbleShowTimerRef.current);
      if (paintingResetTimerRef.current) clearTimeout(paintingResetTimerRef.current);
    };
  }, [triggerBrushRibbon]);

  // 2. COMPORTAMIENTO DE SCROLL Y REAPARICIÓN SECUENCIAL (3 PASOS):
  // - Durante el scroll: el asistente se oculta hacia el borde lateral derecho.
  // - Al detenerse el scroll:
  //   * PASO 1: El asistente reaparece por completo en la pantalla de forma fluida.
  //   * PASO 2: Justo después de reaparecer por completo, aparece el brochazo ancho de pintura (de claro a oscuro).
  //   * PASO 3: Inmediatamente después del brochazo, se muestra el mensaje flotante "¿Puedo ayudarte?".
  useEffect(() => {
    const handleScroll = () => {
      // Durante el desplazamiento activo: ocultar inmediatamente hacia el borde derecho
      setIsScrolling(true);
      setShowBubble(false);
      setIsPainting(false);
      setActiveRibbons([]);

      // Limpiar temporizadores en curso
      if (scrollDebounceTimerRef.current) clearTimeout(scrollDebounceTimerRef.current);
      if (brushstrokeTimerRef.current) clearTimeout(brushstrokeTimerRef.current);
      if (bubbleShowTimerRef.current) clearTimeout(bubbleShowTimerRef.current);
      if (paintingResetTimerRef.current) clearTimeout(paintingResetTimerRef.current);

      // Al detenerse el scroll (detección debounce ~380ms)
      scrollDebounceTimerRef.current = setTimeout(() => {
        // PASO 1: El asistente reaparece por completo en la pantalla (desplazamiento de 420ms)
        setIsScrolling(false);

        // PASO 2: El brochazo de pintura aparece SECUENCIALMENTE JUSTO DESPUÉS
        // de que el asistente ha reaparecido por completo en su posición final
        brushstrokeTimerRef.current = setTimeout(() => {
          setIsPainting(true);
          triggerBrushRibbon();

          // PASO 3: INMEDIATAMENTE DESPUÉS del brochazo (duración del trazo ~750ms),
          // se muestra el mensaje flotante "¿Puedo ayudarte?"
          bubbleShowTimerRef.current = setTimeout(() => {
            setShowBubble(true);
          }, 750);

          // Calmar el movimiento del personaje tras concluir la demostración
          paintingResetTimerRef.current = setTimeout(() => {
            setIsPainting(false);
          }, 1800);
        }, 440); // 440ms garantiza que la transición de llegada ha finalizado al 100%
      }, 380);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      if (scrollDebounceTimerRef.current) clearTimeout(scrollDebounceTimerRef.current);
      if (brushstrokeTimerRef.current) clearTimeout(brushstrokeTimerRef.current);
      if (bubbleShowTimerRef.current) clearTimeout(bubbleShowTimerRef.current);
      if (paintingResetTimerRef.current) clearTimeout(paintingResetTimerRef.current);
    };
  }, [triggerBrushRibbon]);

  // Ciclo periódico del brochazo en estado de reposo para mantener vitalidad visual
  useEffect(() => {
    if (!isScrolling) {
      ribbonIntervalRef.current = setInterval(() => {
        setIsPainting(true);
        triggerBrushRibbon();
        setTimeout(() => {
          setIsPainting(false);
        }, 1800);
      }, 7500);
    } else {
      if (ribbonIntervalRef.current) clearInterval(ribbonIntervalRef.current);
    }

    return () => {
      if (ribbonIntervalRef.current) clearInterval(ribbonIntervalRef.current);
    };
  }, [isScrolling, triggerBrushRibbon]);

  // Manejo de clic para abrir el chat
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  // Posición fija anclada a la esquina inferior derecha
  // Mientras se desplaza (isScrolling): se oculta desplazándose hacia el borde lateral derecho (translate3d)
  // Al detenerse el scroll: vuelve automáticamente a la pantalla (-24px)
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: 0,
    zIndex: 50,
    transform: isScrolling 
      ? 'translate3d(calc(100% + 24px), 0, 0)' 
      : 'translate3d(-24px, 0, 0)',
    opacity: isScrolling ? 0 : 1,
    transition: 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s ease',
    pointerEvents: isScrolling ? 'none' : 'auto',
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={`select-none flex items-center justify-end touch-none pointer-events-auto overflow-visible ${
        hasEntered ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* =========================================================================
          GLOBO DE MENSAJE FLOTANTE: "¿Puedo ayudarte?"
          - Ubicado a la izquierda del avatar
          - Se muestra INMEDIATAMENTE DESPUÉS del brochazo de pintura
          - Incluye indicador de estado online y diseño corporativo
      ========================================================================= */}
      <div
        onClick={handleActionClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`cursor-pointer mr-3 hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md text-slate-800 border border-sky-200/90 shadow-lg shadow-blue-900/15 transition-all duration-300 transform relative z-20 ${
          showBubble && !isScrolling
            ? 'opacity-100 scale-100 translate-x-0 ai-bubble-float animate-bubble-in hover:scale-105'
            : 'opacity-0 scale-90 translate-x-4 pointer-events-none'
        }`}
        title="Clic para abrir el Asesor Técnico Virtual"
      >
        {/* Indicador de estado activo (pinging green / teal dot) */}
        <span className="flex h-2.5 w-2.5 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>

        {/* Texto oficial */}
        <span className="text-xs font-black tracking-tight text-[#002244] whitespace-nowrap">
          ¿Puedo ayudarte?
        </span>

        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />

        {/* Flecha orientadora hacia la silueta del personaje */}
        <div
          className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white/95 border-r border-t border-sky-200/90 rotate-45"
          aria-hidden="true"
        />
      </div>

      {/* =========================================================================
          CONTENEDOR DE LA SILUETA DEL PERSONAJE Y ANIMACIÓN DE BROCHAZO
      ========================================================================= */}
      <div className="relative flex items-center justify-center">

        {/* =========================================================================
            TRAZO DE BROCHAZO DE PINTURA CONTENIDO Y ARMÓNICO (SVG DETRÁS DEL PERSONAJE)
            - Dimensiones y largo ajustados para situarse justo detrás de la figura
            - Transición progresiva de claro a oscuro (de cyan/hielo luminoso a azul marino Pintuco)
            - Grosor consistente y orgánico
        ========================================================================= */}
        {!isScrolling && (
          <div className="absolute inset-0 pointer-events-none overflow-visible z-0 flex items-center justify-center">
            {activeRibbons.map((ribbon) => (
              <svg
                key={ribbon.id}
                className="absolute w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 pointer-events-none overflow-visible select-none"
                viewBox="0 0 180 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Gradiente progresivo: de claro (cyan/hielo luminoso) a oscuro (azul marino Pintuco institucional) */}
                  <linearGradient
                    id={`brushGradContained-${ribbon.id}`}
                    x1="34"
                    y1="122"
                    x2="146"
                    y2="38"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#F0F9FF" stopOpacity="0.95" />
                    <stop offset="16%" stopColor="#7DD3FC" stopOpacity="0.95" />
                    <stop offset="38%" stopColor="#00D4B2" stopOpacity="0.95" />
                    <stop offset="62%" stopColor="#0284C7" stopOpacity="0.95" />
                    <stop offset="84%" stopColor="#003366" stopOpacity="0.98" />
                    <stop offset="100%" stopColor="#001838" stopOpacity="0.98" />
                  </linearGradient>

                  <filter
                    id={`ribbonShadowContained-${ribbon.id}`}
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="3"
                      stdDeviation="3.5"
                      floodColor="#002244"
                      floodOpacity="0.3"
                    />
                  </filter>
                </defs>

                <g filter={`url(#ribbonShadowContained-${ribbon.id})`}>
                  {/* 1. Halo difuminado de pintura fresca húmeda */}
                  <path
                    d="M 34,122 C 64,117 92,78 146,38"
                    stroke={`url(#brushGradContained-${ribbon.id})`}
                    strokeWidth="40"
                    strokeOpacity="0.22"
                    strokeLinecap="round"
                    className="brushstroke-path-contained"
                  />

                  {/* 2. Trazo principal armónico de pintura detrás de la figura */}
                  <path
                    d="M 34,122 C 64,117 92,78 146,38"
                    stroke={`url(#brushGradContained-${ribbon.id})`}
                    strokeWidth="30"
                    strokeLinecap="round"
                    className="brushstroke-path-contained"
                  />

                  {/* 3. Veta de cerda superior (acabado claro luminoso de la brocha) */}
                  <path
                    d="M 38,116 C 68,111 94,72 148,32"
                    stroke="#E0F2FE"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeOpacity="0.9"
                    className="brushstroke-path-contained"
                    style={{ animationDelay: '0.02s' }}
                  />

                  {/* 4. Veta intermedia turquesa ColorLink */}
                  <path
                    d="M 35,119 C 65,114 91,75 145,35"
                    stroke="#38BDF8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeOpacity="0.85"
                    className="brushstroke-path-contained"
                    style={{ animationDelay: '0.04s' }}
                  />

                  {/* 5. Veta inferior sombra de cerda (azul marino Pintuco) */}
                  <path
                    d="M 30,128 C 60,123 88,84 142,44"
                    stroke="#002244"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeOpacity="0.85"
                    className="brushstroke-path-contained"
                    style={{ animationDelay: '0.03s' }}
                  />

                  {/* 6. Gotas sutiles de pintura fresca */}
                  <circle
                    cx="152"
                    cy="30"
                    r="2.2"
                    fill="#003366"
                    className="brushstroke-path-contained"
                    style={{ animationDelay: '0.06s' }}
                  />
                  <circle
                    cx="28"
                    cy="128"
                    r="2"
                    fill="#7DD3FC"
                    className="brushstroke-path-contained"
                    style={{ animationDelay: '0.08s' }}
                  />
                </g>
              </svg>
            ))}
          </div>
        )}

        {/* =========================================================================
            BOTÓN DEL PERSONAJE: SILUETA CIRCULAR LIMPIA Y RESPUESTA HOVER FLUIDA
            - Al pasar el cursor (hover): balanceo e inclinación fluida interactiva
            - En reposo tras reaparición: animación de pintar (.animate-paint-brushstroke)
            - Libre de marcos cuadrados o bordes adicionales
        ========================================================================= */}
        <button
          type="button"
          onClick={handleActionClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative z-10 w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-full p-0 bg-transparent border-0 outline-none focus:outline-none cursor-pointer flex items-center justify-center transition-all duration-300 ${
            isHovered
              ? 'animate-character-hover'
              : (!isScrolling && isPainting ? 'animate-paint-brushstroke' : '')
          }`}
          aria-label="Asistente Virtual Pintuco / ColorLink. ¿Puedo ayudarte?"
          title="Asistente Virtual ColorLink • Clic para consultar"
        >
          {/* Silueta circular pura del personaje con transparencia real */}
          <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center relative transition-shadow duration-300 ${
            isHovered ? 'shadow-2xl shadow-blue-900/40' : 'shadow-xl shadow-blue-950/25'
          }`}>
            <img
              src={PINTUCO_AI_AVATAR_URL}
              alt="Asesor Técnico IA ColorLink"
              className="w-full h-full object-contain pointer-events-none select-none filter drop-shadow-[0_8px_14px_rgba(0,34,68,0.3)] transition-transform duration-300"
              loading="eager"
              draggable={false}
            />
          </div>
        </button>

      </div>
    </div>
  );
};
