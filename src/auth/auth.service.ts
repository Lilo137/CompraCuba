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
  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user) throw new NotFoundException('Usuario no existente');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new UnauthorizedException('Contraseña incorrecta');

  // Firmar JWT
  const payload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    rolID: user.rolID,
  };
  const token = this.jwtService.sign(payload);

  // Guardar cookie y marcar 'auth' en la BD (si lo deseas)
  res.cookie('user_token', token);
  await this.prisma.user.update({
    where: { id: user.id },
    data: { auth: true, token: token },
  });

  // **DEVOLVER user + access_token** con esas exactas propiedades
  return {
    access_token: token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      rolID: user.rolID,
      provincia: user.provincia,
      metodoPago: user.metodoPago,
    },
  };
}



  async logout(res: any, email: string) {
    res.cookie('user_token', '', { expires: new Date(Date.now()) });
    await this.prisma.user.update({
      where: { email: email },
      data: { auth: false, token: '' },
    });
    return 'Sesión cerrada!';
  }
}
