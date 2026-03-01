import { z } from 'zod';

export const JoinQueueDTOSchema = z.object({
  format: z.string().min(1),
  teamId: z.string().uuid().optional(),
});

export type JoinQueueDTO = z.infer<typeof JoinQueueDTOSchema>;
