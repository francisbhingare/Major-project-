import crypto from 'crypto';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin';
  created_at: string;
  last_login?: string;
}

export interface SessionData {
  token: string;
  user_id: string;
  email: string;
  name: string;
  role: 'admin';
  expires_at: string;
}

let adminStore: AdminUserRecord[] = [];
let sessionsStore: Map<string, SessionData> = new Map();

export function hashPassword(password: string): string {
  const salt = 'emergency_ai_admin_salt_2026';
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

export function initializeAdminAuthStore() {
  if (adminStore.length === 0) {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@emergency.org';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!';

    adminStore = [
      {
        id: 'usr-admin-001',
        name: 'System Administrator',
        email: adminEmail.toLowerCase(),
        password_hash: hashPassword(adminPassword),
        role: 'admin',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        last_login: new Date().toISOString(),
      },
    ];
  }
}

initializeAdminAuthStore();

export function authenticateAdmin(email: string, password: string): Omit<AdminUserRecord, 'password_hash'> {
  const admin = adminStore.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  if (!admin) {
    throw new Error('Invalid admin email or password.');
  }

  const computedHash = hashPassword(password);
  if (admin.password_hash !== computedHash) {
    throw new Error('Invalid admin email or password.');
  }

  admin.last_login = new Date().toISOString();
  const { password_hash, ...safeAdmin } = admin;
  return safeAdmin;
}

export function createAdminSession(admin: Omit<AdminUserRecord, 'password_hash'>): SessionData {
  const token = `sess_admin_${crypto.randomBytes(24).toString('hex')}`;
  const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const session: SessionData = {
    token,
    user_id: admin.id,
    email: admin.email,
    name: admin.name,
    role: 'admin',
    expires_at,
  };

  sessionsStore.set(token, session);
  return session;
}

export function getAdminSession(token: string): SessionData | undefined {
  const session = sessionsStore.get(token);
  if (!session) return undefined;

  if (new Date(session.expires_at).getTime() < Date.now()) {
    sessionsStore.delete(token);
    return undefined;
  }

  return session;
}

export function removeAdminSession(token: string): boolean {
  return sessionsStore.delete(token);
}
