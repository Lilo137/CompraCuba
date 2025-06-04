import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { CarritoModule } from './carrito/carrito.module';
import { OrderModule } from './order/order.module';


@Module({
  imports: [PrismaModule, UsersModule, RolesModule, AuthModule, ProductModule, CarritoModule,OrderModule],
  controllers: [AppController],
  providers: [AppService],
  
    
  
  
})
export class AppModule {}


  

