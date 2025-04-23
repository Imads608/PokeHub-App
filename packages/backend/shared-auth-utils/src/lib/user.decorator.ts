import type { OAuthRequest } from './oauth-request.model';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<OAuthRequest>();
  return request.user;
});
