import { Column, Model, Table, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ProductType } from './product-type.model';

@Table
export class Product extends Model {
  @Column
  name: string;

  @Column
  sku: string;

  @ForeignKey(() => ProductType)
  @Column
  productTypeId: number;

  @BelongsTo(() => ProductType)
  productType: ProductType;
}
