// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtSecret } from './auth.module';
import { UsersService } from 'src/users/users.service';
import { Request as RequestType } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,                     // lee de cookie
        ExtractJwt.fromAuthHeaderAsBearerToken(),   // lee de header
      ]),
      ignoreExpiration: false, // asegúrate de no ignorar expiración
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { userId: number }): Promise<any> {
    const user = await this.usersService.findOne(payload.userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return user; // este objeto se asigna a req.user
  }

  private static extractJWT(req: RequestType): string | null {
    if (req.cookies && req.cookies.user_token) {
      return req.cookies.user_token;
    }
    return null;
  }
}
