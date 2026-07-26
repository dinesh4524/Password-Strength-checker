import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/request';

/**
 * Middleware to protect routes by verifying the JWT token.
 * Extracts token from Authorization header (Bearer scheme).
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  // Check for Bearer token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
        id: string;
        email: string;
      };

      // Attach user info to request object
      req.user = {
        id: decoded.id,
        email: decoded.email,
      };

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error);
      res.status(401).json({
        message: 'Not authorized, token failed',
      });
    }
  }

  if (!token) {
    res.status(401).json({
      message: 'Not authorized, no token provided',
    });
  }
};
