import { User } from 'src/user/entity/user.entity';
import { FastifyRequest } from 'fastify';

export interface AuthenticatedRequest extends FastifyRequest {
  user: User;
}
