import "reflect-metadata";
import { createApp } from './app.module';
import { env } from './config/env';

async function bootstrap() {
  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Server is running on http://localhost:${env.PORT}`);
  });
}

bootstrap();
