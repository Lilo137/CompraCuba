// src/app/carrito/carrito.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CarritoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Establece la cantidad “final” de un producto en el carrito del usuario:
   * - Si cantidad > 0: crea o actualiza el ítem con esa cantidad.
   * - Si cantidad == 0: elimina el ítem (si existe).
   * - No permitimos cantidad < 0.
   */
  async agregarProducto(
    userID: number,
    productId: number,
    cantidad: number
  ) {
    // 1) Validar que cantidad no sea negativa
    if (cantidad < 0) {
      throw new BadRequestException('La cantidad no puede ser negativa');
    }

    // 2) Validar que el producto exista
    const productExists = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!productExists) {
      throw new BadRequestException('Producto no encontrado');
    }

    // 3) Obtener (o crear) el carrito del usuario
    let carrito = await this.prisma.carrito.findUnique({
      where: { userID },
      include: { items: true },
    });
    if (!carrito) {
      carrito = await this.prisma.carrito.create({
        data: { userID },
        include: { items: true },
      });
    }

    // 4) Verificar si ya hay un ítem de este productId
    const existingItem = carrito.items.find((item) => item.productId === productId);

    // 5) Si cantidad == 0 ⇒ eliminar el ítem si existe
    if (cantidad === 0) {
      if (!existingItem) {
        // No había ítem, nada que borrar
        return { message: 'No había ítem para eliminar' };
      }
      return this.prisma.itemCarrito.delete({
        where: { id: existingItem.id },
      });
    }

    // 6) Si cantidad > 0:
    if (existingItem) {
      // Actualizar la cantidad a ese valor
      return this.prisma.itemCarrito.update({
        where: { id: existingItem.id },
        data: { cantidad: cantidad },
      });
    } else {
      // No existía: creamos un nuevo ítem con esa cantidad
      return this.prisma.itemCarrito.create({
        data: {
          carritoId: carrito.id,
          productId,
          cantidad,
        },
      });
    }
  }

  async verResumenCarrito(userID: number) {
    const carrito = await this.prisma.carrito.findUnique({
      where: { userID },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!carrito) {
      throw new BadRequestException('Carrito no encontrado');
    }

    const itemsTransformados = carrito.items.map((item) => ({
      productId: item.product.id,
      nombre: item.product.name,
      imagen: item.product.imageUrl,
      precioUnitario: item.product.price,
      cantidad: item.cantidad,
      total: item.cantidad * item.product.price,
    }));

    const subtotal = carrito.items.reduce(
      (sum, item) => sum + item.cantidad * item.product.price,
      0,
    );
    const costoEnvio = this.calcularCostoEnvio(subtotal);

    const user = await this.prisma.user.findUnique({ where: { id: userID } });
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
