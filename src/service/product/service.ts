import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { ProductType } from "src/model/product-type.model";
import { Product } from "src/model/product.model";
import { CreateProductDto } from "./dto";

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product) private productModel: typeof Product,
    @InjectModel(ProductType) private productTypeModel: typeof ProductType,
  ) {}

  async createProduct(dto: CreateProductDto) {
    return this.productModel.create({ 
        name : dto.name,
        sku : dto.sku,
        productTypeId: dto.productTypeId
    });
  }

  async getProduct(){
    return this.productModel.findAll()
  }

  async createProducttype(name : string){
    return this.productTypeModel.create({name : name});
  }

  async getProductTypes() {
    return this.productTypeModel.findAll();
  }
}
