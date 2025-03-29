// owner-or-admin.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthenticatedRequest } from 'types/request';

@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request: AuthenticatedRequest & { params: { id: number } } = context
      .switchToHttp()
      .getRequest();

    if (!request.params || !request.params.id) {
      throw new ForbiddenException();
    }

    const paramId = Number(request.params.id);
    const user = request.user;

    if (!user) {
      throw new ForbiddenException();
    }

    const isOwner = user.id === paramId;
    const isAdmin = user.roles.includes('ADMIN');

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException();
    }

    return true;
  }
}
