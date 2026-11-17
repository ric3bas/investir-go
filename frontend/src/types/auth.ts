export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'User' | 'Admin';
  emailVerified: boolean;
  totpEnabled: boolean;
  createdAt: string;
}

export interface UserSession {
  id: string;
  userAgent?: string;
  ipAddress?: string;
  isCurrent: boolean;
  createdAt: string;
  lastActiveAt: string;
}

export interface LoginResponse {
  requiresMfa: boolean;
  mfaToken?: string;
  accessToken?: string;
  expiresIn?: number;
  user?: User;
}

export interface MfaSetupData {
  secret: string;
  qrCodeUri: string;
  qrCodeBase64: string;
  recoveryCodes: string[];
}

export interface AuditLogItem {
  id: number;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'SUSPICIOUS';
  ipAddress?: string;
  userAgent?: string;
  details?: string;
  createdAt: string;
}
