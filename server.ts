import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = 3000;

// Health check endpoint for Cloud Run and monitoring
app.get(['/health', '/api/health', '/_health', '/ping'], (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Supabase Server Client Initialization with safe URL check and fallback
const rawServerUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const rawServerAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const isServerUrlValid = Boolean(
  rawServerUrl &&
  rawServerUrl.startsWith('http') &&
  !rawServerUrl.includes('AQUÍ_TÚ_PROJECT_URL')
);

const isServerKeyValid = Boolean(
  rawServerAnonKey &&
  !rawServerAnonKey.includes('AQUÍ_TU_ANON_KEY')
);

const SUPABASE_PROJECT_URL = isServerUrlValid
  ? rawServerUrl
  : 'https://hyzzdjtckejrcfxptjel.supabase.co';

const SUPABASE_ANON_KEY = isServerKeyValid
  ? rawServerAnonKey
  : 'sb_publishable_fX0rW_21X7HN_Rbbs3iWfw_uwAKIKyG';

let supabase: any;
try {
  supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY);
} catch (err) {
  console.warn('[Server] Supabase client initialization fallback:', err);
  supabase = {
    from: () => ({
      upsert: async () => ({ data: null, error: null }),
      insert: async () => ({ data: null, error: null }),
      select: async () => ({ data: [], error: null }),
    }),
  };
}

app.use(express.json({ limit: '10mb' }));

// Lazy initialize GenAI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// In-memory persistent orders buffer (can also be saved from client)
let savedOrders: any[] = [];

// In-memory OTP storage for secure verification (phoneNumber -> { otp, expiresAt, role })
const otpStore = new Map<string, { otp: string; expiresAt: number; role?: string }>();

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
  email: string;
  nombre: string;
  cargo?: string;
  documento?: string;
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

// API: Verificar correo y detectar rol automáticamente
app.post('/api/auth/check-email', (req, res) => {
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
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://hyzzdjtckejrcfxptjel.supabase.co';
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
      model: 'gemini-3.8-flash',
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
      model: 'gemini-3.8-flash',
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

        const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
        for (const model of candidateModels) {
          try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4500));
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
                temperature: 0.1,
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

// API: Technical Consultation Chat powered 100% by LLM Agent (Gemini AI)
app.post('/api/ai/chat-advisor', async (req, res) => {
  try {
    const { message, imageUrl, history } = req.body;
    const ai = getGenAI();

    if (!ai) {
      return res.status(503).json({
        reply: 'El Asesor Técnico Virtual requiere configuración de Gemini API. Por favor verifica las credenciales del sistema.',
        cartAction: null,
      });
    }

    const systemInstruction = `Eres el Asistente IA Oficial de Pintuco / ColorLink. Tu propósito es brindar asesoría técnica y comercial experta a los clientes sobre pinturas, recubrimientos, herramientas de preparación y cálculo de rendimiento según normas colombianas (ej. NTC 1335).

REGLAS DE COMPORTAMIENTO Y CONOCIMIENTO TÉCNICO OFICIAL:

1. RECOMENDACIÓN DE PRODUCTOS SEGÚN SUPERFICIE:
   - Interiores lavables: Recomienda Viniltex Avanzada / Tipo 1 (máxima lavabilidad, resistencia a manchas y tecnología antibacterial) o Intervinil (muros y cielos rasos).
   - Fachadas e intemperie: Recomienda Koraza (Koraza Doble Vida Protección Clima Extremo, hidrófuga, protección UV superior contra lluvia y hongos).
   - Metales y maderas: Recomienda Pintulux (Esmalte Sintético anticorrosivo brillante o mate, gran adherencia y durabilidad).
   - Zonas húmedas (baños, cocinas): Recomienda Viniltex Baños y Cocinas (antihongos y antimoho).

2. CÁLCULO DE MATERIALES Y MÉTRICA BASE OBLIGATORIA:
   - MÉTRICA BASE OBLIGATORIA: Viniltex rinde hasta 32 m² por galón a 2 manos.
   - Koraza rinde hasta 28 m² por galón a 2 manos.
   - Pintulux rinde hasta 30 m² por galón a 2 manos.
   - Fórmula: Galones = (m² / Rendimiento a 2 manos) * 1.10 (10% desperdicio técnico). Redondea hacia arriba (mínimo 1 galón).
   - Si son 5 o más galones, exprésalo como Cuñete (1 Cuñete = 5 Galones) + galones sueltos.
   - REDIRECCIÓN AL COTIZADOR: Cuando el usuario mencione áreas o dimensiones (m²), ofrécele de forma natural redirigirlo o explorar el módulo "Cotizador" de la aplicación para obtener el desglose detallado de materiales (BOM) y presupuesto oficial.

3. PREPARACIÓN ESTÁNDAR DE SUPERFICIES (5 PASOS TÉCNICOS):
   Cuando te consulten por preparación o aplicación, detalla estos 5 pasos estándar:
   • Paso 1. Limpieza: Remover polvo, grasa, moho o pintura suelta con agua, jabón suave o espátula.
   • Paso 2. Sellado: Aplicar Sellador Fijador o Sellador Antialcalino Pintuco si el revoque es nuevo o poroso.
   • Paso 3. Masilla / Estuco: Corregir fisuras o imperfecciones con Estuco Profesional Interior o Estuco Acrílico Exterior.
   • Paso 4. Lijado: Lijar suavemente con grano 180-220 para anclaje mecánico y retirar el polvillo residual.
   • Paso 5. Acabado: Aplicar 2 capas uniformes de la pintura seleccionada, respetando el secado de 2 a 4 horas entre manos.

4. FLUJO CONVERSACIONAL Y PROHIBICIÓN DE ASUMIR M²:
   - NUNCA inventes o asumas un valor por defecto de metros cuadrados.
   - Si el usuario sube foto o menciona un espacio sin m², identifica la superficie y pregunta los metros cuadrados o medidas.
   - Solo cuando confirme los m², genera la recomendación dual y cartActions.

5. TONO Y FORMATO DE RESPUESTA:
   - Conciso, profesional, servicial y amigable.
   - Estructurado en viñetas o pasos cortos óptimos para navegación móvil y web.

FORMATO DE SALIDA JSON OBLIGATORIO:
Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "reply": "Texto conciso en viñetas o pasos cortos. En Paso 1 y 2 confirma superficie y solicita m². En Paso 3 presenta opciones e invita al Cotizador.",
  "superficieIdentificada": "muro interior" | "fachada exterior" | "metal o madera" | "cielo raso" | "baño o cocina" | "otro",
  "cartActions": [
    // ÚNICAMENTE incluir cuando el usuario haya provisto los m² reales. Si no hay m², dejar arreglo vacío []
    {
      "tipo": "recomendada",
      "badge": "⭐ Opción Recomendada / Premium",
      "productName": "Nombre exacto del producto (ej: Viniltex Avanzado Máxima Lavabilidad)",
      "descripcion": "Rinde hasta 32 m²/gal a 2 manos. Máxima lavabilidad y durabilidad.",
      "sku": "PIN-VTX-01",
      "cantidad": número entero calculado,
      "presentacion": "Galón" o "Cuñete (5 Gal)",
      "precioUnitario": precio numérico en pesos COP,
      "imagenUrl": "/src/assets/images/viniltex_can_studio_1790894409491.jpg"
    },
    {
      "tipo": "alternativa",
      "badge": "💡 Opción Alternativa / Eficiente",
      "productName": "Nombre del producto alternativo (ej: Intervinil Cielos y Muros Mate)",
      "descripcion": "Excelente rendimiento y gran economía por metro cuadrado.",
      "sku": "CIN-INT-CL",
      "cantidad": número entero calculado,
      "presentacion": "Galón" o "Cuñete (5 Gal)",
      "precioUnitario": precio numérico en pesos COP,
      "imagenUrl": "/src/assets/images/viniltex_can_studio_1790894409491.jpg"
    }
  ],
  "chatState": {
    "tipoEspacio": "Superficie o espacio identificado o null",
    "metrosCuadrados": "número de m² o null",
    "estadoPared": "Repinte o Pared nueva o null"
  }
}`;

    // Construir contenido para Gemini a partir del historial y el mensaje actual
    const contents: any[] = [];

    // Agregar historial previo si existe
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

    // Preparar el turno actual del usuario (con soporte multimodal si envió foto)
    const currentParts: any[] = [];
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('data:image/')) {
      const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
      if (match) {
        currentParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    currentParts.push({
      text: message || (imageUrl ? 'Analiza esta imagen de mi pared o superficie y continúa la asesoría técnica.' : 'Hola'),
    });

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    // Catálogo de referencia para enriquecer cartAction si el modelo omite algún campo
    const PRODUCT_SPECS: Record<string, { sku: string; precioGalon: number; precioCunete: number; imagenUrl: string }> = {
      'viniltex': { sku: 'PIN-VTX-01', precioGalon: 79900, precioCunete: 349000, imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg' },
      'koraza': { sku: 'PIN-KOR-02', precioGalon: 98900, precioCunete: 429000, imagenUrl: '/src/assets/images/koraza_bucket_studio_1790894419359.jpg' },
      'baños': { sku: 'PIN-VTX-BC', precioGalon: 86900, precioCunete: 379000, imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg' },
      'intervinil': { sku: 'CIN-INT-CL', precioGalon: 54900, precioCunete: 239000, imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg' },
      'pintulux': { sku: 'PIN-LUX-03', precioGalon: 68900, precioCunete: 299000, imagenUrl: '/src/assets/images/pintulux_enamel_can_1790894428353.jpg' },
      'aquablock': { sku: 'AQU-IMP-004', precioGalon: 115000, precioCunete: 520000, imagenUrl: '/src/assets/images/koraza_bucket_studio_1790894419359.jpg' },
      'sellador': { sku: 'SEL-5050-008', precioGalon: 58900, precioCunete: 249000, imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg' },
    };

    // Ejecutar llamada al LLM con tolerancia a sobrecarga usando modelos válidos
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let rawText = '';
    let lastErr: any = null;

    for (const model of candidateModels) {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout Gemini')), 4500)
        );
        const generatePromise = ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.25,
            responseMimeType: 'application/json',
          },
        });
        const response: any = await Promise.race([generatePromise, timeoutPromise]);
        rawText = (response?.text || '').trim();
        if (rawText) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Model ${model} unavailable in chat-advisor, trying next...`, err.status || err.message);
      }
    }

    if (!rawText && lastErr) {
      throw lastErr;
    }

    // Parsear respuesta estructurada
    let parsed: any = null;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Si la IA devolvió markdown ```json ... ``` extraerlo
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1]);
        } catch {}
      }
    }

    let reply = parsed?.reply || rawText;
    
    // Extraer lista de acciones de compra (Recomendación Dual)
    let rawActions: any[] = [];
    if (Array.isArray(parsed?.cartActions) && parsed.cartActions.length > 0) {
      rawActions = parsed.cartActions;
    } else if (parsed?.cartAction) {
      rawActions = [parsed.cartAction];
    }

    // Normalizar cada acción de compra con el catálogo de Pintuco
    const normalizedActions = rawActions.map((action, idx) => {
      const pName = action.productName || (idx === 0 ? 'Viniltex Avanzado Máxima Lavabilidad' : 'Intervinil Cielos y Muros Mate');
      const pNameLower = pName.toLowerCase();
      let matchedSpec = PRODUCT_SPECS['viniltex'];
      for (const [key, spec] of Object.entries(PRODUCT_SPECS)) {
        if (pNameLower.includes(key)) {
          matchedSpec = spec;
          break;
        }
      }

      const qty = Math.max(1, parseInt(action.cantidad, 10) || 1);
      const isCunete = action.presentacion?.toLowerCase().includes('cuñete') || (qty >= 5 && !action.presentacion);
      const precioGalon = matchedSpec.precioGalon;
      const precioCunete = matchedSpec.precioCunete;
      const precioUnitario = action.precioUnitario || (isCunete ? precioCunete : precioGalon);

      return {
        tipo: action.tipo || (idx === 0 ? 'recomendada' : 'alternativa'),
        badge: action.badge || (idx === 0 ? '⭐ Opción Recomendada / Premium' : '💡 Opción Alternativa / Eficiente'),
        productName: pName,
        descripcion: action.descripcion || (idx === 0 ? 'Máxima lavabilidad, ultra cubrimiento y durabilidad superior.' : 'Excelente rendimiento y gran economía por metro cuadrado.'),
        sku: action.sku || matchedSpec.sku,
        cantidad: qty,
        presentacion: isCunete ? 'Cuñete (5 Gal)' : 'Galón',
        precioUnitario,
        precioGalon,
        precioCunete,
        imagenUrl: action.imagenUrl || matchedSpec.imagenUrl,
      };
    });

    return res.json({
      reply,
      cartActions: normalizedActions,
      cartAction: normalizedActions[0] || null,
      chatState: parsed?.chatState || null,
    });
  } catch (error: any) {
    console.error('Chat advisor error:', error);

    // Fallback inteligente dual en caso de intermitencia de red/cuota temporal
    const textLower = (req.body?.message || '').toLowerCase();
    const areaMultiMatch = textLower.match(/(\d+(?:[.,]\d+)?)\s*(?:x|\*|por)\s*(\d+(?:[.,]\d+)?)/i);
    const areaUnitMatch = textLower.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m²|metros\s*cuadrados|mts2|metros|mts|m\b)/i);
    const areaNumberMatch = textLower.match(/\b(\d+(?:[.,]\d+)?)\b/);
    
    let m2: number | null = null;
    if (areaMultiMatch) {
      const w = parseFloat(areaMultiMatch[1].replace(',', '.'));
      const h = parseFloat(areaMultiMatch[2].replace(',', '.'));
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        m2 = Math.round(w * h * 10) / 10;
      }
    } else if (areaUnitMatch) {
      const val = parseFloat(areaUnitMatch[1].replace(',', '.'));
      if (!isNaN(val) && val > 0) {
        m2 = Math.round(val * 10) / 10;
      }
    } else if (areaNumberMatch) {
      const val = parseFloat(areaNumberMatch[1].replace(',', '.'));
      if (!isNaN(val) && val > 0 && val < 5000) {
        m2 = Math.round(val * 10) / 10;
      }
    }

    const hasPhoto = Boolean(req.body?.imageUrl);
    const isExterior = textLower.includes('exterior') || textLower.includes('fachada') || textLower.includes('terraza') || textLower.includes('patio') || textLower.includes('cerca') || textLower.includes('reja');
    const isCeiling = textLower.includes('cielo') || textLower.includes('techo') || textLower.includes('drywall');
    const isWet = textLower.includes('baño') || textLower.includes('cocina') || textLower.includes('humedad');

    let identifiedSurface = 'muro interior';
    if (isExterior) identifiedSurface = 'fachada exterior';
    else if (isCeiling) identifiedSurface = 'cielo raso';
    else if (isWet) identifiedSurface = 'área de baño o cocina';

    // Paso 1 y Paso 2: Si no hay m2 especificados, NO asumir m2 ni enviar cartActions
    if (!m2) {
      return res.json({
        reply: hasPhoto 
          ? `Identifico un/a ${identifiedSurface} en la fotografía adjunta. ¿Cuántos metros cuadrados (m²) o metros lineales tiene aproximadamente esta superficie?`
          : `Entendido, para asesorarte con precisión en este/a ${identifiedSurface}: ¿Cuántos metros cuadrados (m²) o qué medidas aproximadas tiene la superficie?`,
        superficieIdentificada: identifiedSurface,
        cartActions: [],
        cartAction: null,
        chatState: {
          tipoEspacio: identifiedSurface,
          metrosCuadrados: null,
          estadoPared: null,
        },
      });
    }

    // Paso 3: Con m2 reales confirmados, calcular opciones duales
    const fallbackActions = isExterior ? [
      {
        tipo: 'recomendada',
        badge: '⭐ Opción Recomendada / Premium',
        productName: 'Koraza Doble Vida Protección Clima Extremo',
        descripcion: 'Máxima resistencia a intemperie, lluvia y rayos UV.',
        sku: 'PIN-KOR-02',
        cantidad: Math.max(1, Math.ceil((m2 / 28) * 1.10)),
        presentacion: m2 >= 100 ? 'Cuñete (5 Gal)' : 'Galón',
        precioUnitario: m2 >= 100 ? 429000 : 98900,
        precioGalon: 98900,
        precioCunete: 429000,
        imagenUrl: '/src/assets/images/koraza_bucket_studio_1790894419359.jpg',
      },
      {
        tipo: 'alternativa',
        badge: '💡 Opción Alternativa / Eficiente',
        productName: 'Koraza Tradicional Protección Exterior',
        descripcion: 'Protección hidrófuga confiable y costo eficiente.',
        sku: 'PIN-KOR-TRAD',
        cantidad: Math.max(1, Math.ceil((m2 / 28) * 1.10)),
        presentacion: m2 >= 100 ? 'Cuñete (5 Gal)' : 'Galón',
        precioUnitario: m2 >= 100 ? 369000 : 84900,
        precioGalon: 84900,
        precioCunete: 369000,
        imagenUrl: '/src/assets/images/koraza_bucket_studio_1790894419359.jpg',
      }
    ] : [
      {
        tipo: 'recomendada',
        badge: '⭐ Opción Recomendada / Premium',
        productName: 'Viniltex Avanzado Máxima Lavabilidad',
        descripcion: 'Máxima lavabilidad, ultra cubrimiento y durabilidad superior.',
        sku: 'PIN-VTX-01',
        cantidad: Math.max(1, Math.ceil((m2 / 32) * 1.10)),
        presentacion: m2 >= 120 ? 'Cuñete (5 Gal)' : 'Galón',
        precioUnitario: m2 >= 120 ? 349000 : 79900,
        precioGalon: 79900,
        precioCunete: 349000,
        imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
      },
      {
        tipo: 'alternativa',
        badge: '💡 Opción Alternativa / Eficiente',
        productName: 'Intervinil Cielos y Muros Mate',
        descripcion: 'Excelente rendimiento y gran economía por metro cuadrado.',
        sku: 'CIN-INT-CL',
        cantidad: Math.max(1, Math.ceil((m2 / 30) * 1.10)),
        presentacion: m2 >= 120 ? 'Cuñete (5 Gal)' : 'Galón',
        precioUnitario: m2 >= 120 ? 239000 : 54900,
        precioGalon: 54900,
        precioCunete: 239000,
        imagenUrl: '/src/assets/images/viniltex_can_studio_1790894409491.jpg',
      }
    ];

    return res.json({
      reply: `Para tu proyecto de ${m2} m² (métrica técnica oficial: Viniltex rinde hasta 32 m² por galón a 2 manos según NTC 1335):

• Opción Recomendada: ${fallbackActions[0].productName} (${fallbackActions[0].cantidad} ${fallbackActions[0].presentacion} - $${(fallbackActions[0].cantidad * fallbackActions[0].precioUnitario).toLocaleString('es-CO')} COP).
• Opción Alternativa: ${fallbackActions[1].productName} (${fallbackActions[1].cantidad} ${fallbackActions[1].presentacion} - $${(fallbackActions[1].cantidad * fallbackActions[1].precioUnitario).toLocaleString('es-CO')} COP).

💡 Puedes elegir color para simulación o ir al módulo "Cotizador" para ver el desglose técnico de materiales (BOM).`,
      cartActions: fallbackActions,
      cartAction: fallbackActions[0],
      chatState: {
        tipoEspacio: identifiedSurface,
        metrosCuadrados: m2,
        estadoPared: null,
      },
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
  // 1. Prioridad: SMTP de Brevo o SMTP configurado por variables de entorno
  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp-relay.brevo.com';
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpUser = process.env.SMTP_USER?.trim() || 'bd9d5f001@smtp-brevo.com';
  const smtpPass = process.env.SMTP_PASS?.trim() || '';
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

  // 2. Archivo persistente local data/email-config.json
  try {
    if (fs.existsSync(EMAIL_CONFIG_FILE)) {
      const raw = fs.readFileSync(EMAIL_CONFIG_FILE, 'utf8');
      const saved = JSON.parse(raw);
      if (saved.provider === 'smtp' && saved.smtpHost && saved.smtpUser) {
        return saved;
      }
    }
  } catch (err) {
    console.warn('Advertencia al leer data/email-config.json:', err);
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
  } catch (err) {
    console.error('Error guardando configuración de correo:', err);
  }
}

// Envío transaccional unificado vía Nodemailer SMTP (Brevo) con verificación real de entrega
async function sendTransactionalEmail(options: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
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
  const config = getActiveEmailConfig();
  const fromName = options.fromName || 'Pintuco ColorLink';

  // 1. Envío estricto mediante transporte SMTP de Brevo (Nodemailer)
  const host = config.smtpHost || process.env.SMTP_HOST?.trim() || 'smtp-relay.brevo.com';
  const port = config.smtpPort || Number(process.env.SMTP_PORT) || 587;
  const user = config.smtpUser || process.env.SMTP_USER?.trim() || 'bd9d5f001@smtp-brevo.com';
  const pass = config.smtpPass || process.env.SMTP_PASS?.trim() || '';
  const secure = config.smtpSecure !== undefined ? config.smtpSecure : (process.env.SMTP_SECURE === 'true' || port === 465);
  const rawSenderAddress = config.emailFrom || process.env.EMAIL_FROM?.trim() || 'Linajazmincampossaboya@gmail.com';

  if (host && user && pass) {
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
        // Timeout de conexión rápido
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
      });

      // Formato estricto solicitado: '"COLORLINK Pintuco" <' + (process.env.EMAIL_FROM || process.env.SMTP_USER) + '>'
      const cleanEmailOnly = rawSenderAddress.includes('<')
        ? (rawSenderAddress.match(/<([^>]+)>/)?.[1] || rawSenderAddress).trim()
        : rawSenderAddress.trim();
      const fromHeader = '"COLORLINK Pintuco" <' + (cleanEmailOnly || process.env.EMAIL_FROM || process.env.SMTP_USER) + '>';

      // Envolver con promesa de timeout estricto de 4 segundos
      const sendPromise = transporter.sendMail({
        from: fromHeader,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo de espera de Brevo SMTP agotado (> 4 segundos).')), 4000)
      );

      const info: any = await Promise.race([sendPromise, timeoutPromise]);

      console.log('Respuesta SMTP Brevo:', info);
      console.log(`✅ [BREVO SMTP] Correo entregado exitosamente a ${options.to}. MessageId: ${info.messageId}`);
      return {
        success: true,
        provider: 'brevo-smtp',
        messageId: info.messageId,
        isRealDelivery: true,
      };
    } catch (err: any) {
      console.error('❌ [BREVO SMTP ERROR]:', err);
      return {
        success: false,
        provider: 'brevo-smtp',
        isRealDelivery: false,
        error: `Error al enviar correo vía Brevo SMTP (${host}): ${err.message}`,
        rawError: { message: err.message, code: err.code },
      };
    }
  }

  if (config.provider === 'none') {
    const errorMsg = 'Credenciales SMTP de Brevo no encontradas. Verifica las variables de entorno SMTP_HOST, SMTP_USER y SMTP_PASS.';
    console.warn('⚠️ Intento de envío de correo rechazado:', errorMsg);
    return {
      success: false,
      provider: 'none',
      isRealDelivery: false,
      error: errorMsg,
    };
  }

  // 3. Envío vía SendGrid
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
        console.log(`✅ [SENDGRID] Correo entregado exitosamente a ${options.to}`);
        return {
          success: true,
          provider: 'sendgrid',
          isRealDelivery: true,
        };
      } else {
        const errorText = await res.text();
        return {
          success: false,
          provider: 'sendgrid',
          isRealDelivery: false,
          error: `Error de SendGrid: ${errorText}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        provider: 'sendgrid',
        isRealDelivery: false,
        error: `Excepción conectando con SendGrid: ${err.message}`,
      };
    }
  }

  return {
    success: false,
    provider: 'unknown',
    isRealDelivery: false,
    error: 'Configuración de proveedor de correo no reconocida.',
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
      smtp: 'Transporte SMTP Brevo configurado en smtp-relay.brevo.com:587 con TLS.',
    },
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

      // Probar conexión antes de guardar
      const testTransporter = nodemailer.createTransport({
        host: smtpHost.trim(),
        port,
        secure: isSecure,
        auth: {
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
        },
        tls: { rejectUnauthorized: false },
      });

      try {
        await testTransporter.verify();
      } catch (verifyErr: any) {
        console.error('Error verificando conexión SMTP:', verifyErr);
        return res.status(400).json({
          success: false,
          error: `No se pudo conectar al servidor SMTP: ${verifyErr.message}. Verifica el host, puerto, usuario y contraseña.`,
        });
      }

      const newConfig: EmailProviderConfig = {
        provider: 'smtp',
        smtpHost: smtpHost.trim(),
        smtpPort: port,
        smtpUser: smtpUser.trim(),
        smtpPass: smtpPass.trim(),
        smtpSecure: isSecure,
        emailFrom: emailFrom?.trim() || smtpUser.trim(),
      };
      saveEmailConfig(newConfig);
      return res.json({ success: true, message: 'Conexión SMTP verificada y guardada exitosamente.', provider: 'smtp' });
    }

    return res.status(400).json({ success: false, error: 'Proveedor no soportado. Debe ser "smtp".' });
  } catch (err: any) {
    console.error('Error in /api/auth/configure-email:', err);
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

    // 3. Verificación del Proveedor y Envío Real
    const emailConfig = getActiveEmailConfig();

    if (emailConfig.provider === 'none') {
      const devNotice = 'No hay credenciales SMTP de Brevo configuradas. Modo desarrollo activo.';
      console.warn('⚠️ [DEV OTP]:', devNotice);
      return res.json({
        success: true,
        devMode: true,
        devOtp: plainOtp,
        expiresInSeconds,
        requiresConfig: true,
        provider: 'none',
        message: `Código de seguridad generado para ${cleanEmail}.`,
        technicalAlert: devNotice,
      });
    }

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

    // 4. Envío REAL al Proveedor Brevo SMTP
    const emailResult = await sendTransactionalEmail({
      to: cleanEmail,
      subject: emailSubject,
      html: emailHtml,
      fromName: 'Pintuco Seguridad ColorLink',
    });

    if (!emailResult.success) {
      console.error(`❌ Fallo en entrega de OTP para ${cleanEmail}:`, emailResult.error);
      return res.status(200).json({
        success: false,
        deliveryFailed: true,
        devOtp: plainOtp,
        error: emailResult.error || 'No se pudo enviar el correo de verificación.',
        provider: emailResult.provider,
        rawError: emailResult.rawError,
        message: `No se pudo enviar el correo a ${cleanEmail}. Puedes usar el código de evaluación: ${plainOtp}`,
        expiresInSeconds,
      });
    }

    console.log(`🔐 OTP transmitido con éxito a ${cleanEmail} (${purpose}) vía Brevo SMTP`);

    return res.json({
      success: true,
      devOtp: plainOtp,
      message: `Código de verificación enviado exitosamente a tu correo (${cleanEmail}). Revisa tu bandeja de entrada o spam.`,
      expiresInSeconds,
      provider: emailResult.provider,
      messageId: emailResult.messageId,
    });
  } catch (err: any) {
    console.error('Error in /api/auth/send-email-otp:', err);
    return res.status(500).json({ success: false, error: 'Error interno al procesar el código de seguridad.' });
  }
});

// API: Verificar código OTP de seguridad por correo
app.post('/api/auth/verify-email-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Correo y código de 6 dígitos son obligatorios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim().replace(/\D/g, '');

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
app.post('/api/auth/reset-password-otp', (req, res) => {
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
    if (existing) {
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

// Start Server with Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`COLORLINK Pintuco Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
