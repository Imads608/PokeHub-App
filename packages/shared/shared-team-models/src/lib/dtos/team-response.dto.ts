import { CreateTeamDTOSchema } from './create-team.dto';
import { z } from 'zod';

// TeamResponseDTO extends CreateTeamDTO with id, userId, and timestamps
export const TeamResponseDTOSchema = CreateTeamDTOSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TeamResponseDTO = z.infer<typeof TeamResponseDTOSchema>;
