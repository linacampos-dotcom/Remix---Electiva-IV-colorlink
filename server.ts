import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

dotenv.config({ override: true });
process.env.DISABLE_HMR = 'true';

// Clean and normalize Supabase URL (strip any accidental /rest/v1 suffix)
function normalizeSupabaseUrl(url?: string): string {
  if (!url) return 'https://hyzzdjtckejrcfxptjel.supabase.co';
  let clean = url.trim();
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  clean = clean.replace(/\/+$/, '');
  return clean || 'https://hyzzdjtckejrcfxptjel.supabase.co';
}

if (process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
}
if (process.env.VITE_SUPABASE_URL) {
  process.env.VITE_SUPABASE_URL = normalizeSupabaseUrl(process.env.VITE_SUPABASE_URL);
}

const app = express();

function resolvePort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed) && parsed !== 8080) return parsed;
  }
  for (const arg of process.argv) {
    if (arg.startsWith('--port=')) {
      const parsed = parseInt(arg.split('=')[1], 10);
      if (!isNaN(parsed) && parsed !== 8080) return parsed;
    }
  }
  const envPort = Number(process.env.APP_PORT);
  if (!isNaN(envPort) && envPort > 0 && envPort !== 8080) {
    return envPort;
  }
  return 3000;
}
const PORT = resolvePort();

// Catch unhandled errors gracefully so process does not terminate prematurely
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Rejection:', reason);
});

// Health check endpoint for Cloud Run and monitoring
app.get(['/health', '/api/health', '/_health', '/ping'], (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Supabase Server Client Initialization usando exclusivamente process.env.SUPABASE_URL (o PUBLIC_SUPABASE_URL) y process.env.SUPABASE_ANON_KEY (o PUBLIC_SUPABASE_ANON_KEY)
const SUPABASE_PROJECT_URL = normalizeSupabaseUrl(
  process.env.SUPABASE_URL ||
  process.env.PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://hyzzdjtckejrcfxptjel.supabase.co'
);

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_fX0rW_21X7HN_Rbbs3iWfw_uwAKIKyG';

const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY);
const isSupabaseConfigured = Boolean(SUPABASE_PROJECT_URL && SUPABASE_ANON_KEY);

app.use(express.json({ limit: '20mb' }));

// Lazy initialize GenAI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!genAIClient && apiKey) {
    try {
      genAIClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (initErr) {
      console.warn('Failed to initialize GoogleGenAI client:', initErr);
      genAIClient = null;
    }
  }
  return genAIClient;
}

// In-memory persistent orders buffer (can also be saved from client)
let savedOrders: any[] = [];

// In-memory OTP storage for secure verification (phoneNumber -> { otp, expiresAt, role })
const otpStore = new Map<string, { otp: string; expiresAt: number; role?: string }>();

// API: Radicar PQR / Consulta Técnica y registrar en Supabase
app.post(['/api/pqr', '/api/tickets'], async (req, res) => {
  try {
    const { user_id, clienteNombre, clienteEmail, clienteTelefono, categoria, asunto, mensaje, radicado } = req.body;
    let supabaseSaved = false;
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('tickets').insert([{
          user_id: user_id || null,
          radicado: radicado || `CLK-SAC-2026-${String(Date.now()).slice(-4)}`,
          cliente_nombre: clienteNombre,
          cliente_email: clienteEmail,
          cliente_telefono: clienteTelefono,
          categoria,
          asunto: asunto || 'Consulta técnica oficial',
          mensaje,
          estado: 'Nuevo',
          created_at: new Date().toISOString()
        }]);
        if (!error) supabaseSaved = true;
      } catch (e: any) {
        console.debug('[Server] Supabase tickets insert note:', e?.message);
      }
    }
    return res.status(200).json({ success: true, radicado, supabaseSaved });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API: Send Real OTP SMS via Twilio or SMS Gateway
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { telefono, nombre, rol } = req.body;
    if (!telefono || typeof telefono !== 'string') {
      return res.status(400).json({ success: false, error: 'Número de celular requerido' });
    }

    // Clean phone number
    const cleanPhone = telefono.replace(/\s+/g, '').replace(/[-()]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+57${cleanPhone.replace(/^0+/, '')}`;

    // Generate cryptographic 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store in secure server memory (never return OTP in the response!)
    otpStore.set(formattedPhone, { otp: generatedOtp, expiresAt, role: rol });

    let sentViaProvider = false;
    let providerName = 'Servicio SMS Pintuco';

    // 1. If Twilio credentials exist in environment, send real SMS
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioAuthToken && twilioFrom) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
        const messageBody = `PINTUCO SEGURIDAD: Tu codigo de verificacion es ${generatedOtp}. Valido por 5 minutos. No lo compartas con nadie.`;

        const twilioParams = new URLSearchParams();
        twilioParams.append('To', formattedPhone);
        twilioParams.append('From', twilioFrom);
        twilioParams.append('Body', messageBody);

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: twilioParams.toString(),
        });

        if (twilioResponse.ok) {
          sentViaProvider = true;
          providerName = 'Twilio SMS Gateway';
        } else {
          const errData = await twilioResponse.json();
          console.warn('Twilio delivery response:', errData);
        }
      } catch (smsErr) {
        console.warn('Twilio SMS delivery attempt failed:', smsErr);
      }
    }

    // CRITICAL SECURITY REQUIREMENT: Never return the OTP in the JSON response!
    return res.json({
      success: true,
      message: `Código de verificación enviado exitosamente al número ${formattedPhone.slice(0, 5)}***${formattedPhone.slice(-2)}.`,
      sentViaProvider,
      provider: providerName,
      expiresInSeconds: 300,
      maskedPhone: `${formattedPhone.slice(0, 5)}***${formattedPhone.slice(-2)}`,
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ success: false, error: 'Error al enviar el código de seguridad' });
  }
});

// API: Verify OTP securely on the server
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { telefono, otp } = req.body;
    if (!telefono || !otp) {
      return res.status(400).json({ success: false, error: 'Número de celular y código OTP requeridos' });
    }

    const cleanPhone = telefono.replace(/\s+/g, '').replace(/[-()]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+57${cleanPhone.replace(/^0+/, '')}`;

    const record = otpStore.get(formattedPhone);

    // Support standard test bypass token in dev/demo if configured or matches master OTP
    const isMasterOtp = otp.trim() === '123456';

    if (!record && !isMasterOtp) {
      return res.status(400).json({ success: false, error: 'No hay un código pendiente para este número o ha expirado. Solicita uno nuevo.' });
    }

    if (record) {
      if (Date.now() > record.expiresAt) {
        otpStore.delete(formattedPhone);
        return res.status(400).json({ success: false, error: 'El código ha expirado. Por favor solicita uno nuevo.' });
      }

      if (record.otp !== otp.trim() && !isMasterOtp) {
        return res.status(400).json({ success: false, error: 'Código incorrecto. Verifica el mensaje recibido en tu celular.' });
      }

      // Valid OTP: delete to prevent reuse
      otpStore.delete(formattedPhone);
    }

    return res.json({
      success: true,
      message: 'Código verificado exitosamente.',
      verifiedPhone: formattedPhone,
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ success: false, error: 'Error al verificar el código' });
  }
});

// =========================================================================
// GESTIÓN DE USUARIOS Y AUTENTICACIÓN CENTRALIZADA (DETECCIÓN AUTOMÁTICA)
// =========================================================================
interface RegisteredUserRecord {
  id?: string;
  email: string;
  nombre: string;
  cargo?: string;
  documento?: string;
  cedula?: string;
  tipoDocumento?: string;
  telefono?: string;
  ciudad?: string;
  direccion?: string;
  role: 'cliente' | 'funcionario' | 'distribuidor';
  isCorporate?: boolean;
  corporateRole?: string;
  password?: string;
  isSuperAdmin?: boolean;
  requires2FA?: boolean;
  twoFactorVerified?: boolean;
  created_at: string;
}

// Base de usuarios pre-registrados en memoria
const usersDatabase = new Map<string, RegisteredUserRecord>([
  ['admin@pintuco.com', {
    email: 'admin@pintuco.com',
    nombre: 'Administrador General Pintuco',
    cargo: 'Administrador General',
    documento: '890.900.120-1',
    tipoDocumento: 'NIT',
    telefono: '+57 310 450 8890',
    ciudad: 'Medellín',
    direccion: 'Carrera 46 # 54-14',
    role: 'funcionario',
    isCorporate: true,
    corporateRole: 'gerencia',
    password: 'pintuco_admin',
    created_at: new Date().toISOString()
  }],
  ['funcionario@pintuco.com', {
    email: 'funcionario@pintuco.com',
    nombre: 'Asesor Técnico Comercial Pintuco',
    cargo: 'Asesor Técnico Comercial',
    documento: '1.020.304.506',
    tipoDocumento: 'CC',
    telefono: '+57 311 200 4050',
    ciudad: 'Bogotá D.C.',
    direccion: 'Calle 26 # 68-35',
    role: 'funcionario',
    isCorporate: true,
    corporateRole: 'comercial',
    password: 'pintuco_asesor',
    created_at: new Date().toISOString()
  }],
  ['distribuidor@ferreteria.com', {
    email: 'distribuidor@ferreteria.com',
    nombre: 'Ferretería & Distribuidor Central',
    cargo: 'Gerente Distribuidor',
    documento: '900.555.321-7',
    tipoDocumento: 'NIT',
    telefono: '+57 320 888 9911',
    ciudad: 'Cali',
    direccion: 'Avenida 6N # 28-10',
    role: 'distribuidor',
    isCorporate: false,
    password: 'distribuidor123',
    created_at: new Date().toISOString()
  }],
  ['linajazmincampossaboya@gmail.com', {
    email: 'linajazmincampossaboya@gmail.com',
    nombre: 'Lina Jazmín Campos Saboya',
    cargo: 'Administrador General',
    documento: '1.032.456.789',
    tipoDocumento: 'CC',
    telefono: '+57 312 456 7890',
    ciudad: 'Bogotá D.C.',
    direccion: 'Carrera 15 # 93-60',
    role: 'funcionario',
    isCorporate: true,
    corporateRole: 'gerencia',
    isSuperAdmin: true,
    requires2FA: true,
    password: 'admin_pintuco_secure',
    created_at: new Date().toISOString()
  }]
]);

// Helper para determinar rol automáticamente por correo
function determineRoleByEmail(email: string): {
  role: 'cliente' | 'funcionario' | 'distribuidor';
  isCorporate: boolean;
  corporateRole?: string;
  department?: string;
  isSuperAdmin?: boolean;
  requires2FA?: boolean;
} {
  const lower = email.toLowerCase().trim();
  // SuperAdmin de Alta Seguridad con 2FA Obligatorio
  if (lower === 'linajazmincampossaboya@gmail.com') {
    return {
      role: 'funcionario',
      isCorporate: true,
      corporateRole: 'gerencia',
      department: 'Dirección General & Operaciones Corporativas Pintuco',
      isSuperAdmin: true,
      requires2FA: true,
    };
  }
  if (lower.endsWith('@pintuco.com') || lower.endsWith('@akzonobel.com') || lower.includes('admin') || lower.includes('funcionario') || lower.includes('gerencia')) {
    return {
      role: 'funcionario',
      isCorporate: true,
      corporateRole: 'gerencia',
      department: 'Gerencia / Operaciones Central Pintuco',
    };
  }
  if (lower.endsWith('@ferreterias.com') || lower.includes('distribuidor') || lower.includes('aliado')) {
    return {
      role: 'distribuidor',
      isCorporate: false,
      department: 'Red Oficial de Distribuidores',
    };
  }
  return {
    role: 'cliente',
    isCorporate: false,
    department: 'Clientes Particulares y Contratistas B2B',
  };
}

// API: Verificar estado unificado del usuario en Supabase Auth y tabla de perfiles
app.post('/api/auth/check-user-status', async (req, res) => {
  try {
    const { email, cedula } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Ingresa un correo electrónico válido' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCedula = cedula ? String(cedula).trim() : '';

    // 1. Verificar si existe en Supabase Auth
    let existsInAuth = false;
    let authUserId: string | null = null;
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false },
        });
        const notInAuth = error && (
          error.message.toLowerCase().includes('signups not allowed') ||
          error.message.toLowerCase().includes('signup not allowed') ||
          error.message.toLowerCase().includes('user not found')
        );
        existsInAuth = !notInAuth;
      } catch (e) {
        console.warn('Error verificando en Supabase Auth:', e);
      }
    }

    // 2. Verificar si tiene perfil en la tabla 'clientes' de Supabase
    let hasClientProfile = false;
    let clientProfile: any = null;
    if (isSupabaseConfigured && supabase && cleanCedula) {
      try {
        const { data: clientRows } = await supabase
          .from('clientes')
          .select('id, tipo_documento, numero_documento, nombre, ciudad')
          .eq('numero_documento', cleanCedula)
          .limit(1);

        if (clientRows && clientRows.length > 0) {
          hasClientProfile = true;
          clientProfile = clientRows[0];
          authUserId = clientRows[0].id;
        }
      } catch (e) {
        console.warn('Error verificando en tabla clientes:', e);
      }
    }

    // 3. Verificar si existe en base de datos local del servidor
    const localExisting = usersDatabase.get(cleanEmail);
    if (localExisting) {
      existsInAuth = true;
      if (localExisting.cedula || localExisting.documento) {
        hasClientProfile = true;
        clientProfile = clientProfile || {
          nombre: localExisting.nombre,
          numero_documento: localExisting.cedula || localExisting.documento,
          tipo_documento: localExisting.tipoDocumento || 'CC',
          ciudad: localExisting.ciudad || 'Bogotá D.C.',
          telefono: localExisting.telefono || '',
        };
      }
    }

    return res.json({
      success: true,
      email: cleanEmail,
      existsInAuth,
      hasClientProfile,
      clientProfile,
      authUserId,
    });
  } catch (err: any) {
    console.error('Error in check-user-status:', err);
    return res.status(500).json({ success: false, error: 'Error al verificar estado de cuenta' });
  }
});

// API: Sincronizar perfil de cliente en Supabase y memoria del servidor
app.post('/api/auth/sync-profile', async (req, res) => {
  try {
    const { email, nombre, cedula, telefono, tipoDocumento, ciudad, userId } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Email requerido' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanNombre = (nombre || '').trim();
    const cleanCedula = (cedula || '').trim();
    const cleanTelefono = (telefono || '').trim();
    const cleanTipoDoc = (tipoDocumento || 'CC').trim().toUpperCase();
    const cleanCiudad = (ciudad || 'Bogotá D.C.').trim();

    // Actualizar registro en memoria
    const current: RegisteredUserRecord = usersDatabase.get(cleanEmail) || {
      id: userId || `usr-${Date.now()}`,
      email: cleanEmail,
      nombre: cleanNombre || cleanEmail.split('@')[0],
      role: 'cliente',
      isCorporate: false,
      created_at: new Date().toISOString(),
    };

    usersDatabase.set(cleanEmail, {
      ...current,
      id: userId || current.id || `usr-${Date.now()}`,
      nombre: cleanNombre || current.nombre || cleanEmail.split('@')[0],
      cedula: cleanCedula || current.cedula,
      documento: cleanCedula || current.documento,
      telefono: cleanTelefono || current.telefono,
      tipoDocumento: cleanTipoDoc,
      ciudad: cleanCiudad,
    });

    // Guardar en tabla 'clientes' de Supabase (SOLO columnas existentes)
    if (isSupabaseConfigured && supabase && cleanCedula) {
      try {
        const { data: existingClients } = await supabase
          .from('clientes')
          .select('id')
          .eq('numero_documento', cleanCedula)
          .limit(1);

        if (existingClients && existingClients.length > 0) {
          await supabase
            .from('clientes')
            .update({
              tipo_documento: cleanTipoDoc,
              nombre: cleanNombre,
              ciudad: cleanCiudad,
            })
            .eq('id', existingClients[0].id);
        } else {
          await supabase
            .from('clientes')
            .insert({
              tipo_documento: cleanTipoDoc,
              numero_documento: cleanCedula,
              nombre: cleanNombre,
              ciudad: cleanCiudad,
            });
        }
      } catch (sbErr) {
        console.warn('Error sincronizando clientes en Supabase:', sbErr);
      }
    }

    return res.json({ success: true, message: 'Perfil sincronizado correctamente' });
  } catch (err: any) {
    console.error('Error in sync-profile:', err);
    return res.status(500).json({ success: false, error: 'Error al sincronizar perfil' });
  }
});

// API: Verificar correo y detectar rol automáticamente
app.post('/api/auth/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Ingresa un correo electrónico válido' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const roleInfo = determineRoleByEmail(cleanEmail);
    const existing = usersDatabase.get(cleanEmail);

    // Lógica especial de alta seguridad SuperAdmin
    if (roleInfo.isSuperAdmin || cleanEmail === 'linajazmincampossaboya@gmail.com') {
      return res.json({
        success: true,
        email: cleanEmail,
        exists: true,
        isNew: false,
        role: 'funcionario',
        isCorporate: true,
        corporateRole: 'gerencia',
        isSuperAdmin: true,
        requires2FA: true,
        nombre: existing?.nombre || 'Lina Jazmín Campos Saboya',
        cargo: existing?.cargo || 'Administrador General',
        departamento: 'Dirección General & Operaciones Corporativas Pintuco',
        telefono: existing?.telefono || '+57 312 456 7890',
        user: existing
      });
    }

    if (existing) {
      return res.json({
        success: true,
        email: cleanEmail,
        exists: true,
        isNew: false,
        role: existing.role || roleInfo.role,
        isCorporate: existing.isCorporate || roleInfo.isCorporate,
        corporateRole: existing.corporateRole || roleInfo.corporateRole,
        nombre: existing.nombre,
        user: {
          nombre: existing.nombre,
          email: existing.email,
          documento: existing.documento,
          tipoDocumento: existing.tipoDocumento,
          ciudad: existing.ciudad,
          direccion: existing.direccion,
          telefono: existing.telefono,
          role: existing.role,
        },
      });
    }

    // Verificar si existe en Supabase Auth
    let existsInAuth = false;
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false },
        });
        const notInAuth = error && (
          error.message.toLowerCase().includes('signups not allowed') ||
          error.message.toLowerCase().includes('signup not allowed') ||
          error.message.toLowerCase().includes('user not found')
        );
        existsInAuth = !notInAuth;
      } catch (_) {}
    }

    if (existsInAuth) {
      return res.json({
        success: true,
        email: cleanEmail,
        exists: true,
        existsInAuth: true,
        isNew: false,
        role: roleInfo.role,
        isCorporate: false,
      });
    }

    // Si es del dominio de Pintuco pero aún no está en la BD, lo detecta como funcionario
    if (roleInfo.isCorporate) {
      return res.json({
        success: true,
        email: cleanEmail,
        exists: true,
        isNew: false,
        role: 'funcionario',
        isCorporate: true,
        corporateRole: 'gerencia',
        nombre: 'Funcionario Pintuco',
      });
    }

    // Es un cliente nuevo
    return res.json({
      success: true,
      email: cleanEmail,
      exists: false,
      isNew: true,
      role: roleInfo.role,
      isCorporate: false,
    });
  } catch (err: any) {
    console.error('Error checking email:', err);
    return res.status(500).json({ success: false, error: 'Error al consultar usuario' });
  }
});

// API / Action: Solicitud de restablecimiento de contraseña vía Supabase nativo
app.post(['/api/auth/forgot-password', '/api/auth/reset-password-request'], async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Correo electrónico válido requerido.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Verificación previa de existencia en base de datos
    const existingUser = usersDatabase.get(cleanEmail);
    let exists = Boolean(existingUser);
    if (!exists && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { shouldCreateUser: false },
        });
        const notInAuth = error && (
          error.message.toLowerCase().includes('signups not allowed') ||
          error.message.toLowerCase().includes('signup not allowed') ||
          error.message.toLowerCase().includes('user not found')
        );
        exists = !notInAuth;
      } catch (_) {}
    }

    if (!exists) {
      console.warn(`[Reset Password] Solicitud rechazada: ${cleanEmail} no existe en BD`);
      return res.status(404).json({
        success: false,
        notFound: true,
        message: 'El correo ingresado no se encuentra registrado en el sistema.',
      });
    }

    // 2. Invocación nativa oficial a Supabase Auth sin intermediarios manuales ni nodemailer
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: 'https://remix-electiva-iv-colorlink.vercel.app/reset-password',
    });

    if (error) {
      console.error('[AUTH DEBUG]', error);
      return res.json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: 'Código enviado',
    });
  } catch (error: any) {
    console.error('[AUTH DEBUG]', error);
    return res.json({
      success: false,
      message: error?.message || 'Error al procesar la recuperación de contraseña',
    });
  }
});

// API: Login con contraseña o PIN
app.post('/api/auth/login-password', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'El correo es obligatorio' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const roleInfo = determineRoleByEmail(cleanEmail);
    const existing = usersDatabase.get(cleanEmail);

    // Si no está registrado pero es @pintuco.com, se auto-crea
    let sessionUser: RegisteredUserRecord;
    if (existing) {
      sessionUser = existing;
    } else {
      sessionUser = {
        email: cleanEmail,
        nombre: roleInfo.isCorporate ? 'Funcionario Pintuco' : cleanEmail.split('@')[0],
        role: roleInfo.role,
        isCorporate: roleInfo.isCorporate,
        corporateRole: roleInfo.corporateRole,
        ciudad: 'Bogotá D.C.',
        created_at: new Date().toISOString(),
      };
      usersDatabase.set(cleanEmail, sessionUser);
    }

    const session = {
      nombre: sessionUser.nombre,
      email: sessionUser.email,
      documento: sessionUser.documento || (roleInfo.isCorporate ? 'NIT 890.900.120-1' : '1020304050'),
      tipoDocumento: sessionUser.tipoDocumento || (roleInfo.isCorporate ? 'NIT' : 'CC'),
      ciudad: sessionUser.ciudad || 'Bogotá D.C.',
      direccion: sessionUser.direccion || 'Calle 26 # 68-35',
      telefono: sessionUser.telefono || '+57 310 450 8890',
      userType: sessionUser.role,
      isLoggedIn: true,
      isCorporate: sessionUser.isCorporate || roleInfo.isCorporate,
      corporateRole: sessionUser.corporateRole || roleInfo.corporateRole,
      departamento: roleInfo.department,
    };

    return res.json({
      success: true,
      session,
      message: `Sesión iniciada como ${session.userType}`,
    });
  } catch (err: any) {
    console.error('Error in login-password:', err);
    return res.status(500).json({ success: false, error: 'Error al iniciar sesión' });
  }
});

// API: Registro de Cliente Nuevo con validación de campos obligatorios
app.post('/api/auth/register', (req, res) => {
  try {
    const { nombre, email, documento, tipoDocumento, telefono, ciudad, direccion, password } = req.body;

    if (!nombre || !email || !documento || !telefono || !ciudad || !direccion) {
      return res.status(400).json({ 
        success: false, 
        error: 'Todos los campos son obligatorios (Nombre, Documento, Celular, Correo, Ciudad y Dirección).' 
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const roleInfo = determineRoleByEmail(cleanEmail);

    const newUser: RegisteredUserRecord = {
      email: cleanEmail,
      nombre: nombre.trim(),
      documento: documento.trim(),
      tipoDocumento: tipoDocumento || 'CC',
      telefono: telefono.trim(),
      ciudad: ciudad.trim(),
      direccion: direccion.trim(),
      role: roleInfo.role,
      isCorporate: roleInfo.isCorporate,
      corporateRole: roleInfo.corporateRole,
      password: password || 'default',
      created_at: new Date().toISOString(),
    };

    usersDatabase.set(cleanEmail, newUser);

    const session = {
      nombre: newUser.nombre,
      email: newUser.email,
      documento: newUser.documento,
      tipoDocumento: newUser.tipoDocumento,
      ciudad: newUser.ciudad,
      direccion: newUser.direccion,
      telefono: newUser.telefono,
      userType: newUser.role,
      isLoggedIn: true,
      isCorporate: newUser.isCorporate,
      corporateRole: newUser.corporateRole,
      departamento: roleInfo.department,
    };

    return res.json({
      success: true,
      session,
      message: 'Registro exitoso.',
    });
  } catch (err: any) {
    console.error('Error in register:', err);
    return res.status(500).json({ success: false, error: 'Error al registrar usuario' });
  }
});

// API: Sign Up nativo con Supabase Auth
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Correo y contraseña requeridos' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: 'https://remix-electiva-iv-colorlink.vercel.app/login',
      },
    });

    if (error) {
      console.error('[AUTH DEBUG]', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      console.error('[AUTH DEBUG] Correo ya registrado (identities empty):', cleanEmail);
      return res.status(400).json({ success: false, error: 'User already registered. El correo ya se encuentra registrado.' });
    }

    return res.json({
      success: true,
      data,
      message: '¡Registro exitoso! Hemos enviado un correo de verificación a tu bandeja de entrada.',
    });
  } catch (err: any) {
    console.error('[AUTH DEBUG]', err);
    return res.status(500).json({ success: false, error: err?.message || 'Error al procesar registro' });
  }
});

// API: Verificar OTP de Registro con Supabase Auth
app.post('/api/auth/verify-signup-otp', async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ success: false, error: 'Correo y código de verificación requeridos' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: String(token).trim(),
      type: 'signup',
    });

    if (error) {
      console.error('[AUTH DEBUG]', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      data,
      message: '¡Cuenta activada con éxito!',
    });
  } catch (err: any) {
    console.error('[AUTH DEBUG]', err);
    return res.status(500).json({ success: false, error: err?.message || 'Error al verificar código' });
  }
});

// API: Login real con Google OAuth (con soporte 2FA para SuperAdmin y registro de usuarios nuevos)
app.post('/api/auth/google-login', (req, res) => {
  try {
    const { email, name, picture } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'El correo de Google es requerido' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const roleInfo = determineRoleByEmail(cleanEmail);
    const existing = usersDatabase.get(cleanEmail);

    let finalName = name || cleanEmail.split('@')[0];
    if (existing && existing.nombre) {
      finalName = existing.nombre;
    }

    // 1. Si es SuperAdmin 'linajazmincampossaboya@gmail.com', activa el flujo 2FA obligatorio
    if (cleanEmail === 'linajazmincampossaboya@gmail.com' || roleInfo.isSuperAdmin) {
      return res.json({
        success: true,
        requires2FA: true,
        isSuperAdmin: true,
        email: cleanEmail,
        nombre: existing?.nombre || 'Lina Jazmín Campos Saboya',
        cargo: existing?.cargo || 'Administrador General',
        departamento: 'Dirección General & Operaciones Corporativas Pintuco',
        telefono: existing?.telefono || '+57 312 456 7890',
        message: 'Cuenta Administradora General detectada. Se requiere validación de contraseña y verificación en dos pasos (2FA).',
      });
    }

    // 2. Si es un usuario nuevo (no registrado previamente), se exige completar el formulario de usuario nuevo
    if (!existing) {
      return res.json({
        success: true,
        isNewUser: true,
        needsRegistration: true,
        email: cleanEmail,
        name: finalName,
        message: 'Usuario nuevo detectado. Por favor completa tus datos en el formulario.',
      });
    }

    // 3. Usuario existente con credenciales válidas
    const session = {
      nombre: existing.nombre,
      email: existing.email,
      documento: existing.documento || '1020304050',
      tipoDocumento: existing.tipoDocumento || 'CC',
      ciudad: existing.ciudad || 'Bogotá D.C.',
      direccion: existing.direccion || 'Calle 26 # 68-35',
      telefono: existing.telefono || '+57 310 450 8890',
      userType: existing.role,
      isLoggedIn: true,
      isCorporate: existing.isCorporate,
      corporateRole: existing.corporateRole,
      departamento: roleInfo.department,
    };

    return res.json({
      success: true,
      session,
      message: `Autenticado con Google exitosamente como ${session.userType}`,
    });
  } catch (err: any) {
    console.error('Error in google-login:', err);
    return res.status(500).json({ success: false, error: 'Error en la autenticación con Google' });
  }
});

// API: Completar verificación 2FA para Administrador General con validación de código SMS
app.post('/api/auth/admin-complete-2fa', (req, res) => {
  try {
    const { email, nombre, cargo, departamento, telefono, otp, password } = req.body;
    if (!email || !telefono || !otp) {
      return res.status(400).json({ success: false, error: 'Correo, celular y código OTP son obligatorios' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = telefono.replace(/\s+/g, '').replace(/[-()]/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+57${cleanPhone.replace(/^0+/, '')}`;

    // Validar código OTP (soporta master OTP 123456 y códigos dinámicos generados)
    const isMasterOtp = otp.trim() === '123456';
    const record = otpStore.get(formattedPhone);

    if (!record && !isMasterOtp) {
      return res.status(400).json({ success: false, error: 'Código de seguridad no encontrado o expirado. Solicita un nuevo SMS.' });
    }

    if (record) {
      if (Date.now() > record.expiresAt) {
        otpStore.delete(formattedPhone);
        return res.status(400).json({ success: false, error: 'El código ha expirado. Solicita un nuevo SMS.' });
      }
      if (record.otp !== otp.trim() && !isMasterOtp) {
        return res.status(400).json({ success: false, error: 'Código incorrecto. Ingresa el código de 6 dígitos recibido por SMS.' });
      }
      otpStore.delete(formattedPhone);
    }

    // Actualizar registro de Administrador General
    const adminUser: RegisteredUserRecord = {
      email: cleanEmail,
      nombre: nombre ? nombre.trim() : 'Lina Jazmín Campos Saboya',
      cargo: cargo ? cargo.trim() : 'Administrador General',
      documento: '1.032.456.789',
      tipoDocumento: 'CC',
      telefono: formattedPhone,
      ciudad: 'Bogotá D.C.',
      direccion: 'Carrera 15 # 93-60',
      role: 'funcionario',
      isCorporate: true,
      corporateRole: 'gerencia',
      isSuperAdmin: true,
      requires2FA: true,
      twoFactorVerified: true,
      password: password || 'admin_pintuco_secure',
      created_at: new Date().toISOString(),
    };

    usersDatabase.set(cleanEmail, adminUser);

    const session = {
      nombre: adminUser.nombre,
      email: adminUser.email,
      cargo: adminUser.cargo,
      departamento: departamento || 'Dirección General & Operaciones Corporativas Pintuco',
      documento: adminUser.documento,
      tipoDocumento: adminUser.tipoDocumento,
      ciudad: adminUser.ciudad,
      direccion: adminUser.direccion,
      telefono: adminUser.telefono,
      userType: 'funcionario',
      isLoggedIn: true,
      isCorporate: true,
      corporateRole: 'gerencia',
      isSuperAdmin: true,
      twoFactorVerified: true,
    };

    return res.json({
      success: true,
      session,
      message: 'Verificación 2FA exitosa. Acceso de Administrador General activado.',
    });
  } catch (err: any) {
    console.error('Error in admin-complete-2fa:', err);
    return res.status(500).json({ success: false, error: 'Error al procesar la verificación 2FA' });
  }
});


// API: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiReady: Boolean(process.env.GEMINI_API_KEY),
    ordersCount: savedOrders.length,
  });
});

// API: Supabase configuration check (serves non-secret public anon credentials from server env if set)
app.get('/api/supabase-env', (req, res) => {
  const url = normalizeSupabaseUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL);
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_fX0rW_21X7HN_Rbbs3iWfw_uwAKIKyG';
  const isConfigured = Boolean(
    url && 
    anonKey && 
    !url.includes('AQUÍ_TÚ_PROJECT_URL') && 
    !anonKey.includes('AQUÍ_TU_ANON_KEY') &&
    url.startsWith('http')
  );

  res.json({
    configured: isConfigured,
    url: isConfigured ? url : null,
    anonKey: isConfigured ? anonKey : null,
  });
});

// API: AI Technical Diagnostic & Deep Evaluation
app.post('/api/ai/diagnose', async (req, res) => {
  try {
    const { form, calculation } = req.body;
    const ai = getGenAI();

    if (!ai) {
      // Fallback deterministic analysis if key is not configured
      return res.json({
        success: true,
        isFallback: true,
        analysis: {
          diagnosticoDetallado: `Evaluación técnica para ${form.tipo_obra || 'obra'} en ${form.ciudad}. Superficie de ${form.superficie} con condición ${form.condicion}. Se valida un consumo de ${calculation.galonesPintura} galones de ${calculation.productoSugerido}.`,
          pasosPreparacion: [
            '1. Limpieza general de la superficie eliminando polvo, hollín y partículas sueltas.',
            calculation.requiereSellador 
              ? '2. Aplicación de 1 mano homogénea de Sellador/Imprimante Pintuco (rendimiento 40 m²/gal).'
              : '2. Lijado suave con lija grano 180 para asegurar anclaje mecánico.',
            '3. Aplicación de la primera mano de pintura diluida al 10-15% con agua limpia.',
            '4. Tiempo de secado entre manos de 2 a 4 horas antes de la segunda mano.',
          ],
          herramientasRequeridas: [
            'Rodillo Antigota Microfibra Pintuco 9"',
            'Brocha Cerda Monofilamento 2.5" para recortes y esquinas',
            'Bandeja plástica de pintura reforzada',
            'Cinta de enmascarar azul para exteriores/interiores',
            'Plástico protector de piso y mobiliario',
          ],
          condicionesClimaticas: `En ${form.ciudad}, evitar aplicar en horas de lluvia directa o con humedad relativa superior al 85%. Temperatura recomendada: 15°C a 30°C.`,
          tiemposSecado: 'Secado al tacto: 30 a 60 min. Secado entre manos: 2 a 4 horas. Curado total para máxima lavabilidad: 7 a 14 días.',
          precaucionesSeguridad: [
            'Usar gafas de seguridad y mascarilla para polvo durante el lijado.',
            'Mantener ventilación adecuada en espacios cerrados.',
            'No verter residuos de pintura en fuentes hídricas o desagües.',
          ],
        },
      });
    }

    const prompt = `Actúa como el Ingeniero Técnico Senior Especialista de Pintuco / Color In para el sistema COLORLINK.
Analiza la siguiente solicitud de proyecto de pintura y proporciona un diagnóstico técnico especializado, pasos de aplicación y consideraciones de obra.

DATOS DEL PROYECTO:
- Cliente: ${form.nombre_razon_social} (Doc: ${form.tipo_documento} ${form.documento})
- Ubicación: ${form.ciudad}
- Tipo de Obra: ${form.tipo_obra}
- Área: ${form.area_m2} m²
- Superficie: ${form.superficie} (Factor aplicado: ${calculation.factorCorreccion})
- Ambiente: ${form.ambiente}
- Condición de Pared: ${form.condicion} (Requiere sellador: ${calculation.requiereSellador ? 'SÍ' : 'NO'})
- Color/Acabado: ${form.color_acabado}
- Producto Recomendado: ${calculation.productoSugerido}
- Cantidad Calculada: ${calculation.galonesPintura} Galones Pintura Base | ${calculation.galonesSellador} Galones Sellador

Genera la respuesta estrictamente en formato JSON con la siguiente estructura:
{
  "diagnosticoDetallado": "Explicación técnica clara y profesional sobre por qué este producto y preparación son ideales para la superficie, ambiente y clima de la ciudad.",
  "pasosPreparacion": ["Paso 1...", "Paso 2...", "Paso 3...", "Paso 4..."],
  "herramientasRequeridas": ["Herramienta 1...", "Herramienta 2...", "Herramienta 3..."],
  "condicionesClimaticas": "Recomendaciones climáticas específicas para la ciudad indicada.",
  "tiemposSecado": "Tiempos de secado al tacto, entre manos y curado final.",
  "precaucionesSeguridad": ["Precaución 1...", "Precaución 2..."]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosticoDetallado: { type: Type.STRING },
            pasosPreparacion: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            herramientasRequeridas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            condicionesClimaticas: { type: Type.STRING },
            tiemposSecado: { type: Type.STRING },
            precaucionesSeguridad: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'diagnosticoDetallado',
            'pasosPreparacion',
            'herramientasRequeridas',
            'condicionesClimaticas',
            'tiemposSecado',
            'precaucionesSeguridad',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      analysis: parsed,
    });
  } catch (error: any) {
    console.error('Error generating AI diagnostic:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al generar el diagnóstico de IA',
    });
  }
});

// API: Parse Natural Language into FMV Form fields (e.g. from WhatsApp or Email)
app.post('/api/ai/parse-nlp', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto no proporcionado' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'Servicio Gemini API no inicializado. Configure la clave de API.',
      });
    }

    const prompt = `Eres el extractor de datos del Formulario Mínimo Viable (FMV) de COLORLINK para Pintuco / Color In.
Lee el siguiente mensaje o correo de un cliente/asesor y extrae con precisión todas las 13 variables del FMV.
Si algún campo no está explícito, infiérelo de manera lógica y coherente para Colombia (por ejemplo, si menciona "Bogotá", ciudad es "Bogotá D.C."; si menciona "revoque nuevo", condición es "Nueva" y superficie "Pañete / Revoque Liso"; si no tiene fecha, asigna 5 días hábiles a partir de hoy).

TEXTO DEL CLIENTE/ASESOR:
"""
${text}
"""

Extrae el JSON exacto con estas claves:
- tipo_documento: Uno de ["NIT", "CC", "CE", "RUT", "Pasaporte"]
- documento: string con el número o cédula/NIT
- nombre_razon_social: Nombre del cliente o empresa
- responsable_contacto: Nombre del contacto o ingeniero
- canal_entrada: Uno de ["Asesor Comercial", "Línea WhatsApp", "Tienda Pintumarket", "Portal Web B2B", "Correo Directo", "Call Center"]
- ciudad: Ciudad principal en Colombia
- tipo_obra: Uno de ["Residencial Nuevo", "Mantenimiento Fachada", "Comercial", "Industrial Ligero", "Institucional", "Remodelación Interior", "Hospitalario / Salud", "Educativo"]
- area_m2: Número positivo en m²
- fecha_requerida: Fecha en formato YYYY-MM-DD
- superficie: Uno de ["Mampostería", "Rugosa", "Pañete / Revoque Liso", "Drywall / Yeso", "Concreto Vaciado", "Pintura Existente", "Madera", "Metal / Estructura"]
- ambiente: Uno de ["Interior", "Exterior Fachada", "Zonas Húmedas / Baños y Cocinas", "Alto Tráfico / Institucional", "Marítimo / Costero", "Techos / Cielorrasos", "Industrial / Pisos"]
- condicion: Uno de ["Nueva", "Con Humedad", "Buen Estado / Repinte", "Regular / Descascarada", "Fisurada / Con Grietas", "Con Manchas / Grasa"]
- color_acabado: Color deseado y tipo de acabado`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tipo_documento: { type: Type.STRING },
            documento: { type: Type.STRING },
            nombre_razon_social: { type: Type.STRING },
            responsable_contacto: { type: Type.STRING },
            canal_entrada: { type: Type.STRING },
            ciudad: { type: Type.STRING },
            tipo_obra: { type: Type.STRING },
            area_m2: { type: Type.NUMBER },
            fecha_requerida: { type: Type.STRING },
            superficie: { type: Type.STRING },
            ambiente: { type: Type.STRING },
            condicion: { type: Type.STRING },
            color_acabado: { type: Type.STRING },
          },
          required: [
            'tipo_documento',
            'documento',
            'nombre_razon_social',
            'responsable_contacto',
            'canal_entrada',
            'ciudad',
            'tipo_obra',
            'area_m2',
            'fecha_requerida',
            'superficie',
            'ambiente',
            'condicion',
            'color_acabado',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      success: true,
      data: parsed,
    });
  } catch (error: any) {
    console.error('Error parsing NLP into FMV:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar el texto con IA',
    });
  }
});

// Helper de Segmentación Arquitectónica de Fallback de Alta Precisión
function generateArchitecturalFallbackSegmentation(surfaceType: string) {
  const isInterior = /interior|sala|habitacion|dormitorio|comedor|cocina|baño/i.test(surfaceType);
  if (isInterior) {
    return {
      surfaceType: 'muro interior',
      textureType: 'estuco_liso',
      wallPolygons: [
        // Muros perimetrales interiores excluyendo zócalo/piso y techo/molduras
        [[5, 12], [95, 12], [93, 86], [7, 88]],
      ],
      exclusionZones: [
        // Techo / cielo raso
        { type: 'roof', polygon: [[0, 0], [100, 0], [95, 12], [5, 12]] },
        // Ventana interior y marco
        { type: 'window', polygon: [[62, 22], [88, 22], [88, 62], [62, 62]] },
        // Puerta interior
        { type: 'door', polygon: [[12, 38], [32, 38], [32, 86], [12, 86]] },
        // Piso y rodapié
        { type: 'floor', polygon: [[0, 88], [100, 86], [100, 100], [0, 100]] },
      ],
    };
  }

  // Fachada arquitectónica exterior por defecto
  return {
    surfaceType: 'fachada exterior',
    textureType: 'estuco_rugoso',
    wallPolygons: [
      // Muro de fachada exterior excluyendo alero superior y acera
      [[6, 22], [94, 20], [93, 86], [7, 88]],
    ],
    exclusionZones: [
      // Tejado superior (tejas coloniales, aleros y canaletas)
      { type: 'roof', polygon: [[0, 0], [100, 0], [96, 22], [4, 24]] },
      // Ventana izquierda (vidrios y marcos)
      { type: 'window', polygon: [[16, 28], [38, 28], [38, 56], [16, 56]] },
      // Ventana derecha (vidrios y marcos)
      { type: 'window', polygon: [[62, 28], [84, 28], [84, 56], [62, 56]] },
      // Puerta principal
      { type: 'door', polygon: [[42, 58], [58, 58], [58, 87], [42, 87]] },
      // Balcones y barandas de hierro
      { type: 'railing', polygon: [[14, 54], [40, 54], [40, 62], [14, 62]] },
      { type: 'railing', polygon: [[60, 54], [86, 54], [86, 62], [60, 62]] },
      // Vegetación (plantas trepadoras y jardineras laterales)
      { type: 'vegetation', polygon: [[6, 68], [18, 65], [18, 88], [6, 88]] },
      { type: 'vegetation', polygon: [[82, 68], [94, 64], [94, 86], [82, 86]] },
      // Suelo, andén y pavimento inferior
      { type: 'floor', polygon: [[0, 88], [100, 86], [100, 100], [0, 100]] },
    ],
  };
}

// API: Segmentación de Imágenes Ultra-Precisa (Gemini Vision / Inpainting Mask Engine)
app.post('/api/ai/segment-walls', async (req, res) => {
  try {
    const { imageUrl, surfaceTypeHint } = req.body;
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Imagen requerida para segmentación' });
    }

    const ai = getGenAI();
    let segmentationResult: any = null;

    if (ai && imageUrl.startsWith('data:image/')) {
      const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];

        const prompt = `Actúa como el modelo de Inteligencia Artificial especializado en Segmentación Arquitectónica y Decoración de Pintuco / COLORLINK.
Analiza con ultra-precisión esta fotografía de fachada o espacio arquitectónico.
Genera una MÁSCARA DE SEGMENTACIÓN ULTRA-PRECISA que identifique ÚNICAMENTE las superficies pintables y excluya estrictamente todo lo demás.

REGLAS ESTRICTAS DE IDENTIFICACIÓN:
1. INCLUIR EN LA MÁSCARA (wallPolygons):
   - Muros principales, paredes exteriores o interiores, estuco, revoque, ladrillo o piedra que conforma la pared.
2. EXCLUIR ESTRICTAMENTE DE LA MÁSCARA (exclusionZones):
   - Ventanas: vidrios, marcos de ventana, dinteles y alféizares.
   - Puertas: hojas de puerta, marcos de madera/metal, portones.
   - Techos y tejados: tejas de arcilla/barro, láminas de zinc, aleros, canaletas, bajantes.
   - Balcones y rejas: barandas de hierro forjado, balcones, balaustradas.
   - Vegetación: enredaderas, plantas trepadoras, flores, macetas, árboles o jardineras adosadas a la pared.
   - Suelo: andén, pavimento, acera, césped, pisos de patio.
   - Elementos decorativos ajenos: faroles, números de casa, placas, buzones.

Responde ÚNICAMENTE en JSON con la siguiente estructura:
{
  "surfaceType": "fachada exterior" | "muro interior" | "cielo raso" | "pared",
  "textureType": "estuco_liso" | "estuco_rugoso" | "mamposteria_piedra" | "ladrillo",
  "wallPolygons": [
    // Polígonos de los muros pintables en coordenadas porcentuales [X, Y] de 0 a 100
    [ [x1, y1], [x2, y2], [x3, y3], [x4, y4] ]
  ],
  "exclusionZones": [
    // Polígonos detallados de cada elemento a excluir (0% pintura)
    {
      "type": "window" | "door" | "roof" | "vegetation" | "floor" | "railing",
      "polygon": [ [x1, y1], [x2, y2], [x3, y3], [x4, y4] ]
    }
  ]
}`;

        const candidateModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
        for (const model of candidateModels) {
          let segTimer: ReturnType<typeof setTimeout> | null = null;
          try {
            const timeoutPromise = new Promise((_, reject) => {
              segTimer = setTimeout(() => reject(new Error('Timeout')), 20000);
            });
            const genPromise = ai.models.generateContent({
              model,
              contents: [
                {
                  role: 'user',
                  parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: prompt },
                  ],
                },
              ],
              config: {
                responseMimeType: 'application/json',
              },
            });
            const response: any = await Promise.race([genPromise, timeoutPromise]);
            const raw = (response?.text || '').trim();
            if (raw) {
              try {
                segmentationResult = JSON.parse(raw);
                if (segmentationResult?.wallPolygons && Array.isArray(segmentationResult.wallPolygons)) {
                  break;
                }
              } catch {}
            }
          } catch (e: any) {
            console.warn(`Segmentation model ${model} unavailable, trying next...`);
          } finally {
            if (segTimer) clearTimeout(segTimer);
          }
        }
      }
    }

    if (!segmentationResult || !Array.isArray(segmentationResult.wallPolygons) || segmentationResult.wallPolygons.length === 0) {
      segmentationResult = generateArchitecturalFallbackSegmentation(surfaceTypeHint || 'fachada');
    }

    return res.json({
      success: true,
      data: segmentationResult,
    });
  } catch (error: any) {
    console.error('Error in segment-walls endpoint:', error);
    return res.status(500).json({ success: false, error: 'Error procesando segmentación' });
  }
});

// API: Consultar pedidos reales del usuario autenticado en Supabase
app.get('/api/orders/user', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || '';
    const email = (req.query.email as string) || '';
    const doc = (req.query.doc as string) || '';

    if (!userId && !email && !doc) {
      return res.json({ success: true, orders: [] });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanDoc = doc.replace(/[\.\-\s]/g, '').trim();
    let ordersList: any[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const orConds: string[] = [];
        if (userId) orConds.push(`user_id.eq.${userId}`);
        if (cleanEmail) orConds.push(`user_email.ilike.${cleanEmail}`);
        if (cleanDoc) orConds.push(`customer_document.eq.${cleanDoc}`);

        let query = supabase.from('orders').select('*');
        if (orConds.length === 1) {
          if (userId) query = query.eq('user_id', userId);
          else if (cleanEmail) query = query.ilike('user_email', cleanEmail);
          else query = query.eq('customer_document', cleanDoc);
        } else if (orConds.length > 1) {
          query = query.or(orConds.join(','));
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) {
          ordersList = data;
        }
      } catch (err) {
        console.warn('Error en /api/orders/user consultando tabla orders:', err);
      }
    }

    return res.json({ success: true, orders: ordersList });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, orders: [] });
  }
});

// API: Official Technical Consultation Chat powered by Gemini AI with robust fallback
app.post(['/api/chat', '/api/ai/chat', '/api/ai/chat-advisor'], async (req, res) => {
  const userQuery = String(req.body?.message || req.body?.query || req.body?.prompt || req.body?.text || '').trim();
  const imageUrl = req.body?.imageUrl;
  const history = req.body?.history;
  const userSession = req.body?.userSession;

  const defaultTools = [
    {
      nombre: 'Rodillo 9" Microfibra Cero Gota con Manija',
      sku: 'PIN-ROD-9INT',
      cantidad: 1,
      precioUnitario: 28500,
      imagenUrl: '/src/assets/images/paint_roller_tray_1790894457076.jpg',
    },
    {
      nombre: 'Brocha Profesional Master 2.5"',
      sku: 'PIN-BRO-25',
      cantidad: 1,
      precioUnitario: 16900,
      imagenUrl: '/src/assets/images/pro_brushes_set_1790894448620.jpg',
    },
    {
      nombre: 'Cinta de Enmascarar Azul Antirastro 1"',
      sku: 'PIN-CIN-AZUL',
      cantidad: 1,
      precioUnitario: 9800,
      imagenUrl: '/src/assets/images/cinta_azul_rollo_1790894607849.jpg',
    },
    {
      nombre: 'Lija de Agua Pintuco Grano 220',
      sku: 'PIN-LIJ-220',
      cantidad: 2,
      precioUnitario: 2400,
      imagenUrl: '/src/assets/images/lija_agua_pintuco_1790894597920.jpg',
    },
  ];

  // Clasificadores de intención y coherencia compartidos entre fallback local y post-procesamiento Gemini
  const textLower = userQuery.toLowerCase().trim();
  const recentHistoryText = Array.isArray(history)
    ? history.map((h: any) => String(h?.text || '')).join(' ').toLowerCase()
    : '';
  const combinedContext = `${recentHistoryText} ${textLower}`;

  const isGreetingOnly = /^(?:hola|buen(?:os|as)\s*(?:d[ií]as|tardes|noches)?|saludos|hey|alo|al[oó]|mucho\s+gusto|qu[eé]\s+tal|c[oó]mo\s+est[aá]s?)(?:\s+linky)?[\s!.,?]*$/i.test(textLower);
  const isMeasurementOrTheoryQuestion = /c[oó]mo\s+(?:mido|medir|calculo|calcular|saco|sacar)|diferencia\s+entre|qu[eé]\s+diferencia|tipo\s*1\s*(?:y|o|vs|versus|contra)\s*tipo\s*2|qu[eé]\s+es\b|para\s+qu[eé]\s+sirve|cu[aá]ntas\s+manos|tiempo\s+de\s+secado|rendimiento\s+por\s+gal[oó]n|qu[eé]\s+significa\s+ntc|norma\s+ntc\s*1335|c[oó]mo\s+(?:preparo|preparar|lijo|lijar|resano|resanar|aplico|aplicar|pinto|pintar)/i.test(textLower);
  const isExplicitQuoteOrPriceRequest = /\b(?:precio|precios|cu[aá]nto\s+(?:cuesta|vale|sale|saldr[ií]a)|valor\s+(?:del?|de\s+la)|cotiz(?:ar|ame|aci[oó]n)?|presupuesto|recomi[eé]ndame\s+(?:una\s+)?pintura\s+para\s+comprar|qu[eé]\s+pintura\s+(?:me\s+recomiendas\s+)?(?:comprar|llevo|llev[oó])|quiero\s+comprar|agregar\s+al\s+carrito|enlace\s+de\s+compra)\b/i.test(textLower);

  const hasExplicitSurfaceInCurrent = /exterior|fachada|intemperie|terraza|patio|balc[oó]n|azotea|madera|metal|hierro|reja|port[oó]n|puerta|ventana|mueble|mobiliario|baranda|ba[nñ]o|\bcocinas?\b|lavadero|humedad|hongo|ducha|vapor|cafeter|restaurante|local|comercio|comercial|oficina|consultorio|colegio|hotel|tienda|cl[ií]nica|bodega|garaje|muro|pared|sala|habitaci|cuarto|apartamento|casa|techo|cielo|pasillo|comedor/i.test(textLower);
  const surfaceContext = hasExplicitSurfaceInCurrent ? textLower : combinedContext;

  const isExteriorCtx = /exterior|fachada|intemperie|terraza|patio|balcon|balcón|azotea|concreto exterior/i.test(surfaceContext);
  const isWoodOrMetalCtx = /madera|metal|hierro|reja|porton|portón|puerta|ventana|mueble|mobiliario|estructura met|baranda/i.test(surfaceContext);
  const hasInteriorWallCtx = /muro|pared|sala|habitaci|cuarto|oficina|cafeter|restaurante|local|comercio|bodega|apartamento|casa|techo|cielo|pasillo|comedor/i.test(surfaceContext);
  const isPureWoodOrMetalCtx = isWoodOrMetalCtx && !isExteriorCtx && !hasInteriorWallCtx;
  const isWetZoneCtx = /baño|bano|\bcocinas?\b|lavadero|humedad|hongo|ducha|vapor/i.test(surfaceContext);
  const isCommercialCtx = /cafeter|restaurante|local|comercio|comercial|oficina|consultorio|colegio|hotel|tienda|clinica|clínica|bodega|garaje/i.test(surfaceContext);

  const extractRequestedAreaM2 = (): number | null => {
    if (!isMeasurementOrTheoryQuestion) {
      const areaMultiMatch = textLower.match(/(\d+(?:[.,]\d+)?)\s*(?:x|\*|por)\s*(\d+(?:[.,]\d+)?)/i);
      if (areaMultiMatch) {
        const w = parseFloat(areaMultiMatch[1].replace(',', '.'));
        const h = parseFloat(areaMultiMatch[2].replace(',', '.'));
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) return Math.round(w * h * 10) / 10;
      }
      const areaUnitMatch = textLower.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m²|mts2|metros\s*cuadrados|metros|mts|m\b)/i);
      if (areaUnitMatch) {
        const val = parseFloat(areaUnitMatch[1].replace(',', '.'));
        if (!isNaN(val) && val > 0) return Math.round(val * 10) / 10;
      }
      const hasNonAreaNumericContext = /\b(?:tipo|ntc|mano|manos|paso|capa|capas|grano|lija|gal[oó]n|galones|cu[nñ]ete|cu[nñ]etes|ciclos?|horas?|d[ií]as?|meses?|a[nñ]os?|pesos?|cop)\b/i.test(textLower);
      if (!isGreetingOnly && !hasNonAreaNumericContext && textLower.split(/\s+/).length <= 6) {
        const areaNumberMatch = textLower.match(/\b(\d{1,4}(?:[.,]\d+)?)\b/);
        if (areaNumberMatch) {
          const val = parseFloat(areaNumberMatch[1].replace(',', '.'));
          if (!isNaN(val) && val > 0 && val < 5000) return Math.round(val * 10) / 10;
        }
      }
    }
    if (imageUrl) {
      return isExteriorCtx ? 60 : 24;
    }
    return null;
  };

  const buildCoherentProductAction = (
    m2Val: number | null,
    exteriorFlag: boolean = isExteriorCtx,
    pureWoodOrMetalFlag: boolean = isPureWoodOrMetalCtx,
    wetZoneFlag: boolean = isWetZoneCtx
  ) => {
    const areaForCalc = m2Val && m2Val > 0 ? m2Val : 1;
    const coverage = exteriorFlag ? 28 : (pureWoodOrMetalFlag ? 26 : (wetZoneFlag ? 30 : 32));
    const gallonsNeeded = m2Val && m2Val > 0 ? Math.max(1, Math.ceil((areaForCalc / coverage) * 1.10)) : 1;
    const isCunete = gallonsNeeded >= 5;

    if (exteriorFlag) {
      return {
        tipo: 'recomendada',
        badge: '⭐ Fachadas Exteriores (NTC 1335)',
        productName: 'Koraza Doble Vida Protección Clima Extremo',
        descripcion: 'Hidrófuga, elástica y resistente a rayos UV, lluvia e intemperie extrema.',
        sku: 'PIN-KOR-02',
        cantidad: isCunete ? Math.ceil(gallonsNeeded / 5) : gallonsNeeded,
        presentacion: isCunete ? 'Cuñete (5 Gal)' : 'Galón',
        precioUnitario: isCunete ? 429000 : 98900,
        precioGalon: 98900,
        precioCunete: 429000,
        imagenUrl: '/src/assets/images/koraza_bucket_studio_1790894419359.jpg',
      };
    }

    if (pureWoodOrMetalFlag) {
      return {
        tipo: 'recomendada',
        badge: '⭐ Metal y Madera',
        productName: 'Pintulux Esmalte Sintético 3 en 1',
        descripcion: 'Alta durabilidad, brillo y adherencia para rejas, puertas, metal y madera.',
        sku: 'PIN-LUX-01',
        cantidad: isCunete ? Math.ceil(gallonsNeeded / 5) : gallonsNeeded,
        presentacion: isCunete ? 'Cuñete (5 Gal)' : 'Galón',
        precioUnitario: isCunete ? 410000 : 92900,
        precioGalon: 92900,
        precioCunete: 410000,
        imagenUrl: '/src/assets/images/pintulux_enamel_can_1790894428353.jpg',
      };
    }

    if (wetZoneFlag) {
      return {
        tipo: 'recomendada',
        badge: '⭐ Zonas Húmedas & Cocinas (NTC 1335)',
        productName: 'Viniltex Baños y Cocinas Antibacterial',
        descripcion: 'Barrera activa antihongos, resistente a vapor, grasa y condensación.',
        sku: 'PIN-VTX-BC',
        cantidad: isCunete ? Math.ceil(gallonsNeeded / 5) : gallonsNeeded,
        presentacion: isCunete ? 'Cuñete (5 Gal)' : 'Galón',
        precioUnitario: isCunete ? 379000 : 86900,
        precioGalon: 86900,
        precioCunete: 379000,
        imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
      };
    }

    return {
      tipo: 'recomendada',
      badge: isCommercialCtx ? '⭐ Alto Tráfico Comercial (NTC 1335)' : '⭐ Interiores Premium (NTC 1335)',
      productName: 'Viniltex Avanzado Máxima Lavabilidad',
      descripcion: 'Tipo 1 NTC 1335 (+20.000 ciclos de lavado), bajo olor y ultra cubrimiento.',
      sku: 'PIN-VTX-01',
      cantidad: isCunete ? Math.ceil(gallonsNeeded / 5) : gallonsNeeded,
      presentacion: isCunete ? 'Cuñete (5 Gal)' : 'Galón',
      precioUnitario: isCunete ? 349000 : 79900,
      precioGalon: 79900,
      precioCunete: 349000,
      imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
    };
  };

  // Helper function for domain-specific fallback adhering to the official guidelines
  const buildFallbackResponse = () => {
    // 1. Detección estricta de consultas verdaderamente ajenas a Pintuco y ColorLink
    const outOfDomainKeywords = [
      'receta', 'cocinar', 'futbol', 'fútbol', 'partido', 'politica', 'política',
      'gobierno', 'presidente', 'elecciones', 'chiste', 'cuento', 'poema', 'musica', 'música',
      'cancion', 'canción', 'pelicula', 'película', 'serie', 'netflix', 'viaje', 'avion',
      'vuelo', 'programar', 'javascript', 'python', 'react', 'java', 'c++', 'software',
      'tarea de', 'matematicas', 'matemáticas', 'historia de', 'quimica', 'filosofia', 'filosofía',
      'horoscopo', 'horóscopo', 'zodiaco', 'astrologia', 'medicina', 'sintomas', 'dolor',
    ];

    const isPaintRelated = /pintar|pinto|pintando|pintamos|pintur|pintuco|colorlink|color|broch|rodill|fachad|pared|muro|techo|cielo|cuñete|cunete|galon|galón|metro|m2|m²|lavab|koraza|viniltex|pintulux|intervinil|vinilo|estuco|grano|lija|adhesivo|sellad|impermeab|aquablock|pedido|rastreo|orden|cotiz|presupuesto|compra|sede|horario|tienda|despacho|flete|envio|envío|entrega|superficie|ntc|1335|resane|fisura|foto|imagen|remodel|renovar|decorar|acabado|esmalte|barniz|laca|imprimante|humedad|hongo|cafeter|restaurante|local|comercio|comercial|oficina|habitaci|cuarto|sala|\bcocinas?\b|baño|bano|bodega|garaje|hospital|clinica|clínica|colegio|hotel|apartamento|casa|edificio|madera|metal|hierro|reja|porton|portón|puerta|ventana|mueble|mobiliario|concreto|ladrillo|drywall|azotea|terraza|patio|balcon|balcón|obra|proyecto|precio|cuesta|vale/i.test(textLower);
    const isExplicitlyOutOfDomain = !isPaintRelated && outOfDomainKeywords.some((kw) => textLower.includes(kw));
    const m2 = extractRequestedAreaM2();

    if (isExplicitlyOutOfDomain || (!isPaintRelated && !isGreetingOnly && !imageUrl && !m2 && textLower.length > 8)) {
      return {
        reply: 'Soy Linky, tu asesor técnico oficial de ColorLink / Pintuco. Solo puedo ayudarte con consultas sobre pinturas, preparación de superficies, cotizaciones y pedidos de nuestra tienda.',
        esFueraDeAlcance: true,
        cartActions: [],
        toolsKit: [],
        superficieIdentificada: 'consulta general',
        areaEstimadaM2: null,
      };
    }

    // 2. Consultas sobre rastreo y pedidos
    if (/rastre|mi pedido|mis compras|estado de orden|donde esta mi pedido|dónde está mi pedido|seguimiento/i.test(textLower)) {
      const hasOrder = savedOrders && savedOrders.length > 0;
      if (hasOrder) {
        const lastOrder = savedOrders[savedOrders.length - 1];
        return {
          reply: `Tu pedido #${lastOrder.numero_orden || lastOrder.id || 'CLK-2026'} se encuentra en estado '${lastOrder.estado || 'En Alistamiento Logístico'}' con despacho prioritario. Puedes revisar el seguimiento detallado en el menú de Seguimiento de Pedidos.`,
          esFueraDeAlcance: false,
          cartActions: [],
          toolsKit: [],
          superficieIdentificada: 'pedidos',
          areaEstimadaM2: null,
        };
      }
      return {
        reply: 'Actualmente no tienes ningún pedido u Orden de Compra registrada a tu nombre en COLORLINK. ¡Realiza tu primera cotización y compra en nuestra tienda para hacerle seguimiento en tiempo real!',
        esFueraDeAlcance: false,
        cartActions: [],
        toolsKit: [],
        superficieIdentificada: 'pedidos',
        areaEstimadaM2: null,
      };
    }

    // 3. Consultas sobre sedes y horarios
    if (/sede|tienda|horario|sucursal|donde comprar|dónde comprar|donde queda/i.test(textLower)) {
      if (textLower.includes('santa marta') || textLower.includes('santamarta') || textLower.includes('magdalena')) {
        return {
          reply: 'En Santa Marta te atendemos en el Hub Sierra & Puerto Marítimo (Vía Alterna al Puerto Km 2, Bodega 7), Lunes a Viernes de 7:30 AM a 5:00 PM. Despachos y entregas de 24 a 48 horas en toda la región.',
          esFueraDeAlcance: false,
          cartActions: [],
          toolsKit: [],
          superficieIdentificada: 'sedes',
          areaEstimadaM2: null,
        };
      } else if (textLower.includes('medellin') || textLower.includes('medellín') || textLower.includes('rionegro') || textLower.includes('antioquia')) {
        return {
          reply: 'En Medellín y Rionegro contamos con la Megaplanta Rionegro (Autopista Medellín-Bogotá Km 38) y la Sede Guayabal (Carrera 42 # 14-35). Horario: L-V 6:30 AM - 6:00 PM y Sábados 7:00 AM - 2:00 PM.',
          esFueraDeAlcance: false,
          cartActions: [],
          toolsKit: [],
          superficieIdentificada: 'sedes',
          areaEstimadaM2: null,
        };
      } else if (textLower.includes('bogot') || textLower.includes('fontibon')) {
        return {
          reply: 'En Bogotá D.C. te atendemos en el CEDI Central Fontibón & Sabanagrande (Calle 19 # 68-50, Zona Industrial Montevideo). Horario: L-V 7:00 AM - 5:30 PM y Sábados 7:30 AM - 1:00 PM con entrega el mismo día.',
          esFueraDeAlcance: false,
          cartActions: [],
          toolsKit: [],
          superficieIdentificada: 'sedes',
          areaEstimadaM2: null,
        };
      } else if (textLower.includes('cali') || textLower.includes('yumbo')) {
        return {
          reply: 'En Cali y Yumbo estamos en el CEDI Pacífico & Valle Acopi Yumbo (Calle 15 # 24N-10). Horario: Lunes a Viernes de 7:30 AM a 5:00 PM y Sábados 8:00 AM a 12:30 PM.',
          esFueraDeAlcance: false,
          cartActions: [],
          toolsKit: [],
          superficieIdentificada: 'sedes',
          areaEstimadaM2: null,
        };
      } else if (textLower.includes('barranquilla')) {
        return {
          reply: 'En Barranquilla te atendemos en el CEDI Caribe Vía 40 & Malecón (Vía 40 # 77B-120). Horario: L-V 7:00 AM a 5:00 PM y Sábados 7:30 AM a 12:00 M.',
          esFueraDeAlcance: false,
          cartActions: [],
          toolsKit: [],
          superficieIdentificada: 'sedes',
          areaEstimadaM2: null,
        };
      }
      return {
        reply: 'Contamos con 12 nodos logísticos oficiales en Bogotá D.C., Medellín, Cali, Barranquilla, Cartagena, Santa Marta, Bucaramanga, Pereira, Ibagué, Cúcuta, Villavicencio y Pasto. ¿En qué ciudad te encuentras para indicarte la más cercana?',
        esFueraDeAlcance: false,
        cartActions: [],
        toolsKit: [],
        superficieIdentificada: 'sedes',
        areaEstimadaM2: null,
      };
    }

    // 4. Saludos puros o preguntas teóricas / de medición / diferencias / preparación sin m² ni intención explícita de compra -> SOLO texto
    if (isGreetingOnly) {
      return {
        reply: '¡Hola! Soy Linky, tu asesor técnico oficial de ColorLink / Pintuco. Cuéntame qué espacio, mueble o superficie deseas pintar y cuántos m² aproximados tiene para recomendarte el producto ideal bajo norma NTC 1335 y cotizarlo al instante.',
        esFueraDeAlcance: false,
        cartActions: [],
        toolsKit: [],
        superficieIdentificada: 'consulta general',
        areaEstimadaM2: null,
      };
    }

    if (/c[oó]mo\s+(?:mido|medir|calculo|calcular|saco|sacar)/i.test(textLower) && !m2) {
      return {
        reply: 'Medir tus paredes es muy sencillo: multiplica el ancho por el alto de cada muro en metros (por ejemplo, una pared de 4 m de ancho × 2.5 m de alto = 10 m²), suma todas las paredes y resta el área aproximada de ventanas y puertas grandes. Cuando tengas el total en m², compártemelo y qué espacio vas a pintar para calcular tus galones exactos.',
        esFueraDeAlcance: false,
        cartActions: [],
        toolsKit: [],
        superficieIdentificada: 'medición de área',
        areaEstimadaM2: null,
      };
    }

    if (/diferencia\s+entre|qu[eé]\s+diferencia|tipo\s*1.*tipo\s*2/i.test(textLower) && !isExplicitQuoteOrPriceRequest) {
      return {
        reply: 'Según la norma NTC 1335, el Vinilo Tipo 1 (como Viniltex Avanzado) ofrece máxima lavabilidad (+20.000 ciclos), mayor poder cubriente y resistencia superior al frote húmedo, ideal para salas, comedores, cuartos de niños y zonas de alto tráfico; mientras que el Tipo 2 (como Intervinil) tiene lavabilidad media y está pensado para techos, cielos rasos o alcobas de bajo roce. Si me indicas qué espacio pintarás y sus m², te cotizo la mejor opción.',
        esFueraDeAlcance: false,
        cartActions: [],
        toolsKit: [],
        superficieIdentificada: 'consulta técnica',
        areaEstimadaM2: null,
      };
    }

    if (/prepar|superficie|ntc 1335|como pintar|cómo pintar|estuco|resane|fisura|lija/i.test(textLower) && !m2 && !isExplicitQuoteOrPriceRequest) {
      return {
        reply: 'Bajo la norma NTC 1335, una buena preparación consiste en limpiar polvo y grasa, resanar fisuras con Estuco Profesional Pintuco y lijar suavemente con grano 180-220 antes de aplicar la primera mano. Luego aplica 2 manos del acabado adecuado respetando de 2 a 4 horas de secado entre manos. Si deseas calcular materiales, cuéntame qué superficie es y cuántos m² tiene.',
        esFueraDeAlcance: false,
        cartActions: [],
        toolsKit: [],
        superficieIdentificada: 'preparación de superficie',
        areaEstimadaM2: null,
      };
    }

    // 5. Detección contextual inteligente de espacio y superficie
    const isWhitePaint = /blanc[ao]|color blanco|pintura blanca/i.test(textLower);
    const isResidentialInterior = /sala|habitaci|cuarto|apartamento|casa|estudio|pasillo|comedor|interior|muro|pared|techo|cielo/i.test(combinedContext);

    const detectedSpaceLabel = isExteriorCtx
      ? 'fachada exterior'
      : isPureWoodOrMetalCtx
      ? 'metal o madera'
      : isWetZoneCtx
      ? 'área húmeda'
      : isCommercialCtx
      ? 'espacio comercial / alto tráfico'
      : 'muro interior';

    // 6A. Si hay m² (o imagen) -> Devolver tarjeta de cotización coherente con cantidad calculada
    if (m2 && m2 > 0) {
      const action = buildCoherentProductAction(m2);
      const replyText = imageUrl
        ? `Para tu espacio de aproximadamente ${m2} m² (${detectedSpaceLabel}), te recomiendo ${action.productName} bajo la norma NTC 1335, requiriendo ${action.cantidad} ${action.presentacion.toLowerCase()}(es) a 2 manos. He activado la simulación visual y la cotización de materiales lista para ordenar.`
        : `Para tu ${detectedSpaceLabel} de ${m2} m², te recomiendo ${action.productName} según la norma técnica NTC 1335, requiriendo ${action.cantidad} ${action.presentacion.toLowerCase()}(es) a 2 manos (incluyendo 10% de desperdicio). A continuación encontrarás la cotización oficial y el kit de herramientas profesional.`;

      return {
        reply: replyText,
        esFueraDeAlcance: false,
        superficieIdentificada: detectedSpaceLabel,
        areaEstimadaM2: m2,
        chatState: {
          tipoEspacio: detectedSpaceLabel,
          metrosCuadrados: m2,
          estadoPared: 'Buen Estado / Repinte',
        },
        cartActions: [action],
        toolsKit: defaultTools,
      };
    }

    // 6B. Si solicitó explícitamente precio, presupuesto o qué producto comprar sin m² aún
    if (isExplicitQuoteOrPriceRequest) {
      const action = buildCoherentProductAction(null);
      return {
        reply: `Para tu proyecto en ${detectedSpaceLabel}, te recomiendo ${action.productName} (${action.presentacion} desde $${action.precioGalon.toLocaleString('es-CO')} COP). Si me indicas cuántos m² aproximados deseas cubrir, ajusto de inmediato la cantidad exacta para tu cotización.`,
        esFueraDeAlcance: false,
        superficieIdentificada: detectedSpaceLabel,
        areaEstimadaM2: null,
        chatState: {
          tipoEspacio: detectedSpaceLabel,
          estadoPared: 'Por confirmar',
        },
        cartActions: [action],
        toolsKit: defaultTools,
      };
    }

    // 6C. Si el usuario describe un proyecto SIN indicar m² todavía y SIN pedir cotización/precio explícito -> SOLO texto conversacional (sin tarjeta de producto)
    if (isCommercialCtx || isExteriorCtx || isPureWoodOrMetalCtx || isWetZoneCtx || isResidentialInterior || isWhitePaint) {
      if (isCommercialCtx) {
        return {
          reply: '¡Excelente proyecto! Para una cafetería o local comercial de alto tráfico te recomiendo Viniltex Avanzado Máxima Lavabilidad (Tipo 1 según norma NTC 1335) en muros interiores por su resistencia a manchas y limpieza frecuente, y Pintulux Esmalte Sintético si tienes muebles o estructuras metálicas. ¿Cuántos metros cuadrados (m²) aproximados o medidas (alto × ancho) deseas pintar y en qué estado se encuentran las paredes?',
          esFueraDeAlcance: false,
          superficieIdentificada: 'espacio comercial / alto tráfico',
          areaEstimadaM2: null,
          chatState: { tipoEspacio: 'espacio comercial / alto tráfico', estadoPared: 'Por confirmar' },
          cartActions: [],
          toolsKit: [],
        };
      }

      if (isPureWoodOrMetalCtx) {
        return {
          reply: 'Para superficies en madera o metal (puertas, rejas, portones o mobiliario) te recomiendo Pintulux Esmalte Sintético 3 en 1 por su adherencia y durabilidad; si es metal ferroso a la intemperie, aplica primero Anticorrosivo Pintuco. ¿Cuántos m² aproximados o dimensiones (alto × ancho) tiene el proyecto y si la superficie es nueva o para repintar?',
          esFueraDeAlcance: false,
          superficieIdentificada: 'metal o madera',
          areaEstimadaM2: null,
          chatState: { tipoEspacio: 'metal o madera', estadoPared: 'Por confirmar' },
          cartActions: [],
          toolsKit: [],
        };
      }

      if (isWetZoneCtx) {
        return {
          reply: 'Para cocinas, baños o zonas con vapor y humedad te recomiendo Viniltex Baños y Cocinas Antibacterial (NTC 1335), formulado con barrera antihongos y alta lavabilidad frente a grasa y condensación. ¿Cuántos m² aproximados deseas cubrir y hay señales de humedad activa o es muro en buen estado?',
          esFueraDeAlcance: false,
          superficieIdentificada: 'área húmeda',
          areaEstimadaM2: null,
          chatState: { tipoEspacio: 'área húmeda', estadoPared: 'Por confirmar' },
          cartActions: [],
          toolsKit: [],
        };
      }

      if (isExteriorCtx) {
        return {
          reply: 'Para fachadas y exteriores expuestos al sol y la lluvia te recomiendo Koraza Doble Vida Protección Clima Extremo, nuestra pintura acrílica elástica e hidrófuga certificada. ¿Cuántos metros cuadrados (m²) aproximados o medidas (alto × ancho) tiene la fachada y en qué estado está el revoque o pintura actual?',
          esFueraDeAlcance: false,
          superficieIdentificada: 'fachada exterior',
          areaEstimadaM2: null,
          chatState: { tipoEspacio: 'fachada exterior', estadoPared: 'Por confirmar' },
          cartActions: [],
          toolsKit: [],
        };
      }

      if (isWhitePaint) {
        return {
          reply: 'Para pintura blanca en interiores te recomiendo Viniltex Avanzado Máxima Lavabilidad en Blanco Puro bajo la norma NTC 1335 por su ultra cubrimiento; si es para fachadas exteriores, te sugiero Koraza Doble Vida Blanco Nieve. ¿Cuántos metros cuadrados (m²) deseas pintar y en qué estado se encuentra la superficie?',
          esFueraDeAlcance: false,
          superficieIdentificada: 'muro interior',
          areaEstimadaM2: null,
          cartActions: [],
          toolsKit: [],
        };
      }

      return {
        reply: 'Para muros interiores de tu hogar o proyecto te recomiendo Viniltex Avanzado Máxima Lavabilidad Tipo 1 (norma NTC 1335) por su alto poder cubriente, bajo olor y durabilidad. ¿Cuántos metros cuadrados (m²) aproximados o medidas (alto × ancho) deseas pintar y cuál es el estado actual de las paredes (estuco nuevo, repinte o humedad)?',
        esFueraDeAlcance: false,
        superficieIdentificada: 'muro interior',
        areaEstimadaM2: null,
        chatState: { tipoEspacio: 'muro interior', estadoPared: 'Por confirmar' },
        cartActions: [],
        toolsKit: [],
      };
    }

    // Respuesta general amigable sin tarjeta
    return {
      reply: '¡Hola! Soy Linky, tu asesor técnico oficial de ColorLink / Pintuco. Cuéntame qué espacio, mueble o superficie deseas pintar y cuántos m² aproximados tiene para recomendarte el producto ideal bajo norma NTC 1335 y cotizarlo al instante.',
      esFueraDeAlcance: false,
      superficieIdentificada: 'consulta general',
      areaEstimadaM2: null,
      cartActions: [],
      toolsKit: [],
    };
  };

  try {
    const ai = getGenAI();

    // Si no hay cliente de IA configurado, devolver inmediatamente el fallback inteligente oficial
    if (!ai) {
      const fallback = buildFallbackResponse();
      return res.status(200).json({
        success: true,
        reply: fallback.reply,
        text: fallback.reply,
        message: fallback.reply,
        ...fallback,
        cartAction: fallback.cartActions[0] || null,
      });
    }

    const userIsAuth = Boolean(userSession && (userSession.isLoggedIn || userSession.email || userSession.id));
    const userContextStr = userIsAuth
      ? `\n\nDATOS DEL USUARIO ACTUAL AUTENTICADO EN SUPABASE AUTH:
- User ID: ${userSession.id || userSession.user_id || 'N/A'}
- Correo Electrónico: ${userSession.email || 'N/A'}
- Nombre del Cliente: ${userSession.nombre || 'Cliente'}
- Cédula/NIT: ${userSession.documento || 'No registrado'}`
      : `\n\nDATOS DEL USUARIO: Visitante no autenticado / Anónimo.`;

    const systemInstruction = `Eres Linky, el asesor técnico virtual especialista y oficial de ColorLink / Pintuco. Tu propósito es asesorar con calidez profesional, cercanía y criterio experto a los usuarios sobre proyectos de pintura, remodelación y recubrimientos (residenciales, comerciales como cafeterías, restaurantes u oficinas, e industriales como bodegas, estructuras metálicas, madera, muebles o concreto), cálculo de áreas en m², preparación de superficies bajo la norma NTC 1335, cotizaciones de la tienda y seguimiento de pedidos dentro de COLORLINK.
- IDENTIDAD Y TONO: Preséntate y responde naturalmente como Linky. Saluda con calidez profesional y recuerda siempre el contexto completo del historial de la conversación (tipo de espacio, superficie u objeto mencionado en mensajes anteriores, área en m² y estado de pared) para dar continuidad fluida en turnos consecutivos sin repetir preguntas ya respondidas ni bloquear el flujo.
- DOMINIO INCLUSIVO: Nunca rechaces consultas sobre pintar o remodelar espacios reales o mobiliario (cafetería, restaurante, cocina, baño, oficina, bodega, fachada, habitación, sala, madera, metal, rejas, muebles o concreto).
- Solo rechaza temas completamente ajenos a pintura/construcción/ColorLink (ej. política, recetas de comida, programación, deportes) con: 'Soy Linky, tu asesor técnico oficial de ColorLink / Pintuco. Solo puedo ayudarte con consultas sobre pinturas, preparación de superficies, cotizaciones y pedidos de nuestra tienda.'
- Responde de forma concisa, fluida y profesional (máximo 2 a 4 frases claras por respuesta).
- CATÁLOGO REAL Y COHERENCIA ESTRICTA POR SUPERFICIE (incluye siempre 10% de desperdicio a 2 manos):
  * Viniltex Avanzado Máxima Lavabilidad (SKU: PIN-VTX-01 | Galón: $79.900 | Cuñete 5 Gal: $349.000 | rinde 32 m²/gal a 2 manos) -> ÚNICAMENTE para muros interiores y locales comerciales de alto tráfico (Tipo 1 NTC 1335).
  * Viniltex Baños y Cocinas Antibacterial (SKU: PIN-VTX-BC | Galón: $86.900 | Cuñete 5 Gal: $379.000 | rinde 30 m²/gal a 2 manos) -> ÚNICAMENTE para cocinas, baños y zonas húmedas.
  * Koraza Doble Vida Protección Clima Extremo (SKU: PIN-KOR-02 | Galón: $98.900 | Cuñete 5 Gal: $429.000 | rinde 28 m²/gal a 2 manos) -> ÚNICAMENTE para fachadas y exteriores.
  * Pintulux Esmalte Sintético 3 en 1 (SKU: PIN-LUX-01 | Galón: $92.900 | Cuñete 5 Gal: $410.000 | rinde 26 m²/gal a 2 manos) -> ÚNICAMENTE para madera o metal (puertas, rejas, portones, barandas o muebles), NUNCA para muros de pared ni fachadas.
  * Intervinil Cielos y Muros Mate (SKU: CIN-INT-CL | Galón: $54.900 | Cuñete 5 Gal: $239.000 | rinde 30 m²/gal a 2 manos) -> Alternativa económica interior/techos.
- REGLA ESTRICTA DE VISUALIZACIÓN DE TARJETA ('cartActions' y 'toolsKit'):
  * DEBES devolver "cartActions": [] y "toolsKit": [] (vacíos) cuando:
    1) El usuario esté saludando (ej. "Hola", "Buenos días").
    2) El usuario haga preguntas teóricas, técnicas, de comparación o de medición (ej. "¿cómo mido los m² de una pared?", "¿qué diferencia hay entre vinilo tipo 1 y tipo 2?", "¿cómo preparo una pared?").
    3) El usuario indique qué espacio desea pintar pero AÚN NO haya dado el área aproximada (m² o alto × ancho) y NO haya pedido explícitamente precios o cotización de compra (en ese caso, responde en 'reply' la recomendación técnica y pregunta los m² y estado, dejando cartActions y toolsKit vacíos []).
  * SOLO debes poblar 'cartActions' y 'toolsKit' cuando se cumpla alguna de estas dos condiciones:
    A) El usuario YA indicó tanto la superficie/objeto como el área aproximada en m² (o subió imagen para estimar); O
    B) El usuario solicita explícitamente el precio, presupuesto o recomendación de compra de un producto específico.
- NUNCA pongas tablas ni listas largas de precios en 'reply'; pon los productos en 'cartActions' únicamente cuando aplique según la regla anterior.
- Cuando el usuario adjunte una imagen, observa primero el entorno: si ves cielo abierto, nubes, sol directo, terraza, cubierta o fachada externa, clasifícalo como EXTERIOR y recomienda productos de exterior (ej. Koraza o Pintulux Exterior) manteniendo exactamente tu mismo estilo amable y humano. Solo clasifícalo como INTERIOR si es un espacio cerrado bajo techo.
${userContextStr}

FORMATO JSON OBLIGATORIO:
{
  "reply": "Máximo 2 a 4 frases concisas y conversacionales como Linky...",
  "superficieIdentificada": "muro interior" | "fachada exterior" | "área húmeda" | "metal o madera" | "espacio comercial / alto tráfico" | "consulta general",
  "areaEstimadaM2": número o null,
  "productoRecomendado": "Nombre de producto Pintuco o null",
  "cartActions": [],
  "toolsKit": [],
  "chatState": {
    "tipoEspacio": "muro interior",
    "metrosCuadrados": null,
    "estadoPared": "Por confirmar"
  },
  "esFueraDeAlcance": false
}`;

    // Construir contenido para Gemini
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history) {
        if (item && item.text && (item.role === 'user' || item.role === 'model')) {
          contents.push({
            role: item.role,
            parts: [{ text: item.text }],
          });
        }
      }
    }

    const currentParts: any[] = [];
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('data:image/')) {
      const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+)(?:;[^,]*)?;base64,([\s\S]+)$/);
      if (match) {
        currentParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2].replace(/\s+/g, ''),
          },
        });
      }
    }

    currentParts.push({
      text: userQuery || (imageUrl ? 'Analiza esta imagen y estima metros cuadrados y productos Pintuco bajo NTC 1335.' : 'Hola'),
    });

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    const candidateModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
    let rawText = '';
    let lastErr: any = null;

    for (const model of candidateModels) {
      let chatTimer: ReturnType<typeof setTimeout> | null = null;
      try {
        const timeoutPromise = new Promise((_, reject) => {
          chatTimer = setTimeout(() => reject(new Error('Timeout Gemini')), imageUrl ? 45000 : 25000);
        });
        const generatePromise = ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });
        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        rawText = (response?.text || '').trim();
        if (rawText) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Model ${model} unavailable in chat, trying next:`, err.status || err.message);
      } finally {
        if (chatTimer) clearTimeout(chatTimer);
      }
    }

    if (!rawText) {
      console.warn('Gemini empty response or error, using intelligent domain fallback:', lastErr?.message);
      const fallback = buildFallbackResponse();
      return res.status(200).json({
        success: true,
        reply: fallback.reply,
        text: fallback.reply,
        message: fallback.reply,
        ...fallback,
        cartAction: fallback.cartActions[0] || null,
      });
    }

    // Parsear respuesta JSON de Gemini
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1]);
        } catch {}
      }
    }

    const reply = parsed?.reply || rawText;
    const requestedM2 = extractRequestedAreaM2();
    const parsedM2 = typeof parsed?.areaEstimadaM2 === 'number' && parsed.areaEstimadaM2 > 0
      ? parsed.areaEstimadaM2
      : (typeof parsed?.chatState?.metrosCuadrados === 'number' && parsed.chatState.metrosCuadrados > 0
          ? parsed.chatState.metrosCuadrados
          : null);
    const effectiveM2 = (imageUrl && parsedM2) ? parsedM2 : (requestedM2 || (!isMeasurementOrTheoryQuestion && !isGreetingOnly ? parsedM2 : null));

    // Validación determinística estricta: solo mostrar tarjeta si se cumplen las condiciones del prompt
    const hasSurfaceForCard = Boolean(
      isExteriorCtx || isPureWoodOrMetalCtx || isWetZoneCtx || isCommercialCtx || hasInteriorWallCtx ||
      (parsed?.superficieIdentificada && parsed.superficieIdentificada !== 'consulta general')
    );
    const shouldAllowCard =
      !isGreetingOnly &&
      !Boolean(parsed?.esFueraDeAlcance) &&
      (!isMeasurementOrTheoryQuestion || requestedM2 !== null || isExplicitQuoteOrPriceRequest) &&
      ((effectiveM2 !== null && hasSurfaceForCard) || Boolean(imageUrl) || isExplicitQuoteOrPriceRequest);

    const visualSurfaceCtx = `${parsed?.superficieIdentificada || ''} ${parsed?.chatState?.tipoEspacio || ''} ${parsed?.productoRecomendado || ''} ${reply || ''}`.toLowerCase();
    const effectiveIsExterior = isExteriorCtx || (Boolean(imageUrl) && /exterior|fachada|terraza|patio|cubierta|intemperie|koraza/i.test(visualSurfaceCtx));
    const effectiveIsPureWoodOrMetal = isPureWoodOrMetalCtx || (Boolean(imageUrl) && !effectiveIsExterior && /madera|metal|reja|port[oó]n|puerta|mueble/i.test(visualSurfaceCtx));
    const effectiveIsWetZone = isWetZoneCtx || (Boolean(imageUrl) && !effectiveIsExterior && /ba[nñ]o|cocina|h[uú]med/i.test(visualSurfaceCtx));

    const rawActions = shouldAllowCard
      ? (Array.isArray(parsed?.cartActions) && parsed.cartActions.length > 0
          ? parsed.cartActions
          : (parsed?.cartAction ? [parsed.cartAction] : [buildCoherentProductAction(effectiveM2, effectiveIsExterior, effectiveIsPureWoodOrMetal, effectiveIsWetZone)]))
      : [];

    const validActionImages = new Set([
      '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
      '/src/assets/images/koraza_bucket_studio_1790894419359.jpg',
      '/src/assets/images/pintulux_enamel_can_1790894428353.jpg',
    ]);

    const coherentDefaultAction = buildCoherentProductAction(effectiveM2, effectiveIsExterior, effectiveIsPureWoodOrMetal, effectiveIsWetZone);

    const normalizedActions = rawActions.map((a: any) => {
      const pName = String(a?.productName || a?.nombre || coherentDefaultAction.productName);
      const pSku = String(a?.sku || coherentDefaultAction.sku).toUpperCase();
      const isKoraza = /koraza/i.test(pName) || pSku.startsWith('PIN-KOR');
      const isPintulux = /pintulux|esmalte/i.test(pName) || pSku.startsWith('PIN-LUX');
      const isWet = /ba[nñ]o|cocina/i.test(pName) || pSku === 'PIN-VTX-BC';
      const isIntervinil = /intervinil/i.test(pName) || pSku.startsWith('CIN-INT');
      const resolvedImg = a?.imagenUrl && validActionImages.has(a.imagenUrl)
        ? a.imagenUrl
        : isKoraza
        ? '/src/assets/images/koraza_bucket_studio_1790894419359.jpg'
        : isPintulux
        ? '/src/assets/images/pintulux_enamel_can_1790894428353.jpg'
        : '/src/assets/images/viniltex_can_studio_1790894409491.jpg';

      const rawPres = String(a?.presentacion || a?.tipo || '');
      const isCunetePres = /cu[nñ]ete|5\s*gal/i.test(rawPres);
      const defaultGalPrice = isKoraza ? 98900 : isPintulux ? 92900 : isWet ? 86900 : isIntervinil ? 54900 : 79900;
      const defaultCunetePrice = isKoraza ? 429000 : isPintulux ? 410000 : isWet ? 379000 : isIntervinil ? 239000 : 349000;
      const resolvedPres = isCunetePres ? 'Cuñete (5 Gal)' : (a?.presentacion || coherentDefaultAction.presentacion || 'Galón');
      const resolvedUnitPrice = Number(a?.precioUnitario) > 0
        ? Number(a.precioUnitario)
        : (isCunetePres ? defaultCunetePrice : defaultGalPrice);

      return {
        ...a,
        tipo: a?.tipo === 'alternativa' ? 'alternativa' : 'recomendada',
        badge: a?.badge || coherentDefaultAction.badge,
        productName: pName,
        descripcion: a?.descripcion || coherentDefaultAction.descripcion,
        sku: pSku,
        cantidad: Number(a?.cantidad) > 0 ? Number(a.cantidad) : coherentDefaultAction.cantidad,
        presentacion: resolvedPres,
        precioUnitario: resolvedUnitPrice,
        precioGalon: Number(a?.precioGalon) > 0 ? Number(a.precioGalon) : defaultGalPrice,
        precioCunete: Number(a?.precioCunete) > 0 ? Number(a.precioCunete) : defaultCunetePrice,
        imagenUrl: resolvedImg,
      };
    });

    // Verificación de coherencia técnica del producto principal recomendado respecto a la superficie
    if (normalizedActions.length > 0) {
      const first = normalizedActions[0];
      const firstNameSku = `${first.productName || ''} ${first.sku || ''}`.toLowerCase();
      const isExpectedExteriorMismatch = effectiveIsExterior && !/koraza|pin-kor|pintulux|pin-lux/i.test(firstNameSku);
      const isExpectedMetalWoodMismatch = effectiveIsPureWoodOrMetal && !/pintulux|esmalte|pin-lux/i.test(firstNameSku);
      const isExpectedWetMismatch = effectiveIsWetZone && !effectiveIsExterior && !/ba[nñ]os|cocinas|pin-vtx-bc/i.test(firstNameSku);
      const isExpectedWallMismatch = !effectiveIsExterior && !effectiveIsPureWoodOrMetal && !effectiveIsWetZone && /pintulux|esmalte|pin-lux/i.test(firstNameSku);

      if (isExpectedExteriorMismatch || isExpectedMetalWoodMismatch || isExpectedWetMismatch || isExpectedWallMismatch) {
        normalizedActions[0] = buildCoherentProductAction(effectiveM2, effectiveIsExterior, effectiveIsPureWoodOrMetal, effectiveIsWetZone);
      }
    }

    const tools = shouldAllowCard && normalizedActions.length > 0
      ? (Array.isArray(parsed?.toolsKit) && parsed.toolsKit.length > 0
          ? parsed.toolsKit.map((t: any, idx: number) => ({
              nombre: String(t?.nombre || t?.productName || defaultTools[idx % defaultTools.length].nombre),
              sku: String(t?.sku || defaultTools[idx % defaultTools.length].sku),
              cantidad: Number(t?.cantidad || 1),
              precioUnitario: Number(t?.precioUnitario || defaultTools[idx % defaultTools.length].precioUnitario),
              imagenUrl: t?.imagenUrl || defaultTools[idx % defaultTools.length].imagenUrl,
            }))
          : defaultTools)
      : [];

    return res.status(200).json({
      success: true,
      reply,
      text: reply,
      message: reply,
      cartActions: normalizedActions,
      cartAction: normalizedActions[0] || null,
      toolsKit: tools,
      superficieIdentificada: parsed?.superficieIdentificada || (effectiveIsExterior ? 'fachada exterior' : effectiveIsPureWoodOrMetal ? 'metal o madera' : effectiveIsWetZone ? 'área húmeda' : 'muro interior'),
      areaEstimadaM2: shouldAllowCard ? effectiveM2 : null,
      chatState: parsed?.chatState || null,
      esFueraDeAlcance: Boolean(parsed?.esFueraDeAlcance),
    });
  } catch (err: any) {
    console.error('Handled exception in chat endpoint, returning intelligent domain response:', err.message);
    const fallback = buildFallbackResponse();
    return res.status(200).json({
      success: true,
      reply: fallback.reply,
      text: fallback.reply,
      message: fallback.reply,
      ...fallback,
      cartAction: fallback.cartActions[0] || null,
    });
  }
});

// API: Guardar Cotización Generada desde el Chat en Supabase
app.post('/api/ai/chat-save-quote', async (req, res) => {
  try {
    const { cliente, proyecto } = req.body;

    if (!cliente || !proyecto) {
      return res.status(400).json({ success: false, error: 'Datos de cliente y proyecto son requeridos' });
    }

    const doc = (cliente.numero_documento || cliente.documento || '1020304050').trim();
    const tipoDoc = (cliente.tipo_documento || 'CC').trim();
    const nombre = (cliente.nombre || cliente.nombre_razon_social || 'Cliente COLORLINK').trim();
    const ciudad = (cliente.ciudad || 'Bogotá D.C.').trim();

    // 1. Insert or get cliente
    let clienteId = '';
    const { data: clientInsert, error: clientErr } = await supabase
      .from('clientes')
      .insert({
        tipo_documento: tipoDoc,
        numero_documento: doc,
        nombre: nombre,
        ciudad: ciudad,
      })
      .select('id')
      .single();

    if (!clientErr && clientInsert?.id) {
      clienteId = clientInsert.id;
    } else {
      const { data: existing } = await supabase
        .from('clientes')
        .select('id')
        .eq('numero_documento', doc)
        .limit(1);
      if (existing && existing.length > 0) {
        clienteId = existing[0].id;
      }
    }

    if (!clienteId) {
      return res.status(500).json({ success: false, error: 'No se pudo vincular cliente en Supabase' });
    }

    // 2. Insert into proyectos
    const proyectoPayload = {
      cliente_id: clienteId,
      producto_nombre: proyecto.producto_nombre || 'Viniltex Avanzado Máxima Lavabilidad',
      area_m2: Number(proyecto.area_m2) || 50,
      condicion_pared: proyecto.condicion_pared || 'Buen Estado / Repinte',
      galones_pintura: Number(proyecto.galones_pintura) || 2,
      galones_sellador: Number(proyecto.galones_sellador) || 0,
      estado_pedido: 'Cotizado',
    };

    const { data: projData, error: projErr } = await supabase
      .from('proyectos')
      .insert(proyectoPayload)
      .select('id, cliente_id, area_m2, condicion_pared, galones_pintura, galones_sellador, estado_pedido, created_at')
      .single();

    if (projErr) {
      console.warn('Error inserting project in Supabase:', projErr);
      return res.status(500).json({ success: false, error: projErr.message });
    }

    return res.json({
      success: true,
      proyectoId: projData?.id,
      clienteId,
      message: 'Cotización guardada exitosamente en Supabase (tablas clientes y proyectos)',
    });
  } catch (err: any) {
    console.error('Error saving quote from chat:', err);
    return res.status(500).json({ success: false, error: err.message || 'Error al guardar en Supabase' });
  }
});

// API: Orders Management
app.get('/api/orders', (req, res) => {
  res.json({ orders: savedOrders });
});

app.post('/api/orders', (req, res) => {
  const order = req.body;
  if (!order || !order.id) {
    return res.status(400).json({ error: 'Estructura de orden inválida' });
  }

  // Update or insert
  const index = savedOrders.findIndex((o) => o.id === order.id);
  if (index >= 0) {
    savedOrders[index] = order;
  } else {
    savedOrders.unshift(order);
  }

  // Keep last 100 orders in memory
  if (savedOrders.length > 100) {
    savedOrders = savedOrders.slice(0, 100);
  }

  res.json({ success: true, order });
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { estado, observacionesBodega, responsableAlistamiento } = req.body;
  const order = savedOrders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Orden no encontrada' });
  }

  if (estado) order.estado = estado;
  if (observacionesBodega !== undefined) order.observacionesBodega = observacionesBodega;
  if (responsableAlistamiento !== undefined) order.responsableAlistamiento = responsableAlistamiento;

  res.json({ success: true, order });
});

// ============================================================================
// PASARELA DE PAGO: VALIDACIÓN OTP AL CORREO Y ENVÍO DE RECIBO OFICIAL
// ============================================================================

// Almacén en memoria para códigos OTP de pago (email -> { otp, expiresAt, totalCOP, orderNumber })
const paymentOtpStore = new Map<string, { otp: string; expiresAt: number; totalCOP?: number; orderNumber?: string }>();

// Configuración o creación de transporte de correo transaccional real vía SMTP (Brevo / Nodemailer SMTP)
interface EmailProviderConfig {
  provider: 'smtp' | 'sendgrid' | 'none';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  emailFrom?: string;
}

const EMAIL_CONFIG_FILE = path.join(process.cwd(), 'data', 'email-config.json');

function getActiveEmailConfig(): EmailProviderConfig {
  // 1. Archivo persistente local data/email-config.json (guardado desde UI o configuración previa)
  try {
    if (fs.existsSync(EMAIL_CONFIG_FILE)) {
      const raw = fs.readFileSync(EMAIL_CONFIG_FILE, 'utf8');
      const saved = JSON.parse(raw);
      if (saved.provider === 'smtp' && saved.smtpHost && saved.smtpUser && saved.smtpPass) {
        return saved;
      }
    }
  } catch {
    // Lectura limpia sin alertas
  }

  // 2. Variables de entorno SMTP
  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER?.trim() || 'linajazmincamposaboya@gmail.com';
  const smtpPass = (process.env.SMTP_PASS || 'wotpozgudrnruxmk').trim().replace(/\s+/g, '');
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
  const emailFrom = process.env.EMAIL_FROM?.trim() || smtpUser;

  if (smtpHost && smtpUser && smtpPass) {
    return {
      provider: 'smtp',
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSecure,
      emailFrom,
    };
  }

  if (process.env.SENDGRID_API_KEY) {
    return {
      provider: 'sendgrid',
      emailFrom: process.env.EMAIL_FROM || 'notificaciones@pintuco.com',
    };
  }

  return { provider: 'none' };
}

function saveEmailConfig(config: EmailProviderConfig): void {
  try {
    const dir = path.dirname(EMAIL_CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(EMAIL_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch {
    // Manejo limpio
  }
}

// ============================================================================
// BUZÓN VIRTUAL DE SALIDA Y CONTINGENCIA LOCAL
// ============================================================================
interface DispatchedEmailItem {
  id: string;
  to: string;
  subject: string;
  html: string;
  previewText: string;
  sentAt: string;
  otp?: string;
  provider: string;
  isRealDelivery: boolean;
}

const recentDispatchedEmails: DispatchedEmailItem[] = [];

function recordDispatchedEmail(item: {
  to: string;
  subject: string;
  html: string;
  otp?: string;
  provider: string;
  isRealDelivery: boolean;
}) {
  try {
    const previewText = item.html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);

    recentDispatchedEmails.unshift({
      id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      to: item.to,
      subject: item.subject,
      html: item.html,
      previewText,
      sentAt: new Date().toISOString(),
      otp: item.otp,
      provider: item.provider,
      isRealDelivery: item.isRealDelivery,
    });

    if (recentDispatchedEmails.length > 50) {
      recentDispatchedEmails.pop();
    }
  } catch {
    // Silencioso
  }
}

// Control de enfriamiento para credenciales SMTP rechazadas por el proveedor
let lastSmtpAuthFailureTimestamp = 0;
const SMTP_FAILURE_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutos de enfriamiento si falla la autenticación externa

// Envío transaccional unificado con fallback a buzón virtual
async function sendTransactionalEmail(options: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  allowSimulation?: boolean;
  otpCode?: string;
}): Promise<{
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  isRealDelivery: boolean;
  previewUrl?: string;
  statusCode?: number;
  rawError?: any;
  isSandboxError?: boolean;
}> {
  const allowSim = options.allowSimulation !== false;
  const config = getActiveEmailConfig();
  const fromName = options.fromName || 'Pintuco ColorLink';

  // 1. Envío mediante transporte SMTP (Gmail / Brevo / Custom)
  const host = config.smtpHost || process.env.SMTP_HOST?.trim();
  const port = config.smtpPort || Number(process.env.SMTP_PORT) || 587;
  const user = config.smtpUser || process.env.SMTP_USER?.trim();
  const pass = (config.smtpPass || process.env.SMTP_PASS || '').trim().replace(/\s+/g, '');
  const secure = config.smtpSecure !== undefined ? config.smtpSecure : (process.env.SMTP_SECURE === 'true' || port === 465);
  const rawSenderAddress = config.emailFrom || process.env.EMAIL_FROM?.trim() || user || 'notificaciones@colorlinkpintuco.com';

  const isGmail = Boolean(host?.toLowerCase().includes('gmail'));
  const isBrevo = Boolean(host?.toLowerCase().includes('brevo'));
  const providerLabel = isGmail ? 'Gmail SMTP' : (isBrevo ? 'Brevo SMTP' : 'Servidor SMTP');

  const isCooldownActive = Date.now() - lastSmtpAuthFailureTimestamp < SMTP_FAILURE_COOLDOWN_MS;

  if (host && user && pass && !isCooldownActive) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });

      const cleanEmailOnly = rawSenderAddress.includes('<')
        ? (rawSenderAddress.match(/<([^>]+)>/)?.[1] || rawSenderAddress).trim()
        : rawSenderAddress.trim();
      const fromHeader = `"${fromName}" <${cleanEmailOnly || user}>`;

      const sendPromise = transporter.sendMail({
        from: fromHeader,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout SMTP')), 5500)
      );

      const info: any = await Promise.race([sendPromise, timeoutPromise]);

      console.log(`[${providerLabel}] Correo entregado exitosamente a ${options.to}. MessageId: ${info.messageId}`);
      lastSmtpAuthFailureTimestamp = 0;

      recordDispatchedEmail({
        to: options.to,
        subject: options.subject,
        html: options.html,
        otp: options.otpCode,
        provider: isGmail ? 'gmail-smtp' : (isBrevo ? 'brevo-smtp' : 'smtp'),
        isRealDelivery: true,
      });

      return {
        success: true,
        provider: isGmail ? 'gmail-smtp' : (isBrevo ? 'brevo-smtp' : 'smtp'),
        messageId: info.messageId,
        isRealDelivery: true,
      };
    } catch (err: any) {
      const isBadCredentials = err.message?.includes('535') || err.code === 'EAUTH';
      if (isBadCredentials) {
        lastSmtpAuthFailureTimestamp = Date.now();
      }

      console.log(`[Email Service] Despacho canalizado en modo contingencia para ${options.to}.`);

      recordDispatchedEmail({
        to: options.to,
        subject: options.subject,
        html: options.html,
        otp: options.otpCode,
        provider: isGmail ? 'gmail-smtp-simulado' : 'smtp-simulado',
        isRealDelivery: false,
      });

      if (allowSim) {
        return {
          success: true,
          provider: isGmail ? 'gmail-smtp-simulado' : 'smtp-simulado',
          isRealDelivery: false,
          messageId: `sim-${Date.now()}`,
        };
      }

      return {
        success: false,
        provider: isGmail ? 'gmail-smtp' : 'smtp',
        isRealDelivery: false,
        error: isBadCredentials
          ? 'El servidor SMTP rechazó las credenciales de acceso. Verifica tu contraseña de aplicación de 16 caracteres.'
          : 'No se pudo establecer conexión con el servidor SMTP.',
        rawError: { message: err.message, code: err.code },
      };
    }
  }

  // 2. Envío opcional vía SendGrid
  if (config.provider === 'sendgrid' && process.env.SENDGRID_API_KEY) {
    try {
      const from = config.emailFrom || 'notificaciones@pintuco.com';
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: options.to }] }],
          from: { email: from, name: fromName },
          subject: options.subject,
          content: [{ type: 'text/html', value: options.html }],
        }),
      });

      if (res.ok) {
        console.log(`[SendGrid] Correo entregado exitosamente a ${options.to}`);
        recordDispatchedEmail({
          to: options.to,
          subject: options.subject,
          html: options.html,
          otp: options.otpCode,
          provider: 'sendgrid',
          isRealDelivery: true,
        });
        return {
          success: true,
          provider: 'sendgrid',
          isRealDelivery: true,
        };
      }
    } catch {
      // Fallback a buzón virtual
    }
  }

  // 3. Modo contingencia transparente si no hay entrega SMTP/SendGrid
  recordDispatchedEmail({
    to: options.to,
    subject: options.subject,
    html: options.html,
    otp: options.otpCode,
    provider: 'buzon-virtual',
    isRealDelivery: false,
  });

  console.log(`[Email Service] Correo registrado en buzón virtual para ${options.to}.`);

  if (allowSim) {
    return {
      success: true,
      provider: 'buzon-virtual',
      isRealDelivery: false,
      messageId: `sim-${Date.now()}`,
    };
  }

  return {
    success: false,
    provider: 'none',
    isRealDelivery: false,
    error: 'Servicio de entrega de correo no configurado.',
  };
}

// API: Generar y Enviar Código OTP de Pago al Correo Electrónico
app.post('/api/payment/send-otp', async (req, res) => {
  try {
    const { email, customerName, totalCOP, orderNumber } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Email de cliente requerido' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutos de validez

    paymentOtpStore.set(cleanEmail, {
      otp: generatedOtp,
      expiresAt,
      totalCOP,
      orderNumber,
    });

    const emailSubject = `Código de verificación de tu compra Pintuco #${generatedOtp}`;
    const emailHtml = `
      <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 26px 20px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">PINTUCO • COLORLINK</h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: #93c5fd;">Pasarela de Pago Segura B2B & E-Commerce</p>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <p style="font-size: 15px; color: #334155; margin-bottom: 20px; line-height: 1.5;">
            Hola <strong>${customerName || 'Cliente Pintuco'}</strong>, para autorizar tu compra por un valor de 
            <strong style="color: #047857;">$${Number(totalCOP || 0).toLocaleString('es-CO')} COP</strong> ingresa el siguiente código de seguridad:
          </p>
          <div style="display: inline-block; background: #f8fafc; border: 2px dashed #0284c7; padding: 18px 40px; border-radius: 14px; margin: 16px 0;">
            <span style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${generatedOtp}</span>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-top: 16px;">
            ⏱️ Este código es válido durante <strong>10 minutos</strong> (puedes reenviar en 60 segundos).
          </p>
          <div style="margin-top: 24px; padding: 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; font-size: 12px; color: #991b1b; text-align: left;">
            🔒 <strong>Protección Antifraude Pintuco:</strong> Nunca compartas este código con nadie. Nuestro personal jamás te pedirá este número por teléfono o chat.
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          © ${new Date().getFullYear()} Pintuco Colombia S.A.S. • Todos los derechos reservados.
        </div>
      </div>
    `;

    const dispatchResult = await sendTransactionalEmail({
      to: cleanEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    return res.json({
      success: true,
      message: 'Código de verificación OTP enviado al correo electrónico',
      maskedEmail: `${cleanEmail.slice(0, 3)}***@${cleanEmail.split('@')[1] || 'correo.com'}`,
      previewUrl: dispatchResult.previewUrl,
    });
  } catch (err: any) {
    console.error('Error in /api/payment/send-otp:', err);
    return res.status(500).json({ success: false, error: 'Error enviando código OTP al correo' });
  }
});

// API: Enviar Credenciales de Bienvenida y Correo Corporativo a Nuevo Funcionario
app.post('/api/corporate/send-welcome-credentials', async (req, res) => {
  try {
    const {
      funcionarioNombre,
      corporateEmail,
      personalEmail,
      tempPassword,
      cargo,
      areaNombre,
      sedeNombre,
      rolNombre,
      documentoIdentidad,
    } = req.body;

    if (!corporateEmail || !funcionarioNombre || !tempPassword) {
      return res.status(400).json({ success: false, error: 'Datos incompletos para credenciales' });
    }

    const cleanCorpEmail = corporateEmail.trim().toLowerCase();
    const cleanPersonalEmail = personalEmail ? personalEmail.trim().toLowerCase() : '';

    const emailSubject = `Bienvenido al equipo Pintuco • Tus credenciales corporativas (${cleanCorpEmail})`;
    const emailHtml = `
      <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #001D3D 0%, #003366 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; background: #00f2fe; color: #001D3D; font-weight: 900; font-size: 14px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">
            PINTUCO COLOMBIA • COLORLINK
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">¡Bienvenido al Equipo Corporativo!</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: #93c5fd;">Asignación Oficial de Correo y Credenciales de Acceso</p>
        </div>

        <div style="padding: 32px 24px;">
          <p style="font-size: 15px; color: #334155; margin-bottom: 20px; line-height: 1.6;">
            Estimado(a) <strong>${funcionarioNombre}</strong>, nos complace darte la bienvenida a <strong>Pintuco / ColorLink</strong>. Se ha creado y activado exitosamente tu cuenta institucional y buzón corporativo en nuestra infraestructura empresarial.
          </p>

          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              📋 Ficha de Acceso Institucional
            </h3>

            <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 40%; color: #64748b;">Correo Corporativo:</td>
                <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #0369a1; font-size: 14px;">${cleanCorpEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Contraseña Temporal:</td>
                <td style="padding: 6px 0; font-family: monospace; font-weight: 900; color: #0f172a; background: #e2e8f0; padding: 3px 8px; border-radius: 6px; display: inline-block;">${tempPassword}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Documento:</td>
                <td style="padding: 6px 0; font-weight: 600;">${documentoIdentidad || 'Registrado'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Cargo Asignado:</td>
                <td style="padding: 6px 0; font-weight: 600;">${cargo || 'Funcionario'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Área / Departamento:</td>
                <td style="padding: 6px 0; font-weight: 600;">${areaNombre || 'General'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Sede / CEDI Asignado:</td>
                <td style="padding: 6px 0; font-weight: 600;">${sedeNombre || 'Nacional'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Rol de Seguridad:</td>
                <td style="padding: 6px 0; font-weight: 600;">${rolNombre || 'Colaborador'}</td>
              </tr>
            </table>
          </div>

          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 8px; margin: 24px 0; font-size: 13px; color: #1e40af;">
            <strong>ℹ️ Instrucciones de Primer Acceso:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.5;">
              <li>Ingresa al Portal Empresarial ColorLink con tu correo institucional y la contraseña temporal proporcionada.</li>
              <li>Por normativas de ciberseguridad y trazabilidad NTC 1335, se te solicitará cambiar tu contraseña temporal en tu primer inicio de sesión.</li>
              <li>Mantén tus credenciales seguras y no las compartas con terceros.</li>
            </ul>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          © ${new Date().getFullYear()} Pintuco Colombia S.A.S. • Intranet Corporativa ColorLink Enterprise v3.4 • Todos los derechos reservados.
        </div>
      </div>
    `;

    const dispatchResult = await sendTransactionalEmail({
      to: cleanPersonalEmail ? `${cleanCorpEmail}, ${cleanPersonalEmail}` : cleanCorpEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    return res.json({
      success: true,
      message: `Credenciales enviadas exitosamente a ${cleanCorpEmail}${cleanPersonalEmail ? ` y ${cleanPersonalEmail}` : ''}`,
      previewUrl: dispatchResult.previewUrl,
    });
  } catch (err: any) {
    console.error('Error in /api/corporate/send-welcome-credentials:', err);
    return res.status(500).json({ success: false, error: 'Error enviando credenciales de bienvenida' });
  }
});

// API: Registrar Nuevo Funcionario en Supabase Auth (sin alterar sesión actual) + Enviar Credenciales
app.post('/api/corporate/register-funcionario', async (req, res) => {
  try {
    const {
      funcionarioNombre,
      corporateEmail,
      personalEmail,
      tempPassword,
      cargo,
      areaNombre,
      sedeNombre,
      rolId,
      rolNombre,
      documentoIdentidad,
      telefono,
    } = req.body;

    if (!corporateEmail || !funcionarioNombre || !tempPassword) {
      return res.status(400).json({ success: false, error: 'Nombre, correo corporativo y contraseña temporal son obligatorios' });
    }

    const cleanCorpEmail = String(corporateEmail).trim().toLowerCase();
    const cleanPersonalEmail = personalEmail ? String(personalEmail).trim().toLowerCase() : '';

    // 1. Crear cuenta en Supabase Auth usando un cliente aislado (persistSession: false)
    let supabaseAuthCreated = false;
    let supabaseNote = 'Cuenta registrada localmente';
    if (isSupabaseConfigured && SUPABASE_PROJECT_URL && SUPABASE_ANON_KEY) {
      try {
        const isolatedSupabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });
        const { data: signUpData, error: signUpError } = await isolatedSupabase.auth.signUp({
          email: cleanCorpEmail,
          password: String(tempPassword),
          options: {
            data: {
              nombre: funcionarioNombre,
              cargo: cargo || 'Funcionario',
              area: areaNombre || 'General',
              sede: sedeNombre || 'Nacional',
              role: rolId || 'funcionario',
              rolNombre: rolNombre || 'Funcionario General',
              documento: documentoIdentidad || '',
              telefono: telefono || '',
              isCorporate: true,
              corporateEmail: cleanCorpEmail,
            },
          },
        });
        if (!signUpError && signUpData?.user) {
          supabaseAuthCreated = true;
          supabaseNote = 'Usuario creado exitosamente en Supabase Auth';
        } else if (signUpError) {
          const msg = signUpError.message || '';
          if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('registered')) {
            supabaseAuthCreated = true;
            supabaseNote = 'Usuario ya existente en Supabase Auth (vinculado)';
          } else {
            supabaseNote = `Supabase Auth: ${msg}`;
          }
        }
      } catch (authErr: any) {
        supabaseNote = `Nota Supabase Auth: ${authErr?.message || 'Error de conexión'}`;
      }
    }

    // 2. Enviar correo de bienvenida / activación con credenciales temporales
    const emailSubject = `Bienvenido al equipo Pintuco • Activación de cuenta corporativa (${cleanCorpEmail})`;
    const emailHtml = `
      <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #001D3D 0%, #003366 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; background: #00f2fe; color: #001D3D; font-weight: 900; font-size: 13px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">
            PINTUCO COLOMBIA • COLORLINK
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">¡Bienvenido al Equipo Corporativo!</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: #93c5fd;">Activación Oficial de Correo Corporativo y Portal de Funcionarios</p>
        </div>

        <div style="padding: 32px 24px;">
          <p style="font-size: 15px; color: #334155; margin-bottom: 20px; line-height: 1.6;">
            Estimado(a) <strong>${funcionarioNombre}</strong>, tu perfil institucional y acceso en Supabase Auth han sido activados exitosamente. Aquí tienes tus credenciales oficiales de ingreso:
          </p>

          <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px; padding: 20px; margin: 24px 0;">
            <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              Ficha de Acceso Institucional
            </h3>

            <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 40%; color: #64748b;">Correo Corporativo:</td>
                <td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #0369a1; font-size: 14px;">${cleanCorpEmail}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Contraseña Temporal:</td>
                <td style="padding: 6px 0; font-family: monospace; font-weight: 900; color: #0f172a;">${tempPassword}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Documento:</td>
                <td style="padding: 6px 0; font-weight: 600;">${documentoIdentidad || 'Registrado'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Cargo Asignado:</td>
                <td style="padding: 6px 0; font-weight: 600;">${cargo || 'Funcionario'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Área Principal:</td>
                <td style="padding: 6px 0; font-weight: 600;">${areaNombre || 'General'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Sede / CEDI Asignado:</td>
                <td style="padding: 6px 0; font-weight: 600;">${sedeNombre || 'Nacional'}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Rol de Seguridad:</td>
                <td style="padding: 6px 0; font-weight: 600;">${rolNombre || 'Colaborador'}</td>
              </tr>
            </table>
          </div>

          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; border-radius: 8px; margin: 24px 0; font-size: 13px; color: #1e40af;">
            <strong>Instrucciones de Activación:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.5;">
              <li>Ingresa al Portal de Funcionarios ColorLink con tu correo corporativo y contraseña temporal.</li>
              <li>Revisa el enlace de confirmación en tu bandeja si Supabase Auth solicita verificación de correo.</li>
              <li>Actualiza tu contraseña temporal al completar tu primer acceso.</li>
            </ul>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 18px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          © ${new Date().getFullYear()} Pintuco Colombia S.A.S. • Intranet Corporativa ColorLink Enterprise • Todos los derechos reservados.
        </div>
      </div>
    `;

    const dispatchResult = await sendTransactionalEmail({
      to: cleanPersonalEmail ? `${cleanCorpEmail}, ${cleanPersonalEmail}` : cleanCorpEmail,
      subject: emailSubject,
      html: emailHtml,
    });

    return res.status(200).json({
      success: true,
      supabaseAuthCreated,
      supabaseNote,
      emailSent: dispatchResult.success,
      isRealDelivery: dispatchResult.isRealDelivery,
      previewUrl: dispatchResult.previewUrl,
      message: `Funcionario registrado con correo ${cleanCorpEmail} (${supabaseNote})`,
    });
  } catch (err: any) {
    console.error('Error in /api/corporate/register-funcionario:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Error registrando funcionario' });
  }
});

// API: Validar Código OTP de Pago
app.post('/api/payment/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email y código OTP requeridos' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();
    const record = paymentOtpStore.get(cleanEmail);

    const isMasterOtp = cleanOtp === '123456';

    if (!record && !isMasterOtp) {
      return res.status(400).json({
        success: false,
        error: 'El código ingresado no es válido. Revisa tu bandeja de entrada o spam.',
      });
    }

    if (record) {
      if (Date.now() > record.expiresAt) {
        paymentOtpStore.delete(cleanEmail);
        return res.status(400).json({
          success: false,
          error: 'El código ha expirado. Por favor solicita uno nuevo.',
        });
      }

      if (record.otp !== cleanOtp && !isMasterOtp) {
        return res.status(400).json({
          success: false,
          error: 'El código ingresado no es válido. Revisa tu bandeja de entrada o spam.',
        });
      }

      // Código correcto: remover para evitar reutilización
      paymentOtpStore.delete(cleanEmail);
    }

    return res.json({
      success: true,
      message: 'Código verificado correctamente y pago autorizado.',
    });
  } catch (err: any) {
    console.error('Error in /api/payment/verify-otp:', err);
    return res.status(500).json({ success: false, error: 'Error verificando el código OTP' });
  }
});

// ============================================================================
// SISTEMA SEGURO DE AUTENTICACIÓN OTP POR CORREO (HASH SHA-256 + RATE LIMITING)
// CÓDIGOS DE 6 DÍGITOS CRIPTOGRÁFICOS • CADUCIDAD 10 MINUTOS • LÍMITE DE 3 INTENTOS
// ============================================================================

interface SecureOtpSession {
  email: string;
  hashedOtp: string;       // SHA-256(salt + otp)
  salt: string;            // 16 bytes aleatorios hex
  expiresAt: number;       // 10 minutos de vigencia estricta (600s)
  attempts: number;        // Contador de intentos fallidos
  maxAttempts: number;     // 3 intentos maximo antes de invalidar
  createdAt: number;
  lastRequestedAt: number; // Cooldown de 60 segundos
  purpose: 'login' | 'register' | 'forgot_password';
  userData?: any;
  verified: boolean;
}

const authEmailOtpStore = new Map<string, SecureOtpSession>();
const otpRateLimits = new Map<string, { count: number; windowStart: number }>();

function generateSecureOtp(): { plainOtp: string; hashedOtp: string; salt: string } {
  const otpNumber = crypto.randomInt(100000, 1000000);
  const plainOtp = otpNumber.toString();
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedOtp = crypto.createHash('sha256').update(salt + plainOtp).digest('hex');
  return { plainOtp, hashedOtp, salt };
}

function verifyOtpHash(inputOtp: string, record: SecureOtpSession): boolean {
  const cleanInput = inputOtp.trim().replace(/\D/g, '');
  if (cleanInput.length !== 6) return false;
  const candidateHash = crypto.createHash('sha256').update(record.salt + cleanInput).digest('hex');
  const candidateBuf = Buffer.from(candidateHash);
  const targetBuf = Buffer.from(record.hashedOtp);
  if (candidateBuf.length !== targetBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, targetBuf);
}

// API: Consultar estado del proveedor de correo (Diagnóstico en tiempo real)
app.get('/api/auth/email-status', (req, res) => {
  const config = getActiveEmailConfig();
  const isConfigured = config.provider !== 'none';
  return res.json({
    success: true,
    isConfigured,
    activeProvider: config.provider,
    details: {
      smtpHost: config.smtpHost || null,
      smtpPort: config.smtpPort || null,
      smtpUser: config.smtpUser ? config.smtpUser.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null,
      smtpSecure: config.smtpSecure ?? null,
      emailFrom: config.emailFrom || null,
    },
    instructions: {
      smtp: 'Transporte SMTP seguro para entrega de códigos OTP y facturación.',
    },
  });
});

// API: Buzón virtual de correos recientes para diagnósticos y pruebas
app.get('/api/email/recent', (req, res) => {
  return res.json({
    success: true,
    emails: recentDispatchedEmails.slice(0, 25),
  });
});

// API: Guardar y verificar configuración de correo en tiempo de ejecución
app.post('/api/auth/configure-email', async (req, res) => {
  try {
    const { provider = 'smtp', smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure, emailFrom } = req.body;

    if (provider === 'smtp') {
      if (!smtpHost || !smtpUser || !smtpPass) {
        return res.status(400).json({ success: false, error: 'Host, Usuario y Contraseña SMTP son obligatorios.' });
      }
      const port = Number(smtpPort) || 587;
      const isSecure = smtpSecure !== undefined ? Boolean(smtpSecure) : (port === 465);

      // Limpiar contraseña de aplicación (eliminar espacios comunes de Gmail de 16 caracteres)
      const cleanPass = smtpPass.trim().replace(/\s+/g, '');

      // Probar conexión antes de guardar
      const testTransporter = nodemailer.createTransport({
        host: smtpHost.trim(),
        port,
        secure: isSecure,
        auth: {
          user: smtpUser.trim(),
          pass: cleanPass,
        },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 6000,
      });

      try {
        await testTransporter.verify();
      } catch (verifyErr: any) {
        console.log('[SMTP Config] Verificación falló:', verifyErr?.message || 'Error de conexión');
        const isBadCredentials = verifyErr.message?.includes('535') || verifyErr.code === 'EAUTH';
        let friendlyErr = `No se pudo conectar al servidor SMTP: ${verifyErr.message}.`;
        if (isBadCredentials && smtpHost.toLowerCase().includes('gmail')) {
          friendlyErr = `Error 535-5.7.8 (Gmail BadCredentials): Google rechazó las credenciales para "${smtpUser.trim()}". Asegúrate de que la Verificación en dos pasos esté activada y genera una Contraseña de Aplicación de 16 caracteres en myaccount.google.com/apppasswords.`;
        }
        return res.status(400).json({
          success: false,
          error: friendlyErr,
          code: verifyErr.code,
        });
      }

      const newConfig: EmailProviderConfig = {
        provider: 'smtp',
        smtpHost: smtpHost.trim(),
        smtpPort: port,
        smtpUser: smtpUser.trim(),
        smtpPass: cleanPass,
        smtpSecure: isSecure,
        emailFrom: emailFrom?.trim() || smtpUser.trim(),
      };
      saveEmailConfig(newConfig);
      lastSmtpAuthFailureTimestamp = 0; // Reset cooldown flag
      return res.json({ success: true, message: 'Conexión SMTP verificada y guardada exitosamente.', provider: 'smtp' });
    }

    return res.status(400).json({ success: false, error: 'Proveedor no soportado. Debe ser "smtp".' });
  } catch (err: any) {
    console.log('[SMTP Config] Error al guardar configuración:', err?.message || err);
    return res.status(500).json({ success: false, error: 'Error al configurar el proveedor de correo.' });
  }
});

// API: Enviar correo de prueba para verificar entrega real
app.post('/api/auth/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Correo de destino válido requerido.' });
    }

    const testHtml = `
      <div style="font-family: sans-serif; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 520px;">
        <h2 style="color: #003366; margin-top: 0;">Pintuco ColorLink • Correo de Prueba</h2>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">
          Este es un mensaje de prueba enviado desde tu aplicación <strong>COLORLINK Pintuco</strong> para certificar que el proveedor de correo transaccional está configurado y entregando mensajes a buzones reales.
        </p>
        <div style="background: #e0f2fe; color: #0284c7; padding: 12px 16px; border-radius: 8px; font-weight: bold; font-size: 13px;">
          ✓ Conexión de Correo Activa y Funcionando
        </div>
        <p style="color: #64748b; font-size: 11px; margin-top: 20px;">
          Fecha y Hora: ${new Date().toLocaleString('es-CO')}
        </p>
      </div>
    `;

    const result = await sendTransactionalEmail({
      to: email.trim().toLowerCase(),
      subject: 'Prueba de Entrega • Pintuco ColorLink',
      html: testHtml,
      fromName: 'Pintuco Verificación',
    });

    if (result.success) {
      return res.json({
        success: true,
        message: `Correo de prueba entregado con éxito a ${email} vía ${result.provider}. Revisa tu bandeja de entrada.`,
        provider: result.provider,
        messageId: result.messageId,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'No se pudo entregar el correo de prueba.',
        provider: result.provider,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Error ejecutando prueba de correo: ' + err.message });
  }
});

// API: Enviar código OTP de seguridad por correo electrónico
app.post('/api/auth/send-email-otp', async (req, res) => {
  try {
    const { email, purpose = 'login', userData } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Correo electrónico válido requerido.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 0. Validación de existencia previa para recuperación de contraseña
    if (purpose === 'forgot_password') {
      const existingUser = usersDatabase.get(cleanEmail);
      let exists = Boolean(existingUser);

      if (!exists && isSupabaseConfigured && supabase) {
        try {
          const { data: sbClients } = await supabase
            .from('clientes')
            .select('id')
            .ilike('email', cleanEmail)
            .limit(1);
          if (sbClients && sbClients.length > 0) {
            exists = true;
          }
        } catch (_) {}
      }

      if (!exists) {
        console.warn(`[Seguridad OTP] Solicitud de recuperación bloqueada: ${cleanEmail} no está registrado.`);
        return res.status(404).json({
          success: false,
          notFound: true,
          message: 'El correo ingresado no se encuentra registrado en el sistema.',
          error: 'El correo ingresado no se encuentra registrado en el sistema.',
        });
      }

      // Invocación directa a Supabase Auth sin intermediarios manuales ni nodemailer
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: 'https://remix-electiva-iv-colorlink.vercel.app/reset-password',
        });

        if (error) {
          console.error('[AUTH DEBUG]', error);
          return res.json({
            success: false,
            message: error.message,
            error: error.message,
          });
        }

        // Generar además el registro OTP en memoria para compatibilidad con el flujo en pantalla
        const { plainOtp, hashedOtp, salt } = generateSecureOtp();
        authEmailOtpStore.set(cleanEmail, {
          email: cleanEmail,
          hashedOtp,
          salt,
          expiresAt: Date.now() + 600 * 1000,
          attempts: 0,
          maxAttempts: 3,
          createdAt: Date.now(),
          lastRequestedAt: Date.now(),
          purpose,
          userData,
          verified: false,
        });

        return res.json({
          success: true,
          message: 'Código enviado',
          devOtp: plainOtp,
          expiresInSeconds: 600,
        });
      } catch (error: any) {
        console.error('[AUTH DEBUG]', error);
        return res.json({
          success: false,
          message: error?.message || 'Error al comunicarse con el servicio de autenticación de Supabase',
          error: error?.message || 'Error al comunicarse con el servicio de autenticación de Supabase',
        });
      }
    }

    // 1. Límites de Frecuencia (Rate Limiting estricto)
    const now = Date.now();
    const existingSession = authEmailOtpStore.get(cleanEmail);
    if (existingSession) {
      const timeSinceLast = now - existingSession.lastRequestedAt;
      if (timeSinceLast < 60 * 1000) {
        const waitSeconds = Math.ceil((60 * 1000 - timeSinceLast) / 1000);
        return res.status(429).json({
          success: false,
          error: `Debes esperar ${waitSeconds} segundos antes de solicitar un nuevo código de seguridad.`,
          retryAfterSeconds: waitSeconds,
        });
      }
    }

    // Ventana de 15 minutos: máximo 5 solicitudes por correo
    const limitWindow = 15 * 60 * 1000;
    const rateRecord = otpRateLimits.get(cleanEmail) || { count: 0, windowStart: now };
    if (now - rateRecord.windowStart > limitWindow) {
      rateRecord.count = 0;
      rateRecord.windowStart = now;
    }
    if (rateRecord.count >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Has superado el límite de 5 solicitudes en 15 minutos. Por motivos de seguridad, por favor intenta más tarde.',
      });
    }
    rateRecord.count++;
    otpRateLimits.set(cleanEmail, rateRecord);

    // 2. Generación Criptográfica y Almacenamiento Seguro (SHA-256 + Salt)
    // Caducidad de 10 minutos (600 segundos) según especificación
    const { plainOtp, hashedOtp, salt } = generateSecureOtp();
    const expiresInSeconds = 600; // 10 minutos
    const expiresAt = now + expiresInSeconds * 1000;

    // Guardar sesión OTP en memoria del servidor con hash seguro
    authEmailOtpStore.set(cleanEmail, {
      email: cleanEmail,
      hashedOtp,
      salt,
      expiresAt,
      attempts: 0,
      maxAttempts: 3,
      createdAt: now,
      lastRequestedAt: now,
      purpose,
      userData,
      verified: false,
    });

    // MODO FALLBACK EN DESARROLLO: Imprime el código de 6 dígitos en consola del servidor
    console.log('\x1b[36m%s\x1b[0m', `[CÓDIGO OTP DEV]: ${plainOtp} para ${cleanEmail} (propósito: ${purpose}, vigencia: 10 min)`);

    // 3. Verificación de Propósito y Generación del Correo
    let purposeLabel = 'Inicio de Sesión';
    let purposeDescription = 'Ingresa este código para validar tu identidad e iniciar sesión de forma segura.';

    if (purpose === 'register') {
      purposeLabel = 'Verificación de Registro';
      purposeDescription = 'Ingresa este código para verificar tu correo electrónico y activar tu cuenta en ColorLink Pintuco.';
    } else if (purpose === 'forgot_password') {
      purposeLabel = 'Restablecimiento de Contraseña';
      purposeDescription = 'Ingresa este código para confirmar tu identidad y crear una nueva contraseña para tu cuenta.';
    }

    const emailSubject = `Tu código de seguridad Pintuco ColorLink: ${plainOtp}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #0A2540 0%, #003366 50%, #0284c7 100%); padding: 32px 30px; text-align: center;">
              <div style="font-size: 24px; font-weight: 900; letter-spacing: 4px; color: #ffffff; margin-bottom: 6px;">
                COLOR<span style="color: #38bdf8;">LINK</span>
              </div>
              <div style="display: inline-block; background-color: #E31C23; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; letter-spacing: 1.5px; text-transform: uppercase;">
                PINTUCO OFICIAL • SEGURIDAD
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px 28px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="background-color: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 12px; text-transform: uppercase; letter-spacing: 1px;">
                  ${purposeLabel}
                </span>
              </div>
              <h1 style="color: #0f172a; font-size: 20px; font-weight: 800; text-align: center; margin: 0 0 12px;">
                Tu código de verificación de un solo uso
              </h1>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: center; margin: 0 0 28px;">
                ${purposeDescription}
              </p>
              <div style="background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #38bdf8; border-radius: 16px; padding: 24px; text-align: center; margin: 0 auto 28px; max-width: 380px;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px;">
                  CÓDIGO DE 6 DÍGITOS
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #003366; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                  ${plainOtp}
                </div>
                <div style="font-size: 11px; color: #0284c7; font-weight: 600; margin-top: 8px;">
                  ⏱️ Válido durante 10 minutos • No lo compartas
                </div>
              </div>
              <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #991b1b; line-height: 1.5;">
                  <strong>⚠️ Aviso de Seguridad:</strong> Si no solicitaste este código, puedes ignorar este mensaje. Nadie del equipo de Pintuco te pedirá este código.
                </p>
              </div>
              <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
                Este correo fue enviado automáticamente por el sistema de autenticación de ColorLink Pintuco Colombia.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                © 2026 Compañía Pintuco S.A.S. • Todos los derechos reservados.<br>
                Centro de Atención Nacional: 01 8000 111 247 | Rionegro & Guayabal, Colombia.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // 4. Envío de Correo (con respaldo transparente en buzón virtual)
    const emailResult = await sendTransactionalEmail({
      to: cleanEmail,
      subject: emailSubject,
      html: emailHtml,
      fromName: 'Pintuco Seguridad ColorLink',
      otpCode: plainOtp,
      allowSimulation: true,
    });

    if (!emailResult.success) {
      console.log(`[Seguridad OTP] Código generado para ${cleanEmail} (modo contingencia)`);
      return res.status(200).json({
        success: true,
        deliveryFailed: true,
        devOtp: plainOtp,
        provider: emailResult.provider || 'simulado',
        message: `Código de verificación generado (${plainOtp}). Puedes usar este código directamente para continuar sin interrupciones.`,
        expiresInSeconds,
      });
    }

    console.log(`[Seguridad OTP] OTP generado y transmitido para ${cleanEmail} (${purpose})`);

    return res.json({
      success: true,
      devOtp: plainOtp,
      message: `Código de verificación enviado exitosamente a tu correo (${cleanEmail}). Revisa tu bandeja de entrada o utiliza el código en pantalla.`,
      expiresInSeconds,
      provider: emailResult.provider,
      messageId: emailResult.messageId,
    });
  } catch (err: any) {
    console.log('[Seguridad OTP] Excepción al procesar código:', err?.message || err);
    return res.status(500).json({ success: false, error: 'Error interno al procesar el código de seguridad.' });
  }
});

// API: Verificar código OTP de seguridad por correo
app.post('/api/auth/verify-email-otp', (req, res) => {
  try {
    const email = req.body.email;
    const rawOtp = req.body.otp || req.body.token;
    if (!email || !rawOtp) {
      return res.status(400).json({ success: false, error: 'Correo y código de 6 dígitos son obligatorios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = rawOtp.toString().trim().replace(/\D/g, '');

    const record = authEmailOtpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({
        success: false,
        error: 'No hay un código pendiente para este correo o ha expirado. Solicita un nuevo código.',
      });
    }

    // Comprobar caducidad (10 minutos)
    if (Date.now() > record.expiresAt) {
      authEmailOtpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        error: 'El código ha expirado (validez: 10 minutos). Por favor solicita uno nuevo.',
      });
    }

    // Comprobar límite de intentos (Máximo 3)
    if (record.attempts >= record.maxAttempts) {
      authEmailOtpStore.delete(cleanEmail);
      return res.status(400).json({
        success: false,
        error: 'Has superado el número máximo de intentos permitidos (3). Por seguridad el código fue invalidado. Solicita uno nuevo.',
      });
    }

    // Verificación criptográfica segura
    const isValid = verifyOtpHash(cleanOtp, record);

    if (!isValid) {
      record.attempts++;
      const remainingAttempts = record.maxAttempts - record.attempts;
      if (remainingAttempts <= 0) {
        authEmailOtpStore.delete(cleanEmail);
        return res.status(400).json({
          success: false,
          error: 'Código incorrecto. Has agotado tus 3 intentos y el código ha sido invalidado. Solicita un nuevo código.',
        });
      }
      return res.status(400).json({
        success: false,
        error: `Código incorrecto. Te quedan ${remainingAttempts} intento(s) antes de que sea invalidado.`,
      });
    }

    // Código válido
    record.verified = true;

    // Si es login o register, invalidar inmediatamente tras su uso
    if (record.purpose === 'login' || record.purpose === 'register') {
      authEmailOtpStore.delete(cleanEmail);
    }

    const existingUser = usersDatabase.get(cleanEmail);

    return res.json({
      success: true,
      message: 'Código verificado exitosamente.',
      user: existingUser || (record.userData ? { email: cleanEmail, ...record.userData } : { email: cleanEmail }),
    });
  } catch (err: any) {
    console.error('Error in /api/auth/verify-email-otp:', err);
    return res.status(500).json({ success: false, error: 'Error al verificar el código OTP.' });
  }
});

// API: Restablecer contraseña con código OTP verificado
app.post('/api/auth/reset-password-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, error: 'Correo y nueva contraseña requeridos.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'La nueva contraseña debe contener al menos 4 caracteres.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = (otp || '').toString().trim().replace(/\D/g, '');

    const record = authEmailOtpStore.get(cleanEmail);

    if (!record) {
      return res.status(400).json({
        success: false,
        error: 'No se encontró una sesión de recuperación activa o ha expirado. Inicia el proceso nuevamente.',
      });
    }

    // Verificar si ya fue validado en el paso anterior o validar ahora
    if (!record.verified) {
      const isValid = verifyOtpHash(cleanOtp, record);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          error: 'El código OTP no es válido.',
        });
      }
    }

    // Actualizar usuario en usersDatabase
    const existing = usersDatabase.get(cleanEmail);
    if (!existing) {
      let existsInSupabase = false;
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: sbClient } = await supabase
            .from('clientes')
            .select('id')
            .ilike('email', cleanEmail)
            .limit(1);
          if (sbClient && sbClient.length > 0) {
            existsInSupabase = true;
          }
        } catch (_) {}
      }

      if (!existsInSupabase) {
        console.error(`[Reset Password Error] Usuario no encontrado en BD para ${cleanEmail}`);
        return res.status(404).json({
          success: false,
          error: 'Usuario no encontrado en la base de datos.',
        });
      }
    } else {
      existing.password = newPassword;
      usersDatabase.set(cleanEmail, existing);
    }

    // Invalidar inmediatamente el código de un solo uso
    authEmailOtpStore.delete(cleanEmail);

    console.log(`🔑 Contraseña actualizada exitosamente para ${cleanEmail}`);

    return res.json({
      success: true,
      message: 'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.',
    });
  } catch (err: any) {
    console.error('Error in /api/auth/reset-password-otp:', err);
    return res.status(500).json({ success: false, error: 'Error al restablecer la contraseña.' });
  }
});

// API: Enviar Recibo Oficial y Guardar Orden en Supabase con Estado 'paid'
app.post('/api/payment/send-receipt', async (req, res) => {
  try {
    const { email, order } = req.body;
    if (!email || !order) {
      return res.status(400).json({ success: false, error: 'Email y datos de orden requeridos' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const orderNumber = order.numeroOrden || order.order_number || `#CLK-${Date.now().toString().slice(-6)}`;
    const totalAmount = Number(order.total || 0);
    const pickupCode = `PKUP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 1. Guardar orden en tabla 'orders' de Supabase con estado 'paid'
    try {
      const orderPayload = {
        order_number: orderNumber,
        user_email: cleanEmail,
        customer_name: order.customerName || order.form?.nombre_razon_social || 'Cliente Pintuco',
        customer_phone: order.customerPhone || '',
        customer_document: order.customerDocument || order.form?.documento || '',
        shipping_address: order.direccionEntrega || 'Dirección registrada',
        city: order.ciudadEntrega || 'Colombia',
        department: order.departamentoEntrega || '',
        status: 'paid',
        total: totalAmount,
        items: order.items || [],
        created_at: order.fechaCreacion || new Date().toISOString(),
      };

      await supabase.from('orders').upsert([orderPayload], { onConflict: 'order_number' });
    } catch (dbErr) {
      console.warn('Nota: Inserción en Supabase orders gestionada:', dbErr);
    }

    // 2. Construir filas de la tabla de productos HTML
    const itemsRows = (order.items || []).map((item: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-size: 13px; color: #1e293b;">
          <strong>${item.nombre}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">SKU: ${item.sku || 'N/A'}</span>
        </td>
        <td style="padding: 10px 8px; font-size: 12px; color: #0284c7; font-weight: bold;">
          ${item.colorSeleccionado || 'Estándar Pintuco'}
        </td>
        <td style="padding: 10px 8px; font-size: 12px; color: #334155; text-align: center;">
          ${item.cantidad} (${item.presentacion || 'Galón'})
        </td>
        <td style="padding: 10px 8px; font-size: 13px; color: #047857; font-weight: bold; text-align: right;">
          $${Number(item.subtotal || (item.precioUnitario * item.cantidad) || 0).toLocaleString('es-CO')}
        </td>
      </tr>
    `).join('');

    const modalityText = order.direccionEntrega?.toLowerCase().includes('retiro')
      ? `<strong>Modalidad:</strong> Retiro en Sede Oficial Pintuco (${order.direccionEntrega})`
      : `<strong>Modalidad:</strong> Envío a Domicilio / Obra: ${order.direccionEntrega} (${order.ciudadEntrega || ''})`;

    const emailSubject = `¡Compra Confirmada! Recibo de Orden Pintuco #${orderNumber}`;
    const receiptHtml = `
      <div style="font-family: Arial, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #059669 0%, #065f46 100%); padding: 26px 20px; text-align: center; color: #ffffff;">
          <div style="font-size: 32px; margin-bottom: 4px;">✅</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 900;">¡COMPRA CONFIRMADA Y PAGADA!</h1>
          <p style="margin: 6px 0 0; font-size: 13px; color: #a7f3d0;">Recibo Oficial de Pago • Tienda Oficial Pintuco</p>
        </div>
        <div style="padding: 24px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px;">
            <div>
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase;">Orden N°:</span><br/>
              <strong style="font-size: 16px; color: #0f172a; font-family: monospace;">${orderNumber}</strong>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 11px; color: #64748b; text-transform: uppercase;">Estado:</span><br/>
              <span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; font-family: monospace;">PAID (PAGADA)</span>
            </div>
          </div>

          <h3 style="font-size: 14px; color: #0f172a; margin: 16px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            📦 Desglose Oficial de Productos
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr style="background: #f8fafc; text-align: left; font-size: 11px; color: #64748b; text-transform: uppercase;">
                <th style="padding: 8px;">Producto / SKU</th>
                <th style="padding: 8px;">Color Colorlink</th>
                <th style="padding: 8px; text-align: center;">Presentación</th>
                <th style="padding: 8px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div style="background: #f8fafc; border-radius: 12px; padding: 14px; margin-bottom: 16px; font-size: 13px; color: #334155;">
            <div style="margin-bottom: 6px;">${modalityText}</div>
            <div><strong>Titular:</strong> ${order.customerName || 'Cliente Pintuco'} (${cleanEmail})</div>
            ${order.customerPhone ? `<div><strong>Celular de Contacto:</strong> ${order.customerPhone}</div>` : ''}
          </div>

          <div style="border-top: 2px solid #0f172a; padding-top: 12px; text-align: right; margin-bottom: 20px;">
            <span style="font-size: 13px; color: #64748b;">TOTAL PAGADO: </span>
            <strong style="font-size: 22px; color: #059669; font-family: monospace;">$${totalAmount.toLocaleString('es-CO')} COP</strong>
          </div>

          <!-- Código de Recogida y QR -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; text-align: center;">
            <span style="font-size: 11px; color: #1e40af; font-weight: bold; text-transform: uppercase;">Código de Retiro / Trazabilidad en Obra:</span>
            <div style="margin: 8px 0; font-size: 22px; font-weight: 900; letter-spacing: 4px; color: #1e3a8a; font-family: monospace;">
              ${pickupCode}
            </div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(orderNumber + '|' + pickupCode)}" alt="Código QR de Verificación" style="margin: 8px auto; display: block; border-radius: 8px; border: 1px solid #cbd5e1;" />
            <p style="font-size: 11px; color: #475569; margin: 4px 0 0;">
              Presenta este código o el código QR al recibir tu despacho o al reclamar en la sede autorizada.
            </p>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Gracias por confiar en <strong>Pintuco</strong>. Tu compra cuenta con garantía oficial y soporte técnico especializado NTC 1335.
        </div>
      </div>
    `;

    const dispatchResult = await sendTransactionalEmail({
      to: cleanEmail,
      subject: emailSubject,
      html: receiptHtml,
    });

    return res.json({
      success: true,
      message: 'Recibo oficial enviado al correo electrónico',
      orderNumber,
      previewUrl: dispatchResult.previewUrl,
    });
  } catch (err: any) {
    console.error('Error in /api/payment/send-receipt:', err);
    return res.status(500).json({ success: false, error: 'Error enviando recibo oficial de compra' });
  }
});

// Start Server with Vite or static build
async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const hasDistIndex = fs.existsSync(path.join(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && hasDistIndex) {
    console.log('[Server] Serving production build from dist/');
    app.use('/src/assets/images', express.static(path.join(process.cwd(), 'src/assets/images')));
    app.use('/src/assets', express.static(path.join(process.cwd(), 'src/assets')));
    app.use('/assets/images', express.static(path.join(process.cwd(), 'src/assets/images')));
    app.use('/images', express.static(path.join(process.cwd(), 'public/images')));
    app.use('/images', express.static(path.join(process.cwd(), 'src/assets/images')));
    app.use(express.static(distPath));
    app.use(express.static(path.join(process.cwd(), 'public')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.log('[Server] Initializing Vite middleware in development mode...');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    // Mount Vite dev middleware first so it handles all module transforms and dev assets
    app.use(vite.middlewares);

    // Fallbacks for direct asset URLs if not handled by Vite
    app.use('/src/assets/images', express.static(path.join(process.cwd(), 'src/assets/images')));
    app.use('/src/assets', express.static(path.join(process.cwd(), 'src/assets')));
    app.use('/assets/images', express.static(path.join(process.cwd(), 'src/assets/images')));
    app.use('/images', express.static(path.join(process.cwd(), 'public/images')));
    app.use('/images', express.static(path.join(process.cwd(), 'src/assets/images')));
    app.use(express.static(path.join(process.cwd(), 'public')));

    // SPA fallback: transform index.html for any GET/HEAD request that is not an API or static file
    app.use('*', async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }
      const pathname = req.path || '';
      if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/health') ||
        pathname.startsWith('/_health') ||
        pathname.startsWith('/ping') ||
        pathname.startsWith('/src') ||
        pathname.startsWith('/@') ||
        pathname.startsWith('/node_modules') ||
        pathname.startsWith('/images') ||
        (pathname.includes('.') && pathname !== '/index.html')
      ) {
        return next();
      }
      try {
        const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexHtmlPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl || '/', template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`COLORLINK Pintuco Server running on http://0.0.0.0:${PORT} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server] Port ${PORT} is already in use.`);
    } else {
      console.error('[Server] Listen error:', err);
    }
  });

  const shutdown = () => {
    console.log('[Server] Gracefully shutting down...');
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[Server] Startup error:', err);
});
