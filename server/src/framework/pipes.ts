import "reflect-metadata";
import { ParamType } from "./params";

export interface PipeMetadata {
  type: ParamType;
  key?: string;
}

export type PipeTransform =
  | ((value: any, meta: PipeMetadata) => any | Promise<any>);

const ROUTE_PIPES = Symbol("route_pipes");

export function UsePipes(...pipes: PipeTransform[]): MethodDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata(
      ROUTE_PIPES,
      pipes,
      target,
      propertyKey as string
    );
  };
}

export function getRoutePipes(
  target: any,
  propertyKey: string
): PipeTransform[] {
  return (
    Reflect.getMetadata(ROUTE_PIPES, target, propertyKey) || []
  );
}
