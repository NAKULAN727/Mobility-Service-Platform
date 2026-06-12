import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key_123456789";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface JWTPayload {
  userId: string;
  role: string;
  email: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export interface UserContextPayload {
  userId: string;
  role: "CUSTOMER" | "DRIVER" | "FLEET_MANAGER" | "ADMIN";
}

export interface GraphQLContext {
  prisma: any;
  user?: UserContextPayload;
}

const VALID_ROLES = new Set(["CUSTOMER", "DRIVER", "FLEET_MANAGER", "ADMIN"]);

/**
 * Extracts and decodes the user profile from the Authorization header.
 * Supports standard HS256 JWTs or developer mock tokens (Format: "mock-<id>:<ROLE>").
 * Mock tokens are only accepted in non-production environments.
 */
export function getUserFromHeader(authHeader: string | null): UserContextPayload | undefined {
  if (!authHeader) return undefined;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return undefined;

  // Mock tokens only allowed outside production
  if (token.startsWith("mock-") && process.env.NODE_ENV !== "production") {
    const colonIdx = token.indexOf(":");
    if (colonIdx > 0) {
      const userId = token.slice(0, colonIdx);
      const role = token.slice(colonIdx + 1).toUpperCase();
      if (userId && VALID_ROLES.has(role)) {
        return { userId, role: role as UserContextPayload["role"] };
      }
    }
    return undefined;
  }

  // Standard JWT verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded?.userId && decoded?.role && VALID_ROLES.has(decoded.role)) {
      return { userId: decoded.userId, role: decoded.role };
    }
  } catch (error) {
    // Fail silently — resolvers enforce auth via requireAuth/requireRole
    if (process.env.NODE_ENV !== "production") {
      console.debug("JWT verification failed:", (error as Error).message);
    }
  }

  return undefined;
}

/** Enforces that a user must be logged in. */
export function requireAuth(context: GraphQLContext): UserContextPayload {
  if (!context.user) {
    throw new GraphQLError("You must be logged in to access this resource", {
      extensions: { code: "UNAUTHORIZED", http: { status: 401 } },
    });
  }
  return context.user;
}

/** Enforces that a logged-in user must have one of the permitted roles. */
export function requireRole(
  context: GraphQLContext,
  allowedRoles: Array<"CUSTOMER" | "DRIVER" | "FLEET_MANAGER" | "ADMIN">
): UserContextPayload {
  const user = requireAuth(context);
  if (!allowedRoles.includes(user.role)) {
    throw new GraphQLError("You are not authorized to perform this action", {
      extensions: { code: "FORBIDDEN", http: { status: 403 } },
    });
  }
  return user;
}
