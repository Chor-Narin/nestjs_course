import { Module } from "@nestjs/common";
import { ProductService } from "./service";
import { ProductController } from "./controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { Product } from "src/model/product.model";
import { ProductType } from "src/model/product-type.model";


@Module({
    imports: [
    SequelizeModule.forFeature([Product, ProductType]) // Register models
  ],
    providers: [ProductService],
    controllers: [ProductController]
})
export class ProductModule{}