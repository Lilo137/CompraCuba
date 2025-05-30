import { Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}
  create(createRoleDto: CreateRoleDto) {
    return this.prisma.rol.create({ data: createRoleDto });
  }

  findAll() {
    return this.prisma.rol.findMany();
  }

  findOne(id: number) {
    return this.prisma.rol.findUnique({ where: { id } });
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.prisma.rol.update({ where: { id }, data: updateRoleDto });
  }

  remove(id: number) {
    return this.prisma.rol.delete({ where: { id } });
  }
}
