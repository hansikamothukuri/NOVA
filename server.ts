import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import app from './server/src/app.js';
import { initDatabase, getDatabaseInfo } from './server/src/config/db.js';
import { errorHandler } from './server/src/middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

async function startUnifiedServer() {
  console.log('[NOVA Full-Stack] Booting NOVA Application Server...');

  // Initialize Database Engine
  await initDatabase();

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Error Handler
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    const dbInfo = getDatabaseInfo();
    console.log(`=======================================================`);
    console.log(`🚀 NOVA Live Application active on http://0.0.0.0:${PORT}`);
    console.log(`📊 Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Database: ${dbInfo.status}`);
    console.log(`🔗 REST API mounted at /api/*`);
    console.log(`=======================================================`);
  });
}

startUnifiedServer().catch((error) => {
  console.error('[NOVA Full-Stack] Server initialization failed:', error);
});
