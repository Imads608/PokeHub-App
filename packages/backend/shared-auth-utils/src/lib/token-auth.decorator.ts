import { Reflector } from '@nestjs/core';
import { TokenType } from '@pokehub/shared/shared-auth-models';

export const TokenAuth = Reflector.createDecorator<TokenType>();
