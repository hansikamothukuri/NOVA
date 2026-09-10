import app from './app.js';
import { initDatabase, getDatabaseInfo } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  console.log('[NOVA] Starting NOVA Project Management Backend...');
  
  // Initialize and verify MySQL database connection
  await initDatabase();
  
  // 404 handler for API routes
  app.use(notFoundHandler);
  
  // Centralized Error Handler
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    const dbInfo = getDatabaseInfo();
    console.log(`=======================================================`);
    console.log(`🚀 NOVA Backend Server running at http://localhost:${PORT}`);
    console.log(`📊 Database Status: ${dbInfo.status} (${dbInfo.isMySQL ? 'MySQL ' + dbInfo.database : 'Relational Store'})`);
    console.log(`🔐 Authentication: JWT + Bcrypt active`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('[NOVA] Failed to start server:', err);
  process.exit(1);
});
