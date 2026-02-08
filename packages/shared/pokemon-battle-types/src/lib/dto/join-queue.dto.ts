import { z } from 'zod';

export const JoinQueueDTOSchema = z.object({
  format: z.string().min(1),
  teamId: z.string().uuid(),
});

export type JoinQueueDTO = z.infer<typeof JoinQueueDTOSchema>;
