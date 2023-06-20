import { INTERNAL } from './constants';

export interface KeyConsumer<T, HasDefault extends boolean = boolean> {
  readonly name: string;
  readonly [INTERNAL]: {
    hasDefault: HasDefault;
    defaultValue: T | undefined;
    help?: string;
  };
}

export interface KeyProvider<T, HasDefault extends boolean = boolean> {
  readonly name: string;
  readonly [INTERNAL]: {
    consumer: KeyConsumer<T, HasDefault>;
    value: T;
  };
}

export type MaybeParam<T> = [T] extends [undefined] ? [value?: undefined] : [value: T];

export type KeyProviderFn<T, HasDefault extends boolean> = (...args: MaybeParam<T>) => KeyProvider<T, HasDefault>;

// Expose both Provider & Consumer because this way you can expose only one of them
export interface IKey<T, HasDefault extends boolean = boolean> {
  Consumer: KeyConsumer<T, HasDefault>;
  Provider: KeyProviderFn<T, HasDefault>;
}

export const Key = (() => {
  return {
    create,
    createWithDefault,
    createEmpty,
  };

  function create<T>(name: string, help?: string): IKey<T, false> {
    return createInternal<T, false>(name, { hasDefault: false, defaultValue: undefined, help });
  }

  function createWithDefault<T>(name: string, defaultValue: T, help?: string): IKey<T, true> {
    return createInternal<T, true>(name, { hasDefault: true, defaultValue, help });
  }

  function createEmpty(name: string, help?: string): IKey<undefined, false> {
    return createInternal<undefined, false>(name, { hasDefault: false, defaultValue: undefined, help });
  }

  function createInternal<T, HasDefault extends boolean>(
    name: string,
    data: KeyConsumer<T, HasDefault>[typeof INTERNAL]
  ): IKey<T, HasDefault> {
    const Consumer: KeyConsumer<T, any> = { name, [INTERNAL]: data };
    const Provider: KeyProviderFn<T, HasDefault> = (...args) => ({
      name,
      [INTERNAL]: { value: args[0] as any, consumer: Consumer },
    });
    return {
      Consumer,
      Provider,
    };
  }
})();
