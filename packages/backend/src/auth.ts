import type { FastifyRequest } from "fastify";
import { HttpError } from "./errors";
import { getBearerToken, verifyAccessToken, type AccessTokenPayload } from "./jwt";

export function requireAuth(request: FastifyRequest): AccessTokenPayload & { exp: number; iat: number } {
  const token = getBearerToken(request.headers.authorization);
  return verifyAccessToken(token);
}

export function requireRole(
  request: FastifyRequest,
  roles: readonly string[],
): AccessTokenPayload & { exp: number; iat: number } {
  const auth = requireAuth(request);

  if (!roles.includes(auth.role)) {
    throw new HttpError(403, "You do not have permission to perform this action", "FORBIDDEN");
  }

  return auth;
}
