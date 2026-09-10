import { query } from '../config/db.js';

export async function getDashboardStats(req, res, next) {
  try {
    const userId = req.user.id;

    // Get all projects the user is involved in (as owner or member)
    const projects = await query(`
      SELECT DISTINCT p.id, p.name, p.description, p.owner_id, p.status, p.start_date, p.due_date, p.created_at,
             u.name as owner_name, u.avatar as owner_avatar
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE (p.owner_id = ? OR pm.user_id = ?)
      ORDER BY p.created_at DESC
    `, [userId, userId]);

    const projectIds = projects.map(p => p.id);

    // Calculate Project Metrics
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const planningProjects = projects.filter(p => p.status === 'Planning').length;
    const onHoldProjects = projects.filter(p => p.status === 'On Hold').length;

    let allTasks = [];
    if (projectIds.length > 0) {
      allTasks = await query(`
        SELECT t.*,
               u.name as assignee_name, u.email as assignee_email, u.avatar as assignee_avatar,
               p.name as project_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.project_id IN (${projectIds.map(() => '?').join(',')})
        ORDER BY t.created_at DESC
      `, projectIds);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const totalTasks = allTasks.length;
    const pendingTasks = allTasks.filter(t => t.status === 'Todo').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'In Progress').length;
    const reviewTasks = allTasks.filter(t => t.status === 'Review').length;
    const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
    
    // Overdue: due_date < today AND status != 'Completed'
    const overdueTasks = allTasks.filter(t => {
      if (!t.due_date || t.status === 'Completed') return false;
      const due = typeof t.due_date === 'string' ? t.due_date.slice(0, 10) : new Date(t.due_date).toISOString().slice(0, 10);
      return due < todayStr;
    }).length;

    const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Enrich all user projects with task count, member count, and progress
    const recentProjects = await Promise.all(
      projects.map(async (p) => {
        const pTasks = allTasks.filter(t => t.project_id === p.id);
        const pTotal = pTasks.length;
        const pDone = pTasks.filter(t => t.status === 'Completed').length;
        const pProgress = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;

        const members = await query('SELECT COUNT(*) as count FROM project_members WHERE project_id = ?', [p.id]);
        const memberCount = members[0]?.count || 1;

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          due_date: p.due_date,
          owner_name: p.owner_name,
          owner_avatar: p.owner_avatar,
          total_tasks: pTotal,
          completed_tasks: pDone,
          progress: pProgress,
          member_count: Number(memberCount)
        };
      })
    );

    // Recent 6 tasks
    const recentTasks = allTasks.slice(0, 6).map(t => ({
      id: t.id,
      project_id: t.project_id,
      project_name: t.project_name,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      assignee_name: t.assignee_name,
      assignee_avatar: t.assignee_avatar
    }));

    // My Assigned Tasks (for current user)
    const myTasks = allTasks.filter(t => t.assigned_to === userId).slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProjects,
          activeProjects,
          completedProjects,
          planningProjects,
          onHoldProjects,
          totalTasks,
          pendingTasks,
          inProgressTasks,
          reviewTasks,
          completedTasks,
          overdueTasks,
          overallCompletionRate
        },
        recentProjects,
        recentTasks,
        myTasks
      }
    });
  } catch (error) {
    next(error);
  }
}
