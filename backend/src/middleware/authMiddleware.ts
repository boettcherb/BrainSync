import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';

// Extends the standard Express Request to include authenticated user
// information. Protected endpoints use this user information instead of
// accepting it from the request body or parameters.
export interface AuthenticatedRequest extends Request {
    user?: { userId: string };
}

// Middleware that runs before the final route handler (the endpoint).
// Verify that the request has proper authorization.
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
        // Ensure the request includes an authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ message: "Authorization header is required" });
            return;
        }
        // Extract the token from the header. The header must be
        // in the format "Bearer <token>"
        const [scheme, token] = authHeader.split(' ');
        if (scheme !== "Bearer" || !token) {
            res.status(401).json({ message: "Invalid authorization header" });
            return;
        }
        // Load the JWT secret from the environment variables. The JWT secret
        // is used to sign and verify the token.
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT secret is not defined");
        }
        // Verify the token and extract the payload. If valid, attach the
        // payload (the authenticated user's id) to the request so it can
        // be accessed later in the route handler.
        try {
            const payload = jwt.verify(token, jwtSecret);
            if (typeof payload !== 'object' || !payload || typeof payload.userId !== 'string') {
                res.status(401).json({ message: "Invalid token payload" });
                return;
            }
            req.user = { userId: payload.userId };
        } catch (error) {
            res.status(401).json({ message: "Invalid or expired token" });
            return;
        }
        next();
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Internal server error" });
    }
}
