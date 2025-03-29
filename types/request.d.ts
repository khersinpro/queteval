import { User } from 'src/user/user.entity';
import { FastifyRequest } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
  user: User;
}
