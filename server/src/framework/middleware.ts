import "reflect-metadata";
import { RequestHandler } from "express";

const ROUTE_MIDDLEWARE = Symbol("route_middleware");

export function UseMiddleware(...middlewares: RequestHandler[]): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(
      ROUTE_MIDDLEWARE,
      middlewares,
      target,
      propertyKey as string
    );
  };
}

export function getRouteMiddleware(
  target: any,
  propertyKey: string
): RequestHandler[] {
  return Reflect.getMetadata(ROUTE_MIDDLEWARE, target, propertyKey) || [];
}
