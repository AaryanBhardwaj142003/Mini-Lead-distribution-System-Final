import { Request, Response, NextFunction } from 'express';
import { auth } from '../firebase.js';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role?: 'admin' | 'agent';
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    // You might want to fetch the user role from Firestore here if not in custom claims
    // For this prototype, we'll assume we can verify role via token or DB
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Logic to check role from DB or token
  // For simplicity in this demo, we'll verify via DB check inside the route or here
  next();
};
