import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';

const app = express();
const port = 9876; // MSW proxy port
const REAL_BACKEND_URL =
  process.env.REAL_BACKEND_URL || 'http://localhost:3000';

// Health check endpoint for Playwright
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', proxy: 'msw' });
});

// Log ALL incoming requests for debugging
app.use((req, _res, next) => {
  console.error(`[MSW Proxy] ${req.method} ${req.url}`);
  next();
});

// Add CORS headers to all /api responses and handle OPTIONS preflight
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-traceId'
  );

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
app.get('/api/teams', (_req, res) => {
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

// =============================================================================
// User Profile Mocks (for create-profile E2E tests)
// =============================================================================

/**
 * Mock user profile update endpoint
 * Returns mock avatar URL pointing to the proxy server instead of real Azure URL
 */
app.post('/api/users/:userId/profile', express.json(), (req, res) => {
  const { userId } = req.params;
  const { username, avatar } = req.body;
  console.log(
    `[MSW Mock] POST /api/users/${userId}/profile - username: ${username}, avatar: ${avatar}`
  );

  // If avatar was provided, return mock URL pointing to our proxy
  const response: { username: string; avatar?: string } = { username };
  if (avatar) {
    const fileExt = avatar.split('.').pop() || 'jpg';
    response.avatar = `http://localhost:${port}/mock-avatars/${userId}/avatar.${fileExt}`;
  }

  return res.json(response);
});

// =============================================================================
// Avatar Upload Mocks (for create-profile E2E tests)
// =============================================================================

/**
 * Mock Azure Blob Storage upload endpoint
 * The Next.js /api/generate-upload-url route returns this URL when E2E_TESTING=true
 * Accepts any PUT request and returns 201 Created
 */
// Handle OPTIONS preflight for mock-azure-upload
app.options('/mock-azure-upload', (_req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, x-ms-blob-type, x-ms-version'
  );
  return res.status(204).send();
});

app.put('/mock-azure-upload', (_req, res) => {
  console.log('[MSW Mock] PUT /mock-azure-upload - Avatar upload accepted');
  res.header('Access-Control-Allow-Origin', '*');
  return res.status(201).send();
});

/**
 * Serve static test avatar images
 * The blobUrl returned by /api/generate-upload-url points here
 * Returns a placeholder image for any avatar request
 */
app.get('/mock-avatars/:userId/:filename', (_req, res) => {
  console.log('[MSW Mock] GET /mock-avatars - Serving test avatar');
  // Serve the test avatar fixture
  const fixturePath = path.join(__dirname, 'fixtures', 'test-avatar.jpg');
  res.sendFile(fixturePath, (err) => {
    if (err) {
      console.error('[MSW Mock] Error serving avatar fixture:', err);
      // Return a 1x1 transparent PNG as fallback
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      res.setHeader('Content-Type', 'image/png');
      res.send(transparentPng);
    }
  });
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
  console.log(`✅ Mocking /mock-azure-upload and /mock-avatars/* endpoints`);
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
