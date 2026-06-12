import { verifyToken, JWTPayload } from "../auth";
import { NextRequest } from "next/server";

export interface GraphQLContext {
  user?: JWTPayload;
}

export async function createContext(req: NextRequest): Promise<GraphQLContext> {
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      return { user: decoded };
    }
  }
  return {};
}
