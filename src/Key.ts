import { INTERNAL } from './constants';

export interface IKeyConsumer<T, HasDefault extends boolean = boolean> {
  readonly [INTERNAL]: true;
  readonly name: string;
  readonly hasDefault: HasDefault;
  readonly defaultValue: T | undefined;
}

export interface IKeyProvider<T, HasDefault extends boolean = boolean> {
  readonly [INTERNAL]: true;
  readonly name: string;
  readonly consumer: IKeyConsumer<T, HasDefault>;
  readonly value: T;
}

export type TArgsBase = readonly any[];

export type TKeyProviderFn<T, HasDefault extends boolean, Args extends TArgsBase> = (
  ...args: Args
) => IKeyProvider<T, HasDefault>;

// Expose both Provider & Consumer because this way you can expose only one of them
export interface IKey<T, HasDefault extends boolean = boolean, Args extends TArgsBase = [T]> {
  Consumer: IKeyConsumer<T, HasDefault>;
  Provider: TKeyProviderFn<T, HasDefault, Args>;
}

export const Key = (() => {
  return {
    create,
    createWithDefault,
    createEmpty,
  };

  function create<T>(name: string): IKey<T, false, [value: T]> {
    return createInternal<T, false, [value: T]>(name, false, undefined);
  }

  function createWithDefault<T>(name: string, defaultValue: T): IKey<T, true, [value: T]> {
    return createInternal<T, true, [value: T]>(name, true, defaultValue);
  }

  function createEmpty(name: string): IKey<undefined, false, []> {
    return createInternal<undefined, false, []>(name, false, undefined);
  }

  function createInternal<T, HasDefault extends boolean, Args extends TArgsBase>(
    name: string,
    hasDefault: HasDefault,
    defaultValue: T | undefined,
  ): IKey<T, HasDefault, Args> {
    const Consumer: IKeyConsumer<T, any> = { [INTERNAL]: true, name, hasDefault, defaultValue };
    const Provider = (value: T) => {
      return { [INTERNAL]: true, name, consumer: Consumer, value };
    };
    return {
      Consumer,
      Provider: Provider as unknown as TKeyProviderFn<T, HasDefault, Args>,
    };
  }
})();
