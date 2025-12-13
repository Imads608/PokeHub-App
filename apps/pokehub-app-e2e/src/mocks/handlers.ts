import type {
  TeamResponseDTO,
  UpdateTeamDTO,
} from '@pokehub/shared/pokemon-types';
import { http, HttpResponse } from 'msw';

// MSW proxy receives requests at localhost:9876
// We match on path only (regardless of host) since we control the proxy
const MSW_PROXY_URL = 'http://localhost:9876';
const BACKEND_URL = process.env.BACKEND_URL || MSW_PROXY_URL;

// Mock team data using existing types
const mockTeam: TeamResponseDTO = {
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
      moves: ['Thunderbolt', 'Iron Tail', 'Quick Attack', 'Thunder Wave'],
      evs: { hp: 0, atk: 0, def: 0, spa: 252, spd: 4, spe: 252 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    },
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

/**
 * MSW handlers for API mocking
 * These intercept HTTP requests at the network level, working for both:
 * - Client-side fetch (browser requests)
 * - Server-side fetch (Next.js SSR/RSC requests)
 */
export const handlers = [
  // GET /api/teams/:id - Fetch a specific team
  http.get(`${BACKEND_URL}/api/teams/:id`, ({ params }) => {
    const { id } = params;

    // Return mock team for specific ID
    if (id === mockTeam.id) {
      return HttpResponse.json(mockTeam);
    }

    // Return 404 for other IDs (unless passthrough)
    return HttpResponse.json({ message: 'Team not found' }, { status: 404 });
  }),

  // GET /api/teams - List all teams
  http.get(`${BACKEND_URL}/api/teams`, () => {
    return HttpResponse.json([mockTeam]);
  }),

  // POST /api/teams - Create a new team
  http.post(`${BACKEND_URL}/api/teams`, async ({ request }) => {
    const body = (await request.json()) as UpdateTeamDTO;
    const newTeam: TeamResponseDTO = {
      ...mockTeam,
      ...body,
      id: '550e8400-e29b-41d4-a716-446655440002',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return HttpResponse.json(newTeam, { status: 201 });
  }),

  // PUT /api/teams/:id - Update a team
  http.put(`${BACKEND_URL}/api/teams/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as UpdateTeamDTO;

    if (id === mockTeam.id) {
      const updatedTeam: TeamResponseDTO = {
        ...mockTeam,
        ...body,
        updatedAt: new Date(),
      };
      return HttpResponse.json(updatedTeam);
    }

    return HttpResponse.json({ message: 'Team not found' }, { status: 404 });
  }),

  // DELETE /api/teams/:id - Delete a team
  http.delete(`${BACKEND_URL}/api/teams/:id`, ({ params }) => {
    const { id } = params;

    if (id === mockTeam.id) {
      return new HttpResponse(null, { status: 204 });
    }

    return HttpResponse.json({ message: 'Team not found' }, { status: 404 });
  }),
];

/**
 * Create handlers with custom team data
 */
export function createTeamHandlers(
  teamData: TeamResponseDTO | null,
  shouldFailSave = false
) {
  return [
    // GET /api/teams/:id
    http.get(`${BACKEND_URL}/api/teams/:id`, ({ params }) => {
      const { id } = params;

      if (teamData && id === teamData.id) {
        return HttpResponse.json(teamData);
      }

      return HttpResponse.json({ message: 'Team not found' }, { status: 404 });
    }),

    // POST /api/teams
    http.post(`${BACKEND_URL}/api/teams`, async ({ request }) => {
      if (shouldFailSave) {
        return HttpResponse.json(
          { message: 'Validation error' },
          { status: 400 }
        );
      }

      const body = (await request.json()) as UpdateTeamDTO;
      const newTeam: TeamResponseDTO = {
        ...mockTeam,
        ...body,
        id: '550e8400-e29b-41d4-a716-446655440002',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return HttpResponse.json(newTeam, { status: 201 });
    }),

    // PUT /api/teams/:id
    http.put(`${BACKEND_URL}/api/teams/:id`, async ({ params, request }) => {
      if (shouldFailSave) {
        return HttpResponse.json(
          { message: 'Validation error' },
          { status: 400 }
        );
      }

      const { id } = params;
      const body = (await request.json()) as UpdateTeamDTO;

      if (teamData && id === teamData.id) {
        const updatedTeam: TeamResponseDTO = {
          ...teamData,
          ...body,
          updatedAt: new Date(),
        };
        return HttpResponse.json(updatedTeam);
      }

      return HttpResponse.json({ message: 'Team not found' }, { status: 404 });
    }),

    // GET /api/teams
    http.get(`${BACKEND_URL}/api/teams`, () => {
      return HttpResponse.json(teamData ? [teamData] : []);
    }),

    // DELETE /api/teams/:id
    http.delete(`${BACKEND_URL}/api/teams/:id`, ({ params }) => {
      const { id } = params;

      if (teamData && id === teamData.id) {
        return new HttpResponse(null, { status: 204 });
      }

      return HttpResponse.json({ message: 'Team not found' }, { status: 404 });
    }),
  ];
}

export { mockTeam };
