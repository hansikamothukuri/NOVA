-- ==========================================================
-- NOVA — Full-Stack Project Management Database Seeds
-- Database: nova_db
-- Seed users, projects, team memberships, and tasks
-- All seed accounts use password: password123
-- ==========================================================

USE nova_db;

-- 1. Insert Users
-- Bcrypt hash for 'password123': $2b$10$G2dntPs4fqsDDCjFdbyKAuwCq7HaHzHX.8/3sLZ9p7WNnRkZg/mg6
INSERT INTO users (id, name, email, password_hash, avatar, bio, title, created_at) VALUES
(1, 'Alex Johnson', 'alex@nova.dev', '$2b$10$G2dntPs4fqsDDCjFdbyKAuwCq7HaHzHX.8/3sLZ9p7WNnRkZg/mg6', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80', 'Engineering Lead passionate about building scalable, user-centric systems.', 'Engineering Lead', NOW()),
(2, 'Sarah Williams', 'sarah@nova.dev', '$2b$10$G2dntPs4fqsDDCjFdbyKAuwCq7HaHzHX.8/3sLZ9p7WNnRkZg/mg6', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80', 'Staff Frontend Architect with deep expertise in React design systems.', 'Staff Frontend Architect', NOW()),
(3, 'David Miller', 'david@nova.dev', '$2b$10$G2dntPs4fqsDDCjFdbyKAuwCq7HaHzHX.8/3sLZ9p7WNnRkZg/mg6', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80', 'Senior Backend & Database Engineer obsessed with query optimization.', 'Senior Backend Engineer', NOW()),
(4, 'Emma Brown', 'emma@nova.dev', '$2b$10$G2dntPs4fqsDDCjFdbyKAuwCq7HaHzHX.8/3sLZ9p7WNnRkZg/mg6', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80', 'Product Designer focused on micro-interactions and design ergonomics.', 'Lead Product Designer', NOW()),
(5, 'Michael Chen', 'michael@nova.dev', '$2b$10$G2dntPs4fqsDDCjFdbyKAuwCq7HaHzHX.8/3sLZ9p7WNnRkZg/mg6', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80', 'DevOps & Reliability Engineer building seamless CI/CD pipelines.', 'DevOps Engineer', NOW());

-- 2. Insert Projects
INSERT INTO projects (id, name, description, owner_id, status, start_date, due_date, created_at) VALUES
(1, 'NOVA Website Redesign', 'Revamp the core product marketing web portal, interactive playground, and design system documentation.', 1, 'Active', '2026-03-01', '2026-04-15', NOW()),
(2, 'Mobile App Development', 'Native cross-platform iOS & Android companion app for on-the-go task status updates and notifications.', 1, 'Active', '2026-03-10', '2026-05-30', NOW()),
(3, 'Marketing Campaign Q2', 'Global multi-channel product launch campaign across developer communities, podcasts, and social media.', 2, 'Planning', '2026-04-01', '2026-06-15', NOW()),
(4, 'Database Infrastructure Migration', 'Upgrade MySQL cluster to high-availability multi-region replicas with automated failover and caching.', 3, 'On Hold', '2026-02-15', '2026-04-30', NOW());

-- 3. Insert Project Memberships (with unique constraints and roles)
INSERT INTO project_members (id, project_id, user_id, role, joined_at) VALUES
-- Project 1 Members (NOVA Website Redesign)
(1, 1, 1, 'Owner', NOW()),
(2, 1, 2, 'Member', NOW()),
(3, 1, 4, 'Member', NOW()),
(4, 1, 3, 'Member', NOW()),

-- Project 2 Members (Mobile App Development)
(5, 2, 1, 'Owner', NOW()),
(6, 2, 2, 'Member', NOW()),
(7, 2, 5, 'Member', NOW()),

-- Project 3 Members (Marketing Campaign Q2)
(8, 3, 2, 'Owner', NOW()),
(9, 3, 1, 'Member', NOW()),
(10, 3, 4, 'Member', NOW()),

-- Project 4 Members (Database Infrastructure)
(11, 4, 3, 'Owner', NOW()),
(12, 4, 1, 'Member', NOW()),
(13, 4, 5, 'Member', NOW());

-- 4. Insert Tasks
INSERT INTO tasks (id, project_id, title, description, assigned_to, created_by, status, priority, due_date, created_at) VALUES
-- Project 1 Tasks
(1, 1, 'Design landing page hero section', 'Create modern high-contrast typography, interactive product preview widget, and responsive layout.', 4, 1, 'Completed', 'High', '2026-03-12', NOW()),
(2, 1, 'Build authentication system & JWT flow', 'Implement bcrypt password hashing, JWT token issue, auth middleware, and protected routing.', 3, 1, 'Completed', 'Urgent', '2026-03-15', NOW()),
(3, 1, 'Create interactive dashboard analytics', 'Display real-time project metrics, task completion percentage, overdue counters, and workload charts.', 2, 1, 'In Progress', 'High', '2026-03-25', NOW()),
(4, 1, 'Implement responsive Kanban board', 'Columns for Todo, In Progress, Review, Completed with quick status changes and filters.', 2, 1, 'In Progress', 'Urgent', '2026-03-28', NOW()),
(5, 1, 'Prepare production deployment & docker config', 'Setup production build, environment configuration, database connection pooling, and health checks.', 5, 1, 'Todo', 'Medium', '2026-04-10', NOW()),

-- Project 2 Tasks (Mobile App Development)
(6, 2, 'Design mobile navigation architecture', 'Bottom navigation tabs, gesture interactions, and dark/light adaptive color palette.', 4, 1, 'Completed', 'High', '2026-03-18', NOW()),
(7, 2, 'Implement offline sync & local caching', 'SQLite / local key-value store for offline task edits with background conflict resolution.', 1, 1, 'In Progress', 'Urgent', '2026-04-12', NOW()),
(8, 2, 'Setup push notification dispatch service', 'Configure FCM and APNS integration for task assignment and mention notifications.', 5, 1, 'Todo', 'Medium', '2026-05-01', NOW()),
(9, 2, 'Conduct usability audit on small screens', 'Test touch target ergonomics (>= 44px) and input validation flow on iOS and Android.', 2, 1, 'Review', 'Low', '2026-05-15', NOW()),

-- Project 3 Tasks (Marketing Campaign Q2)
(10, 3, 'Draft technical launch blog post', 'Deep-dive article detailing the architecture, speed, and real-time collaboration advantages.', 2, 2, 'Todo', 'Medium', '2026-04-15', NOW()),
(11, 3, 'Create demo walkthrough video assets', 'Record high-resolution animated GIFs and 60-second product demo for Twitter and ProductHunt.', 4, 2, 'Review', 'High', '2026-04-20', NOW()),

-- Project 4 Tasks (Database Infrastructure Migration)
(12, 4, 'Benchmark MySQL 8.0 query latency', 'Run EXPLAIN ANALYZE on complex joins between projects, tasks, and members with 500k rows.', 3, 3, 'In Progress', 'High', '2026-03-30', NOW()),
(13, 4, 'Implement connection pool auto-reconnect', 'Ensure resilient connection handling with exponential backoff on transient network failures.', 5, 3, 'Todo', 'Urgent', '2026-04-14', NOW());
