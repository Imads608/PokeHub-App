import { CreateTeamDTOSchema } from './create-team.dto';
import type { z } from 'zod';

/**
 * Schema for updating a team
 * Full replacement semantics - require complete team data on update
 */
export const UpdateTeamDTOSchema = CreateTeamDTOSchema;

export type UpdateTeamDTO = z.infer<typeof UpdateTeamDTOSchema>;
