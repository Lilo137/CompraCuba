// src/order/order.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Delete,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('Ordenes')
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ─── POST /order → crear una nueva orden ─────────────────────────────────
  @Post()
  @ApiCreatedResponse({ description: 'Crea una nueva orden' })
  async createOrder(@Body() dto: CreateOrderDto) {
    if (!dto.userID || !Array.isArray(dto.products)) {
      throw new BadRequestException('Estructura inválida para crear orden');
    }
    return this.orderService.createOrder(dto);
  }

  // ─── GET /order → listar TODOS los pedidos ────────────────────────────────
  @Get()
  @ApiOkResponse({ description: 'Obtiene todos los pedidos' })
  async findAll() {
    return this.orderService.getAllOrders();
  }

  // ─── GET /order/user/:userID → listar pedidos de un usuario ───────────────
  @Get('user/:userID')
  @ApiOkResponse({ description: 'Obtiene todas las órdenes de un usuario' })
  async getByUser(@Param('userID', ParseIntPipe) userID: number) {
    return this.orderService.getOrdersByUser(userID);
  }

  // ─── GET /order/:orderId → detalle de una orden ───────────────────────────
  @Get(':orderId')
  @ApiOkResponse({ description: 'Obtiene detalle de una orden por ID' })
  async getById(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.orderService.getOrderById(orderId);
  }

  // ─── DELETE /order/:orderId → elimina un pedido ──────────────────────────
 @Delete(':orderId')
  @ApiOkResponse({ description: 'Elimina una orden existente' })
  async deleteOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.orderService.deleteOrder(orderId);
  }
}
