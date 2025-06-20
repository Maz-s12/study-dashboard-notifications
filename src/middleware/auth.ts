import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import path from 'path';

let serviceAccount;

if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_PRIVATE_KEY) {
  // In production, use environment variables
  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  };
} else {
  // In development, use the local service account file
  const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
  try {
    serviceAccount = require(serviceAccountPath);
  } catch (error) {
    console.error("Could not load local service account key. Make sure firebase-service-account.json exists.", error);
    process.exit(1);
  }
}

// Initialize Firebase Admin only if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}; 