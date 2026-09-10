import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { generateToken } from '../utils/jwt.js';

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default avatar using dicebear
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`;
    const bio = 'Productive NOVA collaborator.';
    const title = 'Team Contributor';

    const result = await query(
      'INSERT INTO users (name, email, password_hash, avatar, bio, title) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), normalizedEmail, passwordHash, avatar, bio, title]
    );

    const newUserId = result.insertId;
    const createdUsers = await query('SELECT id, name, email, avatar, bio, title, created_at FROM users WHERE id = ?', [newUserId]);
    const user = createdUsers[0];

    // If an invitation to a project was provided, automatically add the newly registered user to that project
    const inviteProjectId = Number(req.body.invite_project);
    if (inviteProjectId && !isNaN(inviteProjectId)) {
      try {
        const targetProject = await query('SELECT id FROM projects WHERE id = ?', [inviteProjectId]);
        if (targetProject && targetProject.length > 0) {
          const existingMember = await query(
            'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
            [inviteProjectId, newUserId]
          );
          if (!existingMember || existingMember.length === 0) {
            await query(
              'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
              [inviteProjectId, newUserId, 'Member']
            );
          }
        }
      } catch (inviteErr) {
        console.warn('Could not auto-add newly registered user to project:', inviteErr);
      }
    }

    const token = generateToken({ id: user.id, email: user.email });

    // Optionally set HTTP-only cookie (iframe-friendly secure sameSite none)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Welcome to NOVA!',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const users = await query('SELECT id, name, email, password_hash, avatar, bio, title, created_at FROM users WHERE email = ?', [normalizedEmail]);
    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken({ id: user.id, email: user.email });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      title: user.title,
      created_at: user.created_at
    };

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: safeUser,
        token
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
}

export async function getMe(req, res, next) {
  try {
    const user = req.user;
    
    // Enrich with user statistics
    const ownedProjects = await query('SELECT COUNT(*) as count FROM projects WHERE owner_id = ?', [user.id]);
    const assignedTasks = await query('SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ?', [user.id]);
    const completedTasks = await query('SELECT COUNT(*) as count FROM tasks WHERE assigned_to = ? AND status = "Completed"', [user.id]);

    const ownedCount = ownedProjects[0]?.count || 0;
    const assignedCount = assignedTasks[0]?.count || 0;
    const completedCount = completedTasks[0]?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user,
          stats: {
            ownedProjects: Number(ownedCount),
            assignedTasks: Number(assignedCount),
            completedTasks: Number(completedCount)
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// In-memory store for reset verification codes: email -> { code, expiresAt, userId }
const resetCodes = new Map();

/**
 * @desc    Request password reset code
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = await query('SELECT id, name, email FROM users WHERE email = ?', [normalizedEmail]);

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No account found with ${normalizedEmail}. Please check your email address or create a new account.`,
      });
    }

    const user = users[0];
    // Generate a 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    resetCodes.set(normalizedEmail, {
      code,
      expiresAt,
      userId: user.id,
    });

    console.log(`[AUTH] Password reset code for ${normalizedEmail}: ${code}`);

    res.status(200).json({
      success: true,
      message: `A password reset code has been sent to ${normalizedEmail}.`,
      data: {
        email: normalizedEmail,
        code, // Returned for preview/testing convenience
        expiresInMinutes: 15,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Reset password using verification code
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!code || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Verification reset code is required.',
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    const record = resetCodes.get(normalizedEmail);
    if (!record) {
      return res.status(400).json({
        success: false,
        message: 'No reset request found for this email, or the code has expired. Please request a new code.',
      });
    }

    if (Date.now() > record.expiresAt) {
      resetCodes.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      });
    }

    if (record.code !== code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check the code and try again.',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await query('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, normalizedEmail]);

    // Clear reset code
    resetCodes.delete(normalizedEmail);

    res.status(200).json({
      success: true,
      message: 'Your password has been successfully reset! You can now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
}
