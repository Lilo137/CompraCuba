import { Controller, Post, Get, Body, Req, UseGuards, Patch, Param, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Controller('products') 
export class ProductController {
  constructor(private readonly productService: ProductService) {} 

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(['MIPYME']) 
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @Req() req
  ) {
    return this.productService.createProduct({
      ...createProductDto,
      publicadoPor: req.user.id,
    });
  }

  @Get('my-products')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(['MIPYME']) 
  async getMyProducts(@Req() req) {
    return this.productService.getProductsByUser(req.user.id);
  }

  @Patch(':id/stock')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(['MIPYME']) 
  async updateStock(
    @Param('id') id: string, 
    @Body() updateStockDto: UpdateStockDto,
    @Req() req
  ) {
    return this.productService.updateStock(
      parseInt(id),
      updateStockDto.stock,
      req.user.id
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(['MIPYME']) 
  async deleteProduct(
    @Param('id') id: string,
    @Req() req
  ) {
    return this.productService.deleteProduct(
      parseInt(id),
      req.user.id
    );
  }
}