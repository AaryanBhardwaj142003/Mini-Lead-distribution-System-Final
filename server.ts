import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Controllers
import * as leadController from './server/controllers/leadController.js';
import * as userController from './server/controllers/userController.js';
import { authMiddleware } from './server/middleware/auth.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // Lead Routes
  app.get('/api/leads', authMiddleware, leadController.getAllLeads);
  app.post('/api/leads', authMiddleware, leadController.createLead);
  app.patch('/api/leads/:id/status', authMiddleware, leadController.updateLeadStatus);

  // User/Agent Routes
  app.get('/api/agents', authMiddleware, userController.getAgents);
  app.post('/api/agents', authMiddleware, userController.addAgent);
  app.delete('/api/agents/:id', authMiddleware, userController.removeAgent);

  // Vite middleware for development
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
