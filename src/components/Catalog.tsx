import React, { useState, useMemo, useEffect } from 'react';
import { getLiveCatalog, CATALOG_CATEGORIES } from '../data/pintucoData';
import { CatalogProduct, CartItem, CatalogCategoryKey } from '../types';
import { 
  Search, 
  Layers, 
  ShieldCheck, 
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  Sparkles,
  Percent,
  Sliders,
  Filter
} from 'lucide-react';
import { ProductCard } from './ProductCard';
import { CategoryTabs, MainCategoryTab } from './CategoryTabs';
import { ProductDetailModal } from './ProductDetailModal';

export interface CatalogProps {
  onSelectProductForQuote?: (product: CatalogProduct) => void;
  onAddToCart?: (item: CartItem) => void;
  onSelectProductDetail?: (product: CatalogProduct) => void;
  initialCategory?: string;
  favoriteIds?: string[];
  onToggleFavorite?: (productId: string) => void;
}

export const Catalog: React.FC<CatalogProps> = ({
  onSelectProductForQuote,
  onAddToCart,
  onSelectProductDetail,
  initialCategory,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  // Main Category Tab Filter: 'todos' | 'ofertas' | 'interior' | 'exterior' | 'herramientas'
  const [activeMainTab, setActiveMainTab] = useState<MainCategoryTab>(() => {
    // Check URL parameters first for direct links or reloads
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get('categoria') || params.get('cat');
      if (catParam) {
        const lower = catParam.toLowerCase();
        if (lower.includes('oferta') || lower.includes('promo')) return 'ofertas';
        if (lower.includes('interior') || lower.includes('vinilo')) return 'interior';
        if (lower.includes('exterior') || lower.includes('fachada') || lower.includes('koraza')) return 'exterior';
        if (lower.includes('herramienta') || lower.includes('brocha') || lower.includes('rodillo')) return 'herramientas';
        if (lower === 'todos') return 'todos';
      }
    }

    if (initialCategory) {
      const lower = initialCategory.toLowerCase();
      if (lower.includes('oferta') || lower.includes('promo')) return 'ofertas';
      if (lower.includes('interior') || lower.includes('vinilo')) return 'interior';
      if (lower.includes('exterior') || lower.includes('fachada') || lower.includes('koraza')) return 'exterior';
      if (lower.includes('herramienta') || lower.includes('brocha') || lower.includes('rodillo')) return 'herramientas';
    }
    return 'todos';
  });

  // Synchronize state when initialCategory prop changes
  React.useEffect(() => {
    if (initialCategory) {
      const lower = initialCategory.toLowerCase();
      if (lower.includes('oferta') || lower.includes('promo')) setActiveMainTab('ofertas');
      else if (lower.includes('interior') || lower.includes('vinilo')) setActiveMainTab('interior');
      else if (lower.includes('exterior') || lower.includes('fachada') || lower.includes('koraza')) setActiveMainTab('exterior');
      else if (lower.includes('herramienta') || lower.includes('brocha') || lower.includes('rodillo')) setActiveMainTab('herramientas');
      else if (lower === 'todos') setActiveMainTab('todos');
    }
  }, [initialCategory]);

  // Synchronize active category with URL query param so reloading preserves selection
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (activeMainTab === 'todos') {
      url.searchParams.delete('categoria');
      url.searchParams.delete('cat');
    } else {
      url.searchParams.set('categoria', activeMainTab);
    }
    window.history.replaceState({}, '', url.toString());
  }, [activeMainTab]);

  // Sidebar Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAcabado, setSelectedAcabado] = useState<string>('Todos');
  const [selectedGarantia, setSelectedGarantia] = useState<string>('Todas');
  const [selectedBrand, setSelectedBrand] = useState<'all' | 'Pintuco' | 'Color In'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 700000]);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'warranty-desc' | 'name-asc'>('relevance');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Technical Detail Modal state
  const [localDetailProduct, setLocalDetailProduct] = useState<CatalogProduct | null>(null);

  // Reactive Catalog Products (Synchronized in real-time with Corporate Inventory)
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>(() => getLiveCatalog());

  useEffect(() => {
    const handleSync = () => {
      setCatalogProducts(getLiveCatalog());
    };
    window.addEventListener('colorlink_inventory_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('colorlink_inventory_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Filter options
  const acabadosOptions = [
    { id: 'Todos', label: 'Todos los Acabados' },
    { id: 'Mate', label: 'Mate' },
    { id: 'Satinado', label: 'Satinado' },
    { id: 'Semibrillante', label: 'Semibrillante' },
    { id: 'Brillante', label: 'Brillante' },
  ];

  const garantiasOptions = [
    { id: 'Todas', label: 'Todas las Garantías' },
    { id: '13', label: '13 Años (Protección Extrema)' },
    { id: '8', label: '8 Años (Elastomérico)' },
    { id: '5', label: '5 Años (Estándar NTC)' },
    { id: '3', label: '3 Años (Básico)' },
  ];

  // Helper to determine if a product matches a category tab
  const matchesTabCategory = (product: CatalogProduct, tab: MainCategoryTab): boolean => {
    if (tab === 'todos') return true;

    if (tab === 'ofertas') {
      return Boolean(product.enOferta || product.badgeOferta || (product.descuentoPorcentaje && product.descuentoPorcentaje > 0));
    }

    const catKey = product.categoriaCatalogo;
    const name = product.nombre.toLowerCase();
    const linea = product.linea.toLowerCase();
    const tipo = product.tipoPintura.toLowerCase();

    if (tab === 'interior') {
      return (
        catKey === 'interiores' ||
        linea.includes('interior') ||
        tipo.includes('vinilo') ||
        name.includes('viniltex') ||
        name.includes('intervinil') ||
        Boolean(product.tipoUso?.includes('Interiores'))
      );
    }

    if (tab === 'exterior') {
      return (
        catKey === 'exteriores' ||
        linea.includes('exterior') ||
        linea.includes('fachada') ||
        name.includes('koraza') ||
        tipo.includes('elastomérica') ||
        Boolean(product.tipoUso?.includes('Exteriores'))
      );
    }

    if (tab === 'herramientas') {
      return (
        catKey === 'herramientas' ||
        Boolean(product.variantes && product.variantes.length > 0) ||
        linea.includes('herramienta') ||
        name.includes('brocha') ||
        name.includes('rodillo') ||
        name.includes('lija') ||
        name.includes('espátula') ||
        name.includes('cinta') ||
        name.includes('bandeja')
      );
    }

    return true;
  };

  // Counts for each tab
  const tabCounts = useMemo(() => {
    const counts: Record<MainCategoryTab, number> = {
      todos: catalogProducts.length,
      ofertas: 0,
      interior: 0,
      exterior: 0,
      herramientas: 0,
    };

    catalogProducts.forEach((p) => {
      if (matchesTabCategory(p, 'ofertas')) counts.ofertas++;
      if (matchesTabCategory(p, 'interior')) counts.interior++;
      if (matchesTabCategory(p, 'exterior')) counts.exterior++;
      if (matchesTabCategory(p, 'herramientas')) counts.herramientas++;
    });

    return counts;
  }, [catalogProducts]);

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    const list = catalogProducts.filter((p) => {
      // 1. Category Tab Filter
      if (!matchesTabCategory(p, activeMainTab)) {
        return false;
      }

      // 2. Search Keyword / SKU
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const inName = p.nombre.toLowerCase().includes(query);
        const inDesc = p.descripcion.toLowerCase().includes(query);
        const inSku = p.skuBase.toLowerCase().includes(query);
        const inLinea = p.linea.toLowerCase().includes(query);
        const inTipo = p.tipoPintura.toLowerCase().includes(query);
        const inVariants = p.variantes?.some(v => v.nombre.toLowerCase().includes(query) || v.medida.toLowerCase().includes(query));

        if (!inName && !inDesc && !inSku && !inLinea && !inTipo && !inVariants) {
          return false;
        }
      }

      // 3. Acabado
      if (selectedAcabado !== 'Todos') {
        if (!p.acabado.toLowerCase().includes(selectedAcabado.toLowerCase())) {
          return false;
        }
      }

      // 4. Garantía
      if (selectedGarantia !== 'Todas') {
        const anos = parseInt(selectedGarantia, 10);
        if ((p.garantiaAnos || 0) < anos) {
          return false;
        }
      }

      // 5. Marca
      if (selectedBrand !== 'all') {
        if (p.marca !== selectedBrand) {
          return false;
        }
      }

      // 6. Rango de Precio
      const minPrice = p.precioGalon || p.precioUnidad || 0;
      if (minPrice < priceRange[0] || minPrice > priceRange[1]) {
        return false;
      }

      return true;
    });

    // Sorting
    return [...list].sort((a, b) => {
      const priceA = a.precioGalon || a.precioUnidad || 0;
      const priceB = b.precioGalon || b.precioUnidad || 0;

      switch (sortBy) {
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'warranty-desc':
          return (b.garantiaAnos || 0) - (a.garantiaAnos || 0);
        case 'name-asc':
          return a.nombre.localeCompare(b.nombre);
        case 'relevance':
        default:
          return 0;
      }
    });
  }, [activeMainTab, searchTerm, selectedAcabado, selectedGarantia, selectedBrand, priceRange, sortBy]);

  const hasActiveFilters = 
    activeMainTab !== 'todos' ||
    searchTerm.trim() !== '' ||
    selectedAcabado !== 'Todos' ||
    selectedGarantia !== 'Todas' ||
    selectedBrand !== 'all' ||
    priceRange[1] < 700000;

  const handleResetFilters = () => {
    setActiveMainTab('todos');
    setSearchTerm('');
    setSelectedAcabado('Todos');
    setSelectedGarantia('Todas');
    setSelectedBrand('all');
    setPriceRange([0, 700000]);
    setSortBy('relevance');
  };

  const handleOpenDetail = (product: CatalogProduct) => {
    if (onSelectProductDetail) {
      onSelectProductDetail(product);
    } else {
      setLocalDetailProduct(product);
    }
  };

  return (
    /* =========================================================================
        CONTENEDOR PRINCIPAL CON ESPACIADO COMPACTO Y CONTINUO:
        overflow-x-hidden w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2.5 sm:space-y-3
    ========================================================================= */
    <div className="overflow-x-hidden w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2.5 sm:space-y-3 scroll-smooth">
      
      {/* 1. Header Banner Oficial Pintuco Compacto */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 text-white rounded-2xl p-3.5 sm:p-4 lg:p-5 border border-blue-800/40 shadow-md relative overflow-hidden w-full max-w-full">
        {/* Soft sky and aqua decorative organic glows */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-sky-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black shadow-xs uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>Portafolio Oficial Certificado NTC 1335</span>
            </span>
            <span className="text-[11px] text-sky-200/90 font-medium">
              Despacho a Obra en 1.103 Municipios de Colombia
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Catálogo
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
            Pinturas para interior con máxima lavabilidad, protección climática extrema para fachadas exteriores y una línea completa de herramientas profesionales de aplicación.
          </p>
        </div>
      </div>

      {/* =======================================================================
          2. BARRA DE NAVEGACIÓN POR CATEGORÍAS SUPERIOR (CategoryTabs)
          - Orden exacto: Todos | Ofertas | Pintura Interior | Pintura Exterior ☀️ | Herramientas
          - Padding vertical compacto y scroll contenido
      ======================================================================= */}
      <div className="sticky top-2 z-20 bg-white/90 backdrop-blur-md rounded-xl border border-white/60 p-1.5 sm:p-2 shadow-md w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Componente CategoryTabs */}
          <div className="flex-1 min-w-0">
            <CategoryTabs
              activeTab={activeMainTab}
              onSelectTab={(tab) => setActiveMainTab(tab)}
              counts={tabCounts}
            />
          </div>

          {/* Botón de Filtros para móviles y Ordenar */}
          <div className="flex items-center gap-2 shrink-0 sm:self-center">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-blue-900" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              )}
            </button>

            {/* Ordenar por */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 shrink-0">
              <span className="hidden md:inline font-bold text-[11px]">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-1 px-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900 cursor-pointer"
              >
                <option value="relevance">Relevancia Pintuco</option>
                <option value="price-asc">Precio: Menor a Mayor</option>
                <option value="price-desc">Precio: Mayor a Menor</option>
                <option value="warranty-desc">Mayor Garantía</option>
                <option value="name-asc">Nombre A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          3. MAIN LAYOUT: SIDEBAR FILTERS + PRODUCT GRID FLUIDA Y COMPACTA
      ======================================================================= */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 items-start w-full max-w-full">
        
        {/* SIDEBAR DE FILTROS TÉCNICOS (Colapsable en móviles, fijo en lg) */}
        <aside className={`w-full lg:w-60 shrink-0 bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4 lg:sticky lg:top-20 z-10 ${
          isMobileFilterOpen ? 'block' : 'hidden lg:block'
        }`}>
          {/* Header & Reset Button */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5 font-black text-xs text-slate-900 uppercase tracking-wide">
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-900" />
              <span>Filtros Específicos</span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors cursor-pointer"
                title="Limpiar todos los filtros"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {/* Búsqueda por palabra clave o SKU */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Buscar Producto
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej. Viniltex, Brocha, Lija..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-blue-900 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-700 absolute right-2.5 top-2.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Acabado */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Acabado
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {acabadosOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedAcabado(opt.id)}
                  className={`px-2 py-1.5 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                    selectedAcabado === opt.id
                      ? 'bg-blue-900 text-white font-bold shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rango de Precio (COP) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Precio Hasta
              </label>
              <span className="text-[11px] font-bold text-slate-700 font-mono">
                ${priceRange[1].toLocaleString('es-CO')}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={700000}
              step={5000}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value, 10)])}
              className="w-full accent-blue-900 cursor-pointer"
            />
          </div>

          {/* Garantía */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Garantía Certificada
            </label>
            <div className="space-y-1">
              {garantiasOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedGarantia(opt.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedGarantia === opt.id
                      ? 'bg-amber-50 text-amber-900 font-extrabold border border-amber-200 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedGarantia === opt.id && <Check className="w-3.5 h-3.5 text-amber-700" />}
                </button>
              ))}
            </div>
          </div>

          {/* Marca */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Marca
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedBrand('all')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedBrand === 'all'
                    ? 'bg-blue-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setSelectedBrand('Pintuco')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedBrand === 'Pintuco'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pintuco
              </button>
              <button
                type="button"
                onClick={() => setSelectedBrand('Color In')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedBrand === 'Color In'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Color In
              </button>
            </div>
          </div>
        </aside>

        {/* =====================================================================
            GRILLA FLUIDA DE PRODUCTOS
            - Exactamente según requerimiento:
              grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full
        ===================================================================== */}
        <main className="flex-1 w-full min-w-0">
          
          {/* Header de Resultados */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900">
                {activeMainTab === 'todos' && 'Catálogo Completo'}
                {activeMainTab === 'ofertas' && 'Ofertas y Promociones'}
                {activeMainTab === 'interior' && 'Línea de Interiores (Vinilos)'}
                {activeMainTab === 'exterior' && 'Línea de Exteriores y Fachadas ☀️'}
                {activeMainTab === 'herramientas' && 'Herramientas y Accesorios de Pintura'}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
              </span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Mostrar todos</span>
              </button>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            /* Estado Vacío */
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm w-full">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl">
                🔍
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  No se encontraron productos en esta categoría
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Prueba restableciendo los filtros o buscando con una palabra clave diferente.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-full bg-blue-900 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm hover:bg-blue-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Filtros</span>
              </button>
            </div>
          ) : (
            /* =================================================================
                GRILLA FLUIDA: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full
            ================================================================= */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-full">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onSelectProductDetail={handleOpenDetail}
                  onSelectProductForQuote={onSelectProductForQuote}
                  isFavorite={favoriteIds?.includes(product.id)}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          )}

        </main>

      </div>

      {/* Modal de Ficha Técnica si se abre directamente */}
      {localDetailProduct && (
        <ProductDetailModal
          isOpen={Boolean(localDetailProduct)}
          onClose={() => setLocalDetailProduct(null)}
          product={localDetailProduct}
          onAddToCart={onAddToCart || (() => {})}
          onStartQuote={onSelectProductForQuote}
          isFavorite={favoriteIds?.includes(localDetailProduct.id)}
          onToggleFavorite={onToggleFavorite}
        />
      )}

    </div>
  );
};

export default Catalog;
