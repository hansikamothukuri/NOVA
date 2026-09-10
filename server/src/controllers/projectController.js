import { query } from '../config/db.js';

export async function getAllProjects(req, res, next) {
  try {
    const userId = req.user.id;
    const { search, status, sort } = req.query;

    // Fetch projects where current user is owner or member
    let sql = `
      SELECT DISTINCT p.id, p.name, p.description, p.owner_id, p.status, p.start_date, p.due_date, p.created_at, p.updated_at,
             u.name as owner_name, u.email as owner_email, u.avatar as owner_avatar
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE (p.owner_id = ? OR pm.user_id = ?)
    `;
    const params = [userId, userId];

    if (status) {
      const cleanStatus = String(status).trim();
      const lower = cleanStatus.toLowerCase().replace(/[\s-_]/g, '');
      if (lower !== 'all' && lower !== '') {
        const canonicalStatus =
          lower === 'planning' ? 'Planning' :
          lower === 'active' ? 'Active' :
          lower === 'onhold' ? 'On Hold' :
          lower === 'completed' ? 'Completed' : cleanStatus;
        sql += ' AND LOWER(p.status) = LOWER(?)';
        params.push(canonicalStatus);
      }
    }

    if (search && search.trim()) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (sort === 'due_date') {
      sql += ' ORDER BY p.due_date ASC, p.created_at DESC';
    } else if (sort === 'name') {
      sql += ' ORDER BY p.name ASC';
    } else {
      sql += ' ORDER BY p.created_at DESC';
    }

    const projects = await query(sql, params);

    // Dynamic enrichment of progress, task count, and members
    const enrichedProjects = await Promise.all(
      projects.map(async (p) => {
        // Tasks metrics
        const tasks = await query('SELECT id, status FROM tasks WHERE project_id = ?', [p.id]);
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'Completed').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Members
        const members = await query(`
          SELECT pm.id, pm.user_id, pm.role, u.name, u.email, u.avatar, u.title
          FROM project_members pm
          JOIN users u ON pm.user_id = u.id
          WHERE pm.project_id = ?
        `, [p.id]);

        const userMembership = members.find(m => m.user_id === userId);
        const userRole = p.owner_id === userId ? 'Owner' : (userMembership ? userMembership.role : 'Member');

        return {
          ...p,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          progress,
          member_count: members.length,
          members,
          user_role: userRole
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        projects: enrichedProjects
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req, res, next) {
  try {
    const { name, description, status = 'Planning', start_date, due_date } = req.body;
    const ownerId = req.user.id;

    // 1. Insert Project into MySQL
    const result = await query(
      'INSERT INTO projects (name, description, owner_id, status, start_date, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), description ? description.trim() : '', ownerId, status, start_date || null, due_date || null]
    );

    const projectId = result.insertId;

    // 2. Automatically ensure project membership for owner
    const existingMembership = await query(
      'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
      [projectId, ownerId]
    );
    if (!existingMembership || existingMembership.length === 0) {
      await query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
        [projectId, ownerId, 'Owner']
      );
    }

    // Retrieve fresh created project
    const createdProjects = await query(`
      SELECT p.*, u.name as owner_name, u.email as owner_email, u.avatar as owner_avatar
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `, [projectId]);

    const project = createdProjects[0];

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: {
        project: {
          ...project,
          total_tasks: 0,
          completed_tasks: 0,
          progress: 0,
          member_count: 1,
          user_role: 'Owner'
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectById(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const userId = req.user.id;

    const projects = await query(`
      SELECT p.*, u.name as owner_name, u.email as owner_email, u.avatar as owner_avatar
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `, [projectId]);

    if (!projects || projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const project = projects[0];

    // Verify membership or ownership
    const isOwner = project.owner_id === userId;
    const membership = await query('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);

    if (!isOwner && (!membership || membership.length === 0)) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this project.' });
    }

    const userRole = isOwner ? 'Owner' : membership[0].role;

    // Get members
    const members = await query(`
      SELECT pm.id, pm.user_id, pm.role, pm.joined_at, u.name, u.email, u.avatar, u.title, u.bio
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.role ASC, u.name ASC
    `, [projectId]);

    // Get tasks with assignee info
    const tasks = await query(`
      SELECT t.*, u.name as assignee_name, u.email as assignee_email, u.avatar as assignee_avatar,
             c.name as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.project_id = ?
      ORDER BY t.created_at DESC
    `, [projectId]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        project: {
          ...project,
          progress,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          member_count: members.length,
          user_role: userRole,
          members,
          tasks
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const userId = req.user.id;
    const { name, description, status, start_date, due_date } = req.body;

    // Verify ownership
    const projects = await query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!projects || projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const project = projects[0];
    if (project.owner_id !== userId) {
      return res.status(403).json({ success: false, message: 'Only the project owner can update project details.' });
    }

    await query(
      'UPDATE projects SET name = ?, description = ?, status = ?, start_date = ?, due_date = ? WHERE id = ?',
      [
        name !== undefined ? name.trim() : project.name,
        description !== undefined ? description.trim() : project.description,
        status !== undefined ? status : project.status,
        start_date !== undefined ? start_date : project.start_date,
        due_date !== undefined ? due_date : project.due_date,
        projectId
      ]
    );

    const updatedProjects = await query('SELECT * FROM projects WHERE id = ?', [projectId]);

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: {
        project: updatedProjects[0]
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const userId = req.user.id;

    const projects = await query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!projects || projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (projects[0].owner_id !== userId) {
      return res.status(403).json({ success: false, message: 'Only the project owner can delete this project.' });
    }

    // Cascade delete tasks, members, and project
    await query('DELETE FROM tasks WHERE project_id = ?', [projectId]);
    await query('DELETE FROM project_members WHERE project_id = ?', [projectId]);
    await query('DELETE FROM projects WHERE id = ?', [projectId]);

    res.status(200).json({
      success: true,
      message: 'Project and all related tasks deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

export async function joinProject(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const userId = req.user.id;

    const projects = await query('SELECT id, name, owner_id FROM projects WHERE id = ?', [projectId]);
    if (!projects || projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const existing = await query('SELECT id, role FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
    if (existing && existing.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'You are already a member of this project.',
        data: { projectId, role: existing[0].role }
      });
    }

    await query('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)', [projectId, userId, 'Member']);

    res.status(200).json({
      success: true,
      message: 'Successfully joined project.',
      data: { projectId, role: 'Member' }
    });
  } catch (error) {
    next(error);
  }
}

