import { pokemonTeamSchema } from '../pokemon-team.validation';
import type { z } from 'zod';

/**
 * Schema for creating a new team
 * Uses pokemonTeamSchema as source of truth
 * Domain validation (format rules, bans) handled by ShowdownTeamValidationPipe
 */
export const CreateTeamDTOSchema = pokemonTeamSchema;

export type CreateTeamDTO = z.infer<typeof CreateTeamDTOSchema>;
