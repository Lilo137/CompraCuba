// src/product/product.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { ProductEntity } from './entity/product.entity';
import {
  ApiOkResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('products')
@ApiTags('Productos')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ─── LISTAR TODOS (con imágenes + precios) ─────────────────────────────
  @Get()
  @ApiOkResponse({ type: ProductEntity, isArray: true })
  async findAll() {
    const products = await this.productService.findAll();
    return products.map((p) => new ProductEntity(p));
  }

  // ─── CREAR PRODUCTO (multipart/form-data + archivos) ────────────────────
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(['MIPYME'])
  @UseInterceptors(
    FilesInterceptor('imagenes', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const name = file.originalname
            .toLowerCase()
            .replace(/[\s_]+/g, '-')
            .replace(/[^a-z0-9\-\.]/g, '')
            .replace(/\.{2,}/g, '.')
            .split('.')[0];
          const fileExt = extname(file.originalname);
          cb(null, `${name}-${Date.now()}${fileExt}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(new BadRequestException('Solo se permiten imágenes JPG/PNG/GIF'), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        categoria: { type: 'string' },
        precioGeneral: { type: 'number', format: 'float' },
        stock: { type: 'number', format: 'int32' },
        preciosPorProvincia: {
          type: 'string',
          description: 'JSON.stringify del array de preciosPorProvincia',
          example: '[{ "provincia": "La Habana", "precio": 10.5 }]',
        },
        // “imagenes” vendrá como array de archivos bajo ese campo
      },
    },
  })
  async createProduct(
    @Req() req: any,
    @UploadedFiles() archivos: Array<Express.Multer.File>,
    @Body() body: any,
  ) {
    const userId = req.user.id;

    // Convertir valores numéricos
    const { name, description, categoria } = body;
    const precioGeneral = parseFloat(body.precioGeneral);
    const stock = parseInt(body.stock, 10);
    if (isNaN(precioGeneral) || isNaN(stock)) {
      throw new BadRequestException(
        'precioGeneral y stock deben ser números válidos',
      );
    }

    // Parsear preciosPorProvincia (puede venir como string JSON)
    let preciosPorProvincia: Array<{ provincia: string; precio: number }> = [];
    try {
      preciosPorProvincia = Array.isArray(body.preciosPorProvincia)
        ? body.preciosPorProvincia
        : JSON.parse(body.preciosPorProvincia);
      if (!Array.isArray(preciosPorProvincia)) throw new Error();
    } catch {
      throw new BadRequestException(
        'preciosPorProvincia debe ser un array JSON válido',
      );
    }

    const dto: CreateProductDto = {
      name: name?.toString() || '',
      description: description?.toString() || '',
      categoria: categoria?.toString() || '',
      precioGeneral,
      stock,
      preciosPorProvincia: preciosPorProvincia.map((pp) => ({
        provincia: pp.provincia,
        precio: pp.precio,
      })),
    };

    return this.productService.createProduct(dto, archivos, userId);
  }

  // ─── LISTAR MIS PRODUCTOS ───────────────────────────────────────────────
  @Get('my-products')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(['MIPYME'])
  async getMyProducts(@Req() req: any) {
    return this.productService.getProductsByUser(req.user.id);
  }

  // ─── ACTUALIZAR STOCK ────────────────────────────────────────────────────
  @Patch(':id/stock')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(['MIPYME'])
  async updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
    @Req() req: any,
  ) {
    return this.productService.updateStock(
      parseInt(id, 10),
      updateStockDto.stock,
      req.user.id,
    );
  }

  // ─── ELIMINAR PRODUCTO ──────────────────────────────────────────────────
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(['MIPYME'])
  async deleteProduct(@Param('id') id: string, @Req() req: any) {
    return this.productService.deleteProduct(
      parseInt(id, 10),
      req.user.id,
    );
  }

  // ─── AGREGA IMÁGENES A UN PRODUCTO EXISTENTE ────────────────────────────
  @Post(':id/images')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(['MIPYME'])
  @UseInterceptors(
    FilesInterceptor('imagenes', 5, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const name = file.originalname
            .toLowerCase()
            .replace(/[\s_]+/g, '-')
            .replace(/[^a-z0-9\-\.]/g, '')
            .replace(/\.{2,}/g, '.')
            .split('.')[0];
          const fileExt = extname(file.originalname);
          cb(null, `${name}-${Date.now()}${fileExt}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          cb(new BadRequestException('Solo se permiten imágenes JPG/PNG/GIF'), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', type: 'number' })
  async addImagesToProduct(
    @Param('id') id: string,
    @UploadedFiles() archivos: Array<Express.Multer.File>,
    @Req() req: any,
  ) {
    const productId = parseInt(id, 10);
    return this.productService.addImagesToProduct(productId, archivos, req.user.id);
  }

  // ─── ELIMINAR UNA IMAGEN DE UN PRODUCTO ─────────────────────────────────
  @Delete(':id/images/:imageId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(['MIPYME'])
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'imageId', type: 'number' })
  async deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @Req() req: any,
  ) {
    return this.productService.deleteImage(
      parseInt(id, 10),
      parseInt(imageId, 10),
      req.user.id,
    );
  }
}
