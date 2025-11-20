import "reflect-metadata";
import { Request, Response, NextFunction } from "express";

export interface ExceptionContext {
  req: Request;
  res: Response;
  next: NextFunction;
}

export type ExceptionFilter =
  | ((error: any, ctx: ExceptionContext) => void | Promise<void>);

const ROUTE_FILTERS = Symbol("route_filters");

export function UseFilters(...filters: ExceptionFilter[]): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(
      ROUTE_FILTERS,
      filters,
      target,
      propertyKey as string
    );
  };
}

export function getRouteFilters(
  target: any,
  propertyKey: string
): ExceptionFilter[] {
  return (
    Reflect.getMetadata(ROUTE_FILTERS, target, propertyKey) || []
  );
}
