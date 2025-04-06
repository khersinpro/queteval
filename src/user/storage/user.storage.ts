import { Injectable, Scope } from '@nestjs/common';
import { User } from '../entity/user.entity';

@Injectable({ scope: Scope.REQUEST })
export class UserStorage {
  private user: User;

  setUser(user: User): void {
    this.user = user;
  }

  getUser(): User {
    return this.user;
  }
}
