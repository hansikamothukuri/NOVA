import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'nova_db';

let pool = null;
let isUsingMySQL = false;

// Fallback Relational Memory Engine for instant sandbox preview
// when MySQL server daemon is not yet configured or started
class RelationalMemoryStore {
  constructor() {
    this.users = [];
    this.projects = [];
    this.project_members = [];
    this.tasks = [];
    this.nextUserId = 1;
    this.nextProjectId = 1;
    this.nextMemberId = 1;
    this.nextTaskId = 1;
    this.seedInitialData();
  }

  seedInitialData() {
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    
    // Seed Users
    this.users = [
      {
        id: 1,
        name: 'Alex Johnson',
        email: 'alex@nova.dev',
        password_hash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        bio: 'Engineering Lead passionate about building scalable, user-centric systems.',
        title: 'Engineering Lead',
        created_at: new Date('2026-03-01T08:00:00Z'),
        updated_at: new Date('2026-03-01T08:00:00Z')
      },
      {
        id: 2,
        name: 'Sarah Williams',
        email: 'sarah@nova.dev',
        password_hash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
        bio: 'Staff Frontend Architect with deep expertise in React design systems.',
        title: 'Staff Frontend Architect',
        created_at: new Date('2026-03-01T09:00:00Z'),
        updated_at: new Date('2026-03-01T09:00:00Z')
      },
      {
        id: 3,
        name: 'David Miller',
        email: 'david@nova.dev',
        password_hash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
        bio: 'Senior Backend & Database Engineer obsessed with query optimization.',
        title: 'Senior Backend Engineer',
        created_at: new Date('2026-03-01T10:00:00Z'),
        updated_at: new Date('2026-03-01T10:00:00Z')
      },
      {
        id: 4,
        name: 'Emma Brown',
        email: 'emma@nova.dev',
        password_hash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
        bio: 'Product Designer focused on micro-interactions and design ergonomics.',
        title: 'Lead Product Designer',
        created_at: new Date('2026-03-01T11:00:00Z'),
        updated_at: new Date('2026-03-01T11:00:00Z')
      },
      {
        id: 5,
        name: 'Michael Chen',
        email: 'michael@nova.dev',
        password_hash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
        bio: 'DevOps & Reliability Engineer building seamless CI/CD pipelines.',
        title: 'DevOps Engineer',
        created_at: new Date('2026-03-01T12:00:00Z'),
        updated_at: new Date('2026-03-01T12:00:00Z')
      },
      {
        id: 6,
        name: 'Hansika',
        email: 'hansikamothukuri23@gmail.com',
        password_hash: defaultPasswordHash,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hansika',
        bio: 'Productive NOVA collaborator.',
        title: 'Team Contributor',
        created_at: new Date('2026-03-01T13:00:00Z'),
        updated_at: new Date('2026-03-01T13:00:00Z')
      }
    ];
    this.nextUserId = 7;

    // Seed Projects
    this.projects = [
      {
        id: 1,
        name: 'NOVA Website Redesign',
        description: 'Revamp the core product marketing web portal, interactive playground, and design system documentation.',
        owner_id: 1,
        status: 'Active',
        start_date: '2026-03-01',
        due_date: '2026-04-15',
        created_at: new Date('2026-03-01T10:00:00Z'),
        updated_at: new Date('2026-03-01T10:00:00Z')
      },
      {
        id: 2,
        name: 'Mobile App Development',
        description: 'Native cross-platform iOS & Android companion app for on-the-go task status updates and notifications.',
        owner_id: 1,
        status: 'Active',
        start_date: '2026-03-10',
        due_date: '2026-05-30',
        created_at: new Date('2026-03-02T11:00:00Z'),
        updated_at: new Date('2026-03-02T11:00:00Z')
      },
      {
        id: 3,
        name: 'Marketing Campaign Q2',
        description: 'Global multi-channel product launch campaign across developer communities, podcasts, and social media.',
        owner_id: 2,
        status: 'Planning',
        start_date: '2026-04-01',
        due_date: '2026-06-15',
        created_at: new Date('2026-03-03T12:00:00Z'),
        updated_at: new Date('2026-03-03T12:00:00Z')
      },
      {
        id: 4,
        name: 'Database Infrastructure Migration',
        description: 'Upgrade MySQL cluster to high-availability multi-region replicas with automated failover and caching.',
        owner_id: 3,
        status: 'On Hold',
        start_date: '2026-02-15',
        due_date: '2026-04-30',
        created_at: new Date('2026-03-04T13:00:00Z'),
        updated_at: new Date('2026-03-04T13:00:00Z')
      },
      {
        id: 5,
        name: 'Cloud Security Audit & SOC2',
        description: 'Complete third-party penetration testing, role-based access review, and ISO/SOC2 compliance certification.',
        owner_id: 1,
        status: 'Completed',
        start_date: '2026-01-10',
        due_date: '2026-02-28',
        created_at: new Date('2026-01-05T09:00:00Z'),
        updated_at: new Date('2026-02-28T17:00:00Z')
      }
    ];
    this.nextProjectId = 6;

    // Seed Project Members
    this.project_members = [
      { id: 1, project_id: 1, user_id: 1, role: 'Owner', joined_at: new Date() },
      { id: 2, project_id: 1, user_id: 2, role: 'Member', joined_at: new Date() },
      { id: 3, project_id: 1, user_id: 4, role: 'Member', joined_at: new Date() },
      { id: 4, project_id: 1, user_id: 3, role: 'Member', joined_at: new Date() },

      { id: 5, project_id: 2, user_id: 1, role: 'Owner', joined_at: new Date() },
      { id: 6, project_id: 2, user_id: 2, role: 'Member', joined_at: new Date() },
      { id: 7, project_id: 2, user_id: 5, role: 'Member', joined_at: new Date() },

      { id: 8, project_id: 3, user_id: 2, role: 'Owner', joined_at: new Date() },
      { id: 9, project_id: 3, user_id: 1, role: 'Member', joined_at: new Date() },
      { id: 10, project_id: 3, user_id: 4, role: 'Member', joined_at: new Date() },

      { id: 11, project_id: 4, user_id: 3, role: 'Owner', joined_at: new Date() },
      { id: 12, project_id: 4, user_id: 1, role: 'Member', joined_at: new Date() },
      { id: 13, project_id: 4, user_id: 5, role: 'Member', joined_at: new Date() },

      { id: 14, project_id: 5, user_id: 1, role: 'Owner', joined_at: new Date() },
      { id: 15, project_id: 5, user_id: 3, role: 'Member', joined_at: new Date() },

      // Hansika (user_id: 6) memberships across all project statuses
      { id: 16, project_id: 1, user_id: 6, role: 'Member', joined_at: new Date() },
      { id: 17, project_id: 2, user_id: 6, role: 'Member', joined_at: new Date() },
      { id: 18, project_id: 3, user_id: 6, role: 'Member', joined_at: new Date() },
      { id: 19, project_id: 4, user_id: 6, role: 'Member', joined_at: new Date() },
      { id: 20, project_id: 5, user_id: 6, role: 'Member', joined_at: new Date() }
    ];
    this.nextMemberId = 21;

    // Seed Tasks
    this.tasks = [
      {
        id: 1,
        project_id: 1,
        title: 'Design landing page hero section',
        description: 'Create modern high-contrast typography, interactive product preview widget, and responsive layout.',
        assigned_to: 4,
        created_by: 1,
        status: 'Completed',
        priority: 'High',
        due_date: '2026-03-12',
        created_at: new Date('2026-03-01T10:00:00Z'),
        updated_at: new Date('2026-03-05T10:00:00Z')
      },
      {
        id: 2,
        project_id: 1,
        title: 'Build authentication system & JWT flow',
        description: 'Implement bcrypt password hashing, JWT token issue, auth middleware, and protected routing.',
        assigned_to: 3,
        created_by: 1,
        status: 'Completed',
        priority: 'Urgent',
        due_date: '2026-03-15',
        created_at: new Date('2026-03-02T10:00:00Z'),
        updated_at: new Date('2026-03-06T10:00:00Z')
      },
      {
        id: 3,
        project_id: 1,
        title: 'Create interactive dashboard analytics',
        description: 'Display real-time project metrics, task completion percentage, overdue counters, and workload charts.',
        assigned_to: 2,
        created_by: 1,
        status: 'In Progress',
        priority: 'High',
        due_date: '2026-03-25',
        created_at: new Date('2026-03-03T10:00:00Z'),
        updated_at: new Date('2026-03-07T10:00:00Z')
      },
      {
        id: 4,
        project_id: 1,
        title: 'Implement responsive Kanban board',
        description: 'Columns for Todo, In Progress, Review, Completed with quick status changes and filters.',
        assigned_to: 2,
        created_by: 1,
        status: 'In Progress',
        priority: 'Urgent',
        due_date: '2026-03-28',
        created_at: new Date('2026-03-04T10:00:00Z'),
        updated_at: new Date('2026-03-07T10:00:00Z')
      },
      {
        id: 5,
        project_id: 1,
        title: 'Prepare production deployment & docker config',
        description: 'Setup production build, environment configuration, database connection pooling, and health checks.',
        assigned_to: 5,
        created_by: 1,
        status: 'Todo',
        priority: 'Medium',
        due_date: '2026-04-10',
        created_at: new Date('2026-03-05T10:00:00Z'),
        updated_at: new Date('2026-03-05T10:00:00Z')
      },
      {
        id: 6,
        project_id: 2,
        title: 'Design mobile navigation architecture',
        description: 'Bottom navigation tabs, gesture interactions, and dark/light adaptive color palette.',
        assigned_to: 4,
        created_by: 1,
        status: 'Completed',
        priority: 'High',
        due_date: '2026-03-18',
        created_at: new Date('2026-03-06T10:00:00Z'),
        updated_at: new Date('2026-03-06T10:00:00Z')
      },
      {
        id: 7,
        project_id: 2,
        title: 'Implement offline sync & local caching',
        description: 'SQLite / local key-value store for offline task edits with background conflict resolution.',
        assigned_to: 1,
        created_by: 1,
        status: 'In Progress',
        priority: 'Urgent',
        due_date: '2026-04-12',
        created_at: new Date('2026-03-06T11:00:00Z'),
        updated_at: new Date('2026-03-07T11:00:00Z')
      },
      {
        id: 8,
        project_id: 2,
        title: 'Setup push notification dispatch service',
        description: 'Configure FCM and APNS integration for task assignment and mention notifications.',
        assigned_to: 5,
        created_by: 1,
        status: 'Todo',
        priority: 'Medium',
        due_date: '2026-05-01',
        created_at: new Date('2026-03-06T12:00:00Z'),
        updated_at: new Date('2026-03-06T12:00:00Z')
      },
      {
        id: 9,
        project_id: 2,
        title: 'Conduct usability audit on small screens',
        description: 'Test touch target ergonomics (>= 44px) and input validation flow on iOS and Android.',
        assigned_to: 2,
        created_by: 1,
        status: 'Review',
        priority: 'Low',
        due_date: '2026-05-15',
        created_at: new Date('2026-03-07T10:00:00Z'),
        updated_at: new Date('2026-03-07T10:00:00Z')
      },
      {
        id: 10,
        project_id: 3,
        title: 'Draft technical launch blog post',
        description: 'Deep-dive article detailing the architecture, speed, and real-time collaboration advantages.',
        assigned_to: 2,
        created_by: 2,
        status: 'Todo',
        priority: 'Medium',
        due_date: '2026-04-15',
        created_at: new Date('2026-03-07T11:00:00Z'),
        updated_at: new Date('2026-03-07T11:00:00Z')
      },
      {
        id: 11,
        project_id: 3,
        title: 'Create demo walkthrough video assets',
        description: 'Record high-resolution animated GIFs and 60-second product demo for Twitter and ProductHunt.',
        assigned_to: 4,
        created_by: 2,
        status: 'Review',
        priority: 'High',
        due_date: '2026-04-20',
        created_at: new Date('2026-03-07T12:00:00Z'),
        updated_at: new Date('2026-03-07T12:00:00Z')
      },
      {
        id: 12,
        project_id: 4,
        title: 'Benchmark MySQL 8.0 query latency',
        description: 'Run EXPLAIN ANALYZE on complex joins between projects, tasks, and members with 500k rows.',
        assigned_to: 3,
        created_by: 3,
        status: 'In Progress',
        priority: 'High',
        due_date: '2026-03-30',
        created_at: new Date('2026-03-07T13:00:00Z'),
        updated_at: new Date('2026-03-07T13:00:00Z')
      },
      {
        id: 13,
        project_id: 4,
        title: 'Implement connection pool auto-reconnect',
        description: 'Ensure resilient connection handling with exponential backoff on transient network failures.',
        assigned_to: 5,
        created_by: 3,
        status: 'Todo',
        priority: 'Urgent',
        due_date: '2026-04-14',
        created_at: new Date('2026-03-07T14:00:00Z'),
        updated_at: new Date('2026-03-07T14:00:00Z')
      }
    ];
    this.nextTaskId = 14;

    // Seed Meetings
    this.meetings = [
      {
        id: 1,
        title: 'Project Kickoff & Roadmap Alignment',
        description: 'Review milestone objectives, sprint deliverables, and assign core initial architecture spikes.',
        project_id: 1,
        organizer_id: 1,
        start_time: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        end_time: new Date(Date.now() + 24 * 3600 * 1000 + 45 * 60 * 1000).toISOString(),
        meeting_link: 'https://meet.google.com/abc-nova-sync',
        status: 'Scheduled',
        attendees: [
          { user_id: 1, name: 'Alex Johnson', email: 'alex@nova.dev', status: 'accepted' },
          { user_id: 2, name: 'Sarah Miller', email: 'sarah@nova.dev', status: 'accepted' },
          { user_id: 6, name: 'Hansika', email: 'hansikamothukuri23@gmail.com', status: 'accepted' }
        ],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        title: 'Sprint Planning & Priority Sync',
        description: 'Discuss backlog items, high-priority bugs, and assign upcoming sprint deliverables.',
        project_id: 2,
        organizer_id: 1,
        start_time: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        end_time: new Date(Date.now() + 48 * 3600 * 1000 + 30 * 60 * 1000).toISOString(),
        meeting_link: 'https://meet.google.com/xyz-plan-room',
        status: 'Scheduled',
        attendees: [
          { user_id: 1, name: 'Alex Johnson', email: 'alex@nova.dev', status: 'accepted' },
          { user_id: 4, name: 'Emma Brown', email: 'emma@nova.dev', status: 'accepted' },
          { user_id: 6, name: 'Hansika', email: 'hansikamothukuri23@gmail.com', status: 'accepted' }
        ],
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    this.nextMeetingId = 3;
  }
}

const memoryStore = new RelationalMemoryStore();

// Initialize MySQL pool with graceful connection test
export async function initDatabase() {
  try {
    const testPool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000
    });

    const connection = await testPool.getConnection();
    await connection.ping();
    connection.release();

    pool = testPool;
    isUsingMySQL = true;
    console.log(`[NOVA Database] Connected successfully to MySQL database "${DB_NAME}" at ${DB_HOST}:${DB_PORT}`);
    return true;
  } catch (error) {
    isUsingMySQL = false;
    pool = null;
    console.log(`[NOVA Database] MySQL daemon not connected at ${DB_HOST}:${DB_PORT} (${error.code || error.message}).`);
    console.log(`[NOVA Database] Active Mode: Built-in Relational Store initialized with seed users, projects, and tasks.`);
    console.log(`[NOVA Database] To connect your local MySQL in VS Code: start MySQL, run schema.sql & seed.sql, and set DB_HOST & credentials in .env.`);
    return false;
  }
}

// Unified query function supporting MySQL and Relational Store fallback
export async function query(sql, params = []) {
  if (isUsingMySQL && pool) {
    const [results] = await pool.query(sql, params);
    return results;
  }

  // Relational Memory Store Dispatcher
  return executeMemoryQuery(sql, params);
}

export async function execute(sql, params = []) {
  return query(sql, params);
}

export function isMySQLActive() {
  return isUsingMySQL;
}

export function getDatabaseInfo() {
  return {
    isMySQL: isUsingMySQL,
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    status: isUsingMySQL ? 'CONNECTED_TO_MYSQL' : 'RELATIONAL_ENGINE_READY'
  };
}

export { memoryStore };

// Memory SQL Query Dispatcher for when MySQL is not running locally
function executeMemoryQuery(rawSql, params = []) {
  const sql = rawSql.trim();
  const normalizedSql = sql.replace(/\s+/g, ' ');

  // 1. SELECT USERS
  if (normalizedSql.startsWith('SELECT') && normalizedSql.includes('FROM users')) {
    if (normalizedSql.includes('WHERE email = ?')) {
      const email = params[0]?.toLowerCase();
      const user = memoryStore.users.find(u => u.email.toLowerCase() === email);
      return user ? [user] : [];
    }
    if (normalizedSql.includes('WHERE id = ?')) {
      const id = Number(params[0]);
      const user = memoryStore.users.find(u => u.id === id);
      return user ? [user] : [];
    }
    if (normalizedSql.includes('WHERE email LIKE ?') || normalizedSql.includes('WHERE name LIKE ?')) {
      const q = String(params[0] || '').replace(/%/g, '').toLowerCase();
      return memoryStore.users.filter(u => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q));
    }
    return [...memoryStore.users];
  }

  // 2. INSERT USER
  if (normalizedSql.startsWith('INSERT INTO users')) {
    const [name, email, password_hash, avatar, bio, title] = params;
    const existing = memoryStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      const err = new Error('ER_DUP_ENTRY: Duplicate entry for email');
      err.code = 'ER_DUP_ENTRY';
      throw err;
    }
    const newUser = {
      id: memoryStore.nextUserId++,
      name,
      email,
      password_hash,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      bio: bio || 'Productive NOVA collaborator.',
      title: title || 'Team Contributor',
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryStore.users.push(newUser);
    return { insertId: newUser.id, affectedRows: 1 };
  }

  // 3. UPDATE USER / PROFILE
  if (normalizedSql.startsWith('UPDATE users SET')) {
    // Check parameters and user ID (usually last parameter)
    const userId = Number(params[params.length - 1]);
    const user = memoryStore.users.find(u => u.id === userId);
    if (!user) return { affectedRows: 0 };

    if (normalizedSql.includes('name = ?') && normalizedSql.includes('avatar = ?')) {
      user.name = params[0] !== undefined ? params[0] : user.name;
      user.avatar = params[1] !== undefined ? params[1] : user.avatar;
      user.bio = params[2] !== undefined ? params[2] : user.bio;
      user.title = params[3] !== undefined ? params[3] : user.title;
      user.updated_at = new Date();
      return { affectedRows: 1 };
    }
    if (normalizedSql.includes('password_hash = ?')) {
      user.password_hash = params[0];
      user.updated_at = new Date();
      return { affectedRows: 1 };
    }
    return { affectedRows: 1 };
  }

  // 4. SELECT PROJECTS FOR USER (owner or member)
  if (normalizedSql.includes('FROM projects') && (normalizedSql.includes('JOIN project_members') || normalizedSql.includes('project_members'))) {
    const userId = Number(params[0]);
    // find all project IDs where user is member or owner
    const memberProjectIds = new Set(
      memoryStore.project_members.filter(m => m.user_id === userId).map(m => m.project_id)
    );
    memoryStore.projects.filter(p => p.owner_id === userId).forEach(p => memberProjectIds.add(p.id));

    let projects = memoryStore.projects.filter(p => memberProjectIds.has(p.id));

    // Filter by project status if present
    if (normalizedSql.includes('p.status = ?') || normalizedSql.includes('status = ?') || normalizedSql.toLowerCase().includes('p.status')) {
      const statusParam = params.slice(2).find(p => typeof p === 'string' && !p.startsWith('%'));
      if (statusParam && statusParam !== 'All' && statusParam !== 'all') {
        const normTarget = String(statusParam).toLowerCase().replace(/[\s-_]/g, '');
        projects = projects.filter(p => (p.status || '').toLowerCase().replace(/[\s-_]/g, '') === normTarget);
      }
    }

    // Filter by search query if present
    if (normalizedSql.includes('LIKE ?')) {
      const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
      if (searchParam) {
        const cleanQuery = searchParam.replace(/%/g, '').toLowerCase().trim();
        if (cleanQuery) {
          projects = projects.filter(p =>
            (p.name && p.name.toLowerCase().includes(cleanQuery)) ||
            (p.description && p.description.toLowerCase().includes(cleanQuery))
          );
        }
      }
    }

    // Sorting
    if (normalizedSql.includes('ORDER BY p.due_date') || normalizedSql.includes('ORDER BY due_date')) {
      projects.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    } else if (normalizedSql.includes('ORDER BY p.name') || normalizedSql.includes('ORDER BY name')) {
      projects.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      projects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Enrich projects with owner details, member count, task stats, and dynamic progress
    const enriched = projects.map(p => {
      const owner = memoryStore.users.find(u => u.id === p.owner_id) || { name: 'Unknown', avatar: null, email: '' };
      const projectTasks = memoryStore.tasks.filter(t => t.project_id === p.id);
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const memberLinks = memoryStore.project_members.filter(m => m.project_id === p.id);
      const members = memberLinks.map(ml => {
        const u = memoryStore.users.find(usr => usr.id === ml.user_id);
        return u ? { id: u.id, name: u.name, email: u.email, avatar: u.avatar, role: ml.role } : null;
      }).filter(Boolean);

      const userMembership = memberLinks.find(m => m.user_id === userId);
      const userRole = p.owner_id === userId ? 'Owner' : (userMembership ? userMembership.role : 'Member');

      return {
        ...p,
        owner_name: owner.name,
        owner_email: owner.email,
        owner_avatar: owner.avatar,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        progress,
        member_count: members.length,
        members,
        user_role: userRole
      };
    });

    return enriched;
  }

  // 5. SELECT SINGLE PROJECT BY ID
  if (normalizedSql.startsWith('SELECT') && normalizedSql.includes('FROM projects') && (normalizedSql.includes('WHERE p.id = ?') || normalizedSql.includes('WHERE id = ?'))) {
    const projectId = Number(params[0]);
    const p = memoryStore.projects.find(proj => proj.id === projectId);
    if (!p) return [];

    const owner = memoryStore.users.find(u => u.id === p.owner_id) || { name: 'Unknown', email: '', avatar: null };
    const projectTasks = memoryStore.tasks.filter(t => t.project_id === p.id);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return [{
      ...p,
      owner_name: owner.name,
      owner_email: owner.email,
      owner_avatar: owner.avatar,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      progress
    }];
  }

  // 5b. SELECT PROJECTS OR COUNT BY OWNER_ID
  if (normalizedSql.includes('FROM projects') && (normalizedSql.includes('WHERE owner_id = ?') || normalizedSql.includes('WHERE p.owner_id = ?'))) {
    const ownerId = Number(params[0]);
    if (normalizedSql.includes('COUNT(*)')) {
      const count = memoryStore.projects.filter(p => p.owner_id === ownerId).length;
      return [{ count }];
    }
    const projects = memoryStore.projects
      .filter(p => p.owner_id === ownerId)
      .map(p => {
        const owner = memoryStore.users.find(u => u.id === p.owner_id) || { name: 'Unknown', email: '', avatar: null };
        const projectTasks = memoryStore.tasks.filter(t => t.project_id === p.id);
        const totalTasks = projectTasks.length;
        const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const memberLinks = memoryStore.project_members.filter(m => m.project_id === p.id);
        return {
          ...p,
          owner_name: owner.name,
          owner_email: owner.email,
          owner_avatar: owner.avatar,
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          progress,
          member_count: memberLinks.length,
          user_role: 'Owner'
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return projects;
  }

  // 6. INSERT PROJECT
  if (normalizedSql.startsWith('INSERT INTO projects')) {
    const [name, description, owner_id, status, start_date, due_date] = params;
    const newProject = {
      id: memoryStore.nextProjectId++,
      name,
      description: description || '',
      owner_id: Number(owner_id),
      status: status || 'Planning',
      start_date: start_date || null,
      due_date: due_date || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryStore.projects.push(newProject);

    // Auto-add Owner to project_members
    const exists = memoryStore.project_members.find(m => m.project_id === newProject.id && m.user_id === newProject.owner_id);
    if (!exists) {
      memoryStore.project_members.push({
        id: memoryStore.nextMemberId++,
        project_id: newProject.id,
        user_id: newProject.owner_id,
        role: 'Owner',
        joined_at: new Date()
      });
    }

    return { insertId: newProject.id, affectedRows: 1 };
  }

  // 7. UPDATE PROJECT
  if (normalizedSql.startsWith('UPDATE projects SET')) {
    const projectId = Number(params[params.length - 1]);
    const project = memoryStore.projects.find(p => p.id === projectId);
    if (!project) return { affectedRows: 0 };

    project.name = params[0] !== undefined ? params[0] : project.name;
    project.description = params[1] !== undefined ? params[1] : project.description;
    project.status = params[2] !== undefined ? params[2] : project.status;
    project.start_date = params[3] !== undefined ? params[3] : project.start_date;
    project.due_date = params[4] !== undefined ? params[4] : project.due_date;
    project.updated_at = new Date();
    return { affectedRows: 1 };
  }

  // 8. DELETE PROJECT
  if (normalizedSql.startsWith('DELETE FROM projects WHERE id = ?')) {
    const projectId = Number(params[0]);
    memoryStore.projects = memoryStore.projects.filter(p => p.id !== projectId);
    memoryStore.project_members = memoryStore.project_members.filter(m => m.project_id !== projectId);
    memoryStore.tasks = memoryStore.tasks.filter(t => t.project_id !== projectId);
    return { affectedRows: 1 };
  }

  // 9. PROJECT MEMBERS
  // 9a. Specific member lookup by project_id and user_id
  if (normalizedSql.includes('FROM project_members') && (normalizedSql.includes('WHERE project_id = ? AND user_id = ?') || normalizedSql.includes('WHERE pm.project_id = ? AND pm.user_id = ?') || normalizedSql.includes('WHERE pm.project_id = ? AND u.id = ?'))) {
    const projectId = Number(params[0]);
    const userId = Number(params[1]);
    const found = memoryStore.project_members.find(m => m.project_id === projectId && m.user_id === userId);
    return found ? [{
      id: found.id,
      project_id: found.project_id,
      user_id: found.user_id,
      role: found.role,
      joined_at: found.joined_at
    }] : [];
  }

  // 9b. All members of a project
  if (normalizedSql.includes('FROM project_members') && (normalizedSql.includes('WHERE pm.project_id = ?') || normalizedSql.includes('WHERE project_id = ?'))) {
    const projectId = Number(params[0]);
    const members = memoryStore.project_members
      .filter(m => m.project_id === projectId)
      .map(m => {
        const u = memoryStore.users.find(usr => usr.id === m.user_id);
        return {
          id: m.id,
          project_id: m.project_id,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          name: u ? u.name : 'Unknown',
          email: u ? u.email : '',
          avatar: u ? u.avatar : null,
          title: u ? u.title : ''
        };
      });
    return members;
  }

  if (normalizedSql.startsWith('INSERT INTO project_members')) {
    const [project_id, user_id, role] = params;
    const pId = Number(project_id);
    const uId = Number(user_id);
    const existing = memoryStore.project_members.find(m => m.project_id === pId && m.user_id === uId);
    if (existing) {
      existing.role = role || existing.role;
      return { insertId: existing.id, affectedRows: 0 };
    }
    const newMember = {
      id: memoryStore.nextMemberId++,
      project_id: pId,
      user_id: uId,
      role: role || 'Member',
      joined_at: new Date()
    };
    memoryStore.project_members.push(newMember);
    return { insertId: newMember.id, affectedRows: 1 };
  }

  if (normalizedSql.startsWith('DELETE FROM project_members WHERE project_id = ? AND user_id = ?')) {
    const pId = Number(params[0]);
    const uId = Number(params[1]);
    const beforeLen = memoryStore.project_members.length;
    memoryStore.project_members = memoryStore.project_members.filter(m => !(m.project_id === pId && m.user_id === uId));
    return { affectedRows: beforeLen - memoryStore.project_members.length };
  }

  // 9b. MEMBER COUNTS
  if (normalizedSql.includes('FROM project_members') && normalizedSql.includes('COUNT(*)')) {
    if (normalizedSql.includes('WHERE project_id = ?')) {
      const projectId = Number(params[0]);
      const count = memoryStore.project_members.filter(m => m.project_id === projectId).length;
      return [{ count }];
    }
    if (normalizedSql.includes('WHERE user_id = ?')) {
      const userId = Number(params[0]);
      const count = memoryStore.project_members.filter(m => m.user_id === userId).length;
      return [{ count }];
    }
  }

  // 10. TASKS
  if (normalizedSql.includes('FROM tasks') && normalizedSql.includes('WHERE t.project_id IN')) {
    const ids = new Set(params.map(Number));
    const tasks = memoryStore.tasks
      .filter(t => ids.has(t.project_id))
      .map(t => {
        const assignee = memoryStore.users.find(u => u.id === t.assigned_to);
        const creator = memoryStore.users.find(u => u.id === t.created_by);
        const project = memoryStore.projects.find(p => p.id === t.project_id);
        return {
          ...t,
          assignee_name: assignee ? assignee.name : null,
          assignee_email: assignee ? assignee.email : null,
          assignee_avatar: assignee ? assignee.avatar : null,
          creator_name: creator ? creator.name : 'Unknown',
          project_name: project ? project.name : ''
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return tasks;
  }

  if (normalizedSql.includes('FROM tasks') && normalizedSql.includes('COUNT(*)')) {
    if (normalizedSql.includes('WHERE assigned_to = ? AND status =')) {
      const userId = Number(params[0]);
      const count = memoryStore.tasks.filter(t => t.assigned_to === userId && t.status === 'Completed').length;
      return [{ count }];
    }
    if (normalizedSql.includes('WHERE assigned_to = ?')) {
      const userId = Number(params[0]);
      const count = memoryStore.tasks.filter(t => t.assigned_to === userId).length;
      return [{ count }];
    }
    if (normalizedSql.includes('WHERE project_id = ?')) {
      const projectId = Number(params[0]);
      const count = memoryStore.tasks.filter(t => t.project_id === projectId).length;
      return [{ count }];
    }
  }

  // 10b. Tasks queried by assigned_to (e.g. for profile or user dashboard)
  if (normalizedSql.includes('FROM tasks') && !normalizedSql.includes('COUNT(*)') && (normalizedSql.includes('WHERE t.assigned_to = ?') || normalizedSql.includes('WHERE assigned_to = ?')) && !normalizedSql.includes('WHERE t.project_id = ?') && !normalizedSql.includes('WHERE project_id = ?')) {
    const userId = Number(params[0]);
    const tasks = memoryStore.tasks
      .filter(t => t.assigned_to === userId)
      .map(t => {
        const assignee = memoryStore.users.find(u => u.id === t.assigned_to);
        const creator = memoryStore.users.find(u => u.id === t.created_by);
        const project = memoryStore.projects.find(p => p.id === t.project_id);
        return {
          ...t,
          assignee_name: assignee ? assignee.name : null,
          assignee_email: assignee ? assignee.email : null,
          assignee_avatar: assignee ? assignee.avatar : null,
          creator_name: creator ? creator.name : 'Unknown',
          project_name: project ? project.name : 'Unknown Project'
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return tasks;
  }

  if (normalizedSql.includes('FROM tasks') && (normalizedSql.includes('WHERE t.project_id = ?') || normalizedSql.includes('WHERE project_id = ?'))) {
    const projectId = Number(params[0]);
    let tasks = memoryStore.tasks.filter(t => t.project_id === projectId);

    // Filter by task status
    if (normalizedSql.includes('t.status = ?')) {
      const statusParam = params.slice(1).find(p => ['Todo', 'In Progress', 'Review', 'Completed'].map(s => s.toLowerCase()).includes(String(p).toLowerCase()));
      if (statusParam && statusParam !== 'All' && statusParam !== 'all') {
        tasks = tasks.filter(t => (t.status || '').toLowerCase() === String(statusParam).toLowerCase());
      }
    }

    // Filter by task priority
    if (normalizedSql.includes('t.priority = ?')) {
      const prioParam = params.slice(1).find(p => ['Urgent', 'High', 'Medium', 'Low'].map(s => s.toLowerCase()).includes(String(p).toLowerCase()));
      if (prioParam && prioParam !== 'All' && prioParam !== 'all') {
        tasks = tasks.filter(t => (t.priority || '').toLowerCase() === String(prioParam).toLowerCase());
      }
    }

    // Filter by assigned user
    if (normalizedSql.includes('t.assigned_to = ?')) {
      const assignParam = params.slice(1).find(p => typeof p === 'number');
      if (assignParam !== undefined) {
        tasks = tasks.filter(t => t.assigned_to === Number(assignParam));
      }
    }

    // Filter by search query
    if (normalizedSql.includes('LIKE ?')) {
      const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
      if (searchParam) {
        const cleanQuery = searchParam.replace(/%/g, '').toLowerCase().trim();
        if (cleanQuery) {
          tasks = tasks.filter(t =>
            (t.title && t.title.toLowerCase().includes(cleanQuery)) ||
            (t.description && t.description.toLowerCase().includes(cleanQuery))
          );
        }
      }
    }

    // Sorting
    if (normalizedSql.includes('ORDER BY t.due_date')) {
      tasks.sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    } else if (normalizedSql.includes('ORDER BY CASE t.priority')) {
      const priorityOrder = { 'Urgent': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
      tasks.sort((a, b) => (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5));
    } else {
      tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return tasks.map(t => {
      const assignee = memoryStore.users.find(u => u.id === t.assigned_to);
      const creator = memoryStore.users.find(u => u.id === t.created_by);
      const project = memoryStore.projects.find(p => p.id === t.project_id);
      return {
        ...t,
        assignee_name: assignee ? assignee.name : null,
        assignee_email: assignee ? assignee.email : null,
        assignee_avatar: assignee ? assignee.avatar : null,
        creator_name: creator ? creator.name : 'Unknown',
        project_name: project ? project.name : ''
      };
    });
  }

  if (normalizedSql.includes('FROM tasks') && (normalizedSql.includes('WHERE t.id = ?') || normalizedSql.includes('WHERE id = ?'))) {
    const taskId = Number(params[0]);
    const t = memoryStore.tasks.find(item => item.id === taskId);
    if (!t) return [];
    const assignee = memoryStore.users.find(u => u.id === t.assigned_to);
    const creator = memoryStore.users.find(u => u.id === t.created_by);
    const project = memoryStore.projects.find(p => p.id === t.project_id);
    return [{
      ...t,
      assignee_name: assignee ? assignee.name : null,
      assignee_email: assignee ? assignee.email : null,
      assignee_avatar: assignee ? assignee.avatar : null,
      creator_name: creator ? creator.name : 'Unknown',
      project_name: project ? project.name : '',
      project_owner_id: project ? project.owner_id : null
    }];
  }

  if (normalizedSql.startsWith('INSERT INTO tasks')) {
    const [project_id, title, description, assigned_to, created_by, status, priority, due_date] = params;
    const newTask = {
      id: memoryStore.nextTaskId++,
      project_id: Number(project_id),
      title,
      description: description || '',
      assigned_to: assigned_to ? Number(assigned_to) : null,
      created_by: Number(created_by),
      status: status || 'Todo',
      priority: priority || 'Medium',
      due_date: due_date || null,
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryStore.tasks.push(newTask);
    return { insertId: newTask.id, affectedRows: 1 };
  }

  if (normalizedSql.startsWith('UPDATE tasks SET')) {
    const taskId = Number(params[params.length - 1]);
    const task = memoryStore.tasks.find(t => t.id === taskId);
    if (!task) return { affectedRows: 0 };

    if (normalizedSql.includes('status = ?') && params.length === 2) {
      task.status = params[0];
      task.updated_at = new Date();
      return { affectedRows: 1 };
    }

    task.title = params[0] !== undefined ? params[0] : task.title;
    task.description = params[1] !== undefined ? params[1] : task.description;
    task.assigned_to = params[2] !== undefined ? (params[2] ? Number(params[2]) : null) : task.assigned_to;
    task.status = params[3] !== undefined ? params[3] : task.status;
    task.priority = params[4] !== undefined ? params[4] : task.priority;
    task.due_date = params[5] !== undefined ? params[5] : task.due_date;
    task.updated_at = new Date();
    return { affectedRows: 1 };
  }

  if (normalizedSql.startsWith('DELETE FROM tasks WHERE id = ?')) {
    const taskId = Number(params[0]);
    const before = memoryStore.tasks.length;
    memoryStore.tasks = memoryStore.tasks.filter(t => t.id !== taskId);
    return { affectedRows: before - memoryStore.tasks.length };
  }

  // 11. DASHBOARD RECENT TASKS / STATS
  if (normalizedSql.includes('FROM tasks') && normalizedSql.includes('ORDER BY created_at DESC LIMIT')) {
    const userId = Number(params[0]);
    // tasks assigned to user or in projects user is member of
    const memberProjectIds = new Set(
      memoryStore.project_members.filter(m => m.user_id === userId).map(m => m.project_id)
    );
    memoryStore.projects.filter(p => p.owner_id === userId).forEach(p => memberProjectIds.add(p.id));

    const relevant = memoryStore.tasks
      .filter(t => memberProjectIds.has(t.project_id) || t.assigned_to === userId || t.created_by === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8)
      .map(t => {
        const assignee = memoryStore.users.find(u => u.id === t.assigned_to);
        const project = memoryStore.projects.find(p => p.id === t.project_id);
        return {
          ...t,
          assignee_name: assignee ? assignee.name : null,
          assignee_avatar: assignee ? assignee.avatar : null,
          project_name: project ? project.name : ''
        };
      });
    return relevant;
  }

  // 12. MEETINGS QUERIES
  if (normalizedSql.startsWith('SELECT') && normalizedSql.includes('FROM meetings')) {
    let result = memoryStore.meetings.map(m => {
      const organizer = memoryStore.users.find(u => u.id === m.organizer_id);
      const project = m.project_id ? memoryStore.projects.find(p => p.id === m.project_id) : null;
      let detectedPlatform = m.platform;
      if (!detectedPlatform) {
        const link = (m.meeting_link || '').toLowerCase();
        if (link.includes('meet.google.com')) detectedPlatform = 'Google Meet';
        else if (link.includes('zoom.us')) detectedPlatform = 'Zoom';
        else detectedPlatform = 'Other';
      }
      return {
        ...m,
        organizer_name: organizer ? organizer.name : 'Unknown Organizer',
        organizer_email: organizer ? organizer.email : '',
        organizer_avatar: organizer ? organizer.avatar : null,
        project_name: project ? project.name : null,
        platform: detectedPlatform
      };
    });

    if (normalizedSql.includes('WHERE id = ?') || normalizedSql.includes('WHERE id =')) {
      const targetId = Number(params[0]);
      return result.filter(m => m.id === targetId);
    }

    if (normalizedSql.includes('WHERE project_id = ?')) {
      const targetProjectId = Number(params[0]);
      result = result.filter(m => m.project_id === targetProjectId);
    }

    return result.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }

  if (normalizedSql.startsWith('INSERT INTO meetings')) {
    const [title, description, project_id, organizer_id, start_time, end_time, meeting_link, status, attendeesJson, platform] = params;
    let attendees = [];
    try {
      attendees = typeof attendeesJson === 'string' ? JSON.parse(attendeesJson) : (attendeesJson || []);
    } catch {
      attendees = [];
    }

    let resolvedPlatform = platform;
    if (!resolvedPlatform) {
      const link = (meeting_link || '').toLowerCase();
      if (link.includes('meet.google.com')) resolvedPlatform = 'Google Meet';
      else if (link.includes('zoom.us')) resolvedPlatform = 'Zoom';
      else resolvedPlatform = 'Other';
    }

    const newMeeting = {
      id: memoryStore.nextMeetingId++,
      title,
      description: description || '',
      project_id: project_id ? Number(project_id) : null,
      organizer_id: Number(organizer_id),
      start_time: new Date(start_time).toISOString(),
      end_time: new Date(end_time).toISOString(),
      meeting_link: meeting_link || '',
      platform: resolvedPlatform,
      status: status || 'Scheduled',
      attendees: attendees,
      created_at: new Date(),
      updated_at: new Date()
    };
    memoryStore.meetings.push(newMeeting);
    return { insertId: newMeeting.id, affectedRows: 1 };
  }

  if (normalizedSql.startsWith('UPDATE meetings SET')) {
    const meetingId = Number(params[params.length - 1]);
    const meeting = memoryStore.meetings.find(m => m.id === meetingId);
    if (!meeting) return { affectedRows: 0 };

    if (params.length === 2 && normalizedSql.includes('status = ?')) {
      meeting.status = params[0];
      meeting.updated_at = new Date();
      return { affectedRows: 1 };
    }

    // Full update or status/time update
    const [title, description, project_id, start_time, end_time, meeting_link, status, attendeesJson] = params;
    if (title !== undefined) meeting.title = title;
    if (description !== undefined) meeting.description = description;
    if (project_id !== undefined) meeting.project_id = project_id ? Number(project_id) : null;
    if (start_time !== undefined) meeting.start_time = new Date(start_time).toISOString();
    if (end_time !== undefined) meeting.end_time = new Date(end_time).toISOString();
    if (meeting_link !== undefined) meeting.meeting_link = meeting_link;
    if (status !== undefined) meeting.status = status;
    if (attendeesJson !== undefined) {
      try {
        meeting.attendees = typeof attendeesJson === 'string' ? JSON.parse(attendeesJson) : attendeesJson;
      } catch {
        // ignore
      }
    }
    meeting.updated_at = new Date();
    return { affectedRows: 1 };
  }

  if (normalizedSql.startsWith('DELETE FROM meetings WHERE id = ?')) {
    const meetingId = Number(params[0]);
    const before = memoryStore.meetings.length;
    memoryStore.meetings = memoryStore.meetings.filter(m => m.id !== meetingId);
    return { affectedRows: before - memoryStore.meetings.length };
  }

  return [];
}
