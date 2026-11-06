export interface SendOtpResult {
  success: boolean;
  notFound?: boolean;
  message?: string;
  error?: string;
  devOtp?: string;
  deliveryFailed?: boolean;
  provider?: string;
  expiresInSeconds?: number;
  statusCode?: number;
  rawError?: any;
}

export interface VerifyOtpResult {
  success: boolean;
  message?: string;
  error?: string;
  user?: any;
}

export interface ResetPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface EmailStatusResult {
  success: boolean;
  isConfigured: boolean;
  activeProvider: 'smtp' | 'sendgrid' | 'none';
  details?: {
    smtpHost?: string | null;
    smtpPort?: number | null;
    smtpUser?: string | null;
    smtpSecure?: boolean | null;
    emailFrom?: string | null;
  };
  instructions?: {
    smtp: string;
  };
}

/**
 * Servicio unificado para autenticación OTP y recuperación de contraseñas.
 * Conexión autoritativa con el backend para generación criptográfica,
 * control de intentos y entrega real mediante Brevo SMTP.
 */
export const authOtpService = {
  /**
   * Solicitar envío de código OTP de 6 dígitos al correo electrónico del usuario.
   */
  async sendEmailOtp(
    email: string,
    purpose: 'login' | 'register' | 'forgot_password' = 'login',
    userData?: { nombre?: string; telefono?: string; cedula?: string }
  ): Promise<SendOtpResult> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Por favor ingresa un correo electrónico válido.' };
    }

    try {
      const response = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          purpose,
          userData,
        }),
      });

      const serverData = await response.json().catch(() => null);

      if (serverData?.devOtp) {
        console.log('%c 🔑 CÓDIGO OTP DEV: ' + serverData.devOtp, 'color: #00f2fe; font-size: 18px; font-weight: bold;');
      }

      if (response.ok && serverData?.success) {
        return {
          success: true,
          message: serverData.message || `Código de seguridad enviado a ${cleanEmail}.`,
          devOtp: serverData.devOtp,
          provider: serverData.provider,
          statusCode: response.status,
          expiresInSeconds: serverData.expiresInSeconds || 600,
        };
      }

      // Si el correo no existe en la base de datos (404), retornar notFound inmediatamente
      if (serverData?.notFound || response.status === 404) {
        return {
          success: false,
          notFound: true,
          error: serverData?.message || serverData?.error || 'El correo ingresado no se encuentra registrado en el sistema.',
          message: serverData?.message || serverData?.error || 'El correo ingresado no se encuentra registrado en el sistema.',
          statusCode: 404,
        };
      }

      // Si falló el envío de correo pero el servidor generó el OTP de evaluación (solo si el correo existe)
      if (serverData?.devOtp) {
        return {
          success: false,
          deliveryFailed: true,
          error: serverData.message || serverData.error || 'Fallo en la entrega del correo.',
          message: serverData.message || serverData.error,
          devOtp: serverData.devOtp,
          provider: serverData.provider,
          statusCode: response.status,
          rawError: serverData.rawError,
          expiresInSeconds: serverData.expiresInSeconds || 600,
        };
      }

      const errorMsg = serverData?.message || serverData?.error || 'No se pudo generar o enviar el código de verificación al correo.';
      console.error('❌ [AUTH OTP SERVICE] Respuesta de servicio:', errorMsg, serverData);

      return {
        success: false,
        error: errorMsg,
        message: errorMsg,
        devOtp: serverData?.devOtp,
        provider: serverData?.provider,
        statusCode: serverData?.statusCode || response.status,
        rawError: serverData?.rawError,
      };
    } catch (netErr: any) {
      console.error('❌ [AUTH OTP SERVICE] Excepción inesperada en envío de correo:', netErr);
      return {
        success: false,
        error: 'No se pudo conectar con el servidor de autenticación. Verifica tu conexión.',
        message: 'No se pudo conectar con el servidor de autenticación. Verifica tu conexión.',
      };
    }
  },

  /**
   * Solicitar recuperación de contraseña mediante Supabase Auth directamente (sin SMTP manual)
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; notFound?: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Por favor ingresa un correo electrónico válido.' };
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await response.json().catch(() => null);

      if (data?.success) {
        return {
          success: true,
          message: data.message || 'Se ha enviado un correo con instrucciones para restablecer tu contraseña.',
        };
      }

      return {
        success: false,
        notFound: Boolean(data?.notFound),
        message: data?.message || data?.error || 'No se pudo procesar la solicitud de recuperación.',
      };
    } catch (err: any) {
      console.error('[AUTH OTP SERVICE] Error en requestPasswordReset:', err);
      return {
        success: false,
        message: err?.message || 'Error de conexión al solicitar restablecimiento de contraseña.',
      };
    }
  },

  /**
   * Consulta previa para verificar si un correo electrónico se encuentra registrado en el sistema
   */
  async checkUserExists(email: string): Promise<{ exists: boolean; user?: any; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { exists: false, error: 'Por favor ingresa un correo electrónico válido.' };
    }

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          exists: Boolean(data?.exists),
          user: data?.user,
        };
      }
    } catch (err) {
      console.warn('[AUTH OTP SERVICE] Error consultando existencia de usuario en servidor:', err);
    }

    return { exists: false };
  },

  /**
   * Verificar código OTP de 6 dígitos ingresado por el usuario.
   * El servidor valida hash SHA-256, expiración de 10 minutos y límite de 3 intentos.
   */
  async verifyEmailOtp(
    email: string,
    token: string,
    purpose: 'login' | 'register' | 'forgot_password' = 'login'
  ): Promise<VerifyOtpResult> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim().replace(/\D/g, '');

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Correo electrónico inválido.' };
    }

    if (!cleanToken || cleanToken.length !== 6) {
      return { success: false, error: 'Por favor ingresa los 6 dígitos del código de seguridad.' };
    }

    try {
      const response = await fetch('/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanToken,
          purpose,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        return {
          success: true,
          message: data.message || 'Código verificado exitosamente.',
          user: data.user,
        };
      }

      return {
        success: false,
        error: data?.error || 'El código ingresado es incorrecto o ha expirado.',
      };
    } catch (netErr: any) {
      return {
        success: false,
        error: 'Error al conectar con el servidor para validar el código.',
      };
    }
  },

  /**
   * Restablecer la contraseña una vez verificado el OTP.
   */
  async resetPasswordWithOtp(
    email: string,
    token: string,
    newPassword: string
  ): Promise<ResetPasswordResult> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim().replace(/\D/g, '');

    if (!cleanEmail || !newPassword) {
      return { success: false, error: 'Todos los datos son requeridos para actualizar la contraseña.' };
    }

    if (newPassword.length < 4) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }

    try {
      const response = await fetch('/api/auth/reset-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanToken,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        return {
          success: true,
          message: data.message || 'Tu contraseña ha sido restablecida exitosamente.',
        };
      }

      return {
        success: false,
        error: data?.error || 'No se pudo actualizar la contraseña.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'Error al conectar con el servidor para restablecer la contraseña.',
      };
    }
  },

  /**
   * Consultar estado del proveedor de correo configurado en el servidor.
   */
  async getEmailStatus(): Promise<EmailStatusResult> {
    try {
      const res = await fetch('/api/auth/email-status');
      if (res.ok) {
        return await res.json();
      }
      return { success: false, isConfigured: false, activeProvider: 'none' };
    } catch (err) {
      return { success: false, isConfigured: false, activeProvider: 'none' };
    }
  },

  /**
   * Configurar proveedor de correo en tiempo de ejecución.
   */
  async configureEmail(payload: {
    provider: 'smtp';
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpSecure?: boolean;
    emailFrom?: string;
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/configure-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        return { success: true, message: data.message };
      }
      return { success: false, error: data?.error || 'Error al guardar configuración.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión.' };
    }
  },

  /**
   * Enviar un correo de prueba para verificar entrega a un buzón real.
   */
  async testEmail(email: string): Promise<{ success: boolean; message?: string; error?: string; provider?: string }> {
    try {
      const res = await fetch('/api/auth/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        return { success: true, message: data.message, provider: data.provider };
      }
      return { success: false, error: data?.error || 'Error al enviar correo de prueba.', provider: data?.provider };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error de conexión.' };
    }
  },

  /**
   * Obtener lista de correos transaccionales generados recientemente en el servidor.
   */
  async getRecentEmails(): Promise<Array<{
    id: string;
    to: string;
    subject: string;
    previewText: string;
    sentAt: string;
    otp?: string;
    provider: string;
    isRealDelivery: boolean;
  }>> {
    try {
      const res = await fetch('/api/email/recent');
      if (res.ok) {
        const data = await res.json();
        return data.emails || [];
      }
      return [];
    } catch {
      return [];
    }
  },
};
