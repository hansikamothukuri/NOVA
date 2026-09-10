import { query } from '../config/db.js';

// Verify that user is a member (or owner) of the project
export async function requireProjectAccess(req, res, next) {
  try {
    const projectId = Number(req.params.projectId || req.params.id);
    const userId = req.user.id;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Valid Project ID is required.' });
    }

    // Check project exists
    const projects = await query('SELECT p.id, p.name, p.owner_id, p.status FROM projects p WHERE p.id = ?', [projectId]);
    if (!projects || projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const project = projects[0];

    // Check if user is owner
    if (project.owner_id === userId) {
      req.project = project;
      req.isOwner = true;
      req.userRole = 'Owner';
      return next();
    }

    // Check if user is in project_members
    const members = await query('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?', [projectId, userId]);
    if (!members || members.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this project.'
      });
    }

    req.project = project;
    req.isOwner = members[0].role === 'Owner';
    req.userRole = members[0].role;
    next();
  } catch (error) {
    console.error('Project access check error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while verifying project access.' });
  }
}

// Verify that user is specifically the Project Owner
export async function requireProjectOwner(req, res, next) {
  try {
    const projectId = Number(req.params.projectId || req.params.id);
    const userId = req.user.id;

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Valid Project ID is required.' });
    }

    const projects = await query('SELECT p.id, p.name, p.owner_id, p.status FROM projects p WHERE p.id = ?', [projectId]);
    if (!projects || projects.length === 0) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const project = projects[0];
    if (project.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Only the project owner can perform this operation.'
      });
    }

    req.project = project;
    req.isOwner = true;
    next();
  } catch (error) {
    console.error('Project owner check error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while verifying project ownership.' });
  }
}
