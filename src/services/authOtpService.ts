export interface SendOtpResult {
  success: boolean;
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

      // Si falló el envío de correo pero el servidor generó el OTP de evaluación
      if (serverData?.devOtp) {
        return {
          success: false,
          deliveryFailed: true,
          error: serverData.error || 'Fallo en la entrega del correo.',
          message: serverData.message,
          devOtp: serverData.devOtp,
          provider: serverData.provider,
          statusCode: response.status,
          rawError: serverData.rawError,
          expiresInSeconds: serverData.expiresInSeconds || 600,
        };
      }

      const errorMsg = serverData?.error || 'No se pudo generar o enviar el código de verificación al correo.';
      console.error('❌ [AUTH OTP SERVICE] Error en envío:', errorMsg, serverData);

      return {
        success: false,
        error: errorMsg,
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
      };
    }
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
};
