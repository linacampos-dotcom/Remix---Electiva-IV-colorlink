import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, X } from 'lucide-react';
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

const BUTTON_SIZE = 84; // 84px de diámetro para el avatar
const PADDING = 12;

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

  // Posición arrastrable en pantalla (inferior derecha o restaurada de localStorage)
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('colorlink_ai_chat_btn_pos');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            const safeX = Math.min(Math.max(PADDING, parsed.x), window.innerWidth - BUTTON_SIZE - PADDING);
            const safeY = Math.min(Math.max(PADDING, parsed.y), window.innerHeight - BUTTON_SIZE - PADDING);
            return { x: safeX, y: safeY };
          }
        }
      } catch {}
      return {
        x: Math.max(PADDING, window.innerWidth - BUTTON_SIZE - 24),
        y: Math.max(PADDING, window.innerHeight - BUTTON_SIZE - 32),
      };
    }
    return { x: 300, y: 500 };
  });

  const [isDragging, setIsDragging] = useState(false);
  // En reposo (página quieta): el widget está visible (isTucked = false)
  const [isTucked, setIsTucked] = useState(false);
  // En reposo: la burbuja "¿Puedo ayudarte?" está expandida
  const [showBubble, setShowBubble] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  const [activeRibbons, setActiveRibbons] = useState<BrushstrokeRibbon[]>([]);
  const [isPainting, setIsPainting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const paintingResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ribbonIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const dragInfoRef = useRef<{
    isPointerDown: boolean;
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
    hasMoved: boolean;
    pointerId: number | null;
  }>({
    isPointerDown: false,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    hasMoved: false,
    pointerId: null,
  });

  // Re-ajustar posición en caso de redimensionamiento de ventana
  useEffect(() => {
    const handleResize = () => {
      setPos((prev) => {
        const safeX = Math.min(Math.max(PADDING, prev.x), window.innerWidth - BUTTON_SIZE - PADDING);
        const safeY = Math.min(Math.max(PADDING, prev.y), window.innerHeight - BUTTON_SIZE - PADDING);
        return { x: safeX, y: safeY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para disparar la animación de brochazo de pintura
  const triggerBrushRibbon = useCallback(() => {
    const ribbon: BrushstrokeRibbon = { id: Date.now() + Math.random() };
    setActiveRibbons((prev) => [...prev.slice(-1), ribbon]);
    setTimeout(() => {
      setActiveRibbons((prev) => prev.filter((r) => r.id !== ribbon.id));
    }, 2200);
  }, []);

  // Entrada inicial suave al cargar la página
  useEffect(() => {
    const t = setTimeout(() => {
      setHasEntered(true);
      setIsPainting(true);
      triggerBrushRibbon();

      paintingResetTimerRef.current = setTimeout(() => {
        setIsPainting(false);
      }, 1600);
    }, 200);

    return () => {
      clearTimeout(t);
      if (paintingResetTimerRef.current) clearTimeout(paintingResetTimerRef.current);
      if (ribbonIntervalRef.current) clearInterval(ribbonIntervalRef.current);
    };
  }, [triggerBrushRibbon]);

  // =========================================================================
  // LÓGICA DE SCROLL Y REPOSO:
  // - AL HACER SCROLL: El widget se desliza y oculta hacia el lateral suavemente
  //   para no estorbar la lectura del usuario.
  // - PÁGINA QUIETA (IDLE): Al detenerse el scroll (~250ms), el widget vuelve
  //   a mostrarse, saliendo desde el lateral y expandiendo "¿Puedo ayudarte?".
  // =========================================================================
  useEffect(() => {
    const handleScroll = () => {
      // Si el usuario está arrastrando el botón manualmente, ignorar scroll
      if (dragInfoRef.current.isPointerDown) return;

      if (scrollDebounceTimerRef.current) clearTimeout(scrollDebounceTimerRef.current);

      // 1. Durante el scroll: se desliza y oculta hacia el lateral inmediatamente
      setIsTucked(true);
      setShowBubble(false);
      setIsPainting(false);

      // 2. Al detenerse el movimiento de scroll (página quieta): vuelve a aparecer
      scrollDebounceTimerRef.current = setTimeout(() => {
        if (!dragInfoRef.current.isPointerDown) {
          setIsTucked(false);
          setShowBubble(true);
          setIsPainting(true);
          triggerBrushRibbon();

          if (paintingResetTimerRef.current) clearTimeout(paintingResetTimerRef.current);
          paintingResetTimerRef.current = setTimeout(() => {
            setIsPainting(false);
          }, 1600);
        }
      }, 250);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      if (scrollDebounceTimerRef.current) clearTimeout(scrollDebounceTimerRef.current);
      if (paintingResetTimerRef.current) clearTimeout(paintingResetTimerRef.current);
    };
  }, [triggerBrushRibbon]);

  // Brochazo periódico sutil en reposo
  useEffect(() => {
    if (!isDragging && !isTucked) {
      ribbonIntervalRef.current = setInterval(() => {
        setIsPainting(true);
        triggerBrushRibbon();
        setTimeout(() => {
          setIsPainting(false);
        }, 1600);
      }, 18000);
    }
    return () => {
      if (ribbonIntervalRef.current) clearInterval(ribbonIntervalRef.current);
    };
  }, [isDragging, isTucked, triggerBrushRibbon]);

  // =========================================================================
  // EFECTO HOVER:
  // - Al pasar el cursor, activa el balanceo (swing) y mantiene visible el mensaje.
  // =========================================================================
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!isDragging) {
      setIsTucked(false);
      setShowBubble(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // =========================================================================
  // FUNCIONALIDAD DRAGGABLE (ARRASTRABLE CON MOUSE O TOUCH)
  // =========================================================================
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Si se hizo clic en el botón de cerrar de la burbuja, omitir arrastre
    if ((e.target as HTMLElement).closest('[data-bubble-dismiss]')) {
      return;
    }

    setIsTucked(false);

    dragInfoRef.current = {
      isPointerDown: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
      hasMoved: false,
      pointerId: e.pointerId,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfoRef.current.isPointerDown) return;

    const dx = e.clientX - dragInfoRef.current.startX;
    const dy = e.clientY - dragInfoRef.current.startY;
    const distance = Math.hypot(dx, dy);

    if (distance > 5) {
      if (!dragInfoRef.current.hasMoved) {
        dragInfoRef.current.hasMoved = true;
        setIsDragging(true);
        setShowBubble(false);
      }

      const rawX = dragInfoRef.current.startPosX + dx;
      const rawY = dragInfoRef.current.startPosY + dy;

      const safeX = Math.min(Math.max(PADDING, rawX), window.innerWidth - BUTTON_SIZE - PADDING);
      const safeY = Math.min(Math.max(PADDING, rawY), window.innerHeight - BUTTON_SIZE - PADDING);

      setPos({ x: safeX, y: safeY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragInfoRef.current.isPointerDown) return;

    const wasMoved = dragInfoRef.current.hasMoved;

    if (dragInfoRef.current.pointerId !== null) {
      try {
        e.currentTarget.releasePointerCapture(dragInfoRef.current.pointerId);
      } catch {}
    }

    dragInfoRef.current.isPointerDown = false;
    dragInfoRef.current.pointerId = null;
    setIsDragging(false);

    if (wasMoved) {
      try {
        localStorage.setItem('colorlink_ai_chat_btn_pos', JSON.stringify(pos));
      } catch {}
      setShowBubble(true);
    } else {
      // Clic normal sin arrastrar: abre el Asesor IA
      onClick();
    }
  };

  if (isOpen || isIntranetOrCorporate) {
    return null;
  }

  // Determinar si está orientado hacia el borde izquierdo o derecho de la pantalla
  const isNearLeft = typeof window !== 'undefined' ? pos.x < window.innerWidth / 2 : false;

  // Desplazamiento lateral al hacer scroll (se desliza hacia afuera para despejar)
  const tuckDistance = BUTTON_SIZE + 24;
  const currentTranslateX = isDragging ? 0 : isTucked ? (isNearLeft ? -tuckDistance : tuckDistance) : 0;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: `${BUTTON_SIZE}px`,
        height: `${BUTTON_SIZE}px`,
        zIndex: 9999,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
        opacity: hasEntered ? (isTucked ? 0 : 1) : 0,
        transform: `translate3d(${currentTranslateX}px, 0, 0) scale(${
          isDragging ? 1.05 : isTucked ? 0.85 : 1
        })`,
        pointerEvents: isTucked ? 'none' : 'auto',
        transition: isDragging
          ? 'none'
          : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease',
      }}
      className="touch-none select-none flex items-center justify-center group"
      title="Asesor Técnico IA ColorLink • Clic para consultar o arrastra para reubicar"
    >
      {/* =========================================================================
          GLOBO DE MENSAJE FLOTANTE: "¿Puedo ayudarte?"
          - Visible en reposo (página quieta)
          - No estorba en scroll (se oculta junto al avatar)
      ========================================================================= */}
      {showBubble && !isDragging && !isTucked && (
        <div
          data-chat-bubble
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`absolute pointer-events-auto cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md text-slate-800 border border-sky-200/90 shadow-xl shadow-blue-900/20 transition-all duration-300 animate-bubble-in hover:scale-105 z-40 ${
            isNearLeft
              ? 'left-[100%] ml-2.5 top-1/2 -translate-y-1/2'
              : 'right-[100%] mr-2.5 top-1/2 -translate-y-1/2'
          }`}
          title="Clic para abrir el Asesor Técnico Virtual"
        >
          {/* Indicador de estado online verde */}
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>

          <span className="text-xs font-black tracking-tight text-[#002244] whitespace-nowrap">
            ¿Puedo ayudarte?
          </span>

          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />

          {/* Botón manual para cerrar la burbuja si se desea */}
          <button
            type="button"
            data-bubble-dismiss="true"
            onClick={(e) => {
              e.stopPropagation();
              setShowBubble(false);
            }}
            className="w-4 h-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center text-[10px] ml-0.5 transition-colors cursor-pointer"
            title="Cerrar mensaje"
          >
            <X className="w-2.5 h-2.5" />
          </button>

          {/* Flecha indicadora hacia el avatar */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white/95 border-sky-200/90 rotate-45 ${
              isNearLeft
                ? '-left-1.5 border-l border-b'
                : '-right-1.5 border-r border-t'
            }`}
            aria-hidden="true"
          />
        </div>
      )}

      {/* =========================================================================
          ANIMACIÓN DE BROCHAZO DE PINTURA (SVG DETRÁS DEL PERSONAJE)
      ========================================================================= */}
      {!isDragging && !isTucked && (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-0 flex items-center justify-center">
          {activeRibbons.map((ribbon) => (
            <svg
              key={ribbon.id}
              className="absolute w-36 h-36 pointer-events-none overflow-visible select-none"
              viewBox="0 0 180 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
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
                <path
                  d="M 34,122 C 64,117 92,78 146,38"
                  stroke={`url(#brushGradContained-${ribbon.id})`}
                  strokeWidth="32"
                  strokeLinecap="round"
                  className="brushstroke-path-contained"
                />
                <path
                  d="M 38,116 C 68,111 94,72 148,32"
                  stroke="#E0F2FE"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeOpacity="0.9"
                  className="brushstroke-path-contained"
                  style={{ animationDelay: '0.02s' }}
                />
                <path
                  d="M 35,119 C 65,114 91,75 145,35"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeOpacity="0.85"
                  className="brushstroke-path-contained"
                  style={{ animationDelay: '0.04s' }}
                />
                <circle
                  cx="152"
                  cy="30"
                  r="2.2"
                  fill="#003366"
                  className="brushstroke-path-contained"
                  style={{ animationDelay: '0.06s' }}
                />
              </g>
            </svg>
          ))}
        </div>
      )}

      {/* =========================================================================
          BOTÓN DEL PERSONAJE: SILUETA LIMPIA CON BALANCEO (SWING) EN HOVER
          - Sin botones extraños ni controles sobrepuestos
      ========================================================================= */}
      <div
        className={`relative z-10 w-full h-full rounded-full flex items-center justify-center transition-all duration-300 ${
          isDragging
            ? 'scale-105 shadow-2xl ring-4 ring-[#004B93]/30'
            : isHovered
            ? 'animate-character-swing'
            : isPainting && !isTucked
            ? 'animate-paint-brushstroke'
            : ''
        }`}
      >
        <div
          className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center relative transition-shadow duration-300 ${
            isHovered || isDragging
              ? 'shadow-2xl shadow-blue-900/40'
              : 'shadow-xl shadow-blue-950/25'
          }`}
        >
          <img
            src={PINTUCO_AI_AVATAR_URL}
            alt="Asesor Técnico IA ColorLink"
            className="w-full h-full object-contain pointer-events-none select-none filter drop-shadow-[0_8px_14px_rgba(0,34,68,0.3)] transition-transform duration-300"
            loading="eager"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
};
