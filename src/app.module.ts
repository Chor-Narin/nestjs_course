import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { TaskModule } from './modules/task/task.module';
import { ScheduleModule } from '@nestjs/schedule';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from './model/product.model';
import { ProductType } from './model/product-type.model';
import { ProductModule } from './service/product/module';

@Module({
  imports: [UserModule, TaskModule, ProductModule, 
    // ScheduleModule.forRoot()
    SequelizeModule.forRoot({
      dialect: 'sqlite',
      storage: 'database.sqlite', // Path to SQLite DB file
      autoLoadModels: true,
      synchronize: true, // Use true only in dev
      models: [Product, ProductType]
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
