import { z } from 'zod';

// Zod schema for PokemonInTeam validation (basic structural validation only)
export const PokemonInTeamSchema = z.object({
  species: z.string().min(1),
  name: z.string().optional(),
  ability: z.string().min(1),
  item: z.string(),
  nature: z.string().min(1),
  gender: z.enum(['M', 'F', 'N']),
  level: z.number().int().min(1).max(100),
  moves: z.array(z.string()).min(1).max(4),
  evs: z.object({
    hp: z.number().int().min(0).max(252),
    atk: z.number().int().min(0).max(252),
    def: z.number().int().min(0).max(252),
    spa: z.number().int().min(0).max(252),
    spd: z.number().int().min(0).max(252),
    spe: z.number().int().min(0).max(252),
  }),
  ivs: z.object({
    hp: z.number().int().min(0).max(31),
    atk: z.number().int().min(0).max(31),
    def: z.number().int().min(0).max(31),
    spa: z.number().int().min(0).max(31),
    spd: z.number().int().min(0).max(31),
    spe: z.number().int().min(0).max(31),
  }),
});

// Base team schema (no refinements, so .partial() works for updates)
export const CreateTeamDTOSchema = z.object({
  name: z.string().min(1).max(100),
  generation: z.number().int().min(1).max(9),
  format: z.enum(['Singles', 'Doubles'] as const),
  tier: z.string().min(1).max(50),
  pokemon: z.array(PokemonInTeamSchema).min(1).max(6),
});

export type CreateTeamDTO = z.infer<typeof CreateTeamDTOSchema>;
