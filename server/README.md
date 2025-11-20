# Mini Nest-подобный фреймворк на Express


## Возможности

- `@Controller()`, `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`
- Параметры: `@Body()`, `@Param()`, `@Query()`
- `@UseMiddleware()`, `@UseGuards()`, `@UsePipes()`, `@UseFilters()`
- `@Injectable()` и DI-контейнер с автоматической инъекцией зависимостей
- Глобальный префикс `'/api'`
- Автоматическая регистрация всех контроллеров
- Реализация поверх чистого Express + TypeScript + `reflect-metadata`

## Установка

```bash
npm install express cors
npm install -D typescript ts-node-dev @types/node @types/express @types/cors
```

## Настройка TypeScript

`tsconfig.json`:

```
{
  "compilerOptions": {
    // Где лежит исходный код и куда компилировать
    "rootDir": "./src",
    "outDir": "./dist",

    // Конфигурация под Node.js
    "module": "commonjs",
    "target": "ES2020",
    "moduleResolution": "node",

    // Строгая типизация
    "strict": true,
    "skipLibCheck": true,

    // Включаем декораторы и метаданные для DI
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,

    // Импорт JSON и source map для дебага
    "resolveJsonModule": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

В `src/main.ts` обязательно добавить:

```ts
import "reflect-metadata";
```

## Скрипты

```json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/main.ts",
  "build": "tsc",
  "start": "node dist/main.js"
}
```

## Структура проекта

```
src/
  main.ts
  app.module.ts
  config/env.ts

  framework/
    http.ts
    params.ts
    middleware.ts
    guards.ts
    pipes.ts
    filters.ts
    di.ts

  controllers/
    auth.controller.ts

  services/
    auth.service.ts
```

## Создание приложения

`src/app.module.ts`:

```ts
import express from "express";
import cors from "cors";
import { registerControllers } from "./framework/http";
import { AuthController } from "./controllers/auth.controller";

export function createApp() {
  // 1. Создаём экземпляр Express
  const app = express();

  // 2. Подключаем глобальные middleware
  app.use(cors());
  app.use(express.json());

  // 3. Регистрируем контроллеры и задаём префикс /api
  registerControllers(app, [AuthController], "/api");

  // 4. Возвращаем готовое приложение (можно тестировать отдельно)
  return app;
}
```

## DI-контейнер

```ts
import { Injectable } from "../framework/di";

@Injectable()
export class AuthService {
  // Публичный метод сервиса — DI создаст singleton по умолчанию
  async register(email: string, password: string) {
    // Здесь может быть обращение к БД, шифрование и т.д.
    return { id: 1, email };
  }
}
```

Инъекция в контроллер:

```ts
export class AuthController {
  // DI подставит AuthService в конструктор
  constructor(private readonly authService: AuthService) {}
}
```

## Контроллеры

```ts
import { Controller, Post } from "../framework/http";
import { Body } from "../framework/params";
import { AuthService } from "../services/auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {} // DI

  @Post("register")
  async register(
    @Body("email") email: string,
    @Body("password") password: string
  ) {
    // Вся бизнес-логика делегируется сервису
    return this.authService.register(email, password);
  }
}
```

Маршрут → `POST /api/auth/register`.

## Декораторы параметров

- `@Body()` / `@Body("email")`
- `@Param("token")`
- `@Query("search")`

## Middleware

```ts
@UseMiddleware((req, res, next) => {
  console.log("middleware!");
  next();
})
@Post("register")
async register() {}
```

## Guards

Если guard вернёт `false`, фреймворк ответит `403 Forbidden`.

```ts
const AuthGuard = async ({ req }) => !!req.headers.authorization; // true → пропускаем

@UseGuards(AuthGuard)
@Post("secret")
async secret() {
  return { ok: true };
}
```

## Pipes

```ts
const TrimPipe = (value) => value.trim();

@UsePipes(TrimPipe)
@Post("register")
async register(@Body("email") email: string) {
  return { email };
}
```

## Exception Filters

```ts
const Filter = (err, { res }) => {
  res.status(400).json({ error: err.message });
};

@UseFilters(Filter)
@Post("register")
async register(@Body("email") email: string) {
  if (!email.includes("@")) throw new Error("Invalid email");
  return { email };
}
```

## Полный пример контроллера

```ts
import { Controller, Post } from "../framework/http";
import { Body, Param } from "../framework/params";
import { UseMiddleware } from "../framework/middleware";
import { UseGuards } from "../framework/guards";
import { UsePipes } from "../framework/pipes";
import { UseFilters } from "../framework/filters";
import { AuthService } from "../services/auth.service";

const AuthGuard = async ({ req }) => !!req.headers.authorization; // запрет анонимам
const TrimPipe = (v) => v.trim(); // нормализация входных данных
const ErrorFilter = (err, { res }) =>
  res.status(400).json({ message: err.message }); // единое сообщение об ошибке

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {} // DI

  @Post("register")
  @UseMiddleware((req, res, next) => {
    console.log("Request body:", req.body); // логика до вызова handler
    next();
  })
  @UseGuards(AuthGuard)
  @UsePipes(TrimPipe)
  @UseFilters(ErrorFilter)
  async register(
    @Body("email") email: string,
    @Body("password") password: string
  ) {
    return this.authService.register(email, password);
  }

  @Post("confirm/:token")
  async confirm(@Param("token") token: string) {
    return { confirmed: true, token }; // пример чтения параметров пути
  }
}
```



## Запуск

Dev:

```bash
npm run dev
```

Prod:

```bash
npm run build
npm start
```

