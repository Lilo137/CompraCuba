import { Product, ImagenProduct } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsEnum } from 'class-validator';

export class ProductEntity implements Product {
  constructor(partial: Partial<ProductEntity>) {
    Object.assign(this, partial);
  }
    createdAt: Date;
    
  @ApiProperty()
  id: number;

  @ApiProperty()
  name : string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @Exclude()
  imageUrl: string;

  @ApiProperty()
  categoria: string;

  @ApiProperty()
  precioGeneral: number;

  @ApiProperty()
  publicadoPor: number;

  @ApiProperty()
  updatedAt: Date;
}