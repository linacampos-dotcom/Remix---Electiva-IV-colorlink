import React, { useState, useRef, useEffect } from 'react';
import { AppRole, CatalogProduct, UserSession, ClientNavigationTab } from '../types';
import { PINTUCO_CATALOG } from '../data/pintucoData';
import { openWhatsAppDirect, DEFAULT_WHATSAPP_PHONE, DEFAULT_WHATSAPP_MESSAGE } from '../utils/whatsappConfig';
import { BankInstallmentsModal } from './BankInstallmentsModal';
import { UserProfileDropdown, SectorPaintAvatar } from './UserProfileDropdown';
import { 
  Search, 
  ShoppingBag, 
  User, 
  Building2, 
  MapPin, 
  BookOpen, 
  Layers, 
  Calculator, 
  Bot, 
  Sparkles, 
  ClipboardList, 
  ChevronDown, 
  ShieldCheck, 
  Lock, 
  LogOut,
  X,
  ArrowRight,
  Phone,
  MessageCircle,
  Heart,
  CreditCard,
  Truck,
  Percent,
  Compass,
  Palette,
  Eye,
  Menu,
  Check,
  Home,
  Users,
  Camera,
  Clock,
  Bell
} from 'lucide-react';

interface HeaderProps {
  currentRole: AppRole;
  isAuthenticatedAdmin?: boolean;
  onRoleChange: (role: AppRole) => void;
  onLogoutAdmin?: () => void;
  onOpenHistory?: () => void;
  onOpenCatalog: () => void;
  onOpenChat: () => void;
  onOpenNLPExtractor: () => void;
  onOpenSmartQuote: () => void;
  onOpenCompanyHistory: () => void;
  onOpenCoverage: () => void;
  onOpenCart: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenCorporateAuth?: () => void;
  onOpenOmniNotification?: () => void;
  onSelectProduct: (product: CatalogProduct) => void;
  onSelectCategory?: (category: string) => void;
  activeClientTab?: ClientNavigationTab;
  onSelectClientTab?: (tab: ClientNavigationTab) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (productId: string) => void;
  ordersCount: number;
  cartCount: number;
  userSession: UserSession | null;
  onOpenProfile?: (tab?: 'datos' | 'pedidos' | 'orders' | 'direcciones' | 'seguridad') => void;
  onLogout?: () => void;
  onOpenNotifications?: (tab?: 'seguimiento' | 'pqrs' | 'notificaciones') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  isAuthenticatedAdmin = false,
  onRoleChange,
  onLogoutAdmin,
  onOpenHistory,
  onOpenCatalog,
  onOpenChat,
  onOpenNLPExtractor,
  onOpenSmartQuote,
  onOpenCompanyHistory,
  onOpenCoverage,
  onOpenCart,
  onOpenAuth,
  onOpenCorporateAuth,
  onOpenOmniNotification,
  onSelectProduct,
  onSelectCategory,
  activeClientTab = 'home',
  onSelectClientTab,
  favoriteIds,
  onToggleFavorite,
  ordersCount,
  cartCount,
  userSession,
  onOpenProfile,
  onLogout,
  onOpenNotifications,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isTopUserMenuOpen, setIsTopUserMenuOpen] = useState(false);
  const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState(false);
  const [favoritesList, setFavoritesList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('colorlink_favorites');
      return saved ? JSON.parse(saved) : ['vtx-avz', 'krz-dv'];
    } catch {
      return ['vtx-avz', 'krz-dv'];
    }
  });

  // Top banner rotating messages
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerMessages = [
    {
      icon: CreditCard,
      text: '3 CUOTAS SIN INTERÉS con bancos seleccionados',
      sub: 'En compras con tarjetas Visa y Mastercard',
    },
    {
      icon: Truck,
      text: 'AHORA ENVÍOS a nivel nacional',
      sub: 'Cobertura a los 32 departamentos y 1.103 municipios',
    },
  ];

  // Rotate banner every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % bannerMessages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerMessages.length]);

  const searchRef = useRef<HTMLDivElement>(null);
  const favoritesRef = useRef<HTMLDivElement>(null);
  const mobileFavoritesRef = useRef<HTMLDivElement>(null);
  const topUserMenuRef = useRef<HTMLDivElement>(null);

  // Manejo de condición clara de autenticación
  const isLoggedIn = Boolean(
    userSession && 
    (userSession.isLoggedIn === true || (userSession.email && userSession.email.trim().length > 0))
  );

  const userEmail = (userSession?.email || '').trim().toLowerCase();
  const avatarStorageKey = userEmail ? `colorlink_user_avatar_${userEmail}` : 'colorlink_user_avatar_guest';

  // Avatar de perfil persistente por usuario en localStorage
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const syncAvatar = () => {
      if (isLoggedIn && userEmail) {
        try {
          const saved = localStorage.getItem(avatarStorageKey);
          setAvatarUrl(saved || null);
        } catch {
          setAvatarUrl(null);
        }
      } else {
        setAvatarUrl(null);
      }
    };
    syncAvatar();
    window.addEventListener('colorlink_avatar_updated', syncAvatar);
    window.addEventListener('colorlink_user_changed', syncAvatar);
    return () => {
      window.removeEventListener('colorlink_avatar_updated', syncAvatar);
      window.removeEventListener('colorlink_user_changed', syncAvatar);
    };
  }, [isLoggedIn, userEmail, avatarStorageKey]);

  const activeUserName = React.useMemo(() => {
    if (userSession && userSession.nombre && userSession.nombre.trim()) {
      return userSession.nombre.trim().split(' ')[0];
    }
    return '';
  }, [userSession]);

  const userFullName = React.useMemo(() => {
    if (userSession && userSession.nombre && userSession.nombre.trim()) {
      return userSession.nombre;
    }
    return '';
  }, [userSession]);

  const pendingCount = Math.max(0, ordersCount || 0);
  const hasPendingOrders = isLoggedIn && pendingCount > 0;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (
        favoritesRef.current && 
        !favoritesRef.current.contains(e.target as Node) &&
        (!mobileFavoritesRef.current || !mobileFavoritesRef.current.contains(e.target as Node))
      ) {
        setIsFavoritesOpen(false);
      }
      if (topUserMenuRef.current && !topUserMenuRef.current.contains(e.target as Node)) {
        setIsTopUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = PINTUCO_CATALOG.filter((p) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.skuBase.toLowerCase().includes(q) ||
      p.linea.toLowerCase().includes(q) ||
      p.tipoPintura.toLowerCase().includes(q) ||
      (p.tipoUso && p.tipoUso.some((u) => u.toLowerCase().includes(q)))
    );
  }).slice(0, 6);

  const handleCategoryClick = (category: string) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    } else {
      onOpenCatalog();
    }
    setIsMobileMenuOpen(false);
  };

  const handleOpenWhatsApp = () => {
    openWhatsAppDirect(DEFAULT_WHATSAPP_PHONE, DEFAULT_WHATSAPP_MESSAGE);
  };

  const actualFavorites = favoriteIds !== undefined ? favoriteIds : favoritesList;
  const favoriteProducts = PINTUCO_CATALOG.filter((p) => actualFavorites.includes(p.id));

  const toggleFavorite = (productId: string) => {
    if (onToggleFavorite) {
      onToggleFavorite(productId);
      return;
    }
    setFavoritesList((prev) => {
      const next = prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('colorlink_favorites', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Validación estricta de rol para mostrar "Portal Funcionarios":
  // Solo se muestra si el correo pertenece a un dominio corporativo (@pintuco.com, @colcan.com, @akzonobel.com)
  // o si el rol en Supabase / sesión es 'funcionario' / 'admin' / 'administrador'.
  // Para clientes generales (@gmail.com, @hotmail.com, rol 'cliente', etc.), se OCULTA.
  const isCorporateOrAdminUser = (session?: UserSession | null): boolean => {
    if (!session) return false;
    const email = (session.email || '').trim().toLowerCase();
    
    // 1. Dominio corporativo oficial
    const isCorporateDomain = 
      email.endsWith('@pintuco.com') || 
      email.endsWith('@colcan.com') || 
      email.endsWith('@akzonobel.com');

    // 2. Rol en sesión / Supabase metadata
    const userType = (session.userType || '').toLowerCase();
    const corporateRole = (session.corporateRole || '').toLowerCase();
    const isStaffRole = 
      userType === 'funcionario' || 
      userType === 'administrador' || 
      userType === 'admin' ||
      session.isCorporate === true ||
      session.isSuperAdmin === true ||
      corporateRole.length > 0;

    return isCorporateDomain || isStaffRole;
  };

  const showCorporatePortalOption = isCorporateOrAdminUser(userSession);

  const currentBanner = bannerMessages[bannerIndex];
  const BannerIcon = currentBanner.icon;

  const isAnyDropdownOpen = isSearchOpen || isFavoritesOpen || isTopUserMenuOpen || isMobileMenuOpen;

  return (
    <header className={`main-header sticky top-0 z-[1000] shadow-lg w-full max-w-full bg-[#001D3D] border-b border-blue-900/60 relative transition-all duration-200 ${
      isAnyDropdownOpen ? 'overflow-visible has-dropdown-open' : 'overflow-hidden'
    }`}>
      
      {/* =========================================================================
          1. FRANJA SUPERIOR DE INFORMACIÓN (TOP BAR) - AZUL MARINO PROFUNDO #001224
          Avisos de servicio: Línea Nal. 01 8000 111 247, Pinturas Certificadas NTC 1335,
          3 cuotas sin interés y accesos a Conversemos y Sedes.
      ========================================================================= */}
      <div className="w-full bg-[#001224] text-sky-100 py-1 sm:py-1.5 border-b border-blue-950/80 select-none transition-colors">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between gap-2 sm:gap-3 min-w-0 text-xs font-semibold">
          
          {/* Izquierda: Línea Nacional & Certificación NTC 1335 */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-semibold text-sky-200 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 shadow-xs animate-pulse" />
              <span className="text-sky-100 font-medium hidden sm:inline">Línea Nal. 01 8000 111 247</span>
              <span className="text-sky-100 font-medium sm:hidden">01 8000 111 247</span>
            </div>
            <span className="text-blue-900/80 hidden md:inline" aria-hidden="true">|</span>
            <div className="hidden md:flex items-center gap-1 text-sky-200/90 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Pinturas Certificadas NTC 1335</span>
            </div>
          </div>

          {/* Centro: 3 Cuotas Sin Interés (Rotativo interactivo) + Ver Bancos */}
          <div className="flex-1 flex items-center justify-center gap-2 text-center min-w-0 overflow-hidden px-1">
            <button 
              type="button"
              onClick={() => setIsInstallmentsModalOpen(true)}
              key={bannerIndex}
              className="inline-flex items-center gap-1.5 sm:gap-2 py-0.5 px-2 sm:px-3 rounded-full hover:bg-white/10 text-sky-100 transition-all duration-200 cursor-pointer group border border-white/10 hover:border-white/25 shadow-2xs max-w-full"
              title="Ver bancos aliados y condiciones de financiación a 3 cuotas sin interés"
            >
              <BannerIcon className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="tracking-tight uppercase font-extrabold text-[10px] sm:text-[11px] text-white truncate max-w-[190px] sm:max-w-xs md:max-w-none group-hover:text-amber-300 transition-colors">
                {currentBanner.text}
              </span>
              <span className="hidden xl:inline text-[10px] font-normal text-sky-200/90 group-hover:text-white truncate">
                — {currentBanner.sub}
              </span>
              <span className="text-[9px] text-slate-950 font-black uppercase px-1.5 py-0.2 bg-amber-400 rounded border border-amber-300 hidden sm:inline-block shadow-2xs group-hover:bg-amber-300 shrink-0">
                Ver Bancos
              </span>
            </button>
          </div>

          {/* Derecha: Accesos directos a Conversemos y Sedes */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] shrink-0">
            {/* Conversemos */}
            <button
              type="button"
              onClick={onOpenChat}
              className="inline-flex items-center text-sky-200 hover:text-white transition-colors font-medium cursor-pointer"
              title="Asesoría Técnica y Cotización Virtual"
            >
              <span>Conversemos</span>
            </button>

            {/* Sedes */}
            <button
              type="button"
              onClick={onOpenCoverage}
              className="hidden md:inline-flex items-center gap-1 text-sky-200 hover:text-white transition-colors font-semibold cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>Sedes</span>
            </button>
          </div>

        </div>
      </div>

      {/* =========================================================================
          2. FILA PRINCIPAL DE BRANDING Y BÚSQUEDA (AZUL MARINO #001D3D)
          - Izquierda: Logotipo COLORLINK Pintuco (+ toggle para menú en móvil)
          - Centro: Barra de búsqueda prominente ("¿Qué buscas?")
          - Derecha: Sección de usuario (Iniciar Sesión / Mi Cuenta)
      ========================================================================= */}
      <style>{`
        @keyframes textShimmerContinuous {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      <div className="w-full bg-[#001D3D] text-white py-2 sm:py-2.5 border-b border-blue-900/40 relative z-40">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between gap-2.5 sm:gap-4 min-w-0">
          
          {/* LADO IZQUIERDO: TOGGLE MÓVIL + LOGOTIPO BRANDING OFICIAL */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile menu toggle button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl text-white hover:bg-white/10 cursor-pointer shrink-0 transition-colors"
              aria-label="Abrir menú móvil"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-cyan-300" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* BRANDING OFICIAL COLORLINK: LUZ Y RESPLANDOR NEÓN CONTINUO */}
            <div 
              onClick={() => onSelectClientTab ? onSelectClientTab('home') : onOpenSmartQuote()}
              className="cursor-pointer select-none shrink-0 flex items-center gap-2 sm:gap-2.5 group"
              title="ColorLink Colombia - Pintuco Oficial"
            >
              <div className="relative flex items-center justify-center py-0.5">
                {/* Resplandor Neón de Fondo */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/40 via-blue-500/40 to-cyan-500/40 rounded-lg blur-md animate-pulse"></div>
                
                {/* Título Principal Unificado con Luz Animada Continua */}
                <h1 
                  className="relative text-xl sm:text-2xl md:text-3xl font-black tracking-[0.22em] uppercase text-transparent bg-clip-text filter drop-shadow-[0_2px_10px_rgba(56,189,248,0.6)]"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #38bdf8 0%, #ffffff 35%, #00f2fe 50%, #ffffff 65%, #38bdf8 100%)',
                    backgroundSize: '400% auto',
                    animation: 'textShimmerContinuous 4s linear infinite'
                  }}
                >
                  COLORLINK
                </h1>
              </div>

              {/* Sub-endorsement oficial Pintuco / AkzoNobel */}
              <div className="hidden sm:flex flex-col border-l border-white/20 pl-2 leading-none shrink-0">
                <span className="text-[10px] font-black tracking-wider uppercase text-cyan-300">PINTUCO®</span>
                <span className="text-[8px] font-semibold text-slate-300 tracking-tight">AkzoNobel</span>
              </div>
            </div>
          </div>

          {/* CENTRO: BARRA DE BÚSQUEDA ("¿Qué buscas?") */}
          <div ref={searchRef} className="flex-1 max-w-xl mx-1 sm:mx-3 relative min-w-[120px]">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="¿Qué buscas?"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                className="w-full pl-8 sm:pl-9 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm rounded-xl bg-white/15 hover:bg-white/20 focus:bg-white text-white focus:text-slate-900 placeholder-sky-200/70 focus:placeholder-slate-400 border border-white/20 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all shadow-inner outline-none"
              />
              <Search className="w-4 h-4 text-sky-200 absolute left-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-sky-200 hover:text-white absolute right-2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-800 animate-fadeIn">
                <div className="p-2.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Resultados de Catálogo Pintuco ({searchResults.length})</span>
                  <span className="text-[10px] font-normal text-teal-600">Clic para ver ficha</span>
                </div>

                {searchResults.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-500">
                    No encontramos coincidencias para "<strong className="text-slate-900">{searchQuery}</strong>". Intenta con Viniltex, Koraza, Aquablock o Pintulux.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {searchResults.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          onSelectProduct(prod);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-3"
                      >
                        <img
                          src={prod.imagenUrl}
                          alt={prod.nombre}
                          className="w-10 h-10 rounded-lg object-contain border border-slate-200 bg-sky-50/50 p-1 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase text-teal-700">
                              {prod.marca} • SKU: {prod.skuBase}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                              {prod.linea}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {prod.nombre}
                          </h4>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                            <span>Ref. ${prod.precioGalon ? prod.precioGalon.toLocaleString('es-CO') : '79.900'} COP/GL</span>
                            <span className="text-teal-600 font-bold">{prod.garantia}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LADO DERECHO: NOTIFICACIONES + ACCESO DE USUARIO / MI CUENTA */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Botón Campana de Notificaciones & Mis Solicitudes: ÚNICAMENTE CUANDO ESTÁ AUTENTICADO */}
            {isLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  if (onOpenNotifications) {
                    onOpenNotifications('notificaciones');
                  } else if (onOpenProfile) {
                    onOpenProfile('pedidos');
                  }
                }}
                className="relative p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-white text-xs font-bold transition-all cursor-pointer shadow-xs select-none group shrink-0 flex items-center gap-1.5"
                title="Panel Unificado de Notificaciones, Seguimiento y PQRS"
              >
                <div className="relative shrink-0">
                  <Bell className="w-4 h-4 text-sky-200 group-hover:text-amber-300 transition-colors" />
                  {ordersCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                </div>
                <span className="hidden md:inline text-xs font-bold text-sky-100">
                  Notificaciones
                </span>
                {ordersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shrink-0 shadow-xs">
                    {ordersCount}
                  </span>
                )}
              </button>
            )}

            {/* ACCESO DE USUARIO / MI CUENTA */}
            <div ref={topUserMenuRef} className="relative inline-block text-left shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTopUserMenuOpen(!isTopUserMenuOpen);
                }}
                className="inline-flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900 border border-blue-700/60 text-white text-xs font-bold transition-all cursor-pointer shadow-xs select-none group shrink-0"
                title={isLoggedIn ? `Mi Cuenta (${activeUserName})` : 'Iniciar Sesión o Registrarse'}
              >
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={activeUserName || 'Avatar'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white/80 shadow-xs group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <SectorPaintAvatar size="sm" />
                  )}
                  {hasPendingOrders && (
                    <span 
                      className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5"
                      title={`${pendingCount} cotizaciones o pedidos pendientes`}
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 border border-[#002244]"></span>
                    </span>
                  )}
                </div>

                <span className="hidden sm:inline truncate max-w-[85px] md:max-w-[130px] font-extrabold text-white text-xs">
                  {isLoggedIn ? activeUserName : 'Iniciar Sesión'}
                </span>

                <ChevronDown className={`w-3.5 h-3.5 text-sky-300 transition-transform duration-200 shrink-0 ${isTopUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* MENÚ DESPLEGABLE DE USUARIO */}
              <UserProfileDropdown
                isOpen={isTopUserMenuOpen}
                onClose={() => setIsTopUserMenuOpen(false)}
                userSession={userSession}
                ordersCount={ordersCount}
                onOpenProfile={onOpenProfile}
                onOpenAuth={onOpenAuth}
                onLogout={onLogout}
                onOpenHistory={onOpenHistory}
                onSelectClientTab={onSelectClientTab}
                onRoleChange={onRoleChange}
                isAuthenticatedAdmin={isAuthenticatedAdmin}
                onOpenCorporateAuth={onOpenCorporateAuth}
                onOpenNotifications={onOpenNotifications}
              />
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          3. FILA INFERIOR DE MENÚ DE NAVEGACIÓN (AZUL PROFUNDO #001529)
          - Izquierda: Inicio, Catálogo, Cotizador, Tiendas, Nosotros
          - Derecha: Favoritos con contador y Carrito con contador
      ========================================================================= */}
      <div className="w-full bg-[#001529] text-white py-1 sm:py-1.5 border-b border-blue-950/80 relative z-30 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
          
          {/* LADO IZQUIERDO: MENÚ HORIZONTAL DE NAVEGACIÓN */}
          <nav className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm font-semibold overflow-x-auto no-scrollbar py-0.5 min-w-0">
            {/* 1. Inicio */}
            <button
              type="button"
              onClick={() => onSelectClientTab ? onSelectClientTab('home') : onOpenSmartQuote()}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-xs sm:text-sm shrink-0 ${
                activeClientTab === 'home'
                  ? 'bg-white text-[#001D3D] font-black shadow-sm'
                  : 'text-sky-100 hover:text-white hover:bg-white/10 font-semibold'
              }`}
            >
              <Home className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeClientTab === 'home' ? 'text-[#001D3D]' : 'text-sky-300'}`} />
              <span>Inicio</span>
            </button>

            {/* 2. Catálogo */}
            <button
              type="button"
              onClick={() => onSelectClientTab ? onSelectClientTab('catalog') : onOpenCatalog()}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-xs sm:text-sm shrink-0 ${
                activeClientTab === 'catalog'
                  ? 'bg-white text-[#001D3D] font-black shadow-sm'
                  : 'text-sky-100 hover:text-white hover:bg-white/10 font-semibold'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeClientTab === 'catalog' ? 'text-[#001D3D]' : 'text-sky-300'}`} />
              <span>Catálogo</span>
            </button>

            {/* 3. Cotizador */}
            <button
              type="button"
              onClick={() => onSelectClientTab ? onSelectClientTab('cotizador') : onOpenSmartQuote()}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-xs sm:text-sm shrink-0 ${
                activeClientTab === 'cotizador'
                  ? 'bg-white text-[#001D3D] font-black shadow-sm'
                  : 'text-sky-100 hover:text-white hover:bg-white/10 font-semibold'
              }`}
            >
              <Calculator className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeClientTab === 'cotizador' ? 'text-[#001D3D]' : 'text-amber-300'}`} />
              <span>Cotizador</span>
            </button>

            {/* 4. Tiendas (Sedes) */}
            <button
              type="button"
              onClick={() => onSelectClientTab ? onSelectClientTab('cobertura') : onOpenCoverage()}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-xs sm:text-sm shrink-0 ${
                activeClientTab === 'cobertura'
                  ? 'bg-white text-[#001D3D] font-black shadow-sm'
                  : 'text-sky-100 hover:text-white hover:bg-white/10 font-semibold'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeClientTab === 'cobertura' ? 'text-[#001D3D]' : 'text-emerald-400'}`} />
              <span>Tiendas</span>
            </button>

            {/* 5. Nosotros */}
            <button
              type="button"
              onClick={() => onSelectClientTab ? onSelectClientTab('nosotros') : onOpenCompanyHistory()}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer text-xs sm:text-sm shrink-0 ${
                activeClientTab === 'nosotros'
                  ? 'bg-white text-[#001D3D] font-black shadow-sm'
                  : 'text-sky-100 hover:text-white hover:bg-white/10 font-semibold'
              }`}
            >
              <Users className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeClientTab === 'nosotros' ? 'text-[#001D3D]' : 'text-sky-300'}`} />
              <span>Nosotros</span>
            </button>
          </nav>

          {/* LADO DERECHO: FAVORITOS CON CONTADOR + CARRITO CON CONTADOR */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Favoritos con popover interactivo: VISIBLE ÚNICAMENTE CON SESIÓN ACTIVA */}
            {isLoggedIn && (
              <div ref={favoritesRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (onSelectClientTab) {
                    onSelectClientTab('favorites');
                  } else {
                    setIsFavoritesOpen(!isFavoritesOpen);
                  }
                }}
                className="shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 flex items-center gap-1.5 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs border border-white/15"
                title="Mis productos favoritos guardados"
              >
                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${actualFavorites.length > 0 ? 'text-rose-400 fill-rose-400' : 'text-white/80'}`} />
                <span className="hidden sm:inline text-xs font-bold">Favoritos</span>
                {actualFavorites.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs shrink-0">
                    {actualFavorites.length}
                  </span>
                )}
              </button>

              {/* Favorites Quick Popover (Desktop) */}
              {isFavoritesOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-88 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 text-slate-800 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                      <span>Mis Favoritos ({favoriteProducts.length})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFavoritesOpen(false)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {favoriteProducts.length === 0 ? (
                    <div className="text-center py-6 px-3 text-xs text-slate-500 space-y-2">
                      <Heart className="w-8 h-8 text-slate-300 mx-auto stroke-1" />
                      <p className="font-semibold text-slate-700">Aún no tienes productos guardados en tus favoritos</p>
                      <p className="text-[11px] text-slate-400">Explora el catálogo y márcalos con el ícono de corazón.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {favoriteProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
                        >
                          <img
                            src={p.imagenUrl}
                            alt={p.nombre}
                            className="w-10 h-10 object-contain rounded-lg shrink-0 border border-slate-100 bg-sky-50/50 p-1"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 truncate">
                              {p.nombre}
                            </h5>
                            <span className="text-[10px] text-slate-400 font-mono">
                              SKU: {p.skuBase}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProduct(p);
                              setIsFavoritesOpen(false);
                            }}
                            className="p-1.5 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-all cursor-pointer shadow-2xs"
                            title="Ver Detalle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFavoritesOpen(false);
                        if (onSelectClientTab) onSelectClientTab('favorites');
                      }}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white text-xs font-bold text-center transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Ver Sección Completa de Favoritos →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFavoritesOpen(false);
                        if (onSelectClientTab) onSelectClientTab('catalog');
                        else onOpenCatalog();
                      }}
                      className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center transition-colors cursor-pointer"
                    >
                      Explorar Catálogo Completo
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Carrito de Compras con contador */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer shadow-md border border-blue-400/30"
              title="Ver mi carrito de compras"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
              <span className="hidden sm:inline font-bold">Carrito</span>
              {cartCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-xs shrink-0">
                  {cartCount}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/20 text-white shrink-0">
                  0
                </span>
              )}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden w-full bg-[#001833] border-b border-blue-900/60 p-4 space-y-3 animate-fadeIn">
          <div className="w-full max-w-7xl mx-auto space-y-3">
            {/* Mobile Search Bar (< md screens) */}
            <div className="md:hidden relative flex items-center">
              <input
                type="text"
                placeholder="¿Qué producto buscas?"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                className="w-full pl-8 pr-7 py-2 text-xs rounded-xl bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder-sky-200/70 focus:placeholder-slate-400 border border-white/20 focus:border-cyan-400 outline-none transition-all shadow-inner"
              />
              <Search className="w-3.5 h-3.5 text-sky-200 absolute left-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-sky-200 hover:text-white absolute right-2 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* User Session Banner in Mobile Drawer */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              {isLoggedIn ? (
                <div className="w-full space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={userSession?.nombre || 'Avatar'}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                        />
                      ) : (
                        <SectorPaintAvatar size="md" />
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] text-teal-700 font-black uppercase tracking-tight block">
                          Mi Cuenta
                        </span>
                        <strong className="text-xs text-slate-900 truncate block">
                          {userSession?.nombre}
                        </strong>
                        <span className="text-[10px] text-slate-500 truncate block font-mono">
                          {userSession?.email}
                        </span>
                      </div>
                    </div>
                    {userSession?.isCorporate && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-900 text-white">
                        Funcionario
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (onOpenProfile) onOpenProfile('datos');
                      }}
                      className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-teal-600" />
                      <span>Ver Perfil</span>
                    </button>
                    {isCorporateOrAdminUser(userSession) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          if (userSession?.isCorporate || isAuthenticatedAdmin) {
                            onRoleChange('admin');
                          } else if (onOpenCorporateAuth) {
                            onOpenCorporateAuth();
                          } else {
                            onRoleChange('admin');
                          }
                        }}
                        className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5 text-blue-900" />
                        <span>Portal Func.</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (onOpenProfile) {
                          onOpenProfile('pedidos');
                        } else if (onSelectClientTab) {
                          onSelectClientTab('tracking');
                        }
                      }}
                      className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5 text-teal-600" />
                      <span>Mis Pedidos</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (onOpenNotifications) {
                          onOpenNotifications('notificaciones');
                        } else if (onOpenProfile) {
                          onOpenProfile('pedidos');
                        }
                      }}
                      className="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 font-bold border border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer col-span-2"
                    >
                      <Bell className="w-3.5 h-3.5 text-amber-600" />
                      <span>🔔 Notificaciones & Mis Solicitudes PQRS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-black border border-rose-200 flex items-center justify-center gap-1.5 cursor-pointer col-span-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>🚪 Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2.5 self-start sm:self-center">
                    <SectorPaintAvatar size="md" />
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Acceso de Usuario</span>
                      <span className="text-[10px] text-slate-500 block">Cotiza, guarda favoritos y rastrea despachos</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuth('login');
                      }}
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-black text-xs shadow-xs cursor-pointer text-center"
                    >
                      🔑 Iniciar Sesión
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenAuth('register');
                      }}
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs cursor-pointer text-center"
                    >
                      📝 Registrarse
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onSelectClientTab) onSelectClientTab('home');
                }}
                className={`p-2.5 rounded-xl text-left border flex items-center gap-2 ${
                  activeClientTab === 'home'
                    ? 'bg-blue-900 text-white border-blue-900 font-black shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Home className="w-4 h-4 text-teal-600" />
                <span>Inicio</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onSelectClientTab) onSelectClientTab('catalog');
                }}
                className={`p-2.5 rounded-xl text-left border flex items-center gap-2 ${
                  activeClientTab === 'catalog'
                    ? 'bg-blue-900 text-white border-blue-900 font-black shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-4 h-4 text-blue-900" />
                <span>Catálogo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onSelectClientTab) onSelectClientTab('cotizador');
                }}
                className={`p-2.5 rounded-xl text-left border flex items-center gap-2 ${
                  activeClientTab === 'cotizador'
                    ? 'bg-blue-900 text-white border-blue-900 font-black shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Calculator className="w-4 h-4 text-teal-600" />
                <span>Cotizador</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onSelectClientTab) onSelectClientTab('cobertura');
                }}
                className={`p-2.5 rounded-xl text-left border flex items-center gap-2 ${
                  activeClientTab === 'cobertura'
                    ? 'bg-blue-900 text-white border-blue-900 font-black shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Sedes</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onSelectClientTab) onSelectClientTab('nosotros');
                }}
                className={`p-2.5 rounded-xl text-left border flex items-center gap-2 ${
                  activeClientTab === 'nosotros'
                    ? 'bg-blue-900 text-white border-blue-900 font-black shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Users className="w-4 h-4 text-blue-700" />
                <span>Nosotros</span>
              </button>
              {/* Favoritos móvil: VISIBLE ÚNICAMENTE CON SESIÓN ACTIVA */}
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onSelectClientTab) {
                      onSelectClientTab('favorites');
                    } else {
                      setIsFavoritesOpen(true);
                    }
                  }}
                  className={`p-2.5 rounded-xl text-left border flex items-center justify-between cursor-pointer ${
                    activeClientTab === 'favorites'
                      ? 'bg-blue-900 text-white border-blue-900 font-black shadow-xs'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Heart className={`w-4 h-4 ${actualFavorites.length > 0 ? 'text-teal-600 fill-teal-600' : 'text-slate-400'}`} />
                    <span>Favoritos</span>
                  </div>
                  {actualFavorites.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-teal-600 text-white shadow-2xs">
                      {actualFavorites.length}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Mobile Modal for Favorites (< xl screens) */}
        {isLoggedIn && isFavoritesOpen && (
          <div 
            className="xl:hidden fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
            onClick={() => setIsFavoritesOpen(false)}
          >
            <div 
              ref={mobileFavoritesRef}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 text-slate-800 animate-scaleUp"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                  <Heart className="w-4 h-4 text-teal-600 fill-teal-600" />
                  <span>Mis Favoritos ({favoriteProducts.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFavoritesOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {favoriteProducts.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No tienes productos marcados como favoritos.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {favoriteProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
                    >
                      <img
                        src={p.imagenUrl}
                        alt={p.nombre}
                        className="w-10 h-10 object-contain rounded-lg shrink-0 border border-slate-100 bg-sky-50/50 p-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {p.nombre}
                        </h5>
                        <span className="text-[10px] text-slate-400 font-mono">
                          SKU: {p.skuBase}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProduct(p);
                          setIsFavoritesOpen(false);
                        }}
                        className="p-1.5 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-all cursor-pointer shadow-2xs"
                        title="Ver Detalle"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsFavoritesOpen(false);
                    onOpenCatalog();
                  }}
                  className="w-full py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold text-center transition-colors cursor-pointer shadow-xs"
                >
                  Explorar Catálogo Completo
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Modal Interactivo: 3 Cuotas Sin Interés con Bancos Seleccionados */}
      <BankInstallmentsModal
        isOpen={isInstallmentsModalOpen}
        onClose={() => setIsInstallmentsModalOpen(false)}
        onExploreCatalog={() => {
          if (onSelectClientTab) {
            onSelectClientTab('catalog');
          } else {
            onOpenCatalog();
          }
        }}
        currentCartTotal={cartCount > 0 ? 350000 : 0}
      />

    </header>
  );
};
