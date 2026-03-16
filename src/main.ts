import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  //swagger---config--//
  const config =new DocumentBuilder().setTitle('Zubi API').setDescription('The core backend API for Zubidu').setVersion('1.0').addBearerAuth().build();
  const document=SwaggerModule.createDocument(app,config);

  SwaggerModule.setup('api/docs',app,document);
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
