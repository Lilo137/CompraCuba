import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MetodoPago } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const lengthHash = 10; 
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      lengthHash,
    );

    return this.prisma.user.create({
      data: {
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        provincia: createUserDto.provincia,
        metodoPago: createUserDto.metodoPago, 
        rol: {
          connect: { id: createUserDto.rolID }
        }
      },
      include: {
        rol: true
      }
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      include: {
        rol: true
      }
    });
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({ 
      where: { id },
      include: {
        rol: true
      }
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const updateData: any = { ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(
        updateUserDto.password,
        lengthHash,
      );
    }

    if (updateUserDto.rolID) {
      updateData.rol = {
        connect: { id: updateUserDto.rolID }
      };
      delete updateData.rolID;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        rol: true
      }
    });
  }

  remove(id: number) {
    return this.prisma.user.delete({ 
      where: { id },
      include: {
        rol: true
      }
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        rol: true
      }
    });
  }
}