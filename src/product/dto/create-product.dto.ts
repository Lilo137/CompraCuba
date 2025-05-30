// Asegúrate de tener estas importaciones al inicio del archivo
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


class ImagenDto {
  @IsString()
  url: string;
}


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

  @IsNumber()
  precioGeneral: number;

  @IsNumber()
  stock: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImagenDto)
  imagenes: ImagenDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrecioProvinciaDto)
  preciosPorProvincia: PrecioProvinciaDto[];
}