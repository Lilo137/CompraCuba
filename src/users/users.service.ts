import { Injectable, BadRequestException, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export const lengthHash = 10;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, lengthHash);
      return await this.prisma.user.create({
        data: {
          username: createUserDto.username,
          email: createUserDto.email,
          password: hashedPassword,
          provincia: createUserDto.provincia,
          metodoPago: createUserDto.metodoPago, 
          rol: { connect: { id: createUserDto.rolID } }
        },
        include: { rol: true }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Violation of unique constraint on email or username
        if (error.code === 'P2002') {
          throw new ConflictException('El correo o el usuario ya están registrados');
        }
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }

  async findAll() {
    return this.prisma.user.findMany({ include: { rol: true } });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { rol: true } });
    if (!user) throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      const existing = await this.prisma.user.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException(`Usuario con id ${id} no existe`);

      const data: any = { ...updateUserDto };
      if (updateUserDto.password) {
        data.password = await bcrypt.hash(updateUserDto.password, lengthHash);
      }
      if (updateUserDto.rolID) {
        data.rol = { connect: { id: updateUserDto.rolID } };
        delete data.rolID;
      }

      return await this.prisma.user.update({
        where: { id },
        data,
        include: { rol: true }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Dato duplicado en la actualización');
      }
      throw new InternalServerErrorException('Error al actualizar el usuario');
    }
  }

  async remove(id: number) {
    try {
      await this.findOne(id); // lanza NotFound si no existe
      return await this.prisma.user.delete({ where: { id }, include: { rol: true } });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al eliminar el usuario');
    }
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { rol: true } });
  }
}
