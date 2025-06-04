// src/order/order.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 1) Crear orden ───────────────────────────────────────────────────────
  async createOrder(dto: CreateOrderDto) {
    const { userID, products } = dto;

    // 1.1 Comprobar que el usuario exista
    const user = await this.prisma.user.findUnique({ where: { id: userID } });
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // 1.2 Verificar que 'products' no esté vacío
    if (!Array.isArray(products) || products.length === 0) {
      throw new BadRequestException('La lista de productos no puede estar vacía');
    }

    // 1.3 Calcular total, verificar existencia y stock
    let totalOrden = 0;
    for (const item of products) {
      if (item.cantidad <= 0) {
        throw new BadRequestException('La cantidad debe ser mayor que cero');
      }
      const prod = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!prod) {
        throw new NotFoundException(`Producto con id ${item.productId} no encontrado`);
      }
      if (prod.stock < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para producto id ${item.productId} (solicitado=${item.cantidad}, disponible=${prod.stock})`
        );
      }
      totalOrden += prod.price * item.cantidad;
    }

    // 1.4 Crear la cabecera de la orden
    const nuevaOrden = await this.prisma.order.create({
      data: {
        userID,
        total: totalOrden,
      },
    });

    // 1.5 Insertar cada OrderProduct y descontar stock
    const orderProductPromises = [];
    for (const item of products) {
      orderProductPromises.push(
        this.prisma.orderProduct.create({
          data: {
            orderId: nuevaOrden.id,
            productId: item.productId,
            cantidad: item.cantidad,
          },
        })
      );
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.cantidad } },
      });
    }
    await Promise.all(orderProductPromises);

    // 1.6 Vaciar carrito del usuario si existe
    await this.prisma.itemCarrito.deleteMany({ where: { carrito: { userID } } });

    return nuevaOrden;
  }

  // ─── 2) Listar órdenes de un usuario ───────────────────────────────────────
  async getOrdersByUser(userID: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userID } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.prisma.order.findMany({
      where: { userID },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── 3) Obtener detalle de orden ─────────────────────────────────────────
  async getOrderById(orderId: number) {
    const orden = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, username: true, email: true },
        },
        products: {
          include: {
            product: {
              select: { id: true, name: true, price: true, imageUrl: true },
            },
          },
        },
      },
    });
    if (!orden) {
      throw new NotFoundException('Orden no encontrada');
    }
    return orden;
  }

  // ─── 4) ≪NUEVO≫ Listar **todos** los pedidos (para MiPyme) ─────────────────
  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        user: {
          select: { id: true, username: true },
        },
        products: {
          include: {
            product: {
              select: { id: true, name: true, price: true, imageUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── 5) ≪NUEVO≫ Eliminar un pedido ──────────────────────────────────────────
   async deleteOrder(orderId: number) {
    // 1) Verificar existencia de la orden
    const orden = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { products: true }, // incluimos productos para verificar
    });
    if (!orden) {
      throw new NotFoundException('Orden no encontrada');
    }

    // 2) Primero, eliminar todos los registros en OrderProduct que referencian esta orden
    await this.prisma.orderProduct.deleteMany({
      where: { orderId: orderId },
    });

    // 3) Finalmente, eliminar la orden
    return this.prisma.order.delete({
      where: { id: orderId },
    });
  }
}
