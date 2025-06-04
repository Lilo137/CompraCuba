import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, BadRequestException, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CarritoService } from './carrito.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guards';  // importa tu guard
import { Request } from 'express';

@Controller('carrito')
@ApiTags('Carrito')
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  // Proteger esta ruta: solo usuarios autenticados con JWT pueden agregar productos
  @UseGuards(JwtAuthGuard)
  @Post('agregar')
  @ApiOkResponse({ description: 'Agrega un producto al carrito' })
  async agregar(
    @Req() req: Request,
    @Body() body: { productId: number; cantidad: number },
  ) {
    // El JwtAuthGuard validó el token y adjuntó el usuario en req.user
    const user = req.user as { id: number; username: string; email: string; rolID: number };
    if (!user) throw new BadRequestException('Token inválido o usuario no encontrado');

    const { productId, cantidad } = body;
    if (typeof productId !== 'number' || typeof cantidad !== 'number') {
      throw new BadRequestException('productId y cantidad deben ser números');
    }

    // Ya no pedimos userID en el body: tomamos user.id del JWT
    return this.carritoService.agregarProducto(user.id, productId, cantidad);
  }

  // Proteger esta ruta: solo usuarios con JWT pueden ver su propio resumen
  @UseGuards(JwtAuthGuard)
  @Get('resumen')
  @ApiOkResponse({ description: 'Obtiene el resumen del carrito del usuario autenticado' })
  async verResumen(@Req() req: Request) {
    const user = req.user as { id: number };
    if (!user) throw new BadRequestException('Token inválido o usuario no encontrado');
    return this.carritoService.verResumenCarrito(user.id);
  }
}
