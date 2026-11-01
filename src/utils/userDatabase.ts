import { UserSession, TipoDocumento, CorporateRole, UserAddress } from '../types';

export interface PintucoUserAccount {
  id: string;
  nombre: string;
  email: string;
  cedula: string;
  telefono: string;
  password: string;
  direcciones: UserAddress[];
  tipoDocumento?: TipoDocumento;
  ciudad?: string;
  direccion?: string;
  isCorporate?: boolean;
  corporateRole?: CorporateRole;
  cargo?: string;
  departamento?: string;
  isSuperAdmin?: boolean;
}

export const USERS_DB_KEY = 'pintuco_users_db';
export const CURRENT_USER_KEY = 'currentUser';
export const LEGACY_SESSION_KEY = 'colorlink_user_session';
export const LEGACY_USERS_KEY = 'colorlink_registered_users';

export const INITIAL_DEFAULT_USERS: PintucoUserAccount[] = [
  {
    id: 'usr-admin-lina',
    nombre: 'Lina Jazmín Campos Saboya',
    email: 'linajazmincampossaboya@gmail.com',
    cedula: '1.032.456.789',
    telefono: '+57 310 450 8890',
    password: 'admin',
    direcciones: [],
    tipoDocumento: 'CC',
    ciudad: 'Bogotá D.C.',
    direccion: 'Carrera 15 # 93-60',
    isCorporate: true,
    corporateRole: 'gerencia',
    cargo: 'Administrador General',
    departamento: 'Dirección General & Operaciones Corporativas Pintuco',
    isSuperAdmin: true,
  },
  {
    id: 'usr-client-demo',
    nombre: 'Cliente Demo Obra',
    email: 'cliente.demo@gmail.com',
    cedula: '1.020.304.506',
    telefono: '+57 300 123 4567',
    password: 'pintuco2026',
    direcciones: [],
    tipoDocumento: 'CC',
    ciudad: 'Bogotá D.C.',
    direccion: 'Calle 100 # 19-61',
    isCorporate: false,
    cargo: 'Cliente Registrado',
    isSuperAdmin: false,
  }
];

export const normalizeDocument = (doc: string): string => {
  return (doc || '').replace(/[\.\-\s]/g, '').trim().toLowerCase();
};

export const normalizeEmail = (email: string): string => {
  return (email || '').trim().toLowerCase();
};

/**
 * Obtiene el arreglo principal de cuentas en localStorage llamado 'pintuco_users_db'
 */
export const getPintucoUsersDb = (): PintucoUserAccount[] => {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Migración desde legacy storage o inicialización de cuentas por defecto
    const legacyRaw = localStorage.getItem(LEGACY_USERS_KEY);
    let migrated: PintucoUserAccount[] = [...INITIAL_DEFAULT_USERS];

    if (legacyRaw) {
      try {
        const legacyObj = JSON.parse(legacyRaw);
        if (legacyObj && typeof legacyObj === 'object') {
          Object.values(legacyObj).forEach((u: any) => {
            if (u && u.email) {
              const normEmail = normalizeEmail(u.email);
              const exists = migrated.some(m => normalizeEmail(m.email) === normEmail);
              if (!exists) {
                migrated.push({
                  id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  nombre: u.nombre || 'Usuario Registrado',
                  email: u.email,
                  cedula: u.documento || u.cedula || '1.020.304.506',
                  telefono: u.telefono || '+57 300 000 0000',
                  password: u.password || 'pintuco2026',
                  direcciones: [],
                  tipoDocumento: u.tipoDocumento || 'CC',
                  ciudad: u.ciudad || 'Bogotá D.C.',
                  direccion: u.direccion || '',
                  isCorporate: Boolean(u.isCorporate),
                });
              }
            }
          });
        }
      } catch {}
    }

    localStorage.setItem(USERS_DB_KEY, JSON.stringify(migrated));
    return migrated;
  } catch (error) {
    console.error('Error reading pintuco_users_db:', error);
    return [...INITIAL_DEFAULT_USERS];
  }
};

/**
 * Guarda el arreglo de cuentas en 'pintuco_users_db' y sincroniza con el legacy dictionary
 */
export const savePintucoUsersDb = (users: PintucoUserAccount[]): void => {
  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

    // Sincronizar en legacy storage para compatibilidad retroactiva
    const legacyMap: Record<string, any> = {};
    users.forEach(u => {
      legacyMap[normalizeEmail(u.email)] = {
        email: u.email,
        nombre: u.nombre,
        telefono: u.telefono,
        password: u.password,
        documento: u.cedula,
        cedula: u.cedula,
        tipoDocumento: u.tipoDocumento || 'CC',
        ciudad: u.ciudad || 'Bogotá D.C.',
        direccion: u.direccion || '',
        isCorporate: u.isCorporate,
      };
    });
    localStorage.setItem(LEGACY_USERS_KEY, JSON.stringify(legacyMap));
  } catch (error) {
    console.error('Error saving pintuco_users_db:', error);
  }
};

/**
 * Busca si ya existe una cuenta por correo o por cédula/NIT
 */
export const findUserByEmailOrCedula = (
  email: string,
  cedula: string
): PintucoUserAccount | undefined => {
  const users = getPintucoUsersDb();
  const normEmail = normalizeEmail(email);
  const normCedula = normalizeDocument(cedula);

  return users.find(u => {
    const uEmail = normalizeEmail(u.email);
    const uCedula = normalizeDocument(u.cedula);
    const emailMatch = normEmail && uEmail === normEmail;
    const cedulaMatch = normCedula && uCedula === normCedula;
    return emailMatch || cedulaMatch;
  });
};

/**
 * Busca una cuenta por correo electrónico
 */
export const findUserByEmail = (email: string): PintucoUserAccount | undefined => {
  const users = getPintucoUsersDb();
  const normEmail = normalizeEmail(email);
  return users.find(u => normalizeEmail(u.email) === normEmail);
};

/**
 * Busca una cuenta por número de cédula/NIT
 */
export const findUserByCedula = (cedula: string): PintucoUserAccount | undefined => {
  const users = getPintucoUsersDb();
  const normCedula = normalizeDocument(cedula);
  return users.find(u => normalizeDocument(u.cedula) === normCedula);
};

/**
 * Registra un nuevo usuario con validación estricta de duplicados en 'pintuco_users_db'
 */
export const registerPintucoUser = (userData: {
  nombre: string;
  email: string;
  cedula: string;
  telefono: string;
  password: string;
  tipoDocumento?: TipoDocumento;
}): { success: boolean; error?: string; user?: PintucoUserAccount } => {
  const users = getPintucoUsersDb();
  const normEmail = normalizeEmail(userData.email);
  const normCedula = normalizeDocument(userData.cedula);

  if (!userData.nombre.trim()) {
    return { success: false, error: 'Por favor ingresa tu nombre completo.' };
  }
  if (!normEmail || !normEmail.includes('@')) {
    return { success: false, error: 'Por favor ingresa un correo electrónico válido.' };
  }
  if (!normCedula) {
    return { success: false, error: 'Por favor ingresa tu número de Cédula o NIT.' };
  }
  if (!userData.telefono.trim()) {
    return { success: false, error: 'Por favor ingresa tu número de teléfono celular.' };
  }
  if (!userData.password || userData.password.length < 4) {
    return { success: false, error: 'La contraseña debe contener al minímo 4 caracteres.' };
  }

  // VALIDACIÓN: Verificar si correo o cédula ya existen en 'pintuco_users_db'
  const duplicate = users.find(u => {
    const uEmail = normalizeEmail(u.email);
    const uCedula = normalizeDocument(u.cedula);
    return (normEmail && uEmail === normEmail) || (normCedula && uCedula === normCedula);
  });

  if (duplicate) {
    return {
      success: false,
      error: 'Ya existe una cuenta registrada con este correo o número de cédula.',
    };
  }

  const isLinaAdmin = normEmail === 'linajazmincampossaboya@gmail.com' || normEmail.endsWith('@pintuco.com');

  const newAccount: PintucoUserAccount = {
    id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nombre: userData.nombre.trim(),
    email: normEmail,
    cedula: userData.cedula.trim(),
    telefono: userData.telefono.trim(),
    password: userData.password.trim(),
    direcciones: [],
    tipoDocumento: userData.tipoDocumento || 'CC',
    ciudad: 'Bogotá D.C.',
    direccion: 'Carrera 15 # 93-60',
    isCorporate: isLinaAdmin,
    corporateRole: isLinaAdmin ? 'gerencia' : undefined,
    cargo: isLinaAdmin ? 'Administrador General' : 'Cliente Registrado',
    departamento: isLinaAdmin ? 'Dirección General & Operaciones Corporativas Pintuco' : undefined,
    isSuperAdmin: normEmail === 'linajazmincampossaboya@gmail.com',
  };

  users.push(newAccount);
  savePintucoUsersDb(users);

  return { success: true, user: newAccount };
};

/**
 * Actualiza la información de una cuenta en 'pintuco_users_db'
 */
export const updatePintucoUser = (
  userEmailOrId: string,
  updates: Partial<PintucoUserAccount>
): { success: boolean; user?: PintucoUserAccount } => {
  const users = getPintucoUsersDb();
  const normKey = normalizeEmail(userEmailOrId);

  const idx = users.findIndex(
    u => u.id === userEmailOrId || normalizeEmail(u.email) === normKey
  );

  if (idx === -1) {
    return { success: false };
  }

  const updatedAccount: PintucoUserAccount = {
    ...users[idx],
    ...updates,
    // Asegurar estructura base
    direcciones: updates.direcciones || users[idx].direcciones || [],
  };

  users[idx] = updatedAccount;
  savePintucoUsersDb(users);

  return { success: true, user: updatedAccount };
};

/**
 * Restablece la contraseña de un usuario en 'pintuco_users_db'
 */
export const resetPintucoUserPassword = (
  email: string,
  newPassword: string
): { success: boolean; error?: string } => {
  const users = getPintucoUsersDb();
  const normEmail = normalizeEmail(email);

  const idx = users.findIndex(u => normalizeEmail(u.email) === normEmail);

  if (idx === -1) {
    return {
      success: false,
      error: 'El correo electrónico no se encuentra registrado.',
    };
  }

  if (!newPassword || newPassword.length < 4) {
    return {
      success: false,
      error: 'La nueva contraseña debe tener al menos 4 caracteres.',
    };
  }

  users[idx].password = newPassword.trim();
  savePintucoUsersDb(users);

  return { success: true };
};

/**
 * Sincroniza la sesión activa en 'currentUser' y 'colorlink_user_session'
 */
export const syncActiveSession = (session: UserSession | null): void => {
  if (session && session.isLoggedIn) {
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
      localStorage.setItem(LEGACY_SESSION_KEY, JSON.stringify(session));
    } catch {}
  } else {
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(LEGACY_SESSION_KEY);
    } catch {}
  }
};
