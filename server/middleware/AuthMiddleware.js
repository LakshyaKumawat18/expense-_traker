import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../utils/constants.utils.js";

export function authenticateToken(request, response, next) {
  const authorization = request.get("authorization");
  const tokenMatch = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!tokenMatch) {
    response.status(401).json({ error: "Authentication token required." });
    return;
  }

  if (!JWT_SECRET) {
    next(new Error("JWT_SECRET must be configured before using authenticated routes."));
    return;
  }

  try {
    const payload = jwt.verify(tokenMatch[1], JWT_SECRET);
    if (typeof payload !== "object" || typeof payload.sub !== "string") {
      response.status(401).json({ error: "Invalid authentication token." });
      return;
    }

    request.user = { id: payload.sub };
    next();
  } catch {
    response.status(401).json({ error: "Invalid or expired authentication token." });
  }
}