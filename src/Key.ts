import { INTERNAL, RESET } from "./constants.ts";

/**
 * A function that stringify a value.
 * This should return a single line that represent the value.
 */
export type TStringify<T> = (value: T) => string;

/**
 * The object used to read a value from the stack.
 *
 * ```ts
 * stack.get(MyKey.Consumer)
 * ```
 */
export interface TKeyConsumer<T, HasDefault extends boolean = boolean> {
  readonly [INTERNAL]: true;
  readonly stringify: TStringify<T>;
  readonly name: string;
  readonly hasDefault: HasDefault;
  readonly defaultValue: T | undefined;
}

/**
 * An object that can be used to set a value in the stack.
 * Use `MyKey.Provider(value)` to create it.
 *
 * ```ts
 * stack.with(MyKey.Provider(value))
 * ```
 */
export interface TKeyProvider<T, HasDefault extends boolean = boolean> {
  readonly [INTERNAL]: true;
  readonly name: string;
  readonly consumer: TKeyConsumer<T, HasDefault>;
  readonly value: T;
}

export type TArgsBase = readonly unknown[];

/**
 * A function that create a TKeyProvider.
 */
export type TKeyProviderFn<
  T,
  HasDefault extends boolean,
  Args extends TArgsBase
> = (...args: Args) => TKeyProvider<T, HasDefault>;

/**
 * Result of `createKey`, `createKeyWithDefault` and `createEmptyKey`.
 *
 * ```ts
 * const MyKey = createKey<number>('num');
 * ```
 */
export interface TKeyBase<
  T,
  HasDefault extends boolean,
  Args extends TArgsBase = [T]
> {
  Consumer: TKeyConsumer<T, HasDefault>;
  Provider: TKeyProviderFn<T, HasDefault, Args>;
  Reset: TKeyProvider<T, HasDefault>;
}

/**
 * Type of a key created with `createKey`.
 */
export type TKey<T, HasDefault extends boolean = false> = TKeyBase<
  T,
  HasDefault,
  [value: T]
>;

/**
 * Type of a key created with `createEmptyKey`.
 */
export type TVoidKey<HasDefault extends boolean = false> = TKeyBase<
  undefined,
  HasDefault,
  []
>;

/**
 * Create a key for a Stack
 *
 * ```ts
 * const MyKey = createKey<number>('num');
 * const MyKeyStringified = createKey<number>('str', (value) => value.toFixed(2));
 * ```
 *
 * @param name The name of the key, used when inspecting the stack.
 * @param stringify An optional function that convert the value to a string when inspecting the stack.
 * @returns {TKey} A key object.
 */
export function createKey<T>(
  name: string,
  stringify: TStringify<T> = strigifyUnknow
): TKey<T, false> {
  return createInternal<T, false, [value: T]>(
    name,
    stringify,
    false,
    undefined
  );
}

/**
 * Create a key for a Stack with a default value.
 *
 * ```ts
 * const MyKey = createKeyWithDefault<number>('num', 42);
 * ```
 *
 * @param name The name of the key, used when inspecting the stack.
 * @param defaultValue The default value of the key, this value will be used if the key is not set in the stack when calling `get`.
 * @param stringify An optional function that convert the value to a string when inspecting the stack.
 * @returns A key object with a default value.
 */
export function createKeyWithDefault<T>(
  name: string,
  defaultValue: T,
  stringify: TStringify<T> = strigifyUnknow
): TKey<T, true> {
  return createInternal<T, true, [value: T]>(
    name,
    stringify,
    true,
    defaultValue
  );
}

/**
 * Create a key for a Stack with no value.
 * With suck key, `get` will always return `undefined`. You should use `has` to check if the key is set.
 *
 * @param name The name of the key, used when inspecting the stack.
 * @returns A key object with no value.
 */
export function createEmptyKey(name: string): TVoidKey<false> {
  return createInternal<undefined, false, []>(
    name,
    strigifyEmpty,
    false,
    undefined
  );
}

function createInternal<T, HasDefault extends boolean, Args extends TArgsBase>(
  name: string,
  stringify: TStringify<T>,
  hasDefault: HasDefault,
  defaultValue: T | undefined
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
    Reset: Provider(RESET as T) as TKeyProvider<T, HasDefault>,
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
