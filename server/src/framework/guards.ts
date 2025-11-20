import "reflect-metadata";
import { Request, Response, NextFunction } from "express";

export interface ExecutionContext {
  req: Request;
  res: Response;
}

export type CanActivate =
  | ((ctx: ExecutionContext) => boolean | Promise<boolean>);

const ROUTE_GUARDS = Symbol("route_guards");

export function UseGuards(...guards: CanActivate[]): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(
      ROUTE_GUARDS,
      guards,
      target,
      propertyKey as string
    );
  };
}

export function getRouteGuards(
  target: any,
  propertyKey: string
): CanActivate[] {
  return (
    Reflect.getMetadata(ROUTE_GUARDS, target, propertyKey) || []
  );
}
