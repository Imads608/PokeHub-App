import z from 'zod';

export const profileSchema = z.object({
  username: z
    .string()
    .min(5, 'Username must be at least 3 characters')
    .max(15, 'Username must be less than 15 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  avatar: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
