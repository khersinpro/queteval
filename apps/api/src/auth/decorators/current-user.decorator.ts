import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../user/entity/user.entity';
import { AuthenticatedRequest } from 'types/request';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request: AuthenticatedRequest = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
