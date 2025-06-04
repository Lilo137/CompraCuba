// src/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler()
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user; // viene de JwtStrategy.validate()

    if (!user) throw new ForbiddenException('No autorizado');

    // Por ejemplo, tu usuario tiene prop user.rolID.
    // `requiredRoles` contiene strings como ['MIPYME']
    // Haz un mapeo: si rolID=2, corresponde a 'MIPYME'
    const rolMap = { 1: 'USER', 2: 'MIPYME' };
    const actualRole = rolMap[user.rolID];

    if (requiredRoles.includes(actualRole)) {
      return true;
    } else {
      throw new ForbiddenException('Rol insuficiente');
    }
  }
}
