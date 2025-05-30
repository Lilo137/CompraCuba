import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {} 

  async getProducts(filtro: {
  name?: string;
  precioMax?: number;
}) {
  return this.prisma.product.findMany({
    where: {
      name: filtro.name 
        ? { contains: filtro.name, mode: 'insensitive' } 
        : undefined,
      precioGeneral: filtro.precioMax
        ? { lte: filtro.precioMax } 
        : undefined,
    },
  });
}

  async createProduct(data: CreateProductDto & { publicadoPor: number }) {
const productData = {
  name: "Nombre del producto",
  description: "Descripción del producto",
  price: 100.00,
  stock: 10,
  imageUrl: "url-de-imagen-principal",
  categoria: "CATEGORIA_ID_O_NOMBRE",
  precioGeneral: 120.00,
  mipyme: {
  connect: {

    email: "usuario@example.com"
    
  }
},
  imagenes: {
    create: [
      { url: "url-de-la-imagen-1" },
      { url: "url-de-la-imagen-2" }
    ]
  }
};

await this.prisma.product.create({
  data: productData
});
}

  async getProductsByUser(userId: number){
    return this.prisma.product.findMany({
      where: {
        publicadoPor: userId
      },
      include: {
        imagenes: true,
        precios: true, 
      },
      orderBy: {
        createdAt: 'desc'
      },
    });
  }

  async updateStock(productId: number, nuevoStock: number, userId: number,) {
    const product = await
    this.prisma.product.findUnique({
      where: {
        id: productId 
      }
      
    });

    if (!product || product.publicadoPor !== userId)
      throw new ForbiddenException();

    return this.prisma.product.update({
      where: {
        id: productId
      },
      data: {
        stock: nuevoStock
      },
    });

  }

  async deleteProduct( id: number, userId: number){
    const product = await
    this.prisma.product.findUnique({ where: {id}});
     
     if (!product || product.publicadoPor !== userId)
      throw new ForbiddenException();
    
    return this.prisma.product.delete({ where: {id}});
  }
}

