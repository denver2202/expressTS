
import type { Application, RequestHandler } from "express";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handlerName: string;
}

const CONTROLLER_PREFIX = Symbol("controller_prefix");
const CONTROLLER_ROUTES = Symbol("controller_routes");

// @Controller('auth')
export function Controller(prefix = ""): ClassDecorator {
  return (target) => {
    (target as any)[CONTROLLER_PREFIX] = prefix;
  };
}

// фабрика для @Get, @Post и т.п.
function createMethodDecorator(method: HttpMethod) {
  return function (path = ""): MethodDecorator {
    return (target, propertyKey) => {
      const ctor = target.constructor as any;
      const routes: RouteDefinition[] = ctor[CONTROLLER_ROUTES] ?? [];

      routes.push({
        method,
        path,
        handlerName: propertyKey as string,
      });

      ctor[CONTROLLER_ROUTES] = routes;
    };
  };
}

export const Get = createMethodDecorator("get");
export const Post = createMethodDecorator("post");
export const Put = createMethodDecorator("put");
export const Patch = createMethodDecorator("patch");
export const Delete = createMethodDecorator("delete");

// регистрация контроллеров в express-приложении
export function registerControllers(
  app: Application,
  controllers: any[],
  globalPrefix = "/api"
) {
  for (const ControllerClass of controllers) {
    const instance = new ControllerClass();
    const ctor = ControllerClass as any;

    const prefix: string = normalizePath(ctor[CONTROLLER_PREFIX] ?? "");
    const routes: RouteDefinition[] = ctor[CONTROLLER_ROUTES] ?? [];

    for (const route of routes) {
      const handler: RequestHandler = (instance as any)[route.handlerName].bind(
        instance
      );

      const fullPath = normalizePath(
        [globalPrefix, prefix, route.path].filter(Boolean).join("/")
      );

      // app[method](path, handler)
      (app as any)[route.method](fullPath, handler);
    }
  }
}

function normalizePath(path: string): string {
  if (!path) return "";
  if (!path.startsWith("/")) path = "/" + path;
  if (path !== "/" && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}
