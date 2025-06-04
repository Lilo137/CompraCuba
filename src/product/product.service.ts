// src/product/product.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { unlink } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Listar todos los productos, incluyendo todas sus imágenes ───────────
  async findAll() {
    return this.prisma.product.findMany({
      include: {
        imagenes: true,       // trae [{ id, url, productId }]
        precios: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Listar los productos de una mipyme (por usuario ID), con imágenes ───
  async getProductsByUser(userId: number) {
    return this.prisma.product.findMany({
      where: { publicadoPor: userId },
      include: {
        imagenes: true,
        precios: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Crear producto (multipart/form-data + archivos) ────────────────────
  async createProduct(
    createProductDto: CreateProductDto,
    archivos: Express.Multer.File[],
    publicadoPor: number,
  ) {
    // 1) Verificar que la mipyme (usuario) exista
    const user = await this.prisma.user.findUnique({
      where: { id: publicadoPor },
    });
    if (!user) {
      throw new BadRequestException('Usuario MIPYME no encontrado');
    }

    // 2) Determinar URL de la primera imagen (o cadena vacía si no hay)
    const mainImageUrl =
      archivos.length > 0 ? `/uploads/${archivos[0].filename}` : '';

    // 3) Construir el objeto prisma.data
    const productData: any = {
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.precioGeneral,
      stock: createProductDto.stock,
      imageUrl: mainImageUrl,
      categoria: createProductDto.categoria,
      precioGeneral: createProductDto.precioGeneral,
      publicadoPor: publicadoPor,
      // 4) Precios por provincia
      precios: {
        create: createProductDto.preciosPorProvincia.map(pp => ({
          provincia: pp.provincia,
          precio: pp.precio,
        })),
      },
      // 5) Todas las imágenes que llegaron por Multer
      imagenes: {
        create: archivos.map(file => ({
          url: `/uploads/${file.filename}`,
        })),
      },
    };

    return this.prisma.product.create({
      data: productData,
      include: {
        imagenes: true,
        precios: true,
      },
    });
  }

  // ─── Actualizar stock ────────────────────────────────────────────────────
  async updateStock(productId: number, nuevoStock: number, userId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || product.publicadoPor !== userId) {
      throw new ForbiddenException('No autorizado o producto no existe');
    }
    return this.prisma.product.update({
      where: { id: productId },
      data: { stock: nuevoStock },
    });
  }

  // ─── Eliminar producto (y todas sus imágenes físicas) ─────────────────────
  async deleteProduct(productId: number, userId: number) {
    // 1) Buscar el producto junto con sus imágenes y precios
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { imagenes: true, precios: true },
    });
    if (!product || product.publicadoPor !== userId) {
      throw new ForbiddenException('No autorizado o producto no existe');
    }

    // 2) Borrar físicamente cada archivo en uploads/
    for (const img of product.imagenes) {
      try {
        // img.url es algo como "/uploads/archivo.png"
        await unlink(join(process.cwd(), img.url));
      } catch {
        /* si no existe en disco, lo ignoramos */
      }
    }

    // 3) En DB, primero eliminar todas las filas de ImagenProduct hijas:
    await this.prisma.imagenProduct.deleteMany({
      where: { productId: productId },
    });

    // 4) También eliminar todas las filas de PrecioProvincia hijas:
    await this.prisma.precioProvincia.deleteMany({
      where: { productId: productId },
    });

    // 5) Finalmente, borrar el producto padre
    return this.prisma.product.delete({ where: { id: productId } });
  }

  // ─── NUEVO: Agregar imágenes a un producto existente ──────────────────────
  async addImagesToProduct(
    productId: number,
    archivos: Express.Multer.File[],
    userId: number,
  ) {
    // 1) Verificar que el producto exista y pertenezca a la mipyme
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || product.publicadoPor !== userId) {
      throw new ForbiddenException('No autorizado o producto no existe');
    }
    // 2) Insertar cada nuevo registro en ImagenProduct
    const creates = archivos.map(file => ({
      url: `/uploads/${file.filename}`,
      productId: productId,
    }));
    return this.prisma.imagenProduct.createMany({
      data: creates,
    });
  }

  // ─── NUEVO: Eliminar una imagen individual de un producto ─────────────────
  async deleteImage(productId: number, imageId: number, userId: number) {
    // 1) Encontrar la imagen junto con su producto
    const image = await this.prisma.imagenProduct.findUnique({
      where: { id: imageId },
      include: { product: true },
    });
    if (
      !image ||
      image.productId !== productId ||
      image.product.publicadoPor !== userId
    ) {
      throw new ForbiddenException('No autorizado o imagen no existe');
    }
    // 2) Borrar físicamente el archivo
    try {
      await unlink(join(process.cwd(), image.url));
    } catch {
      /* ignorar si no existe en FS */
    }
    // 3) Borrar registro en DB
    return this.prisma.imagenProduct.delete({ where: { id: imageId } });
  }
}
