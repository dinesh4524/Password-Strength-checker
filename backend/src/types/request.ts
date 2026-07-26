import { Request } from 'express';

/**
 * Extended Express Request interface to include authenticated user data.
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}
