import { IUpdateUserProfile } from '@pokehub/shared/shared-user-models';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

// export class UpdateUserProfileDTO implements IUpdateUserProfile {
//   @IsString() username: string;
//
//   @IsString() avatar: string;
// }

export class UpdateUserProfileDTO implements IUpdateUserProfile {
  @IsString()
  @Length(3, 20)
  username!: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  @Matches(/^[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|gif)$/i, {
    message:
      'Avatar filename must contain only letters, numbers, underscores, dots, or hyphens, and end with .png, .jpg, .jpeg, or .gif',
  })
  avatar?: string;
}
