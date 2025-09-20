import { IUpdateUserProfile } from '@pokehub/shared/shared-user-models';
import { IsString, Length, Matches } from 'class-validator';

// export class UpdateUserProfileDTO implements IUpdateUserProfile {
//   @IsString() username: string;
//
//   @IsString() avatar: string;
// }

export class UpdateUserProfileDTO implements IUpdateUserProfile {
  @IsString()
  @Length(3, 20)
  username: string;

  @IsString()
  @Length(1, 255)
  @Matches(/^[a-zA-Z0-9_.-]+$/, {
    message: 'Avatar filename contains invalid characters.',
  })
  @Matches(/\.(png|jpg|jpeg|gif)$/i, {
    message: 'Avatar filename has an invalid extension.',
  })
  avatar: string;
}
