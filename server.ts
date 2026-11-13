import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'tournament.json');

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure default tournament file exists immediately on startup
if (!fs.existsSync(DATA_FILE)) {
  try {
    const { createSkeletonTournament } = await import('./src/data/defaultData.ts');
    const skeleton = createSkeletonTournament('20-team');
    fs.writeFileSync(DATA_FILE, JSON.stringify(skeleton, null, 2), 'utf-8');
    console.log('Initialized fresh tournament skeleton data on disk at', DATA_FILE);
  } catch (err) {
    console.warn('Could not auto-generate skeleton on startup, will initialize on first request:', err);
  }
}

function stripLegacyCredentials(raw: Record<string, any>) {
  if (!raw || typeof raw !== 'object') return raw;
  const { adminUsername: _u, adminPasswordHash: _p, ...clean } = raw;
  return clean;
}

// API Routes
app.get('/api/tournament', async (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return res.json(stripLegacyCredentials(JSON.parse(content)));
    }

    // Auto-create skeleton if missing
    const { createSkeletonTournament } = await import('./src/data/defaultData.ts');
    const skeleton = stripLegacyCredentials(createSkeletonTournament('20-team') as unknown as Record<string, any>);
    fs.writeFileSync(DATA_FILE, JSON.stringify(skeleton, null, 2), 'utf-8');
    return res.json(skeleton);
  } catch (err: any) {
    console.error('Error reading tournament data:', err);
    return res.status(500).json({ error: 'Failed to read tournament data' });
  }
});

app.post('/api/tournament', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const raw = req.body;
    if (!raw || !raw.teams || !raw.matches) {
      return res.status(400).json({ error: 'Invalid tournament payload' });
    }

    const data = stripLegacyCredentials(raw);
    data.lastUpdated = new Date().toISOString();
    // Atomic-like write via temp file rename or direct sync write
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);

    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error saving tournament data:', err);
    return res.status(500).json({ error: 'Failed to save tournament data' });
  }
});

app.post('/api/reset', (req: Request, res: Response) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
    return res.json({ success: true, message: 'Tournament data reset successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to reset tournament' });
  }
});

// Vite Middleware mounting & static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  // Always serve static assets from public (e.g. OFSAA PDF document, images)
  app.use(express.static(path.join(__dirname, 'public')));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`OFSAA Tournament Hub server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
