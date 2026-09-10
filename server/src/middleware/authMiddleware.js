import { verifyToken } from '../utils/jwt.js';
import { query } from '../config/db.js';

export async function protect(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to access this resource.'
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.'
      });
    }

    // Retrieve active user from database
    const users = await query('SELECT id, name, email, avatar, bio, title, created_at FROM users WHERE id = ?', [decoded.id]);
    
    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found. Please log in again.'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please verify credentials.'
    });
  }
}
