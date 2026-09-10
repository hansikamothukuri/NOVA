import { query } from '../config/db.js';

function isValidUrl(string) {
  if (!string || typeof string !== 'string') return false;
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * @desc    Get all meetings relevant to the authenticated user
 * @route   GET /api/meetings
 * @access  Private
 */
export const getMeetings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId, status } = req.query;

    let sql = 'SELECT * FROM meetings';
    let params = [];

    if (projectId) {
      sql = 'SELECT * FROM meetings WHERE project_id = ?';
      params = [Number(projectId)];
    }

    const rows = await query(sql, params);

    // Filter by status if provided
    let meetings = rows;
    if (status && status !== 'all') {
      meetings = meetings.filter(m => (m.status || '').toLowerCase() === status.toLowerCase());
    }

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single meeting by ID
 * @route   GET /api/meetings/:id
 * @access  Private
 */
export const getMeetingById = async (req, res, next) => {
  try {
    const meetingId = Number(req.params.id);
    const rows = await query('SELECT * FROM meetings WHERE id = ?', [meetingId]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Meeting not found with ID ${meetingId}`,
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Schedule a new meeting (Team-based recipients)
 * @route   POST /api/meetings
 * @access  Private
 */
export const createMeeting = async (req, res, next) => {
  try {
    const organizer_id = req.user.id;
    const {
      title,
      description,
      project_id,
      start_time,
      end_time,
      meeting_link,
      platform,
      additional_attendees,
      attendees,
    } = req.body;

    // 1. Validate Title
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Meeting title is required.',
      });
    }

    // 2. Validate Project Team Selection
    if (!project_id) {
      return res.status(400).json({
        success: false,
        message: 'Please select a project team for this meeting.',
      });
    }

    const projectIdNum = Number(project_id);
    const projectRows = await query('SELECT * FROM projects WHERE id = ?', [projectIdNum]);
    if (!projectRows || projectRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Selected project team does not exist.',
      });
    }
    const project = projectRows[0];

    // 3. Validate Date, Start Time and End Time
    if (!start_time) {
      return res.status(400).json({
        success: false,
        message: 'Meeting start time is required.',
      });
    }

    const startDate = new Date(start_time);
    if (isNaN(startDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meeting date or start time.',
      });
    }

    if (!end_time) {
      return res.status(400).json({
        success: false,
        message: 'Meeting end time is required.',
      });
    }

    const endDate = new Date(end_time);
    if (isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid meeting end time.',
      });
    }

    if (endDate.getTime() <= startDate.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Meeting end time must be after the start time.',
      });
    }

    // 4. Validate Meeting Link (Manually entered by scheduler)
    if (!meeting_link || !meeting_link.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Meeting link is required. Please paste your Zoom or Google Meet URL.',
      });
    }

    const trimmedLink = meeting_link.trim();
    if (!isValidUrl(trimmedLink)) {
      return res.status(400).json({
        success: false,
        message: 'Meeting link must be a valid HTTP or HTTPS URL (e.g., https://meet.google.com/xxx-yyyy-zzz or https://zoom.us/j/123456789).',
      });
    }

    // 5. Query Project Members (team-based automatic recipients)
    const members = await query(`
      SELECT pm.id, pm.project_id, pm.user_id, pm.role,
             u.name, u.email, u.avatar, u.title
      FROM project_members pm
      JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = ?
      ORDER BY pm.role ASC, u.name ASC
    `, [projectIdNum]);

    if (!members || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: `Project "${project.name}" has no registered team members. Please add members to the project first.`,
      });
    }

    // Automatically include all project members as meeting recipients
    const recipientsMap = new Map();
    for (const m of members) {
      recipientsMap.set(Number(m.user_id), {
        user_id: Number(m.user_id),
        name: m.name,
        email: m.email,
        avatar: m.avatar,
        role: m.role || 'Member',
        status: 'accepted',
      });
    }

    // Ensure the organizer is also included
    if (!recipientsMap.has(Number(organizer_id))) {
      recipientsMap.set(Number(organizer_id), {
        user_id: Number(organizer_id),
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        role: 'Host',
        status: 'accepted',
      });
    }

    // 6. Optional Additional Members (e.g., Mentor, Manager, Faculty, External collaborator)
    const extraList = Array.isArray(additional_attendees)
      ? additional_attendees
      : (Array.isArray(attendees) ? attendees.filter(a => !recipientsMap.has(Number(a.user_id))) : []);

    for (const extra of extraList) {
      const extraId = Number(extra.user_id || extra.id);
      if (extraId && !recipientsMap.has(extraId)) {
        recipientsMap.set(extraId, {
          user_id: extraId,
          name: extra.name || 'Additional Member',
          email: extra.email || '',
          avatar: extra.avatar || null,
          role: extra.role || 'Guest',
          status: 'pending',
        });
      }
    }

    const finalAttendees = Array.from(recipientsMap.values());

    const insertResult = await query(
      'INSERT INTO meetings (title, description, project_id, organizer_id, start_time, end_time, meeting_link, status, attendees, platform) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        title.trim(),
        description ? description.trim() : '',
        projectIdNum,
        organizer_id,
       startDate.toISOString().slice(0, 19).replace('T', ' '),
       endDate.toISOString().slice(0, 19).replace('T', ' '),
        trimmedLink,
        'Scheduled',
        JSON.stringify(finalAttendees),
        platform || (trimmedLink.includes('zoom.us') ? 'Zoom' : trimmedLink.includes('meet.google.com') ? 'Google Meet' : 'Other'),
      ]
    );

    const newMeetingRows = await query('SELECT * FROM meetings WHERE id = ?', [insertResult.insertId]);

    res.status(201).json({
      success: true,
      message: 'Meeting scheduled successfully for team',
      data: newMeetingRows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update / Reschedule meeting
 * @route   PUT /api/meetings/:id
 * @access  Private
 */
export const updateMeeting = async (req, res, next) => {
  try {
    const meetingId = Number(req.params.id);
    const existingRows = await query('SELECT * FROM meetings WHERE id = ?', [meetingId]);

    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Meeting not found with ID ${meetingId}`,
      });
    }

    const existing = existingRows[0];
    const {
      title,
      description,
      project_id,
      start_time,
      end_time,
      meeting_link,
      status,
      additional_attendees,
      attendees,
    } = req.body;

    if (title !== undefined && (!title || !title.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Meeting title is required.',
      });
    }

    if (meeting_link !== undefined) {
      if (!meeting_link || !meeting_link.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Meeting link is required.',
        });
      }
      if (!isValidUrl(meeting_link.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Meeting link must be a valid URL.',
        });
      }
    }

    let finalAttendees = existing.attendees;
    const targetProjectId = project_id !== undefined ? (project_id ? Number(project_id) : null) : existing.project_id;

    if (project_id !== undefined && Number(project_id) !== Number(existing.project_id) && project_id) {
      const members = await query(`
        SELECT pm.id, pm.project_id, pm.user_id, pm.role,
               u.name, u.email, u.avatar, u.title
        FROM project_members pm
        JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = ?
        ORDER BY pm.role ASC, u.name ASC
      `, [Number(project_id)]);

      if (!members || members.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Selected project team has no registered members.',
        });
      }

      const recipientsMap = new Map();
      for (const m of members) {
        recipientsMap.set(Number(m.user_id), {
          user_id: Number(m.user_id),
          name: m.name,
          email: m.email,
          avatar: m.avatar,
          role: m.role || 'Member',
          status: 'accepted',
        });
      }

      if (!recipientsMap.has(Number(existing.organizer_id))) {
        recipientsMap.set(Number(existing.organizer_id), {
          user_id: Number(existing.organizer_id),
          name: existing.organizer_name || 'Organizer',
          email: existing.organizer_email || '',
          avatar: existing.organizer_avatar || null,
          role: 'Host',
          status: 'accepted',
        });
      }

      const extraList = Array.isArray(additional_attendees) ? additional_attendees : [];
      for (const extra of extraList) {
        const extraId = Number(extra.user_id || extra.id);
        if (extraId && !recipientsMap.has(extraId)) {
          recipientsMap.set(extraId, {
            user_id: extraId,
            name: extra.name || 'Additional Member',
            email: extra.email || '',
            avatar: extra.avatar || null,
            role: extra.role || 'Guest',
            status: 'pending',
          });
        }
      }
      finalAttendees = Array.from(recipientsMap.values());
    } else if (attendees !== undefined) {
      finalAttendees = typeof attendees === 'string' ? JSON.parse(attendees) : attendees;
    }

    const finalStart = start_time
  ? new Date(start_time).toISOString().slice(0, 19).replace('T', ' ')
  : existing.start_time;

const finalEnd = end_time
  ? new Date(end_time).toISOString().slice(0, 19).replace('T', ' ')
  : existing.end_time;

    if (new Date(finalEnd).getTime() <= new Date(finalStart).getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Meeting end time must be after the start time.',
      });
    }

    await query(
      'UPDATE meetings SET title = ?, description = ?, project_id = ?, start_time = ?, end_time = ?, meeting_link = ?, status = ?, attendees = ? WHERE id = ?',
      [
        title !== undefined ? title.trim() : existing.title,
        description !== undefined ? description.trim() : existing.description,
        targetProjectId,
        finalStart,
        finalEnd,
        meeting_link !== undefined ? meeting_link.trim() : existing.meeting_link,
        status !== undefined ? status : existing.status,
        JSON.stringify(finalAttendees || []),
        meetingId,
      ]
    );

    const updatedRows = await query('SELECT * FROM meetings WHERE id = ?', [meetingId]);

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      data: updatedRows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel / delete meeting
 * @route   DELETE /api/meetings/:id
 * @access  Private
 */
export const deleteMeeting = async (req, res, next) => {
  try {
    const meetingId = Number(req.params.id);
    const existing = await query('SELECT * FROM meetings WHERE id = ?', [meetingId]);

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Meeting not found with ID ${meetingId}`,
      });
    }

    await query('DELETE FROM meetings WHERE id = ?', [meetingId]);

    res.status(200).json({
      success: true,
      message: 'Meeting cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};
