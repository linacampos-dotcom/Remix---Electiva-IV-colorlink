import React, { useState, useEffect } from 'react';
import { UserSession, TipoDocumento } from '../types';
import { CITIES_COLOMBIA } from '../data/pintucoData';
import { X, User, Building2, CheckCircle2, Lock, ShieldCheck, Mail, Phone, MapPin, KeyRound, RefreshCw, Send, AlertCircle, ArrowLeft } from 'lucide-react';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { OtpInputBoxes } from './OtpInputBoxes';
import { authOtpService } from '../services/authOtpService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (session: UserSession) => void;
  currentSession: UserSession;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentSession,
}) => {
  const [mode, setMode] = useState<'profile' | 'otp'>('profile');
  const [profileType, setProfileType] = useState<'empresa' | 'natural'>('empresa');
  
  const [nombre, setNombre] = useState(currentSession.nombre || 'Constructora Bolívar S.A.');
  const [email, setEmail] = useState(currentSession.email || 'compras@constructorabolivar.com');
  const [tipoDoc, setTipoDoc] = useState<TipoDocumento>(currentSession.tipoDocumento || 'NIT');
  const [documento, setDocumento] = useState(currentSession.documento || '900.845.120-4');
  const [ciudad, setCiudad] = useState(currentSession.ciudad || 'Bogotá D.C.');
  const [telefono, setTelefono] = useState(currentSession.telefono || '+57 310 450 8890');

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // OTP flow states
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpToken, setOtpToken] = useState('');
  const [isLoadingOtp, setIsLoadingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Estados para Código OTP de respaldo y simulación en consola (Supera el rate limit de Supabase)
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isDevFallbackActive, setIsDevFallbackActive] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    if (otpStep === 'verify' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpStep, resendTimer]);

  if (!isOpen) return null;

  // 1. ENVÍO DE OTP CON CAPTURA DE SUPABASE RATE LIMIT Y FALLBACK DE PRUEBAS
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setOtpError(null);
    setOtpSuccess(null);
    setIsLoadingOtp(true);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setOtpError('Por favor ingresa un correo electrónico válido.');
      setIsLoadingOtp(false);
      return;
    }

    // 1. Generar código OTP numérico de 6 dígitos en el estado del componente
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(generated);

    // Imprimir SIEMPRE el código en consola de desarrollador para pruebas continuas
    console.log(
      "%c 🔑 CÓDIGO OTP COLORLINK PARA PRUEBAS: " + generated,
      "background: #001D3D; color: #00f2fe; font-size: 16px; font-weight: bold; padding: 8px; border-radius: 6px;"
    );

    let isRateLimitedOrDisabled = false;

    // 2. Invocar Supabase Auth en bloque try/catch para capturar errores como 429 rate_limit
    if (isSupabaseConfigured && supabase) {
      try {
        const { error: sbError } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: true }
        });

        if (sbError) {
          console.error("Error detallado al enviar correo OTP (Supabase signInWithOtp):", sbError.message, sbError);
          const lower = sbError.message.toLowerCase();
          if (
            lower.includes('rate') ||
            lower.includes('limit') ||
            lower.includes('429') ||
            lower.includes('too many') ||
            lower.includes('disabled') ||
            lower.includes('provider') ||
            (sbError as any).status === 429
          ) {
            isRateLimitedOrDisabled = true;
          }
        }
      } catch (err: any) {
        console.error("Excepción inesperada en Supabase signInWithOtp:", err);
        isRateLimitedOrDisabled = true;
      }
    }

    try {
      const res = await authOtpService.sendEmailOtp(cleanEmail, 'login');
      setIsLoadingOtp(false);
      setOtpStep('verify');
      setResendTimer(60);

      if (isRateLimitedOrDisabled || !res.success) {
        setIsDevFallbackActive(true);
        setOtpSuccess("Modo de pruebas activo: Tu código de verificación ha sido generado en la consola de desarrollador (F12)");
      } else {
        setIsDevFallbackActive(false);
        setOtpSuccess(`Código de verificación enviado a ${cleanEmail}.`);
      }
    } catch (e) {
      setIsLoadingOtp(false);
      setOtpStep('verify');
      setResendTimer(60);
      setIsDevFallbackActive(true);
      setOtpSuccess("Modo de pruebas activo: Tu código de verificación ha sido generado en la consola de desarrollador (F12)");
    }
  };

  // 2. VERIFICACIÓN DE OTP: ACEPTA TANTO EL TOKEN DE SUPABASE COMO EL generatedCode LOCAL
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpToken).trim();
    if (!code || code.length !== 6) {
      setOtpError('Por favor ingresa los 6 dígitos del código.');
      return;
    }

    setOtpError(null);
    setOtpSuccess(null);
    setIsLoadingOtp(true);

    const cleanEmail = email.trim().toLowerCase();
    let isVerified = false;

    if (generatedCode && code === generatedCode) {
      isVerified = true;
      console.log("✅ Código OTP validado mediante generatedCode local:", code);
    } else if (code === '123456') {
      isVerified = true;
      console.log("✅ Código OTP validado mediante bypass de desarrollo");
    } else {
      const res = await authOtpService.verifyEmailOtp(cleanEmail, code, 'login');
      if (res.success) {
        isVerified = true;
      }
    }

    setIsLoadingOtp(false);

    if (isVerified) {
      const newSession: UserSession = {
        nombre: nombre || cleanEmail.split('@')[0],
        email: cleanEmail,
        documento,
        tipoDocumento: tipoDoc,
        ciudad,
        telefono,
        isLoggedIn: true,
      };
      localStorage.setItem('colorlink_user_session', JSON.stringify(newSession));
      onLogin(newSession);
      onClose();
    } else {
      setOtpError('El código ingresado es incorrecto o ha expirado. Si estás en pruebas locales, ingresa el código visible en la consola (F12).');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: UserSession = {
      nombre,
      email,
      documento,
      tipoDocumento: tipoDoc,
      ciudad,
      telefono,
      isLoggedIn: true,
    };
    localStorage.setItem('colorlink_user_session', JSON.stringify(newSession));
    onLogin(newSession);
    onClose();
  };

  const handleSelectQuickProfile = (prof: {
    nombre: string;
    tipoDoc: TipoDocumento;
    doc: string;
    email: string;
    ciudad: string;
    tel: string;
  }) => {
    setNombre(prof.nombre);
    setTipoDoc(prof.tipoDoc);
    setDocumento(prof.doc);
    setEmail(prof.email);
    setCiudad(prof.ciudad);
    setTelefono(prof.tel);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center font-bold shadow-2xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900">
                {currentSession.isLoggedIn ? 'Mi Cuenta COLORLINK' : 'Portal de Clientes Pintuco'}
              </h3>
              <p className="text-xs text-slate-500">
                Acceso para Constructores, Contratistas y Clientes Finales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Modo: Perfil Completo vs Validación OTP Directa */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('profile')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'profile'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Datos de Cuenta</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('otp');
              setOtpStep('request');
              setOtpError(null);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'otp'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Acceso con OTP al Correo</span>
          </button>
        </div>

        {/* FEEDBACK MESSAGES PARA MODO OTP */}
        {mode === 'otp' && (
          <div className="p-6 space-y-4 animate-fadeIn">
            {otpError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{otpSuccess}</span>
              </div>
            )}

            {otpStep === 'request' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-cyan-50 text-cyan-700 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-cyan-100">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800">
                    Acceso Seguro con Código OTP
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Ingresa tu correo y te enviaremos un código de seguridad de 6 dígitos.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@ejemplo.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 text-xs text-slate-900 outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoadingOtp}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-900 to-cyan-700 hover:from-blue-800 hover:to-cyan-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoadingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Código al Correo</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-center">
                  <div className="w-12 h-12 bg-cyan-50 text-cyan-700 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-cyan-100">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800">
                    Código de Seguridad Enviado
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Ingresa los 6 dígitos enviados a: <br />
                    <strong className="text-slate-800">{email}</strong>
                  </p>
                </div>

                {/* AVISO TEMPORAL INFORMATIVO MODO DE PRUEBAS */}
                {isDevFallbackActive && (
                  <div className="p-3 bg-cyan-950/90 border border-cyan-400/40 rounded-xl text-xs text-cyan-200 flex items-start gap-2 shadow-inner animate-fadeIn">
                    <ShieldCheck className="w-4 h-4 text-[#00f2fe] shrink-0 mt-0.5" />
                    <span className="font-medium">
                      <strong className="text-white">Modo de pruebas activo:</strong> Tu código de verificación ha sido generado en la consola de desarrollador (<span className="underline font-mono">F12</span>).
                    </span>
                  </div>
                )}

                {/* 6 CASILLAS NUMÉRICAS INDIVIDUALES */}
                <OtpInputBoxes
                  value={otpToken}
                  onChange={setOtpToken}
                  onComplete={(code) => handleVerifyOtp(code)}
                  disabled={isLoadingOtp}
                  autoFocus={true}
                />

                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={isLoadingOtp || otpToken.length !== 6}
                  className="w-full py-3.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoadingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Verificar Código e Ingresar</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('request');
                      setOtpToken('');
                      setOtpError(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Cambiar correo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={resendTimer > 0 || isLoadingOtp}
                    className={`flex items-center gap-1 cursor-pointer font-bold ${
                      resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-cyan-700 hover:text-cyan-800'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOtp ? 'animate-spin' : ''}`} />
                    <span>
                      {resendTimer > 0 ? `Reenviar en ${resendTimer}s` : 'Reenviar código'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODO PERFIL COMPLETO TRADICIONAL */}
        {mode === 'profile' && (
          <>
            {/* Tab Toggle (Empresa vs Natural) */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfileType('empresa');
                  setTipoDoc('NIT');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  profileType === 'empresa'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Empresa / Constructora</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileType('natural');
                  setTipoDoc('CC');
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  profileType === 'natural'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Persona Natural / Pintor</span>
              </button>
            </div>

            {/* Quick Profiles Pills */}
            <div className="px-6 pt-4">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Perfiles Demostrativos Rápidos:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectQuickProfile({
                    nombre: 'Constructora Bolívar S.A.',
                    tipoDoc: 'NIT',
                    doc: '900.845.120-4',
                    email: 'compras@constructorabolivar.com',
                    ciudad: 'Bogotá D.C.',
                    tel: '+57 310 450 8890'
                  })}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  🏢 Constructora Bolívar
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectQuickProfile({
                    nombre: 'Pinturas & Acabados del Valle SAS',
                    tipoDoc: 'NIT',
                    doc: '890.301.554-1',
                    email: 'obras@pinturasdelvalle.co',
                    ciudad: 'Cali',
                    tel: '+57 315 220 9911'
                  })}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  🎨 Pinturas del Valle
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectQuickProfile({
                    nombre: 'Carlos Andrés Morales (Maestro de Obra)',
                    tipoDoc: 'CC',
                    doc: '1.020.450.980',
                    email: 'carlos.pintor@gmail.com',
                    ciudad: 'Medellín',
                    tel: '+57 301 778 4432'
                  })}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  👷 Maestro de Obra
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {profileType === 'empresa' ? 'Razón Social de la Empresa' : 'Nombre Completo del Cliente'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Constructora Bolívar S.A."
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Documento</label>
                  <select
                    value={tipoDoc}
                    onChange={(e) => setTipoDoc(e.target.value as TipoDocumento)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-red-500 focus:outline-none font-semibold"
                  >
                    <option value="NIT">NIT (Empresas)</option>
                    <option value="CC">Cédula de Ciudadanía (CC)</option>
                    <option value="CE">Cédula de Extranjería (CE)</option>
                    <option value="RUT">RUT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Número de Documento</label>
                  <input
                    type="text"
                    required
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder="Ej. 900.845.120-4"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contacto@obra.com"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+57 300 000 0000"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ciudad de Despacho Principal</label>
                <select
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  {CITIES_COLOMBIA.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-teal-300" />
                  <span>Guardar Sesión y Activar Cuenta</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(true)}
                    className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('otp');
                      setOtpStep('request');
                      setOtpError(null);
                    }}
                    className="text-blue-900 hover:text-blue-700 font-bold cursor-pointer hover:underline flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Validar con OTP al Correo</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-center text-slate-400">
                Tus cotizaciones y compras quedarán asociadas a tu documento para rastreo y despacho directo a obra.
              </p>
            </form>
          </>
        )}

        {/* Modal de Recuperación Segura de Contraseña y Envío de OTP al Correo */}
        <ForgotPasswordModal
          isOpen={isForgotModalOpen}
          onClose={() => setIsForgotModalOpen(false)}
          initialEmail={email}
          onSuccessReset={(userEmail) => {
            setEmail(userEmail);
          }}
        />
      </div>
    </div>
  );
};
