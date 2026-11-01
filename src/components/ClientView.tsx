import React, { useState, useEffect } from 'react';
import { FMVFormData, CalculationResult, COLORLINKOrder, CatalogProduct, CartItem, ClientNavigationTab, UserSession } from '../types';
import { FMVForm } from './FMVForm';
import { ClientOrderTracking } from './ClientOrderTracking';
import { ClientLandingHero } from './ClientLandingHero';
import { CatalogSection } from './CatalogSection';
import { FavoritesSection } from './FavoritesSection';
import { OutputSummary } from './OutputSummary';
import { BOMVisualizer } from './BOMVisualizer';
import { ColorPaletteVisualizer } from './ColorPaletteVisualizer';
import { ColombiaInteractiveMap } from './ColombiaInteractiveMap';
import { 
  FileText, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Send, 
  Clock, 
  ShieldCheck, 
  HelpCircle,
  Copy,
  Layers,
  Info,
  ArrowLeft,
  Home,
  PlusCircle,
  Calculator,
  ShoppingBag,
  Palette,
  Truck,
  Building2,
  Check,
  MapPin,
  Users,
  Lock,
  Award,
  Trees,
  Droplet,
  History,
  Phone,
  ArrowRight,
  Heart,
  Compass,
  Eye,
  Target,
  X
} from 'lucide-react';

import { SupabaseProducto } from '../lib/supabaseClient';

interface ClientViewProps {
  formData: FMVFormData;
  userSession?: UserSession | null;
  onChange: (field: keyof FMVFormData, value: any) => void;
  onApplyPreset: (presetData: FMVFormData) => void;
  onReset: () => void;
  onOpenNLPExtractor: () => void;
  onOpenChat: () => void;
  onOpenPrintable?: () => void;
  calculation: CalculationResult;
  onSaveOrder: () => Promise<void>;
  isSaving: boolean;
  orders: COLORLINKOrder[];
  lastSavedOrder?: COLORLINKOrder | null;
  supabaseProducts?: SupabaseProducto[];
  isUsingSupabaseCatalog?: boolean;
  onOpenCompanyHistory: () => void;
  onOpenCoverage: () => void;
  onOpenCorporateAuth?: () => void;
  onSelectProductDetail: (product: CatalogProduct) => void;
  onAddToCart: (item: CartItem) => void;
  onOpenCart: () => void;
  activeClientTab: ClientNavigationTab | 'tracking';
  setActiveClientTab: (tab: ClientNavigationTab | 'tracking') => void;
  onOpenOmniNotification?: (order: COLORLINKOrder) => void;
  catalogCategory?: string;
  onSelectCategory?: (category: string) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (productId: string) => void;
}

export const ClientView: React.FC<ClientViewProps> = ({
  formData,
  userSession,
  onChange,
  onApplyPreset,
  onReset,
  onOpenNLPExtractor,
  onOpenChat,
  onOpenPrintable,
  calculation,
  onSaveOrder,
  isSaving,
  orders,
  lastSavedOrder,
  supabaseProducts,
  isUsingSupabaseCatalog,
  onOpenCompanyHistory,
  onOpenCoverage,
  onOpenCorporateAuth,
  onSelectProductDetail,
  onAddToCart,
  onOpenCart,
  activeClientTab,
  setActiveClientTab,
  onOpenOmniNotification,
  catalogCategory,
  onSelectCategory,
  favoriteIds = [],
  onToggleFavorite = () => {},
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [addedCartNotice, setAddedCartNotice] = useState(false);
  const [selectedMilestoneYear, setSelectedMilestoneYear] = useState<string | null>(null);
  const [isNtcModalOpen, setIsNtcModalOpen] = useState<boolean>(false);
  const [isVocModalOpen, setIsVocModalOpen] = useState<boolean>(false);
  const [isObrasModalOpen, setIsObrasModalOpen] = useState<boolean>(false);
  const [isColorInModalOpen, setIsColorInModalOpen] = useState<boolean>(false);

  // Cerrar modales con tecla Escape
  useEffect(() => {
    if (!isNtcModalOpen && !isVocModalOpen && !isObrasModalOpen && !isColorInModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNtcModalOpen(false);
        setIsVocModalOpen(false);
        setIsObrasModalOpen(false);
        setIsColorInModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNtcModalOpen, isVocModalOpen, isObrasModalOpen, isColorInModalOpen]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleSelectProductForQuote = (product: CatalogProduct) => {
    // Preselect product in FMV form
    onChange('producto_deseado', product.nombre);

    if (product.presetSuperficie) {
      onChange('superficie', product.presetSuperficie);
    }
    if (product.presetAmbiente) {
      onChange('ambiente', product.presetAmbiente);
    }
    setActiveClientTab('cotizador');
  };

  // Add the materials calculated by the smart quote directly into the shopping cart
  const handleAddCalculationToCart = (
    customQtys?: { cunetes?: number; galones?: number; sellador?: number },
    proceedToCheckout: boolean = false,
    addedTools?: Array<{
      id: string;
      nombre: string;
      presentacion: 'Unidad' | 'Galón' | 'Cuarto (1/4 Gal)' | 'Caneca';
      cantidad: number;
      precioUnitario: number;
      sku: string;
      imagenUrl: string;
    }>
  ) => {
    const precioBaseGalon = 
      calculation.productoSugerido.includes('Koraza') ? 142000 :
      calculation.productoSugerido.includes('Baños') ? 128000 :
      calculation.productoSugerido.includes('Aquablock') ? 135000 : 115000;

    const precioCunete = Math.round(precioBaseGalon * 4.6);

    const cunetesCount = customQtys?.cunetes !== undefined ? customQtys.cunetes : calculation.cuñetesPintura;
    const galonesCount = customQtys?.galones !== undefined ? customQtys.galones : calculation.galonesSueltosPintura;
    const selladorCount = customQtys?.sellador !== undefined ? customQtys.sellador : 0;

    // 1. If cuñetes are required, add them
    if (cunetesCount > 0) {
      const cuneteItem: CartItem = {
        id: `cunete-${Date.now()}`,
        nombre: `${calculation.productoSugerido} (Cuñete 5 Gal)`,
        sku: 'PIN-CUN-05',
        presentacion: 'Cuñete (5 Gal)',
        cantidad: cunetesCount,
        precioUnitario: precioCunete,
        colorSeleccionado: formData.color_acabado,
        marca: 'Pintuco',
        imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
      };
      onAddToCart(cuneteItem);
    }

    // 2. If loose gallons are required, add them
    if (galonesCount > 0) {
      const galonItem: CartItem = {
        id: `galon-${Date.now() + 1}`,
        nombre: `${calculation.productoSugerido} (Galón 1 GL)`,
        sku: 'PIN-GAL-01',
        presentacion: 'Galón',
        cantidad: galonesCount,
        precioUnitario: precioBaseGalon,
        colorSeleccionado: formData.color_acabado,
        marca: 'Pintuco',
        imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
      };
      onAddToCart(galonItem);
    }

    // 3. If sealer is required, add sealer gallons
    if (selladorCount > 0) {
      const selladorItem: CartItem = {
        id: `sellador-${Date.now() + 2}`,
        nombre: 'Sellador Antihumedad Aquablock / Silicona Hidrófuga',
        sku: 'PIN-AQB-01',
        presentacion: 'Galón',
        cantidad: selladorCount,
        precioUnitario: 78000,
        marca: 'Pintuco',
        imagenUrl: '/src/assets/images/koraza_bucket_studio_1790894419359.jpg',
      };
      onAddToCart(selladorItem);
    }

    // 4. Herramientas complementarias sugeridas (SOLO si el usuario las seleccionó explícitamente)
    if (addedTools && addedTools.length > 0) {
      addedTools.forEach((tool, idx) => {
        if (tool.cantidad > 0) {
          const toolCartItem: CartItem = {
            id: `tool-${tool.id}-${Date.now() + 10 + idx}`,
            nombre: tool.nombre,
            sku: tool.sku,
            presentacion: tool.presentacion,
            cantidad: tool.cantidad,
            precioUnitario: tool.precioUnitario,
            marca: 'Pintuco',
            imagenUrl: tool.imagenUrl,
          };
          onAddToCart(toolCartItem);
        }
      });
    }

    setAddedCartNotice(true);
    setTimeout(() => setAddedCartNotice(false), 2500);
    onOpenCart();
  };

  return (
    <div className="space-y-2.5 sm:space-y-3 w-full max-w-full overflow-x-hidden">
      
      {/* Sub-Header Bar ONLY when outside home and outside cobertura */}
      {activeClientTab !== 'home' && activeClientTab !== 'cobertura' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-3.5 shadow-sm flex items-center justify-between gap-4 text-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveClientTab('home')}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-200 cursor-pointer"
              title="Volver a Inicio"
            >
              <ArrowLeft className="w-4 h-4 text-blue-900" />
              <span>Volver al Inicio</span>
            </button>
            
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {activeClientTab === 'catalog' && 'Catálogo'}
                  {activeClientTab === 'cotizador' && 'Cotizador en Línea • Cotiza tu Orden'}
                  {activeClientTab === 'nosotros' && 'Quiénes Somos • Trayectoria, Misión y Visión Pintuco'}
                  {activeClientTab === 'favorites' && 'Mis Productos Favoritos'}
                  {activeClientTab === 'tracking' && 'Mis Cotizaciones & Rastrear Despacho'}
                </h2>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  Oficial NTC 1335
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                {activeClientTab === 'catalog' && 'Filtros técnicos por uso, superficie, garantía y fichas técnicas certificadas'}
                {activeClientTab === 'cotizador' && 'Cálculo técnico de metros cuadrados (m²), consumos y cotización en tiempo real'}
                {activeClientTab === 'nosotros' && 'Misión, visión y más de 75 años transformando el país con innovación y calidad.'}
                {activeClientTab === 'favorites' && 'Tus productos preferidos guardados y vinculados a tu cuenta.'}
                {activeClientTab === 'tracking' && 'Consulta el estado de alistamiento en bodega y guía de despacho'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Banner after Submitting Order */}
      {lastSavedOrder && (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm text-emerald-900">
                ¡Cotización Radicada Exitosamente en Pintuco!
              </div>
              <p className="text-xs text-emerald-800">
                Su proyecto ha sido registrado en el sistema de abastecimiento de Pintuco con el número de orden:
                <strong className="font-mono ml-1.5 px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                  {lastSavedOrder.numeroOrden}
                </strong>
              </p>
              <div className="text-[11px] text-emerald-700">
                Puede consultar el alistamiento en bodega con su documento ({lastSavedOrder.form.documento}) en la pestaña "Mis Cotizaciones".
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleCopyId(lastSavedOrder.numeroOrden)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedId ? '¡Copiado!' : 'Copiar Orden'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveClientTab('tracking')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Rastrear en Bodega</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          1. TAB: HOME (E-commerce Corporate Landing)
      ===================================================================== */}
      {activeClientTab === 'home' && (
        <ClientLandingHero
          onNavigateTab={(tab, category) => {
            if (category && onSelectCategory) {
              onSelectCategory(category);
            } else {
              setActiveClientTab(tab);
            }
          }}
          onOpenChat={onOpenChat}
          onSelectSede={(sede) => {
            onChange('ciudad', sede.ciudad);
            onChange('departamento', sede.departamento);
            onChange('modalidad_entrega', 'retiro_tienda');
            onChange('sede_retiro', sede.nombre);
            setActiveClientTab('cotizador');
          }}
        />
      )}

      {/* =====================================================================
          2. TAB: CATALOG (Technical Catalog)
      ===================================================================== */}
      {activeClientTab === 'catalog' && (
        <div className="animate-fadeIn w-full max-w-full overflow-x-hidden">
          <CatalogSection
            onSelectProductForQuote={handleSelectProductForQuote}
            onAddToCart={onAddToCart}
            onSelectProductDetail={onSelectProductDetail}
            initialCategory={catalogCategory}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      )}

      {/* =====================================================================
          3. TAB: COTIZADOR INTELIGENTE (Calculadora Paso a Paso Wizard en 3 Pasos)
      ===================================================================== */}
      {activeClientTab === 'cotizador' && (
        <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
          <FMVForm
            formData={formData}
            onChange={onChange}
            onApplyPreset={onApplyPreset}
            onReset={onReset}
            onOpenNLPExtractor={onOpenNLPExtractor}
            supabaseProducts={supabaseProducts}
            isUsingSupabaseCatalog={isUsingSupabaseCatalog}
            calculation={calculation}
            userSession={userSession}
            onAddToCart={handleAddCalculationToCart}
            onSaveOrder={onSaveOrder}
            isSaving={isSaving}
            onOpenPrintable={onOpenPrintable}
            onOpenChat={onOpenChat}
          />
        </div>
      )}

      {/* =====================================================================
          4. TAB: COBERTURA Y TIENDAS (Mapa Interactivo Completo de Colombia)
      ===================================================================== */}
      {activeClientTab === 'cobertura' && (
        <div className="animate-fadeIn">
          <ColombiaInteractiveMap
            onSelectSede={(sede) => {
              onChange('ciudad', sede.ciudad);
              onChange('departamento', sede.departamento);
              onChange('modalidad_entrega', 'retiro_tienda');
              onChange('sede_retiro', sede.nombre);
              setActiveClientTab('cotizador');
            }}
            onGoToCotizador={() => setActiveClientTab('cotizador')}
            onBackToHome={() => setActiveClientTab('home')}
          />
        </div>
      )}

      {/* =====================================================================
          5. TAB: LÍNEA DE TIEMPO Y TRAYECTORIA DE PINTUCO (BRISA MARINA LIMPIO)
      ===================================================================== */}
      {activeClientTab === 'nosotros' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Header Banner Corporativo */}
          <div className="bg-white text-slate-800 p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-3 max-w-2xl relative z-10">
              <span className="px-3.5 py-1.5 rounded-full bg-teal-50 text-teal-800 font-extrabold text-xs border border-teal-200 inline-flex items-center gap-1.5 shadow-2xs">
                <History className="w-3.5 h-3.5 text-teal-600" />
                <span>1945 - Presente • Más de 75 Años</span>
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Línea de Tiempo y Trayectoria de Pintuco
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Más de 75 años transformando el país con innovación y calidad. Desde nuestra fundación en Medellín hasta integrarnos al Grupo AkzoNobel, descubre los hitos que consolidaron la máxima tecnología en pinturas de Colombia.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-200 text-center min-w-[210px] shadow-xs relative z-10">
              <span className="text-5xl font-black text-blue-900">75+</span>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider mt-1">Años de Calidad</span>
              <span className="text-[11px] text-teal-700 mt-0.5 font-semibold">Grupo AkzoNobel</span>
            </div>
          </div>

          {/* =========================================================================
              MISIÓN Y VISIÓN OFICIALES DE PINTUCO • GRUPO AKZONOBEL
          ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tarjeta Misión */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 hover:border-teal-500/80 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-teal-50/50 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform" />
              
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 block">
                    Propósito Institucional
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">Nuestra Misión</h3>
                </div>
              </div>

              <blockquote className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200 italic">
                “Ofrecer soluciones innovadoras y sostenibles de recubrimientos y pinturas que inspiran, protegen y transforman espacios, garantizando calidad técnica certificada y acompañamiento experto a nuestros clientes.”
              </blockquote>

              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800">Soluciones sostenibles</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">Protección y transformación</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">Acompañamiento experto en obra</span>
              </div>
            </div>

            {/* Tarjeta Visión */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 hover:border-blue-900/80 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-blue-50/50 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform" />
              
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 shadow-2xs">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block">
                    Visión Hacia el Futuro
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">Nuestra Visión</h3>
                </div>
              </div>

              <blockquote className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200 italic">
                “Ser la empresa líder en soluciones de color y recubrimientos en la región, reconocida por la transformación digital, la sostenibilidad ambiental y la excelencia en el servicio al cliente.”
              </blockquote>

              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">Líder regional de pinturas</span>
                <span className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800">Transformación digital COLORLINK</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">Sostenibilidad y excelencia</span>
              </div>
            </div>
          </div>

          {/* Interactive Milestone Quick-Slider / Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-xs font-bold text-slate-500 pl-2 shrink-0 hidden sm:inline">
              Navegar Hito:
            </span>
            <button
              type="button"
              onClick={() => setSelectedMilestoneYear(null)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                selectedMilestoneYear === null
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              Todos los Hitos (7)
            </button>
            {[
              { year: '1945', label: '1945 • Fundación' },
              { year: '1956', label: '1956 • Viniltex' },
              { year: '1959', label: '1959 • El Dorado' },
              { year: '1992', label: '1992 • Koraza' },
              { year: '1997', label: '1997 • Rionegro' },
              { year: '2019', label: '2019 • Carbono Neutro' },
              { year: 'presente', label: 'Presente • AkzoNobel' },
            ].map((m) => (
              <button
                key={m.year}
                type="button"
                onClick={() => setSelectedMilestoneYear(selectedMilestoneYear === m.year ? null : m.year)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedMilestoneYear === m.year
                    ? 'bg-teal-600 text-white font-extrabold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Timeline Milestones Cards (Vertical Layout with Left Connector) */}
          <div className="relative pl-6 sm:pl-10 space-y-6">
            {/* Continuous Vertical Accent Line */}
            <div className="absolute left-2.5 sm:left-4 top-4 bottom-4 w-1 bg-gradient-to-b from-blue-900 via-teal-500 to-sky-400 rounded-full" />

            {/* Hito 1: 1945 */}
            {(!selectedMilestoneYear || selectedMilestoneYear === '1945') && (
              <div className="relative group bg-white border border-slate-200 hover:border-teal-500/80 rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md transition-all">
                <div className="absolute -left-7 sm:-left-9.5 top-6 w-5 h-5 rounded-full bg-blue-900 border-4 border-slate-50 shadow-xs group-hover:scale-125 transition-transform" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-blue-900 text-white font-black text-xs sm:text-sm tracking-wider shadow-xs">
                      1945
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Fundación de Pintuco en Medellín
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 w-fit">
                    Germán Saldarriaga del Valle
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                  Fundación de Pintuco en Medellín por <strong>Germán Saldarriaga del Valle</strong>. Nace Pinturas Colombianas S.A. como la primera gran planta industrial nacional de esmaltes, lacas y recubrimientos protectores, impulsando el desarrollo constructivo de Antioquia y el país.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900">Medellín, Colombia</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Primera Planta Nacional</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Pinturas Colombianas S.A.</span>
                </div>
              </div>
            )}

            {/* Hito 2: 1956 */}
            {(!selectedMilestoneYear || selectedMilestoneYear === '1956') && (
              <div className="relative group bg-white border border-slate-200 hover:border-teal-500/80 rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md transition-all">
                <div className="absolute -left-7 sm:-left-9.5 top-6 w-5 h-5 rounded-full bg-teal-600 border-4 border-slate-50 shadow-xs group-hover:scale-125 transition-transform" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-teal-600 text-white font-black text-xs sm:text-sm tracking-wider shadow-xs">
                      1956
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Lanzamiento de Viniltex y Centro del Color
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 w-fit">
                    Primer Centro del Color en Bogotá
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                  Lanzamiento de <strong>Viniltex</strong> y apertura del primer Centro del Color en Bogotá. Viniltex se convierte en el referente indiscutible de las pinturas arquitectónicas en Colombia gracias a su lavabilidad, durabilidad y amplia gama tonal.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800">Viniltex Tipo 1</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Centro del Color Bogotá</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Carta de Color Oficial</span>
                </div>
              </div>
            )}

            {/* Hito 3: 1959 */}
            {(!selectedMilestoneYear || selectedMilestoneYear === '1959') && (
              <div className="relative group bg-white border border-slate-200 hover:border-teal-500/80 rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md transition-all">
                <div className="absolute -left-7 sm:-left-9.5 top-6 w-5 h-5 rounded-full bg-blue-800 border-4 border-slate-50 shadow-xs group-hover:scale-125 transition-transform" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-blue-900 text-white font-black text-xs sm:text-sm tracking-wider shadow-xs">
                      1959
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Acabados del Aeropuerto Internacional El Dorado
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 w-fit">
                    Esmaltes Pintulux
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                  Acabados del <strong>Aeropuerto Internacional El Dorado</strong> con esmaltes <strong>Pintulux</strong>. La terminal aeroportuaria más importante del país confía en la protección anticorrosiva y estética de Pintuco, consolidando la presencia de la marca en grandes obras públicas.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900">Aeropuerto El Dorado</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Esmaltes Pintulux</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Grandes Obras Nacionales</span>
                </div>
              </div>
            )}

            {/* Hito 4: 1992 */}
            {(!selectedMilestoneYear || selectedMilestoneYear === '1992') && (
              <div className="relative group bg-white border border-slate-200 hover:border-teal-500/80 rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md transition-all">
                <div className="absolute -left-7 sm:-left-9.5 top-6 w-5 h-5 rounded-full bg-emerald-600 border-4 border-slate-50 shadow-xs group-hover:scale-125 transition-transform" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-teal-700 text-white font-black text-xs sm:text-sm tracking-wider shadow-xs">
                      1992
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Creación de Koraza y Pinturas para Exteriores
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 w-fit">
                    Pioneros en Fachadas
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                  Creación de <strong>Koraza</strong> y apertura de la categoría de pinturas especializadas para exteriores. Una formulación 100% acrílica de máxima elasticidad y resistencia a la intemperie tropical, agua de lluvia y radiación solar extrema.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800">Koraza Acrílica</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Protección Fachadas</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Clima Extremo</span>
                </div>
              </div>
            )}

            {/* Hito 5: 1997 */}
            {(!selectedMilestoneYear || selectedMilestoneYear === '1997') && (
              <div className="relative group bg-white border border-slate-200 hover:border-teal-500/80 rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md transition-all">
                <div className="absolute -left-7 sm:-left-9.5 top-6 w-5 h-5 rounded-full bg-cyan-600 border-4 border-slate-50 shadow-xs group-hover:scale-125 transition-transform" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-teal-600 text-white font-black text-xs sm:text-sm tracking-wider shadow-xs">
                      1997
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Inauguración del Centro de Producción en Rionegro
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 w-fit">
                    Megaplanta Rionegro, Antioquia
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                  Inauguración del <strong>centro de producción en Rionegro, Antioquia</strong>. Considerada una de las megaplantas automatizadas más modernas y con mayor capacidad tecnológica de América Latina, con procesos limpios y almacenamiento de gran escala.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800">Rionegro, Antioquia</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Megaplanta Automatizada</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Capacidad Continental</span>
                </div>
              </div>
            )}

            {/* Hito 6: 2019 */}
            {(!selectedMilestoneYear || selectedMilestoneYear === '2019') && (
              <div className="relative group bg-white border border-slate-200 hover:border-teal-500/80 rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md transition-all">
                <div className="absolute -left-7 sm:-left-9.5 top-6 w-5 h-5 rounded-full bg-emerald-600 border-4 border-slate-50 shadow-xs group-hover:scale-125 transition-transform" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-emerald-700 text-white font-black text-xs sm:text-sm tracking-wider shadow-xs">
                      2019
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Certificación de Carbono Neutro y Líneas Ecológicas
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
                    Eco / Greenguard Gold
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                  <strong>Certificación de Carbono Neutro</strong> y lanzamiento de líneas ecológicas (Eco / Greenguard Gold). Pintuco marca un hito de sostenibilidad nacional al formular productos base agua con cero metales pesados y bajo contenido de VOC, permitiendo habitar los espacios de inmediato.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800">Carbono Neutro</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Greenguard Gold</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Bajo VOC & Cero Plomo</span>
                </div>
              </div>
            )}

            {/* Hito 7: Presente (AkzoNobel) */}
            {(!selectedMilestoneYear || selectedMilestoneYear === 'presente') && (
              <div className="relative group bg-white border border-teal-200 hover:border-teal-400 rounded-3xl p-5 sm:p-7 shadow-xs hover:shadow-md transition-all">
                <div className="absolute -left-7 sm:-left-9.5 top-6 w-5 h-5 rounded-full bg-teal-600 border-4 border-slate-50 shadow-xs group-hover:scale-125 transition-transform" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl bg-blue-900 text-white font-black text-xs sm:text-sm tracking-wider shadow-xs">
                      Presente
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Integración al Grupo AkzoNobel
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 w-fit">
                    Liderazgo Global en Pinturas
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                  Integración al <strong>Grupo AkzoNobel</strong>, consolidando la máxima tecnología e innovación en pinturas a nivel global. Pintuco une su profundo arraigo en Colombia con los centros mundiales de investigación de AkzoNobel, impulsando recubrimientos de grado aeroespacial, naval, arquitectónico y la plataforma digital <strong>COLORLINK</strong>.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800">Grupo AkzoNobel Global</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-900">COLORLINK Digital</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">Tecnología de Clase Mundial</span>
                </div>
              </div>
            )}
          </div>

          {/* Pilares Técnicos Corporativos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tarjeta 1: Norma Técnica NTC 1335 (Interactiva con Modal Pop-up) */}
            <button
              type="button"
              onClick={() => setIsNtcModalOpen(true)}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-900/60 shadow-xs hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-900/20"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center group-hover:bg-blue-900 group-hover:text-white transition-colors shadow-2xs">
                  <Award className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                  Norma Técnica NTC 1335
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Rendimiento oficial medido en laboratorio: 30 a 32 m²/gal a 2 manos y resistencia a más de 20.000 ciclos de lavado.
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-blue-900 group-hover:text-teal-700 transition-colors">
                <span>Ver detalles</span>
                <span className="text-xs transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </button>

            {/* Tarjeta 2: Cero VOC & Sostenibilidad (Interactiva con Modal Pop-up) */}
            <button
              type="button"
              onClick={() => setIsVocModalOpen(true)}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-600/60 shadow-xs hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-100 flex items-center justify-center group-hover:bg-teal-700 group-hover:text-white transition-colors shadow-2xs">
                  <Trees className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  Cero VOC & Sostenibilidad
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fórmulas base agua de bajísimo olor. Permiten habitar los proyectos de inmediato protegiendo la salud de aplicadores y familias.
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-teal-700 group-hover:text-teal-900 transition-colors">
                <span>Ver detalles</span>
                <span className="text-xs transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </button>

            {/* Tarjeta 3: Grandes Obras del País (Interactiva con Modal Pop-up) */}
            <button
              type="button"
              onClick={() => setIsObrasModalOpen(true)}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-600/60 shadow-xs hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-800 border border-sky-100 flex items-center justify-center group-hover:bg-sky-700 group-hover:text-white transition-colors shadow-2xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-800 transition-colors">
                  Grandes Obras del País
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Presentes en el Aeropuerto El Dorado, Túnel de La Línea, estadios, hospitales y los complejos residenciales líderes.
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-sky-700 group-hover:text-sky-900 transition-colors">
                <span>Ver detalles</span>
                <span className="text-xs transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </button>

            {/* Tarjeta 4: Portafolio Color In (Interactiva con Modal Pop-up) */}
            <button
              type="button"
              onClick={() => setIsColorInModalOpen(true)}
              className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-600/60 shadow-xs hover:shadow-md transition-all duration-200 text-left flex flex-col justify-between cursor-pointer group hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-100 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-2xs">
                  <Droplet className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                  Portafolio Color In
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Alianza estratégica de pinturas comerciales con excelente costo-beneficio para proyectos institucionales y VIS.
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-bold text-amber-700 group-hover:text-amber-900 transition-colors">
                <span>Ver detalles</span>
                <span className="text-xs transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </button>
          </div>

          {/* Acciones de Navegación desde la Línea de Tiempo */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium">
              Pintuco S.A. • Grupo AkzoNobel • Nit 890.900.120-1 • Cobertura en 1.103 Municipios
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveClientTab('cotizador')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Calculator className="w-4 h-4 text-white" />
                <span>Cotiza tu Orden</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveClientTab('catalog')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4 text-blue-900" />
                <span>Ver Catálogo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveClientTab('cobertura')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition-all cursor-pointer"
              >
                <span>🗺️ Nuestras Sedes</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              MODAL EMERGENTE POP-UP: NORMA TÉCNICA NTC 1335
          ========================================================================= */}
          {isNtcModalOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ntc-modal-title"
              className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
              onClick={() => setIsNtcModalOpen(false)}
            >
              <div
                className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 relative my-8 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Encabezado del Modal */}
                <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Award className="w-6 h-6 text-teal-300" />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200 inline-block mb-1">
                        ICONTEC • Estándar Oficial
                      </span>
                      <h3 id="ntc-modal-title" className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                        Norma Técnica Colombiana NTC 1335 (Pinturas Tipo Emulsión)
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNtcModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cuerpo del Modal */}
                <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
                  {/* Detalle Técnico */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Detalle Técnico
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      Explicación técnica sobre los estándares de calidad ICONTEC para pinturas de uso arquitectónico en Colombia. La norma <strong>NTC 1335</strong> rige los requisitos fisicoquímicos, parámetros de viscosidad, contenido de no volátiles y desempeño de recubrimientos tipo emulsión al agua, garantizando la máxima durabilidad, cubrimiento óptimo y formulación segura tanto en interiores como en exteriores.
                    </p>
                  </div>

                  {/* Puntos Clave */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>Puntos Clave</span>
                    </h4>

                    {/* Punto 1: Rendimiento oficial */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Rendimiento oficial medido en laboratorio: 30 a 32 m²/gal a 2 manos.
                      </p>
                    </div>

                    {/* Punto 2: Resistencia a ciclos de lavado */}
                    <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Resistencia a más de 20.000 ciclos de lavado.
                      </p>
                    </div>

                    {/* Punto 3: Opacidad y adherencia */}
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Alta opacidad en seco y adherencia superior sobre mampostería y estuco.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pie del Modal */}
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    Pintuco S.A. • Certificación ICONTEC NTC 1335
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNtcModalOpen(false)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL EMERGENTE POP-UP: CERO VOC & SOSTENIBILIDAD AMBIENTAL
          ========================================================================= */}
          {isVocModalOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="voc-modal-title"
              className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
              onClick={() => setIsVocModalOpen(false)}
            >
              <div
                className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 relative my-8 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Encabezado del Modal */}
                <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Trees className="w-6 h-6 text-emerald-200" />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-50 text-teal-800 border border-teal-200 inline-block mb-1">
                        Sostenibilidad & Construcción Limpia
                      </span>
                      <h3 id="voc-modal-title" className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                        Cero VOC & Sostenibilidad Ambiental
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVocModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cuerpo del Modal */}
                <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
                  {/* Detalle */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Detalle
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      Formulación de bajo impacto ambiental desarrollada por Pintuco. Con tecnologías que reducen al mínimo la emisión de sustancias químicas al ambiente, garantizamos espacios interiores saludables y procesos constructivos alineados con los más estrictos compromisos ecológicos.
                    </p>
                  </div>

                  {/* Puntos Clave */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-teal-600" />
                      <span>Puntos Clave</span>
                    </h4>

                    {/* Punto 1: Fórmulas base agua de bajísimo olor */}
                    <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Fórmulas base agua de bajísimo olor para habitar de inmediato.
                      </p>
                    </div>

                    {/* Punto 2: Protección a la salud */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Protección a la salud de aplicadores y residentes.
                      </p>
                    </div>

                    {/* Punto 3: Sin VOC ni metales pesados */}
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Sin compuestos orgánicos volátiles (VOC) ni metales pesados (sin plomo ni mercurio).
                      </p>
                    </div>

                    {/* Punto 4: Aporte a puntos LEED */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Aporte a puntos LEED para construcciones sostenibles.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pie del Modal */}
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    Pintuco S.A. • Líneas Ecológicas Certificadas
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsVocModalOpen(false)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL EMERGENTE POP-UP: GRANDES OBRAS DEL PAÍS
          ========================================================================= */}
          {isObrasModalOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="obras-modal-title"
              className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
              onClick={() => setIsObrasModalOpen(false)}
            >
              <div
                className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 relative my-8 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Encabezado del Modal */}
                <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-sky-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Building2 className="w-6 h-6 text-sky-200" />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-50 text-sky-800 border border-sky-200 inline-block mb-1">
                        Infraestructura & Construcción Nacional
                      </span>
                      <h3 id="obras-modal-title" className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                        Proyectos Emblemáticos e Infraestructura Nacional
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsObrasModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cuerpo del Modal */}
                <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
                  {/* Detalle Técnico */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Detalle Técnico
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      Pintuco ha sido el aliado estratégico en la protección y acabado de las infraestructuras más importantes de Colombia. Con décadas de experiencia acompañando la ingeniería nacional, suministramos recubrimientos de alto rendimiento para obras civiles que exigen máxima resistencia, seguridad operativa y longevidad estructural.
                    </p>
                  </div>

                  {/* Puntos Clave */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-sky-600" />
                      <span>Puntos Clave</span>
                    </h4>

                    {/* Punto 1: Megaproyectos */}
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-sky-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Protección especializada en megaproyectos de túneles, viaductos, puentes y sistemas de transporte masivo (Metro, TransMilenio).
                      </p>
                    </div>

                    {/* Punto 2: Recubrimientos de durabilidad y anticorrosión */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Recubrimientos de altísima durabilidad y resistencia anticorrosiva para edificaciones institucionales, comerciales e industriales.
                      </p>
                    </div>

                    {/* Punto 3: Asesoría técnica en sitio */}
                    <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Asesoría técnica en sitio y especificación de sistemas de pintura de alto desempeño para condiciones extremas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pie del Modal */}
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    Pintuco S.A. • Grandes Obras de Colombia
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsObrasModalOpen(false)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-800 hover:bg-sky-900 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              MODAL EMERGENTE POP-UP: PORTAFOLIO COLOR IN
          ========================================================================= */}
          {isColorInModalOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="colorin-modal-title"
              className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
              onClick={() => setIsColorInModalOpen(false)}
            >
              <div
                className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 relative my-8 animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Encabezado del Modal */}
                <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Droplet className="w-6 h-6 text-amber-200" />
                    </div>
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 inline-block mb-1">
                        Color & Acabados Arquitectónicos
                      </span>
                      <h3 id="colorin-modal-title" className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                        Portafolio Especializado Color In
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsColorInModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
                    aria-label="Cerrar modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cuerpo del Modal */}
                <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
                  {/* Detalle Técnico */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Detalle Técnico
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      Soluciones de color y acabado de alta gama diseñadas para transformar espacios arquitectónicos e interiores. Desarrollado con resinas acrílicas de avanzada y pigmentos de máxima solidez a la luz para responder a las exigencias estéticas y funcionales de constructores, diseñadores y pintores profesionales.
                    </p>
                  </div>

                  {/* Puntos Clave */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Puntos Clave</span>
                    </h4>

                    {/* Punto 1: Gammas de color de alta definición */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Gammas de color de alta definición con durabilidad prolongada y excelente retención del tono con el tiempo.
                      </p>
                    </div>

                    {/* Punto 2: Acabados mate, satinados y semibrillantes */}
                    <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-100 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Acabados mate, satinados y semibrillantes de alta elegancia para decoración y mantenimiento de interiores.
                      </p>
                    </div>

                    {/* Punto 3: Facilidad de aplicación y nivelación */}
                    <div className="p-3.5 rounded-2xl bg-yellow-50/70 border border-yellow-200 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                        ✓
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        Facilidad de aplicación, excelente nivelación y secado rápido para proyectos residenciales y comerciales.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pie del Modal */}
                <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    Pintuco S.A. • Línea Comercial Color In
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsColorInModalOpen(false)}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer text-center"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =====================================================================
          6. TAB: FAVORITOS (Mis Productos Favoritos Vinculados a la Cuenta)
      ===================================================================== */}
      {activeClientTab === 'favorites' && (
        <FavoritesSection
          favoriteIds={favoriteIds}
          userSession={userSession || null}
          onToggleFavorite={onToggleFavorite}
          onSelectProductForDetail={onSelectProductDetail}
          onAddToCart={onAddToCart}
          onNavigateToCatalog={() => setActiveClientTab('catalog')}
          onNavigateToQuote={(productName) => {
            onChange('producto_deseado', productName);
            setActiveClientTab('cotizador');
          }}
        />
      )}

      {/* =====================================================================
          7. TAB: TRACKING (Mis Cotizaciones / Rastrear Despacho)
      ===================================================================== */}
      {activeClientTab === 'tracking' && (
        <div className="animate-fadeIn">
          <ClientOrderTracking
            orders={orders}
            userSession={userSession}
            onSelectNewOrderTab={() => setActiveClientTab('cotizador')}
            onOpenOmniNotification={onOpenOmniNotification}
          />
        </div>
      )}

    </div>
  );
};
