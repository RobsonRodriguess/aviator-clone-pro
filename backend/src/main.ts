import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Habilita o CORS para o Frontend conseguir conectar
  app.enableCors(); 
  await app.listen(3001); // <--- Mudamos aqui!
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();