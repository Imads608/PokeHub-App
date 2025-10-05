import { Reflector } from '@nestjs/core';
import type { UserAccountRole } from '@pokehub/shared/shared-user-models';

export const Roles = Reflector.createDecorator<UserAccountRole>();
