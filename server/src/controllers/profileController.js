import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const users = await query('SELECT id, name, email, avatar, bio, title, created_at, updated_at FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];

    // Aggregates & Lists
    const ownedProjectsList = await query('SELECT * FROM projects WHERE owner_id = ?', [userId]);
    const memberProjectsCount = await query('SELECT COUNT(*) as count FROM project_members WHERE user_id = ?', [userId]);
    const assignedTasksList = await query('SELECT * FROM tasks WHERE assigned_to = ?', [userId]);

    const completedTasksList = (assignedTasksList || []).filter(t => t.status === 'Completed');
    const pendingTasksList = (assignedTasksList || []).filter(t => t.status !== 'Completed');

    const totalAssigned = (assignedTasksList || []).length;
    const completedCount = completedTasksList.length;
    const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;
    const ownedCount = (ownedProjectsList || []).length;
    const memberCount = Number(memberProjectsCount[0]?.count || 0);

    res.status(200).json({
      success: true,
      data: {
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          title: user.title,
          created_at: user.created_at,
          updated_at: user.updated_at,
          stats: {
            ownedProjects: ownedCount,
            ownedProjectsCount: ownedCount,
            memberProjects: memberCount,
            projectsCount: memberCount,
            totalProjects: memberCount,
            assignedTasks: totalAssigned,
            assignedTasksCount: totalAssigned,
            completedTasks: completedCount,
            completedTasksCount: completedCount,
            pendingTasks: pendingTasksList.length,
            completionRate
          },
          ownedProjects: ownedProjectsList || [],
          assignedTasks: assignedTasksList || []
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { name, avatar, bio, title, currentPassword, newPassword } = req.body;

    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];

    // Password change verification if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);
      await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    }

    // Update profile info
    const updatedName = name !== undefined ? name.trim() : user.name;
    const updatedAvatar = avatar !== undefined ? avatar.trim() : user.avatar;
    const updatedBio = bio !== undefined ? bio.trim() : user.bio;
    const updatedTitle = title !== undefined ? title.trim() : user.title;

    await query(
      'UPDATE users SET name = ?, avatar = ?, bio = ?, title = ? WHERE id = ?',
      [updatedName, updatedAvatar, updatedBio, updatedTitle, userId]
    );

    const refreshed = await query('SELECT id, name, email, avatar, bio, title, created_at, updated_at FROM users WHERE id = ?', [userId]);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: refreshed[0]
      }
    });
  } catch (error) {
    next(error);
  }
}
