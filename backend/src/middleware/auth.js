import jwt from 'jsonwebtoken';
import { CommonErrors, ErrorCodes } from '../utils/errorResponse.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * JWT verification middleware
 * Protects routes by verifying the JWT token in the Authorization header
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json(CommonErrors.unauthorized('No authentication token provided. Please log in.'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json(CommonErrors.tokenExpired());
    }
    return res.status(403).json(CommonErrors.tokenInvalid());
  }
};

export { JWT_SECRET };
