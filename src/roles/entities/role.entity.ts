import { Rol } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class Role implements Rol {
  @ApiProperty()
  id: number;

  @ApiProperty()
  rol_name: string;

  @ApiProperty()
  users: any;
}
