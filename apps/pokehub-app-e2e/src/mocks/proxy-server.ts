import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = 9876; // MSW proxy port
const REAL_BACKEND_URL =
  process.env.REAL_BACKEND_URL || 'http://localhost:3000';

// Health check endpoint for Playwright
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', proxy: 'msw' });
});

// Log ALL incoming requests for debugging
app.use((req, res, next) => {
  console.error(`[MSW Proxy] ${req.method} ${req.url}`);
  next();
});

// Add CORS headers to all /api responses and handle OPTIONS preflight
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-traceId');

  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }
  next();
});

// Mock /api/teams/* endpoints
const mockTeam = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  userId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Team',
  generation: 9,
  format: 'ou',
  pokemon: [
    {
      species: 'Pikachu',
      name: 'Pika',
      item: 'Light Ball',
      ability: 'Static',
      nature: 'Modest',
      gender: 'M',
      level: 100,
      shiny: false,
      moves: ['Thunderbolt', 'Iron Tail', 'Quick Attack', 'Thunder Wave'],
      evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    },
  ],
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
};

// Store for dynamically created teams (for duplicate flow)
const createdTeams: Map<string, typeof mockTeam> = new Map();

// GET /api/teams/:id
app.get('/api/teams/:id', (req, res) => {
  console.error(`[MSW Mock] GET /api/teams/${req.params.id}`);
  if (req.params.id === mockTeam.id) {
    return res.json(mockTeam);
  }
  // Check for dynamically created teams
  const createdTeam = createdTeams.get(req.params.id);
  if (createdTeam) {
    return res.json(createdTeam);
  }
  return res.status(404).json({ message: 'Team not found' });
});

// GET /api/teams
app.get('/api/teams', (req, res) => {
  console.error('[MSW Mock] GET /api/teams');
  return res.json([mockTeam]);
});

// POST /api/teams - Parse JSON body only for this route
app.post('/api/teams', express.json(), (req, res) => {
  console.error('[MSW Mock] POST /api/teams');
  const newId = '550e8400-e29b-41d4-a716-446655440002';
  const newTeam = {
    ...mockTeam,
    ...req.body,
    id: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  // Store the created team so it can be fetched later
  createdTeams.set(newId, newTeam);
  return res.status(201).json(newTeam);
});

// PUT /api/teams/:id - Parse JSON body only for this route
app.put('/api/teams/:id', express.json(), (req, res) => {
  console.log(`[MSW Mock] PUT /api/teams/${req.params.id}`);
  if (req.params.id === mockTeam.id) {
    const updatedTeam = {
      ...mockTeam,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    return res.json(updatedTeam);
  }
  return res.status(404).json({ message: 'Team not found' });
});

// DELETE /api/teams/:id
app.delete('/api/teams/:id', (req, res) => {
  console.log(`[MSW Mock] DELETE /api/teams/${req.params.id}`);
  if (req.params.id === mockTeam.id) {
    return res.status(204).send();
  }
  return res.status(404).json({ message: 'Team not found' });
});

// Forward ALL other requests to the real backend (auth, etc.)
// IMPORTANT: Don't parse body before this - let proxy handle raw stream
app.use(
  '/',
  createProxyMiddleware({
    target: REAL_BACKEND_URL,
    changeOrigin: true,
  })
);

// Start the proxy server
const server = app.listen(port, () => {
  console.log(`🔄 MSW Proxy Server listening on http://localhost:${port}`);
  console.log(`📡 Forwarding non-mocked requests to ${REAL_BACKEND_URL}`);
  console.log(`✅ Mocking /api/teams/* endpoints`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down MSW proxy server...');
  server.close(() => {
    console.log('MSW proxy server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down MSW proxy server...');
  server.close(() => {
    console.log('MSW proxy server closed');
    process.exit(0);
  });
});

export { server };
