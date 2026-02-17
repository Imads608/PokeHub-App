import { z } from 'zod';

export const BattleMoveDTOSchema = z.object({
  battleId: z.string().min(1),
  /** Pokemon Showdown choice string (e.g., 'move 1', 'switch 2') */
  choice: z.string().min(1),
});

export type BattleMoveDTO = z.infer<typeof BattleMoveDTOSchema>;

export const ForfeitDTOSchema = z.object({
  battleId: z.string().min(1),
});

export type ForfeitDTO = z.infer<typeof ForfeitDTOSchema>;

export const SaveReplayDTOSchema = z.object({
  battleId: z.string().min(1),
});

export type SaveReplayDTO = z.infer<typeof SaveReplayDTOSchema>;

export const RejoinDTOSchema = z.object({
  battleId: z.string().min(1),
});

export type RejoinDTO = z.infer<typeof RejoinDTOSchema>;

export const CancelChoiceDTOSchema = z.object({
  battleId: z.string().min(1),
});

export type CancelChoiceDTO = z.infer<typeof CancelChoiceDTOSchema>;

export const DeclineMatchDTOSchema = z.object({
  battleId: z.string().min(1),
});

export type DeclineMatchDTO = z.infer<typeof DeclineMatchDTOSchema>;
