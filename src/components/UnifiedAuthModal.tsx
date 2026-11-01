import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserSession, TipoDocumento, CorporateRole } from '../types';
import { 
  getPintucoUsersDb, 
  savePintucoUsersDb, 
  registerPintucoUser,
  resetPintucoUserPassword,
  normalizeEmail,
  normalizeDocument,
  PintucoUserAccount
} from '../utils/userDatabase';
import { 
  X, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  AlertCircle, 
  LogIn, 
  UserPlus, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  FileText,
  KeyRound,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  RefreshCw,
  Send,
  Settings
} from 'lucide-react';
import { OtpInputBoxes } from './OtpInputBoxes';
import { authOtpService } from '../services/authOtpService';
import { EmailConfigModal } from './EmailConfigModal';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClient: (session: UserSession, isNewRegistration?: boolean) => void;
  onLoginCorporate: (session: UserSession, role: CorporateRole) => void;
  currentSession?: UserSession | null;
  initialTab?: 'client' | 'corporate';
  initialMode?: 'login' | 'register';
  requiredActionReason?: string | null;
  onLogout?: () => void;
}

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginClient,
  onLoginCorporate,
  currentSession,
  initialMode = 'login',
  requiredActionReason = null,
  onLogout,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');

  // Form Fields (Login & Register)
  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration Fields
  const [regNombre, setRegNombre] = useState('');
  const [regCedula, setRegCedula] = useState('');
  const [regTelefono, setRegTelefono] = useState('');
  const [regTipoDoc, setRegTipoDoc] = useState<TipoDocumento>('CC');

  // Forgot Password / Recovery Sub-form Fields
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryConfirmPassword, setRecoveryConfirmPassword] = useState('');
  const [recoveryEmailVerified, setRecoveryEmailVerified] = useState(false);
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false);

  // Estados específicos para Flujo OTP de Correo Electrónico
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [loginOtpStep, setLoginOtpStep] = useState<'request' | 'verify'>('request');
  const [loginOtpCode, setLoginOtpCode] = useState('');

  const [registerOtpStep, setRegisterOtpStep] = useState<'form' | 'verify_otp'>('form');
  const [registerOtpCode, setRegisterOtpCode] = useState('');

  const [recoveryOtpStep, setRecoveryOtpStep] = useState<'request' | 'verify_otp' | 'new_password'>('request');
  const [recoveryOtpCode, setRecoveryOtpCode] = useState('');
  const [otpResendTimer, setOtpResendTimer] = useState<number>(0);
  const [isConfigRequired, setIsConfigRequired] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Status & Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [technicalAlert, setTechnicalAlert] = useState<string | null>(null);
  const [evaluationBanner, setEvaluationBanner] = useState<string | null>(null);

  // Google Chooser State
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);

  // Reset and synchronize state on open
  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setTechnicalAlert(null);
      setEvaluationBanner(null);
      setInputEmail('');
      setInputPassword('');
      setConfirmPassword('');
      setRegNombre('');
      setRegCedula('');
      setRegTelefono('');
      setRegTipoDoc('CC');
      setRecoveryEmail('');
      setRecoveryNewPassword('');
      setRecoveryConfirmPassword('');
      setRecoveryEmailVerified(false);
      setLoginMethod('password');
      setLoginOtpStep('request');
      setLoginOtpCode('');
      setRegisterOtpStep('form');
      setRegisterOtpCode('');
      setRecoveryOtpStep('request');
      setRecoveryOtpCode('');
      setOtpResendTimer(0);
      setIsLoading(false);
      setIsGoogleChooserOpen(false);
    }
  }, [isOpen, initialMode]);

  // Temporizador regresivo para reenvío de OTP (60s)
  useEffect(() => {
    let interval: any;
    if (otpResendTimer > 0) {
      interval = setInterval(() => {
        setOtpResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpResendTimer]);

  const handleSwitchToRegister = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setInputEmail('');
    setInputPassword('');
    setConfirmPassword('');
    setRegNombre('');
    setRegCedula('');
    setRegTelefono('');
    setAuthMode('register');
  };

  const handleSwitchToLogin = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setInputPassword('');
    setConfirmPassword('');
    setRecoveryNewPassword('');
    setRecoveryConfirmPassword('');
    setRecoveryEmailVerified(false);
    setAuthMode('login');
  };

  const handleOpenForgotPassword = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setRecoveryEmail(inputEmail.trim());
    setRecoveryNewPassword('');
    setRecoveryConfirmPassword('');
    setRecoveryEmailVerified(false);
    setAuthMode('forgot_password');
  };

  if (!isOpen) return null;

  // 1. LOGIN HANDLER
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = normalizeEmail(inputEmail);
    const password = inputPassword.trim();

    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor ingresa tu contraseña.');
      return;
    }

    setIsLoading(true);

    const usersDb = getPintucoUsersDb();
    const existingAccount = usersDb.find(u => normalizeEmail(u.email) === email);

    // Check if user exists in pintuco_users_db
    if (!existingAccount) {
      setIsLoading(false);
      setErrorMessage('Este correo no está registrado en el sistema. Por favor completa tu registro inicial.');
      setAuthMode('register');
      return;
    }

    // STRICT PASSWORD VERIFICATION: Match entered password with stored password
    if (existingAccount.password !== password) {
      setIsLoading(false);
      setErrorMessage('Contraseña incorrecta. Inténtalo de nuevo.');
      return;
    }

    // Password is VALID -> Build Session with persistent Cédula/NIT
    const isLinaAdmin = email === 'linajazmincampossaboya@gmail.com' || Boolean(existingAccount.isCorporate) || email.endsWith('@pintuco.com');

    const session: UserSession = {
      nombre: existingAccount.nombre,
      email: existingAccount.email,
      documento: existingAccount.cedula || (isLinaAdmin ? '1.032.456.789' : '1.020.304.506'),
      tipoDocumento: (existingAccount.tipoDocumento || 'CC') as TipoDocumento,
      ciudad: existingAccount.ciudad || 'Bogotá D.C.',
      direccion: existingAccount.direccion || 'Carrera 15 # 93-60',
      telefono: existingAccount.telefono,
      userType: isLinaAdmin ? 'funcionario' : 'cliente',
      isLoggedIn: true,
      isCorporate: isLinaAdmin,
      corporateRole: isLinaAdmin ? 'gerencia' : undefined,
      departamento: isLinaAdmin ? (existingAccount.departamento || 'Dirección General & Operaciones Corporativas Pintuco') : undefined,
      cargo: isLinaAdmin ? (existingAccount.cargo || 'Administrador General') : 'Cliente Registrado',
      isSuperAdmin: email === 'linajazmincampossaboya@gmail.com',
      direcciones: existingAccount.direcciones || [],
    };

    setIsLoading(false);

    if (isLinaAdmin) {
      onLoginCorporate(session, 'gerencia');
    } else {
      onLoginClient(session);
    }
    onClose();
  };

  // 2. REGISTRATION HANDLER (VALIDACIÓN ESTRICTA EN 'pintuco_users_db')
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = normalizeEmail(inputEmail);
    const nombre = regNombre.trim();
    const cedula = regCedula.trim();
    const telefono = regTelefono.trim();
    const password = inputPassword.trim();

    if (!nombre) {
      setErrorMessage('Por favor ingresa tu nombre completo.');
      return;
    }

    if (!cedula) {
      setErrorMessage('Por favor ingresa tu número de Cédula o NIT.');
      return;
    }

    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!telefono) {
      setErrorMessage('Por favor ingresa tu número de teléfono celular.');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('La contraseña debe contener al menos 4 caracteres.');
      return;
    }

    if (password !== confirmPassword.trim()) {
      setErrorMessage('Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    setIsLoading(true);

    // Call user database registration service with duplicate validation
    const result = registerPintucoUser({
      nombre,
      email,
      cedula,
      telefono,
      password,
      tipoDocumento: regTipoDoc,
    });

    if (!result.success || !result.user) {
      setIsLoading(false);
      // Mensaje de alerta obligatorio según especificación:
      setErrorMessage(result.error || 'Ya existe una cuenta registrada con este correo o número de cédula.');
      return;
    }

    const created = result.user;
    const isLinaAdmin = Boolean(created.isCorporate);

    const session: UserSession = {
      nombre: created.nombre,
      email: created.email,
      documento: created.cedula,
      tipoDocumento: (created.tipoDocumento || 'CC') as TipoDocumento,
      ciudad: created.ciudad || 'Bogotá D.C.',
      direccion: created.direccion || 'Carrera 15 # 93-60',
      telefono: created.telefono,
      userType: isLinaAdmin ? 'funcionario' : 'cliente',
      isLoggedIn: true,
      isCorporate: isLinaAdmin,
      corporateRole: isLinaAdmin ? 'gerencia' : undefined,
      departamento: created.departamento,
      cargo: created.cargo,
      isSuperAdmin: email === 'linajazmincampossaboya@gmail.com',
      direcciones: created.direcciones || [],
    };

    setIsLoading(false);

    // Requisito 3: Limpiar carrito para nuevo usuario registrado (0 elementos)
    try {
      localStorage.removeItem('colorlink_cart');
      localStorage.setItem('colorlink_cart', '[]');
    } catch (err) {
      console.error(err);
    }

    if (isLinaAdmin) {
      onLoginCorporate(session, 'gerencia');
    } else {
      onLoginClient(session, true);
    }
    onClose();
  };

  // =========================================================================
  // HANDLERS PARA FLUJO OTP DE CORREO ELECTRÓNICO (CÓDIGOS REALES AL BUZÓN)
  // =========================================================================

  // 1.B: ENVÍO DE OTP PARA LOGIN SIN CONTRASEÑA
  const handleSendLoginOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setTechnicalAlert(null);

    const email = normalizeEmail(inputEmail);
    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    setTechnicalAlert(null);
    setEvaluationBanner(null);
    const res = await authOtpService.sendEmailOtp(email, 'login');
    setIsLoading(false);

    if (res.devOtp) {
      console.log('%c 🔑 CÓDIGO OTP DEV: ' + res.devOtp, 'color: #00f2fe; font-size: 18px; font-weight: bold;');
    }

    if (res.success) {
      setIsConfigRequired(false);
      setLoginOtpStep('verify');
      setOtpResendTimer(60);
      setSuccessMessage(`Código de seguridad de 6 dígitos enviado a: ${email}.`);
    } else if (res.devOtp) {
      // Fallback de evaluación si Brevo rechaza o tarda
      setIsConfigRequired(false);
      setLoginOtpStep('verify');
      setOtpResendTimer(60);
      setEvaluationBanner(`⚠️ CÓDIGO OTP DE EVALUACIÓN: ${res.devOtp}`);
    } else {
      setErrorMessage(res.error || 'No se pudo enviar el código de acceso.');
    }
  };

  // 1.C: VERIFICACIÓN DE OTP PARA LOGIN
  const handleVerifyLoginOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || loginOtpCode).trim();
    if (!code || code.length !== 6) {
      setErrorMessage('Por favor ingresa los 6 dígitos del código enviado a tu correo.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const email = normalizeEmail(inputEmail);
    const res = await authOtpService.verifyEmailOtp(email, code, 'login');
    setIsLoading(false);

    if (res.success) {
      const usersDb = getPintucoUsersDb();
      let account = usersDb.find(u => normalizeEmail(u.email) === email);

      const isLinaAdmin = email === 'linajazmincampossaboya@gmail.com' || Boolean(account?.isCorporate) || email.endsWith('@pintuco.com');

      const session: UserSession = {
        nombre: account?.nombre || email.split('@')[0],
        email: email,
        documento: account?.cedula || (isLinaAdmin ? '1.032.456.789' : '1.020.304.506'),
        tipoDocumento: (account?.tipoDocumento || 'CC') as TipoDocumento,
        ciudad: account?.ciudad || 'Bogotá D.C.',
        direccion: account?.direccion || 'Carrera 15 # 93-60',
        telefono: account?.telefono || '+57 310 450 8890',
        userType: isLinaAdmin ? 'funcionario' : 'cliente',
        isLoggedIn: true,
        isCorporate: isLinaAdmin,
        corporateRole: isLinaAdmin ? 'gerencia' : undefined,
        departamento: isLinaAdmin ? (account?.departamento || 'Dirección General & Operaciones Corporativas Pintuco') : undefined,
        cargo: isLinaAdmin ? (account?.cargo || 'Administrador General') : 'Cliente Registrado',
        isSuperAdmin: email === 'linajazmincampossaboya@gmail.com',
        direcciones: account?.direcciones || [],
      };

      if (isLinaAdmin) {
        onLoginCorporate(session, 'gerencia');
      } else {
        onLoginClient(session);
      }
      onClose();
    } else {
      setErrorMessage(res.error || 'El código ingresado es incorrecto o ha expirado.');
    }
  };

  // 2.B: INICIAR REGISTRO CON ENVÍO DE CÓDIGO OTP AL CORREO
  const handleStartRegisterWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = normalizeEmail(inputEmail);
    const nombre = regNombre.trim();
    const cedula = regCedula.trim();
    const telefono = regTelefono.trim();
    const password = inputPassword.trim();

    if (!nombre) {
      setErrorMessage('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!cedula) {
      setErrorMessage('Por favor ingresa tu número de Cédula o NIT.');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (!telefono) {
      setErrorMessage('Por favor ingresa tu número de teléfono celular.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('La contraseña debe contener al menos 4 caracteres.');
      return;
    }
    if (password !== confirmPassword.trim()) {
      setErrorMessage('Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    // Verificar si ya existe en pintuco_users_db
    const usersDb = getPintucoUsersDb();
    const exists = usersDb.some(u => normalizeEmail(u.email) === email || u.cedula === cedula);
    if (exists) {
      setErrorMessage('Ya existe una cuenta registrada con este correo o número de cédula.');
      return;
    }

    setIsLoading(true);
    setTechnicalAlert(null);
    setEvaluationBanner(null);
    const res = await authOtpService.sendEmailOtp(email, 'register', {
      nombre,
      cedula,
      telefono,
    });
    setIsLoading(false);

    if (res.devOtp) {
      console.log('%c 🔑 CÓDIGO OTP DEV: ' + res.devOtp, 'color: #00f2fe; font-size: 18px; font-weight: bold;');
    }

    if (res.success) {
      setIsConfigRequired(false);
      setRegisterOtpStep('verify_otp');
      setOtpResendTimer(60);
      setSuccessMessage(`Código de verificación de 6 dígitos enviado a: ${email}.`);
    } else if (res.devOtp) {
      // Fallback de evaluación si Brevo rechaza o tarda
      setIsConfigRequired(false);
      setRegisterOtpStep('verify_otp');
      setOtpResendTimer(60);
      setEvaluationBanner(`⚠️ CÓDIGO OTP DE EVALUACIÓN: ${res.devOtp}`);
    } else {
      setErrorMessage(res.error || 'No se pudo enviar el código de verificación.');
    }
  };

  // 2.C: VERIFICAR OTP DE REGISTRO Y COMPLETAR ALTA
  const handleVerifyRegisterOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || registerOtpCode).trim();
    if (!code || code.length !== 6) {
      setErrorMessage('Por favor ingresa los 6 dígitos del código recibido.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const email = normalizeEmail(inputEmail);
    const res = await authOtpService.verifyEmailOtp(email, code, 'register');

    if (!res.success) {
      setIsLoading(false);
      setErrorMessage(res.error || 'El código ingresado es incorrecto o ha expirado.');
      return;
    }

    // Registrar en BD local
    const regResult = registerPintucoUser({
      nombre: regNombre.trim(),
      email,
      cedula: regCedula.trim(),
      telefono: regTelefono.trim(),
      password: inputPassword.trim(),
      tipoDocumento: regTipoDoc,
    });

    setIsLoading(false);

    if (!regResult.success || !regResult.user) {
      setErrorMessage(regResult.error || 'Error al completar el registro.');
      return;
    }

    const created = regResult.user;
    const isLinaAdmin = Boolean(created.isCorporate);

    const session: UserSession = {
      nombre: created.nombre,
      email: created.email,
      documento: created.cedula,
      tipoDocumento: (created.tipoDocumento || 'CC') as TipoDocumento,
      ciudad: created.ciudad || 'Bogotá D.C.',
      direccion: created.direccion || 'Carrera 15 # 93-60',
      telefono: created.telefono,
      userType: isLinaAdmin ? 'funcionario' : 'cliente',
      isLoggedIn: true,
      isCorporate: isLinaAdmin,
      corporateRole: isLinaAdmin ? 'gerencia' : undefined,
      departamento: created.departamento,
      cargo: created.cargo,
      isSuperAdmin: email === 'linajazmincampossaboya@gmail.com',
      direcciones: created.direcciones || [],
    };

    try {
      localStorage.removeItem('colorlink_cart');
      localStorage.setItem('colorlink_cart', '[]');
    } catch {}

    if (isLinaAdmin) {
      onLoginCorporate(session, 'gerencia');
    } else {
      onLoginClient(session, true);
    }
    onClose();
  };

  // 3. RECUPERACIÓN DE CONTRASEÑA CON OTP (FLUJO DE 3 PASOS)
  const handleSendRecoveryOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setTechnicalAlert(null);

    const email = normalizeEmail(recoveryEmail);
    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    setTechnicalAlert(null);
    setEvaluationBanner(null);
    const res = await authOtpService.sendEmailOtp(email, 'forgot_password');
    setIsLoading(false);

    if (res.devOtp) {
      console.log('%c 🔑 CÓDIGO OTP DEV: ' + res.devOtp, 'color: #00f2fe; font-size: 18px; font-weight: bold;');
    }

    if (res.success) {
      setIsConfigRequired(false);
      setRecoveryOtpStep('verify_otp');
      setOtpResendTimer(60);
      setSuccessMessage(`Código de seguridad de 6 dígitos enviado a: ${email}.`);
    } else if (res.devOtp) {
      // Fallback de evaluación si Brevo rechaza o tarda
      setIsConfigRequired(false);
      setRecoveryOtpStep('verify_otp');
      setOtpResendTimer(60);
      setEvaluationBanner(`⚠️ CÓDIGO OTP DE EVALUACIÓN: ${res.devOtp}`);
    } else {
      setErrorMessage(res.error || 'No se pudo enviar el código de recuperación.');
    }
  };

  const handleVerifyRecoveryOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || recoveryOtpCode).trim();
    if (!code || code.length !== 6) {
      setErrorMessage('Por favor ingresa los 6 dígitos del código.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const email = normalizeEmail(recoveryEmail);
    const res = await authOtpService.verifyEmailOtp(email, code, 'forgot_password');
    setIsLoading(false);

    if (res.success) {
      setRecoveryOtpStep('new_password');
      setSuccessMessage('Identidad validada con éxito. Define tu nueva contraseña.');
    } else {
      setErrorMessage(res.error || 'El código es incorrecto o ha expirado.');
    }
  };

  const handleSaveRecoveryPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (recoveryNewPassword.length < 4) {
      setErrorMessage('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (recoveryNewPassword !== recoveryConfirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    setIsLoading(true);
    const email = normalizeEmail(recoveryEmail);

    try {
      await authOtpService.resetPasswordWithOtp(email, recoveryOtpCode, recoveryNewPassword);
      resetPintucoUserPassword(email, recoveryNewPassword);

      setIsLoading(false);
      setSuccessMessage('¡Contraseña actualizada con éxito! Ahora puedes iniciar sesión.');
      setInputEmail(email);
      setAuthMode('login');
      setLoginMethod('password');
      setRecoveryOtpStep('request');
      setRecoveryOtpCode('');
      setRecoveryNewPassword('');
      setRecoveryConfirmPassword('');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('Error al actualizar la contraseña.');
    }
  };

  // Google OAuth Chooser Selection
  const handleGoogleAccountSelect = (selectedEmail: string, selectedName: string) => {
    setIsGoogleChooserOpen(false);
    setInputEmail(selectedEmail);
    setErrorMessage(null);

    const usersDb = getPintucoUsersDb();
    const existing = usersDb.find(u => normalizeEmail(u.email) === normalizeEmail(selectedEmail));

    if (existing) {
      setAuthMode('login');
      setInputPassword('');
      setSuccessMessage(`Cuenta detectada: ${existing.nombre}. Ingresa tu contraseña para autorizar.`);
    } else {
      setAuthMode('register');
      setRegNombre(selectedName);
      setRegCedula('');
      setRegTelefono('');
      setInputPassword('');
      setConfirmPassword('');
      setSuccessMessage(`Bienvenido/a ${selectedName}. Ingresa tu Cédula/NIT y contraseña para completar el registro.`);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* =========================================================================
            HEADER UNIFORME Y CORPORATIVO BRISA MARINA
        ========================================================================= */}
        <div className="bg-gradient-to-r from-blue-900 via-[#003366] to-teal-800 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              {authMode === 'forgot_password' ? (
                <KeyRound className="w-5 h-5 text-[#FFD100]" />
              ) : (
                <Lock className="w-5 h-5 text-[#FFD100]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-base text-white">
                  PINTUCO
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-teal-500 text-white">
                  COLORLINK
                </span>
              </div>
              <h2 className="text-xs text-sky-100/90 font-semibold">
                {currentSession?.isLoggedIn ? 'Mi Cuenta Activa' : (
                  authMode === 'login' ? 'Iniciar Sesión' :
                  authMode === 'register' ? 'Crear Cuenta Pintuco' :
                  'Recuperar Contraseña'
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentSession?.isLoggedIn && onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer shadow-sm border border-rose-500/50"
                title="Cerrar sesión actual"
              >
                <LogOut className="w-3.5 h-3.5 text-white" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Configuración de Servidor de Correo (SMTP)"
            >
              <Settings className="w-4 h-4 text-cyan-300" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Motivo contextual de acción obligatoria */}
        {requiredActionReason && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-5 flex items-center gap-2 text-amber-900 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{requiredActionReason}</span>
          </div>
        )}

        {/* Mensajes de Éxito / Error */}
        <div className="px-6 pt-4 space-y-2">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
              {isConfigRequired && (
                <div className="mt-2.5 pt-2 border-t border-red-200/80 flex items-center justify-between gap-2 flex-wrap">
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
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {evaluationBanner && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-400 text-amber-950 text-xs font-semibold animate-fadeIn shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="text-lg shrink-0 mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="font-bold leading-relaxed text-amber-950 mb-2">
                    {evaluationBanner}
                  </p>
                  {(loginOtpStep === 'verify' || registerOtpStep === 'verify_otp' || recoveryOtpStep === 'verify_otp') && (
                    <button
                      type="button"
                      onClick={() => {
                        const match = evaluationBanner.match(/\b\d{6}\b/);
                        if (match) {
                          const code = match[0];
                          if (authMode === 'login') {
                            setLoginOtpCode(code);
                            handleVerifyLoginOtp(code);
                          } else if (authMode === 'register') {
                            setRegisterOtpCode(code);
                            handleVerifyRegisterOtp(code);
                          } else if (authMode === 'forgot_password') {
                            setRecoveryOtpCode(code);
                            handleVerifyRecoveryOtp(code);
                          }
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
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div className="flex-1">
                  <span className="font-bold text-amber-950 block mb-0.5">Diagnóstico Técnico de Correo:</span>
                  <span className="leading-relaxed">{technicalAlert}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            CUERPO DEL FORMULARIO: LOGIN, REGISTRO O RECUPERACIÓN
        ========================================================================= */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* 1. MODO: INICIAR SESIÓN */}
          {authMode === 'login' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Botón Estándar de Google OAuth */}
              <button
                type="button"
                onClick={() => setIsGoogleChooserOpen(true)}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-3 shadow-xs hover:border-slate-400 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continuar con Google</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[11px] font-medium">o ingresa con tu correo</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Selector de Método: Contraseña vs Código OTP al Correo */}
              <div className="flex p-1 bg-slate-100 rounded-xl gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 font-bold rounded-lg transition-all cursor-pointer ${
                    loginMethod === 'password'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Con Contraseña
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('otp');
                    setLoginOtpStep('request');
                    setLoginOtpCode('');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-1.5 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    loginMethod === 'otp'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Código OTP al Correo</span>
                </button>
              </div>

              {/* Formulario 1: Con Contraseña */}
              {loginMethod === 'password' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        value={inputEmail}
                        onChange={(e) => setInputEmail(e.target.value)}
                        placeholder="nombre@ejemplo.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20 text-xs text-slate-900 outline-none transition-all shadow-xs"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        value={inputPassword}
                        onChange={(e) => setInputPassword(e.target.value)}
                        placeholder="Ingresa tu contraseña"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20 text-xs text-slate-900 outline-none transition-all shadow-xs"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* ENLACE INTERACTIVO: "¿Olvidaste tu contraseña?" */}
                    <div className="flex justify-end pt-1.5">
                      <button
                        type="button"
                        onClick={handleOpenForgotPassword}
                        className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar Sesión</span>
                  </button>
                </form>
              )}

              {/* Formulario 2: Con Código OTP Enviado al Correo */}
              {loginMethod === 'otp' && (
                <div className="space-y-4">
                  {loginOtpStep === 'request' ? (
                    <form onSubmit={handleSendLoginOtp} className="space-y-3.5">
                      <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                        <span>
                          Te enviaremos un código de seguridad de 6 dígitos a tu correo para acceder sin necesidad de recordar tu contraseña.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Correo electrónico
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            value={inputEmail}
                            onChange={(e) => setInputEmail(e.target.value)}
                            placeholder="nombre@ejemplo.com"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20 text-xs text-slate-900 outline-none transition-all shadow-xs"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-900 to-cyan-700 hover:from-blue-800 hover:to-cyan-600 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Enviando código...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Enviar Código de Acceso (OTP)</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-3.5 animate-fadeIn">
                      <div className="text-center">
                        <div className="w-10 h-10 bg-cyan-50 text-cyan-700 rounded-xl flex items-center justify-center mx-auto mb-2 border border-cyan-100">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">
                          Código de Acceso Enviado
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Ingresa los 6 dígitos que enviamos a <strong>{inputEmail}</strong>
                        </p>
                      </div>

                      <OtpInputBoxes
                        value={loginOtpCode}
                        onChange={setLoginOtpCode}
                        onComplete={(code) => handleVerifyLoginOtp(code)}
                        disabled={isLoading}
                      />

                      <button
                        type="button"
                        onClick={() => handleVerifyLoginOtp()}
                        disabled={isLoading || loginOtpCode.length !== 6}
                        className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Verificando...</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-4 h-4" />
                            <span>Verificar Código e Ingresar</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between pt-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginOtpStep('request');
                            setLoginOtpCode('');
                            setErrorMessage(null);
                          }}
                          className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Cambiar correo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendLoginOtp()}
                          disabled={otpResendTimer > 0 || isLoading}
                          className={`flex items-center gap-1 cursor-pointer font-bold ${
                            otpResendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-cyan-700 hover:text-cyan-800'
                          }`}
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                          <span>
                            {otpResendTimer > 0 ? `Reenviar en ${otpResendTimer}s` : 'Reenviar código'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botón para cambiar a Registrarse */}
              <div className="pt-2 text-center text-xs text-slate-600">
                <span>¿No tienes una cuenta registrada? </span>
                <button
                  type="button"
                  onClick={handleSwitchToRegister}
                  className="font-bold text-blue-900 hover:underline cursor-pointer"
                >
                  Registrarse
                </button>
              </div>

            </div>
          )}

          {/* 2. MODO: REGISTRO ÚNICO DE USUARIO CON VALIDACIÓN EN 'pintuco_users_db' */}
          {authMode === 'register' && (
            <div className="space-y-4 animate-fadeIn">
              {registerOtpStep === 'form' ? (
                <>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Ingresa tus datos y Cédula/NIT para registrar tu cuenta en Pintuco y validar tu correo mediante código OTP.
                  </p>

                  <form onSubmit={handleStartRegisterWithOtp} className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Nombre Completo / Razón Social
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          value={regNombre}
                          onChange={(e) => setRegNombre(e.target.value)}
                          placeholder="Nombre y Apellidos o Empresa"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20 text-xs text-slate-900 outline-none transition-all shadow-xs"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    {/* CAMPO OBLIGATORIO: Número de Cédula / NIT */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Tipo Doc.
                        </label>
                        <select
                          value={regTipoDoc}
                          onChange={(e) => setRegTipoDoc(e.target.value as TipoDocumento)}
                          className="w-full px-2.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] text-xs text-slate-900 bg-white"
                        >
                          <option value="CC">CC</option>
                          <option value="NIT">NIT</option>
                          <option value="CE">CE</option>
                          <option value="Pasaporte">Pasap.</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                          <span>Número de Cédula / NIT</span>
                          <span className="text-[10px] text-red-600 font-extrabold">* Único</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            value={regCedula}
                            onChange={(e) => setRegCedula(e.target.value)}
                            placeholder="Ej: 1020304506 o 900845120-4"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20 text-xs text-slate-900 outline-none transition-all shadow-xs"
                          />
                          <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Correo electrónico (Receptor de OTP)
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          value={inputEmail}
                          onChange={(e) => setInputEmail(e.target.value)}
                          placeholder="nombre@ejemplo.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20 text-xs text-slate-900 outline-none transition-all shadow-xs"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Teléfono Celular
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          required
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          value={regTelefono}
                          onChange={(e) => setRegTelefono(e.target.value)}
                          placeholder="+57 300 123 4567"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20 text-xs text-slate-900 outline-none transition-all shadow-xs"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Crear Contraseña
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            value={inputPassword}
                            onChange={(e) => setInputPassword(e.target.value)}
                            placeholder="Mínimo 4 caracteres"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20 text-xs text-slate-900 outline-none transition-all shadow-xs"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Confirmar Contraseña
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite la contraseña"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20 text-xs text-slate-900 outline-none transition-all shadow-xs"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enviando código de verificación...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-cyan-300" />
                          <span>Verificar Correo y Registrar Cuenta (OTP)</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                /* PASO OTP: VERIFICACIÓN CON 6 CASILLAS NUMÉRICAS */
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-cyan-50 text-cyan-700 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-cyan-100">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-black text-slate-800">
                      Código de Verificación de Registro
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Ingresa el código de 6 dígitos enviado al correo:<br />
                      <strong className="text-slate-800 font-mono">{inputEmail}</strong>
                    </p>
                  </div>

                  <OtpInputBoxes
                    value={registerOtpCode}
                    onChange={setRegisterOtpCode}
                    onComplete={(code) => handleVerifyRegisterOtp(code)}
                    disabled={isLoading}
                    autoFocus={true}
                  />

                  <button
                    type="button"
                    onClick={() => handleVerifyRegisterOtp()}
                    disabled={isLoading || registerOtpCode.length !== 6}
                    className="w-full py-3.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verificando y Creando Cuenta...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Verificar Código y Activar Cuenta</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setRegisterOtpStep('form');
                        setRegisterOtpCode('');
                        setErrorMessage(null);
                      }}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Modificar datos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartRegisterWithOtp({ preventDefault: () => {} } as any)}
                      disabled={otpResendTimer > 0 || isLoading}
                      className={`flex items-center gap-1 cursor-pointer font-bold ${
                        otpResendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-cyan-700 hover:text-cyan-800'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>
                        {otpResendTimer > 0 ? `Reenviar en ${otpResendTimer}s` : 'Reenviar código'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Botón para regresar a Iniciar Sesión */}
              <div className="pt-2 text-center text-xs text-slate-600">
                <span>¿Ya tienes una cuenta registrada? </span>
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="font-bold text-blue-900 hover:underline cursor-pointer"
                >
                  Iniciar Sesión
                </button>
              </div>

            </div>
          )}

          {/* 3. MODO: RECUPERACIÓN DE CONTRASEÑA EN 3 PASOS CON CÓDIGO REAL AL CORREO */}
          {authMode === 'forgot_password' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* PASO 1: SOLICITAR CORREO */}
              {recoveryOtpStep === 'request' && (
                <form onSubmit={handleSendRecoveryOtp} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
                    <KeyRound className="w-4 h-4 text-[#0033A0] shrink-0 mt-0.5" />
                    <span>
                      Ingresa tu correo registrado. Te enviaremos un código de seguridad de 6 dígitos para validar tu identidad de forma segura.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Correo electrónico registrado
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="nombre@ejemplo.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20 text-xs text-slate-900 outline-none transition-all shadow-xs"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-900 to-cyan-700 hover:from-blue-800 hover:to-cyan-600 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Enviando código...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Código de Recuperación (OTP)</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* PASO 2: INGRESAR CÓDIGO DE 6 DÍGITOS */}
              {recoveryOtpStep === 'verify_otp' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-cyan-50 text-cyan-700 rounded-xl flex items-center justify-center mx-auto mb-2 border border-cyan-100">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Código de Recuperación Enviado
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ingresa el código de 6 dígitos enviado a:<br />
                      <strong className="text-slate-800 font-mono">{recoveryEmail}</strong>
                    </p>
                  </div>

                  <OtpInputBoxes
                    value={recoveryOtpCode}
                    onChange={setRecoveryOtpCode}
                    onComplete={(code) => handleVerifyRecoveryOtp(code)}
                    disabled={isLoading}
                    autoFocus={true}
                  />

                  <button
                    type="button"
                    onClick={() => handleVerifyRecoveryOtp()}
                    disabled={isLoading || recoveryOtpCode.length !== 6}
                    className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Validando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Verificar Código</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryOtpStep('request');
                        setRecoveryOtpCode('');
                        setErrorMessage(null);
                      }}
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Cambiar correo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendRecoveryOtp()}
                      disabled={otpResendTimer > 0 || isLoading}
                      className={`flex items-center gap-1 cursor-pointer font-bold ${
                        otpResendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-cyan-700 hover:text-cyan-800'
                      }`}
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>
                        {otpResendTimer > 0 ? `Reenviar en ${otpResendTimer}s` : 'Reenviar código'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3: NUEVA CONTRASEÑA */}
              {recoveryOtpStep === 'new_password' && (
                <form onSubmit={handleSaveRecoveryPassword} className="space-y-3.5 animate-fadeIn">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Identidad verificada. Por favor define tu nueva contraseña.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showRecoveryPassword ? 'text' : 'password'}
                        required
                        value={recoveryNewPassword}
                        onChange={(e) => setRecoveryNewPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] text-xs text-slate-900 bg-white"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showRecoveryPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showRecoveryPassword ? 'text' : 'password'}
                        required
                        value={recoveryConfirmPassword}
                        onChange={(e) => setRecoveryConfirmPassword(e.target.value)}
                        placeholder="Repite la nueva contraseña"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#0033A0] text-xs text-slate-900 bg-white"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
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

              {/* Botón: "Volver a Iniciar Sesión" */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleSwitchToLogin}
                  className="inline-flex items-center gap-2 font-bold text-xs text-blue-900 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a Iniciar Sesión</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal selector de cuentas Google */}
        {isGoogleChooserOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-scaleUp">
              <div className="p-5 text-center border-b border-slate-100">
                <svg className="w-7 h-7 mx-auto mb-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="text-sm font-bold text-slate-800">Elige una cuenta</h3>
                <p className="text-[11px] text-slate-500">para continuar con COLORLINK Pintuco</p>
              </div>

              <div className="p-3 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => handleGoogleAccountSelect('linajazmincampossaboya@gmail.com', 'Lina Jazmín Campos Saboya')}
                  className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    LC
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">
                      Lina Jazmín Campos Saboya
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      linajazmincampossaboya@gmail.com
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleGoogleAccountSelect('cliente.demo@gmail.com', 'Cliente Demo Obra')}
                  className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    CD
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">
                      Cliente Demo Obra
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate">
                      cliente.demo@gmail.com
                    </span>
                  </div>
                </button>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsGoogleChooserOpen(false)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Configuración de Correo */}
        <EmailConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onConfigUpdated={() => {
            setIsConfigRequired(false);
            setErrorMessage(null);
          }}
        />

      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
};
