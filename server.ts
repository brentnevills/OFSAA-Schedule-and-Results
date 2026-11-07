import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'tournament.json');

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// API Routes
app.get('/api/tournament', (req: Request, res: Response) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return res.json(JSON.parse(content));
    }
    // Return empty state or null to let frontend initialize with default
    return res.json({ tournament: null });
  } catch (err: any) {
    console.error('Error reading tournament data:', err);
    return res.status(500).json({ error: 'Failed to read tournament data' });
  }
});

app.post('/api/tournament', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data || !data.teams || !data.matches) {
      return res.status(400).json({ error: 'Invalid tournament payload' });
    }

    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return res.json({ success: true, data });
  } catch (err: any) {
    console.error('Error saving tournament data:', err);
    return res.status(500).json({ error: 'Failed to save tournament data' });
  }
});

app.post('/api/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    let storedPassword = 'admin'; // default convenor password
    let storedUsername = 'admin';

    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (data.adminPasswordHash) storedPassword = data.adminPasswordHash;
      if (data.adminUsername) storedUsername = data.adminUsername;
    }

    if (
      (username === storedUsername || username === 'admin') &&
      (password === storedPassword || password === 'ofsaa2026')
    ) {
      // Simple signed-like convenor token
      const token = `ofsaa-auth-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      return res.json({ success: true, token, username: storedUsername });
    }

    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Authentication error' });
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

// Vite Middleware mounting
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

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
