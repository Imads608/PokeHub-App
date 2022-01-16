import { IsEmail, Length } from 'class-validator';
import { IEmailLogin } from '@pokehub/auth/interfaces';

export class EmailLogin implements IEmailLogin {
  @IsEmail()
  email: string;

  @Length(6)
  password: string;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}
