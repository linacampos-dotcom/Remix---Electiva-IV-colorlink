import React, { useState, useRef, useEffect } from 'react';
import { COLOR_PALETTE, ColorPaletteItem } from '../data/pintucoData';
import { 
  Check, 
  Eye, 
  Sparkles, 
  Sun, 
  Moon, 
  Layers, 
  Home, 
  Maximize2, 
  RotateCcw,
  Sliders,
  Info,
  Droplet,
  UploadCloud,
  Camera,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

import livingRoomImg from '../assets/images/living_room_wall_1789834592467.jpg';
import bedroomImg from '../assets/images/bedroom_wall_1789834625586.jpg';
import facadeImg from '../assets/images/facade_wall_1789834604798.jpg';
import { ImageVisualizer } from './ImageVisualizer';

interface ColorPaletteVisualizerProps {
  selectedColorName: string;
  onSelectColor: (colorName: string) => void;
  uploadedPhotoUrl?: string;
  onPhotoUpload?: (url: string) => void;
  onRemovePhoto?: () => void;
}

type SceneType = 'living' | 'bedroom' | 'facade' | 'custom';
type LightingType = 'day' | 'warm' | 'cool';

export const ColorPaletteVisualizer: React.FC<ColorPaletteVisualizerProps> = ({
  selectedColorName,
  onSelectColor,
  uploadedPhotoUrl,
  onPhotoUpload,
  onRemovePhoto,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [hoveredColor, setHoveredColor] = useState<ColorPaletteItem | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Simulator states
  const [activeScene, setActiveScene] = useState<SceneType>(uploadedPhotoUrl ? 'custom' : 'living');
  const [lighting, setLighting] = useState<LightingType>('day');
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [paintOpacity, setPaintOpacity] = useState<number>(0.82);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Switch to custom scene automatically when a new photo is uploaded
  useEffect(() => {
    if (uploadedPhotoUrl) {
      setActiveScene('custom');
    }
  }, [uploadedPhotoUrl]);

  // Find currently selected color item
  const currentColor = COLOR_PALETTE.find(
    (c) => c.name === selectedColorName || selectedColorName.includes(c.code)
  ) || COLOR_PALETTE[0];

  const filteredColors = activeCategory === 'Todos'
    ? COLOR_PALETTE
    : COLOR_PALETTE.filter((c) => c.category === activeCategory);

  const categories = ['Todos', 'Clásicos', 'Modernos', 'Tierras', 'Acentos', 'Naturales', 'Vibrantes'];

  // Base scenes list
  const scenes = [
    ...(uploadedPhotoUrl ? [{
      id: 'custom' as SceneType,
      name: '📸 Mi Pared / Obra',
      icon: Camera,
      image: uploadedPhotoUrl,
      tag: 'Foto Real Subida'
    }] : []),
    { id: 'living' as SceneType, name: 'Sala de Estar', icon: Home, image: livingRoomImg, tag: 'Interior Principal' },
    { id: 'bedroom' as SceneType, name: 'Habitación Master', icon: Layers, image: bedroomImg, tag: 'Interior Privado' },
    { id: 'facade' as SceneType, name: 'Fachada Residencial', icon: Sun, image: facadeImg, tag: 'Exterior / Clima' },
  ];

  const currentSceneObj = scenes.find((s) => s.id === activeScene) || scenes[0];

  // File Upload Handlers (Supports both drag-and-drop and click)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor suba un archivo de imagen válido (JPG, PNG o WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        if (onPhotoUpload) {
          onPhotoUpload(result);
        }
        setActiveScene('custom');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  // Mouse hover handler on swatches
  const handleMouseEnter = (c: ColorPaletteItem, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (containerRect) {
      setHoverPosition({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top,
      });
    }
    setHoveredColor(c);
  };

  const handleMouseLeave = () => {
    setHoveredColor(null);
  };

  // Texture sheen styling based on finish
  const getSheenOverlayStyle = (acabado: string) => {
    switch (acabado) {
      case 'Satinado':
        return {
          background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 45%, rgba(0,0,0,0.08) 100%)',
          boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.4)',
        };
      case 'Semibrillante':
        return {
          background: 'linear-gradient(120deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.12) 35%, rgba(255,255,255,0) 65%, rgba(0,0,0,0.1) 100%)',
          boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.5), inset 0 -1px 3px rgba(0,0,0,0.15)',
        };
      case 'Mate':
      default:
        return {
          background: 'radial-gradient(circle at 40% 30%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.08) 100%)',
          boxShadow: 'inset 0 0 4px rgba(0,0,0,0.06)',
        };
    }
  };

  // Ambient Scene Lighting overlay styles (WITHOUT altering paint color pigments)
  // Maintains 100% catalog pigment fidelity while illuminating the entire room
  const [userWallMaskMode, setUserWallMaskMode] = useState<'wall_only' | 'accent' | 'full'>('wall_only');

  const getSceneClipPath = () => {
    switch (activeScene) {
      case 'living':
        // Segmentación precisa del muro de fondo: respeta techo superior, molduras, zócalo inferior y sofá/mobiliario
        return 'polygon(0% 0%, 100% 0%, 100% 64%, 74% 64%, 71% 71%, 29% 71%, 26% 64%, 0% 64%)';
      case 'bedroom':
        // Segmentación precisa del muro cabecero: respeta el cielorraso, el piso y la silueta del respaldar de cama
        return 'polygon(0% 0%, 100% 0%, 100% 61%, 74% 61%, 69% 67%, 31% 67%, 26% 61%, 0% 61%)';
      case 'facade':
        // Segmentación precisa de la fachada: respeta el alero superior, marcos de ventana y zócalo perimetral de piedra
        return 'polygon(0% 12%, 100% 12%, 100% 78%, 84% 78%, 80% 82%, 18% 82%, 14% 78%, 0% 78%)';
      case 'custom':
      default:
        if (userWallMaskMode === 'wall_only') {
          // Excluye zócalo, rodapié y piso inferior (primer 72% superior de la pared)
          return 'polygon(0% 0%, 100% 0%, 100% 74%, 0% 74%)';
        }
        if (userWallMaskMode === 'accent') {
          // Pared de acento arquitectónico central
          return 'polygon(12% 4%, 88% 4%, 88% 74%, 12% 74%)';
        }
        return 'none';
    }
  };

  return (
    <div ref={containerRef} className="relative space-y-6">
      
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* SVG Micro-Texture Definition for Realistic Wall Stucco/Roller Relief */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <filter id="pintuco-wall-texture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
          <feColorMatrix 
            type="matrix" 
            values="0 0 0 0 0.2   0 0 0 0 0.2   0 0 0 0 0.2   0 0 0 0.07 0" 
            result="coloredNoise" 
          />
          <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply" />
        </filter>
      </svg>

      {/* 1. MUESTRARIO DE TONOS FRECUENTES PINTUCO */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 shadow-2xs">
        
        {/* Header and Category Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                Muestrario de Tonos Frecuentes Pintuco
              </h4>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                Catálogo Arquitectónico
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pase el cursor para ver textura, reflectancia y especificación técnica en tiempo real.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Color Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredColors.map((c) => {
            const isSelected = selectedColorName === c.name || selectedColorName.includes(c.code);
            const isLightColor = ['#f9fafb', '#f4efea', '#cbd5e1', '#e2d9c8', '#93c5fd', '#a3b18a', '#fbbf24'].includes(c.hex.toLowerCase());

            return (
              <button
                key={c.name}
                type="button"
                onClick={() => onSelectColor(c.name)}
                onMouseEnter={(e) => handleMouseEnter(c, e)}
                onMouseLeave={handleMouseLeave}
                className={`group relative p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[145px] select-none ${
                  isSelected
                    ? 'border-blue-900 bg-white shadow-md ring-2 ring-blue-900/30'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs hover:bg-slate-50'
                }`}
              >
                {/* Circular Swatch with Stucco Wall Micro-texture & Sheen */}
                <div className="relative my-1">
                  <div
                    className={`w-11 h-11 rounded-full border shadow-inner flex items-center justify-center transition-transform group-hover:scale-110 relative overflow-hidden ${
                      isLightColor ? 'border-slate-300' : 'border-black/15'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {/* Realistic Texture pattern overlay */}
                    <div 
                      className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                      style={{
                        backgroundImage: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.4) 0%, transparent 70%), repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 2px, transparent 2px, transparent 4px)`
                      }}
                    />

                    {/* Sheen highlight layer */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={getSheenOverlayStyle(c.acabado)}
                    />

                    {/* Selected Check Icon */}
                    {isSelected && (
                      <Check className={`w-5 h-5 relative z-10 ${isLightColor ? 'text-slate-950 font-black' : 'text-white font-black'} drop-shadow-md`} />
                    )}
                  </div>

                  {/* Active Indicator Badge */}
                  {isSelected && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 ring-2 ring-white shadow-xs" />
                  )}
                </div>

                {/* Color Name - UNTRUNCATED */}
                <div className="w-full flex-1 flex flex-col justify-center my-1 px-0.5">
                  <span className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 min-h-[2.2rem] flex items-center justify-center text-center">
                    {c.shortName}
                  </span>
                </div>

                {/* Code and Finish Labels */}
                <div className="w-full pt-1 border-t border-slate-100 flex items-center justify-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {c.code}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    {c.acabado}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Selection Banner */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 font-medium">Tono seleccionado para cálculo:</span>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-red-50 text-red-900 border border-red-200">
              <span
                className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                style={{ backgroundColor: currentColor.hex }}
              />
              <strong className="text-xs">{currentColor.name}</strong>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white text-red-700 border border-red-200">
                Ref. {currentColor.code}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500">
            Acabado {currentColor.acabado} • Rendimiento 30 m²/gal a 2 manos
          </span>
        </div>

      </div>

      {/* 2. REALISTIC HOVER FLOATING CARD */}
      {hoveredColor && hoverPosition && (
        <div
          className="absolute z-50 pointer-events-none transition-all duration-150 ease-out hidden sm:block"
          style={{
            left: `${Math.max(160, Math.min(hoverPosition.x, (containerRef.current?.offsetWidth || 600) - 160))}px`,
            top: `${Math.max(10, hoverPosition.y - 190)}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="w-80 bg-white rounded-2xl p-4 shadow-2xl border border-slate-300 text-slate-800 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header with Catalog Code & Family */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                PINTUCO CÓD. {hoveredColor.code}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                Familia: {hoveredColor.category}
              </span>
            </div>

            {/* Large Textured Wall Preview */}
            <div className="relative w-full h-24 rounded-xl overflow-hidden shadow-inner border border-slate-300">
              <div 
                className="w-full h-full"
                style={{ backgroundColor: hoveredColor.hex }}
              />

              <div 
                className="absolute inset-0 pointer-events-none opacity-40 mix-blend-multiply"
                style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.4) 0%, transparent 60%), repeating-radial-gradient(circle, rgba(0,0,0,0.04) 0, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 4px)`
                }}
              />

              <div 
                className="absolute inset-0 pointer-events-none"
                style={getSheenOverlayStyle(hoveredColor.acabado)}
              />

              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.15) 100%)',
                }}
              />

              <div className="absolute bottom-2 left-2.5 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-white text-[10px] font-bold">
                <Droplet className="w-3 h-3 text-red-400" />
                <span>Textura Pared • Acabado {hoveredColor.acabado}</span>
              </div>

              <div className="absolute top-2 right-2.5 z-10 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-slate-800 shadow-2xs">
                LRV: {hoveredColor.lrv}%
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-slate-900 leading-tight">
                {hoveredColor.name}
              </h5>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                {hoveredColor.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>Reflectancia: {hoveredColor.lrv > 50 ? 'Alta (Espacio Luminoso)' : 'Media/Acento'}</span>
              <span className="text-red-600 font-semibold">Clic para cotizar</span>
            </div>

          </div>
        </div>
      )}

      {/* 3. SIMULADOR VISUAL DE AMBIENTE EN TIEMPO REAL CON CARGA DE FOTO REAL */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        
        {/* Simulator Control Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white">
                Render en Vivo
              </span>
              <h4 className="text-sm font-bold text-white tracking-tight">
                Simulador Arquitectónico de Pared Pintuco
              </h4>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Visualice el tono aplicado sobre su foto real o sobre nuestros ambientes certificados.
            </p>
          </div>

          {/* Scene Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            {scenes.map((scene) => {
              const Icon = scene.icon;
              const isActive = activeScene === scene.id;
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setActiveScene(scene.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-sm ring-1 ring-white/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{scene.name}</span>
                </button>
              );
            })}

            {/* Quick Upload Button in Scenes Bar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 border border-amber-500/40 transition-all ml-1"
              title="Cargar foto desde mi dispositivo"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{uploadedPhotoUrl ? 'Cambiar Foto' : '+ Subir Foto'}</span>
            </button>
          </div>
        </div>

        {/* DRAG AND DROP / FILE UPLOAD BANNER FOR WALL PHOTO */}
        <div 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`px-4 py-3 border-b transition-colors flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isDraggingFile 
              ? 'bg-red-50 border-red-400 ring-2 ring-red-400' 
              : uploadedPhotoUrl 
              ? 'bg-emerald-50/70 border-emerald-200' 
              : 'bg-amber-50/60 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className={`p-2 rounded-xl shrink-0 ${uploadedPhotoUrl ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Subir foto de mi pared/obra para cotización precisa
                </span>
                {uploadedPhotoUrl && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900">
                    Foto Activa
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600">
                {uploadedPhotoUrl 
                  ? 'Su fotografía está cargada en el simulador conservando sombras, luces y zócalos reales.'
                  : 'Arrastre una foto aquí o haga clic para simular la pintura directamente sobre su pared real.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs transition-all"
            >
              <UploadCloud className="w-3.5 h-3.5 text-red-600" />
              <span>{uploadedPhotoUrl ? 'Reemplazar Foto' : 'Seleccionar Archivo'}</span>
            </button>

            {uploadedPhotoUrl && (
              <button
                type="button"
                onClick={() => {
                  if (onRemovePhoto) onRemovePhoto();
                  setActiveScene('living');
                }}
                className="p-1.5 rounded-xl text-red-600 hover:bg-red-100/80 border border-red-200 transition-colors"
                title="Quitar foto y volver a renders base"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Scene Controls (Dynamic Lighting & Comparison) */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          
          {/* Current Applied Color Pill */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Tono Aplicado:</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs font-bold text-slate-900">
              <span
                className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs"
                style={{ backgroundColor: currentColor.hex }}
              />
              <span>{currentColor.shortName} ({currentColor.code})</span>
              <span className="text-[10px] text-slate-500 font-normal">• {currentColor.acabado}</span>
            </div>
          </div>

          {/* DYNAMIC LIGHTING BUTTONS WITH REAL-TIME CSS FILTERS & PROMINENT HIGHLIGHT */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] text-slate-700 font-bold">Temperatura de Iluminación:</span>
            <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1 shadow-2xs gap-1">
              
              {/* Día Natural (5500K) */}
              <button
                type="button"
                onClick={() => setLighting('day')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  lighting === 'day'
                    ? 'bg-blue-900 text-white shadow-xs ring-2 ring-blue-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Día Natural: Iluminación neutra, brillo 100%, contraste 100% y balance de blancos puro"
              >
                <Sun className={`w-3.5 h-3.5 ${lighting === 'day' ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>Día Natural</span>
              </button>

              {/* Luz Cálida (3000K LED / Atardecer) */}
              <button
                type="button"
                onClick={() => setLighting('warm')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  lighting === 'warm'
                    ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Luz Cálida: Tono amarillento con sepia ligero simulando luces LED de 3000K o atardecer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${lighting === 'warm' ? 'text-amber-200' : 'text-amber-600'}`} />
                <span>Luz Cálida</span>
              </button>

              {/* Luz Neutra/Fría (6000K) */}
              <button
                type="button"
                onClick={() => setLighting('cool')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  lighting === 'cool'
                    ? 'bg-sky-600 text-white shadow-xs ring-2 ring-sky-300'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Luz Neutra/Fría: Tono ligeramente azulado y brillante (6000K) simulando luz de oficina"
              >
                <Moon className={`w-3.5 h-3.5 ${lighting === 'cool' ? 'text-sky-200' : 'text-sky-600'}`} />
                <span>Luz Neutra / Fría</span>
              </button>
            </div>

            {/* Before / After Toggle Button */}
            <button
              type="button"
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              onTouchStart={() => setShowOriginal(true)}
              onTouchEnd={() => setShowOriginal(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all select-none ${
                showOriginal
                  ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
              title="Mantenga presionado para ver la pared original sin pintar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{showOriginal ? 'Viendo Pared Original' : 'Mantener para Original'}</span>
            </button>
          </div>

        </div>

        {/* Real-time Render Visual Canvas (Pure room lighting without hue distortion of pigment) */}
        <div 
          className="relative w-full aspect-video sm:aspect-[21/9] bg-slate-900 overflow-hidden select-none transition-all duration-300"
        >
          {/* Renderizado fotorrealista por Canvas y Máscara de Muros (Sin overlay CSS plano) */}
          <ImageVisualizer
            imageUrl={currentSceneObj.image}
            selectedColor={{
              name: currentColor.name,
              code: currentColor.code,
              hex: currentColor.hex,
            }}
            showOriginal={showOriginal}
            surfaceType={activeScene === 'facade' ? 'fachada' : 'muro_interior'}
            className="w-full h-full object-cover"
          />

          {/* Floating HUD In-Render Badge */}
          <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white shadow-lg">
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-inner"
              style={{ backgroundColor: currentColor.hex }}
            />
            <div className="text-xs">
              <span className="font-bold text-white">{currentColor.name}</span>
              <span className="text-slate-400 text-[11px] ml-1.5">• Ref. {currentColor.code} ({currentColor.acabado})</span>
            </div>
          </div>

          {/* Scene Tag / Indicator */}
          <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white/90 border border-white/10 flex items-center gap-1.5">
            {activeScene === 'custom' && <Camera className="w-3 h-3 text-amber-400" />}
            <span>{currentSceneObj.tag}</span>
          </div>

          {/* Active Lighting Indicator Watermark */}
          <div className="absolute top-3 left-3 z-20 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-white/10">
            {lighting === 'day' ? '☀️ 5500K Balance Neutro' : lighting === 'warm' ? '💡 3000K Cálida' : '🌤️ 6000K Fría/Neutra'}
          </div>

        </div>

        {/* Simulator Controls & Opacity Slider Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-600">
          
          {/* Opacity / Coverage Slider */}
          <div className="flex items-center gap-3">
            <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="font-semibold text-slate-700 whitespace-nowrap">
              Intensidad de Capa: {Math.round(paintOpacity * 100)}%
            </span>
            <input
              type="range"
              min="0.50"
              max="0.95"
              step="0.05"
              value={paintOpacity}
              onChange={(e) => setPaintOpacity(parseFloat(e.target.value))}
              className="w-28 sm:w-36 accent-teal-600 cursor-pointer"
              title="Ajustar transparencia de mezcla sobre sombras reales"
            />
          </div>

          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-900 shrink-0" />
            <span className="text-[11px]">
              <strong>Fusión Óptica Real:</strong> La mezcla multiplica sombras y zócalos reales para evitar bloques opacos.
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectColor(currentColor.name)}
            className="self-end md:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Fijar en Formulario de Cotización</span>
          </button>
        </div>

      </div>

    </div>
  );
};
