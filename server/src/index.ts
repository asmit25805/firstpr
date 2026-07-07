import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { issuesRouter } from './routes/issues';
import { aiRouter } from './routes/ai';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN }));
// Generous body limit: chat requests include the full contents of the file the learner has open.
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'firstpr-server', time: new Date().toISOString() });
});

app.use('/api/issues', issuesRouter);
app.use('/api/ai', aiRouter);

// Optional single-process mode: if the client has been built (npm run build),
// serve it directly from here so the whole app runs on one port with no
// dev proxy needed. This is inert — and does nothing — until client/dist
// actually exists, so it never interferes with `npm run dev`.
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log('Serving built client from', clientDist);
}

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`FirstPR server listening on http://localhost:${PORT}`);
  if (!process.env.GITHUB_TOKEN) {
    console.log('Tip: set GITHUB_TOKEN in server/.env for a much higher GitHub search rate limit.');
  }
});
