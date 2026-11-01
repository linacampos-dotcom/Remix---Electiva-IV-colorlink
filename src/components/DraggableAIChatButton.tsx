import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, GripVertical, Bot } from 'lucide-react';
import { checkIsIntranetRoute } from '../utils/safeNavigation';

interface DraggableAIChatButtonProps {
  onClick: () => void;
  isOpen?: boolean;
  isCorporateView?: boolean;
  currentTab?: string;
  hideOnIntranet?: boolean;
}

export const DraggableAIChatButton: React.FC<DraggableAIChatButtonProps> = ({
  onClick,
  isOpen = false,
  isCorporateView = false,
  currentTab = '',
  hideOnIntranet = false,
}) => {
  // Verificación ultra segura de ruta y entorno (try/catch y typeof window guard)
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
      // Bloque seguro de respaldo: evitar cualquier ruptura de renderizado
      console.warn('Inspección de ruta protegida en DraggableAIChatButton:', err);
      return false;
    }
  }, [hideOnIntranet, isCorporateView, currentTab]);

  if (isOpen || isIntranetOrCorporate) {
    return null;
  }

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const hasMovedRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Escucha activa de Scroll con debouncing de 1.5 segundos para reaparición
  useEffect(() => {
    const handleScroll = () => {
      // Al iniciar scroll: colapsar inmediatamente a modo icono discreto
      setIsScrolling(true);

      // Limpiar temporizador previo
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Al cesar el scroll por más de 1.5s: restaurar automáticamente a tamaño completo
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 1500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Manejo de Drag & Drop por PointerEvents (compatible con ratón y pantallas táctiles)
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Solo click principal
    if (e.button !== 0) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    isDraggingRef.current = true;
    setIsDragging(true);
    hasMovedRef.current = false;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.left,
      initialY: rect.top,
    };

    try {
      button.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      hasMovedRef.current = true;
    }

    const button = buttonRef.current;
    const btnWidth = button ? button.offsetWidth : 160;
    const btnHeight = button ? button.offsetHeight : 48;

    const newX = Math.max(12, Math.min(window.innerWidth - btnWidth - 12, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(12, Math.min(window.innerHeight - btnHeight - 12, dragStartRef.current.initialY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    try {
      buttonRef.current?.releasePointerCapture(e.pointerId);
    } catch {}

    // Si no hubo arrastre real, ejecutar la acción de apertura del chat
    if (!hasMovedRef.current) {
      onClick();
    }
  };

  // Mantener dentro del viewport en caso de redimensionamiento de ventana
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return null;
        const btnWidth = buttonRef.current ? buttonRef.current.offsetWidth : 160;
        const btnHeight = buttonRef.current ? buttonRef.current.offsetHeight : 48;
        return {
          x: Math.max(12, Math.min(window.innerWidth - btnWidth - 12, prev.x)),
          y: Math.max(12, Math.min(window.innerHeight - btnHeight - 12, prev.y)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determinar si debe mostrarse colapsado (en scroll activo y sin interacción directa)
  const isCollapsed = isScrolling && !isHovered && !isDragging;

  const style: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 50,
      }
    : {
        position: 'fixed',
        bottom: '24px',
        right: isCollapsed ? '12px' : '24px',
        zIndex: 50,
      };

  return (
    <button
      ref={buttonRef}
      type="button"
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 hover:from-blue-800 hover:to-sky-700 text-white shadow-xl shadow-sky-500/40 hover:shadow-sky-400/60 ring-2 ring-sky-400/50 flex items-center justify-center font-bold text-xs active:scale-95 transition-all duration-300 ease-out border-2 border-white/30 group touch-none select-none ${
        isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab hover:scale-105'
      } ${
        isCollapsed
          ? 'w-12 h-12 rounded-full p-0 shadow-lg'
          : 'px-4 py-3 rounded-full gap-2.5 shadow-xl'
      }`}
      aria-label="Asistente Virtual IA Pintuco (Arrastra para mover)"
      title={
        isCollapsed
          ? 'Asistente IA Pintuco (Clic para consultar o arrastra para mover)'
          : 'Asistente Virtual IA Pintuco • Arrastra para reubicar libremente'
      }
    >
      {/* Icono de arrastre visible solo en modo expandido */}
      {!isCollapsed && (
        <GripVertical className="w-3.5 h-3.5 text-cyan-200/70 group-hover:text-cyan-200 shrink-0" />
      )}

      {/* Punto de estado activo con animación de pulso */}
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
      </span>

      {/* Icono principal de IA (Sparkles / Bot) */}
      <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse group-hover:rotate-12 transition-transform shrink-0" />

      {/* Modo colapsado: mini etiqueta IA para discreción */}
      {isCollapsed ? (
        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-200 ml-0.5">
          IA
        </span>
      ) : (
        /* Modo expandido: texto completo */
        <span className="font-extrabold tracking-tight hidden sm:inline whitespace-nowrap animate-fadeIn">
          Asistente IA Pintuco
        </span>
      )}
    </button>
  );
};
