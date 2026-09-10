import { query } from '../config/db.js';

export async function getProjectMembers(req, res, next) {
  try {
    const projectId = Number(req.params.id);

    const members = await query(`
      SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.joined_at,
             u.name, u.email, u.avatar, u.title, u.bio
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.role ASC, u.name ASC
    `, [projectId]);

    res.status(200).json({
      success: true,
      data: {
        members
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function addProjectMember(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const ownerId = req.user.id;
    const { email, role = 'Member' } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid user email address is required.' });
    }

    // 1. Verify project exists & requester is owner
    const projects = await query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!projects || projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (projects[0].owner_id !== ownerId) {
      return res.status(403).json({ success: false, message: 'Forbidden. Only the project owner can add team members.' });
    }

    // 2. Lookup user by email
    const users = await query('SELECT id, name, email, avatar, title FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        notRegistered: true,
        email: email.trim().toLowerCase(),
        message: `No registered NOVA user found with email "${email}".`
      });
    }

    const targetUser = users[0];

    // 3. Verify user isn't already a member
    const existing = await query('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, targetUser.id]);
    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `${targetUser.name} (${targetUser.email}) is already a member of this project.`
      });
    }

    // 4. Add membership
    const result = await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
      [projectId, targetUser.id, role === 'Owner' ? 'Owner' : 'Member']
    );

    res.status(201).json({
      success: true,
      message: `${targetUser.name} added to project successfully.`,
      data: {
        member: {
          id: result.insertId,
          project_id: projectId,
          user_id: targetUser.id,
          role: role === 'Owner' ? 'Owner' : 'Member',
          name: targetUser.name,
          email: targetUser.email,
          avatar: targetUser.avatar,
          title: targetUser.title,
          joined_at: new Date()
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function removeProjectMember(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const targetUserId = Number(req.params.userId);
    const requesterId = req.user.id;

    // Verify project exists & requester is owner
    const projects = await query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!projects || projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const project = projects[0];
    if (project.owner_id !== requesterId) {
      return res.status(403).json({ success: false, message: 'Only the project owner can remove team members.' });
    }

    // Prevent removing the project owner
    if (targetUserId === project.owner_id) {
      return res.status(400).json({ success: false, message: 'Cannot remove the project owner from the project.' });
    }

    // Reassign any tasks currently assigned to this user to null
    await query('UPDATE tasks SET assigned_to = NULL WHERE project_id = ? AND assigned_to = ?', [projectId, targetUserId]);

    // Remove from project_members
    await query('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, targetUserId]);

    res.status(200).json({
      success: true,
      message: 'Team member removed from project successfully.'
    });
  } catch (error) {
    next(error);
  }
}
