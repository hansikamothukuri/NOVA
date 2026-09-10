import { query } from '../config/db.js';

export async function getProjectTasks(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const { status, priority, assigned_to, search, sort } = req.query;

    let sql = `
      SELECT t.*,
             u.name as assignee_name, u.email as assignee_email, u.avatar as assignee_avatar,
             c.name as creator_name,
             p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.project_id = ?
    `;
    const params = [projectId];

    if (status && status !== 'All' && status !== 'all') {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    if (priority && priority !== 'All' && priority !== 'all') {
      sql += ' AND t.priority = ?';
      params.push(priority);
    }

    if (assigned_to && assigned_to !== 'All' && assigned_to !== 'all') {
      sql += ' AND t.assigned_to = ?';
      params.push(Number(assigned_to));
    }

    if (search && search.trim()) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (sort === 'due_date') {
      sql += ' ORDER BY t.due_date ASC, t.created_at DESC';
    } else if (sort === 'priority') {
      // Custom ordering for priority: Urgent -> High -> Medium -> Low
      sql += ` ORDER BY CASE t.priority
        WHEN 'Urgent' THEN 1
        WHEN 'High' THEN 2
        WHEN 'Medium' THEN 3
        WHEN 'Low' THEN 4
        ELSE 5 END, t.created_at DESC`;
    } else {
      sql += ' ORDER BY t.created_at DESC';
    }

    const tasks = await query(sql, params);

    res.status(200).json({
      success: true,
      data: {
        tasks
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createTask(req, res, next) {
  try {
    const projectId = Number(req.params.id);
    const creatorId = req.user.id;
    const { title, description, assigned_to, status = 'Todo', priority = 'Medium', due_date } = req.body;

    // Verify user has access to this project
    const projects = await query('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!projects || projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const project = projects[0];
    const isOwner = project.owner_id === creatorId;
    const membership = await query('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, creatorId]);

    if (!isOwner && (!membership || membership.length === 0)) {
      return res.status(403).json({ success: false, message: 'You must be a project member or owner to create tasks.' });
    }

    // Verify assignee if provided
    let assignedUserId = null;
    if (assigned_to) {
      const parsedAssigned = Number(assigned_to);
      const userExists = await query('SELECT id FROM users WHERE id = ?', [parsedAssigned]);
      if (userExists && userExists.length > 0) {
        assignedUserId = parsedAssigned;
        // Auto-add assigned registered user as project member so they have access
        try {
          const isMember = await query(
            'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
            [projectId, assignedUserId]
          );
          if (!isMember || isMember.length === 0) {
            await query(
              'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
              [projectId, assignedUserId, 'Member']
            );
          }
        } catch (memberErr) {
          console.warn('Could not auto-add assignee to project_members:', memberErr);
        }
      }
    }

    const result = await query(
      'INSERT INTO tasks (project_id, title, description, assigned_to, created_by, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        projectId,
        title.trim(),
        description ? description.trim() : '',
        assignedUserId,
        creatorId,
        status,
        priority,
        due_date || null
      ]
    );

    const taskId = result.insertId;
    const createdTasks = await query(`
      SELECT t.*,
             u.name as assignee_name, u.email as assignee_email, u.avatar as assignee_avatar,
             c.name as creator_name,
             p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `, [taskId]);

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: {
        task: createdTasks[0]
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getTaskById(req, res, next) {
  try {
    const taskId = Number(req.params.id);
    const userId = req.user.id;

    const tasks = await query(`
      SELECT t.*,
             u.name as assignee_name, u.email as assignee_email, u.avatar as assignee_avatar,
             c.name as creator_name, c.email as creator_email,
             p.name as project_name, p.owner_id as project_owner_id
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `, [taskId]);

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const task = tasks[0];

    // Check project permission
    const isOwner = task.project_owner_id === userId;
    const isAssignee = task.assigned_to === userId;
    const isCreator = task.created_by === userId;
    const membership = await query('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [task.project_id, userId]);

    if (!isOwner && !isAssignee && !isCreator && (!membership || membership.length === 0)) {
      return res.status(403).json({ success: false, message: 'Access denied to this task.' });
    }

    res.status(200).json({
      success: true,
      data: {
        task,
        permissions: {
          canEdit: isOwner || isAssignee || isCreator,
          canDelete: isOwner || isCreator,
          isOwner
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const taskId = Number(req.params.id);
    const userId = req.user.id;
    const { title, description, assigned_to, status, priority, due_date } = req.body;

    const tasks = await query(`
      SELECT t.*, p.owner_id as project_owner_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `, [taskId]);

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const task = tasks[0];
    const isOwner = task.project_owner_id === userId;
    const isAssignee = task.assigned_to === userId;
    const isCreator = task.created_by === userId;
    const membership = await query('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [task.project_id, userId]);
    const isMember = membership && membership.length > 0;

    if (!isOwner && !isAssignee && !isCreator && !isMember) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this task.' });
    }

    // Prepare updated fields
    const newTitle = (title !== undefined && (isOwner || isCreator)) ? title.trim() : task.title;
    const newDescription = (description !== undefined && (isOwner || isCreator || isAssignee)) ? description.trim() : task.description;
    const newStatus = status !== undefined ? status : task.status;
    const newPriority = (priority !== undefined && (isOwner || isCreator)) ? priority : task.priority;
    const newDueDate = (due_date !== undefined && (isOwner || isCreator)) ? due_date : task.due_date;
    
    let newAssignedTo = task.assigned_to;
    if (assigned_to !== undefined && (isOwner || isCreator)) {
      newAssignedTo = assigned_to ? Number(assigned_to) : null;
      if (newAssignedTo) {
        try {
          const isMember = await query(
            'SELECT id FROM project_members WHERE project_id = ? AND user_id = ?',
            [task.project_id, newAssignedTo]
          );
          if (!isMember || isMember.length === 0) {
            await query(
              'INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
              [task.project_id, newAssignedTo, 'Member']
            );
          }
        } catch (memberErr) {
          console.warn('Could not auto-add updated assignee to project_members:', memberErr);
        }
      }
    }

    await query(
      'UPDATE tasks SET title = ?, description = ?, assigned_to = ?, status = ?, priority = ?, due_date = ? WHERE id = ?',
      [newTitle, newDescription, newAssignedTo, newStatus, newPriority, newDueDate, taskId]
    );

    const updatedTasks = await query(`
      SELECT t.*,
             u.name as assignee_name, u.email as assignee_email, u.avatar as assignee_avatar,
             c.name as creator_name,
             p.name as project_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users c ON t.created_by = c.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `, [taskId]);

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: {
        task: updatedTasks[0]
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const taskId = Number(req.params.id);
    const userId = req.user.id;

    const tasks = await query(`
      SELECT t.*, p.owner_id as project_owner_id
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = ?
    `, [taskId]);

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const task = tasks[0];
    const isOwner = task.project_owner_id === userId;
    const isCreator = task.created_by === userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({ success: false, message: 'Only the project owner or task creator can delete this task.' });
    }

    await query('DELETE FROM tasks WHERE id = ?', [taskId]);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}
