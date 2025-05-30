import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthEntity } from './entities/auth.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string, res: any): Promise<AuthEntity> {
    const user = await this.prisma.user.findUnique({ where: { email: email } });

    if (!user) {
      throw new NotFoundException('Usuario no existente');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const token = this.jwtService.sign({
      userId: user.id,
      username: user.username,
      email: user.email,
      rolId: user.rolID,
    });

    res.cookie('user_token', token); //Aprox 10mins dura el token by OSwald
    const id = user.id;

    this.prisma.user.update({ where: { id }, data: user });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { auth: true, token: token },
    });
    return {
      accessToken: token,
    };
  }

  async logout(res: any, email: string) {
    res.cookie('user_token', '', { expires: new Date(Date.now()) });
    await this.prisma.user.update({
      where: { email: email },
      data: { auth: false, token: '' },
    });
    return 'Sección cerrada!';
  }
}
