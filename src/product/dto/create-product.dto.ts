// src/product/dto/create-product.dto.ts
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PrecioProvinciaDto {
  @IsString()
  provincia: string;

  @IsNumber()
  precio: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  categoria: string;

  @IsNumber()
  precioGeneral: number;

  @IsNumber()
  stock: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrecioProvinciaDto)
  preciosPorProvincia: PrecioProvinciaDto[];
}
