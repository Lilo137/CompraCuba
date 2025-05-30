import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 

@Injectable()
export class CarritoService {
  constructor(private readonly prisma: PrismaService) {} 
  async agregarProducto(
    userID: number, 
    productId: number, 
    cantidad: number
  ) {
    
    if (cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a cero');
    }

    
    const productExists = await this.prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!productExists) {
      throw new Error('Producto no encontrado');
    }

   
    let carrito = await this.prisma.carrito.findUnique({
      where: { userID },
      include: { items: true },
    });

    if (!carrito) {
      carrito = await this.prisma.carrito.create({
        data: { userID },
        include: { items: true } 
      });
    }

    const existingItem = carrito.items.find(item => item.productId === productId);

    if (existingItem) {
      return this.prisma.itemCarrito.update({
        where: { id: existingItem.id },
        data: { cantidad: existingItem.cantidad + cantidad },
      });
    }

    return this.prisma.itemCarrito.create({
      data: {
        carritoId: carrito.id,
        productId,
        cantidad,
      },
    });
  }

  async verResumenCarrito(userID: number) {
    const carrito = await this.prisma.carrito.findUnique({
      where: { userID },
      include: { 
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!carrito) {
      throw new Error('Carrito no encontrado');
      
    }

    
    const itemsTransformados = carrito.items.map(item => ({
      nombre: item.product.name,
      imagen: item.product.imageUrl,
      precioUnitario: item.product.price,
      cantidad: item.cantidad,
      total: item.cantidad * item.product.price,
    }));

    const subtotal = carrito.items.reduce(
      (sum, item) => sum + (item.cantidad * item.product.price), 
      0
    );

    const costoEnvio = this.calcularCostoEnvio(subtotal); 
    const user = await this.prisma.user.findUnique({
      where: { id: userID }
    });

    return {
      items: itemsTransformados,
      subtotal,
      envio: costoEnvio,
      total: subtotal + costoEnvio,
      metodoPago: user?.metodoPago || null,
    };
  }

  private calcularCostoEnvio(subtotal: number): number {
  
    return subtotal > 100 ? 0 : 10;
  }
}

