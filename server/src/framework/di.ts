import "reflect-metadata";

export type Type<T = any> = new (...args: any[]) => T;

const INJECTABLE = Symbol("injectable");

export function Injectable(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(INJECTABLE, true, target);
  };
}

export class Container {
  private singletons = new Map<Type, any>();

  resolve<T>(target: Type<T>): T {
    // если уже создан — вернуть из кэша
    if (this.singletons.has(target)) {
      return this.singletons.get(target);
    }

    const isInjectable = Reflect.getMetadata(INJECTABLE, target);
    if (!isInjectable) {
      // можно убрать это, если хочешь разрешать всё подряд
      throw new Error(
        `Class ${target.name} is not marked as @Injectable()`
      );
    }

    const paramTypes: Type[] =
      Reflect.getMetadata("design:paramtypes", target) || [];

    const deps = paramTypes.map((dep) => this.resolve(dep));
    const instance = new target(...deps);

    this.singletons.set(target, instance);
    return instance;
  }
}

// один глобальный контейнер на всё приложение
export const container = new Container();
