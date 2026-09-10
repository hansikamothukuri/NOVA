# NOVA – Project Management System

**Plan. Collaborate. Deliver.**

NOVA is a full-stack project management web application designed to help teams manage projects, members, tasks, meetings, and collaboration in one place.

## 🚀 Features

- 🔐 User Registration & Login
- 🔑 JWT-based Authentication
- 👤 User Profile & Dashboard
- 📁 Project Creation & Management
- 👥 Project Team Members
- ✅ Task Creation, Assignment & Status Tracking
- 📊 Project Progress Tracking
- 📅 Meeting Scheduling & Management
- 🔗 Support for Google Meet / Zoom / Other Meeting Links
- 📋 Activity & Project Information
- 🗄️ MySQL Database
- 🔒 Password Hashing with bcrypt
- 🌐 REST API Integration

## 🛠️ Tech Stack

### Frontend
- React.js
- TypeScript
- Vite
- React Router
- CSS

### Backend
- Node.js
- Express.js
- REST APIs
- JWT Authentication
- bcrypt

### Database
- MySQL

### Tools
- Git
- GitHub
- VS Code

- SCREENSHOTS:
https://github.com/hansikamothukuri/NOVA/blob/7498e796b4e9d2799eaf5368807d6924a93c64ed/Screenshot%202026-09-10%20223651.png






## 📂 Project Structure

```text
NOVA/
├── server/
│   ├── database/
│   │   ├── schema.sql
│   │   └── seed.sql
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       └── services/
│
├── src/
│   ├── components/
│   ├── context/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── App.tsx
│   └── main.tsx
│
├── .env.example
├── .gitignore
├── package.json
└── README.md


⚙️ Setup & Installation
Prerequisites

Make sure you have installed:

Node.js
MySQL
Git
1. Clone the repository
git clone https://github.com/hansikamothukuri/NOVA
cd nova
2. Install dependencies
npm install
3. Create the MySQL database

Open MySQL Workbench and run:

CREATE DATABASE nova_db;

Then execute:

server/database/schema.sql

To add sample data, execute:

server/database/seed.sql
4. Configure environment variables

Create a .env file in the project root based on .env.example.

Example:

PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=nova_db

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

VITE_API_URL=/api

Do not commit your .env file to GitHub.

5. Start the application
npm run dev

The application will be available at:

http://localhost:3000
🗄️ Database

NOVA uses MySQL for persistent data storage.

Main database entities include:

Users
Projects
Project Members
Tasks
Meetings
🔑 Demo Account

If the database has been seeded, you can use the credentials provided in the seed data for testing.

Change demo credentials before using the application in production.

📌 Project Status

NOVA is currently developed as a full-stack project management application with frontend, backend, REST APIs, authentication, and MySQL database integration.

👩‍💻 Author

Hansika Mothukuri

B.Tech – Computer Science & Engineering
