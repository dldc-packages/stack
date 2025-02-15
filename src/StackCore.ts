// deno-lint-ignore-file no-explicit-any

import type { TKeyConsumer, TKeyProvider } from "./Key.ts";
import { DEBUG, NODE_INSPECT, PARENT, PROVIDER, RESET } from "./constants.ts";
import { createMissingContextErreur } from "./erreur.ts";
import { indent } from "./indent.ts";

export type TStackCoreTuple = [parent: StackCore, provider: TKeyProvider<any>];

export type TStackCoreValue = StackCore | null;

export class StackCore {
  private readonly [PARENT]!: TStackCoreValue; // Null if root
  private readonly [PROVIDER]!: TKeyProvider<any>;

  protected constructor(
    provider: TKeyProvider<any>,
    parent: TStackCoreValue = null,
  ) {
    Object.defineProperty(this, PARENT, {
      enumerable: false,
      writable: false,
      value: parent,
    });
    Object.defineProperty(this, PROVIDER, {
      enumerable: false,
      writable: false,
      value: provider,
    });
    Object.defineProperty(this, NODE_INSPECT, {
      value: () => this.inspect(),
    });
  }

  public toString(): string {
    return `StackCore { ... }`;
  }

  /**
   * Print a the StackCore with all the providers.
   */
  public inspect(): string {
    const details = StackCore.inspect(this);
    if (details === null) {
      return `StackCore {}`;
    }
    return [`StackCore {`, "  " + indent(details), `}`].join("\n");
  }

  /**
   * READ Functions
   */

  static findFirstMatch(
    stack: TStackCoreValue,
    consumer: TKeyConsumer<any, any>,
  ): { found: boolean; value: any } {
    if (stack === null) {
      return { found: false, value: null };
    }
    const provider = stack[PROVIDER];
    if (provider.consumer === consumer) {
      if (provider.value === RESET) {
        return { found: false, value: null };
      }
      return { found: true, value: provider.value };
    }
    return StackCore.findFirstMatch(stack[PARENT], consumer);
  }

  /**
   * Return true if the stack has a value for the given consumer.
   * If the last value is RESET, it will return false.
   * @param stack
   * @param consumer
   * @returns
   */
  static has(
    stack: TStackCoreValue,
    consumer: TKeyConsumer<any, any>,
  ): boolean {
    return StackCore.findFirstMatch(stack, consumer).found;
  }

  /**
   * Get the value for a given consumer.
   * @param stack
   * @param consumer
   * @returns
   */
  static get<T, HasDefault extends boolean>(
    stack: TStackCoreValue,
    consumer: TKeyConsumer<T, HasDefault>,
  ): HasDefault extends true ? T : T | undefined {
    const res = StackCore.findFirstMatch(stack, consumer);
    if (res.found === false) {
      if (consumer.hasDefault) {
        return consumer.defaultValue as any;
      }
      return undefined as any;
    }
    return res.value;
  }

  /**
   * Return a string that represents the content of the stact or null if empty.
   */
  static inspect(stack: TStackCoreValue): string | null {
    if (stack === null) {
      return null;
    }
    const details: string[] = [];
    for (const [, provider] of StackCore.extract(stack)) {
      details.unshift(
        `${provider.consumer.name}: ${
          provider.value === RESET
            ? "RESET"
            : provider.consumer.stringify(provider.value)
        }`,
      );
    }
    if (details.length === 0) {
      return null;
    }
    const allDetails = details.join(", ");
    if (allDetails.length < 60) {
      return allDetails;
    }
    return details.join("\n");
  }

  /**
   * Get all the values for a given consumer as an iterator.
   * The values are returned in the reverse order they were set (First In Last Out).
   * The iterator will stop when it reaches the end of the stack or when it finds a RESET value.
   */
  static getAll<T>(
    stack: TStackCoreValue,
    consumer: TKeyConsumer<T>,
  ): IterableIterator<T> {
    let current: TStackCoreValue = stack;
    return {
      next(): IteratorResult<T> {
        while (current) {
          const provider = current[PROVIDER];
          current = current[PARENT];
          if (provider.consumer === consumer) {
            if (provider.value === RESET) {
              current = null;
              return { value: undefined, done: true };
            }
            return { value: provider.value, done: false };
          }
        }
        return { value: undefined, done: true };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }

  static getOrFail<T>(stack: TStackCoreValue, consumer: TKeyConsumer<T>): T {
    const res = StackCore.findFirstMatch(stack, consumer);
    if (res.found === false) {
      if (consumer.hasDefault) {
        return consumer.defaultValue as any;
      }
      throw createMissingContextErreur(stack, consumer);
    }
    return res.value;
  }

  static extract(stack: TStackCoreValue): IterableIterator<TStackCoreTuple> {
    let current: TStackCoreValue = stack;
    return {
      next(): IteratorResult<TStackCoreTuple> {
        if (current) {
          const parent = current;
          const provider = current[PROVIDER];
          current = current[PARENT];
          return { value: [parent, provider], done: false };
        }
        return { value: undefined, done: true };
      },
      [Symbol.iterator]() {
        return this;
      },
    };
  }

  /**
   * WRITE Functions
   */

  static with(
    stack: TStackCoreValue,
    ...keys: readonly TKeyProvider<any>[]
  ): TStackCoreValue {
    if (keys.length === 0) {
      return stack;
    }
    return [...keys].reduce((parent, provider) => {
      return new StackCore(provider, parent);
    }, stack);
  }

  /**
   * Merge two StackCore instances into one.
   * [...left, ...right]
   * If left is empty, return right.
   * If right is empty, return left.
   */
  static merge(left: TStackCoreValue, right: TStackCoreValue): TStackCoreValue {
    if (left === null || right === null) {
      return left ?? right ?? null;
    }
    const rightExtracted = Array.from(
      StackCore.extract(right),
      ([, provider]) => provider,
    ).reverse();
    return StackCore.with(left, ...rightExtracted);
  }

  /**
   * Remove duplicated providers from the StackCore.
   */
  static dedupe(stack: TStackCoreValue): TStackCoreValue {
    if (stack === null) {
      return null;
    }
    const seenKeys = new Set<TKeyConsumer<any>>();
    const queue: TKeyProvider<any>[] = [];
    let base: TStackCoreValue = stack;
    let baseQueue: TKeyProvider<any>[] = [];
    for (const [item, provider] of StackCore.extract(stack)) {
      if (seenKeys.has(provider.consumer)) {
        // we will skip this one in the final result so we reset base
        base = item[PARENT];
        queue.push(...baseQueue);
        baseQueue = [];
        continue;
      }
      seenKeys.add(provider.consumer);
      // If the value is RESET, no need to add it to the queue
      if (provider.value !== RESET) {
        baseQueue.push(provider);
      }
    }
    if (base === stack) {
      // no duplicates
      return stack;
    }
    queue.push(...baseQueue);

    return StackCore.with(base, ...queue.reverse());
  }

  static debug(stack: TStackCoreValue): Array<{ value: any; ctxId: string }> {
    const world: any = globalThis;
    const idMap = (world[DEBUG] as WeakMap<any, string>) ||
      (world[DEBUG] = new WeakMap<any, string>());
    const result: Array<{ value: any; ctxName: string; ctxId: string }> = [];
    traverse(stack);
    return result;

    function traverse(stack: TStackCoreValue) {
      if (stack === null) {
        // Root -> stop
        return;
      }
      const provider = stack[PROVIDER];
      const consumer = provider.consumer;
      let ctxId = idMap.get(consumer);
      if (ctxId === undefined) {
        ctxId = Math.random().toString(36).substring(7);
        idMap.set(consumer, ctxId);
      }
      result.push({
        ctxId,
        ctxName: consumer.name,
        value: provider.value,
      });
      traverse(stack[PARENT]);
    }
  }
}
