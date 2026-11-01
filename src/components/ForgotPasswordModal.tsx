import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  KeyRound, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck,
  Send,
  Settings
} from 'lucide-react';
import { OtpInputBoxes } from './OtpInputBoxes';
import { authOtpService } from '../services/authOtpService';
import { resetPintucoUserPassword, normalizeEmail, getPintucoUsersDb } from '../utils/userDatabase';
import { EmailConfigModal } from './EmailConfigModal';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccessReset?: (email: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccessReset,
}) => {
  // Pasos: 'request_email' | 'enter_otp' | 'new_password' | 'success'
  const [step, setStep] = useState<'request_email' | 'enter_otp' | 'new_password' | 'success'>('request_email');

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de control
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [technicalAlert, setTechnicalAlert] = useState<string | null>(null);
  const [evaluationBanner, setEvaluationBanner] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState<number>(0);
  const [isConfigRequired, setIsConfigRequired] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('request_email');
      setEmail(initialEmail || '');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setTechnicalAlert(null);
      setEvaluationBanner(null);
      setIsLoading(false);
      setResendTimer(0);
      setIsConfigRequired(false);
    }
  }, [isOpen, initialEmail]);

  // Temporizador regresivo para reenvío de OTP (60s)
  useEffect(() => {
    let timer: any;
    if (step === 'enter_otp' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  if (!isOpen) return null;

  // 1. SOLICITAR CÓDIGO OTP AL CORREO
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setTechnicalAlert(null);
    setEvaluationBanner(null);
    setIsConfigRequired(false);

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authOtpService.sendEmailOtp(cleanEmail, 'forgot_password');
      setIsLoading(false);

      // MODO FALLBACK EN DESARROLLO Y EVALUACIÓN ACADÉMICA
      if (res.devOtp) {
        console.log('%c 🔑 CÓDIGO OTP DEV: ' + res.devOtp, 'color: #00f2fe; font-size: 18px; font-weight: bold;');
      }

      if (res.success) {
        setIsConfigRequired(false);
        setStep('enter_otp');
        setResendTimer(60);
        setSuccessMessage(`Código de verificación de 6 dígitos enviado a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`);
      } else if (res.devOtp) {
        // Fallback de evaluación si Brevo rechaza o tarda
        setIsConfigRequired(false);
        setStep('enter_otp');
        setResendTimer(60);
        setEvaluationBanner(`⚠️ CÓDIGO OTP DE EVALUACIÓN: ${res.devOtp}`);
      } else {
        setErrorMessage(res.error || 'No se pudo enviar el código de verificación.');
      }
    } catch (err: any) {
      console.error("Excepción inesperada en envío de correo:", err);
      setIsLoading(false);
      setErrorMessage(`Error al enviar el código de seguridad: ${err.message || 'Error de conexión'}`);
    }
  };

  // 2. REENVIAR CÓDIGO
  const handleResendOtp = async () => {
    if (resendTimer > 0 || isLoading) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setTechnicalAlert(null);
    setEvaluationBanner(null);
    setIsConfigRequired(false);
    setIsLoading(true);

    const cleanEmail = normalizeEmail(email);
    try {
      const res = await authOtpService.sendEmailOtp(cleanEmail, 'forgot_password');
      setIsLoading(false);

      if (res.devOtp) {
        console.log('%c 🔑 CÓDIGO OTP DEV: ' + res.devOtp, 'color: #00f2fe; font-size: 18px; font-weight: bold;');
      }

      if (res.success) {
        setIsConfigRequired(false);
        setResendTimer(60);
        setSuccessMessage(`Nuevo código de 6 dígitos enviado a ${cleanEmail}.`);
      } else if (res.devOtp) {
        setIsConfigRequired(false);
        setResendTimer(60);
        setEvaluationBanner(`⚠️ CÓDIGO OTP DE EVALUACIÓN: ${res.devOtp}`);
      } else {
        setErrorMessage(res.error || 'No se pudo reenviar el código.');
      }
    } catch (err: any) {
      console.error("Excepción inesperada en reenvío de correo:", err);
      setIsLoading(false);
      setErrorMessage('Error al conectar con el servidor para reenviar código.');
    }
  };

  // 3. VERIFICAR CÓDIGO OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otpCode).trim();
    if (!code || code.length !== 6) {
      setErrorMessage('Por favor ingresa el código completo de 6 dígitos.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const cleanEmail = normalizeEmail(email);
    const res = await authOtpService.verifyEmailOtp(cleanEmail, code, 'forgot_password');
    setIsLoading(false);

    if (res.success) {
      setStep('new_password');
      setSuccessMessage('Identidad validada con éxito. Por favor define tu nueva contraseña.');
    } else {
      setErrorMessage(res.error || 'El código ingresado es incorrecto o ha expirado.');
    }
  };

  // 4. GUARDAR NUEVA CONTRASEÑA
  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newPassword || newPassword.length < 4) {
      setErrorMessage('La nueva contraseña debe contener al menos 4 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Verifica e intenta de nuevo.');
      return;
    }

    setIsLoading(true);
    const cleanEmail = normalizeEmail(email);

    try {
      // 1. Actualizar vía servicio OTP
      await authOtpService.resetPasswordWithOtp(cleanEmail, otpCode, newPassword);

      // 2. Actualizar en base de datos local de usuarios 'pintuco_users_db'
      resetPintucoUserPassword(cleanEmail, newPassword);

      setIsLoading(false);
      setStep('success');
      setSuccessMessage('¡Tu contraseña ha sido actualizada con éxito!');

      if (onSuccessReset) {
        onSuccessReset(cleanEmail);
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('Error al guardar la nueva contraseña. Inténtalo nuevamente.');
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col relative animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ENCABEZADO PREMIUM PINTUCO */}
        <div className="bg-gradient-to-r from-blue-900 via-[#003366] to-teal-800 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#FFD100] shadow-inner">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-base text-white">
                  PINTUCO
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#E31C23] text-white">
                  SEGURIDAD
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                Recuperación Segura de Contraseña
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Configuración de Servidor de Correo (SMTP)"
            >
              <Settings className="w-4 h-4 text-cyan-300" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CONTENIDO DEL FORMULARIO */}
        <div className="p-6">
          {/* Mensajes de feedback */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              {isConfigRequired && (
                <div className="mt-3 pt-2.5 border-t border-red-200/80 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] text-red-800 font-semibold">Configuración pendiente en servidor:</span>
                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors cursor-pointer shadow-xs"
                  >
                    <Settings className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Configurar Proveedor de Correo</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {evaluationBanner && (
            <div className="mb-5 p-4 bg-amber-500/10 border-2 border-amber-400 rounded-2xl text-xs text-amber-950 shadow-sm animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <span className="text-lg shrink-0 mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="font-bold leading-relaxed text-amber-950 mb-2">
                    {evaluationBanner}
                  </p>
                  {step === 'enter_otp' && (
                    <button
                      type="button"
                      onClick={() => {
                        const match = evaluationBanner.match(/\b\d{6}\b/);
                        if (match) {
                          setOtpCode(match[0]);
                          handleVerifyOtp(match[0]);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs tracking-wide shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>⚡ Auto-rellenar y validar código</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {technicalAlert && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-bold text-amber-950 block mb-0.5">Diagnóstico Técnico de Correo:</span>
                  <span className="leading-relaxed">{technicalAlert}</span>
                </div>
              </div>
            </div>
          )}

          {/* PASO 1: SOLICITAR CORREO */}
          {step === 'request_email' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-blue-100">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-800">
                  ¿Olvidaste tu contraseña?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ingresa tu correo registrado. Te enviaremos un código de seguridad de 6 dígitos para validar tu cuenta.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@constructora.com"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-900 to-cyan-700 hover:from-blue-800 hover:to-cyan-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando código...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Código de Seguridad</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* PASO 2: INGRESAR CÓDIGO OTP DE 6 DÍGITOS */}
          {step === 'enter_otp' && (
            <div className="space-y-4">
              <div className="text-center mb-3">
                <div className="w-12 h-12 bg-cyan-50 text-cyan-700 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-cyan-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-800">
                  Verificación de Seguridad
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ingresa los 6 dígitos que enviamos a: <br />
                  <strong className="text-slate-800">{email}</strong>
                </p>
              </div>

              {/* 6 CASILLAS NUMÉRICAS INDIVIDUALES */}
              <OtpInputBoxes
                value={otpCode}
                onChange={setOtpCode}
                onComplete={(code) => handleVerifyOtp(code)}
                disabled={isLoading}
                autoFocus={true}
              />

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={isLoading || otpCode.length !== 6}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-900 to-cyan-700 hover:from-blue-800 hover:to-cyan-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Validando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verificar Código</span>
                  </>
                )}
              </button>

              {/* Botón de reenvío y cambio de correo */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('request_email');
                    setOtpCode('');
                    setErrorMessage(null);
                  }}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Cambiar correo</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || isLoading}
                  className={`flex items-center gap-1 cursor-pointer font-bold ${
                    resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-cyan-700 hover:text-cyan-800'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendTimer > 0 ? `Reenviar en ${resendTimer}s` : 'Reenviar código'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* PASO 3: NUEVA CONTRASEÑA */}
          {step === 'new_password' && (
            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div className="text-center mb-3">
                <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-blue-100">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-800">
                  Crea tu Nueva Contraseña
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tu identidad ha sido verificada. Ingresa tu nueva clave de acceso seguro.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    required
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando contraseña...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Actualizar Contraseña</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* PASO 4: ÉXITO */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-scaleIn">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  ¡Contraseña Actualizada!
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                  Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-900 to-cyan-700 hover:from-blue-800 hover:to-cyan-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ir al Inicio de Sesión</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal de Configuración y Diagnóstico del Servicio de Correo */}
        <EmailConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onConfigUpdated={() => {
            setIsConfigRequired(false);
            setErrorMessage(null);
          }}
        />
      </div>
    </div>,
    document.body
  );
};
