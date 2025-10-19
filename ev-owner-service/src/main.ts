import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // 1️⃣ Tạo app NestJS
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, // auto convert types (e.g., "123" -> 123)
    }),
  );

  app.enableCors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 2️⃣ Cấu hình Swagger
  const config = new DocumentBuilder()
    .setTitle('EV Owner API')
    .setDescription('API for EV Owner microservice')
    .setVersion('1.0')
    .addBearerAuth(
      {
        // Thêm hỗ trợ JWT Bearer Authentication
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  // 3️⃣ Tạo và hiển thị tài liệu Swagger
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 4️⃣ Khởi động server
  await app.listen(3000);
  console.log(`🚀 EV Owner API is running on: http://localhost:3000`);
  console.log(`📘 Swagger Docs: http://localhost:3000/api/docs`);
}
bootstrap();
