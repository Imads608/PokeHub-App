import { CreateTeamDTOSchema } from './create-team.dto';
import { z } from 'zod';

/**
 * Schema for team response from API
 * Extends CreateTeamDTO with server-generated fields
 */
export const TeamResponseDTOSchema = CreateTeamDTOSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TeamResponseDTO = z.infer<typeof TeamResponseDTOSchema>;
