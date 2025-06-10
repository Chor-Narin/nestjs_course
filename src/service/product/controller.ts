import { Body, Controller, Get, Post } from "@nestjs/common";
import { ProductService } from "./service";
import { CreateProductDto } from "./dto";

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }

  @Get()
  async getProduct() {
    return this.productService.getProduct();
  }

  @Post('types')
  createprducttype(@Body() body: { name: string }) {
    return this.productService.createProducttype(body.name);
  }
  @Get('types')
  getTypes() {
    return this.productService.getProductTypes();
  }
}
