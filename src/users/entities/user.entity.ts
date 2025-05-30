import { User, MetodoPago } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsEnum } from 'class-validator';

export class UserEntity implements User {
  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  last_login: Date;

  @Exclude()
  password: string;

  @ApiProperty()
  rolID: number;

  @ApiProperty({ required: false, nullable: true })
  auth: boolean;

  @ApiProperty({ required: false, nullable: true })
  token: string;

  @ApiProperty({
    enum: MetodoPago,
    enumName: 'MetodoPago',
    description: 'Método de pago preferido del usuario'
  })
  @IsEnum(MetodoPago)
  metodoPago: MetodoPago;

  @ApiProperty({ required: false, nullable: true })
  provincia: string | null;
}