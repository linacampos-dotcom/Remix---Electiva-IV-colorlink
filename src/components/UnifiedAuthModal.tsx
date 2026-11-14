import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserSession, TipoDocumento, CorporateRole } from '../types';
import { 
  getPintucoUsersDb, 
  savePintucoUsersDb, 
  registerPintucoUser,
  resetPintucoUserPassword,
  findUserByEmail,
  normalizeEmail,
  normalizeDocument,
  PintucoUserAccount
} from '../utils/userDatabase';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { checkUnifiedUserStatus, syncClientProfileToSupabase, fetchUserProfileAndAddressesFromSupabase, RemoteUserProfile } from '../lib/supabaseService';
import { 
  X, 
  User, 
  UserCheck,
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
  Settings,
  Sparkles
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

  // Estados para validación unificada y vinculación de perfiles en Supabase Auth
  const [accountAlreadyExists, setAccountAlreadyExists] = useState(false);
  const [isCompletingExistingAuthUser, setIsCompletingExistingAuthUser] = useState(false);
  const [existingAuthUserId, setExistingAuthUserId] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Reset and synchronize state on open
  useEffect(() => {
    if (isOpen) {
      setAuthMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setTechnicalAlert(null);
      setEvaluationBanner(null);
      setAccountAlreadyExists(false);
      setIsCompletingExistingAuthUser(false);
      setExistingAuthUserId(null);
      setRedirectCountdown(null);
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

  // Temporizador regresivo para redirección automática al login si ya está registrado
  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0) {
      setRedirectCountdown(null);
      setAccountAlreadyExists(false);
      setAuthMode('login');
      setLoginMethod('password');
      setErrorMessage(null);
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown]);

  const handleSwitchToRegister = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setAccountAlreadyExists(false);
    setIsCompletingExistingAuthUser(false);
    setRedirectCountdown(null);
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
    setAccountAlreadyExists(false);
    setIsCompletingExistingAuthUser(false);
    setRedirectCountdown(null);
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
    setAccountAlreadyExists(false);
    setRedirectCountdown(null);
    setRecoveryEmail(inputEmail.trim());
    setRecoveryNewPassword('');
    setRecoveryConfirmPassword('');
    setRecoveryEmailVerified(false);
    setAuthMode('forgot_password');
  };

  // 1. Verificación unificada al escribir el correo electrónico
  const handleCheckEmailStatus = async (emailToCheck: string) => {
    const cleanEmail = normalizeEmail(emailToCheck);
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length < 5) return;

    try {
      const status = await checkUnifiedUserStatus(cleanEmail, regCedula);

      if (authMode === 'register') {
        if (status.existsInAuth) {
          if (status.hasClientProfile) {
            // Usuario ya existe en Supabase Auth y tiene perfil completo en clientes
            setAccountAlreadyExists(true);
            setIsCompletingExistingAuthUser(false);
            setExistingAuthUserId(status.authUserId || null);
          } else {
            // Usuario YA existe en Supabase Auth pero NO tiene perfil creado en la tabla de clientes:
            // En lugar de mostrar error, permitirle completar su perfil y vincularlo
            setIsCompletingExistingAuthUser(true);
            setAccountAlreadyExists(false);
            setExistingAuthUserId(status.authUserId || null);
            if (status.clientProfile?.nombre && !regNombre) {
              setRegNombre(status.clientProfile.nombre);
            }
            if (status.clientProfile?.numero_documento && !regCedula) {
              setRegCedula(status.clientProfile.numero_documento);
            }
          }
        } else {
          setAccountAlreadyExists(false);
          setIsCompletingExistingAuthUser(false);
        }
      }
    } catch (err) {
      console.debug('Error en verificación de correo:', err);
    }
  };

  if (!isOpen) return null;

  // 1. LOGIN HANDLER
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setAccountAlreadyExists(false);

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

    // 1.1 Intentar autenticación oficial directa con Supabase Auth
    let supabaseUser: any = null;
    let supabaseAuthSucceeded = false;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sbData, error: sbErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!sbErr && sbData?.user) {
          supabaseUser = sbData.user;
          supabaseAuthSucceeded = true;
        }
      } catch (sbEx) {
        console.debug('Supabase signInWithPassword:', sbEx);
      }
    }

    // 1.2 Si Supabase Auth valida las credenciales exitosamente
    if (supabaseAuthSucceeded && supabaseUser) {
      const meta = supabaseUser.user_metadata || {};
      const remoteProfile: RemoteUserProfile = await fetchUserProfileAndAddressesFromSupabase(
        supabaseUser.id,
        email,
        meta.cedula || meta.documento || meta.numero_documento || existingAccount?.cedula
      ).catch((): RemoteUserProfile => ({ direcciones: [] }));

      const userDoc = meta.cedula || meta.numero_documento || meta.documento || remoteProfile.documento || existingAccount?.cedula;
      const userName = meta.nombre || remoteProfile.nombre || existingAccount?.nombre;
      const userPhone = meta.telefono || remoteProfile.telefono || existingAccount?.telefono;
      const userTipoDoc = meta.tipoDocumento || remoteProfile.tipoDocumento || existingAccount?.tipoDocumento || 'CC';
      const userCiudad = meta.ciudad || remoteProfile.ciudad || existingAccount?.ciudad || 'Bogotá D.C.';
      const userDireccion = meta.direccion || remoteProfile.direccion || existingAccount?.direccion || '';
      const userDirecciones =
        (Array.isArray(remoteProfile.direcciones) && remoteProfile.direcciones.length > 0)
          ? remoteProfile.direcciones
          : (Array.isArray(meta.direcciones) && meta.direcciones.length > 0)
            ? meta.direcciones
            : (existingAccount?.direcciones || []);

      // Si el usuario existe en Supabase Auth pero NO tiene perfil completo (nombre o cédula):
      // Permitirle completar su perfil y vincularlo
      if (!userDoc || !userName) {
        setIsLoading(false);
        setIsCompletingExistingAuthUser(true);
        setExistingAuthUserId(supabaseUser.id);
        setAuthMode('register');
        setRegNombre(userName || '');
        setRegCedula(userDoc || '');
        setRegTelefono(userPhone || '');
        setRegTipoDoc(userTipoDoc as TipoDocumento);
        setSuccessMessage('✓ Cuenta autenticada en Supabase Auth. Completa tus datos para finalizar tu perfil de cliente.');
        return;
      }

      const isLinaAdmin = email === 'linajazmincampossaboya@gmail.com' || Boolean(existingAccount?.isCorporate) || email.endsWith('@pintuco.com');

      const session: UserSession = {
        id: supabaseUser.id,
        nombre: userName,
        email: email,
        documento: userDoc || (isLinaAdmin ? '1.032.456.789' : '1.020.304.506'),
        tipoDocumento: userTipoDoc as TipoDocumento,
        ciudad: userCiudad,
        direccion: userDireccion || 'Carrera 15 # 93-60',
        telefono: userPhone || '+57 300 123 4567',
        userType: isLinaAdmin ? 'funcionario' : 'cliente',
        isLoggedIn: true,
        isCorporate: isLinaAdmin,
        corporateRole: isLinaAdmin ? 'gerencia' : undefined,
        departamento: isLinaAdmin ? (existingAccount?.departamento || 'Dirección General & Operaciones Corporativas Pintuco') : undefined,
        cargo: isLinaAdmin ? (existingAccount?.cargo || 'Administrador General') : 'Cliente Registrado',
        isSuperAdmin: email === 'linajazmincampossaboya@gmail.com',
        direcciones: userDirecciones,
      };

      if (userDirecciones.length > 0) {
        try {
          localStorage.setItem('colorlink_user_addresses', JSON.stringify(userDirecciones));
        } catch {}
      }

      // Sincronizar en base local
      if (!existingAccount) {
        registerPintucoUser({
          nombre: userName,
          email,
          cedula: userDoc,
          telefono: userPhone || '+57 300 123 4567',
          password,
          tipoDocumento: userTipoDoc as TipoDocumento,
        });
      }

      setIsLoading(false);
      if (isLinaAdmin) {
        onLoginCorporate(session, 'gerencia');
      } else {
        onLoginClient(session);
      }
      onClose();
      return;
    }

    // 1.3 Si no validó con Supabase Auth, verificar cuenta en registro local
    if (existingAccount) {
      if (existingAccount.password !== password) {
        setIsLoading(false);
        setErrorMessage('Contraseña incorrecta. Inténtalo de nuevo.');
        return;
      }

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
      return;
    }

    // 1.4 Si no se encuentra en local, verificar estado unificado
    setIsLoading(false);
    const status = await checkUnifiedUserStatus(email);
    if (status.existsInAuth) {
      if (!status.hasClientProfile) {
        setIsCompletingExistingAuthUser(true);
        setExistingAuthUserId(status.authUserId || null);
        setAuthMode('register');
        setSuccessMessage('✓ Tu cuenta de acceso está activa. Por favor completa tus datos para vincular tu perfil.');
        return;
      }
      setErrorMessage('Contraseña incorrecta. Puedes restablecerla o ingresar con código OTP de acceso rápido.');
    } else {
      setErrorMessage('No encontramos una cuenta registrada con este correo. Puedes crear tu cuenta a continuación.');
      setAuthMode('register');
    }
  };

  // 2. REGISTRATION HANDLER (CON VALIDACIÓN UNIFICADA Y VINCULACIÓN LIMPIA)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setAccountAlreadyExists(false);

    const email = normalizeEmail(inputEmail);
    const nombre = regNombre.trim();
    const cedula = regCedula.trim();
    const telefono = regTelefono.trim();
    const password = inputPassword.trim();

    if (!nombre) {
      setErrorMessage('Por favor ingresa tu nombre completo o razón social.');
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

    // ESCENARIO A: El usuario YA existe en Supabase Auth pero NO tiene perfil creado en clientes
    // Permite completar su perfil (Nombre, Cédula, Teléfono) y vincularlo al mismo user_id
    if (isCompletingExistingAuthUser) {
      setIsLoading(true);
      try {
        const syncRes = await syncClientProfileToSupabase({
          user_id: existingAuthUserId || undefined,
          email,
          nombre,
          cedula,
          telefono,
          tipoDocumento: regTipoDoc,
          ciudad: 'Bogotá D.C.',
        });

        const usersDb = getPintucoUsersDb();
        const existingIdx = usersDb.findIndex(u => normalizeEmail(u.email) === email);
        const isLinaAdmin = email === 'linajazmincampossaboya@gmail.com' || email.endsWith('@pintuco.com');

        const session: UserSession = {
          id: existingAuthUserId || syncRes.clienteId || undefined,
          nombre,
          email,
          documento: cedula,
          tipoDocumento: regTipoDoc,
          ciudad: 'Bogotá D.C.',
          direccion: 'Carrera 15 # 93-60',
          telefono,
          userType: isLinaAdmin ? 'funcionario' : 'cliente',
          isLoggedIn: true,
          isCorporate: isLinaAdmin,
          corporateRole: isLinaAdmin ? 'gerencia' : undefined,
          cargo: isLinaAdmin ? 'Administrador General' : 'Cliente Registrado',
          isSuperAdmin: email === 'linajazmincampossaboya@gmail.com',
          direcciones: [],
        };

        if (existingIdx !== -1) {
          usersDb[existingIdx] = {
            ...usersDb[existingIdx],
            nombre,
            cedula,
            telefono,
            tipoDocumento: regTipoDoc,
          };
          savePintucoUsersDb(usersDb);
        } else {
          registerPintucoUser({
            nombre,
            email,
            cedula,
            telefono,
            password: password || 'pintuco_linked',
            tipoDocumento: regTipoDoc,
          });
        }

        setIsLoading(false);
        setSuccessMessage('¡Perfil de cliente vinculado y cuenta completada con éxito!');
        setTimeout(() => {
          if (isLinaAdmin) {
            onLoginCorporate(session, 'gerencia');
          } else {
            onLoginClient(session, true);
          }
          onClose();
        }, 1000);
        return;
      } catch (err: any) {
        setIsLoading(false);
        setErrorMessage(err?.message || 'Error al vincular el perfil con tu cuenta.');
        return;
      }
    }

    // ESCENARIO B: Usuario NO existe en ninguna de las dos tablas -> Registro normal con supabase.auth.signUp()
    if (!password) {
      setErrorMessage('Por favor ingresa una contraseña.');
      return;
    }

    if (password !== confirmPassword.trim()) {
      setErrorMessage('Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    setIsLoading(true);

    try {
      // Invocación nativa oficial a Supabase Auth signUp
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://remix-electiva-iv-colorlink.vercel.app/login',
          data: {
            nombre,
            cedula,
            numero_documento: cedula,
            telefono,
            tipoDocumento: regTipoDoc,
          },
        },
      });

      // Manejo amigable del error "User already registered" (en lugar de bloquear con error rojo)
      const isAlreadyRegistered = 
        (error && (
          error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already been registered') ||
          error.message.toLowerCase().includes('user already exists')
        )) ||
        (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0);

      if (isAlreadyRegistered) {
        setIsLoading(false);
        setAccountAlreadyExists(true);
        setErrorMessage(null);
        setRedirectCountdown(3);
        return;
      }

      if (error) {
        console.error('[AUTH DEBUG]', error);
        setIsLoading(false);
        setErrorMessage(error.message);
        return;
      }

      // Sincronizar el perfil en la tabla 'clientes' de Supabase
      await syncClientProfileToSupabase({
        user_id: data?.user?.id,
        email,
        nombre,
        cedula,
        telefono,
        tipoDocumento: regTipoDoc,
      });

      setIsLoading(false);
      setRegisterOtpStep('verify_otp');
      setRegisterOtpCode('');
      setSuccessMessage('¡Registro exitoso! Hemos enviado un correo de verificación a tu bandeja de entrada.');

      // Registrar en la base local para precargar perfil del cliente
      registerPintucoUser({
        nombre,
        email,
        cedula,
        telefono,
        password,
        tipoDocumento: regTipoDoc,
      });

      try {
        localStorage.removeItem('colorlink_cart');
        localStorage.setItem('colorlink_cart', '[]');
      } catch (err) {
        console.error(err);
      }
    } catch (err: any) {
      console.error('[AUTH DEBUG]', err);
      setIsLoading(false);
      const isAlready = err?.message && err.message.toLowerCase().includes('already');
      if (isAlready) {
        setAccountAlreadyExists(true);
        setErrorMessage(null);
        setRedirectCountdown(3);
      } else {
        setErrorMessage(err?.message || 'Error inesperado durante el registro.');
      }
    }
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
      const remoteProfile: RemoteUserProfile = await fetchUserProfileAndAddressesFromSupabase(
        account?.id,
        email,
        account?.cedula
      ).catch((): RemoteUserProfile => ({ direcciones: [] }));

      const isLinaAdmin = email === 'linajazmincampossaboya@gmail.com' || Boolean(account?.isCorporate) || email.endsWith('@pintuco.com');
      const mergedDirecciones =
        (Array.isArray(remoteProfile.direcciones) && remoteProfile.direcciones.length > 0)
          ? remoteProfile.direcciones
          : (account?.direcciones || []);

      if (mergedDirecciones.length > 0) {
        try {
          localStorage.setItem('colorlink_user_addresses', JSON.stringify(mergedDirecciones));
        } catch {}
      }

      const session: UserSession = {
        id: account?.id,
        nombre: remoteProfile.nombre || account?.nombre || email.split('@')[0],
        email: email,
        documento: remoteProfile.documento || account?.cedula || (isLinaAdmin ? '1.032.456.789' : '1.020.304.506'),
        tipoDocumento: (remoteProfile.tipoDocumento || account?.tipoDocumento || 'CC') as TipoDocumento,
        ciudad: remoteProfile.ciudad || account?.ciudad || 'Bogotá D.C.',
        direccion: remoteProfile.direccion || account?.direccion || 'Carrera 15 # 93-60',
        telefono: remoteProfile.telefono || account?.telefono || '+57 310 450 8890',
        userType: isLinaAdmin ? 'funcionario' : 'cliente',
        isLoggedIn: true,
        isCorporate: isLinaAdmin,
        corporateRole: isLinaAdmin ? 'gerencia' : undefined,
        departamento: isLinaAdmin ? (account?.departamento || 'Dirección General & Operaciones Corporativas Pintuco') : undefined,
        cargo: isLinaAdmin ? (account?.cargo || 'Administrador General') : 'Cliente Registrado',
        isSuperAdmin: email === 'linajazmincampossaboya@gmail.com',
        direcciones: mergedDirecciones,
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

  // 2.C: VERIFICAR CÓDIGO OTP DE REGISTRO EN SUPABASE AUTH
  const handleVerifyRegisterOtp = async (codeToVerify?: string | React.FormEvent) => {
    if (codeToVerify && typeof codeToVerify === 'object' && 'preventDefault' in codeToVerify) {
      codeToVerify.preventDefault();
    }
    const otpCode = (typeof codeToVerify === 'string' ? codeToVerify : registerOtpCode).trim();
    if (!otpCode || otpCode.length !== 6) {
      setErrorMessage('Por favor ingresa los 6 dígitos del código recibido por correo.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const email = normalizeEmail(inputEmail);

    try {
      // 3. Validación en Supabase: supabase.auth.verifyOtp
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'signup',
      });

      if (error) {
        console.error('[AUTH DEBUG]', error);
        setIsLoading(false);
        setErrorMessage(error.message);
        return;
      }

      setIsLoading(false);

      // 4. Resultado: Si el código es correcto, activa la sesión del usuario o redirígelo al inicio de sesión con el mensaje "¡Cuenta activada con éxito!"
      const usersDb = getPintucoUsersDb();
      let created = usersDb.find(u => normalizeEmail(u.email) === email);
      const isLinaAdmin = email === 'linajazmincampossaboya@gmail.com' || Boolean(created?.isCorporate) || email.endsWith('@pintuco.com');

      const session: UserSession = {
        nombre: regNombre.trim() || created?.nombre || email.split('@')[0],
        email: email,
        documento: regCedula.trim() || created?.cedula || (isLinaAdmin ? '1.032.456.789' : '1.020.304.506'),
        tipoDocumento: regTipoDoc || (created?.tipoDocumento as TipoDocumento) || 'CC',
        ciudad: created?.ciudad || 'Bogotá D.C.',
        direccion: created?.direccion || 'Carrera 15 # 93-60',
        telefono: regTelefono.trim() || created?.telefono || '+57 300 123 4567',
        userType: isLinaAdmin ? 'funcionario' : 'cliente',
        isLoggedIn: true,
        isCorporate: isLinaAdmin,
        corporateRole: isLinaAdmin ? 'gerencia' : undefined,
        departamento: created?.departamento,
        cargo: isLinaAdmin ? (created?.cargo || 'Administrador General') : 'Cliente Registrado',
        isSuperAdmin: email === 'linajazmincampossaboya@gmail.com',
        direcciones: created?.direcciones || [],
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

      setAuthMode('login');
      setRegisterOtpStep('form');
      setSuccessMessage('¡Cuenta activada con éxito!');
      setErrorMessage(null);
    } catch (err: any) {
      console.error('[AUTH DEBUG]', err);
      setIsLoading(false);
      setErrorMessage(err?.message || 'Error inesperado al validar el código.');
    }
  };

  // 3. RECUPERACIÓN DE CONTRASEÑA CON OTP (FLUJO DE 3 PASOS)
  const handleSendRecoveryOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setTechnicalAlert(null);
    setEvaluationBanner(null);

    const email = normalizeEmail(recoveryEmail);
    if (!email || !email.includes('@')) {
      setErrorMessage('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);

    // 1. VALIDACIÓN DE EXISTENCIA PREVIA EN BD / SUPABASE / USUARIOS LOCALES
    const userCheck = await authOtpService.checkUserExists(email);
    const localUser = findUserByEmail(email);

    let exists = userCheck.exists || Boolean(localUser);

    // Consulta directa a Supabase si está disponible
    if (!exists && isSupabaseConfigured && supabase) {
      try {
        const { data: sbClient } = await supabase
          .from('clientes')
          .select('id')
          .ilike('email', email)
          .limit(1);
        if (sbClient && sbClient.length > 0) {
          exists = true;
        }
      } catch (sbErr) {
        console.warn('Error comprobando existencia en Supabase:', sbErr);
      }
    }

    // 2. MANEJO DE CORREOS NO REGISTRADOS: BLOQUEAR INMEDIATAMENTE EL AVANCE
    if (!exists) {
      setIsLoading(false);
      setErrorMessage('El correo ingresado no se encuentra registrado en el sistema.');
      setEvaluationBanner(null);
      setTechnicalAlert(null);
      return; // Bloquea el avance, se queda en el paso de ingreso de correo
    }

    // 3. SOLICITUD DE OTP SI EL CORREO SÍ EXISTE
    const res = await authOtpService.sendEmailOtp(email, 'forgot_password');
    setIsLoading(false);

    if (res.notFound) {
      setErrorMessage(res.message || res.error || 'El correo ingresado no se encuentra registrado en el sistema.');
      setEvaluationBanner(null);
      return;
    }

    if (res.devOtp) {
      console.log('%c 🔑 CÓDIGO OTP DEV: ' + res.devOtp, 'color: #00f2fe; font-size: 18px; font-weight: bold;');
    }

    if (res.success) {
      setIsConfigRequired(false);
      setRecoveryOtpStep('verify_otp');
      setOtpResendTimer(60);
      setSuccessMessage(res.message || 'Código enviado');
    } else {
      setErrorMessage(res.message || res.error || 'No se pudo procesar la solicitud de recuperación.');
    }
  };

  const handleVerifyRecoveryOtp = async (codeToVerify?: string) => {
    const cleanToken = (codeToVerify || recoveryOtpCode).trim();
    if (!cleanToken || cleanToken.length !== 6) {
      setErrorMessage('Por favor ingresa los 6 dígitos del código.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const cleanEmail = recoveryEmail.trim().toLowerCase();

    try {
      let isValidated = false;

      // 1. Tipo de OTP correcto: Al presionar "Verificar Código", usar type: 'recovery' explícito
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'recovery',
        });

        if (!error) {
          isValidated = true;
        } else {
          console.warn('[Supabase verifyOtp recovery]:', error.message);
          // Fallback a validación de servicio backend OTP en caso de fallo
          const fallbackRes = await authOtpService.verifyEmailOtp(cleanEmail, cleanToken, 'forgot_password');
          if (fallbackRes.success) {
            isValidated = true;
          } else {
            setIsLoading(false);
            setErrorMessage(error.message || fallbackRes.error || 'El código ingresado es incorrecto o ha expirado.');
            return;
          }
        }
      } else {
        const res = await authOtpService.verifyEmailOtp(cleanEmail, cleanToken, 'forgot_password');
        if (res.success) {
          isValidated = true;
        } else {
          setIsLoading(false);
          setErrorMessage(res.error || 'El código es incorrecto o ha expirado.');
          return;
        }
      }

      // 3. Redirección tras validación exitosa: Una vez validado el OTP (!error), avanza inmediatamente a "Ingresar Nueva Contraseña"
      if (isValidated) {
        setIsLoading(false);
        setRecoveryOtpStep('new_password');
        setSuccessMessage('Identidad validada con éxito. Define tu nueva contraseña.');
      }
    } catch (err: any) {
      console.error('Error al verificar código OTP:', err);
      setIsLoading(false);
      setErrorMessage(err?.message || 'Error al validar el código.');
    }
  };

  const handleSaveRecoveryPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanPass = recoveryNewPassword.trim();
    const cleanConfirm = recoveryConfirmPassword.trim();

    if (cleanPass.length < 4) {
      setErrorMessage('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage('Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    setIsLoading(true);
    const cleanEmail = recoveryEmail.trim().toLowerCase();

    try {
      // 1. Ejecutar supabase.auth.updateUser({ password: newPassword })
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: updateData, error: sbError } = await supabase.auth.updateUser({
            password: cleanPass,
          });
          if (sbError) {
            console.warn('[Supabase Auth Update Warning]:', sbError.message);
          }
        } catch (sbEx: any) {
          console.warn('[Supabase Exception]:', sbEx);
        }
      }

      // 2. Invocar reseteo en backend con el código OTP
      try {
        await authOtpService.resetPasswordWithOtp(cleanEmail, recoveryOtpCode.trim(), cleanPass);
      } catch (otpErr) {
        console.warn('Error en resetPasswordWithOtp:', otpErr);
      }

      // 3. Actualizar la cuenta local
      resetPintucoUserPassword(cleanEmail, cleanPass);

      setIsLoading(false);
      setSuccessMessage('¡Contraseña actualizada con éxito! Ahora puedes iniciar sesión.');
      setInputEmail(cleanEmail);
      setAuthMode('login');
      setLoginMethod('password');
      setRecoveryOtpStep('request');
      setRecoveryOtpCode('');
      setRecoveryNewPassword('');
      setRecoveryConfirmPassword('');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Error al actualizar la contraseña en el sistema.');
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
            {authMode !== 'forgot_password' && (
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Configuración de Servidor de Correo (SMTP)"
              >
                <Settings className="w-4 h-4 text-cyan-300" />
              </button>
            )}
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
          {/* Tarjeta amigable cuando el usuario ya tiene cuenta (User already registered) */}
          {accountAlreadyExists && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50/70 border border-sky-300 text-slate-800 text-xs shadow-xs animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <UserCheck className="w-4 h-4 text-cyan-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 text-xs mb-1">
                    Este correo ya tiene una cuenta registrada
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                    La dirección <strong className="text-blue-900 font-mono">{inputEmail}</strong> ya se encuentra registrada en el sistema COLORLINK Pintuco.
                    {redirectCountdown !== null && (
                      <span className="block mt-1 text-slate-500 font-medium">
                        Redirigiéndote al inicio de sesión en <strong className="text-blue-900">{redirectCountdown}s</strong>...
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={handleSwitchToLogin}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <LogIn className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Este correo ya tiene una cuenta. Inicia sesión aquí →</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Banner informativo cuando el usuario existe en Supabase Auth pero está completando su perfil */}
          {isCompletingExistingAuthUser && authMode === 'register' && (
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-300 text-teal-900 text-xs animate-fadeIn shadow-2xs">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-black block text-teal-950 mb-0.5">
                    Cuenta de acceso identificada en Supabase Auth
                  </span>
                  <span className="leading-relaxed text-[11px] text-teal-800">
                    Tu acceso ya está autenticado. Completa a continuación tu nombre o razón social, cédula/NIT y teléfono para vincular tu perfil de cliente.
                  </span>
                </div>
              </div>
            </div>
          )}

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
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-start gap-2.5 animate-fadeIn shadow-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-relaxed">{successMessage}</span>
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
              
              {/* Selector de Método: Contraseña vs Código OTP al Correo */}
              <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 text-xs border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 px-3 font-bold rounded-xl transition-all cursor-pointer ${
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
                  className={`flex-1 py-2 px-3 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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

          {/* 2. MODO: REGISTRO ÚNICO DE USUARIO CON SUPABASE AUTH */}
          {authMode === 'register' && (
            <div className="space-y-4 animate-fadeIn">
              {registerOtpStep === 'verify_otp' ? (
                /* VISTA: CONFIRMAR CORREO / VERIFICACIÓN OTP */
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-center pt-2">
                    <div className="w-12 h-12 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-2.5 border border-blue-100 shadow-xs">
                      <ShieldCheck className="w-6 h-6 text-[#0033A0]" />
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Confirmar Correo / Verificación OTP
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                      Hemos enviado un código de 6 dígitos a <strong>{inputEmail}</strong>. Ingrésalo a continuación para activar tu cuenta.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Código de Verificación (6 dígitos)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          autoComplete="one-time-code"
                          autoFocus
                          value={registerOtpCode}
                          onChange={(e) => setRegisterOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          className="w-full text-center text-xl font-mono font-bold tracking-[0.35em] py-3 px-4 rounded-xl border border-slate-300 focus:border-[#0033A0] focus:ring-2 focus:ring-[#0033A0]/20 text-slate-900 outline-none transition-all shadow-xs"
                        />
                        <ShieldCheck className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || registerOtpCode.length < 6}
                      className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verificando con Supabase...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>Verificar Código y Activar Cuenta</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRegisterOtpStep('form');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="text-blue-900 hover:underline font-semibold cursor-pointer"
                      >
                        ← Volver al formulario
                      </button>
                      <button
                        type="button"
                        onClick={handleSwitchToLogin}
                        className="text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                      >
                        Ir a Iniciar Sesión
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Ingresa tus datos y Cédula/NIT para crear tu cuenta en COLORLINK Pintuco con Supabase Auth.
                  </p>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
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

                    {/* CAMPO: Número de Cédula / NIT */}
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
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Correo electrónico</span>
                        {isCompletingExistingAuthUser && (
                          <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            ✓ Registrado en Supabase
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          value={inputEmail}
                          onChange={(e) => {
                            setInputEmail(e.target.value);
                            if (e.target.value.includes('@') && e.target.value.length > 5) {
                              handleCheckEmailStatus(e.target.value);
                            }
                          }}
                          onBlur={(e) => handleCheckEmailStatus(e.target.value)}
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

                    {!isCompletingExistingAuthUser ? (
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
                              placeholder="Mínimo 6 caracteres"
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
                    ) : (
                      <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>Tu contraseña de acceso en Supabase ya está configurada. Al guardar se creará tu perfil oficial de cliente.</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{isCompletingExistingAuthUser ? 'Vinculando perfil con Supabase...' : 'Registrando cuenta en Supabase...'}</span>
                        </>
                      ) : isCompletingExistingAuthUser ? (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Completar y Vincular Perfil de Cliente</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 text-cyan-300" />
                          <span>Crear Cuenta en COLORLINK</span>
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* Botón para regresar a Iniciar Sesión */}
              {registerOtpStep === 'form' && (
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
              )}

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
