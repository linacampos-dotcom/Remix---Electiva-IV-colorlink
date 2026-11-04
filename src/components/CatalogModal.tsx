import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getLiveCatalog } from '../data/pintucoData';
import { CartItem, CatalogProduct } from '../types';
import { 
  X, 
  Layers, 
  Droplet, 
  Search, 
  ShoppingCart, 
  Check, 
  Sparkles, 
  Filter, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface CatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (productName: string) => void;
  onAddToCart?: (item: CartItem) => void;
}

export const CatalogModal: React.FC<CatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onAddToCart,
}) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedPresentations, setSelectedPresentations] = useState<Record<string, 'Galón' | 'Cuñete (5 Gal)'>>({});
  const [addedItemsMap, setAddedItemsMap] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const liveCatalog = getLiveCatalog();
  const filtered = liveCatalog.filter((p) => {
    const matchesFilter = 
      filter === 'all' || 
      p.marca.toLowerCase() === filter.toLowerCase() ||
      (filter === 'interiores' && p.presetAmbiente?.toLowerCase().includes('interior')) ||
      (filter === 'exteriores' && p.presetAmbiente?.toLowerCase().includes('exterior'));

    const matchesSearch = 
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.linea.toLowerCase().includes(search.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      p.skuBase.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleAddItemToCart = (product: CatalogProduct) => {
    if (!onAddToCart) return;

    const presentation = selectedPresentations[product.id] || 'Galón';
    const unitPrice = presentation === 'Cuñete (5 Gal)' ? product.precioCunete : product.precioGalon;

    const item: CartItem = {
      id: `${product.skuBase}-${presentation}-${Date.now()}`,
      sku: product.skuBase,
      nombre: product.nombre,
      precioUnitario: unitPrice,
      presentacion: presentation as any,
      cantidad: 1,
      subtotal: unitPrice,
      colorSeleccionado: 'Blanco Puro / Estándar',
      imagenUrl: product.imagenUrl,
      marca: product.marca,
    };

    onAddToCart(item);
    setAddedItemsMap((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemsMap((prev) => ({ ...prev, [product.id]: false }));
    }, 2500);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-hidden select-auto"
      style={{ zIndex: 9999, width: '100vw', height: '100vh' }}
    >
      <div 
        className="bg-white w-full max-w-[1200px] h-[94vh] sm:h-[90vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-slate-800 animate-scaleUp"
        style={{ maxWidth: '1200px', width: '100%', zIndex: 9999 }}
      >
        
        {/* Header Superior Corporativo */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-900 border border-blue-100 shadow-2xs">
              <Layers className="w-6 h-6 text-blue-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Catálogo Oficial Pintuco & Color In
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  Certificación NTC 1335
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Fichas técnicas, rendimientos oficiales certificados y adición directa al carrito
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
            title="Cerrar Catálogo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shrink-0">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar Koraza, Viniltex, Pintulux, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pintuco', label: 'Línea Pintuco' },
              { id: 'color in', label: 'Línea Color In' },
              { id: 'interiores', label: 'Interiores' },
              { id: 'exteriores', label: 'Exteriores' },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
                    active
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cuadrícula de Productos con Scroll Vertical Independiente */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50/50">
          {filtered.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">No encontramos productos con ese término</p>
              <p className="text-xs text-slate-500 mt-1">Prueba con palabras como "Viniltex", "Koraza", "Piedra" o "Esmalte"</p>
              <button
                onClick={() => { setSearch(''); setFilter('all'); }}
                className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold"
              >
                Restablecer Catálogo
              </button>
            </div>
          ) : (
            filtered.map((product) => {
              const currentPres = selectedPresentations[product.id] || 'Galón';
              const price = currentPres === 'Cuñete (5 Gal)' ? product.precioCunete : product.precioGalon;
              const isAdded = Boolean(addedItemsMap[product.id]);

              return (
                <div
                  key={product.id}
                  className="rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group shadow-2xs"
                >
                  {/* Foto del Producto */}
                  <div className="relative h-44 w-full bg-gradient-to-b from-sky-50/40 to-slate-50/70 p-3 flex items-center justify-center overflow-hidden">
                    <img
                      src={product.imagenUrl}
                      alt={product.nombre}
                      className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        product.marca === 'Pintuco' ? 'bg-blue-900 text-white' : 'bg-amber-500 text-slate-950'
                      }`}>
                        {product.marca}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/95 text-slate-800 border border-slate-200 shadow-2xs">
                        {product.linea}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px]">
                      <span className="text-teal-800 font-bold flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-md border border-teal-200 shadow-2xs">
                        <Droplet className="w-3 h-3 text-teal-600" />
                        {product.rendimientoEstimado}
                      </span>
                      <span className="bg-slate-900/80 text-white font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                        {product.garantia}
                      </span>
                    </div>
                  </div>

                  {/* Información Técnica y Precios */}
                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                        {product.tipoPintura}
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 leading-snug line-clamp-1 mt-0.5" title={product.nombre}>
                        {product.nombre}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {product.descripcion}
                      </p>

                      {/* Selector de Presentación */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Presentación:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedPresentations((p) => ({ ...p, [product.id]: 'Galón' }))}
                            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                              currentPres === 'Galón'
                                ? 'bg-blue-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Galón
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedPresentations((p) => ({ ...p, [product.id]: 'Cuñete (5 Gal)' }))}
                            className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                              currentPres === 'Cuñete (5 Gal)'
                                ? 'bg-blue-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            Cuñete
                          </button>
                        </div>
                      </div>

                      {/* Precio */}
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 font-mono">SKU: {product.skuBase}</span>
                        <div className="text-right">
                          <span className="text-sm font-black text-blue-950">
                            ${price.toLocaleString('es-CO')} COP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      {onAddToCart && (
                        <button
                          type="button"
                          onClick={() => handleAddItemToCart(product)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>¡Añadido al Carrito!</span>
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>+ Añadir al Carrito</span>
                            </>
                          )}
                        </button>
                      )}

                      {onSelectProduct && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProduct(product.nombre);
                            onClose();
                          }}
                          className="w-full py-1.5 text-[11px] font-bold text-slate-700 hover:text-blue-900 bg-slate-100 hover:bg-sky-50 rounded-xl transition-colors text-center cursor-pointer border border-slate-200"
                        >
                          Usar en Cotizador Inteligente →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            Mostrando <strong>{filtered.length}</strong> productos oficiales listos para despacho
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer ml-auto"
          >
            Cerrar Catálogo
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default CatalogModal;
