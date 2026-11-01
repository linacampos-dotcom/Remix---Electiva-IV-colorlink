import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CatalogProduct, CartItem } from '../types';
import { 
  X, 
  ShieldCheck, 
  Droplet, 
  Sparkles, 
  ShoppingBag, 
  Calculator, 
  Check, 
  Layers, 
  Clock, 
  Trees, 
  Tag, 
  CheckCircle2,
  ArrowRight,
  Heart
} from 'lucide-react';

interface ProductDetailModalProps {
  product: CatalogProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
  onStartQuote?: (product: CatalogProduct) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onStartQuote,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [selectedPresentacion, setSelectedPresentacion] = useState<'Galón' | 'Cuñete (5 Gal)' | 'Cuarto (1/4 Gal)'>('Galón');
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return product?.coloresCertificados && product.coloresCertificados.length > 0
      ? product.coloresCertificados[0]
      : 'Blanco Puro Mate 1001';
  });
  const [cantidad, setCantidad] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Sincronizar selección de color de forma segura cuando cambia el producto
  useEffect(() => {
    if (product?.coloresCertificados && product.coloresCertificados.length > 0) {
      setSelectedColor(product.coloresCertificados[0]);
    } else {
      setSelectedColor('Blanco Puro Mate 1001');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Approximate prices in COP
  const precioGalon = product.precioGalon || 
    (product.nombre.includes('Koraza') ? 142000 :
    product.nombre.includes('Baños') ? 128000 :
    product.nombre.includes('Aquablock') ? 135000 :
    product.nombre.includes('Fill') ? 85000 :
    product.nombre.includes('Pintulux') ? 118000 :
    product.nombre.includes('Color In') ? 89000 : 115000);

  const precioCunete = product.precioCunete || Math.round(precioGalon * 4.5);
  const precioCuarto = product.precioCuarto || Math.round(precioGalon * 0.32);
  const precioUnitario = selectedPresentacion === 'Cuñete (5 Gal)'
    ? precioCunete
    : selectedPresentacion === 'Cuarto (1/4 Gal)'
    ? precioCuarto
    : precioGalon;

  const handleAdd = () => {
    const isCun = selectedPresentacion.includes('Cuñete');
    const isCua = selectedPresentacion.includes('Cuarto') || selectedPresentacion.includes('1/4');
    const colorCode = selectedColor.includes('1001') ? 'BLA' :
      selectedColor.includes('1020') ? 'ALM' :
      selectedColor.includes('7012') ? 'BAS' :
      selectedColor.includes('7035') ? 'NIE' :
      selectedColor.includes('1023') ? 'ARE' :
      selectedColor.includes('3016') ? 'TER' :
      selectedColor.includes('5003') ? 'OCE' :
      selectedColor.includes('9005') ? 'NEG' :
      selectedColor.slice(0, 3).toUpperCase();
    const presSuffix = isCun ? '5GL' : isCua ? 'CUA' : '1GL';
    const variantSku = `${product.skuBase}-${colorCode}-${presSuffix}`;

    const cartItem: CartItem = {
      id: `${product.id}-${colorCode}-${presSuffix}-${Date.now()}`,
      nombre: `${product.nombre} - ${selectedColor} (${selectedPresentacion})`,
      sku: variantSku,
      presentacion: selectedPresentacion as any,
      cantidad,
      precioUnitario,
      marca: product.marca,
      colorSeleccionado: selectedColor,
      imagenUrl: selectedPresentacion.includes('Cuñete') && product.imagenCuneteUrl ? product.imagenCuneteUrl : product.imagenUrl,
    };
    onAddToCart(cartItem);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
              product.marca === 'Pintuco' ? 'bg-blue-900 text-white' : 'bg-amber-500 text-slate-950'
            }`}>
              {product.marca}
            </span>
            <span className="text-xs text-slate-500 font-mono">SKU: {product.skuBase}</span>
          </div>
          <div className="flex items-center gap-2">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(product.id)}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isFavorite
                    ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-2xs'
                    : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                }`}
                title={isFavorite ? 'Quitar de favoritos' : 'Guardar en mis favoritos'}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Left: Product Image & Badges */}
          <div className="md:col-span-5 space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-sky-50/50 border border-slate-200/90 p-4 flex items-center justify-center shadow-xs">
              <img
                src={selectedPresentacion.includes('Cuñete') && product.imagenCuneteUrl ? product.imagenCuneteUrl : product.imagenUrl}
                alt={product.nombre}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain drop-shadow-md hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-200 shadow-2xs">
                {product.linea}
              </div>
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-200 shadow-2xs">
                {selectedPresentacion}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rendimiento Norma:</span>
                <span className="font-bold text-slate-900">{product.rendimientoEstimado}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Garantía Certificada:</span>
                <span className="font-bold text-teal-700">{product.garantia}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lavabilidad:</span>
                <span className="font-bold text-slate-900">{product.lavabilidad}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Compuesto VOC:</span>
                <span className="font-bold text-slate-900">{product.voc}</span>
              </div>
            </div>
          </div>

          {/* Right: Technical Specs and Purchase Actions */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  {product.tipoPintura}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {product.nombre}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.descripcion}
              </p>

              {/* Environments */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Ambientes Recomendados:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.ambienteIdeal.map((amb, i) => (
                    <span 
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200"
                    >
                      {amb}
                    </span>
                  ))}
                </div>
              </div>

              {/* Presentation Selector */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Selecciona Presentación:
                </span>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPresentacion('Cuarto (1/4 Gal)')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedPresentacion === 'Cuarto (1/4 Gal)'
                        ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 block">Cuarto (1/4 GL)</span>
                    <span className="text-xs sm:text-sm font-black text-blue-900 mt-0.5 block">
                      ${precioCuarto.toLocaleString('es-CO')}
                    </span>
                    <span className="text-[9px] text-slate-500 block truncate">Retoques / 7 m²</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPresentacion('Galón')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedPresentacion === 'Galón'
                        ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 block">Galón (1 GL)</span>
                    <span className="text-xs sm:text-sm font-black text-blue-900 mt-0.5 block">
                      ${precioGalon.toLocaleString('es-CO')}
                    </span>
                    <span className="text-[9px] text-slate-500 block truncate">Cubre ~30 m²</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPresentacion('Cuñete (5 Gal)')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedPresentacion === 'Cuñete (5 Gal)'
                        ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/20 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 block">Cuñete (5 GL)</span>
                    <span className="text-xs sm:text-sm font-black text-blue-900 mt-0.5 block">
                      ${precioCunete.toLocaleString('es-CO')}
                    </span>
                    <span className="text-[9px] text-teal-700 font-semibold block truncate">Mayorista ~150 m²</span>
                  </button>
                </div>
              </div>

              {/* Selector de Tonos Certificados */}
              {(product?.coloresCertificados || []).length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Tono Oficial Certificado:
                    </span>
                    <span className="text-xs font-bold text-blue-950 font-mono">
                      {selectedColor}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(product?.coloresCertificados || []).map((col) => {
                      const isSel = selectedColor === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setSelectedColor(col)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                            isSel
                              ? 'bg-blue-950 text-white border-blue-950 shadow-xs ring-2 ring-cyan-400'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                            style={{
                              backgroundColor:
                                col.toLowerCase().includes('blanco') ? '#F9FAFB' :
                                col.toLowerCase().includes('gris') ? '#94A3B8' :
                                col.toLowerCase().includes('arena') ? '#E2D9C8' :
                                col.toLowerCase().includes('azul') ? '#1E3A8A' :
                                col.toLowerCase().includes('verde') ? '#15803D' :
                                col.toLowerCase().includes('terracota') || col.toLowerCase().includes('rojo') ? '#C05621' :
                                col.toLowerCase().includes('amarillo') ? '#EAB308' :
                                col.toLowerCase().includes('negro') ? '#1E293B' : '#CBD5E1'
                            }}
                          />
                          <span>{col}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Picker */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs font-bold text-slate-700">Cantidad:</span>
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setCantidad((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-slate-700 hover:bg-slate-200 transition-colors font-bold text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-black text-slate-900 bg-white">
                    {cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCantidad((q) => q + 1)}
                    className="px-3 py-1.5 text-slate-700 hover:bg-slate-200 transition-colors font-bold text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="text-right ml-auto">
                  <span className="text-[10px] text-slate-500 block">Subtotal ítem:</span>
                  <span className="text-base font-black text-slate-900">
                    ${(precioUnitario * cantidad).toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-teal-300" />
                  <span>{addedNotice ? '¡Agregado al Carrito!' : 'Añadir al Carrito'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartQuote(product);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Cotizar en Cotizador Inteligente</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Producto oficial con certificado de calidad NTC 1335</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
};
