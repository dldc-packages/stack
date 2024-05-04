import { INTERNAL } from "./constants.ts";

/**
 * A function that stringify a value.
 * This should return a single line that represent the value.
 */
export type TStringify<T> = (value: T) => string;

export interface TKeyConsumer<T, HasDefault extends boolean = boolean> {
  readonly [INTERNAL]: true;
  readonly stringify: TStringify<T>;
  readonly name: string;
  readonly hasDefault: HasDefault;
  readonly defaultValue: T | undefined;
}

export interface TKeyProvider<T, HasDefault extends boolean = boolean> {
  readonly [INTERNAL]: true;
  readonly name: string;
  readonly consumer: TKeyConsumer<T, HasDefault>;
  readonly value: T;
}

export type TArgsBase = readonly unknown[];

export type TKeyProviderFn<
  T,
  HasDefault extends boolean,
  Args extends TArgsBase,
> = (
  ...args: Args
) => TKeyProvider<T, HasDefault>;

// Expose both Provider & Consumer because this way you can expose only one of them
export interface TKeyBase<
  T,
  HasDefault extends boolean,
  Args extends TArgsBase = [T],
> {
  Consumer: TKeyConsumer<T, HasDefault>;
  Provider: TKeyProviderFn<T, HasDefault, Args>;
}

export type TKey<T, HasDefault extends boolean = false> = TKeyBase<
  T,
  HasDefault,
  [value: T]
>;
export type TVoidKey<HasDefault extends boolean = false> = TKeyBase<
  undefined,
  HasDefault,
  []
>;

export function createKey<T>(
  name: string,
  stringify: TStringify<T> = strigifyUnknow,
): TKey<T, false> {
  return createInternal<T, false, [value: T]>(
    name,
    stringify,
    false,
    undefined,
  );
}

export function createKeyWithDefault<T>(
  name: string,
  defaultValue: T,
  stringify: TStringify<T> = strigifyUnknow,
): TKey<T, true> {
  return createInternal<T, true, [value: T]>(
    name,
    stringify,
    true,
    defaultValue,
  );
}

export function createEmptyKey(name: string): TVoidKey<false> {
  return createInternal<undefined, false, []>(
    name,
    strigifyEmpty,
    false,
    undefined,
  );
}

function createInternal<
  T,
  HasDefault extends boolean,
  Args extends TArgsBase,
>(
  name: string,
  stringify: TStringify<T>,
  hasDefault: HasDefault,
  defaultValue: T | undefined,
): TKeyBase<T, HasDefault, Args> {
  const Consumer: TKeyConsumer<T, HasDefault> = {
    [INTERNAL]: true,
    name,
    hasDefault,
    defaultValue,
    stringify,
  };
  const Provider = (value: T) => {
    return { [INTERNAL]: true, name, consumer: Consumer, value };
  };
  return {
    Consumer,
    Provider: Provider as unknown as TKeyProviderFn<T, HasDefault, Args>,
  };
}

function strigifyUnknow(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return `${value}`;
  }
  if (typeof value === "symbol") {
    return `Symbol(${value.description})`;
  }
  try {
    const val = JSON.stringify(value);
    return val.length > 60 ? `${val.slice(0, 60 - 3)}...` : val;
  } catch (_error) {
    return `[NOT SERIALIZABLE]`;
  }
}

function strigifyEmpty() {
  return "[VOID]";
}
