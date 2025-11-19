import { CreateTeamDTOSchema } from './create-team.dto';
import type { z } from 'zod';

// UpdateTeamDTO is a partial of CreateTeamDTO
export const UpdateTeamDTOSchema = CreateTeamDTOSchema.partial();

export type UpdateTeamDTO = z.infer<typeof UpdateTeamDTOSchema>;
