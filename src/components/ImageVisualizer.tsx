import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Eye, Sparkles, Check, ShieldCheck } from 'lucide-react';

export interface ExclusionZone {
  type: 'window' | 'door' | 'roof' | 'vegetation' | 'floor' | 'railing' | 'stone_trim' | 'baseboard' | string;
  polygon: [number, number][]; // Coordenadas porcentuales [x, y] de 0 a 100
}

export interface WallSegmentationData {
  surfaceType: string;
  textureType: string;
  wallPolygons: [number, number][][]; // Coordenadas porcentuales [x, y] de 0 a 100
  exclusionZones: ExclusionZone[];
}

export interface SimulationColor {
  name: string;
  code: string;
  hex: string;
}

export interface ImageVisualizerProps {
  imageUrl: string;
  selectedColor: SimulationColor;
  showOriginal?: boolean;
  surfaceType?: string;
  className?: string;
  onSimulationRendered?: (simulatedDataUrl: string) => void;
  onToggleOriginal?: () => void;
}

// Caché en memoria para no repetir la llamada de segmentación si solo cambia de color
const segmentationCache = new Map<string, WallSegmentationData>();

// Función auxiliar para parsear color hexadecimal a RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export const ImageVisualizer: React.FC<ImageVisualizerProps> = ({
  imageUrl,
  selectedColor,
  showOriginal = false,
  surfaceType = 'fachada',
  className = '',
  onSimulationRendered,
  onToggleOriginal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [segmentationData, setSegmentationData] = useState<WallSegmentationData | null>(null);
  const [simulatedDataUrl, setSimulatedDataUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [localShowOriginal, setLocalShowOriginal] = useState<boolean>(showOriginal);

  // Mantener sincronizado el estado de mostrar original
  useEffect(() => {
    setLocalShowOriginal(showOriginal);
  }, [showOriginal]);

  // Paso 1: Obtener la máscara de segmentación desde el API o la caché
  useEffect(() => {
    let isCancelled = false;

    async function fetchSegmentation() {
      if (!imageUrl) return;

      // Si ya está en caché, usar de inmediato
      const cached = segmentationCache.get(imageUrl);
      if (cached) {
        setSegmentationData(cached);
        setIsAnalyzing(false);
        return;
      }

      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/ai/segment-walls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            surfaceTypeHint: surfaceType,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const json = await response.json();
        if (!isCancelled && json.success && json.data) {
          segmentationCache.set(imageUrl, json.data);
          setSegmentationData(json.data);
        }
      } catch (err) {
        console.warn('Error en segmentación remota, usando máscara arquitectónica por defecto:', err);
        // Fallback robusto en cliente si hay corte de red
        const fallback: WallSegmentationData = {
          surfaceType: surfaceType || 'fachada',
          textureType: 'estuco',
          wallPolygons: [
            [[6, 22], [94, 20], [93, 86], [7, 88]],
          ],
          exclusionZones: [
            { type: 'roof', polygon: [[0, 0], [100, 0], [96, 22], [4, 24]] },
            { type: 'window', polygon: [[16, 28], [38, 28], [38, 56], [16, 56]] },
            { type: 'shutters', polygon: [[12, 28], [16, 28], [16, 56], [12, 56]] },
            { type: 'shutters', polygon: [[38, 28], [42, 28], [42, 56], [38, 56]] },
            { type: 'window', polygon: [[62, 28], [84, 28], [84, 56], [62, 56]] },
            { type: 'shutters', polygon: [[58, 28], [62, 28], [62, 56], [58, 56]] },
            { type: 'shutters', polygon: [[84, 28], [88, 28], [88, 56], [84, 56]] },
            { type: 'door', polygon: [[42, 58], [58, 58], [58, 87], [42, 87]] },
            { type: 'railing', polygon: [[14, 54], [40, 54], [40, 62], [14, 62]] },
            { type: 'railing', polygon: [[60, 54], [86, 54], [86, 62], [60, 62]] },
            { type: 'vegetation', polygon: [[6, 68], [18, 65], [18, 88], [6, 88]] },
            { type: 'vegetation', polygon: [[82, 68], [94, 64], [94, 86], [82, 86]] },
            { type: 'stone_trim', polygon: [[0, 85], [100, 85], [100, 92], [0, 92]] },
            { type: 'floor', polygon: [[0, 92], [100, 92], [100, 100], [0, 100]] },
          ],
        };
        if (!isCancelled) {
          setSegmentationData(fallback);
        }
      } finally {
        if (!isCancelled) {
          setIsAnalyzing(false);
        }
      }
    }

    fetchSegmentation();

    return () => {
      isCancelled = true;
    };
  }, [imageUrl, surfaceType]);

  // Paso 2: Renderizado fotorrealista sobre Canvas con la máscara y luminancia real
  const renderSimulationCanvas = useCallback(async () => {
    if (!imageUrl || !segmentationData || isAnalyzing) return;

    setIsRendering(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('No se pudo cargar la imagen para simulación'));
        img.src = imageUrl;
      });

      // Dimensiones de trabajo optimizadas para rendimiento y fidelidad fotográfica
      const maxDim = 1200;
      let width = img.naturalWidth || img.width || 800;
      let height = img.naturalHeight || img.height || 600;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      // 1. Canvas de la imagen original
      const origCanvas = document.createElement('canvas');
      origCanvas.width = width;
      origCanvas.height = height;
      const origCtx = origCanvas.getContext('2d', { willReadFrequently: true });
      if (!origCtx) return;
      origCtx.drawImage(img, 0, 0, width, height);
      const origImageData = origCtx.getImageData(0, 0, width, height);
      const origData = origImageData.data;

      // 2. Canvas de la máscara de muros (Wall Segmentation Mask)
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
      if (!maskCtx) return;

      // Fondo transparente
      maskCtx.clearRect(0, 0, width, height);

      // Dibujar polígonos de muro (zonas pintables) en blanco sólido
      maskCtx.fillStyle = '#FFFFFF';
      maskCtx.beginPath();
      for (const poly of segmentationData.wallPolygons) {
        if (!poly || poly.length < 3) continue;
        maskCtx.moveTo((poly[0][0] / 100) * width, (poly[0][1] / 100) * height);
        for (let i = 1; i < poly.length; i++) {
          maskCtx.lineTo((poly[i][0] / 100) * width, (poly[i][1] / 100) * height);
        }
        maskCtx.closePath();
      }
      maskCtx.fill();

      // Recortar estrictamente todas las zonas excluidas (puertas, ventanas, techos, rejas, vegetación)
      maskCtx.globalCompositeOperation = 'destination-out';
      maskCtx.fillStyle = '#000000';
      if (Array.isArray(segmentationData.exclusionZones)) {
        for (const zone of segmentationData.exclusionZones) {
          if (!zone.polygon || zone.polygon.length < 3) continue;
          maskCtx.beginPath();
          maskCtx.moveTo((zone.polygon[0][0] / 100) * width, (zone.polygon[0][1] / 100) * height);
          for (let i = 1; i < zone.polygon.length; i++) {
            maskCtx.lineTo((zone.polygon[i][0] / 100) * width, (zone.polygon[i][1] / 100) * height);
          }
          maskCtx.closePath();
          maskCtx.fill();
        }
      }

      const maskImageData = maskCtx.getImageData(0, 0, width, height);
      const maskData = maskImageData.data;

      // 3. Canvas final con tintado por luminancia fotométrica
      const finalCanvas = canvasRef.current || document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = height;
      const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
      if (!finalCtx) return;

      const finalImageData = finalCtx.createImageData(width, height);
      const finalData = finalImageData.data;

      const targetRgb = hexToRgb(selectedColor.hex);
      const totalPixels = width * height;

      for (let i = 0; i < totalPixels; i++) {
        const offset = i * 4;
        const r = origData[offset];
        const g = origData[offset + 1];
        const b = origData[offset + 2];
        const a = origData[offset + 3];

        const maskAlpha = maskData[offset + 3] / 255;

        // Si el píxel está fuera de la máscara de pared, se mantiene 100% el píxel original intacto
        if (maskAlpha <= 0.02) {
          finalData[offset] = r;
          finalData[offset + 1] = g;
          finalData[offset + 2] = b;
          finalData[offset + 3] = a;
          continue;
        }

        // =========================================================================
        // PRESERVACIÓN ARQUITECTÓNICA DE MATERIALES INTELIGENTE (100% INTACTOS)
        // Salvaguarda: puertas de madera, persianas, ventanas, marcos, zócalos de piedra, rejas y vegetación
        // =========================================================================
        const pixelY = Math.floor(i / width);
        const yPct = pixelY / height;

        // 1. Zócalo de piedra / Baseboard (franja inferior o tonalidades de granito/piedra)
        const isStonePlinth = yPct > 0.85 || (yPct > 0.72 && Math.abs(r - g) < 14 && Math.abs(g - b) < 14 && r > 85 && r < 190);

        // 2. Puertas de madera y persianas (vetas cálidas de madera, tonalidades marrón/ámbar/caoba)
        const isWoodOrShutters = (r > 55 && r > g * 1.08 && g > b * 1.03 && (r - b) > 20) || (r > 90 && g > 50 && b < 60 && (r - b) > 40);

        // 3. Ventanas, vidrios, marcos y reflejos lumínicos
        const isWindowOrGlass = (r > 238 && g > 238 && b > 238) || (b > r * 1.15 && b > g * 1.05 && b > 75);

        // 4. Rejas de hierro, herrería y barandas oscuras
        const isIronworkOrRailing = (r < 45 && g < 45 && b < 45);

        // 5. Vegetación (follaje, plantas, enredaderas, flores)
        const isVegetation = (g > r * 1.14 && g > b * 1.10 && g > 38) || (g > 65 && g > r && g > b * 1.22);

        if (isStonePlinth || isWoodOrShutters || isWindowOrGlass || isIronworkOrRailing || isVegetation) {
          // Mantener 100% color, textura y acabado original del elemento arquitectónico
          finalData[offset] = r;
          finalData[offset + 1] = g;
          finalData[offset + 2] = b;
          finalData[offset + 3] = a;
          continue;
        }

        // =========================================================================
        // APLICACIÓN DE COLOR COLORLINK BASADA EN LUMINANCIA REAL
        // Preserva el relieve, textura rugosa y sombras originales de la foto
        // =========================================================================
        // Luminancia percibida (estándar ITU-R BT.601)
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const lumFactor = lum / 128; // 1.0 en tonos medios, < 1.0 en sombras, > 1.0 en luces

        // Cálculo del tinte pigmentario
        let tintR = targetRgb.r * lumFactor;
        let tintG = targetRgb.g * lumFactor;
        let tintB = targetRgb.b * lumFactor;

        // Conservar micro-textura y rugosidad original del muro (estuco/piedra)
        const textureRatio = 0.16;
        tintR = (1 - textureRatio) * tintR + textureRatio * r;
        tintG = (1 - textureRatio) * tintG + textureRatio * g;
        tintB = (1 - textureRatio) * tintB + textureRatio * b;

        // Normalizar rangos [0, 255]
        tintR = Math.min(255, Math.max(0, tintR));
        tintG = Math.min(255, Math.max(0, tintG));
        tintB = Math.min(255, Math.max(0, tintB));

        // Mezcla suave con el original en base a la máscara y opacidad natural de pintura (88%)
        const blendWeight = maskAlpha * 0.88;
        finalData[offset] = Math.round(r * (1 - blendWeight) + tintR * blendWeight);
        finalData[offset + 1] = Math.round(g * (1 - blendWeight) + tintG * blendWeight);
        finalData[offset + 2] = Math.round(b * (1 - blendWeight) + tintB * blendWeight);
        finalData[offset + 3] = a;
      }

      finalCtx.putImageData(finalImageData, 0, 0);

      const generatedDataUrl = finalCanvas.toDataURL('image/png');
      setSimulatedDataUrl(generatedDataUrl);

      if (onSimulationRendered) {
        onSimulationRendered(generatedDataUrl);
      }
    } catch (err) {
      console.error('Error renderizando simulación por canvas:', err);
    } finally {
      setIsRendering(false);
    }
  }, [imageUrl, segmentationData, isAnalyzing, selectedColor, onSimulationRendered]);

  // Disparar render cuando la máscara o el color seleccionado cambien
  useEffect(() => {
    if (segmentationData && !isAnalyzing) {
      renderSimulationCanvas();
    }
  }, [segmentationData, isAnalyzing, selectedColor, renderSimulationCanvas]);

  const handleToggle = () => {
    if (onToggleOriginal) {
      onToggleOriginal();
    } else {
      setLocalShowOriginal((prev) => !prev);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden w-full bg-slate-900 rounded-xl select-none ${className}`}
    >
      {/* Elemento Canvas Oculto para procesamiento de alto rendimiento */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Visor de Imagen: Renderizado fotorrealista SIN filtros globales CSS */}
      <div className="relative w-full flex items-center justify-center min-h-[200px] max-h-80 bg-slate-950">
        <img
          src={localShowOriginal ? imageUrl : simulatedDataUrl || imageUrl}
          alt={localShowOriginal ? 'Foto original sin simular' : 'Simulación de color en muro'}
          className="w-full h-full object-cover max-h-80 transition-opacity duration-200"
        />

        {/* INDICADOR DE CARGA: "Analizando estructura y contornos de muros..." */}
        {(isAnalyzing || isRendering) && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20 animate-fadeIn">
            <div className="relative mb-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <Sparkles className="w-4 h-4 text-sky-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-white text-xs sm:text-sm font-black tracking-wide uppercase">
              Analizando estructura y contornos de muros...
            </p>
            <p className="text-sky-200 text-[11px] mt-1 max-w-xs leading-relaxed">
              Segmentando paredes y preservando puertas de madera, marcos, ventanas y vegetación
            </p>
            <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white/90 text-[10px] font-mono border border-white/15">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Protección arquitectónica activa</span>
            </div>
          </div>
        )}

        {/* Badge de Tono Colorlink Superpuesto */}
        {!localShowOriginal && simulatedDataUrl && !isAnalyzing && (
          <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-950/85 text-white backdrop-blur-xs border border-white/20 flex items-center gap-1.5 shadow-md">
              <span
                className="w-3 h-3 rounded-full border border-white/80 shrink-0 shadow-2xs"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span>Colorlink • {selectedColor.name} (#{selectedColor.code})</span>
            </span>
          </div>
        )}

        {/* Botón de Alternar Antes / Después sobre la imagen */}
        {!isAnalyzing && simulatedDataUrl && (
          <button
            type="button"
            onClick={handleToggle}
            className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-xl bg-slate-950/80 hover:bg-slate-900 text-white text-[11px] font-bold backdrop-blur-xs border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
            title="Alternar entre la foto original y la simulación"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>{localShowOriginal ? 'Ver Simulado' : 'Ver Antes'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageVisualizer;
