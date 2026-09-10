// Input validation helpers for request parameters and bodies

export function validateRegister(req, res, next) {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Full name is required (minimum 2 characters).' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  next();
}

export function validateProject(req, res, next) {
  const { name, start_date, due_date, status } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Project name is required.' });
  }

  if (status && !['Planning', 'Active', 'On Hold', 'Completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be Planning, Active, On Hold, or Completed.' });
  }

  if (start_date && due_date) {
    const start = new Date(start_date);
    const due = new Date(due_date);
    if (!isNaN(start.getTime()) && !isNaN(due.getTime()) && due < start) {
      return res.status(400).json({ success: false, message: 'Due date cannot be earlier than start date.' });
    }
  }

  next();
}

export function validateTask(req, res, next) {
  const { title, status, priority } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Task title is required.' });
  }

  if (status && !['Todo', 'In Progress', 'Review', 'Completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be Todo, In Progress, Review, or Completed.' });
  }

  if (priority && !['Low', 'Medium', 'High', 'Urgent'].includes(priority)) {
    return res.status(400).json({ success: false, message: 'Priority must be Low, Medium, High, or Urgent.' });
  }

  next();
}
