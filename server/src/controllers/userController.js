import { query } from '../config/db.js';

export async function getAllUsers(req, res, next) {
  try {
    const users = await query('SELECT id, name, email, avatar, title FROM users ORDER BY name ASC');
    res.status(200).json({
      success: true,
      data: {
        users: users || []
      }
    });
  } catch (error) {
    next(error);
  }
}
