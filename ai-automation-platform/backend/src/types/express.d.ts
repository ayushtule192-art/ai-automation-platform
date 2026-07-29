import type { AuthenticatedUser } from "./index.js";

declare global {
  namespace Express {
    interface Request {
      /** Set by auth middleware after successful JWT verification */
      user?: AuthenticatedUser;
      /** Correlation ID for request tracing */
      requestId?: string;
    }
  }
}

export {};
