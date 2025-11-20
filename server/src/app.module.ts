import express, { Application } from 'express';
import cors from 'cors';

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  return app;
}
