import React, { useState, useMemo } from 'react';
import { CatalogProduct, CartItem, ProductVariant } from '../types';
import { 
  Heart, 
  Eye, 
  ShoppingBag, 
  Check
} from 'lucide-react';

export interface ProductCardProps {
  product: CatalogProduct;
  onAddToCart?: (item: CartItem) => void;
  onSelectProductDetail?: (product: CatalogProduct) => void;
  onSelectProductForQuote?: (product: CatalogProduct) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onSelectProductDetail,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const hasVariants = Boolean(product?.variantes && product.variantes.length > 0);
  const certifiedColors = product?.coloresCertificados || [];
  const productVariants = product?.variantes || [];

  // Variant state for tools
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants && productVariants.length > 0 ? productVariants[0] : null
  );

  // Presentation state for paints: '1/4 Galón' | '1/2 Galón' | '1 Galón' | 'Cuñete (5 Gal)'
  const [selectedPresentation, setSelectedPresentation] = useState<string>('1 Galón');

  // Color selection for paints with certified palette
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return certifiedColors.length > 0
      ? certifiedColors[0]
      : 'Blanco Puro Mate 1001';
  });

  const [added, setAdded] = useState(false);

  const isCunete = selectedPresentation.includes('Cuñete');
  const isMedio = selectedPresentation.includes('1/2');
  const isCuarto = selectedPresentation.includes('1/4') || selectedPresentation.includes('Cuarto');

  // Standard paint presentations (clean short labels)
  const paintPresentations = [
    { id: 'p-cuarto', label: '1/4 Galón', shortLabel: '1/4' },
    { id: 'p-medio', label: '1/2 Galón', shortLabel: '1/2' },
    { id: 'p-galon', label: '1 Galón', shortLabel: 'Galón' },
    { id: 'p-cunete', label: 'Cuñete (5 Gal)', shortLabel: 'Cuñete' },
  ];

  // Dynamic Image Switching based on presentation or tool variant
  const activeImage = useMemo(() => {
    if (hasVariants && selectedVariant?.imagenUrl) {
      return selectedVariant.imagenUrl;
    }
    if (hasVariants && selectedVariant && product.imagenVariantes?.[selectedVariant.id]) {
      return product.imagenVariantes[selectedVariant.id];
    }
    if (hasVariants && selectedVariant) {
      const vName = selectedVariant.nombre.toLowerCase();
      const vMed = selectedVariant.medida.toLowerCase();
      if (vName.includes('cinta') || vMed.includes('cinta')) {
        return '/src/assets/images/cinta_azul_rollo_1790894607849.jpg';
      }
      if (vName.includes('bandeja') || vMed.includes('bandeja')) {
        return '/src/assets/images/bandeja_pintor_pro_1790894626761.jpg';
      }
      if (vName.includes('destapa') || vName.includes('mezclador') || vMed.includes('destapa') || vMed.includes('mezclador')) {
        return '/src/assets/images/destapa_cunetes_herramienta_1790894634999.jpg';
      }
      if (vName.includes('espátula') || vName.includes('espatula') || vMed.includes('espátula') || vMed.includes('cepillo')) {
        return '/src/assets/images/espatula_acero_inox_1790894617251.jpg';
      }
      if (vName.includes('lija') || vMed.includes('grano')) {
        return '/src/assets/images/lija_agua_pintuco_1790894597920.jpg';
      }
    }
    if (!hasVariants && isCunete && product.imagenCuneteUrl) {
      return product.imagenCuneteUrl;
    }
    return product.imagenUrl;
  }, [hasVariants, selectedVariant, isCunete, product]);

  // Dynamic Price computation
  const priceGalon = product.precioGalon || product.precioUnidad || 79900;
  const priceMedio = Math.round(priceGalon * 0.58);
  const priceCunete = product.precioCunete || Math.round(priceGalon * 4.5);
  const priceCuarto = product.precioCuarto || Math.round(priceGalon * 0.32);

  const currentPrice = useMemo(() => {
    if (hasVariants && selectedVariant) {
      return selectedVariant.precio;
    }
    if (isCunete) return priceCunete;
    if (isMedio) return priceMedio;
    if (isCuarto) return priceCuarto;
    return priceGalon;
  }, [hasVariants, selectedVariant, isCunete, isMedio, isCuarto, priceCunete, priceMedio, priceCuarto, priceGalon]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddToCart) return;

    if (hasVariants && selectedVariant) {
      const item: CartItem = {
        id: `${product.id}-${selectedVariant.id}`,
        nombre: `${product.nombre} - ${selectedVariant.nombre}`,
        sku: selectedVariant.sku || product.skuBase,
        presentacion: 'Unidad',
        cantidad: 1,
        precioUnitario: selectedVariant.precio,
        marca: product.marca,
        varianteSeleccionada: selectedVariant.nombre,
        imagenUrl: activeImage,
      };
      onAddToCart(item);
    } else {
      // Calcular SKU de variante matriz
      const colorCode = selectedColor.includes('1001') ? 'BLA' :
        selectedColor.includes('1020') ? 'ALM' :
        selectedColor.includes('7012') ? 'BAS' :
        selectedColor.includes('7035') ? 'NIE' :
        selectedColor.includes('1023') ? 'ARE' :
        selectedColor.includes('3016') ? 'TER' :
        selectedColor.includes('5003') ? 'OCE' :
        selectedColor.includes('9005') ? 'NEG' :
        selectedColor.slice(0, 3).toUpperCase();
      const presSuffix = isCunete ? '5GL' : isCuarto ? 'CUA' : '1GL';
      const variantSku = `${product.skuBase}-${colorCode}-${presSuffix}`;

      const item: CartItem = {
        id: `${product.id}-${colorCode}-${presSuffix}`,
        nombre: `${product.nombre} - ${selectedColor} (${selectedPresentation})`,
        sku: variantSku,
        presentacion: selectedPresentation as any,
        cantidad: 1,
        precioUnitario: currentPrice,
        marca: product.marca,
        colorSeleccionado: selectedColor,
        imagenUrl: activeImage,
      };
      onAddToCart(item);
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 hover:border-blue-500/80 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden w-full max-w-full">
      <div>
        {/* 1. IMAGEN DEL PRODUCTO (Máximo 145px de alto para mayor compacidad) */}
        <div className="relative p-2.5 bg-gradient-to-b from-slate-50 via-white to-slate-50/60 overflow-hidden border-b border-slate-100 flex items-center justify-center h-36 max-h-[145px]">
          {/* Top Badges: Brand & Offer */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              product.marca === 'Pintuco' ? 'bg-[#003366] text-white shadow-2xs' : 'bg-teal-600 text-white shadow-2xs'
            }`}>
              {product.marca}
            </span>
            {product.badgeOferta && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white shadow-2xs">
                {product.badgeOferta}
              </span>
            )}
          </div>

          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product.id);
              }}
              className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-all cursor-pointer shadow-xs ${
                isFavorite
                  ? 'bg-rose-600 text-white shadow-rose-600/30 scale-105'
                  : 'bg-white/90 hover:bg-white text-slate-500 hover:text-rose-600 border border-slate-200'
              }`}
              title={isFavorite ? 'Quitar de favoritos' : 'Guardar en mis favoritos'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white text-white' : ''}`} />
            </button>
          )}

          <img
            src={activeImage}
            alt={product.nombre}
            referrerPolicy="no-referrer"
            className="object-contain w-full h-full max-h-[125px] drop-shadow-md transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* CONTENIDO PRINCIPAL: Título, Presentaciones, Precio */}
        <div className="p-3.5 space-y-2">
          
          {/* 2. TÍTULO DEL PRODUCTO EN MÁXIMO 2 LÍNEAS */}
          <h4 
            onClick={() => onSelectProductDetail && onSelectProductDetail(product)}
            className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-2 min-h-[2.25rem] leading-snug cursor-pointer"
            title={product.nombre}
          >
            {product.nombre}
          </h4>

          {/* 3. CHIPS / BOTONES DE PRESENTACIONES DISPONIBLES */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-600 block">
              Presentaciones:
            </span>
            <div className="flex flex-wrap gap-1">
              {hasVariants && productVariants.length > 0 ? (
                productVariants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-1.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#003366] text-white shadow-xs scale-105 ring-1 ring-sky-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                      }`}
                    >
                      {v.medida}
                    </button>
                  );
                })
              ) : (
                paintPresentations.map((pres) => {
                  const isSelected = selectedPresentation === pres.label;
                  return (
                    <button
                      key={pres.id}
                      type="button"
                      onClick={() => setSelectedPresentation(pres.label)}
                      className={`px-1.5 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#003366] text-white shadow-xs scale-105 ring-1 ring-sky-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                      }`}
                    >
                      {pres.shortLabel}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 3b. SELECTOR DE TONOS CERTIFICADOS (para pinturas) */}
          {!hasVariants && certifiedColors.length > 1 && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-600">Color:</span>
                <span className="text-slate-500 truncate max-w-[140px] font-medium" title={selectedColor}>
                  {selectedColor.split(' ')[0]} {selectedColor.split(' ')[1] || ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {certifiedColors.slice(0, 5).map((col) => {
                  const isSel = selectedColor === col;
                  const isBlanco = col.toLowerCase().includes('blanco');
                  const isGris = col.toLowerCase().includes('gris');
                  const isArena = col.toLowerCase().includes('arena');
                  const isAzul = col.toLowerCase().includes('azul');
                  const isVerde = col.toLowerCase().includes('verde');
                  const isTerracota = col.toLowerCase().includes('terracota') || col.toLowerCase().includes('rojo');
                  const isAmarillo = col.toLowerCase().includes('amarillo');
                  const isNegro = col.toLowerCase().includes('negro');

                  const bgCol = isBlanco ? '#F9FAFB' :
                    isGris ? '#94A3B8' :
                    isArena ? '#E2D9C8' :
                    isAzul ? '#1E3A8A' :
                    isVerde ? '#15803D' :
                    isTerracota ? '#C05621' :
                    isAmarillo ? '#EAB308' :
                    isNegro ? '#1E293B' : '#CBD5E1';

                  return (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className={`w-4 h-4 rounded-full border transition-all cursor-pointer shrink-0 ${
                        isSel
                          ? 'ring-2 ring-[#003366] scale-125 border-white shadow-xs'
                          : 'border-slate-300 hover:scale-110 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: bgCol }}
                      title={col}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. PRECIO GRANDE Y CLARO ($89.900 COP) */}
          <div className="pt-1.5 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Precio
            </span>
            <div className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              ${currentPrice.toLocaleString('es-CO')}
              <span className="text-[11px] font-bold text-slate-500 ml-1">COP</span>
            </div>
          </div>

        </div>
      </div>

      {/* 5. DOS BOTONES AL FINAL: [ Ver Detalle ] y [ Agregar ] */}
      <div className="p-3.5 pt-0 grid grid-cols-2 gap-2 mt-auto">
        <button
          type="button"
          onClick={() => onSelectProductDetail && onSelectProductDetail(product)}
          className="py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500" />
          <span>Ver Detalle</span>
        </button>

        <button
          type="button"
          onClick={handleAddToCart}
          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white hover:shadow-lg hover:scale-102'
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Agregado</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 text-sky-200" />
              <span>Agregar</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default ProductCard;
