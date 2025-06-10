import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Product } from './product.model';

@Table
export class ProductType extends Model {
  @Column
  name: string;

  @HasMany(() => Product)
  products: Product[];
}
