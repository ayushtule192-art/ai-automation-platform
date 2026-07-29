/** Base service contract — all services implement error-safe public methods */
export interface IService {
  readonly serviceName: string;
}

/** Token pair returned after successful authentication */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/** Decoded JWT payload after verification */
export interface TokenPayload {
  sub: string;
  email?: string;
  role?: string;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}
