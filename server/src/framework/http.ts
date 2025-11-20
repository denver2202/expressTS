import type {
  Application,
  Request,
  Response,
  NextFunction,
} from "express";
import "reflect-metadata";

import { getRouteParams } from "./params";
import { getRouteMiddleware } from "./middleware";
import { getRouteGuards } from "./guards";
import { getRoutePipes } from "./pipes";
import { getRouteFilters } from "./filters";
import { container } from "./di";
import type { PipeMetadata } from "./pipes";
import type { ParamDefinition } from "./params";
import type { ExecutionContext } from "./guards";

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

interface RouteDef {
  method: HttpMethod;
  path: string;
  handlerName: string;
}

const PREFIX = Symbol("controller_prefix");
const ROUTES = Symbol("controller_routes");

export function Controller(prefix = ""): ClassDecorator {
  return (target) => {
    (target as any)[PREFIX] = prefix;
  };
}

function methodFactory(method: HttpMethod) {
  return (path = ""): MethodDecorator =>
    (target, propertyKey) => {
      const ctor = target.constructor as any;
      const routes: RouteDef[] = ctor[ROUTES] || [];

      routes.push({
        method,
        path,
        handlerName: propertyKey as string,
      });

      ctor[ROUTES] = routes;
    };
}

export const Get = methodFactory("get");
export const Post = methodFactory("post");
export const Put = methodFactory("put");
export const Patch = methodFactory("patch");
export const Delete = methodFactory("delete");

export function registerControllers(
  app: Application,
  controllers: any[],
  globalPrefix = "/api"
) {
  for (const Ctor of controllers) {
    // контроллер создаётся через DI-контейнер
    const instance = container.resolve(Ctor);
    const prefix = normalizePath((Ctor as any)[PREFIX] || "");
    const routes: RouteDef[] = (Ctor as any)[ROUTES] || [];

    for (const route of routes) {
      const fullPath = normalizePath(
        `${globalPrefix}${prefix}${route.path}`
      );

      const paramDefs = getRouteParams(instance, route.handlerName);
      const middlewares = getRouteMiddleware(instance, route.handlerName);
      const guards = getRouteGuards(instance, route.handlerName);
      const pipes = getRoutePipes(instance, route.handlerName);
      const filters = getRouteFilters(instance, route.handlerName);

      const handler = async (
        req: Request,
        res: Response,
        next: NextFunction
      ) => {
        const ctx: ExecutionContext = { req, res };

        try {
          // 1) guards
          for (const guard of guards) {
            const ok = await guard(ctx);
            if (!ok) {
              return res.status(403).json({
                status: "forbidden",
              });
            }
          }

          // 2) параметры
          const args = await buildArgs(
            paramDefs,
            pipes,
            req
          );

          // 3) вызываем метод контроллера
          const fn = (instance as any)[route.handlerName].bind(
            instance
          );
          const result = await fn(...args, req, res, next);

          // если метод вернул что-то сам, можно по желанию
          // автоматически отправлять JSON, но я оставляю
          // поведение "как напишешь, так и будет"
          if (
            result !== undefined &&
            !res.headersSent
          ) {
            res.json(result);
          }
        } catch (err) {
          if (filters.length) {
            for (const filter of filters) {
              await filter(err, { req, res, next });
              if (res.headersSent) return;
            }
          } else {
            next(err);
          }
        }
      };

      (app as any)[route.method](fullPath, ...middlewares, handler);
    }
  }
}

async function buildArgs(
  paramDefs: ParamDefinition[],
  pipes: any[],
  req: Request
) {
  const sorted = paramDefs.sort((a, b) => a.index - b.index);

  const args = [];
  for (const def of sorted) {
    let value: any;

    switch (def.type) {
      case "body":
        value = def.key ? (req.body?.[def.key] as any) : req.body;
        break;
      case "query":
        value = def.key
          ? (req.query?.[def.key] as any)
          : req.query;
        break;
      case "param":
        value = def.key
          ? (req.params?.[def.key] as any)
          : req.params;
        break;
      default:
        value = undefined;
    }

    const meta: PipeMetadata = {
      type: def.type,
      key: def.key,
    };

    for (const pipe of pipes) {
      value = await pipe(value, meta);
    }

    args.push(value);
  }

  return args;
}

function normalizePath(path: string) {
  if (!path) return "";
  if (!path.startsWith("/")) path = "/" + path;
  return path.endsWith("/") ? path.slice(0, -1) : path;
}
