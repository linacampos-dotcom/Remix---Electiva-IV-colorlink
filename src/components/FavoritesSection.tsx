import React from 'react';
import { CatalogProduct, UserSession, CartItem } from '../types';
import { PINTUCO_CATALOG } from '../data/pintucoData';
import { 
  Heart, 
  ShoppingBag, 
  Calculator, 
  ExternalLink, 
  Trash2, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  User,
  Check
} from 'lucide-react';

interface FavoritesSectionProps {
  favoriteIds: string[];
  userSession: UserSession | null;
  onToggleFavorite: (productId: string) => void;
  onSelectProductForDetail: (product: CatalogProduct) => void;
  onAddToCart: (item: CartItem) => void;
  onNavigateToCatalog: () => void;
  onNavigateToQuote: (productName: string) => void;
}

export const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  favoriteIds,
  userSession,
  onToggleFavorite,
  onSelectProductForDetail,
  onAddToCart,
  onNavigateToCatalog,
  onNavigateToQuote,
}) => {
  const favoriteProducts = PINTUCO_CATALOG.filter((p) => favoriteIds.includes(p.id));
  const userName = userSession?.nombre || 'Invitado';
  const isLoggedIn = Boolean(userSession?.isLoggedIn && userSession?.nombre);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header Banner Mis Favoritos (Brisa Marina) */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 shadow-2xs">
              <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
              Lista de Interés Personalizada
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
              <User className="w-3 h-3 text-teal-600" />
              {isLoggedIn ? `Usuario: ${userName}` : 'Modo Invitado (Almacenado local)'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Mis Productos Favoritos
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Accede rápidamente a tus pinturas, recubrimientos y esmaltes preferidos. Cotiza proyectos específicos o agrégalos a tu carrito de compras en un solo clic.
          </p>
        </div>

        {/* Counter Badge */}
        <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center min-w-[170px] shadow-xs shrink-0">
          <div className="flex items-center gap-1.5 text-3xl font-black text-rose-600">
            <Heart className="w-6 h-6 fill-rose-600" />
            <span>{favoriteProducts.length}</span>
          </div>
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider mt-1">
            {favoriteProducts.length === 1 ? 'Producto Guardado' : 'Productos Guardados'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Sincronizado con tu cuenta</span>
        </div>
      </div>

      {/* Main Content: Empty State or Grid */}
      {favoriteProducts.length === 0 ? (
        /* Estado vacío amigable solicitado por el usuario */
        <div className="p-8 sm:p-14 rounded-3xl bg-white border border-slate-200 text-center max-w-2xl mx-auto shadow-sm space-y-5 animate-fadeIn">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center shadow-xs">
            <Heart className="w-10 h-10 text-rose-500 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Aún no tienes productos guardados en tus favoritos
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Explora nuestro catálogo oficial de Pintuco y haz clic en el ícono de corazón en cualquier producto para guardarlo aquí y consultarlo cuando desees.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onNavigateToCatalog}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Explorar Catálogo de Productos →</span>
            </button>
          </div>
        </div>
      ) : (
        /* Grid de Productos Favoritos */
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <span className="text-xs font-bold text-slate-600">
              Mostrando {favoriteProducts.length} {favoriteProducts.length === 1 ? 'producto favorito' : 'productos favoritos'}
            </span>
            <button
              type="button"
              onClick={onNavigateToCatalog}
              className="text-xs text-blue-900 hover:text-teal-600 font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Agregar más desde el catálogo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProducts.map((p) => {
              const priceGalon = p.precioGalon || 79900;
              const priceCunete = p.precioCunete || Math.round(priceGalon * 4.5);

              return (
                <div
                  key={p.id}
                  className="group bg-white rounded-2xl border border-slate-200/80 hover:border-teal-500/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Top Image with Badges */}
                    <div className="relative h-48 w-full bg-sky-50/50 overflow-hidden flex items-center justify-center p-3">
                      <img
                        src={p.imagenUrl}
                        alt={p.nombre}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            p.marca === 'Pintuco' ? 'bg-blue-900 text-white' : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {p.marca}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/90 text-slate-800 backdrop-blur-xs border border-slate-200 shadow-2xs">
                          {p.linea}
                        </span>
                      </div>

                      {/* Favorite Active Button (Top Right) */}
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(p.id)}
                        className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 hover:bg-rose-50 text-rose-500 border border-rose-200 shadow-xs backdrop-blur-xs transition-all cursor-pointer hover:scale-110"
                        title="Quitar de mis favoritos"
                      >
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      </button>

                      {/* SKU and Warranty (Bottom Image) */}
                      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] text-slate-600">
                        <span className="font-mono bg-white/90 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                          SKU: {p.skuBase}
                        </span>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          {p.garantiaAnos ? `${p.garantiaAnos} Años` : p.garantia}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 
                          onClick={() => onSelectProductForDetail(p)}
                          className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors cursor-pointer leading-snug"
                        >
                          {p.nombre}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {p.descripcion}
                        </p>
                      </div>

                      {/* Technical Specs Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {p.tipoUso && p.tipoUso.slice(0, 2).map((uso) => (
                          <span
                            key={uso}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200"
                          >
                            {uso}
                          </span>
                        ))}
                        <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-[10px] font-semibold border border-teal-200">
                          Rend: {p.rendimientoBaseM2 || 30} m²/gal
                        </span>
                      </div>

                      {/* Reference Pricing */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Precio Ref. Galón:</span>
                          <span className="text-sm font-black text-slate-900">
                            ${priceGalon.toLocaleString('es-CO')} <span className="text-[10px] font-normal text-slate-500">COP</span>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Cuñete (5 Gal):</span>
                          <span className="text-xs font-bold text-teal-700">
                            ${priceCunete.toLocaleString('es-CO')} COP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToQuote(p.nombre)}
                      className="px-3 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>Cotizar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const cartItem: CartItem = {
                          id: `${p.id}-fav-galon-${Date.now()}`,
                          nombre: p.nombre,
                          sku: p.skuBase,
                          presentacion: 'Galón',
                          cantidad: 1,
                          colorSeleccionado: p?.coloresCertificados?.[0] || 'Blanco Puro Mate 1001',
                          precioUnitario: priceGalon,
                          marca: p.marca,
                          imagenUrl: p.imagenUrl,
                        };
                        onAddToCart(cartItem);
                      }}
                      className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Al Carrito</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Footer Navigation */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-600 font-medium">
              ¿Deseas guardar más productos? Navega nuestro portafolio de más de 100 referencias de calidad.
            </span>
            <button
              type="button"
              onClick={onNavigateToCatalog}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-blue-900" />
              <span>Ir al Catálogo de Productos</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
