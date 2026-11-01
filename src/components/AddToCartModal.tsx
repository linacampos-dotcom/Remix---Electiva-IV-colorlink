import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CartItem } from '../types';
import { 
  X, 
  ShoppingCart, 
  Check, 
  CheckCircle2, 
  Clock, 
  Palette, 
  Search, 
  Sliders, 
  AlertCircle, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface ProductToConfigure {
  productName: string;
  sku: string;
  cantidad: number;
  presentacion: string;
  precioUnitario: number;
  precioGalon?: number;
  precioCunete?: number;
  imagenUrl?: string;
  badge?: string;
  descripcion?: string;
}

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductToConfigure | null;
  onConfirmAddToCart: (item: CartItem) => void;
  onOpenCart?: () => void;
}

interface ColorOption {
  name: string;
  code: string;
  hex: string;
  category: 'Blancos & Neutros' | 'Grises & Modernos' | 'Cálidos & Tierras' | 'Azules & Fríos' | 'Pasteles & Botánicos';
  acabado: 'Mate' | 'Satinado' | 'Semibrillante';
  isFactoryWhite?: boolean;
}

// Catálogo interactivo de tonos populares Colorlink
const COLORLINK_COLORS: ColorOption[] = [
  // Blancos & Neutros
  { name: 'Blanco Puro Mate 1001', code: '1001', hex: '#F9FAFB', category: 'Blancos & Neutros', acabado: 'Mate', isFactoryWhite: true },
  { name: 'Blanco Almendra 1020', code: '1020', hex: '#F4EFEA', category: 'Blancos & Neutros', acabado: 'Satinado' },
  { name: 'Hueso Real 1015', code: '1015', hex: '#F5F2EB', category: 'Blancos & Neutros', acabado: 'Mate' },
  { name: 'Marfil Suave 1018', code: '1018', hex: '#EDE8DE', category: 'Blancos & Neutros', acabado: 'Satinado' },

  // Grises & Modernos
  { name: 'Gris Niebla 7035', code: '7035', hex: '#CBD5E1', category: 'Grises & Modernos', acabado: 'Mate' },
  { name: 'Gris Basalto 7012', code: '7012', hex: '#4A5568', category: 'Grises & Modernos', acabado: 'Satinado' },
  { name: 'Grafito Urbano 7024', code: '7024', hex: '#334155', category: 'Grises & Modernos', acabado: 'Semibrillante' },
  { name: 'Cemento Claro 7040', code: '7040', hex: '#94A3B8', category: 'Grises & Modernos', acabado: 'Mate' },

  // Cálidos & Tierras
  { name: 'Arena Cálida 1023', code: '1023', hex: '#E2D9C8', category: 'Cálidos & Tierras', acabado: 'Mate' },
  { name: 'Terracota Colonial 3016', code: '3016', hex: '#C05621', category: 'Cálidos & Tierras', acabado: 'Satinado' },
  { name: 'Siena Tostada 2010', code: '2010', hex: '#9A3412', category: 'Cálidos & Tierras', acabado: 'Satinado' },
  { name: 'Trigo Dorado 1030', code: '1030', hex: '#FDE047', category: 'Cálidos & Tierras', acabado: 'Mate' },

  // Azules & Fríos
  { name: 'Azul Celeste Fresco 5012', code: '5012', hex: '#93C5FD', category: 'Azules & Fríos', acabado: 'Mate' },
  { name: 'Azul Océano Profundo 5003', code: '5003', hex: '#1E3A8A', category: 'Azules & Fríos', acabado: 'Semibrillante' },
  { name: 'Azul Zafiro Clásico 5005', code: '5005', hex: '#2563EB', category: 'Azules & Fríos', acabado: 'Satinado' },
  { name: 'Azul Petróleo 5009', code: '5009', hex: '#0E7490', category: 'Azules & Fríos', acabado: 'Satinado' },

  // Pasteles & Botánicos
  { name: 'Verde Bosque Andino 6005', code: '6005', hex: '#14532D', category: 'Pasteles & Botánicos', acabado: 'Satinado' },
  { name: 'Verde Salvia Calm 6021', code: '6021', hex: '#A3B18A', category: 'Pasteles & Botánicos', acabado: 'Mate' },
  { name: 'Menta Suave 6019', code: '6019', hex: '#A7F3D0', category: 'Pasteles & Botánicos', acabado: 'Mate' },
  { name: 'Palo de Rosa Pastel 3015', code: '3015', hex: '#F472B6', category: 'Pasteles & Botánicos', acabado: 'Mate' },
];

export const AddToCartModal: React.FC<AddToCartModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirmAddToCart,
  onOpenCart,
}) => {
  if (!isOpen || !product) return null;

  // Estados de configuración de producto
  const [selectedPresentation, setSelectedPresentation] = useState<'Galón' | 'Cuñete (5 Gal)'>(
    product.presentacion?.includes('Cuñete') ? 'Cuñete (5 Gal)' : 'Galón'
  );
  const [quantity, setQuantity] = useState<number>(Math.max(1, product.cantidad || 1));
  const [selectedColor, setSelectedColor] = useState<ColorOption>(COLORLINK_COLORS[0]);
  const [selectedAcabado, setSelectedAcabado] = useState<'Mate' | 'Satinado' | 'Semibrillante'>('Mate');
  const [customColorText, setCustomColorText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [isSuccessAdded, setIsSuccessAdded] = useState<boolean>(false);

  // Reset al abrir un nuevo producto
  useEffect(() => {
    if (product) {
      setSelectedPresentation(product.presentacion?.includes('Cuñete') ? 'Cuñete (5 Gal)' : 'Galón');
      setQuantity(Math.max(1, product.cantidad || 1));
      setSelectedColor(COLORLINK_COLORS[0]);
      setCustomColorText('');
      setSearchQuery('');
      setIsSuccessAdded(false);
    }
  }, [product]);

  // Cálculo de precio según presentación
  const unitPrice = useMemo(() => {
    if (selectedPresentation === 'Cuñete (5 Gal)') {
      if (product.precioCunete) return product.precioCunete;
      if (product.presentacion?.includes('Cuñete')) return product.precioUnitario;
      // Multiplicador estándar cuñete (5 galones con descuento por volumen ~4.35x)
      return Math.round(product.precioUnitario * 4.35);
    } else {
      if (product.precioGalon) return product.precioGalon;
      if (!product.presentacion?.includes('Cuñete')) return product.precioUnitario;
      return Math.round(product.precioUnitario / 4.35);
    }
  }, [product, selectedPresentation]);

  const subtotalCOP = quantity * unitPrice;

  // Filtrado de paleta de colores
  const filteredColors = useMemo(() => {
    return COLORLINK_COLORS.filter((c) => {
      const matchesCategory = activeCategory === 'Todos' || c.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.code.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Determinación de preparación bajo pedido vs stock inmediato
  const isCustomColor = Boolean(customColorText.trim()) || !selectedColor.isFactoryWhite;
  const effectiveColorName = customColorText.trim()
    ? customColorText.trim()
    : selectedColor.name;

  const tiempoEstimado = isCustomColor
    ? '24 a 48 horas hábiles (Preparación Colorlink)'
    : 'Inmediato (Despacho en 2 a 4 horas hábiles)';

  const handleConfirm = () => {
    const configuredItem: CartItem = {
      id: `cart-ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nombre: product.productName,
      sku: product.sku,
      presentacion: selectedPresentation,
      cantidad: quantity,
      precioUnitario: unitPrice,
      colorSeleccionado: effectiveColorName,
      tiempoEstimadoEntrega: tiempoEstimado,
      esPersonalizado: isCustomColor,
      acabado: selectedAcabado,
      marca: 'Pintuco',
      imagenUrl: product.imagenUrl || '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
      subtotal: subtotalCOP,
    };

    onConfirmAddToCart(configuredItem);
    setIsSuccessAdded(true);
  };

  const categories = [
    'Todos',
    'Blancos & Neutros',
    'Grises & Modernos',
    'Cálidos & Tierras',
    'Azules & Fríos',
    'Pasteles & Botánicos',
  ];

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden text-slate-800 pointer-events-auto overscroll-contain select-auto"
        style={{ overscrollBehavior: 'contain', pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                {product.badge || 'Configurador de Pedido'}
              </span>
              <span className="text-xs text-blue-200 font-mono">SKU: {product.sku}</span>
            </div>
            <h3 className="text-base sm:text-lg font-black truncate text-white mt-0.5">
              {product.productName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain pointer-events-auto"
          style={{ overscrollBehavior: 'contain' }}
        >
          
          {/* Mensaje de éxito si ya agregó */}
          {isSuccessAdded ? (
            <div className="py-8 text-center space-y-4 animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">¡Producto añadido al carrito con éxito!</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Agregaste <span className="font-bold text-slate-900">{quantity} {selectedPresentation}</span> en color <span className="font-bold text-indigo-700">{effectiveColorName}</span> ({selectedAcabado}).
                </p>
                <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {tiempoEstimado}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs"
                >
                  Seguir en el Chat
                </button>
                {onOpenCart && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCart();
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md"
                  >
                    <span>Ir al Carrito de Compras</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Bloque 1: Presentación y Acabado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Presentación */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                    <span>1. Presentación</span>
                    <span className="text-[10px] text-blue-900 font-bold">Oficial Pintuco</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPresentation('Galón')}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        selectedPresentation === 'Galón'
                          ? 'border-blue-900 bg-blue-50/80 text-blue-950 ring-2 ring-blue-900/20 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-black">Galón (1 Gal)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ${(product.precioGalon || (product.presentacion?.includes('Cuñete') ? Math.round(product.precioUnitario / 4.35) : product.precioUnitario)).toLocaleString('es-CO')}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPresentation('Cuñete (5 Gal)')}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        selectedPresentation === 'Cuñete (5 Gal)'
                          ? 'border-blue-900 bg-blue-50/80 text-blue-950 ring-2 ring-blue-900/20 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-black">Cuñete (5 Gal)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ${(product.precioCunete || (product.presentacion?.includes('Cuñete') ? product.precioUnitario : Math.round(product.precioUnitario * 4.35))).toLocaleString('es-CO')}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Acabado */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
                    <span>2. Acabado</span>
                    <span className="text-[10px] text-slate-500 font-medium">Brillo Superficial</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Mate', 'Satinado', 'Semibrillante'] as const).map((acab) => (
                      <button
                        key={acab}
                        type="button"
                        onClick={() => setSelectedAcabado(acab)}
                        className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                          selectedAcabado === acab
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {acab}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    {selectedAcabado === 'Mate' && 'Disimula imperfecciones, ideal para muros interiores y cielos.'}
                    {selectedAcabado === 'Satinado' && 'Equilibrio estético, alta lavabilidad y suave luminosidad.'}
                    {selectedAcabado === 'Semibrillante' && 'Fácil limpieza y resistencia extra contra grasa y roce.'}
                  </p>
                </div>
              </div>

              {/* Bloque 2: Selector de Color Colorlink */}
              <div className="border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      3. Selector de Color Colorlink
                    </span>
                  </div>

                  {/* Buscador de Color */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por tono o código..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                    />
                  </div>
                </div>

                {/* Filtro de Categorías */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                        activeCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Paleta interactiva de colores */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredColors.map((color) => {
                    const isSelected = !customColorText.trim() && selectedColor.code === color.code;
                    return (
                      <button
                        key={color.code}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color);
                          setCustomColorText('');
                          setSelectedAcabado(color.acabado);
                        }}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full shrink-0 border border-slate-300 shadow-2xs relative flex items-center justify-center"
                          style={{ backgroundColor: color.hex }}
                        >
                          {isSelected && (
                            <Check className={`w-3.5 h-3.5 ${color.hex === '#F9FAFB' ? 'text-slate-900' : 'text-white'}`} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-slate-900 truncate">
                            {color.name.split(' ')[0]} {color.name.split(' ')[1] || ''}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            #{color.code}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Entrada manual de color personalizado */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>¿Tienes un código o referencia específica?</span>
                    <span className="text-[10px] text-indigo-700 font-medium">Bajo Pedido</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. PANTONE 19-4052 Classic Blue, RAL 7016, Verde Olivo Especial..."
                    value={customColorText}
                    onChange={(e) => setCustomColorText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Bloque 3: Advertencia de Preparación y Tiempos de Despacho (Requerimiento 3) */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                isCustomColor
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                  : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              }`}>
                <div className="flex items-start gap-2.5">
                  {isCustomColor ? (
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        isCustomColor
                          ? 'bg-amber-200 text-amber-900 border border-amber-300'
                          : 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                      }`}>
                        {isCustomColor ? '🎨 Preparación personalizada Colorlink' : '⚡ Stock Inmediato de Fábrica'}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        Color: {effectiveColorName}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed">
                      {isCustomColor
                        ? 'Este color se prepara bajo pedido en nuestro sistema tintométrico Colorlink. Tiempo de alistamiento estimado: 24 a 48 horas hábiles antes de despacho o recogida en tienda.'
                        : 'El tono Blanco Puro 1001 cuenta con disponibilidad inmediata en inventario central. Despacho garantizado en 2 a 4 horas hábiles.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloque 4: Selector de Cantidad y Resumen de Costo */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase text-slate-700">Cantidad:</span>
                  <div className="flex items-center rounded-xl border border-slate-300 bg-white overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 text-sm font-black text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 text-xs font-black min-w-[32px] text-center text-slate-900">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1.5 text-sm font-black text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedPresentation}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-medium">Subtotal Estimado</div>
                  <div className="text-base sm:text-lg font-black text-blue-900">
                    ${subtotalCOP.toLocaleString('es-CO')} <span className="text-xs text-slate-600">COP</span>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Modal con Botón de Confirmación */}
        {!isSuccessAdded && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-slate-950" />
              <span>Confirmar y Agregar al Carrito (${subtotalCOP.toLocaleString('es-CO')})</span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
