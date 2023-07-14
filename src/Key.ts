import { INTERNAL } from './constants';

export interface IKeyConsumer<T, HasDefault extends boolean = boolean> {
  readonly name: string;
  readonly [INTERNAL]: {
    hasDefault: HasDefault;
    defaultValue: T | undefined;
    help?: string;
  };
}

export interface IKeyProvider<T, HasDefault extends boolean = boolean> {
  readonly name: string;
  readonly [INTERNAL]: {
    consumer: IKeyConsumer<T, HasDefault>;
    value: T;
  };
}

export type TMaybeParam<T> = [T] extends [undefined] ? [value?: undefined] : [value: T];

export type TKeyProviderFn<T, HasDefault extends boolean> = (...args: TMaybeParam<T>) => IKeyProvider<T, HasDefault>;

// Expose both Provider & Consumer because this way you can expose only one of them
export interface IKey<T, HasDefault extends boolean = boolean> {
  Consumer: IKeyConsumer<T, HasDefault>;
  Provider: TKeyProviderFn<T, HasDefault>;
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
    data: IKeyConsumer<T, HasDefault>[typeof INTERNAL],
  ): IKey<T, HasDefault> {
    const Consumer: IKeyConsumer<T, any> = { name, [INTERNAL]: data };
    const Provider: TKeyProviderFn<T, HasDefault> = (...args) => ({
      name,
      [INTERNAL]: { value: args[0] as any, consumer: Consumer },
    });
    return {
      Consumer,
      Provider,
    };
  }
})();
