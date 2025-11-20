import "reflect-metadata";

export type ParamType = "body" | "param" | "query";

export interface ParamDefinition {
  index: number;
  type: ParamType;
  key?: string;
}

const ROUTE_PARAMS = Symbol("route_params");

function createParamDecorator(
  type: ParamType,
  key?: string
): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const existing: ParamDefinition[] =
      Reflect.getMetadata(
        ROUTE_PARAMS,
        target,
        propertyKey as string
      ) || [];

    existing.push({ index: parameterIndex, type, key });
    Reflect.defineMetadata(
      ROUTE_PARAMS,
      existing,
      target,
      propertyKey as string
    );
  };
}

export function Body(key?: string): ParameterDecorator {
  return createParamDecorator("body", key);
}

export function Param(key?: string): ParameterDecorator {
  return createParamDecorator("param", key);
}

export function Query(key?: string): ParameterDecorator {
  return createParamDecorator("query", key);
}

export function getRouteParams(
  target: any,
  propertyKey: string
): ParamDefinition[] {
  return (
    Reflect.getMetadata(ROUTE_PARAMS, target, propertyKey) || []
  );
}
