import { Module } from '@nestjs/common';
import { CarritoController } from './carrito.controller';
import { CarritoService } from './carrito.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [CarritoController],
  providers: [CarritoService],
  imports: [PrismaModule],
})
export class CarritoModule {}
