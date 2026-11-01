import React, { useRef, useState, useEffect } from 'react';
import { UserSession, AppRole } from '../types';
import { 
  User, 
  Mail, 
  Camera, 
  LogOut, 
  Clock, 
  Truck, 
  Building2, 
  Key, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  ShoppingBag,
  Bell,
  MessageSquare
} from 'lucide-react';

/**
 * Avatar técnico ilustrado del sector de pinturas (Lata de pintura con brocha y rodillo).
 * Reemplaza cualquier imagen de banco o persona ficticia cuando el usuario no ha subido una foto personalizada.
 */
export const SectorPaintAvatar: React.FC<{ 
  className?: string; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  }[size];

  return (
    <div
      className={`rounded-full bg-gradient-to-br from-[#003366] via-[#002244] to-[#0A192F] flex items-center justify-center p-1.5 shadow-sm border border-sky-400/30 overflow-hidden relative shrink-0 ${sizeClasses} ${className}`}
      title="Colorlink • Icono Técnico Oficial Pintuco"
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Fondo sutil de brillo */}
        <circle cx="24" cy="24" r="22" fill="url(#avatarGradient)" opacity="0.3" />
        
        {/* Cuerpo de la Lata de Pintura */}
        <path
          d="M11 18C11 16.5 12.5 15 15 15H33C35.5 15 37 16.5 37 18V37C37 40 35 42 32 42H16C13 42 11 40 11 37V18Z"
          fill="#004D99"
          stroke="#38BDF8"
          strokeWidth="1.8"
        />
        {/* Borde Metálico Superior */}
        <rect x="9" y="14" width="30" height="4" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2" />
        
        {/* Gotas de pintura fresca cayendo por la lata */}
        <path
          d="M15 18V27C15 28.5 17.5 28.5 17.5 27V18H15Z"
          fill="#F59E0B"
        />
        <path
          d="M23 18V31C23 32.8 26.5 32.8 26.5 31V18H23Z"
          fill="#F59E0B"
        />
        <circle cx="16.2" cy="30" r="1.5" fill="#F59E0B" />

        {/* Asa metálica de la cubeta */}
        <path
          d="M10 19C10 9.5 38 9.5 38 19"
          stroke="#CBD5E1"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Brocha de pintor profesional sumergida */}
        <g transform="translate(19, 2) rotate(22)">
          {/* Mango de madera */}
          <path d="M12 2L15 11H9L12 2Z" fill="#D97706" stroke="#92400E" strokeWidth="0.8" />
          {/* Virola metálica */}
          <rect x="8.5" y="11" width="7" height="4" rx="0.8" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
          {/* Cerdas */}
          <path d="M8.5 15H15.5L16 22C16 23.5 14.5 24 12 24C9.5 24 8 23.5 8 22L8.5 15Z" fill="#FBBF24" />
          {/* Pintura fresca en la punta de la brocha */}
          <path d="M8.8 19C9 21.5 11 23.5 12 23.5C13 23.5 15 21.5 15.2 19H8.8Z" fill="#F59E0B" />
        </g>

        <defs>
          <radialGradient id="avatarGradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24 24) rotate(90) scale(22)">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#003366" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};

export interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession | null;
  ordersCount: number;
  onOpenProfile?: (tab?: 'datos' | 'pedidos' | 'orders' | 'direcciones' | 'seguridad') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout?: () => void;
  onOpenHistory?: () => void;
  onSelectClientTab?: (tab: any) => void;
  onRoleChange?: (role: AppRole) => void;
  isAuthenticatedAdmin?: boolean;
  onOpenCorporateAuth?: () => void;
  onOpenNotifications?: (tab?: 'seguimiento' | 'pqrs' | 'notificaciones') => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  isOpen,
  onClose,
  userSession,
  ordersCount,
  onOpenProfile,
  onOpenAuth,
  onLogout,
  onOpenHistory,
  onSelectClientTab,
  onRoleChange,
  isAuthenticatedAdmin = false,
  onOpenCorporateAuth,
  onOpenNotifications,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determinar condición estricta de autenticación
  const isLoggedIn = Boolean(
    userSession && 
    (userSession.isLoggedIn === true || (userSession.email && userSession.email.trim().length > 0))
  );

  const userEmail = (userSession?.email || '').trim().toLowerCase();
  const avatarStorageKey = userEmail ? `colorlink_user_avatar_${userEmail}` : 'colorlink_user_avatar_guest';

  // Foto de perfil persistente por usuario en localStorage
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn && userEmail) {
      try {
        const saved = localStorage.getItem(avatarStorageKey);
        setCustomAvatar(saved || null);
      } catch {
        setCustomAvatar(null);
      }
    } else {
      setCustomAvatar(null);
    }
  }, [isLoggedIn, userEmail, avatarStorageKey]);

  // Manejador para subir y persistir foto de perfil personalizada (Estilo Red Social)
  const handleUploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isLoggedIn && userEmail) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setCustomAvatar(base64);
          try {
            localStorage.setItem(avatarStorageKey, base64);
            // También notificar a nivel de ventana para sincronizar header
            window.dispatchEvent(new Event('colorlink_avatar_updated'));
          } catch (err) {
            console.warn('Error guardando avatar en localStorage:', err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  if (!isOpen) return null;

  // Validación de acceso a portal de funcionarios
  const isCorporateUser = Boolean(
    userSession && (
      userSession.isCorporate ||
      isAuthenticatedAdmin ||
      userSession.email?.endsWith('@pintuco.com') ||
      userSession.email?.endsWith('@colcan.com') ||
      userSession.email?.endsWith('@akzonobel.com') ||
      userSession.userType === 'administrador'
    )
  );

  const pendingOrders = Math.max(0, ordersCount || 0);

  return (
    <div 
      className="absolute right-0 top-full mt-2 z-50 shadow-2xl rounded-2xl bg-white text-slate-900 border border-slate-200 w-80 sm:w-88 p-3.5 animate-fadeIn overscroll-contain select-none"
      style={{ overscrollBehavior: 'contain', pointerEvents: 'auto' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Input oculto para subida de foto de perfil personalizada */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleUploadAvatar}
      />

      {isLoggedIn ? (
        /* =========================================================================
           VISTA CUANDO LA SESIÓN ESTÁ ACTIVA (isLoggedIn === true)
        ========================================================================= */
        <div className="space-y-3">
          {/* Tarjeta de usuario con avatar, nombre, correo y botón de cambio de foto */}
          <div className="p-3.5 bg-gradient-to-br from-slate-50 to-sky-50/70 rounded-xl border border-slate-200/80 flex items-start gap-3 relative shadow-2xs">
            {/* Contenedor de Avatar con botón superpuesto de cámara */}
            <div 
              className="relative group/avatar cursor-pointer shrink-0" 
              onClick={() => fileInputRef.current?.click()}
              title="Haz clic para subir o cambiar foto de perfil"
            >
              {customAvatar ? (
                <img
                  src={customAvatar}
                  alt={userSession?.nombre || 'Foto de perfil'}
                  className="w-16 h-16 rounded-full object-cover shadow-md border-2 border-[#003366] group-hover/avatar:opacity-90 transition-all ring-2 ring-sky-300/50"
                />
              ) : (
                <SectorPaintAvatar size="lg" />
              )}
              <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-wider text-teal-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  <span>SESIÓN ACTIVA</span>
                </span>
                {userSession?.isCorporate && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-blue-900 text-white">
                    Funcionario
                  </span>
                )}
              </div>

              <strong className="block text-sm font-black text-slate-900 truncate mt-0.5">
                {userSession?.nombre || 'Usuario Registrado'}
              </strong>
              <span className="block text-[11px] text-slate-500 truncate font-mono">
                {userSession?.email}
              </span>

              {/* Botón claro de Carga/Cambio de foto de perfil (Estilo Red Social) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-sky-100 text-[#003366] text-[11px] font-bold border border-sky-200 transition-colors cursor-pointer shadow-2xs group/btn"
              >
                <Camera className="w-3.5 h-3.5 text-[#003366] group-hover/btn:scale-110 transition-transform" />
                <span>📷 Subir o cambiar foto de perfil</span>
              </button>
            </div>
          </div>

          {/* Resumen de Pedidos y Cotizaciones */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-2.5 text-amber-950">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <div className="min-w-0">
                <span className="block text-[11px] font-extrabold text-amber-950 leading-tight truncate">
                  {pendingOrders > 0 
                    ? `${pendingOrders} ${pendingOrders === 1 ? 'Pedido / Cotización en proceso' : 'Pedidos / Cotizaciones en proceso'}`
                    : 'Sin pedidos pendientes'}
                </span>
                <span className="block text-[10px] text-amber-800 leading-tight">
                  {pendingOrders > 0 ? 'En alistamiento y despacho a obra' : 'Historial guardado en tu cuenta'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenProfile) onOpenProfile('pedidos');
                else if (onSelectClientTab) onSelectClientTab('tracking');
                else if (onOpenHistory) onOpenHistory();
              }}
              className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black shrink-0 transition-colors shadow-2xs cursor-pointer"
            >
              Revisar
            </button>
          </div>

          {/* Enlaces y Acciones de la Cuenta */}
          <div className="py-1 space-y-1">
            {/* Mi Perfil */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenProfile) onOpenProfile('datos');
                else onOpenAuth('login');
              }}
              className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-blue-900 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-blue-900 shrink-0" />
              <div className="leading-tight flex-1">
                <span className="block font-bold">Mi Perfil</span>
                <span className="block text-[10px] text-slate-500 font-normal">Datos personales & Libreta de direcciones</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Mis Pedidos */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenProfile) {
                  onOpenProfile('pedidos');
                } else if (onSelectClientTab) {
                  onSelectClientTab('tracking');
                } else if (onOpenHistory) {
                  onOpenHistory();
                }
              }}
              className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-blue-900 rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-teal-600 shrink-0" />
                <div className="leading-tight">
                  <span className="block font-bold">Mis Pedidos</span>
                  <span className="block text-[10px] text-slate-500 font-normal">Trazabilidad en tiempo real y facturas</span>
                </div>
              </div>
              {pendingOrders > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-2xs">
                  {pendingOrders}
                </span>
              )}
            </button>

            {/* Notificaciones & Mis Solicitudes (Seguimiento CEDI y Bandeja PQRS) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenNotifications) {
                  onOpenNotifications('notificaciones');
                } else if (onOpenProfile) {
                  onOpenProfile('solicitudes' as any);
                } else if (onSelectClientTab) {
                  onSelectClientTab('tracking');
                }
              }}
              className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-blue-900 rounded-xl flex items-center justify-between gap-2 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="leading-tight">
                  <span className="block font-bold">Notificaciones & Mis Solicitudes</span>
                  <span className="block text-[10px] text-slate-500 font-normal">Seguimiento de pedidos y Bandeja PQRS</span>
                </div>
              </div>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 shadow-2xs">
                Activo
              </span>
            </button>

            {/* Portal Funcionarios (si es corporate) */}
            {isCorporateUser && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onRoleChange) onRoleChange('admin');
                  else if (onOpenCorporateAuth) onOpenCorporateAuth();
                }}
                className="w-full px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-blue-900 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-blue-900 shrink-0" />
                <div className="leading-tight">
                  <span className="block font-bold text-slate-900">Portal Funcionarios</span>
                  <span className="block text-[10px] text-slate-500 font-normal">Intranet corporativa y ERP Pintuco</span>
                </div>
              </button>
            )}

            <div className="border-t border-slate-100 my-1" />

            {/* Botón explícito de Cerrar Sesión en color rojo */}
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onLogout) {
                  onLogout();
                }
              }}
              className="w-full px-3 py-2.5 text-left text-xs font-black text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
              <span>🚪 Cerrar Sesión</span>
            </button>
          </div>
        </div>
      ) : (
        /* =========================================================================
           VISTA CUANDO NO HAY SESIÓN ACTIVA (isLoggedIn === false / Modo Invitado)
           NO muestra datos personales, correo, foto personalizada ni pedidos pendientes.
        ========================================================================= */
        <div className="p-3 text-center space-y-4">
          <div className="flex flex-col items-center justify-center pt-1">
            <SectorPaintAvatar size="xl" className="mb-2" />
            <h4 className="text-sm font-black text-slate-900 tracking-tight">
              ¡Bienvenido a COLORLINK!
            </h4>
            <p className="text-[11px] text-slate-600 max-w-xs mt-1 leading-relaxed">
              Inicia sesión o crea tu cuenta para guardar tus cotizaciones, gestionar despachos a obra y acceder a precios preferenciales Pintuco.
            </p>
          </div>

          {/* Dos botones principales requeridos */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth('login');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#003366] to-[#004D99] hover:from-[#002244] hover:to-[#003366] text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Key className="w-4 h-4 text-amber-300" />
              <span>🔑 Iniciar Sesión</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAuth('register');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <FileText className="w-4 h-4 text-slate-950" />
              <span>📝 Registrarse</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Distribuidor Oficial Pintuco</span>
            </span>
            <span className="font-semibold text-slate-700">Atención Colombia</span>
          </div>
        </div>
      )}
    </div>
  );
};
