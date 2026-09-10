-- ==========================================================
-- NOVA — Full-Stack Project Management Database Schema
-- Database: nova_db
-- Engine: MySQL 8.0+ / MariaDB 10.4+
-- ==========================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS nova_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nova_db;

-- 2. Drop tables in reverse order of foreign key dependency
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

-- ==========================================================
-- Table: users
-- Core user accounts with secure bcrypt password hashing
-- ==========================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  title VARCHAR(150) DEFAULT 'Team Contributor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Table: projects
-- Projects owned by users with statuses and milestones
-- ==========================================================
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id INT NOT NULL,
  status ENUM('Planning', 'Active', 'On Hold', 'Completed') NOT NULL DEFAULT 'Planning',
  start_date DATE NULL,
  due_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_projects_owner (owner_id),
  INDEX idx_projects_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Table: project_members
-- Multi-tenant team collaboration and role authorization
-- ==========================================================
CREATE TABLE project_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('Owner', 'Member') NOT NULL DEFAULT 'Member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pm_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_project_user UNIQUE (project_id, user_id),
  INDEX idx_pm_project (project_id),
  INDEX idx_pm_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Table: tasks
-- Granular tasks with assignee, priority, status, and deadlines
-- ==========================================================
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INT NULL,
  created_by INT NOT NULL,
  status ENUM('Todo', 'In Progress', 'Review', 'Completed') NOT NULL DEFAULT 'Todo',
  priority ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
  due_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_tasks_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tasks_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tasks_project (project_id),
  INDEX idx_tasks_assigned (assigned_to),
  INDEX idx_tasks_status (status),
  INDEX idx_tasks_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Meetings
CREATE TABLE meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_id INT NULL,
    organizer_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    meeting_link VARCHAR(1000) NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
    attendees JSON NOT NULL,
    platform VARCHAR(100) DEFAULT 'Other',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_meetings_project
        FOREIGN KEY (project_id) REFERENCES projects(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_meetings_organizer
        FOREIGN KEY (organizer_id) REFERENCES users(id)
        ON DELETE CASCADE,

    INDEX idx_meetings_project (project_id),
    INDEX idx_meetings_organizer (organizer_id),
    INDEX idx_meetings_status (status),
    INDEX idx_meetings_start_time (start_time)
);