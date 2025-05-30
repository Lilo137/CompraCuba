import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { MetodoPago, Rol } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty()
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @MinLength(6)
  @IsString()

  password: string;

  @ApiProperty()
  @IsNotEmpty()
  rolID: number;

  @ApiProperty()
  auth: boolean;

  @ApiProperty()
  token: string;

  @Exclude()
  role: Rol;

  @ApiProperty()
  provincia: string;

  @ApiProperty()
  metodoPago: MetodoPago;

 


}
